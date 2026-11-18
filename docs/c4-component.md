# C4 — Diagrama de Componentes

```mermaid
C4Component
  title API REST — Componentes
  Container_Boundary(api, "API") {
    Component(routes, "Routes", "Express Router", "Mapeia endpoints e aplica RBAC/rate limiting")
    Component(middleware, "Middlewares", "TypeScript", "JWT, request/correlation ID, idempotência e erros")
    Component(controllers, "Controllers", "TypeScript", "Traduz HTTP em chamadas de aplicação")
    Component(auth, "Serviço de autenticação", "TypeScript", "Cadastro, bcrypt e emissão JWT")
    Component(prisma, "Acesso Prisma", "Prisma Client", "Dados relacionais")
    Component(mongo, "Acesso MongoDB", "MongoDB Driver", "Eventos de atividade")
  }
  Rel(routes, middleware, "Executa")
  Rel(routes, controllers, "Despacha")
  Rel(controllers, auth, "Autenticação")
  Rel(controllers, prisma, "Lê/escreve")
  Rel(controllers, mongo, "Registra eventos")
```

A divisão em camadas mantém transporte HTTP separado das regras e do acesso a dados. Middlewares centralizam os controles transversais; controllers validam contratos; Prisma/Mongo concentram persistência.
