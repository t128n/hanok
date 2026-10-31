/**
 * Minimal INI parser for Zen's installs.ini / profiles.ini.
 * Returns { [section]: { [key]: value } }.
 */
export function parseIni(text) {
  const result = {};
  let current = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";") || line.startsWith("#")) continue;

    const section = line.match(/^\[(.+)]$/);
    if (section) {
      current = result[section[1]] ??= {};
      continue;
    }

    if (!current) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    current[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }

  return result;
}
