import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const sourcePath = path.resolve('services/conape-bridge/server_v2.mjs');
const patcherPath = path.resolve('services/conape-bridge/hotfix_v4_2_4.mjs');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'conape-v4-2-4-'));
const targetPath = path.join(tempDir, 'server_v2.mjs');
fs.copyFileSync(sourcePath, targetPath);

const apply = spawnSync(process.execPath, [patcherPath, targetPath], { encoding:'utf8' });
if (apply.status !== 0) {
  process.stderr.write(apply.stdout || '');
  process.stderr.write(apply.stderr || '');
  process.exit(1);
}

const patched = fs.readFileSync(targetPath, 'utf8');
const freshStart = patched.indexOf('  async freshProspectoFromHome() {');
const freshEnd = patched.indexOf('\n};\n\nasync function runNavSelftest()', freshStart);
const freshBlock = freshStart >= 0 && freshEnd > freshStart ? patched.slice(freshStart, freshEnd) : '';
const precreateStart = patched.indexOf('async function assertPreCreateFields(p) {');
const precreateEnd = patched.indexOf('\nasync function collectPageItemIds', precreateStart);
const precreateBlock = precreateStart >= 0 && precreateEnd > precreateStart ? patched.slice(precreateStart, precreateEnd) : '';

const checks = [
  ['patcher reporta PASS', /CONAPE_V4_2_4_HOTFIX_PASS/.test(apply.stdout || '')],
  ['runtime resultante es V4.2.4', /const VERSION = 'V4\.2\.4';/.test(patched)],
  ['freshProspectoFromHome existe una sola vez', freshStart >= 0 && patched.indexOf('  async freshProspectoFromHome() {', freshStart + 1) < 0],
  ['camino primario sale de Home y no de /prospecto directo', /CONAPE_FRIENDLY_HOME/.test(freshBlock) && !/CONAPE_FRIENDLY_PROSPECTO/.test(freshBlock) && !/DIRECT_URL/.test(freshBlock)],
  ['prioriza link contextual emitido por CONAPE', /clickContextRecruitLink\(p\)/.test(freshBlock) && /HOME_CONTEXT_LINK/.test(freshBlock)],
  ['fallback de navegación sigue siendo click real Reclutar', /clickVisibleByLabel\(p, \/RECLUTAR PROSPECTOS/.test(freshBlock) && /HOME_RECRUIT_BUTTON/.test(freshBlock)],
  ['link contextual exige Evento y Prospectador sin registrar valores', /p2_eve_id/.test(patched) && /p2_pro_id/.test(patched) && /clickContextRecruitLink/.test(patched)],
  ['formulario se bloquea si falta contexto', /CONAPE_PROSPECTO_CONTEXT_NOT_READY/.test(freshBlock) && /!context\.evento \|\| !context\.prospectador/.test(freshBlock)],
  ['telemetría de contexto es booleana y declara pii:false', /evento:context\.evento === true/.test(freshBlock) && /prospectador:context\.prospectador === true/.test(freshBlock) && /gate:true/.test(freshBlock) && /pii:false/.test(freshBlock)],
  ['gate pre-click exige P2_PRO_ID y P2_EVE_ID en APEX', /const required = \['P2_PRO_ID','P2_EVE_ID','P2_PRS_CEDULA'/.test(precreateBlock) && /window\.apex\?\.item/.test(precreateBlock)],
  ['telemetría preacción incluye contexto sin exponer valores', /#P2_PRO_ID,#P2_EVE_ID/.test(patched) && /precreate_apex_values\[id\] = apexValue\.trim\(\) !== ''/.test(patched)],
  ['selftest usa Home + click contextual y valida contexto', /const clicked = await clickContextRecruitLink\(p\)/.test(patched) && /result\.context = \{ evento:meta\.evento === true, prospectador:meta\.prospectador === true \}/.test(patched)],
  ['no se asigna un Evento o Prospectador numérico inventado', !/P2_(?:EVE|PRO)_ID[^\n]{0,80}(?:setValue|nativeSetValue|\.value\s*=)\s*['"]?\d{2,}/.test(patched)],
];

let failed = 0;
for (const [name, ok] of checks) {
  if (ok) console.log(`PASS: ${name}`);
  else { console.error(`FAIL: ${name}`); failed += 1; }
}

const syntax = spawnSync(process.execPath, ['--check', targetPath], { encoding:'utf8' });
if (syntax.status === 0) console.log('PASS: sintaxis runtime V4.2.4');
else {
  console.error('FAIL: sintaxis runtime V4.2.4');
  process.stderr.write(syntax.stderr || syntax.stdout || '');
  failed += 1;
}

const secondApply = spawnSync(process.execPath, [patcherPath, targetPath], { encoding:'utf8' });
if (secondApply.status !== 0) console.log('PASS: patcher no es reentrante y falla cerrado');
else { console.error('FAIL: patcher aceptó aplicar dos veces'); failed += 1; }

const wrongBasePath = path.join(tempDir, 'wrong-base.mjs');
fs.copyFileSync(sourcePath, wrongBasePath);
fs.writeFileSync(wrongBasePath, fs.readFileSync(wrongBasePath, 'utf8').replace("const VERSION = 'V4.2.3';", "const VERSION = 'V4.2.2';"));
const wrongBase = spawnSync(process.execPath, [patcherPath, wrongBasePath], { encoding:'utf8' });
if (wrongBase.status !== 0) console.log('PASS: baseline distinto aborta antes de escribir');
else { console.error('FAIL: patcher aceptó baseline distinto'); failed += 1; }

fs.rmSync(tempDir, { recursive:true, force:true });
if (failed) process.exit(1);
console.log(`CONAPE V4.2.4 QA PASS · ${checks.length + 3}/${checks.length + 3}`);
