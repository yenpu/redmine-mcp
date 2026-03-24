import 'dotenv/config';
import { z } from 'zod';

const ConfigSchema = z.object({
  REDMINE_BASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('127.0.0.1'),
  SESSION_TTL_MS: z.coerce.number().default(3_600_000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  const result = ConfigSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid configuration:');
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}
