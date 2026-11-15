import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

interface MarkdownMathProps {
  content: string;
  className?: string;
  fontSize?: number;
}

export const MarkdownMath: React.FC<MarkdownMathProps> = ({ content, className = '', fontSize }) => {
  return (
    <div 
      className={`prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed ${className}`}
      style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
