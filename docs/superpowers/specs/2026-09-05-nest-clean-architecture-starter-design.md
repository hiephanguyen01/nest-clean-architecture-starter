# NestJS Clean Architecture Starter Design

## Goal

Build a production-oriented NestJS modular monolith starter with framework-independent Domain and Application layers, PostgreSQL persistence through Prisma 7, JWT access/refresh authentication with rotation, RBAC, structured errors/logging, health checks, Swagger, tests, CI and Docker tooling.

## Baseline

- Node.js: 22.12+ runtime compatibility; Docker image targets Node 24 LTS.
- NestJS: 12.x.
- TypeScript: strict, ESM/NodeNext.
- PostgreSQL.
- Prisma ORM: 7.10.x with `@prisma/adapter-pg`.
- npm.
- Vitest.
- ESLint + Prettier.

Prisma 7 is intentionally selected although Prisma 8 is current because this starter uses the stable generated-client + repository/mapper integration model while keeping an upgrade path open.

## Dependency rules

```text
Presentation -> Application
Infrastructure -> Application / Domain
Application -> Domain
Domain -> nothing external

Auth -> Users
Users -X-> Auth
```

Domain and Application may not import NestJS, Prisma, HTTP framework types, class-validator or class-transformer. Application use cases are plain TypeScript classes and are wired by Nest provider factories.

## Modules

### Users

Owns the User aggregate and identity invariants: `UserId`, canonical `Email`, `UserRole`, `UserStatus`, user repository contract, create/get use cases, Prisma mapper/repository, presenter and HTTP endpoints.

Public registration never accepts role/status. New registrations are always `USER` + `ACTIVE`.

### Auth

Owns credential workflows and security adapters: password hashing, token issuance/verification, refresh-session persistence, register/login/refresh/logout/me, JWT guard/current-user decorator and RBAC guard.

Password hashing uses Argon2id. Refresh token persistence uses an HMAC-SHA-256 digest rather than password hashing. Refresh rotation is atomic at the repository boundary so one refresh token cannot win twice.

## Error strategy

Domain/Application throw typed errors with stable codes. Presentation maps known errors to HTTP status codes through one global exception filter. Validation errors use the same error envelope and production responses never expose stack traces.

## Testing

- Domain/application unit tests do not require Nest or a database.
- Integration tests target PostgreSQL and exercise Prisma repositories.
- E2E tests boot the real Nest application and target PostgreSQL.
- Architecture rules are executable through dependency-cruiser.

## YAGNI decisions

No CQRS, event bus, generic repository, generic unit of work, base service, base use-case or generic `Result<T>` abstraction is introduced. Transactions remain use-case-specific; refresh rotation is the first concrete atomic persistence operation.
