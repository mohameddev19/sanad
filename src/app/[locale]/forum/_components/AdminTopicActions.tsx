'use client';
import { Button, Group, Menu } from '@mantine/core';
import { IconDotsVertical, IconEyeOff, IconEye, IconLock, IconLockOpen } from '@tabler/icons-react';
import { useTransition } from 'react';
import { notifications } from '@mantine/notifications';
import { hideTopic, showTopic, closeTopic, reopenTopic } from '@/actions/forumActions';

interface AdminTopicActionsProps {
    topicId: number;
    currentStatus: 'Open' | 'ClosedByAdmin' | 'HiddenByAdmin';
}

export default function AdminTopicActions({ topicId, currentStatus }: AdminTopicActionsProps) {
    const [isPending, startTransition] = useTransition();

    const handleAction = (action: (id: number) => Promise<any>) => {
        startTransition(async () => {
            const result = await action(topicId);
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
                    <Menu.Item leftSection={<IconEye size={14} />} onClick={() => handleAction(showTopic)} disabled={isPending}>
                        Show Topic
                    </Menu.Item>
                ) : (
                    <Menu.Item leftSection={<IconEyeOff size={14} />} onClick={() => handleAction(hideTopic)} disabled={isPending}>
                        Hide Topic
                    </Menu.Item>
                )}
                {currentStatus === 'ClosedByAdmin' ? (
                     <Menu.Item leftSection={<IconLockOpen size={14} />} onClick={() => handleAction(reopenTopic)} disabled={isPending}>
                        Reopen Topic
                    </Menu.Item>
                ) : (
                     <Menu.Item leftSection={<IconLock size={14} />} onClick={() => handleAction(closeTopic)} disabled={isPending}>
                        Close Topic
                    </Menu.Item>
                )}
            </Menu.Dropdown>
        </Menu>
    );
} 