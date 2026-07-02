'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Group,
  NumberInput,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { isAxiosError } from 'axios';
import { api, type Settings } from '@/lib/api';
import { useChain } from '@/lib/chain-context';
import { HEADING, MUTED } from '@/lib/theme';

const FIELDS: {
  key: keyof Settings;
  label: string;
  unit: string;
}[] = [
  { key: 'confirmationDepth', label: 'Confirmation Depth', unit: 'blocks' },
  {
    key: 'invoiceDefaultExpirySec',
    label: 'Invoice Default Expiry',
    unit: 'seconds',
  },
  { key: 'invoiceMaxExpirySec', label: 'Invoice Max Expiry', unit: 'seconds' },
  { key: 'scannerLockTtlMs', label: 'Scanner Lock TTL', unit: 'ms' },
  { key: 'syncedThresholdBlocks', label: 'Sync Threshold', unit: 'blocks' },
  { key: 'rateCacheTtlMs', label: 'Rate Cache TTL', unit: 'ms' },
  { key: 'webhookMaxAttempts', label: 'Webhook Max Attempts', unit: 'retries' },
  { key: 'webhookTimeoutMs', label: 'Webhook Timeout', unit: 'ms' },
];

function fetchSettings(chain: string): Promise<Settings> {
  return api.get('/settings', { params: { chain } }).then((r) => r.data);
}

export default function SettingsPage() {
  const { chain } = useChain();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['settings', chain],
    queryFn: () => fetchSettings(chain),
  });

  const [draft, setDraft] = useState<Settings | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(data ?? null);
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (values: Settings) =>
      await api.put('/settings', values, { params: { chain } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', chain] });
      setSaved(true);
      setSaveError(null);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => {
      setSaveError(
        isAxiosError(err)
          ? (err.response?.data?.message ?? 'Failed to save')
          : 'Failed to save',
      );
    },
  });

  function handleChange(key: keyof Settings, value: string | number) {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(num)) return;
    setDraft((prev) => (prev ? { ...prev, [key]: num } : prev));
  }

  if (isLoading || !draft) {
    return (
      <Stack gap="xl">
        <Skeleton height={28} width={160} radius="sm" />
        <Skeleton height={320} radius="sm" />
      </Stack>
    );
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(data);

  return (
    <Box maw={640}>
      <Stack gap="xl">
        {/* Header */}
        <Title
          order={2}
          style={{ fontFamily: HEADING, letterSpacing: '-0.02em' }}
        >
          Settings
        </Title>

        {/* Fields */}
        <Paper
          radius="sm"
          style={{
            background: 'var(--mantine-color-dark-7)',
            border: `1px solid var(--mantine-color-dark-5)`,
            overflow: 'hidden',
          }}
        >
          {FIELDS.map(({ key, label, unit }, i) => (
            <Box
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom:
                  i < FIELDS.length - 1
                    ? '1px solid var(--mantine-color-dark-5)'
                    : 'none',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: 'var(--mantine-color-dark-0)',
                  fontFamily: HEADING,
                  width: 220,
                  flexShrink: 0,
                }}
              >
                {label}
              </Text>
              <Group gap="sm" align="center">
                <NumberInput
                  value={draft[key]}
                  onChange={(v) => handleChange(key, v)}
                  min={0}
                  hideControls
                  size="xs"
                  styles={{
                    input: {
                      width: 120,
                      fontFamily: HEADING,
                      fontSize: 12,
                      textAlign: 'right',
                    },
                  }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    color: MUTED,
                    fontFamily: HEADING,
                    width: 52,
                  }}
                >
                  {unit}
                </Text>
              </Group>
            </Box>
          ))}
        </Paper>

        {/* Footer actions */}
        <Group justify="flex-end" align="center" gap="sm">
          {saveError && (
            <Alert
              color="red"
              radius="sm"
              p="xs"
              styles={{ message: { fontSize: 12 } }}
            >
              {saveError}
            </Alert>
          )}
          {saved && (
            <Group gap={4}>
              <IconCheck size={13} color="var(--mantine-color-green-5)" />
              <Text
                style={{
                  fontSize: 12,
                  color: 'var(--mantine-color-green-5)',
                  fontFamily: HEADING,
                }}
              >
                Saved
              </Text>
            </Group>
          )}
          <Button
            onClick={() => mutation.mutate(draft)}
            disabled={!dirty || mutation.isPending}
            loading={mutation.isPending}
            size="sm"
            color="brand"
            style={{ fontFamily: HEADING }}
          >
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </Group>
      </Stack>
    </Box>
  );
}
