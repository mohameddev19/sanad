'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Use next/navigation for App Router
import { getProfileData, createProfileForNewUser } from '@/actions/profileActions';
import { Center, Loader } from '@mantine/core'; // Assuming Mantine for loading UI

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams(); // Kinde might add params like 'state'
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processAuth = async () => {
            try {
                // Fetch profile data using the server action
                const profileResult = await getProfileData();

                if (profileResult.error === 'Not authenticated') {
                    // Should not happen on callback, but handle defensively
                    setError('Authentication failed. Please try logging in again.');
                    // Optionally redirect to login after a delay
                    // setTimeout(() => router.push('/api/auth/login'), 3000);
                    return; 
                } else if (profileResult.error) {
                    // Handle other errors like database issues
                    setError(`Error fetching profile: ${profileResult.error}. Please try again later.`);
                    return;
                }

                // If we have Kinde user but no beneficiary data, create profile
                if (profileResult.kindeUser && !profileResult.beneficiaryData) {
                    console.log('No beneficiary profile found, creating one...');
                    const creationResult = await createProfileForNewUser();
                    if (!creationResult.success) {
                        setError(`Failed to create profile: ${creationResult.message}. Please contact support.`);
                        return;
                    }
                    console.log('Profile created successfully.');
                } else {
                    console.log('Beneficiary profile found or already handled.');
                }
                
                // Redirect to dashboard or intended page
                // Kinde might provide a 'state' param for redirection, handle if needed
                const redirectTo = '/dashboard'; // Default redirect
                router.push(redirectTo); 

            } catch (err: any) {
                console.error('Error during auth callback processing:', err);
                setError('An unexpected error occurred during login. Please try again.');
            } finally {
                 // Even on error, stop loading unless redirecting immediately
                // setIsLoading(false); // Removed as we redirect on success/error
            }
        };

        processAuth();

        // Prevent running the effect multiple times on fast refresh/mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]); // Add router to dependency array

    // Display loading or error state
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            {isLoading && !error && (
                <Center className='flex flex-col items-center justify-center h-screen'>
                    <Loader size="xl" />
                    <p>Completing login...</p>
                </Center>
            )}
            {error && (
                <Center className='flex flex-col items-center justify-center h-screen'>
                    <h2>Error</h2>
                    <p style={{ color: 'red' }}>{error}</p>
                    {/* Optionally add a button to retry or go home */}
                </Center>
            )}
        </div>
    );
}
