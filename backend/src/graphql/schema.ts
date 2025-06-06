// backend/src/graphql/schema.ts
import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # Tipos principales
  type Pipeline {
    id: String!
    iid: String!
    status: String!
    duration: Int
    createdAt: String!
    finishedAt: String
    webUrl: String!
    ref: String!
    resourcePrediction: ResourcePrediction
    jobs: [Job!]!
  }

  type Job {
    id: String!
    name: String!
    status: String!
    duration: Int
    stage: String!
    failureReason: String
  }

  type ResourcePrediction {
    cpu: String!
    memory: String!
    estimatedDuration: Int!
    estimatedCost: Float!
    confidence: Float!
  }

  type AIResponse {
    intent: String!
    action: String!
    message: String!
    data: String
    executed: Boolean!
  }

  type OptimizationResult {
    originalCost: Float!
    optimizedCost: Float!
    savings: Float!
    recommendations: [String!]!
  }

  # Analytics Types
  type PipelineMetrics {
    totalRuns: Int!
    successfulRuns: Int!
    failedRuns: Int!
    successRate: Float!
    avgDuration: Float!
    successRateTrend: Float
    targetDuration: Float
    monthlyCost: Float
    projectedCost: Float
    activePipelines: Int
    queuedPipelines: Int
    statusDistribution: [StatusCount!]
  }

  type StatusCount {
    name: String!
    value: Int!
  }

  type PipelineTrend {
    date: String!
    successRate: Float!
    avgDuration: Float!
    totalRuns: Int!
    cost: Float!
  }

  type CostAnalysis {
    date: String!
    pipelineCount: Int!
    totalHours: Float!
    totalCost: Float!
    avgCostPerPipeline: Float!
    wastedCost: Float!
  }

  type DeploymentWindow {
    hourOfDay: Int!
    dayOfWeek: Int!
    timeCategory: String!
    deployments: Int!
    avgDuration: Float!
    successRate: Float!
    avgCost: Float!
  }

  type Anomaly {
    type: String!
    week: String!
    change: Float!
    message: String!
    severity: String!
  }

  type PipelinePrediction {
    estimatedDuration: Int!
    failureProbability: Float!
    estimatedCost: Float!
    confidence: Float!
    riskFactors: [String!]!
    recommendations: [String!]!
  }

  type CurrentPredictions {
    nextOptimalDeployment: String!
    currentRiskLevel: String!
    riskFactors: [RiskFactor!]!
    suggestions: [String!]!
  }

  type RiskFactor {
    factor: String!
    value: Float!
  }

  # Queries
  type Query {
    # Existing queries
    hello: String!
    analyzePipeline(projectPath: String!, pipelineId: String!): Pipeline
    predictResources(projectPath: String!, branch: String!): ResourcePrediction
    getOptimizations(projectPath: String!): OptimizationResult
    
    # New Analytics queries
    getPipelineMetrics(projectPath: String!, timeRange: String): PipelineMetrics
    getPipelineTrends(projectPath: String!, days: Int): [PipelineTrend!]!
    getCostAnalysis(projectPath: String!, timeRange: String): [CostAnalysis!]!
    getOptimalDeploymentWindows(projectPath: String!): [DeploymentWindow!]!
    getAnomalies(projectPath: String!): [Anomaly!]!
    getCurrentPredictions(projectPath: String!): CurrentPredictions
    predictPipelineOutcome(
      projectPath: String!
      ref: String!
      commitFilesCount: Int
    ): PipelinePrediction
  }

  # Mutations
  type Mutation {
    # Existing mutations
    processCommand(command: String!, context: String): AIResponse
    executePipeline(
      projectPath: String!
      branch: String!
      environment: String
      variables: String
    ): Pipeline
    optimizePipeline(
      projectPath: String!
      pipelineId: String!
      optimizationType: String!
    ): OptimizationResult
    
    # New mutations
    triggerAutoFix(
      projectPath: String!
      jobId: String!
    ): AIResponse
    
    scheduleDeployment(
      projectPath: String!
      ref: String!
      environment: String!
      preferredTime: String
    ): AIResponse
    
    enableMonitoring(
      projectPath: String!
      slackChannel: String
      thresholds: String
    ): Boolean
  }

  # Subscriptions para real-time
  type Subscription {
    pipelineStatusChanged(projectPath: String!): Pipeline
    aiInsights(projectPath: String!): String
    costAlert(projectPath: String!): CostAnalysis
    anomalyDetected(projectPath: String!): Anomaly
  }
`;