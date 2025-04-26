import { Title, Container, Paper, Text, Badge, Group, Button, Alert, Stack, Divider, Avatar } from '@mantine/core';
import { IconAlertCircle, IconMessageCircle, IconUser, IconEyeOff } from '@tabler/icons-react';
import { getForumTopicDetails } from '@/actions/forumActions';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"; // Import kinde session
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import ReplyForm from './_components/ReplyForm';
import AdminTopicActions from '../../_components/AdminTopicActions'; // Import topic actions
import AdminPostActions from './_components/AdminPostActions'; // Import post actions

interface TopicPageProps {
    params: {
        locale: string;
        topicId: string;
    }
}

export default async function ForumTopicPage({ params }: TopicPageProps) {
    
    const topicIdNum = parseInt(params.topicId, 10);
    if (isNaN(topicIdNum)) {
        return (
            <Container size="md" py="xl">
                 <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">Invalid topic ID.</Alert>
            </Container>
        );
    }

    // Fetch admin status
    const { getPermissions } = getKindeServerSession();
    const permissions = await getPermissions();
    const isAdmin = permissions?.permissions?.includes('access:admin_panel');

    const { success, topic, message } = await getForumTopicDetails(topicIdNum);

    // Redirect to login if necessary
    if (!success && message === 'Not authenticated') {
        redirect(`/api/auth/login?post_login_redirect_url=/${params.locale}/forum/topic/${topicIdNum}`);
    }

    // Handle topic not found or other errors
    if (!success || !topic) {
         return (
            <Container size="md" py="xl">
                <Title order={2} mb="xl">Topic Not Found</Title>
                 <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
                    {message || 'Could not load the requested topic.'}
                </Alert>
                 <Button component={Link} href={`/${params.locale}/forum`} mt="lg">Back to Forum</Button>
            </Container>
        );
    }

    return (
        <Container size="md" py="xl">
            <Group justify="space-between" mb="lg">
                <Link href={`/${params.locale}/forum`} style={{ textDecoration: 'none' }}>
                    <Text size="sm" c="blue.6">← Back to Forum</Text>
                </Link>
                {/* Show admin actions for the topic */}
                {isAdmin && <AdminTopicActions topicId={topic.id} currentStatus={topic.status} />}
            </Group>
            
            {/* Topic Header */}
            <Paper shadow="sm" p="lg" radius="md" mb="xl" style={ topic.status === 'HiddenByAdmin' ? { opacity: 0.6, border: '1px dashed grey' } : {}}>
                <Title order={2} mb="xs">
                    {topic.status === 'HiddenByAdmin' && <IconEyeOff size={18} style={{ marginRight: '8px' }} />} 
                    {topic.title}
                </Title>
                <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                        Started by {topic.creator.firstName} {topic.creator.lastName} on {format(new Date(topic.createdAt), 'PPP')}
                    </Text>
                    <Badge color={topic.status === 'ClosedByAdmin' ? 'red' : 'gray'}>{topic.status}</Badge>
                </Group>
            </Paper>

            {/* Posts */}
            <Stack gap="lg">
                {topic.posts.map((post) => (
                    <Paper key={post.id} shadow="sm" p="lg" radius="md" withBorder style={ post.status === 'HiddenByAdmin' ? { opacity: 0.5, borderStyle: 'dashed' } : {}}>
                         <Group justify="space-between" mb="xs">
                            <Group>
                                <Avatar size="sm" radius="xl"><IconUser size="1rem" /></Avatar>
                                <Text size="sm" fw={500}>{post.creator.firstName} {post.creator.lastName}</Text>
                                {post.status === 'HiddenByAdmin' && <Badge color="gray" size="xs">Hidden</Badge>}
                            </Group>
                            <Group gap="xs">
                                <Text size="xs" c="dimmed">{format(new Date(post.createdAt), 'Pp')}</Text>
                                {/* Show admin actions for the post */}
                                {isAdmin && <AdminPostActions postId={post.id} currentStatus={post.status} />}
                            </Group>
                        </Group>
                        <Divider my="xs" />
                        <Text style={{ whiteSpace: 'pre-wrap' }}>{post.content}</Text>
                    </Paper>
                ))}
                 {topic.posts.length === 0 && <Text c="dimmed">No replies yet.</Text>}
            </Stack>

            {/* Reply Form - Only show if topic is Open */}
            {topic.status === 'Open' ? (
                <>
                    <Divider my="xl" label="Post a Reply" labelPosition="center" />
                    <ReplyForm topicId={topic.id} locale={params.locale} />
                </>
            ) : (
                <Alert mt="xl" color="gray" title="Topic Closed">Replying is disabled for this topic.</Alert>
            )}
            
        </Container>
    );
} 