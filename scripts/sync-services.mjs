import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'aussi_clean'
};

const db = await mysql.createConnection(config);

const allServices = [
  ['01JQAZJGGWDFDFJPCQBMQ9NHC9','signature-detail','Signature Detail','The reset your daily driver deserves: deep interior, hand wash and protected finish.',249,180,'Complete care',1],
  ['01JQAZKMR7ARH9G6SZJDY64BSE','paint-correction','Paint Correction','Measured, multi-stage refinement that brings depth and clarity back to tired paint.',549,480,'Finish work',2],
  ['01JQAZM6YX7T751X70FPMYBY2D','interior-revival','Interior Revival','A meticulous cabin refresh from leather conditioning to fabric extraction.',189,120,'Cabin care',3],
  ['01JQAZNHTFSDVH6SB4PZAMDG4V','ceramic-protection','Ceramic Protection','A durable, high-gloss shield applied after precise paint preparation.',899,960,'Long-term protection',4],
  ['01JQAZP1000000000000000005','exterior-detailing','Exterior Detailing','A full-panel exterior treatment: safe wash, decontamination, clay bar and protective spray sealant.',179,120,'Exterior care',5],
  ['01JQAZP1000000000000000006','interior-detailing','Interior Detailing','Deep cabin extraction, steam sanitation, leather conditioning and odour elimination.',199,150,'Cabin care',6],
  ['01JQAZP1000000000000000007','paint-protection','Paint Protection Film','Self-healing PPF film on high-impact zones for near-invisible protection against chips and scratches.',1299,1440,'Long-term protection',7],
  ['01JQAZP1000000000000000008','ceramic-coating','Ceramic Coating','Professional-grade 9H ceramic coating for a permanent hydrophobic shield with deep glass-like gloss.',799,960,'Long-term protection',8],
  ['01JQAZP1000000000000000009','maintenance-wash','Maintenance Wash','A swift, thorough touchless rinse and hand-dry keeping your protected vehicle in show-room condition between detail sessions.',99,60,'Routine care',9]
];

for (const row of allServices) {
  await db.query(`
    INSERT INTO services (id, slug, name, description_md, base_price, duration_minutes, category, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      description_md = VALUES(description_md),
      base_price = VALUES(base_price),
      duration_minutes = VALUES(duration_minutes),
      category = VALUES(category),
      display_order = VALUES(display_order),
      is_active = 1
  `, row);
}

const [rows] = await db.query('SELECT id, slug, name, base_price, is_active, display_order FROM services ORDER BY display_order ASC');
console.log('Seeded services count:', rows.length);
console.log(rows);

await db.end();
