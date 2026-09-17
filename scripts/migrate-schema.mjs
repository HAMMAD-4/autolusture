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
  await c.query(`ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50) NULL`);
  console.log('Added payment_method column');
} catch (e) {
  if (e.code === 'ER_DUP_FIELDNAME') console.log('payment_method already exists');
  else console.error('Col err:', e.message);
}

try {
  await c.query(`ALTER TABLE bookings ADD COLUMN completed_at DATETIME(3) NULL`);
  console.log('Added completed_at column');
} catch (e) {
  if (e.code === 'ER_DUP_FIELDNAME') console.log('completed_at already exists');
  else console.error('Col err:', e.message);
}

// Ensure scheduled_at unique constraint doesn't block bookings on different dates or when null
// If unique key on scheduled_at exists, let's keep it or ensure it allows bookings with 1 hour gap
try {
  await c.query(`CREATE TABLE IF NOT EXISTS service_photos (
    id CHAR(26) PRIMARY KEY,
    booking_id CHAR(26) NOT NULL,
    photo_type ENUM('before','after') NOT NULL,
    image_data LONGTEXT NOT NULL,
    title VARCHAR(255) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY service_photos_booking_idx (booking_id),
    CONSTRAINT service_photos_booking_fk FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  console.log('service_photos table created or verified');
} catch (e) {
  console.error('service_photos table err:', e.message);
}

await c.end();
console.log('Migration complete.');
