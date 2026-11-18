# C4 — Diagrama de Containers

```mermaid
C4Container
  title PRISMA LMS — Containers
  Person(user, "Usuário LMS", "Aluno, professor ou administrador")
  System_Boundary(lms, "PRISMA LMS") {
    Container(api, "API REST", "Node.js 22, Express 5, TypeScript", "Valida, autentica, autoriza e aplica regras de LMS")
    ContainerDb(pg, "PostgreSQL", "PostgreSQL 16", "Usuários, cursos, matrículas, progresso, quizzes e chamados")
    ContainerDb(mongo, "MongoDB", "MongoDB 7", "Trilha de atividades e eventos")
  }
  Rel(user, api, "JSON/HTTPS", "JWT Bearer")
  Rel(api, pg, "TCP/SQL", "Prisma")
  Rel(api, mongo, "TCP", "MongoDB Driver")
```

PostgreSQL foi escolhido para integridade referencial, unicidade, transações e dados fortemente relacionados. MongoDB é usado para atividade append-oriented e consultas de trilha, permitindo evoluir eventos sem acoplamento ao modelo relacional.
