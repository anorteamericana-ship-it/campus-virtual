// CS21A77 · Asistencia docente · puente estable
(function(){
'use strict';
const A=window.ANAtt77;
const DEPS=[
 'src/vista_docente.jsx?v=F98.4Z6CS19F',
 'src/teacher_views.jsx?v=F98.4Z6CS19F',
 'src/cronograma_todos.jsx?v=F98.4Z6CM',
 'src/cronograma_grupo.jsx?v=F98.4Z6CM'
];
let booting=null;
function ensure(){
 if(typeof window.useTeacherSession==='function'&&typeof window.CronogramaGrupo==='function')return Promise.resolve(true);
 const loader=window.anLazyCampus;
 if(!loader||typeof loader.loadMany!=='function')return Promise.reject(new Error('El cargador del Campus todavía no está disponible.'));
 if(!booting)booting=loader.loadMany(DEPS).then(()=>true).catch(e=>{booting=null;throw e});
 return booting;
}
function Screen(){
 const [s,setS]=React.useState({ready:typeof window.useTeacherSession==='function',error:''});
 React.useEffect(()=>{if(s.ready)return;let live=true;ensure().then(()=>{if(live)setS(typeof window.useTeacherSession==='function'?{ready:true,error:''}:{ready:false,error:'No se publicó la fuente docente.'})}).catch(e=>live&&setS({ready:false,error:e.message||String(e)}));return()=>{live=false}},[]);
 if(s.error)return React.createElement('div',{className:'card',style:{padding:30,color:A.C.red}},s.error);
 if(!s.ready)return React.createElement('div',{className:'card',style:{padding:30,textAlign:'center'}},'Preparando seguimiento académico…');
 return React.createElement(A.TeacherAttendanceInnerCS21A77);
}
function role(p){const r=A.txt(p&&(p.rol||p.role)).toLowerCase();if(r)return r;try{return A.txt(window.getSesion&&window.getSesion().rol).toLowerCase()}catch(_){return''}}
function install(){
 const B=window.CronogramaGrupo;
 if(typeof B!=='function')return false;
 if(B.__a77)return true;
 const W=p=>(role(p)==='teacher'||role(p)==='docente')?React.createElement(Screen,p):React.createElement(B,p);
 W.__a77=true;W.__base=B;window.CronogramaGrupo=W;try{CronogramaGrupo=W}catch(_){}
 return true;
}
function boot(){
 if(!window.anLazyCampus)return false;
 ensure().then(()=>install()).catch(()=>{});
 return true;
}
window.TeacherAttendanceAnalyticsCS21A77=Screen;
window.addEventListener('an:lazy-module-loaded',()=>setTimeout(install,0));
const ready=setInterval(()=>{if(boot())clearInterval(ready)},20);
setTimeout(()=>clearInterval(ready),10000);
const probe=setInterval(()=>{if(install())clearInterval(probe)},100);
setTimeout(()=>clearInterval(probe),30000);
window.__AN_TEACHER_ATTENDANCE_VERSION__='F98.4-Z6-CS21A77';
})();
