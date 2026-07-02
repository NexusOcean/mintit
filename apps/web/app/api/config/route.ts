import { NextResponse } from 'next/server';
import { mintApi } from '@/lib/api';

export async function GET() {
  try {
    const { data } = await mintApi.get('/chains');
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}
