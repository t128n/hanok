import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { parseIni } from "./ini.mjs";

export const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

export const configHome = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
export const stateHome = process.env.XDG_STATE_HOME || path.join(os.homedir(), ".local", "state");
export const cacheHome = process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache");

export const zenRoot = process.env.ZEN_APP || "/Applications/Zen.app";
export const zenDataDir = path.join(os.homedir(), "Library", "Application Support", "zen");
export const zenResourcesDir = path.join(zenRoot, "Contents", "Resources");
export const zenPoliciesDir = path.join(zenResourcesDir, "distribution");
export const zenPoliciesPath = path.join(zenPoliciesDir, "policies.json");

export const backupRoot = path.join(stateHome, "hanok", "backups");
export const cacheDir = path.join(cacheHome, "hanok");

export const repoUserJs = path.join(repoRoot, "user.js");
export const repoOverrides = path.join(repoRoot, "user-overrides.js");
export const repoPolicies = path.join(repoRoot, "policies.json");
export const repoChrome = path.join(repoRoot, "chrome");
export const lockPath = path.join(repoRoot, "arkenfox.lock.json");

function hasPrefs(dir) {
  return fs.existsSync(path.join(dir, "prefs.js"));
}

/**
 * Resolve the Zen profile directory.
 * Priority: explicit argument, ZEN_PROFILE, installs.ini, profiles.ini, newest profile.
 */
export function resolveProfile(explicit) {
  if (explicit) return path.resolve(explicit);
  if (process.env.ZEN_PROFILE) return path.resolve(process.env.ZEN_PROFILE);

  const installsPath = path.join(zenDataDir, "installs.ini");
  if (fs.existsSync(installsPath)) {
    const installs = parseIni(fs.readFileSync(installsPath, "utf8"));
    for (const section of Object.values(installs)) {
      if (!section.Default) continue;
      const candidate = path.resolve(zenDataDir, section.Default);
      if (hasPrefs(candidate)) return candidate;
    }
  }

  const profilesPath = path.join(zenDataDir, "profiles.ini");
  if (fs.existsSync(profilesPath)) {
    const profiles = parseIni(fs.readFileSync(profilesPath, "utf8"));
    for (const [name, section] of Object.entries(profiles)) {
      if (!name.startsWith("Profile") || !section.Path) continue;
      const candidate =
        section.IsRelative === "1"
          ? path.join(zenDataDir, section.Path)
          : path.resolve(section.Path);
      if (hasPrefs(candidate)) return candidate;
    }
  }

  const profilesDir = path.join(zenDataDir, "Profiles");
  if (fs.existsSync(profilesDir)) {
    const candidates = fs
      .readdirSync(profilesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(profilesDir, entry.name))
      .filter(hasPrefs)
      .sort((a, b) => {
        const am = fs.statSync(path.join(a, "prefs.js")).mtimeMs;
        const bm = fs.statSync(path.join(b, "prefs.js")).mtimeMs;
        return bm - am;
      });
    if (candidates.length > 0) return candidates[0];
  }

  throw new Error(
    `could not resolve a Zen profile under ${zenDataDir}; set ZEN_PROFILE or pass --profile`,
  );
}
