#!/usr/bin/env -S deno run --allow-read=app.json,CHANGELOG.md --allow-write=app.json

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
