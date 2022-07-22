import {
  expandGlob,
  log,
  parseCsv,
  path,
  RedisClient,
  WalkEntry,
} from "../../deps.ts";
import { getCollectionKey, GitRepository } from "../lib/mod.ts";

export const COFFEE_CLUB_REPO_BASE = "repos/coffee-club";

export interface Consumption {
  timestamp: number;
  resource: string;
  quantity: number;
}
export interface RawContribution {
  timestamp: number;
  resource: string;
  quantity: number;
  label: string;
}

export interface ConsumptionJson {
  timestamp: number;
  user: string;
  resource: string;
  quantity: number;
}

export function getUsername(file: WalkEntry) {
  return path.parse(file.path).dir.split(path.sep).slice(-1)[0] as string;
}

/** Create an iterator to go through each user's consumption files */
export async function* _userConsumption(
  base: string,
): AsyncGenerator<[string, Consumption[]]> {
  const files = expandGlob(`${base}/users/*/use-*.csv`);

  for await (const file of files) {
    if (!file.isFile) continue;

    // Parse the CSV data
    const data = await parseCsv(await Deno.readTextFile(file.path), {
      columns: ["date", "resource", "quantity"],
    });

    // Process the parsed data
    const parsed = data.map((d) => ({
      timestamp: new Date(d.date as string).getTime(),
      resource: d.resource as string,
      quantity: parseInt(d.quantity as string),
    }));

    yield [getUsername(file), parsed];
  }
}

/** Create an iterator to go through each user's contribution */
export async function* _userContribution(
  base: string,
): AsyncGenerator<[string, RawContribution[]]> {
  const files = expandGlob(`${base}/users/*/contribution.csv`);

  for await (const file of files) {
    if (!file.isFile) continue;

    // Parse the CSV data
    const data = await parseCsv(await Deno.readTextFile(file.path), {
      columns: ["date", "resource", "quantity", "label"],
    });

    // Process the parsed data
    const parsed = data.map((d) => ({
      timestamp: new Date(d.date as string).getTime(),
      resource: d.resource as string,
      quantity: parseInt(d.quantity as string),
      label: d.label as string,
    }));

    yield [getUsername(file), parsed];
  }
}

/** Get the consumption for today, based on a current date */
export async function getTodaysConsumption(redis: RedisClient, after: Date) {
  try {
    const data = await redis.get(getCollectionKey("coffee-club", "today"));

    // Fail early if the data isn't loaded
    if (typeof data !== "string") throw new Error("Data not synchronised");
    const records: ConsumptionJson[] = JSON.parse(data);

    // Count the contributions
    let count = 0;
    for (const r of records.reverse()) {
      if (r.resource !== "cup") continue;
      if (r.timestamp < after.getTime()) break;
      count += r.quantity;
    }
    return count;
  } catch (error) {
    log.error("#getTodaysConsumption", error);
    throw new Error("Failed to load consumption");
  }
}

/** Map the coffee-club repository */
export function getCoffeeClubRepo(): GitRepository {
  const repo: GitRepository = {
    name: "coffee-club",
    collections: {},
  };

  // Grab usernames
  repo.collections.members = async () => {
    const members: string[] = [];
    for await (const file of Deno.readDir(`${COFFEE_CLUB_REPO_BASE}/users`)) {
      if (!file.isDirectory) continue;
      members.push(file.name);
    }
    return members;
  };

  // Grab products
  repo.collections.products = async () => {
    const file = await Deno.readTextFile(
      `${COFFEE_CLUB_REPO_BASE}/products.csv`,
    );
    return parseCsv(file, {
      columns: ["id", "resource", "quantity", "creator"],
    });
  };

  // Get the contributions for the current day,
  // it assumes the rows are sorted oldest-first.
  repo.collections.today = async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const output: ConsumptionJson[] = [];
    for await (const [user, data] of _userConsumption(COFFEE_CLUB_REPO_BASE)) {
      for (const row of data.reverse()) {
        if (Number.isNaN(row.timestamp) || Number.isNaN(row.quantity)) {
          continue;
        }
        if (row.timestamp < startOfDay.getTime()) break;

        output.push({
          timestamp: row.timestamp,
          quantity: row.quantity,
          resource: row.resource as string,
          user: user ?? "unknown",
        });
      }
    }
    output.sort((a, b) => a.timestamp - b.timestamp);
    return output;
  };

  // Get all member's contributions and store them username-keyed so a single
  // user's data can later be accessed seperately
  repo.collections.all = async () => {
    const result = new Map<string, Consumption[]>();

    // Get an existing user object or push in a new one and return that
    const upsertUser = (id: string) => {
      const user = result.get(id) ?? [];
      if (!result.has(id)) result.set(id, user);
      return user;
    };

    // Loop through each consumption and put each user into the result
    for await (
      const [id, consumption] of _userConsumption(COFFEE_CLUB_REPO_BASE)
    ) {
      upsertUser(id).push(...consumption);
    }

    // Return an object of users and their consumption to be put into Redis
    return Object.fromEntries(result.entries());
  };

  return repo;
}
