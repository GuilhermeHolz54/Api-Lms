import { RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/problem';

export const authenticateToken: RequestHandler = (req, _res, next) => {
  const h=req.header('authorization');
  if(!h?.startsWith('Bearer '))return next(new AppError(401,'Não autenticado','Token JWT ausente ou inválido'));
  try {
    const payload=jwt.verify(h.slice(7),env.jwtSecret,{algorithms:['HS256'],issuer:env.jwtIssuer,audience:env.jwtAudience}) as JwtPayload;
    if(!payload.id||!payload.role)throw new Error('Invalid payload');
    (req as any).user={id:payload.id,email:payload.email,role:payload.role};
    next();
  } catch { next(new AppError(401,'Não autenticado','Token JWT inválido ou expirado')); }
};

export const requireRole=(...roles:string[]):RequestHandler=>(req,_res,next)=>roles.includes((req as any).user?.role)?next():next(new AppError(403,'Acesso negado','Seu perfil não possui permissão para esta operação'));
