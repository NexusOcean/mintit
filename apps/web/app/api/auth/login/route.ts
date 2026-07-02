import { NextRequest, NextResponse } from 'next/server';
import { getAuthApi } from '@/lib/api';

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const { data } = await getAuthApi().post('/auth/login', body);
    const isProd = process.env.NODE_ENV === 'production';
    const res = NextResponse.json({ ok: true });
    res.cookies.set('admin_session', data.access_token, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24,
      secure: isProd,
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}
