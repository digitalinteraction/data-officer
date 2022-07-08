import { AcornContext, app, jwtVerify, SignJWT } from "../../deps.ts";

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

export interface JwtSignOptions {
  audience?: string[];
  expiresIn?: string;
}

export class AuthService {
  #secret: Uint8Array;
  constructor(secret: string) {
    this.#secret = new TextEncoder().encode(secret);
  }

  async authenticate(ctx: AcornContext, scope: string | string[]) {
    const auth = getBearerHeader(ctx.request.headers) ??
      ctx.searchParams["token"];
    if (!auth) throw new AuthzError("No authorization present");

    const result = await jwtVerify(
      auth,
      this.#secret,
      { issuer: app.jwtIssuer },
    ).catch(() => null);

    if (!result) throw new AuthzError("Bad authorization");

    // Check the audience manually, to add an "admin" check
    const aud = new Set(toArray(result.payload.aud));
    const scopes = toArray(scope);
    if (scopes.every((s) => !aud.has(s)) && !aud.has("admin")) {
      throw new AuthzError("Not authorized for: " + scopes);
    }

    return result;
  }

  sign(subject: string, options: JwtSignOptions) {
    const jwt = new SignJWT({ sub: subject, iss: app.jwtIssuer })
      .setIssuedAt()
      .setProtectedHeader({ alg: "HS256", typ: "JWT" });
    if (options.audience) jwt.setAudience(options.audience);
    if (options.expiresIn) jwt.setExpirationTime(options.expiresIn);
    return jwt.sign(this.#secret);
  }

  signFromRequest(body: unknown) {
    if (typeof body !== "object") return null;
    const { subject, scope, expiresIn } = body as Record<string, unknown>;

    if (
      typeof subject !== "string" || typeof scope !== "string" ||
      (typeof expiresIn !== "string" && expiresIn !== undefined)
    ) {
      return null;
    }

    const audience = scope.split(/\s+/);

    return this.sign(subject, { audience, expiresIn });
  }
}
