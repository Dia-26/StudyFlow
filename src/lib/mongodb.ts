import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/studyflow";
const dbName = process.env.MONGODB_DB || "studyflow";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDb() {
  if (cachedDb) return cachedDb;

  cachedClient = cachedClient || new MongoClient(uri);

  if (!cachedDb) {
    await cachedClient.connect();
    cachedDb = cachedClient.db(dbName);
  }

  return cachedDb;
}
