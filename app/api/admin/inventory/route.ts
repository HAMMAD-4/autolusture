import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/local';
import { db } from '@/lib/db/client';
import { ulid } from 'ulid';
import type { RowDataPacket } from 'mysql2';

async function isAdmin() {
  const user = await currentUser();
  return user?.role === 'admin';
}

// GET: Fetch all inventory items
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorised. Admin role required.' }, { status: 401 });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, name, sku, on_hand, min_stock, unit, category, updated_at FROM inventory_items ORDER BY name ASC'
    );
    return NextResponse.json({ items: rows });
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
    return NextResponse.json({ error: 'Failed to retrieve inventory items.' }, { status: 500 });
  }
}

// POST: Add new inventory item
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorised. Admin role required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, sku, on_hand = 0, min_stock = 5, unit = 'units', category = 'Supplies' } = body;

    if (!name?.trim() || !sku?.trim()) {
      return NextResponse.json({ error: 'Item name and SKU are required.' }, { status: 400 });
    }

    const cleanSku = sku.toUpperCase().trim();

    // Check SKU duplicate
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT id FROM inventory_items WHERE sku = ? LIMIT 1',
      [cleanSku]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An item with this SKU already exists.' }, { status: 409 });
    }

    const id = ulid();
    await db.query(
      'INSERT INTO inventory_items (id, name, sku, on_hand, min_stock, unit, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name.trim(), cleanSku, Math.max(0, Number(on_hand)), Math.max(0, Number(min_stock)), unit.trim(), category.trim()]
    );

    return NextResponse.json({ ok: true, id, message: 'Item added to inventory.' }, { status: 201 });
  } catch (error) {
    console.error('Failed to add inventory item:', error);
    return NextResponse.json({ error: 'Failed to add inventory item.' }, { status: 500 });
  }
}

// PATCH: Quick adjust stock quantity (+1, -1, or direct set)
export async function PATCH(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorised. Admin role required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, delta, on_hand } = body;

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required.' }, { status: 400 });
    }

    if (delta !== undefined) {
      // Incremental change (e.g. +1 or -1)
      const numDelta = Number(delta);
      await db.execute(
        'UPDATE inventory_items SET on_hand = GREATEST(0, on_hand + ?), updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
        [numDelta, id]
      );
    } else if (on_hand !== undefined) {
      // Direct set
      const newOnHand = Math.max(0, Number(on_hand));
      await db.execute(
        'UPDATE inventory_items SET on_hand = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
        [newOnHand, id]
      );
    } else {
      return NextResponse.json({ error: 'Either delta or on_hand must be provided.' }, { status: 400 });
    }

    // Return updated row
    const [updated] = await db.query<RowDataPacket[]>(
      'SELECT id, name, sku, on_hand, min_stock, unit, category, updated_at FROM inventory_items WHERE id = ? LIMIT 1',
      [id]
    );

    return NextResponse.json({ ok: true, item: updated[0] });
  } catch (error) {
    console.error('Failed to adjust inventory:', error);
    return NextResponse.json({ error: 'Failed to adjust inventory stock.' }, { status: 500 });
  }
}

// DELETE: Remove inventory item
export async function DELETE(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorised. Admin role required.' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Item ID is required.' }, { status: 400 });
    }

    await db.execute('DELETE FROM inventory_items WHERE id = ?', [id]);
    return NextResponse.json({ ok: true, message: 'Item deleted from inventory.' });
  } catch (error) {
    console.error('Failed to delete inventory item:', error);
    return NextResponse.json({ error: 'Failed to delete inventory item.' }, { status: 500 });
  }
}
