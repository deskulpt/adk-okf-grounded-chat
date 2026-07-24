import React from 'react';
import { X, BookOpen, ExternalLink } from 'lucide-react';

interface DocsModalProps {
  open: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="surface-solid rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-white/10">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white tracking-tight font-heading m-0">Documentation & Credits</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer border-0 outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-gray-200">
          <section>
            <h3 className="text-white font-semibold mb-2">What is this?</h3>
            <p className="leading-relaxed">
              ADK OKF Grounded Chat is a local-first, deterministic grounding playground. It reads
              your Git-backed Open Knowledge Format (OKF) markdown documents and answers from them
              first, before ever calling an AI model.
            </p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2">How to use it</h3>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed">
              <li><strong>Pure OKF mode:</strong> answers only from your local documents. No AI call.</li>
              <li><strong>+AI API mode:</strong> uses local OKF context plus an LLM fallback (Gemini free tier by default).</li>
              <li><strong>Upload files or paste URLs</strong> in the catalog sidebar to add session-only concepts.</li>
              <li><strong>Ask grounded questions</strong> like &quot;What is OKF?&quot; or &quot;Compare sales vs products.&quot;</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2">Credits</h3>
            <p className="leading-relaxed">Built by <a href="https://deskulpt.ca" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">Deskulpt.ca</a>.</p>
            <p className="leading-relaxed">
              <a href="https://www.linkedin.com/in/adiddi" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline">
                linkedin.com/in/adiddi <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2">Contributing Sources</h3>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed">
              <li><a href="https://google.github.io/adk-docs/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">Google Agent Development Kit (ADK)</a></li>
              <li><a href="https://openrouter.ai/docs" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">OpenRouter</a></li>
              <li><a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">Google Gemini</a></li>
              <li><a href="https://fastapi.tiangolo.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">FastAPI</a></li>
              <li><a href="https://markitdown.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">MarkItDown</a></li>
              <li><a href="https://react.dev/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">React</a></li>
              <li><a href="https://vitejs.dev/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">Vite</a></li>
              <li><a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">Tailwind CSS</a></li>
              <li><a href="https://lucide.dev/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">Lucide Icons</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
