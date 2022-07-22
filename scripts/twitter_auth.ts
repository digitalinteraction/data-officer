#!/usr/bin/env -S deno run --allow-read=. --allow-env --allow-net

import { parseFlags, Router } from "../deps.ts";
import {
  getEnv,
  redisClientFromEnv,
  setupEnv,
  twitterClientFromEnv,
  TwitterCredentials,
  TwitterOAuth2,
} from "../src/lib/mod.ts";

const CLI_USAGE = `
./scripts/twitter_auth.ts [options]

info:
  Generate twitter access credentials by running a local server
  that redirects the user to the twitter authentication page.
  Upon completion, it redirects them back to finish the OAuth2 flow
  and outputs the new token. 
  
  Make sure http://localhost:8080/twitter/oauth2/callback is added to the
  Twitter App's redirect_uri configuration.

options:
  --scope The scopes you want access to (you can pass multiple times)
  --port  The port to run a local server to finish the oauth request and get tokens
  --help  Show this help message
`;

await setupEnv();

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
    "--scope=tweet.read --scope=tweet.write --scope=users.read --scope=offline.access",
  );
  Deno.exit(1);
}

if (flags.help) {
  console.log(CLI_USAGE);
  Deno.exit();
}

const env = getEnv("TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET", "REDIS_URL");

const redis = await redisClientFromEnv(env);

const twitterOAuth = new TwitterOAuth2(
  twitterClientFromEnv(env),
  new URL(`http://localhost:${flags.port}/twitter/oauth2/callback`),
  redis,
);

const authUrl = await twitterOAuth.startLogin({ force: true });
if (!authUrl) throw new Error("Something went wrong");

//
// Run a server to redirect to the oauth website and collect the state & token
//
const creds = await new Promise<TwitterCredentials | null>((resolve) => {
  const abort = new AbortController();
  const router = new Router();

  router.get("/", () => {
    console.log("Opening %o", authUrl.toString());
    return Response.redirect(authUrl.toString());
  });
  router.get("/callback", async (ctx) => {
    const { state, code, error } = ctx.searchParams;

    if (typeof error === "string") {
      setTimeout(() => {
        resolve(null);
        abort.abort();
      }, 0);
      return `Authorization failed '${error}'`;
    }

    const creds = await twitterOAuth.finishLogin(state, code);

    if (creds) {
      setTimeout(() => {
        resolve(creds);
        abort.abort();
      }, 0);
      return "Ok, now return to the terminal";
    }

    return new Response("Invalid callback, please try again", { status: 400 });
  });
  router.listen({ port: flags.port, signal: abort.signal });
  console.log("Open: http://localhost:%s", flags.port);
});

if (!creds) {
  console.error("Failed to get authorization");
  Deno.exit(1);
}

//
// Output credentials
//
console.log("Your token:");
console.log(JSON.stringify(creds, null, 2));

redis.close();
