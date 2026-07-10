import React from 'react';
import { Chat } from './components/Chat';

const App: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-6 select-none">
      <Chat />
    </div>
  );
};

export default App;
