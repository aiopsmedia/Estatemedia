import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const db = await getDb();
    const user = await db.collection('users').findOne({ email, password });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const role = await db.collection('roles').findOne({ _id: user.roleId });
    const { password: _, ...safeUser } = user;
    return NextResponse.json({
      ...safeUser,
      _id: safeUser._id?.toString() || safeUser._id,
      id: safeUser._id?.toString() || safeUser.id,
      role: role ? {
        ...role,
        _id: role._id?.toString() || role._id,
        id: role._id?.toString() || role.id,
      } : null,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
