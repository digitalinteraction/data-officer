import { log } from "../deps.ts";
import { getEnv } from "./lib/mod.ts";

export const GITHUB_API_URL = "https://api.github.com";

const repoBlockList = new Set([
  "digitalinteraction/beancounter-data",
]);

/** Bare GitHub repo */
export interface Repo {
  name: string;
  full_name: string;
  pushed_at: string;
}

/** The sum of code changes */
export interface CodeChanges {
  total: number;
  additions: number;
  deletions: number;
}

/** Bare GitHub commit */
export interface Commit {
  sha: string;
  commit: {
    message: string;
  };
}

/** Bare detailed commit */
interface CommitDetails {
  stats: CodeChanges;
}

/**
 * Parse a HTTP link header, returns a map of "rel"ation to URL.
 * https://datatracker.ietf.org/doc/html/rfc8288#section-3.5
 */
export function _parseLinkHeader(header: string): Map<string, string> {
  return new Map(
    header.split(/\s*,\s/)
      .filter((p) => p?.trim())
      .map((stmt) => {
        const url = /<(.*?)>/.exec(stmt);
        const rel = /rel="(.*?)"/.exec(stmt);
        if (!url || !rel) return undefined;
        return [rel[1], url[1]] as [string, string];
      })
      .filter((p) => p) as [string, string][],
  );
}

/** Iterate a GitHub request with pagination, yielding each response */
export async function* _iterate<T = unknown>(
  startUrl: string | URL,
  request: RequestInit = {},
) {
  let url: string | undefined = startUrl.toString();
  do {
    log.debug(`iterate ${url}`);

    const res: Response = await fetch(url, request);

    if (!res.ok) throw new Error("Request faild: " + res.statusText);
    const data = await res.json();

    if (Array.isArray(data)) {
      for (const item of data) yield item as T;
    } else {
      yield data as T;
    }

    const linkHeader = res.headers.get("link");
    url = linkHeader ? _parseLinkHeader(linkHeader).get("next") : undefined;
  } while (url);
}

export type RecentStats = CodeChanges & {
  repos: Map<string, CodeChanges>;
};

/** Get recent commits to the `digitalinteraction` GitHub organisation */
export async function getRecentCommits(
  owner: string,
  since: Date,
): Promise<RecentStats> {
  const { GITHUB_TOKEN } = getEnv("GITHUB_TOKEN");

  const request = {
    headers: { authorization: `bearer ${GITHUB_TOKEN}` },
  };

  // A URL to fetch the recently pushed-to repos
  const repos = new URL(`orgs/${owner}/repos`, GITHUB_API_URL);
  repos.searchParams.set("sort", "pushed");
  repos.searchParams.set("type", "all");
  repos.searchParams.set("direction", "desc");

  const todaysRepos: Repo[] = [];

  // Get the repos that were pushed to today
  for await (const repo of _iterate<Repo>(repos, request)) {
    log.debug(`repo ${repo.full_name}`);

    const pushed = new Date(repo.pushed_at);
    if (pushed.getTime() < since.getTime()) break;
    if (repoBlockList.has(repo.full_name)) continue;
    todaysRepos.push(repo);
  }

  const sum: CodeChanges = { total: 0, additions: 0, deletions: 0 };
  const repoStats = new Map<string, CodeChanges>();

  // Go through each recent repo and find the commits that were pushed to them
  for (const repo of todaysRepos) {
    const commits = new URL(
      `/repos/${owner}/${repo.name}/commits`,
      GITHUB_API_URL,
    );
    commits.searchParams.set("since", since.toISOString());

    const stats: CodeChanges = { total: 0, additions: 0, deletions: 0 };

    // Loop through the commits that happened since the start of the day
    for await (const commit of _iterate<Commit>(commits, request)) {
      log.debug(
        `commit ${repo.full_name} "${commit.commit.message.split("\n")[0]}"`,
      );

      const detailsUrl = new URL(
        `/repos/${owner}/${repo.name}/commits/${commit.sha}`,
        GITHUB_API_URL,
      );

      const details: CommitDetails = await fetch(detailsUrl.toString(), {
        headers: { authorization: `bearer ${GITHUB_TOKEN}` },
      }).then((r) => r.json());

      stats.total += details.stats.total;
      stats.additions += details.stats.additions;
      stats.deletions += details.stats.deletions;
    }

    repoStats.set(repo.full_name, stats);

    sum.total += stats.total;
    sum.additions += stats.additions;
    sum.deletions += stats.deletions;
  }

  return { ...sum, repos: repoStats };
}
