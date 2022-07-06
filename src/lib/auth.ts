import { AcornContext, app, jwtVerify } from "../../deps.ts";

export class AuthzError extends Error {}

const bearerRegex = /^bearer /i;

export function getBearerHeader(headers: Headers) {
  const header = headers.get("authorization");
  if (!header || !bearerRegex.test(header)) return null;
  return header.replace(bearerRegex, "");
}

const toArray = (input: string | string[] | undefined) => {
  if (input === undefined) return [];
  return typeof input === "string" ? [input] : input;
};

export async function authenticate(scope: string, ctx: AcornContext) {
  const auth = getBearerHeader(ctx.request.headers) ??
    ctx.searchParams["token"];
  if (!auth) throw new AuthzError("No authorization present");

  const result = await jwtVerify(auth, new TextEncoder().encode("top_secret"), {
    issuer: app.jwtIssuer,
  }).catch(() => null);

  if (!result) throw new AuthzError("Bad authorization");

  // Check the audience manually, to add an "admin" check
  const aud = toArray(result.payload.aud);
  if (!aud.includes(scope) && !aud.includes("admin")) {
    throw new AuthzError("Scope missing: " + scope);
  }

  return result;
}
