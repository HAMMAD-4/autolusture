import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/local';
import { db } from '@/lib/db/client';
import type { RowDataPacket } from 'mysql2';

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised. Admin role required.' }, { status: 401 });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT b.id, b.reference_code, b.booking_type, b.scheduled_at, b.status,
              b.service_notes, b.bill_amount, b.created_at, b.updated_at, b.started_at,
              c.full_name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
              c.suburb AS customer_suburb, c.state AS customer_state,
              v.rego, v.state AS vehicle_state, v.make, v.model,
              s.name AS service_name, s.slug AS service_slug, s.base_price, s.duration_minutes,
              u.id AS rep_id, u.full_name AS rep_name, u.email AS rep_email
       FROM bookings b
       JOIN customers c ON c.id = b.customer_id
       JOIN vehicles v ON v.id = b.vehicle_id
       JOIN services s ON s.id = b.service_id
       LEFT JOIN users u ON u.id = b.assigned_rep_id
       WHERE b.status = 'in_progress'
       ORDER BY b.updated_at DESC`
    );

    // Also get all reps on duty count
    const [repsOnDuty] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT assigned_rep_id) AS active_reps_count
       FROM bookings
       WHERE status = 'in_progress' AND assigned_rep_id IS NOT NULL`
    );

    return NextResponse.json({
      activeJobs: rows,
      activeJobsCount: rows.length,
      repsOnDutyCount: repsOnDuty[0]?.active_reps_count || 0
    });
  } catch (error) {
    console.error('Failed to query active jobs:', error);
    return NextResponse.json({ error: 'Failed to retrieve active jobs from database.' }, { status: 500 });
  }
}
