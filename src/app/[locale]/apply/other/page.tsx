'use client';

import { Title, Container, Paper, TextInput, Textarea, NumberInput, Button, Stack, Alert, Loader, Center } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitOtherApplication } from '@/actions/applicationActions';
import { getProfileData } from '@/actions/profileActions';
import { useState, useTransition, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useParams, useRouter } from 'next/navigation'; 
import Link from 'next/link';
import type { z } from 'zod';
import { otherAssistanceSchema } from '@/lib/schemas/applicationSchemas';
type OtherAssistanceInput = z.infer<typeof otherAssistanceSchema>;

export default function OtherApplicationPage() {
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
  } = useForm<OtherAssistanceInput>({
    resolver: zodResolver(otherAssistanceSchema),
    defaultValues: {
        requestType: '',
        description: '',
        estimatedCost: undefined,
        additionalInfo: ''
    }
  });

  useEffect(() => {
    async function checkProfile() {
      setIsLoading(true);
      setInitialCheckError(null);
      setProfileExists(false);
      try {
        const { beneficiaryData, error } = await getProfileData();
        if (error === 'Not authenticated') {
           window.location.href = `/api/auth/login?post_login_redirect_url=/${params.locale}/apply/other`;
           return;
        }
        if (error) throw new Error(error);
        if (beneficiaryData) setProfileExists(true);
        else setInitialCheckError('Beneficiary profile not found.');
      } catch (err: any) {
        setInitialCheckError(err.message || "Failed to load profile status.");
      } finally {
        setIsLoading(false);
      }
    }
    checkProfile();
  }, [params.locale]);

  const onSubmit = (data: OtherAssistanceInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await submitOtherApplication(data);
      if (result.success) {
        notifications.show({ title: 'Success', message: result.message, color: 'green' });
        reset();
        router.push(`/${params.locale}/dashboard`); 
      } else {
        if (result.errors) {
           const firstError = result.errors[0];
           setServerError(`Validation failed: ${firstError.message} (field: ${firstError.path.join('.')})`);
        } else {
             setServerError(result.message);
        }
        notifications.show({ title: 'Error', message: result.message, color: 'red' });
      }
    });
  };

  if (isLoading) return <Container size="sm" py="xl"><Center><Loader /></Center></Container>;

  if (initialCheckError) {
    return (
      <Container size="sm" py="xl">
        <Alert icon={<IconAlertCircle size="1rem" />} title="Cannot Submit Application" color="red">
          {initialCheckError === 'Beneficiary profile not found.' 
           ? <>Please complete your <Link href={`/${params.locale}/profile`}>beneficiary profile</Link> first.</> 
           : `Error: ${initialCheckError}`}
        </Alert>
      </Container>
    );
  }

  if (profileExists) {
    return (
      <Container size="sm" py="xl">
        <Title order={1} mb="xl" ta="center">Other Assistance Application</Title>
        <Paper shadow="sm" p="lg" radius="md">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack>
              {serverError && (
                <Alert icon={<IconAlertCircle size="1rem" />} title="Submission Error" color="red" mb="md">{serverError}</Alert>
              )}
              <TextInput label="Type of Request" placeholder="e.g., Housing Repair, Transportation Aid" {...register('requestType')} error={errors.requestType?.message} required />
              <Textarea label="Description of Request" placeholder="Describe your situation and the assistance needed in detail" {...register('description')} error={errors.description?.message} required minRows={4} />
              <Controller
                name="estimatedCost"
                control={control}
                render={({ field }) => (
                  <NumberInput 
                    {...field} 
                    value={field.value ?? undefined} // Handle null
                    label="Estimated Cost ($) (Optional)" 
                    placeholder="Estimated cost if applicable" 
                    error={errors.estimatedCost?.message} 
                    min={0} 
                    onChange={(value) => field.onChange(value)} 
                  />
                )}
              />
              <Textarea label="Additional Information (Optional)" placeholder="Any other relevant details" {...register('additionalInfo')} error={errors.additionalInfo?.message} minRows={2} />
              <Button type="submit" loading={isPending} mt="md">Submit Application</Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    );
  }
  return null;
} 