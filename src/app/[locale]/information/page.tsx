import { Title, Text, Accordion, List, ThemeIcon, rem, Container, Paper, Alert, Loader, Center } from '@mantine/core';
import { IconInfoCircle, IconHelp, IconChecklist, IconQuestionMark, IconAlertCircle } from '@tabler/icons-react';
import { getInformationBenefits, getInformationFaqs } from '@/actions/informationActions';
import { SeedInfoButton } from '@/components/dev/SeedInfoButton';
import { getTranslations } from 'next-intl/server';

export default async function InformationPortalPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'InformationPortal' });

  // Fetch data using server actions
  const [benefitsResult, faqsResult] = await Promise.all([
    getInformationBenefits(params.locale),
    getInformationFaqs(params.locale)
  ]);

  // Basic error handling - could be refined with dedicated error components
  if (!benefitsResult.success || !faqsResult.success) {
    return (
      <Container size="md" py="xl">
        <SeedInfoButton />
        <Alert icon={<IconAlertCircle size="1rem" />} title={t('errorLoadingTitle')} color="red">
          {benefitsResult.message || faqsResult.message || t('errorLoadingDefaultMessage')}
        </Alert>
      </Container>
    );
  }

  const benefits = benefitsResult.benefits;
  const faqs = faqsResult.faqs;

  // Handle case where no data is found (e.g., content not yet added for this locale)
  if (benefits.length === 0 && faqs.length === 0) {
     return (
      <Container size="md" py="xl">
        <SeedInfoButton />
        <Title order={1} mb="xl" ta="center">
            {t('title')}
        </Title>
        <Paper shadow="sm" p="lg" radius="md" mb="xl">
            <Text ta="center">{t('noDataMessage')}</Text>
         </Paper>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <SeedInfoButton />
      <Title order={1} mb="xl" ta="center">
        {t('title')}
      </Title>

      {benefits.length > 0 && (
        <Paper shadow="sm" p="lg" radius="md" mb="xl">
          <Title order={2} mb="md">{t('benefitsTitle')}</Title>
          <Text mb="lg" c="dimmed">
            {t('benefitsDescription')}
          </Text>
          <Accordion variant="separated" defaultValue={benefits[0]?.slug}>
            {benefits.map((benefit) => (
              <Accordion.Item key={benefit.id} value={benefit.slug}>
                <Accordion.Control icon={<ThemeIcon color="blue" variant="light"><IconInfoCircle size={rem(16)} /></ThemeIcon>}>
                  <Text fw={500}>{benefit.title}</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text mb="sm">{benefit.description}</Text>
                  <Title order={4} mt="md" mb="xs">{t('eligibilityLabel')}</Title>
                  <Text size="sm" mb="sm">{benefit.eligibility}</Text>
                  <Title order={4} mt="md" mb="xs">{t('applicationProcessLabel')}</Title>
                  <Text size="sm">{benefit.applicationProcess}</Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Paper>
      )}

      {faqs.length > 0 && (
          <Paper shadow="sm" p="lg" radius="md">
            <Title order={2} mb="md">{t('faqsTitle')}</Title>
            <Accordion variant="separated">
              {faqs.map((faq) => (
                <Accordion.Item key={faq.id} value={faq.id.toString()}>
                  <Accordion.Control icon={<ThemeIcon color="gray" variant="light"><IconQuestionMark size={rem(16)} /></ThemeIcon>}>
                    <Text fw={500}>{faq.question}</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text>{faq.answer}</Text>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </Paper>
      )}

    </Container>
  );
} 