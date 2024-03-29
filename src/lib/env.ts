import { connectToRedis, loadDotenv, log, parseRedisUrl } from "../../deps.ts";
import { TwitterClient } from "./twitter.ts";

/** All known environment variables */
export interface EnvRecord {
  REDIS_URL: string;
  JWT_SECRET: string;

  MAIN_MYSQL_URL: string;
  SHARED_MYSQL_URL: string;

  SELF_URL: string;
  TZ: string;

  TWITTER_CLIENT_ID: string;
  TWITTER_CLIENT_SECRET: string;

  UPTIME_ROBOT_SECRET: string;

  GITHUB_TOKEN: string;
}

/** Load a subset of the `EnvRecord`, hard-failing if a variable is unset */
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

/** Create a redis client from an `EnvRecord` and parse the URL */
export function redisClientFromEnv(env: Pick<EnvRecord, "REDIS_URL">) {
  return connectToRedis({
    ...parseRedisUrl(env.REDIS_URL),
  });
}

/** Create a twitter client from an `EnvRecord` */
export function twitterClientFromEnv(
  env: Pick<EnvRecord, "TWITTER_CLIENT_ID" | "TWITTER_CLIENT_SECRET">,
) {
  return new TwitterClient({
    clientId: env.TWITTER_CLIENT_ID,
    clientSecret: env.TWITTER_CLIENT_SECRET,
  });
}

/**
 * Configure Deno's `log` module based on the `LOG_LEVEL` environment variable
 */
export async function setupLogsFromEnv() {
  await log.setup({
    handlers: {
      console: new log.handlers.ConsoleHandler("DEBUG"),
    },
    loggers: {
      default: {
        level:
          (Deno.env.get("LOG_LEVEL") ?? "INFO") as keyof typeof log.LogLevels,
        handlers: ["console"],
      },
    },
  });
}

/**
 * Load in environment variables from the `.env` and setup the logs. A useful
 * one-liner for the top of scripts
 */
export async function setupEnv() {
  await loadDotenv({ export: true });
  await setupLogsFromEnv();
}
