[CmdletBinding()]
param(
  [string]$OutputRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'CampusVirtual\AppsScriptQA\Snapshots'),
  [string]$ClaspVersion = '3.3.0',
  [int]$MinimumSourceFiles = 37,
  [switch]$KeepWorkDir
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# Canonical QA Script ID documented in Issue #111. This script is intentionally
# READ-ONLY: clone/show-authorized-user only. It never pushes or deploys.
$QaScriptId = '1GMHihGwnX_-sIS101rRlUoYpAH2HSKyms8lx6L9z7bjb_45YDn-ph6WD'
$Stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMdd_HHmmssZ')
$WorkRoot = Join-Path ([IO.Path]::GetTempPath()) "campus_apps_script_qa_snapshot_$Stamp"
$CloneDir = Join-Path $WorkRoot 'qa-head'
$SnapshotDir = Join-Path $OutputRoot "QA_HEAD_$Stamp"
$SourceDir = Join-Path $SnapshotDir 'source'
$ManifestPath = Join-Path $SnapshotDir 'manifest.json'
$ZipPath = Join-Path $OutputRoot "QA_HEAD_$Stamp.zip"
$Analyzer = Join-Path $PSScriptRoot 'apps_script_qa_snapshot_manifest_cs21a178.mjs'

function Fail([string]$Message) { throw $Message }
function Find-CommandPath([string[]]$Names) {
  foreach ($name in $Names) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
  }
  return $null
}
function Invoke-Native {
  param(
    [Parameter(Mandatory=$true)][string]$FilePath,
    [Parameter(Mandatory=$true)][string[]]$Arguments,
    [string]$WorkingDirectory = '',
    [switch]$AllowFailure,
    [switch]$Quiet
  )
  $old = Get-Location
  try {
    if ($WorkingDirectory) { Set-Location $WorkingDirectory }
    $output = & $FilePath @Arguments 2>&1
    $code = $LASTEXITCODE
    if (-not $Quiet -and $null -ne $output) { $output | ForEach-Object { Write-Host $_ } }
    if ($code -ne 0 -and -not $AllowFailure) {
      throw "Command failed ($code): $FilePath $($Arguments -join ' ')"
    }
    return [pscustomobject]@{ Code=$code; Text=($output -join [Environment]::NewLine) }
  }
  finally { Set-Location $old }
}

$NodeExe = Find-CommandPath @('node.exe','node')
$NpxExe = Find-CommandPath @('npx.cmd','npx.exe','npx')
if (-not $NodeExe) { Fail 'Node.js no está instalado o no está en PATH.' }
if (-not $NpxExe) { Fail 'npx no está instalado o no está en PATH.' }
if (-not (Test-Path -LiteralPath $Analyzer)) { Fail "Falta analizador: $Analyzer" }

function Invoke-Clasp {
  param([string[]]$Arguments, [string]$WorkingDirectory = '', [switch]$AllowFailure, [switch]$Quiet)
  $all = @('--yes', "@google/clasp@$ClaspVersion") + $Arguments
  return Invoke-Native -FilePath $NpxExe -Arguments $all -WorkingDirectory $WorkingDirectory -AllowFailure:$AllowFailure -Quiet:$Quiet
}

function Copy-SnapshotSource([string]$From, [string]$To) {
  New-Item -ItemType Directory -Path $To -Force | Out-Null
  $files = @(Get-ChildItem -LiteralPath $From -Recurse -File | Where-Object {
    $_.Name -ne '.clasp.json' -and ($_.Name -eq 'appsscript.json' -or $_.Extension.ToLowerInvariant() -in @('.js','.gs','.html'))
  })
  foreach ($file in $files) {
    $root = [IO.Path]::GetFullPath($From).TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar
    $full = [IO.Path]::GetFullPath($file.FullName)
    if (-not $full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) { Fail "Ruta fuera de clone: $full" }
    $rel = $full.Substring($root.Length)
    $dest = Join-Path $To $rel
    $parent = Split-Path -Parent $dest
    if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    Copy-Item -LiteralPath $file.FullName -Destination $dest -Force
  }
  return $files.Count
}

Write-Host '=== CS21A178 · snapshot read-only Apps Script QA ===' -ForegroundColor Cyan
Write-Host "Script ID QA: $QaScriptId"
Write-Host 'Política: solo lectura. No push, no deployment, no cambios remotos.'

New-Item -ItemType Directory -Path $WorkRoot -Force | Out-Null
New-Item -ItemType Directory -Path $CloneDir -Force | Out-Null
New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null

try {
  Write-Host "`n1/5 · Verificando sesión clasp sin persistir identidad..." -ForegroundColor Cyan
  $auth = Invoke-Clasp -Arguments @('show-authorized-user','--json') -WorkingDirectory $WorkRoot -AllowFailure -Quiet
  if ($auth.Code -ne 0) {
    Fail "No hay sesión clasp válida. Ejecutá una vez: npx --yes @google/clasp@$ClaspVersion login"
  }
  Write-Host 'PASS · sesión clasp disponible.' -ForegroundColor Green

  Write-Host "`n2/5 · Clonando HEAD QA en modo read-only..." -ForegroundColor Cyan
  Invoke-Clasp -Arguments @('clone-script',$QaScriptId) -WorkingDirectory $CloneDir | Out-Null
  if (-not (Test-Path -LiteralPath (Join-Path $CloneDir '.clasp.json'))) {
    Fail 'Clone incompleto: falta .clasp.json. No se generó snapshot.'
  }

  Write-Host "`n3/5 · Copiando fuente a snapshot persistente..." -ForegroundColor Cyan
  $copied = Copy-SnapshotSource -From $CloneDir -To $SourceDir
  if ($copied -lt $MinimumSourceFiles) {
    Fail "Snapshot inesperadamente pequeño: $copied archivos; mínimo esperado $MinimumSourceFiles."
  }

  Write-Host "`n4/5 · Generando hashes + inventario doPost + gate modular..." -ForegroundColor Cyan
  Invoke-Native -FilePath $NodeExe -Arguments @(
    $Analyzer,
    '--source-dir',$SourceDir,
    '--output',$ManifestPath,
    '--script-id',$QaScriptId,
    '--min-files',([string]$MinimumSourceFiles),
    '--expect-baseline'
  ) | Out-Null
  if (-not (Test-Path -LiteralPath $ManifestPath)) { Fail 'No se generó manifest.json.' }

  $pointer = [ordered]@{
    schema = 'CAMPUS_APPS_SCRIPT_QA_SNAPSHOT_POINTER_1'
    generated_at_utc = [DateTime]::UtcNow.ToString('o')
    script_id = $QaScriptId
    source = 'clasp clone-script read-only'
    remote_write_performed = $false
    credentials_persisted_in_snapshot = $false
  }
  $pointer | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $SnapshotDir 'snapshot-pointer.json') -Encoding UTF8

  Write-Host "`n5/5 · Empaquetando evidencia..." -ForegroundColor Cyan
  if (Test-Path -LiteralPath $ZipPath) { Remove-Item -LiteralPath $ZipPath -Force }
  Compress-Archive -Path (Join-Path $SnapshotDir '*') -DestinationPath $ZipPath -CompressionLevel Optimal

  $manifest = Get-Content -LiteralPath $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
  Write-Host "`nPASS · snapshot QA congelado" -ForegroundColor Green
  Write-Host "Archivos fuente: $($manifest.source_file_count)"
  Write-Host "Aggregate SHA-256: $($manifest.aggregate_sha256)"
  Write-Host "Directorio: $SnapshotDir"
  Write-Host "ZIP: $ZipPath"
}
finally {
  if (-not $KeepWorkDir -and (Test-Path -LiteralPath $WorkRoot)) {
    Remove-Item -LiteralPath $WorkRoot -Recurse -Force
  } elseif ($KeepWorkDir) {
    Write-Host "Workdir conservado: $WorkRoot"
  }
}
