import React, { useState } from 'react';
import Header from './components/Layout/Header';
import ChatContainer from './components/Chat/ChatContainer';
import { Project } from './types';

function App() {
  const [project, setProject] = useState<Project>({
    id: '70539642',
    name: 'Test AI Companion',
    path: 'Legoar97-group/test-ai-companion',
    webUrl: 'https://gitlab.com/Legoar97-group/test-ai-companion',
    defaultBranch: 'main',
  });

  return (
    <div className="h-screen bg-[#111826] text-white overflow-hidden">
      <div className="h-full flex flex-col">
        <Header project={project} onProjectChange={setProject} />
        <main className="flex-1 overflow-hidden">
          <ChatContainer project={project} />
        </main>
      </div>
    </div>
  );
}

export default App;