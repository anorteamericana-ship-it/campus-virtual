import fs from 'node:fs';
import path from 'node:path';
import { extractF96LazyMapCS21A193 } from './f96_lazy_map_parser_cs21a193.mjs';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const cleanRef = value => String(value || '').split('#')[0].split('?')[0];
const errors = [];
const warnings = [];
const ok = message => console.log(`OK: ${message}`);
const fail = message => errors.push(message);

function extractLocalAssets(html) {
  const refs = [];
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["']/gi)) {
    const raw = match[1];
    if (/^(?:https?:|data:|\/\/)/i.test(raw)) continue;
    refs.push({ raw, file: cleanRef(raw) });
  }
  return refs;
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(relative));
    else out.push(relative);
  }
  return out;
}

function endpointNames(source) {
  const found = new Set();
  const patterns = [
    /(?:postCampusData|postStudentDash|postStudentModules|postSidebar|postSyllabus|postEndpoint|post)\(\s*["']([A-Za-z0-9_]+)["']/g,
    /\bfn\s*:\s*["']([A-Za-z0-9_]+)["']/g,
    /\?fn=([A-Za-z0-9_]+)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) found.add(match[1]);
  }
  return found;
}

const campus = read('campus.html');
const app = read('src/app.jsx');
const sidebar = read('src/sidebar.jsx');
const studentMenu = read('src/student_menu_academic_cs21a120.jsx');
const stabilization = read('styles/delivery_stabilization_cs21a131.css');
const backendObserved = JSON.parse(read('00_DOCUMENTACION/BACKEND_OBSERVADO_CS21A131.json'));

const staticRefs = extractLocalAssets(campus);
for (const ref of staticRefs) {
  if (!exists(ref.file)) fail(`campus.html referencia un archivo inexistente: ${ref.raw}`);
}
if (!errors.length) ok(`${staticRefs.length} recursos estáticos publicados existen.`);

const canonicalLoader = exists('src/english_lab_live_canonical_loader_cs21a193.js')
  ? read('src/english_lab_live_canonical_loader_cs21a193.js')
  : '';
const lazyMap = extractF96LazyMapCS21A193(app, canonicalLoader);
const lazyRefs = [...new Set(Object.values(lazyMap).flat().map(cleanRef))];
for (const file of lazyRefs) {
  if (!exists(file)) fail(`F96_LAZY referencia un archivo inexistente: ${file}`);
}
if (lazyRefs.every(exists)) ok(`${lazyRefs.length} dependencias diferidas de F96_LAZY existen.`);

const expectedRoutes = {
  student: ['dashboard','mi_curso','evaluaciones','ican','pagos','certificados','documentos_ayuda','academia_play'],
  teacher: ['mi_panel_docente','grupos','asistencia','cronograma_grupo','examenes','materiales','ican','mensajes','perfil'],
  admin: ['perfil','dashboard','supervision','calendario_grupo','auditoria_academica','diagnostico_interno','permisos_roles','conape_cobranza','reportes','inscripcion_admin','examenes','solicitudes','prematriculas','grupos','estudiantes','matriculas','buscador','banco','aplicar_pago'],
  studentCustom: ['perfil_estudiante','info_programa','resumen_academico','syllabus_estudiante','planeamiento_estudiante','plan_estudio_estudiante','cronograma_general_estudiante','libros_audios_estudiante','recursos_adicionales'],
};
for (const [role, routes] of Object.entries(expectedRoutes)) {
  const source = role === 'studentCustom' ? studentMenu : app;
  for (const route of routes) {
    if (!new RegExp(`["']${route}["']|\\b${route}\\s*:`).test(source)) fail(`No se encontró la ruta ${role}.${route}.`);
  }
  ok(`Contrato de rutas ${role}: ${routes.length} rutas localizadas.`);
}

for (const label of ['Mi Perfil','Mis Grupos','Biblioteca del Programa','Panel Maestro','Consulta individual','Pagos y estado de cuenta']) {
  if (!sidebar.includes(label) && !studentMenu.includes(label)) warnings.push(`No se localizó la etiqueta de menú esperada: ${label}`);
}

if (!campus.includes('delivery_stabilization_cs21a131.css?v=F98.4Z6CS21A131')) {
  fail('campus.html no publica la capa CS21A131 con clave de caché.');
}
if (!stabilization.includes('.main:has(.campus-d-root)::before') || !stabilization.includes('.campus-d-root::before')) {
  fail('La capa CS21A131 no contiene la corrección del doble fondo estudiantil.');
} else {
  ok('La corrección del doble fondo estudiantil está publicada y acotada al dashboard.');
}

const sourceFiles = walk('src').filter(file => /\.(?:js|jsx)$/i.test(file));
const endpoints = new Map();
for (const file of sourceFiles) {
  for (const endpoint of endpointNames(read(file))) {
    if (!endpoints.has(endpoint)) endpoints.set(endpoint, []);
    endpoints.get(endpoint).push(file);
  }
}
console.log(`INFO: ${endpoints.size} nombres de endpoint detectados en el frontend.`);

for (const endpoint of backendObserved.verified_missing || []) {
  if (endpoints.has(endpoint)) warnings.push(`Frontend requiere ${endpoint}, pero el Code.gs observado no lo contiene.`);
}
for (const endpoint of backendObserved.verified_present || []) {
  if (endpoints.has(endpoint)) ok(`Contrato frontend/backend observado: ${endpoint}.`);
}

const physicalVersions = new Map();
for (const { raw, file } of staticRefs) {
  if (!physicalVersions.has(file)) physicalVersions.set(file, new Set());
  physicalVersions.get(file).add(raw);
}
for (const raw of Object.values(lazyMap).flat()) {
  const file = cleanRef(raw);
  if (!physicalVersions.has(file)) physicalVersions.set(file, new Set());
  physicalVersions.get(file).add(raw);
}
for (const [file, refs] of physicalVersions) {
  if (refs.size > 1) warnings.push(`${file} aparece con referencias/versiones distintas: ${[...refs].join(' | ')}`);
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}
console.log(`AUDIT OK: superficie de entrega válida; ${warnings.length} advertencia(s) no bloqueante(s).`);
