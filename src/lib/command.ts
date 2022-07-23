// deno-lint-ignore-file no-explicit-any

import { log, parseFlags } from "../../deps.ts";

interface AppOptions {
  name: string;
  info?: string;
  version?: unknown;
  commands: unknown[];
}
interface App {
  getHelp(): string;
  run(args: string[]): Promise<void>;
}

const EOL = "\n";
// const INDENT = "\t";
const INDENT = "  ";

// Maybe works
function indentText(level: number, text: string) {
  return text.split(EOL)
    .map((l) => l.padStart(l.length + (level * INDENT.length), INDENT))
    .join(EOL);
}

// Doesn't work
function _dedent(text: string) {
  const lines = text.trim().split(EOL);
  const indent = lines
    .map((line) => /^ */.exec(line)?.[0]?.length!)
    .filter((length) => length)
    .reduce((min, line) => Math.min(min, line), 0);

  const preLine = "".padStart(indent, " ");
  return lines
    .map((line) => line.replace(new RegExp(`^ {1,${indent}}`), preLine))
    .join(EOL) +
    EOL;
}

//
// ===
//

type Defaults<
  N extends string | undefined,
  B extends string | undefined,
  S extends string | undefined,
> = Partial<
  & (Record<Extract<N, string>, number | undefined>)
  & (Record<Extract<B, string>, boolean | undefined>)
  & (Record<Extract<S, string>, string | undefined>)
>;

type OptionsToArgs<
  D extends Defaults<N, B, S>,
  N extends string | undefined,
  B extends string | undefined,
  S extends string | undefined,
> = {
  [K in keyof D | Keys<N, B, S>]: K extends keyof D ? D[K]
    : K extends N ? (number | undefined)
    : K extends B ? (boolean | undefined)
    : K extends S ? (string | undefined)
    : never;
};

type Keys<
  N extends string | undefined,
  B extends string | undefined,
  S extends string | undefined,
> =
  | Extract<N, string>
  | Extract<B, string>
  | Extract<S, string>;

interface CommandOptions<
  D extends Defaults<N, B, S>,
  N extends string | undefined = undefined,
  B extends string | undefined = undefined,
  S extends string | undefined = undefined,
> {
  name: string;
  info?: string;

  flags?: {
    number?: Extract<N, string>[];
    boolean?: Extract<B, string>[];
    string?: Extract<S, string>[];
    default?: D;
    info?: Partial<Record<Keys<N, B, S>, string>>;
  };

  fn(options: OptionsToArgs<D, N, B, S>): void | Promise<void>;
}

function command<
  D extends Defaults<N, B, S>,
  N extends string | undefined = undefined,
  B extends string | undefined = undefined,
  S extends string | undefined = undefined,
>(command: CommandOptions<D, N, B, S>) {
  return {
    getHelp() {
      return "...";
    },
    async run(args: string[]) {
      const flags = {
        ...command.flags?.default,
        ...parseFlags(args, {
          string: command.flags?.string,
          boolean: command.flags?.boolean,
        }),
      };

      try {
        await command.fn(flags as any);
      } catch (error) {
        log.error(error);
        Deno.exit(1);
      }
    },
  };
}

const _server = command({
  name: "serve",
  info: "Run the http server",
  flags: {
    number: ["port"],
    boolean: ["migrate"],
    default: {
      port: 8080,
      migrate: false,
    },
    info: {
      port: "The tcp port to use",
      migrate: "Something or other",
    },
  },
  fn(options) {
    console.log(options.port);
  },
});

//
// ===
//

interface CliCtx {
  commandStack: string[];
  flags: Record<string, string>;
}

interface CommandOptions2 {
  name: string;
  info?: string;
  flags?: Record<string, string>;
  fn(args: string[]): void | Promise<void>;
}
interface Composite2Options {
  name: string;
  info?: string;
  flags?: Record<string, string>;
  commands: Command[];
}
interface App2Options {
  name: string;
  info?: string;
  version?: unknown;
  commands: Command[];
}

interface Command {
  name: string;
  info?: string;
  getHelp(ctx: CliCtx): string;
  run(args: string[], ctx: CliCtx): void | Promise<void>;
}

function _helpText(title: string, text: string) {
  return title + ":\n" + indentText(1, text);
}

class NoCommandError extends Error {}

function _objectHelp(
  flags: Record<string, string>,
  { prefix = "" } = {},
) {
  const maxLength = Object.entries(flags)
    .map(([key]) => key)
    .reduce((max, str) => Math.max(max, str.length), 0);

  return Object.entries(flags)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, info]) =>
      prefix + name.padEnd(3 + maxLength, " ") + " " + info
    )
    .join("\n");
}

function command2(cmd: CommandOptions2): Command {
  function getHelp(ctx: CliCtx) {
    const usage = [...ctx.commandStack, cmd.name];
    if (cmd.flags) usage.push("[options]");

    const output: string[] = [];
    if (cmd.info) output.push(cmd.info);

    output.push(_helpText("Usage", usage.join(" ")));

    const allFlags = { ...ctx.flags, ...cmd.flags };
    if (Object.keys(allFlags).length > 0) {
      output.push(
        _helpText("Flags", _objectHelp(allFlags, { prefix: "--" })),
      );
    }

    return output.join("\n\n");
  }
  async function run(args: string[], ctx: CliCtx) {
    if (args.includes("--help")) {
      console.log(getHelp(ctx));
    } else {
      await cmd.fn(args);
    }
  }

  return { name: cmd.name, info: cmd.info, getHelp, run };
}

function composite2(cmd: Composite2Options): Command {
  function getHelp(ctx: CliCtx) {
    const usage = [...ctx.commandStack, cmd.name, "<command>"];
    if (cmd.flags) usage.push("[options]");

    const output: string[] = [];
    if (cmd.info) output.push(cmd.info);

    output.push(_helpText("Usage", usage.join(" ")));

    const commands = Object.fromEntries(
      cmd.commands.map((c) => [c.name, c.info ?? ""]),
    );
    output.push(
      _helpText("Commands", _objectHelp(commands)),
    );

    const allFlags = { ...ctx.flags, ...cmd.flags };
    if (Object.keys(allFlags).length > 0) {
      output.push(
        _helpText("Flags", _objectHelp(allFlags, { prefix: "--" })),
      );
    }

    return output.join("\n\n");
  }

  async function run(args: string[], ctx: CliCtx) {
    let name: string | undefined;
    for (const flag of args) {
      if (flag === "--help") {
        console.log(getHelp(ctx));
        return;
      }
      if (!flag.startsWith("--")) {
        name = flag;
        break;
      }
    }

    if (!name) {
      log.error("No command entered");
      console.log();
      console.log(getHelp(ctx));
      Deno.exit(1);
    }

    const command = cmd.commands.find((c) => c.name === name);

    if (!command) throw new Error(`Unknown command "${name}"`);

    await command.run(
      args.filter((a) => a !== name),
      {
        commandStack: ctx.commandStack.concat(cmd.name),
        flags: { ...cmd.flags, ...ctx.flags },
      },
    );
  }

  return {
    name: cmd.name,
    info: cmd.info,
    getHelp,
    run,
  };
}

function app2(app: App2Options) {
  const commands = Array.from(app.commands);

  const ctx: CliCtx = {
    commandStack: [],
    flags: { help: "Show this help message" },
  };

  if (app.version) {
    commands.push(command2({
      name: "version",
      info: "Display the app version",
      fn: () => console.log(app.version),
    }));
  }

  commands.push(command2({
    name: "help",
    info: ctx.flags.help,
    fn: () => console.log(getHelp()),
  }));

  const comp = composite2({ ...app, commands });

  function getHelp() {
    return comp.getHelp(ctx);
  }

  async function run(args: string[]) {
    try {
      await comp.run(args, ctx);
    } catch (error) {
      log.error(error?.message);
      if (error instanceof NoCommandError) {
        console.log();
        console.log(getHelp());
      } else {
        log.debug(error?.stack);
      }

      Deno.exit(1);
    }
  }

  return { getHelp, run };
}

const serve = command2({
  name: "serve",
  info: "Run the http server",
  flags: {
    port: "The port to run on (default: 8080)",
    migrate: "Whether to run the migrations (default: false)",
  },
  fn(args) {
    const flags = parseFlags(args, {
      boolean: "migrate",
      default: {
        port: 8080,
        migrate: false,
      },
    });
    console.log(flags);
  },
});

// console.log(serve.getHelp({
//   commandStack: ["cli.ts"],
//   flags: {},
// }));

// console.log();
// console.log("===");
// console.log();

const tweet = composite2({
  name: "tweet",
  info: "Post a tweet to Twitter",
  flags: {
    dryRun: "Only output to the console (default: false)",
  },
  commands: [
    command2({
      name: "am-coffee",
      info: "Tweet the morning's coffee consumption",
      fn(args) {
        const flags = parseFlags(args, {
          boolean: ["dryRun"],
        });
        console.log("5 coffees were drank dryRun dryRun=%o", flags.dryRun);
      },
    }),
    command2({
      name: "pm-coffee",
      info: "Tweet the afternoons's coffee consumption",
      fn(args) {
        const flags = parseFlags(args, {
          boolean: ["dryRun"],
        });
        console.log("9 coffees were drank dryRun dryRun=%o", flags.dryRun);
      },
    }),
  ],
});

// console.log(tweet.getHelp({
//   commandStack: ["cli.ts"],
//   flags: {},
// }));

// console.log();
// console.log("===");
// console.log();

// await tweet.run(["am-coffee"], {
//   commandStack: ["./cli.ts"],
//   flags: {},
// });

// console.log();
// console.log("===");
// console.log();

const dataOfficer = app2({
  name: "./cli.ts",
  info: "The DataOfficer CLI",
  version: "1.2.3",
  commands: [serve, tweet],
});

await dataOfficer.run(Deno.args);
