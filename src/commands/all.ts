import { githubDataCommand } from "./github_data.ts";
import { serveCommand } from "./serve.ts";
import { syncReposCommand } from "./sync_repos.ts";
import { tweetCommand } from "./tweet.ts";

/** All the active commands that are part of the CLI */
export const allCommands = [
  serveCommand,
  syncReposCommand,
  tweetCommand,
  githubDataCommand,
];
