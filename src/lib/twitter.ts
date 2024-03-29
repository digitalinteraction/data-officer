import { base64, log, RedisClient } from "../../deps.ts";
import { getLockOrWait, randomBetween } from "./semaphore.ts";

const TWITTER_URL = new URL("https://api.twitter.com/2/");
const TOKEN_AUTH_KEY = "twitter/auth";
const TOKEN_LOCK_KEY = "twitter/lock";
const OAUTH2_STATE_KEY = "twitter/state";

/** Options for creating a `TwitterClient` */
export interface TwitterClientOptions {
  clientId: string;
  clientSecret: string;
}

/** Credientials for accessing twitter, to be stored in Redis */
export interface TwitterCredentials {
  token_type: string;
  expires_in: number;
  expires_at?: number;
  access_token: string;
  scope: string;
  refresh_token: string;
}

/** Options for creating a new Twitter authorization */
export interface TwitterAuthorizeOptions {
  redirectUri: string | URL;
  scope: string[];
  state: string;
}

/** Calculate the custom `expires_at` field for `TwitterCredentials` */
export function _getExpiresAt(
  creds: TwitterCredentials,
  now = Date.now(),
): number {
  return now + creds.expires_in * 1000;
}

/** Create a http basic auth for talking to Twitter */
export function _getClientBasicAuthz(id: string, secret: string) {
  return `Basic ${base64.encode([id, secret].join(":"))}`;
}

/** Whether a `TwitterCredential` has not expired based on a timestamp */
export function _isValid(creds: TwitterCredentials, now = Date.now()): boolean {
  if (creds.expires_at === undefined) return true;
  return creds.expires_at > now;
}

/**
 * A client for talking to the Twitter v2 API, only supports authentication
 * and tweeting so far.
 */
export class TwitterClient {
  constructor(public options: TwitterClientOptions) {}

  /** Get a URL to start an OAuth2 flow */
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

  /** From an OAuth2 code, request a token from Twitter using the client credentials */
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

    // Inject the `expired_at` ket to know when its expired
    const credentials: TwitterCredentials = await response.json();
    credentials.expires_at = _getExpiresAt(credentials);
    return credentials;
  }

  /** From a previous `TwitterCredential`, refresh it to get a new access token  */
  async refreshToken(creds: TwitterCredentials, redis: RedisClient) {
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
      log.error(error);
      return null;
    });

    log.debug("#refreshToken refresh token %O", response);

    // If it went wrong and it is an app-level layer, unstore the creds
    if (!response || !response.ok) {
      if (response?.status === 400) {
        log.debug("#refreshToken remove token");
        await redis.del(TOKEN_AUTH_KEY);
        log.error(response.statusText + " " + await response.text());
      }
      throw new Error("Failed to refresh credentials");
    }

    const newCreds: TwitterCredentials = await response.json();
    newCreds.expires_at = _getExpiresAt(newCreds);
    log.debug("#refreshToken expires_at=%o", newCreds.expires_at);
    return newCreds;
  }

  /** Get the health of the client, i.e. if the token is not expired */
  async getHealth(redis: RedisClient): Promise<boolean> {
    const creds = await this.getUpdatedCredentials(redis).catch(
      (error) => {
        log.error("twitter#getUpdatedCredentials error");
        log.error(error);
        return null;
      },
    );
    return creds ? _isValid(creds) : false;
  }

  /**
   * Post a tweet using some TwitterCredentials
   * https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
   */
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

  /** Get credentials from Redis */
  async grabCredentials(
    redis: RedisClient,
  ): Promise<TwitterCredentials | null> {
    try {
      const result = await redis.get(TOKEN_AUTH_KEY);
      if (typeof result !== "string") return null;
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  /** Store Twitter credentials in Redis */
  async stashCredentials(redis: RedisClient, creds: TwitterCredentials) {
    await redis.set(TOKEN_AUTH_KEY, JSON.stringify(creds));
  }

  /**
   * Get the Twitter credentials from Redis and refresh them if needed.
   * It uses a lock to ensure the no concurrency.
   */
  async getUpdatedCredentials(
    redis: RedisClient,
  ): Promise<TwitterCredentials> {
    const initial = await this.grabCredentials(redis);
    if (!initial) throw new Error("No credentials loaded");
    if (_isValid(initial)) return initial;

    const id = crypto.randomUUID();

    try {
      // Request a lock before refreshing the token
      const lockStatus = await getLockOrWait(
        async () => {
          const result = await redis.setnx(TOKEN_LOCK_KEY, id);
          log.debug(`#getUpdatedCredentials id=${id} lock=${result}`);
          return result === 1;
        },
        { maxRetries: 10, retryInterval: randomBetween(1000, 2000) },
      );

      // Fail if the lock wasn't aquired or couldn't be waited for
      if (lockStatus === "failed") {
        throw new Error("Failed to wait for lock");
      }

      // If the lock was waited for, return the credentials the other process got
      if (lockStatus === "waited") {
        console.debug("#getUpdatedCredentials waited");
        const creds = await this.grabCredentials(redis);
        if (!creds) throw new Error("Failed to wait for refresh");
        return creds;
      }

      // If the lock was aquired, proceed to refresh the credentials

      // Remove the lock after a hot minute
      await redis.expire(TOKEN_LOCK_KEY, 5 * 60);

      const updated = await this.refreshToken(initial, redis);
      await this.stashCredentials(redis, updated);

      return updated;
    } finally {
      log.debug("#getUpdatedCredentials clear lock");
      await redis.del(TOKEN_LOCK_KEY);
    }
  }
}

/** A client for facilitating an OAuth2 flow */
export class TwitterOAuth2 {
  constructor(
    protected client: TwitterClient,
    protected redirectUri: URL,
    protected redis: RedisClient,
  ) {}

  /** Start a login and generate a state that needs to be matched to finish */
  async startLogin({ force = false, now = Date.now() } = {}) {
    const credentials = await this.client.grabCredentials(this.redis);
    if (
      !force &&
      credentials?.expires_at &&
      credentials.expires_at > now
    ) {
      return null;
    }

    // Get an authorization URL for the twitter bot
    const state = crypto.randomUUID();
    await this.redis.set(OAUTH2_STATE_KEY, state, { ex: 60 * 60 });
    return this.client.getAuthorizeUrl({
      redirectUri: this.redirectUri,
      state: state,
      scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    });
  }

  /** Finish the OAuth2 login from a callback url, failing if the state doesn't match */
  async finishLogin(
    state?: string,
    code?: string,
  ): Promise<TwitterCredentials | null> {
    const storedState = await this.redis.get(OAUTH2_STATE_KEY);
    if (
      typeof storedState !== "string" || !storedState ||
      typeof code !== "string" ||
      state !== storedState
    ) {
      return null;
    }

    const creds = await this.client.getTokenFromCode(code, this.redirectUri);
    await this.client.stashCredentials(this.redis, creds);
    await this.redis.del(OAUTH2_STATE_KEY);

    return creds;
  }
}
