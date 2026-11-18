import { RequestHandler } from 'express';
import { prisma } from '../database/prisma';
import { logActivity } from '../database/mongo';
import { AppError } from '../utils/problem';
import { quizAttemptSchema, quizSchema } from '../schemas/common';

export const create: RequestHandler = async (req, res, next) => {
  try {
    const data = quizSchema.parse(req.body);
    const moduleId = req.params.moduleId as string;
    const module = await prisma.module.findUnique({ where: { id: moduleId }, include: { course: true } });
    if (!module) throw new AppError(404, 'Não encontrado', 'Módulo não encontrado');
    const user = (req as any).user;
    if (user.role !== 'ADMIN' && module.course.professorId !== user.id) throw new AppError(403, 'Acesso negado', 'Somente o professor responsável pode criar quizzes');
    const quiz = await prisma.quiz.create({
      data: {
        title: data.title,
        moduleId,
        questions: {
          create: data.questions.map((item) => ({ question: item.question, options: { create: item.options } })),
        },
      },
      include: { questions: { include: { options: true } } },
    });
    res.status(201).json(quiz);
  } catch (error) { next(error); }
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    const moduleId = req.params.moduleId as string;
    const module = await prisma.module.findUnique({ where: { id: moduleId }, include: { course: true } });
    if (!module) throw new AppError(404, 'Não encontrado', 'Módulo não encontrado');
    const user = (req as any).user;
    if (user.role === 'ALUNO') {
      const enrolled = module.course.status === 'APPROVED' && await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: module.courseId } } });
      if (!enrolled) throw new AppError(403, 'Matrícula necessária', 'Matricule-se no curso para acessar os quizzes');
    } else if (user.role !== 'ADMIN' && module.course.professorId !== user.id) throw new AppError(403, 'Acesso negado', 'Você não tem acesso a este conteúdo');
    res.json(await prisma.quiz.findMany({
      where: { moduleId },
      include: { questions: { include: { options: { select: { id: true, text: true } } } } },
    }));
  } catch (error) { next(error); }
};

export const attempt: RequestHandler = async (req, res, next) => {
  try {
    const data = quizAttemptSchema.parse(req.body);
    const user = (req as any).user;
    const quizId = req.params.quizId as string;
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { include: { options: true } } },
    });
    if (!quiz) throw new AppError(404, 'Não encontrado', 'Quiz não encontrado');
    const module = await prisma.module.findUnique({ where: { id: quiz.moduleId }, include: { course: true } });
    if (!module || module.course.status !== 'APPROVED') throw new AppError(404, 'Não encontrado', 'Quiz não encontrado');
    const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: module.courseId } } });
    if (!enrollment) throw new AppError(403, 'Matrícula necessária', 'Matricule-se no curso para responder ao quiz');

    let score = 0;
    for (const question of quiz.questions) {
      const selected = data.answers[question.id];
      if (question.options.some((option: { id: string; questionId: string; correct: boolean }) => option.id === selected && option.questionId === question.id && option.correct)) score++;
    }

    const attempt = await prisma.quizAttempt.create({
      data: { userId: user.id, quizId: quiz.id, score, total: quiz.questions.length },
    });
    await logActivity({ userId: user.id, action: 'QUIZ_COMPLETED', quizId: quiz.id, score, total: quiz.questions.length, requestId: (req as any).requestId, correlationId: (req as any).correlationId });
    res.status(201).json(attempt);
  } catch (error) { next(error); }
};
