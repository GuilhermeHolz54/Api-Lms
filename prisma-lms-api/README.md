# PRISMA LMS API
API REST acadêmica de um Learning Management System, construída com Node.js 22+, TypeScript, Express, Prisma ORM, PostgreSQL e MongoDB.

## Arquitetura
Arquitetura em camadas: Route → Middleware → Controller → Service/Regra de negócio → Repository/Prisma → Banco. O projeto mantém responsabilidades separadas sem criar complexidade desnecessária.

## Funcionalidades
JWT e RBAC (ADMIN/PROFESSOR/ALUNO), cursos com aprovação, módulos, aulas, matrículas, progresso percentual, quizzes, histórico MongoDB, chamados com SLA, Idempotency-Key, RFC 7807, X-Request-ID, Pino, rate limit, Swagger e Docker Compose.

## Executar com Docker
1. Tenha Docker Desktop instalado.
2. Na raiz: `docker compose up -d --build`
3. API: `http://localhost:3000`
4. Swagger: `http://localhost:3000/api-docs`
5. Saúde: `GET http://localhost:3000/health`

## Execução local
Copie `.env.example` para `.env`, ajuste DATABASE_URL/MONGO_URL para localhost, rode `npm install`, `npx prisma generate`, `npx prisma migrate dev --name init`, `npm run seed` e `npm run dev`.

## Usuários do seed
- ADMIN: admin@prisma.local / 123456
- PROFESSOR: professor@prisma.local / 123456
- ALUNO: aluno@prisma.local / 123456

## Autenticação
Faça `POST /auth/login`, copie `token` e no Swagger clique **Authorize**, informando `Bearer SEU_TOKEN` (ou somente o token conforme a interface do Swagger UI).

## Idempotência
As rotas críticas de criação de curso, matrícula e progresso exigem `Idempotency-Key`. A chave é armazenada junto do usuário, método e rota. Uma repetição retorna a resposta previamente salva, evitando duplicidade.

## RFC 7807 e Request-ID
Erros são retornados como `application/problem+json`, com type, title, status, detail, instance e requestId. Toda requisição recebe `X-Request-ID`; se o cliente enviar um, ele é reutilizado.

## PostgreSQL x MongoDB
PostgreSQL armazena dados relacionais e transacionais. MongoDB armazena o histórico de atividades (COURSE_ENROLLED, LESSON_STARTED, LESSON_COMPLETED, QUIZ_COMPLETED), pois eventos possuem estrutura flexível e são naturalmente documentais.

## SLA
Chamados possuem prazo automático: LOW 72h, MEDIUM 48h, HIGH 24h, CRITICAL 4h. Em um LMS isso representa compromisso de atendimento para incidentes que afetam aulas, acesso e avaliações.

## Segurança
Senhas com bcrypt, JWT, RBAC, rate limit de 10 req/min em login e cadastro e logs Pino com senha e Authorization redigidos.

## Observação acadêmica
A implementação foi mantida propositalmente simples. Em produção seriam adicionados testes automatizados, refresh tokens, cache/Redis para idempotência distribuída, filas, observabilidade e políticas mais completas de ownership.
