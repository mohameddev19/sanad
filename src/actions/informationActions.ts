'use server';

import { db } from '@/lib/db';
import { informationBenefits, informationFaqs } from '@/lib/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import type { BenefitInfo, FaqInfo } from '@/lib/schemas/informationTypes';

interface GetBenefitsResult {
    success: boolean;
    benefits: BenefitInfo[];
    message?: string;
}

/**
 * Fetches active information benefits for a given locale.
 * @param locale The language code (e.g., 'en', 'ar')
 * @returns Promise<GetBenefitsResult>
 */
export async function getInformationBenefits(locale: string): Promise<GetBenefitsResult> {
    try {
        const benefitsData = await db.select()
            .from(informationBenefits)
            .where(and(
                eq(informationBenefits.language, locale),
                eq(informationBenefits.isActive, true)
            ))
            .orderBy(asc(informationBenefits.title)); // Or perhaps a dedicated sortOrder field later

        return { success: true, benefits: benefitsData };
    } catch (error) {
        console.error("Error fetching information benefits:", error);
        return { success: false, benefits: [], message: 'An error occurred while fetching benefits information.' };
    }
}

interface GetFaqsResult {
    success: boolean;
    faqs: FaqInfo[];
    message?: string;
}

/**
 * Fetches active FAQs for a given locale.
 * @param locale The language code (e.g., 'en', 'ar')
 * @returns Promise<GetFaqsResult>
 */
export async function getInformationFaqs(locale: string): Promise<GetFaqsResult> {
    try {
        const faqsData = await db.select()
            .from(informationFaqs)
            .where(and(
                eq(informationFaqs.language, locale),
                eq(informationFaqs.isActive, true)
            ))
            .orderBy(asc(informationFaqs.sortOrder), asc(informationFaqs.question)); 

        return { success: true, faqs: faqsData };
    } catch (error) {
        console.error("Error fetching FAQs:", error);
        return { success: false, faqs: [], message: 'An error occurred while fetching FAQs.' };
    }
} 