import { getLatestConsumption } from "./repos/coffee_club.ts";

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
    "drank this morning",
  ].join(" ");
}

export function _pmCoffeeMessage(allCups: number, pmCups: number) {
  const verb = (c: number) => c > 1 ? "were" : "was";

  if (allCups === 0) {
    return "No coffee was drank today";
  }

  const allMessage = allCups === 1
    ? "1 cup"
    : `${cupsFormat.format(allCups)} cups`;

  return [
    _cupsMessage(pmCups),
    verb(pmCups),
    "drank this afternoon, making it",
    allMessage,
    "today",
  ].join(" ");
}

interface CodeChanges {
  modified: number;
  additions: number;
  removals: number;
}

export function _commitsTweet(changes: CodeChanges) {
  const verb = (n: number) => n === 1 ? "was" : "were";
  const lines = (l: number) => `${l} ${l === 1 ? "line" : "lines"}`;

  if (
    changes.modified === 0 && changes.additions === 0 && changes.removals === 0
  ) {
    return "🧑‍💻 no code was committed today";
  }

  return [
    "🧑‍💻",
    lines(changes.modified),
    "of code",
    verb(changes.modified),
    "modified today,",
    lines(changes.additions),
    verb(changes.additions),
    "added and",
    lines(changes.removals),
    verb(changes.removals),
    "removed",
  ].join(" ");
}

export function getScheduledTweets() {
  // const tweets: Record<string, ScheduledTweet> = {};
  const tweets = new Map<string, ScheduledTweet>();

  tweets.set("morning_coffee", async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const cups = await getLatestConsumption(startOfDay);
    return "☕️ " + _amCoffeeMessage(cups);
  });

  tweets.set("afternoon_coffee", async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const afternoon = new Date();
    afternoon.setHours(12, 0, 0, 0);

    return "☕️ " + _pmCoffeeMessage(
      await getLatestConsumption(startOfDay),
      await getLatestConsumption(afternoon),
    );
  });

  // tweets.set('daily_commits', () => {
  //   // TODO: fetch commits using GitHub API
  //   throw new Error("Not implemented");
  // });

  return tweets;
}
