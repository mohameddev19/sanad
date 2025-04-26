import { z } from 'zod';
import type { applications } from '@/lib/db/schema'; // Import the type for inferSelect

// Zod schema for Financial Assistance form validation
export const financialAssistanceSchema = z.object({
    reason: z.string().min(10, { message: 'Please provide a brief reason for your request (min 10 chars)' }).max(500),
    amountRequested: z.number({ invalid_type_error: 'Please enter a valid amount'}).positive({ message: 'Amount must be positive'}),
    additionalInfo: z.string().max(1000).optional(),
});

export type FinancialAssistanceInput = z.infer<typeof financialAssistanceSchema>;

// --- Medical Assistance --- 

export const medicalAssistanceSchema = z.object({
    condition: z.string().min(5, { message: 'Please describe the medical condition (min 5 chars)' }).max(500),
    treatmentRequired: z.string().min(5, { message: 'Please describe the required treatment (min 5 chars)' }).max(1000),
    estimatedCost: z.number({ invalid_type_error: 'Please enter a valid amount'}).positive({ message: 'Cost must be positive'}).optional().nullable(),
    hospitalClinicName: z.string().max(200).optional().nullable(),
    additionalInfo: z.string().max(1000).optional(),
});

export type MedicalAssistanceInput = z.infer<typeof medicalAssistanceSchema>;

// --- Educational Assistance --- 

export const educationalAssistanceSchema = z.object({
    studentName: z.string().min(1).max(256),
    schoolOrInstitution: z.string().min(1).max(256),
    gradeOrLevel: z.string().min(1).max(100),
    assistanceNeeded: z.string().min(10, { message: 'Describe the assistance needed (min 10 chars)' }).max(1000), // e.g., tuition, books, uniform
    estimatedCost: z.number({ invalid_type_error: 'Please enter a valid amount'}).positive({ message: 'Cost must be positive'}).optional().nullable(),
    additionalInfo: z.string().max(1000).optional(),
});

export type EducationalAssistanceInput = z.infer<typeof educationalAssistanceSchema>;

// --- Other Assistance --- 

export const otherAssistanceSchema = z.object({
    requestType: z.string().min(3, {message: 'Please specify the type of request'}).max(100),
    description: z.string().min(10, { message: 'Please describe your request in detail (min 10 chars)' }).max(2000),
    estimatedCost: z.number({ invalid_type_error: 'Please enter a valid amount'}).positive({ message: 'Cost must be positive'}).optional().nullable(),
    additionalInfo: z.string().max(1000).optional(),
});

export type OtherAssistanceInput = z.infer<typeof otherAssistanceSchema>;

// --- Type for listing applications ---

// Define the type for the application data we want to return for lists
// We pick specific fields from the auto-generated Drizzle type
export type BeneficiaryApplication = Pick<
    typeof applications.$inferSelect, 
    'id' | 'applicationType' | 'status' | 'submittedAt' | 'createdAt'
>; 