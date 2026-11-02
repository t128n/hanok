# hanok

Deterministic Zen Browser configuration: a pinned arkenfox base, a daily-driver
override set, pinned Zen UI prefs, and three force-installed extensions. Runs on
macOS and Windows.

## Quick start

macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/t128n/hanok/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/t128n/hanok/main/install.ps1 | iex
```

The scripts clone hanok into the default repo path, install mise if it is
missing, then run `update` and `apply`. On Windows, use an elevated PowerShell if
Zen is installed under `Program Files`. Set `HANOK_DIR` to clone somewhere else,
or `HANOK_REPO_URL` to use a different remote.

Hanok uses platform-native paths:

| | macOS | Windows |
|---|---|---|
| repo | `~/.config/hanok` | `%APPDATA%\hanok` |
| backups | `$XDG_STATE_HOME/hanok/backups` (default `~/.local/state/hanok/backups`) | `%LOCALAPPDATA%\hanok\backups` |
| cache | `$XDG_CACHE_HOME/hanok` (default `~/.cache/hanok`) | `%LOCALAPPDATA%\Cache\hanok` |
| Zen profile data | `~/Library/Application Support/zen` | `%APPDATA%\zen` |
| Zen install | `/Applications/Zen.app` | `%ProgramFiles%\Zen Browser` |

The repo can live anywhere; the table shows the default location. Hanok
auto-detects Zen under `Program Files`, `Program Files (x86)` and per-user
installs under `%LOCALAPPDATA%\Programs`. Set `ZEN_APP` to override the install
directory on either platform.

## How it works

| Layer | Location | Survives Zen update | Enforced |
|---|---|---|---|
| `user.js` | profile root (symlink, or copy on Windows) | yes | re-applied every startup |
| `chrome/*.css` | profile `chrome/` (symlinks, or copies on Windows) | yes | at startup |
| `policies.json` | macOS: `Zen.app/Contents/Resources/distribution/`; Windows: `<install>\distribution\` | no | at startup |

`user.js` is generated from arkenfox plus `user-overrides.js`. Do not edit
`user.js`; edit `user-overrides.js` and run `mise run update`.

Zen's own `chrome/zen-themes.css` is deliberately left untouched: Zen Mods
regenerate it.

## Manual setup

Requires [mise](https://mise.jdx.dev/). Bun is pinned in `mise.toml`.

macOS:

```bash
cd ~/.config/hanok
mise trust
mise install
mise run update     # generate user.js from the pinned arkenfox base
mise run apply      # link profile files + install policies.json
```

Windows (PowerShell):

```powershell
cd $env:APPDATA\hanok
mise trust
mise install
mise run update
mise run apply
```

If hanok is cloned elsewhere, `cd` there instead. On Windows, writing
`policies.json` into a `Program Files` install needs an elevated terminal. For a
per-user install, no elevation is needed:

```powershell
$env:ZEN_APP = "$env:LOCALAPPDATA\Programs\Zen Browser"
mise run apply
```

`apply` creates symlinks in the profile when the OS allows it. On Windows
without Developer Mode, symlink creation is denied, so hanok copies the files
instead and reports `copied`. In that mode, run `mise run apply` again after
editing `user.js`, `user-overrides.js` or the CSS files.

If profile auto-detection fails, pass `--profile <path>` or set `ZEN_PROFILE`.

Quit Zen completely (Cmd+Q on macOS; exit from the tray on Windows) and reopen.
Check:

- `about:policies` — `ExtensionSettings` with no errors
- `about:addons` — uBlock Origin, Proton Pass, Consenter, not removable
- `about:config` — `browser.startup.page = 3`,
  `privacy.clearOnShutdown_v2.cookiesAndStorage = false`,
  `extensions.enabledScopes = 15`
- `about:support` — Profile Directory contains hanok's `user.js`

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
- **search**: DuckDuckGo pinned as default; adding search engines is blocked
- **sync**: bookmarks, tabs and history sync; addons, prefs, passwords, addresses
  and credit cards are excluded
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

Zen replaces its app bundle or install directory, which removes `policies.json`.
Profile files are safe. Run:

```bash
mise run policies
```

and restart Zen. On Windows, use an elevated terminal if Zen is installed under
`Program Files`. Optionally, a LaunchAgent (macOS) or scheduled task (Windows)
can run that after updates; hanok does not install one by default.

## Backups and uninstall

Every `apply` copies replaced files to the platform backup directory shown
above, under `<timestamp>/`.

To uninstall on macOS:

```bash
# remove the symlinks or copies from the profile
rm ~/Library/Application\ Support/zen/Profiles/*/user.js
rm ~/Library/Application\ Support/zen/Profiles/*/chrome/userChrome.css
rm ~/Library/Application\ Support/zen/Profiles/*/chrome/userContent.css

# remove policies
rm /Applications/Zen.app/Contents/Resources/distribution/policies.json
```

To uninstall on Windows (PowerShell; elevated if Zen is under `Program Files`):

```powershell
Remove-Item "$env:APPDATA\zen\Profiles\*\user.js"
Remove-Item "$env:APPDATA\zen\Profiles\*\chrome\userChrome.css"
Remove-Item "$env:APPDATA\zen\Profiles\*\chrome\userContent.css"
Remove-Item "$env:ProgramFiles\Zen Browser\distribution\policies.json"
```

Restore anything you need from the backups, then restart Zen.

## Notes

- `policies.json` is an enterprise-policy file inside the install directory. It
  is read at startup and removed by Zen updates. On macOS it can invalidate the
  app's code-signature seal; on Windows the install directory may require
  Administrator rights. This is the standard Firefox enterprise-policy
  mechanism and does not prevent Zen from launching.
- On Windows, profile files are linked when symlinks are available (Developer
  Mode or elevation). Otherwise hanok copies them; `verify` accepts either and
  fails if a copy drifts from the repo.
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
