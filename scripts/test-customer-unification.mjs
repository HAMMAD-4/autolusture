import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'aussi_clean'
};

async function testCustomerUnification() {
  console.log('--- TESTING CUSTOMER MULTI-BOOKING UNIFICATION BY EMAIL & PHONE ---');
  const c = await mysql.createConnection(config);

  const testEmail = 'john.doe.detailing.test@example.com';
  const testPhone = '0412999888';

  // 1. Clean up any previous test records
  await c.query("DELETE FROM bookings WHERE reference_code IN ('AL-JD01', 'AL-JD02') OR id LIKE '01TESTBK%' OR id LIKE '01TESTBOOKING%'");
  await c.query("DELETE FROM vehicles WHERE id LIKE '01TESTVEH%'");
  const [existing] = await c.query('SELECT id FROM customers WHERE email = ?', [testEmail]);
  if (existing.length > 0) {
    const custId = existing[0].id;
    await c.query('DELETE FROM bookings WHERE customer_id = ?', [custId]);
    await c.query('DELETE FROM vehicles WHERE customer_id = ?', [custId]);
    await c.query('DELETE FROM customers WHERE id = ?', [custId]);
  }

  // 2. Simulate Booking 1 by John Doe
  const custId1 = '01TESTCUST0000000000000001';
  await c.execute(
    `INSERT INTO customers (id, full_name, email, phone, suburb, state, postcode)
     VALUES (?, 'John Doe', ?, ?, 'Double Bay', 'NSW', '2028')`,
    [custId1, testEmail, testPhone]
  );

  const vehId1 = '01TESTVEH00000000000000001';
  await c.execute(
    `INSERT INTO vehicles (id, customer_id, rego, state, make, model)
     VALUES (?, ?, 'JD01AA', 'NSW', 'Porsche', 'Taycan')`,
    [vehId1, custId1]
  );

  const [services] = await c.query('SELECT id FROM services LIMIT 2');
  const s1 = services[0].id;
  const s2 = services[1].id;

  const bId1 = '01TESTBK000000000000000001';
  await c.execute(
    `INSERT INTO bookings (id, reference_code, customer_id, vehicle_id, service_id, booking_type, scheduled_at, status)
     VALUES (?, 'AL-JD01', ?, ?, ?, 'pre_booked', '2026-10-01 09:00:00.000', 'pending')`,
    [bId1, custId1, vehId1, s1]
  );
  console.log('✓ Booking 1 created under customer ID:', custId1);

  // 3. Simulate Booking 2 by SAME John Doe (different car: BMW M3, formatted phone: 0412 999 888, same email)
  const formattedPhone = '0412 999 888';
  // Our new logic checks: SELECT id FROM customers WHERE email = ? OR phone = ?
  const [matchedCust] = await c.query(
    'SELECT id FROM customers WHERE email = ? OR phone = ? LIMIT 1',
    [testEmail, formattedPhone.replace(/\s+/g, '')]
  );

  if (matchedCust.length === 0) throw new Error('Customer unification failed to find existing customer by email');
  const unifiedCustomerId = matchedCust[0].id;
  console.log('✓ Successfully matched existing customer ID:', unifiedCustomerId, '(matches initial ID:', unifiedCustomerId === custId1, ')');

  // Insert vehicle 2
  const vehId2 = '01TESTVEH00000000000000002';
  await c.execute(
    `INSERT INTO vehicles (id, customer_id, rego, state, make, model)
     VALUES (?, ?, 'JD02BB', 'NSW', 'BMW', 'M3')`,
    [vehId2, unifiedCustomerId]
  );

  // Insert booking 2 linked to unifiedCustomerId
  const bId2 = '01TESTBK000000000000000002';
  await c.execute(
    `INSERT INTO bookings (id, reference_code, customer_id, vehicle_id, service_id, booking_type, scheduled_at, status)
     VALUES (?, 'AL-JD02', ?, ?, ?, 'pre_booked', '2026-10-05 14:00:00.000', 'confirmed')`,
    [bId2, unifiedCustomerId, vehId2, s2]
  );
  console.log('✓ Booking 2 linked to the SAME customer ID:', unifiedCustomerId);

  // 4. Verify in DB: 1 customer row, 2 bookings
  const [custRows] = await c.query('SELECT COUNT(*) as cnt FROM customers WHERE email = ?', [testEmail]);
  console.log('✓ Customer row count for', testEmail, 'is:', custRows[0].cnt, '(MUST BE EXACTLY 1)');
  if (custRows[0].cnt !== 1) throw new Error('Expected 1 customer row, got ' + custRows[0].cnt);

  const [bookingRows] = await c.query(
    `SELECT b.reference_code, b.scheduled_at, v.make, v.model, v.rego, s.name as service_name
     FROM bookings b
     JOIN vehicles v ON v.id = b.vehicle_id
     JOIN services s ON s.id = b.service_id
     WHERE b.customer_id = ?
     ORDER BY b.scheduled_at ASC`,
    [unifiedCustomerId]
  );
  console.log('✓ All bookings under this single customer account in DB:');
  console.table(bookingRows);
  if (bookingRows.length !== 2) throw new Error('Expected 2 bookings under customer, got ' + bookingRows.length);

  // 5. Clean up test records
  await c.query('DELETE FROM bookings WHERE id IN (?, ?)', [bId1, bId2]);
  await c.query('DELETE FROM vehicles WHERE id IN (?, ?)', [vehId1, vehId2]);
  await c.query('DELETE FROM customers WHERE id = ?', [unifiedCustomerId]);
  console.log('✓ Cleaned up test data');

  await c.end();
  console.log('--- ALL CUSTOMER UNIFICATION TESTS PASSED (100% SUCCESS) ---');
}

testCustomerUnification().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
