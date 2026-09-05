import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from '../../infrastructure/database/database.module.js';
import { SystemModule } from '../../infrastructure/system/system.module.js';
import { Clock } from '../../shared/application/ports/clock.js';
import { IdGenerator } from '../../shared/application/ports/id-generator.js';
import { CreateUserUseCase } from '../users/application/use-cases/create-user/create-user.use-case.js';
import { GetUserAuthenticationDataUseCase } from '../users/application/use-cases/get-user-authentication-data/get-user-authentication-data.use-case.js';
import { GetUserUseCase } from '../users/application/use-cases/get-user/get-user.use-case.js';
import { UsersModule } from '../users/users.module.js';
import { PasswordHasher } from './application/ports/password-hasher.js';
import { RefreshTokenHasher } from './application/ports/refresh-token-hasher.js';
import { TokenService } from './application/ports/token-service.js';
import { TokenPairIssuer } from './application/services/token-pair-issuer.js';
import { LoginUseCase } from './application/use-cases/login/login.use-case.js';
import { LogoutUseCase } from './application/use-cases/logout/logout.use-case.js';
import { MeUseCase } from './application/use-cases/me/me.use-case.js';
import { RefreshUseCase } from './application/use-cases/refresh/refresh.use-case.js';
import { RegisterUseCase } from './application/use-cases/register/register.use-case.js';
import { RefreshSessionRepository } from './domain/repositories/refresh-session.repository.js';
import { PrismaRefreshSessionRepository } from './infrastructure/persistence/prisma/prisma-refresh-session.repository.js';
import { ArgonPasswordHasher } from './infrastructure/security/argon-password-hasher.js';
import { HmacRefreshTokenHasher } from './infrastructure/security/hmac-refresh-token-hasher.js';
import { JwtTokenService } from './infrastructure/security/jwt-token.service.js';
import { AuthController } from './presentation/controllers/auth.controller.js';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard.js';
import { RolesGuard } from './presentation/guards/roles.guard.js';

@Module({
  imports: [UsersModule, DatabaseModule, SystemModule],
  controllers: [AuthController],
  providers: [
    ArgonPasswordHasher,
    HmacRefreshTokenHasher,
    JwtTokenService,
    PrismaRefreshSessionRepository,
    { provide: PasswordHasher, useExisting: ArgonPasswordHasher },
    { provide: RefreshTokenHasher, useExisting: HmacRefreshTokenHasher },
    { provide: TokenService, useExisting: JwtTokenService },
    { provide: RefreshSessionRepository, useExisting: PrismaRefreshSessionRepository },
    {
      provide: TokenPairIssuer,
      useFactory: (
        tokens: TokenService,
        refreshTokenHasher: RefreshTokenHasher,
        sessions: RefreshSessionRepository,
        ids: IdGenerator,
        clock: Clock,
      ) => new TokenPairIssuer(tokens, refreshTokenHasher, sessions, ids, clock),
      inject: [TokenService, RefreshTokenHasher, RefreshSessionRepository, IdGenerator, Clock],
    },
    {
      provide: RegisterUseCase,
      useFactory: (
        passwordHasher: PasswordHasher,
        createUser: CreateUserUseCase,
      ) => new RegisterUseCase(passwordHasher, createUser),
      inject: [PasswordHasher, CreateUserUseCase],
    },
    {
      provide: LoginUseCase,
      useFactory: (
        users: GetUserAuthenticationDataUseCase,
        passwordHasher: PasswordHasher,
        tokenPairIssuer: TokenPairIssuer,
      ) => new LoginUseCase(users, passwordHasher, tokenPairIssuer),
      inject: [GetUserAuthenticationDataUseCase, PasswordHasher, TokenPairIssuer],
    },
    {
      provide: RefreshUseCase,
      useFactory: (
        tokens: TokenService,
        refreshTokenHasher: RefreshTokenHasher,
        sessions: RefreshSessionRepository,
        getUser: GetUserUseCase,
        ids: IdGenerator,
        clock: Clock,
      ) => new RefreshUseCase(tokens, refreshTokenHasher, sessions, getUser, ids, clock),
      inject: [TokenService, RefreshTokenHasher, RefreshSessionRepository, GetUserUseCase, IdGenerator, Clock],
    },
    {
      provide: LogoutUseCase,
      useFactory: (
        tokens: TokenService,
        refreshTokenHasher: RefreshTokenHasher,
        sessions: RefreshSessionRepository,
        clock: Clock,
      ) => new LogoutUseCase(tokens, refreshTokenHasher, sessions, clock),
      inject: [TokenService, RefreshTokenHasher, RefreshSessionRepository, Clock],
    },
    {
      provide: MeUseCase,
      useFactory: (getUser: GetUserUseCase) => new MeUseCase(getUser),
      inject: [GetUserUseCase],
    },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
