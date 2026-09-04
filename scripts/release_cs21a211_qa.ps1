[CmdletBinding()]
param(
  [switch]$Push,
  [switch]$KeepWorkDir,
  [string]$ClaspVersion = '3.3.0',
  [string]$EvidenceRoot = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'CampusVirtual\AppsScriptQA\Releases')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$QaScriptId = '1GMHihGwnX_-sIS101rRlUoYpAH2HSKyms8lx6L9z7bjb_45YDn-ph6WD'
$QaDeploymentId = 'AKfycbxEAQ9lAg1Nv0ASX30MAVOzD7IZvwwqSI9MYcNaMhOQ'
$ExpectedSourceAggregate = '3e384ac34930e6a936a3f930db8819bd80124ef59f522ac1b5b11fee8f881ec6'
$ExpectedCandidateAggregate = 'a31ebfc566b7093dc7463261793bb542905587d92317202aa6ec6ec5420a6523'
$ExpectedCandidateBytes = 4692202
$ExpectedPatchSha = '2867f95fe1871aa21f7bcc1810a2fbb3d5c17a3bfeb81fd30df2b3dacfce45f9'
$GuardFileName = '99_QA_Staging_Guard.js'
$ExpectedGuardBytes = 13062
$ExpectedGuardSha = 'a39441e9e99981583e4f98d0994f5ac0b80f244e2febbb7e3d5895550fe310fe'
$ProdDeploymentId = 'AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$PatchManifestPath = Join-Path $RepoRoot 'patches\apps-script\CS21A211_QA_CONTAINMENT.manifest.json'
$SnapshotAnalyzer = Join-Path $PSScriptRoot 'apps_script_qa_snapshot_manifest_cs21a178.mjs'
$RouteParity = Join-Path $PSScriptRoot 'qa_get_route_parity_cs21a211i.mjs'
$Stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMdd_HHmmssZ')
$WorkRoot = Join-Path ([IO.Path]::GetTempPath()) "campus_cs21a211i_release_$Stamp"
$SourceDir = Join-Path $WorkRoot 'source'
$CandidateDir = Join-Path $WorkRoot 'candidate'
$VerifyDir = Join-Path $WorkRoot 'verify-remote'
$CombinedPatch = Join-Path $WorkRoot 'CS21A211I.patch'
$ApplyPatch = Join-Path $WorkRoot 'CS21A211I_without_guard.patch'
$EvidenceDir = Join-Path $EvidenceRoot "CS21A211I_$Stamp"
$SourceManifestPath = Join-Path $EvidenceDir 'pre-push-manifest.json'
$CandidateManifestPath = Join-Path $EvidenceDir 'candidate-manifest.json'
$RemoteManifestPath = Join-Path $EvidenceDir 'post-push-remote-manifest.json'
$PrePushZip = Join-Path $EvidenceDir 'pre-push-source.zip'
$Succeeded = $false
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

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
$GitExe = Find-CommandPath @('git.exe','git')
if (-not $NodeExe) { Fail 'Node.js no está instalado o no está en PATH.' }
if (-not $NpxExe) { Fail 'npx no está instalado o no está en PATH.' }
if (-not $GitExe) { Fail 'git no está instalado o no está en PATH.' }
if (-not (Test-Path -LiteralPath $PatchManifestPath)) { Fail "Falta manifest del candidato: $PatchManifestPath" }
if (-not (Test-Path -LiteralPath $SnapshotAnalyzer)) { Fail "Falta analizador de snapshot: $SnapshotAnalyzer" }
if (-not (Test-Path -LiteralPath $RouteParity)) { Fail "Falta check de paridad GET: $RouteParity" }

function Invoke-Clasp {
  param([string[]]$Arguments, [string]$WorkingDirectory = '', [switch]$AllowFailure, [switch]$Quiet)
  $all = @('--yes', "@google/clasp@$ClaspVersion") + $Arguments
  return Invoke-Native -FilePath $NpxExe -Arguments $all -WorkingDirectory $WorkingDirectory -AllowFailure:$AllowFailure -Quiet:$Quiet
}

function Assert-Manifest([string]$Path, [string]$ExpectedAggregate, [int64]$ExpectedBytes, [string]$Label) {
  if (-not (Test-Path -LiteralPath $Path)) { Fail "${Label}: no se generó manifest." }
  $m = Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json
  if ([int]$m.source_file_count -ne 71) { Fail "${Label}: se esperaban 71 archivos, llegaron $($m.source_file_count)." }
  if ([string]$m.aggregate_sha256 -ne $ExpectedAggregate) { Fail "${Label}: aggregate inesperado $($m.aggregate_sha256). Esperado $ExpectedAggregate." }
  if ($ExpectedBytes -gt 0 -and [int64]$m.source_total_bytes -ne $ExpectedBytes) { Fail "${Label}: bytes inesperados $($m.source_total_bytes). Esperado $ExpectedBytes." }
  return $m
}

function Generate-Manifest([string]$Dir, [string]$Output) {
  Invoke-Native -FilePath $NodeExe -Arguments @(
    $SnapshotAnalyzer,
    '--source-dir',$Dir,
    '--output',$Output,
    '--script-id',$QaScriptId,
    '--min-files','71',
    '--expect-baseline'
  ) | Out-Null
}

function Copy-Tree([string]$From, [string]$To) {
  New-Item -ItemType Directory -Path $To -Force | Out-Null
  Get-ChildItem -LiteralPath $From -Force | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $To -Recurse -Force
  }
}

function Read-CanonicalPatchText([string]$Path) {
  $bytes = [IO.File]::ReadAllBytes($Path)
  if ($bytes -contains 13) { Fail "Patch canónico contiene CR y debe permanecer LF byte-exacto: $Path" }
  return [Text.Encoding]::UTF8.GetString($bytes)
}

function Build-CanonicalPatch {
  $manifest = Get-Content -LiteralPath $PatchManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $builder = New-Object System.Text.StringBuilder
  foreach ($part in $manifest.patch_parts) {
    $path = Join-Path $RepoRoot ([string]$part.path).Replace('/','\')
    if (-not (Test-Path -LiteralPath $path)) { Fail "Falta fragmento de patch: $path" }
    [void]$builder.Append((Read-CanonicalPatchText -Path $path))
  }
  [IO.File]::WriteAllText($CombinedPatch, $builder.ToString(), $Utf8NoBom)
  $sha = (Get-FileHash -LiteralPath $CombinedPatch -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($sha -ne $ExpectedPatchSha) { Fail "Patch combinado no coincide: $sha; esperado $ExpectedPatchSha." }
  if ([string]$manifest.patch_sha256 -ne $ExpectedPatchSha) { Fail 'Manifest del patch no coincide con el hash canónico.' }
  return $manifest
}

function Build-PortableApplyPatchAndGuard($Manifest) {
  $applyBuilder = New-Object System.Text.StringBuilder
  $guardBuilder = New-Object System.Text.StringBuilder

  foreach ($part in $Manifest.patch_parts) {
    $path = Join-Path $RepoRoot ([string]$part.path).Replace('/','\')
    $text = Read-CanonicalPatchText -Path $path
    if ([string]$part.source_path -eq $GuardFileName) {
      [void]$guardBuilder.Append($text)
    } else {
      [void]$applyBuilder.Append($text)
    }
  }

  if ($applyBuilder.Length -le 0) { Fail 'Patch portable sin archivos no-guard.' }
  [IO.File]::WriteAllText($ApplyPatch, $applyBuilder.ToString(), $Utf8NoBom)

  # El preimage del guard en el snapshot es CRLF. No se entrega este full-file
  # replacement a git apply: se reconstruye desde las líneas + canónicas LF.
  $guardPatch = $guardBuilder.ToString()
  if (-not $guardPatch.StartsWith("--- a/$GuardFileName`n+++ b/$GuardFileName`n@@ -1,109 +1,296 @@`n")) {
    Fail 'Guard patch ya no es el full-file replacement esperado -109/+296.'
  }

  $added = New-Object 'System.Collections.Generic.List[string]'
  foreach ($line in [regex]::Split($guardPatch, "`n")) {
    if ($line.StartsWith('+++')) { continue }
    if ($line.StartsWith('+')) { $added.Add($line.Substring(1)) }
  }
  if ($added.Count -ne 296) { Fail "Guard reconstruido: líneas nuevas inesperadas $($added.Count); esperado 296." }

  $guardContent = ($added -join "`n") + "`n"
  $guardBytes = $Utf8NoBom.GetBytes($guardContent)
  if ($guardBytes.Length -ne $ExpectedGuardBytes) { Fail "Guard reconstruido: bytes $($guardBytes.Length); esperado $ExpectedGuardBytes." }

  $guardTemp = Join-Path $WorkRoot '99_QA_Staging_Guard.reconstructed.js'
  [IO.File]::WriteAllBytes($guardTemp, $guardBytes)
  $guardSha = (Get-FileHash -LiteralPath $guardTemp -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($guardSha -ne $ExpectedGuardSha) { Fail "Guard reconstruido: SHA $guardSha; esperado $ExpectedGuardSha." }
  Invoke-Native -FilePath $NodeExe -Arguments @('--check',$guardTemp) -Quiet | Out-Null
  return $guardTemp
}

function Assert-Syntax([string]$Dir) {
  $js = @(
    '01_Router.js',
    '02_Auth_Sesiones_Usuarios.js',
    '10_Estudiantes.js',
    '41_CONAPE_Auditoria_Finanzas.js',
    '46_English_LAB_Accesos_Demo_Docentes.js',
    '98_Instalacion_QA_CS21A144.js',
    '99_QA_Staging_Guard.js'
  )
  foreach ($name in $js) {
    $path = Join-Path $Dir $name
    if (-not (Test-Path -LiteralPath $path)) { Fail "Falta JS candidato: $name" }
    Invoke-Native -FilePath $NodeExe -Arguments @('--check',$path) -Quiet | Out-Null
  }
  $index = [IO.File]::ReadAllText((Join-Path $Dir 'index.html'), [Text.Encoding]::UTF8)
  if ($index.Contains($ProdDeploymentId)) { Fail 'index.html candidato todavía contiene el deployment PROD.' }
  $aliases = [regex]::Matches($index, '= CAMPUS_APPS_SCRIPT_URL;').Count
  if ($aliases -ne 13) { Fail "Aliases self-route inesperados: $aliases; esperado 13." }
}

function Assert-RouteParity([string]$Dir) {
  Invoke-Native -FilePath $NodeExe -Arguments @($RouteParity,$Dir) -Quiet | Out-Null
}

function Assert-RemoteWithEolDiagnostic([string]$ManifestPath, [string]$Dir) {
  try {
    return Assert-Manifest -Path $ManifestPath -ExpectedAggregate $ExpectedCandidateAggregate -ExpectedBytes $ExpectedCandidateBytes -Label 'REMOTE POST-PUSH'
  }
  catch {
    $guardPath = Join-Path $Dir $GuardFileName
    if (Test-Path -LiteralPath $guardPath) {
      $rawBytes = [IO.File]::ReadAllBytes($guardPath)
      $rawSha = (Get-FileHash -LiteralPath $guardPath -Algorithm SHA256).Hash.ToLowerInvariant()
      $rawText = [Text.Encoding]::UTF8.GetString($rawBytes)
      $lfText = $rawText.Replace("`r`n","`n").Replace("`r","`n")
      $lfBytes = $Utf8NoBom.GetBytes($lfText)
      $sha = [Security.Cryptography.SHA256]::Create()
      try {
        $lfSha = ([BitConverter]::ToString($sha.ComputeHash($lfBytes))).Replace('-','').ToLowerInvariant()
      }
      finally { $sha.Dispose() }
      if ($lfBytes.Length -eq $ExpectedGuardBytes -and $lfSha -eq $ExpectedGuardSha -and ($rawBytes.Length -ne $ExpectedGuardBytes -or $rawSha -ne $ExpectedGuardSha)) {
        Fail "REMOTE_EOL_DRIFT: contenido lógico del guard coincide al normalizar LF, pero el remoto devolvió bytes=$($rawBytes.Length) sha=$rawSha; esperado LF $ExpectedGuardBytes/$ExpectedGuardSha."
      }
    }
    throw
  }
}

Write-Host '=== CS21A211I · RELEASE CONTROLADO QA ===' -ForegroundColor Cyan
Write-Host "Script QA: $QaScriptId"
Write-Host "Deployment QA esperado: $QaDeploymentId"
Write-Host "Modo: $(if ($Push) {'PUSH QA autorizado'} else {'DRY-RUN local, sin push'})"
Write-Host 'PROD está fuera de alcance.'

New-Item -ItemType Directory -Path $WorkRoot -Force | Out-Null
New-Item -ItemType Directory -Path $SourceDir -Force | Out-Null
New-Item -ItemType Directory -Path $EvidenceDir -Force | Out-Null

try {
  Write-Host "`n1/9 · Sesión clasp..." -ForegroundColor Cyan
  $auth = Invoke-Clasp -Arguments @('show-authorized-user','--json') -WorkingDirectory $WorkRoot -AllowFailure -Quiet
  if ($auth.Code -ne 0) { Fail "No hay sesión clasp válida. Ejecutá una vez: npx --yes @google/clasp@$ClaspVersion login" }
  Write-Host 'PASS · sesión clasp disponible.' -ForegroundColor Green

  Write-Host "`n2/9 · Re-clone exacto de @HEAD QA antes de tocarlo..." -ForegroundColor Cyan
  Invoke-Clasp -Arguments @('clone-script',$QaScriptId) -WorkingDirectory $SourceDir | Out-Null
  $claspJsonPath = Join-Path $SourceDir '.clasp.json'
  if (-not (Test-Path -LiteralPath $claspJsonPath)) { Fail 'Clone incompleto: falta .clasp.json.' }
  $claspJson = Get-Content -LiteralPath $claspJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
  if ([string]$claspJson.scriptId -ne $QaScriptId) { Fail "ABORT: .clasp.json apunta a otro Script ID: $($claspJson.scriptId)" }

  Write-Host "`n3/9 · Hash fuente y respaldo pre-push..." -ForegroundColor Cyan
  Generate-Manifest -Dir $SourceDir -Output $SourceManifestPath
  $sourceManifest = Assert-Manifest -Path $SourceManifestPath -ExpectedAggregate $ExpectedSourceAggregate -ExpectedBytes 4677234 -Label 'PRE-PUSH QA HEAD'
  Compress-Archive -Path (Join-Path $SourceDir '*') -DestinationPath $PrePushZip -CompressionLevel Optimal -Force
  Write-Host "PASS · source aggregate $($sourceManifest.aggregate_sha256)" -ForegroundColor Green

  Write-Host "`n4/9 · Construyendo patch canónico y candidato aislado..." -ForegroundColor Cyan
  $patchManifest = Build-CanonicalPatch
  $guardReconstructed = Build-PortableApplyPatchAndGuard -Manifest $patchManifest
  Copy-Tree -From $SourceDir -To $CandidateDir
  Invoke-Native -FilePath $GitExe -Arguments @('init','--quiet') -WorkingDirectory $CandidateDir | Out-Null
  Invoke-Native -FilePath $GitExe -Arguments @('config','core.autocrlf','false') -WorkingDirectory $CandidateDir | Out-Null
  Invoke-Native -FilePath $GitExe -Arguments @('apply','--check','--whitespace=nowarn',$ApplyPatch) -WorkingDirectory $CandidateDir | Out-Null
  Invoke-Native -FilePath $GitExe -Arguments @('apply','--whitespace=nowarn',$ApplyPatch) -WorkingDirectory $CandidateDir | Out-Null
  Copy-Item -LiteralPath $guardReconstructed -Destination (Join-Path $CandidateDir $GuardFileName) -Force
  Remove-Item -LiteralPath (Join-Path $CandidateDir '.git') -Recurse -Force

  Write-Host "`n5/9 · Hash + sintaxis + frontera GET del candidato..." -ForegroundColor Cyan
  Generate-Manifest -Dir $CandidateDir -Output $CandidateManifestPath
  $candidateManifest = Assert-Manifest -Path $CandidateManifestPath -ExpectedAggregate $ExpectedCandidateAggregate -ExpectedBytes $ExpectedCandidateBytes -Label 'CANDIDATE'
  Assert-Syntax -Dir $CandidateDir
  Assert-RouteParity -Dir $CandidateDir
  Write-Host "PASS · candidate aggregate $($candidateManifest.aggregate_sha256) · guard $ExpectedGuardBytes bytes · 7/7 JS syntax · 13/13 self-route · GET 9/9 parity" -ForegroundColor Green

  if (-not $Push) {
    Write-Host "`nDRY-RUN PASS · no se hizo push remoto." -ForegroundColor Yellow
    Write-Host "CS21A211I preparado; cualquier push requiere autorización QA separada."
    $Succeeded = $true
    return
  }

  Write-Host "`n6/9 · PUSH al Script ID QA canónico, sin --force..." -ForegroundColor Cyan
  $candidateClasp = Get-Content -LiteralPath (Join-Path $CandidateDir '.clasp.json') -Raw -Encoding UTF8 | ConvertFrom-Json
  if ([string]$candidateClasp.scriptId -ne $QaScriptId) { Fail 'ABORT antes de push: candidate .clasp.json no apunta al QA canónico.' }
  Invoke-Clasp -Arguments @('push') -WorkingDirectory $CandidateDir | Out-Null
  Write-Host 'PASS · clasp push ejecutado únicamente contra QA.' -ForegroundColor Green

  Write-Host "`n7/9 · Re-clone remoto post-push, hash y round trip EOL..." -ForegroundColor Cyan
  New-Item -ItemType Directory -Path $VerifyDir -Force | Out-Null
  Invoke-Clasp -Arguments @('clone-script',$QaScriptId) -WorkingDirectory $VerifyDir | Out-Null
  Generate-Manifest -Dir $VerifyDir -Output $RemoteManifestPath
  $remoteManifest = Assert-RemoteWithEolDiagnostic -ManifestPath $RemoteManifestPath -Dir $VerifyDir
  Assert-Syntax -Dir $VerifyDir
  Assert-RouteParity -Dir $VerifyDir
  Write-Host "PASS · remote @HEAD = candidate $($remoteManifest.aggregate_sha256) · guard LF byte-exacto" -ForegroundColor Green

  Write-Host "`n8/9 · Verificando deployment QA estable..." -ForegroundColor Cyan
  $dep = Invoke-Clasp -Arguments @('list-deployments') -WorkingDirectory $VerifyDir -AllowFailure -Quiet
  if ($dep.Code -ne 0) { $dep = Invoke-Clasp -Arguments @('deployments') -WorkingDirectory $VerifyDir -AllowFailure -Quiet }
  if ($dep.Code -ne 0) { Fail 'No se pudieron enumerar deployments después del push.' }
  if (-not $dep.Text.Contains($QaDeploymentId)) { Fail "No aparece el deployment QA canónico $QaDeploymentId." }
  if (-not $dep.Text.Contains('@HEAD')) { Fail 'El deployment QA canónico ya no aparece asociado a @HEAD.' }
  Write-Host 'PASS · mismo deployment QA observado; no se creó deployment paralelo.' -ForegroundColor Green

  Write-Host "`n9/9 · Evidencia local de cierre técnico..." -ForegroundColor Cyan
  $result = [ordered]@{
    schema = 'CS21A211I_QA_RELEASE_RESULT_1'
    generated_at_utc = [DateTime]::UtcNow.ToString('o')
    qa_script_id = $QaScriptId
    qa_deployment_id = $QaDeploymentId
    source_aggregate = $ExpectedSourceAggregate
    candidate_aggregate = $ExpectedCandidateAggregate
    remote_post_push_aggregate = [string]$remoteManifest.aggregate_sha256
    patch_sha256 = $ExpectedPatchSha
    guard_sha256 = $ExpectedGuardSha
    guard_bytes = $ExpectedGuardBytes
    get_route_parity = '9/9'
    push_performed = $true
    force_used = $false
    new_deployment_created = $false
    production_touched = $false
    e4_business_write_executed = $false
  }
  $result | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $EvidenceDir 'release-result.json') -Encoding UTF8
  Write-Host "PASS · evidencia: $EvidenceDir" -ForegroundColor Green
  Write-Host "`nCS21A211I_QA_PUSH=PASS" -ForegroundColor Green
  Write-Host "REMOTE_AGGREGATE=$ExpectedCandidateAggregate"
  Write-Host "QA_DEPLOYMENT=$QaDeploymentId @HEAD"
  $Succeeded = $true
}
finally {
  if ($Succeeded -and -not $KeepWorkDir -and (Test-Path -LiteralPath $WorkRoot)) {
    Remove-Item -LiteralPath $WorkRoot -Recurse -Force
  } elseif (Test-Path -LiteralPath $WorkRoot) {
    Write-Host "Workdir conservado para diagnóstico: $WorkRoot" -ForegroundColor Yellow
  }
}
