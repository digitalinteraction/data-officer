import { assertEquals } from "../../../deps_test.ts";
import { formatDuration } from "../../../src/lib/duration.ts";

Deno.test("formatDuration", async (t) => {
  await t.step("should format no seconds", () => {
    assertEquals(formatDuration(0), "0s");
  });

  await t.step("should format seconds", () => {
    assertEquals(formatDuration(23 * 1000), "23s");
  });

  await t.step("should format seconds and minutes", () => {
    assertEquals(formatDuration((23 * 60 + 11) * 1000), "23m 11s");
  });

  await t.step("should format seconds, minutes and hours", () => {
    assertEquals(
      formatDuration(((23 * 60 + 11) * 60 + 5) * 1000),
      "23h 11m 5s",
    );
  });

  await t.step("should format seconds, minutes, hours and days", () => {
    assertEquals(
      formatDuration((((3 * 24 + 23) * 60 + 11) * 60 + 5) * 1000),
      "3d 23h 11m 5s",
    );
  });

  await t.step("should handle negative durations", () => {
    assertEquals(formatDuration(-23000), "-23s");
  });
});
