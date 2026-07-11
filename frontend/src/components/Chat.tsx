import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, CheckCircle, RefreshCw, Settings, X, BookOpen, Upload, Lock, FileText, Globe, Plus, Trash2, ChevronDown, Sun, Moon } from 'lucide-react';
import { Markdown } from './Markdown';

// ponytail: PWA install event type (not in standard TS lib yet)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  okfMatch?: boolean;
  concept?: string;
}

// ponytail: thinking collapses into an accordion; shown only when Show Thinking toggle is on. Excluded from the response body.
const ThinkingBlock: React.FC<{ thinking: string }> = ({ thinking }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-1.5 rounded-lg border border-white/5 bg-white/[0.01] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-gray-400 hover:text-gray-200 transition-colors cursor-pointer outline-none"
      >
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? '' : '-rotate-90'}`} />
        <span>Thinking</span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-white/[0.03] text-[11px] italic leading-relaxed text-gray-400/80 whitespace-pre-wrap select-text max-h-[200px] overflow-y-auto pl-3 border-l-2 border-white/10">
          {thinking}
        </div>
      )}
    </div>
  );
};

// ponytail: pull pure-OKF "Possible follow-up" bullets out so they render as clickable chips, not markdown text
function extractFollowups(content: string): { body: string; followups: string[] } {
  const marker = '**Possible follow-up:**';
  const idx = content.indexOf(marker);
  if (idx === -1) return { body: content, followups: [] };
  const body = content.slice(0, idx).trim();
  const fuText = content.slice(idx + marker.length);
  const followups = fuText.split('\n').map(l => l.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
  return { body, followups };
}

// ponytail: single API base; relative by default so any port works when backend serves the build. Override with VITE_API_URL.
const API: string = (import.meta.env.VITE_API_URL as string) || '';

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
  const [pureOkf, setPureOkf] = useState(() => localStorage.getItem('pure_okf') === 'true');
  const [showThinking, setShowThinking] = useState(() => localStorage.getItem('show_thinking') === 'true');
  const [useSystemGrounding, setUseSystemGrounding] = useState(() => localStorage.getItem('use_system_grounding') !== 'false');
  const [sysOpen, setSysOpen] = useState(true);
  const [sessOpen, setSessOpen] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') === 'light' ? 'light' : 'dark'));
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [viewConcept, setViewConcept] = useState<Concept | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draftContent, setDraftContent] = useState('');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openrouter_api_key') || '');
  const [activeTab, setActiveTab] = useState<'key' | 'profile' | 'guide'>('key');
  const [agentName, setAgentName] = useState(() => localStorage.getItem('agent_name') || 'Antigravity Grounding Core');
  const [agentTone, setAgentTone] = useState(() => localStorage.getItem('agent_tone') || 'Helpful, warm, concise, professional');
  const [agentBehaviors, setAgentBehaviors] = useState(() => localStorage.getItem('agent_behaviors') || 'Speak with structured lists. Cite documents clearly. Avoid CoT leakage.');
  const [error, setError] = useState<string | null>(null);

  const [localConcepts, setLocalConcepts] = useState<Concept[]>([]);
  const [systemConcepts, setSystemConcepts] = useState<Concept[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('pure_okf', pureOkf.toString());
  }, [pureOkf]);

  useEffect(() => {
    localStorage.setItem('show_thinking', showThinking.toString());
  }, [showThinking]);

  useEffect(() => {
    localStorage.setItem('agent_name', agentName);
  }, [agentName]);

  useEffect(() => {
    localStorage.setItem('agent_tone', agentTone);
  }, [agentTone]);

  useEffect(() => {
    localStorage.setItem('agent_behaviors', agentBehaviors);
  }, [agentBehaviors]);

  const handleSaveKey = (val: string) => {
    setApiKey(val);
    localStorage.setItem('openrouter_api_key', val);
  };

  useEffect(() => {
    fetch(API + '/api/concepts')
      .then(res => res.json())
      .then(data => setSystemConcepts(data.concepts || []))
      .catch(err => console.warn('Failed to load system concepts:', err));
  }, []);
  const removeSystemConcept = async (id: string) => {
    try {
      await fetch(`${API}/api/concepts/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setSystemConcepts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.warn('Failed to delete system concept:', err);
    }
  };
  const saveConcept = async (concept: Concept, content: string) => {
    try {
      const res = await fetch(`${API}/api/concepts/${encodeURIComponent(concept.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.error) { console.warn('Save failed:', data.error); return; }
      setSystemConcepts(prev => prev.map(c => c.id === concept.id ? { ...c, content } : c));
      setLocalConcepts(prev => prev.map(c => c.id === concept.id ? { ...c, content } : c));
    } catch (err) {
      console.warn('Failed to save concept:', err);
    }
  };
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetUrl = urlInput.trim();
    if (!targetUrl || isThinking) return;
    
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }
    
    if (localConcepts.some(c => c.title.toLowerCase() === targetUrl.toLowerCase())) {
      setUrlError("URL is already in memory.");
      return;
    }
    
    setUrlError(null);
    setIsThinking(true);

    try {
      const res = await fetch(`${API}/api/convert_url`, {
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

  const submitQuery = async (text: string) => {
    const q = text.trim();
    if (!q || isThinking) return;

    const userMessage: Message = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);
    setError(null);

    const updatedMessages = [...messages, userMessage];

    try {
      const response = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          use_ai: !pureOkf,
          pure_okf: pureOkf,
          use_system_grounding: useSystemGrounding,
          api_key: apiKey || undefined,
          agent_name: agentName,
          agent_tone: agentTone,
          agent_behaviors: agentBehaviors,
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
              
              let hasChange = false;
              if (data.thinking) {
                assistantMessage.thinking = (assistantMessage.thinking || '') + data.thinking;
                hasChange = true;
              }
              if (data.text) {
                assistantMessage.content += data.text;
                hasChange = true;
              }
              if (hasChange) {
                let rawText = assistantMessage.content;
                let rawThinking = assistantMessage.thinking || '';

                // ponytail: separate <think>...</think> reasoning from the answer.
                // Handles streaming partial tags by keeping an unterminated tag in the
                // text block until its closing tag arrives.
                if (rawText.includes('<think>') || rawText.includes('</think>') || rawText.includes('<thinking>') || rawText.includes('</thinking>')) {
                  // ponytail: split on FIRST reasoning tag (handles <think>, <thinking> and
                  // the Gemini/OpenAI native <reasoning> too). Unterminated tag stays in
                  // rawText so the next chunk re-enters this branch; its content is held in
                  // rawThinking. Models that emit no tag → nothing matches → full text = answer.
                  const openRe = /<think(?:ing)?>|<reasoning>/i;
                  const closeRe = /<\/think(?:ing)?>|<\/reasoning>/i;
                  const openMatch = openRe.exec(rawText);
                  const closeMatch = closeRe.exec(rawText);
                  if (openMatch && (!closeMatch || openMatch.index < closeMatch.index)) {
                    const openTag = openMatch[0];
                    const beforeThink = rawText.slice(0, openMatch.index);
                    const afterOpen = rawText.slice(openMatch.index + openTag.length);
                    const cMatch = closeRe.exec(afterOpen);
                    if (cMatch) {
                      const thinkText = afterOpen.slice(0, cMatch.index);
                      const afterThink = afterOpen.slice(cMatch.index + cMatch[0].length);
                      rawThinking = (rawThinking ? rawThinking + '\n' : '') + thinkText;
                      rawText = beforeThink + afterThink;
                    } else {
                      rawThinking = (rawThinking ? rawThinking + '\n' : '') + afterOpen;
                      rawText = beforeThink + openTag + afterOpen;
                    }
                  } else if (closeMatch) {
                    rawText = rawText.slice(closeMatch.index + closeMatch[0].length);
                  }
                }
                
                assistantMessage.content = rawText;
                assistantMessage.thinking = rawThinking;
                
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuery(input);
  };

  return (
    <div className="flex flex-col md:flex-row gap-0 md:gap-6 w-full max-w-6xl mx-auto h-[100dvh] md:h-[calc(100vh-48px)] md:my-4 px-0 md:px-4 select-none safe-pad">
      {viewConcept && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
          <div className="surface-solid rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-white/10 relative z-[61] animate-fade-in">
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  if (viewConcept.id.startsWith('session/')) {
                    setLocalConcepts(prev => prev.filter(c => c.id !== viewConcept.id));
                  } else {
                    await removeSystemConcept(viewConcept.id);
                  }
                  setViewConcept(null); setEditMode(false);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer border-0 shrink-0"
                title="Delete concept"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
              <h3 className="text-sm font-bold text-white tracking-wide truncate m-0 flex-1 min-w-0">{viewConcept.title}</h3>
              <button
                type="button"
                onClick={() => { setEditMode(e => !e); if (!editMode) setDraftContent(viewConcept.content); }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer shrink-0"
              >
                {editMode ? 'Preview' : 'Edit'}
              </button>
              <button
                type="button"
                onClick={() => { setViewConcept(null); setEditMode(false); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border-0 shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-5">
              {editMode ? (
                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className="w-full h-full min-h-[300px] resize-none bg-black/20 border border-white/10 rounded-xl p-3 text-xs text-gray-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500/50"
                  spellCheck={false}
                />
              ) : (
                <div className="text-sm text-gray-200 leading-relaxed markdown-body">
                  <Markdown content={viewConcept.content} onLinkClick={(val) => { setViewConcept(null); setInput(val); }} />
                </div>
              )}
            </div>
            {editMode && (
              <button
                type="button"
                onClick={async () => { await saveConcept(viewConcept, draftContent); setEditMode(false); setViewConcept({ ...viewConcept, content: draftContent }); }}
                className="absolute bottom-4 right-4 p-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-colors cursor-pointer border-0"
                title="Save and close"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
      {/* Sidebar - Catalog Explorer & File Uploads (mobile fly-out drawer) */}
      {showSidebar && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setShowSidebar(false)} />
          <div className="fixed md:static inset-y-0 left-0 z-50 md:z-10 w-[85%] max-w-sm md:w-[300px] md:max-w-none glassmorphism okf-drawer rounded-none md:rounded-2xl border border-white/10 md:border-white/10 p-4 md:p-5 flex flex-col h-full md:h-full overflow-hidden animate-fade-in relative">
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
                
                if (localConcepts.some(c => c.title === file.name)) {
                  setUploadError("File is already in memory.");
                  return;
                }
                
                setIsThinking(true);
                
                const formData = new FormData();
                formData.append("file", file);
                if (apiKey) {
                  formData.append("api_key", apiKey);
                }
                
                try {
                  const res = await fetch(`${API}/api/convert`, {
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

          {/* Catalog Listing — two independently scrolling, collapsible sections */}
          <div className="flex-1 min-h-0 flex flex-col gap-3 text-left">
            {/* System Grounding */}
            <div className={`${sysOpen ? 'flex-1 min-h-0' : ''} flex flex-col`}>
              <button
                type="button"
                onClick={() => setSysOpen(o => !o)}
                className="flex items-center justify-between gap-2 px-2 py-2 rounded-lg bg-white/[0.02] border border-white/5 sticky top-0 z-10 select-none cursor-pointer"
              >
                <span className="text-[11px] font-bold text-indigo-400 tracking-widest uppercase">System Grounding ({systemConcepts.length})</span>
                <div className="flex items-center gap-2">
                  <span
                    onClick={(e) => { e.stopPropagation(); setUseSystemGrounding(v => { localStorage.setItem('use_system_grounding', String(!v)); return !v; }); }}
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${useSystemGrounding ? 'bg-indigo-500' : 'bg-white/10'}`}
                    title="Use system grounding files for matching"
                  >
                    <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useSystemGrounding ? 'translate-x-3' : 'translate-x-0'}`} />
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${sysOpen ? '' : '-rotate-90'}`} />
                </div>
              </button>
              {sysOpen && (
                <div className="flex-1 min-h-0 overflow-y-auto mt-2 pr-1 space-y-2.5">
                  {systemConcepts.length === 0 ? (
                    <p className="text-[10px] text-gray-500 italic pl-1 m-0">No system files</p>
                  ) : systemConcepts.map((concept) => (
                    <div
                      key={concept.id}
                      className="w-full flex items-center justify-between gap-1.5 p-2 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 group hover:bg-white/[0.03] transition-all select-none"
                    >
                      <button
                        type="button"
                        onClick={() => { setViewConcept(concept); setEditMode(false); setDraftContent(concept.content); }}
                        className="flex-1 text-left px-1 py-0.5 flex items-start gap-2.5 min-w-0 bg-transparent border-0 cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-300 truncate group-hover:text-white transition-colors m-0">{concept.title}</p>
                          <p className="text-[9px] text-gray-500 truncate m-0 font-mono">{concept.id}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeSystemConcept(concept.id); }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-0 mr-1 shrink-0"
                        title="Remove system grounding file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Session Memory */}
            <div className={`${sessOpen ? 'flex-1 min-h-0' : ''} flex flex-col`}>
              <button
                type="button"
                onClick={() => setSessOpen(o => !o)}
                className="flex items-center justify-between px-2 py-2 rounded-lg bg-white/[0.02] border border-white/5 sticky top-0 z-10 select-none cursor-pointer"
              >
                <span className="text-[11px] font-bold text-emerald-400 tracking-widest uppercase">Session Memory ({localConcepts.length})</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${sessOpen ? '' : '-rotate-90'}`} />
              </button>
              {sessOpen && (
                <div className="flex-1 min-h-0 overflow-y-auto mt-2 pr-1 space-y-2.5">
                  {localConcepts.length === 0 ? (
                    <p className="text-[10px] text-gray-500 italic pl-1 m-0">No uploaded files yet</p>
                  ) : localConcepts.map((concept) => (
                    <div
                      key={concept.id}
                      className="w-full flex items-center justify-between gap-1.5 p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/25 group hover:bg-emerald-500/10 transition-all select-none"
                    >
                      <button
                        type="button"
                        onClick={() => { setViewConcept(concept); setEditMode(false); setDraftContent(concept.content); }}
                        className="flex-1 text-left px-1 py-0.5 flex items-start gap-2.5 min-w-0 bg-transparent border-0 cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-300 truncate group-hover:text-white transition-colors m-0">{concept.title}</p>
                          <p className="text-[9px] text-emerald-500/70 truncate m-0 font-mono">{concept.id}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLocalConcepts(prev => prev.filter(c => c.id !== concept.id)); }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-0 mr-1 shrink-0"
                        title="Remove from session memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </>)}

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 glassmorphism rounded-2xl shadow-2xl overflow-hidden border border-white/10 h-full relative">
        {showInstall && deferredPrompt && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-500/10 border-b border-indigo-500/20 text-xs text-gray-200 shrink-0 safe-pad">
            <span className="flex-1 min-w-0">Install ADK OKF Agent for offline use.</span>
            <button
              type="button"
              onClick={async () => {
                await deferredPrompt.prompt();
                setShowInstall(false);
                setDeferredPrompt(null);
              }}
              className="px-3 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-xs border-0 cursor-pointer shrink-0"
            >
              Install
            </button>
            <button
              type="button"
              onClick={() => { setShowInstall(false); setDeferredPrompt(null); }}
              className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer border-0 bg-transparent shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {/* Header */}
        <div className="px-3 md:px-6 py-3 md:py-4 border-b border-white/5 bg-white/[0.02] shrink-0 safe-pad flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
                <Bot className="w-5 font-bold text-white" />
              </div>
              <div className="min-w-0 flex flex-col">
                <h2 className="text-base md:text-lg font-semibold text-white tracking-tight font-heading m-0 leading-tight truncate">ADK OKF Agent</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[10px] md:text-xs text-gray-400 font-medium whitespace-nowrap">Local Engine Active</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              {!showSidebar && (
                <button
                  type="button"
                  onClick={() => setShowSidebar(true)}
                  className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/10"
                  title="Show Catalog"
                >
                  <BookOpen className="w-4.5 h-4.5 text-indigo-400" />
                </button>
              )}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors border border-white/10"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors border border-white/10"
              title="OpenRouter Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMessages([{ role: 'assistant', content: 'Hello! Message log cleared. Ask me anything!' }])}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors border border-white/10"
              title="Clear Conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-xl bg-white/[0.02] border border-white/10 shadow-inner">
              <span className={`text-[10px] md:text-[11px] font-semibold tracking-wide uppercase select-none transition-colors ${pureOkf ? 'text-indigo-300' : 'text-gray-500'}`}>Pure OKF</span>
              <button
                type="button"
                onClick={() => setPureOkf(!pureOkf)}
                className={`relative inline-flex h-5 w-9 md:h-5.5 md:w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                  pureOkf ? 'bg-indigo-500' : 'bg-white/10'
                }`}
                title="Toggle between +AI API (OpenRouter) and pure OKF (no LLM) mode"
              >
                <span
                  className={`pointer-events-none inline-block h-3.5 w-3.5 md:h-4.5 md:w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    pureOkf ? 'translate-x-3.5 md:translate-x-4.5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-[10px] md:text-[11px] font-semibold tracking-wide uppercase select-none transition-colors ${pureOkf ? 'text-gray-500' : 'text-indigo-300'}`}>+AI API</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2.5 px-2 md:px-3 py-1 md:py-1.5 rounded-xl bg-white/[0.02] border border-white/10 shadow-inner">
              <span className="text-[10px] md:text-[11px] font-semibold tracking-wider text-gray-400 select-none uppercase">Thinking</span>
              <button
                type="button"
                onClick={() => setShowThinking(!showThinking)}
                className={`relative inline-flex h-5 w-9 md:h-5.5 md:w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                  showThinking ? 'bg-indigo-500' : 'bg-white/10'
                }`}
                title="Display cognitive reasoning traces"
              >
                <span
                  className={`pointer-events-none inline-block h-3.5 w-3.5 md:h-4.5 md:w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    showThinking ? 'translate-x-3.5 md:translate-x-4.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
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

                {!isUser && msg.thinking && showThinking && (
                  <ThinkingBlock thinking={msg.thinking} />
                )}

                {(() => {
                  const { body, followups } = extractFollowups(msg.content);
                  return (
                    <>
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-sm text-sm ${
                          isUser
                            ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-tr-none border border-indigo-400/20'
                            : 'bg-white/[0.03] text-gray-200 border border-white/5 rounded-tl-none'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap select-text text-left leading-relaxed">{body}</p>
                        ) : (
                          <Markdown content={body || '...'} onLinkClick={(val) => setInput(val)} />
                        )}
                      </div>
                      {followups.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-0.5">
                          {followups.map((f, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => submitQuery(f)}
                              className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10 text-gray-300 hover:text-white hover:border-indigo-500/40 transition-colors cursor-pointer"
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
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
        <div className="fixed inset-0 flex items-center justify-center z-[70] p-4 transition-all duration-300">
          <div className="surface-solid rounded-2xl w-full max-w-lg shadow-2xl border border-white/10 flex flex-col relative z-[71] overflow-hidden text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
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
            <div className="flex border-b border-white/5 text-sm shrink-0">
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
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 text-center border-b-2 font-medium transition-colors cursor-pointer border-0 outline-none bg-transparent ${
                  activeTab === 'profile'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Agent Profile
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
                Preset Guide
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[420px] overflow-y-auto space-y-4">
              {activeTab === 'key' && (
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
              )}

              {activeTab === 'profile' && (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Agent Name</label>
                    <input
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="Antigravity Grounding Core"
                      className="w-full px-4 py-2 rounded-xl bg-white/[0.02] border border-white/10 focus:border-indigo-500/50 outline-none text-white text-xs transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Personality & Tone</label>
                    <textarea
                      value={agentTone}
                      onChange={(e) => setAgentTone(e.target.value)}
                      placeholder="Helpful, warm, concise, professional..."
                      rows={2}
                      className="w-full px-4 py-2 rounded-xl bg-white/[0.02] border border-white/10 focus:border-indigo-500/50 outline-none text-white text-xs transition-all shadow-inner resize-none font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Behavioral Instructions</label>
                    <textarea
                      value={agentBehaviors}
                      onChange={(e) => setAgentBehaviors(e.target.value)}
                      placeholder="Cites documents, structures responses..."
                      rows={3}
                      className="w-full px-4 py-2 rounded-xl bg-white/[0.02] border border-white/10 focus:border-indigo-500/50 outline-none text-white text-xs transition-all shadow-inner resize-none font-sans"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                    <p className="text-[9px] text-gray-500 italic max-w-[70%] leading-relaxed m-0 text-left">
                      These settings define the background persona. They shape the agent's behavior but are never returned as files or verbatim text.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAgentName('Antigravity Grounding Core');
                        setAgentTone('Helpful, warm, concise, professional');
                        setAgentBehaviors('Speak with structured lists. Cite documents clearly. Avoid CoT leakage.');
                      }}
                      className="text-[9px] text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer bg-transparent border-0 p-0 outline-none"
                    >
                      Reset Defaults
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'guide' && (
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
