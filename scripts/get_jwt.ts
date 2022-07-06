#!/usr/bin/env -S deno run --allow-read --allow-env

import { app, loadDotenv, parseFlags, SignJWT } from "../deps.ts";
import { getEnv } from "../src/lib/mod.ts";

await loadDotenv({ export: true });

interface Flags {
  subject?: string;
  scope?: string[];
  expire: string;
}

const flags: Flags = parseFlags(Deno.args, {
  string: ["expire", "subject"],
  collect: ["scope"],
});

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
}

const key = new TextEncoder().encode(env.JWT_SECRET);

console.error("Jwt token:");
console.log(await jwt.sign(key));
