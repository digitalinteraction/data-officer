import type { Command } from "../../cli.ts";
import { connectToRedis, parseFlags, parseRedisUrl } from "../../deps.ts";
import { getEnv, syncRepos } from "../lib/mod.ts";
import { getAllRepos } from "../repos/all.ts";

const CLI_USAGE = `
./cli.ts sync_repos

options:
  --help Show this help message
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

    const redis = await connectToRedis(parseRedisUrl(env.REDIS_URL));

    await syncRepos(redis, getAllRepos(), flags.verbose);
  },
};
