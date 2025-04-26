'use client';

import { useEffect, useState, useCallback } from 'react';
import { Box, Loader, Alert, Text, Paper, Stack, Group } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { getConversationMessages, sendMessage, type MessageItem } from '@/actions/messagingActions';
import { MessageInput } from './MessageInput';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';

interface MessageViewProps {
    conversationId: number;
}

export function MessageView({ conversationId }: MessageViewProps) {
    const t = useTranslations('Messaging');
    const { user } = useKindeBrowserClient();
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const handleSendMessage = useCallback(async (messageContent: string) => {
        if (!user) {
            setError(t('notAuthenticated'));
            return;
        }

        const tempId = -Date.now();
        const newMessage: MessageItem = {
            id: tempId,
            conversationId: conversationId,
            senderKindeUserId: user.id,
            content: messageContent,
            sentAt: new Date(),
            isRead: false,
            sender: {
                name: t('you'),
                kindeId: user.id,
            },
        };

        setMessages(prevMessages => [...prevMessages, newMessage]);

        try {
            const result = await sendMessage({ conversationId, content: messageContent });
            if (!result.success) {
                setError(result.message || t('errorSendingMessage'));
                setMessages(prev => prev.filter(msg => msg.id !== tempId));
            }
        } catch (err) {
            console.error("Send message error:", err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(t('errorSendingMessage') + `: ${errorMessage}`);
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
        }
    }, [conversationId, user, t]);

    useEffect(() => {
        if (!conversationId || !user) {
            if (!user) setLoading(false);
            return;
        }

        async function fetchMessages() {
            setLoading(true);
            setError(null);
            try {
                console.log(`Fetching messages for conversation ${conversationId}...`);
                const result = await getConversationMessages(conversationId);

                if (result.success && result.messages) {
                    const sortedMessages = result.messages.sort((a, b) =>
                        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
                    );
                    setMessages(sortedMessages);
                } else {
                    setError(result.message || t('errorFetchingMessages'));
                }
            } catch (err) {
                console.error("Fetch messages error:", err);
                const errorMessage = err instanceof Error ? err.message : String(err);
                setError(t('errorFetchingMessages') + `: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        }

        fetchMessages();
    }, [conversationId, user, t]);

    if (!user && !loading) {
        return <Alert color="orange">{t('pleaseLogIn')}</Alert>;
    }

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

    return (
        <Stack h="100%" justify="flex-end">
            <Box style={{ flexGrow: 1, overflowY: 'auto', padding: 'var(--mantine-spacing-md)' }}>
                <Stack gap="md">
                    {messages.length === 0 && !loading && (
                        <Text c="dimmed" ta="center">{t('noMessagesYet')}</Text>
                    )}
                    {messages.map((message) => {
                        const isSender = message.senderKindeUserId === user?.id;
                        return (
                            <Group key={message.id} justify={isSender ? 'flex-end' : 'flex-start'}>
                                <Paper
                                    p="sm"
                                    shadow="xs"
                                    withBorder
                                    radius="md"
                                    style={{
                                        maxWidth: '70%',
                                        backgroundColor: isSender
                                            ? 'var(--mantine-color-blue-light)'
                                            : 'var(--mantine-color-gray-1)',
                                    }}
                                >
                                    <Group gap="xs" align="start">
                                        <Box style={{ flexGrow: 1 }}>
                                            {!isSender && (
                                                <Text size="xs" fw={500}>{message.sender.name}</Text>
                                            )}
                                            <Text>{message.content}</Text>
                                            <Text size="xs" c="dimmed" ta={isSender ? 'right' : 'left'}>
                                                {new Date(message.sentAt).toLocaleTimeString()}
                                            </Text>
                                        </Box>
                                    </Group>
                                </Paper>
                            </Group>
                        );
                    })}
                </Stack>
            </Box>
            <MessageInput
                conversationId={conversationId}
                onSendMessage={handleSendMessage}
            />
        </Stack>
    );
} 