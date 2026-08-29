import fs from 'node:fs';

const path = 'src/ventas_dashboard.jsx';
const src = fs.readFileSync(path, 'utf8');
const errors = [];

function mustInclude(fragment, label) {
  if (!src.includes(fragment)) errors.push(`FALTA: ${label}`);
}
function mustNotInclude(fragment, label) {
  if (src.includes(fragment)) errors.push(`PROHIBIDO: ${label}`);
}

mustInclude('getAsesoresActivos', 'endpoint real getAsesoresActivos');
mustInclude('const [asesoresReales, setAsesoresReales] = useState([]);', 'estado React de asesores reales');
mustInclude("const asesoresSelector = previewKey ? (window.ASESORES_V || []) : asesoresReales;", 'DEMO limitado a preview explícito');
mustInclude("? (asesorView || (previewKey ? usuario.nombre : ''))", 'supervisor real sin fallback a nombre administrativo');
mustInclude('if (esSupervisor && !scopeAsesor) return;', 'espera de asesor real antes de cargar dashboard');
mustInclude("setAsesoresEstado('error');", 'estado de error de asesores');
mustInclude("console.error('[Ventas CS21A153] No se pudo cargar la lista real de asesores.'", 'diagnóstico técnico solo en consola');

mustNotInclude('{window.ASESORES_V.map(', 'selector operativo directo desde ASESORES_V');
mustNotInclude("const scopeAsesor = esSupervisor ? (asesorView || usuario.nombre) : usuario.nombre;", 'fallback legacy de supervisor a usuario.nombre');

// Contar solo referencias ejecutables al global, no menciones en comentarios.
const demoRefs = (src.match(/window\.ASESORES_V/g) || []).length;
if (demoRefs !== 1) errors.push(`window.ASESORES_V debe quedar con exactamente 1 referencia ejecutable (solo preview); encontradas ${demoRefs}`);

if (errors.length) {
  console.error('QA CS21A153 FAIL');
  errors.forEach(e => console.error('-', e));
  process.exit(1);
}

console.log('QA CS21A153 PASS');
console.log('- supervisor operativo obtiene asesores desde USUARIOS vía getAsesoresActivos');
console.log('- DEMO queda limitado a ?preview= explícito');
console.log('- no hay fallback operativo a nombres demo ni a usuario.nombre para supervisor');
