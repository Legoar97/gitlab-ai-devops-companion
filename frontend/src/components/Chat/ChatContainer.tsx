import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, Project } from '../../types';
import MessageList from './MessageList';
import CommandInput from './CommandInput';
import api from '../../services/api';

interface ChatContainerProps {
  project?: Project;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ project }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      type: 'system',
      content: 'Welcome to GitLab AI DevOps Assistant. I can help you manage pipelines, deployments, and more.',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleCommand = useCallback(
    async (command: string) => {
      // Add user message
      const userMessage: Message = {
        id: uuidv4(),
        type: 'user',
        content: command,
        timestamp: new Date(),
      };
      addMessage(userMessage);

      setIsLoading(true);

      try {
        // Process command
        const response = await api.processCommand(
          command,
          project?.path || 'Legoar97-group/test-ai-companion'
        );

        // Add assistant response
        const assistantMessage: Message = {
          id: uuidv4(),
          type: 'assistant',
          content: response.message,
          timestamp: new Date(),
          metadata: {
            intent: response.intent,
            action: response.action,
            executed: response.executed,
            projectPath: project?.path,
          },
        };

        // Parse data if it contains pipeline info
        if (response.data) {
          try {
            const pipelineData = JSON.parse(response.data);
            if (pipelineData.pipeline) {
              assistantMessage.metadata!.pipelineUrl = pipelineData.pipeline.webUrl;
            }
          } catch (e) {
            // Data might not be JSON
          }
        }

        addMessage(assistantMessage);

        // If it was a deployment, check status after a delay
        if (response.intent === 'DEPLOY_REQUEST' && response.executed) {
          setTimeout(async () => {
            try {
              const pipeline = await api.getPipelineStatus(
                project?.path || 'Legoar97-group/test-ai-companion'
              );
              if (pipeline) {
                const statusMessage: Message = {
                  id: uuidv4(),
                  type: 'system',
                  content: `Pipeline ${pipeline.iid} is ${pipeline.status}`,
                  timestamp: new Date(),
                  metadata: {
                    status: pipeline.status,
                    pipelineUrl: pipeline.webUrl,
                  },
                };
                addMessage(statusMessage);
              }
            } catch (error) {
              console.error('Error checking pipeline status:', error);
            }
          }, 5000);
        }
      } catch (error: any) {
        const errorMessage: Message = {
          id: uuidv4(),
          type: 'error',
          content: error.message || 'An error occurred while processing your command.',
          timestamp: new Date(),
        };
        addMessage(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [project]
  );

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="hidden lg:flex w-80 bg-[#0d1117] border-r border-gray-800 flex-col">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { icon: '▶', label: 'Deploy to Production', command: 'deploy to production' },
              { icon: '◉', label: 'Pipeline Status', command: 'check pipeline status' },
              { icon: '↻', label: 'Recent Pipelines', command: 'show recent pipelines' },
              { icon: '⚡', label: 'Optimize Pipeline', command: 'optimize my pipeline' },
            ].map((action, index) => (
              <button
                key={index}
                onClick={() => handleCommand(action.command)}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-900 hover:bg-gray-800 rounded-lg transition-all duration-200 group"
              >
                <span className="text-lg text-gray-500 group-hover:text-white">{action.icon}</span>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-500">No recent activity</div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <MessageList messages={messages} isLoading={isLoading} />
          <div ref={messagesEndRef} />
        </div>
        <div className="bg-[#0d1117] border-t border-gray-800">
          <CommandInput onSubmit={handleCommand} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;