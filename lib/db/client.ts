import 'server-only';
import mysql, { type Pool } from 'mysql2/promise';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

declare global { var mariadbPool: Pool | undefined; }

// In serverless (Vercel), each function invocation may reuse a global pool if the
// execution context is warm. Keep connectionLimit low so we don't exhaust the DB
// server's connection cap (remote databases typically allow 25–100 connections).
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

// Support both DATABASE_URL and discrete DB_* environment variables
let dbHost = process.env.DB_HOST ?? '127.0.0.1';
let dbPort = Number(process.env.DB_PORT ?? 3306);
let dbUser = process.env.DB_USER ?? 'root';
let dbPassword = process.env.DB_PASSWORD ?? '';
let dbName = process.env.DB_NAME ?? 'aussi_clean';

if (process.env.DATABASE_URL) {
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    dbHost = parsed.hostname;
    dbPort = Number(parsed.port) || 3306;
    dbUser = decodeURIComponent(parsed.username);
    dbPassword = decodeURIComponent(parsed.password);
    dbName = parsed.pathname.replace(/^\//, '');
  } catch (err) {
    console.error('Failed to parse DATABASE_URL, falling back to discrete DB_* vars:', err);
  }
}

const isRemote = dbHost !== '127.0.0.1' && dbHost !== 'localhost';

// Build SSL config:
// - If DATABASE_CA_PATH env var is set, load that cert file.
// - Otherwise fall back to the bundled isrgrootx1.pem (Let's Encrypt / TiDB root CA).
// - Set DATABASE_SSL=false to disable SSL entirely.
function buildSslConfig(): object | false {
  if (process.env.DATABASE_SSL === 'false') return false;

  let ca: Buffer | undefined;
  const caPath = process.env.DATABASE_CA_PATH;
  if (caPath) {
    try { ca = readFileSync(caPath); } catch { /* ignore */ }
  }
  if (!ca) {
    const bundledPath = join(process.cwd(), 'isrgrootx1.pem');
    try { ca = readFileSync(bundledPath); } catch { /* not available */ }
  }

  return { rejectUnauthorized: true, ...(ca ? { ca } : {}) };
}

const sslConfig = buildSslConfig();

export const db = global.mariadbPool ?? mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  // Apply SSL automatically for remote DB hosts (like TiDB, Railway, AWS, etc.)
  ...(sslConfig !== false && isRemote ? { ssl: sslConfig } : {}),
  waitForConnections: true,
  connectionLimit: isServerless ? 3 : 10,
  connectTimeout: 15_000,
  timezone: 'Z',
});

// Persist pool across hot-reloads in development only.
if (process.env.NODE_ENV !== 'production') global.mariadbPool = db;

// SET GLOBAL requires SUPER privilege – only attempt on local dev and swallow any error.
if (!isServerless && !isRemote) {
  db.query('SET GLOBAL max_allowed_packet = 67108864').catch(() => {
    // Ignore permission errors if not root
  });
}
