export interface BackendConfig {
  readonly host: string;
  readonly port: number;
  readonly nodeEnv: "development" | "test" | "production";
  readonly healthCheckTimeoutMs: number;
  readonly version: string;
}

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 4_000;
const DEFAULT_HEALTH_TIMEOUT_MS = 1_000;

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65_535 ? parsed : fallback;
}

function parseTimeout(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 30_000 ? parsed : fallback;
}

function parseNodeEnv(value: string | undefined): BackendConfig["nodeEnv"] {
  return value === "test" || value === "production" ? value : "development";
}

/**
 * Read only the settings needed to boot the HTTP process.
 *
 * Secrets and Telegram credentials deliberately do not cross this boundary in
 * Stage 1. Invalid optional values fall back to safe local defaults so a bad
 * health probe configuration cannot prevent the process from starting.
 */
export function loadBackendConfig(
  environment: NodeJS.ProcessEnv = process.env
): BackendConfig {
  return {
    host: environment.BACKEND_HOST?.trim() || DEFAULT_HOST,
    port: parsePositiveInteger(environment.BACKEND_PORT ?? environment.PORT, DEFAULT_PORT),
    nodeEnv: parseNodeEnv(environment.NODE_ENV),
    healthCheckTimeoutMs: parseTimeout(
      environment.HEALTH_CHECK_TIMEOUT_MS,
      DEFAULT_HEALTH_TIMEOUT_MS
    ),
    version: environment.npm_package_version?.trim() || "0.1.0"
  };
}

export const backendDefaults = Object.freeze({
  host: DEFAULT_HOST,
  port: DEFAULT_PORT,
  healthCheckTimeoutMs: DEFAULT_HEALTH_TIMEOUT_MS
});
