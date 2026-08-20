import fs from 'node:fs';

const file = 'src/inscripcion.jsx';
let jsx = fs.readFileSync(file,'utf8');

function once(text, oldText, newText, label){
  const i=text.indexOf(oldText);
  if(i<0) throw new Error(`No encontré: ${label}`);
  if(text.indexOf(oldText,i+oldText.length)>=0) throw new Error(`Duplicado: ${label}`);
  return text.slice(0,i)+newText+text.slice(i+oldText.length);
}

jsx = once(
  jsx,
  '      <p>Podés tomar una foto, elegir una imagen guardada o subir el documento en PDF.</p>',
  '      <p>Podés tomar una foto o elegir una imagen que ya tengas guardada.</p>',
  'texto título compatible'
);
jsx = once(
  jsx,
  '      <FilePhoto label="Título / último grado" value={form.foto_titulo} onChange={v=>setForm({foto_titulo:v})} hint="Imagen o PDF" allowPdf />',
  '      <FilePhoto label="Título / último grado" value={form.foto_titulo} onChange={v=>setForm({foto_titulo:v})} hint="Tomá una foto o elegí una imagen" />',
  'título imagen-only'
);

fs.writeFileSync(file,jsx,'utf8');
console.log('PASS título/último grado permanece imagen-only para no romper el visor legacy de Ventas.');
