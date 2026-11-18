import 'dotenv/config';
const production=process.env.NODE_ENV==='production';
const jwtSecret=process.env.JWT_SECRET;
if(production&&(!jwtSecret||jwtSecret.length<32))throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres em produção');
export const env={
 port:Number(process.env.PORT||3000),
 mongoUrl:process.env.MONGO_URL||'mongodb://localhost:27017/prisma_lms',
 jwtSecret:jwtSecret||'dev-only-secret-change-before-production-32-chars',
 jwtExpiresIn:process.env.JWT_EXPIRES_IN||'1d',
 jwtIssuer:process.env.JWT_ISSUER||'prisma-lms-api',
 jwtAudience:process.env.JWT_AUDIENCE||'prisma-lms-client',
 nodeEnv:process.env.NODE_ENV||'development',
};
