#!/usr/bin/env -S deno run --allow-read=. --allow-env --allow-net --allow-write=data/twitter_auth.json

import { loadDotenv } from "../deps.ts";
import {
  getEnv,
  redisClientFromEnv,
  twitterClientFromEnv,
} from "../src/lib/mod.ts";

await loadDotenv({ export: true });

const env = getEnv("TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET", "REDIS_URL");
const twitter = twitterClientFromEnv(env);
const redis = await redisClientFromEnv(env);

const credentials = await twitter.getUpdatedCredentials(redis);
console.log("Updated credentials", credentials);
