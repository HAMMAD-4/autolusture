import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'aussi_clean'
};

const db = await mysql.createConnection(config);

// 1. Create expenses table
await db.query(`
  CREATE TABLE IF NOT EXISTS expenses (
    id CHAR(26) PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    category VARCHAR(80) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    notes TEXT NULL,
    vendor VARCHAR(120) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`);

// 2. Create inventory_items table
await db.query(`
  CREATE TABLE IF NOT EXISTS inventory_items (
    id CHAR(26) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    sku VARCHAR(40) NOT NULL UNIQUE,
    on_hand INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 5,
    unit VARCHAR(40) NOT NULL DEFAULT 'units',
    category VARCHAR(80) NOT NULL DEFAULT 'Supplies',
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`);

// Seed inventory items if empty
const [invRows] = await db.query('SELECT COUNT(*) as count FROM inventory_items');
if (invRows[0].count === 0) {
  const defaultItems = [
    ['01INV001PHWASH000000000000', 'pH-neutral wash shampoo 5L', 'AUTO-101', 14, 8, 'bottles', 'Chemicals'],
    ['01INV002MICROCLOTH00000000', 'Microfibre edgeless towels (pack of 12)', 'AUTO-212', 5, 12, 'packs', 'Cloths & Mitts'],
    ['01INV003CERAMICCOAT0000000', 'Ceramic coating quartz kit 50ml', 'AUTO-303', 3, 4, 'kits', 'Coatings'],
    ['01INV004CLAYBARKIT00000000', 'Fine grade detailing clay bar 200g', 'AUTO-404', 9, 6, 'bars', 'Decontamination'],
    ['01INV005IRONREMOVER0000000', 'Iron & fallout decontaminant 5L', 'AUTO-505', 6, 4, 'bottles', 'Chemicals']
  ];
  for (const item of defaultItems) {
    await db.query(
      'INSERT INTO inventory_items (id, name, sku, on_hand, min_stock, unit, category) VALUES (?,?,?,?,?,?,?)',
      item
    );
  }
  console.log('✓ Seeded initial inventory items.');
}

// Seed default expenses if empty
const [expRows] = await db.query('SELECT COUNT(*) as count FROM expenses');
if (expRows[0].count === 0) {
  const defaultExpenses = [
    ['01EXP001CHEMICALS000000000', 'Gyeon ceramic bulk shipment', 'Chemicals & Supplies', 420.00, '2026-09-10', 'Bulk studio supplies for September bookings', 'Detailing World Sydney'],
    ['01EXP002PADSANDPOLISH00000', 'Rupes polishing pads & compound refills', 'Equipment & Tools', 185.50, '2026-09-12', 'Rotary and dual-action backing pads', 'AutoCare Pro Trade'],
    ['01EXP003VANFUEL00000000000', 'Mobile detailing van fuel & tolls', 'Travel & Fuel', 142.00, '2026-09-14', 'Eastern suburbs and North Shore mobile jobs', 'Ampol Alexandria'],
    ['01EXP004MICROFIBRE00000000', 'Korean ultra-plush drying towels (x20)', 'Consumables', 95.00, '2026-09-16', 'Fresh stock for ceramic finish inspections', 'Microfibre Direct AU']
  ];
  for (const exp of defaultExpenses) {
    await db.query(
      'INSERT INTO expenses (id, title, category, amount, expense_date, notes, vendor) VALUES (?,?,?,?,?,?,?)',
      exp
    );
  }
  console.log('✓ Seeded initial expenses.');
}

console.log('✓ Setup complete.');
await db.end();
