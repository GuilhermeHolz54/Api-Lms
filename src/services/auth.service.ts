import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { prisma } from '../database/prisma';
import { env } from '../config/env';
import { AppError } from '../utils/problem';

export async function register(d: {name:string;email:string;password:string}) {
  const email = d.email.toLowerCase().trim();
  if (await prisma.user.findUnique({ where: { email } })) throw new AppError(409, 'Conflito', 'E-mail já cadastrado');
  const password = await bcrypt.hash(d.password, 12);
  const u = await prisma.user.create({ data: { name:d.name, email, password, role:'ALUNO' } });
  return { id:u.id, name:u.name, email:u.email, role:u.role };
}

export async function login(d: {email:string;password:string}) {
  const u = await prisma.user.findUnique({ where: { email:d.email.toLowerCase().trim() } });
  if (!u || !(await bcrypt.compare(d.password, u.password))) throw new AppError(401, 'Credenciais inválidas', 'E-mail ou senha incorretos');
  const token = jwt.sign(
    { id:u.id, email:u.email, role:u.role },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
      algorithm: 'HS256',
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
      subject: u.id,
      jwtid: randomUUID()
    }
  );
  return { token, user:{ id:u.id, name:u.name, email:u.email, role:u.role } };
}
