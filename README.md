# NestJS Clean Architecture Starter

Production-oriented NestJS modular monolith starter with explicit Clean Architecture boundaries, PostgreSQL/Prisma persistence, JWT authentication with refresh-token rotation, RBAC, structured logging, health checks, Swagger, tests, Docker and CI.

## Technology baseline

- Node.js 24.15+
- NestJS 12
- TypeScript strict + ESM/NodeNext
- PostgreSQL 17+
- Prisma ORM 7.10 (`prisma-client` generator + `@prisma/adapter-pg`)
- Vitest
- Pino / `nestjs-pino`
- ESLint + Prettier

Prisma 7 is intentionally pinned for this starter because it keeps the generated-client/repository/mapper model simple and stable. Prisma remains isolated in infrastructure so a future ORM or Prisma-major migration does not affect Domain/Application.

## Architecture

```text
src/
├── main.ts
├── app.module.ts
├── bootstrap/
│   └── configure-app.ts
├── shared/
│   ├── application/ports/
│   └── presentation/
├── modules/
│   ├── users/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── presentation/
│   │   └── users.module.ts
│   └── auth/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       ├── presentation/
│       └── auth.module.ts
└── infrastructure/
    ├── config/
    ├── database/
    ├── health/
    ├── logger/
    ├── swagger/
    └── system/
```

Dependency direction:

```text
Presentation -> Application
Infrastructure -> Application / Domain
Application -> Domain
Domain -> no external package/framework

Auth -> Users
Users -X-> Auth
```

`npm run architecture:check` enforces these rules and detects relative-import cycles without requiring another architecture framework.

### Intentional non-features

This starter does **not** add CQRS, an event bus, a generic repository, a generic Unit of Work, base services, base use cases, factories or `Result<T>` wrappers without a concrete need.

## Quick start

### 1. Install dependencies

```bash
npm install
```

Commit the generated `package-lock.json` in your repository. Subsequent clean installs should use `npm ci`.

### 2. Configure environment

```bash
cp .env.example .env
```

Replace every `replace-*` password/secret with real random values. Startup fails fast if access-token, refresh-token and refresh-token-HMAC secrets are reused.

### 3. Start PostgreSQL

Start only the database:

```bash
docker compose up -d postgres
```

Or run the full development stack:

```bash
docker compose up --build
```

### 4. Generate Prisma client

```bash
npm run prisma:generate
```

### 5. Apply migrations

```bash
npm run prisma:migrate:deploy
```

For a new schema change during development:

```bash
npm run prisma:migrate -- --name describe_change
```

### 6. Start the API

```bash
npm run start:dev
```

Default development endpoints:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs` when `SWAGGER_ENABLED=true`
- Readiness: `http://localhost:3000/health/ready`

## API

### Authentication

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

Registration creates the account only. Login creates an access/refresh token pair and refresh session. This avoids a partial registration state where a user is persisted but session creation fails.

`POST /auth/register` never accepts `role` or `status`; public users are always created as:

```text
role   = USER
status = ACTIVE
```

### RBAC proof route

```text
GET /users/:id
```

This route is `ADMIN` only and is included deliberately so the starter proves RBAC end-to-end:

```text
anonymous -> 401
USER      -> 403
ADMIN     -> 200
```

## Authentication design

### Passwords

- Raw passwords are accepted only at the presentation/application boundary.
- Password length policy (12-128 characters) is enforced in both HTTP DTO validation and the Register application use case.
- Passwords are hashed with Argon2id through the `PasswordHasher` application port.
- Users receives only `passwordHash`.
- Plaintext passwords are never persisted or logged.

### Access tokens

- Short-lived JWT.
- Sent as `Authorization: Bearer <token>`.
- Signed with a dedicated access secret.
- Contains `sub`, `jti`, `iss`, `aud`, `iat`, `exp`, `role` and token type.

### Refresh tokens

- Signed with a separate refresh secret.
- Contains `sub`, `sid`, `jti`, `iss`, `aud`, `iat`, `exp` and token type.
- Raw refresh tokens are never persisted.
- Persistence stores an HMAC-SHA-256 digest using a separate HMAC secret.
- Every successful refresh rotates the session.
- Rotation uses one Prisma transaction: revoke the active session conditionally, then create its replacement.
- Two concurrent refresh attempts using the same session can produce at most one successful rotation.
- Logout revokes the referenced active refresh session.

## Error format

Known Domain/Application errors are translated only at the presentation boundary.

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "messages": ["email must be an email"]
    }
  ],
  "timestamp": "2026-09-05T00:00:00.000Z",
  "path": "/auth/register",
  "requestId": "..."
}
```

Domain/Application never throw Nest `HttpException` classes.

## Validation

Global validation uses:

```text
whitelist: true
forbidNonWhitelisted: true
transform: true
```

HTTP DTOs stay in `presentation/dto`. Application inputs/outputs are plain TypeScript contracts.

## Logging

HTTP logs are structured JSON via Pino and include request ID, method, URL, status and duration. When available at log time, the authenticated user ID is attached.

Sensitive paths are redacted and request serializers intentionally avoid dumping headers/body. Never add raw logging for:

- `Authorization`
- passwords/password hashes
- access tokens
- refresh tokens
- cookies
- database credentials
- JWT/HMAC secrets

`x-request-id` values up to 128 characters are accepted when supplied and generated otherwise; the ID is echoed in the response header and error envelope.

## Runtime security

The bootstrap enables:

- Helmet
- CORS allowlist from `CORS_ORIGINS`
- global rate limiting
- stricter auth-endpoint throttling
- request payload limits
- optional proxy trust
- strict environment validation/fail-fast startup
- graceful shutdown hooks

The default throttler storage is in-memory. For horizontally scaled multi-replica production deployment, replace it with distributed storage such as Redis; Redis is intentionally not included in this starter.

## Swagger

Swagger is exposed at `SWAGGER_PATH` only when `SWAGGER_ENABLED=true`. Keep it disabled in production unless public API documentation is intended.

Bearer authentication, request DTOs, success responses and common error schemas are documented.

## Health checks

```text
GET /health
GET /health/live
GET /health/ready
```

`/health/ready` executes a PostgreSQL query. Liveness deliberately does not depend on external infrastructure.

## Tests

### Unit

```bash
npm test
npm run test:watch
npm run test:cov
```

Domain/Application tests use pure TypeScript and in-memory/fake ports; no Nest testing module or database is required for core business tests.

### PostgreSQL integration

Set a dedicated test database. Never point this variable at development or production data:

```bash
export TEST_DATABASE_URL='postgresql://app:password@localhost:5432/app_test?schema=public'
export DATABASE_URL="$TEST_DATABASE_URL"
npm run prisma:migrate:deploy
npm run test:integration
```

Integration tests cover:

- Domain Entity <-> Prisma mapping
- canonical unique email persistence
- concurrent duplicate-email arbitration by PostgreSQL
- atomic refresh-session rotation

### E2E

With the same isolated test database:

```bash
npm run test:e2e
```

E2E boots `AppModule` through the same `configureApp()` used by production, so global validation/security/filter behavior is included instead of testing a weaker app configuration.

Covered flows include register, login, me, refresh rotation/reuse, logout and RBAC.

## Scripts

```text
npm run start:dev
npm run build
npm run lint
npm run format
npm run format:check
npm run typecheck
npm run architecture:check
npm test
npm run test:watch
npm run test:integration
npm run test:e2e
npm run test:cov
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate
npm run prisma:migrate:deploy
npm run prisma:studio
```

## Docker

The Dockerfile has development/build/production stages. The production image:

- runs as the non-root `node` user;
- contains only production dependencies and compiled output;
- does not copy `.env`;
- uses `dumb-init` for signal handling;
- does not run migrations implicitly at API startup.

Run migrations as an explicit deployment step before rolling out a production API image.

## CI

`.github/workflows/ci.yml` starts isolated PostgreSQL and runs:

```text
install
Prisma generate
Prisma migrate deploy
format check
architecture check
lint
typecheck
build
unit tests
integration tests
e2e tests
coverage
Docker build
```

Once `package-lock.json` exists, CI automatically uses `npm ci`; the fallback to `npm install` is only for the initial generated starter before a lockfile has been created.

## Adding a new business module

Prefer this shape:

```text
src/modules/orders/
├── domain/
├── application/
├── infrastructure/
├── presentation/
└── orders.module.ts
```

Rules:

1. Start with Domain invariants and failing tests.
2. Add Application use cases using Domain repository/port abstractions.
3. Implement persistence/external dependencies in Infrastructure.
4. Add HTTP DTO/controller/presenter in Presentation.
5. Wire everything in the module composition root.
6. Run `npm run architecture:check` before review.
7. Do not add shared abstractions until there is a real shared consumer.
