
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { OutputDisplay } from './components/OutputDisplay';
import { generateMusicDescriptionAndImagePrompt, generateFreestyleDescriptionAndImagePrompt, generateChatDescriptionAndImagePrompt, generateImage, editImage } from './services/geminiService';
import type { GeneratedContent, GenerationParams, SavedSession } from './types';
import { Volume2, VolumeX, Heart, Edit2, Check, Download } from 'lucide-react';
import { staticSavedSessions } from './savedSessions';
import { get, set } from 'idb-keyval';
import { useChiptuneRiver } from './hooks/useChiptuneRiver';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [isEditingImage, setIsEditingImage] = useState<boolean>(false);
  const [generatedDescription, setGeneratedDescription] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [generatedSessionName, setGeneratedSessionName] = useState<string>('');
  const [generatedShortDescription, setGeneratedShortDescription] = useState<string>('');
  const [rawReasoning, setRawReasoning] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [riverVolume, setRiverVolume] = useState<number>(0.5);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  
  const { isPlaying, togglePlay: toggleAudio } = useChiptuneRiver(riverVolume);

  useEffect(() => {
    const loadSessions = async () => {
      let loadedSessions = [...staticSavedSessions];
      try {
        // Migrate from localStorage if exists
        const oldSaved = localStorage.getItem('glia-saved-sessions');
        let localOnly: SavedSession[] = [];
        
        if (oldSaved) {
          const parsed = JSON.parse(oldSaved);
          const staticIds = new Set(staticSavedSessions.map(s => s.id));
          localOnly = parsed.filter((s: SavedSession) => !staticIds.has(s.id));
          await set('glia-saved-sessions', localOnly);
          localStorage.removeItem('glia-saved-sessions');
        } else {
          const idbSaved = await get<SavedSession[]>('glia-saved-sessions');
          if (idbSaved) {
            const staticIds = new Set(staticSavedSessions.map(s => s.id));
            localOnly = idbSaved.filter((s: SavedSession) => !staticIds.has(s.id));
          }
        }
        
        loadedSessions = [...staticSavedSessions, ...localOnly];
      } catch (e) {
        console.error("Failed to load saved sessions", e);
      }
      setSavedSessions(loadedSessions);
    };

    loadSessions();
  }, []);

  const handleGenerate = useCallback(async (params: GenerationParams) => {
    setIsLoading(true);
    setError('');
    setGeneratedDescription('');
    setGeneratedImageUrl('');
    setGeneratedSessionName('');
    setGeneratedShortDescription('');
    setRawReasoning('');

    try {
      let content: GeneratedContent | null = null;
      
      if (params.mode === 'Guided') {
        setRawReasoning(`User Query (Guided Mode):\n${JSON.stringify(params.config, null, 2)}`);
        content = await generateMusicDescriptionAndImagePrompt(params.config);
      } else if (params.mode === 'Freestyle') {
        setRawReasoning(`User Query (Freestyle Mode):\n${params.config.prompt}`);
        content = await generateFreestyleDescriptionAndImagePrompt(params.config.prompt);
      } else if (params.mode === 'Chat') {
        setRawReasoning(`User Query & AI Reasoning (Chat Mode):\n${params.config.chatHistory}`);
        content = await generateChatDescriptionAndImagePrompt(params.config.chatHistory);
      }
      
      if (!content) {
        throw new Error("Failed to generate content. The AI returned an empty response.");
      }

      setGeneratedDescription(content.musicDescription);
      setGeneratedSessionName(content.sessionName);
      setGeneratedShortDescription(content.shortDescription);

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Generation failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    setError('');
    try {
      let colorScheme = "dracula theme colors, purple and green accents";
      const lowerReasoning = rawReasoning.toLowerCase();
      const lowerDesc = generatedDescription.toLowerCase();
      
      if (lowerReasoning.includes('anxiety') || lowerReasoning.includes('anxious') || lowerDesc.includes('anxiety')) {
        colorScheme = "relaxing dominant green color scheme, soothing nature tones";
      } else if (lowerReasoning.includes('sleep') || lowerReasoning.includes('insomnia') || lowerDesc.includes('sleep')) {
        colorScheme = "deep midnight blues and dark purples, calming night theme";
      } else if (lowerReasoning.includes('focus') || lowerReasoning.includes('study') || lowerDesc.includes('focus')) {
        colorScheme = "crisp cyan and cool blue tones, clear and sharp lighting";
      } else if (lowerReasoning.includes('energy') || lowerReasoning.includes('workout') || lowerDesc.includes('energy')) {
        colorScheme = "vibrant orange and warm red tones, energetic and dynamic lighting";
      }

      const fullPrompt = `A surreal Dreamscape representing this soundscape. Session Name: ${generatedSessionName}\nShort Description: ${generatedShortDescription}\nMusic Description: ${generatedDescription}`;
      
      const imageUrl = await generateImage(fullPrompt, colorScheme);
      setGeneratedImageUrl(imageUrl);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Image generation failed: ${errorMessage}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleEditImage = async (prompt: string) => {
    if (!generatedImageUrl) return;
    setIsEditingImage(true);
    setError('');
    try {
      const newImageUrl = await editImage(generatedImageUrl, prompt);
      setGeneratedImageUrl(newImageUrl);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Image edit failed: ${errorMessage}`);
    } finally {
      setIsEditingImage(false);
    }
  };

  const handleSaveSession = async (session: Omit<SavedSession, 'id' | 'date'>) => {
    let funDescription = session.description;
    
    // Generate a fun description based on beatFreq if it's just a timestamp name
    if (session.name.startsWith('Session ')) {
      const freq = session.beatFreq;
      let funText = "";
      if (freq < 4) funText = "😴 Delta waves for deep sleep and healing.";
      else if (freq < 8) funText = "🧘 Theta waves for meditation and deep relaxation.";
      else if (freq < 14) funText = "😌 Alpha waves for relaxed focus and stress reduction.";
      else if (freq < 30) funText = "⚡ Beta waves for active thinking and energy.";
      else funText = "🧠 Gamma waves for peak concentration.";
      
      funDescription = `${funText}\n\n${session.description}`;
    }

    const newSession: SavedSession = {
      ...session,
      description: funDescription,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };
    const updated = [newSession, ...savedSessions];
    setSavedSessions(updated);
    try {
      await set('glia-saved-sessions', updated);
    } catch (e) {
      console.error("Failed to save to idb-keyval:", e);
    }
  };

  const handleExportSessions = () => {
    // Separate images from sessions
    const imagesContent = `// savedImages.ts\n// This file contains the base64 image data for your saved sessions.\n\n` + 
      savedSessions.map((s, i) => `export const img_${i} = "${s.imageUrl}";`).join('\n\n');
      
    const sessionsContent = `import { SavedSession } from './types';\nimport * as images from './savedImages';\n\n// Paste your favorite sessions here to keep them permanently.\n// These will be loaded every time the app starts.\nexport const staticSavedSessions: SavedSession[] = [\n` + 
      savedSessions.map((s, i) => `  {\n    id: "${s.id}",\n    name: ${JSON.stringify(s.name)},\n    description: ${JSON.stringify(s.description)},\n    imageUrl: images.img_${i},\n    carrierFreq: ${s.carrierFreq},\n    beatFreq: ${s.beatFreq},\n    date: "${s.date}"\n  }`).join(',\n') + `\n];`;

    // Download both files
    const downloadFile = (filename: string, content: string) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    downloadFile('savedImages.ts', imagesContent);
    downloadFile('savedSessions.ts', sessionsContent);
  };

  const handleLoadSession = (session: SavedSession) => {
    setGeneratedDescription(session.description);
    setGeneratedImageUrl(session.imageUrl);
    setGeneratedSessionName(session.name);
    setGeneratedShortDescription('');
    setRawReasoning('');
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const saveEdit = async (id: string) => {
    if (editName.trim() !== "") {
      const updated = savedSessions.map(s => s.id === id ? { ...s, name: editName.trim() } : s);
      setSavedSessions(updated);
      try {
        await set('glia-saved-sessions', updated);
      } catch (e) {
        console.error("Failed to save to idb-keyval:", e);
      }
    }
    setEditingId(null);
  };

  const handleDeleteSession = async (id: string) => {
    const updated = savedSessions.filter(s => s.id !== id);
    setSavedSessions(updated);
    try {
      await set('glia-saved-sessions', updated);
    } catch (e) {
      console.error("Failed to save to idb-keyval:", e);
    }
  };

  return (
    <div className="min-h-screen bg-[#282a36] text-[#f8f8f2] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Abstract background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#bd93f9]/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#50fa7b]/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <Header />
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4 bg-[#44475a]/30 p-3 rounded-2xl border border-[#6272a4]/20 w-full sm:w-auto">
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${
                isPlaying 
                  ? 'bg-[#50fa7b]/20 border-[#50fa7b]/50 text-[#50fa7b]' 
                  : 'bg-[#44475a]/50 border-[#6272a4]/30 text-[#f8f8f2]/70 hover:bg-[#44475a] hover:text-[#f8f8f2]'
              }`}
            >
              {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span className="font-display tracking-wide text-sm">{isPlaying ? 'River Flowing' : 'Play River Sound'}</span>
            </button>
            
            <div className="flex items-center gap-2 w-32">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={riverVolume}
                onChange={(e) => setRiverVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#282a36] rounded-full appearance-none cursor-pointer accent-[#bd93f9]"
              />
            </div>
          </div>
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <Controls onGenerate={handleGenerate} isLoading={isLoading} />
            
            {savedSessions.length > 0 && (
              <div className="bg-[#282a36]/80 backdrop-blur-md border border-[#bd93f9]/20 rounded-2xl p-6 shadow-2xl shadow-[#bd93f9]/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[#50fa7b] font-display tracking-wide flex items-center gap-2">
                    <Heart className="w-5 h-5" /> Saved Sessions
                  </h3>
                  <button
                    onClick={handleExportSessions}
                    className="flex items-center space-x-2 px-3 py-1.5 text-xs bg-[#44475a] hover:bg-[#6272a4] rounded-lg transition-colors duration-200 text-[#f8f8f2] focus:outline-none focus:ring-2 focus:ring-[#bd93f9]"
                    title="Export all sessions to clipboard"
                  >
                    <Download className="h-3 w-3" />
                    <span>Export</span>
                  </button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {savedSessions.map(session => (
                    <div key={session.id} className="bg-[#44475a]/30 p-3 rounded-xl border border-[#6272a4]/20 flex justify-between items-center group">
                      {editingId === session.id ? (
                        <div className="flex-grow flex items-center gap-2 mr-2">
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-[#282a36] text-[#f8f8f2] text-sm px-2 py-1 rounded border border-[#bd93f9] w-full focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(session.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button onClick={() => saveEdit(session.id)} className="text-[#50fa7b] hover:text-[#50fa7b]/80 p-1">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-grow cursor-pointer" onClick={() => handleLoadSession(session)}>
                          <p className="font-medium text-[#f8f8f2] text-sm truncate">{session.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-[#f8f8f2]/60">{session.carrierFreq}Hz + {session.beatFreq}Hz</p>
                            <p className="text-xs text-[#f8f8f2]/40">{new Date(session.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                      
                      {editingId !== session.id && (
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => startEditing(session.id, session.name)}
                            className="text-[#8be9fd]/70 hover:text-[#8be9fd] p-2"
                            title="Edit Name"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSession(session.id)}
                            className="text-[#ff5555]/70 hover:text-[#ff5555] p-2"
                            title="Delete Session"
                          >
                            <VolumeX className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-3">
            <OutputDisplay
              isLoading={isLoading}
              isGeneratingImage={isGeneratingImage}
              isEditingImage={isEditingImage}
              description={generatedDescription}
              imageUrl={generatedImageUrl}
              sessionName={generatedSessionName}
              shortDescription={generatedShortDescription}
              rawReasoning={rawReasoning}
              error={error}
              onSaveSession={handleSaveSession}
              onEditImage={handleEditImage}
              onGenerateImage={handleGenerateImage}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;