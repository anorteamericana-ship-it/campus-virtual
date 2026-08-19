param(
  [string]$ConfigPath = '',
  [string]$OutputRoot = '',
  [string]$Label = 'live-change'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-ClaspCommand {
  param([string[]]$CommandArgs, [string]$WorkDir)
  Push-Location $WorkDir
  try {
    $out = & clasp @CommandArgs 2>&1
    $code = $LASTEXITCODE
    $text = ($out | Out-String).TrimEnd()
    if ($code -ne 0) {
      throw "clasp $($CommandArgs -join ' ') fallo ($code):`n$text"
    }
    return $text
  }
  finally {
    Pop-Location
  }
}

function New-ClaspProbe {
  param([string]$ScriptId)
  $probe = Join-Path $env:TEMP ('campus-candidate-probe-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Force -Path $probe | Out-Null
  $json = @{ scriptId = $ScriptId } | ConvertTo-Json
  [System.IO.File]::WriteAllText(
    (Join-Path $probe '.clasp.json'),
    $json,
    [System.Text.UTF8Encoding]::new($false)
  )
  return $probe
}

function Get-DeploymentVersion {
  param([string]$ScriptId, [string]$DeploymentId)
  $probe = New-ClaspProbe -ScriptId $ScriptId
  try {
    $text = Invoke-ClaspCommand -CommandArgs @('list-deployments') -WorkDir $probe
    $line = ($text -split "`r?`n" | Where-Object {
      $_ -match [regex]::Escape($DeploymentId)
    } | Select-Object -First 1)
    if (-not $line) {
      throw 'No se encontró el deployment productivo esperado.'
    }
    $m = [regex]::Match($line, '@(\d+)\b')
    if (-not $m.Success) {
      throw "El deployment no apunta a una versión numérica: $line"
    }
    return [int]$m.Groups[1].Value
  }
  finally {
    Remove-Item -LiteralPath $probe -Recurse -Force -ErrorAction SilentlyContinue
  }
}

if (-not (Get-Command clasp -ErrorAction SilentlyContinue)) {
  throw 'clasp no está disponible en PATH.'
}

$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $ConfigPath) {
  $ConfigPath = Join-Path $repoRoot 'config\apps-script-production.json'
}
if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
  throw "No existe configuración de producción: $ConfigPath"
}

$config = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
$scriptId = [string]$config.scriptId
$deploymentId = [string]$config.deploymentId
$recordedVersion = [int]$config.deployedVersion
$remoteVersion = Get-DeploymentVersion -ScriptId $scriptId -DeploymentId $deploymentId

if ($remoteVersion -ne $recordedVersion) {
  throw "Estado productivo desactualizado: config @$recordedVersion, remoto @$remoteVersion. Actualizar evidencia antes de preparar candidato."
}

if (-not $OutputRoot) {
  $OutputRoot = Join-Path $env:USERPROFILE 'Documents\CampusVirtual\AppsScriptCandidates'
}
New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null

$safeLabel = ($Label -replace '[^A-Za-z0-9_-]', '_').Trim('_')
if (-not $safeLabel) { $safeLabel = 'live-change' }
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$candidate = Join-Path $OutputRoot ($stamp + '_' + $safeLabel + '_FROM_PROD_' + $remoteVersion)
New-Item -ItemType Directory -Force -Path $candidate | Out-Null

Invoke-ClaspCommand -CommandArgs @('clone-script', $scriptId, [string]$remoteVersion) -WorkDir $candidate | Out-Null

$meta = [ordered]@{
  createdAt = (Get-Date).ToString('o')
  sourceEnvironment = 'production'
  scriptId = $scriptId
  deploymentId = $deploymentId
  sourceVersion = $remoteVersion
  label = $safeLabel
  rule = 'Editar este candidato; no editar HEAD remoto para preparar un cambio productivo.'
}
$meta | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $candidate 'CANDIDATE_META.json') -Encoding UTF8

Write-Host '=== CANDIDATO APPS SCRIPT ==='
Write-Host ('PASS deployment verificado @' + $remoteVersion)
Write-Host ('CandidateDir: ' + $candidate)
Write-Host 'Base: versión inmutable actualmente desplegada, no HEAD remoto.'
Write-Host 'Siguiente paso: hacer únicamente el delta requerido y ejecutar scripts\release_apps_script.ps1 primero sin -ConfirmProduction.'
