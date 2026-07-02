import { NextResponse } from 'next/server';
import { getAuthApi } from '@/lib/api';

export async function GET() {
  try {
    const { data } = await getAuthApi().get('/auth/status');

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}
