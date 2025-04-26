'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Loader, Alert, List, ThemeIcon, Text, Group, Paper } from '@mantine/core';
import { IconMessageCircle, IconAlertCircle } from '@tabler/icons-react';
import { getConversations, type ConversationListItem } from '@/actions/messagingActions';
import { formatDistanceToNow } from 'date-fns';
// import { ar } from 'date-fns/locale';

export function ConversationList() {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('Messaging');
    const [conversations, setConversations] = useState<ConversationListItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchConversations() {
            setLoading(true);
            setError(null);
            try {
                const result = await getConversations();
                if (result.success) {
                    setConversations(result.conversations);
                } else {
                    setError(result.message || t('errorFetchingConversations'));
                }
            } catch (err) {
                console.error("Fetch conversations error:", err);
                setError(t('errorFetchingConversations'));
            } finally {
                setLoading(false);
            }
        }

        fetchConversations();
    }, [t]);

    const handleConversationClick = (conversationId: number) => {
        router.push(`/${locale}/messaging/${conversationId}`);
    };

    // const dateLocale = locale === 'ar' ? ar : undefined;

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size="1rem" />} title={t('errorTitle')} color="red">
                {error}
            </Alert>
        );
    }

    if (conversations.length === 0) {
        return <Text>{t('noConversations')}</Text>;
    }

    return (
        <List spacing="sm" size="sm">
            {conversations.map((convo) => (
                <List.Item
                    key={convo.id}
                    style={{ listStyleType: 'none' }} 
                >
                    <Paper
                        withBorder
                        p="sm"
                        mb="xs"
                        onClick={() => handleConversationClick(convo.id)}
                        style={{ cursor: 'pointer' }}
                    >
                        <Group wrap="nowrap">
                            <ThemeIcon color="blue" size={24} radius="xl">
                                <IconMessageCircle size="1rem" />
                            </ThemeIcon>
                            <div style={{ flexGrow: 1 }}>
                                <Group justify="space-between">
                                    <Text fw={500}>{convo.otherParticipant.name}</Text>
                                    <Text size="xs" color="dimmed">
                                        {formatDistanceToNow(new Date(convo.lastMessageAt), { addSuffix: true /* locale: dateLocale */ })}
                                    </Text>
                                </Group>
                                {/* Optional: Add last message preview here later */} 
                            </div>
                        </Group>
                    </Paper>
                </List.Item>
            ))}
        </List>
    );
} 