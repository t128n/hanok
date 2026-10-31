# hanok

Deterministic Zen Browser configuration: a pinned arkenfox base, a daily-driver
override set, pinned Zen UI prefs, and three force-installed extensions.

Hanok lives under XDG paths:

- repo: `$XDG_CONFIG_HOME/hanok` (default `~/.config/hanok`)
- backups: `$XDG_STATE_HOME/hanok/backups`
- cache: `$XDG_CACHE_HOME/hanok`

## How it works

| Layer | Location | Survives Zen update | Enforced |
|---|---|---|---|
| `user.js` | profile root (symlink) | yes | re-applied every startup |
| `chrome/*.css` | profile `chrome/` (symlinks) | yes | at startup |
| `policies.json` | `Zen.app/Contents/Resources/distribution/` | no | at startup |

`user.js` is generated from arkenfox plus `user-overrides.js`. Do not edit
`user.js`; edit `user-overrides.js` and run `mise run update`.

Zen's own `chrome/zen-themes.css` is deliberately left untouched: Zen Mods
regenerate it.

## Setup

Requires [mise](https://mise.jdx.dev/). Bun is pinned in `mise.toml`.

```bash
cd ~/.config/hanok
mise trust
mise install
mise run update     # generate user.js from the pinned arkenfox base
mise run apply      # link profile files + install policies.json
```

Quit Zen completely (Cmd+Q) and reopen. Check:

- `about:policies` — `ExtensionSettings` with no errors
- `about:addons` — uBlock Origin, Proton Pass, Consenter, not removable
- `about:config` — `browser.startup.page = 3`,
  `privacy.clearOnShutdown_v2.cookiesAndStorage = false`,
  `extensions.enabledScopes = 15`
- `about:support` — Profile Directory contains the symlinked `user.js`

## Tasks

```bash
mise run apply       # link user.js + chrome, install policies
mise run policies    # policies only (use after a Zen update)
mise run update      # fetch pinned arkenfox, regenerate user.js
mise run verify      # validate policies, links, generated user.js
```

`apply` accepts `--dry-run` and `--profile <path>`. `verify` accepts `--online`
to check the three AMO URLs.

## What is managed

- **arkenfox v144** pinned by commit and SHA-256 in `arkenfox.lock.json`
- **daily driver**: FPP (ETP Strict), no RFP; cookies/logins kept; history and
  session/workspace restore kept; cache and form data cleared on exit
- **extensions**: uBlock Origin, Proton Pass, Consenter — `force_installed`;
  everything else blocked
- **passwords**: Firefox's built-in manager, saving, autofill and generation are
  disabled; `about:logins` is blocked; password sync is off (Proton Pass still
  works)
- **form autofill**: address and payment autofill/save prompts are disabled
- **translations**: German is never offered or auto-translated; other languages
  can still be offered
- **Zen UI**: layout, tabs, sidebar, compact mode, URL bar, theme, workspaces,
  window sync, folders, split view, glance, library, downloads, pinned tabs and
  boosts are pinned in `user-overrides.js`

To unfreeze a UI setting, delete its line from `user-overrides.js`, run
`mise run update && mise run apply`, and restart Zen.

## Updating arkenfox

The base is pinned. `mise run update` fetches that exact commit, verifies its
SHA-256, appends `user-overrides.js`, and writes `user.js`. To move to a newer
arkenfox release:

1. update `arkenfox.lock.json` (version, tag, commit, sha256, url)
2. `mise run update`
3. review the `user.js` diff
4. `mise run apply`

`mise run update -- --check` reports whether `user.js` is current without
writing anything.

## After a Zen update

Zen replaces its app bundle, which removes `policies.json`. Profile files are
safe. Run:

```bash
mise run policies
```

and restart Zen. Optionally, a LaunchAgent can run that after updates; hanok
does not install one by default.

## Backups and uninstall

Every `apply` copies replaced files to
`$XDG_STATE_HOME/hanok/backups/<timestamp>/`.

To uninstall:

```bash
# remove the symlinks from the profile
rm ~/Library/Application\ Support/zen/Profiles/*/user.js
rm ~/Library/Application\ Support/zen/Profiles/*/chrome/userChrome.css
rm ~/Library/Application\ Support/zen/Profiles/*/chrome/userContent.css

# remove policies
rm /Applications/Zen.app/Contents/Resources/distribution/policies.json
```

Restore anything you need from the backups, then restart Zen.

## Notes

- `policies.json` is an enterprise-policy file inside the app bundle. It is
  read at startup and removed by Zen updates. It can invalidate the app's code
  signature seal; this is the standard Firefox enterprise-policy mechanism and
  does not prevent Zen from launching.
- Force-installed extensions still receive AMO updates. Use
  `"updates_disabled": true` per add-on if you want frozen versions.
- The config is deterministic at startup, not frozen at runtime: prefs changed
  in `about:config` during a session are reverted on the next start because
  `user.js` is re-applied.
- Disabling the password manager does not delete existing credentials. They
  remain in `logins.db`. To purge them, quit Zen and remove that file; password
  sync is disabled, so it will not re-download them.
- `browser.translations.neverTranslateLanguages` is pinned to `de`, so other
  never-translate languages added through the UI will be reset on restart.
