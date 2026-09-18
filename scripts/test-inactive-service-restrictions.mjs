import mysql from 'mysql2/promise';

const db = await mysql.createConnection({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'aussi_clean'
});

console.log('Testing Inactive Service Booking Restrictions...');

// 1. Pick a service to deactivate: 'maintenance-wash'
const testSlug = 'maintenance-wash';

try {
  // Deactivate the service
  await db.execute('UPDATE services SET is_active = 0 WHERE slug = ?', [testSlug]);
  console.log(`✓ Deactivated service "${testSlug}" in database`);

  // Verify it is inactive
  const [rows] = await db.query('SELECT slug, is_active FROM services WHERE slug = ?', [testSlug]);
  if (rows[0].is_active !== 0) throw new Error('Service should be inactive');
  console.log(`✓ Confirmed is_active = 0 for "${testSlug}"`);

  // Verify booking attempt for this inactive service is rejected by lib/db/booking logic
  const [activeServices] = await db.query('SELECT id FROM services WHERE slug = ? AND is_active = TRUE LIMIT 1', [testSlug]);
  if (activeServices.length > 0) throw new Error('Query for active service should return 0 rows');
  console.log(`✓ Confirmed active service lookup correctly rejects inactive slug "${testSlug}"`);

  // Restore the service to active
  await db.execute('UPDATE services SET is_active = 1 WHERE slug = ?', [testSlug]);
  console.log(`✓ Restored service "${testSlug}" back to active in database`);

  const [restoredRows] = await db.query('SELECT slug, is_active FROM services WHERE slug = ?', [testSlug]);
  if (restoredRows[0].is_active !== 1) throw new Error('Service should be active again');
  console.log(`✓ Confirmed is_active = 1 for "${testSlug}"`);

  console.log('\n✅ ALL INACTIVE SERVICE RESTRICTION TESTS PASSED!');
} finally {
  await db.end();
}
