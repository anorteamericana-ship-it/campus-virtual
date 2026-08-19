param(
  [Parameter(Mandatory = $true)]
  [string]$CandidateDir,

  [string]$ConfigPath = '',
  [string]$Description = 'CAMPUS live change',
  [int]$MaxChangedFiles = 10,
  [switch]$AllowManifestChange,
  [switch]$ConfirmProduction
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
  $probe = Join-Path $env:TEMP ('campus-release-probe-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Force -Path $probe | Out-Null
  $json = @{ scriptId = $ScriptId } | ConvertTo-Json
  [System.IO.File]::WriteAllText(
    (Join-Path $probe '.clasp.json'),
    $json,
    [System.Text.UTF8Encoding]::new($false)
  )
  return $probe
}

function Get-DeploymentState {
  param([string]$ScriptId, [string]$DeploymentId)
  $probe = New-ClaspProbe -ScriptId $ScriptId
  try {
    $text = Invoke-ClaspCommand -CommandArgs @('list-deployments') -WorkDir $probe
    $line = ($text -split "`r?`n" | Where-Object {
      $_ -match [regex]::Escape($DeploymentId)
    } | Select-Object -First 1)

    if (-not $line) {
      throw "El Script ID no contiene el deployment PROD esperado.`n$text"
    }

    $m = [regex]::Match($line, '@(\d+)\b')
    if (-not $m.Success) {
      throw "Deployment PROD sin version numerica inmutable: $line"
    }

    return [pscustomobject]@{
      Text = $text
      Line = $line
      Version = [int]$m.Groups[1].Value
    }
  }
  finally {
    Remove-Item -LiteralPath $probe -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Read-Utf8Strict {
  param([string]$Path)
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  $offset = 0
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    $offset = 3
  }
  $enc = [System.Text.UTF8Encoding]::new($false, $true)
  return $enc.GetString($bytes, $offset, $bytes.Length - $offset)
}

function Get-ProjectFiles {
  param([string]$Root)
  $allowed = @('.gs', '.js', '.html', '.json')
  return @(Get-ChildItem -LiteralPath $Root -File -Recurse | Where-Object {
    $_.Name -ne '.clasp.json' -and $allowed -contains $_.Extension.ToLowerInvariant()
  })
}

function Get-ProjectHashes {
  param([string]$Root)
  $map = @{}
  foreach ($file in (Get-ProjectFiles -Root $Root)) {
    $relative = $file.FullName.Substring($Root.Length).TrimStart('\', '/')
    $text = Read-Utf8Strict -Path $file.FullName
    $normalized = $text.Replace("`r`n", "`n")
    $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes($normalized)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
      $hashBytes = $sha.ComputeHash($bytes)
    }
    finally {
      $sha.Dispose()
    }
    $map[$relative] = ([System.BitConverter]::ToString($hashBytes)).Replace('-', '').ToLowerInvariant()
  }
  return $map
}

function Get-ProjectDiffs {
  param([string]$BaseRoot, [string]$CandidateRoot)
  $base = Get-ProjectHashes -Root $BaseRoot
  $candidate = Get-ProjectHashes -Root $CandidateRoot
  $keys = @($base.Keys + $candidate.Keys | Sort-Object -Unique)
  $diffs = @()

  foreach ($key in $keys) {
    if (-not $base.ContainsKey($key)) {
      $diffs += [pscustomobject]@{ Kind = 'ADD'; Path = $key }
      continue
    }
    if (-not $candidate.ContainsKey($key)) {
      $diffs += [pscustomobject]@{ Kind = 'DELETE'; Path = $key }
      continue
    }
    if ($base[$key] -ne $candidate[$key]) {
      $diffs += [pscustomobject]@{ Kind = 'MODIFY'; Path = $key }
    }
  }

  return @($diffs)
}

function Assert-ProjectParity {
  param([string]$LeftRoot, [string]$RightRoot, [string]$Label)
  $diffs = Get-ProjectDiffs -BaseRoot $LeftRoot -CandidateRoot $RightRoot
  if ($diffs.Count -gt 0) {
    $detail = ($diffs | Select-Object -First 30 | ForEach-Object { "$($_.Kind) $($_.Path)" }) -join "`n"
    throw "$Label no coincide.`n$detail"
  }
}

function Assert-CandidateEncoding {
  param([string]$Root)
  $suspicious = @('├', '┬', '�')
  foreach ($file in (Get-ProjectFiles -Root $Root)) {
    $text = Read-Utf8Strict -Path $file.FullName
    foreach ($marker in $suspicious) {
      if ($text.Contains($marker)) {
        throw "Posible mojibake detectado en $($file.Name): marcador '$marker'. Revisar codificacion antes de desplegar."
      }
    }
  }
}

function Copy-ClaspProject {
  param([string]$Source, [string]$Destination)
  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  Copy-Item -Path (Join-Path $Source '*') -Destination $Destination -Recurse -Force
  if (Test-Path (Join-Path $Source '.clasp.json')) {
    Copy-Item -LiteralPath (Join-Path $Source '.clasp.json') -Destination $Destination -Force
  }
}

if (-not (Get-Command clasp -ErrorAction SilentlyContinue)) {
  throw 'clasp no esta disponible en PATH.'
}

if (-not (Test-Path -LiteralPath $CandidateDir -PathType Container)) {
  throw "CandidateDir no existe: $CandidateDir"
}

$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $ConfigPath) {
  $ConfigPath = Join-Path $repoRoot 'config\apps-script-production.json'
}
if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
  throw "No existe la configuracion de produccion: $ConfigPath"
}

$config = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
$scriptId = [string]$config.scriptId
$deploymentId = [string]$config.deploymentId
$recordedVersion = [int]$config.deployedVersion

Write-Host '=== CAMPUS APPS SCRIPT RELEASE ==='
Write-Host ('Candidate: ' + (Resolve-Path $CandidateDir).Path)
Write-Host ('Script PROD: ' + $scriptId)
Write-Host ('Deployment PROD: ' + $deploymentId)
Write-Host ('Version registrada: @' + $recordedVersion)

$claspVersion = (& clasp --version 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0) { throw 'No pude leer la version de clasp.' }
Write-Host ('clasp: ' + $claspVersion)

$before = Get-DeploymentState -ScriptId $scriptId -DeploymentId $deploymentId
if ($before.Version -ne $recordedVersion) {
  throw "PRODUCTION_STATE esta desactualizado. Config registra @$recordedVersion pero remoto esta @$($before.Version). No se toca produccion."
}
Write-Host ('PASS identidad y version PROD @' + $before.Version)

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$root = Join-Path $env:TEMP ('campus-release-' + $stamp)
$headOriginal = Join-Path $root 'HEAD_ORIGINAL'
$deployedBase = Join-Path $root ('DEPLOYED_' + $before.Version)
$candidateWork = Join-Path $root 'CANDIDATE'
$verifyVersion = Join-Path $root 'VERIFY_VERSION'
$verifyHead = Join-Path $root 'VERIFY_HEAD'
New-Item -ItemType Directory -Force -Path $headOriginal, $deployedBase, $candidateWork | Out-Null

$backupRoot = Join-Path $env:USERPROFILE 'Documents\CampusVirtual\AppsScriptPROD\Backups'
$backup = Join-Path $backupRoot ('RELEASE_' + $stamp)
$pushStarted = $false
$deploymentChanged = $false
$success = $false
$newVersion = $null

try {
  Invoke-ClaspCommand -CommandArgs @('clone-script', $scriptId) -WorkDir $headOriginal | Out-Null
  Invoke-ClaspCommand -CommandArgs @('clone-script', $scriptId, [string]$before.Version) -WorkDir $deployedBase | Out-Null

  New-Item -ItemType Directory -Force -Path $backup | Out-Null
  Copy-ClaspProject -Source $headOriginal -Destination (Join-Path $backup 'HEAD_ORIGINAL')
  Copy-ClaspProject -Source $deployedBase -Destination (Join-Path $backup ('DEPLOYED_' + $before.Version))
  Write-Host ('Backup: ' + $backup)

  Copy-ClaspProject -Source $CandidateDir -Destination $candidateWork
  $candidateClasp = @{ scriptId = $scriptId } | ConvertTo-Json
  [System.IO.File]::WriteAllText(
    (Join-Path $candidateWork '.clasp.json'),
    $candidateClasp,
    [System.Text.UTF8Encoding]::new($false)
  )

  if (-not (Test-Path (Join-Path $candidateWork 'appsscript.json'))) {
    throw 'El candidato no contiene appsscript.json; no parece un proyecto Apps Script completo.'
  }

  Assert-CandidateEncoding -Root $candidateWork
  $diffs = Get-ProjectDiffs -BaseRoot $deployedBase -CandidateRoot $candidateWork

  if ($diffs.Count -eq 0) {
    throw 'El candidato es identico a la version desplegada; no hay nada que publicar.'
  }
  if ($diffs.Count -gt $MaxChangedFiles) {
    $detail = ($diffs | ForEach-Object { "$($_.Kind) $($_.Path)" }) -join "`n"
    throw "El candidato cambia $($diffs.Count) archivos y excede MaxChangedFiles=$MaxChangedFiles.`n$detail"
  }
  if (-not $AllowManifestChange -and ($diffs.Path -contains 'appsscript.json')) {
    throw 'appsscript.json cambia. Requiere -AllowManifestChange y revision explicita.'
  }

  Write-Host '=== ALCANCE DETECTADO ==='
  foreach ($diff in $diffs) {
    Write-Host ("$($diff.Kind) $($diff.Path)")
  }
  Write-Host ('PASS alcance: ' + $diffs.Count + ' archivo(s) cambiado(s)')
  Write-Host 'PASS UTF-8 estricto / sin marcadores comunes de mojibake'

  if (-not $ConfirmProduction) {
    Write-Host '=== DRY RUN ==='
    Write-Host 'PASS - candidato inspeccionado. No se hizo push ni redeploy.'
    Write-Host 'Para publicar, repetir con -ConfirmProduction despues de QA y revision humana.'
    return
  }

  # Desde aqui toda falla activa recuperacion preventiva, incluso si clasp push falla a mitad.
  $pushStarted = $true
  Invoke-ClaspCommand -CommandArgs @('push', '--force') -WorkDir $candidateWork | Out-Null
  Write-Host 'PASS push candidato'

  $releaseDescription = $Description + ' ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  $versionOut = Invoke-ClaspCommand -CommandArgs @('create-version', $releaseDescription) -WorkDir $candidateWork
  $vm = [regex]::Match($versionOut, '(?i)version\D+(\d+)\b')
  if (-not $vm.Success) {
    throw "No pude extraer la version creada:`n$versionOut"
  }
  $newVersion = [int]$vm.Groups[1].Value
  Write-Host ('Version nueva: ' + $newVersion)

  Invoke-ClaspCommand -CommandArgs @(
    'create-deployment',
    '--versionNumber', [string]$newVersion,
    '--description', $releaseDescription,
    '--deploymentId', $deploymentId
  ) -WorkDir $candidateWork | Out-Null

  $after = Get-DeploymentState -ScriptId $scriptId -DeploymentId $deploymentId
  if ($after.Version -ne $newVersion) {
    throw "Redeploy no confirmado. Esperado @$newVersion; observado @$($after.Version)."
  }
  $deploymentChanged = $true
  Write-Host ('PASS redeploy mismo ID -> @' + $newVersion)

  New-Item -ItemType Directory -Force -Path $verifyVersion | Out-Null
  Invoke-ClaspCommand -CommandArgs @('clone-script', $scriptId, [string]$newVersion) -WorkDir $verifyVersion | Out-Null
  Assert-ProjectParity -LeftRoot $candidateWork -RightRoot $verifyVersion -Label ('Version remota @' + $newVersion)
  Write-Host ('PASS verificacion remota @' + $newVersion)

  # El HEAD remoto puede contener trabajo no publicado; restaurarlo sin mover el deployment.
  Invoke-ClaspCommand -CommandArgs @('push', '--force') -WorkDir $headOriginal | Out-Null
  New-Item -ItemType Directory -Force -Path $verifyHead | Out-Null
  Invoke-ClaspCommand -CommandArgs @('clone-script', $scriptId) -WorkDir $verifyHead | Out-Null
  Assert-ProjectParity -LeftRoot $headOriginal -RightRoot $verifyHead -Label 'Restauracion HEAD'
  Write-Host 'PASS HEAD remoto original restaurado'

  $finalState = Get-DeploymentState -ScriptId $scriptId -DeploymentId $deploymentId
  if ($finalState.Version -ne $newVersion) {
    throw "El deployment cambio durante restore de HEAD. Esperado @$newVersion; observado @$($finalState.Version)."
  }

  $success = $true
  Write-Host '=== RESULTADO ==='
  Write-Host 'PASS - release Apps Script completado.'
  Write-Host ('Version anterior: ' + $before.Version)
  Write-Host ('Version nueva: ' + $newVersion)
  Write-Host ('Deployment estable: ' + $deploymentId)
  Write-Host ('Backup: ' + $backup)
  Write-Host 'PENDIENTE: prueba funcional real + actualizar config/apps-script-production.json y PRODUCTION_STATE.md.'
}
catch {
  $original = $_
  Write-Host ('ERROR: ' + $original.Exception.Message)

  if ($pushStarted -and -not $success) {
    Write-Host 'Iniciando recuperacion preventiva...'

    try {
      $state = Get-DeploymentState -ScriptId $scriptId -DeploymentId $deploymentId
      if ($state.Version -ne $before.Version) {
        Invoke-ClaspCommand -CommandArgs @(
          'create-deployment',
          '--versionNumber', [string]$before.Version,
          '--description', ('ROLLBACK ' + $Description + ' ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')),
          '--deploymentId', $deploymentId
        ) -WorkDir $deployedBase | Out-Null

        $rolled = Get-DeploymentState -ScriptId $scriptId -DeploymentId $deploymentId
        if ($rolled.Version -ne $before.Version) {
          throw "Rollback no confirmado; observado @$($rolled.Version)."
        }
        Write-Host ('PASS rollback deployment -> @' + $before.Version)
      }
    }
    catch {
      Write-Host ('ALERTA rollback deployment: ' + $_.Exception.Message)
    }

    try {
      Invoke-ClaspCommand -CommandArgs @('push', '--force') -WorkDir $headOriginal | Out-Null
      $restoreCheck = Join-Path $root 'RESTORE_CHECK'
      New-Item -ItemType Directory -Force -Path $restoreCheck | Out-Null
      Invoke-ClaspCommand -CommandArgs @('clone-script', $scriptId) -WorkDir $restoreCheck | Out-Null
      Assert-ProjectParity -LeftRoot $headOriginal -RightRoot $restoreCheck -Label 'Restore HEAD de emergencia'
      Write-Host 'PASS restore HEAD original de emergencia'
    }
    catch {
      Write-Host ('ALERTA restore HEAD: ' + $_.Exception.Message)
    }
  }

  throw $original
}
finally {
  if (Test-Path $root) {
    Remove-Item -LiteralPath $root -Recurse -Force -ErrorAction SilentlyContinue
  }
}
