param(
  [string]$ProdDeploymentId = 'AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ',
  [string]$ProdScriptId = '1kV4wKnD_OU5DPQSawScjPsUbo1MOg_rAHbtpYupSMPkqywIVSQwdV4y2'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-ClaspCommand {
  param(
    [string[]]$CommandArgs,
    [string]$WorkDir
  )

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

  $probe = Join-Path $env:TEMP ('campus-prod-probe-' + [guid]::NewGuid().ToString('N'))
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
  param(
    [string]$ScriptId,
    [string]$DeploymentId
  )

  $probe = New-ClaspProbe -ScriptId $ScriptId
  try {
    # clasp 3.3.x: usar el comando canonico actual, sin autodeteccion ni alias.
    $text = Invoke-ClaspCommand -CommandArgs @('list-deployments') -WorkDir $probe
    $line = ($text -split "`r?`n" | Where-Object {
      $_ -match [regex]::Escape($DeploymentId)
    } | Select-Object -First 1)

    if (-not $line) {
      throw "El Script ID no contiene el deployment PROD esperado.`n$text"
    }

    $versionMatch = [regex]::Match($line, '@(\d+)\b')
    if (-not $versionMatch.Success) {
      throw "El deployment PROD no apunta a una version numerica inmutable: $line"
    }

    return [pscustomobject]@{
      Text = $text
      Line = $line
      Version = [int]$versionMatch.Groups[1].Value
    }
  }
  finally {
    Remove-Item -LiteralPath $probe -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Get-ProjectHashes {
  param([string]$Root)

  $allowed = @('.gs', '.js', '.html', '.json')
  $map = @{}

  Get-ChildItem -LiteralPath $Root -File -Recurse | ForEach-Object {
    if ($_.Name -eq '.clasp.json') { return }
    if ($allowed -notcontains $_.Extension.ToLowerInvariant()) { return }

    $relative = $_.FullName.Substring($Root.Length).TrimStart('\', '/')
    $text = Get-Content -LiteralPath $_.FullName -Raw
    $normalized = $text.Replace("`r`n", "`n")
    $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes($normalized)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
      $hashBytes = $sha.ComputeHash($bytes)
      $hash = ([System.BitConverter]::ToString($hashBytes)).Replace('-', '').ToLowerInvariant()
    }
    finally {
      $sha.Dispose()
    }
    $map[$relative] = $hash
  }

  return $map
}

function Assert-ProjectParity {
  param(
    [string]$HeadRoot,
    [string]$DeployedRoot,
    [int]$DeployedVersion
  )

  $head = Get-ProjectHashes -Root $HeadRoot
  $deployed = Get-ProjectHashes -Root $DeployedRoot
  $keys = @($head.Keys + $deployed.Keys | Sort-Object -Unique)
  $diffs = @()

  foreach ($key in $keys) {
    if (-not $head.ContainsKey($key)) {
      $diffs += "solo deployed@$DeployedVersion : $key"
      continue
    }
    if (-not $deployed.ContainsKey($key)) {
      $diffs += "solo HEAD : $key"
      continue
    }
    if ($head[$key] -ne $deployed[$key]) {
      $diffs += "contenido distinto : $key"
    }
  }

  if ($diffs.Count -gt 0) {
    $detail = ($diffs | Select-Object -First 30) -join "`n"
    throw "HEAD difiere del deployment PROD @$DeployedVersion. No es seguro hacer push/redeploy automatico.`n$detail"
  }
}

function Find-EquipoHelperFile {
  param([string]$Root)

  $targets = @()
  Get-ChildItem -LiteralPath $Root -File -Recurse | Where-Object {
    $_.Extension -in @('.gs', '.js')
  } | ForEach-Object {
    $txt = Get-Content -LiteralPath $_.FullName -Raw
    if ($txt.Contains('function _decidirPlantillaEquipo')) {
      $targets += $_.FullName
    }
  }

  if ($targets.Count -ne 1) {
    throw "Esperaba exactamente 1 archivo con _decidirPlantillaEquipo y encontre $($targets.Count)."
  }

  return $targets[0]
}

Write-Host '=== HOTFIX PROD - PROFORMAS EQUIPO 319/360 ==='
Write-Host ('Script PROD: ' + $ProdScriptId)
Write-Host ('Deployment PROD: ' + $ProdDeploymentId)

if (-not (Get-Command clasp -ErrorAction SilentlyContinue)) {
  throw 'clasp no esta disponible en PATH.'
}

$claspVersion = (& clasp --version 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0) {
  throw 'No pude leer la version de clasp.'
}
Write-Host ('clasp: ' + $claspVersion)

# 1) Identidad PROD + version desplegada actual.
$before = Get-DeploymentState -ScriptId $ProdScriptId -DeploymentId $ProdDeploymentId
$deployedVersion = $before.Version
Write-Host ('PASS identidad PROD - deployment actual @' + $deployedVersion)

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$workRoot = Join-Path $env:TEMP ('campus-prod-proforma-hotfix-' + $stamp)
$headDir = Join-Path $workRoot 'HEAD'
$deployedDir = Join-Path $workRoot ('DEPLOYED_' + $deployedVersion)
$verifyDir = Join-Path $workRoot 'VERIFY'
New-Item -ItemType Directory -Force -Path $headDir, $deployedDir | Out-Null

$backup = $null
$pushed = $false
$deploymentChanged = $false
$success = $false
$newVersion = $null

try {
  # 2) Clonar HEAD y la version realmente desplegada. Si difieren, abortar.
  Invoke-ClaspCommand -CommandArgs @('clone-script', $ProdScriptId) -WorkDir $headDir | Out-Null
  Invoke-ClaspCommand -CommandArgs @('clone-script', $ProdScriptId, [string]$deployedVersion) -WorkDir $deployedDir | Out-Null

  # Backup completo de HEAD antes de cualquier escritura remota.
  $backupRoot = Join-Path $env:USERPROFILE 'Documents\CampusVirtual\AppsScriptPROD\Backups'
  $backup = Join-Path $backupRoot ('PROD_PROFORMA_EQUIPO_' + $stamp)
  New-Item -ItemType Directory -Force -Path $backup | Out-Null
  Copy-Item -Path (Join-Path $headDir '*') -Destination $backup -Recurse -Force
  Copy-Item -LiteralPath (Join-Path $headDir '.clasp.json') -Destination $backup -Force
  Write-Host ('Backup PROD HEAD: ' + $backup)

  Assert-ProjectParity -HeadRoot $headDir -DeployedRoot $deployedDir -DeployedVersion $deployedVersion
  Write-Host ('PASS paridad: HEAD == deployment @' + $deployedVersion)

  # 3) Parche fail-closed sobre una unica funcion.
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

  $target = Find-EquipoHelperFile -Root $headDir
  $src = Get-Content -LiteralPath $target -Raw
  $srcNorm = $src.Replace("`r`n", "`n")
  $oldNorm = $old.Trim().Replace("`r`n", "`n")
  $newNorm = $new.Trim().Replace("`r`n", "`n")

  if ($srcNorm.Contains("e === 'LAPTOP_360'") -and $srcNorm.Contains("e === 'LAPTOP_319'")) {
    throw "El deployment PROD @$deployedVersion ya contiene ambos aliases. No se despliega nada: el error de runtime tiene otra causa."
  }

  if (-not $srcNorm.Contains($oldNorm)) {
    throw 'La preimagen exacta del helper no coincide. No se toca produccion.'
  }

  $newline = if ($src.Contains("`r`n")) { "`r`n" } else { "`n" }
  $patchedNorm = $srcNorm.Replace($oldNorm, $newNorm)
  $patched = if ($newline -eq "`r`n") { $patchedNorm.Replace("`n", "`r`n") } else { $patchedNorm }
  [System.IO.File]::WriteAllText($target, $patched, [System.Text.UTF8Encoding]::new($false))

  $verifyLocal = Get-Content -LiteralPath $target -Raw
  if (-not ($verifyLocal.Contains("e === 'LAPTOP_360'") -and $verifyLocal.Contains("e === 'LAPTOP_319'"))) {
    throw 'Verificacion estatica local del parche fallo.'
  }

  Write-Host ('PASS patch: ' + [System.IO.Path]::GetFileName($target))
  Write-Host 'PASS mapping: LAPTOP_360 -> PLAN PREMIUM'
  Write-Host 'PASS mapping: LAPTOP_319 -> PLAN BASICO'

  # 4) Push de HEAD clonado y verificado. clasp push reemplaza el proyecto completo,
  # por eso la compuerta de paridad anterior es obligatoria.
  Invoke-ClaspCommand -CommandArgs @('push', '--force') -WorkDir $headDir | Out-Null
  $pushed = $true
  Write-Host 'PASS clasp push --force'

  # 5) Crear version inmutable y actualizar EL MISMO deployment.
  $desc = 'HOTFIX proformas equipo LAPTOP_319/LAPTOP_360 ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  $versionOut = Invoke-ClaspCommand -CommandArgs @('create-version', $desc) -WorkDir $headDir
  $vm = [regex]::Match($versionOut, '(?i)version\D+(\d+)\b')
  if (-not $vm.Success) {
    throw "No pude extraer la version creada:`n$versionOut"
  }
  $newVersion = [int]$vm.Groups[1].Value
  Write-Host ('Version nueva: ' + $newVersion)

  $deployOut = Invoke-ClaspCommand -CommandArgs @(
    'create-deployment',
    '--versionNumber', [string]$newVersion,
    '--description', $desc,
    '--deploymentId', $ProdDeploymentId
  ) -WorkDir $headDir

  # No confiamos solo en el texto del comando: releemos el estado remoto.
  $after = Get-DeploymentState -ScriptId $ProdScriptId -DeploymentId $ProdDeploymentId
  if ($after.Version -ne $newVersion) {
    throw "El deployment no quedo en la nueva version. Esperado @$newVersion; observado @$($after.Version).`n$deployOut"
  }
  $deploymentChanged = $true
  Write-Host ('PASS redeploy mismo ID -> @' + $newVersion)

  # 6) Verificacion remota de la version que acabamos de desplegar.
  New-Item -ItemType Directory -Force -Path $verifyDir | Out-Null
  Invoke-ClaspCommand -CommandArgs @('clone-script', $ProdScriptId, [string]$newVersion) -WorkDir $verifyDir | Out-Null
  $verifyTarget = Find-EquipoHelperFile -Root $verifyDir
  $verifyRemote = Get-Content -LiteralPath $verifyTarget -Raw
  if (-not ($verifyRemote.Contains("e === 'LAPTOP_360'") -and $verifyRemote.Contains("e === 'LAPTOP_319'"))) {
    throw 'La version desplegada no contiene ambos aliases esperados.'
  }
  Write-Host ('PASS verificacion remota version @' + $newVersion)

  $success = $true
  Write-Host '=== RESULTADO ==='
  Write-Host 'PASS - backend PROD actualizado sobre el mismo deployment.'
  Write-Host ('Deployment: ' + $ProdDeploymentId)
  Write-Host ('Version anterior: ' + $deployedVersion)
  Write-Host ('Version nueva: ' + $newVersion)
  Write-Host 'Siguiente prueba: abrir Marchena y generar Proforma del Equipo LAPTOP_360.'
}
catch {
  $originalError = $_
  Write-Host ('ERROR: ' + $originalError.Exception.Message)

  if ($pushed -and -not $success) {
    Write-Host 'Iniciando rollback preventivo...'

    try {
      $stateNow = Get-DeploymentState -ScriptId $ProdScriptId -DeploymentId $ProdDeploymentId
      if ($stateNow.Version -ne $deployedVersion) {
        $rollbackDesc = 'ROLLBACK hotfix proformas equipo ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
        Invoke-ClaspCommand -CommandArgs @(
          'create-deployment',
          '--versionNumber', [string]$deployedVersion,
          '--description', $rollbackDesc,
          '--deploymentId', $ProdDeploymentId
        ) -WorkDir $headDir | Out-Null

        $rolled = Get-DeploymentState -ScriptId $ProdScriptId -DeploymentId $ProdDeploymentId
        if ($rolled.Version -ne $deployedVersion) {
          throw "Rollback de deployment no confirmado: observado @$($rolled.Version)."
        }
        Write-Host ('PASS rollback deployment -> @' + $deployedVersion)
      }
    }
    catch {
      Write-Host ('ALERTA: fallo rollback deployment: ' + $_.Exception.Message)
    }

    if ($backup -and (Test-Path $backup)) {
      try {
        Invoke-ClaspCommand -CommandArgs @('push', '--force') -WorkDir $backup | Out-Null
        Write-Host 'PASS rollback HEAD desde backup.'
      }
      catch {
        Write-Host ('ALERTA: fallo rollback HEAD: ' + $_.Exception.Message)
      }
    }
  }

  throw $originalError
}
finally {
  if (Test-Path $workRoot) {
    Remove-Item -LiteralPath $workRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
