import { z } from 'zod'; // Keep zod if needed for other types, or remove if not used here.

// --- English Seed Data ---
export const initialBenefitsEn = [
  { 
    language: 'en', 
    category: 'Financial' as const, 
    title: 'Financial Assistance', 
    slug: 'financial-assistance', // Ensure slugs are URL-friendly and unique per language
    description: 'Details about financial aid programs, including emergency funds and stipends.', 
    eligibility: 'Eligibility criteria include demonstrated financial need and specific circumstances related to family status (martyr, wounded, prisoner). Documentation required.', 
    applicationProcess: 'Complete the online Financial Aid Application form available in your dashboard. Attach required documents. Processing time is typically 2-4 weeks.'
  },
  // ... (rest of initialBenefitsEn data)
   { 
    language: 'en', 
    category: 'Vocational' as const, 
    title: 'Vocational Training', 
    slug: 'vocational-training',
    description: 'Programs designed to provide job skills, training opportunities, and assistance with job placement.', 
    eligibility: 'Open to eligible beneficiaries seeking employment or skill enhancement. Program availability may vary.', 
    applicationProcess: 'Express interest through your case worker or check the portal for current training opportunities and application details.'
  },
];

export const initialFaqsEn = [
  {
    language: 'en',
    question: 'How often is information updated?',
    answer: 'Information on benefits and programs is reviewed and updated quarterly, or sooner if significant program changes occur. Check the portal regularly for the latest details.',
    category: 'General',
    sortOrder: 10,
  },
  // ... (rest of initialFaqsEn data)
    {
    language: 'en',
    question: 'Is my personal information kept confidential?',
    answer: 'Yes, we adhere to strict data privacy and security policies. Your personal information is kept confidential and used solely for the purpose of providing support. Please review our Privacy Policy for more details.',
    category: 'Privacy',
    sortOrder: 40,
  },
];

// --- Arabic Seed Data ---
export const initialBenefitsAr = [
  { language: 'ar', category: 'Financial' as const, title: 'مساعدة مالية', slug: 'financial-assistance', description: 'تفاصيل حول برامج المساعدات المالية...', eligibility: 'معايير الأهلية للمساعدة المالية...', applicationProcess: 'كيفية التقديم للحصول على المساعدة المالية...' },
  // ... (rest of initialBenefitsAr data)
  { language: 'ar', category: 'Vocational' as const, title: 'تدريب مهني', slug: 'vocational-training', description: 'المساعدة في التدريب الوظيفي والتوظيف...', eligibility: 'معايير الأهلية للتدريب المهني...', applicationProcess: 'كيفية التقديم للتدريب المهني...' },
];

export const initialFaqsAr = [
  { language: 'ar', question: 'كم مرة يتم تحديث المعلومات؟', answer: 'تتم مراجعة المعلومات وتحديثها فصليًا...', category: 'General', sortOrder: 10, },
  // ... (rest of initialFaqsAr data)
  { language: 'ar', question: 'هل يتم الحفاظ على سرية معلوماتي الشخصية؟', answer: 'نعم، نحن نلتزم بسياسات خصوصية وأمن صارمة...', category: 'Privacy', sortOrder: 40, },
];

// --- Result Type ---
export interface SeedResult {
    success: boolean;
    message: string;
    benefitsAddedEn?: number;
    faqsAddedEn?: number;
    benefitsAddedAr?: number;
    faqsAddedAr?: number;
} 