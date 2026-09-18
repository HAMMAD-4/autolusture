import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/local';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role
    }
  });
}
