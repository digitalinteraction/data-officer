import { AcornContext, jwtVerify, parseYaml, SignJWT } from "../../deps.ts";

/** An auth token loaded from an `auth.yml` type file */
export interface StaticAuthToken {
  name: string;
  secret: string;
  scopes: string[];
}

/** The contents of an `auth.yml` type file */
export interface AuthTokenFile {
  tokens: StaticAuthToken[];
}

/** An authorization error, for Acorn to catch and return a http/401 response */
export class AuthzError extends Error {}

const bearerRegex = /^bearer /i;

/** Get the token part of a bearer-type authentication header (case insensitive) */
export function getBearerHeader(headers: Headers) {
  const header = headers.get("authorization");
  if (!header || !bearerRegex.test(header)) return null;
  return header.replace(bearerRegex, "");
}

/** Consistently convert a string or strings or no strings into a string array */
export const _toArray = (input: string | string[] | undefined) => {
  if (input === undefined) return [];
  return typeof input === "string" ? [input] : input;
};

/** Options for signing a JWT */
export interface JwtSignOptions {
  audience?: string[];
  expiresIn?: string;
}

/** A service for authenticating server requests based on JWT and/or a static set of tokens */
export class AuthService {
  #secret: Uint8Array;
  #jwtIssuer: string;
  #staticTokens: Map<string, StaticAuthToken>;

  constructor(
    secret: string,
    jwtIssuer: string,
    staticTokens: StaticAuthToken[],
  ) {
    this.#secret = new TextEncoder().encode(secret);
    this.#jwtIssuer = jwtIssuer;
    this.#staticTokens = new Map(staticTokens.map((s) => [s.secret, s]));
  }

  /** Assert an Acorn context has access to certain scopes or throw an `AuthzError` */
  async authenticate(ctx: AcornContext, scope: string | string[]) {
    const auth = getBearerHeader(ctx.request.headers) ??
      ctx.searchParams["token"];
    if (!auth) throw new AuthzError("No authorization present");

    const userScopes = new Set((await this.getScopes(auth)) ?? []);
    if (userScopes.size === 0) throw new AuthzError("Bad authorization");

    const requiredScopes = _toArray(scope);
    if (
      requiredScopes.length > 0 &&
      requiredScopes.every((s) => !userScopes.has(s)) &&
      !userScopes.has("admin")
    ) {
      throw new AuthzError("Not authorized for: " + requiredScopes);
    }

    return userScopes;
  }

  /**
   * Find the scopes an authentication token is allowed to access, checking
   * a jwt's `aud` claim or a static token's `scopes` option, or null otherwise.
   */
  async getScopes(auth: string): Promise<string[] | null> {
    const jwt = await jwtVerify(
      auth,
      this.#secret,
      { issuer: this.#jwtIssuer },
    ).catch(() => null);

    if (jwt) return _toArray(jwt.payload.aud);

    const staticToken = this.#staticTokens.get(auth);

    if (staticToken) return staticToken.scopes;

    return null;
  }

  /** Sign a JWT for later consumption by the http server */
  sign(subject: string, options: JwtSignOptions) {
    const jwt = new SignJWT({ sub: subject, iss: this.#jwtIssuer })
      .setIssuedAt()
      .setProtectedHeader({ alg: "HS256", typ: "JWT" });
    if (options.audience) jwt.setAudience(options.audience);
    if (options.expiresIn) jwt.setExpirationTime(options.expiresIn);
    return jwt.sign(this.#secret);
  }

  /**
   * Sign a JWT from a http request, first validating the body then using it to
   * construct a JWT based on the options set and returns the signed JWT. e.g.
   *
   * ```sh
   * http $URL \
   *    subject="geoff@example.com" \
   *    scope="ping repos:coffee-club" \
   *    expiresIn="1y"
   * ```
   */
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

/** Load an `auth.yml` file, validate it and return the contents */
export async function loadAuthTokens(filename: string) {
  const content = await Deno.readTextFile(filename).catch(() => null);
  if (!content) return null;
  return parseTokensFile(parseYaml(content));
}

/**
 * Parse and validate an `auth.yml` file
 *
 * I wish deno.land/x/superstruct worked ...
 */
export function parseTokensFile(
  input: unknown,
): AuthTokenFile {
  if (typeof input !== "object" || input === null) {
    throw new Error("Malformed file");
  }
  const { tokens } = input as Record<"tokens", unknown[]>;

  if (!Array.isArray(tokens)) throw new Error("Missing tokens[]");

  const output: AuthTokenFile = {
    tokens: [],
  };

  for (const [i, token] of tokens.entries()) {
    if (
      typeof token !== "object" ||
      token === null ||
      typeof token.name !== "string" ||
      typeof token.secret !== "string" ||
      !Array.isArray(token.scopes) ||
      token.scopes.some((s: unknown) => typeof s !== "string")
    ) {
      throw new Error(`tokens[${i}] is invalid`);
    }
    output.tokens.push({
      name: token.name,
      secret: token.secret,
      scopes: Array.from(token.scopes),
    });
  }

  return output;
}
