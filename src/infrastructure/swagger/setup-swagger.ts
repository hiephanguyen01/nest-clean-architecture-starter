import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { AppConfigService } from '../config/app-config.service.js';

export function setupSwagger(app: INestApplication, config: AppConfigService): void {
  if (!config.swaggerEnabled) return;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Nest Clean Architecture Starter')
    .setDescription('Production-oriented modular monolith starter API')
    .setVersion('0.1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Access token' },
      'bearer',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(config.swaggerPath, app, document, {
    swaggerOptions: { persistAuthorization: false },
  });
}
