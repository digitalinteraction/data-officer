import { assertMatch } from "../../deps_test.ts";
import {
  _amCoffeeMessage,
  _commitsTweet,
  _pmCoffeeMessage,
} from "../../src/tweets.ts";

Deno.test("_amCoffeeMessage", async (t) => {
  await t.step("should format no coffees", () => {
    assertMatch(
      _amCoffeeMessage(0),
      /no coffee was drunk this morning/i,
    );
  });

  await t.step("should format single coffees", () => {
    assertMatch(
      _amCoffeeMessage(1),
      /1 cup of coffee was drunk this morning/i,
    );
  });

  await t.step("should format multiple coffees", () => {
    assertMatch(
      _amCoffeeMessage(5),
      /5 cups of coffee were drunk this morning/i,
    );
  });
});

Deno.test("_pmCoffeeMessage", async (t) => {
  await t.step("show format no coffees", () => {
    assertMatch(
      _pmCoffeeMessage(0, 0),
      /no coffee was drunk today/i,
    );
  });

  await t.step("show format single-morning only coffees", () => {
    const msg = _pmCoffeeMessage(1, 0);
    assertMatch(msg, /no coffee was drunk this afternoon/i);
    assertMatch(msg, /making it 1 cup today/i);
  });

  await t.step("show format multi-morning only coffees", () => {
    const msg = _pmCoffeeMessage(3, 0);
    assertMatch(msg, /no coffee was drunk this afternoon/i);
    assertMatch(msg, /making it 3 cups today/i);
  });

  await t.step("show format single-afternoon only coffees", () => {
    const msg = _pmCoffeeMessage(1, 1);
    assertMatch(msg, /1 cup of coffee was drunk this afternoon/i);
    assertMatch(msg, /making it 1 cup today/i);
  });

  await t.step("show format multi-afternoon only coffees", () => {
    const msg = _pmCoffeeMessage(6, 6);
    assertMatch(msg, /6 cups of coffee were drunk this afternoon/i);
    assertMatch(msg, /making it 6 cups today/i);
  });

  await t.step("show format single-afternoon coffees", () => {
    const msg = _pmCoffeeMessage(7, 1);
    assertMatch(msg, /1 cup of coffee was drunk this afternoon/i);
    assertMatch(msg, /making it 7 cups today/i);
  });

  await t.step("show format multi-afternoon coffees", () => {
    const msg = _pmCoffeeMessage(7, 3);
    assertMatch(msg, /3 cups of coffee were drunk this afternoon/i);
    assertMatch(msg, /making it 7 cups today/i);
  });
});

Deno.test("_commitsTweet", async (t) => {
  await t.step("format code changes", () => {
    const msg = _commitsTweet({
      modified: 13,
      additions: 12,
      removals: 1,
    });
    assertMatch(msg, /13 lines of code were modified/i);
    assertMatch(msg, /12 lines were added/i);
    assertMatch(msg, /1 line was removed/i);
  });

  await t.step("format no changes", () => {
    const msg = _commitsTweet({
      modified: 0,
      additions: 0,
      removals: 0,
    });
    assertMatch(msg, /no code was committed today/i);
  });
});
