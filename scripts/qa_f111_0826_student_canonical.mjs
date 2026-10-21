// F111 0826: QA aislada del Resumen y calendario posterior a traslado.
// Sin navegador, credenciales, datos de producción ni escrituras externas.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(p,'utf8');
const core=read('src/student_academic_summary_core_cs21a113.js');
const dom=read('src/student_academic_summary_dom_cs21a113.js');
const calendar=read('src/cronograma_grupo.jsx');
const menu=read('src/student_menu_academic_cs21a120.jsx');
const app=read('src/app.jsx');
const html=read('campus.html');
new vm.Script(core);
new vm.Script(dom);

const viejo='B1-LM18-C3-0726',actual='B1-KJ18-C3-0826';
const direct={ok:true,asistencia:[
  {cod_grupo:actual,nivel:'B1',leccion_num:1,estado:'PRESENTE',riel:'curso',fecha:'2026-10-08',timestamp:'2026-10-08T22:00:00'}
]};
const portal={ok:true,codigo:'17196',cod_grupo:actual,nivel_activo:'B1',
  estudiante:{GRUPO:actual,NOMBRE:'Estudiante Ficticio'},
  niveles:{B1:{grupo:actual,estatus:'CA'}},
  grupo:{CODIGO_GRUPO:actual,PROGRAMA:'INA',DOCENTE:'DOCENTE FUTURA'},
  asistencia:{ok:true,asistencia:[
    {cod_grupo:viejo,nivel:'B1',leccion_num:1,estado:'AUSENTE',riel:'curso',timestamp:'2026-10-01'}
  ]},evaluaciones:{evaluaciones:[]},retroalimentacion:{retroalimentacion:[]}};
const calls=[];
const replies={
  getPortalEstudianteCompleto:portal,
  getMisNotasF921:{ok:true,evaluaciones:[],nivel_activo:'B1'},
  getAsistenciaEstudiante:direct,
  getGrupoInfo:{ok:true,teacherName:'Diego Armando Martinez Rojas',nivelId:'B1'}
};
const w={};
const context={
  window:w,
  postStudentPortal:async(fn,body)=>{calls.push([fn,body]);return replies[fn];},
  document:{},console,Map,Date,Number,String
};
vm.createContext(context);
vm.runInContext(core,context);
const instrumented=dom.replace('  window.mountStudentAcademicSummaryCS21A113=mount;', '  window.__QA_F111={read,normalize};window.mountStudentAcademicSummaryCS21A113=mount;');
assert.notEqual(instrumented,dom,'Test debe encontrar la exposición local de lectura');
vm.runInContext(instrumented,context);

const x=await w.__QA_F111.read('17196');
assert.equal(x.liveGroup.teacherName,'Diego Armando Martinez Rojas');
const d=w.__QA_F111.normalize(x.portal,x.notes,'B1',{grupo:viejo,nombre:'Ficticio'},x.liveGroup);
assert.equal(d.group,actual,'El grupo lo resuelve la matrícula activa, no la sesión vieja');
assert.equal(d.teacher,'Diego Armando Martinez Rojas','Docente vigente, no de nivel futuro');
assert.equal(d.cp,1,'Asistencia oficial existente recuperada');
assert.equal(d.ca,0,'La asistencia del grupo histórico no contamina el grupo actual');
assert.equal(d.course.length,1,'Una sola lección oficial actual');
assert.equal(d.course[0].leccion_num,1);
assert.equal(calls.filter(x=>x[0]==='getAsistenciaEstudiante').length,1);
assert.equal(calls.filter(x=>x[0]==='getGrupoInfo').length,1);

// Si falla el endpoint directo, se mantienen los registros del portal.
delete replies.getAsistenciaEstudiante;
const y=await w.__QA_F111.read('17196');
assert.equal(y.portal.asistencia.asistencia.length,1);
assert.equal(w.__QA_F111.normalize(y.portal,y.notes,'B1',{grupo:viejo},y.liveGroup).cp,0);

// El calendario de estudiantes no puede derivar el grupo de una sesión obsoleta.
const studentRoute=calendar.slice(calendar.indexOf('    if (esStudent) {'),calendar.indexOf('    const cacheVigente',calendar.indexOf('    if (esStudent) {')));
assert(studentRoute.includes("postCronoGrupo('getEstudiante',{codigo:codigoAlumno})"));
assert(studentRoute.includes('const grupoCanon=String(niveles[nivelCA]?.grupo'));
assert(studentRoute.includes("postCronoGrupo('getGrupoInfo',{cod_grupo:grupoCanon})"));
assert(!studentRoute.includes('rawGroups.push(usr.grupo)'));
assert(calendar.includes('if(vigente && codGrupo!==vigente)setCodGrupo(vigente)'),'Selector debe invalidar React tras traslado');
assert(menu.includes('F1110826ATT20261020'),'El resumen debe invalidar caché');
assert.equal(app.split("'src/cronograma_grupo.jsx?v=F111ATTEND20261021'").length-1,3,'Tres rutas académicas usan el cronograma vigente con edición de asistencia');
assert(html.includes('src/app.jsx?v=F111ATTEND20261021'),'El Campus actualiza entrypoint de asistencia');
assert(html.includes('src/sidebar.jsx?v=F111ATTEND20261021'),'El Campus invalida caché de menú');
console.log('F111_0826_FRONTEND_E1_PASS: expediente vigente, docente B1, L1 presente, histórico separado, fallbacks read-only y cache-bust');
