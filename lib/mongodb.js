import { MongoClient } from 'mongodb';

const dbName = process.env.MONGODB_DB || 'aiopsestatemedia';

let client;
let clientPromise;

function getClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set. Add it in Vercel dashboard → Settings → Environment Variables.');
  }
  if (!client) {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      tls: true,
    });
    clientPromise = client.connect().catch((err) => {
      client = null;
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

export default { then: (resolve, reject) => getClient().then(resolve, reject) };

export async function getDb() {
  const cp = getClient();
  const c = await cp;
  return c.db(dbName);
}
