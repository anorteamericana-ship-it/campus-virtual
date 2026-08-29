import fs from 'node:fs';

const files = {
  data: 'src/ventas_data.jsx',
  dash: 'src/ventas_dashboard.jsx',
};

function replaceExactlyOnce(src, before, after, label) {
  const pieces = src.split(before);
  const count = pieces.length - 1;
  if (count !== 1) throw new Error(`${label}: preimagen esperada 1 vez, encontrada ${count}`);
  return pieces.join(after);
}

let data = fs.readFileSync(files.data, 'utf8');
let dash = fs.readFileSync(files.dash, 'utf8');

data = replaceExactlyOnce(
  data,
`async function postVentas(payload) {
  const res = await fetch(SCRIPT_URL_V, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  return await res.json();
}`,
`async function postVentas(payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const res = await fetch(SCRIPT_URL_V, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...payload, token }),
  });
  return await res.json();
}`,
  'postVentas token'
);

dash = replaceExactlyOnce(
  dash,
  '<window.MiMatriculasMes asesor={usuario.nombre} />',
  '<window.MiMatriculasMes asesor={scopeAsesor} />',
  'MiMatriculasMes scope'
);

dash = replaceExactlyOnce(
  dash,
  '          asesor={usuario.nombre}\n          usuario={usuario}',
  '          asesor={scopeAsesor}\n          usuario={usuario}',
  'ProspectoDrawer scope'
);

fs.writeFileSync(files.data, data);
fs.writeFileSync(files.dash, dash);
console.log('CS21A155 apply PASS');
