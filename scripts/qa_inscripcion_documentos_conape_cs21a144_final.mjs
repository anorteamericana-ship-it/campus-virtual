import fs from 'node:fs';

const jsx = fs.readFileSync('src/inscripcion.jsx','utf8').replace(/\r\n/g,'\n');
const css = fs.readFileSync('styles/inscripcion.css','utf8').replace(/\r\n/g,'\n');
const html = fs.readFileSync('inscripcion.html','utf8').replace(/\r\n/g,'\n');

function ok(condition, message){
  if(condition) console.log('PASS ' + message);
  else { console.error('FAIL ' + message); process.exitCode = 1; }
}

const groupStart = jsx.indexOf('function GroupStep(');
const groupEnd = jsx.indexOf('function DatosStep(', groupStart);
const groupBlock = groupStart >= 0 && groupEnd > groupStart ? jsx.slice(groupStart, groupEnd) : '';
const docsStart = jsx.indexOf('function DocsStep(');
const docsEnd = jsx.indexOf('function SummaryRow(', docsStart);
const docsBlock = docsStart >= 0 && docsEnd > docsStart ? jsx.slice(docsStart, docsEnd) : '';
const uploaderStart = jsx.indexOf('function readFileDataUrl(');
const uploaderEnd = jsx.indexOf('function resizeImage(', uploaderStart);
const uploaderBlock = uploaderStart >= 0 && uploaderEnd > uploaderStart ? jsx.slice(uploaderStart, uploaderEnd) : '';

ok(jsx.includes("const INS_VERSION = 'F98.4-Z6-IP4A';"), 'versión frontend IP4A');
ok(groupBlock.length > 0, 'GroupStep localizado');
ok(groupBlock.includes('COURSE_TYPES.map'), 'tarjetas de modalidad preservadas');
ok(jsx.includes("title:'Curso intensivo'"), 'tarjeta Curso intensivo preservada');
ok(!groupBlock.includes('ins-group-toolbar'), 'toolbar redundante eliminado');
ok(!groupBlock.includes('Ahora escogé uno de los horarios disponibles.'), 'texto redundante eliminado');
ok(!groupBlock.includes('Actualizar horarios'), 'botón Actualizar horarios eliminado');

ok(uploaderBlock.length > 0, 'uploader CS21A144 localizado');
ok(uploaderBlock.includes('📷 Tomar foto'), 'opción Tomar foto visible');
ok(uploaderBlock.includes('📁 Subir archivo'), 'opción Subir archivo visible');
ok(uploaderBlock.includes('accept="image/*" capture="environment"'), 'input cámara dedicado conserva capture environment');
ok(uploaderBlock.includes('image/jpeg,image/png,image/gif,image/webp'), 'input de archivos de imagen existe sin capture');
ok(uploaderBlock.includes('function FilePdf('), 'uploader de PDF de identidad existe');
ok(uploaderBlock.includes('accept="application/pdf"'), 'PDF de identidad limita selector a application/pdf');
ok(uploaderBlock.includes("file.size > 6 * 1024 * 1024"), 'PDF de identidad tiene límite preventivo 6 MB');

ok(docsBlock.length > 0, 'DocsStep localizado');
ok(docsBlock.includes('documento_identidad_pdf'), 'DocsStep contempla PDF de identidad');
ok(docsBlock.includes('!!form.foto_ced_frente && !!form.foto_ced_dorso'), 'DocsStep contempla ambas caras');
ok(docsBlock.includes('CONAPE requiere <b>un solo PDF</b> con el frente y el dorso.'), 'UI explica requisito CONAPE de un solo PDF');
ok(docsBlock.includes('la Academia generará el PDF automáticamente'), 'UI explica generación automática desde dos caras');
ok(!docsBlock.includes('hint="Imagen o PDF" allowPdf'), 'título no habilita PDF mientras el visor legacy siga siendo imagen-only');
ok(docsBlock.includes('hint="Tomá una foto o elegí una imagen"'), 'título permite cámara o archivo de imagen');
ok(jsx.includes("documento_identidad_pdf:'', foto_titulo:''"), 'campo PDF identidad existe en form');
ok(jsx.includes('delete safe.documento_identidad_pdf'), 'PDF identidad no se persiste en localStorage');
ok(jsx.includes('documento_identidad_conape: true'), 'payload marca contrato de identidad CONAPE');
ok(jsx.includes("if(!(form.documento_identidad_pdf || (form.foto_ced_frente && form.foto_ced_dorso)) || !form.foto_titulo)"), 'validación final acepta PDF o ambas caras y exige título');

ok(css.includes('/* CS21A144 · selector cámara/archivo + documentos CONAPE */'), 'CSS CS21A144 presente');
ok(css.includes('.ins-id-sides{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}'), 'dos caras se muestran en grid escritorio');
ok(css.includes('@media (max-width:760px){.ins-id-sides{grid-template-columns:1fr}'), 'dos caras colapsan a una columna móvil');
ok(html.includes('styles/inscripcion.css?v=F98.4Z6IP4A'), 'cache CSS IP4A');
ok(html.includes('src/inscripcion.jsx?v=F98.4Z6IP4A'), 'cache JSX IP4A');

if(process.exitCode) process.exit(process.exitCode);
console.log('CS21A144 final static QA PASS');
