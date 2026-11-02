#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${HANOK_REPO_URL:-https://github.com/t128n/hanok.git}"
REPO_DIR="${HANOK_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/hanok}"
MISE_BIN="${MISE_BIN:-}"

say() { printf '==> %s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

command -v git >/dev/null 2>&1 || die "git is required; install it and rerun"

if [ -d "$REPO_DIR/.git" ]; then
  say "Using existing checkout at $REPO_DIR"
elif [ -e "$REPO_DIR" ]; then
  if [ -d "$REPO_DIR" ] && [ -z "$(ls -A "$REPO_DIR")" ]; then
    say "Cloning hanok into $REPO_DIR"
    mkdir -p "$(dirname "$REPO_DIR")"
    git clone --depth 1 "$REPO_URL" "$REPO_DIR"
  else
    die "$REPO_DIR exists and is not a hanok checkout; set HANOK_DIR to another path"
  fi
else
  say "Cloning hanok into $REPO_DIR"
  mkdir -p "$(dirname "$REPO_DIR")"
  git clone --depth 1 "$REPO_URL" "$REPO_DIR"
fi

if [ -z "$MISE_BIN" ]; then
  if command -v mise >/dev/null 2>&1; then
    MISE_BIN="$(command -v mise)"
  elif [ -x "$HOME/.local/bin/mise" ]; then
    MISE_BIN="$HOME/.local/bin/mise"
  fi
fi

if [ -z "$MISE_BIN" ]; then
  say "Installing mise"
  curl -fsSL https://mise.run | sh
  MISE_BIN="$HOME/.local/bin/mise"
fi

[ -x "$MISE_BIN" ] || die "mise not found at $MISE_BIN"
export PATH="$(dirname "$MISE_BIN"):$PATH"

cd "$REPO_DIR"
say "Installing pinned tools"
"$MISE_BIN" trust
"$MISE_BIN" install

say "Generating user.js"
"$MISE_BIN" run update

say "Applying hanok to Zen"
"$MISE_BIN" run apply

say "Done. Quit Zen completely and reopen it."
