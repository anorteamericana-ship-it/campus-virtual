import fs from 'node:fs';

const ps = fs.readFileSync('scripts/install_apps_script_qa_sec002_modular.ps1','utf8');
const rebaser = fs.readFileSync('scripts/apply_sec002_modular_exact.mjs','utf8');
const failures = [];
const check=(name,ok)=>{ if(ok) console.log(`PASS ${name}`); else { failures.push(name); console.error(`FAIL ${name}`); } };

const qaScript='1GMHihGwnX_-sIS101rRlUoYpAH2HSKyms8lx6L9z7bjb_45YDn-ph6WD';
const qaDeploy='AKfycbzzsmmHVRGlgltcUJf7Yi9R0z__vsu58Hw9Gq9rNn5pYVrgY5iZ0-xEEL-8wqL4uPVbaw';
const prodDeploy='AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ';

check('modular installer strict/fail-fast', ps.includes('Set-StrictMode -Version Latest') && ps.includes("$ErrorActionPreference = 'Stop'"));
check('modular installer defaults dry-run', ps.includes('[switch]$Apply') && ps.includes('PLAN_PASS_NO_REMOTE_WRITE'));
check('pins QA Script ID', ps.includes(qaScript));
check('pins QA deployment ID', ps.includes(qaDeploy));
check('production deployment only used as negative gate', ps.includes(prodDeploy) && ps.includes("if ($QaDeploymentId -eq $ProdDeploymentId)"));
check('clasp version pinned', ps.includes("$ClaspVersion   = '3.3.0'"));
check('clone runs inside destination project context', ps.includes("@('clone-script', $QaScriptId) -WorkingDirectory $Destination"));
check('requires modular mode with no Code file', ps.includes('Este instalador es solo modular'));
const backupPos = ps.indexOf('Copy-Item -LiteralPath $AppsDir -Destination $BackupSource');
const rebasePos = ps.indexOf('scripts/apply_sec002_modular_exact.mjs');
const mainPushStepPos = ps.indexOf("Write-Step '7/11 · Push controlado del proyecto modular QA'");
check('backup happens before rebase and main remote push', backupPos >= 0 && rebasePos > backupPos && mainPushStepPos > rebasePos);
check('exact modular rebaser is invoked', ps.includes('scripts/apply_sec002_modular_exact.mjs'));
check('requires 24/24 hunks', ps.includes('[int]$rebaseObj.applied_hunks -ne 24'));
check('declared changed files must equal observed source-map diff', ps.includes('Archivos cambiados no coinciden con reporte modular'));
check('remote is recloned and full map compared exactly', ps.includes('Compare-MapExact -Expected $candidateMap -Observed $verifyMap'));
check('same QA deployment reused', ps.includes("'create-deployment','--deploymentId',$QaDeploymentId"));
check('smokes all four private routes', ['descargarMiCertificadoPrivado','descargarDocumentoExtraPrivado','descargarComprobantePagoPrivado','descargarMatriculaFirmadaPrivada'].every(x=>ps.includes(x)));
check('rollback uses full backup and same deployment', ps.includes("@('push','--force') -WorkingDirectory $BackupSource") && ps.includes("'create-deployment','--deploymentId',$QaDeploymentId"));
check('no Drive ACL revocation in installer', !/DriveApp\.Access\.PRIVATE|removeViewer|removeEditor|revokePermissions/.test(ps));
check('persistent reports are written', ps.includes('source-before-hashes.json') && ps.includes('modular-rebase-report.json') && ps.includes('install-report.json'));

check('rebaser allowlists four core modules', ['01_Router','14_Notas_Cierre_Certificados','20_Inscripcion_Ventas_Matricula','21_Pagos_Banco_CONAPE'].every(x=>rebaser.includes(x)));
check('rebaser forbids LAB and Memory targets', rebaser.includes("'ENGLISH_LAB'") && rebaser.includes("'MEMORY_MATCH'"));
check('rebaser requires exact single preimage', rebaser.includes('if (exactTotal !== 1)'));
check('rebaser uses manifest patch order', rebaser.includes("manifest.ordered_deltas") && rebaser.includes('sort((a,b)=>Number(a.order)-Number(b.order))'));
check('rebaser requires four endpoint definitions exactly once', ['descargarMiCertificadoPrivado','descargarDocumentoExtraPrivado','descargarComprobantePagoPrivado','descargarMatriculaFirmadaPrivada'].every(x=>rebaser.includes(x)) && rebaser.includes('some(n=>n!==1)'));
check('rebaser has no process execution/import of child_process', !/child_process|spawnSync|execFileSync|execSync/.test(rebaser));

if(failures.length){ console.error(`SEC002 MODULAR INSTALLER GUARD: FAIL (${failures.length})`); process.exit(1); }
console.log('SEC002 MODULAR INSTALLER GUARD: PASS');
