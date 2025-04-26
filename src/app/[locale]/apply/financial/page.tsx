'use client';

import { Title, Container, Paper, TextInput, Textarea, NumberInput, Button, Stack, Alert, Loader, Center } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitFinancialApplication } from '@/actions/applicationActions';
import { getProfileData } from '@/actions/profileActions'; // Import profile fetch action
import { useState, useTransition, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useParams, useRouter } from 'next/navigation'; // Use next/navigation in App Router
import Link from 'next/link'; // Import Link for profile link
import type { z } from 'zod';
import { financialAssistanceSchema } from '@/lib/schemas/applicationSchemas';

type FinancialAssistanceInput = z.infer<typeof financialAssistanceSchema>;

export default function FinancialApplicationPage() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);
  const [initialCheckError, setInitialCheckError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset,
    control
  } = useForm<FinancialAssistanceInput>({
    resolver: zodResolver(financialAssistanceSchema),
    defaultValues: {
        reason: '',
        amountRequested: undefined, // Use undefined for number input initial value
        additionalInfo: ''
    }
  });

  // Fetch profile data on mount to check if beneficiary profile exists
  useEffect(() => {
    async function checkProfile() {
      setIsLoading(true);
      setInitialCheckError(null);
      setProfileExists(false);

      try {
        const { kindeUser, beneficiaryData, error } = await getProfileData();

        if (error === 'Not authenticated') {
           window.location.href = `/api/auth/login?post_login_redirect_url=/${params.locale}/apply/financial`;
           return;
        }
        if (error) {
            throw new Error(error);
        }

        if (beneficiaryData) {
          setProfileExists(true);
        } else {
          // User is authenticated but has no beneficiary profile
          setInitialCheckError('Beneficiary profile not found.');
        }

      } catch (err: any) {
        console.error("Error checking profile data:", err);
        setInitialCheckError(err.message || "Failed to load profile status.");
      } finally {
        setIsLoading(false);
      }
    }
    checkProfile();
  }, [params.locale]);

  const onSubmit = (data: FinancialAssistanceInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await submitFinancialApplication(data);
      if (result.success) {
        notifications.show({ title: 'Success', message: result.message, color: 'green' });
        reset(); // Clear the form
        router.push(`/${params.locale}/dashboard`); // Redirect to dashboard or app list
      } else {
        if (result.errors) {
           const firstError = result.errors[0];
           setServerError(`Validation failed: ${firstError.message} (for field: ${firstError.path.join('.')})`);
        } else {
             setServerError(result.message);
        }
        notifications.show({ 
          title: 'Error', 
          message: result.message, 
          color: 'red' 
        });
      }
    });
  };

  if (isLoading) {
    return (
      <Container size="sm" py="xl">
        <Center><Loader /></Center>
      </Container>
    );
  }

  if (initialCheckError) {
    return (
      <Container size="sm" py="xl">
        <Alert icon={<IconAlertCircle size="1rem" />} title="Cannot Submit Application" color="red">
          {initialCheckError === 'Beneficiary profile not found.' 
           ? <>Please complete your <Link href={`/${params.locale}/profile`}>beneficiary profile</Link> first.</> 
           : `Error checking profile status: ${initialCheckError}`}
        </Alert>
      </Container>
    );
  }

  // Only render the form if the profile exists
  if (profileExists) {
    return (
      <Container size="sm" py="xl">
        <Title order={1} mb="xl" ta="center">
          Financial Assistance Application
        </Title>

        <Paper shadow="sm" p="lg" radius="md">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack>
              {serverError && (
                <Alert icon={<IconAlertCircle size="1rem" />} title="Submission Error" color="red" mb="md">
                  {serverError}
                </Alert>
              )}

              <Textarea
                label="Reason for Request"
                placeholder="Briefly explain why you need financial assistance."
                {...register('reason')}
                error={errors.reason?.message}
                required
                autosize
                minRows={3}
              />

              <Controller
                name="amountRequested"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    {...field}
                    label="Amount Requested ($)"
                    placeholder="Enter the amount you need"
                    error={errors.amountRequested?.message}
                    required
                    min={0}
                    onChange={(value) => field.onChange(value)}
                  />
                )}
              />

              <Textarea
                label="Additional Information (Optional)"
                placeholder="Provide any other details that might support your application."
                {...register('additionalInfo')}
                error={errors.additionalInfo?.message}
                autosize
                minRows={2}
              />

              <Button type="submit" loading={isPending} mt="md">
                Submit Application
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    );
  }

  // Fallback if profile doesn't exist but wasn't caught by initialCheckError (shouldn't happen)
  return null; 
} 