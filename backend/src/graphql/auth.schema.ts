import { gql } from 'graphql-tag';

export const authTypeDefs = gql`
  type User {
    id: String!
    username: String!
    email: String!
    name: String!
    avatarUrl: String
  }

  type AuthResponse {
    token: String!
    user: User!
  }

  type ProjectInfo {
    id: String!
    name: String!
    path: String!
    webUrl: String!
    defaultBranch: String!
    description: String
    avatarUrl: String
    lastActivityAt: String
  }

  type PageInfo {
    totalPages: Int!
    totalCount: Int!
    currentPage: Int!
    perPage: Int!
  }

  type ProjectsResponse {
    projects: [ProjectInfo!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    getAuthUrl: String!
    getCurrentUser: User
    getUserProjects(page: Int, perPage: Int): ProjectsResponse!
  }

  extend type Mutation {
    authenticate(code: String!): AuthResponse!
    logout: Boolean!
  }
`;