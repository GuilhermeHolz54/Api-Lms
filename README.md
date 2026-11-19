# PRISMA LMS API — versão N2

API REST para plataforma de cursos online (LMS), com Node.js 22, TypeScript, Express 5, Prisma, PostgreSQL e MongoDB.

## Arquitetura

Arquitetura em camadas: `Routes → Middlewares → Controllers → Services/regras de negócio → Prisma/MongoDB → bancos`. PostgreSQL mantém dados relacionais e transacionais; MongoDB mantém eventos de atividade.

Documentação C4 e modelagem UML/ER estão em `docs/`:
- `docs/c4-context.md`
- `docs/c4-container.md`
- `docs/c4-component.md`
- `docs/modelagem.md`

## Executar com Docker

1. Copie `.env.example` para `.env`.
2. Defina `JWT_SECRET` com pelo menos 32 caracteres aleatórios.
3. Execute:

```bash
docker compose up -d --build
docker compose ps
```

Acesse `http://localhost:3000/health`, `http://localhost:3000/api-docs` e `http://localhost:3000/openapi.json`.

A API executa migrations Prisma com `prisma migrate deploy` e depois aplica o seed.

## Usuários de demonstração

- ADMIN: `admin@prisma.local` / `123456`
- PROFESSOR: `professor@prisma.local` / `123456`
- ALUNO: `aluno@prisma.local` / `123456`

Troque as senhas demonstrativas antes de publicar o projeto.

## Controles implementados

- JWT com algoritmo HS256, issuer, audience e jti;
- RBAC ADMIN/PROFESSOR/ALUNO;
- validação Zod em todos os principais contratos de entrada;
- Idempotency-Key com hash do payload e expiração;
- erros RFC 7807 com `X-Request-ID` e `X-Correlation-ID`;
- logs HTTP estruturados em JSON;
- rate limit global e mais restritivo em autenticação;
- OpenAPI/Swagger e schema `/openapi.json`;
- migrations Prisma versionadas;
- PostgreSQL para dados relacionais e MongoDB para trilha de atividades.

## Testes e build

```bash
npm install
npm run prisma:generate
npm test
npm run build
```

## Idempotência

Envie `Idempotency-Key` entre 8 e 128 caracteres nas operações críticas documentadas. A chave fica vinculada ao usuário, método e rota. Repetições concluem a mesma resposta; payloads diferentes com a mesma chave recebem 422; simultaneidade recebe 409.

## Segurança e produção

Não versionar `.env`. Em produção use `NODE_ENV=production`, um `JWT_SECRET` forte e URLs gerenciadas para PostgreSQL/MongoDB. Habilite HTTPS no proxy ou plataforma de publicação. Os bancos locais estão limitados a `127.0.0.1` no Compose.




API: https://api-lms-wjmw.onrender.com



Documentação Swagger: https://api-lms-wjmw.onrender.com/api-docs



Verificação: https://api-lms-wjmw.onrender.com/healthz
