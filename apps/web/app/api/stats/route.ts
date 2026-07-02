import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth';
import { getChainApi, resolveChain } from '@/lib/api';

export async function GET(req: NextRequest) {
  if (!(await verifyRequest(req)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const chain = resolveChain(req.nextUrl.searchParams.get('chain'));
  try {
    const { data } = await getChainApi(chain).get('/admin/stats', {
      params: { chain },
    });
    return NextResponse.json(data);
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}
