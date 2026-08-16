param(
  [string]$CampusOrigin = 'https://anorteamerican.com',
  [string]$CampusAuthUrl = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec',
  [string]$WorkerUrl = 'https://speak-lab-voice-gateway-qa.anorteamericana.workers.dev'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Repo = Split-Path -Parent $PSScriptRoot
$Config = Join-Path $Repo 'prototypes\speak_lab_phase2\wrangler.speak-lab-qa.jsonc'
$PilotWorker = Join-Path $Repo 'prototypes\speak_lab_phase2\cloudflare_voice_worker_pilot.mjs'
$ExpectedBranch = 'feature/speak-lab-campus-pilot'

function Fail([string]$Message) {
  throw "SPEAK LAB QA: $Message"
}

function Write-Utf8NoBom([string]$Path, [string]$Text) {
  $Encoding = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($Path, $Text, $Encoding)
}

Set-Location $Repo

Write-Host ''
Write-Host '=== SPEAK LAB CAMPUS PILOT · QA DEPLOY ===' -ForegroundColor Cyan

if (-not (Test-Path $PilotWorker)) {
  Fail 'No encuentro cloudflare_voice_worker_pilot.mjs. Fetch/checkout del piloto incompleto.'
}

$Branch = (git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0) { Fail 'No pude leer la rama Git.' }
if ($Branch -ne $ExpectedBranch) {
  Fail "Rama inesperada: '$Branch'. Debe ser '$ExpectedBranch'."
}

$TrackedDirty = @(git status --porcelain --untracked-files=no)
if ($LASTEXITCODE -ne 0) { Fail 'git status falló.' }
if ($TrackedDirty.Count -gt 0) {
  Write-Host 'Cambios tracked locales:' -ForegroundColor Yellow
  $TrackedDirty | ForEach-Object { Write-Host $_ }
  Fail 'No despliego desde un working tree tracked sucio.'
}

if (-not (Test-Path $Config)) {
  Fail "No encuentro el config QA local: $Config"
}

$Staged = @(git diff --cached --name-only)
if ($Staged -contains 'prototypes/speak_lab_phase2/wrangler.speak-lab-qa.jsonc') {
  Fail 'El config QA local no puede estar staged.'
}

$Backup = Join-Path $env:TEMP ("wrangler.speak-lab-qa.before-campus-pilot.{0}.jsonc" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
Copy-Item $Config $Backup -Force
Write-Host "Config backup: $Backup"

$Text = Get-Content $Config -Raw

$MainPattern = '"main"\s*:\s*"[^"]+"'
if (-not [regex]::IsMatch($Text, $MainPattern)) {
  Fail 'No encuentro propiedad main en wrangler QA.'
}
$Text = [regex]::Replace($Text, $MainPattern, '"main": "./cloudflare_voice_worker_pilot.mjs"', 1)

$OriginPattern = '(?m)^(\s*)"ALLOWED_ORIGINS"\s*:\s*"[^"]*"\s*,?'
$OriginMatch = [regex]::Match($Text, $OriginPattern)
if (-not $OriginMatch.Success) {
  Fail 'No encuentro ALLOWED_ORIGINS en wrangler QA.'
}
$Indent = $OriginMatch.Groups[1].Value
$OriginLine = $Indent + '"ALLOWED_ORIGINS": "' + $CampusOrigin + '",'

if ([regex]::IsMatch($Text, '"CAMPUS_AUTH_URL"\s*:')) {
  $Text = [regex]::Replace(
    $Text,
    '"CAMPUS_AUTH_URL"\s*:\s*"[^"]*"',
    '"CAMPUS_AUTH_URL": "' + $CampusAuthUrl + '"',
    1
  )
  $Text = [regex]::Replace($Text, $OriginPattern, $OriginLine, 1)
} else {
  $AuthLine = $Indent + '"CAMPUS_AUTH_URL": "' + $CampusAuthUrl + '",'
  $Text = [regex]::Replace($Text, $OriginPattern, ($OriginLine + "`r`n" + $AuthLine), 1)
}

Write-Utf8NoBom $Config $Text

$Verify = Get-Content $Config -Raw
if ($Verify -notmatch '"main"\s*:\s*"\.\/cloudflare_voice_worker_pilot\.mjs"') {
  Fail 'main del Worker piloto no quedó configurado.'
}
if ($Verify -notmatch [regex]::Escape($CampusOrigin)) {
  Fail 'ALLOWED_ORIGINS no quedó configurado.'
}
if ($Verify -notmatch [regex]::Escape($CampusAuthUrl)) {
  Fail 'CAMPUS_AUTH_URL no quedó configurado.'
}
if ($Verify -match '__SET_') {
  Fail 'El config QA local todavía contiene placeholders __SET_.'
}

Write-Host "Campus origin: $CampusOrigin"
Write-Host 'Campus auth URL: configurada' -ForegroundColor Green
Write-Host 'Provider secrets: NO TOCADOS' -ForegroundColor Green
Write-Host 'Rate limiter: preservado en config local' -ForegroundColor Green

Write-Host ''
Write-Host '=== OFFLINE PREFLIGHT ===' -ForegroundColor Cyan
node --check prototypes/speak_lab_phase2/cloudflare_voice_worker_pilot.mjs
if ($LASTEXITCODE -ne 0) { Fail 'Syntax del Worker piloto falló.' }
node scripts/validate_speak_lab_campus_pilot_gateway.mjs
if ($LASTEXITCODE -ne 0) { Fail 'QA del broker de sesión falló.' }
node scripts/validate_speak_lab_phase3_pronunciation.mjs
if ($LASTEXITCODE -ne 0) { Fail 'QA de pronunciación OGG/WAV falló.' }

Write-Host ''
Write-Host '=== WRANGLER DEPLOY QA ===' -ForegroundColor Cyan
& npx.cmd wrangler@latest deploy --config $Config
if ($LASTEXITCODE -ne 0) { Fail 'Wrangler deploy falló.' }

Write-Host ''
Write-Host '=== HEALTH ===' -ForegroundColor Cyan
$Health = Invoke-RestMethod -Uri ($WorkerUrl.TrimEnd('/') + '/health') -Method Get -TimeoutSec 30
if ($Health.ok -ne $true) { Fail '/health no devolvió ok=true.' }
Write-Host "service=$($Health.service)" -ForegroundColor Green
Write-Host "environment=$($Health.environment)" -ForegroundColor Green
Write-Host "protocol=$($Health.protocol)" -ForegroundColor Green

Write-Host ''
Write-Host '========================================'
Write-Host 'SPEAK LAB CAMPUS PILOT WORKER QA: DEPLOYED' -ForegroundColor Green
Write-Host '========================================'
Write-Host "Worker: $WorkerUrl"
Write-Host "Config local (NO GIT): $Config"
Write-Host "Backup: $Backup"
Write-Host 'Siguiente gate: /v1/session-grant desde una sesión teacher/student real del Campus.'
