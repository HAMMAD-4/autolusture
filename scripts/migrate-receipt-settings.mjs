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
  await c.query(`CREATE TABLE IF NOT EXISTS receipt_settings (
    id INT PRIMARY KEY DEFAULT 1,
    business_name VARCHAR(160) NOT NULL DEFAULT 'AutoLustre Detailing Pty Ltd',
    abn VARCHAR(40) NOT NULL DEFAULT '48 612 345 678',
    business_address VARCHAR(255) NOT NULL DEFAULT '12-14 Industrial Circuit, Alexandria, NSW 2015',
    phone VARCHAR(40) NOT NULL DEFAULT '1300 288 678',
    email VARCHAR(120) NOT NULL DEFAULT 'accounts@autolustre.com.au',
    invoice_title VARCHAR(80) NOT NULL DEFAULT 'TAX INVOICE / RECEIPT',
    terms_conditions TEXT NULL,
    signature_image_data MEDIUMTEXT NULL,
    signatory_name VARCHAR(120) NOT NULL DEFAULT 'Hammad Saifullah',
    signatory_title VARCHAR(120) NOT NULL DEFAULT 'Quality Assurance & Studio Director',
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  console.log('receipt_settings table verified or created.');

  const defaultTerms = `1. Payment is strictly settled upon completion of detailing services.
2. 30-Day studio workmanship warranty on all ceramic protection & paint correction applications.
3. AutoLustre is not liable for pre-existing vehicle scratches, oxidation, or loose trim recorded prior to service.
4. All tax invoices comply with Australian Taxation Office (ATO) GST requirements under A New Tax System (Goods and Services Tax) Act 1999.`;

  // Insert default row if not present
  await c.query(`
    INSERT INTO receipt_settings (id, business_name, abn, business_address, phone, email, invoice_title, terms_conditions, signatory_name, signatory_title)
    VALUES (1, 'AutoLustre Detailing Pty Ltd', '48 612 345 678', '12-14 Industrial Circuit, Alexandria, NSW 2015', '1300 288 678', 'accounts@autolustre.com.au', 'TAX INVOICE / RECEIPT', ?, 'Hammad Saifullah', 'Quality Assurance & Studio Director')
    ON DUPLICATE KEY UPDATE
      business_name = VALUES(business_name),
      abn = VALUES(abn),
      business_address = VALUES(business_address),
      phone = VALUES(phone),
      email = VALUES(email),
      invoice_title = VALUES(invoice_title)
  `, [defaultTerms]);

  console.log('Default receipt settings seeded successfully.');
} catch (err) {
  console.error('Error creating receipt_settings:', err);
} finally {
  await c.end();
}
