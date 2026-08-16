import fs from 'node:fs';
import vm from 'node:vm';

const backendArg = process.argv.slice(2).find(x => x.startsWith('--backend='));
if (!backendArg) {
  console.error('Usage: node scripts/qa_sec004_demo_readonly_backend_candidate.mjs --backend=/path/to/Code.gs');
  process.exit(2);
}
const backendPath = backendArg.slice('--backend='.length);
if (!fs.existsSync(backendPath)) {
  console.error(`Backend not found: ${backendPath}`);
  process.exit(2);
}
const source = fs.readFileSync(backendPath, 'utf8');
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};

check('no literal demo password assignment', !/DEMO_[A-Z0-9_]*PASSWORD\s*=\s*['"]/i.test(source));
check('no common demo password comment', !/Contrase(?:ñ|Ã±)a\s+com[uú]n\s*:/i.test(source));
check('student secret uses Script Properties', /DEMO_KEYLOR_STUDENT_PASSWORD\s*=\s*_sec004DemoSecret_\('SEC004_DEMO_STUDENT_SECRET'\)/.test(source));
check('teacher secret uses Script Properties', /DEMO_OLDE_TEACHER_PASSWORD\s*=\s*_sec004DemoSecret_\('SEC004_DEMO_TEACHER_SECRET'\)/.test(source));
check('minimum configured demo secret length is enforced', /_sec004DemoCredentialConfigured_\(value\)[\s\S]*length\s*>=\s*20/.test(source));

const marker = '// SEC-004 · DEMO READ-ONLY GLOBAL FAIL-CLOSED GUARD · 2026-08-16';
const markerIndex = source.indexOf(marker);
check('global guard appended', markerIndex > 0);
const tail = markerIndex >= 0 ? source.slice(markerIndex) : '';
check('SEC004 owns final doPost wrapper', tail.split('doPost = function(e)').length - 1 === 1 && source.lastIndexOf('doPost = function(e)') >= markerIndex);
check('unknown demo routes fail closed', /if \(_sec004DemoSafeRead_\(key\)\) return _sec004DoPostBase_\(e\);[\s\S]*_sec004DemoDenied_/.test(tail));
check('audit target recalcularNotaFinalOficial not allowlisted', !/['"]recalcularnotafinaloficial['"]\s*:\s*true/.test(tail));
check('certificate status stays blocked until SEC002', !/['"]getmiscertificadosestado['"]\s*:\s*true/.test(tail));
check('teacher profile read with folder side effects blocked', !/['"]getperfildocentecs21a76['"]\s*:\s*true/.test(tail));
check('exam review read with sheet setup blocked', !/['"]examreviewinbox['"]\s*:\s*true/.test(tail));
check('student session-class read with sheet setup blocked', !/['"]getsesionclaseestudiante['"]\s*:\s*true/.test(tail));
check('financial and CONAPE reads blocked', !/['"](?:getcomprobantes|getestadoconape)['"]\s*:\s*true/.test(tail));
check('Academia Play reads that ensure sheets blocked', !/['"]academiaplay(?:getprogress|bankgetgame|completionsummary)['"]\s*:\s*true/.test(tail));
check('library/audio without synthetic adapter blocked', !/['"](?:getbibliotecanivelestudiante|getaudiopistaestudiante)['"]\s*:\s*true/.test(tail));
check('oral reads with setup fallthrough blocked', !/['"]oralget(?:paneldocente|resumengrupo|evaluacion)['"]\s*:\s*true/.test(tail));
check('safe-read list stays deliberately narrow', (tail.match(/': true,/g) || []).length === 23);
check('Memory Match engine symbols absent from SEC004 tail', !/englishLabMemoryMatch|MEMORY_MATCH/i.test(tail));

const portalStart = source.indexOf('function _sec004DemoStudentPortal_(code)');
const portalEnd = source.indexOf('// Escrituras personales sensibles quedan bloqueadas', portalStart);
const portalCode = portalStart >= 0 && portalEnd > portalStart ? source.slice(portalStart, portalEnd) : '';
check('synthetic demo portal helper exists', portalCode.includes('function _sec004DemoStudentPortal_'));
check('demo portal short-circuits before real base', portalCode.indexOf('if (demo) return demo;') >= 0 && portalCode.indexOf('if (demo) return demo;') < portalCode.indexOf('return _cs21a72PortalBase_(params);'));
check('demo portal never calls exam live panel', !/examGetStudentLivePanel/.test(portalCode));
check('demo portal never initializes exam sheets', !/_examSetupSheetsInternal_/.test(portalCode));

let portalBaseCalls = 0;
let realExamSetupCalls = 0;
const portalCtx = {
  Date, Number, String, Array, Object, JSON,
  CS21A72_KEYLOR_STUDENT_DEMO_VERSION:'SEC004-QA-DEMO',
  DEMO_KEYLOR_DOCENTE:'Demo Teacher',
  getPortalEstudianteCompleto: params => { portalBaseCalls++; realExamSetupCalls++; return {ok:true,real:true,params}; },
  _demoKeylorStudentFichaCS21A72_: code => code === 'DEMO-STUDENT-01' ? {ok:true,estudiante:{CEDULA:'DEMO-CED',GRUPO:'0626'},niveles:{B1:{estatus:'CA'}},grupo:{CODIGO_GRUPO:'0626'},pendientes:{},pagos:[],otrosPagos:[]} : null,
  _demoKeylorStudentGroup_: code => code === 'DEMO-STUDENT-01' ? '0626' : '',
  _demoKeylorDefaultNivel_: group => group === '0626' ? 'B1' : '',
  _demoKeylorEvaluacionesEstudiante_: () => ({ok:true,nota_final:88,evaluaciones:[{tipo:'ORAL_1',nota:90}]}),
  _demoKeylorFechasGrupo_: () => ({ok:true,lecciones:[{leccion:1,estado:'CERRADA'}]}),
  _demoKeylorGrupoInfo_: () => ({ok:true,cod_grupo:'0626'}),
  _demoKeylorAsistenciaEstudiante_: () => ({ok:true,asistencia:[{leccion_num:1,presente:true}]}),
  _demoKeylorRetroEstudiante_: () => ({ok:true,retroalimentacion:[{leccion_num:1,comentario:'Demo'}]}),
  getICANEstudiante: () => ({ok:true,demo:true,asistidas:3})
};
vm.createContext(portalCtx);
vm.runInContext(portalCode, portalCtx, {filename:'sec004-demo-portal.js'});
let portal = portalCtx.getPortalEstudianteCompleto({codigo:'DEMO-STUDENT-01'});
check('demo portal performs zero real portal/exam setup calls', portal?.demo === true && portalBaseCalls === 0 && realExamSetupCalls === 0);
check('demo portal disables exams', portal?.examenes?.enabled === false && portal?.examenes?.read_only === true);
portal = portalCtx.getPortalEstudianteCompleto({codigo:'REAL-1'});
check('real portal still delegates', portal?.real === true && portalBaseCalls === 1 && realExamSetupCalls === 1);

let baseCalls = 0;
let simulatedCalls = 0;
const demoStudentCode = 'DEMO-STUDENT-01';
const ctx = {
  JSON,
  PropertiesService:{getScriptProperties:()=>({getProperty:()=>''})},
  _an4406_parseBody_:e=>JSON.parse(e?.postData?.contents || '{}'),
  _an4406_json_:obj=>obj,
  _demoKeylorSesion_:s=>s?.rol === 'teacher' && s?.codigo === 'DEMO-TEACHER',
  _demoKeylorIsGroup_:g=>['0626','0726'].includes(String(g || '')),
  _demoKeylorStudentGroup_:code=>String(code || '') === demoStudentCode ? '0626' : '',
  _demoKeylorStudentByCodeCS21A72_:code=>String(code || '') === demoStudentCode ? {code,cedula:'DEMO-0626-01'} : null,
  _demoKeylorStudents_:g=>String(g) === '0626' ? [{code:demoStudentCode,cedula:'DEMO-0626-01'}] : [],
  _demoKeylorInput_:v=>['DEMO-TEACHER','DEMO TEACHER','KEYLOR'].includes(String(v || '').toUpperCase()),
  _demoKeylorInterceptPost_:(fn,body,auth)=>{ simulatedCalls++; return String(fn).toLowerCase() === 'registrarasistencia' && body.cod_grupo === '0626' ? {ok:true,demo:true,read_only:true,simulated:true} : null; },
  validarSesion:token=>{
    if (token === 'demo-teacher-token') return {ok:true,rol:'teacher',codigo:'DEMO-TEACHER',nombre:'Demo Teacher'};
    if (token === 'demo-student-token') return {ok:true,rol:'student',codigo:demoStudentCode,cedula:'DEMO-0626-01',grupo:'0626',nombre:'Demo Student'};
    if (token === 'real-teacher-token') return {ok:true,rol:'teacher',codigo:'REAL-TEACHER',nombre:'Real Teacher'};
    return {ok:false,error:'sesion_invalida'};
  },
  iniciarSesion:body=>body?.usuario === 'demo-teacher' ? {ok:true,rol:'teacher',codigo:'DEMO-TEACHER',nombre:'Demo Teacher'} : body?.usuario === 'demo-student' ? {ok:true,rol:'student',codigo:demoStudentCode,cedula:'DEMO-0626-01',nombre:'Demo Student'} : {ok:true,rol:'teacher',codigo:'REAL-TEACHER'},
  doPost:e=>{ baseCalls++; return {delegated:true,body:JSON.parse(e?.postData?.contents || '{}')}; }
};
vm.createContext(ctx);
vm.runInContext(tail, ctx, {filename:'sec004-tail.js'});
const req = (fn,token,extra={}) => ({postData:{contents:JSON.stringify({fn,token,...extra})},parameter:{}});

check('validated demo teacher is re-annotated read-only', ctx.validarSesion('demo-teacher-token').read_only === true);
check('validated demo student is re-annotated read-only', ctx.validarSesion('demo-student-token').read_only === true);
check('real session is not marked demo', !ctx.validarSesion('real-teacher-token').demo);
check('demo login response exposes read-only', ctx.iniciarSesion({usuario:'demo-teacher'}).read_only === true && ctx.iniciarSesion({usuario:'demo-student'}).read_only === true);

baseCalls=0; check('teacher core safe read delegates', ctx.doPost(req('getDocenteGruposActuales','demo-teacher-token')).delegated === true && baseCalls === 1);
baseCalls=0; check('teacher real-group scope is blocked', ctx.doPost(req('getDocenteGrupoPanelF80','demo-teacher-token',{cod_grupo:'REAL',nivel:'B1'})).error === 'demo_read_only' && baseCalls === 0);
baseCalls=0; check('teacher real-student scope is blocked', ctx.doPost(req('getEvaluacionesEstudiante','demo-teacher-token',{codigo:'REAL-STUDENT'})).error === 'demo_read_only' && baseCalls === 0);
baseCalls=0; check('teacher real-identity scope is blocked', ctx.doPost(req('getCalendarioDocente','demo-teacher-token',{cod_docente:'REAL TEACHER'})).error === 'demo_read_only' && baseCalls === 0);
baseCalls=0; check('missing required teacher scope is blocked', ctx.doPost(req('getDocenteGrupoPanelF80','demo-teacher-token',{nivel:'I1'})).error === 'demo_read_only' && baseCalls === 0);
baseCalls=0; check('teacher synthetic group read delegates', ctx.doPost(req('getDocenteGrupoPanelF80','demo-teacher-token',{cod_grupo:'0626',nivel:'I1'})).delegated === true && baseCalls === 1);
baseCalls=0; simulatedCalls=0; check('proven synthetic teacher write is intercepted', ctx.doPost(req('registrarAsistencia','demo-teacher-token',{cod_grupo:'0626'})).simulated === true && baseCalls === 0 && simulatedCalls === 1);
baseCalls=0; check('audit target mutation is blocked', ctx.doPost(req('recalcularNotaFinalOficial','demo-teacher-token',{cod_grupo:'0626'})).error === 'demo_read_only' && baseCalls === 0);
baseCalls=0; check('unknown future mutation is blocked', ctx.doPost(req('futureBrandNewMutation','demo-teacher-token')).error === 'demo_read_only' && baseCalls === 0);
baseCalls=0; check('late teacher document mutation is blocked', ctx.doPost(req('uploadDocumentoDocenteCS21A76','demo-teacher-token')).error === 'demo_read_only' && baseCalls === 0);
baseCalls=0; check('oral read stays blocked', ctx.doPost(req('oralGetPanelDocente','demo-teacher-token',{cod_grupo:'0626'})).error === 'demo_read_only' && baseCalls === 0);

baseCalls=0; check('student synthetic portal read delegates', ctx.doPost(req('getPortalEstudianteCompleto','demo-student-token',{codigo:demoStudentCode})).delegated === true && baseCalls === 1);
baseCalls=0; check('student other-code scope is blocked', ctx.doPost(req('getEstudiante','demo-student-token',{codigo:'REAL-STUDENT'})).error === 'demo_read_only' && baseCalls === 0);
baseCalls=0; check('student real-group scope is blocked', ctx.doPost(req('getFechasGrupo','demo-student-token',{cod_grupo:'REAL',nivel:'B1'})).error === 'demo_read_only' && baseCalls === 0);
baseCalls=0; check('student missing required code is blocked', ctx.doPost(req('getPortalEstudianteCompleto','demo-student-token')).error === 'demo_read_only' && baseCalls === 0);
baseCalls=0; check('read-with-sheet-setup route is blocked', ctx.doPost(req('academiaPlayGetProgress','demo-student-token')).error === 'demo_read_only' && baseCalls === 0);
baseCalls=0; check('financial mutation is blocked', ctx.doPost(req('reportarPago','demo-student-token')).error === 'demo_read_only' && baseCalls === 0);
baseCalls=0; check('unsafe certificate status is blocked until SEC002', ctx.doPost(req('getMisCertificadosEstado','demo-student-token')).error === 'demo_read_only' && baseCalls === 0);

baseCalls=0; check('real session mutation remains delegated', ctx.doPost(req('recalcularNotaFinalOficial','real-teacher-token')).delegated === true && baseCalls === 1);
baseCalls=0; check('public no-token route remains delegated', ctx.doPost(req('crearInscripcionPublica','')).delegated === true && baseCalls === 1);
baseCalls=0; check('demo logout remains allowed', ctx.doPost(req('cerrarSesion','demo-student-token')).delegated === true && baseCalls === 1);

if (failures.length) {
  console.error(`SEC004 DEMO READONLY QA: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC004 DEMO READONLY QA: PASS');
