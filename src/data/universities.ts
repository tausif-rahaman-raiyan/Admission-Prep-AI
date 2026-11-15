export type UniversityGroup = 'general' | 'engineering' | 'science-tech' | 'textile' | 'military' | 'agri' | 'other';
export type UnitRule = {
  unit: string;
  label: string;
  year: string;
  compulsory: { subject: string; marks: number }[];
  optionalPick?: { count: number; from: string[]; note: string };
  totalSubjects: number;
  verified: boolean;
};
export type Uni = {
  id: string; short: string; nameBn: string; nameEn: string; group: UniversityGroup;
  units: UnitRule[]; years?: string; hasQuestions: boolean; note?: string;
  brand: [string, string]; dataIds?: string[];
};
const todo = (unit: string): UnitRule => ({ unit, label: unit + ' Unit', year: 'যাচাই করা হয়নি', compulsory: [], totalSubjects: 0, verified: false });
const make = (id: string, short: string, nameBn: string, nameEn: string, group: UniversityGroup, brand: [string,string], extra: Partial<Uni> = {}): Uni => ({
  id, short, nameBn, nameEn, group, brand, units: [todo('যাচাই করা হয়নি')], hasQuestions: false, ...extra
});

const allUniversities: Uni[] = [
  make('DU','DU','ঢাকা বিশ্ববিদ্যালয়','University of Dhaka','general',['#2563eb','#06b6d4'],{units:[{unit:'A',label:'A Unit (Science)',year:'২০২৫-২৬',compulsory:[{subject:'পদার্থবিজ্ঞান',marks:25},{subject:'রসায়ন',marks:25}],optionalPick:{count:2,from:['উচ্চতর গণিত','জীববিজ্ঞান','বাংলা','ইংরেজি'],note:'পদার্থ ও রসায়ন ছাড়াও আবশ্যিকভাবে যেকোনো ২টি ঐচ্ছিক বিষয় নির্বাচন করুন (মোট ৪টি বিষয়)'},totalSubjects:4,verified:true}],years:'A Unit • 2000-01 to 2025-26',hasQuestions:true,dataIds:['DU']}),
  make('RU','RU','রাজশাহী বিশ্ববিদ্যালয়','University of Rajshahi','general',['#d97706','#fbbf24'],{years:'2010-11 to 2025-26',hasQuestions:true,dataIds:['RU']}),
  make('JU','JU','জাহাঙ্গীরনগর বিশ্ববিদ্যালয়','Jahangirnagar University','general',['#7c3aed','#c084fc'],{units:[todo('A'),todo('D')],years:'A & D Units • Set-wise papers',hasQuestions:true,dataIds:['JU']}),
  make('CU','CU','চট্টগ্রাম বিশ্ববিদ্যালয়','University of Chittagong','general',['#0891b2','#67e8f9'],{units:[todo('A')],years:'A Unit • 2010-11 to 2025-26',hasQuestions:true,dataIds:['CU']}),
  make('GST','GST','জিএসটি গুচ্ছ','GST Cluster','general',['#c026d3','#f0abfc'],{units:[todo('A')],years:'A Unit • 2020-21 to 2025-26',hasQuestions:true,dataIds:['GST']}),
  make('CoU','CoU','কুমিল্লা বিশ্ববিদ্যালয়','Comilla University','general',['#059669','#6ee7b7'],{years:'2006-07 to 2025-26',hasQuestions:true,dataIds:['CoU']}),
  make('JnU','JnU','জগন্নাথ বিশ্ববিদ্যালয়','Jagannath University','general',['#e11d48','#fda4af'],{units:[todo('A')],years:'A Unit • Shift-wise MCQ + Written',hasQuestions:true,dataIds:['JnU']}),
  make('KU','KU','খুলনা বিশ্ববিদ্যালয়','Khulna University','general',['#0f766e','#5eead4'],{units:[todo('A'),todo('B')],years:'A & B Units • MCQ + Written',hasQuestions:true,dataIds:['KhU','KU']}),

  make('GST-Agri','GST-Agri','কৃষি গুচ্ছ','Agriculture Cluster Admission','agri',['#16a34a','#a3e635']),
  make('GAU','GAU','গাজীপুর কৃষি বিশ্ববিদ্যালয়','Gazipur Agricultural University','agri',['#047857','#6ee7b7']),
  make('BAU','BAU','বাংলাদেশ কৃষি বিশ্ববিদ্যালয়','Bangladesh Agricultural University','agri',['#15803d','#86efac']),
  make('SAU','SAU','শেরেবাংলা কৃষি বিশ্ববিদ্যালয়','Sher-e-Bangla Agricultural University','agri',['#166534','#bbf7d0']),
  make('CVASU','CVASU','চট্টগ্রাম ভেটেরিনারি ও অ্যানিম্যাল সায়েন্সেস বিশ্ববিদ্যালয়','Chattogram Veterinary and Animal Sciences University','agri',['#0f766e','#5eead4']),
  make('SYLAU','SYLAU','সিলেট কৃষি বিশ্ববিদ্যালয়','Sylhet Agricultural University','agri',['#65a30d','#bef264']),
  make('KAU','KAU','খুলনা কৃষি বিশ্ববিদ্যালয়','Khulna Agricultural University','agri',['#15803d','#86efac']),
  make('HAU','HAU','হবিগঞ্জ কৃষি বিশ্ববিদ্যালয়','Habiganj Agricultural University','agri',['#15803d','#86efac']),
  make('KuriAU','KuriAU','কুড়িগ্রাম কৃষি বিশ্ববিদ্যালয়','Kurigram Agricultural University','agri',['#15803d','#86efac']),
  make('BSMRAU','BSMRAU','বঙ্গবন্ধু শেখ মুজিবুর রহমান কৃষি বিশ্ববিদ্যালয়','Bangabandhu Sheikh Mujibur Rahman Agricultural University','agri',['#15803d','#86efac']),

  make('BUET','BUET','বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয়','Bangladesh University of Engineering and Technology','engineering',['#334155','#94a3b8'],{units:[todo('Engineering')]}),
  make('KUET','KUET','খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়','Khulna University of Engineering & Technology','engineering',['#475569','#cbd5e1'],{units:[todo('Engineering')]}),
  make('CUET','CUET','চট্টগ্রাম প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়','Chittagong University of Engineering & Technology','engineering',['#1d4ed8','#93c5fd'],{units:[todo('Engineering')]}),
  make('RUET','RUET','রাজশাহী প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়','Rajshahi University of Engineering & Technology','engineering',['#7c2d12','#fdba74'],{units:[todo('Engineering')]}),
  make('DUET','DUET','ঢাকা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়','Dhaka University of Engineering & Technology','engineering',['#0f766e','#99f6e4'],{units:[todo('Engineering')]}),
  make('MIST','MIST','মিলিটারি ইনস্টিটিউট অব সায়েন্স অ্যান্ড টেকনোলজি','Military Institute of Science and Technology','military',['#1e3a8a','#93c5fd']),
  make('BUP','BUP','বাংলাদেশ ইউনিভার্সিটি অব প্রফেশনালস','Bangladesh University of Professionals','military',['#1e40af','#93c5fd']),
  make('BUTEX','BUTEX','বাংলাদেশ টেক্সটাইল বিশ্ববিদ্যালয়','Bangladesh University of Textiles','textile',['#9333ea','#d8b4fe'],{units:[todo('Textile')]}),

  make('SUST','SUST','শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়','Shahjalal University of Science and Technology','science-tech',['#4f46e5','#a5b4fc'],{units:[todo('A'),todo('B')]}),
  make('JUST','JUST','যশোর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়','Jashore University of Science and Technology','science-tech',['#0e7490','#67e8f9']),
  make('MBSTU','MBSTU','মাওলানা ভাসানী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়','Mawlana Bhashani Science and Technology University','science-tech',['#166534','#86efac']),
  make('NSTU','NSTU','নোয়াখালী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়','Noakhali Science and Technology University','science-tech',['#0369a1','#7dd3fc']),
  make('PSTU','PSTU','পটুয়াখালী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়','Patuakhali Science and Technology University','science-tech',['#a16207','#fde047']),
  make('HSTU','HSTU','হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়','Hajee Mohammad Danesh Science and Technology University','science-tech',['#7e22ce','#d8b4fe']),
  make('BSMRSTU','BSMRSTU','গোপালগঞ্জ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়','Gopalganj Science and Technology University','science-tech',['#be123c','#fda4af']),
  make('PUST','PUST','পাবনা বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়','Pabna University of Science and Technology','science-tech',['#0369a1','#7dd3fc']),
  make('RMSTU','RMSTU','রাঙ্গামাটি বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়','Rangamati Science and Technology University','science-tech',['#0369a1','#7dd3fc']),
  make('JSTU','JSTU','জামালপুর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়','Jamalpur Science and Technology University','science-tech',['#0369a1','#7dd3fc']),
  make('CSTU','CSTU','চাঁদপুর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়','Chandpur Science and Technology University','science-tech',['#0369a1','#7dd3fc']),
  make('LSTU','LSTU','লক্ষ্মীপুর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়','Lakshmipur Science and Technology University','science-tech',['#0369a1','#7dd3fc']),
  make('SSTU','SSTU','সুনামগঞ্জ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়','Sunamganj Science and Technology University','science-tech',['#0369a1','#7dd3fc']),
  make('PrSTU','PrSTU','পিরোজপুর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়','Pirojpur Science and Technology University','science-tech',['#0369a1','#7dd3fc']),
  make('SaUST','SaUST','সাতক্ষীরা বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়','Satkhira University of Science and Technology','science-tech',['#0369a1','#7dd3fc']),
  make('UFTB','UFTB','ইউনিভার্সিটি অব ফ্রন্টিয়ার টেকনোলজি','University of Frontier Technology, Bangladesh','science-tech',['#4f46e5','#a5b4fc']),
  make('BDU','BDU','বঙ্গবন্ধু শেখ মুজিবুর রহমান ডিজিটাল বিশ্ববিদ্যালয়','Bangabandhu Sheikh Mujibur Rahman Digital University','science-tech',['#4f46e5','#a5b4fc']),
  make('BSFMSTU','BSFMSTU','বঙ্গমাতা শেখ ফজিলাতুন্নেছা মুজিব বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়','Bangamata Sheikh Fojilatunnesa Mujib Science and Technology University','science-tech',['#0369a1','#7dd3fc']),

  make('IU','IU','ইসলামী বিশ্ববিদ্যালয়','Islamic University, Bangladesh','general',['#0f766e','#99f6e4']),
  make('BU','BU','বরিশাল বিশ্ববিদ্যালয়','University of Barishal','general',['#0e7490','#67e8f9']),
  make('BUg','UB','বগুড়া বিশ্ববিদ্যালয়','Bogura University','general',['#64748b','#cbd5e1']),
  make('JKKNIU','JKKNIU','জাতীয় কবি কাজী নজরুল ইসলাম বিশ্ববিদ্যালয়','Jatiya Kabi Kazi Nazrul Islam University','general',['#9f1239','#fda4af']),
  make('BRUR','BRUR','বেগম রোকেয়া বিশ্ববিদ্যালয়','Begum Rokeya University','general',['#a21caf','#f0abfc']),
  make('RUB','RUB','রবীন্দ্র বিশ্ববিদ্যালয়','Rabindra University, Bangladesh','general',['#a21caf','#f0abfc']),
  make('NkU','NkU','নেত্রকোনা বিশ্ববিদ্যালয়','Netrokona University','general',['#7c3aed','#c4b5fd']),
  make('KgU','KgU','কিশোরগঞ্জ বিশ্ববিদ্যালয়','Kishoreganj University','general',['#64748b','#cbd5e1']),
  make('MU','MU','মেহেরপুর বিশ্ববিদ্যালয়','Meherpur University','general',['#64748b','#cbd5e1']),
  make('TU','TU','ঠাকুরগাঁও বিশ্ববিদ্যালয়','Thakurgaon University','general',['#64748b','#cbd5e1']),
  make('NaU','NaU','নওগাঁ বিশ্ববিদ্যালয়','Naogaon University','general',['#64748b','#cbd5e1']),
  make('NU','NU','জাতীয় বিশ্ববিদ্যালয়','National University','other',['#64748b','#cbd5e1']),
  make('BOU','BOU','বাংলাদেশ উন্মুক্ত বিশ্ববিদ্যালয়','Bangladesh Open University','other',['#0369a1','#7dd3fc']),
  make('IAU','IAU','ইসলামি আরবি বিশ্ববিদ্যালয়','Islamic Arabic University','other',['#0f766e','#99f6e4']),
  make('BMU','BMU','বাংলাদেশ মেডিকেল বিশ্ববিদ্যালয়','Bangladesh Medical University','other',['#0f766e','#5eead4']),
  make('CMU','CMU','চট্টগ্রাম মেডিকেল বিশ্ববিদ্যালয়','Chittagong Medical University','other',['#0e7490','#67e8f9']),
  make('RMU','RMU','রাজশাহী মেডিকেল বিশ্ববিদ্যালয়','Rajshahi Medical University','other',['#0f766e','#5eead4']),
  make('SMU','SMU','সিলেট মেডিকেল বিশ্ববিদ্যালয়','Sylhet Medical University','other',['#0f766e','#5eead4']),
  make('SHMU','SHMU','শেখ হাসিনা মেডিকেল বিশ্ববিদ্যালয়, খুলনা','Sheikh Hasina Medical University, Khulna','other',['#0f766e','#5eead4']),
  make('MarU','MarU','বাংলাদেশ মেরিটাইম বিশ্ববিদ্যালয়','Bangladesh Maritime University','other',['#1d4ed8','#93c5fd']),
  make('BSMRAAU','BSMRAAU','বঙ্গবন্ধু শেখ মুজিবুর রহমান অ্যাভিয়েশন অ্যান্ড অ্যারোস্পেস বিশ্ববিদ্যালয়','Bangabandhu Sheikh Mujibur Rahman Aviation and Aerospace University','other',['#475569','#cbd5e1']),
  make('SHU','SHU','শেখ হাসিনা বিশ্ববিদ্যালয়','Sheikh Hasina University','general',['#64748b','#cbd5e1']),
];

export const universityGroups: { id: UniversityGroup; label: string }[] = [
  { id: 'general', label: 'সাধারণ বিশ্ববিদ্যালয়' },
  { id: 'engineering', label: 'প্রকৌশল' },
  { id: 'science-tech', label: 'বিজ্ঞান ও প্রযুক্তি' },
  { id: 'textile', label: 'টেক্সটাইল' },
  { id: 'military', label: 'বিশেষায়িত' },
  { id: 'agri', label: 'কৃষি' },
  { id: 'other', label: 'অন্যান্য' },
];
const HIDDEN_PLACEHOLDER_UNIVERSITIES = new Set(['NU', 'BOU', 'IAU', 'BMU', 'CMU', 'RMU', 'SMU', 'SHMU', 'MarU', 'BSMRAAU']);
export const universities: Uni[] = allUniversities.filter(uni => !HIDDEN_PLACEHOLDER_UNIVERSITIES.has(uni.id));
export const getUniversity = (id: string) => universities.find(uni => uni.id === id);
