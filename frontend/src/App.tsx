import React from 'react';
import { Chat } from './components/Chat';

const App: React.FC = () => {
  return (
    <div className="min-h-[100dvh] w-full flex items-stretch md:items-center justify-center p-0 md:p-6 safe-pad select-none">
      <Chat />
    </div>
  );
};

export default App;
