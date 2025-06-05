export const authResolvers = {
  Query: {
    getAuthUrl: (_: any, args: any, context: any) => {
      return context.auth.getAuthorizationUrl();
    },

    getCurrentUser: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      return {
        id: context.user.id,
        username: context.user.username,
        email: context.user.email,
        name: context.user.name,
        avatarUrl: context.user.avatar_url,
      };
    },

    getUserProjects: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const { page = 1, perPage = 20 } = args;
      const result = await context.auth.getUserProjects(
        context.user.gitlab_token,
        page,
        perPage
      );

      return {
        projects: result.projects.map((p: any) => ({
          id: p.id.toString(),
          name: p.name,
          path: p.path_with_namespace,
          webUrl: p.web_url,
          defaultBranch: p.default_branch || 'main',
          description: p.description,
          avatarUrl: p.avatar_url,
          lastActivityAt: p.last_activity_at,
        })),
        pageInfo: {
          totalPages: result.totalPages,
          totalCount: result.totalCount,
          currentPage: page,
          perPage,
        },
      };
    },
  },

  Mutation: {
    authenticate: async (_: any, args: any, context: any) => {
      const { code } = args;

      try {
        // Exchange code for token
        const tokenResponse = await context.auth.exchangeCodeForToken(code);
        
        // Get user info
        const gitlabUser = await context.auth.getGitLabUser(tokenResponse.access_token);
        
        // Generate JWT
        const jwt = context.auth.generateJWT(gitlabUser, tokenResponse.access_token);

        return {
          token: jwt,
          user: {
            id: gitlabUser.id.toString(),
            username: gitlabUser.username,
            email: gitlabUser.email,
            name: gitlabUser.name,
            avatarUrl: gitlabUser.avatar_url,
          },
        };
      } catch (error: any) {
        console.error('Authentication error:', error);
        throw new Error('Authentication failed');
      }
    },

    logout: (_: any, args: any, context: any) => {
      // In a real app, you might want to invalidate the token
      return true;
    },
  },
};