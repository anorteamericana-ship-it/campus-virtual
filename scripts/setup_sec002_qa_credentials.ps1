[CmdletBinding()]
param(
  [string]$QaExecUrl = 'https://script.google.com/macros/s/AKfycbzzsmmHVRGlgltcUJf7Yi9R0z__vsu58Hw9Gq9rNn5pYVrgY5iZ0-xEEL-8wqL4uPVbaw/exec',
  [string]$CredentialStorePath = (Join-Path $env:LOCALAPPDATA 'AcademiaNorteamericana\CampusQA\sec002.credentials.json'),
  [string]$StudentUser = 'qa_student_al_dia',
  [string]$TeacherUser = 'qa_docente',
  [string]$SuperadminUser = 'qa_superadmin',
  [string]$VentasUser = 'qa_ventas_sec002',
  [string]$VentasForeignUser = 'qa_ventas_ajeno'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ExpectedDeployment = 'AKfycbzzsmmHVRGlgltcUJf7Yi9R0z__vsu58Hw9Gq9rNn5pYVrgY5iZ0-xEEL-8wqL4uPVbaw'
$ProdDeployment = 'AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ'
if ($QaExecUrl -notmatch [regex]::Escape($ExpectedDeployment)) { throw 'BLOQUEADO: URL no es la deployment QA canónica.' }
if ($QaExecUrl -match [regex]::Escape($ProdDeployment)) { throw 'BLOQUEADO: URL productiva detectada.' }
if (-not $IsWindows -and $PSVersionTable.PSVersion.Major -ge 6) { throw 'Este bootstrap usa DPAPI y debe ejecutarse en Windows.' }

function Invoke-QaPost([string]$Fn, [hashtable]$Payload, [string]$Token = '') {
  $body = @{}
  foreach ($k in $Payload.Keys) { $body[$k] = $Payload[$k] }
  $body['fn'] = $Fn
  if ($Token) { $body['token'] = $Token }
  $uri = "${QaExecUrl}?fn=$([Uri]::EscapeDataString($Fn))"
  $json = $body | ConvertTo-Json -Compress -Depth 10
  $raw = Invoke-WebRequest -UseBasicParsing -Method Post -Uri $uri -ContentType 'text/plain;charset=utf-8' -Body $json -TimeoutSec 45
  if (-not ([string]$raw.Content).Trim().StartsWith('{')) { throw "$Fn devolvió respuesta no JSON." }
  return ([string]$raw.Content | ConvertFrom-Json)
}

function SecureString-ToPlain([Security.SecureString]$Secret) {
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secret)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

function Verify-And-Protect([string]$User, [string]$ExpectedRole, [string]$Prompt) {
  $secure = Read-Host $Prompt -AsSecureString
  $plain = SecureString-ToPlain $secure
  $token = ''
  try {
    $login = Invoke-QaPost 'iniciarSesion' @{ usuario=$User; clave=$plain }
    if ($login.ok -ne $true -or [string]::IsNullOrWhiteSpace([string]$login.token)) {
      throw "Login QA falló para $User: $($login.error) $($login.mensaje)"
    }
    $role = ([string]$login.rol).Trim().ToLowerInvariant()
    if ($role -ne $ExpectedRole.ToLowerInvariant()) {
      throw "Rol inesperado para $User: $role; esperado: $ExpectedRole."
    }
    $token = [string]$login.token
    Write-Host "PASS credencial verificada: $User ($role)" -ForegroundColor Green
    return [ordered]@{
      user = $User
      role = $ExpectedRole
      cipher = ($secure | ConvertFrom-SecureString)
    }
  }
  finally {
    if (-not [string]::IsNullOrWhiteSpace($token)) {
      try { [void](Invoke-QaPost 'cerrarSesion' @{} $token) } catch {}
    }
    $plain = $null
    $secure = $null
  }
}

Write-Host '=== Bootstrap credenciales SEC-002 QA ===' -ForegroundColor Cyan
Write-Host 'Las claves se leen ocultas, se verifican contra QA y se guardan cifradas con DPAPI para este usuario de Windows.'
Write-Host 'No se escriben contraseñas en GitHub, logs ni archivos en texto plano.'

$accounts = [ordered]@{}
$accounts['student'] = Verify-And-Protect $StudentUser 'student' "Clave QA de $StudentUser"
$accounts['teacher'] = Verify-And-Protect $TeacherUser 'teacher' "Clave QA de $TeacherUser"
$accounts['superadmin'] = Verify-And-Protect $SuperadminUser 'superadmin' "Clave QA de $SuperadminUser"
$accounts['ventas_owner'] = Verify-And-Protect $VentasUser 'ventas' "Clave QA de $VentasUser"
$accounts['ventas_foreign'] = Verify-And-Protect $VentasForeignUser 'ventas' "Clave QA de $VentasForeignUser"

$parent = Split-Path -Parent $CredentialStorePath
if (-not (Test-Path -LiteralPath $parent)) { [void](New-Item -ItemType Directory -Path $parent -Force) }

$sid = try { [Security.Principal.WindowsIdentity]::GetCurrent().User.Value } catch { '' }
$store = [ordered]@{
  schema = 'SEC002-QA-CREDENTIALS-1'
  deployment_id = $ExpectedDeployment
  created_at_utc = [DateTime]::UtcNow.ToString('o')
  windows_user = $env:USERNAME
  windows_sid = $sid
  accounts = $accounts
}
$jsonOut = $store | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText($CredentialStorePath, $jsonOut, (New-Object Text.UTF8Encoding($false)))

Write-Host "`nPASS · credenciales QA cifradas y verificadas." -ForegroundColor Green
Write-Host "Store local: $CredentialStorePath"
Write-Host 'A partir de ahora run_sec002_runtime_positive_qa.ps1 puede ejecutarse sin pedir contraseñas.'
