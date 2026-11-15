export type NormalizedQuestion = Record<string, any> & {
  id: string;
  number: number;
  question: string;
  options: string[];
  optionImageUrls: string[][];
  questionImageUrls: string[];
  correctAnswer: number;
  explanation: string;
};

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E'];

function asImageList(value: unknown): string[] {
  if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
  if (Array.isArray(value)) {
    return value.flatMap(item => typeof item === 'string' && item.trim() ? [item.trim()] : []);
  }
  return [];
}

function normalizeOptionImages(value: unknown): string[][] {
  if (Array.isArray(value)) return value.map(asImageList);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = [...OPTION_KEYS.filter(key => key in record), ...Object.keys(record).filter(key => !OPTION_KEYS.includes(key))];
    return keys.map(key => asImageList(record[key]));
  }
  return [];
}

function normalizeOptionText(value: unknown): string {
  const text = typeof value === 'string' ? value : value == null ? '' : String(value);
  return text.replace(/^\\[image:\\s*([^\\]]+)\\]$/i, 'চিত্র সংযুক্ত নেই: $1');
}

function normalizeOptions(value: unknown): string[] {
  let entries: unknown[] = [];
  if (Array.isArray(value)) entries = value;
  else if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = [...OPTION_KEYS.filter(key => key in record), ...Object.keys(record).filter(key => !OPTION_KEYS.includes(key))];
    entries = keys.map(key => record[key]);
  }

  return entries.map(option => {
    if (typeof option === 'string') return normalizeOptionText(option);
    if (option && typeof option === 'object') {
      const item = option as Record<string, unknown>;
      return normalizeOptionText(item.text ?? item.label ?? item.value ?? '');
    }
    return normalizeOptionText(option);
  });
}

function normalizeLegacyImageTokens(value: string): string {
  return value.replace(
    /\\[IMAGE:\\s*EXTERNAL_IMAGE_URL:\\s*(https?:\\/\\/[^\\]\\s]+)\\]/gi,
    (_match, url: string) => `\\n\\n![Question image](${url})\\n\\n`,
  );
}

function normalizeExplanation(value: unknown): string {
  if (typeof value === 'string') return normalizeLegacyImageTokens(value);
  if (value && typeof value === 'object') {
    const item = value as Record<string, unknown>;
    return [
      item.one_line_calculation && String(item.one_line_calculation),
      item.step_by_step_solution && String(item.step_by_step_solution),
      item.shortcut_tip && String(item.shortcut_tip),
    ].filter(Boolean).join('\n\n');
  }
  return '';
}

export function normalizeQuestionData(raw: any, index = 0): NormalizedQuestion {
  const optionImageUrls = normalizeOptionImages(raw?.optionImageUrls ?? raw?.option_images ?? raw?.optionImages);
  let options = normalizeOptions(raw?.options ?? raw?.choices ?? raw?.optionList);
  const imageOptionCount = optionImageUrls.length;
  if (options.length < imageOptionCount) {
    options = [...options, ...Array.from({ length: imageOptionCount - options.length }, () => '')];
  }

  const rawAnswer = raw?.correctAnswer ?? raw?.answerIndex ?? raw?.correct_option ?? -1;
  let correctAnswer = typeof rawAnswer === 'string' && /^[A-E]$/i.test(rawAnswer.trim())
    ? rawAnswer.trim().toUpperCase().charCodeAt(0) - 65
    : Number(rawAnswer);
  if (!Number.isFinite(correctAnswer)) correctAnswer = -1;

  const questionImageUrls = asImageList(raw?.questionImageUrls ?? raw?.question_images ?? raw?.questionImageUrl);
  const question = raw?.question ?? raw?.questionText ?? raw?.stem ?? '';
  return {
    ...raw,
    id: String(raw?.id ?? raw?.questionId ?? `question-${index + 1}`),
    number: Number(raw?.number ?? raw?.questionNumber ?? index + 1),
    question: normalizeLegacyImageTokens(typeof question === 'string' ? question : String(question ?? '')),
    options,
    optionImageUrls,
    questionImageUrls,
    correctAnswer,
    explanation: normalizeExplanation(raw?.explanation ?? raw?.solution),
  };
}

export function resolveQuestionAssetUrl(value: string): string {
  const url = String(value ?? '').trim();
  if (!url) return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;

  const base = String(import.meta.env.BASE_URL || '/');
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const cleanUrl = url.replace(/^\.\//, '').replace(/^\/+/, '');
  const baseWithoutSlashes = normalizedBase.replace(/^\/+|\/+$/g, '');

  if (baseWithoutSlashes && (cleanUrl === baseWithoutSlashes || cleanUrl.startsWith(`${baseWithoutSlashes}/`))) {
    return `/${cleanUrl}`;
  }
  return `${normalizedBase}${cleanUrl}`;
}
