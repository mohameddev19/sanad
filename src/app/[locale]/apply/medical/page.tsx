'use client';

import { Title, Container, Paper, TextInput, Textarea, NumberInput, Button, Stack, Alert, Loader, Center } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitMedicalApplication } from '@/actions/applicationActions';
import { getProfileData } from '@/actions/profileActions';
import { useState, useTransition, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useParams, useRouter } from 'next/navigation'; 
import Link from 'next/link';
import type { z } from 'zod';
import { medicalAssistanceSchema } from '@/lib/schemas/applicationSchemas';

type MedicalAssistanceInput = z.infer<typeof medicalAssistanceSchema>;

export default function MedicalApplicationPage() {
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
  } = useForm<MedicalAssistanceInput>({
    resolver: zodResolver(medicalAssistanceSchema),
    defaultValues: {
        condition: '',
        treatmentRequired: '',
        estimatedCost: undefined,
        hospitalClinicName: '',
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
           window.location.href = `/api/auth/login?post_login_redirect_url=/${params.locale}/apply/medical`;
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

  const onSubmit = (data: MedicalAssistanceInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await submitMedicalApplication(data);
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
        <Title order={1} mb="xl" ta="center">Medical Assistance Application</Title>
        <Paper shadow="sm" p="lg" radius="md">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack>
              {serverError && (
                <Alert icon={<IconAlertCircle size="1rem" />} title="Submission Error" color="red" mb="md">{serverError}</Alert>
              )}
              <Textarea label="Medical Condition" placeholder="Describe the medical condition" {...register('condition')} error={errors.condition?.message} required minRows={2} />
              <Textarea label="Required Treatment" placeholder="Describe the required treatment" {...register('treatmentRequired')} error={errors.treatmentRequired?.message} required minRows={3} />
              <TextInput label="Hospital/Clinic Name (Optional)" placeholder="Name of the hospital or clinic" {...register('hospitalClinicName')} error={errors.hospitalClinicName?.message} />
              <Controller
                name="estimatedCost"
                control={control}
                render={({ field }) => (
                  <NumberInput 
                    {...field} 
                    value={field.value ?? undefined} 
                    label="Estimated Cost ($) (Optional)" 
                    placeholder="Estimated cost of treatment" 
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