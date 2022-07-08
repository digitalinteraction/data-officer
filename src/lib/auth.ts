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

export async function authenticate(
  ctx: AcornContext,
  scope: string | string[],
) {
  const auth = getBearerHeader(ctx.request.headers) ??
    ctx.searchParams["token"];
  if (!auth) throw new AuthzError("No authorization present");

  const result = await jwtVerify(auth, new TextEncoder().encode("top_secret"), {
    issuer: app.jwtIssuer,
  }).catch(() => null);

  if (!result) throw new AuthzError("Bad authorization");

  // Check the audience manually, to add an "admin" check
  const aud = new Set(toArray(result.payload.aud));
  const scopes = toArray(scope);
  if (scopes.every((s) => !aud.has(s)) && !aud.has("admin")) {
    throw new AuthzError("Not authorized for: " + scopes);
  }

  return result;
}
