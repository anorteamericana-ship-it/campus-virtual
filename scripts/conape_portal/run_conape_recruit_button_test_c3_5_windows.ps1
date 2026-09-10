param(
  [int]$Port = 8765
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
try {
  [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
  $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
} catch { }

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
  throw 'No se encontró Google Chrome ni Microsoft Edge.'
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
  Write-Warning "No fue posible borrar completamente el perfil temporal: $ProfilePath"
}

if ($Port -lt 1024 -or $Port -gt 65535) { throw 'Puerto inválido.' }
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir '..\..')).Path
$bridgeScript = Join-Path $scriptDir 'recruit_local_bridge_c3_5.mjs'
$prepareScript = Join-Path $scriptDir 'discover_recruit_submit_contract_c3_3.mjs'
if (-not (Test-Path -LiteralPath $bridgeScript)) { throw "No existe el bridge C3.5: $bridgeScript" }
if (-not (Test-Path -LiteralPath $prepareScript)) { throw "No existe el preparador probado C3.3: $prepareScript" }
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw 'Node.js no está disponible en PATH.' }
$nodeVersion = (& $node.Source -p "process.versions.node").Trim()
if ([int]($nodeVersion.Split('.')[0]) -lt 22) { throw "Se requiere Node 22 o superior. Detectado: $nodeVersion" }

$browser = Find-ChromiumBrowser
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$profilePath = Join-Path $env:TEMP "an-conape-c35-$PID-$stamp"
New-Item -ItemType Directory -Path $profilePath -Force | Out-Null
$portFile = Join-Path $profilePath 'DevToolsActivePort'
$conapeUrl = 'https://online.conape.go.cr/apex/f?p=302:1'
$localLogin = "http://127.0.0.1:$Port/login.html?clear=1"
$browserArgs = @(
  "--user-data-dir=$profilePath",
  '--remote-debugging-address=127.0.0.1',
  '--remote-debugging-port=0',
  '--incognito',
  '--no-first-run',
  '--no-default-browser-check',
  $conapeUrl
)

$bridgeProc = $null
try {
  Write-Host 'C3.5 · PRUEBA DEL BOTÓN REAL RECLUTAR EN CONAPE'
  Write-Host 'Esta ventana usa un perfil temporal aislado y un bridge SOLO en 127.0.0.1.'
  Write-Host 'No pega credenciales en PowerShell, no guarda cookies/tokens y nunca escribe nombre/apellidos.'
  Write-Host ''

  Start-Process -FilePath $browser.Path -ArgumentList $browserArgs | Out-Null
  $deadline = (Get-Date).AddSeconds(20)
  while ((Get-Date) -lt $deadline -and -not (Test-Path -LiteralPath $portFile)) { Start-Sleep -Milliseconds 250 }
  if (-not (Test-Path -LiteralPath $portFile)) { throw 'Chrome/Edge no creó DevToolsActivePort.' }

  Write-Host '1. Inicie sesión normalmente en CONAPE y deje visible Reclutar Prospectos.'
  Write-Host '   No presione Reclutar: el mismo preparador C3.3 que ya pasó E2 lo abrirá automáticamente.'
  Write-Host ''

  & $node.Source $prepareScript '--profile' $profilePath '--timeout-ms' '600000'
  if ($LASTEXITCODE -ne 0) {
    throw "El preparador C3.3 no pudo dejar PROSPECTO listo. Código: $LASTEXITCODE"
  }

  Write-Host ''
  Write-Host 'C3.5: PROSPECTO confirmado por el preparador E2. Iniciando bridge local...'

  $bridgeProc = Start-Process -FilePath $node.Source -ArgumentList @(
    $bridgeScript,
    '--profile', $profilePath,
    '--root', $repoRoot,
    '--port', [string]$Port
  ) -PassThru -NoNewWindow

  $health = "http://127.0.0.1:$Port/api/conape-recruit/health"
  $ready = $false
  for ($i = 0; $i -lt 40; $i++) {
    try {
      $r = Invoke-WebRequest -UseBasicParsing -Uri $health -TimeoutSec 2
      if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch { Start-Sleep -Milliseconds 250 }
  }
  if (-not $ready) { throw 'El bridge local C3.5 no inició correctamente.' }

  Start-Process -FilePath $browser.Path -ArgumentList @(
    "--user-data-dir=$profilePath",
    '--incognito',
    $localLogin
  ) | Out-Null

  Write-Host ''
  Write-Host 'LISTO PARA PROBAR:'
  Write-Host '1. La página PROSPECTO ya quedó confirmada por el mismo flujo C3.3 que funcionó en E2.'
  Write-Host '2. En la pestaña Campus local, inicie sesión con su usuario normal.'
  Write-Host '3. Abra Ventas y pulse Reclutar en una fila CONAPE que todavía no esté reclutada.'
  Write-Host '4. Debe traer identidad por cédula y comparar teléfono/correo.'
  Write-Host '5. NO pulse Enviar solicitud hasta revisar primero el modal.'
  Write-Host ''
  Write-Host 'Nombre y apellidos nunca son enviados desde Campus. Ante resultado incierto, no repita el envío.'
  Write-Host ''
  [void](Read-Host 'Cuando termine la prueba, presione ENTER aquí para cerrar el bridge y borrar el perfil temporal')
} finally {
  if ($bridgeProc -and -not $bridgeProc.HasExited) {
    try { Stop-Process -Id $bridgeProc.Id -Force -ErrorAction SilentlyContinue } catch { }
  }
  Stop-DedicatedBrowserProcesses -ProfilePath $profilePath
  Start-Sleep -Milliseconds 500
  Remove-TemporaryProfile -ProfilePath $profilePath
}

Write-Host 'C3.5 finalizado. Perfil temporal eliminado.'
