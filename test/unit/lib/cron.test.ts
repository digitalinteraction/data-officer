import { assertEquals } from "../../../deps_test.ts";
import { _parseRange, parseCronExpression } from "../../../src/lib/cron.ts";

Deno.test("_parseRange", async (t) => {
  await t.step("should parse a number", () => {
    assertEquals(_parseRange("5", 0, 6), [5]);
  });

  await t.step("should parse a range", () => {
    assertEquals(_parseRange("5-9", 0, 10), [[5, 9]]);
  });

  await t.step("should parse a wildcard", () => {
    assertEquals(_parseRange("*", 0, 10), ["*"]);
  });
});

Deno.test("parseCronExpression", async (t) => {
  await t.step("should parse it", () => {
    assertEquals(
      parseCronExpression("0 12 * * 1-5"),
      {
        minutes: [0],
        hours: [12],
        daysOfMonth: ["*"],
        months: ["*"],
        daysOfWeek: [[1, 5]],
      },
    );
  });
});
