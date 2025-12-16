import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { ModelSelector } from './components/ModelSelector';
import { ConfigPanel } from './components/ConfigPanel';
import { ResultView } from './components/ResultView';
import { startAnalysisSession, sendFollowUpMessage } from './services/geminiService';
import { ModelType, AnalysisResult, GroundingMetadata, AnalysisConfig, ChatMessage } from './types';
import { Chat } from '@google/genai';

function App() {
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  
  const [model, setModel] = useState<ModelType>(ModelType.GEMINI_3_PRO);
  const [config, setConfig] = useState<AnalysisConfig>({ perspective: 'generalist', depth: 'concise' });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const startTimeRef = useRef<number>(0);

  const validateUrl = (input: string): boolean => {
    if (!input) {
      setUrlError(null);
      return false;
    }
    try {
      new URL(input);
      setUrlError(null);
      return true;
    } catch {
      setUrlError("Format URL tidak valid. Pastikan menggunakan http:// atau https://");
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setUrl(input);
    if (input) validateUrl(input);
    else setUrlError(null);
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;
    if (!validateUrl(url)) return;

    setIsProcessing(true);
    setResult({
      markdown: '',
      groundingLinks: [],
      isLoading: true
    });
    setChatHistory([]); // Reset chat on new analysis
    chatSessionRef.current = null;
    
    startTimeRef.current = Date.now();

    const session = await startAnalysisSession(
      url,
      model,
      config,
      (textChunk) => {
        setResult(prev => ({
          ...prev!,
          markdown: textChunk,
          executionTime: Date.now() - startTimeRef.current
        }));
      },
      (groundingChunks: GroundingMetadata[]) => {
        const uniqueLinks = groundingChunks.filter((v, i, a) => a.findIndex(t => (t.web?.uri === v.web?.uri)) === i);
        setResult(prev => ({
          ...prev!,
          isLoading: false,
          groundingLinks: uniqueLinks,
          executionTime: Date.now() - startTimeRef.current
        }));
        setIsProcessing(false);
      },
      (errorMessage) => {
        setResult(prev => ({
          ...prev!,
          isLoading: false,
          error: errorMessage,
          executionTime: Date.now() - startTimeRef.current
        }));
        setIsProcessing(false);
      }
    );

    if (session) {
      chatSessionRef.current = session;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleAnalyze();
    }
  };

  const handleChat = async (message: string) => {
    if (!chatSessionRef.current) return;

    setIsChatting(true);
    
    // Add User Message
    const userMsg: ChatMessage = { role: 'user', text: message, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);

    // Placeholder for AI Message
    let aiResponseText = "";
    
    await sendFollowUpMessage(
      chatSessionRef.current,
      message,
      (textChunk) => {
        aiResponseText = textChunk; // Update local accumulator
        setChatHistory(prev => {
          const newHistory = [...prev];
          // If the last message is model, update it, otherwise add it
          const lastMsg = newHistory[newHistory.length - 1];
          if (lastMsg.role === 'model' && lastMsg.timestamp > userMsg.timestamp) {
             lastMsg.text = aiResponseText;
          } else {
             newHistory.push({ role: 'model', text: aiResponseText, timestamp: Date.now() });
          }
          return newHistory;
        });
      },
      () => {
        setIsChatting(false);
      },
      (error) => {
        setChatHistory(prev => [...prev, { role: 'model', text: `Error: ${error}`, timestamp: Date.now() }]);
        setIsChatting(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-synapse-500/30 font-sans">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        
        {/* Intro Section - Hide when result exists to focus on content */}
        {!result && (
          <div className="text-center mb-10 md:mb-14 animate-in fade-in slide-in-from-top-4 duration-700">
            <h2 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-slate-400 mb-6 tracking-tight">
              Cognitive Research <br/>
              <span className="text-synapse-400">Assistant.</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              Bukan sekadar peringkas. Synapse menganalisis, mengontekstualisasikan, dan mendiskusikan materi riset kompleks bersama Anda menggunakan 
              <span className="text-indigo-400 font-semibold mx-1">Gemini 3.0</span>
            </p>
          </div>
        )}

        {/* Input & Config Area */}
        <div className={`max-w-3xl mx-auto transition-all duration-500 ${result ? 'mb-8' : 'mb-16'} relative z-10`}>
          <form onSubmit={handleAnalyze} className="space-y-6">
            
            {/* URL Input */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-synapse-500 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className={`relative bg-slate-900 rounded-2xl p-2 flex items-center border transition-colors ${urlError ? 'border-red-500/50' : 'border-slate-700 group-focus-within:border-synapse-500/50'}`}>
                <div className="pl-4 pr-3 text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <input
                  type="url"
                  placeholder="Tempel URL Jurnal, Artikel Berita, atau Repositori..."
                  value={url}
                  onChange={handleUrlChange}
                  onKeyDown={handleKeyDown}
                  disabled={isProcessing}
                  required
                  className="w-full bg-transparent border-none text-slate-200 placeholder-slate-500 focus:ring-0 py-3 text-base"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !url || !!urlError}
                  title="Ctrl + Enter"
                  className={`mx-1 px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-300 transform active:scale-95 ${
                    isProcessing || !url || !!urlError
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-synapse-600 to-indigo-600 hover:from-synapse-500 hover:to-indigo-500 text-white shadow-lg shadow-synapse-500/25'
                  }`}
                >
                  {isProcessing ? 'Thinking...' : 'Analyze'}
                </button>
              </div>
              {urlError && (
                <div className="absolute left-4 -bottom-6 text-xs text-red-400 font-medium animate-in fade-in slide-in-from-top-1">
                  {urlError}
                </div>
              )}
            </div>

            {/* Config Panel - Always visible but disabled during processing */}
            <ConfigPanel config={config} onChange={setConfig} disabled={isProcessing} />

            {/* Model Selection */}
            <ModelSelector 
              selected={model} 
              onChange={setModel} 
              disabled={isProcessing} 
            />

          </form>
        </div>

        {/* Results Area */}
        {result && (
          <ResultView 
            result={result} 
            chatHistory={chatHistory}
            onSendMessage={handleChat}
            isChatting={isChatting}
          />
        )}

      </main>
      
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-synapse-900/10 rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
}

export default App;