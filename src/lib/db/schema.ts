import { pgTable, serial, text, varchar, timestamp, index, pgEnum, integer, jsonb, foreignKey, boolean } from 'drizzle-orm/pg-core';

// Enum for beneficiary status
export const beneficiaryStatusEnum = pgEnum('beneficiary_status', [
    'Martyr Family',
    'Wounded',
    'Prisoner Family',
    'Other' // Adding an 'Other' category might be useful
]);

export const beneficiaries = pgTable('beneficiaries', {
    id: serial('id').primaryKey(), // Auto-incrementing primary key
    kindeUserId: varchar('kinde_user_id').notNull().unique(), // Link to Kinde Auth user ID
    firstName: varchar('first_name', { length: 256 }).notNull(),
    lastName: varchar('last_name', { length: 256 }).notNull(),
    phoneNumber: varchar('phone_number', { length: 50 }), // Adjusted length
    address: text('address'), // Using text for potentially longer addresses
    status: beneficiaryStatusEnum('status').notNull(), // Use the enum for status
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
},
(table) => {
    return {
        // Add an index on kindeUserId for faster lookups
        kindeUserIdIdx: index('beneficiary_kinde_user_id_idx').on(table.kindeUserId),
    };
});

// --- Case Workers Table ---
// Basic table for case workers, can be expanded later
export const caseWorkers = pgTable('case_workers', {
    id: serial('id').primaryKey(),
    kindeUserId: varchar('kinde_user_id').notNull().unique(), // Link to Kinde Auth user ID
    firstName: varchar('first_name', { length: 256 }).notNull(),
    lastName: varchar('last_name', { length: 256 }).notNull(),
    // Add other relevant fields later, e.g., role, department
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
},
(table) => {
    return {
        kindeUserIdIdx: index('caseworker_kinde_user_id_idx').on(table.kindeUserId),
    };
});

// --- Applications Table --- 

export const applicationTypeEnum = pgEnum('application_type', [
    'Financial', 
    'Medical', 
    'Educational', 
    'Other'
]);

export const applicationStatusEnum = pgEnum('application_status', [
    'Draft',
    'Submitted',
    'Under Review',
    'Approved',
    'Rejected'
]);

export const applications = pgTable('applications', {
    id: serial('id').primaryKey(),
    beneficiaryId: integer('beneficiary_id').notNull().references(() => beneficiaries.id, { onDelete: 'cascade' }), // Foreign key to beneficiaries
    applicationType: applicationTypeEnum('application_type').notNull(),
    status: applicationStatusEnum('status').notNull().default('Draft'),
    formData: jsonb('form_data').notNull().default('{}'), // Store form-specific data
    submittedAt: timestamp('submitted_at', { withTimezone: true }), // Nullable until submitted
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
},
(table) => {
    return {
        // Index on beneficiaryId for faster lookup of user's applications
        beneficiaryIdIdx: index('application_beneficiary_id_idx').on(table.beneficiaryId),
        // Index on status for querying applications by status
        statusIdx: index('application_status_idx').on(table.status),
    };
});

// --- Forum Tables --- 

export const forumTopicStatusEnum = pgEnum('forum_topic_status', [
    'Open',
    'ClosedByAdmin', 
    'HiddenByAdmin'
]);

export const forumPostStatusEnum = pgEnum('forum_post_status', [
    'Visible',
    'HiddenByAdmin'
]);

export const forumTopics = pgTable('forum_topics', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    creatorBeneficiaryId: integer('creator_beneficiary_id').notNull().references(() => beneficiaries.id, { onDelete: 'cascade' }),
    status: forumTopicStatusEnum('status').notNull().default('Open'),
    postCount: integer('post_count').notNull().default(0), // Add post count column
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).defaultNow().notNull(), 
},
(table) => {
    return {
        creatorIdx: index('forum_topic_creator_idx').on(table.creatorBeneficiaryId),
        statusIdx: index('forum_topic_status_idx').on(table.status),
        lastActivityIdx: index('forum_topic_last_activity_idx').on(table.lastActivityAt), // Index for sorting
    };
});

export const forumPosts = pgTable('forum_posts', {
    id: serial('id').primaryKey(),
    topicId: integer('topic_id').notNull().references(() => forumTopics.id, { onDelete: 'cascade' }),
    creatorBeneficiaryId: integer('creator_beneficiary_id').notNull().references(() => beneficiaries.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    status: forumPostStatusEnum('status').notNull().default('Visible'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
},
(table) => {
    return {
        topicIdx: index('forum_post_topic_idx').on(table.topicId),
        creatorIdx: index('forum_post_creator_idx').on(table.creatorBeneficiaryId),
        statusIdx: index('forum_post_status_idx').on(table.status),
    };
});

// --- Direct Messaging Tables --- 

export const conversations = pgTable('conversations', {
    id: serial('id').primaryKey(),
    beneficiaryId: integer('beneficiary_id').notNull().references(() => beneficiaries.id, { onDelete: 'cascade' }),
    // Assuming a beneficiary talks to one specific caseworker per conversation for simplicity
    // More complex scenarios (multiple participants) would need a different structure (e.g., participants table)
    caseWorkerId: integer('case_worker_id').notNull().references(() => caseWorkers.id, { onDelete: 'cascade' }), 
    subject: varchar('subject', { length: 255 }), // Optional subject
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(), // When convo record updated
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }).defaultNow().notNull(), // For sorting conversations
},
(table) => {
    return {
        beneficiaryIdx: index('convo_beneficiary_idx').on(table.beneficiaryId),
        caseWorkerIdx: index('convo_caseworker_idx').on(table.caseWorkerId),
        lastMessageIdx: index('convo_last_message_idx').on(table.lastMessageAt),
    };
});

export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    conversationId: integer('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
    // Store Kinde ID of sender directly for easier checking
    senderKindeUserId: varchar('sender_kinde_user_id', { length: 255 }).notNull(), 
    // We could infer recipient from conversation, but storing explicitly might be useful?
    // Let's keep it simple for now and infer recipient from conversation participants.
    content: text('content').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
    isRead: boolean('is_read').notNull().default(false), // Basic read status
    // readAt: timestamp('read_at', { withTimezone: true }), // Optional: timestamp when read
},
(table) => {
    return {
        conversationIdx: index('message_conversation_idx').on(table.conversationId),
        senderIdx: index('message_sender_idx').on(table.senderKindeUserId),
        sentAtIdx: index('message_sent_at_idx').on(table.sentAt),
    };
});

// --- Information Portal Content ---

// Enum for benefit categories (can be expanded)
export const benefitCategoryEnum = pgEnum('benefit_category', [
    'Financial',
    'Medical',
    'Educational',
    'Psychological',
    'Vocational',
    'Other'
]);

// Table for Benefits Information
export const informationBenefits = pgTable('information_benefits', {
    id: serial('id').primaryKey(),
    language: varchar('language', { length: 10 }).notNull().default('en'), // To support i18n
    category: benefitCategoryEnum('category').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(), // Unique slug for linking/identification
    description: text('description').notNull(),
    eligibility: text('eligibility').notNull(),
    applicationProcess: text('application_process').notNull(),
    isActive: boolean('is_active').notNull().default(true), // To easily enable/disable benefits
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
},
(table) => {
    return {
        // Index on slug and language for efficient lookup
        slugLangIdx: index('benefit_slug_lang_idx').on(table.slug, table.language),
        categoryLangIdx: index('benefit_category_lang_idx').on(table.category, table.language),
    };
});

// Table for Frequently Asked Questions (FAQs)
export const informationFaqs = pgTable('information_faqs', {
    id: serial('id').primaryKey(),
    language: varchar('language', { length: 10 }).notNull().default('en'), // To support i18n
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    category: varchar('category', { length: 100 }).default('General'), // Optional category for grouping FAQs
    sortOrder: integer('sort_order').default(0), // For controlling display order
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
},
(table) => {
    return {
        // Index on language and category for efficient lookup
        faqLangCategoryIdx: index('faq_lang_category_idx').on(table.language, table.category),
    };
});

// --- End Information Portal Content ---

// Remove the placeholder export if it exists
// export {}; 