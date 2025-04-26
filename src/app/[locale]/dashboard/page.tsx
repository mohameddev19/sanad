import { Title, Container, Paper, Table, Text, Badge, Group, Button, TableTr, TableTd, TableThead, TableTh, TableTbody } from '@mantine/core';
import { getMyApplications } from '@/actions/applicationActions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns'; // For formatting dates

// Helper function to determine badge color based on status
function getStatusColor(status: string): string {
    switch (status) {
        case 'Submitted': return 'blue';
        case 'Under Review': return 'yellow';
        case 'Approved': return 'green';
        case 'Rejected': return 'red';
        case 'Draft': return 'gray';
        default: return 'gray';
    }
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
    const locale = (await params).locale;
    
    const { success, applications, message } = await getMyApplications();

    // Redirect to login if not authenticated (based on action result)
    if (!success && message === 'Not authenticated') {
        redirect(`/api/auth/login?post_login_redirect_url=/${locale}/dashboard`);
    }

    // Handle case where profile doesn't exist yet
    if (!success && message === 'Beneficiary profile not found.') {
        return (
            <Container size="md" py="xl">
                 <Title order={1} mb="xl">Dashboard</Title>
                 <Paper shadow="sm" p="lg" radius="md">
                    <Text>Please complete your <Link href={`/${locale}/profile`}>beneficiary profile</Link> first to view or submit applications.</Text>
                </Paper>
            </Container>
        );
    }
    
    // Handle other errors
    if (!success) {
         return (
            <Container size="md" py="xl">
                 <Title order={1} mb="xl">Dashboard</Title>
                 <Paper shadow="sm" p="lg" radius="md">
                    <Text c="red">Error fetching applications: {message || 'Unknown error'}</Text>
                </Paper>
            </Container>
        );
    }

    const rows = applications.map((app) => (
        <TableTr key={app.id}>
            <TableTd>{app.id}</TableTd>
            <TableTd>{app.applicationType}</TableTd>
            <TableTd>
                <Badge color={getStatusColor(app.status)} variant="light">
                    {app.status}
                </Badge>
            </TableTd>
            <TableTd>{app.submittedAt ? format(new Date(app.submittedAt), 'yyyy-MM-dd HH:mm') : '-'}</TableTd>
            <TableTd>{format(new Date(app.createdAt), 'yyyy-MM-dd HH:mm')}</TableTd>
             <TableTd>
                {/* Add View/Details button later */}
                {/* <Button size="xs" variant="outline">View</Button> */} 
            </TableTd>
        </TableTr>
    ));

    return (
        <Container size="lg" py="xl"> {/* Use larger container */} 
            <Title order={1} mb="xl">My Applications</Title>
            
             {/* Add buttons to navigate to application forms */} 
            <Group mb="lg">
                 <Button component={Link} href={`/${locale}/apply/financial`}>Apply for Financial Aid</Button>
                 <Button component={Link} href={`/${locale}/apply/medical`}>Apply for Medical Aid</Button>
                 <Button component={Link} href={`/${locale}/apply/educational`}>Apply for Educational Aid</Button>
                 <Button component={Link} href={`/${locale}/apply/other`}>Other Application</Button>
            </Group>

            <Paper shadow="sm" p="lg" radius="md">
                {applications.length > 0 ? (
                    <Table striped highlightOnHover withTableBorder withColumnBorders>
                        <TableThead>
                            <TableTr>
                                <TableTh>ID</TableTh>
                                <TableTh>Type</TableTh>
                                <TableTh>Status</TableTh>
                                <TableTh>Submitted On</TableTh>
                                <TableTh>Created On</TableTh>
                                <TableTh>Actions</TableTh>
                            </TableTr>
                        </TableThead>
                        <TableTbody>{rows}</TableTbody>
                    </Table>
                ) : (
                    <Text>You have not submitted any applications yet.</Text>
                )}
            </Paper>
        </Container>
    );
} 