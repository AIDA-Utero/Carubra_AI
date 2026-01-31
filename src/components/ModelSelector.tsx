'use client';

import { useState, useRef, useEffect } from 'react';
import { AIModel, AI_MODELS } from '@/constants/ai';
import { ChevronDown, Check } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: AIModel) => void;
  disabled?: boolean;
}

export const ModelSelector = ({ selectedModel, onModelChange, disabled }: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeModel = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const groupedModels = AI_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, AIModel[]>);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Utama */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full
          bg-white/10 hover:bg-white/15 active:bg-white/20
          border border-white/10 transition-all duration-200
          text-white/90 text-xs sm:text-sm font-medium
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className="truncate max-w-[100px] sm:max-w-[140px]">
          {activeModel.name}
        </span>
        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* MENU DROPDOWN */}
      {isOpen && (
        <div className="
          absolute right-0 top-full mt-2 
          w-64 max-h-[60vh] overflow-y-auto 
          rounded-xl border border-white/20 
          shadow-2xl shadow-black
          bg-slate-950 
          z-[9999]
          custom-scrollbar
        ">
          
          <div className="p-2 space-y-1">
            {Object.entries(groupedModels).map(([provider, models]) => (
              <div key={provider} className="mb-2 last:mb-0">
                <div className="px-2 py-1.5 text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-wider">
                  {provider}
                </div>
                
                <div className="space-y-0.5">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelChange(model);
                        setIsOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between px-2 py-2 rounded-lg text-left text-xs sm:text-sm transition-colors
                        ${selectedModel === model.id 
                          ? 'bg-blue-600 text-white' 
                          : 'text-white/80 hover:bg-white/10 hover:text-white'}
                      `}
                    >
                      <span className="truncate">{model.name}</span>
                      {selectedModel === model.id && (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;