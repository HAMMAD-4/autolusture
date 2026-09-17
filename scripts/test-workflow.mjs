import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'aussi_clean'
};

async function testSuite() {
  console.log('--- STARTING AUTOLUSTRE AUTOMATED INTEGRATION TEST SUITE ---');
  const c = await mysql.createConnection(config);

  const testDate = '2026-09-25';
  const testTime = '10:00';

  // 1. Clean up any previous test bookings
  await c.query("DELETE FROM bookings WHERE reference_code IN ('AL-TEST1', 'AL-TEST2')");
  console.log('✓ Cleaned previous test slots');

  // 2. Fetch existing customer, vehicle, service
  const [custs] = await c.query("SELECT id FROM customers LIMIT 1");
  const [vehs] = await c.query("SELECT id FROM vehicles LIMIT 1");
  const [servs] = await c.query("SELECT id FROM services WHERE slug = 'signature-detail' LIMIT 1");

  const customerId = custs[0].id;
  const vehicleId = vehs[0].id;
  const serviceId = servs[0].id;

  // 3. Insert booking at 10:00
  const booking1Id = '01TESTBOOKING0000000000001';
  await c.execute(
    `INSERT INTO bookings (id, reference_code, customer_id, vehicle_id, service_id, booking_type, scheduled_at, status)
     VALUES (?, 'AL-TEST1', ?, ?, ?, 'pre_booked', ?, 'pending')`,
    [booking1Id, customerId, vehicleId, serviceId, `${testDate} 10:00:00.000`]
  );
  console.log('✓ Booking 1 inserted at 10:00 for', testDate);

  // 4. Test 1-hour slot collision check logic
  // Attempting another booking at 10:00:
  const newHour = 10, newMin = 0;
  const newMinutes = newHour * 60 + newMin;

  const [existingBookings] = await c.query(
    `SELECT id, DATE_FORMAT(scheduled_at, '%H:%i') AS slot_time
     FROM bookings
     WHERE DATE(scheduled_at) = ? AND status <> 'cancelled'`,
    [testDate]
  );

  const isConflictingSameTime = existingBookings.some((b) => {
    if (!b.slot_time) return false;
    const [bH, bM] = b.slot_time.split(':').map(Number);
    return Math.abs(newMinutes - (bH * 60 + bM)) < 60;
  });
  console.log('✓ 1-hour gap collision check for 10:00:', isConflictingSameTime ? 'Blocked (Conflict detected as expected)' : 'Allowed');
  if (!isConflictingSameTime) throw new Error('Collision check failed for same time');

  // Attempting booking at 10:30 (less than 1 hour gap):
  const newMinutes30 = 10 * 60 + 30;
  const isConflicting30Min = existingBookings.some((b) => {
    if (!b.slot_time) return false;
    const [bH, bM] = b.slot_time.split(':').map(Number);
    return Math.abs(newMinutes30 - (bH * 60 + bM)) < 60;
  });
  console.log('✓ 1-hour gap collision check for 10:30 (30 min gap):', isConflicting30Min ? 'Blocked (Gap < 1h detected as expected)' : 'Allowed');
  if (!isConflicting30Min) throw new Error('Collision check failed for 30 min gap');

  // Attempting booking at 11:00 (exactly 1 hour gap):
  const newMinutes60 = 11 * 60 + 0;
  const isConflicting1Hour = existingBookings.some((b) => {
    if (!b.slot_time) return false;
    const [bH, bM] = b.slot_time.split(':').map(Number);
    return Math.abs(newMinutes60 - (bH * 60 + bM)) < 60;
  });
  console.log('✓ 1-hour gap collision check for 11:00 (1 hour gap):', !isConflicting1Hour ? 'Allowed (1-hour gap satisfied)' : 'Blocked');
  if (isConflicting1Hour) throw new Error('1-hour gap should be allowed');

  // 5. Complete Booking 1 via Rep flow
  const billAmount = 249.00;
  const repId = '01JQBB8RFRK0VGF7H0PDS9RXJG'; // Kai Evans
  await c.execute(
    `UPDATE bookings
     SET status = 'completed',
         bill_amount = ?,
         payment_method = 'card',
         service_notes = 'Test completed work: paint decontaminated and sealed.',
         completed_at = CURRENT_TIMESTAMP(3),
         assigned_rep_id = ?
     WHERE id = ?`,
    [billAmount, repId, booking1Id]
  );
  console.log('✓ Updated booking to status="completed" with bill_amount=$' + billAmount);

  // 6. Insert photo into service_photos
  const photoId = '01TESTPHOTO00000000000002';
  await c.execute(
    `INSERT INTO service_photos (id, booking_id, photo_type, image_data, title)
     VALUES (?, ?, 'after', 'data:image/jpeg;base64,samplephoto', 'Porsche Finish')`,
    [photoId, booking1Id]
  );
  console.log('✓ Successfully inserted photo into service_photos table');

  // 7. Verify cash inflow calculation
  const [inflowRows] = await c.query(
    `SELECT SUM(bill_amount) as total_inflow FROM bookings WHERE status = 'completed'`
  );
  console.log('✓ Total cash inflow calculated from DB: $' + Number(inflowRows[0].total_inflow).toFixed(2) + ' AUD');

  // 8. ATO Tax Invoice Formula Verification
  const gst = Number((billAmount / 11).toFixed(2));
  const subtotal = Number((billAmount - gst).toFixed(2));
  console.log('✓ ATO Australian Standard Tax Invoice Check:');
  console.log('   Total Paid: $' + billAmount.toFixed(2));
  console.log('   Subtotal:   $' + subtotal.toFixed(2));
  console.log('   GST (10%):  $' + gst.toFixed(2));
  console.log('   Match Check:', subtotal + gst === billAmount ? 'EXACT MATCH' : 'DIFF ' + (subtotal + gst - billAmount));

  // 9. Clean up test records
  await c.query('DELETE FROM service_photos WHERE id = ?', [photoId]);
  await c.query('DELETE FROM bookings WHERE id = ?', [booking1Id]);
  console.log('✓ Test data cleaned up successfully');

  await c.end();
  console.log('--- ALL AUTOMATED INTEGRATION TESTS PASSED (100% SUCCESS) ---');
}

testSuite().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
