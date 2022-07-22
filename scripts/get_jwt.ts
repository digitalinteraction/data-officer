#!/usr/bin/env -S deno run --allow-read --allow-env

import { app, log, parseFlags, SignJWT } from "../deps.ts";
import { getEnv, setupEnv } from "../src/lib/mod.ts";

await setupEnv();

const CLI_USAGE = `
./scripts/get_jwt.ts

options:
  --subject Set the "sub" claim
  --scope   Set the "aud" claim, can be passed multiple times
  --expire  Set the "exr" claim, use a string like 5m
  --help    Show this help message
`;

interface Flags {
  help?: boolean;
  subject?: string;
  scope?: string[];
  expire: string;
}

const flags: Flags = parseFlags(Deno.args, {
  boolean: ["help"],
  string: ["expire", "subject"],
  collect: ["scope"],
});

if (flags.help) {
  console.log(CLI_USAGE);
  Deno.exit();
}

const env = getEnv("JWT_SECRET");

const jwt = new SignJWT({})
  .setIssuer(app.jwtIssuer)
  .setSubject(flags.subject ?? "_dev")
  .setIssuedAt()
  .setProtectedHeader({ alg: "HS256", typ: "JWT" });

if (flags.scope && flags.scope.length > 0) {
  jwt.setAudience(flags.scope as string[]);
}

if (flags.expire) {
  jwt.setExpirationTime(flags.expire);
} else {
  log.warning("No expiry set");
  if (globalThis.confirm("Are you sure?") === false) {
    Deno.exit(1);
  }
}

const key = new TextEncoder().encode(env.JWT_SECRET);

console.error("Jwt token:");
console.log(await jwt.sign(key));
