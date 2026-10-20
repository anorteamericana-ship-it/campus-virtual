// F111 · QA B2 oral: valida el snapshot congelado y prepara un guard opt-in.
// NO usa red, no lee credenciales, no escribe Sheets/Drive, no hace clasp push.
// Modo predeterminado: node scripts/qa_f111_b2_oral_gate.mjs "<QA_HEAD_...>"
// Modo candidato local: agregar --prepare "<carpeta-de-salida-QA>".
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

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

const i = args.indexOf('--prepare');
if (i < 0) process.exit(0);
must(i === 1 && args[i + 1] && args.length === 3, 'usar --prepare "<carpeta-de-salida-QA>"');
const outputDir = path.resolve(args[i + 1]);
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

// El gate solo opera si existen cuatro propiedades QA adicionales, un docente
// QA real autenticado, grupo de prueba -99XX y un único alumno QA-. Expira
// automáticamente en un máximo de 24 horas; no hay apertura permanente.
const extra = String.raw