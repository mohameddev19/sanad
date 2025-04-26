'use server';

import { z } from 'zod';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from '@/lib/db';
import { applications, beneficiaries, applicationTypeEnum, applicationStatusEnum } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
    financialAssistanceSchema,
    FinancialAssistanceInput,
    medicalAssistanceSchema,
    MedicalAssistanceInput,
    educationalAssistanceSchema,
    EducationalAssistanceInput,
    otherAssistanceSchema,
    OtherAssistanceInput,
    BeneficiaryApplication
} from '@/lib/schemas/applicationSchemas';

interface SubmitApplicationResult {
    success: boolean;
    message: string;
    applicationId?: number;
    errors?: z.ZodIssue[];
}

export async function submitFinancialApplication(formData: FinancialAssistanceInput): Promise<SubmitApplicationResult> {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();
    const isAuth = await isAuthenticated();

    if (!isAuth || !user) {
        return { success: false, message: 'Not authenticated' };
    }

    // Validate form data
    const validationResult = financialAssistanceSchema.safeParse(formData);
    if (!validationResult.success) {
        return {
            success: false,
            message: 'Validation failed',
            errors: validationResult.error.errors,
        };
    }

    try {
        // Get the beneficiary ID associated with the Kinde user
        const beneficiaryProfile = await db.query.beneficiaries.findFirst({
            where: eq(beneficiaries.kindeUserId, user.id),
            columns: { id: true }
        });

        if (!beneficiaryProfile) {
            // This case should ideally be handled by ensuring profile exists before showing the form
            return { success: false, message: 'Beneficiary profile not found. Please set up your profile first.' };
        }

        // Insert the application record
        const [newApplication] = await db.insert(applications)
            .values({
                beneficiaryId: beneficiaryProfile.id,
                applicationType: applicationTypeEnum.enumValues[0], // 'Financial'
                status: applicationStatusEnum.enumValues[1], // 'Submitted'
                formData: validationResult.data, // Store validated form data directly
                submittedAt: new Date(),
                updatedAt: new Date(),
            })
            .returning({ id: applications.id }); // Return the ID of the new application

        // Revalidate paths if needed (e.g., an application list page)
        // revalidatePath('/[locale]/applications'); 

        return { 
            success: true, 
            message: 'Financial assistance application submitted successfully!', 
            applicationId: newApplication.id 
        };

    } catch (error) {
        console.error("Error submitting application:", error);
        return { success: false, message: 'An error occurred while submitting the application.' };
    }
}

// --- Medical Assistance --- 

export async function submitMedicalApplication(formData: MedicalAssistanceInput): Promise<SubmitApplicationResult> {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();
    const isAuth = await isAuthenticated();
    if (!isAuth || !user) return { success: false, message: 'Not authenticated' };

    const validationResult = medicalAssistanceSchema.safeParse(formData);
    if (!validationResult.success) return { success: false, message: 'Validation failed', errors: validationResult.error.errors };

    try {
        const beneficiaryProfile = await db.query.beneficiaries.findFirst({ where: eq(beneficiaries.kindeUserId, user.id), columns: { id: true } });
        if (!beneficiaryProfile) return { success: false, message: 'Beneficiary profile not found.' };

        const [newApplication] = await db.insert(applications).values({
            beneficiaryId: beneficiaryProfile.id,
            applicationType: applicationTypeEnum.enumValues[1], // 'Medical'
            status: applicationStatusEnum.enumValues[1], // 'Submitted'
            formData: validationResult.data,
            submittedAt: new Date(), updatedAt: new Date(),
        }).returning({ id: applications.id });

        return { success: true, message: 'Medical assistance application submitted successfully!', applicationId: newApplication.id };
    } catch (error) {
        console.error("Error submitting medical application:", error);
        return { success: false, message: 'An error occurred.' };
    }
}

// --- Educational Assistance --- 

export async function submitEducationalApplication(formData: EducationalAssistanceInput): Promise<SubmitApplicationResult> {
     const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();
    const isAuth = await isAuthenticated();
    if (!isAuth || !user) return { success: false, message: 'Not authenticated' };

    const validationResult = educationalAssistanceSchema.safeParse(formData);
    if (!validationResult.success) return { success: false, message: 'Validation failed', errors: validationResult.error.errors };

    try {
        const beneficiaryProfile = await db.query.beneficiaries.findFirst({ where: eq(beneficiaries.kindeUserId, user.id), columns: { id: true } });
        if (!beneficiaryProfile) return { success: false, message: 'Beneficiary profile not found.' };

        const [newApplication] = await db.insert(applications).values({
            beneficiaryId: beneficiaryProfile.id,
            applicationType: applicationTypeEnum.enumValues[2], // 'Educational'
            status: applicationStatusEnum.enumValues[1], // 'Submitted'
            formData: validationResult.data,
            submittedAt: new Date(), updatedAt: new Date(),
        }).returning({ id: applications.id });

        return { success: true, message: 'Educational assistance application submitted successfully!', applicationId: newApplication.id };
    } catch (error) {
        console.error("Error submitting educational application:", error);
        return { success: false, message: 'An error occurred.' };
    }
}

// --- Other Assistance --- 

export async function submitOtherApplication(formData: OtherAssistanceInput): Promise<SubmitApplicationResult> {
     const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();
    const isAuth = await isAuthenticated();
    if (!isAuth || !user) return { success: false, message: 'Not authenticated' };

    const validationResult = otherAssistanceSchema.safeParse(formData);
    if (!validationResult.success) return { success: false, message: 'Validation failed', errors: validationResult.error.errors };

    try {
        const beneficiaryProfile = await db.query.beneficiaries.findFirst({ where: eq(beneficiaries.kindeUserId, user.id), columns: { id: true } });
        if (!beneficiaryProfile) return { success: false, message: 'Beneficiary profile not found.' };

        const [newApplication] = await db.insert(applications).values({
            beneficiaryId: beneficiaryProfile.id,
            applicationType: applicationTypeEnum.enumValues[3], // 'Other'
            status: applicationStatusEnum.enumValues[1], // 'Submitted'
            formData: validationResult.data,
            submittedAt: new Date(), updatedAt: new Date(),
        }).returning({ id: applications.id });

        return { success: true, message: 'Your application has been submitted successfully!', applicationId: newApplication.id };
    } catch (error) {
        console.error("Error submitting other application:", error);
        return { success: false, message: 'An error occurred.' };
    }
}

// --- Action to fetch beneficiary's applications --- 

interface GetApplicationsResult {
    success: boolean;
    applications: BeneficiaryApplication[];
    message?: string;
}

export async function getMyApplications(): Promise<GetApplicationsResult> {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();
    const isAuth = await isAuthenticated();

    if (!isAuth || !user) {
        return { success: false, applications: [], message: 'Not authenticated' };
    }

    try {
        // Get the beneficiary ID associated with the Kinde user
        const beneficiaryProfile = await db.query.beneficiaries.findFirst({
            where: eq(beneficiaries.kindeUserId, user.id),
            columns: { id: true }
        });

        if (!beneficiaryProfile) {
            // Return success:false but empty array if profile doesn't exist yet
            return { success: false, applications: [], message: 'Beneficiary profile not found.' };
        }

        // Fetch applications for this beneficiary, ordered by creation date descending
        const userApplications = await db.select({
                id: applications.id,
                applicationType: applications.applicationType,
                status: applications.status,
                submittedAt: applications.submittedAt,
                createdAt: applications.createdAt
            })
            .from(applications)
            .where(eq(applications.beneficiaryId, beneficiaryProfile.id))
            .orderBy(desc(applications.createdAt)); 
            
        return { success: true, applications: userApplications };

    } catch (error) {
        console.error("Error fetching applications:", error);
        return { success: false, applications: [], message: 'An error occurred while fetching applications.' };
    }
} 