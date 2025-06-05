export const resolvers = {
  Query: {
    hello: () => 'Hello from GitLab AI DevOps Companion!',
    
    analyzePipeline: async (_: any, args: any, context: any) => {
      // Implementación temporal
      return {
        id: '123',
        status: 'running',
        duration: 300,
        createdAt: new Date().toISOString(),
        finishedAt: null,
        jobs: []
      };
    },

    predictResources: async (_: any, args: any, context: any) => {
      // Implementación temporal
      return {
        cpu: '2 cores',
        memory: '4 GB',
        estimatedDuration: 10,
        estimatedCost: 0.50,
        confidence: 0.85
      };
    },

    getOptimizations: async (_: any, args: any, context: any) => {
      // Implementación temporal
      return {
        originalCost: 100.0,
        optimizedCost: 40.0,
        savings: 60.0,
        recommendations: [
          "Use spot instances for non-critical jobs",
          "Enable caching for dependencies"
        ]
      };
    }
  },

  Mutation: {
    processCommand: async (_: any, args: any, context: any) => {
      const { command, context: userContext } = args;
      
      console.log(`🎤 Processing command: "${command}"`);
      
      // Procesar con AI
      const aiResult = await context.ai.processNaturalLanguage(command, userContext);
      
      // Estructura base de respuesta (cambiado data a string o null)
      let response = {
        intent: aiResult.intent,
        action: 'none',
        message: '',
        data: null as string | null,  // Permitir string o null
        executed: false
      };

      switch (aiResult.intent) {
        case 'DEPLOY_REQUEST':
        try {
          // Usar el proyecto del contexto o el extraído
          const projectPath = aiResult.entities.project || userContext;
          const branch = aiResult.entities.branch || 'main';
          const environment = aiResult.entities.environment || 'staging';
          
          console.log(`📦 Deploying ${branch} to ${environment} in project ${projectPath}`);
          
          // Verificar que tenemos un proyecto válido
          if (!projectPath || projectPath === 'default-project') {
            return {
              ...response,
              action: 'error',
              message: 'Please specify a valid project path (e.g., "username/project-name")',
              executed: false
            };
          }
          
          // Trigger pipeline REAL
          const deployResult = await context.gitlab.triggerPipeline(
            projectPath,
            branch,
            { 
              ENVIRONMENT: environment,
              AI_OPTIMIZED: 'true',
              TRIGGERED_BY: 'GitLab AI DevOps Companion'
            }
          );
          
          if (deployResult.errors && deployResult.errors.length > 0) {
            return {
              ...response,
              action: 'pipeline_error',
              message: `Failed to trigger pipeline: ${deployResult.errors.join(', ')}`,
              executed: false
            };
          }
          
          response = {
            ...response,
            action: 'pipeline_triggered',
            message: `🚀 Deployment initiated! Pipeline ${deployResult.pipeline.iid} started for ${branch} → ${environment}`,
            data: JSON.stringify(deployResult),
            executed: true
          };
        } catch (error: any) {
          console.error('Deployment error:', error);
          response = {
            ...response,
            action: 'error',
            message: `Deployment failed: ${error.message}`,
            executed: false
          };
        }
        break;

        case 'STATUS_CHECK':
          const status = await context.gitlab.getPipelineStatus(
            aiResult.entities.project || userContext || 'default-project'
          );
          
          response = {
            ...response,
            action: 'status_retrieved',
            message: `Current pipeline status: ${status.status}`,
            data: JSON.stringify(status),
            executed: true
          };
          break;

        case 'OPTIMIZATION_REQUEST':
          const optimization = await context.ai.analyzeOptimizations(
            aiResult.entities.project || userContext || 'default-project'
          );
          
          response = {
            ...response,
            action: 'optimization_suggested',
            message: `Found optimizations that can save ${optimization.savings}%`,
            data: JSON.stringify(optimization),
            executed: true
          };
          break;

        default:
          response.message = "I didn't understand that command. Try: 'deploy to staging' or 'check pipeline status'";
      }

      return response;
    },

    executePipeline: async (_: any, args: any, context: any) => {
      // Implementación temporal
      return {
        id: '456',
        status: 'pending',
        duration: 0,
        createdAt: new Date().toISOString(),
        finishedAt: null,
        jobs: []
      };
    },

    optimizePipeline: async (_: any, args: any, context: any) => {
      // Implementación temporal
      return {
        originalCost: 100.0,
        optimizedCost: 40.0,
        savings: 60.0,
        recommendations: []
      };
    }
  }
};