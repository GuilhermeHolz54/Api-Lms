import {randomUUID} from 'crypto'; import {RequestHandler} from 'express';
export const requestId:RequestHandler=(req,res,next)=>{ const id=String(req.header('X-Request-ID')||randomUUID()); (req as any).requestId=id; res.setHeader('X-Request-ID',id); next(); };
