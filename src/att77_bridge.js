// CS21A77 · Asistencia docente · puente
(function(){
'use strict';
const A=window.ANAtt77,DEPS=['src/vista_docente.jsx?v=F98.4Z6CS19F','src/teacher_views.jsx?v=F98.4Z6CS19F'];
function Screen(){const [s,setS]=React.useState({ready:typeof window.useTeacherSession==='function',error:''});React.useEffect(()=>{if(s.ready)return;let live=true;window.anLazyCampus.loadMany(DEPS).then(()=>{if(live)setS(typeof window.useTeacherSession==='function'?{ready:true,error:''}:{ready:false,error:'No se publicó la fuente docente.'})}).catch(e=>live&&setS({ready:false,error:e.message||String(e)}));return()=>{live=false}},[]);if(s.error)return React.createElement('div',{className:'card',style:{padding:30,color:A.C.red}},s.error);if(!s.ready)return React.createElement('div',{className:'card',style:{padding:30,textAlign:'center'}},'Preparando seguimiento académico…');return React.createElement(A.TeacherAttendanceInnerCS21A77)}
function role(p){const r=A.txt(p&&(p.rol||p.role)).toLowerCase();if(r)return r;try{return A.txt(window.getSesion&&window.getSesion().rol).toLowerCase()}catch(_){return''}}
function install(){const B=window.CronogramaGrupo;if(typeof B!=='function')return false;if(B.__a77)return true;const W=p=>(role(p)==='teacher'||role(p)==='docente')?React.createElement(Screen,p):React.createElement(B,p);W.__a77=true;W.__base=B;window.CronogramaGrupo=W;try{CronogramaGrupo=W}catch(_){}return true}
window.addEventListener('an:lazy-module-loaded',()=>setTimeout(install,10));install();const t=setInterval(()=>{if(install())clearInterval(t)},250);setTimeout(()=>clearInterval(t),30000);window.__AN_TEACHER_ATTENDANCE_VERSION__='F98.4-Z6-CS21A77';
})();
