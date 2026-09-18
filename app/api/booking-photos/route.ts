import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/local';
import { db } from '@/lib/db/client';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get('bookingId');
  if (!bookingId) {
    return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, photo_type, image_data, title, created_at FROM service_photos WHERE booking_id = ? ORDER BY created_at ASC',
      [bookingId]
    );

    return NextResponse.json({
      photos: rows.map((r) => ({
        id: r.id,
        type: r.photo_type as 'before' | 'after',
        dataUrl: r.image_data,
        title: r.title || '',
        timestamp: new Date(r.created_at).toLocaleTimeString()
      }))
    });
  } catch (err) {
    console.error('Failed to fetch booking photos:', err);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}
