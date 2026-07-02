import { NextRequest, NextResponse } from 'next/server';
import { getAuthApi } from '@/lib/api';

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const { data } = await getAuthApi().post('/auth/setup', body);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}
