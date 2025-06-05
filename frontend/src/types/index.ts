export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  intent?: string;
  action?: string;
  executed?: boolean;
  pipelineUrl?: string;
  projectPath?: string;
  duration?: number;
  status?: PipelineStatus;
}

export type PipelineStatus = 'pending' | 'running' | 'success' | 'failed' | 'canceled' | 'skipped';

export interface Pipeline {
  id: string;
  iid: string;
  status: PipelineStatus;
  webUrl: string;
  ref: string;
  createdAt: string;
  duration?: number;
  finishedAt?: string;
}

export interface CommandResponse {
  intent: string;
  action: string;
  message: string;
  data?: string;
  executed: boolean;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  webUrl: string;
  defaultBranch: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentProject?: Project;
  error?: string;
}