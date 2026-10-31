const color = process.stdout.isTTY && !process.env.NO_COLOR;
const wrap = (code, text) => (color ? `\x1b[${code}m${text}\x1b[0m` : text);

export const bold = (text) => wrap("1", text);
export const dim = (text) => wrap("2", text);
export const green = (text) => wrap("32", text);
export const yellow = (text) => wrap("33", text);
export const red = (text) => wrap("31", text);

export function step(text) {
  console.log(`\n${bold(text)}`);
}

export function info(text) {
  console.log(`  ${text}`);
}

export function ok(text) {
  console.log(`  ${green("✓")} ${text}`);
}

export function warn(text) {
  console.warn(`  ${yellow("!")} ${text}`);
}

export function fail(text) {
  console.error(`  ${red("✗")} ${text}`);
}
