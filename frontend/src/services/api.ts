// frontend/src/services/api.ts
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

// New Analytics Queries
export const GET_PIPELINE_METRICS = gql`
  query GetPipelineMetrics($projectPath: String!, $timeRange: String) {
    getPipelineMetrics(projectPath: $projectPath, timeRange: $timeRange) {
      totalRuns
      successfulRuns
      failedRuns
      successRate
      avgDuration
      successRateTrend
      targetDuration
      monthlyCost
      projectedCost
      activePipelines
      queuedPipelines
      statusDistribution {
        name
        value
      }
    }
  }
`;

export const GET_PIPELINE_TRENDS = gql`
  query GetPipelineTrends($projectPath: String!, $days: Int) {
    getPipelineTrends(projectPath: $projectPath, days: $days) {
      date
      successRate
      avgDuration
      totalRuns
      cost
    }
  }
`;

export const GET_COST_ANALYSIS = gql`
  query GetCostAnalysis($projectPath: String!, $timeRange: String) {
    getCostAnalysis(projectPath: $projectPath, timeRange: $timeRange) {
      date
      pipelineCount
      totalHours
      totalCost
      avgCostPerPipeline
      wastedCost
    }
  }
`;

export const GET_OPTIMAL_DEPLOYMENT_WINDOWS = gql`
  query GetOptimalDeploymentWindows($projectPath: String!) {
    getOptimalDeploymentWindows(projectPath: $projectPath) {
      hourOfDay
      dayOfWeek
      timeCategory
      deployments
      avgDuration
      successRate
      avgCost
    }
  }
`;

export const GET_ANOMALIES = gql`
  query GetAnomalies($projectPath: String!) {
    getAnomalies(projectPath: $projectPath) {
      type
      week
      change
      message
      severity
    }
  }
`;

export const GET_CURRENT_PREDICTIONS = gql`
  query GetCurrentPredictions($projectPath: String!) {
    getCurrentPredictions(projectPath: $projectPath) {
      nextOptimalDeployment
      currentRiskLevel
      riskFactors {
        factor
        value
      }
      suggestions
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

  // New Analytics Methods
  async getPipelineMetrics(projectPath: string, timeRange?: string) {
    try {
      const { data } = await client.query({
        query: GET_PIPELINE_METRICS,
        variables: { projectPath, timeRange },
        fetchPolicy: 'network-only',
      });
      
      return data.getPipelineMetrics;
    } catch (error) {
      console.error('Error getting pipeline metrics:', error);
      throw error;
    }
  }

  async getPipelineTrends(projectPath: string, days?: number) {
    try {
      const { data } = await client.query({
        query: GET_PIPELINE_TRENDS,
        variables: { projectPath, days },
        fetchPolicy: 'network-only',
      });
      
      return data.getPipelineTrends;
    } catch (error) {
      console.error('Error getting pipeline trends:', error);
      throw error;
    }
  }

  async getCostAnalysis(projectPath: string, timeRange?: string) {
    try {
      const { data } = await client.query({
        query: GET_COST_ANALYSIS,
        variables: { projectPath, timeRange },
        fetchPolicy: 'network-only',
      });
      
      return data.getCostAnalysis;
    } catch (error) {
      console.error('Error getting cost analysis:', error);
      throw error;
    }
  }

  async getOptimalDeploymentWindows(projectPath: string) {
    try {
      const { data } = await client.query({
        query: GET_OPTIMAL_DEPLOYMENT_WINDOWS,
        variables: { projectPath },
        fetchPolicy: 'network-only',
      });
      
      return data.getOptimalDeploymentWindows;
    } catch (error) {
      console.error('Error getting deployment windows:', error);
      throw error;
    }
  }

  async getAnomalies(projectPath: string) {
    try {
      const { data } = await client.query({
        query: GET_ANOMALIES,
        variables: { projectPath },
        fetchPolicy: 'network-only',
      });
      
      return data.getAnomalies;
    } catch (error) {
      console.error('Error getting anomalies:', error);
      throw error;
    }
  }

  async getCurrentPredictions(projectPath: string) {
    try {
      const { data } = await client.query({
        query: GET_CURRENT_PREDICTIONS,
        variables: { projectPath },
        fetchPolicy: 'network-only',
      });
      
      return data.getCurrentPredictions;
    } catch (error) {
      console.error('Error getting predictions:', error);
      throw error;
    }
  }
}

const apiService = new APIService();
export default apiService;