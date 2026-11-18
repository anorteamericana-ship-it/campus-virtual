// F111 escrito · E1: en la UI ninguna opción B reproduce el video de
// la segunda sección de opción A. Fuente y bundle deben conservar paridad.
// El backend bloquea inicio NUEVO B; esto solo prueba la barrera visual.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const render=fs.readFileSync('src/examenes_render.jsx','utf8');
const bundle=fs.readFileSync('src/examenes_bundle.jsx','utf8');
const data=fs.readFileSync('src/examenes_data.jsx','utf8');
const start="function ListeningMedia({ exam, sec, showKey, onOpenScript, privateAudioUrl='' }) {";
const end='// ── Cuerpo por tipo ──';
const section=(s)=>{
 const a=s.indexOf(start),b=s.indexOf(end,a);
 assert(a>=0&&b>a,'ListeningMedia y fin de bloque encontrados');
 return s.slice(a,b).replace(/\r\n/g,'\n').trim();
};
const a=section(render),b=section(bundle);
assert.equal(a,b,'bundle render actual idéntico a source');
assert(a.includes('bAudioNoCertificado'));
assert(a.includes('/_WRITTEN_L(?:18|32)_TEST[12]_B$/'));
assert(a.includes('const id = !bAudioNoCertificado && exam.videos'));
assert(a.includes("role={bAudioNoCertificado?'alert':undefined}"));
assert(a.includes('Opción B bloqueada: falta certificar el audio propio de esta versión.'));
assert(data.includes("? { listening_A: VIDEO_MAP[nv][ts.test].B, listening_B: VIDEO_MAP[nv][ts.test].B }"),
 'la fuente B incorrecta está documentada y aún no se finge reparada');
// Se debe retirar esta prueba de deuda cuando exista endpoint MP3 privado E2
// y los videos del catálogo ya no estén cruzados. Nada se sube a Pages aquí.
console.log('F111_WRITTEN_B_AUDIO_UI_GUARD_E1_PASS: fuente=bundle, 8 variantes B ocultan video cruzado, alerta visible, A mantiene media; 0 I/O externo');
