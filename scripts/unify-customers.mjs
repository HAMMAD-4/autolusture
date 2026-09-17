import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'aussi_clean'
};

async function migrateCustomers() {
  const c = await mysql.createConnection(config);
  console.log('--- UNIFYING CUSTOMERS BY EMAIL & PHONE ---');

  // 1. Find all duplicates by email
  const [dups] = await c.query(
    `SELECT email, COUNT(*) as cnt, MIN(id) as primary_id
     FROM customers
     GROUP BY email
     HAVING cnt > 1`
  );

  for (const dup of dups) {
    console.log(`Merging duplicates for email: ${dup.email} into primary ID: ${dup.primary_id}`);
    const [others] = await c.query(
      `SELECT id FROM customers WHERE email = ? AND id <> ?`,
      [dup.email, dup.primary_id]
    );

    for (const other of others) {
      // Re-point bookings
      await c.query(`UPDATE bookings SET customer_id = ? WHERE customer_id = ?`, [dup.primary_id, other.id]);
      // Re-point vehicles
      await c.query(`UPDATE vehicles SET customer_id = ? WHERE customer_id = ?`, [dup.primary_id, other.id]);
      // Delete duplicate customer record
      await c.query(`DELETE FROM customers WHERE id = ?`, [other.id]);
      console.log(`Merged and deleted duplicate customer id: ${other.id}`);
    }
  }

  // 2. Drop old composite unique key if exists, and add email unique key
  try {
    await c.query(`ALTER TABLE customers DROP INDEX customers_email_phone_uq`);
    console.log('Dropped old composite key customers_email_phone_uq');
  } catch (e) {
    console.log('Old composite key notice:', e.message);
  }

  try {
    await c.query(`ALTER TABLE customers ADD UNIQUE KEY customers_email_uq (email)`);
    console.log('Added unique key customers_email_uq on email');
  } catch (e) {
    if (e.code === 'ER_DUP_KEYNAME') console.log('customers_email_uq already exists');
    else console.error('Error adding unique key:', e.message);
  }

  // Verify all bookings now
  const [bRows] = await c.query(
    `SELECT b.reference_code, c.full_name, c.email, c.phone, b.scheduled_at
     FROM bookings b
     JOIN customers c ON c.id = b.customer_id`
  );
  console.log('Current Bookings & Unified Customers:');
  console.table(bRows);

  await c.end();
  console.log('--- CUSTOMER UNIFICATION MIGRATION COMPLETE ---');
}

migrateCustomers().catch(console.error);
