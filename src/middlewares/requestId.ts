import { randomUUID } from 'crypto';
import { RequestHandler } from 'express';

const safeId = (value: string | undefined) => (value && /^[A-Za-z0-9._:-]{1,100}$/.test(value) ? value : undefined);

export const requestId: RequestHandler = (req, res, next) => {
  const requestId = safeId(req.header('X-Request-ID')) || randomUUID();
  const correlationId = safeId(req.header('X-Correlation-ID')) || requestId;
  (req as any).requestId = requestId;
  (req as any).correlationId = correlationId;
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Correlation-ID', correlationId);
  next();
};
