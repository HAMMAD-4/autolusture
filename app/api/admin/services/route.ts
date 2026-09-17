import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/local';
import { db } from '@/lib/db/client';
import { ulid } from 'ulid';
import type { RowDataPacket } from 'mysql2';

async function isAdmin() {
  const u = await currentUser();
  return u?.role === 'admin';
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, slug, name, description_md, base_price, duration_minutes, category, is_active FROM services ORDER BY display_order, name ASC'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to get services:', error);
    return NextResponse.json({ error: 'Failed to retrieve services' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  try {
    const b = await req.json();
    if (!b.name || !b.slug || b.price === undefined) {
      return NextResponse.json({ error: 'Name, slug and price are required.' }, { status: 400 });
    }
    const id = ulid();
    await db.execute(
      'INSERT INTO services (id, slug, name, description_md, base_price, duration_minutes, category, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 99)',
      [
        id,
        b.slug,
        b.name,
        b.description ?? '',
        Number(b.price),
        Number(b.duration ?? 60),
        b.category ?? 'General',
        b.active ? 1 : 0
      ]
    );
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create service:', error);
    const msg = error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'ER_DUP_ENTRY'
      ? 'A service with this slug already exists.'
      : 'Failed to create service.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  try {
    const b = await req.json();
    if (!b.id || !b.name || !b.slug || b.price === undefined) {
      return NextResponse.json({ error: 'ID, name, slug, and price are required.' }, { status: 400 });
    }
    await db.execute(
      'UPDATE services SET name=?, slug=?, description_md=?, base_price=?, duration_minutes=?, category=?, is_active=? WHERE id=?',
      [
        b.name,
        b.slug,
        b.description ?? '',
        Number(b.price),
        Number(b.duration ?? 60),
        b.category ?? 'General',
        b.active ? 1 : 0,
        b.id
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('Failed to update service:', error);
    const msg = error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'ER_DUP_ENTRY'
      ? 'A service with this slug already exists.'
      : 'Failed to update service.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Service ID is required.' }, { status: 400 });
    }
    await db.execute('DELETE FROM services WHERE id=?', [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete service:', error);
    return NextResponse.json({ error: 'Failed to delete service. It may have linked bookings.' }, { status: 500 });
  }
}
