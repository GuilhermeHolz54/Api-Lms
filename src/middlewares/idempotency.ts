import { createHash } from 'crypto';
import { RequestHandler } from 'express';
import { prisma } from '../database/prisma';
import { AppError } from '../utils/problem';

export const idempotency: RequestHandler=async(req,res,next)=>{
  const key=req.header('Idempotency-Key');
  if(!key||key.length<8||key.length>128)return next(new AppError(400,'Idempotency-Key inválida','Envie Idempotency-Key com 8 a 128 caracteres'));
  const user=(req as any).user;
  if(!user?.id)return next(new AppError(401,'Não autenticado','Autenticação necessária para idempotência'));
  const path=req.baseUrl+req.path;
  const requestHash=createHash('sha256').update(JSON.stringify(req.body||{})).digest('hex');
  const where={key_userId_method_path:{key,userId:user.id,method:req.method,path}};
  try {
    const found=await prisma.idempotencyRecord.findUnique({where});
    if(found){
      if(found.requestHash&&found.requestHash!==requestHash)return next(new AppError(422,'Payload incompatível','A mesma Idempotency-Key foi enviada com um conteúdo diferente'));
      if(found.expiresAt&&found.expiresAt<new Date())await prisma.idempotencyRecord.delete({where});
      else if(found.statusCode===0)return next(new AppError(409,'Requisição em processamento','A operação com esta chave ainda está sendo processada'));
      else return res.status(found.statusCode).json(found.response);
    }
    await prisma.idempotencyRecord.create({data:{key,userId:user.id,method:req.method,path,requestHash,statusCode:0,response:{},expiresAt:new Date(Date.now()+24*60*60*1000)}});
  } catch(e:any){
    if(e?.code==='P2002')return next(new AppError(409,'Requisição em processamento','Já existe uma operação com esta chave em andamento'));
    return next(e);
  }
  const originalJson=res.json.bind(res);
  (res as any).json=(body:any)=>{
    const statusCode=res.statusCode;
    if(statusCode>=400){void prisma.idempotencyRecord.deleteMany({where:{key,userId:user.id,method:req.method,path}});return originalJson(body);}
    void prisma.idempotencyRecord.update({where,data:{statusCode,response:body,expiresAt:new Date(Date.now()+24*60*60*1000)}}).then(()=>originalJson(body)).catch(()=>{void prisma.idempotencyRecord.deleteMany({where:{key,userId:user.id,method:req.method,path}});originalJson(body);});
    return res;
  };
  res.on('close',()=>{if(!res.writableEnded)void prisma.idempotencyRecord.deleteMany({where:{key,userId:user.id,method:req.method,path}})});
  next();
};
