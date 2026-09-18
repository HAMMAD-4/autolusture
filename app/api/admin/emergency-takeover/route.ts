import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/local';
import { db } from '@/lib/db/client';
import { ulid } from 'ulid';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised. Administrator login required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      bookingId,
      billAmount,
      paymentMethod = 'card',
      serviceNotes = 'Completed via studio administrator emergency takeover.',
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

    // 1. Fetch current booking and rep info
    const [bookingRows] = await db.query<RowDataPacket[]>(
      `SELECT b.id, b.reference_code, b.scheduled_at, b.assigned_rep_id,
              c.full_name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
              c.suburb AS customer_suburb, c.state AS customer_state, c.postcode AS customer_postcode,
              v.rego, v.state AS vehicle_state, v.make, v.model,
              s.name AS service_name, s.base_price,
              u.full_name AS rep_name, u.email AS rep_email
       FROM bookings b
       JOIN customers c ON c.id = b.customer_id
       JOIN vehicles v ON v.id = b.vehicle_id
       JOIN services s ON s.id = b.service_id
       LEFT JOIN users u ON u.id = b.assigned_rep_id
       WHERE b.id = ? LIMIT 1`,
      [bookingId]
    );

    if (bookingRows.length === 0) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    const b = bookingRows[0];

    // 2. Strict requirement: Admin can only process the active job by adding After photos!
    const [existingAfter] = await db.query<RowDataPacket[]>(
      'SELECT id FROM service_photos WHERE booking_id = ? AND photo_type = "after" LIMIT 1',
      [bookingId]
    );
    const hasPayloadAfter =
      Array.isArray(afterPhotos) &&
      afterPhotos.some((p: unknown) => {
        const url = typeof p === 'string' ? p : (p as { dataUrl?: string })?.dataUrl || '';
        return Boolean(url && url.startsWith('data:image/'));
      });

    if (existingAfter.length === 0 && !hasPayloadAfter) {
      return NextResponse.json(
        { error: 'At least one after photo is required to end the job and complete the takeover.' },
        { status: 400 }
      );
    }

    // 3. Complete the booking while PRESERVING b.assigned_rep_id so rep receives full credit in account
    await db.execute(
      `UPDATE bookings
       SET status = 'completed',
           bill_amount = ?,
           payment_method = ?,
           service_notes = ?,
           completed_at = CURRENT_TIMESTAMP(3),
           updated_at = CURRENT_TIMESTAMP(3)
       WHERE id = ?`,
      [bill, paymentMethod.trim(), serviceNotes.trim(), bookingId]
    );

    // 4. Insert ONLY After photos into service_photos table (Admin can never add before photos)
    const afterPhotosToSave = (Array.isArray(afterPhotos) ? afterPhotos : [])
      .map((p: { dataUrl?: string } | string) => ({
        type: 'after' as const,
        data: typeof p === 'string' ? p : p?.dataUrl || ''
      }))
      .filter((p) => p.data && p.data.startsWith('data:image/'));

    let savedPhotoCount = 0;
    for (const photo of afterPhotosToSave) {
      try {
        await db.query(
          `INSERT INTO service_photos (id, booking_id, photo_type, image_data, title)
           VALUES (?, ?, 'after', ?, ?)`,
          [
            ulid(),
            bookingId,
            photo.data,
            `Takeover After Finish - ${b.make} ${b.model}`
          ]
        );
        savedPhotoCount++;
      } catch (photoErr) {
        console.warn('Warning: Could not save individual takeover after photo:', photoErr);
      }
    }

    // 4. Log takeover completion in service_logs, confirming rep credit retention
    await db.query(
      `INSERT INTO service_logs (id, booking_id, event_name, metadata)
       VALUES (?, ?, 'admin_emergency_takeover_completed', ?)`,
      [
        ulid(),
        bookingId,
        JSON.stringify({
          adminId: user.id,
          adminName: user.full_name,
          creditedRepId: b.assigned_rep_id,
          creditedRepName: b.rep_name || 'Unassigned',
          billAmount: bill,
          paymentMethod,
          savedPhotoCount
        })
      ]
    );

    // 5. Generate Tax Receipt
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
        name: b.rep_name ? `${b.rep_name} (Credited Technician)` : 'AutoLustre Studio Tech',
        id: b.assigned_rep_id || user.id
      }
    };

    return NextResponse.json({
      ok: true,
      message: `Emergency takeover completed successfully! Full performance and revenue credit was awarded to ${b.rep_name || 'the representative'}.`,
      receipt: taxReceipt,
      creditedRepName: b.rep_name || null
    });
  } catch (error) {
    console.error('Failed to execute admin emergency takeover:', error);
    return NextResponse.json({ error: 'Failed to record takeover completion.' }, { status: 500 });
  }
}
