import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/problem';

export const errorHandler: ErrorRequestHandler=(err,req,res,_next)=>{
  if(res.headersSent)return;
  let e:AppError;
  if(err instanceof AppError)e=err;
  else if(err instanceof ZodError)e=new AppError(400,'Dados inválidos',err.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ')||'Corpo da requisição inválido');
  else if(typeof err==='object'&&err!==null&&'code' in err){
    const code=(err as {code:string}).code;
    if(code==='P2002')e=new AppError(409,'Conflito','Já existe um registro com esses dados');
    else if(code==='P2025'||code==='P2003')e=new AppError(404,'Não encontrado','Registro relacionado não encontrado');
    else e=new AppError(400,'Operação inválida','Não foi possível processar os dados informados');
  } else if(err instanceof SyntaxError && 'body' in (err as any))e=new AppError(400,'JSON inválido','O corpo da requisição contém JSON inválido');
  else e=new AppError(500,'Erro interno','Ocorreu um erro interno no servidor');
  (req as any).log?.error?.({err,requestId:(req as any).requestId,correlationId:(req as any).correlationId,status:e.status}, 'request failed');
  res.status(e.status).type('application/problem+json').json({
    type:e.type==='about:blank'?`https://api.prisma.local/errors/${e.status}`:e.type,
    title:e.title,status:e.status,detail:e.detail,instance:req.originalUrl,
    requestId:(req as any).requestId,correlationId:(req as any).correlationId,
  });
};
