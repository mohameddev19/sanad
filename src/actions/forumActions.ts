'use server';

import { z } from 'zod';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from '@/lib/db';
import { beneficiaries, forumTopics, forumPosts, forumTopicStatusEnum, forumPostStatusEnum } from '@/lib/db/schema';
import { eq, desc, and, count, sql, or, ne, not } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { SQL, AnyColumn } from 'drizzle-orm';
import { 
    createTopicSchema, 
    type CreateTopicInput, 
    createPostSchema, 
    type CreatePostInput, 
    type ForumTopicListItem,
    type ForumTopicDetail
} from '@/lib/schemas/forumSchemas';

// --- Types --- 
// Types moved to @/lib/schemas/forumSchemas.ts

// --- Fetch Actions --- 

export async function getForumTopics(): Promise<{ success: boolean; topics: ForumTopicListItem[], message?: string }> {
     const { isAuthenticated, getPermissions } = getKindeServerSession();
     const isAuth = await isAuthenticated();
     if (!isAuth) return { success: false, topics: [], message: 'Not authenticated' };
     
     const permissions = await getPermissions();
     const isAdmin = permissions?.permissions?.includes('access:admin_panel');

    try {
        const topicsData = await db.select({
                id: forumTopics.id,
                title: forumTopics.title,
                status: forumTopics.status,
                createdAt: forumTopics.createdAt,
                lastActivityAt: forumTopics.lastActivityAt,
                creatorName: sql<string>`COALESCE(${beneficiaries.firstName}, 'Unknown User')`.as('creator_name'),
                postCount: forumTopics.postCount 
            })
            .from(forumTopics)
            .leftJoin(beneficiaries, eq(forumTopics.creatorBeneficiaryId, beneficiaries.id))
            // Filter based on admin status
            .where(isAdmin 
                ? undefined // Admins see all
                : eq(forumTopics.status, forumTopicStatusEnum.enumValues[0]) // Non-admins only see 'Open'
            )
            .orderBy(desc(forumTopics.lastActivityAt));
            
        const typedTopics = topicsData as ForumTopicListItem[];
        return { success: true, topics: typedTopics };

    } catch (error) {
        console.error("Error fetching forum topics:", error);
        return { success: false, topics: [], message: 'An error occurred.' };
    }
}

export async function getForumTopicDetails(topicId: number): Promise<{ success: boolean; topic: ForumTopicDetail | null, message?: string }> {
    const { isAuthenticated, getPermissions } = getKindeServerSession();
    const isAuth = await isAuthenticated();
    if (!isAuth) return { success: false, topic: null, message: 'Not authenticated' };

    const permissions = await getPermissions();
    const isAdmin = permissions?.permissions?.includes('access:admin_panel');

    try {
        // Base condition: topic ID must match
        const baseCondition = eq(forumTopics.id, topicId);
        // Filter condition: Allow admins to see all, others only 'Open'
        const statusCondition = isAdmin 
            ? undefined // Admin sees all statuses
            : eq(forumTopics.status, forumTopicStatusEnum.enumValues[0]); // Non-admin sees only Open

        const finalCondition = statusCondition ? and(baseCondition, statusCondition) : baseCondition;

        const topic = await db.query.forumTopics.findFirst({
            where: finalCondition,
            with: {
                creator: { columns: { id: true, firstName: true, lastName: true } },
                posts: {
                     // Filter posts based on admin status
                     where: isAdmin
                         ? undefined // Admin sees all posts
                         : eq(forumPosts.status, forumPostStatusEnum.enumValues[0]), // Non-admin sees only Visible
                     orderBy: (posts: typeof forumPosts, { asc }: { asc: (column: SQL | AnyColumn) => SQL }) => [asc(posts.createdAt)],
                     with: { creator: { columns: { id: true, firstName: true, lastName: true } } }
                }
            }
        });
        
        if (!topic) {
            return { success: false, topic: null, message: 'Topic not found or access denied.' };
        }

        return { success: true, topic };

    } catch (error) {
        console.error("Error fetching topic details:", error);
        return { success: false, topic: null, message: 'An error occurred.' };
    }
}

// --- Create Actions --- 

export async function createForumTopic(formData: CreateTopicInput): Promise<{ success: boolean; topicId?: number; message: string; errors?: z.ZodIssue[] }> {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();
    const isAuth = await isAuthenticated();
    if (!isAuth || !user) return { success: false, message: 'Not authenticated' };

    const validationResult = createTopicSchema.safeParse(formData);
    if (!validationResult.success) return { success: false, message: 'Validation failed', errors: validationResult.error.errors };

    const { title, content } = validationResult.data;

    try {
        const beneficiaryProfile = await db.query.beneficiaries.findFirst({ where: eq(beneficiaries.kindeUserId, user.id), columns: { id: true } });
        if (!beneficiaryProfile) return { success: false, message: 'Beneficiary profile not found.' };

        const result = await db.transaction(async (tx) => {
            const [newTopic] = await tx.insert(forumTopics).values({
                title: title,
                creatorBeneficiaryId: beneficiaryProfile.id,
                postCount: 1, // Initialize post count to 1 for the initial post
                updatedAt: new Date(),
                lastActivityAt: new Date(), 
            }).returning({ id: forumTopics.id });

            await tx.insert(forumPosts).values({
                topicId: newTopic.id,
                creatorBeneficiaryId: beneficiaryProfile.id,
                content: content, 
                updatedAt: new Date(),
            });
            return newTopic.id;
        });

        revalidatePath('/[locale]/forum');
        return { success: true, message: 'Topic created successfully!', topicId: result };

    } catch (error) {
        console.error("Error creating topic:", error);
        return { success: false, message: 'An error occurred.' };
    }
}

export async function createForumPost(formData: CreatePostInput): Promise<{ success: boolean; postId?: number; message: string; errors?: z.ZodIssue[] }> {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();
    const isAuth = await isAuthenticated();
    if (!isAuth || !user) return { success: false, message: 'Not authenticated' };

    const validationResult = createPostSchema.safeParse(formData);
    if (!validationResult.success) return { success: false, message: 'Validation failed', errors: validationResult.error.errors };

    const { topicId, content } = validationResult.data;

    try {
        const beneficiaryProfile = await db.query.beneficiaries.findFirst({ where: eq(beneficiaries.kindeUserId, user.id), columns: { id: true } });
        if (!beneficiaryProfile) return { success: false, message: 'Beneficiary profile not found.' };
        
        const topic = await db.query.forumTopics.findFirst({ where: eq(forumTopics.id, topicId), columns: {id: true, status: true}});
        if (!topic || topic.status !== 'Open') {
            return { success: false, message: 'Topic not found or is closed.' };
        }

         const [newPost] = await db.transaction(async (tx) => {
             const [insertedPost] = await tx.insert(forumPosts).values({
                topicId: topicId,
                creatorBeneficiaryId: beneficiaryProfile.id,
                content: content,
                updatedAt: new Date(),
            }).returning({ id: forumPosts.id });

            // Update topic last activity AND increment post count using sql
            await tx.update(forumTopics)
                .set({ 
                    lastActivityAt: new Date(),
                    // Use sql`` helper for incrementing
                    postCount: sql`${forumTopics.postCount} + 1` 
                 })
                .where(eq(forumTopics.id, topicId));

             return [insertedPost];
         });

        revalidatePath(`/[locale]/forum/topic/${topicId}`);
        return { success: true, message: 'Reply posted successfully!', postId: newPost.id };

    } catch (error) {
        console.error("Error creating post:", error);
        return { success: false, message: 'An error occurred.' };
    }
}

// --- Moderation Actions (Admin Only) ---

async function checkAdminAuth(): Promise<{ isAdmin: boolean; message?: string }> {
    const { getUser, isAuthenticated, getPermissions } = getKindeServerSession();
    const user = await getUser();
    const isAuth = await isAuthenticated();
    if (!isAuth || !user) return { isAdmin: false, message: 'Not authenticated' };

    // Check permissions (adjust permission name as needed)
    const permissions = await getPermissions();
    const isAdmin = permissions?.permissions?.includes('access:admin_panel');
    if (!isAdmin) return { isAdmin: false, message: 'Permission denied' };

    return { isAdmin: true };
}

export async function hideTopic(topicId: number): Promise<{ success: boolean; message: string; }> {
    const authCheck = await checkAdminAuth();
    if (!authCheck.isAdmin) return { success: false, message: authCheck.message || 'Permission denied' };

    try {
        await db.update(forumTopics)
            .set({ status: forumTopicStatusEnum.enumValues[2] }) // 'HiddenByAdmin'
            .where(eq(forumTopics.id, topicId));
        revalidatePath('/[locale]/forum');
        revalidatePath(`/[locale]/forum/topic/${topicId}`);
        return { success: true, message: 'Topic hidden.' };
    } catch (error) { return { success: false, message: 'Database error.' }; }
}

export async function showTopic(topicId: number): Promise<{ success: boolean; message: string; }> {
    const authCheck = await checkAdminAuth();
    if (!authCheck.isAdmin) return { success: false, message: authCheck.message || 'Permission denied' };

    try {
        await db.update(forumTopics)
            .set({ status: forumTopicStatusEnum.enumValues[0] }) // 'Open'
            .where(eq(forumTopics.id, topicId));
        revalidatePath('/[locale]/forum');
        revalidatePath(`/[locale]/forum/topic/${topicId}`);
        return { success: true, message: 'Topic shown.' };
    } catch (error) { return { success: false, message: 'Database error.' }; }
}

export async function closeTopic(topicId: number): Promise<{ success: boolean; message: string; }> {
     const authCheck = await checkAdminAuth();
    if (!authCheck.isAdmin) return { success: false, message: authCheck.message || 'Permission denied' };
    
    try {
        await db.update(forumTopics)
            .set({ status: forumTopicStatusEnum.enumValues[1] }) // 'ClosedByAdmin'
            .where(eq(forumTopics.id, topicId));
        revalidatePath('/[locale]/forum');
        revalidatePath(`/[locale]/forum/topic/${topicId}`);
        return { success: true, message: 'Topic closed.' };
    } catch (error) { return { success: false, message: 'Database error.' }; }
}

export async function reopenTopic(topicId: number): Promise<{ success: boolean; message: string; }> {
     const authCheck = await checkAdminAuth();
    if (!authCheck.isAdmin) return { success: false, message: authCheck.message || 'Permission denied' };

    try {
        await db.update(forumTopics)
            .set({ status: forumTopicStatusEnum.enumValues[0] }) // 'Open'
            .where(eq(forumTopics.id, topicId));
        revalidatePath('/[locale]/forum');
        revalidatePath(`/[locale]/forum/topic/${topicId}`);
        return { success: true, message: 'Topic reopened.' };
    } catch (error) { return { success: false, message: 'Database error.' }; }
}

export async function hidePost(postId: number): Promise<{ success: boolean; message: string; }> {
    const authCheck = await checkAdminAuth();
    if (!authCheck.isAdmin) return { success: false, message: authCheck.message || 'Permission denied' };

    try {
        // Need topicId for revalidation
        const post = await db.query.forumPosts.findFirst({ where: eq(forumPosts.id, postId), columns: { topicId: true } });
        if (!post) return { success: false, message: 'Post not found.' };

        await db.update(forumPosts)
            .set({ status: forumPostStatusEnum.enumValues[1] }) // 'HiddenByAdmin'
            .where(eq(forumPosts.id, postId));
        
        revalidatePath(`/[locale]/forum/topic/${post.topicId}`);
        return { success: true, message: 'Post hidden.' };
    } catch (error) { return { success: false, message: 'Database error.' }; }
}

export async function showPost(postId: number): Promise<{ success: boolean; message: string; }> {
    const authCheck = await checkAdminAuth();
    if (!authCheck.isAdmin) return { success: false, message: authCheck.message || 'Permission denied' };

    try {
         const post = await db.query.forumPosts.findFirst({ where: eq(forumPosts.id, postId), columns: { topicId: true } });
        if (!post) return { success: false, message: 'Post not found.' };

        await db.update(forumPosts)
            .set({ status: forumPostStatusEnum.enumValues[0] }) // 'Visible'
            .where(eq(forumPosts.id, postId));
        
        revalidatePath(`/[locale]/forum/topic/${post.topicId}`);
        return { success: true, message: 'Post shown.' };
    } catch (error) { return { success: false, message: 'Database error.' }; }
} 