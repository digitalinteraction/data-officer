import { path } from "../../deps.ts";
import { getEnv } from "./env.ts";

const TWITTER_URL = new URL("https://api.twitter.com/2/");
const TOKEN_PATH = "data/twitter_auth.json";

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

export function _getExpiresAt(creds: TwitterCredentials): number {
  return Date.now() + creds.expires_in * 1000;
}

export function _getClientBasicAuthz(id: string, secret: string) {
  return `Basic ${btoa([id, secret].join(":"))}`;
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

  async stashCredentials(credentials: TwitterCredentials) {
    const { dir } = path.parse(TOKEN_PATH);
    if (dir) await Deno.mkdir(dir, { recursive: true });
    await Deno.writeTextFile(TOKEN_PATH, JSON.stringify(credentials, null, 2));
  }

  async grabCredentials(): Promise<TwitterCredentials | null> {
    try {
      return JSON.parse(await Deno.readTextFile(TOKEN_PATH));
    } catch (_error) {
      return null;
    }
  }

  async refreshToken(creds: TwitterCredentials) {
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
      await Deno.remove(TOKEN_PATH);
      throw new Error("Failed to refresh credentials");
    }

    const newCreds: TwitterCredentials = await response.json();
    newCreds.expires_at = _getExpiresAt(newCreds);
    return newCreds;
  }

  async getUpdatedCredentials(): Promise<TwitterCredentials> {
    const initial = await this.grabCredentials();
    if (!initial) throw new Error("No credentials loaded");
    const updated = await this.refreshToken(initial);
    if (updated !== updated) this.stashCredentials(updated);
    return updated;
  }

  async getHealth(): Promise<boolean> {
    const creds = await this.getUpdatedCredentials();
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
}

export class TwitterOAuth2 {
  state: string | null = null;
  constructor(protected client: TwitterClient, protected redirectUri: URL) {}

  async startLogin({ force = false } = {}) {
    const credentials = await this.client.grabCredentials();
    if (
      !force &&
      credentials?.expires_at &&
      credentials.expires_at > Date.now()
    ) {
      return null;
    }

    this.state = crypto.randomUUID();
    return this.client.getAuthorizeUrl({
      redirectUri: this.redirectUri,
      state: this.state,
      scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    });
  }

  async finishLogin(
    state?: string,
    code?: string,
  ): Promise<TwitterCredentials | null> {
    if (!this.state || typeof code !== "string" || state !== this.state) {
      return null;
    }

    const creds = await this.client.getTokenFromCode(code, this.redirectUri);
    await this.client.stashCredentials(creds);
    this.state = null;

    return creds;
  }
}
