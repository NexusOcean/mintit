import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest, getToken } from '@/lib/auth';
import { getAuthApi } from '@/lib/api';

export async function PATCH(req: NextRequest) {
  if (!(await verifyRequest(req)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const token = getToken(req);
  const body = await req.json();
  try {
    const { data } = await getAuthApi().patch('/auth/update', body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.log(err);
    const status =
      (err as { response?: { status?: number } })?.response?.status ?? 502;
    return NextResponse.json({ error: 'Request failed' }, { status });
  }
}
