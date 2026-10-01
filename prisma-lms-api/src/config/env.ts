import 'dotenv/config';
export const env={port:Number(process.env.PORT||3000),mongoUrl:process.env.MONGO_URL||'mongodb://localhost:27017/prisma_lms',jwtSecret:process.env.JWT_SECRET||'dev-secret',jwtExpiresIn:process.env.JWT_EXPIRES_IN||'1d'};
