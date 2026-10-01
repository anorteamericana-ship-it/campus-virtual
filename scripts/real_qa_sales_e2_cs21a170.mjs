import fs from 'node:fs';
import path from 'node:path';

const requiredBase = [
  'QA_STAGING_APPS_SCRIPT_URL',
  'QA_SALES_USER',
  'QA_SALES_PASS',
  'QA_SALES_OWN_PROSPECT_CEDULA',
  'QA_SALES_FOREIGN_PROSPECT_CEDULA',
];

const missingBase = requiredBase.filter(name => !String(process.env[name] || '').trim());
if (missingBase.length) throw new Error(`Faltan variables QA Sales: ${missingBase.join(', ')}`);

const stagingUrl = process.env.QA_STAGING_APPS_SCRIPT_URL.trim();
const executeWrites = process.env.QA_SALES_EXECUTE_WRITES === 'CS21A170_STAGING_ONLY';
const writeConfirmation = String(process.env.QA_SALES_WRITE_CONFIRMATION || '').trim();
const qaGroup = String(process.env.QA_SALES_GROUP_CODE || '').trim();

if (executeWrites) {
  if (writeConfirmation !== 'CS21A170_STAGING_ONLY') {
    throw new Error('BLOQUEADO: falta confirmación explícita QA_SALES_WRITE_CONFIRMATION=CS21A170_STAGING_ONLY.');
  }
  if (!qaGroup) throw new Error('BLOQUEADO: QA_SALES_GROUP_CODE es obligatorio para probar denegación de activación.');
}

const productionSource = fs.readFileSync('src/data.jsx', 'utf8');
const prodMatch = productionSource.match(/const\s+APPS_SCRIPT_URL\s*=\s*['"]([^'"]+)['"]/);
if (!prodMatch) throw new Error('No se encontró la URL productiva para aplicar el bloqueo.');
if (stagingUrl === prodMatch[1]) throw new Error('BLOQUEADO: la URL de staging coincide con producción.');

const outDir = path.join(process.cwd(), 'qa-output-sales-e2');
fs.mkdirSync(outDir, { recursive: true });
const findings = [];
const checks = [];
const add = (severity, area, title, evidence = '') => findings.push({ severity, area, title, evidence });
const record = (area, name, ok, extra = {}) => checks.push({ area, name, ok, ...extra });

async function post(fn, payload = {}, token = '') {
  const url = new URL(stagingUrl);
  url.searchParams.set('fn', fn);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...payload }),
    redirect: 'follow',
  });
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); }
  catch (_) { throw new Error(`${fn} devolvió una respuesta no JSON.`); }
  return { response, data };
}

async function get(fn, params = {}) {
  const url = new URL(stagingUrl);
  url.searchParams.set('fn', fn);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, { redirect: 'follow' });
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); }
  catch (_) { throw new Error(`${fn} devolvió una respuesta no JSON.`); }
  return { response, data };
}

function isDenied(result) {
  if (!result || !result.data) return true;
  if (result.data.ok === true) return false;
  const text = JSON.stringify(result.data).toLowerCase();
  return /deneg|forbidden|no autoriz|permiso|scope|asesor|rol|sesion|session/.test(text) || result.data.ok === false;
}

const status = await get('getInfoGeneral');
const qa = status.data && status.data.qa;
const safeStaging = status.response.ok
  && status.data.ok === true
  && qa
  && qa.marker === 'QA_STAGING_CS21A138'
  && qa.qa_staging === true
  && qa.master_match === true
  && qa.operational_match === true
  && qa.writes_guarded === true;
record('staging_guard', 'marker_and_write_guard', safeStaging, { marker: qa && qa.marker });
if (!safeStaging) throw new Error('BLOQUEADO: la URL no demuestra staging QA seguro con guardas de escritura.');

const login = await post('iniciarSesion', {
  usuario: process.env.QA_SALES_USER,
  clave: process.env.QA_SALES_PASS,
});
const salesRole = String(login.data && login.data.rol || '').toLowerCase();
const salesLogged = login.response.ok && login.data && login.data.ok === true && login.data.token && salesRole === 'ventas';
record('auth', 'sales_login', Boolean(salesLogged), { returned_role: salesRole || null });
if (!salesLogged) {
  add('P1', 'autenticación', 'No se obtuvo sesión QA con rol ventas');
  throw new Error('BLOQUEADO: login Sales QA inválido.');
}

const token = login.data.token;
const asesor = String(process.env.QA_SALES_ADVISOR_NAME || login.data.nombre || '').trim();
if (!asesor) throw new Error('BLOQUEADO: no se pudo resolver nombre/scope del asesor QA.');

const dashboard = await post('getDashboardVentas', { asesor }, token);
const dashboardOk = dashboard.response.ok && dashboard.data && dashboard.data.ok === true;
record('sales_read', 'own_dashboard', dashboardOk);
if (!dashboardOk) add('P1', 'ventas', 'Sales no pudo leer su dashboard propio');

const ownDetail = await post('getProspectoDetalle', {
  cedula: process.env.QA_SALES_OWN_PROSPECT_CEDULA,
}, token);
const ownDetailOk = ownDetail.response.ok && ownDetail.data && ownDetail.data.ok === true;
record('sales_read', 'own_prospect_detail', ownDetailOk);
if (!ownDetailOk) add('P1', 'ventas', 'Sales no pudo leer el prospecto QA propio');

const foreignDetail = await post('getProspectoDetalle', {
  cedula: process.env.QA_SALES_FOREIGN_PROSPECT_CEDULA,
}, token);
const foreignDetailDenied = isDenied(foreignDetail);
record('sales_scope', 'foreign_prospect_detail_denied', foreignDetailDenied);
if (!foreignDetailDenied) add('P1', 'scope', 'Sales pudo leer un prospecto QA ajeno');

if (executeWrites) {
  const marker = `QA-CS21A170-${new Date().toISOString()}`;

  const ownNote = await post('agregarNotaProspecto', {
    cedula: process.env.QA_SALES_OWN_PROSPECT_CEDULA,
    asesor,
    texto: marker,
  }, token);
  const ownNoteOk = ownNote.response.ok && ownNote.data && ownNote.data.ok === true;
  record('sales_write', 'own_note_allowed', ownNoteOk);
  if (!ownNoteOk) add('P1', 'mutación', 'La mutación QA propia fue rechazada');

  const foreignNote = await post('agregarNotaProspecto', {
    cedula: process.env.QA_SALES_FOREIGN_PROSPECT_CEDULA,
    asesor,
    texto: marker,
  }, token);
  const foreignNoteDenied = isDenied(foreignNote);
  record('sales_scope', 'foreign_note_denied', foreignNoteDenied);
  if (!foreignNoteDenied) add('P0', 'scope', 'Sales pudo mutar un prospecto QA ajeno');

  const activate = await post('activarEstudiante', {
    cedula: process.env.QA_SALES_OWN_PROSPECT_CEDULA,
    grupo: qaGroup,
    asesor,
  }, token);
  const activateDenied = isDenied(activate);
  record('role_guard', 'sales_activation_denied', activateDenied);
  if (!activateDenied) add('P0', 'rol', 'Sales pudo activar estudiante');
} else {
  record('sales_write', 'write_suite_skipped', true, { reason: 'QA_SALES_EXECUTE_WRITES no habilitado' });
}

const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
for (const finding of findings) counts[finding.severity] += 1;
const verdict = counts.P0 || counts.P1 ? 'BLOQUEADO' : counts.P2 ? 'APTO CON RESERVAS' : 'APTO';

const report = {
  version: 'CS21A170',
  generated_at: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || 'local',
  mode: executeWrites ? 'SALES_E2_STAGING_CONTROLLED_WRITES' : 'SALES_E2_STAGING_READ_ONLY',
  verdict,
  counts,
  checks,
  findings,
  safety: [
    'La URL staging se compara contra la URL productiva y se rechaza si coincide.',
    'Se exige marcador QA_STAGING_CS21A138 y writes_guarded=true antes de autenticar.',
    'Las escrituras positivas solo se habilitan con confirmación CS21A170_STAGING_ONLY.',
    'El reporte no serializa usuarios, contraseñas, tokens ni cédulas QA.',
  ],
};

fs.writeFileSync(path.join(outDir, 'sales-e2-report.json'), JSON.stringify(report, null, 2));
const md = [
  '# QA Sales E2 · Staging · CS21A170', '',
  `- Veredicto: **${verdict}**`,
  `- Modo: ${report.mode}`,
  `- Checks: ${checks.length}`,
  `- Hallazgos: P0 ${counts.P0} · P1 ${counts.P1} · P2 ${counts.P2} · P3 ${counts.P3}`, '',
  '## Checks', '',
  ...checks.map(item => `- ${item.ok ? 'OK' : 'FALLÓ'} · ${item.area} · ${item.name}`), '',
  '## Hallazgos', '',
  ...(findings.length ? findings.map(item => `- **${item.severity} · ${item.area} · ${item.title}**`) : ['No se detectaron hallazgos.']), '',
  '## Seguridad', '',
  ...report.safety.map(item => `- ${item}`), '',
].join('\n');
fs.writeFileSync(path.join(outDir, 'sales-e2-report.md'), md);
console.log(`SALES E2 CS21A170: ${verdict}; mode=${report.mode}; P0=${counts.P0}; P1=${counts.P1}`);
if (counts.P0 || counts.P1) process.exit(1);
