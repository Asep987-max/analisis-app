import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-6 px-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-synapse-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-synapse-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Synapse</h1>
            <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">AI Research Synthesizer</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-500">
          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">v1.0.0</span>
          <span className="text-synapse-500">Powered by Gemini 3.0</span>
        </div>
      </div>
    </header>
  );
};