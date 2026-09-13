Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# CONAPE V4.4 · builder del candidato para el MISMO Apps Script productivo.
# SAFE BY DESIGN: clone + construcción local. NO clasp push, NO version, NO deploy,
# NO Script Properties, NO escritura a Sheets.

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
$RepoRoot = Split-Path -Parent $PSScriptRoot
$CorePath = Join-Path $PSScriptRoot 'conape_v44_live_mirror_core.js'
$EntryPath = Join-Path $PSScriptRoot 'conape_v44_live_service_entrypoints.js'

function Stop-Run([string]$Message) { throw ('STOP: ' + $Message) }
function Sha([string]$Path) { (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Facts([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { Stop-Run ('Missing file: ' + $Path) }
  $bytes = [IO.File]::ReadAllBytes($Path)
  $lf=0; $cr=0
  foreach($b in $bytes){ if($b -eq 10){$lf++} elseif($b -eq 13){$cr++} }
  [pscustomobject]@{ Path=$Path; Bytes=$bytes.Length; LF=$lf; CR=$cr; SHA=(Sha $Path); BytesRaw=$bytes }
}
function Assert-Eq([string]$Label,$Actual,$Expected){ if($Actual -ne $Expected){Stop-Run("$Label mismatch. Expected=[$Expected] Actual=[$Actual]")} }
function Count-Ordinal([string]$Text,[string]$Needle){
  $count=0;$offset=0
  while($true){$i=$Text.IndexOf($Needle,$offset,[StringComparison]::Ordinal);if($i -lt 0){break};$count++;$offset=$i+$Needle.Length}
  $count
}
function Resolve-One([string]$Folder,[string]$BaseName){
  $c=@(
    Join-Path $Folder ($BaseName+'.js')
    Join-Path $Folder ($BaseName+'.html')
    Join-Path $Folder ($BaseName+'.json')
    Join-Path $Folder $BaseName
  ) | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf }
  if(@($c).Count -ne 1){Stop-Run("Expected one [$BaseName] file; found $(@($c).Count)")}
  $c[0]
}
function Read-ScriptId([string]$Folder){
  $p=Join-Path $Folder '.clasp.json'
  if(-not(Test-Path -LiteralPath $p)){Stop-Run 'Missing .clasp.json'}
  [string]((Get-Content -LiteralPath $p -Raw | ConvertFrom-Json).scriptId)
}
function Get-FunctionInfo([string]$Text,[string]$Name){
  $anchor='function '+$Name+'('
  $count=Count-Ordinal $Text $anchor
  if($count -ne 1){Stop-Run("Function [$Name] expected exactly once, found $count")}
  $start=$Text.IndexOf($anchor,[StringComparison]::Ordinal)
  $openParen=$start+('function '+$Name).Length
  $closeParen=$Text.IndexOf(')',$openParen)
  if($closeParen -lt 0){Stop-Run("Function [$Name] signature malformed")}
  $paramsText=$Text.Substring($openParen+1,$closeParen-$openParen-1)
  $params=@($paramsText.Split(',') | ForEach-Object {$_.Trim()} | Where-Object {$_})
  foreach($p in $params){if($p -notmatch '^[A-Za-z_$][A-Za-z0-9_$]*$'){Stop-Run("Function [$Name] has unsupported parameter [$p]")}}
  $brace=$Text.IndexOf('{',$closeParen)
  if($brace -lt 0){Stop-Run("Function [$Name] missing body")}
  $depth=0;$state='code';$escaped=$false;$i=$brace
  while($i -lt $Text.Length){
    $c=$Text[$i];$n=if($i+1 -lt $Text.Length){$Text[$i+1]}else{[char]0}
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
    elseif($c -eq '}'){$depth--;if($depth -eq 0){
      return [pscustomobject]@{Name=$Name;Start=$start;Brace=$brace;End=$i;Length=($i-$start+1);Params=$params;Block=$Text.Substring($start,$i-$start+1)}
    }}
    $i++
  }
  Stop-Run("Function [$Name] unbalanced")
}
function Replace-FunctionBlock([string]$Text,$Info,[string]$NewBlock){
  $Text.Substring(0,$Info.Start)+$NewBlock+$Text.Substring($Info.Start+$Info.Length)
}
function Prepend-FunctionBody([string]$Text,[string]$Name,[string[]]$Lines){
  $info=Get-FunctionInfo $Text $Name
  $relBrace=$info.Brace-$info.Start
  $insert="`n"+(($Lines | ForEach-Object {'  '+$_}) -join "`n")+"`n"
  $newBlock=$info.Block.Insert($relBrace+1,$insert)
  Replace-FunctionBlock $Text $info $newBlock
}
function Find-FunctionFile([string]$Folder,[string]$Name){
  $hits=@()
  Get-ChildItem -LiteralPath $Folder -File | Where-Object {$_.Extension -eq '.js'} | ForEach-Object {
    $t=[IO.File]::ReadAllText($_.FullName,$Utf8NoBom)
    if((Count-Ordinal $t ('function '+$Name+'(')) -gt 0){$hits+=$_.FullName}
  }
  if($hits.Count -ne 1){Stop-Run("Function [$Name] must exist in exactly one project file; found $($hits.Count)")}
  $hits[0]
}
function Copy-Exact([string]$Source,[string]$Dest){
  [IO.File]::WriteAllBytes($Dest,[IO.File]::ReadAllBytes($Source))
  Assert-Eq ('copy SHA '+[IO.Path]::GetFileName($Dest)) (Sha $Dest) (Sha $Source)
}
function Write-Utf8Lf([string]$Path,[string]$Text){
  if($Text.Contains("`r")){Stop-Run('Attempted to write CR bytes: '+$Path)}
  [IO.File]::WriteAllText($Path,$Text,$Utf8NoBom)
}

if(-not(Test-Path -LiteralPath $CorePath)){Stop-Run 'Mirror core source missing'}
if(-not(Test-Path -LiteralPath $EntryPath)){Stop-Run 'Service entrypoint source missing'}

$stamp=Get-Date -Format 'yyyyMMdd_HHmmss'
$root=Join-Path (Get-Location) ('CONAPE_V44_LIVE_CANDIDATE_'+$stamp)
$prod=Join-Path $root 'PROD_FRESH_READONLY'
$candidate=Join-Path $root 'CANDIDATE_SAME_SCRIPT_ID'
$evidence=Join-Path $root 'EVIDENCE'
New-Item -ItemType Directory -Force -Path $prod,$candidate,$evidence | Out-Null

# 1. FRESH CLONE ONLY. No push/deploy command exists in this script.
Push-Location $prod
try{
  & npx --yes '@google/clasp@3.3.0' clone $ProdScriptId
  if($LASTEXITCODE -ne 0){Stop-Run 'clasp clone failed'}
  $deployments=(& npx --yes '@google/clasp@3.3.0' deployments 2>&1 | Out-String)
  Write-Utf8Lf (Join-Path $evidence 'deployments.txt') ($deployments.Replace("`r",''))
}finally{Pop-Location}

Assert-Eq 'Script ID' (Read-ScriptId $prod) $ProdScriptId
if($deployments -notmatch [regex]::Escape($StableDeploymentId)+'.*@'+$ExpectedStableVersion){Stop-Run 'Stable deployment is not @424'}
if($deployments -notmatch [regex]::Escape($ProtectedDeploymentId)+'.*@'+$ExpectedProtectedVersion){Stop-Run 'Protected deployment is not @419'}

$code=Resolve-One $prod 'Código'
$rebeca=Resolve-One $prod 'ZZ_REBECA_V8_ROUTING'
$codeFacts=Facts $code;$rebecaFacts=Facts $rebeca
Assert-Eq 'Código SHA256' $codeFacts.SHA $ExpectedCodeSha
Assert-Eq 'ZZ_REBECA SHA256' $rebecaFacts.SHA $ExpectedRebecaSha
Assert-Eq 'ZZ_REBECA bytes' $rebecaFacts.Bytes $ExpectedRebecaBytes
Assert-Eq 'ZZ_REBECA LF' $rebecaFacts.LF $ExpectedRebecaLf
Assert-Eq 'ZZ_REBECA CR' $rebecaFacts.CR 0
if($codeFacts.CR -ne 0){Stop-Run 'Código.js unexpectedly contains CR bytes; byte-safe builder refuses normalization'}

# 2. Copy current project exactly first. .clasp.json stays evidence-only and is not candidate source.
Get-ChildItem -LiteralPath $prod -File | Where-Object {$_.Name -ne '.clasp.json' -and $_.Extension -in @('.js','.html','.json')} | ForEach-Object {
  Copy-Exact $_.FullName (Join-Path $candidate $_.Name)
}
$sourceCount=@(Get-ChildItem -LiteralPath $candidate -File).Count
Assert-Eq 'fresh source file count before V4.4 module' $sourceCount 4

# 3. Verify existing HMAC chain before changing it.
$isActionFile=Find-FunctionFile $candidate '_cs21a93IsAction_'
$dispatchFile=Find-FunctionFile $candidate '_cs21a93Dispatch_'
$handlerFile=Find-FunctionFile $candidate '_cs21a93HandleServiceRequest_'
$handlerText=[IO.File]::ReadAllText($handlerFile,$Utf8NoBom)
$handlerInfo=Get-FunctionInfo $handlerText '_cs21a93HandleServiceRequest_'
$verifyAt=$handlerInfo.Block.IndexOf('_cs21a93Verify_',[StringComparison]::Ordinal)
$dispatchAt=$handlerInfo.Block.IndexOf('_cs21a93Dispatch_',[StringComparison]::Ordinal)
if($verifyAt -lt 0 -or $dispatchAt -lt 0 -or $verifyAt -ge $dispatchAt){
  Stop-Run '_cs21a93HandleServiceRequest_ does not prove VERIFY before DISPATCH. Refuse to route CONAPE.'
}

# Preserve exact originals of routing blocks as evidence.
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

# 4. Add only two service-HMAC routes. Existing verifier/idempotency/rate-limit remains untouched.
$isActionPatched=Prepend-FunctionBody $isActionText '_cs21a93IsAction_' @(
  "// CONAPE V4.4 LIVE: reuse the existing verified service-HMAC path.",
  "if (String($actionParam || '') === '$readAction' || String($actionParam || '') === '$applyAction') return true;"
)
Write-Utf8Lf $isActionFile $isActionPatched

# If dispatch and isAction share a file, reload AFTER the first patch so offsets/source are current.
$dispatchText=[IO.File]::ReadAllText($dispatchFile,$Utf8NoBom)
$dispatchPatched=Prepend-FunctionBody $dispatchText '_cs21a93Dispatch_' @(
  "// CONAPE V4.4 LIVE: this function is reached only after _cs21a93Verify_ in the canonical service handler.",
  "var __conapeV44Action = String($requestParam && $requestParam.action || '');",
  "if (__conapeV44Action === '$readAction') return agentConapeMirrorReadV44($requestParam.data || {});",
  "if (__conapeV44Action === '$applyAction') return agentConapeMirrorApplySnapshotV44Service($requestParam.data || {});"
)
Write-Utf8Lf $dispatchFile $dispatchPatched

# 5. Add ONE server file to the SAME Apps Script project. Strip the unused human-route helper.
$core=[IO.File]::ReadAllText($CorePath,$Utf8NoBom)
$humanInfo=Get-FunctionInfo $core 'conapeMirrorReadForSalesV44'
$core=$core.Remove($humanInfo.Start,$humanInfo.Length).TrimEnd()+"`n"
$entry=[IO.File]::ReadAllText($EntryPath,$Utf8NoBom).Trim()+"`n"
$module=$core+"`n"+$entry
if($module -match 'function\s+do(Post|Get)\s*\('){Stop-Run 'Module must not define doPost/doGet'}
if($module -match 'LockService|ScriptApp\.newTrigger|UrlFetchApp'){Stop-Run 'Module contains forbidden infrastructure'}
if($module.Contains('conapeMirrorReadForSalesV44')){Stop-Run 'Unused human route leaked into deployable module'}
$modulePath=Join-Path $candidate 'VENTAS_CONAPE_V44.js'
Write-Utf8Lf $modulePath $module

# 6. Structural postconditions.
Assert-Eq 'candidate source file count' @(Get-ChildItem -LiteralPath $candidate -File).Count 5
$allCandidate=(Get-ChildItem -LiteralPath $candidate -File -Filter '*.js' | ForEach-Object {[IO.File]::ReadAllText($_.FullName,$Utf8NoBom)}) -join "`n"
Assert-Eq 'read action occurrence in IsAction+Dispatch' ((Count-Ordinal ([IO.File]::ReadAllText($isActionFile,$Utf8NoBom)+"`n"+[IO.File]::ReadAllText($dispatchFile,$Utf8NoBom)) $readAction) -ge 2) $true
Assert-Eq 'apply action occurrence in IsAction+Dispatch' ((Count-Ordinal ([IO.File]::ReadAllText($isActionFile,$Utf8NoBom)+"`n"+[IO.File]::ReadAllText($dispatchFile,$Utf8NoBom)) $applyAction) -ge 2) $true
if((Count-Ordinal $allCandidate 'function agentConapeMirrorReadV44(') -ne 1){Stop-Run 'agentConapeMirrorReadV44 must exist exactly once'}
if((Count-Ordinal $allCandidate 'function agentConapeMirrorApplySnapshotV44Service(') -ne 1){Stop-Run 'agentConapeMirrorApplySnapshotV44Service must exist exactly once'}
if($allCandidate.Contains('CONAPE_MIRROR_HMAC_SECRET')){Stop-Run 'Parallel HMAC secret detected in candidate'}

# Ensure files not intentionally patched remain byte-exact to fresh clone.
$patchedNames=@([IO.Path]::GetFileName($isActionFile),[IO.Path]::GetFileName($dispatchFile),'VENTAS_CONAPE_V44.js') | Select-Object -Unique
Get-ChildItem -LiteralPath $prod -File | Where-Object {$_.Name -ne '.clasp.json' -and $_.Extension -in @('.js','.html','.json')} | ForEach-Object {
  if($_.Name -notin $patchedNames){Assert-Eq ('unchanged byte-exact '+$_.Name) (Sha (Join-Path $candidate $_.Name)) (Sha $_.FullName)}
}

# 7. Parse all server JS locally. Never execute Apps Script functions here.
$node=Get-Command node -ErrorAction SilentlyContinue
if($null -eq $node){Stop-Run 'node executable not found'}
Get-ChildItem -LiteralPath $candidate -File -Filter '*.js' | ForEach-Object {
  & node --check $_.FullName
  if($LASTEXITCODE -ne 0){Stop-Run('node --check failed: '+$_.Name)}
}

# 8. Evidence: before/after hashes + exact routing blocks. No secrets, no student data.
$isActionAfterText=[IO.File]::ReadAllText($isActionFile,$Utf8NoBom)
$dispatchAfterText=[IO.File]::ReadAllText($dispatchFile,$Utf8NoBom)
Write-Utf8Lf (Join-Path $evidence '_cs21a93IsAction_AFTER.js') (Get-FunctionInfo $isActionAfterText '_cs21a93IsAction_').Block
Write-Utf8Lf (Join-Path $evidence '_cs21a93Dispatch_AFTER.js') (Get-FunctionInfo $dispatchAfterText '_cs21a93Dispatch_').Block

$manifest=@()
Get-ChildItem -LiteralPath $candidate -File | Sort-Object Name | ForEach-Object {
  $f=Facts $_.FullName
  $manifest += [pscustomobject][ordered]@{file=$_.Name;bytes=$f.Bytes;lf=$f.LF;cr=$f.CR;sha256=$f.SHA;changed=($_.Name -in $patchedNames)}
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $evidence 'candidate_manifest.json') -Encoding utf8NoBOM

$summary=@(
  'CONAPE V4.4 LIVE CANDIDATE BUILD: PASS',
  ('SCRIPT_ID='+$ProdScriptId),
  ('STABLE_DEPLOYMENT='+$StableDeploymentId+'@'+$ExpectedStableVersion),
  ('PROTECTED_DEPLOYMENT='+$ProtectedDeploymentId+'@'+$ExpectedProtectedVersion),
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
Write-Host 'Same production Script ID: YES'
Write-Host 'New Apps Script project: NO'
Write-Host 'QA modular touched: NO'
Write-Host 'Remote writes: 0'
Write-Host 'Deployment/version changes: 0'
Write-Host ''
Write-Host 'NEXT GATE (not performed here): inspect candidate diff, then explicit authorization before clasp push/version/deployment.'
