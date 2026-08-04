import fs from 'node:fs';
import path from 'node:path';

const required = [
  'QA_STAGING_APPS_SCRIPT_URL',
  'QA_STUDENT_USER',
  'QA_STUDENT_PASS',
  'QA_STUDENT_CODE',
];
const missing = required.filter((name) => !String(process.env[name] || '').trim());
if (missing.length) throw new Error(`Faltan variables QA: ${missing.join(', ')}`);

const stagingUrl = process.env.QA_STAGING_APPS_SCRIPT_URL.trim();
const source = fs.readFileSync('src/data.jsx', 'utf8');
const prodMatch = source.match(/const\s+APPS_SCRIPT_URL\s*=\s*['"]([^'"]+)['"]/);
if (!prodMatch) throw new Error('No se encontró la URL productiva para aplicar el bloqueo.');
if (stagingUrl === prodMatch[1]) throw new Error('BLOQUEADO: la URL QA coincide con producción.');

async function post(fn, payload = {}, token = '') {
  const url = new URL(stagingUrl);
  url.searchParams.set('fn', fn);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn, token, ...payload }),
      redirect: 'follow',
      signal: controller.signal,
    });
    const raw = await response.text();
    let data;
    try { data = JSON.parse(raw); }
    catch (_) { throw new Error(`${fn} devolvió respuesta no JSON: ${raw.slice(0, 300)}`); }
    return { status: response.status, elapsed_ms: Date.now() - started, data };
  } finally {
    clearTimeout(timeout);
  }
}

const login = await post('iniciarSesion', {
  usuario: process.env.QA_STUDENT_USER,
  clave: process.env.QA_STUDENT_PASS,
});
if (login.status !== 200 || login.data?.ok !== true || !login.data?.token) {
  throw new Error(`No fue posible iniciar sesión QA: ${JSON.stringify(login.data).slice(0, 500)}`);
}

const token = login.data.token;
const code = String(login.data.codigo || process.env.QA_STUDENT_CODE || '').trim();
const access = await post('englishLabAccessStatus', { force: true }, token);
const ficha = await post('getEstudiante', { codigo: code }, token);

const levels = ficha.data?.pendientes?.por_nivel || {};
const sanitizedLevels = Object.fromEntries(Object.entries(levels).map(([level, row]) => [level, {
  estatus: row?.estatus,
  mora_exigible: row?.mora_exigible,
  deuda_exigible: row?.deuda_exigible,
  mora_calculada: row?.mora_calculada,
  moroso: row?.moroso,
  estado_financiero: row?.estado_financiero,
  certificado_cobrable: row?.certificado_cobrable,
  certificado_pendiente: row?.certificado_pendiente ?? row?.cert_pend,
  cuotas_pendientes: row?.cuotas_pendientes ?? row?.cuotas_pend,
  matricula_pendiente: row?.matricula_pendiente ?? row?.matricula_pend,
}]));

const report = {
  generated_at: new Date().toISOString(),
  staging_url_host: new URL(stagingUrl).host,
  login: {
    ok: login.data?.ok === true,
    rol: login.data?.rol,
    codigo: code,
    elapsed_ms: login.elapsed_ms,
  },
  english_lab: {
    http_status: access.status,
    elapsed_ms: access.elapsed_ms,
    version: access.data?.version,
    ok: access.data?.ok,
    allowed: access.data?.allowed ?? access.data?.autorizado,
    estado: access.data?.estado,
    nivel: access.data?.nivel,
    estatus_academico: access.data?.estatus_academico,
    mensaje: access.data?.mensaje,
    error: access.data?.error,
  },
  student_record: {
    http_status: ficha.status,
    elapsed_ms: ficha.elapsed_ms,
    ok: ficha.data?.ok,
    codigo: code,
    nivel_activo: ficha.data?.pendientes?.nivel_activo || ficha.data?.nivel_activo,
    por_nivel: sanitizedLevels,
  },
};

const outDir = 'qa-output-english-lab';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'diagnostic.json'), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(outDir, 'diagnostic.md'), [
  '# Diagnóstico English LAB QA · CS21A172',
  '',
  `- Login: **${report.login.ok ? 'OK' : 'FAIL'}** · rol ${report.login.rol || 'n/a'} · código ${report.login.codigo || 'vacío'} · ${report.login.elapsed_ms} ms`,
  `- Endpoint: **${report.english_lab.estado || 'sin estado'}** · permitido ${String(report.english_lab.allowed)} · versión ${report.english_lab.version || 'sin versión'} · ${report.english_lab.elapsed_ms} ms`,
  `- Mensaje: ${report.english_lab.mensaje || report.english_lab.error || 'sin mensaje'}`,
  '',
  '## Niveles financieros',
  '',
  '```json',
  JSON.stringify(report.student_record.por_nivel, null, 2),
  '```',
  '',
].join('\n'));

console.log(JSON.stringify(report, null, 2));

if (report.english_lab.version !== 'F98.4-Z6-CS21A171') {
  throw new Error(`El deployment no está sirviendo CS21A171; reporta ${report.english_lab.version || 'sin versión'}.`);
}
if (report.english_lab.allowed !== true || report.english_lab.estado !== 'AL_DIA') {
  throw new Error(`QA-STU-001 no obtuvo AL_DIA: ${report.english_lab.estado || 'sin estado'}.`);
}
