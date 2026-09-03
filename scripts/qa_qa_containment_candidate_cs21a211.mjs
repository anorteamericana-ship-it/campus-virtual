import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const MANIFEST = 'patches/apps-script/CS21A211_QA_CONTAINMENT.manifest.json';
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const patchParts = manifest.patch_parts || [];
const patch = patchParts.map(part => fs.readFileSync(part.path, 'utf8')).join('');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const fail = message => { throw new Error(`CS21A211 containment contract: ${message}`); };
const expect = (ok, message) => { if (!ok) fail(message); };

const SOURCE_AGGREGATE = '3e384ac34930e6a936a3f930db8819bd80124ef59f522ac1b5b11fee8f881ec6';
const CANDIDATE_AGGREGATE = '597088d4f817f25ab702de64a7b26d7db1f2e7df725ead65426c14c059ffb9d8';
const PATCH_SHA256 = '375859ca3bd37a6e5fec65a675725b8c004a40bcf056342815cee5ae0eb57f45';
const GUARD_AFTER_SHA256 = 'fd48510ff0601854afc27d0c5dbf5fb450e3a73518282f4efab89f6cf9ac9a5a';
const GUARD_AFTER_BYTES = 10400;
const ROUTER_AFTER_SHA256 = '87f80a0240d261ed6361a6c51087ddd86ae429eef6dcb9111609f3d0d6e74c68';
const ROUTER_AFTER_BYTES = 256665;
const INDEX_AFTER_SHA256 = 'c031707fab664327436bb4f68cfbb23dcee123f82c7b0d456c3b39097af0d212';
const INDEX_AFTER_BYTES = 649481;
const PROD_DEPLOYMENT = 'AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ';
const expectedFiles = [
  '01_Router.js',
  '02_Auth_Sesiones_Usuarios.js',
  '10_Estudiantes.js',
  '41_CONAPE_Auditoria_Finanzas.js',
  '46_English_LAB_Accesos_Demo_Docentes.js',
  '98_Instalacion_QA_CS21A144.js',
  '99_QA_Staging_Guard.js',
  'index.html',
].sort();
const prodResourceIds = [
  '1Bm9pK4OvWE944X29bm8S3UWUlWP_G5jO',
  '1Z4N0TM5tFYT_aHUiUklKX3fJvPNArw2K',
  '18enRbEhc5SSVK1v0ACO7oLqbsJX2gqOT',
  '1GN1g-vB6Pr71vi_kXQE4NeoZr8KVxTPO',
  '1LIX_vbyyZAtPElUpfm5S5WjIHs79n0Vt',
  '1SoXa-A_-eUtMMRfU4mSuaOaoiqpUUS9hSnPT5yHW7zQ',
  '18x3tCfzFQ8KsT5ESyblxEW1A4aa_yPRAoiH8972XKVo',
  '1Z4V3GW3dSTVd3J6oaLty5MSArKWRjYYd52u75MA1SIE',
  '13rd_tMKkTS6CLqSJt1PWS7GNmLxAVrsqRAO395tynZI',
  '1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg',
];

function validateUnifiedPatchHunks(text) {
  const lines = text.split('\n');
  let hunkCount = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (!match) continue;
    hunkCount += 1;
    const expectedOld = Number(match[2] || '1');
    const expectedNew = Number(match[4] || '1');
    let oldCount = 0;
    let newCount = 0;
    for (i += 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (/^@@ /.test(line) || /^--- a\//.test(line)) { i -= 1; break; }
      if (line.startsWith('\\ No newline at end of file')) continue;
      if (line.startsWith('+') && !line.startsWith('+++')) { newCount += 1; continue; }
      if (line.startsWith('-') && !line.startsWith('---')) { oldCount += 1; continue; }
      if (line.startsWith(' ')) { oldCount += 1; newCount += 1; continue; }
      if (line === '' && i === lines.length - 1) break;
      fail(`unexpected line inside unified patch hunk: ${line.slice(0, 80)}`);
    }
    expect(oldCount === expectedOld, `hunk old-count mismatch: expected ${expectedOld}, observed ${oldCount}`);
    expect(newCount === expectedNew, `hunk new-count mismatch: expected ${expectedNew}, observed ${newCount}`);
  }
  expect(hunkCount > 0, 'no unified patch hunks found');
  return hunkCount;
}

function sourcePatch(sourcePath) {
  return patchParts
    .filter(part => part.source_path === sourcePath)
    .map(part => fs.readFileSync(part.path, 'utf8'))
    .join('');
}

function reconstructFullReplacement(sourcePath) {
  const text = sourcePatch(sourcePath);
  const header = text.match(/^--- a\/(.+)\n\+\+\+ b\/\1\n@@ -1,(\d+) \+1,(\d+) @@\n/);
  expect(header && header[1] === sourcePath, `${sourcePath} is not a recognized full-file replacement patch`);
  const body = text.slice(header[0].length).split('\n');
  const out = [];
  let oldCount = 0;
  let newCount = 0;
  for (const line of body) {
    if (line === '') continue;
    if (line.startsWith('\\ No newline at end of file')) continue;
    if (line.startsWith('-') && !line.startsWith('---')) { oldCount += 1; continue; }
    if (line.startsWith('+') && !line.startsWith('+++')) { newCount += 1; out.push(line.slice(1)); continue; }
    if (line.startsWith(' ')) { oldCount += 1; newCount += 1; out.push(line.slice(1)); continue; }
    fail(`unexpected line while reconstructing ${sourcePath}: ${line.slice(0, 80)}`);
  }
  expect(oldCount === Number(header[2]), `${sourcePath} old line count drift: ${oldCount}`);
  expect(newCount === Number(header[3]), `${sourcePath} new line count drift: ${newCount}`);
  return Buffer.from(`${out.join('\n')}\n`, 'utf8');
}

expect(manifest.schema === 'CAMPUS_APPS_SCRIPT_QA_CONTAINMENT_CANDIDATE_2', 'manifest schema drift');
expect(manifest.candidate === 'CS21A211H', 'candidate label drift');
expect(manifest.source_snapshot === 'QA_HEAD_20260901_215804Z', 'wrong source snapshot');
expect(manifest.source_file_count === 71 && manifest.candidate_file_count === 71, 'source/candidate file count must remain 71');
expect(manifest.source_aggregate_sha256 === SOURCE_AGGREGATE, 'source aggregate drift');
expect(manifest.candidate_aggregate_sha256 === CANDIDATE_AGGREGATE, 'candidate aggregate drift');
expect(manifest.candidate_total_bytes === 4689540, 'candidate byte count drift');
expect(manifest.patch_sha256 === PATCH_SHA256, 'manifest patch hash drift');
expect(manifest.remote_write_performed === false, 'manifest claims a remote write');
expect(manifest.apps_script_deployed === false, 'manifest claims Apps Script was deployed');
expect(manifest.production_touched === false, 'manifest claims PROD was touched');
expect(patchParts.length >= expectedFiles.length, 'split patch part count is unexpectedly small');
for (const part of patchParts) {
  expect(typeof part.path === 'string' && fs.existsSync(part.path), `missing patch part: ${part.path || 'unknown'}`);
  expect(typeof part.source_path === 'string' && expectedFiles.includes(part.source_path), `unexpected patch source path: ${part.source_path}`);
  expect(fs.statSync(part.path).size > 0, `empty patch part: ${part.path}`);
}
const patchSourceFiles = [...new Set(patchParts.map(part => part.source_path))].sort();
expect(JSON.stringify(patchSourceFiles) === JSON.stringify(expectedFiles), `patch source set drift: ${patchSourceFiles.join(', ')}`);
const combinedPatchSha = sha256(Buffer.from(patch, 'utf8'));
expect(combinedPatchSha === PATCH_SHA256, `combined patch SHA-256 mismatch: ${combinedPatchSha}`);
const hunkCount = validateUnifiedPatchHunks(patch);

const touched = manifest.touched_files.map(x => x.path).sort();
expect(JSON.stringify(touched) === JSON.stringify(expectedFiles), `unexpected touched files: ${touched.join(', ')}`);
const patchFiles = [...new Set([...patch.matchAll(/^\+\+\+ b\/(.+)$/gm)].map(m => m[1]))].sort();
expect(JSON.stringify(patchFiles) === JSON.stringify(expectedFiles), `patch file set drift: ${patchFiles.join(', ')}`);

const guardBuffer = reconstructFullReplacement('99_QA_Staging_Guard.js');
expect(guardBuffer.length === GUARD_AFTER_BYTES, `guard candidate bytes mismatch: ${guardBuffer.length}`);
expect(sha256(guardBuffer) === GUARD_AFTER_SHA256, `guard candidate SHA-256 mismatch: ${sha256(guardBuffer)}`);
const guardTouched = manifest.touched_files.find(item => item.path === '99_QA_Staging_Guard.js');
expect(guardTouched?.after_bytes === GUARD_AFTER_BYTES, 'manifest guard after_bytes drift');
expect(guardTouched?.after_sha256 === GUARD_AFTER_SHA256, 'manifest guard after_sha256 drift');
const routerTouched = manifest.touched_files.find(item => item.path === '01_Router.js');
expect(routerTouched?.after_bytes === ROUTER_AFTER_BYTES, 'manifest router after_bytes drift');
expect(routerTouched?.after_sha256 === ROUTER_AFTER_SHA256, 'manifest router after_sha256 drift');
const indexTouched = manifest.touched_files.find(item => item.path === 'index.html');
expect(indexTouched?.after_bytes === INDEX_AFTER_BYTES, 'manifest index after_bytes drift');
expect(indexTouched?.after_sha256 === INDEX_AFTER_SHA256, 'manifest index after_sha256 drift');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cs21a211-guard-'));
try {
  const candidateGuard = path.join(tempDir, '99_QA_Staging_Guard.js');
  fs.writeFileSync(candidateGuard, guardBuffer);
  execFileSync(process.execPath, ['--check', candidateGuard], { stdio: 'pipe' });
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

const addedByFile = new Map();
let current = '';
for (const line of patch.split('\n')) {
  if (line.startsWith('+++ b/')) { current = line.slice(6); if (!addedByFile.has(current)) addedByFile.set(current, []); continue; }
  if (line.startsWith('+') && !line.startsWith('+++') && current) addedByFile.get(current).push(line.slice(1));
}
const added = file => (addedByFile.get(file) || []).join('\n');
const allAdded = [...addedByFile.values()].flat().join('\n');

const indexAdded = added('index.html');
expect(!indexAdded.includes(PROD_DEPLOYMENT), 'index.html still adds the PROD deployment');
expect(indexAdded.includes('CAMPUS_APPS_SCRIPT_URL = <?!= JSON.stringify(CAMPUS_SELF_URL) ?>;'), 'self URL injection missing from index.html');
expect(indexAdded.includes('/(?:exec|dev)$/.test(CAMPUS_APPS_SCRIPT_URL)'), 'frontend must accept the authenticated QA self URL in /exec or @HEAD /dev form');
expect(indexAdded.includes("placeholder={'https://zoom.us/j/...'}"), 'Step3 Zoom placeholder Babel-safe normalization missing');
expect(indexAdded.includes("placeholder={'Ej: Aula A1, Sala Azul...'}"), 'Step3 salon placeholder Babel-safe normalization missing');
expect(indexAdded.includes("<input type={'range'} min={5} max={20}"), 'Step3 capacity range Babel-safe normalization missing');
expect(indexAdded.includes("postCronogramaSafe('getGrupoInfo', { cod_grupo: codGrupo })"), 'Cronograma safe getGrupoInfo POST missing');
expect(indexAdded.includes("postCronogramaSafe('getAsistenciaEstudiante', { codigo })"), 'Cronograma safe asistencia POST missing');
expect(indexAdded.includes("postCronogramaSafe('getEvaluacionesEstudiante', { codigo })"), 'Cronograma safe evaluaciones POST missing');
expect(indexAdded.includes("const token = window.getSessionToken ? window.getSessionToken() : ''"), 'Cronograma token-in-body preparation missing');
expect(indexAdded.includes('usr?.grupoActivo || usr?.grupo || usr?.grupos?.[0]'), 'Cronograma grupoActivo/session group resolution missing');
const aliasCount = (indexAdded.match(/= CAMPUS_APPS_SCRIPT_URL;/g) || []).length;
expect(aliasCount === 13, `expected 13 legacy URL aliases to self URL, found ${aliasCount}`);
expect(added('01_Router.js').includes('ScriptApp.getService().getUrl()'), 'router does not derive Web App self URL');
expect(added('01_Router.js').includes('/(?:exec|dev)$/.test(campusSelfUrl)'), 'router must accept the authenticated QA self URL in /exec or @HEAD /dev form');
expect(added('01_Router.js').includes('campusTemplate.CAMPUS_SELF_URL = campusSelfUrl;'), 'router does not inject self URL into template');

const requiredProperties = [
  'QA_STAGING_DOCUMENTOS_FOLDER_ID', 'QA_STAGING_DOCUMENTOS_ESTUDIANTES_FOLDER_ID',
  'QA_STAGING_PLANTILLAS_FOLDER_ID', 'QA_STAGING_PADRON_FOLDER_ID',
  'QA_STAGING_DOCUMENTOS_DOCENTES_ROOT_ID', 'QA_STAGING_CONAPE_BACKUP_FOLDER_ID',
  'QA_STAGING_PROFORMAS_SHEET_ID', 'QA_STAGING_CONAPE_4_ESTUDIANTES_ID',
  'QA_STAGING_CONAPE_5_PLAN_ID', 'QA_STAGING_CONAPE_6_HISTORIAL_ID',
  'QA_STAGING_CONAPE_7_MOROSIDAD_ID',
];
for (const property of requiredProperties) expect(allAdded.includes(property), `missing QA resource property ${property}`);

for (const [file, lines] of addedByFile) {
  if (file === '98_Instalacion_QA_CS21A144.js' || file === '99_QA_Staging_Guard.js') continue;
  const text = lines.join('\n');
  for (const id of prodResourceIds) expect(!text.includes(id), `${file} adds writable PROD resource id ${id}`);
}

const guard = added('99_QA_Staging_Guard.js');
for (const token of ['qa_route_ambiguous','qa_endpoint_not_allowlisted','_qa144ExternalIdsOk_','QA_CS21A211_PROD_RESOURCE_IDS']) {
  expect(guard.includes(token), `guard invariant missing: ${token}`);
}
expect(guard.includes("typeof ELV2_tryHandleCampusPostAtOuterGuard === 'function'"), 'ELV2 optional boundary availability guard missing');
expect(guard.includes('e && e.parameter && e.parameter.action') && guard.includes('body && body.action'), 'guard does not inspect action selectors');
expect(guard.includes('req.ids.some(_qa144DangerousFn_)'), 'guard does not classify all normalized selectors');
expect(guard.includes("return _qa144Json_({ok:false,error:'qa_endpoint_not_allowlisted'"), 'guard must default-deny unclassified endpoints');
expect(!guard.includes("'getadmindashboard'"), 'getAdminDashboard must remain default-denied because its current path may create PAGOS_CAMPUS');
expect(!guard.includes("'getestudiante'"), 'getEstudiante must remain default-denied because its current path may create/update financial intent snapshots or missing sheets');
expect(!guard.includes("'getoperacionespagoreversibles'"), 'getOperacionesPagoReversibles must remain default-denied because it may initialize PAGOS_OPERACIONES');
for (const legacyRead of ['getgrupoinfo','getcomprobantes','getnovedadesconape','getradiografiagrupo']) {
  expect(guard.includes(`'${legacyRead}'`), `manually audited legacy read missing from exact allowlist: ${legacyRead}`);
}

const installer = added('98_Instalacion_QA_CS21A144.js');
expect(installer.includes('No crea carpetas, archivos, spreadsheets ni deployments'), 'installer must remain provisioning-only');
expect(installer.includes('No crear un /exec paralelo'), 'installer must preserve the existing QA deployment');

for (const forbidden of ['clasp push', 'clasp deploy', 'DriveApp.createFolder(', 'SpreadsheetApp.create(']) {
  expect(!allAdded.includes(forbidden), `forbidden remote mutation primitive in candidate patch: ${forbidden}`);
}

console.log(`CS21A211_QA_CONTAINMENT_CONTRACT=PASS files=${expectedFiles.length} parts=${patchParts.length} hunks=${hunkCount} aliases=${aliasCount}`);
console.log(`GUARD_RECONSTRUCTED_SYNTAX=PASS bytes=${guardBuffer.length} sha256=${GUARD_AFTER_SHA256}`);
console.log(`SOURCE_AGGREGATE=${manifest.source_aggregate_sha256}`);
console.log(`CANDIDATE_AGGREGATE=${manifest.candidate_aggregate_sha256}`);
console.log(`PATCH_SHA256=${manifest.patch_sha256}`);
