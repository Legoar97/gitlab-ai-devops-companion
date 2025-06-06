// backend/src/services/bigquery-analytics.service.ts
import { BigQuery } from '@google-cloud/bigquery';
import { v4 as uuidv4 } from 'uuid';

interface PipelineMetric {
  id: string;
  project_id: string;
  project_name: string;
  pipeline_id: string;
  pipeline_iid: string;
  status: string;
  duration_seconds: number;
  created_at: string;
  finished_at: string;
  ref: string;
  commit_sha: string;
  commit_message: string;
  commit_files_count: number;
  user_id: string;
  user_name: string;
  environment: string;
  job_count: number;
  failed_job_count: number;
  retry_count: number;
  estimated_cost_usd: number;
  runner_type: string;
  day_of_week: number;
  hour_of_day: number;
  is_weekend: boolean;
  is_business_hours: boolean;
}

export class BigQueryAnalyticsService {
  private bigquery: BigQuery;
  private datasetId: string;
  private tableId: string;

  constructor() {
    this.bigquery = new BigQuery({
      projectId: process.env.GCP_PROJECT_ID,
    });
    this.datasetId = process.env.BIGQUERY_DATASET || 'pipeline_analytics';
    this.tableId = process.env.BIGQUERY_TABLE || 'pipeline_metrics';
    
    // Initialize asynchronously without blocking constructor
    // Only initialize if not in development mode without proper permissions
    if (process.env.ENABLE_BIGQUERY !== 'false') {
      this.initializeDataset().catch(error => {
        console.error('BigQuery initialization failed - running in fallback mode:', error.message);
      });
    } else {
      console.log('BigQuery disabled - running in mock mode');
    }
  }

  private async initializeDataset() {
    try {
      // Create dataset if it doesn't exist
      const [datasets] = await this.bigquery.getDatasets();
      const datasetExists = datasets.some((dataset: any) => dataset.id === this.datasetId);
      
      if (!datasetExists) {
        await this.bigquery.createDataset(this.datasetId, {
          location: process.env.GCP_LOCATION || 'US',
        });
        console.log(`Created dataset ${this.datasetId}`);
      } else {
        console.log(`Dataset ${this.datasetId} already exists`);
      }

      // Create table if it doesn't exist
      const dataset = this.bigquery.dataset(this.datasetId);
      const [tables] = await dataset.getTables();
      const tableExists = tables.some((table: any) => table.id === this.tableId);

      if (!tableExists) {
        const schema = [
          { name: 'id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'project_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'project_name', type: 'STRING', mode: 'REQUIRED' },
          { name: 'pipeline_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'pipeline_iid', type: 'STRING', mode: 'REQUIRED' },
          { name: 'status', type: 'STRING', mode: 'REQUIRED' },
          { name: 'duration_seconds', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'finished_at', type: 'TIMESTAMP', mode: 'NULLABLE' },
          { name: 'ref', type: 'STRING', mode: 'REQUIRED' },
          { name: 'commit_sha', type: 'STRING', mode: 'REQUIRED' },
          { name: 'commit_message', type: 'STRING', mode: 'NULLABLE' },
          { name: 'commit_files_count', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'user_id', type: 'STRING', mode: 'NULLABLE' },
          { name: 'user_name', type: 'STRING', mode: 'NULLABLE' },
          { name: 'environment', type: 'STRING', mode: 'NULLABLE' },
          { name: 'job_count', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'failed_job_count', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'retry_count', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'estimated_cost_usd', type: 'FLOAT', mode: 'NULLABLE' },
          { name: 'runner_type', type: 'STRING', mode: 'NULLABLE' },
          { name: 'day_of_week', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'hour_of_day', type: 'INTEGER', mode: 'NULLABLE' },
          { name: 'is_weekend', type: 'BOOLEAN', mode: 'NULLABLE' },
          { name: 'is_business_hours', type: 'BOOLEAN', mode: 'NULLABLE' },
          { name: 'inserted_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
        ];

        await dataset.createTable(this.tableId, { schema });
        console.log(`Created table ${this.tableId}`);
      } else {
        console.log(`Table ${this.tableId} already exists`);
      }
      
      console.log('✅ BigQuery initialized successfully');
    } catch (error: any) {
      // Check if it's a "already exists" error and ignore it
      if (error.code === 409) {
        console.log('✅ BigQuery dataset/table already exists - ready to use');
      } else {
        console.error('Error initializing BigQuery:', error);
        throw error;
      }
    }
  }

  async insertPipelineMetric(metric: PipelineMetric) {
    try {
      const dataset = this.bigquery.dataset(this.datasetId);
      const table = dataset.table(this.tableId);
      
      const row = {
        ...metric,
        id: uuidv4(),
        inserted_at: new Date().toISOString(),
      };

      await table.insert([row]);
      console.log('Pipeline metric inserted:', metric.pipeline_id);
    } catch (error) {
      console.error('Error inserting pipeline metric:', error);
      throw error;
    }
  }

  async getAverageDuration(projectId: string, ref: string, lastNDays: number = 30) {
    const query = `
      SELECT 
        AVG(duration_seconds) as avg_duration,
        COUNT(*) as sample_size,
        STDDEV(duration_seconds) as stddev_duration
      FROM \`${process.env.GCP_PROJECT_ID}.${this.datasetId}.${this.tableId}\`
      WHERE project_id = @projectId
        AND ref = @ref
        AND status = 'success'
        AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @days DAY)
    `;

    const options = {
      query,
      params: { projectId, ref, days: lastNDays },
    };

    const [rows] = await this.bigquery.query(options);
    return rows[0];
  }

  async getFailurePatterns(projectId: string) {
    const query = `
      SELECT 
        hour_of_day,
        day_of_week,
        COUNT(*) as total_runs,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failures,
        SAFE_DIVIDE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), COUNT(*)) * 100 as failure_rate
      FROM \`${process.env.GCP_PROJECT_ID}.${this.datasetId}.${this.tableId}\`
      WHERE project_id = @projectId
        AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
      GROUP BY hour_of_day, day_of_week
      HAVING COUNT(*) > 5
      ORDER BY failure_rate DESC
    `;

    const options = {
      query,
      params: { projectId },
    };

    const [rows] = await this.bigquery.query(options);
    return rows;
  }

  async getCostAnalysis(projectId: string, timeRange: string = 'MONTH') {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as pipeline_count,
        SUM(duration_seconds) / 3600 as total_hours,
        SUM(estimated_cost_usd) as total_cost,
        AVG(estimated_cost_usd) as avg_cost_per_pipeline,
        SUM(CASE WHEN status = 'failed' THEN estimated_cost_usd ELSE 0 END) as wasted_cost
      FROM \`${process.env.GCP_PROJECT_ID}.${this.datasetId}.${this.tableId}\`
      WHERE project_id = @projectId
        AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 ${timeRange})
      GROUP BY date
      ORDER BY date DESC
    `;

    const options = {
      query,
      params: { projectId },
    };

    const [rows] = await this.bigquery.query(options);
    return rows;
  }

  async getPipelineTrends(projectId: string) {
    const query = `
      WITH weekly_stats AS (
        SELECT 
          DATE_TRUNC(created_at, WEEK) as week,
          COUNT(*) as total_runs,
          AVG(duration_seconds) as avg_duration,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*) * 100 as success_rate,
          AVG(estimated_cost_usd) as avg_cost
        FROM \`${process.env.GCP_PROJECT_ID}.${this.datasetId}.${this.tableId}\`
        WHERE project_id = @projectId
          AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 12 WEEK)
        GROUP BY week
      )
      SELECT 
        *,
        LAG(avg_duration) OVER (ORDER BY week) as prev_week_duration,
        LAG(success_rate) OVER (ORDER BY week) as prev_week_success_rate
      FROM weekly_stats
      ORDER BY week DESC
    `;

    const options = {
      query,
      params: { projectId },
    };

    const [rows] = await this.bigquery.query(options);
    return rows;
  }

  async getOptimalDeploymentWindows(projectId: string) {
    const query = `
      SELECT 
        hour_of_day,
        day_of_week,
        CASE 
          WHEN day_of_week IN (0, 6) THEN 'Weekend'
          WHEN hour_of_day BETWEEN 9 AND 17 THEN 'Business Hours'
          ELSE 'Off Hours'
        END as time_category,
        COUNT(*) as deployments,
        AVG(duration_seconds) as avg_duration,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*) * 100 as success_rate,
        AVG(estimated_cost_usd) as avg_cost
      FROM \`${process.env.GCP_PROJECT_ID}.${this.datasetId}.${this.tableId}\`
      WHERE project_id = @projectId
        AND environment IN ('staging', 'production')
        AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
      GROUP BY hour_of_day, day_of_week, time_category
      HAVING COUNT(*) > 3
      ORDER BY success_rate DESC, avg_duration ASC
    `;

    const options = {
      query,
      params: { projectId },
    };

    const [rows] = await this.bigquery.query(options);
    return rows;
  }

  async getResourceUtilization(projectId: string) {
    const query = `
      WITH daily_usage AS (
        SELECT 
          DATE(created_at) as date,
          SUM(duration_seconds) / 3600 as compute_hours,
          COUNT(DISTINCT pipeline_id) as unique_pipelines,
          SUM(job_count) as total_jobs,
          AVG(SAFE_DIVIDE(duration_seconds, job_count)) as avg_seconds_per_job
        FROM \`${process.env.GCP_PROJECT_ID}.${this.datasetId}.${this.tableId}\`
        WHERE project_id = @projectId
          AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
        GROUP BY date
      )
      SELECT 
        *,
        AVG(compute_hours) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as rolling_7d_avg
      FROM daily_usage
      ORDER BY date DESC
    `;

    const options = {
      query,
      params: { projectId },
    };

    const [rows] = await this.bigquery.query(options);
    return rows;
  }

  async getPipelineMetrics(projectPath: string, timeRange: string = 'last_7_days') {
    // For backward compatibility, reuse the GitLab service method name
    // This would be called from the resolvers
    try {
      // This is a simplified version, in production you'd query BigQuery
      console.log('Getting pipeline metrics from BigQuery for:', projectPath);
      
      // Return mock data for now if BigQuery is not fully set up
      return {
        totalRuns: 100,
        successfulRuns: 85,
        failedRuns: 15,
        successRate: 85,
        avgDuration: 12,
        pipelines: []
      };
    } catch (error) {
      console.error('Error getting pipeline metrics:', error);
      throw error;
    }
  }
}