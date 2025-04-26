import { z } from 'zod';

// Zod schema for profile form validation
export const profileSchema = z.object({
    // kindeUserId is not part of the form, it comes from the session
    firstName: z.string().min(1, { message: 'First name is required' }).max(256),
    lastName: z.string().min(1, { message: 'Last name is required' }).max(256),
    phoneNumber: z.string().max(50).optional().nullable(), // Optional phone number
    address: z.string().optional().nullable(), // Optional address
    // status: We might not want users to change their own status?
});

export type ProfileFormInput = z.infer<typeof profileSchema>;

// Interface for the result of the updateProfile action
export interface UpdateProfileResult {
    success: boolean;
    message: string;
    errors?: z.ZodIssue[];
} 