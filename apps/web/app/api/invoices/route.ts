import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth';
import { getChainApi, resolveChain } from '@/lib/api';

export async function GET(req: NextRequest) {
  if (!(await verifyRequest(req)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;

  const chain = resolveChain(searchParams.get('chain'));
  const params = { ...Object.fromEntries(searchParams), chain };

  try {
    const { data } = await getChainApi(chain).get('/admin/invoices', {
      params,
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}
