import type { informationBenefits, informationFaqs } from '@/lib/db/schema';

// Type alias for the benefit data
export type BenefitInfo = typeof informationBenefits.$inferSelect;

// Type alias for the FAQ data
export type FaqInfo = typeof informationFaqs.$inferSelect; 