'use client';

import { useState } from 'react';
import { Textarea, Button, Group, Box } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

interface MessageInputProps {
    conversationId: number;
    // We'll need a function to actually send the message, passed as a prop
    // onSendMessage: (conversationId: number, content: string) => Promise<void>; 
    onSendMessage: (content: string) => Promise<void>; // Simplified for now
}

export function MessageInput({ conversationId, onSendMessage }: MessageInputProps) {
    const t = useTranslations('Messaging');
    const [messageContent, setMessageContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        const content = messageContent.trim();
        if (!content || isSending) return;

        setIsSending(true);
        try {
            console.log(`Sending message to conversation ${conversationId}: ${content}`);
            // await onSendMessage(conversationId, content);
            await onSendMessage(content); // Call the passed function
            setMessageContent(''); // Clear input after sending
        } catch (error) {
            console.error("Failed to send message:", error);
            // Optionally, show an error message to the user
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Send message on Enter key press, unless Shift is held (for new lines)
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent default Enter behavior (new line)
            handleSend();
        }
    };

    return (
        <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <Group gap="sm" align="flex-end">
                <Textarea
                    placeholder={t('typeMessagePlaceholder')}
                    value={messageContent}
                    onChange={(event) => setMessageContent(event.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    minRows={1}
                    maxRows={4}
                    autosize
                    style={{ flexGrow: 1 }}
                    disabled={isSending}
                />
                <Button 
                    onClick={handleSend} 
                    loading={isSending} 
                    disabled={!messageContent.trim()}
                    aria-label={t('sendMessageAriaLabel')}
                >
                    <IconSend size={18} />
                </Button>
            </Group>
        </Box>
    );
} 