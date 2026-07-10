import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, CheckCircle, RefreshCw, Settings, X, BookOpen, Upload, Lock, FileText, Globe, Plus } from 'lucide-react';
import { Markdown } from './Markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  okfMatch?: boolean;
  concept?: string;
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Agent powered by Google ADK and Open Knowledge Format. Ask me about `adk` or `okf` to see local grounding in action!',
    },
  ]);
  interface Concept {
    id: string;
    type: string;
    title: string;
    description: string;
    tags: string[];
    content: string;
  }

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openrouter_api_key') || '');
  const [activeTab, setActiveTab] = useState<'key' | 'guide'>('key');
  const [error, setError] = useState<string | null>(null);

  const [localConcepts, setLocalConcepts] = useState<Concept[]>([]);
  const [systemConcepts, setSystemConcepts] = useState<Concept[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSaveKey = (val: string) => {
    setApiKey(val);
    localStorage.setItem('openrouter_api_key', val);
  };

  useEffect(() => {
    fetch('http://localhost:8040/api/concepts')
      .then(res => res.json())
      .then(data => setSystemConcepts(data.concepts || []))
      .catch(err => console.warn('Failed to load system concepts:', err));
  }, []);
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetUrl = urlInput.trim();
    if (!targetUrl || isThinking) return;
    
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }
    
    setUrlError(null);
    setIsThinking(true);

    try {
      const res = await fetch("http://localhost:8040/api/convert_url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await res.json();
      if (data.error) {
        setUrlError(data.error);
      } else {
        setLocalConcepts(prev => {
          const filtered = prev.filter(c => c.id !== data.id);
          return [...filtered, data];
        });
        setUrlInput('');
      }
    } catch (err) {
      setUrlError("Failed to convert URL page content.");
    } finally {
      setIsThinking(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);
    setError(null);

    // Prepare message history payload for the backend
    const updatedMessages = [...messages, userMessage];

    try {
      const response = await fetch('http://localhost:8040/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          use_ai: useAI,
          api_key: apiKey || undefined,
          local_concepts: localConcepts,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body returned from server');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      // Initialize assistant placeholder message in state
      let assistantMessage: Message = { role: 'assistant', content: '' };
      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Hold onto uncompleted line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              
              // Handle metadata flags
              if (data.okf_match !== undefined) {
                assistantMessage.okfMatch = data.okf_match;
              }
              if (data.concept) {
                assistantMessage.concept = data.concept;
              }
              
              // Append streamed text chunk
              if (data.text) {
                assistantMessage.content += data.text;
                // Trigger state update to force re-render with new content
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...assistantMessage };
                  return updated;
                });
              }
            } catch (err) {
              console.warn('Failed to parse SSE payload:', err);
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to communicate with AI Agent');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error attempting to process your request. Please ensure the backend is running.',
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mx-auto h-[calc(100vh-80px)] my-4 px-4 select-none">
      {/* Sidebar - Catalog Explorer & File Uploads */}
      {showSidebar && (
        <div className="w-full md:w-[300px] shrink-0 glassmorphism rounded-2xl border border-white/10 p-5 flex flex-col h-[300px] md:h-full overflow-hidden animate-fade-in relative z-10">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/5 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-indigo-400" />
              <h3 className="text-xs font-bold text-white tracking-wider uppercase m-0">OKF Catalog Explorer</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowSidebar(false)}
              className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Close Sidebar"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Privacy Sandbox Card */}
          <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-left mb-4 shrink-0 shadow-inner">
            <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[10px] mb-1.5 uppercase tracking-widest">
              <Lock className="w-3.5 h-3.5" />
              <span>🔒 Private Sandbox</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed m-0">
              Uploaded files are converted and stored entirely in browser memory. No source code or assets are stored on the server or git. To persist files, clone this repository.
            </p>
          </div>

          {/* Uploader Dropzone */}
          <div className="relative border border-dashed border-white/20 hover:border-indigo-500/40 rounded-xl p-4 text-center cursor-pointer transition-all bg-white/[0.01] hover:bg-white/[0.02] flex flex-col items-center gap-1.5 shrink-0 group mb-4">
            <input
              type="file"
              accept=".pdf,.docx,.xlsx,.pptx,.doc,.xls,.ppt,.odt,.ods,.odp,.rtf,.html,.htm,.xml,.csv,.json,.txt,.zip,.png,.jpg,.jpeg,.webp,.gif,.mp4,.mov,.m4a,.avi,.mkv,.pages,.numbers,.key,.md,.mp3,.wav,.mobi,.epub,.rss,.opml,.markdown,.tex,.latex,.org,.rst,.wiki,.mediawiki,.dokuwiki"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadError(null);
                setIsThinking(true);
                
                const formData = new FormData();
                formData.append("file", file);
                if (apiKey) {
                  formData.append("api_key", apiKey);
                }
                
                try {
                  const res = await fetch("http://localhost:8040/api/convert", {
                    method: "POST",
                    body: formData
                  });
                  const data = await res.json();
                  if (data.error) {
                    setUploadError(data.error);
                  } else {
                    setLocalConcepts(prev => {
                      const filtered = prev.filter(c => c.id !== data.id);
                      return [...filtered, data];
                    });
                  }
                } catch (err) {
                  setUploadError("Failed to convert file on backend.");
                } finally {
                  setIsThinking(false);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="w-5.5 h-5.5 text-gray-400 group-hover:text-indigo-400 transition-colors" />
            <span className="text-[11px] font-semibold text-gray-300">Upload Knowledge File</span>
            <span className="text-[9px] text-gray-500">PDF, DOC/X, XLS/X, PPT/X, ODT, ODS, HTML, XML, ZIP, MD, Mac, Media</span>
          </div>

          {uploadError && (
            <p className="text-[10px] text-rose-400 text-left mb-3 pl-1 font-medium">{uploadError}</p>
          )}

          {/* URL Ingestion Form */}
          <form onSubmit={handleUrlSubmit} className="mb-4 shrink-0">
            <div className="flex items-center gap-1.5 rounded-xl bg-white/[0.02] border border-white/10 p-1 group focus-within:border-indigo-500/50 transition-colors">
              <div className="pl-2.5 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="Ingest URL (https://...)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 min-w-0 bg-transparent border-none text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-0 py-1.5"
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors cursor-pointer"
                title="Convert Webpage"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {urlError && (
              <p className="text-[10px] text-rose-400 text-left mt-1.5 pl-1 font-medium">{urlError}</p>
            )}
          </form>

          {/* Catalog Listing */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-left">
            {/* System Concepts */}
            <div>
              <span className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase block mb-2 select-none">System Grounding ({systemConcepts.length})</span>
              <div className="space-y-1.5">
                {systemConcepts.map((concept) => (
                  <button
                    key={concept.id}
                    type="button"
                    onClick={() => {
                      setInput(concept.id);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all flex items-start gap-2.5 group cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-300 truncate group-hover:text-white transition-colors m-0">{concept.title}</p>
                      <p className="text-[9px] text-gray-500 truncate m-0 font-mono">{concept.id}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Session In-Memory Concepts */}
            <div>
              <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase block mb-2 select-none">Session Memory ({localConcepts.length})</span>
              {localConcepts.length === 0 ? (
                <p className="text-[10px] text-gray-500 italic pl-1 m-0">No uploaded files yet</p>
              ) : (
                <div className="space-y-1.5">
                  {localConcepts.map((concept) => (
                    <button
                      key={concept.id}
                      type="button"
                      onClick={() => {
                        setInput(concept.id);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/25 transition-all flex items-start gap-2.5 group cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-300 truncate group-hover:text-white transition-colors m-0">{concept.title}</p>
                        <p className="text-[9px] text-emerald-500/70 truncate m-0 font-mono">{concept.id}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 glassmorphism rounded-2xl shadow-2xl overflow-hidden border border-white/10 h-full relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            {!showSidebar && (
              <button
                type="button"
                onClick={() => setShowSidebar(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Show Catalog"
              >
                <BookOpen className="w-4.5 h-4.5 text-indigo-400" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <Bot className="w-5 font-bold text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight font-heading m-0">ADK OKF Agent</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-gray-400 font-medium">Local Engine Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/10 shadow-inner">
            <span className="text-[11px] md:text-xs font-semibold tracking-wider text-gray-400 select-none uppercase">AI API Fallback</span>
            <button
              type="button"
              onClick={() => setUseAI(!useAI)}
              className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                useAI ? 'bg-indigo-500' : 'bg-white/10'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  useAI ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            title="OpenRouter Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setMessages([{ role: 'assistant', content: 'Hello! Message log cleared. Ask me anything!' }])}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            title="Clear Conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div key={index} className={`flex items-start gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
              )}

              <div className="max-w-[85%] flex flex-col gap-1.5">
                {/* OKF Badge */}
                {!isUser && msg.okfMatch && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs w-fit mb-1 font-medium tracking-wide shadow-sm animate-fade-in">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>OKF Grounded: <strong>{msg.concept}</strong></span>
                  </div>
                )}

                <div
                  className={`px-4 py-3 rounded-2xl shadow-sm text-sm ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-tr-none border border-indigo-400/20'
                      : 'bg-white/[0.03] text-gray-200 border border-white/5 rounded-tl-none'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap select-text text-left leading-relaxed">{msg.content}</p>
                  ) : (
                    <Markdown content={msg.content || '...'} onLinkClick={(val) => setInput(val)} />
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/15">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isThinking && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex items-start gap-4 justify-start">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex flex-col gap-1.5 max-w-[85%]">
              <div className="px-5 py-4 bg-white/[0.03] border border-white/5 rounded-2xl rounded-tl-none flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                </span>
                <span className="text-sm text-gray-400 font-medium tracking-wide">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-rose-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm font-medium text-left">
              <p className="font-semibold">Connection Error</p>
              <p className="text-xs text-rose-400/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-white/[0.01]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isThinking ? 'Waiting for response...' : 'Type a query (e.g. "What is OKF?")'}
            disabled={isThinking}
            className="w-full pl-5 pr-14 py-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.03] focus:bg-white/[0.04] border border-white/15 focus:border-indigo-500/50 outline-none text-white text-sm transition-all shadow-inner placeholder-gray-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="absolute right-2 p-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:bg-white/5 text-white disabled:text-gray-500 transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 disabled:shadow-none flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="glassmorphism rounded-2xl w-full max-w-lg shadow-2xl border border-white/10 flex flex-col relative overflow-hidden text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white tracking-tight font-heading m-0">OpenRouter Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer border-0 outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 text-sm">
              <button
                type="button"
                onClick={() => setActiveTab('key')}
                className={`flex-1 py-3 text-center border-b-2 font-medium transition-colors cursor-pointer border-0 outline-none bg-transparent ${
                  activeTab === 'key'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                API Credentials
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('guide')}
                className={`flex-1 py-3 text-center border-b-2 font-medium transition-colors cursor-pointer border-0 outline-none bg-transparent ${
                  activeTab === 'guide'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Free Preset Guide
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[350px] overflow-y-auto space-y-4">
              {activeTab === 'key' ? (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">OpenRouter API Key</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => handleSaveKey(e.target.value)}
                      placeholder="REMOVED_KEY"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/10 focus:border-indigo-500/50 outline-none text-white text-sm transition-all shadow-inner"
                    />
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Your key is saved locally in your browser's <code className="bg-white/10 px-1 py-0.5 rounded text-indigo-300 font-mono text-[10px]">localStorage</code> and never sent to any server except directly to the local backend runner for LLM fallbacks. Leave empty to use the system default key.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 text-sm text-gray-300 leading-relaxed">
                  <h4 className="text-white font-semibold m-0 text-sm">How to Configure Free Presets on OpenRouter:</h4>
                  
                  <div className="space-y-2 pl-1">
                    <div className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center font-mono text-xs text-indigo-400 shrink-0 mt-0.5">1</span>
                      <p className="m-0 text-xs">Navigate to <strong>OpenRouter.ai</strong>, log in, and head to the <strong>Keys</strong> tab under your dashboard.</p>
                    </div>

                    <div className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center font-mono text-xs text-indigo-400 shrink-0 mt-0.5">2</span>
                      <p className="m-0 text-xs">Generate a new API key. You can set credit limits to ensure zero unexpected charges.</p>
                    </div>

                    <div className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center font-mono text-xs text-indigo-400 shrink-0 mt-0.5">3</span>
                      <p className="m-0 text-xs">When configuring presets or requests, OpenRouter supports routing suffixes. You can append <code className="bg-white/10 px-1 py-0.5 rounded text-indigo-300 font-mono text-[10px]">:free</code> to any free tier model identifier (e.g. <code className="bg-white/10 px-1 py-0.5 rounded text-indigo-300 font-mono text-[10px]">tencent/hy3:free</code> or <code className="bg-white/10 px-1 py-0.5 rounded text-indigo-300 font-mono text-[10px]">google/gemini-2.5-flash:free</code>).</p>
                    </div>

                    <div className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center font-mono text-xs text-indigo-400 shrink-0 mt-0.5">4</span>
                      <p className="m-0 text-xs">This ensures the LLM fallback strictly utilizes zero-cost endpoints, preventing unexpected billing.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01] flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-xs md:text-sm shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer border-0 outline-none"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  </div>
);
};
