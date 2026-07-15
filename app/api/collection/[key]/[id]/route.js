import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

async function findDoc(db, collection, id) {
  let item;
  try {
    item = await db.collection(collection).findOne({ _id: new ObjectId(id) });
  } catch {}
  if (!item) {
    item = await db.collection(collection).findOne({ _id: id });
  }
  if (!item) {
    item = await db.collection(collection).findOne({ id });
  }
  return item;
}

export async function GET(request, { params }) {
  try {
    const { key, id } = await params;
    const db = await getDb();
    const item = await findDoc(db, key, id);

    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ...item, _id: item._id?.toString() || item._id, id: item._id?.toString() || item.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { key, id } = await params;
    const body = await request.json();
    const db = await getDb();

    const { _id, ...updates } = body;
    updates.updatedAt = new Date().toISOString();

    let result;
    try {
      result = await db.collection(key).updateOne(
        { _id: new ObjectId(id) },
        { $set: updates }
      );
    } catch {}
    if (!result || result.matchedCount === 0) {
      try {
        result = await db.collection(key).updateOne(
          { _id: id },
          { $set: updates }
        );
      } catch {}
    }
    if (!result || result.matchedCount === 0) {
      result = await db.collection(key).updateOne(
        { id },
        { $set: updates }
      );
    }

    if (!result || result.matchedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...updates });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { key, id } = await params;
    const db = await getDb();

    let result;
    try {
      result = await db.collection(key).deleteOne({ _id: new ObjectId(id) });
    } catch {}
    if (!result || result.deletedCount === 0) {
      try {
        result = await db.collection(key).deleteOne({ _id: id });
      } catch {}
    }
    if (!result || result.deletedCount === 0) {
      result = await db.collection(key).deleteOne({ id });
    }

    if (!result || result.deletedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
