'use client';

import { useState, useTransition } from 'react';
import { Button, Text, Box } from '@mantine/core';
import { seedInitialInformation } from '@/actions/seedInformation';

export function SeedInfoButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeed = () => {
    setResult(null);
    startTransition(async () => {
      const seedResult = await seedInitialInformation();
      setResult(seedResult);
    });
  };

  // Only render this button in development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Box mb="md" p="xs" style={{ border: '1px dashed red', borderRadius: '4px' }}>
      <Text size="xs" c="dimmed">Dev Only:</Text>
      <Button 
        onClick={handleSeed} 
        loading={isPending}
        variant="outline"
        color="orange"
        size="xs"
        mb="xs"
      >
        Seed Initial Info (EN)
      </Button>
      {result && (
        <Text size="xs" c={result.success ? 'green' : 'red'}>
          {result.message}
        </Text>
      )}
    </Box>
  );
} 