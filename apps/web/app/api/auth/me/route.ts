import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest, getToken } from '@/lib/auth';
import { getAuthApi } from '@/lib/api';

export async function GET(req: NextRequest) {
  if (!(await verifyRequest(req)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const token = getToken(req);
  try {
    const { data } = await getAuthApi().get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}
