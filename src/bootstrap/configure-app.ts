import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { ValidationError } from 'class-validator';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppConfigService } from '../infrastructure/config/app-config.service.js';
import { setupSwagger } from '../infrastructure/swagger/setup-swagger.js';
import { ValidationFailureError } from '../shared/presentation/errors/validation-failure.error.js';

export function configureApp(app: NestExpressApplication): void {
  const config = app.get(AppConfigService);

  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.use(helmet());
  app.useBodyParser('json', { limit: config.requestBodyLimit });
  app.useBodyParser('urlencoded', { limit: config.requestBodyLimit, extended: true });

  if (config.trustProxy) app.set('trust proxy', 1);

  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) =>
        new ValidationFailureError(
          errors.map((error) => ({
            field: error.property,
            messages: Object.values(error.constraints ?? {}),
          })),
        ),
    }),
  );

  setupSwagger(app, config);
}
