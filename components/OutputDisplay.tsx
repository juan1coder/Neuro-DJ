
import React, { useState, useEffect, useRef } from 'react';
import { Loader } from './Loader';
import { Download, Copy, Check, Image as ImageIcon, Play, Square, Activity, Heart, Clock, Mic, StopCircle } from 'lucide-react';
import type { SavedSession } from '../types';

interface OutputDisplayProps {
  isLoading: boolean;
  description: string;
  imageUrl: string;
  error: string;
  onSaveSession: (session: Omit<SavedSession, 'id' | 'date'>) => void;
}

const Placeholder = () => (
    <div className="w-full aspect-square bg-[#44475a]/40 rounded-xl flex items-center justify-center border border-dashed border-[#bd93f9]/30">
        <div className="text-center text-[#bd93f9]/60 flex flex-col items-center">
            <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-light">Your generated soundscape visual will appear here.</p>
        </div>
    </div>
);

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ isLoading, description, imageUrl, error, onSaveSession }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeFreqs, setActiveFreqs] = useState<{carrier: number, beat: number} | null>(null);
  const [volume, setVolume] = useState(0.4);
  const [timerMinutes, setTimerMinutes] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainsRef = useRef<GainNode[]>([]);
  const masterGainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isCopied) {
      setIsCopied(false);
    }
    setIsSaved(false);
    
    // Stop audio when description changes
    stopBinauralBeats();
  }, [description]);

  useEffect(() => {
    return () => {
      stopBinauralBeats();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.error("AudioContext close failed:", e));
      }
    };
  }, []);

  useEffect(() => {
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume, audioContextRef.current.currentTime, 0.1);
    }
  }, [volume]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && isPlayingAudio) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlayingAudio) {
      stopBinauralBeats();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, isPlayingAudio]);

  const handleCopy = () => {
    if (!description) return;
    navigator.clipboard.writeText(description).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleDownloadImage = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'glia-soundscape.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stopBinauralBeats = () => {
    if (audioContextRef.current) {
      const ctx = audioContextRef.current;
      // Fade out
      gainsRef.current.forEach(gain => {
        try {
          gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1);
        } catch (e) {}
      });

      setTimeout(() => {
        oscillatorsRef.current.forEach(osc => {
          try { osc.stop(); osc.disconnect(); } catch (e) {}
        });
        oscillatorsRef.current = [];
        gainsRef.current = [];
        if (ctx.state === 'running') {
          ctx.suspend().catch(e => console.error("AudioContext suspend failed:", e));
        }
      }, 1000);
    }
    
    if (isRecording) {
      stopRecording();
    }
    
    setIsPlayingAudio(false);
    setActiveFreqs(null);
    setTimeLeft(null);
  };

  const startRecording = (ctx: AudioContext, sourceNode: AudioNode) => {
    try {
      const dest = ctx.createMediaStreamDestination();
      sourceNode.connect(dest);
      
      const mediaRecorder = new MediaRecorder(dest.stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = 'glia-session.webm';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Failed to start recording:", e);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleGeneratedAudio = () => {
    if (isPlayingAudio) {
      stopBinauralBeats();
      return;
    }

    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("Failed to create AudioContext:", e);
        return;
      }
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(e => console.error("AudioContext resume failed:", e));
    }

    // Extract frequencies from description
    const carrierMatch = description.match(/(\d+)\s*Hz\s*carrier/i) || description.match(/(\d+)\s*Hz/i);
    const beatMatch = description.match(/(\d+(?:\.\d+)?)\s*Hz\s*binaural/i) || description.match(/(\d+(?:\.\d+)?)\s*Hz/i);
    
    // Default to 174Hz (Solfeggio healing) and 7Hz (Theta) if not found
    const carrierFreq = carrierMatch ? parseFloat(carrierMatch[1]) : 174;
    // Ensure beat freq is different from carrier if we matched the same number
    let beatFreq = beatMatch ? parseFloat(beatMatch[1]) : 7;
    if (beatFreq === carrierFreq) beatFreq = 7;

    setActiveFreqs({ carrier: carrierFreq, beat: beatFreq });

    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();
    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    const merger = ctx.createChannelMerger(2);
    const masterGain = ctx.createGain();

    masterGainRef.current = masterGain;
    masterGain.gain.value = volume;

    // Use sine waves for pure binaural beats
    leftOsc.type = 'sine';
    rightOsc.type = 'sine';
    
    leftOsc.frequency.value = carrierFreq;
    rightOsc.frequency.value = carrierFreq + beatFreq;

    // Gentle fade in to avoid clicks
    leftGain.gain.setValueAtTime(0.001, ctx.currentTime);
    leftGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 2);
    
    rightGain.gain.setValueAtTime(0.001, ctx.currentTime);
    rightGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 2);

    leftOsc.connect(leftGain);
    rightOsc.connect(rightGain);

    leftGain.connect(merger, 0, 0); // Left ear
    rightGain.connect(merger, 0, 1); // Right ear

    merger.connect(masterGain);
    masterGain.connect(ctx.destination);

    leftOsc.start();
    rightOsc.start();

    oscillatorsRef.current = [leftOsc, rightOsc];
    gainsRef.current = [leftGain, rightGain];
    setIsPlayingAudio(true);
    
    if (timerMinutes > 0) {
      setTimeLeft(timerMinutes * 60);
    }
  };

  const handleSave = () => {
    if (!description || isSaved) return;
    
    const carrierMatch = description.match(/(\d+)\s*Hz\s*carrier/i) || description.match(/(\d+)\s*Hz/i);
    const beatMatch = description.match(/(\d+(?:\.\d+)?)\s*Hz\s*binaural/i) || description.match(/(\d+(?:\.\d+)?)\s*Hz/i);
    const carrierFreq = carrierMatch ? parseFloat(carrierMatch[1]) : 174;
    let beatFreq = beatMatch ? parseFloat(beatMatch[1]) : 7;
    if (beatFreq === carrierFreq) beatFreq = 7;

    const namePrompt = `Session ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    onSaveSession({
      name: namePrompt,
      description,
      imageUrl,
      carrierFreq,
      beatFreq
    });
    setIsSaved(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#282a36]/80 backdrop-blur-md border border-[#bd93f9]/20 rounded-2xl p-6 shadow-2xl shadow-[#bd93f9]/10 min-h-[400px] flex flex-col space-y-8">
       <div className="w-full aspect-square relative overflow-hidden rounded-xl bg-[#44475a]/20">
         {isLoading && (
            <div className="absolute inset-0 bg-[#282a36]/80 flex items-center justify-center z-20 backdrop-blur-sm">
               <Loader large />
            </div>
         )}
         {!isLoading && !imageUrl && <Placeholder />}
         {imageUrl && (
            <>
              <img src={imageUrl} alt="Generated soundscape visual" className="w-full h-full object-cover transition-opacity duration-700 ease-in-out opacity-100" />
              <button
                onClick={handleDownloadImage}
                className="absolute bottom-4 right-4 bg-[#282a36]/80 hover:bg-[#bd93f9] text-[#f8f8f2] p-3 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg group"
                title="Download Image"
              >
                <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </>
         )}
       </div>

      <div className="flex-grow bg-[#44475a]/20 p-6 rounded-xl border border-[#6272a4]/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-xl font-semibold text-[#50fa7b] font-display tracking-wide">Acoustic Signature</h3>
            
            <div className="flex flex-wrap gap-2">
              {description && !isLoading && (
                  <>
                    <button
                        onClick={handleSave}
                        disabled={isSaved}
                        className="flex items-center space-x-2 px-3 py-2 text-sm bg-[#44475a] hover:bg-[#bd93f9]/40 rounded-lg transition-colors duration-200 text-[#f8f8f2] focus:outline-none focus:ring-2 focus:ring-[#bd93f9] disabled:opacity-70"
                        title="Save to Favorites"
                    >
                        {isSaved ? <Check className="h-4 w-4 text-[#50fa7b]" /> : <Heart className="h-4 w-4 text-[#ff79c6]" />}
                    </button>
                    
                    <button
                        onClick={handleCopy}
                        disabled={isCopied}
                        className="flex items-center space-x-2 px-3 py-2 text-sm bg-[#44475a] hover:bg-[#6272a4] rounded-lg transition-colors duration-200 text-[#f8f8f2] focus:outline-none focus:ring-2 focus:ring-[#bd93f9] disabled:opacity-70 disabled:cursor-default"
                        title="Copy description"
                    >
                        {isCopied ? <Check className="h-4 w-4 text-[#50fa7b]" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </>
              )}
            </div>
        </div>
        
        {description && !isLoading && (
          <div className="bg-[#282a36] p-4 rounded-xl border border-[#6272a4]/30 mb-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                  onClick={toggleGeneratedAudio}
                  className={`flex items-center space-x-2 px-6 py-3 text-sm font-semibold border rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#bd93f9] shadow-lg ${
                    isPlayingAudio 
                      ? 'bg-[#50fa7b]/20 hover:bg-[#50fa7b]/30 border-[#50fa7b]/50 text-[#50fa7b]' 
                      : 'bg-[#bd93f9]/20 hover:bg-[#bd93f9]/40 border-[#bd93f9]/50 text-[#bd93f9]'
                  }`}
              >
                  {isPlayingAudio ? (
                      <>
                          <Square className="h-5 w-5" />
                          <span>Stop Frequencies</span>
                      </>
                  ) : (
                      <>
                          <Activity className="h-5 w-5" />
                          <span>Play Frequencies</span>
                      </>
                  )}
              </button>
              
              <div className="flex items-center gap-4 bg-[#44475a]/50 px-4 py-2 rounded-lg border border-[#6272a4]/30">
                <Clock className="w-4 h-4 text-[#8be9fd]" />
                <select 
                  value={timerMinutes} 
                  onChange={(e) => setTimerMinutes(Number(e.target.value))}
                  disabled={isPlayingAudio}
                  className="bg-transparent text-[#f8f8f2] text-sm focus:outline-none cursor-pointer disabled:opacity-50"
                >
                  <option value={0}>No Timer</option>
                  <option value={5}>5 min</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={60}>60 min</option>
                </select>
                {timeLeft !== null && (
                  <span className="text-[#50fa7b] font-mono text-sm ml-2">{formatTime(timeLeft)}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-[#f8f8f2]/70 w-16">Volume</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-grow h-1.5 bg-[#44475a] rounded-full appearance-none cursor-pointer accent-[#bd93f9]"
              />
            </div>
            
            {isPlayingAudio && (
              <div className="flex justify-between items-center mt-2 pt-4 border-t border-[#6272a4]/30">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-6 h-6">
                    <div 
                      className="absolute w-full h-full rounded-full bg-[#50fa7b] opacity-50"
                      style={{
                        animation: `pulse ${1 / (activeFreqs?.beat || 1)}s infinite alternate ease-in-out`
                      }}
                    />
                    <Activity className="text-[#50fa7b] w-5 h-5 relative z-10" />
                  </div>
                  <span className="text-sm text-[#50fa7b] font-mono">
                    {activeFreqs?.carrier}Hz + {activeFreqs?.beat}Hz
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    if (isRecording) {
                      stopRecording();
                    } else if (masterGainRef.current && audioContextRef.current) {
                      startRecording(audioContextRef.current, masterGainRef.current);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isRecording 
                      ? 'bg-[#ff5555]/20 text-[#ff5555] border border-[#ff5555]/50 animate-pulse' 
                      : 'bg-[#44475a] text-[#f8f8f2] hover:bg-[#6272a4] border border-[#6272a4]/50'
                  }`}
                >
                  {isRecording ? (
                    <><StopCircle className="w-4 h-4" /> Stop Rec</>
                  ) : (
                    <><Mic className="w-4 h-4" /> Rec Session</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {error && <div className="text-[#ff5555] bg-[#ff5555]/10 border border-[#ff5555]/20 p-4 rounded-lg mb-4">{error}</div>}
        {description ? (
            <div className="space-y-4">
              <p className="text-[#f8f8f2]/90 whitespace-pre-wrap leading-relaxed font-light text-lg">{description}</p>
              <div className="p-4 bg-[#282a36]/50 rounded-lg border border-[#bd93f9]/20">
                <p className="text-sm text-[#bd93f9] font-light italic">
                  Note: Google's Lyria music generation model is not yet available in the public API. 
                  To provide the acoustic flush experience, Glia uses the Web Audio API to synthesize the prescribed binaural frequencies in real-time. Layer this with the River Sound for the full effect.
                </p>
              </div>
            </div>
        ): (
            !isLoading && !error && <p className="text-[#6272a4] italic">The detailed description of your generated audio loop will be shown here once generated.</p>
        )}
      </div>
    </div>
  );
};
