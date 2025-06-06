// backend/src/services/vertex-ai-prediction.service.ts
import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { BigQueryAnalyticsService } from './bigquery-analytics.service';

interface PipelinePredictionInput {
  projectId: number;
  ref: string;
  commitFilesCount: number;
  hourOfDay: number;
  dayOfWeek: number;
  commitMessageLength?: number;
  authorExperience?: number; // Number of previous commits
}

interface PipelinePrediction {
  estimatedDuration: number; // in seconds
  failureProbability: number; // 0-1
  estimatedCost: number; // in USD
  confidence: number; // 0-1
  riskFactors: string[];
  recommendations: string[];
}

export class VertexAIPredictionService {
  private predictionClient: PredictionServiceClient;
  private analyticsService: BigQueryAnalyticsService;
  private endpointId: string;
  
  constructor() {
    this.predictionClient = new PredictionServiceClient({
      apiEndpoint: `${process.env.GCP_LOCATION}-aiplatform.googleapis.com`,
    });
    this.analyticsService = new BigQueryAnalyticsService();
    this.endpointId = process.env.VERTEX_AI_ENDPOINT_ID || '';
  }

  async predictPipelineOutcome(input: PipelinePredictionInput): Promise<PipelinePrediction> {
    try {
      // Get historical data for context
      const historicalData = await this.analyticsService.getAverageDuration(
        input.projectId.toString(),
        input.ref,
        30
      );

      // Get failure patterns
      const failurePatterns = await this.analyticsService.getFailurePatterns(
        input.projectId.toString()
      );

      // Find if current time is a high-risk window
      const currentPattern = failurePatterns.find(
        p => p.hour_of_day === input.hourOfDay && p.day_of_week === input.dayOfWeek
      );

      // Base predictions on historical data
      let estimatedDuration = historicalData?.avg_duration || 600; // Default 10 minutes
      let failureProbability = currentPattern?.failure_rate ? currentPattern.failure_rate / 100 : 0.1;
      let confidence = historicalData?.sample_size > 10 ? 0.8 : 0.5;

      // Adjust based on factors
      const riskFactors: string[] = [];
      const recommendations: string[] = [];

      // File count impact
      if (input.commitFilesCount > 50) {
        estimatedDuration *= 1.5;
        failureProbability += 0.1;
        riskFactors.push('Large number of files changed');
        recommendations.push('Consider breaking into smaller commits');
      }

      // Time-based risks
      if (input.dayOfWeek === 5) { // Friday
        failureProbability += 0.15;
        riskFactors.push('Friday deployment - historically higher failure rate');
        recommendations.push('Consider deploying on Monday-Thursday');
      }

      if (input.hourOfDay >= 16) { // After 4 PM
        failureProbability += 0.1;
        riskFactors.push('Late day deployment');
        recommendations.push('Deploy earlier in the day for better support coverage');
      }

      // Weekend deployments
      if (input.dayOfWeek === 0 || input.dayOfWeek === 6) {
        riskFactors.push('Weekend deployment - limited support available');
        recommendations.push('Schedule for business hours if possible');
      }

      // If we have a trained model endpoint, use it
      if (this.endpointId) {
        try {
          const endpoint = `projects/${process.env.GCP_PROJECT_ID}/locations/${process.env.GCP_LOCATION}/endpoints/${this.endpointId}`;
          
          const instances = [{
            project_id: input.projectId,
            ref: input.ref,
            commit_files_count: input.commitFilesCount,
            hour_of_day: input.hourOfDay,
            day_of_week: input.dayOfWeek,
            historical_avg_duration: historicalData?.avg_duration || 0,
            historical_failure_rate: currentPattern?.failure_rate || 0,
          }];

          const [response] = await this.predictionClient.predict({
            endpoint,
            instances: instances.map(instance => ({
              structValue: {
                fields: Object.entries(instance).reduce((acc, [key, value]) => ({
                  ...acc,
                  [key]: { numberValue: value }
                }), {})
              }
            })),
          });

          if (response.predictions && response.predictions.length > 0) {
            const prediction = response.predictions[0].structValue?.fields;
            if (prediction) {
              estimatedDuration = prediction.duration?.numberValue || estimatedDuration;
              failureProbability = prediction.failure_probability?.numberValue || failureProbability;
              confidence = 0.9; // Higher confidence with ML model
            }
          }
        } catch (error) {
          console.error('Error calling Vertex AI endpoint:', error);
          // Fall back to rule-based predictions
        }
      }

      // Calculate estimated cost
      const estimatedCost = this.calculateEstimatedCost(estimatedDuration);

      // Cap probabilities
      failureProbability = Math.min(failureProbability, 0.95);
      
      return {
        estimatedDuration: Math.round(estimatedDuration),
        failureProbability: parseFloat(failureProbability.toFixed(2)),
        estimatedCost: parseFloat(estimatedCost.toFixed(2)),
        confidence: parseFloat(confidence.toFixed(2)),
        riskFactors,
        recommendations,
      };
    } catch (error) {
      console.error('Error in pipeline prediction:', error);
      // Return default predictions
      return {
        estimatedDuration: 600,
        failureProbability: 0.1,
        estimatedCost: 0.10,
        confidence: 0.3,
        riskFactors: ['Unable to analyze historical data'],
        recommendations: ['Proceed with standard precautions'],
      };
    }
  }

  private calculateEstimatedCost(durationSeconds: number): number {
    const computeHours = durationSeconds / 3600;
    const baseCost = computeHours * 0.10; // $0.10 per hour
    const overheadCost = 0.02; // Fixed overhead per pipeline
    return baseCost + overheadCost;
  }

  async trainPredictionModel() {
    // This would be run periodically to retrain the model
    // with new data from BigQuery
    console.log('Training pipeline prediction model...');
    
    // Export training data from BigQuery
    const exportQuery = `
      CREATE OR REPLACE TABLE \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.training_data\` AS
      SELECT 
        project_id,
        ref,
        commit_files_count,
        hour_of_day,
        day_of_week,
        is_weekend,
        is_business_hours,
        job_count,
        duration_seconds,
        CASE WHEN status = 'failed' THEN 1 ELSE 0 END as failed,
        estimated_cost_usd
      FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}\`
      WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
    `;

    // You would then:
    // 1. Export this data to Cloud Storage
    // 2. Create a Vertex AI dataset
    // 3. Train an AutoML model
    // 4. Deploy the model to an endpoint
    // 5. Update VERTEX_AI_ENDPOINT_ID in env
  }

  async getAnomalies(projectId: string): Promise<any[]> {
    // Detect anomalies in pipeline behavior
    const recentMetrics = await this.analyticsService.getPipelineTrends(projectId);
    const anomalies: any[] = [];

    recentMetrics.forEach((week: any, index: number) => {
      if (index > 0 && week.prev_week_duration) {
        // Duration anomaly
        const durationChange = (week.avg_duration - week.prev_week_duration) / week.prev_week_duration;
        if (Math.abs(durationChange) > 0.5) {
          anomalies.push({
            type: 'duration',
            week: week.week,
            change: durationChange,
            message: `Pipeline duration ${durationChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(durationChange * 100).toFixed(0)}%`,
            severity: Math.abs(durationChange) > 1 ? 'high' : 'medium',
          });
        }

        // Success rate anomaly
        const successRateChange = week.success_rate - week.prev_week_success_rate;
        if (Math.abs(successRateChange) > 20) {
          anomalies.push({
            type: 'success_rate',
            week: week.week,
            change: successRateChange,
            message: `Success rate ${successRateChange < 0 ? 'dropped' : 'improved'} by ${Math.abs(successRateChange).toFixed(0)}%`,
            severity: successRateChange < -30 ? 'high' : 'medium',
          });
        }
      }
    });

    return anomalies;
  }
}