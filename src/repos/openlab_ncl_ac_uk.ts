// deno-lint-ignore-file no-explicit-any

import { path } from "../../deps.ts";
import { getMarkdownCollection, GitRepository } from "../lib/mod.ts";

export function _resolveImage(url: string, size: string) {
  const ext = path.extname(url);
  return (
    "https://openlab.ncl.ac.uk" +
    url.replace(ext, "-" + size + ext).replace("/uploads/", "/assets/")
  );
}

export function getOpenlabRepo(): GitRepository {
  const base = "repos/openlab.ncl.ac.uk/content";

  const repo: GitRepository = {
    name: "openlab.ncl.ac.uk",
    collections: {},
  };

  repo.collections.people = async () => {
    const people = await getMarkdownCollection<any>(`${base}/people/*.md`);

    return people
      .filter((p) => p.attrs.draft !== true)
      .map((person) => ({
        slug: `content/people/${path.basename(person.path)}`,
        body: person.body,
        attrs: {
          title: person.attrs.title,
          email: person.attrs.email,
          headshot: _resolveImage(person.attrs.headshot, "small"),
          role: person.attrs.role,
          joinedYear: person.attrs.joinedYear,
          leftYear: person.attrs.leftYear,
          links: person.attrs.links ?? {},
          social: person.attrs.social ?? {},
        },
      }));
  };

  repo.collections.projects = async () => {
    const projects = await getMarkdownCollection<any>(`${base}/projects/*.md`);

    return projects
      .filter((p) => p.attrs.draft !== true)
      .map((project) => ({
        slug: `content/projects/${path.basename(project.path)}`,
        body: project.body,
        attrs: {
          title: project.attrs.title,
          coverImage: _resolveImage(project.attrs.coverImage, "small"),
          people: project.attrs.people,
          publicationDois: project.attrs.publicationDois,
          topics: project.attrs.topics,
          breakdown: project.attrs.breakdown ?? {},
          collaborators: project.attrs.collaborators ?? {},
          social: project.attrs.social ?? {},
        },
      }));
  };

  repo.collections.posts = async () => {
    const posts = await getMarkdownCollection<any>(`${base}/posts/*.md`);

    return posts
      .filter((p) => p.attrs.draft !== true)
      .map((post) => ({
        slug: `content/posts/${path.basename(post.path)}`,
        body: post.body,
        attrs: {
          title: post.attrs.title,
          coverImage: _resolveImage(post.attrs.coverImage, "large"),
          date: post.attrs.date,
          topics: post.attrs.topics,
          summary: post.attrs.summary,
          intro: post.attrs.intro,
          social: post.attrs.social ?? {},
        },
      }));
  };

  repo.collections.roles = async () => {
    const roles = await getMarkdownCollection<any>(`${base}/roles/*.md`);

    return roles
      .filter((r) => r.attrs.draft !== true)
      .map((role) => ({
        slug: `content/roles/${path.basename(role.path)}`,
        body: role.body,
        attrs: {
          title: role.attrs.title,
          subroleOrder: role.attrs.subroleOrder,
          social: role.attrs.social ?? {},
        },
      }));
  };

  repo.collections.topics = async () => {
    const topics = await getMarkdownCollection<any>(`${base}/topics/*.md`);

    return topics
      .filter((t) => t.attrs.draft !== true)
      .map((topic) => ({
        slug: `content/topics/${path.basename(topic.path)}`,
        body: topic.body,
        attrs: {
          title: topic.attrs.title,
          colourName: topic.attrs.colourName,
          social: topic.attrs.social ?? {},
        },
      }));
  };

  repo.collections.publications = async () => {
    return JSON.parse(
      await Deno.readTextFile(`${base}/_data/publications.json`)
    );
  };

  return repo;
}
