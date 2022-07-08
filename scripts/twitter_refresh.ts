#!/usr/bin/env -S deno run --allow-read=. --allow-env --allow-net --allow-write=twitter_auth.json

import { loadDotenv } from "../deps.ts";
import { TwitterClient } from "../src/lib/mod.ts";

await loadDotenv({ export: true });

const twitter = TwitterClient.fromEnv();

const credentials = await twitter.getUpdatedCredentials();
console.log("Updated credentials", credentials);
