import React, { useState } from 'react';
import { resolveQuestionAssetUrl } from '../utils/questionData';

interface QuestionImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const QuestionImage: React.FC<QuestionImageProps> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = resolveQuestionAssetUrl(src);

  if (!resolvedSrc) return null;
  if (failed) {
    return (
      <a
        href={resolvedSrc}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-10 items-center rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
      >
        {alt} — ছবি লোড হয়নি, এখানে খুলুন
      </a>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`max-w-full rounded-xl border border-slate-200 bg-white p-1 object-contain dark:border-indigo-900 ${className}`}
    />
  );
};
