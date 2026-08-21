import fs from 'node:fs';

const file='src/inscripcion.jsx';
const jsx=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');

function assert(cond,msg){ if(!cond) throw new Error(msg); }
assert(jsx.includes('📷 Tomar foto'), 'Falta opción Tomar foto');
assert(jsx.includes('📁 Subir archivo'), 'Falta opción Subir archivo');
assert(jsx.includes('foto_ced_frente') && jsx.includes('foto_ced_dorso'), 'Faltan las dos imágenes originales de cédula');
assert(jsx.includes('generar_pdf_identidad_conape: true'), 'Falta flag para generar PDF adicional');
assert(!jsx.includes('documento_identidad_pdf'), 'No debe existir una ruta que sustituya las imágenes por PDF manual');
assert(!jsx.includes('allowPdf'), 'No se habilita PDF en los campos de imagen en este corte');
console.log('PASS contrato final: imágenes originales preservadas + PDF adicional generado por backend.');
