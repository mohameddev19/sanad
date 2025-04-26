import { z } from 'zod';

export const createTopicSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters' }).max(255),
  content: z.string().min(10, { message: 'Content must be at least 10 characters' })
});
export type CreateTopicInput = z.infer<typeof createTopicSchema>;

export const createPostSchema = z.object({
  topicId: z.number().int().positive(),
  content: z.string().min(1, { message: 'Post cannot be empty' })
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

// --- Data Transfer Object types (for server action return values) ---

import type { beneficiaries, forumTopics, forumPosts } from '@/lib/db/schema';

// Basic topic info for list view
export type ForumTopicListItem = Pick<typeof forumTopics.$inferSelect, 'id' | 'title' | 'status' | 'createdAt' | 'lastActivityAt'> & {
    creatorName: string;
    postCount: number;
};

// Detailed topic view including posts
export type ForumTopicDetail = typeof forumTopics.$inferSelect & {
    creator: Pick<typeof beneficiaries.$inferSelect, 'id' | 'firstName' | 'lastName'>;
    posts: (typeof forumPosts.$inferSelect & {
        creator: Pick<typeof beneficiaries.$inferSelect, 'id' | 'firstName' | 'lastName'>;
    })[];
}; 