// deno-lint-ignore-file no-explicit-any

import {
  assert,
  assertEquals,
  assertObjectMatch,
  assertRejects,
} from "../../../deps_test.ts";
import {
  _toArray,
  AuthService,
  AuthzError,
  getBearerHeader,
} from "../../../src/lib/auth.ts";

function jwtPayload(input: string) {
  return JSON.parse(atob(input.split(".")[1]));
}

Deno.test("getBearerHeader", async (t) => {
  await t.step("should return the bearer token", () => {
    assertEquals(
      getBearerHeader(new Headers({ authorization: "bearer top_secret" })),
      "top_secret",
    );
  });
});

Deno.test("_toArray", async (t) => {
  await t.step("should convert a string to an array", () => {
    assertEquals(
      _toArray("string"),
      ["string"],
    );
  });

  await t.step("should keep an array as an array", () => {
    assertEquals(
      _toArray(["a", "b", "c"]),
      ["a", "b", "c"],
    );
  });

  await t.step("should turn undefined into an empty array", () => {
    assertEquals(
      _toArray(undefined),
      [],
    );
  });
});

const JWT_ISSUER = "data-officer";
const JWT_SECRET = "not_secret";
const USER_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkYXRhLW9mZmljZXIiLCJhdWQiOlsidXNlciJdfQ.dcbiCR88KjnXlav2JpPoBBNM-2zEhvWZW-h63gVj5jw";
const ADMIN_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkYXRhLW9mZmljZXIiLCJhdWQiOlsiYWRtaW4iXX0.-TgmL1F3cpjNbmfN0FwRJJ4RIn_24YAyGOa1yfmkzYM";

Deno.test("AuthService", async (t) => {
  const auth = new AuthService(JWT_SECRET, JWT_ISSUER);

  await t.step("#authenticate", async (t) => {
    function setup() {
      const headers = new Headers();
      const searchParams: any = {};
      const ctx: any = { request: { headers }, searchParams };
      return { headers, searchParams, ctx };
    }

    await t.step("should throw AuthzError when not authed", () => {
      const { ctx } = setup();

      assertRejects(
        () => auth.authenticate(ctx, "user"),
        AuthzError,
      );
    });

    await t.step("should parse auth headers", async () => {
      const { ctx, headers } = setup();

      headers.set("Authorization", "Bearer " + USER_JWT);
      await auth.authenticate(ctx, "user");
    });

    await t.step("should parse searchParams token", async () => {
      const { ctx, searchParams } = setup();
      searchParams.token = USER_JWT;
      await auth.authenticate(ctx, "user");
    });

    await t.step("should throw AuthzError if the scope is missing", () => {
      const { ctx, searchParams } = setup();
      searchParams.token = USER_JWT;
      assertRejects(
        () => auth.authenticate(ctx, "moderate"),
        AuthzError,
      );
    });

    await t.step("should always allow admins", async () => {
      const { ctx, searchParams } = setup();
      searchParams.token = ADMIN_JWT;
      await auth.authenticate(ctx, "user");
    });
  });

  await t.step("#sign", async (t) => {
    await t.step("should sign the jwt", async () => {
      const result = await auth.sign("john", {
        audience: ["user"],
        expiresIn: "5m",
      });
      const payload = jwtPayload(result);
      assertObjectMatch(payload, {
        iss: JWT_ISSUER,
        sub: "john",
        aud: ["user"],
      });

      assert(typeof payload.iat === "number", "should have an iat");
      assert(typeof payload.exp === "number", "should have an exp");
    });
  });

  await t.step("#signFromRequest", async (t) => {
    await t.step("should return the jwt", async () => {
      const result = await auth.signFromRequest({
        subject: "jess",
        scope: "user moderate",
        expiresIn: "5m",
      });
      assert(result, "jwt should be non-null");

      const payload = jwtPayload(result);
      assertObjectMatch(payload, {
        iss: JWT_ISSUER,
        sub: "jess",
        aud: ["user"],
      });

      assert(typeof payload.iat === "number", "should have an iat");
      assert(typeof payload.exp === "number", "should have an exp");
    });
  });
});
