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

    console.log('✅ Vertex AI initialized with Gemini 2.0 Flash');
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
    
    Extract entities like: branch, environment, project, service, version
    
    Respond ONLY with valid JSON in this exact format:
    {
      "intent": "INTENT_NAME",
      "entities": {
        "branch": "extracted branch name or null",
        "environment": "staging/production/dev or null",
        "project": "project name or null",
        "service": "service name or null"
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

  private basicProcessing(command: string): any {
    // Fallback básico si Vertex AI falla
    const lowerCommand = command.toLowerCase();
    
    const entities: any = {
      branch: null,
      environment: null,
      project: null,
      service: null
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
    
    // Determinar intent
    let intent = 'UNKNOWN';
    if (lowerCommand.includes('deploy')) intent = 'DEPLOY_REQUEST';
    else if (lowerCommand.includes('status')) intent = 'STATUS_CHECK';
    else if (lowerCommand.includes('rollback')) intent = 'ROLLBACK_REQUEST';
    else if (lowerCommand.includes('optimize')) intent = 'OPTIMIZATION_REQUEST';
    
    return {
      intent,
      entities,
      confidence: 0.5,
      suggestedAction: `Execute ${intent.toLowerCase().replace('_', ' ')}`
    };
  }
}