import fs from 'node:fs';

const path = 'scripts/install_apps_script_qa_sec002.ps1';
const text = fs.readFileSync(path, 'utf8');
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};

const qaScriptId = '1GMHihGwnX_-sIS101rRlUoYpAH2HSKyms8lx6L9z7bjb_45YDn-ph6WD';
const qaDeploymentId = 'AKfycbzzsmmHVRGlgltcUJf7Yi9R0z__vsu58Hw9Gq9rNn5pYVrgY5iZ0-xEEL-8wqL4uPVbaw';
const prodExecId = 'AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ';
const canonicalSha = 'd24fc63c59e60ba92808d4d870f4eb95e35bb6f1c158a130229b187a66e35d37';
const bundleSha = 'da81ffbd44341dba884c2ff647f721cbd1b53b447b39c6e11cf2d67c8ac6df06';

check('installer is PowerShell and strict/fail-fast', text.includes('Set-StrictMode -Version Latest') && text.includes("$ErrorActionPreference = 'Stop'"));
check('installer defaults to dry run unless -Apply', text.includes('[switch]$Apply') && text.includes('if (-not $Apply)') && text.includes('PLAN_PASS_NO_REMOTE_WRITE'));
check('installer pins QA Script ID', text.includes(qaScriptId));
check('installer pins existing QA deployment ID', text.includes(qaDeploymentId));
check('installer contains no production deployment ID', !text.includes(prodExecId));
check('installer pins clasp 3.3.0', text.includes("$ClaspVersion   = '3.3.0'"));
check('installer pins canonical Code SHA', text.includes(canonicalSha));
check('installer pins expected SEC002 bundle SHA', text.includes(bundleSha));
check('installer clones repo artifacts before use', text.includes("'clone','--quiet','--depth','1','--branch',$RepoRef,$RepoUrl,$RepoDir"));
check('installer reruns all accumulated SEC002 guards', [
  'qa_sec002_private_certificate_delta_portable.mjs',
  'qa_sec002_student_private_cert.mjs',
  'qa_sec002_ventas_docs_extra_contract.mjs',
  'qa_sec002_ventas_extra_private_delta.mjs',
  'qa_sec002_ventas_extra_private_frontend.mjs',
  'qa_sec002_payment_receipt_private_delta.mjs',
  'qa_sec002_payment_receipt_frontend.mjs',
  'qa_sec002_signed_enrollment_private_delta.mjs',
  'qa_sec002_signed_enrollment_frontend.mjs',
  'qa_sec002_private_delivery_bundle_manifest.mjs',
].every(x => text.includes(x)));

check('strict-mode patch candidates are materialized as an array',
  text.includes('$patchCandidates = @($patchCandidates | Where-Object'));
check('strict-mode Code matches are materialized as an array',
  text.includes('$matches = @(Get-ChildItem'));
check('strict-mode patch hunk matches are materialized as an array',
  text.includes("$hunks = @(Select-String -LiteralPath $patchPath -Pattern '^@@ ' -AllMatches).Count"));
check('strict-mode local diff result is materialized as an array',
  text.includes('$unexpectedLocal = @(Compare-SourceMaps'));
check('strict-mode remote diff result is materialized as an array',
  text.includes('$unexpectedRemote = @(Compare-SourceMaps'));
check('strict-mode smoke failures count is array-safe',
  text.includes('if (@($failures).Count -gt 0)'));

const cloneFnStart = text.indexOf('function Clone-AppsScriptProject');
const cloneFnEnd = text.indexOf('function Test-QaRoutes', cloneFnStart);
const cloneFn = cloneFnStart >= 0 && cloneFnEnd > cloneFnStart ? text.slice(cloneFnStart, cloneFnEnd) : '';
check('clone helper exists', !!cloneFn);
check('each clasp clone executes inside its destination directory', cloneFn.includes("Invoke-Clasp -Arguments @('clone-script', $QaScriptId) -WorkingDirectory $Destination"));
check('clone helper never uses --rootDir', !cloneFn.includes('--rootDir'));
check('clone helper does not reuse WorkRoot project context', !cloneFn.includes('-WorkingDirectory $WorkRoot'));
check('installer clones full Apps Script project before backup', cloneFn.includes("clone-script', $QaScriptId") && text.includes("Copy-Item -LiteralPath $AppsDir -Destination $BackupSource -Recurse -Force"));
check('cloned project must contain .clasp.json before backup', text.includes("if (-not (Test-Path (Join-Path $AppsDir '.clasp.json')))"));
check('backup explicitly verifies .clasp.json', text.includes("if (-not (Test-Path (Join-Path $BackupSource '.clasp.json')))"));
check('verify clone explicitly has isolated .clasp.json', text.includes("if (-not (Test-Path (Join-Path $VerifyDir '.clasp.json')))"));
check('deployment listing before install runs in AppsDir project context', text.includes("Invoke-Clasp -Arguments @('list-deployments') -WorkingDirectory $AppsDir"));
check('deployment listing never receives QA Script ID as positional argument', !text.includes("@('list-deployments',$QaScriptId)"));
check('deployment listing never runs from WorkRoot', !text.includes("@('list-deployments') -WorkingDirectory $WorkRoot"));

check('backup happens before remote push', text.indexOf('Copy-Item -LiteralPath $AppsDir -Destination $BackupSource') < text.indexOf("Invoke-Clasp -Arguments @('push','--force') -WorkingDirectory $AppsDir"));
check('mismatched live Code stops before write', text.includes('STOP_AND_RECONCILE_CURRENT_QA_CODE') && text.indexOf('STOP_AND_RECONCILE_CURRENT_QA_CODE') < text.indexOf("Invoke-Clasp -Arguments @('push','--force') -WorkingDirectory $AppsDir"));
check('patching is fuzz zero', text.includes('--fuzz=0'));
check('installer permits only Code basename to change', text.includes("AllowedChangedBasenames @('Code')"));
check('installer verifies remote by recloning after push', text.includes("Clone-AppsScriptProject -Destination $VerifyDir") && text.includes("Verificacion remota Code fallo"));
check('installer preserves same deployment via redeploy', text.includes("'create-deployment','--deploymentId',$QaDeploymentId"));
check('installer checks deployment ID remains present', text.includes("$deployListAfter -notmatch [Regex]::Escape($QaDeploymentId)"));
check('installer smokes all four private endpoints', [
  'descargarMiCertificadoPrivado',
  'descargarDocumentoExtraPrivado',
  'descargarComprobantePagoPrivado',
  'descargarMatriculaFirmadaPrivada',
].every(x => text.includes(x)));
check('installer implements rollback after remote mutation', text.includes('function Restore-BackupAndRedeploy') && text.includes('if ($Apply -and $RemoteChanged)') && text.includes("Invoke-Clasp -Arguments @('push','--force') -WorkingDirectory $BackupSource"));
check('rollback requires project metadata in backup', text.includes("Test-Path (Join-Path $BackupSource '.clasp.json')"));
check('rollback also reuses same deployment ID', text.includes("'create-deployment','--deploymentId',$QaDeploymentId,'--description',\"ROLLBACK SEC002 $Stamp\""));
check('installer does not revoke Drive ACL', !/DriveApp\.Access\.PRIVATE|revokePermissions|removeViewer|removeEditor/.test(text));
check('installer writes persistent install report', text.includes('install-report.json') && text.includes('source-before-hashes.json'));

if (failures.length) {
  console.error(`SEC002 POWERSHELL INSTALLER GUARD: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC002 POWERSHELL INSTALLER GUARD: PASS');
