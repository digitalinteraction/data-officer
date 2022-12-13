import type { Command } from "../../cli.ts";
import { getEnv, redisClientFromEnv, syncRepos } from "../lib/mod.ts";
import { getAllRepos } from "../repos/all.ts";

const CLI_USAGE = `
./cli.ts sync_repos [options]

info:
  Run the repo synchroniser to update the local repos then run each repo's 
  collections and store their results in Redis, ready for the http server.

options:
  --help  Show this help message
`;

const SEMAPHORE_KEY = "cmd/sync_repos";
const SEMAPHORE_DURATION = 2 * 60;

export const syncReposCommand: Command = {
  name: "sync_repos",
  info: "Run the repo sync script and load collections into redis",
  async fn() {
    if (Deno.args.includes("--help")) {
      console.log(CLI_USAGE);
      return;
    }

    const env = getEnv("REDIS_URL");

    const redis = await redisClientFromEnv(env);

    // https://redis.io/commands/setnx/
    const isLocked = await redis.setnx(SEMAPHORE_KEY, "1");
    if (isLocked !== 1) {
      console.error("Sync already running");
      Deno.exit(1);
    }
    await redis.expire(SEMAPHORE_KEY, SEMAPHORE_DURATION);

    const success = await syncRepos(redis, getAllRepos());

    await redis.del(SEMAPHORE_KEY);

    if (!success) Deno.exit(1);
  },
};
