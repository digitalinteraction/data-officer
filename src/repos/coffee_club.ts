import { expandGlob, parseCsv, path } from "../../deps.ts";
import { GitRepository } from "../lib/mod.ts";

export const COFFEE_CLUB_REPO_BASE = "repos/coffee-club";

export interface ConsumptionJson {
  date: string;
  user: string;
  resource: string;
  quantity: number;
}

export async function getLatestConsumption(since: Date) {
  const files = expandGlob(`${COFFEE_CLUB_REPO_BASE}/users/*/use-*.csv`);
  let count = 0;
  for await (const file of files) {
    if (!file.isFile) continue;
    const data = await parseCsv(await Deno.readTextFile(file.path), {
      columns: ["date", "resource", "quantity"],
    });

    for (const row of data.reverse()) {
      const date = new Date(row.date as string);
      const amount = parseInt(row.quantity as string);
      if (
        Number.isNaN(date.getTime()) || row.resource !== "cup" ||
        Number.isNaN(amount)
      ) {
        continue;
      }
      if (date.getTime() < since.getTime()) break;

      count += amount;
    }
  }
  return count;
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

    const files = expandGlob(`${COFFEE_CLUB_REPO_BASE}/users/*/use-*.csv`);
    const output: ConsumptionJson[] = [];
    for await (const file of files) {
      if (!file.isFile) continue;

      const [user] = path.parse(file.path).dir.split(path.sep).slice(-1);

      const data = await parseCsv(await Deno.readTextFile(file.path), {
        columns: ["date", "resource", "quantity"],
      });

      for (const row of data.reverse()) {
        const date = new Date(row.date as string);
        const quantity = parseInt(row.quantity as string);

        if (Number.isNaN(date.getTime()) || Number.isNaN(quantity)) {
          continue;
        }
        if (date.getTime() < startOfDay.getTime()) break;

        output.push({
          date: row.date as string,
          quantity,
          resource: row.resource as string,
          user: user ?? "unknown",
        });
      }
    }
    output.sort((a, b) => a.date.localeCompare(b.date));
    return output;
  };

  return repo;
}
