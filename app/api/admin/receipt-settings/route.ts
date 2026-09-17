import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/local';
import { db } from '@/lib/db/client';
import type { RowDataPacket } from 'mysql2';

const ALLOWED_IMAGE_PREFIXES = [
  'data:image/png;base64,',
  'data:image/jpeg;base64,',
  'data:image/webp;base64,'
];
const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024; // 2MB

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, business_name, abn, business_address, phone, email, invoice_title,
              terms_conditions, signature_image_data, signatory_name, signatory_title, updated_at
       FROM receipt_settings WHERE id = 1 LIMIT 1`
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Receipt settings not configured.' }, { status: 404 });
    }

    return NextResponse.json({ settings: rows[0] });
  } catch (error) {
    console.error('Failed to fetch receipt settings:', error);
    return NextResponse.json({ error: 'Database error fetching receipt settings.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised. Admin privileges required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      business_name,
      abn,
      business_address,
      phone,
      email,
      invoice_title,
      terms_conditions,
      signature_image_data,
      signatory_name,
      signatory_title
    } = body;

    // Validate business name
    if (!business_name || typeof business_name !== 'string' || !business_name.trim()) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
    }

    // Validate ABN
    if (!abn || typeof abn !== 'string' || !abn.trim()) {
      return NextResponse.json({ error: 'ABN is required.' }, { status: 400 });
    }

    // Validate business address
    if (!business_address || typeof business_address !== 'string' || !business_address.trim()) {
      return NextResponse.json({ error: 'Business registered address is required.' }, { status: 400 });
    }

    // Validate phone
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid billing/support email is required.' }, { status: 400 });
    }

    // Validate invoice title
    const cleanTitle = (invoice_title && typeof invoice_title === 'string' && invoice_title.trim())
      ? invoice_title.trim()
      : 'TAX INVOICE / RECEIPT';

    // Validate signature image if provided
    let cleanSignature: string | null = null;
    if (signature_image_data) {
      if (typeof signature_image_data !== 'string') {
        return NextResponse.json({ error: 'Invalid signature image payload.' }, { status: 400 });
      }

      const isAllowedFormat = ALLOWED_IMAGE_PREFIXES.some((prefix) =>
        signature_image_data.startsWith(prefix)
      );

      if (!isAllowedFormat) {
        return NextResponse.json(
          { error: 'Invalid image format. Signature must be a valid PNG, JPEG, or WebP image.' },
          { status: 400 }
        );
      }

      if (signature_image_data.length > MAX_SIGNATURE_BYTES) {
        return NextResponse.json(
          { error: 'Signature image exceeds maximum allowed size of 2MB.' },
          { status: 400 }
        );
      }

      // Basic base64 integrity check
      const base64Data = signature_image_data.split(',')[1];
      if (!base64Data || base64Data.trim().length === 0) {
        return NextResponse.json({ error: 'Corrupted signature image base64 data.' }, { status: 400 });
      }

      cleanSignature = signature_image_data;
    }

    await db.query(
      `INSERT INTO receipt_settings (
        id, business_name, abn, business_address, phone, email, invoice_title,
        terms_conditions, signature_image_data, signatory_name, signatory_title
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        business_name = VALUES(business_name),
        abn = VALUES(abn),
        business_address = VALUES(business_address),
        phone = VALUES(phone),
        email = VALUES(email),
        invoice_title = VALUES(invoice_title),
        terms_conditions = VALUES(terms_conditions),
        signature_image_data = VALUES(signature_image_data),
        signatory_name = VALUES(signatory_name),
        signatory_title = VALUES(signatory_title)`,
      [
        business_name.trim().slice(0, 160),
        abn.trim().slice(0, 40),
        business_address.trim().slice(0, 255),
        phone.trim().slice(0, 40),
        email.trim().slice(0, 120),
        cleanTitle.slice(0, 80),
        terms_conditions ? String(terms_conditions).trim() : null,
        cleanSignature,
        signatory_name ? String(signatory_name).trim().slice(0, 120) : 'Authorized Management',
        signatory_title ? String(signatory_title).trim().slice(0, 120) : 'Quality Assurance & Studio Director'
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Receipt customization settings updated successfully.'
    });
  } catch (error) {
    console.error('Failed to update receipt settings:', error);
    return NextResponse.json({ error: 'Failed to update receipt settings.' }, { status: 500 });
  }
}
