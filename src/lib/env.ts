export interface EnvRecord {
  JWT_SECRET: string;

  MAIN_MYSQL_URL: string;
  SHARED_MYSQL_URL: string;

  SELF_URL: string;
  TZ: string;

  TWITTER_CLIENT_ID: string;
  TWITTER_CLIENT_SECRET: string;
}

export function getEnv<K extends keyof EnvRecord>(
  ...keys: K[]
): Pick<EnvRecord, K> {
  // deno-lint-ignore no-explicit-any
  const output: Pick<EnvRecord, K> = {} as any;
  const missing: K[] = [];

  for (const key of keys) {
    const value = Deno.env.get(key);
    if (typeof value === "string") output[key] = value;
    else missing.push(key);
  }

  if (missing.length > 0) {
    console.error("Missing environment variables", missing);
    Deno.exit(1);
  }

  return output;
}
