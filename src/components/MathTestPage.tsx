import React from 'react';
import { MathText } from './MarkdownMath';

const cases = [
  'Inline fraction: $\\frac{1}{2} + \\frac{3}{4} = \\frac{5}{4}$.',
  '$$\\dfrac{a+b}{c+d}$$',
  'Square roots: $\\sqrt{2}$ and $\\sqrt[3]{8}=2$.',
  '$$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$',
  '$$\\int e^x\\,dx=e^x+C$$',
  '$$\\sum_{k=1}^{n} k=\\frac{n(n+1)}{2}$$',
  '$$\\lim_{x\\to 0}\\frac{\\sin x}{x}=1$$',
  '$$\\begin{matrix}1&2\\\\3&4\\end{matrix}$$',
  '$$\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}$$',
  'বাংলা ও গণিত: বেগ $v=\\frac{s}{t}$ হলে, $t=2$ সেকেন্ডে দূরত্ব কত?',
  'Bengali digits inside math: $১০ + ৫ = ১৫$.',
  'Chemistry: $\\mathrm{H_2SO_4 + 2NaOH \\rightarrow Na_2SO_4 + 2H_2O}$.',
  'Chemistry ions: $\\mathrm{Ca^{2+}}$, $\\mathrm{SO_4^{2-}}$, $\\mathrm{NH_4^+}$.',
  'Vector: $\\vec{A}=A_x\\hat{i}+A_y\\hat{j}$.',
  'Subscript and superscript: $a_n^2+b_2^3$.',
  '$$\\frac{d}{dx}(x^n)=nx^{n-1}$$',
  '$$\\nabla\\cdot\\vec{E}=\\frac{\\rho}{\\epsilon_0}$$',
  '$$F=ma,\\quad W=Fs\\cos\\theta$$',
  '$$PV=nRT$$',
  '$$\\Delta G=\\Delta H-T\\Delta S$$',
  '$$\\begin{cases}x+y=5\\\\x-y=1\\end{cases}$$',
  'Plain fraction a/b remains plain; explicit fraction is $\\frac{a}{b}$.',
  'Currency marker: দাম ৳$100 এবং ছাড় $20।',
  'Escaped parentheses: \\(x^2+y^2=z^2\\).',
  'Escaped display: \\[E=mc^2\\]',
  '| বিষয় | সূত্র |\\n|---|---|\\n| বল | $F=ma$ |\\n| কাজ | $W=Fs$ |',
  '$$\\left(\\frac{x}{y}\\right)^2=\\frac{x^2}{y^2}$$',
  '$$\\log_a x=\\frac{\\ln x}{\\ln a}$$',
  '$$\\Pr(A\\cup B)=\\Pr(A)+\\Pr(B)-\\Pr(A\\cap B)$$',
  'আলোর বেগ $c=3\\times10^8\\,\\mathrm{m/s}$।',
];

export const MathTestPage: React.FC = () => (
  <main className="mx-auto max-w-5xl space-y-5 px-4 py-8">
    <header className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-[#0B152C]">
      <h1 className="text-xl font-black">MathText regression test</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">৩০টি formula / Markdown sample — /math-test</p>
    </header>
    <div className="grid gap-3">
      {cases.map((sample, index) => <section key={index} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#080E1E]">
        <div className="mb-2 text-xs font-bold text-slate-500">CASE {index + 1}</div>
        <MathText content={sample} />
      </section>)}
    </div>
  </main>
);
