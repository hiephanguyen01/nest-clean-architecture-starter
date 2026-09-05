import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { AppConfigService } from '../config/app-config.service.js';
import { InfrastructureConfigModule } from '../config/infrastructure-config.module.js';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [InfrastructureConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.logLevel,

          ...(config.nodeEnv === 'development'
            ? {
                transport: {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
                    ignore: 'pid,hostname',
                    messageFormat: '{context} - {msg}',
                  },
                },
              }
            : {}),

          redact: {
            paths: [
              'req.headers.authorization',
              'req.body.password',
              'req.body.refreshToken',
              'res.headers.set-cookie',
              'password',
              'passwordHash',
              'accessToken',
              'refreshToken',
            ],
            censor: '[REDACTED]',
          },

          genReqId(req, res) {
            const header = req.headers['x-request-id'];
            const candidate = typeof header === 'string' ? header.trim() : '';

            const requestId = candidate && candidate.length <= 128 ? candidate : randomUUID();

            res.setHeader('x-request-id', requestId);

            return requestId;
          },

          serializers: {
            req(req) {
              return {
                id: req.id,
                method: req.method,
                url: req.url,
              };
            },

            res(res) {
              return {
                statusCode: res.statusCode,
              };
            },
          },

          customAttributeKeys: {
            responseTime: 'durationMs',
          },

          customProps(req) {
            const typed = req as typeof req & {
              id?: string;
              user?: {
                userId?: string;
              };
            };

            return {
              requestId: typed.id,
              ...(typed.user?.userId ? { userId: typed.user.userId } : {}),
            };
          },
        },
      }),
    }),
  ],
  exports: [LoggerModule],
})
export class InfrastructureLoggerModule {}
