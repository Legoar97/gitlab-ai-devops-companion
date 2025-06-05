import React from 'react';
import { Message } from '../../types';
import { format } from 'date-fns';
import clsx from 'clsx';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.type === 'user';
  const isError = message.type === 'error';
  const isSystem = message.type === 'system';

  const messageClasses = clsx(
    'relative px-4 py-3 rounded-xl shadow-sm transition-all duration-200',
    {
      'bg-blue-600 text-white ml-auto': isUser,
      'bg-gray-900 text-gray-100 border border-gray-800': message.type === 'assistant',
      'bg-red-950 text-red-400 border border-red-900': isError,
      'bg-blue-950 text-blue-400 border border-blue-900': isSystem,
    }
  );

  const wrapperClasses = clsx('flex', {
    'justify-end': isUser,
    'justify-start': !isUser,
  });

  const renderMetadata = () => {
    if (!message.metadata) return null;

    const { intent, pipelineUrl, status } = message.metadata;

    return (
      <div className="mt-4 space-y-2">
        {intent && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Intent:</span>
            <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded-md text-blue-300">{intent}</span>
          </div>
        )}
        {status && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Status:</span>
            <span
              className={clsx('text-xs font-mono px-2 py-1 rounded-md', {
                'bg-green-950 text-green-400': status === 'success',
                'bg-yellow-950 text-yellow-400': status === 'running' || status === 'pending',
                'bg-red-950 text-red-400': status === 'failed',
                'bg-gray-800 text-gray-400': status === 'canceled' || status === 'skipped',
              })}
            >
              {status}
            </span>
          </div>
        )}
        {pipelineUrl && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Pipeline:</span>
            <a
              href={pipelineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 underline decoration-dotted underline-offset-2 transition-colors"
            >
              View on GitLab →
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={wrapperClasses}>
      <div className={clsx('max-w-xl space-y-2', { 'order-2': isUser })}>
        <div className={messageClasses}>
          {!isUser && (
            <div className="absolute -left-2 -top-2 p-1.5 bg-gray-800 rounded-lg border border-gray-700">
              {isError ? (
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : isSystem ? (
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
            </div>
          )}
          <div className="whitespace-pre-wrap break-words leading-relaxed text-sm">{message.content}</div>
          {!isUser && renderMetadata()}
        </div>
        <div
          className={clsx('text-xs text-gray-500 px-2', {
            'text-right': isUser,
            'text-left': !isUser,
          })}
        >
          {format(message.timestamp, 'HH:mm')}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;