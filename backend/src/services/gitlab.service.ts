import { GraphQLClient } from 'graphql-request';
import { gql } from 'graphql-tag';
import axios from 'axios';

// --- Definición de Interfaces para la respuesta de GetProjectPipelines ---
interface JobStage {
  name: string;
}

interface JobNode {
  id: string;
  name: string;
  status: string;
  duration: number | null;
  stage: JobStage;
}

interface User {
  name: string;
  username: string;
}

interface Commit {
  sha: string;
  title: string;
  message: string;
}

interface PipelineNode {
  id: string;
  iid: string; // Asumiendo que iid es un string como usualmente es en IDs de GitLab
  status: string;
  duration: number | null;
  createdAt: string;
  finishedAt: string | null;
  webUrl: string;
  jobs?: {
    nodes: JobNode[];
  };
  user?: User | null;
  commit?: Commit | null;
}

interface ProjectPipelinesData {
  id: string;
  name: string;
  description: string | null;
  webUrl: string;
  pipelines?: {
    nodes: PipelineNode[];
  };
}

interface GetProjectPipelinesGQLResponse {
  project: ProjectPipelinesData;
}
// --- Fin de Definición de Interfaces ---


export class GitLabService {
  private graphqlClient: GraphQLClient;
  private apiClient: any; // Considera tipar esto también si es posible
  private gitlabUrl: string;
  private token: string;

  constructor() {
    this.token = process.env.GITLAB_TOKEN || ''; //
    this.gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com'; //
    
    // Cliente GraphQL
    this.graphqlClient = new GraphQLClient(`${this.gitlabUrl}/api/graphql`, { //
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    // Cliente REST API
    this.apiClient = axios.create({ //
      baseURL: `${this.gitlabUrl}/api/v4`, //
      headers: {
        'PRIVATE-TOKEN': this.token,
      },
    });
  }

  // Obtener proyecto por path
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

  // Obtener pipelines reales del proyecto
  async getProjectPipelines(projectPath: string): Promise<ProjectPipelinesData> { //
    const query = gql`
      query GetProjectPipelines($projectPath: ID!) {
        project(fullPath: $projectPath) {
          id
          name
          description
          webUrl
          pipelines(first: 10) {
            nodes {
              id
              iid
              status
              duration
              createdAt
              finishedAt
              webUrl
              jobs {
                nodes {
                  id
                  name
                  status
                  duration
                  stage {
                    name
                  }
                }
              }
              user {
                name
                username
              }
              commit {
                sha
                title
                message
              }
            }
          }
        }
      }
    `; //

    try {
      // Especifica el tipo de respuesta para el método request
      const data = await this.graphqlClient.request<GetProjectPipelinesGQLResponse>(query, { projectPath }); //
      return data.project; // Ahora 'data' está tipado y 'data.project' es accesible de forma segura //
    } catch (error) {
      console.error('GitLab GraphQL error:', error); //
      throw error; //
    }
  }

  // Obtener un pipeline específico
  async getPipeline(projectPath: string, pipelineId: string) {
    try {
      const project = await this.getProject(projectPath);
      const response = await this.apiClient.get(
        `/projects/${project.id}/pipelines/${pipelineId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting pipeline:', error.response?.data || error.message);
      throw error;
    }
  }

  // Obtener el último pipeline status
  async getPipelineStatus(projectPath: string) {
    try {
      const project = await this.getProject(projectPath);
      const response = await this.apiClient.get(
        `/projects/${project.id}/pipelines`,
        { params: { per_page: 1 } }
      );
      
      if (response.data.length > 0) {
        const latestPipeline = response.data[0];
        return {
          status: latestPipeline.status,
          message: `Latest pipeline ${latestPipeline.id} is ${latestPipeline.status}`,
          pipeline: latestPipeline
        };
      }
      
      return {
        status: 'no_pipelines',
        message: 'No pipelines found for this project'
      };
    } catch (error: any) {
      console.error('Error getting pipeline status:', error.response?.data || error.message);
      throw error;
    }
  }

  // IMPORTANTE: Trigger pipeline REAL
  async triggerPipeline(projectPath: string, ref: string = 'main', variables?: any) { //
    try {
      console.log(`🚀 Triggering REAL pipeline for ${projectPath} on ${ref}`);
      
      const project = await this.getProject(projectPath);
      
      const pipelineVariables = [];
      if (variables) {
        for (const [key, value] of Object.entries(variables)) {
          pipelineVariables.push({
            key: key,
            value: String(value),
            variable_type: 'env_var'
          });
        }
      }

      const response = await this.apiClient.post( //
        `/projects/${project.id}/pipeline`,
        {
          ref: ref,
          variables: pipelineVariables
        }
      );

      const pipeline = response.data;
      console.log(`✅ Pipeline triggered successfully: ${pipeline.web_url}`);

      return {
        pipeline: {
          id: pipeline.id,
          iid: pipeline.iid,
          status: pipeline.status,
          webUrl: pipeline.web_url,
          ref: pipeline.ref,
          createdAt: pipeline.created_at
        },
        errors: []
      };
    } catch (error: any) {
      console.error('Error triggering pipeline:', error.response?.data || error.message); //
      
      if (error.response?.status === 400) { //
        return {
          pipeline: null,
          errors: ['Bad request: ' + (error.response.data.message || 'Invalid parameters')]
        };
      } else if (error.response?.status === 401) { //
        return {
          pipeline: null,
          errors: ['Authentication failed: Invalid GitLab token']
        };
      } else if (error.response?.status === 404) { //
        return {
          pipeline: null,
          errors: [`Project not found: ${projectPath}`]
        };
      }
      
      throw error; //
    }
  }

  // Obtener branches del proyecto
  async getProjectBranches(projectPath: string) {
    try {
      const project = await this.getProject(projectPath);
      const response = await this.apiClient.get(
        `/projects/${project.id}/repository/branches`,
        { params: { per_page: 100 } }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting branches:', error.response?.data || error.message);
      throw error;
    }
  }

  // Crear un merge request
  async createMergeRequest(
    projectPath: string, 
    sourceBranch: string, 
    targetBranch: string = 'main',
    title?: string,
    description?: string
  ) {
    try {
      const project = await this.getProject(projectPath);
      
      const response = await this.apiClient.post(
        `/projects/${project.id}/merge_requests`,
        {
          source_branch: sourceBranch,
          target_branch: targetBranch,
          title: title || `Merge ${sourceBranch} into ${targetBranch}`,
          description: description || 'Created by GitLab AI DevOps Companion',
          remove_source_branch: true
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error creating merge request:', error.response?.data || error.message);
      throw error;
    }
  }

  // Obtener jobs de un pipeline
  async getPipelineJobs(projectPath: string, pipelineId: string) {
    try {
      const project = await this.getProject(projectPath);
      const response = await this.apiClient.get(
        `/projects/${project.id}/pipelines/${pipelineId}/jobs`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting pipeline jobs:', error.response?.data || error.message);
      throw error;
    }
  }

  // Retry un job fallido
  async retryJob(projectPath: string, jobId: string) {
    try {
      const project = await this.getProject(projectPath);
      const response = await this.apiClient.post(
        `/projects/${project.id}/jobs/${jobId}/retry`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error retrying job:', error.response?.data || error.message);
      throw error;
    }
  }

  // Cancelar un pipeline
  async cancelPipeline(projectPath: string, pipelineId: string) {
    try {
      const project = await this.getProject(projectPath);
      const response = await this.apiClient.post(
        `/projects/${project.id}/pipelines/${pipelineId}/cancel`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error canceling pipeline:', error.response?.data || error.message);
      throw error;
    }
  }
}