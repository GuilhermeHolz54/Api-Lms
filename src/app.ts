import express from 'express';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { randomUUID } from 'crypto';
import { routes } from './routes';
import { requestId } from './middlewares/requestId';
import { errorHandler } from './middlewares/error';
import { swagger } from './docs/swagger';

export const app=express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(requestId);
app.use(pinoHttp({
 genReqId:req=>((req as any).requestId||randomUUID()),
 customProps:(req)=>({
  requestId:(req as any).requestId,
  correlationId:(req as any).correlationId,
  userId:(req as any).user?.id,
 }),
 redact:['req.headers.authorization','req.body.password','res.headers["set-cookie"]'],
}));
app.use(express.json({limit:'1mb'}));
app.get('/',(_req,res)=>res.json({
 name:'PRISMA LMS API',
 status:'online',
 health:'/health',
 documentation:'/api-docs',
 openapi:'/openapi.json',
}));
app.get('/health',(_req,res)=>res.json({status:'ok',service:'prisma-lms-api'}));
app.get('/openapi.json',(_req,res)=>res.json(swagger));
app.use('/api-docs',swaggerUi.serve,swaggerUi.setup(swagger,{customSiteTitle:'PRISMA LMS API'}));
app.use(routes);
app.use((req,res)=>res.status(404).type('application/problem+json').json({
 type:'https://api.prisma.local/errors/404',
 title:'Não encontrado',
 status:404,
 detail:'Rota não encontrada',
 instance:req.originalUrl,
 requestId:(req as any).requestId,
 correlationId:(req as any).correlationId,
}));
app.use(errorHandler);
