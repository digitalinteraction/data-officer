#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write=data --allow-run=scripts/clone_repos.sh

import { app } from "./deps.ts";
import { serveCommand } from "./src/commands/serve.ts";

interface Command {
  info: string;
  fn(args: string[]): void | Promise<void>;
}

const commands: Record<string, Command> = {
  serve: {
    info: "Run the http server",
    fn: serveCommand,
  },
  version: {
    info: "Show the app version",
    fn: () => console.log(app.version),
  },
  help: {
    info: "Show this help message",
    fn: () => console.log(CLI_USAGE),
  },
};

const cmdIndent = Object.keys(commands).reduce<number>(
  (longest, str) => (longest > str.length ? longest : str.length),
  0,
);

const CLI_USAGE = `./src/cli.ts <command> [options]

commands:
  ${
  Object.entries(commands)
    .map(([key, cmd]) => key.padEnd(cmdIndent + 2, " ") + cmd.info)
    .join("\n  ")
}

global options:
  --help    Show this help message
  --version Show the app version

examples:
  ./src/cli.ts serve --port 8080
`;

let [commandName, ...args] = Deno.args;
if (commandName?.startsWith("--")) commandName = commandName.replace(/^--/, "");

if (!commandName) {
  console.error("Error: no command\n");
  console.log(CLI_USAGE);
  Deno.exit(1);
}

const command = commands[commandName];

if (!command) {
  console.error("Error: command not found", commandName);
  Deno.exit(1);
}

await command.fn(args);
