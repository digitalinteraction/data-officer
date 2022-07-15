import {
  expandGlob,
  extractFrontMatter,
  log,
  RedisClient,
} from "../../deps.ts";
import { HttpResponse } from "./http.ts";

export interface GitRepository {
  name: string;
  collections: Record<string, () => unknown>;
}

export interface MarkdownPage<T> {
  path: string;
  attrs: T;
  body: string;
}

export function redisJsonEndpoint(
  redis: RedisClient,
  repo: string,
  collection: string,
) {
  const key = getCollectionKey(repo, collection);

  return async () => {
    const data = await redis.get(key);
    return data
      ? new Response(data, { headers: { "content-type": "application/json" } })
      : HttpResponse.serviceUnavailable();
  };
}

export async function getMarkdownCollection<T = unknown>(
  pattern: string,
): Promise<MarkdownPage<T>[]> {
  const result: MarkdownPage<T>[] = [];

  const files = expandGlob(pattern, {
    includeDirs: false,
  });

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

export function getCollectionKey(repo: string, collection: string) {
  return `repos/${repo}/${collection}`;
}

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
