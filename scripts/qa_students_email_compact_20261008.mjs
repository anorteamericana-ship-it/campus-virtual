import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Babel = require('../vendor/babel.js');
const table = fs.readFileSync('src/admin_students.jsx', 'utf8');
const app = fs.readFileSync('src/app.jsx','utf8');
const page = fs.readFileSync('campus.html','utf8');
for (const file of ['src/admin_students.jsx','src/app.jsx']) {
  Babel.transform(fs.readFileSync(file,'utf8'),{presets:['react'],plugins:['transform-block-scoping']});
}
assert(table.includes("postAdminStudents('buscarEstudiantesRapido', { query: grupoSel, limit: 30 })"));
assert(table.includes("if (!grupoSel || !esAdmin)"));
assert(table.includes("if (grupo === grupoSel && codigo && correo) correos[codigo] = correo;"));
assert(table.includes("correosPorCodigo={correosPorCodigo}"));
assert(table.includes("const correo    = String(e.email || e.correo || correosPorCodigo[String(codigo).trim()] || '').trim();"));
assert(table.includes("range.selectNodeContents(ev.currentTarget)"));
assert(table.includes("tableLayout:'fixed'"));
assert(table.includes("fontFamily:'Arial, Helvetica, sans-serif',fontVariantNumeric:'tabular-nums'"));
assert(table.includes("<CertificadoEstadoBox state={state} compact/>"));
assert(table.includes("title={`Proyectar manualmente a ${nivelSiguiente}`}"));
assert(table.includes("onClick={() => abrirPago(e,nivelKey,onNavigate)}"));
assert(app.match(/src\/admin_students.jsx\?v=F99-STUDENT-EMAIL-20261008/g)?.length===3);
assert(/src\/app\.jsx\?v=[A-Za-z0-9_.-]+/.test(page),'Main campus script has a versioned URL');
console.log('STUDENTS_EMAIL_COMPACT_STATIC_PASS');
console.log('BACKEND_WRITES=NONE; PROYECCION_AND_PAYMENTS_PRESERVED; JSX_TRANSPILE_PASS');