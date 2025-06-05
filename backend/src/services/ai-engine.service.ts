import { VertexAIService } from './vertex-ai.service';
import { PredictionService } from './prediction.service';

export class AIEngine {
  private vertexAIService?: VertexAIService;  // Agregar ? para hacerlo opcional
  private predictionService?: PredictionService;  // Agregar ? para hacerlo opcional

  constructor() {
    console.log('🤖 Initializing AI Engine...');
    
    try {
      this.vertexAIService = new VertexAIService();
      this.predictionService = new PredictionService();
      console.log('✅ AI Engine initialized successfully');
    } catch (error) {
      console.error('⚠️ AI Engine initialization error:', error);
      console.log('Running in fallback mode');
      // No asignamos nada, quedan como undefined
    }
  }

  async processNaturalLanguage(text: string, context?: any) {
    try {
      // Usar Vertex AI si está disponible
      if (this.vertexAIService) {
        return await this.vertexAIService.processNaturalLanguageCommand(text, context);
      }
    } catch (error) {
      console.error('Vertex AI error, using fallback:', error);
    }

    // Fallback processing
    return this.basicProcessing(text);
  }

  async generatePipelineConfig(requirements: string) {
    if (this.vertexAIService) {
      return await this.vertexAIService.generatePipelineConfig(requirements);
    }
    
    // Fallback
    return `stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - echo "Building..."
    - npm install
    - npm run build

test:
  stage: test
  script:
    - npm test

deploy:
  stage: deploy
  script:
    - echo "Deploy to staging"
  only:
    - main`;
  }

  async predictPipelineResources(pipeline: any) {
    if (this.vertexAIService) {
      return await this.vertexAIService.predictResourceRequirements(pipeline);
    }
    
    // Fallback
    return {
      cpu: '2 cores',
      memory: '4 GB',
      estimatedDuration: 10,
      estimatedCost: 0.50,
      confidence: 0.75
    };
  }

  async analyzeFailure(jobLog: string, jobConfig: any) {
    if (this.vertexAIService) {
      return await this.vertexAIService.analyzeFailure(jobLog, jobConfig);
    }
    
    // Fallback
    return {
      rootCause: "Analysis not available",
      recommendation: "Check logs manually"
    };
  }

  // Métodos existentes...
  private basicProcessing(text: string) {
    const lowerText = text.toLowerCase();
    
    let intent = 'UNKNOWN';
    const entities: any = {};

    if (lowerText.includes('deploy')) {
      intent = 'DEPLOY_REQUEST';
      if (lowerText.includes('staging')) entities.environment = 'staging';
      if (lowerText.includes('production')) entities.environment = 'production';
      
      // Extraer branch
      const branchMatch = lowerText.match(/(?:branch\s+|feature[-\/]?)(\S+)/i);
      if (branchMatch) {
        entities.branch = branchMatch[1];
      }
    } else if (lowerText.includes('status')) {
      intent = 'STATUS_CHECK';
    } else if (lowerText.includes('create') && lowerText.includes('pipeline')) {
      intent = 'PIPELINE_CREATE';
    } else if (lowerText.includes('rollback')) {
      intent = 'ROLLBACK_REQUEST';
    } else if (lowerText.includes('optimize') || lowerText.includes('slow')) {
      intent = 'OPTIMIZATION_REQUEST';
    }

    return { 
      intent, 
      entities, 
      confidence: 0.5,
      suggestedAction: `Process ${intent.toLowerCase().replace('_', ' ')}`
    };
  }

  // Mantener métodos existentes para compatibilidad
  async predictResourcesForBranch(projectPath: string, branch: string) {
    return this.predictPipelineResources({ projectPath, branch });
  }

  async analyzeOptimizations(projectPath: string) {
    // Usar Vertex AI para análisis más profundo si está disponible
    try {
      if (this.vertexAIService) {
        // Aquí podrías hacer un análisis más complejo
        return {
          originalCost: 100.0,
          optimizedCost: 40.0,
          savings: 60.0,
          recommendations: [
            "Use spot instances for non-critical jobs - Save 70% on compute costs",
            "Enable dependency caching - Reduce build time by 40%",
            "Parallelize test execution - Cut testing time by 60%",
            "Optimize Docker image layers - Decrease deployment time by 30%"
          ]
        };
      }
    } catch (error) {
      console.error('Optimization analysis error:', error);
    }

    return {
      originalCost: 100.0,
      optimizedCost: 40.0,
      savings: 60.0,
      recommendations: ["Enable caching", "Use smaller images"]
    };
  }

  async optimizePipeline(projectPath: string, pipelineId: string, type: string) {
    return this.analyzeOptimizations(projectPath);
  }
}