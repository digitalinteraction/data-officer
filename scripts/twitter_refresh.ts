#!/usr/bin/env -S deno run --allow-read=. --allow-env --allow-net

import {
  getEnv,
  redisClientFromEnv,
  setupEnv,
  twitterClientFromEnv,
} from "../src/lib/mod.ts";

await setupEnv();

const env = getEnv("TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET", "REDIS_URL");
const twitter = twitterClientFromEnv(env);
const redis = await redisClientFromEnv(env);

const credentials = await twitter.getUpdatedCredentials(redis);
console.log("Credentials", credentials);
