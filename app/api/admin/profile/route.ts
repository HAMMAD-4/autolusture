import { NextResponse } from 'next/server';
import { currentUser, makeSession, sessionCookie } from '@/lib/auth/local';
import { db } from '@/lib/db/client';
import bcrypt from 'bcryptjs';
import type { RowDataPacket } from 'mysql2';

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised. Admin role required.' }, { status: 401 });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, full_name, email, role, is_active, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    return NextResponse.json({ profile: rows[0] });
  } catch (error) {
    console.error('Failed to get profile:', error);
    return NextResponse.json({ error: 'Failed to retrieve admin profile.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised. Admin role required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { full_name, email, current_password, new_password } = body;

    // Fetch full current user row including password_hash
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, full_name, email, password_hash, role FROM users WHERE id = ? LIMIT 1',
      [user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    const currentDbUser = rows[0];

    const nextName = full_name?.trim() || currentDbUser.full_name;
    const nextEmail = email ? email.toLowerCase().trim() : currentDbUser.email;

    // If changing email, check uniqueness
    if (nextEmail !== currentDbUser.email) {
      const [existing] = await db.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1',
        [nextEmail, user.id]
      );
      if (existing.length > 0) {
        return NextResponse.json({ error: 'This email is already in use by another account.' }, { status: 409 });
      }
    }

    let nextPasswordHash = currentDbUser.password_hash;

    // If password update requested
    if (new_password) {
      if (!current_password) {
        return NextResponse.json({ error: 'Current password is required to set a new password.' }, { status: 400 });
      }

      const match = await bcrypt.compare(current_password, currentDbUser.password_hash);
      if (!match) {
        return NextResponse.json({ error: 'Current password does not match.' }, { status: 400 });
      }

      if (new_password.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
      }

      nextPasswordHash = await bcrypt.hash(new_password, 12);
    }

    await db.execute(
      'UPDATE users SET full_name = ?, email = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
      [nextName, nextEmail, nextPasswordHash, user.id]
    );

    // Issue updated session cookie
    const updatedSession = makeSession({
      id: user.id,
      role: user.role,
      full_name: nextName
    });

    const response = NextResponse.json({
      ok: true,
      message: 'Admin profile updated successfully.',
      profile: {
        id: user.id,
        full_name: nextName,
        email: nextEmail,
        role: user.role
      }
    });

    response.cookies.set(sessionCookie.name, updatedSession, sessionCookie.options);

    return response;
  } catch (error) {
    console.error('Failed to update admin profile:', error);
    return NextResponse.json({ error: 'Failed to update admin profile.' }, { status: 500 });
  }
}
