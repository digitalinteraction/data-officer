import {
  assertEquals,
  assertMatch,
  assertObjectMatch,
  assertStringIncludes,
} from "../../../deps_test.ts";
import { getMarkdownCollection } from "../../../src/lib/repos.ts";

Deno.test("getMarkdownCollection", async (t) => {
  await t.step("should something", async () => {
    const result = await getMarkdownCollection(
      "test/fixtures/repo_products/*.md",
    );

    assertEquals(result.length, 1);
    assertObjectMatch(result[0], {
      attrs: {
        name: "Coffee beans",
        price: 16,
        quantity: 1000,
      },
    });
    assertStringIncludes(
      result[0].path,
      "test/fixtures/repo_products/coffee_beans.md",
    );
    assertMatch(result[0].body, /Tasty coffee/i);
  });
});
