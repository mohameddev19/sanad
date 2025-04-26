import { Title, Container, Paper, Table, Text, Badge, Group, Button, Alert } from '@mantine/core';
import { IconAlertCircle, IconPlus, IconEyeOff } from '@tabler/icons-react';
import { getForumTopics, ForumTopicListItem } from '@/actions/forumActions';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"; // Import kinde session
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns'; // For relative dates
import AdminTopicActions from './_components/AdminTopicActions'; // Import the admin actions component

export default async function ForumIndexPage({ params }: { params: { locale: string } }) {
    
    // Fetch admin status along with topics
    const { getPermissions } = getKindeServerSession();
    const permissions = await getPermissions();
    const isAdmin = permissions?.permissions?.includes('access:admin_panel');

    const { success, topics, message } = await getForumTopics();

    // Redirect to login if not authenticated
    if (!success && message === 'Not authenticated') {
        redirect(`/api/auth/login?post_login_redirect_url=/${params.locale}/forum`);
    }
    
    // Handle other errors
    if (!success) {
         return (
            <Container size="lg" py="xl">
                 <Title order={1} mb="xl">Community Forum</Title>
                 <Alert icon={<IconAlertCircle size="1rem" />} title="Error Loading Forum" color="red">
                    {message || 'Could not load forum topics. Please try again later.'}
                </Alert>
            </Container>
        );
    }

    const rows = topics.map((topic) => (
        <Table.Tr key={topic.id} style={ topic.status === 'HiddenByAdmin' ? { opacity: 0.6, fontStyle: 'italic' } : {}}>
            <Table.Td>
                <Link href={`/${params.locale}/forum/topic/${topic.id}`} style={{ textDecoration: 'none' }}>
                    <Group gap="xs">
                         {topic.status === 'HiddenByAdmin' && <IconEyeOff size={14} title="Hidden" />} 
                         <Text fw={500} c="blue.6">{topic.title}</Text>
                    </Group>
                </Link>
            </Table.Td>
            <Table.Td>{topic.creatorName}</Table.Td>
            {/* <Table.Td>{topic.postCount + 1}</Table.Td> Include initial post in count */}
             <Table.Td>{topic.postCount}</Table.Td> {/* Display post count */} 
            <Table.Td>{formatDistanceToNow(new Date(topic.lastActivityAt), { addSuffix: true })}</Table.Td>
            {/* Add Admin Actions Column */}
            {isAdmin && (
                <Table.Td>
                    <AdminTopicActions topicId={topic.id} currentStatus={topic.status} />
                </Table.Td>
            )}
        </Table.Tr>
    ));

    return (
        <Container size="lg" py="xl">
            <Group justify="space-between" mb="xl">
                 <Title order={1}>Community Forum</Title>
                 <Button 
                    component={Link} 
                    href={`/${params.locale}/forum/new`}
                    leftSection={<IconPlus size={14} />}
                 >
                     New Topic
                 </Button>
            </Group>
            
            <Paper shadow="sm" radius="md">
                {topics.length > 0 ? (
                    <Table striped highlightOnHover verticalSpacing="md">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Topic</Table.Th>
                                <Table.Th>Started By</Table.Th>
                                <Table.Th>Posts</Table.Th>
                                <Table.Th>Last Activity</Table.Th>
                                {isAdmin && <Table.Th>Admin Actions</Table.Th>}
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                ) : (
                    <Text p="lg">No topics have been created yet. Be the first!</Text>
                )}
            </Paper>
        </Container>
    );
} 