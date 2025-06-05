import React from 'react';
import { AuthService } from '../../services/auth';

const Login: React.FC = () => {
  const handleLogin = async () => {
    try {
      const authUrl = await AuthService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to get auth URL:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#111826] flex items-center justify-center">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <div className="bg-blue-600 p-4 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">GitLab AI DevOps</h1>
          <p className="text-gray-400">Sign in to manage your pipelines with AI</p>
        </div>

        <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-8">
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
            </svg>
            <span>Sign in with GitLab</span>
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              By signing in, you authorize this app to access your GitLab account
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This app requires the following permissions:</p>
          <ul className="mt-2 space-y-1">
            <li>Read your profile information</li>
            <li>Access your repositories</li>
            <li>Create and manage pipelines</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;