import React from 'react';

interface MarkdownProps {
  content: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

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
      elements.push(<h1 key={i} className="text-xl md:text-2xl font-bold font-heading mt-5 mb-2 text-white text-left tracking-tight">{parseInline(line.slice(2))}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-lg md:text-xl font-bold font-heading mt-4 mb-2 text-white text-left tracking-tight">{parseInline(line.slice(3))}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-md md:text-lg font-bold font-heading mt-3 mb-1 text-white text-left">{parseInline(line.slice(4))}</h3>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex items-start my-1 text-gray-300 text-left pl-2">
          <span className="text-indigo-400 mr-2 mt-1.5 text-xs">•</span>
          <span className="flex-1 text-sm md:text-base">{parseInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const parts = line.split(/^\d+\.\s/);
      const num = line.match(/^\d+/)?.[0];
      elements.push(
        <div key={i} className="flex items-start my-1 text-gray-300 text-left pl-2">
          <span className="text-indigo-400 mr-2 font-mono text-xs mt-0.5">{num}.</span>
          <span className="flex-1 text-sm md:text-base">{parseInline(parts[1])}</span>
        </div>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="my-1.5 text-sm md:text-base leading-relaxed text-gray-300 text-left">{parseInline(line)}</p>);
    }
  }

  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <pre key="code-eof" className="p-3.5 rounded-xl bg-black/45 border border-white/10 font-mono text-xs md:text-sm overflow-x-auto text-left my-3 text-indigo-200">
        <code>{codeLines.join('\n')}</code>
      </pre>
    );
  }

  return <div className="space-y-1 select-text">{elements}</div>;
};

function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-white tracking-wide">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="px-1.5 py-0.5 rounded-md bg-white/10 text-indigo-300 font-mono text-xs border border-white/5">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
