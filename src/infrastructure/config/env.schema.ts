import { z } from 'zod';

const booleanFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(604800),
  JWT_ISSUER: z.string().min(1).default('nest-clean-architecture-starter'),
  JWT_AUDIENCE: z.string().min(1).default('nest-clean-architecture-api'),
  REFRESH_TOKEN_HASH_SECRET: z.string().min(32),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  SWAGGER_ENABLED: booleanFromString,
  SWAGGER_PATH: z.string().min(1).default('docs'),
  TRUST_PROXY: booleanFromString,
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  RATE_LIMIT_TTL_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(100),
  REQUEST_BODY_LIMIT: z.string().min(1).default('1mb'),
}).superRefine((env, ctx) => {
  const secrets = [
    ['JWT_ACCESS_SECRET', env.JWT_ACCESS_SECRET],
    ['JWT_REFRESH_SECRET', env.JWT_REFRESH_SECRET],
    ['REFRESH_TOKEN_HASH_SECRET', env.REFRESH_TOKEN_HASH_SECRET],
  ] as const;

  for (const [leftIndex, [leftName, leftValue]] of secrets.entries()) {
    for (const [rightName, rightValue] of secrets.slice(leftIndex + 1)) {
      if (leftValue === rightValue) {
        ctx.addIssue({
          code: 'custom',
          path: [rightName],
          message: `${rightName} must be different from ${leftName}`,
        });
      }
    }
  }
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${message}`);
  }
  return parsed.data;
}
