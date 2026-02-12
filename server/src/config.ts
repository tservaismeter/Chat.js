/**
 * Runtime configuration with validation.
 * In production, missing critical settings fail fast at startup.
 */

type AppConfig = {
  nodeEnv: string;
  isProduction: boolean;
  port: number;
  publicOrigin?: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  lightApiUrl: string;
  lightApiKey?: string;
  allowLightApiFallback: boolean;
  skipStartupChecks: boolean;
};

function parseBoolean(input: string | undefined): boolean {
  if (!input) return false;
  return ["1", "true", "yes", "on"].includes(input.toLowerCase());
}

function parsePort(input: string | undefined, fallback: number): number {
  if (!input) return fallback;
  const value = Number(input);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`Invalid PORT value: "${input}"`);
  }
  return value;
}

function requireEnv(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return trimmed;
}

function optionalUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(/\/+$/, "");
}

function requiredUrl(name: string, value: string | undefined): string {
  const raw = requireEnv(name, value);
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`Invalid URL in ${name}: "${raw}"`);
  }
  return parsed.toString().replace(/\/+$/, "");
}

function loadConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const isProduction = nodeEnv === "production";
  const allowLightApiFallback = parseBoolean(process.env.ALLOW_LIGHT_API_FALLBACK);
  const skipStartupChecks = parseBoolean(process.env.SKIP_STARTUP_CHECKS);

  const lightApiKey = process.env.LIGHT_API_KEY?.trim() || undefined;
  if (isProduction && !lightApiKey && !allowLightApiFallback) {
    throw new Error(
      "LIGHT_API_KEY is required in production. Set LIGHT_API_KEY or explicitly allow fallback with ALLOW_LIGHT_API_FALLBACK=true."
    );
  }

  return {
    nodeEnv,
    isProduction,
    port: parsePort(process.env.PORT, 8000),
    publicOrigin: optionalUrl(process.env.PUBLIC_ORIGIN?.trim()),
    supabaseUrl: requiredUrl("SUPABASE_URL", process.env.SUPABASE_URL),
    supabaseAnonKey: requireEnv("SUPABASE_ANON_KEY", process.env.SUPABASE_ANON_KEY),
    lightApiUrl: requiredUrl("LIGHT_API_URL", process.env.LIGHT_API_URL ?? "https://api.light.dev"),
    lightApiKey,
    allowLightApiFallback,
    skipStartupChecks,
  };
}

export const appConfig = loadConfig();
export type { AppConfig };
