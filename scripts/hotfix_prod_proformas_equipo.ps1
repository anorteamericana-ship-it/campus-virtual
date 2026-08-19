param(
  [string]$ProdDeploymentId = 'AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ',
  [string]$ProdScriptId = '1kV4wKnD_OU5DPQSawScjPsUbo1MOg_rAHbtpYupSMPkqywIVSQwdV4y2'
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
    if ($code -ne 0) { throw "clasp $($CommandArgs -join ' ') fallo ($code):`n$text" }
    return $text
  }
  finally { Pop-Location }
}

function New-ClaspProbe {
  param([string]$ScriptId)
  $probe = Join-Path $env:TEMP ('campus-prod-probe-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Force -Path $probe | Out-Null
  $json = @{ scriptId = $ScriptId } | ConvertTo-Json
  [System.IO.File]::WriteAllText((Join-Path $probe '.clasp.json'), $json, [System.Text.UTF8Encoding]::new($false))
  return $probe
}

function Get-DeploymentState {
  param([string]$ScriptId, [string]$DeploymentId)
  $probe = New-ClaspProbe -ScriptId $ScriptId
  try {
    $text = Invoke-ClaspCommand -CommandArgs @('list-deployments') -WorkDir $probe
    $line = ($text -split "`r?`n" | Where-Object { $_ -match [regex]::Escape($DeploymentId) } | Select-Object -First 1)
    if (-not $line) { throw "El Script ID no contiene el deployment PROD esperado.`n$text" }
    $m = [regex]::Match($line, '@(\d+)\b')
    if (-not $m.Success) { throw "Deployment PROD sin version numerica: $line" }
    return [pscustomobject]@{ Text=$text; Line=$line; Version=[int]$m.Groups[1].Value }
  }
  finally { Remove-Item -LiteralPath $probe -Recurse -Force -ErrorAction SilentlyContinue }
}

function Read-Utf8TextStrict {
  param([string]$Path)
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  $offset = 0
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    $offset = 3
  }
  $enc = [System.Text.UTF8Encoding]::new($false, $true)
  return $enc.GetString($bytes, $offset, $bytes.Length - $offset)
}

function Write-Utf8TextPreserveBom {
  param([string]$Path, [string]$Text)
  $existing = [System.IO.File]::ReadAllBytes($Path)
  $hasBom = $existing.Length -ge 3 -and $existing[0] -eq 0xEF -and $existing[1] -eq 0xBB -and $existing[2] -eq 0xBF
  $enc = [System.Text.UTF8Encoding]::new($false, $true)
  $body = $enc.GetBytes($Text)
  if ($hasBom) {
    $out = New-Object byte[] ($body.Length + 3)
    $out[0] = 0xEF; $out[1] = 0xBB; $out[2] = 0xBF
    [System.Buffer]::BlockCopy($body, 0, $out, 3, $body.Length)
    [System.IO.File]::WriteAllBytes($Path, $out)
  }
  else {
    [System.IO.File]::WriteAllBytes($Path, $body)
  }
}

function Get-ProjectHashes {
  param([string]$Root)
  $allowed = @('.gs','.js','.html','.json')
  $map = @{}
  Get-ChildItem -LiteralPath $Root -File -Recurse | ForEach-Object {
    if ($_.Name -eq '.clasp.json') { return }
    if ($allowed -notcontains $_.Extension.ToLowerInvariant()) { return }
    $rel = $_.FullName.Substring($Root.Length).TrimStart('\','/')
    $text = Read-Utf8TextStrict -Path $_.FullName
    $norm = $text.Replace("`r`n","`n")
    $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes($norm)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try { $hb = $sha.ComputeHash($bytes) } finally { $sha.Dispose() }
    $map[$rel] = ([System.BitConverter]::ToString($hb)).Replace('-','').ToLowerInvariant()
  }
  return $map
}

function Assert-ProjectParity {
  param([string]$LeftRoot, [string]$RightRoot, [string]$Label)
  $a = Get-ProjectHashes -Root $LeftRoot
  $b = Get-ProjectHashes -Root $RightRoot
  $keys = @($a.Keys + $b.Keys | Sort-Object -Unique)
  $diffs = @()
  foreach ($k in $keys) {
    if (-not $a.ContainsKey($k)) { $diffs += "solo derecha: $k"; continue }
    if (-not $b.ContainsKey($k)) { $diffs += "solo izquierda: $k"; continue }
    if ($a[$k] -ne $b[$k]) { $diffs += "contenido distinto: $k" }
  }
  if ($diffs.Count -gt 0) {
    throw "$Label no coincide.`n$((($diffs | Select-Object -First 30) -join "`n"))"
  }
}

function Find-EquipoHelperFile {
  param([string]$Root)
  $targets = @()
  Get-ChildItem -LiteralPath $Root -File -Recurse | Where-Object { $_.Extension -in @('.gs','.js') } | ForEach-Object {
    $txt = Read-Utf8TextStrict -Path $_.FullName
    if ($txt.Contains('function _decidirPlantillaEquipo')) { $targets += $_.FullName }
  }
  if ($targets.Count -ne 1) { throw "Esperaba exactamente 1 archivo con _decidirPlantillaEquipo y encontre $($targets.Count)." }
  return $targets[0]
}

function Copy-ClaspProject {
  param([string]$Source, [string]$Destination)
  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  Copy-Item -Path (Join-Path $Source '*') -Destination $Destination -Recurse -Force
  Copy-Item -LiteralPath (Join-Path $Source '.clasp.json') -Destination $Destination -Force
}

Write-Host '=== HOTFIX PROD - PROFORMAS EQUIPO 319/360 ==='
Write-Host ('Script PROD: ' + $ProdScriptId)
Write-Host ('Deployment PROD: ' + $ProdDeploymentId)

if (-not (Get-Command clasp -ErrorAction SilentlyContinue)) { throw 'clasp no esta disponible en PATH.' }
$claspVersion = (& clasp --version 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0) { throw 'No pude leer la version de clasp.' }
Write-Host ('clasp: ' + $claspVersion)

$before = Get-DeploymentState -ScriptId $ProdScriptId -DeploymentId $ProdDeploymentId
$deployedVersion = $before.Version
Write-Host ('PASS identidad PROD - deployment actual @' + $deployedVersion)

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$root = Join-Path $env:TEMP ('campus-prod-proforma-hotfix-' + $stamp)
$headOriginal = Join-Path $root 'HEAD_ORIGINAL'
$deployedBase = Join-Path $root ('DEPLOYED_' + $deployedVersion)
$patchedWork = Join-Path $root 'PATCHED'
$verifyVersion = Join-Path $root 'VERIFY_VERSION'
$verifyHead = Join-Path $root 'VERIFY_HEAD'
New-Item -ItemType Directory -Force -Path $headOriginal,$deployedBase | Out-Null

$backupRoot = Join-Path $env:USERPROFILE 'Documents\CampusVirtual\AppsScriptPROD\Backups'
$backup = Join-Path $backupRoot ('PROD_PROFORMA_EQUIPO_FROM_DEPLOYED_' + $stamp)
$pushAttempted = $false
$deploymentChanged = $false
$headRestored = $false
$success = $false
$newVersion = $null

try {
  # Leer y respaldar el HEAD actual aunque no coincida con PROD.
  Invoke-ClaspCommand -CommandArgs @('clone-script',$ProdScriptId) -WorkDir $headOriginal | Out-Null
  New-Item -ItemType Directory -Force -Path $backup | Out-Null
  Copy-ClaspProject -Source $headOriginal -Destination (Join-Path $backup 'HEAD_ORIGINAL')
  Write-Host ('Backup HEAD original: ' + (Join-Path $backup 'HEAD_ORIGINAL'))

  # La base del hotfix es exactamente la version inmutable que atiende produccion.
  Invoke-ClaspCommand -CommandArgs @('clone-script',$ProdScriptId,[string]$deployedVersion) -WorkDir $deployedBase | Out-Null
  Copy-ClaspProject -Source $deployedBase -Destination (Join-Path $backup ('DEPLOYED_' + $deployedVersion))
  Copy-ClaspProject -Source $deployedBase -Destination $patchedWork
  Write-Host ('PASS base segura: deployment @' + $deployedVersion)

  $old = @"
function _decidirPlantillaEquipo(equipo) {
  var e = String(equipo).toUpperCase().trim();
  if (e === 'PREMIUM' || e === 'PLAN PREMIUM' || e === 'PLAN_PREMIUM') return 'PLAN PREMIUM';
  if (e === 'BASICO'  || e === 'PLAN BASICO'  || e === 'PLAN_BASICO')  return 'PLAN BASICO';
  return null; // sin equipo
}
"@

  $new = @"
function _decidirPlantillaEquipo(equipo) {
  var e = String(equipo || '').toUpperCase().trim();
  if (e === 'LAPTOP_360' || e === 'PREMIUM' || e === 'PLAN PREMIUM' || e === 'PLAN_PREMIUM') return 'PLAN PREMIUM';
  if (e === 'LAPTOP_319' || e === 'BASICO'  || e === 'PLAN BASICO'  || e === 'PLAN_BASICO')  return 'PLAN BASICO';
  return null; // sin equipo
}
"@

  $target = Find-EquipoHelperFile -Root $patchedWork
  $src = Read-Utf8TextStrict -Path $target
  $srcNorm = $src.Replace("`r`n","`n")
  $oldNorm = $old.Trim().Replace("`r`n","`n")
  $newNorm = $new.Trim().Replace("`r`n","`n")

  if ($srcNorm.Contains("e === 'LAPTOP_360'") -and $srcNorm.Contains("e === 'LAPTOP_319'")) {
    throw "PROD @$deployedVersion ya contiene ambos aliases; no se despliega nada."
  }
  if (-not $srcNorm.Contains($oldNorm)) { throw 'La preimagen exacta del helper no coincide en la version desplegada. No se toca produccion.' }

  $newline = if ($src.Contains("`r`n")) { "`r`n" } else { "`n" }
  $patchedNorm = $srcNorm.Replace($oldNorm,$newNorm)
  $patched = if ($newline -eq "`r`n") { $patchedNorm.Replace("`n","`r`n") } else { $patchedNorm }
  Write-Utf8TextPreserveBom -Path $target -Text $patched

  $verifyLocal = Read-Utf8TextStrict -Path $target
  if (-not ($verifyLocal.Contains("e === 'LAPTOP_360'") -and $verifyLocal.Contains("e === 'LAPTOP_319'"))) { throw 'Verificacion local del parche fallo.' }

  $baseHashes = Get-ProjectHashes -Root $deployedBase
  $patchedHashes = Get-ProjectHashes -Root $patchedWork
  $changed = @()
  foreach ($k in @($baseHashes.Keys + $patchedHashes.Keys | Sort-Object -Unique)) {
    if (-not $baseHashes.ContainsKey($k) -or -not $patchedHashes.ContainsKey($k) -or $baseHashes[$k] -ne $patchedHashes[$k]) { $changed += $k }
  }
  if ($changed.Count -ne 1) { throw "El parche cambio $($changed.Count) archivos; esperado 1.`n$($changed -join "`n")" }

  Write-Host ('PASS patch unico: ' + $changed[0])
  Write-Host 'PASS mapping: LAPTOP_360 -> PLAN PREMIUM'
  Write-Host 'PASS mapping: LAPTOP_319 -> PLAN BASICO'

  # Ventana controlada: subir base desplegada + parche, versionar y redeployar.
  # Marcar intento ANTES del push: un fallo del cliente podria ocurrir despues de una escritura parcial.
  $pushAttempted = $true
  Invoke-ClaspCommand -CommandArgs @('push','--force') -WorkDir $patchedWork | Out-Null
  Write-Host 'PASS push temporal desde PROD desplegado + parche'

  $desc = 'HOTFIX proformas equipo LAPTOP_319/LAPTOP_360 ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  $versionOut = Invoke-ClaspCommand -CommandArgs @('create-version',$desc) -WorkDir $patchedWork
  $vm = [regex]::Match($versionOut,'(?i)version\D+(\d+)\b')
  if (-not $vm.Success) { throw "No pude extraer la version creada:`n$versionOut" }
  $newVersion = [int]$vm.Groups[1].Value
  Write-Host ('Version nueva: ' + $newVersion)

  Invoke-ClaspCommand -CommandArgs @('create-deployment','--versionNumber',[string]$newVersion,'--description',$desc,'--deploymentId',$ProdDeploymentId) -WorkDir $patchedWork | Out-Null
  $after = Get-DeploymentState -ScriptId $ProdScriptId -DeploymentId $ProdDeploymentId
  if ($after.Version -ne $newVersion) { throw "Redeploy no confirmado. Esperado @$newVersion; observado @$($after.Version)." }
  $deploymentChanged = $true
  Write-Host ('PASS redeploy mismo ID -> @' + $newVersion)

  New-Item -ItemType Directory -Force -Path $verifyVersion | Out-Null
  Invoke-ClaspCommand -CommandArgs @('clone-script',$ProdScriptId,[string]$newVersion) -WorkDir $verifyVersion | Out-Null
  Assert-ProjectParity -LeftRoot $patchedWork -RightRoot $verifyVersion -Label ('Version remota @' + $newVersion)
  $verifyTarget = Find-EquipoHelperFile -Root $verifyVersion
  $remoteText = Read-Utf8TextStrict -Path $verifyTarget
  if (-not ($remoteText.Contains("e === 'LAPTOP_360'") -and $remoteText.Contains("e === 'LAPTOP_319'"))) { throw 'La version remota no contiene ambos aliases.' }
  Write-Host ('PASS verificacion remota @' + $newVersion)

  # Restaurar el HEAD no publicado exactamente como estaba antes.
  Invoke-ClaspCommand -CommandArgs @('push','--force') -WorkDir $headOriginal | Out-Null
  New-Item -ItemType Directory -Force -Path $verifyHead | Out-Null
  Invoke-ClaspCommand -CommandArgs @('clone-script',$ProdScriptId) -WorkDir $verifyHead | Out-Null
  Assert-ProjectParity -LeftRoot $headOriginal -RightRoot $verifyHead -Label 'Restauracion HEAD'
  $headRestored = $true
  Write-Host 'PASS HEAD original restaurado byte-logicamente'

  # El restore de HEAD no debe mover el deployment inmutable.
  $finalState = Get-DeploymentState -ScriptId $ProdScriptId -DeploymentId $ProdDeploymentId
  if ($finalState.Version -ne $newVersion) { throw "El deployment cambio durante restore de HEAD. Esperado @$newVersion; observado @$($finalState.Version)." }

  $success = $true
  Write-Host '=== RESULTADO ==='
  Write-Host 'PASS - backend PROD actualizado sin publicar los cambios pendientes de HEAD.'
  Write-Host ('Deployment: ' + $ProdDeploymentId)
  Write-Host ('Version anterior: ' + $deployedVersion)
  Write-Host ('Version nueva: ' + $newVersion)
  Write-Host 'HEAD no publicado: restaurado exactamente al estado previo.'
  Write-Host ('Backup: ' + $backup)
  Write-Host 'Siguiente prueba: Marchena -> Proforma del Equipo LAPTOP_360.'
}
catch {
  $original = $_
  Write-Host ('ERROR: ' + $original.Exception.Message)

  if ($pushAttempted -and -not $success) {
    Write-Host 'Iniciando recuperacion preventiva...'

    try {
      $state = Get-DeploymentState -ScriptId $ProdScriptId -DeploymentId $ProdDeploymentId
      if ($state.Version -ne $deployedVersion) {
        Invoke-ClaspCommand -CommandArgs @('create-deployment','--versionNumber',[string]$deployedVersion,'--description',('ROLLBACK hotfix proformas ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')),'--deploymentId',$ProdDeploymentId) -WorkDir $patchedWork | Out-Null
        $rolled = Get-DeploymentState -ScriptId $ProdScriptId -DeploymentId $ProdDeploymentId
        if ($rolled.Version -ne $deployedVersion) { throw "Rollback no confirmado; observado @$($rolled.Version)." }
        Write-Host ('PASS rollback deployment -> @' + $deployedVersion)
      }
      else {
        Write-Host ('PASS deployment sigue en @' + $deployedVersion)
      }
    }
    catch { Write-Host ('ALERTA rollback deployment: ' + $_.Exception.Message) }

    try {
      $recoveryCheck = Join-Path $root 'RECOVERY_HEAD_CHECK'
      New-Item -ItemType Directory -Force -Path $recoveryCheck | Out-Null
      Invoke-ClaspCommand -CommandArgs @('clone-script',$ProdScriptId) -WorkDir $recoveryCheck | Out-Null
      try {
        Assert-ProjectParity -LeftRoot $headOriginal -RightRoot $recoveryCheck -Label 'HEAD tras push fallido'
        Write-Host 'PASS HEAD remoto no cambio tras el push fallido'
      }
      catch {
        Write-Host 'HEAD remoto difiere; restaurando HEAD original...'
        Invoke-ClaspCommand -CommandArgs @('push','--force') -WorkDir $headOriginal | Out-Null
        $restoreCheck = Join-Path $root 'RESTORE_CHECK'
        New-Item -ItemType Directory -Force -Path $restoreCheck | Out-Null
        Invoke-ClaspCommand -CommandArgs @('clone-script',$ProdScriptId) -WorkDir $restoreCheck | Out-Null
        Assert-ProjectParity -LeftRoot $headOriginal -RightRoot $restoreCheck -Label 'Restore HEAD de emergencia'
        Write-Host 'PASS restore HEAD original de emergencia'
      }
    }
    catch { Write-Host ('ALERTA restore HEAD: ' + $_.Exception.Message) }
  }

  throw $original
}
finally {
  if (Test-Path $root) { Remove-Item -LiteralPath $root -Recurse -Force -ErrorAction SilentlyContinue }
}