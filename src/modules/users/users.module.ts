import { Module } from '@nestjs/common';
import { Clock } from '../../shared/application/ports/clock.js';
import { IdGenerator } from '../../shared/application/ports/id-generator.js';
import { DatabaseModule } from '../../infrastructure/database/database.module.js';
import { SystemModule } from '../../infrastructure/system/system.module.js';
import { CreateUserUseCase } from './application/use-cases/create-user/create-user.use-case.js';
import { GetUserAuthenticationDataUseCase } from './application/use-cases/get-user-authentication-data/get-user-authentication-data.use-case.js';
import { GetUserUseCase } from './application/use-cases/get-user/get-user.use-case.js';
import { UserRepository } from './domain/repositories/user.repository.js';
import { PrismaUserRepository } from './infrastructure/persistence/prisma/prisma-user.repository.js';
import { UsersController } from './presentation/controllers/users.controller.js';

@Module({
  imports: [DatabaseModule, SystemModule],
  controllers: [UsersController],
  providers: [
    PrismaUserRepository,
    { provide: UserRepository, useExisting: PrismaUserRepository },
    {
      provide: CreateUserUseCase,
      useFactory: (users: UserRepository, clock: Clock, ids: IdGenerator) =>
        new CreateUserUseCase(users, clock, ids),
      inject: [UserRepository, Clock, IdGenerator],
    },
    {
      provide: GetUserUseCase,
      useFactory: (users: UserRepository) => new GetUserUseCase(users),
      inject: [UserRepository],
    },
    {
      provide: GetUserAuthenticationDataUseCase,
      useFactory: (users: UserRepository) => new GetUserAuthenticationDataUseCase(users),
      inject: [UserRepository],
    },
  ],
  exports: [CreateUserUseCase, GetUserUseCase, GetUserAuthenticationDataUseCase],
})
export class UsersModule {}
