'use server';

import { db } from '@/lib/db';
import { informationBenefits, informationFaqs, benefitCategoryEnum } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
    initialBenefitsEn,
    initialFaqsEn,
    initialBenefitsAr,
    initialFaqsAr,
    type SeedResult
} from '@/lib/seedData/informationSeedData';

// Define the seed data
// ... existing code ...


// ... existing code ...


// ... existing code ...


// ... existing code ...
// --- Arabic Seed Data ---
// ... existing code ...


// ... existing code ...


// ... existing code ...


// ... existing code ...

/**
 * Seeds the database with initial English and Arabic content for the Information Portal.
 * Uses onConflictDoNothing for benefits based on unique slug+language constraint.
 * Note: FAQs might be duplicated if run multiple times without a unique constraint.
 */
export async function seedInitialInformation(): Promise<SeedResult> {
    let benefitsCountEn = 0;
    let faqsCountEn = 0;
    let benefitsCountAr = 0;
    let faqsCountAr = 0;

    try {
        // Seed English Benefits
        const benefitInsertResultEn = await db.insert(informationBenefits)
            .values(initialBenefitsEn)
             // Assuming unique constraint is on (slug, language)
            .onConflictDoNothing({ target: [informationBenefits.slug, informationBenefits.language] })
            .returning({ id: informationBenefits.id });
        benefitsCountEn = benefitInsertResultEn.length;

        // Seed English FAQs
        const faqInsertResultEn = await db.insert(informationFaqs)
            .values(initialFaqsEn)
             // No unique constraint by default, might insert duplicates
            .returning({ id: informationFaqs.id });
        faqsCountEn = faqInsertResultEn.length;

        // Seed Arabic Benefits
        const benefitInsertResultAr = await db.insert(informationBenefits)
            .values(initialBenefitsAr)
             // Assuming unique constraint is on (slug, language)
            .onConflictDoNothing({ target: [informationBenefits.slug, informationBenefits.language] })
            .returning({ id: informationBenefits.id });
        benefitsCountAr = benefitInsertResultAr.length;

        // Seed Arabic FAQs
        const faqInsertResultAr = await db.insert(informationFaqs)
            .values(initialFaqsAr)
             // No unique constraint by default, might insert duplicates
            .returning({ id: informationFaqs.id });
        faqsCountAr = faqInsertResultAr.length;

        return { 
            success: true, 
            message: `Seeding complete. EN: Added ${benefitsCountEn} benefits, ${faqsCountEn} FAQs. AR: Added ${benefitsCountAr} benefits, ${faqsCountAr} FAQs.`,
            benefitsAddedEn: benefitsCountEn,
            faqsAddedEn: faqsCountEn,
            benefitsAddedAr: benefitsCountAr,
            faqsAddedAr: faqsCountAr
        };

    } catch (error: any) {
        console.error("Error seeding information data:", error);
        return { success: false, message: `Seeding failed: ${error.message || 'Unknown error'}` };
    }
} 