import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/local';
import { db } from '@/lib/db/client';
import { ulid } from 'ulid';
import bcrypt from 'bcryptjs';
import type { RowDataPacket } from 'mysql2';

async function isAdmin() {
  const user = await currentUser();
  return user?.role === 'admin' ? user : null;
}

// GET: List all representatives with their activity counts
export async function GET() {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorised. Admin role required.' }, { status: 401 });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT u.id, u.full_name, u.email, u.is_active, u.created_at,
              COUNT(b.id) AS total_assigned_jobs,
              SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) AS completed_jobs,
              SUM(CASE WHEN b.status = 'in_progress' THEN 1 ELSE 0 END) AS active_jobs
       FROM users u
       LEFT JOIN bookings b ON b.assigned_rep_id = u.id
       WHERE u.role = 'rep'
       GROUP BY u.id
       ORDER BY u.created_at ASC`
    );

    return NextResponse.json({ representatives: rows });
  } catch (error) {
    console.error('Failed to fetch representatives:', error);
    return NextResponse.json({ error: 'Failed to fetch representatives from database.' }, { status: 500 });
  }
}

// POST: Create a new representative account
export async function POST(req: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorised. Admin role required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { full_name, email, password } = body;

    if (!full_name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Full name, email and password are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check email uniqueness
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [cleanEmail]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'A user account with this email already exists.' }, { status: 409 });
    }

    const id = ulid();
    const passwordHash = await bcrypt.hash(password, 12);

    await db.query(
      'INSERT INTO users (id, full_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, "rep", 1)',
      [id, full_name.trim(), cleanEmail, passwordHash]
    );

    return NextResponse.json({ ok: true, id, message: 'Representative created successfully.' }, { status: 201 });
  } catch (error) {
    console.error('Failed to create representative:', error);
    return NextResponse.json({ error: 'Failed to create representative.' }, { status: 500 });
  }
}

// PATCH: Update an existing representative account
export async function PATCH(req: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorised. Admin role required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, full_name, email, is_active, password } = body;

    if (!id) {
      return NextResponse.json({ error: 'Representative ID is required.' }, { status: 400 });
    }

    const [existingRows] = await db.query<RowDataPacket[]>(
      'SELECT id, email, role FROM users WHERE id = ? AND role = "rep" LIMIT 1',
      [id]
    );
    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'Representative not found.' }, { status: 404 });
    }

    const cleanEmail = email ? email.toLowerCase().trim() : existingRows[0].email;
    const cleanName = full_name ? full_name.trim() : null;
    const activeVal = typeof is_active === 'boolean' ? (is_active ? 1 : 0) : typeof is_active === 'number' ? is_active : 1;

    if (password && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
      }
      const newHash = await bcrypt.hash(password.trim(), 12);
      await db.execute(
        'UPDATE users SET full_name = COALESCE(?, full_name), email = ?, password_hash = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
        [cleanName, cleanEmail, newHash, activeVal, id]
      );
    } else {
      await db.execute(
        'UPDATE users SET full_name = COALESCE(?, full_name), email = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
        [cleanName, cleanEmail, activeVal, id]
      );
    }

    return NextResponse.json({ ok: true, message: 'Representative updated successfully.' });
  } catch (error) {
    console.error('Failed to update representative:', error);
    return NextResponse.json({ error: 'Failed to update representative.' }, { status: 500 });
  }
}

// DELETE: Delete or deactivate representative account
export async function DELETE(req: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorised. Admin role required.' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Representative ID is required.' }, { status: 400 });
    }

    // Check if rep has assigned bookings
    const [bookingRows] = await db.query<RowDataPacket[]>(
      'SELECT id FROM bookings WHERE assigned_rep_id = ? LIMIT 1',
      [id]
    );

    if (bookingRows.length > 0) {
      // Rep has linked bookings; deactivate instead of hard delete to preserve historical records
      await db.execute('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?', [id]);
      return NextResponse.json({
        ok: true,
        message: 'Representative deactivated. Linked booking history preserved.'
      });
    }

    // Hard delete if no linked bookings
    await db.execute('DELETE FROM users WHERE id = ? AND role = "rep"', [id]);
    return NextResponse.json({ ok: true, message: 'Representative deleted successfully.' });
  } catch (error) {
    console.error('Failed to delete representative:', error);
    return NextResponse.json({ error: 'Failed to delete representative.' }, { status: 500 });
  }
}
