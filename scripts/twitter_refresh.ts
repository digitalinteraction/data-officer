#!/usr/bin/env -S deno run --allow-read=. --allow-env --allow-net

import {
  getEnv,
  redisClientFromEnv,
  setupEnv,
  twitterClientFromEnv,
} from "../src/lib/mod.ts";

const CLI_USAGE = `
./scripts/twitter_refresh.ts [options]

info:
  Run the OAuth2 refresh process with the access and refresh token that is
  in redis.

options:
  --help  Show this help message
`;

if (Deno.args.includes("--help")) {
  console.log(CLI_USAGE);
  Deno.exit();
}

await setupEnv();

const env = getEnv("TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET", "REDIS_URL");
const twitter = twitterClientFromEnv(env);
const redis = await redisClientFromEnv(env);

const credentials = await twitter.getUpdatedCredentials(redis);
console.log("Credentials", credentials);
