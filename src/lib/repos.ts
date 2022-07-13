import { expandGlob, extractFrontMatter, RedisClient } from "../../deps.ts";

export interface GitRepository {
  name: string;
  collections: Record<string, () => unknown>;
}

export interface MarkdownPage<T> {
  path: string;
  attrs: T;
  body: string;
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
  verbose: boolean,
): Promise<boolean> {
  const log = (...args: unknown[]) =>
    verbose ? console.log(...args) : undefined;

  try {
    // https://deno.land/manual/examples/subprocess
    const process = Deno.run({
      cmd: ["scripts/clone_repos.sh"],
      stdout: verbose ? "inherit" : "null",
      stderr: verbose ? "inherit" : "null",
    });

    log("Running scripts/clone.sh\n");
    const status = await process.status();
    if (!status.success) {
      throw new Error("Failed to run scripts/clone_repos.sh");
    }

    const results = new Map<string, unknown>();

    log("\nRunning collections");
    for (const repo of repos) {
      for (const [id, collection] of Object.entries(repo.collections)) {
        log(`  ${repo.name} ${id}`);
        results.set(getCollectionKey(repo.name, id), await collection());
      }
    }

    log("\nWriting data");
    for (const [key, data] of results) {
      log(`  ${key}`);
      await redis.set(key, JSON.stringify(data));
    }

    log("\nDone");

    return true;
  } catch (error) {
    console.error("Failed to sync repos");
    console.error(error);
    return false;
  }
}
