import { NextRequest, NextResponse } from 'next/server';
import { getAuthApi } from '@/lib/api';

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const { data } = await getAuthApi().post('/auth/register', body);
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
  } catch (err) {
    const status =
      (err as { response?: { status?: number } })?.response?.status ?? 502;
    const message =
      (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ?? 'Registration failed';
    return NextResponse.json({ error: message }, { status });
  }
}
