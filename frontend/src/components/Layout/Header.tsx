import React, { useState } from 'react';
import { Project } from '../../types';

interface HeaderProps {
  project?: Project;
  onProjectChange?: (project: Project) => void;
}

const Header: React.FC<HeaderProps> = ({ project, onProjectChange }) => {
  const [showProjectInput, setShowProjectInput] = useState(false);
  const [projectPath, setProjectPath] = useState('');

  const handleProjectChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectPath.trim() && onProjectChange) {
      // Parse the project path
      const parts = projectPath.trim().split('/');
      if (parts.length >= 2) {
        onProjectChange({
          id: 'temp-id', // This would be fetched from GitLab
          name: parts[parts.length - 1],
          path: projectPath.trim(),
          webUrl: `https://gitlab.com/${projectPath.trim()}`,
          defaultBranch: 'main',
        });
        setShowProjectInput(false);
        setProjectPath('');
      }
    }
  };

  return (
    <header className="bg-[#0d1117] border-b border-gray-800">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-white">GitLab AI</h1>
            </div>
            
            {/* Project Selector */}
            {project && !showProjectInput ? (
              <button
                onClick={() => setShowProjectInput(true)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-sm text-gray-300">{project.path}</span>
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            ) : showProjectInput ? (
              <form onSubmit={handleProjectChange} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  placeholder="owner/repository"
                  className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-600"
                  autoFocus
                />
                <button
                  type="submit"
                  className="p-1.5 text-green-400 hover:text-green-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProjectInput(false);
                    setProjectPath('');
                  }}
                  className="p-1.5 text-red-400 hover:text-red-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </form>
            ) : null}
          </div>
          
          {/* Status */}
          <div className="flex items-center space-x-2 px-2.5 py-1 bg-gray-900 rounded-lg">
            <div className="relative">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            </div>
            <span className="text-xs font-medium text-green-400">Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;