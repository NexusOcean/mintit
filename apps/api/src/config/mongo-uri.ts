import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { randomBytes } from 'crypto';

const CREDS_DIR = process.env.MONGO_CREDS_DIR ?? '/app/data/mongo';
const USER_FILE = `${CREDS_DIR}/username`;
const PASS_FILE = `${CREDS_DIR}/password`;

const CREDS_WAIT_TIMEOUT_MS = 15_000;
const CREDS_POLL_INTERVAL_MS = 200;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const readCreds = (): { username: string; password: string } => ({
  username: readFileSync(USER_FILE, 'utf8').trim(),
  password: readFileSync(PASS_FILE, 'utf8').trim(),
});

// mint_db's own entrypoint (mongo-entrypoint.sh) is the source of truth for
// generating/persisting creds when self-hosting via the bundled container —
// it writes the shared creds file before mint_api needs it, but container
// start order isn't a guarantee the file exists yet, so poll briefly rather
// than racing to generate a second, disagreeing set of credentials.
const getOrCreateCreds = async (): Promise<{
  username: string;
  password: string;
}> => {
  const envUser = process.env.MONGO_USERNAME;
  const envPass = process.env.MONGO_PASSWORD;

  if (envUser && envPass) {
    mkdirSync(CREDS_DIR, { recursive: true });
    writeFileSync(USER_FILE, envUser, { mode: 0o600 });
    writeFileSync(PASS_FILE, envPass, { mode: 0o600 });
    return { username: envUser, password: envPass };
  }

  const deadline = Date.now() + CREDS_WAIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (existsSync(USER_FILE) && existsSync(PASS_FILE)) {
      return readCreds();
    }
    await sleep(CREDS_POLL_INTERVAL_MS);
  }

  // Nothing generated them (e.g. running outside compose) — generate once.
  const username = 'admin';
  const password = randomBytes(24).toString('hex');
  mkdirSync(CREDS_DIR, { recursive: true });
  writeFileSync(USER_FILE, username, { mode: 0o600 });
  writeFileSync(PASS_FILE, password, { mode: 0o600 });
  return { username, password };
};

export const getMongoUri = async (
  explicitUri: string | undefined,
): Promise<string> => {
  if (explicitUri) return explicitUri;

  const host = process.env.MONGO_HOST ?? 'mint_db';
  const { username, password } = await getOrCreateCreds();
  return `mongodb://${username}:${password}@${host}:27017/?authSource=admin`;
};
