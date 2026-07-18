import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  Anchor,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { api, type Invoice } from '@/src/lib/api';
import { InvoiceDetail } from '@/src/components/invoice-detail';
import { CARD_BORDER, HEADING, MUTED, PRIMARY } from '@/src/lib/theme';

async function fetchInvoice(publicId: string): Promise<Invoice> {
  const { data } = await api.get(`/admin/invoices/${publicId}`);
  return data;
}

export default function InvoiceDetailPage() {
  const { publicId } = useParams<{ publicId: string }>();

  const {
    data: invoice,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['invoice', publicId],
    queryFn: () => fetchInvoice(publicId!),
    enabled: !!publicId,
  });

  const metadataEntries = invoice?.metadata
    ? Object.entries(invoice.metadata)
    : [];

  return (
    <Stack gap="xl">
      <Anchor
        component={Link}
        to="/invoices"
        style={{
          color: MUTED,
          fontSize: 12,
          fontFamily: HEADING,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          width: 'fit-content',
        }}
      >
        <IconArrowLeft size={14} />
        Back to invoices
      </Anchor>

      <Title
        order={2}
        style={{ fontFamily: HEADING, letterSpacing: '-0.02em' }}
      >
        Invoice
      </Title>

      {isLoading && (
        <Stack gap="xs">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height={28} radius="sm" />
          ))}
        </Stack>
      )}

      {isError && (
        <Text size="sm" c="dimmed">
          Failed to load invoice.
        </Text>
      )}

      {invoice && (
        <>
          <Paper
            radius="sm"
            p="md"
            style={{
              background: 'var(--mantine-color-dark-7)',
              border: `1px solid ${CARD_BORDER}`,
            }}
          >
            <InvoiceDetail invoice={invoice} />
          </Paper>

          {metadataEntries.length > 0 && (
            <Stack gap="sm">
              <Text
                style={{
                  fontFamily: HEADING,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: PRIMARY,
                }}
              >
                {'// Metadata'}
              </Text>
              <Paper
                radius="sm"
                p="md"
                style={{
                  background: 'var(--mantine-color-dark-7)',
                  border: `1px solid ${CARD_BORDER}`,
                }}
              >
                <Stack gap={0}>
                  {metadataEntries.map(([key, value]) => (
                    <Group
                      key={key}
                      gap="md"
                      py="xs"
                      style={{
                        borderBottom: `1px solid var(--mantine-color-dark-5)`,
                      }}
                      wrap="nowrap"
                      align="flex-start"
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: MUTED,
                          fontFamily: HEADING,
                          width: 160,
                          flexShrink: 0,
                          wordBreak: 'break-all',
                        }}
                      >
                        {key}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: HEADING,
                          color: 'var(--mantine-color-dark-0)',
                          wordBreak: 'break-all',
                        }}
                      >
                        {typeof value === 'string'
                          ? value
                          : JSON.stringify(value)}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
