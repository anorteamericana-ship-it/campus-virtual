// F98.4-Z6-CS21A42 · Consulta individual en una sola lectura coherente.
(function(){
'use strict';
const BUILD='F98.4-Z6-CS21A42';
const TARGET=new Set(['getEstudiante','getAsistenciaEstudiante','getComentarioAdminEstudiante','getHistorialCambiosGrupo']);
let base=null;
const pending=new Map();
function codeOf(payload){return String(payload?.codigo||payload?.cod_estudiante||payload?.code||payload?.rec_m||'').trim();}
function mapResult(fn,bundle){
  if(fn==='getEstudiante')return bundle.ficha;
  if(fn==='getAsistenciaEstudiante')return{ok:true,total:(bundle.asistencia||[]).length,asistencia:bundle.asistencia||[],lectura_fresca:true};
  if(fn==='getComentarioAdminEstudiante')return{ok:true,codigo:bundle.codigo,comentario_admin:String(bundle.comentario_admin||''),tiene_comentario:!!String(bundle.comentario_admin||'').trim(),lectura_fresca:true};
  if(fn==='getHistorialCambiosGrupo')return{ok:true,codigo:bundle.codigo,historial:bundle.historial||[],lectura_fresca:true};
  return bundle;
}
function apply(){
  let current=null;
  try{current=window.postAdminStudents||postAdminStudents;}catch(_){current=window.postAdminStudents;}
  if(typeof current!=='function')return false;
  if(current.__cs21a42Fast===true)return true;
  base=current;
  async function fast(fn,payload={},timeoutMs){
    const codigo=codeOf(payload);
    if(!TARGET.has(String(fn))||!codigo)return base(fn,payload,timeoutMs);
    const key=codigo;
    let entry=pending.get(key);
    if(!entry||Date.now()-entry.at>2500){
      const promise=base('getConsultaIndividualFresh',{codigo,consulta_en:Date.now(),nocache:true},Math.max(Number(timeoutMs)||0,100000))
        .finally(()=>setTimeout(()=>{const x=pending.get(key);if(x?.promise===promise)pending.delete(key);},800));
      entry={at:Date.now(),promise};pending.set(key,entry);
    }
    const bundle=await entry.promise;
    return mapResult(String(fn),bundle);
  }
  fast.__cs21a42Fast=true;
  fast.__base=base;
  try{window.postAdminStudents=fast;}catch(_){ }
  try{postAdminStudents=fast;}catch(_){ }
  window.__AN_STUDENT_FAST_LOADER_BUILD__=BUILD;
  return true;
}
window.addEventListener('an:lazy-module-loaded',e=>{if(String(e?.detail?.src||'').includes('admin_students.jsx'))apply();});
setTimeout(apply,0);
})();
