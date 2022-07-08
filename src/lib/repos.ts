import { expandGlob, extractFrontMatter } from "../../deps.ts";

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
