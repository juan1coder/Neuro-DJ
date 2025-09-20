
import React from 'react';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export const SegmentedControl = <T extends string,>({ options, value, onChange }: SegmentedControlProps<T>): React.ReactNode => {
  return (
    <div className="flex w-full bg-gray-700/50 rounded-lg p-1 space-x-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`w-full py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50
            ${
              value === option.value
                ? 'bg-cyan-500 text-white shadow'
                : 'text-gray-300 hover:bg-gray-600/50'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
