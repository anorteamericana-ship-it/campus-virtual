import fs from 'node:fs';

const html = fs.readFileSync('ventas.html', 'utf8');
const guard = fs.readFileSync('src/ventas_runtime_guard_cs21a152.js', 'utf8');
const drawer = fs.readFileSync('src/ventas_drawer.jsx', 'utf8');

const fail = (msg) => { console.error(`FAIL: ${msg}`); process.exitCode = 1; };
const pass = (msg) => console.log(`PASS: ${msg}`);

if (!html.includes('src/ventas_runtime_guard_cs21a152.js?v=CS21A152')) fail('ventas.html no carga el guard CS21A152');
else pass('ventas.html carga el guard CS21A152');

const dataPos = html.indexOf('src/ventas_data.jsx');
const guardPos = html.indexOf('src/ventas_runtime_guard_cs21a152.js');
const drawerPos = html.indexOf('src/ventas_drawer.jsx');
if (!(dataPos >= 0 && guardPos > dataPos && drawerPos > guardPos)) fail('orden de carga incorrecto: ventas_data -> guard -> drawer');
else pass('orden de carga correcto');

if (!guard.includes("grupos:[]")) fail('guard no fuerza lista vacía ante falla de grupos reales');
else pass('fallo real no cae a grupos demo');

if (!guard.includes("/_TEST$/.test(tipo)")) fail('guard no bloquea tipos documentales QA');
else pass('tipos documentales QA bloqueados');

const previewBlocks = (guard.match(/payload && payload\.preview_test/g) || []).length;
if (previewBlocks < 2) fail('guard no bloquea preview_test en subida y notificación');
else pass('preview_test bloqueado en operaciones reales');

// CS21A157 supersedió la deuda visual conocida de CS21A152. En la fuente
// integrada ya no basta con bloquearla operacionalmente: no debe reaparecer.
for (const marker of [
  'previewMatriculaCR',
  'cedulaPreviewMatricula',
  'Modo prueba controlado',
  'Estos botones son temporales y solo aparecen para este prospecto de prueba.'
]) {
  if (drawer.includes(marker)) fail(`deuda visual QA reapareció: ${marker}`);
  else pass(`deuda visual QA ausente: ${marker}`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A152 QA OK · reconciliado con CS21A157');
