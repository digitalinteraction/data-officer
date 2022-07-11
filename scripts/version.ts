#!/usr/bin/env -S deno run --allow-read=app.json,CHANGELOG.md --allow-write=app.json --allow-run=git

const [newVersion] = Deno.args;

if (!newVersion) throw new Error("No version specified");
if (!/^\d+\.\d+\.\d+/.test(newVersion)) throw new Error("Invalid semver");

const changelog = await Deno.readTextFile("CHANGELOG.md");
if (!changelog.includes(`## ${newVersion}`)) {
  if (!confirm("Undocumented version, proceed?")) {
    Deno.exit(1);
  }
}

const app = await Deno.readTextFile("app.json");
const newApp = app.replace(
  /\s{2}"version":\s"(.+)"/,
  () => `  "version": "${newVersion}"`,
);

Deno.writeTextFile("app.json", newApp);

const gitAdd = await Deno.run({
  cmd: ["git", "add", "app.json", "CHANGELOG.md"],
}).status();
if (gitAdd.code !== 0) throw new Error("Failed to stage code");

const gitCommit = await Deno.run({
  cmd: ["git", "commit", "-m", newVersion],
}).status();
if (gitCommit.code !== 0) throw new Error("Failed to commit");

const gitTag = await Deno.run({
  cmd: ["git", "tag", "v" + newVersion, "-m", "v" + newVersion],
}).status();
if (gitTag.code !== 0) throw new Error("Failed to tag");
