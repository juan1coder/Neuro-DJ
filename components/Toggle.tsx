
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
        <span className="text-sm font-medium text-[#f8f8f2] font-display tracking-wide">{label}</span>
        {description && <span className="text-xs text-[#f8f8f2]/60 mt-1 font-light">{description}</span>}
      </span>
      <button
        type="button"
        className={`${
          enabled ? 'bg-[#50fa7b]' : 'bg-[#282a36] border border-[#6272a4]/50'
        } relative inline-flex items-center h-7 rounded-full w-12 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#282a36] focus:ring-[#bd93f9] shadow-inner`}
        onClick={() => onChange(!enabled)}
      >
        <span
          className={`${
            enabled ? 'translate-x-6 bg-[#282a36]' : 'translate-x-1 bg-[#6272a4]'
          } inline-block w-5 h-5 transform rounded-full transition-transform shadow-sm`}
        />
      </button>
    </div>
  );
};
