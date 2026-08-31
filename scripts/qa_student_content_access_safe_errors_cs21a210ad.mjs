import fs from 'node:fs';
import crypto from 'node:crypto';

const path='src/student_content_access_cs21a125.jsx';
const src=fs.readFileSync(path,'utf8');
const must=(ok,label)=>{if(!ok)throw new Error(`CS21A210AD FAIL: ${label}`)};

const helper="  function contentAccessSafeUserError(raw,fallback,context=''){const msg=clean(raw);if(msg)console.warn('[StudentContentAccess] Detalle técnico oculto al estudiante.',{context,error:msg});const tecnico=/apps?\\s*script|backend|endpoint|stack|exception|trace|<html|json|token|sesion_requerida|unauthorized|forbidden|internal server|status\\s*\\d{3}|http\\s*\\d{3}|getAccesoContenidoEstudiante|getBibliotecaNivelEstudiante|getAudioPistaEstudiante|base64|mime|drive\\.google\\.com|failed to fetch|networkerror|typeerror|referenceerror|syntaxerror|cannot read|[A-Za-z0-9_-]{30,}/i;return !msg||tecnico.test(msg)?fallback:msg;}\n";

must(src.includes(helper.trim()),'safe helper exists');
must(!src.includes('fallback.backend_error=err.message'),'raw backend error removed from fallback state');
must(!src.includes('error:e.message,access:null'),'raw access catch removed');
must(!src.includes('error:e.message,catalog:null'),'raw catalog catch removed');
must(!src.includes("error:e.message,src:''"),'raw audio catch removed');
must(src.includes("contentAccessSafeUserError(e?.message||String(e),'No pudimos verificar tus niveles autorizados. Intentá nuevamente.','get_acceso_contenido')"),'access safe boundary');
must(src.includes("contentAccessSafeUserError(e?.message||String(e),'No pudimos cargar el contenido de este nivel. Intentá de nuevo.','get_biblioteca_nivel')"),'catalog safe boundary');
must(src.includes("contentAccessSafeUserError(e?.message||String(e),'No pudimos cargar esta pista. Intentá nuevamente.','get_audio_pista')"),'audio safe boundary');
must(src.includes("console.warn('[StudentContentAccess] Detalle técnico oculto al estudiante.',{context:'get_acceso_contenido',error:err?.message||String(err)})"),'fallback diagnostic console-only');

// Autorización y rutas: congeladas.
must(src.includes("const ROUTES=new Set(['planeamiento_estudiante','libros_audios_estudiante','recursos_adicionales','plan_estudio_estudiante']);"),'route ownership preserved');
must(src.includes("if(['CA','APR','CNV'].includes(st))allowed.splice(0,allowed.length,...LEVELS.slice(0,i+1))"),'cumulative CA/APR/CNV preserved');
must(src.includes("if(!allowed.length&&/^AN0626-/.test(code))allowed.push('B1','B2','I1');"),'AN0626 fallback preserved');
must(src.includes("if(!allowed.length&&/^AN0726-/.test(code))allowed.push('B1');"),'AN0726 fallback preserved');
must(src.includes("demo:/^AN(?:0626|0726)-/.test(code)"),'demo marker preserved');
must(src.includes("post('getAccesoContenidoEstudiante',{codigo})"),'access endpoint preserved');
must(src.includes("post('getBibliotecaNivelEstudiante',{nivel:level,codigo,cod_grupo:group,vista:'estudiante'})"),'catalog endpoint/payload preserved');
must(src.includes("post('getAudioPistaEstudiante',{nivel,codigo,cod_grupo:group,archivo_id:track.id})"),'audio endpoint/payload preserved');
must(src.includes("body:JSON.stringify({fn,token:token(),...payload})"),'token in body preserved');

// Drive/catalog/audio behavior: frozen; no ACL operations introduced.
must(src.includes("const PLAN_DOCS={B1:'1yTq26DzSwAwajHqH_I8RfN2Z-DHoM_Jl',B2:'1DbJ2-1SGEjxCMccQA2l8YuANehWm8qC9',I1:'1110cof4beNl_ME7HMOgDmHCx0N_Ux-kc',I2:'1CajioftRWZyrDXX5XmKOswIIYNB_A7ln'};"),'plan Drive IDs preserved');
must(src.includes('https://drive.google.com/file/d/${id}/preview'),'Drive preview URL preserved');
must(src.includes('https://drive.google.com/uc?export=download&id=${id}'),'Drive download URL preserved');
must(src.includes('window.StudentBooksProxyCS21A126'),'book proxy preserved');
must(src.includes("new Blob([bytes],{type:r.audio.mime||'audio/mpeg'})"),'audio Blob/mime preserved');
must(!/setSharing|setPermission|permissions\.create|drive\.permissions|acl/i.test(src),'no ACL mutation introduced');

// English LAB visibility contract is frozen.
must(src.includes('function patchEnglishLab()'),'English LAB visibility patch preserved');
must(src.includes("const minByTitle={'GRAMMAR BUILDER':'B2','LISTENING BOOST':'B2','READING FLASH':'I1'}"),'English LAB minimum-level map preserved');
must(src.includes("if(route==='academia_play')queueLab();"),'English LAB queue preserved');

// Prove the large shared source differs from the exact base only by the intended AD edits.
let restored=src;
function reverseOnce(newText,oldText,label){const count=restored.split(newText).length-1;must(count===1,`reverse ${label} count=${count}`);restored=restored.replace(newText,oldText);}
reverseOnce(helper,'','helper');
reverseOnce("const fallback=sessionFallback();console.warn('[StudentContentAccess] Detalle técnico oculto al estudiante.',{context:'get_acceso_contenido',error:err?.message||String(err)});ACCESS_CACHE.value=fallback;return fallback;","const fallback=sessionFallback();fallback.backend_error=err.message;ACCESS_CACHE.value=fallback;return fallback;",'fallback state');
reverseOnce(".catch(e=>setState({loading:false,error:contentAccessSafeUserError(e?.message||String(e),'No pudimos verificar tus niveles autorizados. Intentá nuevamente.','get_acceso_contenido'),access:null}));",".catch(e=>setState({loading:false,error:e.message,access:null}));",'access catch');
reverseOnce(".catch(e=>setState({loading:false,error:contentAccessSafeUserError(e?.message||String(e),'No pudimos cargar el contenido de este nivel. Intentá de nuevo.','get_biblioteca_nivel'),catalog:null}));",".catch(e=>setState({loading:false,error:e.message,catalog:null}));",'catalog catch');
reverseOnce(".catch(e=>live&&setState({loading:false,error:contentAccessSafeUserError(e?.message||String(e),'No pudimos cargar esta pista. Intentá nuevamente.','get_audio_pista'),src:''}));",".catch(e=>live&&setState({loading:false,error:e.message,src:''}));",'audio catch');
const bytes=Buffer.from(restored,'utf8');
const sha=crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes])).digest('hex');
must(sha==='7f7dd0f75ff25ced26b9a9427bb284c1ed1d9f60',`exact preimage reconstruction ${sha}`);

console.log('CS21A210AD STUDENT CONTENT ACCESS SAFE ERRORS: PASS');
console.log('RAW_VISIBLE_SINKS=3_REMOVED');
console.log('RAW_FALLBACK_DIAGNOSTIC=CONSOLE_ONLY');
console.log('AUTHORIZATION_DRIVE_ENGLISH_LAB=FROZEN');
console.log('EXACT_PREIMAGE_RECONSTRUCTION=PASS');
console.log('EVIDENCE=E0_E1_SOURCE_ONLY');
