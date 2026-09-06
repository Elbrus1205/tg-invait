import { z } from "zod";

const optionalSecret = z.string().min(1).optional();

export const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "silent"]).default("info"),
  BACKEND_PORT: z.coerce.number().int().min(1).max(65_535).default(4_000),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: optionalSecret,
  JWT_REFRESH_SECRET: optionalSecret,
  TELEGRAM_API_ID: z.coerce.number().int().positive().optional(),
  TELEGRAM_API_HASH: optionalSecret,
  TELEGRAM_SESSION_ENCRYPTION_KEY: optionalSecret
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(input: NodeJS.ProcessEnv = process.env): Environment {
  return environmentSchema.parse(input);
}
