import fs from 'node:fs';

const path = 'src/panel_admin_supervision.jsx';
let s = fs.readFileSync(path, 'utf8');
function one(label, oldText, newText) {
  const n = s.split(oldText).length - 1;
  if (n !== 1) throw new Error(`${label}: expected 1 exact preimage, found ${n}`);
  s = s.replace(oldText, newText);
}

one(
  'backend response error boundary',
  "          setError(res?.error || 'No se pudo obtener la lista de docentes atrasados.');\n          setData(null);",
  "          console.warn('[AdminSupervision] Respuesta de carga no disponible.', res?.error || res?.mensaje || res);\n          setError('No pudimos cargar la supervisión de docentes. Intentá de nuevo.');\n          setData(null);"
);

one(
  'network runtime error boundary',
  "      .catch(e => setError(e.message || 'Error de conexión.'))",
  "      .catch(e => {\n        console.error('[AdminSupervision] Error técnico cargando supervisión.', e);\n        setError('No pudimos cargar la supervisión de docentes. Intentá de nuevo.');\n      })"
);

fs.writeFileSync(path, s, 'utf8');
console.log('CS21A194 exact admin supervision safe-error patch applied');
