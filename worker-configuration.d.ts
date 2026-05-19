// Minimal Cloudflare D1 types (subset of @cloudflare/workers-types).
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(col?: string): Promise<T | null>;
}
interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  error?: string;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1Result>;
}

interface Env {
  haleon_insights_db: D1Database;
}

// Cloudflare Workers virtual module — available at runtime, emulated by wrangler dev.
declare module "cloudflare:workers" {
  const env: Env;
  export { env };
}

