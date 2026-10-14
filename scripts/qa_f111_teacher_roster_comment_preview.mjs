// F111 · Vista de comentarios por lección: test sintético/estático, sin PROD.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const file=fs.readFileSync('src/teacher_views.jsx','utf8');
const start=file.indexOf('function RosterAcademicoF79(');
const end=file.indexOf('\nfunction ',start+2);
assert(start>=0,'RosterAcademicoF79 debe existir');
const component=file.slice(start,end>start?end:undefined);

assert(component.includes('const [commentView,setCommentView]=React.useState(\'readable\')'),
  'La vista legible debe ser la opción predeterminada');
assert(component.includes("commentView==='readable'?172:94"),
  'Columnas más anchas solo en vista legible; compacta sin cambio');
assert(component.includes("WebkitLineClamp:2") && component.includes("WebkitBoxOrient:'vertical'"),
  'Comentario real visible en dos líneas');
assert(component.includes('{commentText}'),
  'El texto visible proviene del comentario real; no debe ser solo una etiqueta');
assert(component.includes('tvRosterCommentPreviewF111(comment)'),
  'Normalización segura de comentario');
assert(component.includes("type=\"button\"") && component.includes('aria-label={'),
  'Detalle accesible mediante botón semántico');
assert(component.includes('setSelectedLesson({...l,__isNextDate:isNext})'),
  'El detalle existente sigue abriéndose, sin función de cierre automático');
assert(component.includes('title={commentText}') && component.includes("commentView==='readable'"),
  'Conserva tooltip del texto y vista compacta alterna');
assert(!component.includes('dangerouslySetInnerHTML'),
  'Comentarios siempre como texto React escapado');

const match=file.match(/function tvRosterCommentPreviewF111\(raw\) \{[\s\S]*?\n\}/);
assert(match,'Falta helper puro');
const preview=vm.runInNewContext(match[0]+'; tvRosterCommentPreviewF111');
const given=" Great   start today!\n Keep up the good work!  ";
assert.equal(preview(given),'Great start today! Keep up the good work!');
assert.equal(given," Great   start today!\n Keep up the good work!  ",'No mutar texto fuente');
assert.equal(preview(''),'', 'Sin comentario no debe aparecer tarjeta falsa');
assert.equal(preview(null),'', 'Sin comentario no debe aparecer tarjeta falsa');
assert.equal(preview({fake:'object'}),'', 'No renderizar objeto no textual');
assert.equal(preview('<img src=x onerror=alert(1)>'),'<img src=x onerror=alert(1)>','Conservar texto literal para escapado React');
assert.equal(preview('Ausente.\n We missed you today!'),'Ausente. We missed you today!');
console.log('F111_TEACHER_ROSTER_COMMENT_PREVIEW_PASS: two-line real text, compact toggle, accessibility, safe text, no data writes');
