import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { zenRoot } from "./paths.mjs";

export function zenRunning() {
  if (process.platform === "darwin") {
    return (
      spawnSync("pgrep", ["-f", "Zen.app/Contents/MacOS/zen"], {
        stdio: "ignore",
      }).status === 0
    );
  }

  if (process.platform === "win32") {
    const result = spawnSync(
      "tasklist",
      ["/FI", "IMAGENAME eq zen.exe", "/NH"],
      { encoding: "utf8" },
    );
    return result.status === 0 && /zen\.exe/i.test(result.stdout || "");
  }

  return spawnSync("pgrep", ["-x", "zen"], { stdio: "ignore" }).status === 0;
}

export function zenVersion() {
  if (process.platform === "darwin") {
    const result = spawnSync(
      "defaults",
      [
        "read",
        path.join(zenRoot, "Contents", "Info.plist"),
        "CFBundleShortVersionString",
      ],
      { encoding: "utf8" },
    );
    return result.status === 0 ? result.stdout.trim() || null : null;
  }

  try {
    const applicationIni = fs.readFileSync(
      path.join(zenRoot, "application.ini"),
      "utf8",
    );
    const match = applicationIni.match(/^Version=(.+)$/m);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}
