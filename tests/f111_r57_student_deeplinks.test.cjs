'use strict';
// E1 pure hash parser + source contract. No network, no institutional records.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../src/app.jsx'),'utf8');
const start=source.indexOf('const STUDENT_ROUTE_ALIASES_F984 = {');
const end=source.indexOf('function esUsuarioGratisSesionF984Z6CS(');
assert(start>=0&&end>start,'student navigation helpers found');
const ctx=vm.createContext({});
vm.runInContext(source.slice(start,end),ctx,{filename:'student_route_helpers_f984.js'});
const parse=hash=>ctx.studentInitialRouteFromHashF984(hash);
let n=0;function check(name,act){act();n++;console.log('PASS '+n+' '+name);}
check('valid direct results',()=>{
 const x=parse('#evaluaciones/resultados');assert.equal(x.route,'evaluaciones');assert.equal(x.tab,'resultados');});
check('valid direct make-up',()=>{
 const x=parse('#evaluaciones/reposiciones');assert.equal(x.route,'evaluaciones');assert.equal(x.tab,'reposiciones');});
check('old notas alias',()=>{
 const x=parse('#notas');assert.equal(x.route,'evaluaciones');assert.equal(x.tab,'resultados');});
check('old solicitudes alias',()=>{
 const x=parse('#solicitudes_estudiante');assert.equal(x.route,'evaluaciones');assert.equal(x.tab,'reposiciones');});
check('normal dashboard',()=>assert.equal(parse(''),null));
check('unknown routes are denied',()=>assert.equal(parse('#admin_estudiantes'),null));
check('unknown tab is denied',()=>assert.equal(parse('#evaluaciones/admin'),null));
check('extra path is denied',()=>assert.equal(parse('#evaluaciones/reposiciones/secret'),null));
check('document path is validated',()=>assert.equal(parse('#documentos_ayuda/avisos').tab,'avisos'));
check('academic module loads proper level',()=>assert.equal(parse('#mi_curso/cronograma').route,'mi_curso'));
check('arbitrary string or special chars rejected',()=>assert.equal(parse('#evaluaciones/%2Fadmin'),null));
check('source initializes active from validated hash, not stale localstorage',()=>assert(source.includes("return studentEntryRouteF984?.route || 'dashboard'")));
check('student eval tab initialized from permitted hash',()=>assert(source.includes("studentEntryRouteF984?.route === 'evaluaciones' ? studentEntryRouteF984.tab : 'proximas'")));
check('history replace preserves canonical direct hash',()=>assert(source.includes("studentRouteHashF984(initialRoute,tabsIniciales)")));
check('source removed unconditional dashboard history clobber',()=>assert(!source.includes("history.replaceState({ anCampus:true, route:'dashboard', tabs:tabsIniciales }, '', '#dashboard')")));
const babel=require(path.resolve(__dirname,'../vendor/babel.js'));
new vm.Script(babel.transform(source,{presets:['react'],filename:'app.jsx'}).code);
check('app JSX compiles without syntax regression',()=>assert(true));
console.log('F111_R57_STUDENT_DEEPLINKS_E1_PASS checks='+n+' browser_verified=false production_writes=0');
