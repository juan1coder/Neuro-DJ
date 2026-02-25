
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { OutputDisplay } from './components/OutputDisplay';
import { generateMusicDescriptionAndImagePrompt, generateFreestyleDescriptionAndImagePrompt, generateChatDescriptionAndImagePrompt, generateImage } from './services/geminiService';
import type { GeneratedContent, GenerationParams, SavedSession } from './types';
import { Volume2, VolumeX, Heart, Edit2, Check } from 'lucide-react';
import { staticSavedSessions } from './savedSessions';
import river1 from './assets/river1.ogg';
import river2 from './assets/river2.ogg';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedDescription, setGeneratedDescription] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [riverVolume, setRiverVolume] = useState<number>(0.5);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('glia-saved-sessions');
    let loadedSessions = [...staticSavedSessions];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const staticIds = new Set(staticSavedSessions.map(s => s.id));
        const localOnly = parsed.filter((s: SavedSession) => !staticIds.has(s.id));
        loadedSessions = [...staticSavedSessions, ...localOnly];
      } catch (e) {
        console.error("Failed to parse saved sessions");
      }
    }
    setSavedSessions(loadedSessions);

    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch (e) {
          console.error("Audio pause failed on cleanup:", e);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = riverVolume;
    }
  }, [riverVolume]);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        if (playPromiseRef.current !== null) {
          playPromiseRef.current.then(() => {
            try {
              audioRef.current?.pause();
            } catch (e) {
              console.error("Audio pause failed:", e);
            }
          }).catch(() => {
            // Ignore play errors here, they are caught below
          });
        } else {
          try {
            audioRef.current.pause();
          } catch (e) {
            console.error("Audio pause failed:", e);
          }
        }
      } else {
        try {
          playPromiseRef.current = audioRef.current.play();
          if (playPromiseRef.current !== undefined) {
            playPromiseRef.current.catch(e => {
              console.error("Audio play failed:", e);
              setIsPlaying(false);
            });
          }
        } catch (e) {
          console.error("Audio play threw an error:", e);
          setIsPlaying(false);
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleGenerate = useCallback(async (params: GenerationParams) => {
    setIsLoading(true);
    setError('');
    setGeneratedDescription('');
    setGeneratedImageUrl('');

    try {
      let content: GeneratedContent | null = null;
      
      if (params.mode === 'Guided') {
        content = await generateMusicDescriptionAndImagePrompt(params.config);
      } else if (params.mode === 'Freestyle') {
        content = await generateFreestyleDescriptionAndImagePrompt(params.config.prompt);
      } else if (params.mode === 'Chat') {
        content = await generateChatDescriptionAndImagePrompt(params.config.chatHistory);
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

  const handleSaveSession = (session: Omit<SavedSession, 'id' | 'date'>) => {
    const newSession: SavedSession = {
      ...session,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };
    const updated = [newSession, ...savedSessions];
    setSavedSessions(updated);
    try {
      localStorage.setItem('glia-saved-sessions', JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  };

  const handleLoadSession = (session: SavedSession) => {
    setGeneratedDescription(session.description);
    setGeneratedImageUrl(session.imageUrl);
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const saveEdit = (id: string) => {
    if (editName.trim() !== "") {
      const updated = savedSessions.map(s => s.id === id ? { ...s, name: editName.trim() } : s);
      setSavedSessions(updated);
      try {
        localStorage.setItem('glia-saved-sessions', JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save to localStorage:", e);
      }
    }
    setEditingId(null);
  };

  const handleDeleteSession = (id: string) => {
    const updated = savedSessions.filter(s => s.id !== id);
    setSavedSessions(updated);
    try {
      localStorage.setItem('glia-saved-sessions', JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  };

  return (
    <div className="min-h-screen bg-[#282a36] text-[#f8f8f2] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Hidden audio element for river sound with multiple fallbacks */}
      <audio ref={audioRef} loop>
        <source src={river1} type="audio/ogg" />
        <source src={river2} type="audio/ogg" />
        <source src="https://drive.google.com/uc?export=download&id=1Gqx1JHeoTEZ5mQUBfzsTIeR1oARGfZLk" type="audio/ogg; codecs=opus" />
        <source src="https://drive.google.com/uc?export=download&id=1Gqx1JHeoTEZ5mQUBfzsTIeR1oARGfZLk" type="audio/opus" />
        <source src="https://upload.wikimedia.org/wikipedia/commons/7/74/River_Stream.ogg" type="audio/ogg" />
        <source src="https://actions.google.com/sounds/v1/water/river_stream.ogg" type="audio/ogg" />
      </audio>

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
                <h3 className="text-xl font-semibold text-[#50fa7b] font-display tracking-wide mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5" /> Saved Sessions
                </h3>
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
                          <p className="text-xs text-[#f8f8f2]/60">{session.carrierFreq}Hz + {session.beatFreq}Hz</p>
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
              description={generatedDescription}
              imageUrl={generatedImageUrl}
              error={error}
              onSaveSession={handleSaveSession}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;