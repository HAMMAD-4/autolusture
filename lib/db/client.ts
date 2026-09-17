import 'server-only';
import mysql, { type Pool } from 'mysql2/promise';

declare global { var mariadbPool: Pool | undefined; }

export const db = global.mariadbPool ?? mysql.createPool({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'aussi_clean',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z'
});
if (process.env.NODE_ENV !== 'production') global.mariadbPool = db;

// Ensure MySQL max_allowed_packet allows high-resolution photos and rich documents (64MB)
db.query('SET GLOBAL max_allowed_packet = 67108864').catch(() => {
  // Ignore permission errors if not root
});
