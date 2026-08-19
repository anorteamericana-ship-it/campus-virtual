param(
  [string]$ProdDeploymentId = 'AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ',
  [string]$ProdScriptId = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-ClaspCommand {
  param([string[]]$Args, [string]$WorkDir)
  Push-Location $WorkDir
  try {
    $out = & clasp @Args 2>&1
    $code = $LASTEXITCODE
    $text = ($out | Out-String).TrimEnd()
    if ($code -ne 0) { throw "clasp $($Args -join ' ') fallo ($code):`n$text" }
    return $text
  } finally { Pop-Location }
}

function Try-ClaspCommand {
  param([string[]]$Primary, [string[]]$Fallback, [string]$WorkDir)
  try { return Invoke-ClaspCommand -Args $Primary -WorkDir $WorkDir }
  catch { return Invoke-ClaspCommand -Args $Fallback -WorkDir $WorkDir }
}

function Get-DeploymentsText([string]$Dir) {
  return Try-ClaspCommand -Primary @('deployments') -Fallback @('list-deployments') -WorkDir $Dir
}

function Get-ScriptIdFromClaspJson([string]$Path) {
  try {
    $j = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
    return [string]$j.scriptId
  } catch { return '' }
}

function Probe-ScriptDeployment([string]$ScriptId, [string]$DeploymentId) {
  if (-not $ScriptId) { return $false }
  $probe = Join-Path $env:TEMP ('campus-prod-probe-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Force -Path $probe | Out-Null
  try {
    @{ scriptId = $ScriptId } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $probe '.clasp.json') -Encoding UTF8
    $d = Get-DeploymentsText $probe
    return $d -match [regex]::Escape($DeploymentId)
  } catch { return $false }
  finally { Remove-Item -LiteralPath $probe -Recurse -Force -ErrorAction SilentlyContinue }
}

Write-Host '=== HOTFIX PROD · PROFORMAS EQUIPO 319/360 ==='
Write-Host ('Deployment PROD: ' + $ProdDeploymentId)

if (-not (Get-Command clasp -ErrorAction SilentlyContinue)) {
  throw 'clasp no esta disponible en PATH.'
}

# 1) Resolver Script ID sin tocar ningun proyecto local.
if (-not $ProdScriptId) {
  $roots = @(
    (Join-Path $env:USERPROFILE 'Documents\CampusVirtual'),
    (Resolve-Path (Join-Path $PSScriptRoot '..') -ErrorAction SilentlyContinue | ForEach-Object Path)
  ) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique

  foreach ($root in $roots) {
    $claspFiles = Get-ChildItem -Path $root -Filter '.clasp.json' -File -Recurse -ErrorAction SilentlyContinue
    foreach ($cf in $claspFiles) {
      $sid = Get-ScriptIdFromClaspJson $cf.FullName
      if ($sid -and (Probe-ScriptDeployment -ScriptId $sid -DeploymentId $ProdDeploymentId)) {
        $ProdScriptId = $sid
        break
      }
    }
    if ($ProdScriptId) { break }
  }
}

if (-not $ProdScriptId) {
  throw 'No pude autodetectar el Script ID de produccion. Ejecuta de nuevo con -ProdScriptId <ID>.'
}

Write-Host ('Script ID PROD detectado: ' + $ProdScriptId)

# 2) Clonar remoto en carpeta temporal aislada.
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$work = Join-Path $env:TEMP ('campus-prod-proforma-hotfix-' + $stamp)
New-Item -ItemType Directory -Force -Path $work | Out-Null

try {
  Push-Location $work
  try {
    try { $cloneOut = & clasp clone $ProdScriptId 2>&1; if ($LASTEXITCODE -ne 0) { throw ($cloneOut | Out-String) } }
    catch { $cloneOut = & clasp clone-script $ProdScriptId 2>&1; if ($LASTEXITCODE -ne 0) { throw ($cloneOut | Out-String) } }
  } finally { Pop-Location }

  $deps = Get-DeploymentsText $work
  if ($deps -notmatch [regex]::Escape($ProdDeploymentId)) {
    throw 'El Script ID encontrado no contiene el deployment PROD esperado. Abortando.'
  }

  # 3) Backup completo del remoto antes de modificar.
  $backupRoot = Join-Path $env:USERPROFILE 'Documents\CampusVirtual\AppsScriptPROD\Backups'
  $backup = Join-Path $backupRoot ('PROD_PROFORMA_EQUIPO_' + $stamp)
  New-Item -ItemType Directory -Force -Path $backup | Out-Null
  Copy-Item -Path (Join-Path $work '*') -Destination $backup -Recurse -Force
  Copy-Item -LiteralPath (Join-Path $work '.clasp.json') -Destination $backup -Force -ErrorAction SilentlyContinue
  Write-Host ('Backup PROD: ' + $backup)

  # 4) Parche fail-closed: exactamente una funcion objetivo.
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

  $targets = @()
  Get-ChildItem -Path $work -Filter '*.gs' -File -Recurse | ForEach-Object {
    $txt = Get-Content -LiteralPath $_.FullName -Raw
    if ($txt.Contains('function _decidirPlantillaEquipo')) { $targets += $_.FullName }
  }
  if ($targets.Count -ne 1) { throw "Esperaba 1 archivo con _decidirPlantillaEquipo y encontre $($targets.Count)." }

  $target = $targets[0]
  $src = Get-Content -LiteralPath $target -Raw
  if ($src.Contains("e === 'LAPTOP_360'") -and $src.Contains("e === 'LAPTOP_319'")) {
    Write-Host 'El remoto ya contiene el hotfix 319/360. No se modifica ni despliega.'
    exit 0
  }
  if (-not $src.Contains($old.Trim())) {
    throw 'La preimagen exacta del helper no coincide. No se toca produccion.'
  }

  $patched = $src.Replace($old.Trim(), $new.Trim())
  [System.IO.File]::WriteAllText($target, $patched, [System.Text.UTF8Encoding]::new($false))

  $verify = Get-Content -LiteralPath $target -Raw
  if (-not ($verify.Contains("e === 'LAPTOP_360'") -and $verify.Contains("e === 'LAPTOP_319'"))) {
    throw 'Verificacion estatica del parche fallo.'
  }
  Write-Host ('PASS patch: ' + [System.IO.Path]::GetFileName($target))
  Write-Host 'PASS mapping: LAPTOP_360 -> PLAN PREMIUM'
  Write-Host 'PASS mapping: LAPTOP_319 -> PLAN BASICO'

  # 5) Push + version + redeploy sobre EL MISMO deployment.
  $push = Invoke-ClaspCommand -Args @('push','--force') -WorkDir $work
  Write-Host 'PASS clasp push --force'

  $desc = 'HOTFIX proformas equipo LAPTOP_319/LAPTOP_360 ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  $versionOut = Try-ClaspCommand -Primary @('version',$desc) -Fallback @('create-version',$desc) -WorkDir $work
  $m = [regex]::Match($versionOut, '(?i)version\D+(\d+)')
  if (-not $m.Success) { throw "No pude extraer version creada:`n$versionOut" }
  $version = $m.Groups[1].Value
  Write-Host ('Version nueva: ' + $version)

  $deployOut = Try-ClaspCommand \
    -Primary @('deploy','--versionNumber',$version,'--description',$desc,'--deploymentId',$ProdDeploymentId) \
    -Fallback @('create-deployment','--versionNumber',$version,'--description',$desc,'--deploymentId',$ProdDeploymentId) \
    -WorkDir $work

  if ($deployOut -notmatch [regex]::Escape($ProdDeploymentId)) {
    throw "El redeploy no devolvio el deployment esperado:`n$deployOut"
  }

  Write-Host '=== RESULTADO ==='
  Write-Host 'PASS - backend PROD actualizado sobre el mismo deployment.'
  Write-Host ('Deployment: ' + $ProdDeploymentId)
  Write-Host ('Version: ' + $version)
  Write-Host 'Siguiente prueba: abrir Marchena y generar Proforma del Equipo LAPTOP_360.'
}
finally {
  if (Test-Path $work) { Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue }
}
