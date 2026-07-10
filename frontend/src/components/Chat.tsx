import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
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
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    <div className="flex flex-col flex-1 max-w-4xl w-full mx-auto glassmorphism rounded-2xl shadow-2xl overflow-hidden my-4 border border-white/10 h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
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
                    <Markdown content={msg.content || '...'} />
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
    </div>
  );
};
