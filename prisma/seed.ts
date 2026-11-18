import { PrismaClient, Role, CourseStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);
  await prisma.user.upsert({ where:{email:'admin@prisma.local'}, update:{}, create:{name:'Administrador',email:'admin@prisma.local',password,role:Role.ADMIN} });
  const professor = await prisma.user.upsert({ where:{email:'professor@prisma.local'}, update:{}, create:{name:'Professor Prisma',email:'professor@prisma.local',password,role:Role.PROFESSOR} });
  await prisma.user.upsert({ where:{email:'aluno@prisma.local'}, update:{}, create:{name:'Aluno Prisma',email:'aluno@prisma.local',password,role:Role.ALUNO} });
  const category = await prisma.category.upsert({ where:{name:'Tecnologia'}, update:{}, create:{name:'Tecnologia',description:'Cursos relacionados à tecnologia'} });
  let course = await prisma.course.findFirst({where:{title:'Introdução ao Desenvolvimento Web',professorId:professor.id}});
  if (!course) course = await prisma.course.create({data:{title:'Introdução ao Desenvolvimento Web',description:'Curso de exemplo do PRISMA LMS.',status:CourseStatus.APPROVED,professorId:professor.id,categoryId:category.id}});
  let module = await prisma.module.findFirst({where:{courseId:course.id,order:1}});
  if (!module) module = await prisma.module.create({data:{title:'Fundamentos da Web',description:'Primeiro módulo do curso.',courseId:course.id,order:1}});
  for (const [order,title] of [[1,'Introdução à Web'],[2,'Cliente e Servidor']] as const) {
    const exists = await prisma.lesson.findFirst({where:{moduleId:module.id,order}});
    if (!exists) await prisma.lesson.create({data:{title,description:'Aula de exemplo.',videoUrl:`https://example.com/aula-${order}`,duration:600,moduleId:module.id,order}});
  }
  const existingQuiz = await prisma.quiz.findFirst({where:{moduleId:module.id,title:'Quiz - Fundamentos da Web'}});
  if (!existingQuiz) await prisma.quiz.create({data:{title:'Quiz - Fundamentos da Web',moduleId:module.id,questions:{create:[{question:'Qual protocolo é usado normalmente para acessar páginas web?',options:{create:[{text:'HTTP',correct:true},{text:'FTP',correct:false},{text:'SMTP',correct:false}]}}]}}});
  console.log('Seed concluído: admin/professor/aluno com senha 123456');
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(async()=>prisma.$disconnect());
