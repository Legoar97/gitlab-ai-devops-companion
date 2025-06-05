import { VertexAI } from '@google-cloud/vertexai';

export class PredictionService {
  private vertexAI: VertexAI;
  private model: any;

  constructor() {
    this.vertexAI = new VertexAI({
      project: process.env.GCP_PROJECT_ID!,
      location: process.env.GCP_LOCATION || 'us-central1',
    });

    // Usar Gemini 2.0 Flash
    this.model = this.vertexAI.preview.getGenerativeModel({
      model: 'gemini-2.0-flash-001',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.1, // Más determinístico para predicciones
        topP: 0.1,
        topK: 20,
      },
    });
  }

  async predictPipelineResources(pipelineData: any) {
    const prompt = `
    Analyze this GitLab CI/CD pipeline data and predict resource requirements:
    
    Pipeline: ${JSON.stringify(pipelineData, null, 2)}
    
    Based on the jobs, stages, and historical patterns, predict:
    1. CPU requirements (in cores)
    2. Memory requirements (in GB)
    3. Estimated duration (in minutes)
    4. Estimated cost (in USD)
    
    Respond in JSON format:
    {
      "cpu": "X cores",
      "memory": "X GB",
      "estimatedDuration": X,
      "estimatedCost": X.XX,
      "confidence": 0.XX,
      "reasoning": "brief explanation"
    }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parsear JSON de la respuesta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback si no hay JSON válido
      return {
        cpu: "2 cores",
        memory: "4 GB",
        estimatedDuration: 10,
        estimatedCost: 0.50,
        confidence: 0.75,
        reasoning: "Default prediction"
      };
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }

  async analyzeCodeComplexity(code: string) {
    const prompt = `
    Analyze this code change and determine its complexity for CI/CD:
    
    ${code}
    
    Rate the complexity from 1-10 and explain what resources it might need.
    Consider: test complexity, build steps, dependencies, deployment risks.
    
    Format: JSON with complexity score and resource recommendations.
    `;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
}