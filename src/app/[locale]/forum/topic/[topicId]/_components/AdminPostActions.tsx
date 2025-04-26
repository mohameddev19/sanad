'use client';
import { Button, Group, Menu } from '@mantine/core';
import { IconDotsVertical, IconEyeOff, IconEye } from '@tabler/icons-react';
import { useTransition } from 'react';
import { notifications } from '@mantine/notifications';
import { hidePost, showPost } from '@/actions/forumActions';

interface AdminPostActionsProps {
    postId: number;
    currentStatus: 'Visible' | 'HiddenByAdmin';
}

export default function AdminPostActions({ postId, currentStatus }: AdminPostActionsProps) {
    const [isPending, startTransition] = useTransition();

    const handleAction = (action: (id: number) => Promise<any>) => {
        startTransition(async () => {
            const result = await action(postId);
            if (result.success) {
                notifications.show({ title: 'Success', message: result.message, color: 'green' });
            } else {
                notifications.show({ title: 'Error', message: result.message, color: 'red' });
            }
        });
    };

    return (
        <Menu shadow="md" width={200}>
            <Menu.Target>
                 <Button size="xs" variant="subtle" loading={isPending}><IconDotsVertical size={14} /></Button>
            </Menu.Target>
            <Menu.Dropdown>
                 {currentStatus === 'HiddenByAdmin' ? (
                    <Menu.Item leftSection={<IconEye size={14} />} onClick={() => handleAction(showPost)} disabled={isPending}>
                        Show Post
                    </Menu.Item>
                ) : (
                    <Menu.Item leftSection={<IconEyeOff size={14} />} onClick={() => handleAction(hidePost)} disabled={isPending}>
                        Hide Post
                    </Menu.Item>
                )}
            </Menu.Dropdown>
        </Menu>
    );
} 