import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasMongoUri = !!process.env.MONGODB_URI;
  const hasMongoDb = !!process.env.MONGODB_DB;
  return NextResponse.json({
    mongodb_uri_set: hasMongoUri,
    mongodb_db_set: hasMongoDb,
    node_env: process.env.NODE_ENV,
  });
}
