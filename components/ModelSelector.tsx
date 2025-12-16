import React from 'react';
import { ModelType } from '../types';

interface ModelSelectorProps {
  selected: ModelType;
  onChange: (model: ModelType) => void;
  disabled: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selected, onChange, disabled }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <button
        onClick={() => onChange(ModelType.GEMINI_3_PRO)}
        disabled={disabled}
        className={`flex-1 relative group p-4 rounded-xl border transition-all duration-300 text-left ${
          selected === ModelType.GEMINI_3_PRO
            ? 'bg-synapse-900/30 border-synapse-500 shadow-[0_0_20px_rgba(14,165,233,0.15)]'
            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-bold ${selected === ModelType.GEMINI_3_PRO ? 'text-synapse-400' : 'text-slate-300'}`}>
                Gemini 3.0 Pro
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Deep Research
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kapasitas reasoning tinggi (High-Reasoning). Menggunakan "Thinking Process" untuk analisis mendalam dan sintesis kompleks. Ideal untuk jurnal ilmiah dan artikel panjang.
            </p>
          </div>
          <div className={`w-4 h-4 rounded-full border-2 mt-1 flex items-center justify-center ${selected === ModelType.GEMINI_3_PRO ? 'border-synapse-500' : 'border-slate-600'}`}>
             {selected === ModelType.GEMINI_3_PRO && <div className="w-2 h-2 rounded-full bg-synapse-500" />}
          </div>
        </div>
      </button>

      <button
        onClick={() => onChange(ModelType.GEMINI_2_5_FLASH)}
        disabled={disabled}
        className={`flex-1 relative group p-4 rounded-xl border transition-all duration-300 text-left ${
          selected === ModelType.GEMINI_2_5_FLASH
            ? 'bg-emerald-900/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-bold ${selected === ModelType.GEMINI_2_5_FLASH ? 'text-emerald-400' : 'text-slate-300'}`}>
                Gemini 2.5 Flash
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Fast Scan
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Latensi rendah, sangat cepat. Cocok untuk berita singkat, artikel populer, atau ketika Anda membutuhkan ringkasan instan tanpa analisis berat.
            </p>
          </div>
          <div className={`w-4 h-4 rounded-full border-2 mt-1 flex items-center justify-center ${selected === ModelType.GEMINI_2_5_FLASH ? 'border-emerald-500' : 'border-slate-600'}`}>
             {selected === ModelType.GEMINI_2_5_FLASH && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
          </div>
        </div>
      </button>
    </div>
  );
};