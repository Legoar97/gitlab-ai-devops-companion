import { gql } from '@apollo/client';
import client from './apollo-client';

const GET_AUTH_URL = gql`
  query GetAuthUrl {
    getAuthUrl
  }
`;

const AUTHENTICATE = gql`
  mutation Authenticate($code: String!) {
    authenticate(code: $code) {
      token
      user {
        id
        username
        email
        name
        avatarUrl
      }
    }
  }
`;

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getCurrentUser {
      id
      username
      email
      name
      avatarUrl
    }
  }
`;

const GET_USER_PROJECTS = gql`
  query GetUserProjects($page: Int, $perPage: Int) {
    getUserProjects(page: $page, perPage: $perPage) {
      projects {
        id
        name
        path
        webUrl
        defaultBranch
        description
        avatarUrl
        lastActivityAt
      }
      pageInfo {
        totalPages
        totalCount
        currentPage
        perPage
      }
    }
  }
`;

export class AuthService {
  private static TOKEN_KEY = 'gitlab_ai_token';

  static async getAuthUrl(): Promise<string> {
    const { data } = await client.query({
      query: GET_AUTH_URL,
    });
    return data.getAuthUrl;
  }

  static async authenticate(code: string): Promise<{ token: string; user: any }> {
    const { data } = await client.mutate({
      mutation: AUTHENTICATE,
      variables: { code },
    });
    
    // Store token in localStorage
    this.setToken(data.authenticate.token);
    
    return data.authenticate;
  }

  static async getCurrentUser(): Promise<any> {
    const { data } = await client.query({
      query: GET_CURRENT_USER,
      context: {
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      },
    });
    return data.getCurrentUser;
  }

  static async getUserProjects(page: number = 1, perPage: number = 20): Promise<any> {
    const { data } = await client.query({
      query: GET_USER_PROJECTS,
      variables: { page, perPage },
      context: {
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      },
    });
    return data.getUserProjects;
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static logout(): void {
    this.removeToken();
    window.location.href = '/';
  }
}