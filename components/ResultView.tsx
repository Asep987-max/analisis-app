import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, ChatMessage } from '../types';

interface ResultViewProps {
  result: AnalysisResult;
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string) => Promise<void>;
  isChatting: boolean;
}

export const ResultView: React.FC<ResultViewProps> = ({ 
  result, 
  chatHistory, 
  onSendMessage,
  isChatting 
}) => {
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatting]);

  // Keyboard Shortcut: Ctrl/Cmd + K to focus chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        chatInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;
    const msg = chatInput;
    setChatInput('');
    await onSendMessage(msg);
  };

  const parseInlineStyles = (text: string) => {
    let parsed = text;
    // Bold
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    // Inline Code
    parsed = parsed.replace(/`(.*?)`/g, '<code class="bg-slate-800 px-1.5 py-0.5 rounded text-synapse-300 font-mono text-sm border border-slate-700">$1</code>');
    return parsed;
  };

  const renderTable = (rows: string[], key: number) => {
    const headerRow = rows[0].split('|').filter(cell => cell.trim().length > 0);
    // Determine if second row is a separator (contains ---)
    const hasSeparator = rows.length > 1 && rows[1].includes('---');
    const startBodyIndex = hasSeparator ? 2 : 1;
    const bodyRows = rows.slice(startBodyIndex);

    return (
      <div key={key} className="my-6 overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-300 uppercase bg-slate-800/50">
            <tr>
              {headerRow.map((cell, idx) => (
                <th key={idx} className="px-6 py-3 border-b border-slate-700">
                  <span dangerouslySetInnerHTML={{ __html: parseInlineStyles(cell.trim()) }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rIdx) => {
              const cells = row.split('|').filter(c => c.trim().length > 0 || row.indexOf(c) > 0); // basic split
              // Cleaner split for pipe tables needed often, but basic works for generated content usually
              const cleanCells = row.split('|').slice(1, -1);
              
              return (
                <tr key={rIdx} className="bg-slate-900/30 border-b border-slate-800 hover:bg-slate-800/30">
                  {cleanCells.map((cell, cIdx) => (
                    <td key={cIdx} className="px-6 py-4">
                       <span dangerouslySetInnerHTML={{ __html: parseInlineStyles(cell.trim()) }} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCodeBlock = (lines: string[], key: number) => {
    const code = lines.join('\n');
    return (
      <pre key={key} className="my-4 p-4 rounded-lg bg-slate-950 border border-slate-800 overflow-x-auto font-mono text-sm text-synapse-200">
        <code>{code}</code>
      </pre>
    );
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    const nodes: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Table detection (starts with |)
      if (trimmed.startsWith('|')) {
        const tableRows = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableRows.push(lines[i]);
          i++;
        }
        nodes.push(renderTable(tableRows, i));
        continue;
      }

      // Code block detection (```)
      if (trimmed.startsWith('```')) {
        i++; // skip start fence
        const codeLines = [];
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        nodes.push(renderCodeBlock(codeLines, i));
        i++; // skip end fence
        continue;
      }

      // Headers
      if (line.startsWith('### ')) {
        nodes.push(<h3 key={i} className="text-lg font-semibold text-synapse-200 mt-6 mb-3">{line.replace('### ', '')}</h3>);
        i++; continue;
      }
      if (line.startsWith('## ')) {
        nodes.push(<h2 key={i} className="text-xl font-bold text-synapse-300 mt-8 mb-4 pb-2 border-b border-slate-800">{line.replace('## ', '')}</h2>);
        i++; continue;
      }
      if (line.startsWith('# ')) {
        nodes.push(<h1 key={i} className="text-2xl font-bold text-synapse-400 mb-6">{line.replace('# ', '')}</h1>);
        i++; continue;
      }

      // Unordered Lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = line.replace(/^[-*]\s/, '');
        nodes.push(
          <div key={i} className="flex gap-3 ml-2 mb-2 text-slate-300">
            <span className="text-synapse-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-synapse-500 shrink-0 block"></span>
            <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: parseInlineStyles(content) }} />
          </div>
        );
        i++; continue;
      }

      // Ordered Lists
      const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (olMatch) {
         nodes.push(
           <div key={i} className="flex gap-3 ml-2 mb-2 text-slate-300">
              <span className="font-mono text-synapse-400 font-bold shrink-0">{olMatch[1]}.</span>
              <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: parseInlineStyles(olMatch[2]) }} />
           </div>
         );
         i++; continue;
      }

      // Blockquotes
      if (trimmed.startsWith('>')) {
        nodes.push(<blockquote key={i} className="border-l-4 border-indigo-500 pl-4 py-2 my-4 bg-slate-800/30 text-slate-400 italic rounded-r">{line.replace(/^>\s?/, '')}</blockquote>);
        i++; continue;
      }

      // Empty lines
      if (trimmed === '') {
        nodes.push(<div key={i} className="h-4" />);
        i++; continue;
      }

      // Paragraphs
      nodes.push(<p key={i} className="mb-2 leading-relaxed text-slate-300" dangerouslySetInnerHTML={{ __html: parseInlineStyles(line) }} />);
      i++;
    }
    return nodes;
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* --- Main Report Section --- */}
      <div className="glass-panel rounded-2xl p-1 mb-6">
        <div className="bg-slate-900/90 rounded-xl overflow-hidden min-h-[300px]">
          
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${result.isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-xs font-mono font-bold text-slate-400 tracking-wider">
                {result.isLoading ? 'GENERATING REPORT...' : 'SYNAPSE REPORT'}
              </span>
              {result.executionTime && (
                 <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-500">{(result.executionTime / 1000).toFixed(1)}s</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCopy}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Copy Markdown"
              >
                {copied ? (
                  <span className="text-emerald-500 text-xs font-bold">Copied!</span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 md:p-10">
            {/* Error Banner */}
            {result.error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 mb-6 flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-bold text-sm">System Alert</p>
                  <p className="text-sm opacity-80">{result.error}</p>
                </div>
              </div>
            )}

            <div className="markdown-body">
              {renderMarkdown(result.markdown)}
              {result.isLoading && (
                <span className="inline-block w-2 h-4 bg-synapse-500 ml-1 animate-pulse align-middle"></span>
              )}
            </div>

            {/* Citations Footer */}
            {!result.isLoading && result.groundingLinks.length > 0 && (
              <div className="mt-12 pt-6 border-t border-slate-800/50">
                <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Verified Sources
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.groundingLinks.map((link, idx) => (
                    <a 
                      key={idx}
                      href={link.web?.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800/50 hover:bg-indigo-900/30 border border-slate-700 hover:border-indigo-500/30 transition-all text-xs text-slate-400 hover:text-indigo-200 max-w-full truncate"
                    >
                      <span className="truncate max-w-[180px]">{link.web?.title || new URL(link.web?.uri || '').hostname}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Chat Context Section --- */}
      {(!result.isLoading && !result.error && result.markdown) && (
        <div className="glass-panel rounded-2xl p-1 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          <div className="bg-slate-900/80 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-synapse-400">◆</span> Ask Synapse <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-mono ml-2 border border-slate-700">Ctrl+K</span>
            </h3>
            
            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar px-1">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                    }`}
                  >
                    {msg.role === 'model' ? (
                       <div className="markdown-body">
                         {renderMarkdown(msg.text)}
                       </div>
                    ) : (
                       msg.text
                    )}
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-700">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSubmitChat} className="relative">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask follow-up questions about this article..."
                disabled={isChatting}
                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-500 focus:border-synapse-500 focus:ring-1 focus:ring-synapse-500 transition-all"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim() || isChatting}
                className="absolute right-2 top-2 p-1.5 bg-synapse-500 hover:bg-synapse-400 text-white rounded-lg disabled:opacity-50 disabled:bg-slate-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};