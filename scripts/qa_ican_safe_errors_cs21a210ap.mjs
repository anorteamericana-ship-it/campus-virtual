import fs from 'node:fs';
import crypto from 'node:crypto';

const FILE='src/ican_participation_cs21a122.js';
const LOADER='src/student_demo_level_filter_cs21a110.js';
const LEGACY_WORKFLOW='.github/workflows/validate-cs21a122.yml';
const BASE_BLOB='44428caad352727970e11d271dbf18199b812025';
const HELPER="function ican122SafeUserError(raw,fallback,context){var msg=clean(raw).replace(/\\s+/g,' ');if(msg)console.warn('[Club I CAN] Detalle técnico oculto al usuario.',{context:context||'',error:msg});return fallback;}";
const pairs=[
  ["setData({error:primaryError.message||'No se pudo cargar Club I CAN.'});","setData({error:ican122SafeUserError(primaryError&&primaryError.message,'No pudimos cargar Club I CAN. Intentá nuevamente.','carga_estudiante')});"],
  ["setNotice(error.message||'No se pudo guardar la inscripción.');","setNotice(ican122SafeUserError(error&&error.message,'No pudimos guardar la inscripción. Intentá nuevamente.','guardar_inscripcion'));"],
  ["setError(loadError.message||'No se pudieron cargar las inscripciones.');","setError(ican122SafeUserError(loadError&&loadError.message,'No pudimos cargar las inscripciones. Intentá nuevamente.','carga_docente'));"],
  ["setNotice('La inscripción por horario requiere publicar el backend CS21A122. Tu avance existente se mantiene visible.');","setNotice('La inscripción por horario todavía no está disponible. Tu avance existente se mantiene visible.');"],
  ["text:data.legacy?'La agenda por horario se activará al publicar el backend CS21A122.':'No hay sesiones futuras disponibles en el calendario del grupo.',","text:data.legacy?'La agenda por horario todavía no está disponible.':'No hay sesiones futuras disponibles en el calendario del grupo.',"],
];

function sha(text){const b=Buffer.from(text,'utf8');return crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');}
function must(ok,msg){if(!ok)throw new Error(msg);}
function once(src,from,to){const n=src.split(from).length-1;must(n===1,`Expected one occurrence while reconstructing, found ${n}: ${from.slice(0,80)}`);return src.replace(from,to);}

const src=fs.readFileSync(FILE,'utf8');
const loader=fs.readFileSync(LOADER,'utf8');
const legacyWorkflow=fs.readFileSync(LEGACY_WORKFLOW,'utf8');

must((src.split(HELPER).length-1)===1,'Safe helper AP must exist exactly once.');
must(src.includes("console.warn('[Club I CAN] Detalle técnico oculto al usuario.'"),'Technical detail must be console-only.');
for(const [oldText,newText] of pairs){must(!src.includes(oldText),`Old visible leak remains: ${oldText.slice(0,80)}`);must(src.includes(newText),`Expected AP replacement missing: ${newText.slice(0,80)}`);}
must(!src.includes('backend CS21A122'),'Student-visible backend CS21A122 copy must be absent.');

for(const endpoint of ['getICANPortalEstudiante','getICANEstudiante','reservarICANSesionEstudiante','cancelarReservaICANEstudiante','getICANDocenteReservas']) must(src.includes(endpoint),`Endpoint contract changed: ${endpoint}`);
must(src.includes("method:'POST'"),'POST transport contract changed.');
must(src.includes('token:getToken()'),'Session token contract changed.');
must(src.includes("postEndpoint('getICANEstudiante',{codigo:code})"),'Legacy student fallback changed.');
must(src.includes('window.ICANViewNew=StudentClubICANView'),'Student I CAN install contract changed.');
must(src.includes('window.ClubICANDocenteView=TeacherClubICANWrapper'),'Teacher I CAN wrapper contract changed.');
must(src.includes("'data-screen-label':'Estudiante · Club I CAN · CS21A122'"),'Student surface marker changed.');
must(src.includes("'data-screen-label':'Docente · Club I CAN · CS21A122'"),'Teacher surface marker changed.');

must(loader.includes("script.src = 'src/ican_participation_cs21a122.js?v=F98.4Z6CS21A122';"),'Effective CS21A122 loader changed.');
must(legacyWorkflow.includes('node --check src/ican_participation_cs21a122.js'),'Historical syntax guard changed.');
must(legacyWorkflow.includes('grep -q "getICANPortalEstudiante" src/ican_participation_cs21a122.js'),'Historical endpoint guard changed.');

let restored=src;
for(const [oldText,newText] of [...pairs].reverse()) restored=once(restored,newText,oldText);
restored=once(restored,HELPER,'');
must(sha(restored)===BASE_BLOB,`AP reversal does not reconstruct exact preimage: ${sha(restored)} != ${BASE_BLOB}`);

console.log('QA CLUB I CAN SAFE ERRORS CS21A210AP PASS');
