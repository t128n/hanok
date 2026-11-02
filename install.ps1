$ErrorActionPreference = "Stop"

$RepoUrl = if ($env:HANOK_REPO_URL) { $env:HANOK_REPO_URL } else { "https://github.com/t128n/hanok.git" }
$RepoDir = if ($env:HANOK_DIR) { $env:HANOK_DIR } else { Join-Path $env:APPDATA "hanok" }
$RepoDir = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($RepoDir)
$MiseBin = $env:MISE_BIN

function Say([string]$Message) {
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-Mise {
  & $MiseBin @args
  if ($LASTEXITCODE -ne 0) {
    throw "mise $($args -join ' ') failed with exit code $LASTEXITCODE"
  }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git is required; install it and rerun"
}

if (Test-Path (Join-Path $RepoDir ".git")) {
  Say "Using existing checkout at $RepoDir"
} elseif (Test-Path $RepoDir) {
  $entries = @(Get-ChildItem -Force -LiteralPath $RepoDir)
  if ($entries.Count -eq 0) {
    Say "Cloning hanok into $RepoDir"
    $parent = Split-Path -Parent $RepoDir
    if ($parent -and -not (Test-Path $parent)) {
      New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    git clone --depth 1 $RepoUrl $RepoDir
    if ($LASTEXITCODE -ne 0) { throw "git clone failed" }
  } else {
    throw "$RepoDir exists and is not a hanok checkout; set HANOK_DIR to another path"
  }
} else {
  Say "Cloning hanok into $RepoDir"
  $parent = Split-Path -Parent $RepoDir
  if ($parent -and -not (Test-Path $parent)) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }
  git clone --depth 1 $RepoUrl $RepoDir
  if ($LASTEXITCODE -ne 0) { throw "git clone failed" }
}

if (-not $MiseBin) {
  $command = Get-Command mise -CommandType Application -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($command) {
    $MiseBin = $command.Source
  } elseif (Test-Path (Join-Path $HOME ".local\bin\mise.exe")) {
    $MiseBin = Join-Path $HOME ".local\bin\mise.exe"
  }
}

if (-not $MiseBin) {
  Say "Installing mise"
  Invoke-RestMethod https://mise.run/powershell | Invoke-Expression
  $MiseBin = Join-Path $HOME ".local\bin\mise.exe"
}

if (-not (Test-Path $MiseBin)) {
  throw "mise not found at $MiseBin"
}
$env:Path = "$(Split-Path -Parent $MiseBin);$env:Path"

Push-Location $RepoDir
try {
  Say "Installing pinned tools"
  Invoke-Mise trust
  Invoke-Mise install

  Say "Generating user.js"
  Invoke-Mise run update

  Say "Applying hanok to Zen"
  Invoke-Mise run apply
} finally {
  Pop-Location
}

Say "Done. Quit Zen completely from the tray, then reopen it."
