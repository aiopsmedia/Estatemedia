import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const { key } = await params;
    const { searchParams } = new URL(request.url);
    const query = {};

    searchParams.forEach((value, keyParam) => {
      if (keyParam !== 'key') {
        query[keyParam] = value;
      }
    });

    const db = await getDb();
    const result = await db.collection(key).find(query).sort({ createdAt: -1 }).toArray();

    const items = result.map(item => ({
      ...item,
      _id: item._id?.toString() || item._id,
      id: item._id?.toString() || item.id,
    }));

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { key } = await params;
    const body = await request.json();
    const db = await getDb();

    if (Array.isArray(body)) {
      const docs = body.map(item => {
        const { _id, id, ...rest } = item;
        if (_id && typeof _id === 'string') rest._id = _id;
        return rest;
      });
      const result = await db.collection(key).insertMany(docs);
      const insertedIds = Object.values(result.insertedIds).map(oid => oid.toString());
      return NextResponse.json({ ids: insertedIds, count: insertedIds.length });
    }

    const { _id, id, ...doc } = body;
    if (_id && typeof _id === 'string') doc._id = _id;
    if (!doc.createdAt) doc.createdAt = new Date().toISOString();
    const result = await db.collection(key).insertOne(doc);
    const newId = result.insertedId.toString();
    return NextResponse.json({ _id: newId, id: newId, ...doc });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
