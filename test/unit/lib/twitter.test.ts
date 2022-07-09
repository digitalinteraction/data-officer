// deno-lint-ignore-file no-explicit-any
import { assert, assertEquals } from "../../../deps_test.ts";
import {
  _getClientBasicAuthz,
  _isValid,
  TwitterClient,
} from "../../../src/lib/twitter.ts";

Deno.test("_getClientBasicAuthz", async (t) => {
  await t.step("should return the header", () => {
    assertEquals(
      _getClientBasicAuthz("id", "secret"),
      "Basic aWQ6c2VjcmV0",
    );
  });
});

Deno.test("_isValid", async (t) => {
  const now = 10;
  const creds: any = {};

  await t.step("should return true if it hasn't expired yet", () => {
    assert(
      _isValid({ ...creds, expires_at: 11 }, now),
      "should be valid",
    );
  });

  await t.step("should be valid if the expires_at isn't set", () => {
    assert(
      _isValid({ ...creds }, now),
      "should be valid",
    );
  });

  await t.step("should be invalid if expires_at is in the past", () => {
    assert(
      _isValid({ ...creds, expires_at: 9 }, now) === false,
      "should be valid",
    );
  });
});

Deno.test("TwitterClient", async (t) => {
  const twitter = new TwitterClient({
    clientId: "id",
    clientSecret: "secret",
  });

  await t.step("#getAuthorizeUrl", async (t) => {
    await t.step("should return the twitter login url", () => {
      const result = new URL(twitter.getAuthorizeUrl({
        redirectUri: "http://localhost",
        scope: ["user", "moderate"],
        state: "state",
      }));

      assertEquals(result.searchParams.get("response_type"), "code");
      assertEquals(result.searchParams.get("client_id"), "id");
      assertEquals(result.searchParams.get("redirect_uri"), "http://localhost");
      assertEquals(result.searchParams.get("state"), "state");
      assertEquals(result.searchParams.get("code_challenge"), "challenge");
      assertEquals(result.searchParams.get("code_challenge_method"), "plain");
      assertEquals(result.searchParams.get("scope"), "user moderate");
    });
  });
});
