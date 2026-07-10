import React, { useState } from 'react';
import { X } from 'lucide-react';

interface MarkdownProps {
  content: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ content }) => {
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const handleImageClick = (url: string) => {
    setZoomImage(url);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="p-3.5 rounded-xl bg-black/45 border border-white/10 font-mono text-xs md:text-sm overflow-x-auto text-left my-3 text-indigo-200 shadow-inner">
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Header block parsing
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-xl md:text-2xl font-bold font-heading mt-5 mb-2 text-white text-left tracking-tight">{parseInline(line.slice(2), handleImageClick)}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-lg md:text-xl font-bold font-heading mt-4 mb-2 text-white text-left tracking-tight">{parseInline(line.slice(3), handleImageClick)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-md md:text-lg font-bold font-heading mt-3 mb-1 text-white text-left">{parseInline(line.slice(4), handleImageClick)}</h3>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex items-start my-1 text-gray-300 text-left pl-2">
          <span className="text-indigo-400 mr-2 mt-1.5 text-xs">•</span>
          <span className="flex-1 text-sm md:text-base">{parseInline(line.slice(2), handleImageClick)}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const parts = line.split(/^\d+\.\s/);
      const num = line.match(/^\d+/)?.[0];
      elements.push(
        <div key={i} className="flex items-start my-1 text-gray-300 text-left pl-2">
          <span className="text-indigo-400 mr-2 font-mono text-xs mt-0.5">{num}.</span>
          <span className="flex-1 text-sm md:text-base">{parseInline(parts[1], handleImageClick)}</span>
        </div>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="my-1.5 text-sm md:text-base leading-relaxed text-gray-300 text-left">{parseInline(line, handleImageClick)}</p>);
    }
  }

  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <pre key="code-eof" className="p-3.5 rounded-xl bg-black/45 border border-white/10 font-mono text-xs md:text-sm overflow-x-auto text-left my-3 text-indigo-200">
        <code>{codeLines.join('\n')}</code>
      </pre>
    );
  }

  return (
    <div className="space-y-1 select-text relative">
      {elements}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center cursor-zoom-out p-4 animate-fade-in animate-duration-150"
        >
          <button
            type="button"
            onClick={() => setZoomImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer border-0 outline-none"
          >
            <X className="w-5 h-5" />
          </button>
          <img 
            src={zoomImage} 
            alt="Zoomed document view" 
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl border border-white/5 select-none animate-scale-up animate-duration-200"
          />
        </div>
      )}
    </div>
  );
};

function parseInline(text: string, onImageClick: (url: string) => void): React.ReactNode[] {
  const tokenRegex = /(!\[.*?\]\(.*?\)|\[.*?\]\(.*?\)|`.*?`|\*\*.*?\*\*)/g;
  const parts = text.split(tokenRegex);
  
  return parts.map((part, index) => {
    // 1. Image match
    if (part.startsWith('![') && part.includes('](')) {
      const match = part.match(/!\[(.*?)\]\((.*?)\)/);
      if (match) {
        const alt = match[1];
        const url = match[2];
        return (
          <div key={index} className="my-2 inline-block rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/25 select-none">
            <img
              src={url}
              alt={alt}
              onClick={(e) => {
                e.stopPropagation();
                onImageClick(url);
              }}
              className="max-h-48 md:max-h-60 object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
            />
            {alt && (
              <div className="px-3 py-1 bg-black/45 text-[10px] text-gray-400 border-t border-white/5 truncate font-mono text-center">
                {alt}
              </div>
            )}
          </div>
        );
      }
    }
    
    // 2. Link match
    if (part.startsWith('[') && part.includes('](')) {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const linkText = match[1];
        const url = match[2];
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer transition-colors"
          >
            {linkText}
          </a>
        );
      }
    }
    
    // 3. Bold match
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-white tracking-wide">{part.slice(2, -2)}</strong>;
    }
    
    // 4. Inline code match
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="px-1.5 py-0.5 rounded-md bg-white/10 text-indigo-300 font-mono text-xs border border-white/5">{part.slice(1, -1)}</code>;
    }
    
    return part;
  });
}
