
import React from 'react';
import { Loader } from './Loader';

interface OutputDisplayProps {
  isLoading: boolean;
  description: string;
  imageUrl: string;
  error: string;
}

const Placeholder = () => (
    <div className="w-full aspect-square bg-gray-800/60 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-400/30">
        <div className="text-center text-blue-300/70">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" />
            </svg>
            <p className="mt-2 text-lg">Your generated soundscape will appear here.</p>
        </div>
    </div>
);


export const OutputDisplay: React.FC<OutputDisplayProps> = ({ isLoading, description, imageUrl, error }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-blue-400/20 rounded-lg p-6 shadow-2xl shadow-blue-900/20 min-h-[400px] flex flex-col space-y-6">
       <div className="w-full aspect-square relative overflow-hidden rounded-lg bg-gray-900">
         {isLoading && (
            <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-20">
               <Loader large />
            </div>
         )}
         {!isLoading && !imageUrl && <Placeholder />}
         {imageUrl && (
            <img src={imageUrl} alt="Generated soundscape visual" className="w-full h-full object-cover transition-opacity duration-500 ease-in-out opacity-100" />
         )}
       </div>

      <div className="flex-grow">
        <h3 className="text-xl font-semibold text-cyan-300 mb-3">Music Description</h3>
        {error && <div className="text-red-400 bg-red-900/30 p-3 rounded-md">{error}</div>}
        {description ? (
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{description}</p>
        ): (
            !isLoading && !error && <p className="text-gray-400">The detailed description of your generated audio loop will be shown here once generated.</p>
        )}
      </div>
    </div>
  );
};
