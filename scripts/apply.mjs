#!/usr/bin/env bun
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { parseArgs } from "node:util";

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
  ensureLink,
  linkTarget,
  sameContent,
  exists,
  timestamp,
} from "./lib/fsx.mjs";
import { zenRunning } from "./lib/zen.mjs";
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

  const linked = linkTarget(dest);
  if (linked === target) {
    ok(`${label} already linked`);
    return;
  }
  if (!linked && sameContent(dest, target)) {
    ok(`${label} already copied`);
    return;
  }
  if (linked || exists(dest)) await backup(dest, label);
  if (dryRun) {
    info(`would install ${dest} -> ${target}`);
    return;
  }

  const mode = await ensureLink(src, dest);
  ok(mode === "symlink" ? `${label} linked` : `${label} copied (symlink unavailable)`);
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
    const hint =
      process.platform === "win32"
        ? "set ZEN_APP to the Zen install directory"
        : "set ZEN_APP if needed";
    throw new Error(`Zen not found at ${zenRoot}; ${hint}`);
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

  try {
    await ensureDir(zenPoliciesDir);
    const tmp = `${zenPoliciesPath}.tmp-${process.pid}`;
    await fsp.writeFile(tmp, raw, "utf8");
    await fsp.rename(tmp, zenPoliciesPath);
    if (process.platform !== "win32") await fsp.chmod(zenPoliciesPath, 0o644);
  } catch (error) {
    if (
      process.platform === "win32" &&
      ["EACCES", "EPERM", "EROFS"].includes(error.code)
    ) {
      throw new Error(
        `cannot write ${zenPoliciesPath} (${error.code}); run elevated or set ZEN_APP to a writable install`,
      );
    }
    throw error;
  }
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
  if (zenRunning()) {
    const quit =
      process.platform === "darwin"
        ? "Quit completely (Cmd+Q)"
        : "Quit Zen completely";
    warn(`${quit}, then reopen.`);
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
