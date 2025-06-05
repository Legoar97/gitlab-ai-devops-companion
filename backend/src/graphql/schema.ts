import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # Tipos principales
  type Pipeline {
    id: String!
    status: String!
    duration: Int
    createdAt: String!
    finishedAt: String
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

  # Queries
  type Query {
    # Saludo inicial
    hello: String!
    # Analizar el estado actual
    analyzePipeline(projectPath: String!, pipelineId: String!): Pipeline
    
    # Obtener predicciones
    predictResources(projectPath: String!, branch: String!): ResourcePrediction
    
    # Obtener optimizaciones sugeridas
    getOptimizations(projectPath: String!): OptimizationResult
  }

  # Mutations
  type Mutation {
    # Procesar comando en lenguaje natural
    processCommand(command: String!, context: String): AIResponse
    
    # Ejecutar acción específica
    executePipeline(
      projectPath: String!
      branch: String!
      environment: String
      variables: String
    ): Pipeline
    
    # Optimizar pipeline existente
    optimizePipeline(
      projectPath: String!
      pipelineId: String!
      optimizationType: String!
    ): OptimizationResult
  }

  # Subscriptions para real-time
  type Subscription {
    pipelineStatusChanged(projectPath: String!): Pipeline
    aiInsights(projectPath: String!): String
  }
`;