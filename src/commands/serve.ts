import { loadDotenv, parseFlags } from "../../deps.ts";
import { createServer } from "../../src/server.ts";

export async function serveCommand(args: string[]) {
  await loadDotenv({ export: true });

  const flags = parseFlags(args, {
    string: ["port"],
    default: {
      port: "8080",
    },
  });

  const server = createServer({
    port: parseInt(flags.port),
  });

  function exit() {
    server.stop();
    Deno.exit();
  }

  Deno.addSignalListener("SIGINT", () => exit());
  Deno.addSignalListener("SIGTERM", () => exit());

  await server.start();
}
