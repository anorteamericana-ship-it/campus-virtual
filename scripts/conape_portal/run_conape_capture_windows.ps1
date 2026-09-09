param(
  [int]$TimeoutSeconds = 300
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
    if ($candidate.Path -and (Test-Path -LiteralPath $candidate.Path)) {
      return $candidate
    }
  }
  throw 'No se encontró Google Chrome ni Microsoft Edge basado en Chromium.'
}

function Stop-DedicatedBrowserProcesses {
  param([Parameter(Mandatory = $true)][string]$ProfilePath)

  try {
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
      Where-Object {
        ($_.Name -eq 'chrome.exe' -or $_.Name -eq 'msedge.exe') -and
        $_.CommandLine -and
        $_.CommandLine.Contains($ProfilePath, [System.StringComparison]::OrdinalIgnoreCase)
      } |
      ForEach-Object {
        try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch { }
      }
  } catch { }
}

function Remove-TemporaryProfile {
  param([Parameter(Mandatory = $true)][string]$ProfilePath)

  for ($attempt = 1; $attempt -le 10; $attempt++) {
    try {
      if (Test-Path -LiteralPath $ProfilePath) {
        Remove-Item -LiteralPath $ProfilePath -Recurse -Force -ErrorAction Stop
      }
      return
    } catch {
      Start-Sleep -Milliseconds 400
    }
  }
  Write-Warning "No fue posible borrar completamente el perfil temporal: $ProfilePath"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$captureScript = Join-Path $scriptDir 'capture_chrome_cdp.mjs'
if (-not (Test-Path -LiteralPath $captureScript)) {
  throw "No existe el capturador C3.2: $captureScript"
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
  throw 'Node.js no está disponible en PATH. Se requiere Node 22 o superior.'
}

$nodeVersionText = (& $nodeCommand.Source -p "process.versions.node").Trim()
$nodeMajor = [int]($nodeVersionText.Split('.')[0])
if ($nodeMajor -lt 22) {
  throw "Node $nodeVersionText detectado. Se requiere Node 22 o superior."
}

$browser = Find-ChromiumBrowser
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$profilePath = Join-Path $env:TEMP "an-conape-capture-$PID-$stamp"
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

Write-Host "C3.2 · abriendo $($browser.Name) en un perfil temporal aislado..."
Write-Host 'No se guardarán cookies ni la sesión en el repositorio. El perfil temporal se elimina al terminar.'

$browserProcess = $null
$exitCode = 1
try {
  $browserProcess = Start-Process -FilePath $browser.Path -ArgumentList $browserArgs -PassThru

  $deadline = (Get-Date).AddSeconds(20)
  while ((Get-Date) -lt $deadline -and -not (Test-Path -LiteralPath $portFile)) {
    Start-Sleep -Milliseconds 250
  }
  if (-not (Test-Path -LiteralPath $portFile)) {
    throw 'Chrome/Edge no creó DevToolsActivePort. La depuración local efímera no quedó disponible.'
  }

  Write-Host ''
  Write-Host 'En la ventana que se abrió: inicie sesión normalmente y deje visible Prospectación Reclutador.'
  Write-Host 'No copie HTML, Payload, Response, cookies ni sesiones. El capturador espera automáticamente.'
  Write-Host ''

  & $nodeCommand.Source $captureScript --profile $profilePath --timeout-ms ($TimeoutSeconds * 1000)
  $exitCode = $LASTEXITCODE
} finally {
  Stop-DedicatedBrowserProcesses -ProfilePath $profilePath
  Start-Sleep -Milliseconds 600
  Remove-TemporaryProfile -ProfilePath $profilePath
}

if ($exitCode -eq 0) {
  Write-Host ''
  Write-Host 'C3.2 terminó correctamente. El perfil temporal y su sesión fueron eliminados.'
  exit 0
}

Write-Error "C3.2 terminó bloqueado con código $exitCode."
exit $exitCode
