
import React, { useState } from 'react';
import { Genre, NeuroIntent, ColorTheme, AppMode } from '../types';
import type { GenerationParams } from '../types';
import { Slider } from './Slider';
import { Toggle } from './Toggle';
import { SegmentedControl } from './SegmentedControl';
import { Loader } from './Loader';
import { ChatPrescription } from './ChatPrescription';

interface ControlsProps {
  onGenerate: (params: GenerationParams) => void;
  isLoading: boolean;
}

type InputMode = 'Guided' | 'Freestyle' | 'Chat';

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
    <div className="bg-[#282a36]/80 backdrop-blur-md border border-[#bd93f9]/20 rounded-2xl p-6 space-y-8 shadow-2xl shadow-[#bd93f9]/10">
      <div className="bg-[#44475a]/30 p-5 rounded-xl border border-[#6272a4]/20">
        <label className="block text-sm font-medium text-[#f8f8f2] mb-3 font-display tracking-wide">Input Mode</label>
        <SegmentedControl 
          options={[
            {value: 'Guided', label: 'Guided'}, 
            {value: 'Freestyle', label: 'Freestyle'},
            {value: 'Chat', label: 'AI Chat'}
          ]}
          value={inputMode} 
          onChange={(val) => setInputMode(val as InputMode)} 
        />
      </div>

      {inputMode === 'Guided' ? (
        <div className="space-y-6">
          <div className="bg-[#44475a]/30 p-5 rounded-xl border border-[#6272a4]/20 space-y-4">
            <h3 className="text-xl font-semibold text-[#50fa7b] font-display tracking-wide">Genre Base</h3>
            <SegmentedControl options={genreOptions.map(g => ({ value: g, label: g }))} value={genre} onChange={(val) => setGenre(val as Genre)} />
          </div>

          <div className="bg-[#44475a]/30 p-5 rounded-xl border border-[#6272a4]/20 space-y-6">
            <h3 className="text-xl font-semibold text-[#50fa7b] font-display tracking-wide">Tuning</h3>
            <Slider
              label={`Energy: ${energy} (${getEnergyLabel(energy)})`}
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value, 10))}
              min={0}
              max={100}
            />
            <div>
              <label className="block text-sm font-medium text-[#f8f8f2] mb-3 font-display tracking-wide">Neurochemical Intent</label>
              <SegmentedControl options={neuroIntentOptions} value={neuroIntent} onChange={(val) => setNeuroIntent(val as NeuroIntent)} />
            </div>
          </div>
          
          <div className="bg-[#44475a]/30 p-5 rounded-xl border border-[#6272a4]/20 space-y-6">
            <h3 className="text-xl font-semibold text-[#50fa7b] font-display tracking-wide">Aesthetics</h3>
            <div>
              <label className="block text-sm font-medium text-[#f8f8f2] mb-3 font-display tracking-wide">Color Theme</label>
              <SegmentedControl options={colorThemeOptions.map(c => ({value: c, label: c}))} value={colorTheme} onChange={(val) => setColorTheme(val as ColorTheme)} />
            </div>
            <Toggle
              label="Guided Voice Layer"
              enabled={voiceLayer}
              onChange={setVoiceLayer}
              description="Enable whispered words like 'restore'."
            />
          </div>

          <div className="bg-[#44475a]/30 p-5 rounded-xl border border-[#6272a4]/20 space-y-4">
            <h3 className="text-xl font-semibold text-[#50fa7b] font-display tracking-wide">Mode</h3>
            <SegmentedControl options={appModeOptions} value={appMode} onChange={(val) => setAppMode(val as AppMode)} />
          </div>
        </div>
      ) : inputMode === 'Freestyle' ? (
        <div className="bg-[#44475a]/30 p-5 rounded-xl border border-[#6272a4]/20 space-y-4">
           <h3 className="text-xl font-semibold text-[#50fa7b] font-display tracking-wide">Freestyle Prompt</h3>
           <p className="text-sm text-[#f8f8f2]/70 font-light">Describe the soundscape you want to create in your own words. The AI will expand on your idea to generate a detailed prompt and visual.</p>
           <textarea
            value={freestylePrompt}
            onChange={(e) => setFreestylePrompt(e.target.value)}
            placeholder="e.g., A calming ambient track for deep focus, with sounds of gentle rain and a distant, soft piano melody..."
            className="w-full h-32 p-4 bg-[#282a36] border border-[#6272a4] rounded-xl text-[#f8f8f2] placeholder-[#6272a4] focus:outline-none focus:ring-2 focus:ring-[#bd93f9] focus:border-[#bd93f9] transition-colors resize-none"
            aria-label="Freestyle soundscape prompt"
           />
        </div>
      ) : (
        <ChatPrescription 
          isLoading={isLoading} 
          onGenerateFromChat={(chatHistory) => onGenerate({ mode: 'Chat', config: { chatHistory } })} 
        />
      )}

      {inputMode !== 'Chat' && (
        <button
          onClick={handleSubmit}
          disabled={isLoading || (inputMode === 'Freestyle' && !freestylePrompt.trim())}
          className="w-full flex justify-center items-center bg-gradient-to-r from-[#bd93f9] to-[#50fa7b] hover:from-[#ff79c6] hover:to-[#8be9fd] text-[#282a36] font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 font-display tracking-wide text-lg"
        >
          {isLoading ? <Loader /> : 'Generate Soundscape'}
        </button>
      )}
    </div>
  );
};