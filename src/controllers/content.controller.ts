import { RequestHandler } from 'express';
import { prisma } from '../database/prisma';
import { AppError } from '../utils/problem';
import { logActivity } from '../database/mongo';
import { lessonSchema, moduleSchema, progressSchema } from '../schemas/common';

async function assertCourseAccess(courseId: string, user: any, write = false) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, 'Não encontrado', 'Curso não encontrado');
  if (write) {
    if (user.role !== 'ADMIN' && course.professorId !== user.id)
      throw new AppError(403, 'Acesso negado', 'Você não pode alterar este curso');
    return course;
  }
  if (user.role === 'ADMIN' || course.professorId === user.id) return course;
  if (course.status !== 'APPROVED')
    throw new AppError(404, 'Não encontrado', 'Conteúdo não encontrado');
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (!enrollment)
    throw new AppError(403, 'Matrícula necessária', 'Matricule-se no curso para acessar o conteúdo');
  return course;
}
async function moduleCourseId(moduleId: string) {
  const m = await prisma.module.findUnique({ where: { id: moduleId }, select: { courseId: true } });
  if (!m) throw new AppError(404, 'Não encontrado', 'Módulo não encontrado');
  return m.courseId;
}
async function lessonCourseId(lessonId: string) {
  const l = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!l) throw new AppError(404, 'Não encontrado', 'Aula não encontrada');
  return l.module.courseId;
}
export const createModule: RequestHandler = async (req, res, next) => {
  try {
    const data = moduleSchema.parse(req.body);
    await assertCourseAccess(req.params.courseId as string, (req as any).user, true);
    res.status(201).json(
      await prisma.module.create({
        data: {
          title: data.title,
          description: data.description,
          order: data.order,
          courseId: req.params.courseId as string,
        },
      }),
    );
  } catch (e) {
    next(e);
  }
};
export const modules: RequestHandler = async (req, res, next) => {
  try {
    await assertCourseAccess(req.params.courseId as string, (req as any).user);
    res.json(
      await prisma.module.findMany({
        where: { courseId: req.params.courseId as string },
        orderBy: { order: 'asc' },
      }),
    );
  } catch (e) {
    next(e);
  }
};
export const moduleById: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id as string;
    await assertCourseAccess(await moduleCourseId(id), (req as any).user);
    res.json(await prisma.module.findUnique({ where: { id } }));
  } catch (e) {
    next(e);
  }
};
export const updateModule: RequestHandler = async (req, res, next) => {
  try {
    const data = moduleSchema.parse(req.body);
    const id = req.params.id as string;
    await assertCourseAccess(await moduleCourseId(id), (req as any).user, true);
    res.json(
      await prisma.module.update({
        where: { id },
        data: { title: data.title, description: data.description, order: data.order },
      }),
    );
  } catch (e) {
    next(e);
  }
};
export const deleteModule: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id as string;
    await assertCourseAccess(await moduleCourseId(id), (req as any).user, true);
    await prisma.module.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
export const createLesson: RequestHandler = async (req, res, next) => {
  try {
    const data = lessonSchema.parse(req.body);
    await assertCourseAccess(await moduleCourseId(req.params.moduleId as string), (req as any).user, true);
    res.status(201).json(
      await prisma.lesson.create({
        data: {
          title: data.title,
          description: data.description,
          videoUrl: data.videoUrl,
          duration: data.duration,
          order: data.order,
          moduleId: req.params.moduleId as string,
        },
      }),
    );
  } catch (e) {
    next(e);
  }
};
export const lessons: RequestHandler = async (req, res, next) => {
  try {
    await assertCourseAccess(await moduleCourseId(req.params.moduleId as string), (req as any).user);
    res.json(
      await prisma.lesson.findMany({
        where: { moduleId: req.params.moduleId as string },
        orderBy: { order: 'asc' },
      }),
    );
  } catch (e) {
    next(e);
  }
};
export const lessonById: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id as string;
    await assertCourseAccess(await lessonCourseId(id), (req as any).user);
    res.json(await prisma.lesson.findUnique({ where: { id } }));
  } catch (e) {
    next(e);
  }
};
export const updateLesson: RequestHandler = async (req, res, next) => {
  try {
    const data = lessonSchema.parse(req.body);
    const id = req.params.id as string;
    await assertCourseAccess(await lessonCourseId(id), (req as any).user, true);
    res.json(
      await prisma.lesson.update({
        where: { id },
        data: { title: data.title, description: data.description, videoUrl: data.videoUrl, duration: data.duration, order: data.order },
      }),
    );
  } catch (e) {
    next(e);
  }
};
export const deleteLesson: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id as string;
    await assertCourseAccess(await lessonCourseId(id), (req as any).user, true);
    await prisma.lesson.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
export const progress: RequestHandler = async (req, res, next) => {
  try {
    const data = progressSchema.parse(req.body);
    const u = (req as any).user,
      lessonId = req.params.lessonId as string,
      courseId = await lessonCourseId(lessonId);
    await assertCourseAccess(courseId, u);
    const p = await prisma.progress.upsert({
      where: { userId_lessonId: { userId: u.id, lessonId } },
      update: {
        completed: data.completed,
        watchedSeconds: data.watchedSeconds,
        completedAt: data.completed ? new Date() : null,
      },
      create: {
        userId: u.id,
        lessonId,
        completed: data.completed,
        watchedSeconds: data.watchedSeconds,
        completedAt: data.completed ? new Date() : null,
      },
    });
    await logActivity({
      userId: u.id,
      lessonId,
      action: data.completed ? 'LESSON_COMPLETED' : 'LESSON_STARTED',
      requestId: (req as any).requestId,
      correlationId: (req as any).correlationId,
    });
    res.json(p);
  } catch (e) {
    next(e);
  }
};
export const courseProgress: RequestHandler = async (req, res, next) => {
  try {
    const uid = (req as any).user.id,
      courseId = req.params.courseId as string;
    await assertCourseAccess(courseId, (req as any).user);
    const lessons = await prisma.lesson.findMany({ where: { module: { courseId } }, select: { id: true } });
    const done = await prisma.progress.count({
      where: { userId: uid, lessonId: { in: lessons.map((x: { id: string }) => x.id) }, completed: true },
    });
    res.json({
      totalLessons: lessons.length,
      completedLessons: done,
      percentage: lessons.length ? Math.round((done / lessons.length) * 100) : 0,
    });
  } catch (e) {
    next(e);
  }
};
