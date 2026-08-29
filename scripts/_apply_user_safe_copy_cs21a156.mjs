import fs from 'node:fs';

function replaceExactlyOnce(src, before, after, label) {
  const parts = src.split(before);
  const count = parts.length - 1;
  if (count !== 1) throw new Error(`${label}: preimagen esperada 1 vez, encontrada ${count}`);
  return parts.join(after);
}

const appPath = 'src/app.jsx';
const ventasPath = 'src/ventas_data.jsx';
let app = fs.readFileSync(appPath, 'utf8');
let ventas = fs.readFileSync(ventasPath, 'utf8');

app = replaceExactlyOnce(
  app,
  'Recargá la página. Si el problema continúa, el archivo del módulo no terminó de publicarse en GitHub.',
  'Recargá la página. Si el problema continúa, intentá nuevamente en unos minutos o contactá a soporte.',
  'ModuloNoDisponible copy'
);

app = replaceExactlyOnce(
  app,
  'La sesión permanece guardada. Recargá la página después de que GitHub termine de publicar todos los archivos.',
  'Tu sesión permanece guardada. Recargá la página para intentar completar la carga.',
  'pantalla carga copy'
);

app = replaceExactlyOnce(
  app,
  `<div style={{ marginTop:14, padding:'10px 12px', borderRadius:10, background:'#F8F4EE', color:'#6B6258', fontFamily:'monospace', fontSize:11, overflowWrap:'anywhere' }}>{mensaje}</div>`,
  `<div style={{ marginTop:14, padding:'10px 12px', borderRadius:10, background:'#F8F4EE', color:'#6B6258', fontSize:12, lineHeight:1.5 }}>Si el problema continúa, volvé al inicio de sesión e ingresá nuevamente.</div>`,
  'detalle técnico crudo de carga'
);

ventas = replaceExactlyOnce(
  ventas,
`  if (cleaned.charAt(0) === '<') {
    throw new Error('El backend devolvió HTML en vez de JSON. Recargá con Ctrl+F5; si persiste, revisá que GitHub haya publicado src/data.jsx y que Apps Script esté desplegado.');
  }
  const data = cleaned ? JSON.parse(cleaned) : { ok:false, error:'Respuesta vacía del backend.' };`,
`  if (cleaned.charAt(0) === '<') {
    console.error('[Ventas] Respuesta inesperada del servicio.', { tipo: 'html', longitud: cleaned.length });
    throw new Error('No pudimos cargar el panel. Recargá la página e intentá nuevamente.');
  }
  const data = cleaned ? JSON.parse(cleaned) : { ok:false, error:'No recibimos respuesta del servicio. Intentá nuevamente.' };`,
  'Ventas error técnico visible'
);

fs.writeFileSync(appPath, app);
fs.writeFileSync(ventasPath, ventas);
console.log('CS21A156 apply PASS');
