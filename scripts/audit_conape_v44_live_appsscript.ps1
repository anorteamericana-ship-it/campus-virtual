Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# CONAPE V4.4 · LIVE Apps Script source audit
# READ-ONLY ONLY: clones PROD and captures exact source evidence.
# It never pushes, deploys, versions, edits Script Properties, or writes Sheets.

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

function Stop-Run([string]$Message) { throw ('STOP: ' + $Message) }
function Sha([string]$Path) { return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Facts([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { Stop-Run ('Missing file: ' + $Path) }
  $bytes = [IO.File]::ReadAllBytes($Path)
  $lf = 0; $cr = 0
  foreach ($b in $bytes) { if ($b -eq 10) { $lf++ } elseif ($b -eq 13) { $cr++ } }
  [pscustomobject]@{ Path=$Path; Bytes=$bytes.Length; LF=$lf; CR=$cr; SHA=(Sha $Path) }
}
function Assert-Eq([string]$Label, $Actual, $Expected) {
  if ($Actual -ne $Expected) { Stop-Run ("$Label mismatch. Expected=[$Expected] Actual=[$Actual]") }
}
function Resolve-One([string]$Folder, [string]$BaseName) {
  $c = @(
    (Join-Path $Folder ($BaseName + '.js')),
    (Join-Path $Folder ($BaseName + '.html')),
    (Join-Path $Folder ($BaseName + '.json')),
    (Join-Path $Folder $BaseName)
  ) | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf }
  if (@($c).Count -ne 1) { Stop-Run ("Expected one [$BaseName] file; found $(@($c).Count)") }
  return $c[0]
}
function Read-ScriptId([string]$Folder) {
  $p = Join-Path $Folder '.clasp.json'
  if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { Stop-Run 'Missing .clasp.json' }
  return [string]((Get-Content -LiteralPath $p -Raw | ConvertFrom-Json).scriptId)
}
function Count-Ordinal([string]$Text,[string]$Needle) {
  $count=0; $offset=0
  while ($true) {
    $i=$Text.IndexOf($Needle,$offset,[StringComparison]::Ordinal)
    if($i -lt 0){break}; $count++; $offset=$i+$Needle.Length
  }
  return $count
}
function Get-FunctionBlock([string]$Text,[string]$Name) {
  $anchor='function ' + $Name + '('
  if ((Count-Ordinal $Text $anchor) -ne 1) { return $null }
  $start=$Text.IndexOf($anchor,[StringComparison]::Ordinal)
  $brace=$Text.IndexOf('{',$start)
  if($brace -lt 0){return $null}
  $depth=0; $state='code'; $escaped=$false; $i=$brace
  while($i -lt $Text.Length){
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
    elseif($c -eq '}'){$depth--;if($depth -eq 0){return $Text.Substring($start,($i-$start)+1)}}
    $i++
  }
  return $null
}

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$root = Join-Path (Get-Location) ('_evidence_conape_v44_live_' + $stamp)
$clone = Join-Path $root 'PROD_LIVE_READONLY'
$extract = Join-Path $root 'EXTRACTS'
New-Item -ItemType Directory -Force -Path $clone,$extract | Out-Null

Push-Location $clone
try {
  & npx --yes '@google/clasp@3.3.0' clone $ProdScriptId
  if($LASTEXITCODE -ne 0){Stop-Run 'clasp clone failed'}
  $deployments = (& npx --yes '@google/clasp@3.3.0' deployments 2>&1 | Out-String)
  [IO.File]::WriteAllText((Join-Path $root 'deployments.txt'),$deployments,$Utf8NoBom)
}
finally { Pop-Location }

Assert-Eq 'Script ID' (Read-ScriptId $clone) $ProdScriptId
if($deployments -notmatch [regex]::Escape($StableDeploymentId) + '.*@' + $ExpectedStableVersion){Stop-Run 'Stable deployment is not @424'}
if($deployments -notmatch [regex]::Escape($ProtectedDeploymentId) + '.*@' + $ExpectedProtectedVersion){Stop-Run 'Protected deployment is not @419'}

$code = Resolve-One $clone 'Código'
$rebeca = Resolve-One $clone 'ZZ_REBECA_V8_ROUTING'
$manifest = Resolve-One $clone 'appsscript'
$index = Resolve-One $clone 'index'

$cf=Facts $code; $rf=Facts $rebeca; $mf=Facts $manifest; $if=Facts $index
Assert-Eq 'Código SHA256' $cf.SHA $ExpectedCodeSha
Assert-Eq 'ZZ_REBECA SHA256' $rf.SHA $ExpectedRebecaSha
Assert-Eq 'ZZ_REBECA bytes' $rf.Bytes $ExpectedRebecaBytes
Assert-Eq 'ZZ_REBECA LF' $rf.LF $ExpectedRebecaLf
Assert-Eq 'ZZ_REBECA CR' $rf.CR 0

$codeText=[IO.File]::ReadAllText($code,$Utf8NoBom)
$rebecaText=[IO.File]::ReadAllText($rebeca,$Utf8NoBom)
$combined=$codeText+"`n"+$rebecaText

$required = @(
  'getDashboardVentas',
  '_an4406_rolesPorEndpoint_',
  'doPost_BASE_F59'
)
$serviceCandidates = @(
  '_cs21a93Verify_',
  '_cs21a93Dispatch_',
  '_cs21a93HandleServiceRequest_'
)
foreach($name in $required){
  $block=Get-FunctionBlock $combined $name
  if(-not $block){Stop-Run ('Required LIVE function not unique/found: '+$name)}
  [IO.File]::WriteAllText((Join-Path $extract ($name+'.js')),$block,$Utf8NoBom)
}
foreach($name in $serviceCandidates){
  $block=Get-FunctionBlock $combined $name
  if($block){[IO.File]::WriteAllText((Join-Path $extract ($name+'.js')),$block,$Utf8NoBom)}
}

$serviceMarkers=@(
  'CAMPUS_REBECA_SERVICE_SECRET',
  'CAMPUS_REBECA_SERVICE_ID',
  'agentGetCommercialConfig',
  'agentResolveContactContext'
)
$markerLines=@()
foreach($m in $serviceMarkers){$markerLines += ($m + '=' + (Count-Ordinal $combined $m))}
[IO.File]::WriteAllText((Join-Path $extract 'service_markers.txt'),($markerLines -join "`n")+"`n",$Utf8NoBom)

$inventory = @(
  "SCRIPT_ID=$ProdScriptId",
  "STABLE_DEPLOYMENT=$StableDeploymentId@$ExpectedStableVersion",
  "PROTECTED_DEPLOYMENT=$ProtectedDeploymentId@$ExpectedProtectedVersion",
  "CODE_PATH=$code",
  "CODE_BYTES=$($cf.Bytes)",
  "CODE_LF=$($cf.LF)",
  "CODE_CR=$($cf.CR)",
  "CODE_SHA256=$($cf.SHA)",
  "REBECA_PATH=$rebeca",
  "REBECA_BYTES=$($rf.Bytes)",
  "REBECA_LF=$($rf.LF)",
  "REBECA_CR=$($rf.CR)",
  "REBECA_SHA256=$($rf.SHA)",
  "MANIFEST_SHA256=$($mf.SHA)",
  "INDEX_SHA256=$($if.SHA)",
  "WRITE_REMOTE=NO",
  "DEPLOY=NO",
  "VERSION=NO",
  "SHEET_WRITE=NO"
)
[IO.File]::WriteAllText((Join-Path $root 'LIVE_SOURCE_INVENTORY.txt'),($inventory -join "`n")+"`n",$Utf8NoBom)

Write-Host ''
Write-Host '============================================================'
Write-Host 'CONAPE V4.4 LIVE SOURCE AUDIT: PASS'
Write-Host '============================================================'
Write-Host ('Evidence: ' + $root)
Write-Host ('Código SHA: ' + $cf.SHA)
Write-Host ('ZZ REBECA SHA: ' + $rf.SHA)
Write-Host 'Stable deployment: @424 PASS'
Write-Host 'Protected deployment: @419 PASS'
Write-Host 'REMOTE WRITES: 0'
Write-Host 'DEPLOYMENTS CREATED/MOVED: 0'
Write-Host 'SCRIPT PROPERTIES WRITTEN: 0'
Write-Host 'SHEETS WRITTEN: 0'
