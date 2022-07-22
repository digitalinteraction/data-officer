import {
  expandGlob,
  extractFrontMatter,
  log,
  RedisClient,
} from "../../deps.ts";
import { HttpResponse } from "./http.ts";

/** A git repository definition */
export interface GitRepository {
  /** The internal name of the repository, must be unique */
  name: string;

  /** Collections are functions that fetch data from a local clone of the repo in question */
  collections: Record<string, () => unknown>;
}

/** A page of markdown with the frontmatter parsed out */
export interface MarkdownPage<T> {
  path: string;
  attrs: T;
  body: string;
}

/** A helper to create a http route that fetches some JSON from a key in Redis. */
export function redisJsonRoute(
  redis: RedisClient,
  repo: string,
  collection: string,
) {
  // Pre-compute the key to collect from
  const key = getCollectionKey(repo, collection);

  // Return a function that fetches and parses JSON from that key,
  // that in turn returns a `Response` with the json data or an error.
  // It assumes JSON is stores and bypasses the parsing part to make it quicker.
  return async () => {
    const data = await redis.get(key);
    return data
      ? new Response(data, { headers: { "content-type": "application/json" } })
      : HttpResponse.serviceUnavailable();
  };
}

/** Load markdown files and their frontmatter that match a glob pattern */
export async function getMarkdownCollection<T = unknown>(
  pattern: string,
): Promise<MarkdownPage<T>[]> {
  const result: MarkdownPage<T>[] = [];

  // Create an iterator to exapand the glob and loop through matches
  const files = expandGlob(pattern, { includeDirs: false });

  // Load each file and parse the frontmatter
  for await (const file of files) {
    const contents = await Deno.readTextFile(file.path);

    const { attrs, body } = extractFrontMatter<T>(contents);

    result.push({
      path: file.path,
      attrs: attrs,
      body: body,
    });
  }

  return result;
}

/** Get the key to store a repo's collection */
export function getCollectionKey(repo: string, collection: string) {
  return `repos/${repo}/${collection}`;
}

/**
 * Run the `sync_repos.sh` script, then run all collections and cache results
 * in Redis
 */
export async function syncRepos(
  redis: RedisClient,
  repos: GitRepository[],
): Promise<boolean> {
  try {
    // https://deno.land/manual/examples/subprocess
    const process = Deno.run({
      cmd: ["scripts/clone_repos.sh"],
    });

    log.info("Running scripts/clone.sh");
    const status = await process.status();
    if (!status.success) {
      throw new Error("Failed to run scripts/clone_repos.sh");
    }

    const results = new Map<string, unknown>();

    log.info("Running collections");
    for (const repo of repos) {
      for (const [id, collection] of Object.entries(repo.collections)) {
        log.info(`  ${repo.name} ${id}`);
        results.set(getCollectionKey(repo.name, id), await collection());
      }
    }

    log.info("Writing data");
    for (const [key, data] of results) {
      log.info(`  ${key}`);
      await redis.set(key, JSON.stringify(data));
    }

    log.info("Done");

    return true;
  } catch (error) {
    console.error("Failed to sync repos");
    console.error(error);
    return false;
  }
}
