#!/usr/bin/env -S deno run --allow-read --allow-env --allow-net --allow-write=twitter_auth.json

import { Router, loadDotenv, parseFlags } from "../deps.ts";
import { TwitterClient } from "../src/lib/mod.ts";

const CLI_USAGE = `
./scripts/twitter_auth.ts - Generate twitter access credentials

options:
  --scope The scopes you want access to (you can pass multiple times)
  --port  The port to run a local server to finish the oauth request and get tokens
  --help  Show this help message
`;

await loadDotenv({ export: true });

interface Flags {
  help?: boolean;
  scope: string[];
  port: number;
}

const flags: Flags = parseFlags(Deno.args, {
  boolean: ["help"],
  collect: ["scope"],
  default: {
    port: 8080,
  },
});
if (!flags.scope) {
  console.error(
    "No scopes passed, maybe: %o",
    "--scope=tweet.write --scope=users.read --scope=offline.access"
  );
  Deno.exit(1);
}

if (flags.help) {
  console.log(CLI_USAGE);
  Deno.exit(0);
}

const redirectUri = `http://localhost:${flags.port}/callback`;
const randomState = crypto.randomUUID();

const twitter = TwitterClient.fromEnv();

const authUrl = twitter.getAuthorizeUrl({
  scope: flags.scope,
  state: randomState,
  redirectUri,
});

//
// Run a server to redirect to the oauth website and collect the state & token
//
const code = await new Promise<string | null>((resolve) => {
  const abort = new AbortController();
  const router = new Router();

  router.get("/", () => {
    console.log("Opening %o", authUrl.toString());
    return Response.redirect(authUrl.toString());
  });
  router.get("/callback", (ctx) => {
    const { state, code, error } = ctx.searchParams;

    if (typeof error === "string") {
      setTimeout(() => {
        resolve(null);
        abort.abort();
      }, 0);
      return `Authorization failed '${error}'`;
    } else if (state === randomState && typeof code === "string") {
      setTimeout(() => {
        resolve(code);
        abort.abort();
      }, 0);
      return "Ok, now return to the terminal";
    } else {
      return new Response("Invalid callback, please try again", {
        status: 400,
      });
    }
  });
  router.listen({ port: flags.port, signal: abort.signal });
  console.log("Open: http://localhost:%s", flags.port);
});

if (!code) {
  console.error("Failed to get authorization");
  Deno.exit(1);
}

//
// Generate an access_token and refresh_token
//
const creds = await twitter.getTokenFromCode(code, redirectUri);
await twitter.stashCredentials(creds);

console.log("Your token:");
console.log(JSON.stringify(creds, null, 2));
