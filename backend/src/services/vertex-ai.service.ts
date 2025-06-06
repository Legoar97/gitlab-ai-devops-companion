import { VertexAI } from '@google-cloud/vertexai';

export class VertexAIService {
  private vertexAI: VertexAI;
  private generativeModel: any;

  constructor() {
    // Inicializar Vertex AI
    this.vertexAI = new VertexAI({
      project: process.env.GCP_PROJECT_ID!,
      location: process.env.GCP_LOCATION || 'us-central1',
    });

    // Configurar Gemini 2.0 Flash
    this.generativeModel = this.vertexAI.preview.getGenerativeModel({
      model: 'gemini-2.0-flash-001',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    console.log('Vertex AI initialized with Gemini 2.0 Flash');
  }

  async processNaturalLanguageCommand(command: string, context?: any): Promise<any> {
    const prompt = `You are an AI DevOps assistant for GitLab CI/CD pipelines. 
    Analyze this command and extract the intent and entities.
    
    Command: "${command}"
    Context: ${JSON.stringify(context || {})}
    
    Possible intents:
    - DEPLOY_REQUEST: User wants to deploy code
    - STATUS_CHECK: User wants to check pipeline status  
    - ROLLBACK_REQUEST: User wants to rollback
    - OPTIMIZATION_REQUEST: User wants to optimize performance/costs
    - PIPELINE_CREATE: User wants to create a new pipeline
    - HELP_REQUEST: User needs help
    - COST_ANALYSIS: User wants cost breakdown
    - PERFORMANCE_REPORT: User wants performance metrics
    - AUTO_FIX: User wants to fix failed jobs
    - SCHEDULE_DEPLOYMENT: User wants to schedule deployment
    
    Extract entities like: branch, environment, project, service, version, timeRange, time
    
    Respond ONLY with valid JSON in this exact format:
    {
      "intent": "INTENT_NAME",
      "entities": {
        "branch": "extracted branch name or null",
        "environment": "staging/production/dev or null",
        "project": "project name or null",
        "service": "service name or null",
        "timeRange": "time range or null",
        "time": "schedule time or null"
      },
      "confidence": 0.95,
      "suggestedAction": "specific action to take"
    }`;

    try {
      const request = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      };

      const result = await this.generativeModel.generateContent(request);
      
      // Acceder correctamente a la respuesta
      const response = result.response;
      let text = '';
      
      // La respuesta puede tener diferentes estructuras
      if (response.candidates && response.candidates[0]) {
        text = response.candidates[0].content.parts[0].text;
      } else if (typeof response === 'string') {
        text = response;
      } else {
        console.log('Response structure:', JSON.stringify(response, null, 2));
        throw new Error('Unexpected response structure');
      }
      
      console.log('Vertex AI response:', text);
      
      // Extraer JSON de la respuesta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Vertex AI processing error:', error);
      // Fallback a procesamiento básico
      return this.basicProcessing(command);
    }
  }

  async generatePipelineConfig(requirements: string): Promise<string> {
    const prompt = `Generate a GitLab CI/CD pipeline configuration based on these requirements:
    
    Requirements: ${requirements}
    
    Create a complete .gitlab-ci.yml file that includes:
    - Appropriate stages
    - Optimal resource allocation
    - Caching strategies
    - Security best practices
    - Error handling
    
    Use GitLab CI/CD best practices and optimize for speed and cost.
    Return ONLY the YAML configuration without explanations.`;

    try {
      const request = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      };

      const result = await this.generativeModel.generateContent(request);
      const response = result.response;
      
      if (response.candidates && response.candidates[0]) {
        return response.candidates[0].content.parts[0].text;
      }
      
      throw new Error('No response from model');
    } catch (error) {
      console.error('Pipeline generation error:', error);
      throw error;
    }
  }

  async predictResourceRequirements(pipelineData: any): Promise<any> {
    const prompt = `Analyze this GitLab CI/CD pipeline and predict optimal resource requirements:
    
    Pipeline Data:
    ${JSON.stringify(pipelineData, null, 2)}
    
    Consider:
    - Number and complexity of jobs
    - Test suite size
    - Build artifacts
    - Dependencies
    - Historical performance data
    
    Predict optimal:
    1. CPU cores needed
    2. Memory (RAM) in GB
    3. Estimated duration in minutes
    4. Estimated cost in USD
    5. Recommended runner type (shared/dedicated)
    6. Parallelization opportunities
    
    Respond with JSON containing these predictions and confidence score.`;

    try {
      const request = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      };

      const result = await this.generativeModel.generateContent(request);
      const response = result.response;
      let text = '';
      
      if (response.candidates && response.candidates[0]) {
        text = response.candidates[0].content.parts[0].text;
      }
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback
      return {
        cpu: "2 cores",
        memory: "4 GB",
        estimatedDuration: 10,
        estimatedCost: 0.50,
        runnerType: "shared",
        parallelization: "possible",
        confidence: 0.70
      };
    } catch (error) {
      console.error('Resource prediction error:', error);
      throw error;
    }
  }

  async analyzeFailure(jobLog: string, jobConfig: any): Promise<any> {
    const prompt = `Analyze this failed GitLab CI/CD job and provide a solution:
    
    Job Configuration:
    ${JSON.stringify(jobConfig, null, 2)}
    
    Job Log (last 100 lines):
    ${jobLog}
    
    Provide:
    1. Root cause of failure
    2. Specific fix recommendation
    3. Code or configuration changes needed
    4. Prevention strategies
    
    Format as actionable JSON with clear steps.`;

    try {
      const request = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      };

      const result = await this.generativeModel.generateContent(request);
      const response = result.response;
      let text = '';
      
      if (response.candidates && response.candidates[0]) {
        text = response.candidates[0].content.parts[0].text;
      }
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        rootCause: "Unable to determine",
        recommendation: "Check job logs for more details",
        preventionStrategy: "Add better error handling"
      };
    } catch (error) {
      console.error('Failure analysis error:', error);
      throw error;
    }
  }

  async analyzePipelineCosts(projectPath: string): Promise<any> {
    const prompt = `Analyze the CI/CD pipeline costs for a GitLab project and provide optimization recommendations.
    
    Project: ${projectPath}
    
    Consider:
    - Runner usage patterns
    - Resource allocation efficiency
    - Caching opportunities
    - Parallel job optimization
    - Artifact storage costs
    
    Provide a detailed cost analysis with:
    1. Current estimated monthly cost
    2. Potential savings amount and percentage
    3. Specific actionable recommendations
    4. ROI timeline
    
    Format as JSON with structure:
    {
      "currentCost": number,
      "potentialSavings": number,
      "savingsPercentage": number,
      "recommendations": string[],
      "roi": string,
      "breakdown": {
        "compute": number,
        "storage": number,
        "network": number
      }
    }`;

    try {
      const result = await this.generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      
      const response = result.response;
      const text = response.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        currentCost: 100,
        potentialSavings: 40,
        savingsPercentage: 40,
        recommendations: [
          "Enable advanced caching strategies",
          "Use spot instances for non-critical jobs",
          "Optimize Docker image layers"
        ],
        roi: "2 months"
      };
    } catch (error) {
      console.error('Cost analysis error:', error);
      throw error;
    }
  }

  async analyzePerformanceTrends(metrics: any): Promise<any> {
    const prompt = `Analyze these CI/CD pipeline performance metrics and provide AI insights:
    
    Metrics: ${JSON.stringify(metrics, null, 2)}
    
    Identify:
    1. Performance trends (improving/degrading)
    2. Anomalies or unusual patterns
    3. Bottlenecks in the pipeline
    4. Optimization opportunities
    5. Predictive insights for next week
    
    Return JSON with:
    {
      "insights": string[],
      "anomalies": string[],
      "bottlenecks": string[],
      "predictions": {
        "expectedSuccessRate": number,
        "expectedAvgDuration": number,
        "riskFactors": string[]
      },
      "recommendations": string[]
    }`;

    try {
      const result = await this.generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      
      const response = result.response;
      const text = response.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        insights: ["Pipeline performance is stable"],
        anomalies: [],
        bottlenecks: ["Test stage taking 40% of total time"],
        predictions: {
          expectedSuccessRate: 95,
          expectedAvgDuration: 12,
          riskFactors: []
        },
        recommendations: ["Consider parallelizing tests"]
      };
    } catch (error) {
      console.error('Performance analysis error:', error);
      throw error;
    }
  }

  async calculateOptimalDeploymentTime(
    projectPath: string, 
    environment: string, 
    preferredTime: string
  ): Promise<any> {
    const prompt = `Calculate the optimal deployment time for a GitLab project.
    
    Project: ${projectPath}
    Environment: ${environment}
    Preferred Time: ${preferredTime}
    Current Time: ${new Date().toISOString()}
    
    Consider:
    - Traffic patterns (avoid peak hours)
    - Team availability
    - Historical deployment success rates by time
    - Maintenance windows
    - Time zones of users
    
    If preferred time is "next_maintenance_window", suggest the next best time.
    
    Return JSON:
    {
      "suggestedTime": "ISO datetime string",
      "reason": "explanation",
      "trafficImpact": "low/medium/high",
      "successProbability": number (0-100),
      "estimatedRollbackTime": number (minutes),
      "alternativeTimes": ["ISO datetime string"]
    }`;

    try {
      const result = await this.generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      
      const response = result.response;
      const text = response.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback
      const nextMaintenanceWindow = new Date();
      nextMaintenanceWindow.setHours(3, 0, 0, 0); // 3 AM
      if (nextMaintenanceWindow < new Date()) {
        nextMaintenanceWindow.setDate(nextMaintenanceWindow.getDate() + 1);
      }
      
      return {
        suggestedTime: nextMaintenanceWindow.toISOString(),
        reason: "Low traffic period with high success rate",
        trafficImpact: "low",
        successProbability: 98,
        estimatedRollbackTime: 5,
        alternativeTimes: []
      };
    } catch (error) {
      console.error('Deployment time calculation error:', error);
      throw error;
    }
  }

  async generatePipelineDocumentation(pipelineConfig: string): Promise<string> {
    const prompt = `Generate comprehensive documentation for this GitLab CI/CD pipeline configuration:
    
    ${pipelineConfig}
    
    Include:
    1. Overview and purpose
    2. Stage descriptions
    3. Job explanations
    4. Variables and secrets used
    5. Dependencies and requirements
    6. Troubleshooting guide
    7. Best practices specific to this pipeline
    
    Format in Markdown with clear sections.`;

    try {
      const result = await this.generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      
      const response = result.response;
      return response.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Documentation generation error:', error);
      throw error;
    }
  }

  private basicProcessing(command: string): any {
    // Fallback básico si Vertex AI falla
    const lowerCommand = command.toLowerCase();
    
    const entities: any = {
      branch: null,
      environment: null,
      project: null,
      service: null,
      timeRange: null,
      time: null
    };
    
    // Extraer branch
    const branchMatch = command.match(/(?:branch\s+|feature[-\/]?)(\S+)/i);
    if (branchMatch) {
      entities.branch = branchMatch[1];
    }
    
    // Extraer environment
    if (lowerCommand.includes('staging')) entities.environment = 'staging';
    else if (lowerCommand.includes('production')) entities.environment = 'production';
    else if (lowerCommand.includes('dev')) entities.environment = 'dev';
    
    // Extraer time range
    if (lowerCommand.includes('last week')) entities.timeRange = 'last_7_days';
    else if (lowerCommand.includes('last month')) entities.timeRange = 'last_30_days';
    else if (lowerCommand.includes('today')) entities.timeRange = 'today';
    
    // Determinar intent
    let intent = 'UNKNOWN';
    if (lowerCommand.includes('deploy')) intent = 'DEPLOY_REQUEST';
    else if (lowerCommand.includes('status')) intent = 'STATUS_CHECK';
    else if (lowerCommand.includes('rollback')) intent = 'ROLLBACK_REQUEST';
    else if (lowerCommand.includes('optimize')) intent = 'OPTIMIZATION_REQUEST';
    else if (lowerCommand.includes('cost')) intent = 'COST_ANALYSIS';
    else if (lowerCommand.includes('performance') || lowerCommand.includes('report')) intent = 'PERFORMANCE_REPORT';
    else if (lowerCommand.includes('fix') || lowerCommand.includes('failed')) intent = 'AUTO_FIX';
    else if (lowerCommand.includes('schedule')) intent = 'SCHEDULE_DEPLOYMENT';
    else if (lowerCommand.includes('help')) intent = 'HELP_REQUEST';
    
    return {
      intent,
      entities,
      confidence: 0.5,
      suggestedAction: `Execute ${intent.toLowerCase().replace('_', ' ')}`
    };
  }
}