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
  if (!input) return '';
  let text = String(input);

  // Preserve Bangladeshi currency symbols like ৳$
  text = text.replace(/৳\$/g, '৳\\$');

  // Streaming balance for \[ and \]
  const openBracketMatches = (text.match(/\\\[/g) || []).length;
  const closeBracketMatches = (text.match(/\\\]/g) || []).length;
  if (openBracketMatches > closeBracketMatches) {
    text += '\\]';
  }

  // Streaming balance for \( and \)
  const openParenMatches = (text.match(/\\\(/g) || []).length;
  const closeParenMatches = (text.match(/\\\)/g) || []).length;
  if (openParenMatches > closeParenMatches) {
    text += '\\)';
  }

  // Convert standard LaTeX delimiters: \[ \] to $$ $$, and \( \) to $ $
  text = text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `\n$$\n${inner}\n$$\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => `$${inner}$`);

  // Streaming balance for $$ (display math)
  const doubleDollarMatches = (text.match(/\$\$/g) || []).length;
  if (doubleDollarMatches % 2 !== 0) {
    text += '$$';
  }

  // Streaming balance for standalone $ (inline math)
  const placeholder = '___DOUBLE_DOLLAR_ESC___';
  const tokenized = text.replace(/\$\$/g, placeholder);
  const singleDollarMatches = (tokenized.match(/(?<!\\)\$/g) || []).length;
  if (singleDollarMatches % 2 !== 0) {
    text += '$';
  }

  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
  return parts.map(part => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const inner = part.slice(2, -2).trim();
      return `\n$$\n${normalizeMathDigits(inner).replace(/(?<!d)\\frac/g, '\\dfrac')}\n$$\n`;
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      const inner = part.slice(1, -1);
      return `$${normalizeMathDigits(inner)}$`;
    }
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

export const MathText = React.memo<MarkdownMathProps>(({ content, className = '', fontSize }) => (
  <MathErrorBoundary raw={content}>
    <div className={`math-text prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed ${className}`} style={fontSize ? { fontSize: `${fontSize}px` } : undefined}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: 'ignore', throwOnError: false, trust: false, output: 'htmlAndMathml' }]]}
        components={{
          img: ({ src, alt }) => <img src={src} alt={alt || 'Question image'} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="my-2 max-h-72 max-w-full rounded-xl border border-slate-200 bg-white p-1 object-contain dark:border-indigo-900" />
        }}
      >
        {preprocessMathText(content)}
      </ReactMarkdown>
    </div>
  </MathErrorBoundary>
));
MathText.displayName = 'MathText';

export const MarkdownMath = MathText;
