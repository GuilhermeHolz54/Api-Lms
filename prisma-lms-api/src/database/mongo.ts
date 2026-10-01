import { MongoClient } from 'mongodb'; import { env } from '../config/env';
const client=new MongoClient(env.mongoUrl); let db:any;
export async function connectMongo(){ await client.connect(); db=client.db(); }
export function activities(){ if(!db) throw new Error('MongoDB não conectado'); return db.collection('activities'); }
export async function logActivity(data:any){ await activities().insertOne({...data,timestamp:new Date()}); }
