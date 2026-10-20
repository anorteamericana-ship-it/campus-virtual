// F111 · QA B2 oral: valida el snapshot congelado y prepara un guard opt-in.
// NO usa red, no lee credenciales, no escribe Sheets/Drive, no hace clasp push.
// Modo predeterminado: node scripts/qa_f111_b2_oral_gate.mjs "<QA_HEAD_...>"
// Modo candidato local: agregar --prepare "<carpeta-de-salida-QA>".
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const EXPECTED = Object.freeze({
  script: '1GMHihGwnX_-sIS101rRlUoYpAH2HSKyms8lx6L9z7bjb_45YDn-ph6WD',
  aggregate: '174bed158912c50851e8c2d3fc886975075c32fd96a58228265a36242f57e3b1',
  guard: 'a39441e9e99981583e4f98d0994f5ac0b80f244e2febbb7e3d5895550fe310fe',
  router: '87f80a0240d261ed6361a6c51087ddd86ae429eef6dcb9111609f3d0d6e74c68',
  auth: 'f2849387b2cbb64bfcea2de1e52ab4a1e735d4d9d4211904336e0b2677729fb4',
  index: 'c031707fab664327436bb4f68cfbb23dcee123f82c7b0d456c3b39097af0d212',
  master: '1dud749W7dJaYkD7l2C3-CKmbrCx5mG_pahTOYrHLsvE',
  operativo: '1aPYBZOs8zxF2n9cDOeKazhSXHRfhqyLs8pDM0axt8U0',
  prodDeployment: 'AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ',
});

const sha = data => crypto.createHash('sha256').update(data).digest('hex');
function fail(reason) { throw new Error('F111_B2_QA_ABORT: ' + reason); }
function must(ok, reason) { if (!ok) fail(reason); }
const args = process.argv.slice(2);
const rootArg = args[0];
must(rootArg && !rootArg.startsWith('--'), 'especificar carpeta QA_HEAD_20261020_184203Z');
const root = path.resolve(rootArg);
const snapshot = fs.existsSync(path.join(root, 'manifest.json')) ? root : path.dirname(root);
const base = path.join(snapshot, 'source');
const manifestFile = path.join(snapshot, 'manifest.json');
must(fs.existsSync(manifestFile) && fs.existsSync(base), 'snapshot incompleto; falta manifest.json o source/');
const m = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
must(m.mode === 'READ_ONLY_CLASP_CLONE', 'no es un snapshot de solo lectura');
must(m.script_id === EXPECTED.script, 'Script ID distinto del QA canónico');
must(m.source_file_count === 71 && m.files?.length === 71, 'se requieren los 71 archivos del HEAD certificado');
must(m.aggregate_sha256 === EXPECTED.aggregate, 'HEAD QA cambió: cancelar y recongelar, no parchear a ciegas');

const rows = [];
for (const item of m.files) {
  must(!path.isAbsolute(item.path) && !item.path.split(/[\\/]/).includes('..'), 'ruta no segura en manifiesto');
  const file = path.join(base, item.path);
  must(fs.existsSync(file), 'archivo ausente: ' + item.path);
  const bytes = fs.readFileSync(file);
  const hash = sha(bytes);
  must(bytes.length === item.bytes && hash === item.sha256, 'contenido modificado: ' + item.path);
  rows.push({path: item.path, bytes: bytes.length, sha256: hash});
}
const seed = rows.map(x => x.path + '\t' + x.bytes + '\t' + x.sha256).join('\n');
must(sha(Buffer.from(seed, 'utf8')) === EXPECTED.aggregate, 'aggregate no reproduce el manifiesto');

function get(name, expectedSha) {
  const file = path.join(base, name);
  must(fs.existsSync(file), 'falta ' + name);
  const contents = fs.readFileSync(file);
  must(sha(contents) === expectedSha, 'hash divergente en ' + name);
  return contents.toString('utf8');
}
const guard = get('99_QA_Staging_Guard.js', EXPECTED.guard);
const router = get('01_Router.js', EXPECTED.router);
const auth = get('02_Auth_Sesiones_Usuarios.js', EXPECTED.auth);
const index = get('index.html', EXPECTED.index);

must(!index.includes(EXPECTED.prodDeployment), 'index.html apunta al deployment PROD');
must(guard.includes(EXPECTED.master) && guard.includes(EXPECTED.operativo), 'guard usa otros libros QA');
must(guard.includes('_qa144IdsOk_()') && guard.includes('_qa144ExternalIdsOk_()'), 'sin frontera de hojas/Drive');
must(guard.includes('qa_endpoint_not_allowlisted') && guard.includes('qa_write_blocked'), 'guard no es default-deny');
must(guard.includes('function _qa144AllowedCampusCoreFn_(fn){'), 'guard core desconocido');
must(!/function _qaF111B2Allowed_\s*\(/.test(guard), 'patch F111 ya presente; evitar duplicación');

const publicOral = ['oralGetPanelDocente','oralGetEvaluacion','oralSaveDraft','oralCloseEvaluacion','oralGeneratePdf'];
for (const fn of publicOral) {
  must(new RegExp('function\\s+' + fn + '\\s*\\(').test(auth), 'sin función pública ' + fn);
  must(router.includes("fn === '" + fn + "'"), 'router no despacha ' + fn);
}
for (const fn of ['docenteIniciarSesionClaseF77','docenteCerrarClaseConAsistenciaF87']) {
  must(router.toLowerCase().includes(fn.toLowerCase()), 'falta ruta docente ' + fn);
}
must(/function\s+oralGetPanelDocente_F90_1\s*\(/.test(auth), 'falta implementación interna del panel');
must(/function\s+oralCloseEvaluacion_F90\s*\(/.test(auth), 'falta implementación interna del cierre');

console.log('F111_QA_B2_SNAPSHOT=PASS');
console.log('SCRIPT_QA=' + EXPECTED.script);
console.log('FILES=71; AGGREGATE=' + EXPECTED.aggregate);
console.log('CRITICAL_SHA=4/4; ORAL_PUBLIC_ROUTES=5/5');
console.log('QA_GUARD=DEFAULT_DENY; PROD_IN_INDEX=0');
console.log('RUNTIME_GET_FLAGS=PROBADAS_POR_DIRECCION_NO_REPETIDAS');
console.log('B2_CA_FIXTURE=NO_CERTIFICADO; L8_L9_CALENDARIO=NO_CERTIFICADO');
console.log('POST_QA=NO_GO; PROD=INTACTA');

const publish = args[1] === '--publish-qa' && args.length === 2;
const i = args.indexOf('--prepare');
if (!publish && i < 0) process.exit(0);
if (!publish) must(i === 1 && args[i + 1] && args.length === 3, 'usar --prepare "<carpeta-de-salida-QA>"');
const workRoot = publish ? fs.mkdtempSync(path.join(os.tmpdir(), 'f111-b2-qa-release-')) : null;
const outputDir = publish ? path.join(workRoot, 'candidate') : path.resolve(args[i + 1]);
must(outputDir !== base && !outputDir.startsWith(base + path.sep), 'no escribir dentro de la fuente congelada');
must(!fs.existsSync(outputDir) || fs.readdirSync(outputDir).length === 0, 'salida ya tiene archivos: no sobrescribir');

const marker = 'var _qa144DoPostBase_ = doPost;';
const originalBranch = [
  '    if (_qa144AllowedLabFn_(req.fn) || _qa144AllowedCampusCoreFn_(req.fn)) {',
  '      return _qa144DoPostBase_(e);',
  '    }',
].join('\n');

must(guard.split(marker).length === 2, 'ancla doPost ausente o duplicada');
must(guard.split(originalBranch).length === 2, 'ancla de allowlist ausente o duplicada');

// El gate solo opera si existen cinco propiedades QA adicionales, un docente
// QA real autenticado, grupo de prueba -99XX y un único alumno QA-. Expira
// automáticamente en un máximo de 24 horas; no hay apertura permanente.
const extra = [
"function _qaF111B2Allowed_(req){",
"  try {",
"    var prop = PropertiesService.getScriptProperties();",
"    function p(n){ return String(prop.getProperty(n) || '').trim(); }",
"    if (p('QA_F111_B2_ORAL_ENABLED') !== 'YES') return false;",
"    var group = p('QA_F111_B2_GROUP_CODE');",
"    var student = p('QA_F111_B2_STUDENT_CODE');",
"    var teacher = p('QA_F111_B2_TEACHER_USERNAME');",
"    var expires = Date.parse(p('QA_F111_B2_EXPIRES_UTC'));",
"    var now = Date.now();",
"    if (!/^B1-(?:LM|KJ)[0-9]{2}-C[1-9]-99[0-9]{2}$/.test(group) ||",
"        !/^QA-[A-Z0-9-]+$/.test(student) || !/^qa_[a-z0-9_.-]+$/i.test(teacher) ||",
"        !Number.isFinite(expires) || expires <= now || expires-now > 86400000) return false;",
"    var b = req && req.body || {};",
"    var f = String(req.fn || '').toLowerCase();",
"    if (req.ambiguous || !_qa144IdsOk_() || b.reposicion_id) return false;",
"    var groupParam = String(b.cod_grupo || b.grupo || b.codGrupo || '').trim();",
"    var isActiveSessionRead = f === 'getdocentesesionactivaf87';",
"    if (!isActiveSessionRead && groupParam !== group) return false;",
"    if (groupParam && groupParam !== group) return false;",
"    if (!isActiveSessionRead && String(b.nivel || '').trim().toUpperCase() !== 'B2') return false;",
"    if (isActiveSessionRead && b.nivel && String(b.nivel).trim().toUpperCase() !== 'B2') return false;",
"    var l = Number(b.leccion || b.leccion_num || 0);",
"    var oral = ['oralgetpaneldocente','oralgetevaluacion','oralsavedraft',",
"                'oralcloseevaluacion','oralgeneratepdf'];",
"    var classRead = ['getdocentesesionactivaf87','getestudiantesparacierre'];",
"    var classWrite = ['docenteiniciarsesionclasef77','docentecerrarclaseconasistenciaf87'];",
"    if (oral.indexOf(f) === -1 && classRead.indexOf(f) === -1 && classWrite.indexOf(f) === -1) return false;",
"    if (oral.indexOf(f) !== -1 && l !== 9) return false;",
"    if (classWrite.indexOf(f) !== -1 && l !== 8 && l !== 9) return false;",
"    if (classRead.indexOf(f) !== -1 && l && l !== 8 && l !== 9) return false;",
"    var rawToken = String(b.token || b.session_token || '').trim();",
"    if (!rawToken) return false;",
"    var ses = validarSesion(rawToken);",
"    if (!ses || ses.ok !== true || String(ses.rol || '').toLowerCase() !== 'teacher') return false;",
"    if (!_qa144IdentityAllowed_(ses)) return false;",
"    var who = String(ses.usuario || ses.email || ses.correo || '').trim();",
"    if (who.toLowerCase() !== teacher.toLowerCase()) return false;",
"    var mine = [];",
"    if (Array.isArray(ses.grupos)) mine = ses.grupos.map(String);",
"    if (ses.grupo) mine.push(String(ses.grupo));",
"    if (mine.indexOf(group) === -1) return false;",
"    if (['oralgetevaluacion','oralsavedraft','oralcloseevaluacion','oralgeneratepdf'].indexOf(f) !== -1) {",
"      if (String(b.cod_estudiante || b.codigo || '').trim() !== student) return false;",
"    }",
"    if (f === 'docentecerrarclaseconasistenciaf87') {",
"      var attendance = b.asistencias;",
"      if (!attendance || typeof attendance !== 'object' || Array.isArray(attendance)) return false;",
"      var codes = Object.keys(attendance);",
"      if (codes.length !== 1 || codes[0] !== student) return false;",
"    }",
"    return true;",
"  } catch (_) { return false; }",
"}",
].join('\n');

const addition = [
  '    if (_qaF111B2Allowed_(req)) {',
  '      return _qa144DoPostBase_(e);',
  '    }',
].join('\n');

let patched = guard.replace(marker, extra + '\n\n' + marker);
patched = patched.replace(originalBranch, originalBranch + '\n' + addition);
must(patched !== guard && patched.includes('QA_F111_B2_EXPIRES_UTC'), 'no se pudo preparar candidato');
must(patched.includes('qa_endpoint_not_allowlisted') && patched.includes('qa_write_blocked'), 'candidate elimina default-deny');
must(patched.includes('var _qa144DoGetBase_ = doGet;'), 'candidate altera GET');

fs.mkdirSync(outputDir, { recursive: true });
const dest = path.join(outputDir, '99_QA_Staging_Guard.js');
fs.writeFileSync(dest, patched, 'utf8');
console.log('F111_QA_GUARD_CANDIDATE=PREPARADO_LOCAL; DEPLOYED=NO');
console.log('CANDIDATE_SHA256=' + sha(Buffer.from(patched, 'utf8')));
console.log('CANDIDATE_BYTES=' + Buffer.byteLength(patched, 'utf8'));
console.log('OUTPUT=' + dest);
console.log('ALCANCE=solo QA; habilitación runtime requiere propiedades temporales y cohorte ficticia.');
if (!publish) console.log('SIN PUSH; SIN PUBLICAR; SIN ESCRIBIR SHEETS/DRIVE.');
else console.log('CANDIDATO LOCAL PREPARADO; INICIANDO PROTOCOLO QA CON PUSH PROTEGIDO.');


if (publish) {
  // Publicación exclusivamente al Script ID QA canónico, sin --force.
  // Re-clonar HEAD y exigir 71/71 hashes idénticos antes de un único push.
  const isWindows = process.platform === 'win32';
  const npx = isWindows ? (process.env.ComSpec || 'cmd.exe') : 'npx';
  const clasp = ['--yes', '@google/clasp@3.3.0'];
  const qaDeployment = 'AKfycbxEAQ9lAg1Nv0ASX30MAVOzD7IZvwwqSI9MYcNaMhOQ';
  const remoteDir = path.join(workRoot, 'remote-qa-head');
  const verifyDir = path.join(workRoot, 'verify-qa-head');
  fs.mkdirSync(remoteDir, { recursive: true });
  fs.mkdirSync(verifyDir, { recursive: true });
  function claspRun(command, cwd) {
    const params = isWindows ? ['/d', '/c', 'npx.cmd'].concat(clasp, command) : clasp.concat(command);
    const result = spawnSync(npx, params, {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 180000,
      maxBuffer: 25 * 1024 * 1024,
    });
    if (result.status !== 0 || result.error) {
      fail('clasp ' + command[0] + ' falló: ' +
        String(result.error?.message || (result.stderr || result.stdout || '')).slice(-700));
    }
    return String(result.stdout || '');
  }
  function verifyClone(where, expectCandidate) {
    const claspFile = path.join(where, '.clasp.json');
    must(fs.existsSync(claspFile), 'sin .clasp.json QA');
    const settings = JSON.parse(fs.readFileSync(claspFile, 'utf8'));
    must(settings.scriptId === EXPECTED.script, 'ABORT: .clasp apunta fuera del proyecto QA');
    const remoteFiles = fs.readdirSync(where)
      .filter(x => /^(?:.*\.(?:js|gs|html)|appsscript\.json)$/.test(x))
      .sort();
    const wanted = m.files.map(x => x.path).sort();
    must(JSON.stringify(remoteFiles) === JSON.stringify(wanted),
      'ABORT: inventario HEAD remoto no coincide exactamente con 71/71');
    for (const item of m.files) {
      const expectedHash = expectCandidate && item.path === '99_QA_Staging_Guard.js' ?
        sha(Buffer.from(patched, 'utf8')) : item.sha256;
      must(sha(fs.readFileSync(path.join(where, item.path))) === expectedHash,
        'ABORT: drift remoto ' + item.path);
    }
    return true;
  }
  try {
    console.log('CLASP_QA_READBACK=INICIANDO');
    claspRun(['clone-script', EXPECTED.script], remoteDir);
    verifyClone(remoteDir, false);
    console.log('CLASP_QA_READBACK=PASS 71/71; SCRIPT_ID_QA_CORRECTO');
    const target = path.join(remoteDir, '99_QA_Staging_Guard.js');
    fs.copyFileSync(dest, target);
    verifyClone(remoteDir, true);
    console.log('DELTA_LOCAL=SOLO 99_QA_Staging_Guard.js');
    console.log('PUSH_QA=INICIANDO; PROD_PROHIBIDO; SIN_FORCE');
    claspRun(['push'], remoteDir);
    console.log('PUSH_QA=EJECUTADO; VERIFICANDO HEAD REMOTO');
    claspRun(['clone-script', EXPECTED.script], verifyDir);
    verifyClone(verifyDir, true);
    const deployments = claspRun(['list-deployments'], verifyDir);
    const canonicalLine = deployments.split(/\r?\n/)
      .find(line => line.includes(qaDeployment));
    must(canonicalLine && canonicalLine.includes('@HEAD'),
      'deployment QA canónico no apunta a HEAD; no crear otro deployment');
    console.log('F111_QA_GUARD_PUSH=PASS');
    console.log('POST_PUSH_REMOTE_GUARD_SHA256=' + sha(fs.readFileSync(path.join(verifyDir, '99_QA_Staging_Guard.js'))));
    console.log('DEPLOYMENT_QA_CANONICO=@HEAD; OTROS_DEPLOYMENTS_INTACTOS');
    console.log('QA_F111_B2_ORAL_ENABLED=OFF_POR_DEFECTO; NO SE CAMBIARON PROPIEDADES');
    console.log('PROPIEDADES_QA_SUGERIDAS_PARA_UNICO_TEST:');
    console.log('QA_F111_B2_ORAL_ENABLED=YES');
    console.log('QA_F111_B2_GROUP_CODE=B1-LM69-C3-9926');
    console.log('QA_F111_B2_STUDENT_CODE=QA-F111-B2-01');
    console.log('QA_F111_B2_TEACHER_USERNAME=qa_docente');
    console.log('QA_F111_B2_EXPIRES_UTC=' + new Date(Date.now() + 4 * 3600000).toISOString());
    console.log('Estas propiedades solo se configuran en Apps Script QA tras verificar readback.');
    console.log('PRODUCCION=NO_TOCADA; SHEETS=NO_CAMBIADAS_POR_ESTE_RUNNER');
  } finally {
    fs.rmSync(workRoot, { recursive: true, force: true });
  }
}
