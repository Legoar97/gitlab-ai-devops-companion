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
      
      // Estructura base de respuesta
      let response = {
        intent: aiResult.intent,
        action: 'none',
        message: '',
        data: null as string | null,
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
              console.log('Pipeline errors:', deployResult.errors);
              return {
                ...response,
                action: 'pipeline_error',
                message: deployResult.errors.join('\n'),
                executed: false
              };
            }
            
            response = {
              ...response,
              action: 'pipeline_triggered',
              message: `🚀 Deployment initiated! Pipeline ${deployResult.pipeline.iid} started for ${branch} → ${environment}`,
              data: JSON.stringify({
                pipeline: {
                  id: deployResult.pipeline.id,
                  webUrl: deployResult.pipeline.webUrl,
                  status: deployResult.pipeline.status
                }
              }),
              executed: true
            };
          } catch (error: any) {
            console.error('Deployment error:', error);
            response = {
              ...response,
              action: 'error',
              message: `Deployment failed: ${error.message || 'Unknown error'}`,
              executed: false
            };
          }
          break;

        case 'STATUS_CHECK':
          try {
            const projectPath = aiResult.entities.project || userContext || 'Legoar97-group/test-ai-companion';
            const status = await context.gitlab.getPipelineStatus(projectPath);
            
            response = {
              ...response,
              action: 'status_retrieved',
              message: status.message,
              data: JSON.stringify(status),
              executed: true
            };
          } catch (error: any) {
            console.error('Status check error:', error);
            response = {
              ...response,
              action: 'error',
              message: `Failed to check status: ${error.message}`,
              executed: false
            };
          }
          break;

        case 'OPTIMIZATION_REQUEST':
          try {
            const projectPath = aiResult.entities.project || userContext || 'Legoar97-group/test-ai-companion';
            const optimization = await context.ai.analyzeOptimizations(projectPath);
            
            response = {
              ...response,
              action: 'optimization_suggested',
              message: `Found optimizations that can save ${optimization.savings}%:\n${optimization.recommendations.join('\n')}`,
              data: JSON.stringify(optimization),
              executed: true
            };
          } catch (error: any) {
            console.error('Optimization error:', error);
            response = {
              ...response,
              action: 'error',
              message: `Failed to analyze optimizations: ${error.message}`,
              executed: false
            };
          }
          break;

        case 'PIPELINE_CREATE':
          response = {
            ...response,
            action: 'not_implemented',
            message: 'Pipeline creation is not implemented yet. Try: "deploy to staging" instead.',
            executed: false
          };
          break;

        case 'ROLLBACK_REQUEST':
          response = {
            ...response,
            action: 'not_implemented',
            message: 'Rollback functionality is coming soon. For now, you can manually revert commits in GitLab.',
            executed: false
          };
          break;

        case 'HELP_REQUEST':
          response = {
            ...response,
            action: 'help',
            message: `Here are some commands you can try:
• deploy to staging - Deploy the main branch to staging
• deploy feature-xyz to production - Deploy a specific branch
• check pipeline status - Get the status of the latest pipeline
• show recent pipelines - List recent pipeline runs
• optimize my pipeline - Get optimization suggestions`,
            executed: true
          };
          break;

        default:
          response = {
            ...response,
            action: 'unknown',
            message: "I didn't understand that command. Try: 'deploy to staging' or 'check pipeline status' or ask for 'help'",
            executed: false
          };
      }

      return response;
    },

    executePipeline: async (_: any, args: any, context: any) => {
      const { projectPath, branch, environment, variables } = args;
      
      try {
        const result = await context.gitlab.triggerPipeline(
          projectPath,
          branch || 'main',
          variables ? JSON.parse(variables) : {}
        );
        
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors.join('\n'));
        }
        
        return result.pipeline;
      } catch (error: any) {
        console.error('Execute pipeline error:', error);
        throw error;
      }
    },

    optimizePipeline: async (_: any, args: any, context: any) => {
      const { projectPath, pipelineId, optimizationType } = args;
      
      try {
        return await context.ai.optimizePipeline(projectPath, pipelineId, optimizationType);
      } catch (error: any) {
        console.error('Optimize pipeline error:', error);
        throw error;
      }
    }
  }
};