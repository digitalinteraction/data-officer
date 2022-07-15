import { expandGlob, log, parseCsv, path, RedisClient } from "../../deps.ts";
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

export async function* _userConsumption(
  base: string,
): AsyncGenerator<[string, Consumption[]]> {
  const files = expandGlob(`${base}/users/*/use-*.csv`);
  for await (const file of files) {
    if (!file.isFile) continue;

    const [user] = path.parse(file.path).dir.split(path.sep).slice(-1);

    const data = await parseCsv(await Deno.readTextFile(file.path), {
      columns: ["date", "resource", "quantity"],
    });
    const parsed = data.map((d) => ({
      timestamp: new Date(d.date as string).getTime(),
      resource: d.resource as string,
      quantity: parseInt(d.quantity as string),
    }));

    yield [user, parsed];
  }
}

export async function* _userContribution(
  base: string,
): AsyncGenerator<[string, RawContribution[]]> {
  const files = expandGlob(`${base}/users/*/contribution.csv`);
  for await (const file of files) {
    if (!file.isFile) continue;

    const [user] = path.parse(file.path).dir.split(path.sep).slice(-1);

    const data = await parseCsv(await Deno.readTextFile(file.path), {
      columns: ["date", "resource", "quantity", "label"],
    });
    const parsed = data.map((d) => ({
      timestamp: new Date(d.date as string).getTime(),
      resource: d.resource as string,
      quantity: parseInt(d.quantity as string),
      label: d.label as string,
    }));

    yield [user, parsed];
  }
}

export async function getTodaysConsumption(redis: RedisClient, after: Date) {
  try {
    const data = await redis.get(getCollectionKey("coffee-club", "today"));

    if (typeof data !== "string") throw new Error("Data not synchronised");
    const records: ConsumptionJson[] = JSON.parse(data);

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

export function getCoffeeClubRepo(): GitRepository {
  const repo: GitRepository = {
    name: "coffee-club",
    collections: {},
  };

  repo.collections.members = async () => {
    const members: string[] = [];
    for await (const file of Deno.readDir(`${COFFEE_CLUB_REPO_BASE}/users`)) {
      if (!file.isDirectory) continue;
      members.push(file.name);
    }
    return members;
  };

  repo.collections.products = async () => {
    const file = await Deno.readTextFile(
      `${COFFEE_CLUB_REPO_BASE}/products.csv`,
    );
    return parseCsv(file, {
      columns: ["id", "resource", "quantity", "creator"],
    });
  };

  // Assumes rows are sorted oldest-first
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

  repo.collections.all = async () => {
    const result = new Map<string, Consumption[]>();

    const upsertUser = (id: string) => {
      const user = result.get(id) ?? [];
      if (!result.has(id)) result.set(id, user);
      return user;
    };

    for await (
      const [id, consumption] of _userConsumption(COFFEE_CLUB_REPO_BASE)
    ) {
      upsertUser(id).push(...consumption);
    }

    return Object.fromEntries(result.entries());
  };

  return repo;
}
