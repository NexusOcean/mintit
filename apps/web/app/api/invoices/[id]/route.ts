import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth';
import { getChainApi, resolveChain } from '@/lib/api';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await verifyRequest(req)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = req.nextUrl;
  const chain = resolveChain(searchParams.get('chain'));

  try {
    const { data } = await getChainApi(chain).get(`/admin/invoices/${id}`, {
      params: { chain },
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}
