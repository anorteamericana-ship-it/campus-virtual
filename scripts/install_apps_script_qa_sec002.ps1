[CmdletBinding()]
param(
  [switch]$Apply,
  [switch]$KeepWorkDir,
  [string]$BackupRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'CampusVirtual\AppsScriptQA\Backups')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# -----------------------------------------------------------------------------
# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA
# SEC-002 · instalador controlado para Apps Script QA
#
# Seguridad operacional:
# - SOLO acepta el proyecto QA y la implementacion QA conocidas.
# - Descarga el proyecto completo antes de modificar nada.
# - Crea backup persistente + hashes de todos los archivos Apps Script.
# - Exige el SHA exacto del Code canonico antes de aplicar deltas.
# - Aplica los cuatro deltas con fuzz=0 y verifica el SHA final del bundle.
# - Comprueba que NINGUN archivo distinto de Code cambie localmente.
# - clasp push reemplaza el contenido remoto completo; por eso se usa un clone
#   completo y se verifica byte a byte el resto del proyecto antes y despues.
# - Reutiliza la MISMA deploymentId QA. No crea una URL paralela.
# - Si una verificacion posterior al push/deploy falla, intenta rollback completo.
# - No retira ACL publicas en esta instalacion; eso se hace solo tras runtime QA.
# -----------------------------------------------------------------------------

$QaScriptId     = '1GMHihGwnX_-sIS101rRlUoYpAH2HSKyms8lx6L9z7bjb_45YDn-ph6WD'
$QaDeploymentId = 'AKfycbzzsmmHVRGlgltcUJf7Yi9R0z__vsu58Hw9Gq9rNn5pYVrgY5iZ0-xEEL-8wqL4uPVbaw'
$QaExecUrl      = "https://script.google.com/macros/s/$QaDeploymentId/exec"
$RepoUrl        = 'https://github.com/anorteamericana-ship-it/campus-virtual.git'
$RepoRef        = 'fix/sec002-private-document-foundation'
$ClaspVersion   = '3.3.0'
$ExpectedBaseSha = 'd24fc63c59e60ba92808d4d870f4eb95e35bb6f1c158a130229b187a66e35d37'
$ExpectedBundleSha = 'da81ffbd44341dba884c2ff647f721cbd1b53b447b39c6e11cf2d67c8ac6df06'
$ExpectedBundleSize = 2997898

$Started = Get-Date
$Stamp = $Started.ToString('yyyyMMdd_HHmmss')
$WorkRoot = Join-Path ([IO.Path]::GetTempPath()) "campus_apps_script_qa_sec002_$Stamp"
$RepoDir = Join-Path $WorkRoot 'repo'
$AppsDir = Join-Path $WorkRoot 'apps-script-current'
$VerifyDir = Join-Path $WorkRoot 'apps-script-verify'
$CandidatePath = Join-Path $WorkRoot 'Code.SEC002_PRIVATE_DELIVERY_QA_CANDIDATE.js'
$BackupDir = Join-Path $BackupRoot "QA_SEC002_$Stamp"
$BackupSource = Join-Path $BackupDir 'source-before'
$ReportPath = Join-Path $BackupDir 'install-report.json'
$RemoteChanged = $false
$DeploymentUpdated = $false

function Write-Step([string]$Text) {
  Write-Host "`n=== $Text ===" -ForegroundColor Cyan
}

function Fail([string]$Text) {
  throw $Text
}

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
    [string]$WorkingDirectory = ''
  )
  $old = Get-Location
  try {
    if ($WorkingDirectory) { Set-Location $WorkingDirectory }
    $output = & $FilePath @Arguments 2>&1
    $code = $LASTEXITCODE
    if ($null -ne $output) { $output | ForEach-Object { Write-Host $_ } }
    if ($code -ne 0) {
      throw "Command failed ($code): $FilePath $($Arguments -join ' ')"
    }
    return ($output -join [Environment]::NewLine)
  }
  finally {
    Set-Location $old
  }
}

$GitExe = Find-CommandPath @('git.exe','git')
$NodeExe = Find-CommandPath @('node.exe','node')
$NpxExe = Find-CommandPath @('npx.cmd','npx.exe','npx')
if (-not $GitExe) { Fail 'Git no esta instalado o no esta en PATH.' }
if (-not $NodeExe) { Fail 'Node.js no esta instalado o no esta en PATH.' }
if (-not $NpxExe) { Fail 'npx no esta instalado o no esta en PATH.' }

$PatchExe = Find-CommandPath @('patch.exe','patch')
if (-not $PatchExe) {
  $patchCandidates = @(
    (Join-Path $env:ProgramFiles 'Git\usr\bin\patch.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'Git\usr\bin\patch.exe')
  ) | Where-Object { $_ -and (Test-Path $_) }
  if ($patchCandidates.Count -gt 0) { $PatchExe = $patchCandidates[0] }
}
if (-not $PatchExe) {
  Fail 'No encontre patch.exe. Git for Windows normalmente lo incluye en C:\Program Files\Git\usr\bin\patch.exe.'
}

function Invoke-Clasp {
  param([string[]]$Arguments, [string]$WorkingDirectory = '')
  $all = @('--yes', "@google/clasp@$ClaspVersion") + $Arguments
  return Invoke-Native -FilePath $NpxExe -Arguments $all -WorkingDirectory $WorkingDirectory
}

function Get-Sha256([string]$Path) {
  return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
}

function Get-RelativePathCompat([string]$Root, [string]$FullName) {
  $rootFull = [IO.Path]::GetFullPath($Root).TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar
  $fileFull = [IO.Path]::GetFullPath($FullName)
  if (-not $fileFull.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
    Fail "Path fuera de raiz: $fileFull"
  }
  return $fileFull.Substring($rootFull.Length).Replace('\','/')
}

function Get-AppsSourceMap([string]$Root) {
  $map = @{}
  $files = Get-ChildItem -LiteralPath $Root -Recurse -File | Where-Object {
    $_.Name -eq 'appsscript.json' -or $_.Extension.ToLowerInvariant() -in @('.js','.gs','.html')
  }
  foreach ($file in $files) {
    $rel = Get-RelativePathCompat $Root $file.FullName
    $map[$rel] = Get-Sha256 $file.FullName
  }
  return $map
}

function Compare-SourceMaps {
  param(
    [hashtable]$Before,
    [hashtable]$After,
    [string[]]$AllowedChangedBasenames
  )
  $all = @($Before.Keys + $After.Keys | Sort-Object -Unique)
  $bad = @()
  foreach ($rel in $all) {
    $base = [IO.Path]::GetFileNameWithoutExtension($rel)
    $allowed = $AllowedChangedBasenames -contains $base
    $b = if ($Before.ContainsKey($rel)) { $Before[$rel] } else { '<missing>' }
    $a = if ($After.ContainsKey($rel)) { $After[$rel] } else { '<missing>' }
    if ($b -ne $a -and -not $allowed) {
      $bad += [pscustomobject]@{ path=$rel; before=$b; after=$a }
    }
  }
  return $bad
}

function Find-CodeFile([string]$Root) {
  $matches = Get-ChildItem -LiteralPath $Root -Recurse -File | Where-Object {
    [IO.Path]::GetFileNameWithoutExtension($_.Name) -eq 'Code' -and $_.Extension.ToLowerInvariant() -in @('.js','.gs')
  }
  if ($matches.Count -ne 1) {
    Fail "Esperaba exactamente un Code.js/Code.gs despues de clasp clone; encontre $($matches.Count)."
  }
  return $matches[0].FullName
}

function Invoke-PatchExact {
  param([string]$TargetFile, [string]$PatchFile)
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $PatchExe
  $escapedTarget = $TargetFile.Replace('"','\"')
  $psi.Arguments = "--batch --forward --fuzz=0 `"$escapedTarget`""
  $psi.WorkingDirectory = Split-Path -Parent $TargetFile
  $psi.UseShellExecute = $false
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  if (-not $p.Start()) { Fail "No pude iniciar patch.exe para $PatchFile" }
  $patchText = [IO.File]::ReadAllText($PatchFile, [Text.Encoding]::UTF8)
  $p.StandardInput.Write($patchText)
  $p.StandardInput.Close()
  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()
  if ($stdout) { Write-Host $stdout }
  if ($stderr) { Write-Host $stderr }
  if ($p.ExitCode -ne 0) {
    Fail "Patch exacto fallo ($($p.ExitCode)): $PatchFile"
  }
}

function Build-Sec002Bundle {
  param([string]$SourceCode, [string]$RepoRoot, [string]$OutputFile)
  $manifestPath = Join-Path $RepoRoot 'qa\sec002_private_delivery_bundle_manifest.json'
  $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json

  $observed = Get-Sha256 $SourceCode
  if ($observed -ne $ExpectedBaseSha -or $observed -ne $manifest.canonical_code_sha256) {
    Fail "STOP_AND_RECONCILE_CURRENT_QA_CODE expected=$ExpectedBaseSha observed=$observed"
  }

  Copy-Item -LiteralPath $SourceCode -Destination $OutputFile -Force
  foreach ($item in ($manifest.ordered_deltas | Sort-Object order)) {
    $patchPath = Join-Path $RepoRoot ($item.path -replace '/', '\')
    if (-not (Test-Path $patchPath)) { Fail "Falta patch: $patchPath" }
    $hunks = (Select-String -LiteralPath $patchPath -Pattern '^@@ ' -AllMatches).Count
    if ($hunks -ne [int]$item.expected_hunks) {
      Fail "Hunks inesperados en $($item.path): expected=$($item.expected_hunks) observed=$hunks"
    }
    if ($item.PSObject.Properties.Name -contains 'reconciled_base_sha256') {
      $expectedIntermediate = [string]$item.reconciled_base_sha256
      if ($expectedIntermediate) {
        $current = Get-Sha256 $OutputFile
        if ($current -ne $expectedIntermediate) {
          Fail "Base reconciliada no coincide antes de $($item.path): expected=$expectedIntermediate observed=$current"
        }
      }
    }
    Invoke-PatchExact -TargetFile $OutputFile -PatchFile $patchPath
  }

  $finalSha = Get-Sha256 $OutputFile
  $finalSize = (Get-Item -LiteralPath $OutputFile).Length
  if ($finalSha -ne $ExpectedBundleSha -or $finalSha -ne $manifest.canonical_bundle.expected_sha256) {
    Fail "SHA bundle final invalido expected=$ExpectedBundleSha observed=$finalSha"
  }
  if ($finalSize -ne $ExpectedBundleSize -or $finalSize -ne [int64]$manifest.canonical_bundle.expected_size_bytes) {
    Fail "Tamano bundle final invalido expected=$ExpectedBundleSize observed=$finalSize"
  }
  return $manifest
}

function Clone-AppsScriptProject([string]$Destination) {
  if (Test-Path $Destination) { Remove-Item -LiteralPath $Destination -Recurse -Force }
  New-Item -ItemType Directory -Path $Destination -Force | Out-Null
  # Ejecutar clone DENTRO del destino mantiene .clasp.json + source juntos.
  Invoke-Clasp -Arguments @('clone-script', $QaScriptId) -WorkingDirectory $Destination | Out-Null
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
      $uri = "$QaExecUrl?fn=$([Uri]::EscapeDataString($fn))"
      $raw = Invoke-WebRequest -UseBasicParsing -Method Post -Uri $uri -ContentType 'text/plain;charset=utf-8' -Body $body -TimeoutSec 30
      $text = [string]$raw.Content
      if (-not $text.Trim().StartsWith('{')) { throw "respuesta no JSON: $($text.Substring(0,[Math]::Min(120,$text.Length)))" }
      $obj = $text | ConvertFrom-Json
      $joined = (($obj | ConvertTo-Json -Compress -Depth 8) + '').ToLowerInvariant()
      if ($joined -match 'funci[oó]n post no reconocida|function.*not.*recognized|unknown.*function') {
        throw "ruta no reconocida: $joined"
      }
      Write-Host "PASS route smoke $fn -> rechazo autenticado/JSON"
    }
    catch {
      $failures += "$fn :: $($_.Exception.Message)"
    }
  }
  if ($failures.Count -gt 0) {
    Fail ("Smoke QA fallo: " + ($failures -join ' | '))
  }
}

function Restore-BackupAndRedeploy {
  Write-Host 'ROLLBACK: restaurando snapshot anterior...' -ForegroundColor Yellow
  if (-not (Test-Path (Join-Path $BackupSource '.clasp.json'))) {
    throw 'Rollback imposible: backup no contiene .clasp.json'
  }
  Invoke-Clasp -Arguments @('push','--force') -WorkingDirectory $BackupSource | Out-Null
  Invoke-Clasp -Arguments @('create-deployment','--deploymentId',$QaDeploymentId,'--description',"ROLLBACK SEC002 $Stamp") -WorkingDirectory $BackupSource | Out-Null
  Write-Host 'ROLLBACK: source anterior restaurado y misma deploymentId QA redeployada.' -ForegroundColor Yellow
}

New-Item -ItemType Directory -Path $WorkRoot -Force | Out-Null
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

$report = [ordered]@{
  started = $Started.ToString('o')
  apply_requested = [bool]$Apply
  qa_script_id = $QaScriptId
  qa_deployment_id = $QaDeploymentId
  qa_exec_url = $QaExecUrl
  repo_ref = $RepoRef
  clasp_version = $ClaspVersion
  work_root = $WorkRoot
  backup_dir = $BackupDir
  source_before_sha256 = $null
  candidate_sha256 = $null
  source_after_sha256 = $null
  deployment_updated = $false
  smoke = 'NOT_RUN'
  result = 'STARTED'
  error = $null
}

try {
  Write-Step '1/10 · Obtener artefactos SEC-002 verificados'
  Invoke-Native -FilePath $GitExe -Arguments @('clone','--quiet','--depth','1','--branch',$RepoRef,$RepoUrl,$RepoDir) -WorkingDirectory $WorkRoot | Out-Null
  $repoHead = Invoke-Native -FilePath $GitExe -Arguments @('rev-parse','HEAD') -WorkingDirectory $RepoDir
  $report.repo_head = $repoHead.Trim()

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
    'scripts/qa_sec002_private_delivery_bundle_manifest.mjs'
  )
  foreach ($guard in $guards) {
    Invoke-Native -FilePath $NodeExe -Arguments @($guard) -WorkingDirectory $RepoDir | Out-Null
  }

  Write-Step '2/10 · Verificar autenticacion clasp'
  try {
    Invoke-Clasp -Arguments @('show-authorized-user','--json') -WorkingDirectory $WorkRoot | Out-Null
  }
  catch {
    Write-Host 'No hay sesion clasp valida. Se abrira el login oficial de Google una sola vez.' -ForegroundColor Yellow
    Invoke-Clasp -Arguments @('login') -WorkingDirectory $WorkRoot | Out-Null
    Invoke-Clasp -Arguments @('show-authorized-user','--json') -WorkingDirectory $WorkRoot | Out-Null
  }

  Write-Step '3/10 · Clonar proyecto Apps Script QA completo'
  Clone-AppsScriptProject -Destination $AppsDir
  if (-not (Test-Path (Join-Path $AppsDir '.clasp.json'))) { Fail 'Clone QA incompleto: falta .clasp.json en AppsDir.' }
  $CodePath = Find-CodeFile $AppsDir
  $beforeMap = Get-AppsSourceMap $AppsDir
  $beforeCodeSha = Get-Sha256 $CodePath
  $report.source_before_sha256 = $beforeCodeSha
  if ($beforeCodeSha -ne $ExpectedBaseSha) {
    Fail "STOP_AND_RECONCILE_CURRENT_QA_CODE expected=$ExpectedBaseSha observed=$beforeCodeSha"
  }

  Write-Step '4/10 · Crear backup persistente antes de cualquier escritura'
  Copy-Item -LiteralPath $AppsDir -Destination $BackupSource -Recurse -Force
  if (-not (Test-Path (Join-Path $BackupSource '.clasp.json'))) { Fail 'Backup QA incompleto: falta .clasp.json.' }
  $hashRows = foreach ($key in ($beforeMap.Keys | Sort-Object)) {
    [pscustomobject]@{ path=$key; sha256=$beforeMap[$key] }
  }
  $hashRows | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $BackupDir 'source-before-hashes.json') -Encoding UTF8
  Invoke-Clasp -Arguments @('list-deployments') -WorkingDirectory $AppsDir | Set-Content -LiteralPath (Join-Path $BackupDir 'deployments-before.txt') -Encoding UTF8

  Write-Step '5/10 · Construir bundle SEC-002 exacto'
  $manifest = Build-Sec002Bundle -SourceCode $CodePath -RepoRoot $RepoDir -OutputFile $CandidatePath
  $report.candidate_sha256 = Get-Sha256 $CandidatePath
  Copy-Item -LiteralPath $CandidatePath -Destination $CodePath -Force

  $afterLocalMap = Get-AppsSourceMap $AppsDir
  $unexpectedLocal = Compare-SourceMaps -Before $beforeMap -After $afterLocalMap -AllowedChangedBasenames @('Code')
  if ($unexpectedLocal.Count -gt 0) {
    $unexpectedLocal | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $BackupDir 'unexpected-local-changes.json') -Encoding UTF8
    Fail 'El bundle intento cambiar archivos distintos de Code. Abortado antes de push.'
  }

  if (-not $Apply) {
    $report.result = 'PLAN_PASS_NO_REMOTE_WRITE'
    Write-Host "`nPLAN PASS. Backup creado y bundle validado. No se escribio Apps Script porque falta -Apply." -ForegroundColor Green
    return
  }

  Write-Step '6/10 · Push controlado al HEAD del proyecto QA'
  $RemoteChanged = $true
  Invoke-Clasp -Arguments @('push','--force') -WorkingDirectory $AppsDir | Out-Null

  Write-Step '7/10 · Releer remoto y comprobar que solo Code cambio'
  Clone-AppsScriptProject -Destination $VerifyDir
  if (-not (Test-Path (Join-Path $VerifyDir '.clasp.json'))) { Fail 'Reclone QA incompleto: falta .clasp.json en VerifyDir.' }
  $verifyCode = Find-CodeFile $VerifyDir
  $verifyCodeSha = Get-Sha256 $verifyCode
  $report.source_after_sha256 = $verifyCodeSha
  if ($verifyCodeSha -ne $ExpectedBundleSha) {
    Fail "Verificacion remota Code fallo expected=$ExpectedBundleSha observed=$verifyCodeSha"
  }
  $verifyMap = Get-AppsSourceMap $VerifyDir
  $unexpectedRemote = Compare-SourceMaps -Before $beforeMap -After $verifyMap -AllowedChangedBasenames @('Code')
  if ($unexpectedRemote.Count -gt 0) {
    $unexpectedRemote | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $BackupDir 'unexpected-remote-changes.json') -Encoding UTF8
    Fail 'El remoto cambio archivos distintos de Code; se requiere rollback.'
  }

  Write-Step '8/10 · Actualizar la MISMA deploymentId QA'
  $deployDescription = "SEC002 private delivery QA $Stamp"
  $deployOutput = Invoke-Clasp -Arguments @('create-deployment','--deploymentId',$QaDeploymentId,'--description',$deployDescription) -WorkingDirectory $AppsDir
  $DeploymentUpdated = $true
  $report.deployment_updated = $true
  $deployOutput | Set-Content -LiteralPath (Join-Path $BackupDir 'deployment-update.txt') -Encoding UTF8
  $deployListAfter = Invoke-Clasp -Arguments @('list-deployments') -WorkingDirectory $AppsDir
  $deployListAfter | Set-Content -LiteralPath (Join-Path $BackupDir 'deployments-after.txt') -Encoding UTF8
  if ($deployListAfter -notmatch [Regex]::Escape($QaDeploymentId)) {
    Fail 'La deploymentId QA conocida no aparece despues del redeploy.'
  }

  Write-Step '9/10 · Smoke de las cuatro rutas privadas en /exec QA'
  $smokeOk = $false
  for ($attempt=1; $attempt -le 6; $attempt++) {
    try {
      Test-QaRoutes
      $smokeOk = $true
      break
    }
    catch {
      if ($attempt -eq 6) { throw }
      Start-Sleep -Seconds 3
    }
  }
  if (-not $smokeOk) { Fail 'Smoke QA no confirmado.' }
  $report.smoke = 'PASS_NEGATIVE_AUTH_ROUTE_SMOKE'

  Write-Step '10/10 · Resultado'
  $report.result = 'QA_INSTALL_PASS'
  Write-Host 'PASS · SEC-002 instalado en Apps Script QA y misma /exec QA actualizada.' -ForegroundColor Green
  Write-Host "Backup: $BackupDir"
  Write-Host "Code antes : $beforeCodeSha"
  Write-Host "Code despues: $verifyCodeSha"
  Write-Host "QA /exec    : $QaExecUrl"
}
catch {
  $report.result = 'FAIL'
  $report.error = $_.Exception.Message
  Write-Host "`nFAIL: $($_.Exception.Message)" -ForegroundColor Red
  if ($Apply -and $RemoteChanged) {
    try {
      Restore-BackupAndRedeploy
      $report.result = 'FAIL_ROLLBACK_ATTEMPTED'
    }
    catch {
      $report.result = 'FAIL_ROLLBACK_FAILED'
      $report.rollback_error = $_.Exception.Message
      Write-Host "ROLLBACK FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
  }
  throw
}
finally {
  $report.finished = (Get-Date).ToString('o')
  try {
    $report | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $ReportPath -Encoding UTF8
  } catch {}
  if (-not $KeepWorkDir) {
    try { Remove-Item -LiteralPath $WorkRoot -Recurse -Force -ErrorAction SilentlyContinue } catch {}
  } else {
    Write-Host "WorkDir conservado: $WorkRoot"
  }
}
