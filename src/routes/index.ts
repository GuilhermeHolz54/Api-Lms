import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as a from '../controllers/auth.controller';
import * as c from '../controllers/course.controller';
import * as x from '../controllers/content.controller';
import * as q from '../controllers/quiz.controller';
import * as s from '../controllers/support.controller';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { idempotency } from '../middlewares/idempotency';

export const routes=Router();

const problem429=(req:any,res:any)=>res.status(429).setHeader('Retry-After','60').type('application/problem+json').json({
 type:'https://api.prisma.local/errors/429',title:'Limite excedido',status:429,
 detail:'Muitas requisições. Aguarde antes de tentar novamente.',instance:req.originalUrl,
 requestId:req.requestId,correlationId:req.correlationId,
});

const authLimit=rateLimit({windowMs:60000,limit:10,standardHeaders:true,legacyHeaders:false,handler:problem429});
const apiLimit=rateLimit({windowMs:60000,limit:100,standardHeaders:true,legacyHeaders:false,handler:problem429});

routes.use(apiLimit);
routes.post('/auth/register',authLimit,a.register);
routes.post('/auth/login',authLimit,a.login);
routes.use(authenticateToken);

routes.post('/courses',requireRole('PROFESSOR'),idempotency,c.create);
routes.get('/courses',c.list);
routes.get('/courses/:id',c.get);
routes.put('/courses/:id',requireRole('PROFESSOR','ADMIN'),idempotency,c.update);
routes.delete('/courses/:id',requireRole('ADMIN'),idempotency,c.remove);
routes.post('/courses/:id/approve',requireRole('ADMIN'),idempotency,c.status('APPROVED'));
routes.post('/courses/:id/reject',requireRole('ADMIN'),idempotency,c.status('REJECTED'));
routes.post('/courses/:courseId/enroll',requireRole('ALUNO'),idempotency,c.enroll);
routes.get('/users/me/courses',requireRole('ALUNO'),c.myCourses);
routes.get('/courses/:courseId/students',requireRole('PROFESSOR','ADMIN'),c.students);

routes.post('/courses/:courseId/modules',requireRole('PROFESSOR','ADMIN'),idempotency,x.createModule);
routes.get('/courses/:courseId/modules',x.modules);
routes.get('/modules/:id',x.moduleById);
routes.put('/modules/:id',requireRole('PROFESSOR','ADMIN'),idempotency,x.updateModule);
routes.delete('/modules/:id',requireRole('PROFESSOR','ADMIN'),idempotency,x.deleteModule);
routes.post('/modules/:moduleId/lessons',requireRole('PROFESSOR','ADMIN'),idempotency,x.createLesson);
routes.get('/modules/:moduleId/lessons',x.lessons);
routes.get('/lessons/:id',x.lessonById);
routes.put('/lessons/:id',requireRole('PROFESSOR','ADMIN'),idempotency,x.updateLesson);
routes.delete('/lessons/:id',requireRole('PROFESSOR','ADMIN'),idempotency,x.deleteLesson);
routes.post('/lessons/:lessonId/progress',requireRole('ALUNO'),idempotency,x.progress);
routes.get('/courses/:courseId/progress',requireRole('ALUNO'),x.courseProgress);

routes.post('/modules/:moduleId/quizzes',requireRole('PROFESSOR','ADMIN'),idempotency,q.create);
routes.get('/modules/:moduleId/quizzes',q.list);
routes.post('/quizzes/:quizId/attempt',requireRole('ALUNO'),idempotency,q.attempt);
routes.post('/support',idempotency,s.create);
routes.get('/support',s.list);
routes.get('/support/:id',s.get);
routes.put('/support/:id',requireRole('ADMIN'),idempotency,s.update);
