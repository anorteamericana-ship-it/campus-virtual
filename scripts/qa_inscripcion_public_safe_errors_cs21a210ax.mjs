import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const sourcePath='src/inscripcion.jsx';
const htmlPath='inscripcion.html';
const frozenBase='186e2e76fada311ee9bfe9cfc620cdaaa3edc927';
const expectedPreimage='310d7b6e888836baca1bd0da0ccc0730c23ca9c3';
const src=fs.readFileSync(sourcePath,'utf8').replace(/\r\n/g,'\n');
const html=fs.readFileSync(htmlPath,'utf8').replace(/\r\n/g,'\n');

function count(text, needle){ return text.split(needle).length-1; }
function exactly(text, needle, n=1){
  const got=count(text,needle);
  if(got!==n) throw new Error(`expected ${n} occurrence(s), got ${got}: ${needle}`);
}
function absent(text, needle){ exactly(text,needle,0); }
function gitBlobSha(text){
  const body=Buffer.from(text,'utf8');
  return crypto.createHash('sha1')
    .update(Buffer.concat([Buffer.from(`blob ${body.length}\0`),body]))
    .digest('hex');
}

const entryRefs=html.match(/src="src\/inscripcion\.jsx\?v=[^"]+"/g) || [];
if(entryRefs.length!==1) throw new Error(`expected exactly one effective inscripcion.jsx entry, got ${entryRefs.length}`);

const helper=`\nfunction inscripcionSafeUserError(raw, fallback, context){\n  const detail=String(raw&&raw.message||raw||'').trim();\n  if(detail) console.warn('[inscripcion] '+context, detail);\n  return fallback;\n}\n`;
exactly(src,helper);

const replacements=[
  ["setErr(String(e&&e.message||'No se pudo abrir la foto.'));","setErr(captureErrorMessage(e&&e.message));"],
  ["}catch(e){ setErr(e.message); }","}catch(e){ setErr(inscripcionSafeUserError(e, 'No pudimos verificar la identificación. Intentá nuevamente.', 'verificarCedulaInscripcion')); }"],
  ["}catch(e){ setGroupsError(e.message); }","}catch(e){ setGroupsError(inscripcionSafeUserError(e, 'No pudimos cargar los grupos disponibles. Intentá nuevamente.', 'getGruposInscripcion')); }"],
  ["}catch(e){ if(mounted) setGlobalError(e.message); }","}catch(e){ if(mounted) setGlobalError(inscripcionSafeUserError(e, 'No pudimos cargar la información de inscripción. Intentá nuevamente.', 'cargaInicial')); }"],
  ["}catch(e){ setSubmitError(e.message); }","}catch(e){ setSubmitError(inscripcionSafeUserError(e, 'No pudimos enviar la inscripción. Revisá los datos e intentá nuevamente.', 'crearInscripcionPublica')); }"],
];
for(const [oldSink] of replacements) absent(src,oldSink);
for(const [,safeSink] of replacements.slice(1)) exactly(src,safeSink);
exactly(src,'setErr(captureErrorMessage(e&&e.message));',3);

for(const contract of [
  "insPost('verificarCedulaInscripcion', {cedula})",
  "insPost('buscarEnPadron', {cedula})",
  "insPost('getGruposDisponibles', {})",
  "insPost('crearInscripcionPublica', payload)",
  "origen_web: 'INSCRIPCION_PUBLICA_IP5A'",
  'generar_pdf_identidad_conape: true',
  'version_frontend: INS_VERSION'
]){
  if(!src.includes(contract)) throw new Error(`contract missing: ${contract}`);
}

const preimage=execFileSync('git',['show',`${frozenBase}:${sourcePath}`],{encoding:'utf8',maxBuffer:20*1024*1024});
const preimageSha=gitBlobSha(preimage);
if(preimageSha!==expectedPreimage) throw new Error(`preimage mismatch ${preimageSha}`);
let rebuilt=preimage;
const anchor="\nfunction clean(v){ return String(v == null ? '' : v).trim(); }";
exactly(rebuilt,anchor);
rebuilt=rebuilt.replace(anchor,helper+anchor);
for(const [oldSink,safeSink] of replacements){
  exactly(rebuilt,oldSink);
  rebuilt=rebuilt.replace(oldSink,safeSink);
}
const historicalCandidateSha=gitBlobSha(rebuilt);
const currentSha=gitBlobSha(src);
const mode=currentSha===historicalCandidateSha ? 'EXACT_HISTORICAL' : 'DESCENDANT_SAFE';
if(mode==='EXACT_HISTORICAL' && rebuilt!==src) throw new Error('historical AX candidate no longer reconstructs exactly');

console.log('CS21A210AX PASS');
console.log(`MODE=${mode}`);
console.log(`public_entry=${entryRefs[0]}`);
console.log(`source=${sourcePath}`);
console.log(`frozen_preimage=${preimageSha}`);
console.log(`historical_candidate=${historicalCandidateSha}`);
console.log(`current_blob=${currentSha}`);
