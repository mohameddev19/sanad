import { z } from 'zod';
import type { conversations, messages } from '@/lib/db/schema';

// --- Types ---

export type ConversationListItem = Pick<typeof conversations.$inferSelect, 'id' | 'subject' | 'lastMessageAt'> & {
    otherParticipant: { id: number; name: string; kindeId: string; type: 'beneficiary' | 'caseworker' };
    // Add unread count later if needed
};

export type MessageItem = typeof messages.$inferSelect & {
    sender: { name: string; kindeId: string };
};

// Define a consistent Message type
export interface Message {
    id: number;
    conversationId: number;
    sender: {
        id: number;
        name: string;
        avatarUrl?: string;
    };
    content: string;
    createdAt: string; // ISO string format recommended
}

export interface ActionResult<T> {
    success: boolean;
    data?: T;
    message?: string;
}

// --- Schemas ---

export const sendMessageSchema = z.object({
  conversationId: z.number().int().positive(),
  content: z.string().min(1, { message: 'Message cannot be empty' }).max(5000) // Limit message length
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>; 