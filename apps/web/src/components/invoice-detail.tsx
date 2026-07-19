import { Group, Stack, Text } from '@mantine/core';
import type { Invoice, InvoiceStatus } from '@/src/lib/api';
import { HEADING, MUTED, PRIMARY } from '@/src/lib/theme';

export const STATUS_COLORS: Record<
  InvoiceStatus,
  { color: string; bg: string; border: string }
> = {
  pending: {
    color: 'var(--mantine-color-dark-1)',
    bg: 'var(--mantine-color-dark-5)',
    border: 'var(--mantine-color-dark-4)',
  },
  seen: {
    color: '#93c5fd',
    bg: 'rgba(96,165,250,0.1)',
    border: 'rgba(96,165,250,0.25)',
  },
  confirmed: { color: PRIMARY, bg: `${PRIMARY}11`, border: `${PRIMARY}33` },
  underpaid: {
    color: '#fcd34d',
    bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.25)',
  },
  expired: {
    color: 'var(--mantine-color-dark-2)',
    bg: 'var(--mantine-color-dark-6)',
    border: 'var(--mantine-color-dark-4)',
  },
  cancelled: {
    color: '#f87171',
    bg: 'rgba(248,113,113,0.1)',
    border: 'rgba(248,113,113,0.25)',
  },
};

export function formatAtomic(
  atomic: string,
  decimals: number,
  ticker: string,
): string {
  const divisor = Math.pow(10, decimals);
  const val = (Number(atomic) / divisor)
    .toFixed(decimals)
    .replace(/\.?0+$/, '');
  return `${val} ${ticker.toUpperCase()}`;
}

export function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const s = STATUS_COLORS[status];
  return (
    <Text
      style={{
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 4,
        padding: '2px 8px',
        fontFamily: HEADING,
      }}
    >
      {status}
    </Text>
  );
}

export function InvoiceDetail({ invoice }: { invoice: Invoice }) {
  const ticker = invoice.asset.toUpperCase();

  const rows: [string, string][] = [
    ['ID', invoice.id],
    ['Public ID', invoice.publicId],
    ['Chain', invoice.chain.toUpperCase()],
    ['Address', invoice.address],
    [
      'Amount',
      formatAtomic(invoice.amountAtomic, invoice.assetDecimals, ticker),
    ],
    [
      'Received',
      formatAtomic(invoice.receivedAtomic, invoice.assetDecimals, ticker),
    ],
    [
      'Amount (Fiat)',
      `${invoice.amountFiat.toFixed(2)} ${invoice.fiatCurrency}`,
    ],
    ['Rate', `${invoice.rate.toFixed(6)} ${ticker}/${invoice.fiatCurrency}`],
    ['Status', invoice.status],
    [
      'Confirmations',
      `${invoice.confirmations} / ${invoice.confirmationsRequired}`,
    ],
    ['Created', fmt(invoice.createdAt)],
    ['Expires', fmt(invoice.expiresAt)],
    ...(invoice.memo ? [['Memo', invoice.memo] as [string, string]] : []),
    ...(invoice.firstSeenAt
      ? [['First Seen', fmt(invoice.firstSeenAt)] as [string, string]]
      : []),
    ...(invoice.paidAt
      ? [['Paid', fmt(invoice.paidAt)] as [string, string]]
      : []),
    ...(invoice.chainData?.txHash
      ? [['Tx Hash', String(invoice.chainData.txHash)] as [string, string]]
      : []),
  ];

  return (
    <Stack gap={0}>
      {rows.map(([label, value]) => (
        <Group
          key={label}
          gap="md"
          py="xs"
          style={{ borderBottom: `1px solid var(--mantine-color-dark-5)` }}
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
              width: 120,
              flexShrink: 0,
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: HEADING,
              color: 'var(--mantine-color-dark-0)',
              wordBreak: 'break-all',
            }}
          >
            {value}
          </Text>
        </Group>
      ))}
    </Stack>
  );
}
