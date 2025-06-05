import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface CommandInputProps {
  onSubmit: (command: string) => void;
  isLoading: boolean;
}

const CommandInput: React.FC<CommandInputProps> = ({ onSubmit, isLoading }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input.trim());
      setInput('');
    }
  };

  const suggestions = [
    { icon: '▶', text: 'deploy to staging', description: 'Deploy current branch' },
    { icon: '◉', text: 'check pipeline status', description: 'View latest pipeline' },
    { icon: '↻', text: 'show recent pipelines', description: 'List recent runs' },
    { icon: '►', text: 'deploy main to production', description: 'Production deploy' },
  ];

  return (
    <form onSubmit={handleSubmit} className="p-3">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-center bg-gray-900 border border-gray-800 rounded-xl overflow-hidden focus-within:border-gray-700">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading}
            placeholder="Type a command or ask for help..."
            className="flex-1 px-4 py-3 bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CommandInput;