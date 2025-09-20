
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { OutputDisplay } from './components/OutputDisplay';
import { generateMusicDescriptionAndImagePrompt, generateFreestyleDescriptionAndImagePrompt, generateImage } from './services/geminiService';
import type { GeneratedContent, GenerationParams } from './types';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedDescription, setGeneratedDescription] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleGenerate = useCallback(async (params: GenerationParams) => {
    setIsLoading(true);
    setError('');
    setGeneratedDescription('');
    setGeneratedImageUrl('');

    try {
      let content: GeneratedContent | null = null;
      
      if (params.mode === 'Guided') {
        content = await generateMusicDescriptionAndImagePrompt(params.config);
      } else {
        content = await generateFreestyleDescriptionAndImagePrompt(params.config.prompt);
      }
      
      if (!content) {
        throw new Error("Failed to generate content. The AI returned an empty response.");
      }

      setGeneratedDescription(content.musicDescription);

      const imageUrl = await generateImage(content.imagePrompt);
      setGeneratedImageUrl(imageUrl);

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Generation failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/30 to-gray-900 text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Controls onGenerate={handleGenerate} isLoading={isLoading} />
          </div>
          <div className="lg:col-span-3">
            <OutputDisplay
              isLoading={isLoading}
              description={generatedDescription}
              imageUrl={generatedImageUrl}
              error={error}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;