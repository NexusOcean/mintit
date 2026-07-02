import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth';
import { getChainApi, resolveChain } from '@/lib/api';

export async function GET(req: NextRequest) {
  if (!(await verifyRequest(req)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const chain = resolveChain(req.nextUrl.searchParams.get('chain'));
  try {
    const { data } = await getChainApi(chain).get('/admin/wallet', {
      params: { chain },
    });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyRequest(req)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const chain = resolveChain(req.nextUrl.searchParams.get('chain'));
  try {
    const body = await req.json();
    const { data } = await getChainApi(chain).post('/admin/payout', body);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Payout BFF error:', err);
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}
