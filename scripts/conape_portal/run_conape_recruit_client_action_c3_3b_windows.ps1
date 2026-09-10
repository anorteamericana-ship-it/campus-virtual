param(
  [int]$TimeoutSeconds = 600
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Find-ChromiumBrowser {
  $candidates = @(
    @{ Name = 'Google Chrome'; Path = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" },
    @{ Name = 'Google Chrome'; Path = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe" },
    @{ Name = 'Google Chrome'; Path = "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe" },
    @{ Name = 'Microsoft Edge'; Path = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" },
    @{ Name = 'Microsoft Edge'; Path = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe" },
    @{ Name = 'Microsoft Edge'; Path = "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe" }
  )
  foreach ($candidate in $candidates) {
    if ($candidate.Path -and (Test-Path -LiteralPath $candidate.Path)) { return $candidate }
  }
  throw 'Google Chrome or Microsoft Edge was not found.'
}

function Stop-DedicatedBrowserProcesses {
  param([string]$ProfilePath)
  try {
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
      Where-Object {
        ($_.Name -eq 'chrome.exe' -or $_.Name -eq 'msedge.exe') -and $_.CommandLine -and
        $_.CommandLine.IndexOf($ProfilePath, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
      } | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch { } }
  } catch { }
}

function Remove-TemporaryProfile {
  param([string]$ProfilePath)
  for ($i = 0; $i -lt 10; $i++) {
    try {
      if (Test-Path -LiteralPath $ProfilePath) { Remove-Item -LiteralPath $ProfilePath -Recurse -Force -ErrorAction Stop }
      return
    } catch { Start-Sleep -Milliseconds 400 }
  }
  Write-Warning "Could not completely remove temporary profile: $ProfilePath"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$discoveryScript = Join-Path $scriptDir 'discover_recruit_client_action_c3_3b.mjs'
if (-not (Test-Path -LiteralPath $discoveryScript)) { throw "Missing C3.3b discovery: $discoveryScript" }

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw 'Node.js is not available in PATH.' }
$nodeVersion = (& $node.Source -p "process.versions.node").Trim()
if ([int]($nodeVersion.Split('.')[0]) -lt 22) { throw "Node 22 or newer is required. Detected: $nodeVersion" }

$browser = Find-ChromiumBrowser
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$profilePath = Join-Path $env:TEMP "an-conape-action-$PID-$stamp"
New-Item -ItemType Directory -Path $profilePath -Force | Out-Null
$portFile = Join-Path $profilePath 'DevToolsActivePort'
$targetUrl = 'https://online.conape.go.cr/apex/f?p=302:1'
$browserArgs = @(
  "--user-data-dir=$profilePath",
  '--remote-debugging-address=127.0.0.1',
  '--remote-debugging-port=0',
  '--incognito',
  '--no-first-run',
  '--no-default-browser-check',
  $targetUrl
)

$exitCode = 1
try {
  Write-Host 'C3.3b - opening CONAPE to classify Crear nuevo Prospecto client action.'
  Start-Process -FilePath $browser.Path -ArgumentList $browserArgs | Out-Null
  $deadline = (Get-Date).AddSeconds(20)
  while ((Get-Date) -lt $deadline -and -not (Test-Path -LiteralPath $portFile)) { Start-Sleep -Milliseconds 250 }
  if (-not (Test-Path -LiteralPath $portFile)) { throw 'Chrome/Edge did not create DevToolsActivePort.' }

  Write-Host ''
  Write-Host 'Sign in normally and leave Reclutar Prospectos visible.'
  Write-Host 'The script may open PROSPECTO, but it WILL NOT click Crear nuevo Prospecto.'
  Write-Host 'It does not print raw onclick, field values, hidden values, cookies, tokens or session data.'
  Write-Host ''

  & $node.Source $discoveryScript --profile $profilePath --timeout-ms ($TimeoutSeconds * 1000)
  $exitCode = $LASTEXITCODE
} finally {
  Stop-DedicatedBrowserProcesses -ProfilePath $profilePath
  Start-Sleep -Milliseconds 600
  Remove-TemporaryProfile -ProfilePath $profilePath
}

if ($exitCode -eq 0) {
  Write-Host ''
  Write-Host 'C3.3b finished read-only. Temporary profile removed.'
  exit 0
}
Write-Error "C3.3b blocked with exit code $exitCode."
exit $exitCode
