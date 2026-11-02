import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { parseIni } from "./ini.mjs";

const home = os.homedir();
const isWindows = process.platform === "win32";
const isMac = process.platform === "darwin";

const roamingAppData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
const localAppData = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");

export const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

export const configHome =
  process.env.XDG_CONFIG_HOME ||
  (isWindows ? roamingAppData : path.join(home, ".config"));
export const stateHome =
  process.env.XDG_STATE_HOME ||
  (isWindows ? localAppData : path.join(home, ".local", "state"));
export const cacheHome =
  process.env.XDG_CACHE_HOME ||
  (isWindows ? path.join(localAppData, "Cache") : path.join(home, ".cache"));

function defaultZenRoot() {
  if (isMac) return "/Applications/Zen.app";

  if (isWindows) {
    const programFiles =
      process.env.ProgramFiles || process.env.PROGRAMFILES || "C:\\Program Files";
    const programFilesX86 =
      process.env["ProgramFiles(x86)"] ||
      process.env["PROGRAMFILES(X86)"] ||
      "C:\\Program Files (x86)";

    const candidates = [
      path.join(programFiles, "Zen Browser"),
      path.join(programFilesX86, "Zen Browser"),
      path.join(localAppData, "Programs", "Zen Browser"),
      path.join(localAppData, "Programs", "zen-browser"),
      path.join(localAppData, "Zen Browser"),
    ];

    return (
      candidates.find((candidate) => fs.existsSync(path.join(candidate, "zen.exe"))) ||
      candidates[0]
    );
  }

  return path.join(home, ".zen");
}

export const zenRoot = process.env.ZEN_APP || defaultZenRoot();
export const zenDataDir = isWindows
  ? path.join(roamingAppData, "zen")
  : isMac
    ? path.join(home, "Library", "Application Support", "zen")
    : path.join(home, ".zen");
export const zenResourcesDir = isMac
  ? path.join(zenRoot, "Contents", "Resources")
  : zenRoot;
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
