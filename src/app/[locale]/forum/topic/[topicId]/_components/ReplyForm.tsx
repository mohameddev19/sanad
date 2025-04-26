'use client';

import { Paper, Textarea, Button, Stack, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPostSchema, createForumPost } from '@/actions/forumActions';
import { useState, useTransition } from 'react';
import { notifications } from '@mantine/notifications';
import type { z } from 'zod';

type CreatePostInput = z.infer<typeof createPostSchema>;

interface ReplyFormProps {
    topicId: number;
    locale: string; // Needed for potential redirects or profile checks
}

export default function ReplyForm({ topicId, locale }: ReplyFormProps) {
    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);
    // TODO: Add profile check if needed, similar to New Topic form

    const { 
        register, 
        handleSubmit, 
        formState: { errors },
        reset
      } = useForm<CreatePostInput>({
        resolver: zodResolver(createPostSchema),
        defaultValues: { topicId: topicId, content: '' }
      });

    const onSubmit = (data: CreatePostInput) => {
        setServerError(null);
        startTransition(async () => {
          const result = await createForumPost(data);
          if (result.success) {
            notifications.show({ title: 'Success', message: result.message, color: 'green' });
            reset(); // Clear the form after successful post
            // Revalidation should refresh the posts list on the parent Server Component
          } else {
            setServerError(result.message);
            notifications.show({ title: 'Error', message: result.message, color: 'red' });
          }
        });
      };
    
    return (
        <Paper shadow="sm" p="lg" radius="md" withBorder>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Stack>
                {serverError && (
                    <Alert icon={<IconAlertCircle size="1rem" />} title="Error Posting Reply" color="red" mb="md">{serverError}</Alert>
                )}
                <Textarea 
                    placeholder="Write your reply..."
                    {...register('content')}
                    error={errors.content?.message}
                    required 
                    minRows={4}
                />
                {/* Hidden input for topicId (already in defaultValues) */}
                {/* <input type="hidden" {...register('topicId')} /> */}
                <Button type="submit" loading={isPending} mt="sm" style={{ alignSelf: 'flex-end' }}>
                    Post Reply
                </Button>
                </Stack>
            </form>
      </Paper>
    );
} 