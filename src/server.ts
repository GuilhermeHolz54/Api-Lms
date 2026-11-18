import pino from 'pino';
import { app } from './app';
import { env } from './config/env';
import { connectMongo, disconnectMongo } from './database/mongo';
import { prisma } from './database/prisma';

const logger=pino({level:env.nodeEnv==='production'?'info':'debug'});

async function start(){
  await prisma.$connect();
  await connectMongo();
  const server=app.listen(env.port,()=>logger.info({port:env.port,service:'prisma-lms-api'},'API listening'));
  let shuttingDown=false;
  const shutdown=async()=>{
    if(shuttingDown)return;
    shuttingDown=true;
    server.close(async()=>{
      await Promise.allSettled([prisma.$disconnect(),disconnectMongo()]);
      logger.info('API stopped');
      process.exit(0);
    });
    setTimeout(()=>process.exit(1),10000).unref();
  };
  process.on('SIGTERM',shutdown);
  process.on('SIGINT',shutdown);
}

start().catch(async error=>{
  logger.error({err:error},'Failed to start API');
  await Promise.allSettled([prisma.$disconnect(),disconnectMongo()]);
  process.exit(1);
});
