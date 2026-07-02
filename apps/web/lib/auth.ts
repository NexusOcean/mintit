import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'admin_session';
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

export function getToken(req: NextRequest): string | null {
  return req.cookies.get(COOKIE_NAME)?.value ?? null;
}

export async function verifyRequest(req: NextRequest): Promise<boolean> {
  const token = getToken(req);
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set('admin_session', '', {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}
