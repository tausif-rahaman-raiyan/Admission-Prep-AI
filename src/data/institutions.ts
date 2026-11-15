import { universities } from './universities';

export type Institution = {
  id: string;
  code: string;
  nameBn: string;
  nameEn: string;
  desc: string;
  colorKey: string;
  units: string[];
  badgeText: string;
  hasQuestions: boolean;
};

const colorKeys = ['blue', 'purple', 'amber', 'fuchsia', 'cyan', 'emerald', 'teal', 'indigo'];
export const institutions: Institution[] = universities.map((uni, index) => ({
  id: uni.id,
  code: uni.short,
  nameBn: uni.nameBn,
  nameEn: uni.nameEn,
  desc: uni.years || uni.note || 'প্রশ্ন শীঘ্রই যুক্ত হবে',
  colorKey: colorKeys[index % colorKeys.length],
  units: uni.units.map(rule => rule.unit),
  badgeText: uni.hasQuestions ? 'প্রশ্ন আছে' : 'শীঘ্রই আসছে',
  hasQuestions: uni.hasQuestions,
}));
