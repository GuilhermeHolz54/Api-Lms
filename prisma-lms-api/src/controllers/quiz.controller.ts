import { RequestHandler } from 'express';
import { prisma } from '../database/prisma';
import { logActivity } from '../database/mongo';
import { AppError } from '../utils/problem';

export const create: RequestHandler = async (req, res, next) => {
  try {
    const moduleId = req.params.moduleId as string;
    const quiz = await prisma.quiz.create({
      data: {
        title: req.body.title,
        moduleId,
        questions: {
          create: (req.body.questions || []).map((item: any) => ({
            question: item.question,
            options: { create: item.options },
          })),
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
    res.json(await prisma.quiz.findMany({
      where: { moduleId },
      include: { questions: { include: { options: { select: { id: true, text: true } } } } },
    }));
  } catch (error) { next(error); }
};

export const attempt: RequestHandler = async (req, res, next) => {
  try {
    const user = (req as any).user;
    const quizId = req.params.quizId as string;
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { include: { options: true } } },
    });
    if (!quiz) throw new AppError(404, 'Não encontrado', 'Quiz não encontrado');

    let score = 0;
    for (const question of quiz.questions) {
      const selected = req.body.answers?.[question.id];
      if (question.options.some((option) => option.id === selected && option.correct)) score++;
    }

    const attempt = await prisma.quizAttempt.create({
      data: { userId: user.id, quizId: quiz.id, score, total: quiz.questions.length },
    });
    await logActivity({ userId: user.id, action: 'QUIZ_COMPLETED', quizId: quiz.id, score, total: quiz.questions.length });
    res.json(attempt);
  } catch (error) { next(error); }
};
