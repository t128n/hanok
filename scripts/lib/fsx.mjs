import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const exists = (target) => fs.existsSync(target);

export async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

export function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export async function backupFile(src, backupDir, label) {
  if (!fs.existsSync(src)) return null;
  await ensureDir(backupDir);
  const dest = path.join(backupDir, label);
  await fsp.copyFile(src, dest);
  return dest;
}

export function linkTarget(dest) {
  try {
    const raw = fs.readlinkSync(dest);
    return path.resolve(path.dirname(dest), raw);
  } catch {
    return null;
  }
}

export function sameContent(a, b) {
  try {
    const left = fs.statSync(a);
    const right = fs.statSync(b);
    if (!left.isFile() || !right.isFile() || left.size !== right.size) return false;
    return fs.readFileSync(a).equals(fs.readFileSync(b));
  } catch {
    return false;
  }
}

/**
 * Link a file into place. Windows blocks symlinks unless Developer Mode or
 * elevation is enabled, so fall back to a copy there.
 * Returns "symlink" or "copy".
 */
export async function ensureLink(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`missing source: ${src}`);
  }

  const target = path.resolve(src);
  if (linkTarget(dest) === target) return "symlink";

  let stat = null;
  try {
    stat = await fsp.lstat(dest);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (stat?.isDirectory()) {
    throw new Error(`refusing to replace directory: ${dest}`);
  }
  if (stat) await fsp.unlink(dest);

  try {
    await fsp.symlink(target, dest);
    return "symlink";
  } catch (error) {
    const canCopy =
      process.platform === "win32" &&
      ["EPERM", "EACCES", "EINVAL", "UNKNOWN"].includes(error.code);
    if (!canCopy) throw error;
    await fsp.copyFile(target, dest);
    return "copy";
  }
}

export async function atomicWrite(dest, data) {
  const tmp = `${dest}.tmp-${process.pid}`;
  await fsp.writeFile(tmp, data, "utf8");
  await fsp.rename(tmp, dest);
}

export function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}
