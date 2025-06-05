import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex space-x-1">
        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse animation-delay-200"></div>
        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse animation-delay-400"></div>
      </div>
      <span className="text-xs text-gray-400 animate-pulse">AI is thinking...</span>
    </div>
  );
};

export default Loader;