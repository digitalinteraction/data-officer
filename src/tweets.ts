import { RedisClient } from "../deps.ts";
import { CodeChanges, getRecentCommits } from "./github.ts";

import { getTodaysConsumption } from "./repos/coffee_club.ts";

export interface ScheduledTweet {
  (): Promise<string>;
}

const cupsFormat = new Intl.NumberFormat("en-GB", {
  notation: "compact",
});

export function _cupsMessage(cups: number) {
  if (cups === 0) return `No coffee`;
  if (cups === 1) return `1 cup of coffee`;
  return `${cupsFormat.format(cups)} cups of coffee`;
}

export function _amCoffeeMessage(cups: number) {
  const verb = (c: number) => c > 1 ? "were" : "was";

  return [
    _cupsMessage(cups),
    verb(cups),
    "drunk this morning",
  ].join(" ");
}

export function _pmCoffeeMessage(allCups: number, pmCups: number) {
  const verb = (c: number) => c > 1 ? "were" : "was";

  if (allCups === 0) {
    return "No coffee was drunk today";
  }

  const allMessage = allCups === 1
    ? "1 cup"
    : `${cupsFormat.format(allCups)} cups`;

  return [
    _cupsMessage(pmCups),
    verb(pmCups),
    "drunk this afternoon, making it",
    allMessage,
    "today",
  ].join(" ");
}

export function _commitsTweet(changes: CodeChanges) {
  const verb = (n: number) => n === 1 ? "was" : "were";
  const lines = (l: number) => `${l} ${l === 1 ? "line" : "lines"}`;

  if (
    changes.total === 0 && changes.additions === 0 && changes.deletions === 0
  ) {
    return "🧑‍💻 no code was committed today";
  }

  return [
    "🧑‍💻",
    lines(changes.total),
    "of code",
    verb(changes.total),
    "modified today,",
    lines(changes.additions),
    verb(changes.additions),
    "added and",
    lines(changes.deletions),
    verb(changes.deletions),
    "removed",
  ].join(" ");
}

export function getScheduledTweets(redis: RedisClient) {
  const tweets = new Map<string, ScheduledTweet>();

  tweets.set("morning_coffee", async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const cups = await getTodaysConsumption(redis, startOfDay);
    return "☕️ " + _amCoffeeMessage(cups);
  });

  tweets.set("afternoon_coffee", async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const afternoon = new Date();
    afternoon.setHours(12, 0, 0, 0);

    return "☕️ " + _pmCoffeeMessage(
      await getTodaysConsumption(redis, startOfDay),
      await getTodaysConsumption(redis, afternoon),
    );
  });

  tweets.set("daily_commits", async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const commits = await getRecentCommits(startOfDay);
    return _commitsTweet(commits);
  });

  return tweets;
}
