#!/usr/bin/env bun
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { parseArgs } from "node:util";
import { spawnSync } from "node:child_process";

import {
  repoRoot,
  repoUserJs,
  repoChrome,
  repoPolicies,
  zenRoot,
  zenPoliciesDir,
  zenPoliciesPath,
  backupRoot,
  resolveProfile,
} from "./lib/paths.mjs";
import {
  backupFile,
  ensureDir,
  ensureSymlink,
  linkTarget,
  exists,
  timestamp,
} from "./lib/fsx.mjs";
import { bold, dim, step, info, ok, warn, fail } from "./lib/log.mjs";

const USAGE = `
hanok apply — install the hanok config into Zen

Usage:
  bun scripts/apply.mjs [options]

Options:
  --profile <path>   Zen profile directory (default: resolve from installs.ini)
  --policies-only    only install policies.json (use after a Zen update)
  --dry-run          print what would change
  -h, --help         show this help
`;

const { values: args } = parseArgs({
  options: {
    profile: { type: "string" },
    "policies-only": { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositionals: false,
});

if (args.help) {
  console.log(USAGE.trim());
  process.exit(0);
}

const dryRun = args["dry-run"];
const policiesOnly = args["policies-only"];

let backupDir = null;
const backups = [];

async function backup(dest, label) {
  if (!exists(dest) && !linkTarget(dest)) return;
  if (!backupDir) backupDir = path.join(backupRoot, timestamp());
  if (dryRun) {
    info(`would back up ${dest}`);
    return;
  }
  const saved = await backupFile(dest, backupDir, label);
  if (saved) backups.push(saved);
}

async function link(src, dest, label) {
  const target = path.resolve(src);
  if (!exists(src)) throw new Error(`missing source: ${src}`);
  if (linkTarget(dest) === target) {
    ok(`${label} already linked`);
    return;
  }
  if (linkTarget(dest) || exists(dest)) await backup(dest, label);
  if (dryRun) {
    info(`would link ${dest} -> ${target}`);
    return;
  }
  await ensureSymlink(src, dest);
  ok(`${label} linked`);
}

async function applyProfile(profile) {
  step("profile");
  info(profile);
  if (!exists(path.join(profile, "prefs.js"))) {
    throw new Error(`not a Zen profile (no prefs.js): ${profile}`);
  }

  if (!dryRun) await ensureDir(path.join(profile, "chrome"));
  await link(repoUserJs, path.join(profile, "user.js"), "user.js");
  await link(
    path.join(repoChrome, "userChrome.css"),
    path.join(profile, "chrome", "userChrome.css"),
    "userChrome.css",
  );
  await link(
    path.join(repoChrome, "userContent.css"),
    path.join(profile, "chrome", "userContent.css"),
    "userContent.css",
  );
}

async function applyPolicies() {
  step("policies");
  const raw = await fsp.readFile(repoPolicies, "utf8");
  const parsed = JSON.parse(raw);
  const settings = parsed?.policies?.ExtensionSettings ?? {};
  const managed = Object.keys(settings).filter((id) => id !== "*");
  info(`${managed.length} force-installed extensions`);

  if (!exists(zenRoot)) {
    throw new Error(`Zen.app not found at ${zenRoot}; set ZEN_APP if needed`);
  }

  let installed = null;
  try {
    installed = await fsp.readFile(zenPoliciesPath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  if (installed === raw) {
    ok("policies.json already current");
    return;
  }

  if (installed !== null) await backup(zenPoliciesPath, "policies.json");
  if (dryRun) {
    info(`would install ${zenPoliciesPath}`);
    return;
  }

  await ensureDir(zenPoliciesDir);
  const tmp = `${zenPoliciesPath}.tmp-${process.pid}`;
  await fsp.writeFile(tmp, raw, "utf8");
  await fsp.rename(tmp, zenPoliciesPath);
  await fsp.chmod(zenPoliciesPath, 0o644);
  ok(`installed ${zenPoliciesPath}`);
}

async function main() {
  step(bold("hanok apply"));
  info(dim(`repo: ${repoRoot}`));

  if (!policiesOnly) {
    const profile = resolveProfile(args.profile);
    await applyProfile(profile);
  }

  await applyPolicies();

  if (backups.length > 0) {
    step("backup");
    for (const file of backups) info(file);
  }

  step("next");
  if (process.platform === "darwin") {
    const running =
      spawnSync("pgrep", ["-f", "Zen.app/Contents/MacOS/zen"], { stdio: "ignore" }).status === 0;
    if (running) {
      warn("Zen is running. Quit completely (Cmd+Q), then reopen.");
    }
  }
  info("Check about:policies and about:addons after restarting Zen.");
  if (dryRun) info(dim("dry run only — nothing was changed"));
}

try {
  await main();
} catch (error) {
  fail(error.message);
  process.exit(1);
}
