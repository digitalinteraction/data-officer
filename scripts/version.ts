#!/usr/bin/env -S deno run --allow-read=app.json,CHANGELOG.md --allow-write=app.json --allow-run=git

const CLI_USAGE = `
usage:
  ./scripts/version.ts <version> [options]

info:
  Bump the version of the application to generate a release. It will update
  app.json's version, commit it as 'X.Y.Z' and tag the commit as 'vX.Y.Z',
  ready to be pushed to GitHub to run the release.
  
  If the version is not present in the CHANGELOG.md, it will output a
  warning and ask you to confirm.

arguments:
  version The new semantic version to release

options:
  --help Show this help message
`;

if (Deno.args.includes("--help")) {
  console.log(CLI_USAGE);
  Deno.exit();
}

const [newVersion] = Deno.args;

if (!newVersion) throw new Error("No version specified");
if (!/^\d+\.\d+\.\d+/.test(newVersion)) throw new Error("Invalid semver");

const changelog = await Deno.readTextFile("CHANGELOG.md");
if (!changelog.includes(`## ${newVersion}`)) {
  const confirmed = confirm("Undocumented version, proceed?");
  if (!confirmed) Deno.exit(1);
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
