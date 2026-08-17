[CmdletBinding()]
param(
  [switch]$Apply,
  [switch]$KeepWorkDir,
  [string]$BackupRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'CampusVirtual\AppsScriptQA\Backups')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$QaScriptId     = '1GMHihGwnX_-sIS101rRlUoYpAH2HSKyms8lx6L9z7bjb_45YDn-ph6WD'
$QaDeploymentId = 'AKfycbzzsmmHVRGlgltcUJf7Yi9R0z__vsu58Hw9Gq9rNn5pYVrgY5iZ0-xEEL-8wqL4uPVbaw'
$QaExecUrl      = "https://script.google.com/macros/s/$QaDeploymentId/exec"
$RepoUrl        = 'https://github.com/anorteamericana-ship-it/campus-virtual.git'
$RepoRef        = 'fix/sec002-private-document-foundation'
$ClaspVersion   = '3.3.0'
$ProdDeploymentId = 'AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ'

$Started = Get-Date
$Stamp = $Started.ToString('yyyyMMdd_HHmmss')
$WorkRoot = Join-Path ([IO.Path]::GetTempPath()) "campus_apps_script_qa_sec002_modular_$Stamp"
$RepoDir = Join-Path $WorkRoot 'repo'
$AppsDir = Join-Path $WorkRoot 'apps-script-current'
$VerifyDir = Join-Path $WorkRoot 'apps-script-verify'
$BackupDir = Join-Path $BackupRoot "QA_SEC002_MODULAR_$Stamp"
$BackupSource = Join-Path $BackupDir 'source-before'
$ReportPath = Join-Path $BackupDir 'install-report.json'
$RebaseReport = Join-Path $BackupDir 'modular-rebase-report.json'
$RemoteChanged = $false

function Write-Step([string]$Text) { Write-Host "`n=== $Text ===" -ForegroundColor Cyan }
function Fail([string]$Text) { throw $Text }

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
    [switch]$AllowFailure
  )
  $old = Get-Location
  try {
    if ($WorkingDirectory) { Set-Location $WorkingDirectory }
    $output = & $FilePath @Arguments 2>&1
    $code = $LASTEXITCODE
    if ($null -ne $output) { $output | ForEach-Object { Write-Host $_ } }
    if ($code -ne 0 -and -not $AllowFailure) {
      throw "Command failed ($code): $FilePath $($Arguments -join ' ')"
    }
    return [pscustomobject]@{ Code=$code; Text=($output -join [Environment]::NewLine) }
  }
  finally { Set-Location $old }
}

$GitExe = Find-CommandPath @('git.exe','git')
$NodeExe = Find-CommandPath @('node.exe','node')
$NpxExe = Find-CommandPath @('npx.cmd','npx.exe','npx')
if (-not $GitExe) { Fail 'Git no esta instalado o no esta en PATH.' }
if (-not $NodeExe) { Fail 'Node.js no esta instalado o no esta en PATH.' }
if (-not $NpxExe) { Fail 'npx no esta instalado o no esta en PATH.' }

function Invoke-Clasp {
  param([string[]]$Arguments, [string]$WorkingDirectory = '', [switch]$AllowFailure)
  $all = @('--yes', "@google/clasp@$ClaspVersion") + $Arguments
  return Invoke-Native -FilePath $NpxExe -Arguments $all -WorkingDirectory $WorkingDirectory -AllowFailure:$AllowFailure
}

function Get-Sha256([string]$Path) {
  return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
}

function Get-RelativePathCompat([string]$Root, [string]$FullName) {
  $rootFull = [IO.Path]::GetFullPath($Root).TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar
  $fileFull = [IO.Path]::GetFullPath($FullName)
  if (-not $fileFull.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) { Fail "Path fuera de raiz: $fileFull" }
  return $fileFull.Substring($rootFull.Length).Replace('\','/')
}

function Get-ProjectSourceMap([string]$Root) {
  $map = @{}
  $files = @(Get-ChildItem -LiteralPath $Root -Recurse -File | Where-Object {
    $_.Name -eq 'appsscript.json' -or $_.Extension.ToLowerInvariant() -in @('.js','.gs','.html')
  })
  foreach ($file in $files) {
    $rel = Get-RelativePathCompat $Root $file.FullName
    $map[$rel] = Get-Sha256 $file.FullName
  }
  return $map
}

function Compare-MapExact([hashtable]$Expected, [hashtable]$Observed) {
  $all = @($Expected.Keys + $Observed.Keys | Sort-Object -Unique)
  $bad = @()
  foreach ($rel in $all) {
    $e = if ($Expected.ContainsKey($rel)) { $Expected[$rel] } else { '<missing>' }
    $o = if ($Observed.ContainsKey($rel)) { $Observed[$rel] } else { '<missing>' }
    if ($e -ne $o) { $bad += [pscustomobject]@{ path=$rel; expected=$e; observed=$o } }
  }
  return @($bad)
}

function Clone-AppsScriptProject([string]$Destination) {
  if (Test-Path $Destination) { Remove-Item -LiteralPath $Destination -Recurse -Force }
  New-Item -ItemType Directory -Path $Destination -Force | Out-Null
  $r = Invoke-Clasp -Arguments @('clone-script', $QaScriptId) -WorkingDirectory $Destination
  if ($r.Code -ne 0) { Fail 'clasp clone-script fallo.' }
  if (-not (Test-Path (Join-Path $Destination '.clasp.json'))) { Fail "Clone QA incompleto: falta .clasp.json en $Destination" }
}

function Test-QaRoutes {
  $routes = @(
    'descargarMiCertificadoPrivado',
    'descargarDocumentoExtraPrivado',
    'descargarComprobantePagoPrivado',
    'descargarMatriculaFirmadaPrivada'
  )
  $failures = @()
  foreach ($fn in $routes) {
    try {
      $body = @{ fn=$fn; token='SEC002_INVALID_TOKEN_SMOKE' } | ConvertTo-Json -Compress
      $uri = "${QaExecUrl}?fn=$([Uri]::EscapeDataString($fn))"
      $raw = Invoke-WebRequest -UseBasicParsing -Method Post -Uri $uri -ContentType 'text/plain;charset=utf-8' -Body $body -TimeoutSec 30
      $text = [string]$raw.Content
      if (-not $text.Trim().StartsWith('{')) { throw 'respuesta no JSON' }
      $obj = $text | ConvertFrom-Json
      $joined = (($obj | ConvertTo-Json -Compress -Depth 8) + '').ToLowerInvariant()
      if ($joined -match 'funci[oÃ³]n post no reconocida|function.*not.*recognized|unknown.*function') { throw 'ruta no reconocida' }
      Write-Host "PASS route smoke $fn -> JSON/rechazo autenticado"
    } catch { $failures += "$fn :: $($_.Exception.Message)" }
  }
  if (@($failures).Count -gt 0) { Fail ('Smoke QA fallo: ' + ($failures -join ' | ')) }
}

function Restore-BackupAndRedeploy {
  Write-Host 'ROLLBACK: restaurando snapshot modular anterior...' -ForegroundColor Yellow
  if (-not (Test-Path (Join-Path $BackupSource '.clasp.json'))) { throw 'Rollback imposible: backup no contiene .clasp.json' }
  Invoke-Clasp -Arguments @('push','--force') -WorkingDirectory $BackupSource | Out-Null
  Invoke-Clasp -Arguments @('create-deployment','--deploymentId',$QaDeploymentId,'--description',"ROLLBACK SEC002 MODULAR $Stamp") -WorkingDirectory $BackupSource | Out-Null
  Write-Host 'ROLLBACK: source modular anterior restaurado y misma deploymentId QA redeployada.' -ForegroundColor Yellow
}

New-Item -ItemType Directory -Path $WorkRoot -Force | Out-Null
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

$report = [ordered]@{
  started=(Get-Date).ToString('o'); apply_requested=[bool]$Apply; qa_script_id=$QaScriptId; qa_deployment_id=$QaDeploymentId;
  qa_exec_url=$QaExecUrl; repo_ref=$RepoRef; clasp_version=$ClaspVersion; backup_dir=$BackupDir;
  project_mode='MODULAR'; source_files_before=0; changed_files=@(); smoke='NOT_RUN'; result='STARTED'; error=$null
}

try {
  Write-Step '1/11 Â· Obtener rama SEC-002 y ejecutar guards'
  $cloneRepo = Invoke-Native -FilePath $GitExe -Arguments @('clone','--quiet','--depth','1','--branch',$RepoRef,$RepoUrl,$RepoDir) -WorkingDirectory $WorkRoot
  $head = Invoke-Native -FilePath $GitExe -Arguments @('rev-parse','HEAD') -WorkingDirectory $RepoDir
  $report.repo_head = $head.Text.Trim()
  $guards = @(
    'scripts/qa_sec002_private_certificate_delta_portable.mjs',
    'scripts/qa_sec002_student_private_cert.mjs',
    'scripts/qa_sec002_ventas_docs_extra_contract.mjs',
    'scripts/qa_sec002_ventas_extra_private_delta.mjs',
    'scripts/qa_sec002_ventas_extra_private_frontend.mjs',
    'scripts/qa_sec002_payment_receipt_private_delta.mjs',
    'scripts/qa_sec002_payment_receipt_frontend.mjs',
    'scripts/qa_sec002_signed_enrollment_private_delta.mjs',
    'scripts/qa_sec002_signed_enrollment_frontend.mjs',
    'scripts/qa_sec002_private_delivery_bundle_manifest.mjs',
    'scripts/qa_sec002_modular_installer.mjs'
  )
  foreach ($guard in $guards) {
    $g = Invoke-Native -FilePath $NodeExe -Arguments @($guard) -WorkingDirectory $RepoDir
  }

  Write-Step '2/11 Â· Verificar autenticacion clasp'
  $auth = Invoke-Clasp -Arguments @('show-authorized-user','--json') -WorkingDirectory $WorkRoot -AllowFailure
  if ($auth.Code -ne 0) {
    Write-Host 'No hay sesion clasp valida. Se abrira el login oficial de Google una sola vez.' -ForegroundColor Yellow
    Invoke-Clasp -Arguments @('login') -WorkingDirectory $WorkRoot | Out-Null
    Invoke-Clasp -Arguments @('show-authorized-user','--json') -WorkingDirectory $WorkRoot | Out-Null
  }

  Write-Step '3/11 Â· Clonar proyecto Apps Script QA modular completo'
  Clone-AppsScriptProject -Destination $AppsDir
  $codeMatches = @(Get-ChildItem -LiteralPath $AppsDir -Recurse -File | Where-Object {
    [IO.Path]::GetFileNameWithoutExtension($_.Name) -eq 'Code' -and $_.Extension.ToLowerInvariant() -in @('.js','.gs')
  })
  if ($codeMatches.Count -gt 0) { Fail "Este instalador es solo modular; encontro $($codeMatches.Count) Code.js/Code.gs." }
  $beforeMap = Get-ProjectSourceMap $AppsDir
  $report.source_files_before = $beforeMap.Count
  if ($beforeMap.Count -lt 30) { Fail "Proyecto modular inesperadamente pequeno: $($beforeMap.Count) archivos fuente." }

  Write-Step '4/11 Â· Crear backup persistente ANTES de cambios locales'
  Copy-Item -LiteralPath $AppsDir -Destination $BackupSource -Recurse -Force
  if (-not (Test-Path (Join-Path $BackupSource '.clasp.json'))) { Fail 'Backup QA incompleto: falta .clasp.json.' }
  $beforeRows = foreach ($key in ($beforeMap.Keys | Sort-Object)) { [pscustomobject]@{path=$key;sha256=$beforeMap[$key]} }
  $beforeRows | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $BackupDir 'source-before-hashes.json') -Encoding UTF8
  (Invoke-Clasp -Arguments @('list-deployments') -WorkingDirectory $AppsDir).Text | Set-Content -LiteralPath (Join-Path $BackupDir 'deployments-before.txt') -Encoding UTF8

  Write-Step '5/11 Â· Rebase exacto de 24 hunks sobre modulos actuales (sin fuzz)'
  $rebase = Invoke-Native -FilePath $NodeExe -Arguments @(
    'scripts/apply_sec002_modular_exact.mjs','--apps-dir',$AppsDir,'--repo-root',$RepoDir,'--report',$RebaseReport
  ) -WorkingDirectory $RepoDir -AllowFailure
  if ($rebase.Code -ne 0) {
    $report.result = 'STOP_MODULAR_RECONCILE_REQUIRED'
    if (Test-Path $RebaseReport) {
      $diag = Get-Content -LiteralPath $RebaseReport -Raw -Encoding UTF8 | ConvertFrom-Json
      $first = @($diag.failures)[0]
      Write-Host "STOP_MODULAR_RECONCILE_REQUIRED: $($first | ConvertTo-Json -Compress -Depth 8)" -ForegroundColor Yellow
    }
    Fail 'SEC002 modular exact rebase no pudo demostrar 24/24 hunks. No se hizo push.'
  }
  $rebaseObj = Get-Content -LiteralPath $RebaseReport -Raw -Encoding UTF8 | ConvertFrom-Json
  if ($rebaseObj.ok -ne $true -or [int]$rebaseObj.applied_hunks -ne 24) { Fail 'Rebase modular no confirmo 24/24 hunks.' }
  $report.changed_files = @($rebaseObj.changed_files)

  $candidateMap = Get-ProjectSourceMap $AppsDir
  $localDiff = @()
  $allLocal = @($beforeMap.Keys + $candidateMap.Keys | Sort-Object -Unique)
  foreach ($rel in $allLocal) {
    $b = if ($beforeMap.ContainsKey($rel)) {$beforeMap[$rel]} else {'<missing>'}
    $a = if ($candidateMap.ContainsKey($rel)) {$candidateMap[$rel]} else {'<missing>'}
    if ($b -ne $a) { $localDiff += $rel }
  }
  $declared = @($report.changed_files | Sort-Object -Unique)
  $observed = @($localDiff | Sort-Object -Unique)
  if (($declared -join '|') -ne ($observed -join '|')) {
    Fail "Archivos cambiados no coinciden con reporte modular. declared=$($declared -join ',') observed=$($observed -join ',')"
  }

  Write-Step '6/11 Â· Gate de no-escritura / autorizacion Apply'
  if (-not $Apply) {
    $report.result = 'PLAN_PASS_NO_REMOTE_WRITE'
    Write-Host 'PLAN PASS Â· rebase modular exacto 24/24; no se escribio Apps Script porque falta -Apply.' -ForegroundColor Green
    return
  }

  Write-Step '7/11 Â· Push controlado del proyecto modular QA'
  $RemoteChanged = $true
  Invoke-Clasp -Arguments @('push','--force') -WorkingDirectory $AppsDir | Out-Null

  Write-Step '8/11 Â· Releer remoto y exigir mapa byte-exacto completo'
  Clone-AppsScriptProject -Destination $VerifyDir
  $verifyMap = Get-ProjectSourceMap $VerifyDir
  $remoteDiff = Compare-MapExact -Expected $candidateMap -Observed $verifyMap
  if (@($remoteDiff).Count -gt 0) {
    $remoteDiff | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $BackupDir 'remote-map-mismatch.json') -Encoding UTF8
    Fail "Reclone remoto no coincide byte a byte con candidato local ($(@($remoteDiff).Count) diferencias)."
  }

  Write-Step '9/11 Â· Actualizar la MISMA deploymentId QA'
  if ($QaDeploymentId -eq $ProdDeploymentId) { Fail 'Gate critico: deployment QA coincide con producciÃ³n.' }
  $desc = "SEC002 modular private delivery QA $Stamp"
  $dep = Invoke-Clasp -Arguments @('create-deployment','--deploymentId',$QaDeploymentId,'--description',$desc) -WorkingDirectory $AppsDir
  $dep.Text | Set-Content -LiteralPath (Join-Path $BackupDir 'deployment-update.txt') -Encoding UTF8
  $listAfter = Invoke-Clasp -Arguments @('list-deployments') -WorkingDirectory $AppsDir
  $listAfter.Text | Set-Content -LiteralPath (Join-Path $BackupDir 'deployments-after.txt') -Encoding UTF8
  if ($listAfter.Text -notmatch [Regex]::Escape($QaDeploymentId)) { Fail 'La deploymentId QA conocida no aparece despues del redeploy.' }

  Write-Step '10/11 Â· Smoke negativo de las cuatro rutas privadas'
  $smokeOk = $false
  for ($attempt=1; $attempt -le 6; $attempt++) {
    try { Test-QaRoutes; $smokeOk=$true; break }
    catch { if ($attempt -eq 6) { throw }; Start-Sleep -Seconds 3 }
  }
  if (-not $smokeOk) { Fail 'Smoke QA no confirmado.' }
  $report.smoke = 'PASS_NEGATIVE_AUTH_ROUTE_SMOKE'

  Write-Step '11/11 Â· Resultado'
  $report.result = 'QA_MODULAR_INSTALL_PASS'
  Write-Host 'PASS Â· SEC-002 instalado sobre Apps Script QA modular y misma /exec QA actualizada.' -ForegroundColor Green
  Write-Host "Backup: $BackupDir"
  Write-Host "Changed files: $($report.changed_files -join ', ')"
  Write-Host "QA /exec: $QaExecUrl"
}
catch {
  if ($report.result -eq 'STARTED') { $report.result = 'FAIL' }
  $report.error = $_.Exception.Message
  Write-Host "`nFAIL: $($_.Exception.Message)" -ForegroundColor Red
  if ($Apply -and $RemoteChanged) {
    try { Restore-BackupAndRedeploy; $report.result = 'FAIL_ROLLBACK_ATTEMPTED' }
    catch { $report.result='FAIL_ROLLBACK_FAILED'; $report.rollback_error=$_.Exception.Message; Write-Host "ROLLBACK FAILED: $($_.Exception.Message)" -ForegroundColor Red }
  }
  throw
}
finally {
  $report.finished=(Get-Date).ToString('o')
  try { $report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $ReportPath -Encoding UTF8 } catch {}
  if (-not $KeepWorkDir) { try { Remove-Item -LiteralPath $WorkRoot -Recurse -Force -ErrorAction SilentlyContinue } catch {} }
  else { Write-Host "WorkDir conservado: $WorkRoot" }
}

