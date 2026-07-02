import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth';
import { getAuthApi } from '@/lib/api';

export async function GET(req: NextRequest) {
  if (!(await verifyRequest(req)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data } = await getAuthApi().get('/admin/firo/backup', {
      responseType: 'arraybuffer',
    });

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="wallet.dat"',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}
