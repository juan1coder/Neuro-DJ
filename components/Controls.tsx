
import React, { useState } from 'react';
import { Genre, NeuroIntent, ColorTheme, AppMode } from '../types';
import type { GenerationParams } from '../types';
import { Slider } from './Slider';
import { Toggle } from './Toggle';
import { SegmentedControl } from './SegmentedControl';
import { Loader } from './Loader';

interface ControlsProps {
  onGenerate: (params: GenerationParams) => void;
  isLoading: boolean;
}

type InputMode = 'Guided' | 'Freestyle';

const neuroIntentOptions = [
  { value: NeuroIntent.Dopamine, label: 'Dopamine' },
  { value: NeuroIntent.Serotonin, label: 'Serotonin' },
  { value: NeuroIntent.Acetylcholine, label: 'Acetylcholine' },
];

const appModeOptions = [
  { value: AppMode.Standard, label: 'Standard' },
  { value: AppMode.Recovery, label: 'Recovery' },
  { value: AppMode.Productivity, label: 'Productivity' },
];

const genreOptions = Object.values(Genre);
const colorThemeOptions = Object.values(ColorTheme);

export const Controls: React.FC<ControlsProps> = ({ onGenerate, isLoading }) => {
  // Shared State
  const [inputMode, setInputMode] = useState<InputMode>('Guided');

  // Guided Mode State
  const [genre, setGenre] = useState<Genre>(Genre.MelodicTechno);
  const [energy, setEnergy] = useState<number>(50);
  const [neuroIntent, setNeuroIntent] = useState<NeuroIntent>(NeuroIntent.Dopamine);
  const [colorTheme, setColorTheme] = useState<ColorTheme>(ColorTheme.None);
  const [voiceLayer, setVoiceLayer] = useState<boolean>(false);
  const [appMode, setAppMode] = useState<AppMode>(AppMode.Standard);

  // Freestyle Mode State
  const [freestylePrompt, setFreestylePrompt] = useState<string>('');

  const handleSubmit = () => {
    if (inputMode === 'Guided') {
      onGenerate({
        mode: 'Guided',
        config: {
          genre,
          energy,
          neuroIntent,
          colorTheme,
          voiceLayer,
          appMode,
        },
      });
    } else {
       if (!freestylePrompt.trim()) return; // Prevent empty prompts
       onGenerate({
           mode: 'Freestyle',
           config: { prompt: freestylePrompt }
       })
    }
  };

  const getEnergyLabel = (value: number): string => {
    if (value < 25) return "Sleepy";
    if (value < 75) return "Lucid";
    return "Focused";
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-blue-400/20 rounded-lg p-6 space-y-6 shadow-2xl shadow-blue-900/20">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Input Mode</label>
        <SegmentedControl 
          options={[{value: 'Guided', label: 'Guided'}, {value: 'Freestyle', label: 'Freestyle'}]}
          value={inputMode} 
          onChange={(val) => setInputMode(val as InputMode)} 
        />
      </div>

      {inputMode === 'Guided' ? (
        <>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-cyan-300">Genre Base</h3>
            <SegmentedControl options={genreOptions.map(g => ({ value: g, label: g }))} value={genre} onChange={(val) => setGenre(val as Genre)} />
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-cyan-300">Tuning</h3>
            <Slider
              label={`Energy: ${energy} (${getEnergyLabel(energy)})`}
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value, 10))}
              min={0}
              max={100}
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Neurochemical Intent</label>
              <SegmentedControl options={neuroIntentOptions} value={neuroIntent} onChange={(val) => setNeuroIntent(val as NeuroIntent)} />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-cyan-300">Aesthetics</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Color Theme</label>
              <SegmentedControl options={colorThemeOptions.map(c => ({value: c, label: c}))} value={colorTheme} onChange={(val) => setColorTheme(val as ColorTheme)} />
            </div>
            <Toggle
              label="Guided Voice Layer"
              enabled={voiceLayer}
              onChange={setVoiceLayer}
              description="Enable whispered words like 'restore'."
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-cyan-300">Mode</h3>
            <SegmentedControl options={appModeOptions} value={appMode} onChange={(val) => setAppMode(val as AppMode)} />
          </div>
        </>
      ) : (
        <div className="space-y-4">
           <h3 className="text-xl font-semibold text-cyan-300">Freestyle Prompt</h3>
           <p className="text-sm text-gray-400">Describe the soundscape you want to create in your own words. The AI will expand on your idea to generate a detailed prompt and visual.</p>
           <textarea
            value={freestylePrompt}
            onChange={(e) => setFreestylePrompt(e.target.value)}
            placeholder="e.g., A calming ambient track for deep focus, with sounds of gentle rain and a distant, soft piano melody..."
            className="w-full h-32 p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
            aria-label="Freestyle soundscape prompt"
           />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isLoading || (inputMode === 'Freestyle' && !freestylePrompt.trim())}
        className="w-full flex justify-center items-center bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
      >
        {isLoading ? <Loader /> : 'Generate Soundscape'}
      </button>
    </div>
  );
};