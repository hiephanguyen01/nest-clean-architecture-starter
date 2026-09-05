import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { InfrastructureConfigModule } from './infrastructure/config/infrastructure-config.module.js';
import { AppConfigService } from './infrastructure/config/app-config.service.js';
import { HealthModule } from './infrastructure/health/health.module.js';
import { InfrastructureLoggerModule } from './infrastructure/logger/infrastructure-logger.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { HttpExceptionFilter } from './shared/presentation/http/http-exception.filter.js';

@Module({
  imports: [
    InfrastructureConfigModule,
    InfrastructureLoggerModule,
    ThrottlerModule.forRootAsync({
      imports: [InfrastructureConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => [
        { ttl: config.rateLimitTtlMs, limit: config.rateLimitLimit },
      ],
    }),
    UsersModule,
    AuthModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
