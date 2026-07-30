import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';

const SECRET_PATH = process.env.JWT_SECRET_PATH ?? '/app/data/jwt/secret';

// No JWT_SECRET env var by design: this is a self-hosted, cloneable
// codebase, so a value baked into source or .env.example would be
// identical (and known) across every deployment that forgets to change
// it. Generating and persisting one per-instance avoids that entirely.
export const getOrCreateJwtSecret = (): string => {
  if (existsSync(SECRET_PATH)) {
    return readFileSync(SECRET_PATH, 'utf8').trim();
  }

  const secret = randomBytes(48).toString('hex');
  mkdirSync(dirname(SECRET_PATH), { recursive: true });
  writeFileSync(SECRET_PATH, secret, { mode: 0o600 });
  return secret;
};
