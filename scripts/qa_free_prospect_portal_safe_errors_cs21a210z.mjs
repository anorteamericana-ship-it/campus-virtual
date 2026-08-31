import fs from 'node:fs';

const src=fs.readFileSync('src/prospect_free_student.jsx','utf8');
function must(ok,label){if(!ok){console.error(`FAIL|${label}`);process.exitCode=1;return;}console.log(`OK|${label}`);}
function count(s,n){return s.split(n).length-1;}

must(src.includes('function freeStudentVisibleError('),'visible-error helper exists');
must(src.includes("console.error('[Prematricula]'"),'technical detail remains console-only');
must(src.includes('failed to fetch'),'transport marker handled');
must(count(src,'freeStudentVisibleError(')===4,'exactly three call sites plus helper');
must(!src.includes('setError(e.message)'),'raw catch sinks removed');

must(src.includes("freeStudentVisibleError(e,'No pudimos cargar tu información. Intentá nuevamente o contactá a tu asesor.','freeUserMiPerfil')"),'profile load safe boundary');
must(src.includes("freeStudentVisibleError(e,'No se pudo solicitar la entrada. Intentá nuevamente.','freeUserCrearSolicitud:QUIERO_MATRICULARME')"),'entry request safe boundary');
must(src.includes("freeStudentVisibleError(e,'No se pudo contactar al asesor. Intentá nuevamente.','freeUserCrearSolicitud:HABLAR_ASESOR')"),'advisor request safe boundary');

must(src.includes("freeStudentPost('freeUserMiPerfil')"),'profile endpoint preserved');
must(src.includes("freeStudentPost('freeUserCrearSolicitud',{tipo:'QUIERO_MATRICULARME',mensaje:template})"),'entry request endpoint/payload preserved');
must(src.includes("freeStudentPost('freeUserCrearSolicitud',{tipo:'HABLAR_ASESOR',mensaje:template})"),'advisor request endpoint/payload preserved');
must(src.includes("body:JSON.stringify({fn,token,...payload})"),'POST token body contract preserved');
must(src.includes('window.anEnglishLabFreeAccess?.prime'),'English LAB free-access prime preserved');
must(src.includes('window.anEnglishLabFreeAccess?.get?.()'),'English LAB free-access snapshot preserved');
must(src.includes("window.addEventListener('an:english-lab-free-access',update)"),'English LAB access event preserved');
must(src.includes("new CustomEvent('an:free-user-solicitudes-changed')"),'shared request-change event preserved');
must(src.includes("const goLab=()=>{if(onNavigate)onNavigate('academia_play');};"),'English LAB navigation preserved');
must(src.includes("window.open(asesorWa,'_blank','noopener,noreferrer')"),'direct advisor WhatsApp behavior preserved');

if(!process.exitCode) console.log('CS21A210Z PASS');
