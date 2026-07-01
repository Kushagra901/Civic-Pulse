import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  SHADOW_DATABASE_URL: z.string().url('SHADOW_DATABASE_URL must be a valid URL').optional(),
  DATABASE_POOL_MIN: z.coerce.number().default(2),
  DATABASE_POOL_MAX: z.coerce.number().default(10),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // JWT — must be long enough to be secure
  JWT_ACCESS_SECRET: z.string().min(32,
    'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32,
    'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS and client
  ALLOWED_ORIGINS: z.string().min(1, 'ALLOWED_ORIGINS is required'),
  CLIENT_URL: z.string().url('CLIENT_URL must be a valid URL'),

  // Email
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().email('SMTP_USER must be a valid email'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  SMTP_FROM: z.string().min(1, 'SMTP_FROM is required'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY:    z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  // Logging
  LOG_LEVEL: z.enum(['trace','debug','info','warn','error','fatal'])
    .default('info'),

  // Rate limiting
  ACCOUNT_LOCKOUT_SECS: z.coerce.number().default(1800),
  AUTH_MAX_FAILURES:    z.coerce.number().default(5),

  // BullMQ
  QUEUE_CONCURRENCY: z.coerce.number().default(3),

  // Optional
  WEATHER_INTEGRATION_ENABLED: z.coerce.boolean().default(false),
  SENTRY_DSN: z.string().optional(),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.errors
      .map(e => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    // Crash loudly at startup — better than a cryptic runtime error
    console.error(
      '\n❌ Environment validation failed. Fix these before starting:\n\n' +
      missing + '\n'
    );
    process.exit(1);
  }

  // In production, warn about any secrets that still contain placeholder text
  if (result.data.NODE_ENV === 'production') {
    const placeholders = ['CHANGE_ME', 'your_', 'replace_', 'xxx'];
    const dangerous = Object.entries(result.data)
      .filter(([, v]) =>
        typeof v === 'string' &&
        placeholders.some(p => v.toLowerCase().includes(p.toLowerCase())),
      )
      .map(([k]) => k);

    if (dangerous.length > 0) {
      console.error(
        '\n⚠️  Production warning: these variables look like placeholders:\n' +
        dangerous.map(k => `  ${k}`).join('\n') + '\n'
      );
      process.exit(1);
    }
  }

  return result.data;
}

export const env = loadEnv();
