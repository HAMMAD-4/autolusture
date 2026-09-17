import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/local';
import { db } from '@/lib/db/client';
import type { RowDataPacket } from 'mysql2';

interface BookingRow extends RowDataPacket {
  id: string;
  reference_code: string;
  booking_type: string;
  scheduled_at: string;
  status: string;
  service_notes?: string;
  bill_amount?: number | string;
  payment_method?: string;
  completed_at?: string;
  created_at: string;
  assigned_rep_id?: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_suburb: string;
  customer_state: string;
  customer_postcode: string;
  rego: string;
  vehicle_state: string;
  make: string;
  model: string;
  service_name: string;
  service_slug: string;
  base_price: number;
  rep_name?: string;
  rep_email?: string;
}

export async function GET(request: Request) {
  const user = await currentUser();
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised. Admin role required.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const search = searchParams.get('search');
  const customerEmail = searchParams.get('email');

  try {
    let query = `
      SELECT b.id, b.reference_code, b.booking_type, b.scheduled_at, b.status,
             b.service_notes, b.bill_amount, b.payment_method, b.completed_at, b.created_at,
             b.assigned_rep_id, b.customer_id,
             c.full_name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
             c.suburb AS customer_suburb, c.state AS customer_state, c.postcode AS customer_postcode,
             v.rego, v.state AS vehicle_state, v.make, v.model,
             s.name AS service_name, s.slug AS service_slug, s.base_price,
             u.full_name AS rep_name, u.email AS rep_email
      FROM bookings b
      JOIN customers c ON c.id = b.customer_id
      JOIN vehicles v ON v.id = b.vehicle_id
      JOIN services s ON s.id = b.service_id
      LEFT JOIN users u ON u.id = b.assigned_rep_id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (statusFilter && statusFilter !== 'all') {
      query += ` AND b.status = ?`;
      params.push(statusFilter);
    }

    if (customerEmail && customerEmail.trim()) {
      query += ` AND c.email = ?`;
      params.push(customerEmail.trim().toLowerCase());
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (c.full_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR v.rego LIKE ? OR b.reference_code LIKE ?)`;
      params.push(term, term, term, term, term);
    }

    query += ` ORDER BY b.created_at DESC`;

    const [rows] = await db.query<BookingRow[]>(query, params);

    // Fetch photos for these bookings if any
    const bookingIds = rows.map((r) => r.id);
    let photosByBooking: Record<string, Array<{ id: string; type: string; url: string; title: string }>> = {};

    if (bookingIds.length > 0) {
      try {
        const placeholders = bookingIds.map(() => '?').join(',');
        const [photoRows] = await db.query<RowDataPacket[]>(
          `SELECT id, booking_id, photo_type, image_data, title, created_at
           FROM service_photos
           WHERE booking_id IN (${placeholders})
           ORDER BY created_at ASC`,
          bookingIds
        );

        for (const p of photoRows) {
          if (!photosByBooking[p.booking_id]) {
            photosByBooking[p.booking_id] = [];
          }
          photosByBooking[p.booking_id].push({
            id: p.id,
            type: p.photo_type,
            url: p.image_data,
            title: p.title || ''
          });
        }
      } catch (photoErr) {
        console.warn('Could not query service_photos:', photoErr);
      }
    }

    const bookingsWithDetails = rows.map((r) => ({
      ...r,
      photos: photosByBooking[r.id] || []
    }));

    // Group bookings by unified customer email
    const customerMap = new Map<string, {
      customerId: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      suburb: string;
      state: string;
      postcode: string;
      totalSpend: number;
      bookings: typeof bookingsWithDetails;
      vehicles: Array<{ rego: string; make: string; model: string; state: string }>;
    }>();

    for (const b of bookingsWithDetails) {
      const key = (b.customer_email || b.customer_phone).toLowerCase();
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          customerId: b.customer_id,
          customerName: b.customer_name,
          customerEmail: b.customer_email,
          customerPhone: b.customer_phone,
          suburb: b.customer_suburb,
          state: b.customer_state,
          postcode: b.customer_postcode,
          totalSpend: 0,
          bookings: [],
          vehicles: []
        });
      }
      const cEntry = customerMap.get(key)!;
      cEntry.bookings.push(b);
      if (b.status === 'completed' && b.bill_amount) {
        cEntry.totalSpend += Number(b.bill_amount);
      }

      // Unique vehicles
      if (!cEntry.vehicles.some((v) => v.rego === b.rego)) {
        cEntry.vehicles.push({
          rego: b.rego,
          make: b.make,
          model: b.model,
          state: b.vehicle_state
        });
      }
    }

    const customers = Array.from(customerMap.values());

    // Financial totals summary
    const totalCashInflow = rows
      .filter((r) => r.status === 'completed' && r.bill_amount)
      .reduce((sum, r) => sum + Number(r.bill_amount || 0), 0);

    const upcomingCount = rows.filter((r) => r.status === 'pending' || r.status === 'confirmed').length;
    const completedCount = rows.filter((r) => r.status === 'completed').length;

    return NextResponse.json({
      bookings: bookingsWithDetails,
      customers,
      summary: {
        totalBookings: rows.length,
        totalCustomers: customers.length,
        upcomingCount,
        completedCount,
        totalCashInflow
      }
    });
  } catch (error) {
    console.error('Failed to fetch admin bookings from DB:', error);
    return NextResponse.json({ error: 'Failed to retrieve bookings from database.' }, { status: 500 });
  }
}
