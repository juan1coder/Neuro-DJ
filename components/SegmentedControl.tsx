
import React from 'react';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export const SegmentedControl = <T extends string,>({ options, value, onChange }: SegmentedControlProps<T>): React.ReactNode => {
  return (
    <div className="flex w-full bg-[#282a36] rounded-xl p-1.5 space-x-1 border border-[#6272a4]/30">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`w-full py-2 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#bd93f9] focus:ring-opacity-50
            ${
              value === option.value
                ? 'bg-[#44475a] text-[#50fa7b] shadow-md border border-[#6272a4]/50'
                : 'text-[#f8f8f2]/70 hover:bg-[#44475a]/50 hover:text-[#f8f8f2]'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
