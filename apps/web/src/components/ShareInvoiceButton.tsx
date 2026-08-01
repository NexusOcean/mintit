import { useState } from 'react';
import { ActionIcon, Button, Tooltip } from '@mantine/core';
import { IconCheck, IconShare } from '@tabler/icons-react';
import { publicInvoiceUrl } from '@/src/lib/api';

async function shareInvoiceLink(
  publicId: string,
): Promise<'shared' | 'copied'> {
  const url = publicInvoiceUrl(publicId);

  if (navigator.share) {
    try {
      await navigator.share({ url, title: 'Invoice' });
      return 'shared';
    } catch {
      // user cancelled the share sheet — fall through to clipboard copy
    }
  }

  await navigator.clipboard.writeText(url);
  return 'copied';
}

export function ShareInvoiceIcon({ publicId }: { publicId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const result = await shareInvoiceLink(publicId);
    if (result === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Tooltip label={copied ? 'Link copied' : 'Share'} withArrow>
      <ActionIcon
        variant="subtle"
        color={copied ? 'teal' : 'gray'}
        size="md"
        aria-label="Share customer checkout link"
        onClick={handleClick}
      >
        {copied ? <IconCheck size={20} /> : <IconShare size={20} />}
      </ActionIcon>
    </Tooltip>
  );
}

export function ShareInvoiceButton({ publicId }: { publicId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const result = await shareInvoiceLink(publicId);
    if (result === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Button
      leftSection={copied ? <IconCheck size={16} /> : <IconShare size={16} />}
      variant="subtle"
      color={copied ? 'teal' : undefined}
      size="xs"
      onClick={handleClick}
    >
      {copied ? 'Link copied' : 'Share'}
    </Button>
  );
}
