#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write=data --allow-run=scripts/clone_repos.sh

import { app } from "./deps.ts";
import { allCommands } from "./src/commands/all.ts";
import { setupEnv } from "./src/lib/mod.ts";

export interface Command {
  name: string;
  info: string;
  fn(args: string[]): void | Promise<void>;
}

const helpCommand: Command = {
  name: "help",
  info: "Show this help message",
  fn: () => console.log(CLI_USAGE),
};

const versionCommand: Command = {
  name: "version",
  info: "Show the app version",
  fn: () => console.log(app.version),
};

const commands: Command[] = [
  ...allCommands,
  helpCommand,
  versionCommand,
];

const cmdIndent = commands.map((c) => c.name.length).reduce<number>(
  (longest, strlen) => (longest > strlen ? longest : strlen),
  0,
);

const CLI_USAGE = `./cli.ts <command> [options]

commands:
  ${
  commands
    .map((cmd) => cmd.name.padEnd(cmdIndent + 2, " ") + cmd.info)
    .join("\n  ")
}

global options:
  --help    Show this help message
  --version Show the app version

examples:
  ./cli.ts serve --port 8080
`;

let [commandName, ...args] = Deno.args;
if (commandName?.startsWith("--")) {
  commandName = commandName.replace(/^--/, "");
}

if (!commandName) {
  console.error("Error: no command\n");
  console.log(CLI_USAGE);
  Deno.exit(1);
}

const command = commands.find((c) => c.name === commandName);

if (!command) {
  console.error("Error: command not found", commandName);
  Deno.exit(1);
}

await setupEnv();

await command.fn(args);
