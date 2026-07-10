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
import { api } from '@/lib/api';
import {
  type SettingsDto as Settings,
  type GlobalSettingsDto as GlobalSettings,
} from '@mintit/types';
import { useChain } from '@/lib/chain-context';
import { HEADING, MUTED } from '@/lib/theme';

const CHAIN_FIELDS: { key: keyof Settings; label: string; unit: string }[] = [
  { key: 'confirmationDepth', label: 'Confirmation Depth', unit: 'blocks' },
  {
    key: 'invoiceDefaultExpirySec',
    label: 'Invoice Default Expiry',
    unit: 'seconds',
  },
  { key: 'invoiceMaxExpirySec', label: 'Invoice Max Expiry', unit: 'seconds' },
  { key: 'scannerLockTtlMs', label: 'Scanner Lock TTL', unit: 'ms' },
  { key: 'syncedThresholdBlocks', label: 'Sync Threshold', unit: 'blocks' },
];

const GLOBAL_FIELDS: {
  key: keyof GlobalSettings;
  label: string;
  unit: string;
}[] = [
  { key: 'rateCacheTtlMs', label: 'Rate Cache TTL', unit: 'ms' },
  { key: 'webhookMaxAttempts', label: 'Webhook Max Attempts', unit: 'retries' },
  { key: 'webhookTimeoutMs', label: 'Webhook Timeout', unit: 'ms' },
  {
    key: 'webhookDispatchIntervalMs',
    label: 'Webhook Dispatch Interval',
    unit: 'ms',
  },
];

function fetchSettings(chain: string): Promise<Settings> {
  return api.get('/settings', { params: { chain } }).then((r) => r.data);
}

function fetchGlobalSettings(): Promise<GlobalSettings> {
  return api.get('/settings/global').then((r) => r.data);
}

function FieldList({
  fields,
  draft,
  onChange,
}: {
  fields: { key: string; label: string; unit: string }[];
  draft: Record<string, number>;
  onChange: (key: string, value: string | number) => void;
}) {
  return (
    <Paper
      radius="sm"
      style={{
        background: 'var(--mantine-color-dark-7)',
        border: `1px solid var(--mantine-color-dark-5)`,
        overflow: 'hidden',
      }}
    >
      {fields.map(({ key, label, unit }, i) => (
        <Box
          key={String(key)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
            borderBottom:
              i < fields.length - 1
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
              onChange={(v) => onChange(key, v)}
              min={0}
              hideControls
              size="xs"
              styles={{
                input: {
                  width: 120,
                  fontFamily: HEADING,
                  fontSize: 13,
                  textAlign: 'right',
                },
              }}
            />
            <Text
              style={{
                fontSize: 13,
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
  );
}

function SaveRow({
  dirty,
  isPending,
  saved,
  saveError,
  onSave,
}: {
  dirty: boolean;
  isPending: boolean;
  saved: boolean;
  saveError: string | null;
  onSave: () => void;
}) {
  return (
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
        onClick={onSave}
        disabled={!dirty || isPending}
        loading={isPending}
        size="sm"
        color="brand"
        style={{ fontFamily: HEADING }}
      >
        {isPending ? 'Saving…' : 'Save'}
      </Button>
    </Group>
  );
}

export default function SettingsPage() {
  const { chain } = useChain();
  const queryClient = useQueryClient();

  const { data: chainData, isLoading: chainLoading } = useQuery({
    queryKey: ['settings', chain],
    queryFn: () => fetchSettings(chain),
  });

  const { data: globalData, isLoading: globalLoading } = useQuery({
    queryKey: ['settings', 'global'],
    queryFn: fetchGlobalSettings,
  });

  const [chainDraft, setChainDraft] = useState<Settings | null>(null);
  const [globalDraft, setGlobalDraft] = useState<GlobalSettings | null>(null);

  const [chainSaved, setChainSaved] = useState(false);
  const [globalSaved, setGlobalSaved] = useState(false);
  const [chainError, setChainError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChainDraft(chainData ?? null);
  }, [chainData]);

  useEffect(() => {
    if (chainData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGlobalDraft({
        rateCacheTtlMs: chainData.rateCacheTtlMs,
        webhookMaxAttempts: chainData.webhookMaxAttempts,
        webhookTimeoutMs: chainData.webhookTimeoutMs,
        webhookDispatchIntervalMs: chainData.webhookDispatchIntervalMs,
      });
    }
  }, [chainData]);

  const chainMutation = useMutation({
    mutationFn: (values: Settings) =>
      api.put('/settings', values, { params: { chain } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', chain] });
      setChainSaved(true);
      setChainError(null);
      setTimeout(() => setChainSaved(false), 2000);
    },
    onError: (err) => {
      setChainError(
        isAxiosError(err)
          ? (err.response?.data?.message ?? 'Failed to save')
          : 'Failed to save',
      );
    },
  });

  const globalMutation = useMutation({
    mutationFn: (values: GlobalSettings) => api.put('/settings/global', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'global'] });
      setGlobalSaved(true);
      setGlobalError(null);
      setTimeout(() => setGlobalSaved(false), 2000);
    },
    onError: (err) => {
      setGlobalError(
        isAxiosError(err)
          ? (err.response?.data?.message ?? 'Failed to save')
          : 'Failed to save',
      );
    },
  });

  function handleChainChange(key: keyof Settings, value: string | number) {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(num)) return;
    setChainDraft((prev) => (prev ? { ...prev, [key]: num } : prev));
  }

  function handleGlobalChange(
    key: keyof GlobalSettings,
    value: string | number,
  ) {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(num)) return;
    setGlobalDraft((prev) => (prev ? { ...prev, [key]: num } : prev));
  }

  if (chainLoading || globalLoading || !chainDraft || !globalDraft) {
    return (
      <Stack gap="xl">
        <Skeleton height={28} width={160} radius="sm" />
        <Skeleton height={320} radius="sm" />
        <Skeleton height={200} radius="sm" />
      </Stack>
    );
  }

  const chainDirty = JSON.stringify(chainDraft) !== JSON.stringify(chainData);
  const globalDirty =
    JSON.stringify(globalDraft) !== JSON.stringify(globalData);

  return (
    <Box maw={640}>
      <Stack gap="sm">
        <Title
          order={3}
          style={{ fontFamily: HEADING, letterSpacing: '-0.02em' }}
        >
          {chain.toUpperCase()} Settings
        </Title>

        {/* Chain settings */}
        <FieldList
          fields={
            CHAIN_FIELDS as { key: string; label: string; unit: string }[]
          }
          draft={chainDraft as unknown as Record<string, number>}
          onChange={(k, v) => handleChainChange(k as keyof Settings, v)}
        />
        <SaveRow
          dirty={chainDirty}
          isPending={chainMutation.isPending}
          saved={chainSaved}
          saveError={chainError}
          onSave={() => chainMutation.mutate(chainDraft)}
        />

        {/* Global settings */}
        <Title
          order={3}
          style={{ fontFamily: HEADING, letterSpacing: '-0.02em' }}
        >
          Global Settings
        </Title>
        <FieldList
          fields={
            GLOBAL_FIELDS as { key: string; label: string; unit: string }[]
          }
          draft={globalDraft as unknown as Record<string, number>}
          onChange={(k, v) => handleGlobalChange(k as keyof GlobalSettings, v)}
        />
        <SaveRow
          dirty={globalDirty}
          isPending={globalMutation.isPending}
          saved={globalSaved}
          saveError={globalError}
          onSave={() => globalMutation.mutate(globalDraft)}
        />
      </Stack>
    </Box>
  );
}
