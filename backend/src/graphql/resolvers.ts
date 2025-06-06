// backend/src/graphql/resolvers.ts
import { analyticsResolvers } from './analytics.resolvers';

// Resolvers existentes
const baseResolvers = {
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
      
      console.log(`Processing command: "${command}"`);
      
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
            
            console.log(`Deploying ${branch} to ${environment} in project ${projectPath}`);
            
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
              message: `Deployment initiated! Pipeline ${deployResult.pipeline.iid} started for ${branch} → ${environment}`,
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

        case 'COST_ANALYSIS':
          try {
            const projectPath = aiResult.entities.project || userContext;
            
            // Análisis de costos con IA
            const costAnalysis = await context.ai.analyzePipelineCosts(projectPath);
            
            response = {
              ...response,
              action: 'cost_analysis',
              message: `Cost Analysis for ${projectPath}:
              
Current monthly cost: $${costAnalysis.currentCost}
Projected savings: $${costAnalysis.potentialSavings} (${costAnalysis.savingsPercentage}%)

Top recommendations:
${costAnalysis.recommendations.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

Estimated ROI: ${costAnalysis.roi} in 3 months`,
              data: JSON.stringify(costAnalysis),
              executed: true
            };
          } catch (error: any) {
            response = {
              ...response,
              action: 'error',
              message: `Cost analysis failed: ${error.message}`,
              executed: false
            };
          }
          break;

        case 'PERFORMANCE_REPORT':
          try {
            const projectPath = aiResult.entities.project || userContext;
            const timeRange = aiResult.entities.timeRange || 'last_7_days';
            
            // Generar reporte de performance con IA
            const report = await context.gitlab.getPipelineMetrics(projectPath, timeRange);
            const aiInsights = await context.ai.analyzePerformanceTrends(report);
            
            response = {
              ...response,
              action: 'performance_report',
              message: `Performance Report (${timeRange}):

Pipeline Success Rate: ${report.successRate}%
Average Duration: ${report.avgDuration} minutes
Total Runs: ${report.totalRuns}

AI Insights:
${aiInsights.insights.join('\n')}

Anomalies Detected:
${aiInsights.anomalies.length > 0 ? aiInsights.anomalies.join('\n') : 'None'}`,
              data: JSON.stringify({ report, aiInsights }),
              executed: true
            };
          } catch (error: any) {
            response = {
              ...response,
              action: 'error',
              message: `Performance report failed: ${error.message}`,
              executed: false
            };
          }
          break;

        case 'AUTO_FIX':
          try {
            const projectPath = aiResult.entities.project || userContext;
            const jobId = aiResult.entities.jobId;
            
            if (!jobId) {
              // Obtener el último job fallido
              const failedJob = await context.gitlab.getLastFailedJob(projectPath);
              if (!failedJob) {
                return {
                  ...response,
                  action: 'no_failures',
                  message: 'No failed jobs found. Everything is running smoothly!',
                  executed: true
                };
              }
              
              // Analizar el log y sugerir fix
              const fix = await context.ai.analyzeFailure(failedJob.log, failedJob.config);
              
              response = {
                ...response,
                action: 'fix_suggested',
                message: `AI Fix Suggestion for job "${failedJob.name}":

Root Cause: ${fix.rootCause}

Suggested Fix:
${fix.recommendation}

Code Changes:
\`\`\`${fix.language || 'yaml'}
${fix.code}
\`\`\`

Confidence: ${fix.confidence}%`,
                data: JSON.stringify(fix),
                executed: true
              };
            }
          } catch (error: any) {
            response = {
              ...response,
              action: 'error',
              message: `Auto-fix analysis failed: ${error.message}`,
              executed: false
            };
          }
          break;

        case 'SCHEDULE_DEPLOYMENT':
          try {
            const projectPath = aiResult.entities.project || userContext;
            const environment = aiResult.entities.environment || 'staging';
            const scheduleTime = aiResult.entities.time || 'next_maintenance_window';
            
            // Calcular el mejor momento con IA
            const schedule = await context.ai.calculateOptimalDeploymentTime(
              projectPath,
              environment,
              scheduleTime
            );
            
            response = {
              ...response,
              action: 'deployment_scheduled',
              message: `Deployment Scheduled:

Environment: ${environment}
Optimal Time: ${schedule.suggestedTime}
Reason: ${schedule.reason}

Risk Assessment:
- Traffic Impact: ${schedule.trafficImpact}
- Success Probability: ${schedule.successProbability}%
- Rollback Time: ${schedule.estimatedRollbackTime} minutes

The deployment will be triggered automatically at the scheduled time.`,
              data: JSON.stringify(schedule),
              executed: true
            };
          } catch (error: any) {
            response = {
              ...response,
              action: 'error',
              message: `Scheduling failed: ${error.message}`,
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
• optimize my pipeline - Get optimization suggestions
• analyze my pipeline costs - Get cost breakdown and savings
• show performance report - Get performance metrics and AI insights
• fix failed job - Get AI suggestions to fix failures
• schedule deployment for tomorrow - Schedule optimal deployment time`,
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

// Combinar todos los resolvers
export const resolvers = {
  Query: {
    ...baseResolvers.Query,
    ...analyticsResolvers.Query,
  },
  Mutation: {
    ...baseResolvers.Mutation,
    ...analyticsResolvers.Mutation,
  },
};