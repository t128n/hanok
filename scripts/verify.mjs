#!/usr/bin/env bun
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { parseArgs } from "node:util";

import {
  repoRoot,
  repoUserJs,
  repoOverrides,
  repoPolicies,
  repoChrome,
  zenPoliciesPath,
  resolveProfile,
} from "./lib/paths.mjs";
import { exists, linkTarget, sameContent } from "./lib/fsx.mjs";
import { zenRunning, zenVersion } from "./lib/zen.mjs";
import { bold, dim, step, info, ok, warn, fail } from "./lib/log.mjs";

const USAGE = `
hanok verify — check the installed config

Usage:
  bun scripts/verify.mjs [options]

Options:
  --online           also check the three AMO install URLs
  --profile <path>   Zen profile directory (default: resolve from installs.ini)
  --verbose          print resolved paths
  -h, --help         show this help
`;

const { values: args } = parseArgs({
  options: {
    online: { type: "boolean", default: false },
    profile: { type: "string" },
    verbose: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositionals: false,
});

if (args.help) {
  console.log(USAGE.trim());
  process.exit(0);
}

let problems = 0;

function check(condition, message) {
  if (condition) {
    ok(message);
  } else {
    fail(message);
    problems += 1;
  }
}

const EXPECTED = new Map([
  ["uBlock0@raymondhill.net", "ublock-origin"],
  ["78272b6fa58f4a1abaac99321d503a20@proton.me", "proton-pass"],
  ["{6fb36f3e-9bc8-4569-9c40-cc7d3db28034}", "consenter-agent"],
]);

const EXPECTED_POLICIES = new Map([
  ["PasswordManagerEnabled", false],
  ["OfferToSaveLogins", false],
  ["AutofillAddressEnabled", false],
  ["AutofillCreditCardEnabled", false],
]);

const EXPECTED_PREFS = new Map([
  ["signon.rememberSignons", "false"],
  ["signon.autofillForms", "false"],
  ["signon.generation.enabled", "false"],
  ["signon.management.page.breach-alerts.enabled", "false"],
  ["extensions.formautofill.addresses.enabled", "false"],
  ["extensions.formautofill.addresses.capture.enabled", "false"],
  ["extensions.formautofill.creditCards.enabled", "false"],
  ["services.sync.engine.passwords", "false"],
  ["services.sync.engine.addresses", "false"],
  ["services.sync.engine.creditcards", "false"],
  ["services.sync.engine.addons", "false"],
  ["services.sync.engine.prefs", "false"],
  ["browser.translations.neverTranslateLanguages", '"de"'],
]);

function lastPrefValue(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^user_pref\\("${escaped}"\\s*,\\s*([^)]+)\\);`, "gm");
  let value = null;
  for (const match of text.matchAll(pattern)) value = match[1].trim();
  return value;
}

async function checkPolicies() {
  step("policies");
  const raw = await fsp.readFile(repoPolicies, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    check(false, `policies.json is not valid JSON: ${error.message}`);
    return;
  }

  const settings = parsed?.policies?.ExtensionSettings ?? {};
  check(settings["*"]?.installation_mode === "blocked", "all unlisted extensions are blocked");

  for (const [id, slug] of EXPECTED) {
    const entry = settings[id];
    check(entry?.installation_mode === "force_installed", `${slug}: force_installed`);
    check(
      typeof entry?.install_url === "string" &&
        entry.install_url.includes(`/${slug}/latest.xpi`),
      `${slug}: AMO install URL`,
    );
  }

  check(parsed?.policies?.ExtensionUpdate === true, "extension updates are enabled");

  for (const [name, expected] of EXPECTED_POLICIES) {
    check(
      parsed?.policies?.[name] === expected,
      `${name}: ${expected ? "true" : "false"}`,
    );
  }

  check(
    parsed?.policies?.SearchEngines?.Default === "DuckDuckGo",
    "default search engine: DuckDuckGo",
  );
  check(
    parsed?.policies?.SearchEngines?.PreventInstalls === true,
    "search engine installs are blocked",
  );
}

async function checkOnline() {
  step("AMO URLs");
  const parsed = JSON.parse(await fsp.readFile(repoPolicies, "utf8"));
  const settings = parsed?.policies?.ExtensionSettings ?? {};

  for (const [id, slug] of EXPECTED) {
    const url = settings[id]?.install_url;
    if (!url) {
      check(false, `${slug}: missing install_url`);
      continue;
    }

    try {
      let response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        response = await fetch(url, {
          redirect: "follow",
          signal: AbortSignal.timeout(15000),
        });
      }
      const type = response.headers.get("content-type") ?? "";
      check(
        response.ok && (type.includes("x-xpinstall") || url.endsWith(".xpi")),
        `${slug}: HTTP ${response.status}, ${type || "no content-type"}`,
      );
    } catch (error) {
      check(false, `${slug}: ${error.message}`);
    }
  }
}

async function checkUserJs() {
  step("user.js");
  check(exists(repoUserJs), "user.js exists");
  if (!exists(repoUserJs)) {
    info("run: mise run update");
    return;
  }

  const userJs = await fsp.readFile(repoUserJs, "utf8");
  const overrides = await fsp.readFile(repoOverrides, "utf8");
  check(userJs.includes("hanok — generated user.js"), "generated header is present");
  check(userJs.includes("// ===== hanok overrides ====="), "overrides marker is present");
  check(
    userJs.trimEnd().endsWith(overrides.trimEnd()),
    "user-overrides.js is appended unchanged",
  );

  for (const [name, expected] of EXPECTED_PREFS) {
    check(
      lastPrefValue(userJs, name) === expected,
      `${name} = ${expected}`,
    );
  }
}

async function checkProfile() {
  step("profile");
  let profile;
  try {
    profile = resolveProfile(args.profile);
  } catch (error) {
    check(false, error.message);
    return;
  }

  info(profile);
  check(exists(path.join(profile, "prefs.js")), "prefs.js exists");

  const expectedLinks = [
    ["user.js", repoUserJs],
    ["chrome/userChrome.css", path.join(repoChrome, "userChrome.css")],
    ["chrome/userContent.css", path.join(repoChrome, "userContent.css")],
  ];

  for (const [relative, source] of expectedLinks) {
    const dest = path.join(profile, relative);
    if (linkTarget(dest) === path.resolve(source)) {
      ok(`${relative} is linked to hanok`);
    } else if (sameContent(dest, source)) {
      ok(`${relative} matches hanok (copy)`);
    } else {
      check(false, `${relative} does not match hanok`);
    }
  }

  let installed = null;
  try {
    installed = await fsp.readFile(zenPoliciesPath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const repo = await fsp.readFile(repoPolicies, "utf8");
  check(installed?.trim() === repo.trim(), "installed policies.json matches hanok");

  if (exists(path.join(profile, "chrome", "zen-themes.css"))) {
    info("chrome/zen-themes.css left untouched (managed by Zen Mods)");
  }
}

function checkEnvironment() {
  step("environment");
  info(dim(`repo: ${repoRoot}`));
  info(dim(`platform: ${process.platform}`));

  const version = zenVersion();
  if (version) {
    ok(`Zen version: ${version}`);
  } else if (process.platform === "darwin" || process.platform === "win32") {
    check(false, "Zen version: unknown");
  } else {
    info("Zen version: unknown");
  }

  if (zenRunning()) {
    warn("Zen is running; user.js and policies take effect after a full restart");
  }
}

async function main() {
  step(bold("hanok verify"));
  checkEnvironment();
  await checkPolicies();
  await checkUserJs();
  await checkProfile();
  if (args.online) await checkOnline();

  step(problems === 0 ? bold("all checks passed") : bold(`${problems} problem(s)`));
  if (problems > 0) process.exit(1);
}

try {
  await main();
} catch (error) {
  fail(error.message);
  process.exit(1);
}
