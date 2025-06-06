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
  iid: string;
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
  private apiClient: any;
  private gitlabUrl: string;
  private token: string;

  constructor() {
    this.token = process.env.GITLAB_TOKEN || '';
    this.gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com';
    
    // Cliente GraphQL
    this.graphqlClient = new GraphQLClient(`${this.gitlabUrl}/api/graphql`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    // Cliente REST API
    this.apiClient = axios.create({
      baseURL: `${this.gitlabUrl}/api/v4`,
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
  async getProjectPipelines(projectPath: string): Promise<ProjectPipelinesData> {
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
    `;

    try {
      const data = await this.graphqlClient.request<GetProjectPipelinesGQLResponse>(query, { projectPath });
      return data.project;
    } catch (error) {
      console.error('GitLab GraphQL error:', error);
      throw error;
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

  // Verificar estado de CI/CD del proyecto
  async verifyProjectCICD(projectPath: string) {
    try {
      console.log(`Verifying CI/CD for ${projectPath}...`);
      
      const project = await this.getProject(projectPath);
      
      // En GitLab moderno, verificamos si podemos acceder a pipelines
      let cicdEnabled = false;
      try {
        const pipelines = await this.apiClient.get(
          `/projects/${project.id}/pipelines`,
          { params: { per_page: 1 } }
        );
        cicdEnabled = true; // Si no da error, CI/CD está habilitado
        console.log(`Existing pipelines: ${pipelines.data.length}`);
        if (pipelines.data.length > 0) {
          console.log('Last pipeline:', {
            id: pipelines.data[0].id,
            status: pipelines.data[0].status,
            ref: pipelines.data[0].ref,
            created_at: pipelines.data[0].created_at
          });
        }
      } catch (e: any) {
        if (e.response?.status === 404) {
          cicdEnabled = false;
        }
      }
      
      console.log(`
Project CI/CD Status:
- Project ID: ${project.id}
- Name: ${project.name}
- Default Branch: ${project.default_branch}
- CI/CD Enabled: ${cicdEnabled ? 'YES' : 'NO'}
- Visibility: ${project.visibility}
      `);
      
      // Verificar si existe .gitlab-ci.yml
      try {
        await this.apiClient.get(
          `/projects/${project.id}/repository/files/${encodeURIComponent('.gitlab-ci.yml')}`,
          { params: { ref: project.default_branch } }
        );
        console.log('.gitlab-ci.yml exists');
      } catch (e: any) {
        console.error('.gitlab-ci.yml NOT FOUND');
      }
      
      return { ...project, ci_enabled: cicdEnabled };
    } catch (error: any) {
      console.error('Error verifying project:', error.message);
      throw error;
    }
  }

  // Habilitar CI/CD si está deshabilitado
  async enableCICD(projectPath: string) {
    try {
      const project = await this.getProject(projectPath);
      
      console.log('Attempting to enable CI/CD for the project...');
      
      // Intentar actualizar el proyecto con CI/CD habilitado
      const response = await this.apiClient.put(
        `/projects/${project.id}`,
        {
          builds_enabled: true,
          jobs_enabled: true,
          shared_runners_enabled: true
        }
      );
      
      console.log('CI/CD enable request sent');
      return response.data;
    } catch (error: any) {
      console.error('Error enabling CI/CD:', error.response?.data || error.message);
      // No lanzar error, continuar de todos modos
      return null;
    }
  }

  // IMPORTANTE: Trigger pipeline REAL - VERSIÓN FUNCIONANDO
  async triggerPipeline(projectPath: string, ref: string = 'main', variables?: any) {
    try {
      console.log(`Triggering REAL pipeline for ${projectPath} on ${ref}`);
      
      const project = await this.getProject(projectPath);
      console.log(`Project ID: ${project.id}`);
      console.log(`Project URL: ${project.web_url}`);
      console.log(`Default branch: ${project.default_branch}`);
      
      // Verificar si el branch existe
      try {
        await this.apiClient.get(
          `/projects/${project.id}/repository/branches/${ref}`
        );
        console.log(`Branch '${ref}' exists`);
      } catch (e: any) {
        if (e.response?.status === 404) {
          console.error(`Branch '${ref}' NOT FOUND!`);
          // Si el branch no existe, usar el default
          ref = project.default_branch;
          console.log(`Switching to default branch: ${ref}`);
        }
      }
      
      // Preparar el body del request
      const requestBody: any = {
        ref: ref
      };
      
      // Agregar variables si existen
      if (variables && Object.keys(variables).length > 0) {
        const pipelineVariables: Array<{key: string, value: string}> = [];
        for (const [key, value] of Object.entries(variables)) {
          pipelineVariables.push({
            key: key,
            value: String(value)
          });
        }
        requestBody.variables = pipelineVariables;
        console.log(`Variables:`, pipelineVariables);
      }
      
      console.log(`Request body:`, JSON.stringify(requestBody, null, 2));
      
      // USAR EL ENDPOINT CORRECTO: /pipeline (singular) no /pipelines (plural)
      const response = await this.apiClient.post(
        `/projects/${project.id}/pipeline`,
        requestBody
      );

      const pipeline = response.data;
      console.log(`Pipeline triggered successfully: ${pipeline.web_url}`);

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
      console.error('Pipeline trigger error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      let errorMessage = 'Unknown error';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      }
      
      return {
        pipeline: null,
        errors: [`Failed to trigger pipeline (${error.response?.status}): ${errorMessage}`]
      };
    }
  }

  // Método alternativo usando trigger token
  async triggerPipelineWithToken(projectPath: string, ref: string = 'main', variables?: any) {
    try {
      const project = await this.getProject(projectPath);
      const triggerToken = process.env.GITLAB_TRIGGER_TOKEN;
      
      if (!triggerToken) {
        throw new Error('GITLAB_TRIGGER_TOKEN not configured');
      }
      
      // Preparar variables para trigger endpoint
      const params: any = {
        token: triggerToken,
        ref: ref
      };
      
      // Agregar variables como parámetros
      if (variables) {
        for (const [key, value] of Object.entries(variables)) {
          params[`variables[${key}]`] = String(value);
        }
      }
      
      console.log('Using trigger token method');
      
      const response = await axios.post(
        `${this.gitlabUrl}/api/v4/projects/${project.id}/trigger/pipeline`,
        null,
        { params }
      );
      
      return {
        pipeline: response.data,
        errors: []
      };
    } catch (error: any) {
      console.error('Trigger token method failed:', error.response?.data);
      throw error;
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

  // Obtener métricas de pipelines
  async getPipelineMetrics(projectPath: string, timeRange: string = 'last_7_days') {
    try {
      const project = await this.getProject(projectPath);
      
      // Calcular fechas según el rango
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'last_7_days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'last_30_days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }
      
      // Obtener pipelines en el rango
      const response = await this.apiClient.get(
        `/projects/${project.id}/pipelines`,
        {
          params: {
            per_page: 100,
            updated_after: startDate.toISOString(),
            updated_before: endDate.toISOString()
          }
        }
      );
      
      const pipelines = response.data;
      
      // Calcular métricas
      const totalRuns = pipelines.length;
      const successfulRuns = pipelines.filter((p: any) => p.status === 'success').length;
      const failedRuns = pipelines.filter((p: any) => p.status === 'failed').length;
      const durations = pipelines
        .filter((p: any) => p.duration)
        .map((p: any) => p.duration);
      
      const avgDuration = durations.length > 0
        ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length / 60)
        : 0;
      
      return {
        totalRuns,
        successfulRuns,
        failedRuns,
        successRate: totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0,
        avgDuration,
        pipelines
      };
    } catch (error: any) {
      console.error('Error getting pipeline metrics:', error.response?.data || error.message);
      throw error;
    }
  }

  // Obtener el último job fallido
  async getLastFailedJob(projectPath: string) {
    try {
      const project = await this.getProject(projectPath);
      
      // Obtener pipelines recientes
      const pipelinesResponse = await this.apiClient.get(
        `/projects/${project.id}/pipelines`,
        { params: { per_page: 10 } }
      );
      
      // Buscar jobs fallidos
      for (const pipeline of pipelinesResponse.data) {
        const jobsResponse = await this.apiClient.get(
          `/projects/${project.id}/pipelines/${pipeline.id}/jobs`,
          { params: { scope: ['failed'] } }
        );
        
        if (jobsResponse.data.length > 0) {
          const failedJob = jobsResponse.data[0];
          
          // Obtener el log del job
          const logResponse = await this.apiClient.get(
            `/projects/${project.id}/jobs/${failedJob.id}/trace`
          );
          
          return {
            id: failedJob.id,
            name: failedJob.name,
            stage: failedJob.stage,
            status: failedJob.status,
            failureReason: failedJob.failure_reason,
            log: logResponse.data,
            config: {
              script: failedJob.script,
              image: failedJob.image,
              tags: failedJob.tags
            }
          };
        }
      }
      
      return null;
    } catch (error: any) {
      console.error('Error getting last failed job:', error.response?.data || error.message);
      throw error;
    }
  }
}