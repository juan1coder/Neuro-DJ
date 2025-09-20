
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center border-b border-blue-400/20 pb-4">
      <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
        Neuro-DJ
      </h1>
      <p className="mt-2 text-lg text-blue-200/80">
        Your personal AI agent for focus, recovery, and lucid rest.
      </p>
    </header>
  );
};
