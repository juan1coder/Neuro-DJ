
import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const Slider: React.FC<SliderProps> = ({ label, value, onChange, min = 0, max = 100, step = 1 }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-[#f8f8f2] mb-3 font-display tracking-wide">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-2.5 bg-[#282a36] rounded-full appearance-none cursor-pointer accent-[#bd93f9] border border-[#6272a4]/30"
      />
    </div>
  );
};
