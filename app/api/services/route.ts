import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, slug, name, description_md AS description, base_price AS price, duration_minutes, category, is_active FROM services ORDER BY display_order, name ASC'
    );
    return NextResponse.json({
      services: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description,
        price: Number(r.price),
        durationMinutes: r.duration_minutes,
        category: r.category,
        isActive: Boolean(r.is_active)
      }))
    });
  } catch (error) {
    console.error('Failed to get public services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}
