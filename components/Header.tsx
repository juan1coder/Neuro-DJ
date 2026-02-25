
import React from 'react';
import { BrainCircuit } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="text-center border-b border-[#bd93f9]/20 pb-6 mb-8">
      <div className="flex items-center justify-center gap-3 mb-2">
        <BrainCircuit className="w-10 h-10 text-[#50fa7b]" />
        <h1 className="text-5xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#bd93f9] to-[#50fa7b] font-avant tracking-tight">
          Glia
        </h1>
      </div>
      <p className="mt-2 text-lg text-[#f8f8f2]/80 font-light max-w-2xl mx-auto">
        Neuro-Acoustic Flush. Your personal AI agent for cellular repair, focus, and lucid rest.
      </p>
    </header>
  );
};
