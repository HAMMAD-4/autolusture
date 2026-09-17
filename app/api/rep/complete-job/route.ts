import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/local';
import { db } from '@/lib/db/client';
import { ulid } from 'ulid';
import type { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== 'rep') {
    return NextResponse.json({ error: 'Unauthorised. Representative login required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      bookingId,
      billAmount,
      paymentMethod,
      serviceNotes,
      beforePhotos = [],
      afterPhotos = []
    } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 });
    }

    const bill = Number(billAmount);
    if (isNaN(bill) || bill <= 0) {
      return NextResponse.json({ error: 'A valid bill amount greater than $0.00 is required.' }, { status: 400 });
    }

    if (!paymentMethod || !paymentMethod.trim()) {
      return NextResponse.json({ error: 'Please select a payment method.' }, { status: 400 });
    }

    if (!serviceNotes || !serviceNotes.trim()) {
      return NextResponse.json({ error: 'Service notes are required to document the completed work.' }, { status: 400 });
    }

    if (!Array.isArray(afterPhotos) || afterPhotos.length === 0) {
      return NextResponse.json({ error: 'At least one after photo is required before ending service.' }, { status: 400 });
    }

    // 1. Fetch booking, customer and vehicle details
    const [bookingRows] = await db.query<RowDataPacket[]>(
      `SELECT b.id, b.reference_code, b.scheduled_at,
              c.full_name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
              c.suburb AS customer_suburb, c.state AS customer_state, c.postcode AS customer_postcode,
              v.rego, v.state AS vehicle_state, v.make, v.model,
              s.name AS service_name, s.base_price
       FROM bookings b
       JOIN customers c ON c.id = b.customer_id
       JOIN vehicles v ON v.id = b.vehicle_id
       JOIN services s ON s.id = b.service_id
       WHERE b.id = ? LIMIT 1`,
      [bookingId]
    );

    if (bookingRows.length === 0) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    const b = bookingRows[0];

    // 2. Update booking in DB: set status='completed', bill_amount, payment_method, service_notes, completed_at, assigned_rep_id
    await db.execute(
      `UPDATE bookings
       SET status = 'completed',
           bill_amount = ?,
           payment_method = ?,
           service_notes = ?,
           completed_at = CURRENT_TIMESTAMP(3),
           assigned_rep_id = ?,
           updated_at = CURRENT_TIMESTAMP(3)
       WHERE id = ?`,
      [bill, paymentMethod.trim(), serviceNotes.trim(), user.id, bookingId]
    );

    // 3. Save Before and After photos into service_photos table
    const MAX_PHOTOS = 20;
    const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // 3 MB limit per photo (base64 string length)
    const ALLOWED_MIME_PREFIXES = [
      'data:image/jpeg;base64,',
      'data:image/png;base64,',
      'data:image/webp;base64,'
    ];

    const allPhotosToSave = [
      ...beforePhotos.map((p: { dataUrl?: string; id?: string }) => ({
        type: 'before' as const,
        data: typeof p === 'string' ? p : p.dataUrl || ''
      })),
      ...afterPhotos.map((p: { dataUrl?: string; id?: string }) => ({
        type: 'after' as const,
        data: typeof p === 'string' ? p : p.dataUrl || ''
      }))
    ].filter((p) => p.data && p.data.length > 0);

    if (allPhotosToSave.length > MAX_PHOTOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PHOTOS} photos allowed.` },
        { status: 400 }
      );
    }

    let savedPhotoCount = 0;
    for (const photo of allPhotosToSave) {
      // Validate MIME type via data URL prefix (magic-byte equivalent for base64)
      const isAllowedMime = ALLOWED_MIME_PREFIXES.some((prefix) => photo.data.startsWith(prefix));
      if (!isAllowedMime) {
        console.warn('Skipping photo with disallowed MIME type prefix.');
        continue;
      }
      // Enforce per-photo size cap
      if (photo.data.length > MAX_PHOTO_BYTES) {
        console.warn(`Skipping photo exceeding size limit (${photo.data.length} bytes).`);
        continue;
      }
      try {
        await db.query(
          `INSERT INTO service_photos (id, booking_id, photo_type, image_data, title)
           VALUES (?, ?, ?, ?, ?)`,
          [
            ulid(),
            bookingId,
            photo.type,
            photo.data,
            `${photo.type === 'before' ? 'Before Inspection' : 'After Finish'} - ${b.make} ${b.model}`
          ]
        );
        savedPhotoCount++;
      } catch (photoErr) {
        console.warn('Warning: Could not save individual photo into service_photos:', photoErr);
      }
    }

    // 4. Log completion event
    await db.query(
      `INSERT INTO service_logs (id, booking_id, event_name, metadata)
       VALUES (?, ?, 'completed', ?)`,
      [
        ulid(),
        bookingId,
        JSON.stringify({
          repId: user.id,
          repName: user.full_name,
          billAmount: bill,
          paymentMethod,
          photoCount: savedPhotoCount
        })
      ]
    );

    // 5. Generate Australian Standard Tax Receipt
    // In Australia, GST is 10% (1/11th of total inc. GST price)
    const totalPaid = bill;
    const gstComponent = Number((totalPaid / 11).toFixed(2));
    const subtotalExGst = Number((totalPaid - gstComponent).toFixed(2));
    const receiptNumber = `TAX-${b.reference_code || bookingId.slice(-5).toUpperCase()}`;
    const issueDate = new Date().toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const issueTime = new Date().toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const taxReceipt = {
      receiptNumber,
      title: 'TAX INVOICE / RECEIPT',
      abn: '48 612 345 678',
      businessName: 'AutoLustre Detailing Pty Ltd',
      businessAddress: '12-14 Industrial Circuit, Alexandria, NSW 2015',
      phone: '1300 288 678',
      email: 'accounts@autolustre.com.au',
      issueDate: `${issueDate} at ${issueTime}`,
      customer: {
        name: b.customer_name,
        email: b.customer_email,
        phone: b.customer_phone,
        address: `${b.customer_suburb}, ${b.customer_state} ${b.customer_postcode}`
      },
      vehicle: {
        rego: b.rego,
        state: b.vehicle_state,
        description: `${b.make} ${b.model}`
      },
      service: {
        name: b.service_name,
        notes: serviceNotes.trim()
      },
      payment: {
        method: paymentMethod.toUpperCase().replace('_', ' '),
        status: 'PAID IN FULL',
        subtotalExGst: `$${subtotalExGst.toFixed(2)} AUD`,
        gstAmount: `$${gstComponent.toFixed(2)} AUD (10% GST)`,
        totalAmount: `$${totalPaid.toFixed(2)} AUD`,
        rawTotal: totalPaid
      },
      representative: {
        name: user.full_name,
        id: user.id
      }
    };

    return NextResponse.json({
      ok: true,
      message: 'Job completed successfully and recorded against your profile!',
      receipt: taxReceipt,
      cashInflowAdded: totalPaid
    });
  } catch (error) {
    console.error('Failed to complete job:', error);
    return NextResponse.json({ error: 'Failed to record job completion.' }, { status: 500 });
  }
}
