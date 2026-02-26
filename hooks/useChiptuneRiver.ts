import { useEffect, useRef, useState } from 'react';

export const useChiptuneRiver = (volume: number) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.1);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      if (audioCtxRef.current?.state === 'running') {
        audioCtxRef.current.suspend();
      }
      setIsPlaying(false);
    } else {
      if (!audioCtxRef.current) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;

        const bufferSize = ctx.sampleRate * 2; // 2 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Pink noise approximation
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        let lastVal = 0;
        
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          b6 = white * 0.115926;
          
          // Chiptune effect: downsample and quantize
          if (i % 6 === 0) { // Downsample by 6
            // Quantize to 4 bits (16 levels)
            lastVal = Math.round(pink * 8) / 8;
          }
          data[i] = lastVal * 0.1; // Scale down
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200; // Muffle it a bit

        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        source.start();
        gainNodeRef.current = gainNode;
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setIsPlaying(true);
    }
  };

  return { isPlaying, togglePlay };
};
