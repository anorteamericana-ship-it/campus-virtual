[CmdletBinding()]
param(
  [string]$QaExecUrl = 'https://script.google.com/macros/s/AKfycbzzsmmHVRGlgltcUJf7Yi9R0z__vsu58Hw9Gq9rNn5pYVrgY5iZ0-xEEL-8wqL4uPVbaw/exec',
  [string]$StudentUser = 'qa_student_al_dia',
  [string]$TeacherUser = 'qa_docente',
  [string]$SuperadminUser = 'qa_superadmin',
  [string]$StudentCode = 'QA-STU-001',
  [string]$FixtureCedula = '999999991',
  [string]$DocsExtraFileId = '1opyraEWX2qITYPZqz3GACwqX3JYsehux',
  [string]$PaymentRequestId = 'QA-SEC002-PAY-20260817-01'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ExpectedDeployment = 'AKfycbzzsmmHVRGlgltcUJf7Yi9R0z__vsu58Hw9Gq9rNn5pYVrgY5iZ0-xEEL-8wqL4uPVbaw'
$ProdDeployment = 'AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ'
if ($QaExecUrl -notmatch [regex]::Escape($ExpectedDeployment)) { throw 'BLOQUEADO: URL no es la deployment QA canónica.' }
if ($QaExecUrl -match [regex]::Escape($ProdDeployment)) { throw 'BLOQUEADO: URL productiva detectada.' }

function Read-PlainSecret([string]$Prompt) {
  $s = Read-Host $Prompt -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

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

function Assert([bool]$Condition, [string]$Message) {
  if (-not $Condition) { throw $Message }
}

function Hex-Sha256([byte[]]$Bytes) {
  $sha = [Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($sha.ComputeHash($Bytes))).Replace('-','').ToLowerInvariant() }
  finally { $sha.Dispose() }
}

function Validate-PrivatePayload($Obj, [string]$Version, [int64]$MaxBytes, [string[]]$AllowedMime, [switch]$PdfMagic) {
  Assert ($Obj.ok -eq $true) "Respuesta $Version no fue ok=true: $($Obj.error) $($Obj.mensaje)"
  Assert ($Obj.private_delivery -eq $true) "$Version no marcó private_delivery=true."
  Assert ([string]$Obj.version -eq $Version) "Versión inesperada: $($Obj.version)"
  foreach ($field in @('url','file_id','folder_url','url_comprobante')) {
    if ($Obj.PSObject.Properties.Name -contains $field) {
      Assert ([string]::IsNullOrWhiteSpace([string]$Obj.$field)) "$Version filtró $field."
    }
  }
  $mime = ([string]$Obj.mime_type).Trim().ToLowerInvariant()
  if ($AllowedMime.Count -gt 0) { Assert ($AllowedMime -contains $mime) "$Version MIME inesperado: $mime" }
  $b64 = ([string]$Obj.data_base64) -replace '\s',''
  Assert (-not [string]::IsNullOrWhiteSpace($b64)) "$Version sin data_base64."
  try { [byte[]]$bytes = [Convert]::FromBase64String($b64) } catch { throw "$Version base64 inválido." }
  Assert ($bytes.Length -gt 0) "$Version bytes vacíos."
  Assert ($bytes.Length -le $MaxBytes) "$Version excede límite: $($bytes.Length)."
  Assert ([int64]$Obj.size_bytes -eq $bytes.Length) "$Version size_bytes no coincide."
  $sha = Hex-Sha256 $bytes
  Assert ($sha -eq ([string]$Obj.sha256).ToLowerInvariant()) "$Version SHA-256 no coincide."
  if ($PdfMagic) {
    Assert ($bytes.Length -ge 5) "$Version PDF demasiado corto."
    $magic = [Text.Encoding]::ASCII.GetString($bytes,0,5)
    Assert ($magic -eq '%PDF-') "$Version no tiene magic %PDF-."
  }
  return [pscustomobject]@{ version=$Version; mime=$mime; size_bytes=$bytes.Length; sha256=$sha }
}

$results = New-Object System.Collections.Generic.List[object]
function Pass([string]$Name, [hashtable]$Meta = @{}) {
  $row = [ordered]@{ name=$Name; pass=$true }
  foreach ($k in $Meta.Keys) { $row[$k]=$Meta[$k] }
  $results.Add([pscustomobject]$row)
  Write-Host "PASS $Name" -ForegroundColor Green
}

$studentPass = Read-PlainSecret 'Clave QA de qa_student_al_dia'
$teacherPass = Read-PlainSecret 'Clave QA de qa_docente'
$adminPass = Read-PlainSecret 'Clave QA de qa_superadmin'
$studentToken = ''; $teacherToken = ''; $adminToken = ''

try {
  Write-Host "`n=== Login QA real ===" -ForegroundColor Cyan
  $s = Invoke-QaPost 'iniciarSesion' @{ usuario=$StudentUser; clave=$studentPass }
  Assert ($s.ok -eq $true -and -not [string]::IsNullOrWhiteSpace([string]$s.token)) "Login student falló: $($s.error)"
  Assert (([string]$s.rol).ToLowerInvariant() -eq 'student') "Rol student inesperado: $($s.rol)"
  $studentToken = [string]$s.token; Pass 'login_student'

  $t = Invoke-QaPost 'iniciarSesion' @{ usuario=$TeacherUser; clave=$teacherPass }
  Assert ($t.ok -eq $true -and -not [string]::IsNullOrWhiteSpace([string]$t.token)) "Login teacher falló: $($t.error)"
  Assert (([string]$t.rol).ToLowerInvariant() -eq 'teacher') "Rol teacher inesperado: $($t.rol)"
  $teacherToken = [string]$t.token; Pass 'login_teacher'

  $a = Invoke-QaPost 'iniciarSesion' @{ usuario=$SuperadminUser; clave=$adminPass }
  Assert ($a.ok -eq $true -and -not [string]::IsNullOrWhiteSpace([string]$a.token)) "Login superadmin falló: $($a.error)"
  Assert (([string]$a.rol).ToLowerInvariant() -eq 'superadmin') "Rol superadmin inesperado: $($a.rol)"
  $adminToken = [string]$a.token; Pass 'login_superadmin'

  Write-Host "`n=== Certificado privado ===" -ForegroundColor Cyan
  $cert = Invoke-QaPost 'descargarMiCertificadoPrivado' @{ codigo=$StudentCode; nivel='B1' } $studentToken
  $certMeta = Validate-PrivatePayload $cert 'SEC002-CERT-PRIVATE-1' (2MB) @('application/pdf') -PdfMagic
  Pass 'certificate_student_own' @{ size=$certMeta.size_bytes; sha_prefix=$certMeta.sha256.Substring(0,12) }

  $foreignCert = Invoke-QaPost 'descargarMiCertificadoPrivado' @{ codigo='QA-STU-999'; nivel='B1' } $studentToken
  Assert ($foreignCert.ok -eq $false) 'Student pudo solicitar certificado de código ajeno.'
  Pass 'certificate_foreign_code_denied'

  $teacherCert = Invoke-QaPost 'descargarMiCertificadoPrivado' @{ codigo=$StudentCode; nivel='B1' } $teacherToken
  Assert ($teacherCert.ok -eq $false) 'Teacher pudo descargar certificado privado.'
  Pass 'certificate_teacher_denied'

  Write-Host "`n=== Documento extra privado ===" -ForegroundColor Cyan
  $extra = Invoke-QaPost 'descargarDocumentoExtraPrivado' @{ cedula=$FixtureCedula; file_id=$DocsExtraFileId } $adminToken
  $extraMeta = Validate-PrivatePayload $extra 'SEC002-EXTRA-PRIVATE-1' (5MB) @()
  Pass 'docs_extra_superadmin_positive' @{ size=$extraMeta.size_bytes; sha_prefix=$extraMeta.sha256.Substring(0,12) }

  $extraStudent = Invoke-QaPost 'descargarDocumentoExtraPrivado' @{ cedula=$FixtureCedula; file_id=$DocsExtraFileId } $studentToken
  Assert ($extraStudent.ok -eq $false) 'Student pudo descargar documento extra de Ventas.'
  Pass 'docs_extra_student_denied'

  $extraCross = Invoke-QaPost 'descargarDocumentoExtraPrivado' @{ cedula='999999992'; file_id=$DocsExtraFileId } $adminToken
  Assert ($extraCross.ok -eq $false) 'file_id de un expediente fue aceptado bajo otra cédula.'
  Pass 'docs_extra_cross_resource_denied'

  Write-Host "`n=== Comprobante de pago privado ===" -ForegroundColor Cyan
  $pay = Invoke-QaPost 'descargarComprobantePagoPrivado' @{ id=$PaymentRequestId } $adminToken
  $payMeta = Validate-PrivatePayload $pay 'SEC002-PAGO-PRIVATE-1' (5MB) @('image/jpeg','image/png','application/pdf')
  Pass 'payment_superadmin_positive' @{ size=$payMeta.size_bytes; sha_prefix=$payMeta.sha256.Substring(0,12) }

  $payStudent = Invoke-QaPost 'descargarComprobantePagoPrivado' @{ id=$PaymentRequestId } $studentToken
  Assert ($payStudent.ok -eq $false) 'Student pudo descargar comprobante financiero privado.'
  Pass 'payment_student_denied'

  Write-Host "`n=== Matrícula firmada privada ===" -ForegroundColor Cyan
  $signed = Invoke-QaPost 'descargarMatriculaFirmadaPrivada' @{} $studentToken
  $signedMeta = Validate-PrivatePayload $signed 'SEC002-MATF-PRIVATE-1' (9MB) @('application/pdf') -PdfMagic
  Pass 'signed_student_own' @{ size=$signedMeta.size_bytes; sha_prefix=$signedMeta.sha256.Substring(0,12) }

  $signedForged = Invoke-QaPost 'descargarMatriculaFirmadaPrivada' @{ cedula='111111111'; codigo='QA-STU-999'; file_id='FORGED_FILE_ID' } $studentToken
  $signedForgedMeta = Validate-PrivatePayload $signedForged 'SEC002-MATF-PRIVATE-1' (9MB) @('application/pdf') -PdfMagic
  Assert ($signedForgedMeta.sha256 -eq $signedMeta.sha256) 'Student logró alterar la identidad/archivo mediante body forjado.'
  Pass 'signed_student_client_identity_ignored'

  $signedAdmin = Invoke-QaPost 'descargarMatriculaFirmadaPrivada' @{ cedula=$FixtureCedula; codigo=$StudentCode } $adminToken
  $signedAdminMeta = Validate-PrivatePayload $signedAdmin 'SEC002-MATF-PRIVATE-1' (9MB) @('application/pdf') -PdfMagic
  Pass 'signed_superadmin_positive' @{ size=$signedAdminMeta.size_bytes; sha_prefix=$signedAdminMeta.sha256.Substring(0,12) }

  $signedTeacher = Invoke-QaPost 'descargarMatriculaFirmadaPrivada' @{} $teacherToken
  Assert ($signedTeacher.ok -eq $false) 'Teacher pudo descargar matrícula firmada privada.'
  Pass 'signed_teacher_denied'

  Write-Host "`n=== RESULTADO SEC-002 E2/E3 ===" -ForegroundColor Cyan
  Write-Host "PASS · SEC-002 runtime autenticado student/teacher/superadmin." -ForegroundColor Green
  $results | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $env:TEMP 'sec002-runtime-positive-result.json') -Encoding UTF8
  Write-Host "Evidencia sanitizada: $env:TEMP\sec002-runtime-positive-result.json"
}
finally {
  foreach ($tok in @($studentToken,$teacherToken,$adminToken)) {
    if (-not [string]::IsNullOrWhiteSpace($tok)) {
      try { [void](Invoke-QaPost 'cerrarSesion' @{} $tok) } catch {}
    }
  }
  $studentPass=$null; $teacherPass=$null; $adminPass=$null
}
