import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/local';
import { db } from '@/lib/db/client';
import { ulid } from 'ulid';
import type { RowDataPacket } from 'mysql2';

async function isAdmin() {
  const user = await currentUser();
  return user?.role === 'admin';
}

// GET: Retrieve all expenses with optional date filtering
export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorised. Admin role required.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = 'SELECT id, title, category, amount, expense_date, notes, vendor, created_at FROM expenses';
    const params: unknown[] = [];

    if (from && to) {
      query += ' WHERE expense_date >= ? AND expense_date <= ?';
      params.push(from, to);
    } else if (from) {
      query += ' WHERE expense_date >= ?';
      params.push(from);
    } else if (to) {
      query += ' WHERE expense_date <= ?';
      params.push(to);
    }

    query += ' ORDER BY expense_date DESC, created_at DESC';

    const [rows] = await db.query<RowDataPacket[]>(query, params);

    const totalExpenses = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    return NextResponse.json({
      expenses: rows,
      totalExpenses,
      count: rows.length
    });
  } catch (error) {
    console.error('Failed to query expenses:', error);
    return NextResponse.json({ error: 'Failed to retrieve expenses from database.' }, { status: 500 });
  }
}

// POST: Record a new studio expense
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorised. Admin role required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, category, amount, expense_date, notes = '', vendor = '' } = body;

    if (!title?.trim() || !category?.trim() || amount === undefined || !expense_date) {
      return NextResponse.json({ error: 'Title, category, amount, and date are required.' }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 });
    }

    const id = ulid();
    await db.query(
      'INSERT INTO expenses (id, title, category, amount, expense_date, notes, vendor) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, title.trim(), category.trim(), parsedAmount, expense_date, notes?.trim() || '', vendor?.trim() || '']
    );

    return NextResponse.json({ ok: true, id, message: 'Expense recorded successfully.' }, { status: 201 });
  } catch (error) {
    console.error('Failed to create expense:', error);
    return NextResponse.json({ error: 'Failed to record expense.' }, { status: 500 });
  }
}

// DELETE: Remove an expense
export async function DELETE(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorised. Admin role required.' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required.' }, { status: 400 });
    }

    await db.execute('DELETE FROM expenses WHERE id = ?', [id]);
    return NextResponse.json({ ok: true, message: 'Expense deleted.' });
  } catch (error) {
    console.error('Failed to delete expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense.' }, { status: 500 });
  }
}
