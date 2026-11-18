import { RequestHandler } from 'express';
import { prisma } from '../database/prisma';
import { AppError } from '../utils/problem';
import { supportSchema, supportStatusSchema } from '../schemas/common';

const hours: Record<string,number> = { LOW:72, MEDIUM:48, HIGH:24, CRITICAL:4 };
export const create:RequestHandler = async(req,res,next)=>{ try {
  const data=supportSchema.parse(req.body);
  const deadline=new Date(Date.now()+hours[data.priority]*3600000);
  res.status(201).json(await prisma.supportRequest.create({data:{subject:data.subject,description:data.description,priority:data.priority,userId:(req as any).user.id,deadline}}));
 } catch(e){next(e)} };
export const list:RequestHandler=async(req,res,next)=>{try{const u=(req as any).user;res.json(await prisma.supportRequest.findMany({where:u.role==='ADMIN'?{}:{userId:u.id},orderBy:{createdAt:'desc'}}))}catch(e){next(e)}};
export const get:RequestHandler=async(req,res,next)=>{try{const u=(req as any).user;const item=await prisma.supportRequest.findUnique({where:{id:req.params.id as string}});if(!item)throw new AppError(404,'Não encontrado','Chamado não encontrado');if(u.role!=='ADMIN'&&item.userId!==u.id)throw new AppError(404,'Não encontrado','Chamado não encontrado');res.json(item)}catch(e){next(e)}};
export const update:RequestHandler=async(req,res,next)=>{try{const data=supportStatusSchema.parse(req.body);const item=await prisma.supportRequest.update({where:{id:req.params.id as string},data:{status:data.status}});res.json(item)}catch(e){next(e)}};
