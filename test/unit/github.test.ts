import { assertEquals } from "../../deps_test.ts";
import { _parseLinkHeader } from "../../src/github.ts";

Deno.test("_parseLinkHeader", async (t) => {
  await t.step("should parse out the related urls", () => {
    assertEquals(
      _parseLinkHeader(
        `<https://example.com/next>; rel="next", <https://example.com/last>; rel="last"`,
      ),
      new Map([
        ["next", "https://example.com/next"],
        ["last", "https://example.com/last"],
      ]),
    );
  });
});
