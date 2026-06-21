import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MessageContentProps {
  content: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    toast.success('Đã sao chép mã nguồn!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to parse content into segment blocks containing text, code blocks, block math, and inline math
  const parseContent = (text: string) => {
    const codeBlocks: { language: string; code: string }[] = [];
    const blockMaths: string[] = [];
    const inlineMaths: string[] = [];

    let processedText = text;

    // 1. Extract Code Blocks: ```language\n[code]\n```
    const codeRegex = /```(\w*)\n([\s\S]*?)```/g;
    processedText = processedText.replace(codeRegex, (_, lang, code) => {
      const placeholder = `__CODE_BLOCK_PLACEHOLDER_${codeBlocks.length}__`;
      codeBlocks.push({ language: lang || 'code', code: code.trim() });
      return placeholder;
    });

    // 2. Extract Block Math: $$ [math] $$ or \[ [math] \]
    const blockMathRegex = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g;
    processedText = processedText.replace(blockMathRegex, (_, match1, match2) => {
      const placeholder = `__BLOCK_MATH_PLACEHOLDER_${blockMaths.length}__`;
      blockMaths.push((match1 || match2 || '').trim());
      return placeholder;
    });

    // 3. Extract Inline Math: $ [math] $ or \( [math] \)
    // Be careful to not match normal $ symbol. Standard is $ followed by non-space, ending with non-space.
    const inlineMathRegex = /\$([^\s$][^$]*?[^\s$])\$|\\\(([\s\S]*?)\\\)/g;
    processedText = processedText.replace(inlineMathRegex, (_, match1, match2) => {
      const placeholder = `__INLINE_MATH_PLACEHOLDER_${inlineMaths.length}__`;
      inlineMaths.push((match1 || match2 || '').trim());
      return placeholder;
    });

    // 4. Split and restore elements step by step
    // Split by placeholders
    const placeholderRegex = /(__CODE_BLOCK_PLACEHOLDER_\d+__|__BLOCK_MATH_PLACEHOLDER_\d+__|__INLINE_MATH_PLACEHOLDER_\d+__)/g;
    const parts = processedText.split(placeholderRegex);

    return parts.map((part, index) => {
      if (part.startsWith('__CODE_BLOCK_PLACEHOLDER_')) {
        const match = part.match(/\d+/);
        const idx = match ? parseInt(match[0], 10) : 0;
        const { language, code } = codeBlocks[idx];
        const isCopied = copiedIndex === idx;

        return (
          <div key={index} className="my-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-slate-200">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
              <span>{language}</span>
              <button
                type="button"
                onClick={() => handleCopyCode(code, idx)}
                className="flex items-center gap-1 hover:text-slate-200 transition-colors"
              >
                {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            {/* Code */}
            <pre className="p-4 overflow-x-auto leading-relaxed max-w-full">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      if (part.startsWith('__BLOCK_MATH_PLACEHOLDER_')) {
        const match = part.match(/\d+/);
        const idx = match ? parseInt(match[0], 10) : 0;
        const math = blockMaths[idx];
        return (
          <div 
            key={index} 
            className="my-4 p-4 text-center rounded-xl bg-indigo-500/5 border border-indigo-500/10 font-serif text-sm md:text-base text-indigo-500 dark:text-indigo-400 overflow-x-auto shadow-inner"
          >
            {/* Custom Mathematical Render styling */}
            <span className="font-semibold block leading-loose tracking-wide">{math}</span>
          </div>
        );
      }

      if (part.startsWith('__INLINE_MATH_PLACEHOLDER_')) {
        const match = part.match(/\d+/);
        const idx = match ? parseInt(match[0], 10) : 0;
        const math = inlineMaths[idx];
        return (
          <span 
            key={index} 
            className="font-serif italic font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded mx-1 whitespace-nowrap text-xs md:text-sm"
          >
            {math}
          </span>
        );
      }

      // Format simple markdown text (paragraphs, bold, list items, headers)
      return renderTextMarkdown(part, index);
    });
  };

  const renderTextMarkdown = (text: string, blockKey: number) => {
    if (!text.trim()) return null;

    const lines = text.split('\n');
    
    return (
      <div key={blockKey} className="space-y-1.5 text-sm leading-relaxed text-foreground/95">
        {lines.map((line, idx) => {
          const currentLine = line;

          // 1. Bullet list items: - [text] or * [text]
          if (currentLine.trim().startsWith('- ') || currentLine.trim().startsWith('* ')) {
            const listContent = currentLine.replace(/^[\s*-]+/, '').trim();
            return (
              <ul key={idx} className="list-disc pl-5 my-0.5 space-y-1">
                <li className="text-xs md:text-sm">{renderInlineMarkdown(listContent)}</li>
              </ul>
            );
          }

          // 2. Headings: ### [text]
          if (currentLine.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-sm font-extrabold font-outfit mt-3 mb-1.5 text-foreground flex items-center gap-1.5">
                {renderInlineMarkdown(currentLine.replace(/^###\s*/, ''))}
              </h4>
            );
          }
          if (currentLine.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-base font-extrabold font-outfit mt-4 mb-2 text-foreground flex items-center gap-1.5">
                {renderInlineMarkdown(currentLine.replace(/^##\s*/, ''))}
              </h3>
            );
          }

          // Normal paragraph lines
          return (
            <p key={idx} className="min-h-[1rem]">
              {renderInlineMarkdown(currentLine)}
            </p>
          );
        })}
      </div>
    );
  };

  // Helper to format inline bold, italic, code
  const renderInlineMarkdown = (text: string) => {
    let parts: (string | React.ReactNode)[] = [text];

    // 1. Bold Formatting: **[text]**
    parts = parts.flatMap((part) => {
      if (typeof part !== 'string') return part;
      const regex = /\*\*([\s\S]*?)\*\*/g;
      const split = part.split(regex);
      return split.map((chunk, i) => (i % 2 === 1 ? <strong key={i} className="font-extrabold text-foreground">{chunk}</strong> : chunk));
    });

    // 2. Inline Code Formatting: `[code]`
    parts = parts.flatMap((part) => {
      if (typeof part !== 'string') return part;
      const regex = /`([^`]+)`/g;
      const split = part.split(regex);
      return split.map((chunk, i) => (i % 2 === 1 ? <code key={i} className="px-1.5 py-0.5 font-mono text-xs rounded bg-muted border border-border text-foreground/90">{chunk}</code> : chunk));
    });

    return parts;
  };

  return <div className="space-y-2">{parseContent(content)}</div>;
};
