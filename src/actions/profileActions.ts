'use server';

import { z } from 'zod';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from '@/lib/db';
import { beneficiaries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { profileSchema, type ProfileFormInput, type UpdateProfileResult } from '@/lib/schemas/profileSchema'; // Import schema, input type, and result type

export async function updateProfile(formData: ProfileFormInput): Promise<UpdateProfileResult> {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();
    const isAuth = await isAuthenticated();

    if (!isAuth || !user) {
        return { success: false, message: 'Not authenticated' };
    }

    // Validate form data
    const validationResult = profileSchema.safeParse(formData);
    if (!validationResult.success) {
        return {
            success: false,
            message: 'Validation failed',
            errors: validationResult.error.errors,
        };
    }

    const { firstName, lastName, phoneNumber, address } = validationResult.data;

    try {
        // Check if beneficiary record exists for this user
        const existingProfile = await db.query.beneficiaries.findFirst({
            where: eq(beneficiaries.kindeUserId, user.id),
            columns: { id: true } // Only need ID to confirm existence
        });

        if (!existingProfile) {
            return { success: false, message: 'Beneficiary profile not found.' };
        }

        // Update the beneficiary record
        await db.update(beneficiaries)
            .set({
                firstName: firstName,
                lastName: lastName,
                phoneNumber: phoneNumber,
                address: address,
                updatedAt: new Date(), // Update the timestamp
            })
            .where(eq(beneficiaries.kindeUserId, user.id));

        // Revalidate the profile page path to show updated data
        // Assuming default locale 'en' for now, ideally pass locale
        revalidatePath('/en/profile'); // Adjust locale/path as needed
        revalidatePath('/ar/profile'); 

        return { success: true, message: 'Profile updated successfully!' };

    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, message: 'An error occurred while updating the profile.' };
    }
}

// --- Server Action to fetch profile data --- 
export async function getProfileData() {
  const { getUser, isAuthenticated } = getKindeServerSession();
  const user = await getUser();
  const isAuth = await isAuthenticated();

  if (!isAuth || !user) {
    // Return structure indicates authentication failure
    return { kindeUser: null, beneficiaryData: null, error: 'Not authenticated' };
  }

  try {
    // Fetch beneficiary data linked to the Kinde User ID
    const beneficiaryData = await db.query.beneficiaries.findFirst({
      where: eq(beneficiaries.kindeUserId, user.id),
    });
    // Return Kinde user and beneficiary data (which might be null if profile doesn't exist yet)
    return { kindeUser: user, beneficiaryData, error: null };
  } catch (error) {
    console.error("Database error fetching beneficiary data:", error);
    // Return Kinde user but indicate a database error occurred
    return { kindeUser: user, beneficiaryData: null, error: 'Database error' };
  }
} 

// --- Server Action to create profile for a new user ---
export async function createProfileForNewUser() {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();
    const isAuth = await isAuthenticated();

    if (!isAuth || !user || !user.email) { // Ensure email exists
        // Cannot create profile without essential info like email
        return { success: false, message: 'Not authenticated or missing user email.' };
    }

    try {
        // 1. Check if a profile already exists to avoid duplicates
        const existingProfile = await db.query.beneficiaries.findFirst({
            where: eq(beneficiaries.kindeUserId, user.id),
            columns: { id: true }
        });

        if (existingProfile) {
            // Profile already exists, maybe logged in before callback completed?
            // Or edge case, just return success as the goal is met.
            return { success: true, message: 'Profile already exists.' };
        }

        // 2. Create the new beneficiary record
        await db.insert(beneficiaries).values({
            kindeUserId: user.id,
            firstName: user.given_name ?? '', // Use Kinde data, fallback to empty string
            lastName: user.family_name ?? '', // Use Kinde data, fallback to empty string
            status: 'Other', // Added: Set default status, adjust if needed based on beneficiaryStatusEnum
            // Set other fields to defaults or null as appropriate
            phoneNumber: null,
            address: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Revalidate relevant paths after creation if needed, though redirect might be enough
        // revalidatePath('/en/profile'); // Example if needed

        return { success: true, message: 'Profile created successfully.' };

    } catch (error) {
        console.error("Error creating profile for new user:", error);
        return { success: false, message: 'An error occurred while creating the profile.' };
    }
} 