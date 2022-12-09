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

    const success = await syncRepos(redis, getAllRepos());
    if (!success) Deno.exit(1);
  },
};
