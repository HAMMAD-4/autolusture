import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'aussi_clean'
};

const c = await mysql.createConnection(config);

try {
  const [cols] = await c.query(`SHOW COLUMNS FROM receipt_settings LIKE 'tax_mode'`);
  if (cols.length === 0) {
    await c.query(`ALTER TABLE receipt_settings
      ADD COLUMN tax_mode VARCHAR(20) NOT NULL DEFAULT 'inclusive',
      ADD COLUMN tax_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
      ADD COLUMN tax_rate DECIMAL(10,2) NOT NULL DEFAULT 10.00,
      ADD COLUMN tax_label VARCHAR(40) NOT NULL DEFAULT 'GST'
    `);
    console.log('Added tax calculation columns to receipt_settings');
  } else {
    console.log('tax_mode already exists in receipt_settings');
  }
} catch (err) {
  console.error('Migration error:', err);
} finally {
  await c.end();
}
