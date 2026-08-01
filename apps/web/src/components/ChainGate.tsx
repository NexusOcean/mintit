import { useQuery } from '@tanstack/react-query';
import { Center, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import {
  CHAINS_QUERY_KEY,
  deriveChainStatus,
  fetchEnabledChains,
} from '@/src/context/ChainContext';
import { PageLoader } from '@/src/components/PageLoader';
import { HEADING, MUTED } from '@/src/lib/theme';

function BlockingMessage({ title, body }: { title: string; body: string }) {
  return (
    <Center style={{ minHeight: '100vh' }}>
      <Stack align="center" gap="sm" maw={420} px="md">
        <IconAlertTriangle size={40} color="#f87171" />
        <Text
          style={{
            fontFamily: HEADING,
            fontSize: 16,
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: HEADING,
            fontSize: 13,
            color: MUTED,
            textAlign: 'center',
          }}
        >
          {body}
        </Text>
      </Stack>
    </Center>
  );
}

export default function ChainGate({ children }: { children: React.ReactNode }) {
  const {
    data: enabledChains,
    isLoading,
    isError,
  } = useQuery({
    queryKey: CHAINS_QUERY_KEY,
    queryFn: fetchEnabledChains,
  });

  const status = deriveChainStatus({ isLoading, isError, enabledChains });

  if (status === 'loading') {
    return <PageLoader />;
  }

  if (status === 'no-chains') {
    return (
      <BlockingMessage
        title="Please enable a coin to continue"
        body="No chains are enabled on this server yet. Enable at least one supported coin in the server configuration, then reload."
      />
    );
  }

  if (status === 'error') {
    return (
      <BlockingMessage
        title="Failed to load chain configuration"
        body="Could not reach the API to determine enabled chains. Check the connection and reload."
      />
    );
  }

  return <>{children}</>;
}
