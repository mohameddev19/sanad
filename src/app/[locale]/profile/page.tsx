'use client'; // Convert to Client Component for form handling

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from 'next/navigation';
import { Card, Text, Avatar, Title, Group, Alert, TextInput, Textarea, Button, Stack } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { db } from '@/lib/db';
import { beneficiaries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfile } from '@/actions/profileActions';
import { useState, useTransition, useEffect } from 'react';
import { notifications } from '@mantine/notifications'; // For showing success/error messages
import type { z } from 'zod';
import { profileSchema } from "@/lib/schemas/profileSchema";

type ProfileFormInput = z.infer<typeof profileSchema>;

// Need to fetch initial data outside the default export function for client components
// Option 1: Pass data as props from a Server Component wrapper (more complex)
// Option 2: Fetch data within useEffect (simpler for this case, but shows loading state)
// We'll use Option 2 for now.

export default function ProfilePage({ params }: { params: { locale: string } }) {
  const [beneficiaryData, setBeneficiaryData] = useState<typeof beneficiaries.$inferSelect | null>(null);
  const [kindeUser, setKindeUser] = useState<any>(null); // Store kinde user info
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset // To reset form after fetch
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileSchema),
  });

  // Fetch data on component mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // In client component, we might need an API route or server action to get session
        // For simplicity here, we assume session is available (might need adjustment)
        // A dedicated server action `getProfileData` would be cleaner.
        const sessionRes = await fetch('/api/session'); // Placeholder: Need an API route for session
        if (!sessionRes.ok) throw new Error('Failed to fetch session');
        const session = await sessionRes.json();

        if (!session.isAuthenticated || !session.user) {
          // Client-side redirect (consider flashing content)
          window.location.href = `/api/auth/login?post_login_redirect_url=/${params.locale}/profile`;
          return; 
        }
        setKindeUser(session.user);

        // Fetch beneficiary data - Requires another API route or server action
        const profileRes = await fetch('/api/beneficiary-profile'); // Placeholder
        if (!profileRes.ok) throw new Error('Failed to fetch profile data');
        const data = await profileRes.json();

        setBeneficiaryData(data);
        reset(data); // Pre-fill form with fetched data

      } catch (err: any) {
        console.error("Error fetching profile data:", err);
        setError(err.message || "Failed to load profile data.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [params.locale, reset]);

  const onSubmit = (data: ProfileFormInput) => {
    startTransition(async () => {
      const result = await updateProfile(data);
      if (result.success) {
        notifications.show({ title: 'Success', message: result.message, color: 'green' });
        // Optionally refetch data or update state optimistically
      } else {
        notifications.show({ 
          title: 'Error', 
          message: result.message + (result.errors ? ` (${result.errors[0]?.message})` : ''), 
          color: 'red' 
        });
      }
    });
  };

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Loading profile...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
         <Alert icon={<IconAlertCircle size="1rem" />} title="Error Loading Profile" color="red">
          {error}
        </Alert>
      </div>
    );
  }

  // This case might occur if the webhook hasn't run but session exists
  if (!beneficiaryData) {
    return (
      <div style={{ padding: '2rem' }}>
        <Title order={2} mb="lg">Profile Setup Pending</Title>
        <Alert icon={<IconAlertCircle size="1rem" />} title="Action Required" color="blue">
          Your beneficiary profile is being created. Please check back shortly or contact support if this persists.
        </Alert>
      </div>
    );
  }

  // Display Editable Form
  return (
    <div style={{ padding: '2rem' }}>
      <Title order={2} mb="lg">Edit Your Beneficiary Profile</Title>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <Group align="flex-start">
              {kindeUser?.picture && (
                <Avatar src={kindeUser.picture} alt={`${beneficiaryData.firstName} ${beneficiaryData.lastName}`} radius="xl" size="lg" />
              )}
              <Stack gap="xs" style={{ flexGrow: 1 }}>
                <TextInput
                  label="First Name"
                  placeholder="Your first name"
                  {...register('firstName')}
                  error={errors.firstName?.message}
                  required
                  defaultValue={beneficiaryData.firstName}
                />
                <TextInput
                  label="Last Name"
                  placeholder="Your last name"
                  {...register('lastName')}
                  error={errors.lastName?.message}
                  required
                  defaultValue={beneficiaryData.lastName}
                />
              </Stack>
            </Group>

            <TextInput
              label="Email (from Kinde)"
              value={kindeUser?.email ?? ''}
              disabled // Email usually managed via Kinde
            />

            <TextInput
              label="Phone Number"
              placeholder="Your phone number"
              {...register('phoneNumber')}
              error={errors.phoneNumber?.message}
              defaultValue={beneficiaryData.phoneNumber ?? ''}
            />
            
            <Textarea
              label="Address"
              placeholder="Your address"
              {...register('address')}
              error={errors.address?.message}
              defaultValue={beneficiaryData.address ?? ''}
              autosize
              minRows={2}
            />

             <TextInput
              label="Status"
              value={beneficiaryData.status}
              disabled // Status not editable by user
            />

            <Button type="submit" loading={isPending} mt="md">
              Save Changes
            </Button>
          </Stack>
        </form>
        <Text mt="xl" size="xs" c="dimmed">Kinde User ID: {kindeUser?.id}</Text>
        <Text mt="xs" size="xs" c="dimmed">Profile ID: {beneficiaryData.id}</Text>
      </Card>
    </div>
  );
} 