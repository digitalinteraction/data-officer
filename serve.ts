import { parseFlags, loadDotenv } from "./deps.ts";
import { createServer } from "./src/server.ts";

await loadDotenv();

const flags = parseFlags(Deno.args, {
  string: ["port"],
  default: {
    port: "3000",
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
