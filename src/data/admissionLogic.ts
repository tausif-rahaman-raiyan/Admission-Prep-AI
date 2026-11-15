export interface AdmissionSubjectItem {
  id: string;
  name: string;
  nameBn: string;
  marks: number;
  questions?: number;
  desc?: string;
}

export interface OptionalOption {
  id: string;
  label: string;
  labelBn: string;
  subjects: string[]; // subjects included in this option
  marks: number;
  questions?: number;
  desc?: string;
  eligibilityEffect: string;
  eligibilityEffectBn: string;
}

export interface UniversityAdmissionRule {
  id: string;
  code: string;
  nameBn: string;
  nameEn: string;
  unit: string;
  examFormat: string;
  totalMarks: number;
  totalQuestions: number;
  markPerQuestion: number | string;
  negativeMarking: number;
  mode:
    | 'du_pick_two'
    | 'ru_c_groups'
    | 'ju_fixed'
    | 'cu_pick_three'
    | 'gst_pick_two'
    | 'cou_pick_two'
    | 'jnu_pick_one'
    | 'khu_fixed'
    | 'agri_fixed'
    | 'general_fixed';
  hasOptionalChoice: boolean;
  compulsorySubjects: AdmissionSubjectItem[];
  optionalRule?: {
    type: 'pick_n' | 'select_group' | 'pick_one';
    requiredPickCount: number;
    instructionBn: string;
    instructionEn: string;
    options: OptionalOption[];
    eligibilityNotesBn: string[];
    eligibilityNotesEn: string[];
  };
  departmentEligibility: {
    engineeringRule: string;
    engineeringRuleBn: string;
    biologyRule: string;
    biologyRuleBn: string;
  };
  detailsBn: string[];
  detailsEn: string[];
}

export const admissionComparisonTable = [
  {
    university: "Dhaka University (DU)",
    unit: "A Unit (Science)",
    examFormat: "MCQ (60) + Written (40)",
    compulsory: "Physics, Chemistry (Must answer)",
    optional: "Higher Math, Biology (Can swap 1 for Bangla/English instead of HSC 4th subject)",
    note: "Total 4 subjects. Choosing Bangla/English restricts Engineering or Pure Science eligibility."
  },
  {
    university: "Rajshahi University (RU)",
    unit: "C Unit (Science)",
    examFormat: "MCQ (100 Marks / 80 Qs)",
    compulsory: "Group A (68.75 Marks): Physics (25 Qs), Chemistry (25 Qs), ICT (5 Qs)",
    optional: "Group B (31.25 Marks): Choose 1: Math (25 Qs) OR Biology (25 Qs) OR Math + Bio (12 Math + 13 Bio Qs)",
    note: "1.25 marks per question. Choosing both Math+Bio opens both engineering and biological faculties."
  },
  {
    university: "Jahangirnagar University (JU)",
    unit: "A Unit (Math/Phy) & D Unit (Biology)",
    examFormat: "MCQ (80 Marks)",
    compulsory: "A: Math (22), Phy (22), Chem (22), ICT (8), Bangla (3), Eng (3)\nD: Bio (44), Chem (24), Bangla (4), Eng (4), IQ (4)",
    optional: "None (All listed subjects are compulsory per unit)",
    note: "Separate exams for physical sciences and biological sciences."
  },
  {
    university: "Chittagong University (CU)",
    unit: "A Unit (Science)",
    examFormat: "MCQ (100 Marks)",
    compulsory: "English (25 Marks mandatory for all candidates)",
    optional: "Any 3 from: Physics (25), Chemistry (25), Math (25), Biology (25)",
    note: "Answering Math and Physics is mandatory for Engineering and CSE departments."
  },
  {
    university: "GST Cluster (19+ Varsities)",
    unit: "A Unit (Science)",
    examFormat: "MCQ (100 Marks)",
    compulsory: "Physics (25), Chemistry (25)",
    optional: "Any 2 from: Mathematics (25), Biology (25), Bangla (25), English (25)",
    note: "4 subjects × 25 marks. Bangla or English can only replace HSC 4th subject."
  },
  {
    university: "Comilla University (CoU)",
    unit: "A Unit (Science)",
    examFormat: "MCQ (100 Marks)",
    compulsory: "Physics (25), Chemistry (25)",
    optional: "Any 2 from: Mathematics (25), Biology (25), Bangla & English Combined (25)",
    note: "4 subjects × 25 marks."
  },
  {
    university: "Jagannath University (JnU)",
    unit: "A Unit (Science)",
    examFormat: "MCQ (72/96 Marks / 3 Subjects)",
    compulsory: "Physics, Chemistry",
    optional: "Mathematics OR Biology (Choose and answer only 1 of the two)",
    note: "JnU transitioned back to MCQ-only format for the 2025–26 cycle."
  },
  {
    university: "Khulna University (KU / KhU)",
    unit: "A Unit (Eng/Sci) & B Unit (Life Sci)",
    examFormat: "MCQ (60) + Written (40)",
    compulsory: "A: Math, Phy, Chem (+ Eng & ICT in Written)\nB: Bio, Phy, Chem, Math (+ Eng in Written)",
    optional: "None (All subjects are fixed per unit)",
    note: "100 marks total (60 MCQ + 40 Written)."
  },
  {
    university: "Agricultural Cluster (AGRI)",
    unit: "Combined Agri (BAU, SAU, CVASU, etc.)",
    examFormat: "MCQ (100 Marks / 1 Hour)",
    compulsory: "Biology (30: Bot 15 + Zoo 15), Chemistry (20), Physics (20), Math (20), English (10)",
    optional: "None (All 5 subjects are mandatory for all aspirants)",
    note: "Strict negative marking –0.25. 1 mark per question."
  }
];

export const universityAdmissionRules: Record<string, UniversityAdmissionRule> = {
  DU: {
    id: "DU",
    code: "DU",
    nameBn: "ঢাকা বিশ্ববিদ্যালয়",
    nameEn: "University of Dhaka",
    unit: "A Unit (Science)",
    examFormat: "MCQ (60 Marks) + Written (40 Marks) = 100 Marks Total",
    totalMarks: 100,
    totalQuestions: 60,
    markPerQuestion: 1,
    negativeMarking: 0.25,
    mode: 'du_pick_two',
    hasOptionalChoice: true,
    compulsorySubjects: [
      { id: "Physics", name: "Physics", nameBn: "পদার্থবিজ্ঞান", marks: 25, questions: 15, desc: "MCQ: 15 marks + Written: 10 marks" },
      { id: "Chemistry", name: "Chemistry", nameBn: "রসায়ন", marks: 25, questions: 15, desc: "MCQ: 15 marks + Written: 10 marks" }
    ],
    optionalRule: {
      type: 'pick_n',
      requiredPickCount: 2,
      instructionBn: "পদার্থ ও রসায়ন ছাড়াও আবশ্যিকভাবে যে কোনো ২টি ঐচ্ছিক বিষয় নির্বাচন করুন (মোট ৪টি বিষয়):",
      instructionEn: "In addition to Physics and Chemistry, select exactly 2 optional subjects (total 4 subjects):",
      options: [
        {
          id: "Mathematics",
          label: "Higher Mathematics",
          labelBn: "উচ্চতর গণিত",
          subjects: ["Mathematics"],
          marks: 25,
          questions: 15,
          desc: "MCQ 15 + Written 10",
          eligibilityEffect: "Mandatory for Engineering, CSE, EEE, Applied Math, Physics & Robotics",
          eligibilityEffectBn: "ইঞ্জিনিয়ারিং, সিএসই, ফলিত গণিত, পদার্থ ও রোবোটিক্সের জন্য গণিত উত্তর করা বাধ্যতামূলক।"
        },
        {
          id: "Biology",
          label: "Biology",
          labelBn: "জীববিজ্ঞান",
          subjects: ["Biology"],
          marks: 25,
          questions: 15,
          desc: "MCQ 15 + Written 10",
          eligibilityEffect: "Mandatory for Pharmacy, Biochemistry, Genetic Engineering & Microbiology",
          eligibilityEffectBn: "ফার্মেসি, বায়োকেমিস্ট্রি, মাইক্রোবায়োলজি ও জেনেটিক ইঞ্জিনিয়ারিংয়ের জন্য জীববিজ্ঞান উত্তর করা বাধ্যতামূলক।"
        },
        {
          id: "Bangla",
          label: "Bangla",
          labelBn: "বাংলা (৪র্থ বিষয়ের বিকল্প)",
          subjects: ["Bangla"],
          marks: 25,
          questions: 15,
          desc: "MCQ 15 + Written 10 (Replaces HSC 4th subject)",
          eligibilityEffect: "Can replace HSC 4th subject only. Restricts departmental eligibility if Math/Bio is dropped.",
          eligibilityEffectBn: "এইচএসসির ৪র্থ বিষয়ের পরিবর্তে নির্বাচন করা যায়। তবে গণিত বাদ দিলে ইঞ্জিনিয়ারিং ও জীববিজ্ঞান বাদ দিলে জীববিজ্ঞানের বিষয় পাওয়া যাবে না।"
        },
        {
          id: "English",
          label: "English",
          labelBn: "ইংরেজি (৪র্থ বিষয়ের বিকল্প)",
          subjects: ["English"],
          marks: 25,
          questions: 15,
          desc: "MCQ 15 + Written 10 (Replaces HSC 4th subject)",
          eligibilityEffect: "Can replace HSC 4th subject only. Restricts departmental eligibility if Math/Bio is dropped.",
          eligibilityEffectBn: "এইচএসসির ৪র্থ বিষয়ের পরিবর্তে নির্বাচন করা যায়। তবে গণিত বাদ দিলে ইঞ্জিনিয়ারিং ও জীববিজ্ঞান বাদ দিলে জীববিজ্ঞানের বিষয় পাওয়া যাবে না।"
        }
      ],
      eligibilityNotesBn: [
        "পদার্থবিজ্ঞান ও রসায়ন সকল বিজ্ঞান পরীক্ষার্থীর জন্য বাধ্যতামূলক।",
        "উচ্চতর গণিত ও জীববিজ্ঞানের মধ্যে যেটি পরীক্ষার্থীর ৪র্থ বিষয় ছিল, শুধুমাত্র সেটির পরিবর্তে বাংলা অথবা ইংরেজি উত্তর করা যাবে।",
        "সতর্কতা: গণিত উত্তর না করলে বুয়েট/ইঞ্জিনিয়ারিং বা সিএসই/ফলিত গণিত পাওয়া যাবে না। জীববিজ্ঞান উত্তর না করলে ফার্মেসি/বায়োটেকনোলজি পাওয়া যাবে না।"
      ],
      eligibilityNotesEn: [
        "Physics and Chemistry must be answered by every science candidate.",
        "Bangla or English can ONLY replace the subject that was your 4th subject in HSC.",
        "Choosing Bangla/English restricts eligibility for Engineering or Pure Biological science faculties."
      ]
    },
    departmentEligibility: {
      engineeringRule: "Requires answering Higher Mathematics and Physics.",
      engineeringRuleBn: "ইঞ্জিনিয়ারিং, সিএসই, ফলিত পদার্থ ও গণিত অনুষদের জন্য উচ্চতর গণিত উত্তর করা বাধ্যতামূলক।",
      biologyRule: "Requires answering Biology and Chemistry.",
      biologyRuleBn: "ফার্মেসি, অণুজীববিজ্ঞান, জেনেটিক ইঞ্জিনিয়ারিং ও প্রাণরসায়নের জন্য জীববিজ্ঞান উত্তর করা বাধ্যতামূলক।"
    },
    detailsBn: [
      "মোট প্রশ্ন: ৬০টি MCQ এবং লিখিত ৪০ মার্কস।",
      "প্রতি বিষয়ে ১৫টি MCQ (১৫ মার্কস) এবং ১০ মার্কসের লিখিত প্রশ্ন।",
      "মোট সময়: ১ ঘন্টা ৩০ মিনিট (MCQ ৪৫ মিনিট + লিখিত ৪৫ মিনিট)।",
      "নেগেটিভ মার্কিং: প্রতি ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা যাবে।"
    ],
    detailsEn: [
      "Total marks: 60 MCQ + 40 Written = 100 Marks.",
      "15 MCQs (15 marks) and 10 Written marks per subject across 4 subjects.",
      "Negative marking: -0.25 marks per incorrect MCQ."
    ]
  },

  RU: {
    id: "RU",
    code: "RU",
    nameBn: "রাজশাহী বিশ্ববিদ্যালয়",
    nameEn: "University of Rajshahi",
    unit: "C Unit (Science Stream)",
    examFormat: "80 MCQs carrying 100 Marks (1.25 Marks per question)",
    totalMarks: 100,
    totalQuestions: 80,
    markPerQuestion: 1.25,
    negativeMarking: 0.25,
    mode: 'ru_c_groups',
    hasOptionalChoice: true,
    compulsorySubjects: [
      { id: "Physics", name: "Physics", nameBn: "পদার্থবিজ্ঞান", marks: 31.25, questions: 25, desc: "25 Qs × 1.25 marks" },
      { id: "Chemistry", name: "Chemistry", nameBn: "রসায়ন", marks: 31.25, questions: 25, desc: "25 Qs × 1.25 marks" },
      { id: "ICT", name: "ICT", nameBn: "আইসিটি", marks: 6.25, questions: 5, desc: "5 Qs × 1.25 marks" }
    ],
    optionalRule: {
      type: 'select_group',
      requiredPickCount: 1,
      instructionBn: "গ্রুপ-বি (ঐচ্ছিক ৩১.২৫ মার্কস): নিচের ৩টি বিকল্পের যে কোনো ১টি নির্বাচন করুন:",
      instructionEn: "Group-B (Optional 31.25 Marks): Select exactly 1 option out of the 3 choices below:",
      options: [
        {
          id: "RU_MATH",
          label: "Mathematics Only (25 Qs)",
          labelBn: "১. শুধু উচ্চতর গণিত (২৫টি প্রশ্ন / ৩১.২৫ মার্কস)",
          subjects: ["Mathematics"],
          marks: 31.25,
          questions: 25,
          desc: "25 MCQs × 1.25 marks",
          eligibilityEffect: "Eligible for Engineering, CSE, Math, Physics, Statistics, and Physical Science faculties.",
          eligibilityEffectBn: "ইঞ্জিনিয়ারিং অনুষদ, সিএসই, ফলিত পদার্থ, গণিত ও পরিসংখ্যান বিভাগের জন্য বিবেচিত হবেন।"
        },
        {
          id: "RU_BIO",
          label: "Biology Only (25 Qs)",
          labelBn: "২. শুধু জীববিজ্ঞান (২৫টি প্রশ্ন / ৩১.২৫ মার্কস)",
          subjects: ["Biology"],
          marks: 31.25,
          questions: 25,
          desc: "25 MCQs × 1.25 marks",
          eligibilityEffect: "Eligible for Pharmacy, Agriculture, Veterinary, Botany, Zoology, and Life Science faculties.",
          eligibilityEffectBn: "ফার্মেসি, কৃষি অনুষদ, ভেটেরিনারি, প্রাণিবিজ্ঞান ও জীববিজ্ঞান অনুষদের জন্য বিবেচিত হবেন।"
        },
        {
          id: "RU_COMBINED",
          label: "Biology + Mathematics Combined (13 Bio + 12 Math Qs)",
          labelBn: "৩. জীববিজ্ঞান ও গণিত যৌথ (১৩ বায়ো + ১২ গণিত = ২৫টি প্রশ্ন)",
          subjects: ["Biology", "Mathematics"],
          marks: 31.25,
          questions: 25,
          desc: "13 Bio + 12 Math = 25 MCQs × 1.25 marks",
          eligibilityEffect: "Eligible for ALL departments (Both Engineering & Life Sciences, based on individual subject marks).",
          eligibilityEffectBn: "উভয় অনুষদের (ইঞ্জিনিয়ারিং + জীববিজ্ঞান) সকল বিষয়ের জন্য একসাথে বিবেচিত হবেন!"
        }
      ],
      eligibilityNotesBn: [
        "গ্রুপ-এ (বাধ্যতামূলক): পদার্থ (২৫), রসায়ন (২৫), এবং আইসিটি (৫) = মোট ৫৫টি প্রশ্ন (৬৮.৭৫ মার্কস)।",
        "গ্রুপ-বি (ঐচ্ছিক): ২৫টি প্রশ্ন (৩১.২৫ মার্কস)। যে কোনো একটি অপশন বেছে নিতে হবে।",
        "সুপারিশ: গণিত ও জীববিজ্ঞান যৌথ নির্বাচন করলে রাজশাহী বিশ্ববিদ্যালয়ের বিজ্ঞান অনুষদের সর্বোচ্চ সংখ্যক বিভাগে ভর্তির সুযোগ থাকে।"
      ],
      eligibilityNotesEn: [
        "Group-A (Compulsory 68.75 Marks): Physics (25 Qs), Chemistry (25 Qs), ICT (5 Qs).",
        "Group-B (Optional 31.25 Marks): Select either Math, Biology, or Combined (13 Bio + 12 Math).",
        "Selecting Combined option gives access to both Engineering and Biological faculties."
      ]
    },
    departmentEligibility: {
      engineeringRule: "Requires answering Option 1 (Math) or Option 3 (Math+Bio Combined).",
      engineeringRuleBn: "ইঞ্জিনিয়ারিং অনুষদের জন্য গণিত অথবা গণিত+জীববিজ্ঞান যৌথ উত্তর করা বাধ্যতামূলক।",
      biologyRule: "Requires answering Option 2 (Bio) or Option 3 (Math+Bio Combined).",
      biologyRuleBn: "কৃষি, ভেটেরিনারি ও জীববিজ্ঞান অনুষদের জন্য জীববিজ্ঞান অথবা যৌথ উত্তর করা বাধ্যতামূলক।"
    },
    detailsBn: [
      "৮০টি প্রশ্নে মোট ১০০ মার্কস। প্রতিটি প্রশ্নের মান ১.২৫ মার্কস।",
      "ভুল উত্তরের জন্য ০.২৫ নম্বর (অথবা প্রশ্নের মানের ২৫%) কাটা যাবে।",
      "পরীক্ষার সময়: ১ ঘণ্টা।"
    ],
    detailsEn: [
      "80 MCQs carrying 100 marks (1.25 marks per question).",
      "Negative marking: -0.25 (or 25% of mark value per question).",
      "Duration: 1 hour."
    ]
  },

  JU: {
    id: "JU",
    code: "JU",
    nameBn: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়",
    nameEn: "Jahangirnagar University",
    unit: "A Unit (Math/Physical Science) & D Unit (Biology)",
    examFormat: "MCQ (80 Marks) - All Subjects Compulsory Per Unit",
    totalMarks: 80,
    totalQuestions: 80,
    markPerQuestion: 1,
    negativeMarking: 0.2,
    mode: 'ju_fixed',
    hasOptionalChoice: false,
    compulsorySubjects: [
      { id: "Mathematics", name: "Mathematics", nameBn: "গণিত (A Unit)", marks: 22, questions: 22, desc: "A Unit: 22 marks" },
      { id: "Physics", name: "Physics", nameBn: "পদার্থবিজ্ঞান (A Unit)", marks: 22, questions: 22, desc: "A Unit: 22 marks" },
      { id: "Chemistry", name: "Chemistry", nameBn: "রসায়ন (A Unit & D Unit)", marks: 22, questions: 22, desc: "A Unit: 22 marks / D Unit: 24 marks" },
      { id: "Biology", name: "Biology", nameBn: "জীববিজ্ঞান (D Unit)", marks: 44, questions: 44, desc: "D Unit: উদ্ভিদবিজ্ঞান ২২ + প্রাণিবিজ্ঞান ২২ = ৪৪ মার্কস" },
      { id: "ICT", name: "ICT", nameBn: "আইসিটি", marks: 8, questions: 8, desc: "A Unit: 8 marks" },
      { id: "Bangla", name: "Bangla", nameBn: "বাংলা", marks: 3, questions: 3, desc: "A Unit: 3 marks / D Unit: 4 marks" },
      { id: "English", name: "English", nameBn: "ইংরেজি", marks: 3, questions: 3, desc: "A Unit: 3 marks / D Unit: 4 marks" }
    ],
    departmentEligibility: {
      engineeringRule: "Encompassed under A Unit examination.",
      engineeringRuleBn: "গাণিতিক ও পদার্থবিষয়ক বিজ্ঞান অনুষদ (A ইউনিট)-এর মাধ্যমে নির্ধারিত হয়।",
      biologyRule: "Encompassed under D Unit examination.",
      biologyRuleBn: "জীববিজ্ঞান অনুষদ (D ইউনিট)-এর মাধ্যমে নির্ধারিত হয়।"
    },
    detailsBn: [
      "জাবিতে কোনো ঐচ্ছিক বিষয় নির্বাচন করতে হয় না; প্রতিটি ইউনিটের সব বিষয় বাধ্যতামূলক।",
      "A ইউনিট (গাণিতিক ও পদার্থবিজ্ঞান অনুষদ - ৮০ মার্কস): গণিত ২২, পদার্থ ২২, রসায়ন ২২, আইসিটি ৮, বাংলা ৩, ইংরেজি ৩।",
      "D ইউনিট (জীববিজ্ঞান অনুষদ - ৮০ মার্কস): জীববিজ্ঞান ৪৪ (উদ্ভিদ ২২ + প্রাণি ২২), রসায়ন ২৪, বাংলা ৪, ইংরেজি ৪, সাধারণ জ্ঞান ও আইকিউ ৪।"
    ],
    detailsEn: [
      "JU has separate unit exams with NO optional choices; all subjects are compulsory per unit.",
      "A Unit (80 Marks): Math (22), Physics (22), Chemistry (22), ICT (8), Bangla (3), English (3).",
      "D Unit (80 Marks): Biology (44: Botany 22 + Zoology 22), Chemistry (24), Bangla (4), English (4), IQ (4)."
    ]
  },

  CU: {
    id: "CU",
    code: "CU",
    nameBn: "চট্টগ্রাম বিশ্ববিদ্যালয়",
    nameEn: "University of Chittagong",
    unit: "A Unit (Science)",
    examFormat: "100 Marks MCQ (4 Subjects × 25 Marks)",
    totalMarks: 100,
    totalQuestions: 100,
    markPerQuestion: 1,
    negativeMarking: 0.25,
    mode: 'cu_pick_three',
    hasOptionalChoice: true,
    compulsorySubjects: [
      { id: "English", name: "English", nameBn: "ইংরেজি", marks: 25, questions: 25, desc: "Mandatory for ALL science candidates (25 marks)" }
    ],
    optionalRule: {
      type: 'pick_n',
      requiredPickCount: 3,
      instructionBn: "ইংরেজি (২৫) বাধ্যতামূলক। বাকি ৪টি বিজ্ঞান বিষয়ের যে কোনো ৩টি নির্বাচন করুন (প্রতিটি ২৫ মার্কস):",
      instructionEn: "English (25 Marks) is mandatory. Select any 3 subjects out of the 4 science subjects below (25 marks each):",
      options: [
        {
          id: "Physics",
          label: "Physics",
          labelBn: "পদার্থবিজ্ঞান",
          subjects: ["Physics"],
          marks: 25,
          questions: 25,
          desc: "25 MCQs (25 Marks)",
          eligibilityEffect: "Required for Engineering, CSE, EEE, Applied Physics & Marine Science",
          eligibilityEffectBn: "ইঞ্জিনিয়ারিং, সিএসই, ইইই এবং মেরিন সায়েন্সের জন্য পদার্থবিজ্ঞান আবশ্যক।"
        },
        {
          id: "Chemistry",
          label: "Chemistry",
          labelBn: "রসায়ন",
          subjects: ["Chemistry"],
          marks: 25,
          questions: 25,
          desc: "25 MCQs (25 Marks)",
          eligibilityEffect: "Required for Chemistry, Pharmacy, Biochemistry, Oceanography",
          eligibilityEffectBn: "রসায়ন, ফার্মেসি, বায়োকেমিস্ট্রি ও সমুদ্রবিজ্ঞানের জন্য আবশ্যক।"
        },
        {
          id: "Mathematics",
          label: "Higher Mathematics",
          labelBn: "উচ্চতর গণিত",
          subjects: ["Mathematics"],
          marks: 25,
          questions: 25,
          desc: "25 MCQs (25 Marks)",
          eligibilityEffect: "Mandatory for Engineering, CSE, EEE, Mathematics & Statistics",
          eligibilityEffectBn: "সিএসই, ইইই ও গণিত বিভাগের জন্য গণিত উত্তর করা বাধ্যতামূলক।"
        },
        {
          id: "Biology",
          label: "Biology",
          labelBn: "জীববিজ্ঞান",
          subjects: ["Biology"],
          marks: 25,
          questions: 25,
          desc: "25 MCQs (25 Marks)",
          eligibilityEffect: "Mandatory for Pharmacy, Genetic Engineering, Microbiology, Zoology, Botany & Fisheries",
          eligibilityEffectBn: "ফার্মেসি, জেনেটিক ইঞ্জিনিয়ারিং, অণুজীববিজ্ঞান ও মৎস্যবিজ্ঞানের জন্য বাধ্যতামূলক।"
        }
      ],
      eligibilityNotesBn: [
        "ইংরেজি (২৫ মার্কস) সকল পরীক্ষার্থীর জন্য ১০০% বাধ্যতামূলক।",
        "পদার্থ, রসায়ন, গণিত ও জীববিজ্ঞানের মধ্যে যে কোনো ৩টি উত্তর করতে হবে।",
        "গুরুত্বপূর্ণ সতর্কতা: ইঞ্জিনিয়ারিং (সিএসই/ইইই)-এর জন্য গণিত ও পদার্থবিজ্ঞান দুটোই উত্তর করা বাধ্যতামূলক।"
      ],
      eligibilityNotesEn: [
        "English (25 Marks) is compulsory for all candidates.",
        "Candidates pick any 3 from Physics, Chemistry, Math, and Biology (25 marks each).",
        "To be eligible for Engineering / CSE / EEE, answering Mathematics and Physics is strictly required."
      ]
    },
    departmentEligibility: {
      engineeringRule: "Must answer Physics and Higher Mathematics.",
      engineeringRuleBn: "ইঞ্জিনিয়ারিং (সিএসই, ইইই) ও গণিত বিভাগের জন্য পদার্থ ও গণিত আবশ্যক।",
      biologyRule: "Must answer Biology and Chemistry.",
      biologyRuleBn: "ফার্মেসি ও জীববিজ্ঞানের বিষয়সমূহের জন্য জীববিজ্ঞান ও রসায়ন আবশ্যক।"
    },
    detailsBn: [
      "১০০টি প্রশ্নে মোট ১০০ মার্কস। প্রতিটি প্রশ্নের মান ১ মার্ক।",
      "ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা যাবে।",
      "ইংরেজি অংশে পাস নম্বর অর্জন আবশ্যক।"
    ],
    detailsEn: [
      "100 MCQs carrying 100 marks. 1 mark per question.",
      "Negative marking: -0.25 marks per wrong answer.",
      "Minimum qualifying score in English is required."
    ]
  },

  GST: {
    id: "GST",
    code: "GST",
    nameBn: "জিএসটি গুচ্ছ (GST Cluster)",
    nameEn: "GST Cluster (19+ Universities)",
    unit: "A Unit (Science)",
    examFormat: "100 Marks MCQ (4 Subjects × 25 Marks)",
    totalMarks: 100,
    totalQuestions: 100,
    markPerQuestion: 1,
    negativeMarking: 0.25,
    mode: 'gst_pick_two',
    hasOptionalChoice: true,
    compulsorySubjects: [
      { id: "Physics", name: "Physics", nameBn: "পদার্থবিজ্ঞান", marks: 25, questions: 25, desc: "25 MCQs (25 Marks)" },
      { id: "Chemistry", name: "Chemistry", nameBn: "রসায়ন", marks: 25, questions: 25, desc: "25 MCQs (25 Marks)" }
    ],
    optionalRule: {
      type: 'pick_n',
      requiredPickCount: 2,
      instructionBn: "পদার্থ ও রসায়ন (৫০) বাধ্যতামূলক। বাকি ৪টি বিষয়ের যে কোনো ২টি নির্বাচন করুন (প্রতিটি ২৫ মার্কস):",
      instructionEn: "Physics and Chemistry (50 Marks) are compulsory. Select any 2 optional subjects (25 marks each):",
      options: [
        {
          id: "Mathematics",
          label: "Higher Mathematics",
          labelBn: "উচ্চতর গণিত",
          subjects: ["Mathematics"],
          marks: 25,
          questions: 25,
          desc: "25 MCQs (25 Marks)",
          eligibilityEffect: "Mandatory for Engineering, CSE, EEE, Civil, Mechanical, Architecture & Math",
          eligibilityEffectBn: "সকল প্রযুক্তি ও প্রকৌশল বিশ্ববিদ্যালয়ের ইঞ্জিনিয়ারিং ও সিএসইর জন্য গণিত বাধ্যতামূলক।"
        },
        {
          id: "Biology",
          label: "Biology",
          labelBn: "জীববিজ্ঞান",
          subjects: ["Biology"],
          marks: 25,
          questions: 25,
          desc: "25 MCQs (25 Marks)",
          eligibilityEffect: "Mandatory for Pharmacy, Genetic Engineering, Biotechnology & Agriculture",
          eligibilityEffectBn: "ফার্মেসি, বায়োটেকনোলজি ও জীববিজ্ঞান সংশ্লিষ্ট বিভাগের জন্য আবশ্যক।"
        },
        {
          id: "Bangla",
          label: "Bangla",
          labelBn: "বাংলা (৪র্থ বিষয়ের বিকল্প)",
          subjects: ["Bangla"],
          marks: 25,
          questions: 25,
          desc: "25 MCQs (Replaces HSC 4th subject)",
          eligibilityEffect: "Replaces HSC 4th subject only. Dropping Math/Bio restricts relevant faculty eligibility.",
          eligibilityEffectBn: "এইচএসসির ৪র্থ বিষয়ের বিকল্প হিসেবে উত্তর করা যায়।"
        },
        {
          id: "English",
          label: "English",
          labelBn: "ইংরেজি (৪র্থ বিষয়ের বিকল্প)",
          subjects: ["English"],
          marks: 25,
          questions: 25,
          desc: "25 MCQs (Replaces HSC 4th subject)",
          eligibilityEffect: "Replaces HSC 4th subject only. Dropping Math/Bio restricts relevant faculty eligibility.",
          eligibilityEffectBn: "এইচএসসির ৪র্থ বিষয়ের বিকল্প হিসেবে উত্তর করা যায়।"
        }
      ],
      eligibilityNotesBn: [
        "পদার্থবিজ্ঞান (২৫) ও রসায়ন (২৫) বাধ্যতামূলক।",
        "ঐচ্ছিক থেকে ২টি বিষয় উত্তর করতে হবে। উচ্চতর গণিত বাদ দিলে ইঞ্জিনিয়ারিং বিষয়গুলো বরাদ্দ পাওয়া যাবে না।"
      ],
      eligibilityNotesEn: [
        "Physics (25) and Chemistry (25) are compulsory.",
        "Choose any 2 from Math, Biology, Bangla, and English.",
        "Dropping Math excludes engineering departments across all 19+ cluster universities."
      ]
    },
    departmentEligibility: {
      engineeringRule: "Higher Mathematics is compulsory for all Engineering & Technology programs.",
      engineeringRuleBn: "প্রকৌশল ও প্রযুক্তি অনুষদের জন্য উচ্চতর গণিত উত্তর করা বাধ্যতামূলক।",
      biologyRule: "Biology is compulsory for Pharmacy and Life Science programs.",
      biologyRuleBn: "ফার্মেসি ও জীবন বিজ্ঞান অনুষদের জন্য জীববিজ্ঞান উত্তর করা বাধ্যতামূলক।"
    },
    detailsBn: [
      "১০০টি প্রশ্নে মোট ১০০ মার্কস। প্রতি ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা যাবে।"
    ],
    detailsEn: [
      "100 MCQs carrying 100 marks. -0.25 negative marking per incorrect answer."
    ]
  },

  CoU: {
    id: "CoU",
    code: "CoU",
    nameBn: "কুমিল্লা বিশ্ববিদ্যালয়",
    nameEn: "Comilla University",
    unit: "A Unit (Science)",
    examFormat: "100 Marks MCQ (4 Subjects × 25 Marks)",
    totalMarks: 100,
    totalQuestions: 100,
    markPerQuestion: 1,
    negativeMarking: 0.25,
    mode: 'cou_pick_two',
    hasOptionalChoice: true,
    compulsorySubjects: [
      { id: "Physics", name: "Physics", nameBn: "পদার্থবিজ্ঞান", marks: 25, questions: 25, desc: "25 MCQs (25 Marks)" },
      { id: "Chemistry", name: "Chemistry", nameBn: "রসায়ন", marks: 25, questions: 25, desc: "25 MCQs (25 Marks)" }
    ],
    optionalRule: {
      type: 'pick_n',
      requiredPickCount: 2,
      instructionBn: "পদার্থ ও রসায়ন বাধ্যতামূলক। নিচের ৩টি অপশনের যে কোনো ২টি নির্বাচন করুন (প্রতিটি ২৫ মার্কস):",
      instructionEn: "Physics and Chemistry are compulsory. Answer any 2 out of the 3 optional subjects below (25 marks each):",
      options: [
        {
          id: "Mathematics",
          label: "Mathematics",
          labelBn: "উচ্চতর গণিত",
          subjects: ["Mathematics"],
          marks: 25,
          questions: 25,
          desc: "25 MCQs",
          eligibilityEffect: "Mandatory for Engineering, CSE, ICT & Math",
          eligibilityEffectBn: "সিএসই, আইসিটি, গণিত ও পদার্থবিজ্ঞান বিভাগের জন্য আবশ্যক।"
        },
        {
          id: "Biology",
          label: "Biology",
          labelBn: "জীববিজ্ঞান",
          subjects: ["Biology"],
          marks: 25,
          questions: 25,
          desc: "25 MCQs",
          eligibilityEffect: "Mandatory for Pharmacy & Biological Sciences",
          eligibilityEffectBn: "ফার্মেসি বিভাগের জন্য জীববিজ্ঞান আবশ্যক।"
        },
        {
          id: "BanglaEnglish",
          label: "Bangla & English Combined",
          labelBn: "বাংলা ও ইংরেজি যৌথ (১২+১৩)",
          subjects: ["Bangla", "English"],
          marks: 25,
          questions: 25,
          desc: "Bangla (12) + English (13) = 25 MCQs",
          eligibilityEffect: "Optional choice instead of HSC 4th subject.",
          eligibilityEffectBn: "এইচএসসির ৪র্থ বিষয়ের বিকল্প হিসেবে উত্তর করা যাবে।"
        }
      ],
      eligibilityNotesBn: [
        "পদার্থ ও রসায়ন বাধ্যতামূলক। গণিত, জীববিজ্ঞান এবং বাংলা+ইংরেজি যৌথ-এর মধ্য থেকে যে কোনো ২টি উত্তর করতে হবে।"
      ],
      eligibilityNotesEn: [
        "Physics and Chemistry are compulsory. Pick any 2 out of Math, Biology, and Bangla & English Combined."
      ]
    },
    departmentEligibility: {
      engineeringRule: "Higher Mathematics is required for CSE, ICT, and Physics.",
      engineeringRuleBn: "সিএসই, আইসিটি ও গণিতের জন্য উচ্চতর গণিত আবশ্যক।",
      biologyRule: "Biology is required for Pharmacy.",
      biologyRuleBn: "ফার্মেসি বিভাগের জন্য জীববিজ্ঞান আবশ্যক।"
    },
    detailsBn: [
      "১০০টি প্রশ্নে মোট ১০০ মার্কস। ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা যাবে।"
    ],
    detailsEn: [
      "100 MCQs carrying 100 marks. -0.25 negative marking per incorrect answer."
    ]
  },

  JnU: {
    id: "JnU",
    code: "JnU",
    nameBn: "জগন্নাথ বিশ্ববিদ্যালয়",
    nameEn: "Jagannath University",
    unit: "A Unit (Science)",
    examFormat: "MCQ-Based Test (3 Subjects Total)",
    totalMarks: 72,
    totalQuestions: 72,
    markPerQuestion: 1,
    negativeMarking: 0.25,
    mode: 'jnu_pick_one',
    hasOptionalChoice: true,
    compulsorySubjects: [
      { id: "Physics", name: "Physics", nameBn: "পদার্থবিজ্ঞান", marks: 24, questions: 24, desc: "Compulsory" },
      { id: "Chemistry", name: "Chemistry", nameBn: "রসায়ন", marks: 24, questions: 24, desc: "Compulsory" }
    ],
    optionalRule: {
      type: 'pick_one',
      requiredPickCount: 1,
      instructionBn: "পদার্থবিজ্ঞান ও রসায়ন বাধ্যতামূলক। গণিত অথবা জীববিজ্ঞানের যে কোনো ১টি নির্বাচন করুন:",
      instructionEn: "Physics and Chemistry are compulsory. Choose and answer only 1 of the two options:",
      options: [
        {
          id: "Mathematics",
          label: "Mathematics Only",
          labelBn: "উচ্চতর গণিত",
          subjects: ["Mathematics"],
          marks: 24,
          questions: 24,
          desc: "Answering Math opens Engineering, CSE & Math departments",
          eligibilityEffect: "Eligible for CSE, Math, Physics, Chemistry & Statistics",
          eligibilityEffectBn: "সিএসই, গণিত, পদার্থ ও পরিসংখ্যান বিভাগের জন্য বিবেচিত হবেন।"
        },
        {
          id: "Biology",
          label: "Biology Only",
          labelBn: "জীববিজ্ঞান",
          subjects: ["Biology"],
          marks: 24,
          questions: 24,
          desc: "Answering Biology opens Pharmacy, Microbiology & Life Sciences",
          eligibilityEffect: "Eligible for Pharmacy, Microbiology, Genetic Engineering & Botany",
          eligibilityEffectBn: "ফার্মেসি, মাইক্রোবায়োলজি, জেনেটিক ইঞ্জিনিয়ারিং ও প্রাণিবিজ্ঞানের জন্য বিবেচিত হবেন।"
        }
      ],
      eligibilityNotesBn: [
        "জবি ২০২৫-২৬ শিক্ষাবর্ষে পুনরায় পূর্ণাঙ্গ MCQ পদ্ধতিতে ফিরে এসেছে।",
        "পদার্থ ও রসায়ন বাদে গণিত অথবা জীববিজ্ঞানের মধ্যে যে কোনো ১টি বিষয় বাছাই করে উত্তর দিতে হয়।"
      ],
      eligibilityNotesEn: [
        "JnU transitioned back to MCQ format for 2025-26 cycle.",
        "Candidates choose and answer only 1 optional subject (Mathematics OR Biology)."
      ]
    },
    departmentEligibility: {
      engineeringRule: "Requires answering Mathematics.",
      engineeringRuleBn: "সিএসই ও গণিত বিভাগের জন্য গণিত উত্তর করা বাধ্যতামূলক।",
      biologyRule: "Requires answering Biology.",
      biologyRuleBn: "ফার্মেসি ও জীববিজ্ঞানের জন্য জীববিজ্ঞান উত্তর করা আবশ্যক।"
    },
    detailsBn: [
      "মোট ৩টি বিষয়ে পরীক্ষা অনুষ্ঠিত হয়। নেগেটিভ মার্কিং ০.২৫।"
    ],
    detailsEn: [
      "Total 3 subjects examined. -0.25 negative marking per incorrect answer."
    ]
  },

  KhU: {
    id: "KhU",
    code: "KhU",
    nameBn: "খুলনা বিশ্ববিদ্যালয়",
    nameEn: "Khulna University",
    unit: "A Unit (SET) & B Unit (Life Science)",
    examFormat: "100 Marks (60 MCQ + 40 Written) - Fixed Subjects Per Unit",
    totalMarks: 100,
    totalQuestions: 60,
    markPerQuestion: 1,
    negativeMarking: 0.25,
    mode: 'khu_fixed',
    hasOptionalChoice: false,
    compulsorySubjects: [
      { id: "Mathematics", name: "Mathematics", nameBn: "উচ্চতর গণিত (A Unit: ২০ MCQ + Written)", marks: 28, desc: "A Unit: Math is prominent" },
      { id: "Physics", name: "Physics", nameBn: "পদার্থবিজ্ঞান (A Unit: ২০ MCQ + Written)", marks: 28, desc: "A Unit: Physics is prominent" },
      { id: "Chemistry", name: "Chemistry", nameBn: "রসায়ন (A Unit: ২০ MCQ + Written)", marks: 28, desc: "A Unit: Chemistry is prominent" },
      { id: "Biology", name: "Biology", nameBn: "জীববিজ্ঞান (B Unit)", marks: 25, desc: "B Unit: Life Science School" },
      { id: "English", name: "English", nameBn: "ইংরেজি", marks: 10, desc: "Written section covers English & ICT" }
    ],
    departmentEligibility: {
      engineeringRule: "Encompassed under A Unit (Science, Engineering & Technology).",
      engineeringRuleBn: "বিজ্ঞান, প্রকৌশল ও প্রযুক্তিবিদ্যা স্কুল (A ইউনিট)-এর মাধ্যমে নির্ধারিত হয়।",
      biologyRule: "Encompassed under B Unit (Life Science School).",
      biologyRuleBn: "জীববিজ্ঞান স্কুল (B ইউনিট)-এর মাধ্যমে নির্ধারিত হয়।"
    },
    detailsBn: [
      "খুবিতে বিষয় নির্বাচন করতে হয় না; প্রতিটি ইউনিটের বিষয় নির্ধারিত।",
      "A ইউনিট (প্রকৌশল ও বিজ্ঞান): MCQ ৬০ মার্কস (গণিত ২০, পদার্থ ২০, রসায়ন ২০) এবং লিখিত ৪০ মার্কস (গণিত, পদার্থ, রসায়ন, ইংরেজি, আইসিটি)।",
      "B ইউনিট (জীববিজ্ঞান স্কুল): MCQ ৬০ মার্কস (বায়ো, রসায়ন, পদার্থ, গণিত) এবং লিখিত ৪০ মার্কস (বায়ো, রসায়ন, পদার্থ, গণিত, ইংরেজি)।"
    ],
    detailsEn: [
      "KU conducts 100-mark exams with fixed subjects per unit (no optional choices).",
      "A Unit: Math, Phy, Chem in MCQ (60 marks), plus Written (40 marks) covering Math, Phy, Chem, Eng, ICT.",
      "B Unit: Bio, Chem, Phy, Math in MCQ (60 marks), plus Written covering Bio, Chem, Phy, Math, English."
    ]
  },

  AGRI: {
    id: "AGRI",
    code: "AGRI",
    nameBn: "কৃষি ভর্তি প্রশ্নব্যাংক ও গুচ্ছ",
    nameEn: "Agricultural Cluster (GST-Agri, BAU, SAU, CVASU, GAU, SYLAU)",
    unit: "Combined Agricultural Science",
    examFormat: "100 Marks MCQ (1 Hour) - All 5 Subjects Compulsory",
    totalMarks: 100,
    totalQuestions: 100,
    markPerQuestion: 1,
    negativeMarking: 0.25,
    mode: 'agri_fixed',
    hasOptionalChoice: false,
    compulsorySubjects: [
      { id: "Biology", name: "Biology", nameBn: "জীববিজ্ঞান (উদ্ভিদ ১৫ + প্রাণী ১৫)", marks: 30, questions: 30, desc: "Botany 15 + Zoology 15 = 30 Marks" },
      { id: "Chemistry", name: "Chemistry", nameBn: "রসায়ন", marks: 20, questions: 20, desc: "20 MCQs (20 Marks)" },
      { id: "Physics", name: "Physics", nameBn: "পদার্থবিজ্ঞান", marks: 20, questions: 20, desc: "20 MCQs (20 Marks)" },
      { id: "Mathematics", name: "Mathematics", nameBn: "উচ্চতর গণিত", marks: 20, questions: 20, desc: "20 MCQs (20 Marks)" },
      { id: "English", name: "English", nameBn: "ইংরেজি", marks: 10, questions: 10, desc: "10 MCQs (10 Marks)" }
    ],
    departmentEligibility: {
      engineeringRule: "All agricultural engineering and life sciences require all 5 compulsory subjects.",
      engineeringRuleBn: "কৃষি প্রকৌশল, ভেটেরিনারি ও কৃষিবিজ্ঞানের সকল বিষয়ের জন্য এই ৫টি বিষয়ই প্রযোজ্য।",
      biologyRule: "Biology carries the highest weight (30 marks total: Botany 15 + Zoology 15).",
      biologyRuleBn: "জীববিজ্ঞানে সর্বোচ্চ ৩০ মার্কস (উদ্ভিদবিজ্ঞান ১৫ + প্রাণিবিজ্ঞান ১৫) বরাদ্দ।"
    },
    detailsBn: [
      "কৃষি গুচ্ছে কোনো ঐচ্ছিক বিষয় নেই; সকল পরীক্ষার্থীর জন্য ৫টি বিষয়ই ১০০% বাধ্যতামূলক।",
      "বিষয় বণ্টন: জীববিজ্ঞান ৩০ (উদ্ভিদ ১৫ + প্রাণী ১৫), রসায়ন ২০, পদার্থবিজ্ঞান ২০, গণিত ২০, ইংরেজি ১০। মোট ১০০ মার্কস।",
      "পরীক্ষার সময়: ১ ঘন্টা। ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা যাবে।"
    ],
    detailsEn: [
      "All 5 subjects are mandatory for all aspirants; there are no optional choices.",
      "Mark distribution: Biology 30 (Botany 15 + Zoology 15), Chemistry 20, Physics 20, Mathematics 20, English 10. Total 100 Marks.",
      "Negative marking: -0.25 per incorrect answer. Duration: 1 hour."
    ]
  }
};

/**
 * Returns the admission rule for a given institution code or session
 */
export function getAdmissionRule(institution: string, unit?: string | null): UniversityAdmissionRule {
  const cleanInst = (institution || '').toUpperCase();

  // Agricultural cluster aliases
  if (['AGRI', 'GSTAGRI', 'GST-AGRI', 'BAU', 'SAU', 'CVASU', 'GAU', 'SYLAU'].includes(cleanInst)) {
    return universityAdmissionRules.AGRI;
  }

  if (cleanInst === 'KU' || cleanInst === 'KHU') {
    return universityAdmissionRules.KhU;
  }

  if (universityAdmissionRules[cleanInst]) {
    return universityAdmissionRules[cleanInst];
  }

  // Fallback to DU structure as standard default
  return universityAdmissionRules.DU;
}
