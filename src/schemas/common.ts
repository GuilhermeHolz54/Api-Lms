import { z } from 'zod';

// O cadastro público nunca aceita role: todo novo usuário nasce ALUNO.
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(255),
  password: z.string().min(8).max(128),
}).strict();

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
}).strict();

export const courseSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5000),
  cover: z.string().trim().url().max(2048).optional().or(z.literal('')),
  categoryId: z.uuid(),
}).strict();

export const moduleSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000).optional(),
  order: z.coerce.number().int().min(1).max(10000),
}).strict();

export const lessonSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000).optional(),
  videoUrl: z.string().trim().url().max(2048),
  duration: z.coerce.number().int().min(1).max(86400),
  order: z.coerce.number().int().min(1).max(10000),
}).strict();

export const progressSchema = z.object({
  completed: z.boolean(),
  watchedSeconds: z.coerce.number().int().min(0).max(86400),
}).strict();

export const quizSchema = z.object({
  title: z.string().trim().min(2).max(160),
  questions: z.array(z.object({
    question: z.string().trim().min(2).max(1000),
    options: z.array(z.object({
      text: z.string().trim().min(1).max(500),
      correct: z.boolean(),
    }).strict()).min(2).max(10).refine((options) => options.filter((option) => option.correct).length === 1, 'Cada pergunta deve possuir exatamente uma alternativa correta'),
  }).strict()).min(1).max(100),
}).strict();

export const quizAttemptSchema = z.object({
  answers: z.record(z.string(), z.string()),
}).strict();

export const supportSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  description: z.string().trim().min(5).max(5000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
}).strict();

export const supportStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']),
}).strict();
