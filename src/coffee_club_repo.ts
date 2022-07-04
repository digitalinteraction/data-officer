// deno-lint-ignore-file no-explicit-any

// import { path } from "../deps.ts";
import { GitRepository } from "./repos.ts";

export function getCoffeeClubRepo(): GitRepository {
  // const base = "repos/beancounter-data";

  const repo: GitRepository = {
    name: "coffee-club",
    collections: {},
  };

  repo.collections.members = async () => "ok";

  return repo;
}
