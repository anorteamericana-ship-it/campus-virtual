param(
    [Parameter(Mandatory = $true)]
    [object]$StudentSession,

    [Parameter(Mandatory = $true)]
    [object]$TeacherSession
)

$ErrorActionPreference = 'Stop'

$QaExec = 'https://script.google.com/macros/s/AKfycbzzsmmHVRGlgltcUJf7Yi9R0z__vsu58Hw9Gq9rNn5pYVrgY5iZ0-xEEL-8wqL4uPVbaw/exec'
$Harness = Join-Path $PSScriptRoot 'qa_english_lab_authenticated_cs21a215.mjs'
$RepoRoot = Split-Path $PSScriptRoot -Parent

function Assert-QaSession {
    param(
        [string]$Label,
        [object]$Session,
        [string]$ExpectedRole
    )

    if (-not $Session) {
        throw "$Label no existe en esta sesión de PowerShell."
    }

    $token = [string]$Session.token
    if ([string]::IsNullOrWhiteSpace($token)) {
        throw "$Label no contiene token QA. Volvé a iniciar esa cuenta QA antes de ejecutar este launcher."
    }

    $role = [string]$Session.rol
    if ([string]::IsNullOrWhiteSpace($role)) {
        $role = [string]$Session.role
    }
    if ($role.Trim().ToLowerInvariant() -ne $ExpectedRole) {
        throw "$Label tiene rol '$role'; se esperaba '$ExpectedRole'."
    }
}

Assert-QaSession -Label 'StudentSession' -Session $StudentSession -ExpectedRole 'student'
Assert-QaSession -Label 'TeacherSession' -Session $TeacherSession -ExpectedRole 'teacher'

if (-not (Test-Path $Harness)) {
    throw "No encuentro el harness CS21A215 en $Harness"
}

Push-Location $RepoRoot
try {
    $branch = (& git rev-parse --abbrev-ref HEAD 2>$null).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw 'Esta carpeta no parece ser el repositorio Git del Campus.'
    }
    if ($branch -ne 'feat/english-lab-renewal-shell-cs21a215') {
        throw "Rama incorrecta: '$branch'. Cambiá a feat/english-lab-renewal-shell-cs21a215 antes del QA."
    }

    $head = (& git rev-parse HEAD).Trim()
    Write-Host "English LAB CS21A215 · QA autenticada local" -ForegroundColor Cyan
    Write-Host "Branch: $branch"
    Write-Host "HEAD:   $head"
    Write-Host ''

    & node -e "require.resolve('playwright')" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Instalando Playwright localmente (no se versiona)...' -ForegroundColor Yellow
        & npm install --no-save --no-package-lock playwright@1.54.2
        if ($LASTEXITCODE -ne 0) { throw 'Falló npm install de Playwright.' }
    }

    $env:QA_STAGING_APPS_SCRIPT_URL = $QaExec
    $env:QA_STUDENT_SESSION_JSON = ($StudentSession | ConvertTo-Json -Compress -Depth 10)
    $env:QA_TEACHER_SESSION_JSON = ($TeacherSession | ConvertTo-Json -Compress -Depth 10)
    Remove-Item Env:QA_CAMPUS_BASE_URL -ErrorAction SilentlyContinue

    Write-Host 'Ejecutando navegación autenticada contra backend QA...' -ForegroundColor Cyan
    & node $Harness
    if ($LASTEXITCODE -ne 0) {
        throw "QA autenticada CS21A215 falló con exit code $LASTEXITCODE."
    }

    $summary = Join-Path $RepoRoot 'qa-output/cs21a215-authenticated/summary.md'
    if (Test-Path $summary) {
        Write-Host ''
        Get-Content $summary
    }

    Write-Host ''
    Write-Host 'QA autenticada terminada. No se tocó producción ni Apps Script.' -ForegroundColor Green
}
finally {
    Remove-Item Env:QA_STUDENT_SESSION_JSON -ErrorAction SilentlyContinue
    Remove-Item Env:QA_TEACHER_SESSION_JSON -ErrorAction SilentlyContinue
    Remove-Item Env:QA_STAGING_APPS_SCRIPT_URL -ErrorAction SilentlyContinue
    Pop-Location
}
