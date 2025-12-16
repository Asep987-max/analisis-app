import React from 'react';
import { AnalysisConfig, PerspectiveType, DepthType } from '../types';

interface ConfigPanelProps {
  config: AnalysisConfig;
  onChange: (newConfig: AnalysisConfig) => void;
  disabled: boolean;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange, disabled }) => {
  
  const updatePerspective = (p: PerspectiveType) => onChange({ ...config, perspective: p });
  const updateDepth = (d: DepthType) => onChange({ ...config, depth: d });

  const perspectiveOptions: { id: PerspectiveType; label: string; desc: string }[] = [
    { id: 'generalist', label: 'Generalist', desc: 'Mudah dipahami, analogi jelas' },
    { id: 'expert', label: 'Expert', desc: 'Teknis, presisi, mendalam' },
    { id: 'skeptic', label: 'Skeptic', desc: 'Kritis, mencari bias/celah' },
  ];

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 md:p-5 mb-6 animate-in fade-in slide-in-from-top-2">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Perspective Selector */}
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
            Perspektif Analisis
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {perspectiveOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => updatePerspective(opt.id)}
                className={`text-left px-3 py-2 rounded-lg border transition-all ${
                  config.perspective === opt.id
                    ? 'bg-synapse-900/40 border-synapse-500/50 text-synapse-100'
                    : 'bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="text-sm font-semibold">{opt.label}</div>
                <div className="text-[10px] opacity-70 leading-tight mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Depth Selector */}
        <div className="flex-1 md:max-w-[300px]">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
            Kedalaman Laporan
          </label>
          <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              disabled={disabled}
              onClick={() => updateDepth('concise')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                config.depth === 'concise'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Concise (TL;DR)
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => updateDepth('comprehensive')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                config.depth === 'comprehensive'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Comprehensive
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 px-1">
            {config.depth === 'concise' 
              ? 'Output ringkas, poin-poin utama saja. Hemat waktu.' 
              : 'Analisis penuh dengan latar belakang dan nuansa detail.'}
          </p>
        </div>

      </div>
    </div>
  );
};