import { timingSafeEqual } from 'crypto';

/** Constant-time string compare; returns false on length mismatch without leaking. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // Still run a comparison against a same-length buffer to avoid early-return timing.
    timingSafeEqual(ab, Buffer.alloc(ab.length));
    return false;
  }
  return timingSafeEqual(ab, bb);
}
