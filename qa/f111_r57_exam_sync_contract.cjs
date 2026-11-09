'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const norm=s=>s.replace(/\r\n/g,'\n');
const git=(...args)=>cp.execFileSync('git',['-C',root,...args],{encoding:'utf8'});
let passed=0;const check=(name,fn)=>{fn();console.log('PASS '+(++passed)+' '+name);};
const modes=norm(read('src/examenes_modes.jsx'));
const bundle=norm(read('src/examenes_bundle.jsx'));
const html=norm(read('modulos/examenes.html'));
const app=norm(read('src/app.jsx'));
check('exactly one pending status in source',()=>assert.equal((modes.match(/data-r57-sync-pending/g)||[]).length,1));
check('exactly one pending status in active bundle',()=>assert.equal((bundle.match(/data-r57-sync-pending/g)||[]).length,1));
check('source state resets on successful ordinary exam response',()=>assert(modes.includes('setReposicionSyncPending(r.reposicion_sync_pending === true)')));
check('failure decision occurs before successful pending transition',()=>{
 const fn=modes.slice(modes.indexOf('const doSubmit = useCallback'),modes.indexOf('useEffect(() => {',modes.indexOf('const doSubmit = useCallback')));
 assert(fn.indexOf('if (!r || r.ok === false)')>=0);
 assert(fn.indexOf('if (!r || r.ok === false)')<fn.indexOf('setReposicionSyncPending('));
});
check('student receives status only when submitted',()=>assert(modes.includes('reposicionSyncPending={reposicionSyncPending}')));
check('sent view keeps receipt confirmation',()=>assert(modes.includes('Tu examen fue recibido')));
check('pending sync never says the submission failed',()=>{
 const warning=modes.slice(modes.indexOf('data-r57-sync-pending'),modes.indexOf('data-r57-sync-pending')+640);
 assert(!/examen no (fue|se) envi/.test(warning.toLowerCase()));
 assert(warning.includes('Entrega confirmada.'));
});
check('students warned not to retake',()=>assert(modes.includes('No volvás a contestarlo.')));
check('status is conditional not shown unconditionally',()=>assert(modes.includes('{reposicionSyncPending && <div role="status"')));
check('normal receipt remains without warning',()=>assert(modes.includes('reposicionSyncPending = false')));
check('backend response uses explicit boolean only',()=>assert(modes.includes('r.reposicion_sync_pending === true')));
check('active iframe BUILD cache bust',()=>assert(html.includes("var BUILD='F111R57SYNC20261108A'")));
check('student iframe URL cache bust',()=>assert(app.includes('modulos/examenes.html?view=${view}&v=F111R57SYNC20261108A')));
check('teacher preview iframe cache bust',()=>assert(app.includes('&v=F111R57SYNC20261108A')));
check('iframe React key cache bust',()=>assert(app.includes('key={`${view}-F111R57SYNC20261108A`}')));
check('bundle has all 6 generated source sections',()=>{
 const names=['examenes_css.jsx','examenes_appcss.jsx','examenes_data.jsx','examenes_render.jsx','examenes_modes.jsx','examenes_app.jsx'];
 const k=bundle.indexOf('// ===== '+names[0]+' =====');
 const prefix=bundle.slice(0,k);
 const assembled=prefix+names.map(n=>'// ===== '+n+' =====\n\n'+norm(read('src/'+n))+'\n').join('');
 assert.equal(bundle,assembled);
});
check('bundled modules except examenes_modes equal main',()=>{
 const original=norm(git('show','origin/main:src/examenes_bundle.jsx'));
 const markerA='// ===== examenes_modes.jsx =====',markerB='// ===== examenes_app.jsx =====';
 assert.equal(bundle.slice(0,bundle.indexOf(markerA)),original.slice(0,original.indexOf(markerA)));
 assert.equal(bundle.slice(bundle.indexOf(markerB)),original.slice(original.indexOf(markerB)));
});
check('Babel parses complete actual exam bundle',()=>{
 const babel=require(path.join(root,'vendor','babel.js'));
 new vm.Script(babel.transform(bundle,{presets:['react'],filename:'src/examenes_bundle.jsx'}).code);
});
check('financial admin src unchanged relative to main',()=>{
 for(const f of ['src/admin_students.jsx','campus.html']){
  assert.equal(norm(read(f)),norm(git('show','origin/main:'+f)));
 }
});
console.log('F111_R57_EXAM_SYNC_CONTRACT_PASS checks='+passed+' live_writes=0');
