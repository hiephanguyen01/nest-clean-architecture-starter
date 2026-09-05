# NestJS Clean Architecture Starter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a runnable, testable NestJS Clean Architecture starter with Users/Auth, Prisma/PostgreSQL, security, observability, health, CI and Docker.

**Architecture:** Domain and Application remain pure TypeScript. NestJS exists only in presentation/composition/infrastructure. Module dependencies are one-way: Auth may use Users application contracts, while Users never imports Auth.

**Tech Stack:** Node.js, NestJS 12, TypeScript strict ESM, PostgreSQL, Prisma 7, Argon2, JWT, Pino, Vitest, dependency-cruiser, Docker.

**Spec:** `docs/superpowers/specs/2026-09-05-nest-clean-architecture-starter-design.md`

## Global Constraints

- Domain/Application must not import NestJS, Prisma or HTTP types.
- `Auth -> Users`; `Users -> Auth` is forbidden.
- No raw password or refresh token persistence/logging.
- No speculative CQRS/event-bus/generic repository/unit-of-work abstractions.
- TDD for behavior-bearing production code.
- Commands are marked PASS only after real exit code 0.

---

### Task 1: Project bootstrap and executable architecture guard

**Files:** package/tooling configs, `src/main.ts`, `src/app.module.ts`, config/logger/swagger/error infrastructure, dependency-cruiser config.

**Produces:** compiling Nest bootstrap, typed validated config, global validation/error envelope, request-id logging, architecture check command.

- [ ] Add package/config/tooling files and install pinned dependencies.
- [ ] Add architecture rules before business code and verify the checker executes.
- [ ] Add bootstrap/config tests where behavior exists, then minimal implementation.
- [ ] Run format/lint/typecheck/build/architecture checks.

### Task 2: Users domain with TDD

**Files:** `src/modules/users/domain/**` and specs.

**Produces:** `UserId`, `Email`, `User`, roles/status/errors and repository contract.

- [ ] Write failing Email/User tests for canonicalization and invariants.
- [ ] Run RED tests.
- [ ] Implement minimal domain types.
- [ ] Run GREEN tests and refactor.

### Task 3: Users application and persistence

**Files:** `src/modules/users/application/**`, `src/modules/users/infrastructure/**`, presentation and `users.module.ts`.

**Produces:** create/get use cases, Prisma mapping/repository, users HTTP boundary and admin RBAC target route.

- [ ] Write failing use-case tests with in-memory repository.
- [ ] Implement pure TypeScript use cases.
- [ ] Add Prisma schema/client/database module and explicit mapper/repository.
- [ ] Add presentation DTOs/presenters/controllers and DI factories.
- [ ] Add PostgreSQL integration tests for mapping and unique email behavior.

### Task 4: Auth core and secure session rotation

**Files:** `src/modules/auth/application/**`, `domain/**`, `infrastructure/security/**`, refresh-session Prisma repository.

**Produces:** PasswordHasher, RefreshTokenHasher, TokenService, refresh repository, register/login/refresh/logout/me use cases.

- [ ] Write failing unit tests for registration/login/refresh/logout including concurrent refresh semantics at the port contract level.
- [ ] Implement ports and application errors/use cases.
- [ ] Implement Argon2, HMAC-SHA256 and JWT adapters.
- [ ] Implement Prisma refresh-session persistence with atomic rotation.
- [ ] Run unit tests.

### Task 5: Auth presentation and RBAC

**Files:** auth controller/DTO/presenter/guard/decorator/module.

**Produces:** `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`, JWT auth guard, current user decorator, roles decorator/guard.

- [ ] Add tests for auth guard and roles behavior where practical.
- [ ] Implement presentation boundary and module wiring.
- [ ] Protect an admin users route to prove RBAC.
- [ ] Run unit/type/lint checks.

### Task 6: Health, runtime security and API documentation

**Files:** health module/controllers, bootstrap security middleware, Swagger decorators/config.

**Produces:** `/health`, `/health/live`, `/health/ready`, DB readiness, Helmet/CORS/throttling/payload limit, optional Swagger.

- [ ] Add health readiness test around database health port/adapter.
- [ ] Implement runtime security and graceful shutdown.
- [ ] Implement Swagger bearer auth and documented common error responses.
- [ ] Run build/tests.

### Task 7: Integration/E2E suite

**Files:** `test/integration/**`, `test/e2e/**`, Vitest configs/setup.

**Produces:** PostgreSQL repository integration coverage and real-app auth/RBAC e2e coverage.

- [ ] Add isolated PostgreSQL test database setup contract.
- [ ] Cover register/login/me/refresh rotation/logout.
- [ ] Cover 401/403/ADMIN success.
- [ ] Cover refresh reuse and unique-email conflict.
- [ ] Run when PostgreSQL/Docker is available; otherwise record NOT VERIFIED rather than faking PASS.

### Task 8: Production tooling and documentation

**Files:** Dockerfile, compose, `.dockerignore`, `.env.example`, CI workflow, README.

**Produces:** non-root multi-stage image, dev compose API/Postgres health checks, CI gates and onboarding instructions.

- [ ] Add production Dockerfile and development Compose.
- [ ] Add GitHub Actions PostgreSQL-backed CI.
- [ ] Document install/migrate/run/test/security/architecture conventions.
- [ ] Run final quality gate and fix all executable failures.
