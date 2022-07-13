import { base64, RedisClient } from "../../deps.ts";
import { getEnv } from "./env.ts";

const TWITTER_URL = new URL("https://api.twitter.com/2/");
// const TOKEN_PATH = "data/twitter_auth.json";
const TOKEN_AUTH_KEY = "twitter/auth";
const TOKEN_LOCK_KEY = "twitter/lock";
const OAUTH2_STATE_KEY = "twitter/state";

export interface TwitterClientOptions {
  clientId: string;
  clientSecret: string;
}

export interface TwitterCredentials {
  token_type: string;
  expires_in: number;
  expires_at?: number;
  access_token: string;
  scope: string;
  refresh_token: string;
}

export interface TwitterAuthorizeOptions {
  redirectUri: string | URL;
  scope: string[];
  state: string;
}

export function _getExpiresAt(
  creds: TwitterCredentials,
  now = Date.now(),
): number {
  return now + creds.expires_in * 1000;
}

export function _getClientBasicAuthz(id: string, secret: string) {
  return `Basic ${base64.encode([id, secret].join(":"))}`;
}

export function _isValid(creds: TwitterCredentials, now = Date.now()): boolean {
  if (creds.expires_at === undefined) return true;
  return creds.expires_at > now;
}

export class TwitterClient {
  static fromEnv() {
    const env = getEnv("TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET");
    return new TwitterClient({
      clientId: env.TWITTER_CLIENT_ID,
      clientSecret: env.TWITTER_CLIENT_SECRET,
    });
  }

  constructor(public options: TwitterClientOptions) {}

  getAuthorizeUrl({ redirectUri, scope, state }: TwitterAuthorizeOptions) {
    const url = new URL("https://twitter.com/i/oauth2/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", this.options.clientId);
    url.searchParams.set("redirect_uri", redirectUri.toString());
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", "challenge");
    url.searchParams.set("code_challenge_method", "plain");
    // url.searchParams.set("scope", scope.join(" "));

    // NOTE: the twitter API doesn't like the way URLSearchParams converts
    // spaces to '+' characters
    return (
      url + "&scope=" + scope.map((v) => encodeURIComponent(v)).join("%20")
    );
  }

  async getTokenFromCode(
    code: string,
    redirectUri: string | URL,
  ): Promise<TwitterCredentials> {
    const response = await fetch(new URL("oauth2/token", TWITTER_URL), {
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: _getClientBasicAuthz(
          this.options.clientId,
          this.options.clientSecret,
        ),
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: this.options.clientId,
        redirect_uri: redirectUri.toString(),
        code_verifier: "challenge",
      }).toString(),
    });

    const credentials: TwitterCredentials = await response.json();
    credentials.expires_at = _getExpiresAt(credentials);
    return credentials;
  }

  // async stashCredentials(credentials: TwitterCredentials) {
  //   const { dir } = path.parse(TOKEN_PATH);
  //   if (dir) await Deno.mkdir(dir, { recursive: true });
  //   await Deno.writeTextFile(TOKEN_PATH, JSON.stringify(credentials, null, 2));
  // }

  // async grabCredentials(): Promise<TwitterCredentials | null> {
  //   try {
  //     return JSON.parse(await Deno.readTextFile(TOKEN_PATH));
  //   } catch (_error) {
  //     return null;
  //   }
  // }

  async refreshToken(creds: TwitterCredentials, redis: RedisClient) {
    if (_isValid(creds)) return creds;

    const response = await fetch(new URL("oauth2/token", TWITTER_URL), {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: _getClientBasicAuthz(
          this.options.clientId,
          this.options.clientSecret,
        ),
      },
      body: new URLSearchParams({
        refresh_token: creds.refresh_token,
        grant_type: "refresh_token",
      }),
    }).catch((error) => {
      console.error(error);
      return null;
    });

    if (!response || !response.ok) {
      // await Deno.remove(TOKEN_PATH);
      if (response?.status === 400) {
        await redis.del(TOKEN_AUTH_KEY);
      }
      throw new Error("Failed to refresh credentials");
    }

    const newCreds: TwitterCredentials = await response.json();
    newCreds.expires_at = _getExpiresAt(newCreds);
    return newCreds;
  }

  // async getUpdatedCredentials(): Promise<TwitterCredentials> {
  //   const initial = await this.grabCredentials();
  //   if (!initial) throw new Error("No credentials loaded");
  //   const updated = await this.refreshToken(initial);
  //   if (updated !== initial) this.stashCredentials(updated);
  //   return updated;
  // }

  async getHealth(redis: RedisClient): Promise<boolean> {
    const creds = await this.getUpdatedCredentials(redis).catch(
      (error) => {
        console.error("twitter#getUpdatedCredentials error");
        console.error(error);
        return null;
      },
    );
    if (creds === "already_running") return true;
    return creds ? _isValid(creds) : false;
  }

  /** https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets */
  tweet(text: string, creds: TwitterCredentials) {
    return fetch(new URL("tweets", TWITTER_URL), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${creds.access_token}`,
      },
      body: JSON.stringify({ text }),
    });
  }

  async grabCredentials(
    redis: RedisClient,
  ): Promise<TwitterCredentials | null> {
    try {
      const result = await redis.get(TOKEN_AUTH_KEY) as string;
      if (typeof result !== "string") return null;
      return JSON.parse(result);
    } catch (_error) {
      return null;
    }
  }
  async stashCredentials(redis: RedisClient, creds: TwitterCredentials) {
    await redis.set(TOKEN_AUTH_KEY, JSON.stringify(creds));
  }
  async getUpdatedCredentials(
    redis: RedisClient,
  ): Promise<TwitterCredentials | "already_running"> {
    const initial = await this.grabCredentials(redis);
    if (!initial) throw new Error("No credentials loaded");
    if (_isValid(initial)) return initial;

    const id = crypto.randomUUID();
    const lock = await redis.setnx(TOKEN_LOCK_KEY, id);
    if (lock !== 1) return "already_running";

    const updated = await this.refreshToken(initial, redis);

    await redis.del(TOKEN_LOCK_KEY);

    if (updated !== initial) this.stashCredentials(redis, updated);

    return updated;
  }
}

export class TwitterOAuth2 {
  state: string | null = null;
  constructor(
    protected client: TwitterClient,
    protected redirectUri: URL,
    protected redis: RedisClient,
  ) {}

  async startLogin({ force = false, now = Date.now() } = {}) {
    const credentials = await this.client.grabCredentials(this.redis);
    if (
      !force &&
      credentials?.expires_at &&
      credentials.expires_at > now
    ) {
      return null;
    }

    const state = crypto.randomUUID();
    await this.redis.set(OAUTH2_STATE_KEY, state);
    return this.client.getAuthorizeUrl({
      redirectUri: this.redirectUri,
      state: state,
      scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    });
  }

  async finishLogin(
    state?: string,
    code?: string,
  ): Promise<TwitterCredentials | null> {
    const storedState = await this.redis.get(OAUTH2_STATE_KEY);
    if (
      typeof storedState !== "string" || !storedState ||
      typeof code !== "string" ||
      state !== this.state
    ) {
      return null;
    }

    const creds = await this.client.getTokenFromCode(code, this.redirectUri);
    await this.client.stashCredentials(this.redis, creds);
    this.state = null;

    return creds;
  }
}
