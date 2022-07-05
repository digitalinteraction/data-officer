import { parseCsv } from "../../deps.ts";
import { GitRepository } from "../lib/mod.ts";

export function getCoffeeClubRepo(): GitRepository {
  const base = "repos/coffee-club";

  const repo: GitRepository = {
    name: "coffee-club",
    collections: {},
  };

  repo.collections.members = async () => {
    const members: string[] = [];
    for await (const file of Deno.readDir(`${base}/users`)) {
      if (!file.isDirectory) continue;
      members.push(file.name);
    }
    return members;
  };

  repo.collections.products = async () => {
    const file = await Deno.readTextFile(`${base}/products.csv`);
    return parseCsv(file, {
      columns: ["id", "resource", "quantity", "creator"],
    });
  };

  return repo;
}
