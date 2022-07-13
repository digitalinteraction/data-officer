import type { Command } from "../../cli.ts";
import { parseFlags } from "../../deps.ts";
import { getEnv, redisClientFromEnv, syncRepos } from "../lib/mod.ts";
import { getAllRepos } from "../repos/all.ts";

const CLI_USAGE = `
./cli.ts sync_repos

options:
  --help    Show this help message
  --verbose Output debug information to stdout
`;

export const syncReposCommand: Command = {
  name: "sync_repos",
  info: "Run the repo sync script and load collections into redis",
  async fn(args) {
    const flags = parseFlags(args, {
      boolean: ["verbose", "help"],
    });

    if (flags.help) {
      console.log(CLI_USAGE);
      return;
    }

    const env = getEnv("REDIS_URL");

    const redis = await redisClientFromEnv(env);

    await syncRepos(redis, getAllRepos(), flags.verbose);
  },
};
