'use client';

import { Title, Container, Paper, TextInput, Textarea, NumberInput, Button, Stack, Alert, Loader, Center } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitEducationalApplication } from '@/actions/applicationActions';
import { getProfileData } from '@/actions/profileActions';
import { useState, useTransition, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useParams, useRouter } from 'next/navigation'; 
import Link from 'next/link';
import type { z } from 'zod';
import { educationalAssistanceSchema } from '@/lib/schemas/applicationSchemas';

type EducationalAssistanceInput = z.infer<typeof educationalAssistanceSchema>;

export default function EducationalApplicationPage() {
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
  } = useForm<EducationalAssistanceInput>({
    resolver: zodResolver(educationalAssistanceSchema),
    defaultValues: {
        studentName: '',
        schoolOrInstitution: '',
        gradeOrLevel: '',
        assistanceNeeded: '',
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
           window.location.href = `/api/auth/login?post_login_redirect_url=/${params.locale}/apply/educational`;
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

  const onSubmit = (data: EducationalAssistanceInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await submitEducationalApplication(data);
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
        <Title order={1} mb="xl" ta="center">Educational Assistance Application</Title>
        <Paper shadow="sm" p="lg" radius="md">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack>
              {serverError && (
                <Alert icon={<IconAlertCircle size="1rem" />} title="Submission Error" color="red" mb="md">{serverError}</Alert>
              )}
              <TextInput label="Student's Full Name" placeholder="Enter the student's name" {...register('studentName')} error={errors.studentName?.message} required />
              <TextInput label="School/Institution Name" placeholder="Name of the school or institution" {...register('schoolOrInstitution')} error={errors.schoolOrInstitution?.message} required />
              <TextInput label="Grade/Level" placeholder="e.g., Grade 5, University Year 2" {...register('gradeOrLevel')} error={errors.gradeOrLevel?.message} required />
              <Textarea label="Assistance Needed" placeholder="Describe the specific assistance needed (e.g., tuition fees, books, uniform)" {...register('assistanceNeeded')} error={errors.assistanceNeeded?.message} required minRows={3} />
              <Controller
                name="estimatedCost"
                control={control}
                render={({ field }) => (
                  <NumberInput 
                    {...field} 
                    value={field.value ?? undefined} // Handle null
                    label="Estimated Cost ($) (Optional)" 
                    placeholder="Total estimated cost" 
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