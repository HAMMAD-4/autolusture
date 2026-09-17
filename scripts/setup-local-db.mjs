import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const config = { host: process.env.DB_HOST ?? '127.0.0.1', port: Number(process.env.DB_PORT ?? 3306), user: process.env.DB_USER ?? 'root', password: process.env.DB_PASSWORD ?? '' };
const name = process.env.DB_NAME ?? 'aussi_clean';
const admin = await mysql.createConnection(config);
await admin.query(`CREATE DATABASE IF NOT EXISTS \`${name.replace(/`/g, '')}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await admin.end();
const db = await mysql.createConnection({ ...config, database: name, multipleStatements: true });
const schema = await fs.readFile(new URL('../drizzle/0000_local_schema.sql', import.meta.url), 'utf8');
await db.query(schema);
try { await db.query('ALTER TABLE bookings ADD COLUMN assigned_rep_id CHAR(26) NULL, ADD KEY bookings_rep_idx (assigned_rep_id)'); } catch (error) { if (error.code !== 'ER_DUP_FIELDNAME') throw error; }
try { await db.query('ALTER TABLE bookings ADD UNIQUE KEY bookings_scheduled_slot_uq (scheduled_at)'); } catch (error) { if (error.code !== 'ER_DUP_KEYNAME') throw error; }
const services = [
  ['01JQAZJGGWDFDFJPCQBMQ9NHC9','signature-detail','Signature Detail','Deep interior, hand wash and protected finish.',249,180,'Complete care',1],
  ['01JQAZKMR7ARH9G6SZJDY64BSE','paint-correction','Paint Correction','Multi-stage paint refinement with exceptional clarity.',549,480,'Finish work',2],
  ['01JQAZM6YX7T751X70FPMYBY2D','interior-revival','Interior Revival','Meticulous cabin cleaning and conditioning.',189,120,'Cabin care',3],
  ['01JQAZNHTFSDVH6SB4PZAMDG4V','ceramic-protection','Ceramic Protection','Long-lasting gloss and durable paint protection.',899,960,'Long-term protection',4]
];
for (const row of services) await db.query('INSERT INTO services (id,slug,name,description_md,base_price,duration_minutes,category,display_order) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), description_md=VALUES(description_md), base_price=VALUES(base_price), duration_minutes=VALUES(duration_minutes), category=VALUES(category), display_order=VALUES(display_order)', row);
const localUsers = [
  ['01JQBB80T7AN3RVPY0Y6RFMF3S', 'Amelia Ross', 'admin@autolustre.local', 'Admin!2026', 'admin'],
  ['01M2HAMMAD00000000000ADMIN1', 'Hammad', 'hammad@admin.com', 'Admin123!', 'admin'],
  ['01JQBB8RFRK0VGF7H0PDS9RXJG', 'Kai Evans', 'rep@autolustre.local', 'Rep!2026', 'rep']
];
for (const [id, name, email, password, role] of localUsers) {
  const passwordHash = await bcrypt.hash(password, 12);
  await db.query('INSERT INTO users (id,full_name,email,password_hash,role) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), password_hash=VALUES(password_hash), role=VALUES(role), is_active=TRUE', [id, name, email, passwordHash, role]);
}
await db.end();
console.log(`Local MariaDB database “${name}” is ready.`);
