import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { CommandResponse, Pipeline } from '../types';

const client = new ApolloClient({
  uri: process.env.REACT_APP_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
  cache: new InMemoryCache(),
});

export const PROCESS_COMMAND = gql`
  mutation ProcessCommand($command: String!, $context: String) {
    processCommand(command: $command, context: $context) {
      intent
      action
      message
      data
      executed
    }
  }
`;

export const GET_PIPELINE_STATUS = gql`
  query GetPipelineStatus($projectPath: String!) {
    getPipelineStatus(projectPath: $projectPath) {
      status
      message
      pipeline {
        id
        iid
        status
        webUrl
        ref
        createdAt
        duration
        finishedAt
      }
    }
  }
`;

export const GET_PROJECT_PIPELINES = gql`
  query GetProjectPipelines($projectPath: String!) {
    getProjectPipelines(projectPath: $projectPath) {
      id
      name
      webUrl
      pipelines {
        nodes {
          id
          iid
          status
          duration
          createdAt
          finishedAt
          webUrl
        }
      }
    }
  }
`;

class APIService {
  async processCommand(command: string, projectContext?: string): Promise<CommandResponse> {
    try {
      const { data } = await client.mutate({
        mutation: PROCESS_COMMAND,
        variables: {
          command,
          context: projectContext,
        },
      });
      
      return data.processCommand;
    } catch (error) {
      console.error('Error processing command:', error);
      throw error;
    }
  }

  async getPipelineStatus(projectPath: string): Promise<Pipeline | null> {
    try {
      const { data } = await client.query({
        query: GET_PIPELINE_STATUS,
        variables: { projectPath },
        fetchPolicy: 'network-only',
      });
      
      return data.getPipelineStatus.pipeline;
    } catch (error) {
      console.error('Error getting pipeline status:', error);
      throw error;
    }
  }

  async getProjectPipelines(projectPath: string): Promise<Pipeline[]> {
    try {
      const { data } = await client.query({
        query: GET_PROJECT_PIPELINES,
        variables: { projectPath },
        fetchPolicy: 'network-only',
      });
      
      return data.getProjectPipelines.pipelines.nodes;
    } catch (error) {
      console.error('Error getting project pipelines:', error);
      throw error;
    }
  }
}

const apiService = new APIService();
export default apiService;