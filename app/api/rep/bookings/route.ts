import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/local';
import { db } from '@/lib/db/client';
import type { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user || (user.role !== 'rep' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorised. Staff access required.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateFilter = searchParams.get('date') || '';

  try {
    // 1. Fetch bookings that belong to this rep OR are unassigned/open
    const [allRows] = await db.query<RowDataPacket[]>(
      `SELECT b.id, b.reference_code, b.booking_type, b.scheduled_at, b.status,
              b.service_notes, b.bill_amount, b.payment_method, b.completed_at, b.created_at,
              b.assigned_rep_id,
              c.full_name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
              c.suburb AS customer_suburb, c.state AS customer_state,
              v.rego, v.state AS vehicle_state, v.make, v.model,
              s.name AS service_name, s.slug AS service_slug, s.base_price,
              u.full_name AS rep_name
       FROM bookings b
       JOIN customers c ON c.id = b.customer_id
       JOIN vehicles v ON v.id = b.vehicle_id
       JOIN services s ON s.id = b.service_id
       LEFT JOIN users u ON u.id = b.assigned_rep_id
       ORDER BY b.scheduled_at ASC, b.created_at DESC`
    );

    // Filter into categories for the rep:
    // A) Rep's active service (in_progress assigned to this rep)
    const active = allRows.find(
      (b) => b.assigned_rep_id === user.id && b.status === 'in_progress'
    );

    // B) Rep's completed jobs
    const doneByRep = allRows.filter(
      (b) => b.assigned_rep_id === user.id && b.status === 'completed'
    );

    // C) Available/open bookings for the day (status != completed/cancelled, and assigned to this rep OR unassigned)
    const openForRep = allRows.filter((b) => {
      if (b.status === 'completed' || b.status === 'cancelled') return false;
      // Either assigned to this rep or open for any rep to claim
      return !b.assigned_rep_id || b.assigned_rep_id === user.id;
    });

    // D) Calculate total earnings / cash collected by this rep
    const repCashInflow = doneByRep.reduce((sum, b) => sum + Number(b.bill_amount || 0), 0);

    return NextResponse.json({
      repId: user.id,
      repName: user.full_name,
      activeBooking: active || null,
      openBookings: openForRep,
      completedBookings: doneByRep,
      allBookings: allRows,
      stats: {
        completedCount: doneByRep.length,
        cashInflow: repCashInflow,
        openCount: openForRep.length
      }
    });
  } catch (error) {
    console.error('Failed to fetch rep bookings:', error);
    return NextResponse.json({ error: 'Failed to retrieve bookings from database.' }, { status: 500 });
  }
}

// Claim / assign / start a booking for this rep
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== 'rep') {
    return NextResponse.json({ error: 'Unauthorised. Rep role required.' }, { status: 401 });
  }

  try {
    const { bookingId, action = 'claim' } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 });
    }

    // Verify booking
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, assigned_rep_id, status FROM bookings WHERE id = ? LIMIT 1',
      [bookingId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    const booking = rows[0];

    if (action === 'start') {
      // Start active detailing timer
      await db.execute(
        'UPDATE bookings SET assigned_rep_id = ?, status = "in_progress", updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
        [user.id, bookingId]
      );
      return NextResponse.json({ ok: true, message: 'Detailing service stopwatch started!' });
    }

    if (action === 'unclaim') {
      await db.execute(
        'UPDATE bookings SET assigned_rep_id = NULL, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
        [bookingId]
      );
      return NextResponse.json({ ok: true, message: 'Booking released back to open pool.' });
    }

    // Default action: 'claim'
    if (booking.assigned_rep_id && booking.assigned_rep_id !== user.id) {
      return NextResponse.json({ error: 'This booking has already been claimed by another representative.' }, { status: 409 });
    }

    // Assign to this rep without starting detailing yet
    await db.execute(
      'UPDATE bookings SET assigned_rep_id = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
      [user.id, bookingId]
    );

    return NextResponse.json({
      ok: true,
      message: 'Booking claimed successfully! You can now conduct initial inspection and capture Before photos.'
    });
  } catch (error) {
    console.error('Failed to update booking assignment:', error);
    return NextResponse.json({ error: 'Failed to update booking.' }, { status: 500 });
  }
}
