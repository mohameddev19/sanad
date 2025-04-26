'use client';

import { Title, Container, Paper, TextInput, Textarea, Button, Stack, Alert, Group } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTopicSchema, createForumTopic } from '@/actions/forumActions';
import { useState, useTransition, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation'; 
import Link from 'next/link';
import { getProfileData } from '@/actions/profileActions'; // For profile check
import type { z } from 'zod';

type CreateTopicInput = z.infer<typeof createTopicSchema>;

export default function NewTopicPage({ params }: { params: { locale: string } }) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState(true); // Assume exists initially
  const [initialCheckError, setInitialCheckError] = useState<string | null>(null);
  const router = useRouter();

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset
  } = useForm<CreateTopicInput>({
    resolver: zodResolver(createTopicSchema),
    defaultValues: { title: '', content: '' }
  });

  // Check profile exists on mount
  useEffect(() => {
    async function checkProfile() {
        setInitialCheckError(null);
        setProfileExists(false);
        try {
            const { beneficiaryData, error } = await getProfileData();
            if (error === 'Not authenticated') {
                window.location.href = `/api/auth/login?post_login_redirect_url=/${params.locale}/forum/new`;
                return;
            }
            if (error) throw new Error(error);
            if (beneficiaryData) setProfileExists(true);
            else setInitialCheckError('Beneficiary profile not found.');
        } catch (err: any) { setInitialCheckError(err.message || "Failed to load profile status."); }
    }
    checkProfile();
  }, [params.locale]);

  const onSubmit = (data: CreateTopicInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createForumTopic(data);
      if (result.success && result.topicId) {
        notifications.show({ title: 'Success', message: result.message, color: 'green' });
        reset();
        router.push(`/${params.locale}/forum/topic/${result.topicId}`); // Redirect to the new topic
      } else {
        setServerError(result.message);
        notifications.show({ title: 'Error', message: result.message, color: 'red' });
      }
    });
  };

  // Handle loading/error states for profile check
  if (!profileExists) {
      return (
           <Container size="sm" py="xl">
                <Alert icon={<IconAlertCircle size="1rem" />} title="Cannot Create Topic" color="red">
                    {initialCheckError 
                        ? (initialCheckError === 'Beneficiary profile not found.' 
                            ? <>Please complete your <Link href={`/${params.locale}/profile`}>beneficiary profile</Link> first.</> 
                            : `Error: ${initialCheckError}`)
                        : 'Checking profile...' // Or a Loader component
                    }
                </Alert>
            </Container>
      );
  }

  return (
    <Container size="md" py="xl">
      <Title order={1} mb="xl">Create New Forum Topic</Title>
      <Paper shadow="sm" p="lg" radius="md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            {serverError && (
              <Alert icon={<IconAlertCircle size="1rem" />} title="Submission Error" color="red" mb="md">{serverError}</Alert>
            )}
            <TextInput label="Topic Title" placeholder="Enter a clear and concise title" {...register('title')} error={errors.title?.message} required />
            <Textarea label="Your Message" placeholder="Start the discussion..." {...register('content')} error={errors.content?.message} required minRows={5} />
            <Group justify="flex-end" mt="md">
                 <Button type="submit" loading={isPending}>Create Topic</Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
} 