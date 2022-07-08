import { getEnv } from "./env.ts";

const TWITTER_URL = new URL("https://api.twitter.com/2/");

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
  redirectUri: string;
  scope: string[];
  state: string;
}

export function _getExpiresAt(creds: TwitterCredentials): number {
  return Date.now() + creds.expires_in * 1000;
}

export function _getClientBasicAuthz(id: string, secret: string) {
  return `Basic ${btoa([id, secret].join(":"))}`;
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
    url.searchParams.set("redirect_uri", redirectUri);
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
    redirectUri: string
  ): Promise<TwitterCredentials> {
    const response = await fetch(new URL("oauth2/token", TWITTER_URL), {
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: _getClientBasicAuthz(
          this.options.clientId,
          this.options.clientSecret
        ),
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: this.options.clientId,
        redirect_uri: redirectUri,
        code_verifier: "challenge",
      }).toString(),
    });

    const credentials: TwitterCredentials = await response.json();
    credentials.expires_at = _getExpiresAt(credentials);
    return credentials;
  }

  async stashCredentials(credentials: TwitterCredentials) {
    await Deno.writeTextFile(
      "twitter_auth.json",
      JSON.stringify(credentials, null, 2)
    );
  }

  async grabCredentials(): Promise<TwitterCredentials | null> {
    try {
      return JSON.parse(await Deno.readTextFile("twitter_auth.json"));
    } catch (_error) {
      return null;
    }
  }

  async refreshToken(creds: TwitterCredentials) {
    if (creds.expires_at !== undefined && creds.expires_at > Date.now()) {
      return creds;
    }

    const response = await fetch(new URL("oauth2/token", TWITTER_URL), {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: _getClientBasicAuthz(
          this.options.clientId,
          this.options.clientSecret
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
}