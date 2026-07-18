import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ActionIcon,
  Group,
  Modal,
  Paper,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconEye,
  IconSearch,
} from '@tabler/icons-react';
import {
  api,
  InvoiceStatus,
  type Invoice,
  type InvoiceListResponse,
} from '@/src/lib/api';
import { useChain } from '@/src/lib/chain-context';
import { CARD_BORDER, HEADING, MUTED, PRIMARY } from '@/src/lib/theme';
import {
  InvoiceDetail,
  STATUS_COLORS,
  StatusBadge,
  fmt,
  formatAtomic,
} from '@/src/components/invoice-detail';

const STATUSES: InvoiceStatus[] = [
  InvoiceStatus.Pending,
  InvoiceStatus.Seen,
  InvoiceStatus.Confirmed,
  InvoiceStatus.Underpaid,
  InvoiceStatus.Expired,
  InvoiceStatus.Cancelled,
];

const LIMIT = 20;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function fetchInvoices(
  chain: string,
  status: string | null,
  page: number,
  publicId?: string,
): Promise<InvoiceListResponse> {
  const { data } = await api.get('/admin/invoices', {
    params: publicId
      ? { publicId, page, limit: LIMIT }
      : { chain, ...(status ? { status } : {}), page, limit: LIMIT },
  });
  return data;
}

export default function InvoicesPage() {
  const { chain } = useChain();
  const [status, setStatus] = useState<InvoiceStatus | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [detailOpened, { open: openDetail, close: closeDetail }] =
    useDisclosure(false);

  const publicId = UUID_RE.test(search.trim()) ? search.trim() : undefined;
  const searching = search.trim().length > 0;

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', chain, status, page, publicId],
    queryFn: () => fetchInvoices(chain, status, page, publicId),
    refetchInterval: 60_000,
    enabled: !!chain && (!searching || !!publicId),
  });

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  function handleStatusFilter(s: InvoiceStatus) {
    setStatus((prev) => (prev === s ? null : s));
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handlePreview(inv: Invoice) {
    setSelected(inv);
    openDetail();
  }

  return (
    <Stack gap="xl">
      {/* Header */}
      <Title
        order={2}
        style={{ fontFamily: HEADING, letterSpacing: '-0.02em' }}
      >
        Invoices
      </Title>

      <TextInput
        placeholder="Search by public ID"
        leftSection={<IconSearch size={14} />}
        value={search}
        onChange={(e) => handleSearchChange(e.currentTarget.value)}
        minLength={36}
        maxLength={36}
        error={searching && !publicId ? 'Invalid public ID' : undefined}
        styles={{ input: { fontFamily: HEADING, fontSize: 13 } }}
      />

      {/* Status filters */}
      <Group gap="xs" style={{ opacity: searching ? 0.4 : 1 }}>
        {STATUSES.map((s) => {
          const active = status === s;
          const sc = STATUS_COLORS[s];
          return (
            <UnstyledButton
              key={s}
              disabled={searching}
              onClick={() => handleStatusFilter(s)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: HEADING,
                padding: '4px 12px',
                borderRadius: 99,
                border: `1px solid ${active ? sc.border : 'var(--mantine-color-dark-4)'}`,
                color: active ? sc.color : MUTED,
                background: active ? sc.bg : 'transparent',
                transition: 'all 150ms ease',
                cursor: searching ? 'not-allowed' : 'pointer',
              }}
            >
              {s}
            </UnstyledButton>
          );
        })}
      </Group>

      {/* Table */}
      <Paper
        radius="sm"
        style={{
          background: 'var(--mantine-color-dark-7)',
          border: `1px solid var(--mantine-color-dark-5)`,
          overflow: 'hidden',
        }}
      >
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr
              style={{ borderBottom: `1px solid var(--mantine-color-dark-5)` }}
            >
              {['ID', 'Amount', 'Status', 'Created', 'Expires', ''].map(
                (h, i) => (
                  <Table.Th
                    key={i}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: MUTED,
                      fontFamily: HEADING,
                      padding: '12px 16px',
                      borderBottom: 'none',
                    }}
                  >
                    {h}
                  </Table.Th>
                ),
              )}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Table.Tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Table.Td key={j} style={{ padding: '14px 16px' }}>
                      <Skeleton
                        height={12}
                        width={`${60 + (((i + j) * 7) % 30)}%`}
                        radius="sm"
                      />
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : data?.data.length === 0 ? (
              <Table.Tr>
                <Table.Td
                  colSpan={6}
                  style={{ padding: '40px 16px', textAlign: 'center' }}
                >
                  <Text size="sm" c="dimmed">
                    No invoices found
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              data?.data.map((inv) => (
                <Table.Tr key={inv.id}>
                  <Table.Td style={{ padding: '14px 16px' }}>
                    <Text
                      style={{
                        fontFamily: HEADING,
                        fontSize: 12,
                        color: MUTED,
                      }}
                    >
                      …{inv.publicId.slice(-8)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ padding: '14px 16px' }}>
                    <Group gap={8}>
                      <Text size="sm" fw={600}>
                        {formatAtomic(
                          inv.amountAtomic,
                          inv.assetDecimals,
                          inv.asset,
                        )}
                      </Text>
                      <Text style={{ fontSize: 11, color: MUTED }}>
                        {inv.amountFiat.toFixed(2)} {inv.fiatCurrency}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={inv.status} />
                  </Table.Td>
                  <Table.Td style={{ padding: '14px 16px' }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: MUTED,
                        fontFamily: HEADING,
                      }}
                    >
                      {fmt(inv.createdAt)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ padding: '14px 16px' }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: MUTED,
                        fontFamily: HEADING,
                      }}
                    >
                      {fmt(inv.expiresAt)}
                    </Text>
                  </Table.Td>
                  <Table.Td
                    style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}
                  >
                    <Group gap={16} justify="flex-end" wrap="nowrap">
                      <ActionIcon
                        color="gray"
                        size="md"
                        aria-label="Preview"
                        onClick={() => handlePreview(inv)}
                      >
                        <IconEye size={22} />
                      </ActionIcon>
                      <ActionIcon
                        component={Link}
                        to={`/invoices/${inv.publicId}`}
                        variant="secondary"
                        color="gray"
                        size="md"
                        aria-label="Open"
                      >
                        <IconExternalLink size={22} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Pagination */}
      <Group justify="space-between">
        <Text style={{ fontSize: 12, color: MUTED, fontFamily: HEADING }}>
          {data ? `${data.total} total` : '—'}
        </Text>
        <Group gap={8}>
          <UnstyledButton
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              color: page === 1 ? 'var(--mantine-color-dark-3)' : MUTED,
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <IconChevronLeft size={16} />
          </UnstyledButton>
          <Text style={{ fontSize: 12, color: MUTED, fontFamily: HEADING }}>
            Page {page} of {totalPages}
          </Text>
          <UnstyledButton
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              color:
                page === totalPages ? 'var(--mantine-color-dark-3)' : MUTED,
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <IconChevronRight size={16} />
          </UnstyledButton>
        </Group>
      </Group>

      {/* Invoice detail modal */}
      <Modal
        opened={detailOpened}
        onClose={closeDetail}
        title={
          <Text
            style={{
              fontFamily: HEADING,
              fontSize: 16,
              fontWeight: 600,
              color: PRIMARY,
            }}
          >
            {'// Invoice Detail'}
          </Text>
        }
        size="lg"
        radius="sm"
        styles={{
          content: {
            background: 'var(--mantine-color-dark-7)',
            border: `1px solid ${CARD_BORDER}`,
          },
          header: {
            background: 'var(--mantine-color-dark-7)',
            borderBottom: `1px solid var(--mantine-color-dark-5)`,
          },
        }}
      >
        {selected && <InvoiceDetail invoice={selected} />}
      </Modal>
    </Stack>
  );
}
