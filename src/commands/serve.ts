import { Command } from "../../cli.ts";
import { parseFlags } from "../../deps.ts";
import { createServer } from "../../src/server.ts";

const CLI_USAGE = `
./cli.ts serve

options:
  --port The port to run on (default: 8080)
  --help Show this help message
`;

export const serveCommand: Command = {
  name: "serve",
  info: "Run the http server",
  async fn(args) {
    const flags = parseFlags(args, {
      boolean: ["help"],
      string: ["port"],
      default: {
        port: "8080",
      },
    });

    if (flags.help) {
      console.log(CLI_USAGE);
      return;
    }

    const server = await createServer({
      ...flags,
      port: parseInt(flags.port),
    });

    function exit() {
      server.stop();
      Deno.exit();
    }

    Deno.addSignalListener("SIGINT", () => exit());
    Deno.addSignalListener("SIGTERM", () => exit());

    await server.start();
  },
};
