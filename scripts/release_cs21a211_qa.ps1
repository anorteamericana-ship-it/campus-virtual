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
$ExpectedCandidateAggregate = '6c1c79c04994f2c10a5c4feee03c275e1664a003497a1febb0ca0add8a960bc1'
$ExpectedCandidateBytes = 4688555
$ExpectedPatchSha = '20aebc28ecc42b550f6d1b03a02314674d130d6825faa40c4685bfea5d423768'
$ProdDeploymentId = 'AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$PatchManifestPath = Join-Path $RepoRoot 'patches\apps-script\CS21A211_QA_CONTAINMENT.manifest.json'
$SnapshotAnalyzer = Join-Path $PSScriptRoot 'apps_script_qa_snapshot_manifest_cs21a178.mjs'
$Stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMdd_HHmmssZ')
$WorkRoot = Join-Path ([IO.Path]::GetTempPath()) "campus_cs21a211e_release_$Stamp"
$SourceDir = Join-Path $WorkRoot 'source'
$CandidateDir = Join-Path $WorkRoot 'candidate'
$VerifyDir = Join-Path $WorkRoot 'verify-remote'
$CombinedPatch = Join-Path $WorkRoot 'CS21A211E.patch'
$EvidenceDir = Join-Path $EvidenceRoot "CS21A211E_$Stamp"
$SourceManifestPath = Join-Path $EvidenceDir 'pre-push-manifest.json'
$CandidateManifestPath = Join-Path $EvidenceDir 'candidate-manifest.json'
$RemoteManifestPath = Join-Path $EvidenceDir 'post-push-remote-manifest.json'
$PrePushZip = Join-Path $EvidenceDir 'pre-push-source.zip'
$Succeeded = $false

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

function Invoke-Clasp {
  param([string[]]$Arguments, [string]$WorkingDirectory = '', [switch]$AllowFailure, [switch]$Quiet)
  $all = @('--yes', "@google/clasp@$ClaspVersion") + $Arguments
  return Invoke-Native -FilePath $NpxExe -Arguments $all -WorkingDirectory $WorkingDirectory -AllowFailure:$AllowFailure -Quiet:$Quiet
}

function Assert-Manifest([string]$Path, [string]$ExpectedAggregate, [int]$ExpectedBytes, [string]$Label) {
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

function Build-CombinedPatch {
  $manifest = Get-Content -LiteralPath $PatchManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $stream = [IO.MemoryStream]::new()
  try {
    foreach ($part in $manifest.patch_parts) {
      $path = Join-Path $RepoRoot ([string]$part.path).Replace('/','\')
      if (-not (Test-Path -LiteralPath $path)) { Fail "Falta fragmento de patch: $path" }
      $bytes = [IO.File]::ReadAllBytes($path)
      $stream.Write($bytes,0,$bytes.Length)
    }
    [IO.File]::WriteAllBytes($CombinedPatch,$stream.ToArray())
  }
  finally { $stream.Dispose() }
  $sha = (Get-FileHash -LiteralPath $CombinedPatch -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($sha -ne $ExpectedPatchSha) { Fail "Patch combinado no coincide: $sha; esperado $ExpectedPatchSha." }
  if ([string]$manifest.patch_sha256 -ne $ExpectedPatchSha) { Fail 'Manifest del patch no coincide con el hash canónico.' }
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

Write-Host '=== CS21A211E · RELEASE CONTROLADO QA ===' -ForegroundColor Cyan
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
  Build-CombinedPatch
  Copy-Tree -From $SourceDir -To $CandidateDir
  Invoke-Native -FilePath $GitExe -Arguments @('init','--quiet') -WorkingDirectory $CandidateDir | Out-Null
  Invoke-Native -FilePath $GitExe -Arguments @('config','core.autocrlf','false') -WorkingDirectory $CandidateDir | Out-Null
  Invoke-Native -FilePath $GitExe -Arguments @('apply','--check','--whitespace=nowarn',$CombinedPatch) -WorkingDirectory $CandidateDir | Out-Null
  Invoke-Native -FilePath $GitExe -Arguments @('apply','--whitespace=nowarn',$CombinedPatch) -WorkingDirectory $CandidateDir | Out-Null
  Remove-Item -LiteralPath (Join-Path $CandidateDir '.git') -Recurse -Force

  Write-Host "`n5/9 · Hash + sintaxis del candidato..." -ForegroundColor Cyan
  Generate-Manifest -Dir $CandidateDir -Output $CandidateManifestPath
  $candidateManifest = Assert-Manifest -Path $CandidateManifestPath -ExpectedAggregate $ExpectedCandidateAggregate -ExpectedBytes $ExpectedCandidateBytes -Label 'CANDIDATE'
  Assert-Syntax -Dir $CandidateDir
  Write-Host "PASS · candidate aggregate $($candidateManifest.aggregate_sha256) · 7/7 JS syntax · 13/13 self-route" -ForegroundColor Green

  if (-not $Push) {
    Write-Host "`nDRY-RUN PASS · no se hizo push remoto." -ForegroundColor Yellow
    Write-Host "Para autorizar únicamente QA: .\scripts\release_cs21a211_qa.ps1 -Push"
    $Succeeded = $true
    return
  }

  Write-Host "`n6/9 · PUSH al Script ID QA canónico, sin --force..." -ForegroundColor Cyan
  $candidateClasp = Get-Content -LiteralPath (Join-Path $CandidateDir '.clasp.json') -Raw -Encoding UTF8 | ConvertFrom-Json
  if ([string]$candidateClasp.scriptId -ne $QaScriptId) { Fail 'ABORT antes de push: candidate .clasp.json no apunta al QA canónico.' }
  Invoke-Clasp -Arguments @('push') -WorkingDirectory $CandidateDir | Out-Null
  Write-Host 'PASS · clasp push ejecutado únicamente contra QA.' -ForegroundColor Green

  Write-Host "`n7/9 · Re-clone remoto post-push y hash..." -ForegroundColor Cyan
  New-Item -ItemType Directory -Path $VerifyDir -Force | Out-Null
  Invoke-Clasp -Arguments @('clone-script',$QaScriptId) -WorkingDirectory $VerifyDir | Out-Null
  Generate-Manifest -Dir $VerifyDir -Output $RemoteManifestPath
  $remoteManifest = Assert-Manifest -Path $RemoteManifestPath -ExpectedAggregate $ExpectedCandidateAggregate -ExpectedBytes $ExpectedCandidateBytes -Label 'REMOTE POST-PUSH'
  Assert-Syntax -Dir $VerifyDir
  Write-Host "PASS · remote @HEAD = candidate $($remoteManifest.aggregate_sha256)" -ForegroundColor Green

  Write-Host "`n8/9 · Verificando deployment QA estable..." -ForegroundColor Cyan
  $dep = Invoke-Clasp -Arguments @('list-deployments') -WorkingDirectory $VerifyDir -AllowFailure -Quiet
  if ($dep.Code -ne 0) { $dep = Invoke-Clasp -Arguments @('deployments') -WorkingDirectory $VerifyDir -AllowFailure -Quiet }
  if ($dep.Code -ne 0) { Fail 'No se pudieron enumerar deployments después del push.' }
  if (-not $dep.Text.Contains($QaDeploymentId)) { Fail "No aparece el deployment QA canónico $QaDeploymentId." }
  if (-not $dep.Text.Contains('@HEAD')) { Fail 'El deployment QA canónico ya no aparece asociado a @HEAD.' }
  Write-Host 'PASS · mismo deployment QA observado; no se creó deployment paralelo.' -ForegroundColor Green

  Write-Host "`n9/9 · Evidencia local de cierre técnico..." -ForegroundColor Cyan
  $result = [ordered]@{
    schema = 'CS21A211E_QA_RELEASE_RESULT_1'
    generated_at_utc = [DateTime]::UtcNow.ToString('o')
    qa_script_id = $QaScriptId
    qa_deployment_id = $QaDeploymentId
    source_aggregate = $ExpectedSourceAggregate
    candidate_aggregate = $ExpectedCandidateAggregate
    remote_post_push_aggregate = [string]$remoteManifest.aggregate_sha256
    patch_sha256 = $ExpectedPatchSha
    push_performed = $true
    force_used = $false
    new_deployment_created = $false
    production_touched = $false
    e4_business_write_executed = $false
  }
  $result | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $EvidenceDir 'release-result.json') -Encoding UTF8
  Write-Host "PASS · evidencia: $EvidenceDir" -ForegroundColor Green
  Write-Host "`nCS21A211E_QA_PUSH=PASS" -ForegroundColor Green
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
