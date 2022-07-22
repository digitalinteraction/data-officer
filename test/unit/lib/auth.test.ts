// deno-lint-ignore-file no-explicit-any

import {
  assert,
  assertEquals,
  assertObjectMatch,
  assertRejects,
  assertThrows,
} from "../../../deps_test.ts";
import {
  _toArray,
  AuthService,
  AuthzError,
  getBearerHeader,
  parseTokensFile,
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
const STATIC_TOKEN = "abcdef";

Deno.test("AuthService", async (t) => {
  const auth = new AuthService(JWT_SECRET, JWT_ISSUER, [
    { name: "jim", secret: STATIC_TOKEN, scopes: ["admin"] },
  ]);

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

    await t.step("should validate from static tokens", async () => {
      const { ctx, searchParams } = setup();
      searchParams.token = STATIC_TOKEN;
      await auth.authenticate(ctx, "user");
    });

    await t.step(
      "should return scopes if no required ones are passed",
      async () => {
        const { ctx, searchParams } = setup();
        searchParams.token = USER_JWT;
        assertEquals(
          await auth.authenticate(ctx, []),
          new Set(["user"]),
        );
      },
    );
  });

  await t.step("#getScopes", async (t) => {
    await t.step("should return the scopes from a jwt", async () => {
      assertEquals(
        await auth.getScopes(USER_JWT),
        ["user"],
      );
    });
    await t.step("should return the scopes from a static token", async () => {
      assertEquals(
        await auth.getScopes(STATIC_TOKEN),
        ["admin"],
      );
    });
    await t.step("should return null when no auth found", async () => {
      assertEquals(
        await auth.getScopes("unknown_auth"),
        null,
      );
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

Deno.test("parseTokensFile", async (t) => {
  await t.step("should throw when no tokens", () => {
    assertThrows(
      () => parseTokensFile({}),
    );
  });
  await t.step("should throw tokens isn't an array", () => {
    assertThrows(
      () => parseTokensFile({ tokens: {} }),
    );
  });

  await t.step("should throw token missing name", () => {
    const input = {
      tokens: [{ secret: "secret", scopes: ["user"] }],
    };
    assertThrows(
      () => parseTokensFile(input),
    );
  });

  await t.step("should throw token missing secret", () => {
    const input = {
      tokens: [{ name: "name", scopes: ["user"] }],
    };
    assertThrows(
      () => parseTokensFile(input),
    );
  });

  await t.step("should throw token missing scopes", () => {
    const input = {
      tokens: [{ name: "name", secret: "secret" }],
    };
    assertThrows(
      () => parseTokensFile(input),
    );
  });

  await t.step("should throw token scopes not an array", () => {
    const input = {
      tokens: [{ name: "name", secret: "secret", scopes: {} }],
    };
    assertThrows(
      () => parseTokensFile(input),
    );
  });

  await t.step("should throw token scopes not a string array", () => {
    const input = {
      tokens: [{ name: "name", secret: "secret", scopes: [1] }],
    };
    assertThrows(
      () => parseTokensFile(input),
    );
  });

  await t.step("should not throw while parsing", () => {
    assertEquals(
      parseTokensFile({
        tokens: [
          {
            name: "sandra",
            secret: "fedcba",
            scopes: ["admin"],
          },
        ],
      }),
      {
        tokens: [
          {
            name: "sandra",
            secret: "fedcba",
            scopes: ["admin"],
          },
        ],
      },
    );
  });
});
