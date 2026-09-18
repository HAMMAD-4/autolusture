import http from 'node:http';

function req(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const r = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

const services = [
  'signature-detail',
  'paint-correction',
  'interior-revival',
  'ceramic-protection',
  'exterior-detailing',
  'interior-detailing',
  'paint-protection',
  'ceramic-coating',
  'maintenance-wash'
];

import mysql from 'mysql2/promise';

async function testAllBookings() {
  console.log('=== TESTING BOOKING CREATION FOR ALL 9 SERVICES ===');

  // Clear previous test runs on test date
  const db = await mysql.createConnection({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'aussi_clean'
  });
  await db.query('DELETE FROM service_photos WHERE booking_id IN (SELECT id FROM bookings WHERE DATE(scheduled_at) = "2026-10-15")');
  await db.query('DELETE FROM service_logs WHERE booking_id IN (SELECT id FROM bookings WHERE DATE(scheduled_at) = "2026-10-15")');
  await db.query('DELETE FROM bookings WHERE DATE(scheduled_at) = "2026-10-15"');
  await db.end();

  let allPass = true;
  for (let i = 0; i < services.length; i++) {
    const slug = services[i];
    const payload = {
      rego: `TST00${i}`,
      vehicleState: 'NSW',
      make: 'Porsche',
      model: 'Taycan',
      service: slug,
      when: 'Pre-book a time',
      date: '2026-10-15',
      time: `0${8 + i}:00`,
      name: `Test Client ${i}`,
      phone: `041234567${i}`,
      email: `client${i}@testautolustre.com.au`,
      suburb: 'Alexandria',
      state: 'NSW',
      postcode: '2015'
    };

    const res = await req('POST', '/api/booking', JSON.stringify(payload));
    const data = JSON.parse(res.body || '{}');
    const ok = res.status === 201 && data.reference;
    if (!ok) allPass = false;
    console.log(`Service [${slug}]: ${ok ? 'PASS' : 'FAIL (' + res.status + ': ' + (data.error || res.body) + ')'} (Ref: ${data.reference || 'none'})`);
  }
  console.log(`=== ALL 9 SERVICES BOOKING TEST: ${allPass ? 'SUCCESS' : 'FAILED'} ===`);
}

testAllBookings().catch(console.error);
