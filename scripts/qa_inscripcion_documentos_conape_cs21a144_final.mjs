import fs from 'node:fs';

const jsx=fs.readFileSync('src/inscripcion.jsx','utf8').replace(/\\r\\n/g,'\\n');
const css=fs.readFileSync('styles/inscripcion.css','utf8').replace(/\\r\\n/g,'\\n');
const html=fs.readFileSync('inscripcion.html','utf8').replace(/\\r\\n/g,'\\n');
const scanner=fs.readFileSync('src/document-scanner.js','utf8').replace(/\\r\\n/g,'\\n');

function ok(v,msg){
  if(v) console.log('PASS '+msg);
  else{
    console.error('FAIL '+msg);
    process.exitCode=1;
  }
}

const a=jsx.indexOf('function DocumentCapture(');
const b=jsx.indexOf('function CedulaStep(',a);
const cap=a>=0&&b>a?jsx.slice(a,b):'';

const d=jsx.indexOf('function DocsStep(');
const e=jsx.indexOf('function SummaryRow(',d);
const docs=d>=0&&e>d?jsx.slice(d,e):'';

const s=jsx.indexOf('const INS_DRAFT_FIELDS');
const t=jsx.indexOf('function pickDraftFields',s);
const allow=s>=0&&t>s?jsx.slice(s,t):'';

ok(jsx.includes("const INS_VERSION = 'F98.4-Z6-IP5A';"),'versión frontend IP5A');
ok(cap.length>0,'DocumentCapture integrado');
ok(!jsx.includes('function FilePhoto('),'FilePhoto anterior eliminado');
ok(!jsx.includes('function resizeImage('),'resizeImage anterior eliminado');

ok(cap.includes('readFileDataUrl'),'scanner lee la fuente');
ok(cap.includes('validateQuad'),'validador geom?trico conectado');
ok(cap.includes('rotateSource90'),'Rotar conectado');
ok(cap.includes('normalizeWithCorners'),'homograf?a final conectada');

ok(cap.includes('?? Tomar foto'),'Tomar foto visible');
ok(cap.includes('?? Subir archivo'),'Subir archivo visible');
ok(cap.includes('Ajustá el documento'),'instrucci?n simple');
ok(cap.includes('Alineá los puntos con las cuatro esquinas.'),'gu?a simple');
ok(cap.includes('Revisá tu foto'),'vista final simple');
ok(cap.includes('Usar esta foto'),'confirmaci?n expl?cita');
ok(cap.includes('✓ Documento listo'),'estado final');

ok(!/OpenCV|homograf|long tasks|memoria aproximada|calidad orientativa/i.test(cap),'prospecto no ve diagnóstico técnico');

ok(allow.length>0,'allowlist localStorage presente');
ok(!allow.includes("'clave'"),'contraseña fuera de localStorage');
ok(!allow.includes('foto_ced_frente'),'documentos fuera de localStorage');
ok(jsx.includes('pickDraftFields(next)'),'persistencia usa allowlist');

ok(docs.includes('<DocumentCapture'),'Paso 5 usa scanner');
ok(docs.includes('kind="identity"'),'frente/dorso identidad');
ok(docs.includes('kind="title"'),'título usa scanner');
ok(docs.includes('Solo se env\u00eda la foto final que confirmes.'),'contrato visible');
ok(!docs.includes('Conservamos las im?genes originales'),'texto viejo eliminado');

ok(scanner.includes('10 * 1024 * 1024'),'límite scanner 10 MB');
ok(cap.includes('image/jpeg,image/png,image/webp'),'formatos unificados');

const scannerIndex=html.indexOf('src/document-scanner.js?v=CS21A149-1');
const appIndex=html.indexOf('src/inscripcion.jsx?v=F98.4Z6IP5A');

ok(scannerIndex>=0 && appIndex>scannerIndex,'scanner carga antes del formulario');
ok(html.includes('styles/inscripcion.css?v=F98.4Z6IP5A'),'cache CSS IP5A');
ok(css.includes('/* CS21A150 ? DocumentCapture integrado */'),'CSS integrado');
ok(css.includes('@media (max-width:390px)'),'QA responsive 390 preparado');

if(process.exitCode) process.exit(process.exitCode);
console.log('CS21A150 static QA PASS');
