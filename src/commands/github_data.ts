import type { Command } from "../../cli.ts";
import { log, parseFlags } from "../../deps.ts";
import { getRecentCommits } from "../github.ts";

const CLI_USAGE = (commands: string[]) => `
./cli.ts github_data [options]

info:
  Inspect github data

commands:
  ${commands.join("\n  ")}

options:
  --help  Show this help message
`;

// TODO: "command" stuff should support subcommands
export const githubDataCommand: Command = {
  name: "github",
  info: "Inspect github data",
  async fn(args) {
    const cliUsage = CLI_USAGE(Array.from(subcommands.keys()));

    // Parse CLI flags
    const flags = parseFlags(args, {
      boolean: ["dryRun", "help"],
    });

    const [commandName] = flags._;

    if (!commandName) {
      log.error("No command entered");
      console.log(cliUsage);
      return;
    }

    const cmdFn = subcommands.get(commandName as string);
    if (!cmdFn) {
      log.error("Unknown command", commandName);
      Deno.exit(1);
    }

    await cmdFn();
  },
};

const subcommands = new Map<string, () => Promise<void>>();

subcommands.set("commits", async () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const commits = await getRecentCommits("digitalinteraction", startOfDay);
  console.log(commits);
});
