import { MongoClient } from 'mongodb';
import { env } from '../config/env';

const client=new MongoClient(env.mongoUrl);
let db:any;

export async function connectMongo(){
 await client.connect();
 db=client.db();
 await db.collection('activities').createIndexes([
  {key:{userId:1,timestamp:-1},name:'activities_user_timestamp'},
  {key:{courseId:1,timestamp:-1},name:'activities_course_timestamp'},
  {key:{quizId:1,timestamp:-1},name:'activities_quiz_timestamp'},
 ]);
}

export async function disconnectMongo(){await client.close();}
export function activities(){if(!db)throw new Error('MongoDB não conectado');return db.collection('activities');}
export async function logActivity(data:any){await activities().insertOne({...data,timestamp:new Date()});}
