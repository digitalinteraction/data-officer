import { assertEquals } from "../../../deps_test.ts";
import { getLockOrWait } from "../../../src/lib/semaphore.ts";

Deno.test("getLockOrWait", async (t) => {
  await t.step(
    "should return aquired_lock if the lock is first aquired",
    async () => {
      const result = await getLockOrWait(
        () => true,
        { maxRetries: 0, retryInterval: 0 },
      );
      assertEquals(result, "aquired_lock");
    },
  );

  await t.step(
    "should return waited if the lock was eventualy released",
    async () => {
      let i = 0;
      const setTimeout = (resolve: () => void) => {
        ++i;
        resolve();
      };
      const result = await getLockOrWait(
        () => i > 3,
        { maxRetries: 10, retryInterval: 0, setTimeout },
      );
      assertEquals(result, "waited");
    },
  );

  await t.step(
    "should return failed if it never unlocks",
    async () => {
      const setTimeout = (resolve: () => void) => resolve();

      const result = await getLockOrWait(
        () => false,
        { maxRetries: 10, retryInterval: 0, setTimeout },
      );
      assertEquals(result, "failed");
    },
  );
});
