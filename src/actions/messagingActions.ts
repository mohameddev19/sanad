'use server';

import { z } from 'zod';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from '@/lib/db';
import { beneficiaries, caseWorkers, conversations, messages } from '@/lib/db/schema';
import { eq, desc, or, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { SQL, AnyColumn } from 'drizzle-orm';
import type {
    ConversationListItem,
    MessageItem,
    Message,
    ActionResult,
    SendMessageInput
} from '@/lib/schemas/messagingTypes';
import { sendMessageSchema } from '@/lib/schemas/messagingTypes';

// NOTE: This file uses mock data and simulated logic. 
// Replace with actual database interactions (e.g., using Drizzle ORM)
// and proper user authentication/authorization checks.

// Placeholder for retrieving the current user's ID
// In a real app, this would come from the authentication context (e.g., Kinde)
const getCurrentUserId = (): number => {
    // Simulate returning a logged-in user ID
    return 99; // Example user ID
};

// --- Types --- 

// --- Mock Data Store --- 
// Simulate a simple in-memory store for messages
let mockMessages: Message[] = [
    { id: 1, conversationId: 1, sender: { id: 1, name: 'Alice' }, content: 'Hi Bob!', createdAt: new Date(Date.now() - 60000 * 5).toISOString() },
    { id: 2, conversationId: 1, sender: { id: 2, name: 'Bob' }, content: 'Hello Alice! How are you?', createdAt: new Date(Date.now() - 60000 * 4).toISOString() },
    { id: 3, conversationId: 1, sender: { id: 1, name: 'Alice' }, content: 'Doing well, thanks! Just working on the project.', createdAt: new Date(Date.now() - 60000 * 3).toISOString() },
    { id: 4, conversationId: 2, sender: { id: 3, name: 'Charlie' }, content: 'Meeting reminder for tomorrow.', createdAt: new Date(Date.now() - 60000 * 10).toISOString() },
];

let nextMessageId = 5;

// --- Helper to get user type --- 
async function getCurrentUserType(userId: string): Promise<{ type: 'beneficiary' | 'caseworker' | 'unknown', profileId: number | null }> {
    const beneficiary = await db.query.beneficiaries.findFirst({ where: eq(beneficiaries.kindeUserId, userId), columns: { id: true } });
    if (beneficiary) return { type: 'beneficiary', profileId: beneficiary.id };
    const caseworker = await db.query.caseWorkers.findFirst({ where: eq(caseWorkers.kindeUserId, userId), columns: { id: true } });
    if (caseworker) return { type: 'caseworker', profileId: caseworker.id };
    return { type: 'unknown', profileId: null };
}

// --- Fetch Actions --- 

export async function getConversations(): Promise<{ success: boolean; conversations: ConversationListItem[], message?: string }> {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();
    if (!user || !(await isAuthenticated())) return { success: false, conversations: [], message: 'Not authenticated' };

    const { type, profileId } = await getCurrentUserType(user.id);
    if (type === 'unknown' || !profileId) return { success: false, conversations: [], message: 'User profile not found' };

    try {
        // Use db.select with manual joins to avoid potential type issues with db.query
        const results = await db.select({
                convoId: conversations.id,
                subject: conversations.subject,
                lastMessageAt: conversations.lastMessageAt,
                beneficiaryId: beneficiaries.id,
                beneficiaryFirstName: beneficiaries.firstName,
                beneficiaryLastName: beneficiaries.lastName,
                beneficiaryKindeId: beneficiaries.kindeUserId,
                caseWorkerId: caseWorkers.id,
                caseWorkerFirstName: caseWorkers.firstName,
                caseWorkerLastName: caseWorkers.lastName,
                caseWorkerKindeId: caseWorkers.kindeUserId,
            })
            .from(conversations)
            .leftJoin(beneficiaries, eq(conversations.beneficiaryId, beneficiaries.id))
            .leftJoin(caseWorkers, eq(conversations.caseWorkerId, caseWorkers.id))
            .where(type === 'beneficiary' 
                ? eq(conversations.beneficiaryId, profileId) 
                : eq(conversations.caseWorkerId, profileId)
            )
            .orderBy(desc(conversations.lastMessageAt));

        const formattedConversations = results.map(convo => {
            const otherParticipant = type === 'beneficiary' 
                ? { id: convo.caseWorkerId!, name: `${convo.caseWorkerFirstName} ${convo.caseWorkerLastName}`, kindeId: convo.caseWorkerKindeId!, type: 'caseworker' as const }
                : { id: convo.beneficiaryId!, name: `${convo.beneficiaryFirstName} ${convo.beneficiaryLastName}`, kindeId: convo.beneficiaryKindeId!, type: 'beneficiary' as const }; 
            return {
                id: convo.convoId,
                subject: convo.subject,
                lastMessageAt: convo.lastMessageAt,
                otherParticipant: otherParticipant
            };
        });

        return { success: true, conversations: formattedConversations };
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return { success: false, conversations: [], message: 'Database error' };
    }
}

export async function getConversationMessages(conversationId: number): Promise<{ success: boolean; messages: MessageItem[], otherParticipantName?: string, message?: string }> {
     const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();
    if (!user || !(await isAuthenticated())) return { success: false, messages: [], message: 'Not authenticated' };

    const { type, profileId } = await getCurrentUserType(user.id);
    if (type === 'unknown' || !profileId) return { success: false, messages: [], message: 'User profile not found' };

    try {
        // 1. Verify user is part of this conversation & get participant IDs
        const conversation = await db.query.conversations.findFirst({
            where: and(
                eq(conversations.id, conversationId),
                type === 'beneficiary' ? eq(conversations.beneficiaryId, profileId) : eq(conversations.caseWorkerId, profileId)
            ),
            columns: { // Select only necessary IDs
                id: true,
                beneficiaryId: true,
                caseWorkerId: true
            }
            // Removed 'with' clause to simplify type inference
        });

        if (!conversation) return { success: false, messages: [], message: 'Conversation not found or access denied.' };

        // 2. Determine other participant's ID and type
        const otherParticipant = type === 'beneficiary'
            ? { type: 'caseworker' as const, id: conversation.caseWorkerId }
            : { type: 'beneficiary' as const, id: conversation.beneficiaryId };

        // 3. Fetch other participant's name separately
        let otherParticipantName = 'Unknown User';
        if (otherParticipant.id) { // Check if ID exists before querying
             if (otherParticipant.type === 'caseworker') {
                 const cw = await db.query.caseWorkers.findFirst({
                     where: eq(caseWorkers.id, otherParticipant.id),
                     columns: { firstName: true, lastName: true }
                 });
                 // Use optional chaining and nullish coalescing for safety
                 if (cw) otherParticipantName = `${cw.firstName ?? ''} ${cw.lastName ?? ''}`.trim();
             } else {
                 const ben = await db.query.beneficiaries.findFirst({
                     where: eq(beneficiaries.id, otherParticipant.id),
                     columns: { firstName: true, lastName: true }
                 });
                 // Use optional chaining and nullish coalescing for safety
                 if (ben) otherParticipantName = `${ben.firstName ?? ''} ${ben.lastName ?? ''}`.trim();
             }
        }
        // Ensure a default name if the fetched name is empty or query failed
        if (!otherParticipantName) otherParticipantName = 'Unknown User';


        // 4. Fetch messages for the conversation
        const messagesData = await db.query.messages.findMany({
            where: eq(messages.conversationId, conversationId),
            orderBy: messages.sentAt,
            // Select necessary fields directly
            columns: {
                id: true,
                conversationId: true,
                senderKindeUserId: true,
                content: true,
                sentAt: true,
                isRead: true
            }
        });

        // 5. Map sender names (existing logic)
        const formattedMessages = await Promise.all(messagesData.map(async (msg) => {
            let senderName = 'Unknown User';
            // This part might also benefit from optimization later, but keep for now
            const senderBeneficiary = await db.query.beneficiaries.findFirst({ where: eq(beneficiaries.kindeUserId, msg.senderKindeUserId), columns: { firstName: true } });
            if (senderBeneficiary) senderName = senderBeneficiary.firstName ?? senderName;
            else {
                const senderCaseworker = await db.query.caseWorkers.findFirst({ where: eq(caseWorkers.kindeUserId, msg.senderKindeUserId), columns: { firstName: true } });
                if (senderCaseworker) senderName = senderCaseworker.firstName ?? senderName;
            }
            return {
                ...msg,
                sender: { name: senderName, kindeId: msg.senderKindeUserId }
            };
        }));

        // TODO: Mark messages as read

        return { success: true, messages: formattedMessages, otherParticipantName };

    } catch (error) {
         console.error("Error fetching messages:", error);
         return { success: false, messages: [], message: 'Database error' };
     }
}

// --- Send Message Action --- 

export async function sendMessage(formData: SendMessageInput): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[] }> {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();
    if (!user || !(await isAuthenticated())) return { success: false, message: 'Not authenticated' };

    const { type, profileId } = await getCurrentUserType(user.id);
    if (type === 'unknown' || !profileId) return { success: false, message: 'User profile not found' };

    const validationResult = sendMessageSchema.safeParse(formData);
    if (!validationResult.success) return { success: false, message: 'Validation failed', errors: validationResult.error.errors };

    const { conversationId, content } = validationResult.data;

    try {
         // Verify user is part of this conversation before allowing send
         const conversation = await db.query.conversations.findFirst({
            where: and(
                eq(conversations.id, conversationId),
                type === 'beneficiary' 
                    ? eq(conversations.beneficiaryId, profileId) 
                    : eq(conversations.caseWorkerId, profileId)
            ),
            columns: { id: true } // Only need ID
        });

        if (!conversation) {
            return { success: false, message: 'Conversation not found or access denied.' };
        }

        // Use transaction to insert message and update conversation's last message time
        await db.transaction(async (tx) => {
            await tx.insert(messages).values({
                conversationId: conversationId,
                senderKindeUserId: user.id,
                content: content,
                sentAt: new Date(),
                isRead: false, // New messages start as unread
            });

            await tx.update(conversations)
                .set({ lastMessageAt: new Date() })
                .where(eq(conversations.id, conversationId));
        });

        // Revalidate the path for the specific conversation
        revalidatePath(`/[locale]/messaging/${conversationId}`);
        revalidatePath(`/[locale]/messaging`); // Also revalidate list view

        return { success: true, message: 'Message sent.' };

    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, message: 'Failed to send message due to a server error.' };
    }
}

// --- Server Actions --- 

/**
 * Fetches messages for a specific conversation.
 * TODO: Implement actual database query and user authorization.
 */
export async function getMessages(conversationId: number): Promise<ActionResult<Message[]>> {
    console.log(`Server Action: getMessages called for conversation ${conversationId}`);
    // TODO: Add authentication check: Ensure the current user is part of this conversation.
    // const currentUserId = getCurrentUserId(); 
    // const isUserInConversation = checkUserConversationAccess(currentUserId, conversationId);
    // if (!isUserInConversation) {
    //    return { success: false, message: 'Unauthorized access.' };
    // }

    try {
        // Simulate database fetch
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
        const messagesForConversation = mockMessages.filter(msg => msg.conversationId === conversationId);
        
        return {
            success: true,
            data: messagesForConversation,
        };
    } catch (error) {
        console.error("Error in getMessages:", error);
        return { success: false, message: 'Failed to fetch messages.' };
    }
}

// Helper placeholder functions (replace with real logic)
// async function checkUserConversationAccess(userId: number, conversationId: number): Promise<boolean> {
//     // Query database to see if userId is a participant in conversationId
//     console.log(`Checking if user ${userId} can access conversation ${conversationId}`);
//     return true; // Assume access for now
// }

// async function checkUserCanSendMessage(userId: number, conversationId: number): Promise<boolean> {
//     // Query database/rules to see if userId can send messages to conversationId
//     console.log(`Checking if user ${userId} can send to conversation ${conversationId}`);
//     return true; // Assume allowed for now
// } 