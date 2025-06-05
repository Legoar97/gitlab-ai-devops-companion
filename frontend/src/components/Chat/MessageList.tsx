import React from 'react';
import { Message } from '../../types';
import MessageItem from './MessageItem';
import Loader from '../Common/Loader';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
              <Loader />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;