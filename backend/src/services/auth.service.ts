import axios from 'axios';
import jwt from 'jsonwebtoken';

interface GitLabUser {
  id: number;
  username: string;
  email: string;
  name: string;
  avatar_url: string;
  web_url: string;
  is_admin: boolean;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  created_at: number;
}

export class AuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private gitlabUrl: string;
  private jwtSecret: string;

  constructor() {
    this.clientId = process.env.GITLAB_CLIENT_ID || '';
    this.clientSecret = process.env.GITLAB_CLIENT_SECRET || '';
    this.redirectUri = process.env.GITLAB_REDIRECT_URI || 'http://localhost:3000/auth/callback';
    this.gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com';
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  }

  // Generate OAuth authorization URL
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'api read_user read_repository write_repository',
    });

    return `${this.gitlabUrl}/oauth/authorize?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    try {
      const response = await axios.post(`${this.gitlabUrl}/oauth/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error exchanging code for token:', error.response?.data);
      throw new Error('Failed to exchange code for token');
    }
  }

  // Get GitLab user info
  async getGitLabUser(accessToken: string): Promise<GitLabUser> {
    try {
      const response = await axios.get(`${this.gitlabUrl}/api/v4/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting GitLab user:', error.response?.data);
      throw new Error('Failed to get user information');
    }
  }

  // Generate JWT token for our app
  generateJWT(user: GitLabUser, gitlabToken: string): string {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      gitlab_token: gitlabToken, // Store encrypted in production
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });
  }

  // Verify JWT token
  verifyJWT(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Get user projects
  async getUserProjects(accessToken: string, page: number = 1, perPage: number = 20) {
    try {
      const response = await axios.get(`${this.gitlabUrl}/api/v4/projects`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params: {
          membership: true,
          simple: true,
          per_page: perPage,
          page,
          order_by: 'last_activity_at',
          sort: 'desc',
        },
      });

      return {
        projects: response.data,
        totalPages: parseInt(response.headers['x-total-pages'] || '1'),
        totalCount: parseInt(response.headers['x-total'] || '0'),
      };
    } catch (error: any) {
      console.error('Error getting user projects:', error.response?.data);
      throw new Error('Failed to get user projects');
    }
  }
}