import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

interface MarkdownMathProps {
  content: string;
  className?: string;
  fontSize?: number;
}

const bengaliDigits: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

function normalizeMathDigits(value: string): string {
  return value.replace(/[০-৯]/g, digit => bengaliDigits[digit] || digit);
}

function wrapBareMath(segment: string): string {
  return segment.replace(
    /(?<!\\)(\\(?:frac|dfrac|tfrac|sqrt)\s*\{[^{}]*\}(?:\s*\{[^{}]*\})?|\b[A-Za-z0-9)\]]+\s*(?:\^|_)\s*\{?[-+A-Za-z0-9{}]+\}?)/g,
    match => `$${normalizeMathDigits(match)}$`,
  );
}

export function preprocessMathText(input: string): string {
  let text = String(input ?? '')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$');

  text = text.replace(/৳\$/g, '৳\\$');
  const dollarMatches = [...text.matchAll(/(?<!\\)\$/g)];
  if (dollarMatches.length % 2 === 1) {
    const last = dollarMatches[dollarMatches.length - 1];
    const index = last.index ?? -1;
    if (index >= 0) text = `${text.slice(0, index)}\\${text.slice(index)}`;
  }

  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
  return parts.map(part => {
    if (part.startsWith('$$') && part.endsWith('$$')) return `$$${normalizeMathDigits(part.slice(2, -2)).replace(/(?<!d)\\frac/g, '\\dfrac')}$$`;
    if (part.startsWith('$') && part.endsWith('$')) return `$${normalizeMathDigits(part.slice(1, -1))}$`;
    return wrapBareMath(part);
  }).join('');
}

class MathErrorBoundary extends Component<{ children: ReactNode; raw: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('MathText rendering failed:', error, info.componentStack);
  }
  render() {
    if (this.state.failed) return <code className="inline-block max-w-full overflow-x-auto rounded-md bg-amber-100 px-2 py-1 font-mono text-amber-900 dark:bg-amber-950 dark:text-amber-200">{this.props.raw}</code>;
    return this.props.children;
  }
}

export const MathText: React.FC<MarkdownMathProps> = ({ content, className = '', fontSize }) => (
  <MathErrorBoundary raw={content}>
    <div className={`math-text prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed ${className}`} style={fontSize ? { fontSize: `${fontSize}px` } : undefined}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: 'ignore', throwOnError: false, trust: false, output: 'htmlAndMathml' }]]}
      >
        {preprocessMathText(content)}
      </ReactMarkdown>
    </div>
  </MathErrorBoundary>
);

export const MarkdownMath = MathText;
