import { serveCommand } from "./serve.ts";
import { syncReposCommand } from "./sync_repos.ts";
import { tweetCommand } from "./tweet.ts";

export const allCommands = [
  serveCommand,
  syncReposCommand,
  tweetCommand,
];
