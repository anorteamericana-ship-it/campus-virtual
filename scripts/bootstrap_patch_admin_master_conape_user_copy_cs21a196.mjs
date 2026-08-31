import fs from 'node:fs';

function replaceExact(src, oldText, newText, label) {
  const count = src.split(oldText).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1, found ${count}`);
  console.log(`${label}: replaced 1`);
  return src.replace(oldText, newText);
}

const dataPath = 'src/admin_master_conape_data_cs21a96.jsx';
const viewPath = 'src/admin_master_conape_view_cs21a96.jsx';
let data = fs.readFileSync(dataPath, 'utf8');
let view = fs.readFileSync(viewPath, 'utf8');

data = replaceExact(
  data,
  "setMsg('Morosidad verificada directamente en 7-morosidad oficial.')",
  "setMsg('Morosidad verificada en el registro oficial.')",
  'mora verification copy'
);

view = replaceExact(
  view,
  "'No quedan desembolsos académicos 01 pendientes según 7-morosidad.'",
  "'No quedan desembolsos académicos 01 pendientes según el registro oficial de morosidad.'",
  'pending empty-state copy'
);

fs.writeFileSync(dataPath, data);
fs.writeFileSync(viewPath, view);
console.log('CS21A196 exact Panel Maestro CONAPE copy patch applied');