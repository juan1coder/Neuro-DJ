
import React from 'react';

interface ToggleProps {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export const Toggle: React.FC<ToggleProps> = ({ label, description, enabled, onChange }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="flex-grow flex flex-col">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        {description && <span className="text-xs text-gray-500">{description}</span>}
      </span>
      <button
        type="button"
        className={`${
          enabled ? 'bg-cyan-500' : 'bg-gray-600'
        } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500`}
        onClick={() => onChange(!enabled)}
      >
        <span
          className={`${
            enabled ? 'translate-x-6' : 'translate-x-1'
          } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
        />
      </button>
    </div>
  );
};
