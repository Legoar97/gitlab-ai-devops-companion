// backend/src/scripts/sync-gitlab-data.ts
import dotenv from 'dotenv';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

class GitLabDataSync {
  private gitlabUrl: string;
  private token: string;
  private apiClient: any;

  constructor() {
    this.gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com';
    this.token = process.env.GITLAB_TOKEN || '';
    
    // Create our own axios instance
    this.apiClient = axios.create({
      baseURL: `${this.gitlabUrl}/api/v4`,
      headers: {
        'PRIVATE-TOKEN': this.token,
      },
    });
  }

  async getProject(projectPath: string) {
    try {
      const encodedPath = encodeURIComponent(projectPath);
      const response = await this.apiClient.get(`/projects/${encodedPath}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting project:', error.response?.data || error.message);
      throw new Error(`Project not found: ${projectPath}`);
    }
  }

  async syncProjectData(projectPath: string) {
    console.log(`🔄 Starting sync for project: ${projectPath}`);

    // Dynamic import for BigQuery service
    const { BigQueryAnalyticsService } = await import('../services/bigquery-analytics.service');
    const analytics = new BigQueryAnalyticsService();

    try {
      // Get project info
      const project = await this.getProject(projectPath);
      console.log(`✅ Found project: ${project.name} (ID: ${project.id})`);

      // Get pipelines (last 100)
      console.log('📊 Fetching pipelines...');
      const pipelines = await this.apiClient.get(
        `/projects/${project.id}/pipelines`,
        { params: { per_page: 100, order_by: 'id', sort: 'desc' } }
      );

      console.log(`Found ${pipelines.data.length} pipelines`);

      // Process each pipeline
      let successCount = 0;
      let errorCount = 0;

      for (const pipeline of pipelines.data) {
        try {
          console.log(`Processing pipeline #${pipeline.id}...`);

          // Get detailed pipeline info with jobs
          const detailedPipeline = await this.apiClient.get(
            `/projects/${project.id}/pipelines/${pipeline.id}`
          );

          // Get jobs for this pipeline
          const jobs = await this.apiClient.get(
            `/projects/${project.id}/pipelines/${pipeline.id}/jobs`
          );

          // Get commit details if available
          let commitDetails = {
            message: '',
            filesCount: 0
          };

          if (pipeline.sha) {
            try {
              const commit = await this.apiClient.get(
                `/projects/${project.id}/repository/commits/${pipeline.sha}`
              );
              commitDetails.message = commit.data.message || '';
              commitDetails.filesCount = commit.data.stats?.total || 0;
            } catch (e) {
              console.log('Could not fetch commit details');
            }
          }

          // Calculate metrics
          const createdAt = new Date(pipeline.created_at);
          const finishedAt = pipeline.finished_at ? new Date(pipeline.finished_at) : null;
          const duration = finishedAt ? (finishedAt.getTime() - createdAt.getTime()) / 1000 : 0;

          // Determine environment from ref
          let environment = 'development';
          if (pipeline.ref === 'main' || pipeline.ref === 'master') {
            environment = 'production';
          } else if (pipeline.ref === 'staging') {
            environment = 'staging';
          }

          // Count failed jobs
          const failedJobCount = jobs.data.filter((job: any) => job.status === 'failed').length;

          // Calculate estimated cost (simple model)
          const estimatedCost = this.calculatePipelineCost(duration, jobs.data.length);

          // Prepare metric for BigQuery - Note: id is generated in insertPipelineMetric
          const metric = {
            id: uuidv4(), // Add the required id field
            project_id: project.id.toString(),
            project_name: project.name,
            pipeline_id: pipeline.id.toString(),
            pipeline_iid: pipeline.id.toString(),
            status: pipeline.status,
            duration_seconds: Math.round(duration),
            created_at: pipeline.created_at,
            finished_at: pipeline.finished_at || pipeline.updated_at,
            ref: pipeline.ref,
            commit_sha: pipeline.sha,
            commit_message: commitDetails.message.substring(0, 500), // Limit length
            commit_files_count: commitDetails.filesCount,
            user_id: pipeline.user?.id?.toString() || '0',
            user_name: pipeline.user?.name || 'Unknown',
            environment,
            job_count: jobs.data.length,
            failed_job_count: failedJobCount,
            retry_count: 0, // Would need to track this separately
            estimated_cost_usd: estimatedCost,
            runner_type: 'shared', // Assuming shared runners
            day_of_week: createdAt.getDay(),
            hour_of_day: createdAt.getHours(),
            is_weekend: createdAt.getDay() === 0 || createdAt.getDay() === 6,
            is_business_hours: createdAt.getHours() >= 9 && createdAt.getHours() < 17,
          };

          // Insert into BigQuery
          await analytics.insertPipelineMetric(metric);
          successCount++;
          console.log(`✅ Inserted pipeline #${pipeline.id}`);

        } catch (error: any) {
          console.error(`❌ Error processing pipeline #${pipeline.id}:`, error.message);
          errorCount++;
        }

        // Add small delay to avoid rate limiting
        await this.sleep(500);
      }

      console.log(`
✨ Sync completed!
- Successfully imported: ${successCount} pipelines
- Errors: ${errorCount}
- Total processed: ${pipelines.data.length}
      `);

    } catch (error: any) {
      console.error('❌ Sync failed:', error.message);
      throw error;
    }
  }

  private calculatePipelineCost(durationSeconds: number, jobCount: number): number {
    // Simple cost model: $0.10 per compute hour + $0.01 per job
    const computeHours = durationSeconds / 3600;
    const computeCost = computeHours * 0.10;
    const jobCost = jobCount * 0.01;
    return parseFloat((computeCost + jobCost).toFixed(2));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the sync
async function main() {
  const sync = new GitLabDataSync();
  
  // Get project path from command line or use default
  const projectPath = process.argv[2] || 'Legoar97-group/test-ai-companion';
  
  console.log('🚀 GitLab to BigQuery Historical Data Sync');
  console.log('==========================================');
  
  await sync.syncProjectData(projectPath);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { GitLabDataSync };