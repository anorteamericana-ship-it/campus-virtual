Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# CONAPE V4.4 - same Apps Script LIVE candidate builder.
# Windows PowerShell 5.1 compatible and ASCII-only source.
# SAFE BY DESIGN: fresh clone + local candidate only.
# NO clasp push, NO version, NO deploy, NO Script Properties writes, NO Sheet writes.

$ProdScriptId = '1kV4wKnD_OU5DPQSawScjPsUbo1MOg_rAHbtpYupSMPkqywIVSQwdV4y2'
$StableDeploymentId = 'AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ'
$ProtectedDeploymentId = 'AKfycbwIcD4wFkOfvqAxuyxddZLLN52k8JsjgC0iw_J6j7PPiwQeT5W-fAXGiZMmvR1GNCGJ7w'
$ExpectedStableVersion = 424
$ExpectedProtectedVersion = 419
$ExpectedCodeSha = 'eab988abb79705444358ec7f9a24a8023c9c6fc560b2e0656ed91296ab0471ac'
$ExpectedRebecaSha = '3cbe24697e13e45ace8de7ef66b1fc11f35070965ec244f8b4ec646b447cc6b7'
$ExpectedRebecaBytes = 14148
$ExpectedRebecaLf = 441
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false, $true)
$CorePath = Join-Path $PSScriptRoot 'conape_v44_live_mirror_core.js'
$EntryPath = Join-Path $PSScriptRoot 'conape_v44_live_service_entrypoints.js'

function Stop-Run([string]$Message) { throw ('STOP: ' + $Message) }
function Sha([string]$Path) { return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Facts([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { Stop-Run ('Missing file: ' + $Path) }
  $bytes = [IO.File]::ReadAllBytes($Path)
  $lf = 0; $cr = 0
  foreach ($b in $bytes) { if ($b -eq 10) { $lf++ } elseif ($b -eq 13) { $cr++ } }
  return [pscustomobject]@{ Path=$Path; Bytes=$bytes.Length; LF=$lf; CR=$cr; SHA=(Sha $Path) }
}
function Assert-Eq([string]$Label, $Actual, $Expected) {
  if ($Actual -ne $Expected) { Stop-Run ("$Label mismatch. Expected=[$Expected] Actual=[$Actual]") }
}
function Count-Ordinal([string]$Text,[string]$Needle) {
  $count = 0; $offset = 0
  while ($true) {
    $i = $Text.IndexOf($Needle,$offset,[StringComparison]::Ordinal)
    if ($i -lt 0) { break }
    $count++; $offset = $i + $Needle.Length
  }
  return $count
}
function Read-ScriptId([string]$Folder) {
  $p = Join-Path $Folder '.clasp.json'
  if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { Stop-Run 'Missing .clasp.json' }
  return [string]((Get-Content -LiteralPath $p -Raw | ConvertFrom-Json).scriptId)
}
function Write-Utf8Lf([string]$Path,[string]$Text) {
  $normalized = $Text.Replace("`r`n","`n").Replace("`r","`n")
  [IO.File]::WriteAllText($Path,$normalized,$Utf8NoBom)
}
function Get-RelativePath([string]$Base,[string]$Full) {
  $baseUri = New-Object System.Uri(($Base.TrimEnd('\') + '\'))
  $fullUri = New-Object System.Uri($Full)
  return [Uri]::UnescapeDataString($baseUri.MakeRelativeUri($fullUri).ToString()).Replace('/','\')
}
function Copy-ExactTree([string]$SourceRoot,[string]$DestRoot) {
  $files = @(Get-ChildItem -LiteralPath $SourceRoot -Recurse -File | Where-Object {
    $_.Name -ne '.clasp.json' -and $_.Extension -in @('.js','.html','.json')
  })
  foreach ($f in $files) {
    $rel = Get-RelativePath $SourceRoot $f.FullName
    $dest = Join-Path $DestRoot $rel
    $parent = Split-Path -Parent $dest
    if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    [IO.File]::WriteAllBytes($dest,[IO.File]::ReadAllBytes($f.FullName))
    Assert-Eq ('copy SHA ' + $rel) (Sha $dest) (Sha $f.FullName)
  }
  return $files
}
function Find-RootFileBySha([string]$Folder,[string]$ExpectedSha,[string]$Label) {
  $hits = @(Get-ChildItem -LiteralPath $Folder -File -Filter '*.js' | Where-Object { (Sha $_.FullName) -eq $ExpectedSha })
  if ($hits.Count -ne 1) { Stop-Run ("$Label root file expected exactly once by SHA; found $($hits.Count)") }
  return $hits[0].FullName
}
function Find-RootFileByName([string]$Folder,[string]$Name) {
  $p = Join-Path $Folder $Name
  if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { Stop-Run ('Missing root file: ' + $Name) }
  return $p
}
function Get-FunctionInfo([string]$Text,[string]$Name) {
  $anchor = 'function ' + $Name + '('
  $count = Count-Ordinal $Text $anchor
  if ($count -ne 1) { Stop-Run ("Function [$Name] expected exactly once in canonical root source, found $count") }
  $start = $Text.IndexOf($anchor,[StringComparison]::Ordinal)
  $openParen = $start + ('function ' + $Name).Length
  $closeParen = $Text.IndexOf(')',$openParen)
  if ($closeParen -lt 0) { Stop-Run ("Function [$Name] signature malformed") }
  $paramsText = $Text.Substring($openParen+1,$closeParen-$openParen-1)
  $params = @($paramsText.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ })
  foreach ($p in $params) { if ($p -notmatch '^[A-Za-z_$][A-Za-z0-9_$]*$') { Stop-Run ("Function [$Name] has unsupported parameter [$p]") } }
  $brace = $Text.IndexOf('{',$closeParen)
  if ($brace -lt 0) { Stop-Run ("Function [$Name] missing body") }
  $depth=0; $state='code'; $escaped=$false; $i=$brace
  while ($i -lt $Text.Length) {
    $c=$Text[$i]; $n=if($i+1 -lt $Text.Length){$Text[$i+1]}else{[char]0}
    if($state -eq 'line'){if($c -eq "`n"){$state='code'};$i++;continue}
    if($state -eq 'block'){if($c -eq '*' -and $n -eq '/'){$state='code';$i+=2;continue};$i++;continue}
    if($state -eq 'single'){if($escaped){$escaped=$false}elseif($c -eq '\'){$escaped=$true}elseif($c -eq "'"){$state='code'};$i++;continue}
    if($state -eq 'double'){if($escaped){$escaped=$false}elseif($c -eq '\'){$escaped=$true}elseif($c -eq '"'){$state='code'};$i++;continue}
    if($state -eq 'template'){if($escaped){$escaped=$false}elseif($c -eq '\'){$escaped=$true}elseif($c -eq '`'){$state='code'};$i++;continue}
    if($c -eq '/' -and $n -eq '/'){$state='line';$i+=2;continue}
    if($c -eq '/' -and $n -eq '*'){$state='block';$i+=2;continue}
    if($c -eq "'"){$state='single';$i++;continue}
    if($c -eq '"'){$state='double';$i++;continue}
    if($c -eq '`'){$state='template';$i++;continue}
    if($c -eq '{'){$depth++}
    elseif($c -eq '}'){$depth--;if($depth -eq 0){return [pscustomobject]@{Name=$Name;Start=$start;Brace=$brace;End=$i;Length=($i-$start+1);Params=$params;Block=$Text.Substring($start,$i-$start+1)}}}
    $i++
  }
  Stop-Run ("Function [$Name] unbalanced")
}
function Replace-FunctionBlock([string]$Text,$Info,[string]$NewBlock) {
  return $Text.Substring(0,$Info.Start)+$NewBlock+$Text.Substring($Info.Start+$Info.Length)
}
function Prepend-FunctionBody([string]$Text,[string]$Name,[string[]]$Lines) {
  $info=Get-FunctionInfo $Text $Name
  $relBrace=$info.Brace-$info.Start
  $insert="`n"+(($Lines | ForEach-Object {'  '+$_}) -join "`n")+"`n"
  $newBlock=$info.Block.Insert($relBrace+1,$insert)
  return Replace-FunctionBlock $Text $info $newBlock
}
function Find-CanonicalFunctionFile([string]$Folder,[string]$Name) {
  $hits=@()
  Get-ChildItem -LiteralPath $Folder -File -Filter '*.js' | ForEach-Object {
    $t=[IO.File]::ReadAllText($_.FullName,$Utf8NoBom)
    if((Count-Ordinal $t ('function '+$Name+'(')) -gt 0){$hits+=$_.FullName}
  }
  if($hits.Count -ne 1){Stop-Run("Function [$Name] must exist in exactly one ROOT project file; found $($hits.Count)")}
  return $hits[0]
}

if(-not(Test-Path -LiteralPath $CorePath)){Stop-Run 'Mirror core source missing'}
if(-not(Test-Path -LiteralPath $EntryPath)){Stop-Run 'Service entrypoint source missing'}

$stamp=Get-Date -Format 'yyyyMMdd_HHmmss'
$root=Join-Path (Get-Location) ('CONAPE_V44_LIVE_CANDIDATE_'+$stamp)
$prod=Join-Path $root 'PROD_FRESH_READONLY'
$candidate=Join-Path $root 'CANDIDATE_SAME_SCRIPT_ID'
$evidence=Join-Path $root 'EVIDENCE'
New-Item -ItemType Directory -Force -Path $prod,$candidate,$evidence | Out-Null

Write-Host 'STEP 1 - fresh clasp clone of LIVE HEAD (read-only)'
Push-Location $prod
try {
  & npx --yes '@google/clasp@3.3.0' clone $ProdScriptId
  if($LASTEXITCODE -ne 0){Stop-Run 'clasp clone failed'}
  $deployments=(& npx --yes '@google/clasp@3.3.0' deployments 2>&1 | Out-String)
  Write-Utf8Lf (Join-Path $evidence 'deployments.txt') $deployments
} finally { Pop-Location }

Assert-Eq 'Script ID' (Read-ScriptId $prod) $ProdScriptId
if($deployments -notmatch [regex]::Escape($StableDeploymentId)+'.*@'+$ExpectedStableVersion){Stop-Run 'Stable deployment is not @424'}
if($deployments -notmatch [regex]::Escape($ProtectedDeploymentId)+'.*@'+$ExpectedProtectedVersion){Stop-Run 'Protected deployment is not @419'}

Write-Host 'STEP 2 - inventory exact LIVE HEAD files'
$remoteSources=@(Get-ChildItem -LiteralPath $prod -Recurse -File | Where-Object { $_.Name -ne '.clasp.json' -and $_.Extension -in @('.js','.html','.json') })
if($remoteSources.Count -lt 4){Stop-Run ('Unexpectedly small LIVE HEAD source inventory: '+$remoteSources.Count)}
$inventory=@()
foreach($f in ($remoteSources | Sort-Object FullName)){
  $rel=Get-RelativePath $prod $f.FullName
  $facts=Facts $f.FullName
  $inventory += [pscustomobject][ordered]@{file=$rel;bytes=$facts.Bytes;lf=$facts.LF;cr=$facts.CR;sha256=$facts.SHA}
  Write-Host ('  '+$rel+' | '+$facts.Bytes+' bytes | '+$facts.SHA)
}
Write-Utf8Lf (Join-Path $evidence 'remote_inventory.json') ($inventory | ConvertTo-Json -Depth 4)

$code=Find-RootFileBySha $prod $ExpectedCodeSha 'Canonical Code'
$rebeca=Find-RootFileByName $prod 'ZZ_REBECA_V8_ROUTING.js'
$codeFacts=Facts $code; $rebecaFacts=Facts $rebeca
Assert-Eq 'Canonical Code SHA256' $codeFacts.SHA $ExpectedCodeSha
Assert-Eq 'ZZ_REBECA SHA256' $rebecaFacts.SHA $ExpectedRebecaSha
Assert-Eq 'ZZ_REBECA bytes' $rebecaFacts.Bytes $ExpectedRebecaBytes
Assert-Eq 'ZZ_REBECA LF' $rebecaFacts.LF $ExpectedRebecaLf
Assert-Eq 'ZZ_REBECA CR' $rebecaFacts.CR 0
if($codeFacts.CR -ne 0){Stop-Run 'Canonical Code unexpectedly contains CR bytes; byte-safe builder refuses normalization'}

$extraRemote=@($remoteSources | Where-Object { (Get-RelativePath $prod $_.FullName) -match '^EVIDENCE\\' })
if($extraRemote.Count -gt 0){
  Write-Host ('NOTICE - LIVE HEAD contains '+$extraRemote.Count+' EVIDENCE source file(s). They will be preserved byte-exact in the local candidate and NOT modified.')
}

Write-Host 'STEP 3 - copy entire current LIVE HEAD source tree byte-exact'
$copied=Copy-ExactTree $prod $candidate
Assert-Eq 'candidate pre-module file count' @(Get-ChildItem -LiteralPath $candidate -Recurse -File).Count $remoteSources.Count

Write-Host 'STEP 4 - verify existing canonical service-HMAC route in ROOT sources only'
$isActionFile=Find-CanonicalFunctionFile $candidate '_cs21a93IsAction_'
$dispatchFile=Find-CanonicalFunctionFile $candidate '_cs21a93Dispatch_'
$handlerFile=Find-CanonicalFunctionFile $candidate '_cs21a93HandleServiceRequest_'
$handlerText=[IO.File]::ReadAllText($handlerFile,$Utf8NoBom)
$handlerInfo=Get-FunctionInfo $handlerText '_cs21a93HandleServiceRequest_'
$verifyAt=$handlerInfo.Block.IndexOf('_cs21a93Verify_',[StringComparison]::Ordinal)
$dispatchAt=$handlerInfo.Block.IndexOf('_cs21a93Dispatch_',[StringComparison]::Ordinal)
if($verifyAt -lt 0 -or $dispatchAt -lt 0 -or $verifyAt -ge $dispatchAt){Stop-Run '_cs21a93HandleServiceRequest_ does not prove VERIFY before DISPATCH. Refuse to route CONAPE.'}

$isActionText=[IO.File]::ReadAllText($isActionFile,$Utf8NoBom)
$dispatchText=[IO.File]::ReadAllText($dispatchFile,$Utf8NoBom)
$isActionInfo=Get-FunctionInfo $isActionText '_cs21a93IsAction_'
$dispatchInfo=Get-FunctionInfo $dispatchText '_cs21a93Dispatch_'
if($isActionInfo.Params.Count -lt 1){Stop-Run '_cs21a93IsAction_ has no action parameter'}
if($dispatchInfo.Params.Count -lt 1){Stop-Run '_cs21a93Dispatch_ has no request parameter'}
Write-Utf8Lf (Join-Path $evidence '_cs21a93IsAction_BEFORE.js') $isActionInfo.Block
Write-Utf8Lf (Join-Path $evidence '_cs21a93Dispatch_BEFORE.js') $dispatchInfo.Block
Write-Utf8Lf (Join-Path $evidence '_cs21a93HandleServiceRequest.js') $handlerInfo.Block

$actionParam=$isActionInfo.Params[0]
$requestParam=$dispatchInfo.Params[0]
$readAction='agentConapeMirrorReadV44'
$applyAction='agentConapeMirrorApplySnapshotV44'
foreach($marker in @($readAction,$applyAction)){
  $allBefore=$isActionText+"`n"+$dispatchText
  if((Count-Ordinal $allBefore $marker) -ne 0){Stop-Run("Action already exists before patch: $marker")}
}

Write-Host 'STEP 5 - patch only the two existing service-HMAC routing functions in local candidate'
$isActionPatched=Prepend-FunctionBody $isActionText '_cs21a93IsAction_' @(
  '// CONAPE V4.4 LIVE: reuse the existing verified service-HMAC path.',
  "if (String($actionParam || '') === '$readAction' || String($actionParam || '') === '$applyAction') return true;"
)
Write-Utf8Lf $isActionFile $isActionPatched

$dispatchText=[IO.File]::ReadAllText($dispatchFile,$Utf8NoBom)
$dispatchPatched=Prepend-FunctionBody $dispatchText '_cs21a93Dispatch_' @(
  '// CONAPE V4.4 LIVE: reached only after canonical service-HMAC verification.',
  "var __conapeV44Action = String($requestParam && $requestParam.action || '');",
  "if (__conapeV44Action === '$readAction') return agentConapeMirrorReadV44($requestParam.data || {});",
  "if (__conapeV44Action === '$applyAction') return agentConapeMirrorApplySnapshotV44Service($requestParam.data || {});"
)
Write-Utf8Lf $dispatchFile $dispatchPatched

Write-Host 'STEP 6 - add one VENTAS_CONAPE_V44 server file to same local candidate'
$core=[IO.File]::ReadAllText($CorePath,$Utf8NoBom)
$humanInfo=Get-FunctionInfo $core 'conapeMirrorReadForSalesV44'
$core=$core.Remove($humanInfo.Start,$humanInfo.Length).TrimEnd()+"`n"
$entry=[IO.File]::ReadAllText($EntryPath,$Utf8NoBom).Trim()+"`n"
$module=$core+"`n"+$entry
if($module -match 'function\s+do(Post|Get)\s*\('){Stop-Run 'Module must not define doPost/doGet'}
if($module -match 'LockService|ScriptApp\.newTrigger|UrlFetchApp'){Stop-Run 'Module contains forbidden infrastructure'}
if((Count-Ordinal $module 'function conapeMirrorReadForSalesV44(') -ne 0){Stop-Run 'Unused human route leaked into deployable module'}
$modulePath=Join-Path $candidate 'VENTAS_CONAPE_V44.js'
Write-Utf8Lf $modulePath $module
Assert-Eq 'candidate post-module file count' @(Get-ChildItem -LiteralPath $candidate -Recurse -File).Count ($remoteSources.Count + 1)

Write-Host 'STEP 7 - prove every unmodified remote file remains byte-exact'
$patchedRel=@(
  (Get-RelativePath $candidate $isActionFile),
  (Get-RelativePath $candidate $dispatchFile),
  'VENTAS_CONAPE_V44.js'
) | Select-Object -Unique
foreach($f in $remoteSources){
  $rel=Get-RelativePath $prod $f.FullName
  if($rel -notin $patchedRel){Assert-Eq ('unchanged byte-exact '+$rel) (Sha (Join-Path $candidate $rel)) (Sha $f.FullName)}
}

Write-Host 'STEP 8 - syntax check ROOT runtime JS only; evidence files are inventory-only and untouched'
$node=Get-Command node -ErrorAction SilentlyContinue
if($null -eq $node){Stop-Run 'node executable not found'}
Get-ChildItem -LiteralPath $candidate -File -Filter '*.js' | ForEach-Object {
  & node --check $_.FullName
  if($LASTEXITCODE -ne 0){Stop-Run('node --check failed: '+$_.Name)}
}

$isActionAfterText=[IO.File]::ReadAllText($isActionFile,$Utf8NoBom)
$dispatchAfterText=[IO.File]::ReadAllText($dispatchFile,$Utf8NoBom)
Write-Utf8Lf (Join-Path $evidence '_cs21a93IsAction_AFTER.js') (Get-FunctionInfo $isActionAfterText '_cs21a93IsAction_').Block
Write-Utf8Lf (Join-Path $evidence '_cs21a93Dispatch_AFTER.js') (Get-FunctionInfo $dispatchAfterText '_cs21a93Dispatch_').Block

$manifest=@()
Get-ChildItem -LiteralPath $candidate -Recurse -File | Sort-Object FullName | ForEach-Object {
  $f=Facts $_.FullName
  $rel=Get-RelativePath $candidate $_.FullName
  $manifest += [pscustomobject][ordered]@{file=$rel;bytes=$f.Bytes;lf=$f.LF;cr=$f.CR;sha256=$f.SHA;changed=($rel -in $patchedRel)}
}
Write-Utf8Lf (Join-Path $evidence 'candidate_manifest.json') ($manifest | ConvertTo-Json -Depth 4)

$summary=@(
  'CONAPE V4.4 LIVE CANDIDATE BUILD: PASS',
  ('SCRIPT_ID='+$ProdScriptId),
  ('STABLE_DEPLOYMENT='+$StableDeploymentId+'@'+$ExpectedStableVersion),
  ('PROTECTED_DEPLOYMENT='+$ProtectedDeploymentId+'@'+$ExpectedProtectedVersion),
  ('REMOTE_SOURCE_FILES='+$remoteSources.Count),
  ('REMOTE_EVIDENCE_FILES='+$extraRemote.Count),
  ('BASE_CODE_SHA256='+$codeFacts.SHA),
  ('BASE_REBECA_SHA256='+$rebecaFacts.SHA),
  ('HMAC_HANDLER='+[IO.Path]::GetFileName($handlerFile)),
  ('HMAC_IS_ACTION_FILE='+[IO.Path]::GetFileName($isActionFile)),
  ('HMAC_DISPATCH_FILE='+[IO.Path]::GetFileName($dispatchFile)),
  'NEW_PROJECT_FILE=VENTAS_CONAPE_V44.js',
  'NEW_SCRIPT_ID=NO',
  'NEW_APPS_SCRIPT_PROJECT=NO',
  'TOUCH_QA_MODULAR=NO',
  'CLASP_PUSH=NO',
  'NEW_VERSION=NO',
  'DEPLOYMENT_MOVE=NO',
  'SCRIPT_PROPERTIES_WRITE=NO',
  'SHEET_WRITE=NO'
)
Write-Utf8Lf (Join-Path $evidence 'BUILD_SUMMARY.txt') (($summary -join "`n")+"`n")

Write-Host ''
Write-Host '============================================================'
Write-Host 'CONAPE V4.4 SAME-SCRIPT LIVE CANDIDATE: PASS'
Write-Host '============================================================'
Write-Host ('Candidate: '+$candidate)
Write-Host ('Evidence:  '+$evidence)
Write-Host ('Remote source files observed: '+$remoteSources.Count)
Write-Host ('Remote EVIDENCE files observed: '+$extraRemote.Count)
Write-Host 'Same production Script ID: YES'
Write-Host 'New Apps Script project: NO'
Write-Host 'QA modular touched: NO'
Write-Host 'Remote writes: 0'
Write-Host 'Deployment/version changes: 0'
Write-Host ''
Write-Host 'NEXT GATE: inspect inventory and exact candidate diff. DO NOT clasp push yet.'
