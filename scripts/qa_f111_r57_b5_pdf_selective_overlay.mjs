/**
 * F111 R57 B5+B6-D: add ONLY B5 student/teacher/superadmin request surfaces
 * to the 4-file PDF overlay. Operates on a detached, offline main worktree.
 * The feature source is pinned; no change to existing finance or roster modules.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const [candidateDir, featureDir]=process.argv.slice(2);
assert(candidateDir&&featureDir,'Usage: node qa_f111_r57_b5_pdf_selective_overlay.mjs <candidate> <feature>');
const rel='src/solicitudes_unificadas.jsx', appRel='src/app.jsx';
const read=(root,r)=>fs.readFileSync(path.join(root,r),'utf8').replace(/\r\n/g,'\n');
const put=(r,s)=>fs.writeFileSync(path.join(candidateDir,r),s,'utf8');
const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
const currentFeature=git(featureDir,'rev-parse','HEAD');
assert.equal(currentFeature,'99664f85800b54ad9c2918f960618c4c89278edd','Unexpected feature provenance');
assert.equal(git(candidateDir,'rev-parse','HEAD'),'949eeab724bf84a4d9db2363278d19e5d01f43f0','Main hotfix baseline changed');
const changedBefore=git(candidateDir,'diff','--name-only').split(/\r?\n/).filter(Boolean).sort();
assert.deepEqual(changedBefore,
 ['modulos/examenes.html','src/app.jsx','src/examenes_bundle.jsx','src/examenes_modes.jsx'].sort(),
 'Expected only the already-vetted PDF overlay');
const feature=read(featureDir,rel),base=read(candidateDir,rel);
const mark='// F111 R57 B5 — superficies nuevas';
const first=feature.indexOf(mark), b5End=feature.indexOf('function ReposicionStudentCardF92(',first);
assert(first>0&&b5End>first&&feature.slice(first,b5End).length>13000,'Bounded B5 surface missing');
const b5=feature.slice(first,b5End);
let candidate=base;
function onlyOne(s,from,to,label){
 const n=s.split(from).length-1;assert.equal(n,1,'Expected one '+label+' (got '+n+')');
 return s.replace(from,to);
}
candidate=onlyOne(candidate,'\n\nfunction ReposicionStudentCardF92(','\n\n\n'+b5+'function ReposicionStudentCardF92(','B5 insert');
function section(s,name){
 const start=s.indexOf('function '+name+'(');
 assert(start>=0,'Missing '+name);
 const next=s.indexOf('\nfunction ',start+1);
 assert(next>start,'Missing next function boundary '+name);
 return s.slice(start,next);
}
for(const name of ['ReposicionStudentCardF92','SolicitudesEstudianteView','ReposicionesAdminSolicitudesF92']){
 const original=section(candidate,name),approved=section(feature,name);
 candidate=onlyOne(candidate,original,approved,'scope '+name);
}
// Entire main plus approved B5 insertion and exactly three bounded F92 functions
// MUST now match the pinned feature file (before the new lazy teacher export).
if(candidate!==feature){let i=0;while(candidate[i]===feature[i]&&i<Math.min(candidate.length,feature.length))i++;throw new Error('Selective B5 drift offset='+i+' candidate='+JSON.stringify(candidate.slice(i-80,i+65))+' feature='+JSON.stringify(feature.slice(i-80,i+65))+' lengths='+candidate.length+'/'+feature.length);}
const exportLine='Object.assign(window,{ReposicionStudentCardF92,SolicitudesEstudianteView,ReposicionesAdminSolicitudesF92,FreeUserSolicitudesAdminF984,SolicitudesUnificadasView});';
candidate=onlyOne(candidate,exportLine,exportLine+
  '\n// R57 teacher route is lazy-loaded; publish the component explicitly for LazyModuleView.\n'+
  'Object.assign(window,{ReposicionesR57Estudiante,ReposicionesR57Admin,ReposicionesR57Docente});',
  'global component export');
// B5 recovery: no raw Apps Script error is ever shown to the superadmin.
candidate=onlyOne(candidate,
  "}catch(e){setError('No se pudo verificar el estado del escrito: '+String(e?.message||'sin_detalle').slice(0,110));}",
  "}catch(e){setError(r57UserSafeError(e,'No se pudo verificar el estado del escrito. Revisá el expediente desde administración.','R57:recovery:diagnose'));}",
  'safe QA diagnosis error');
candidate=onlyOne(candidate,
  "setError('Recuperación no confirmada. Volvé a diagnosticar antes de repetir: '+\n        String(e?.message||'sin_detalle').slice(0,100));",
  "setError(r57UserSafeError(e,'Recuperación no confirmada. Volvé a diagnosticar antes de repetir.','R57:recovery:execute'));",
  'safe QA recovery error');
put(rel,candidate);
let app=read(candidateDir,appRel);
const version='F111R57B5PDF20261109C';
const originalRef='src/solicitudes_unificadas.jsx?v=F98.4A';
assert.equal(app.split(originalRef).length-1,3,'Expected 3 institutional B5 loaders');
app=app.replaceAll(originalRef,'src/solicitudes_unificadas.jsx?v='+version);
const oldDeep='src/solicitudes_unificadas.jsx?v='+version+'&deep=F111STUDENTDEEPTABS20261104A';
assert.equal(app.split(oldDeep).length-1,1,'Preserve the scoped bilingual student deep-link cache marker');
app=onlyOne(app,
  "const visible=rows.filter(r=>role==='admin'||!['APLICADA','CANCELADA'].includes(String(r.ESTADO||'').toUpperCase()));",
  "const visible=rows.filter(r=>String(r.SOURCE||'')!=='F111_R57_B5'&&(role==='admin'||!['APLICADA','CANCELADA'].includes(String(r.ESTADO||'').toUpperCase())));",
  'old F91 panel R57 exclusion');
app=onlyOne(app,
  '{activeExamCard}<ReposicionesPanelF91 role="teacher" onNavigate={onNavigate}/>',
  '{activeExamCard}<LazyRoute title="Reposiciones R57 del docente" component="ReposicionesR57Docente" files={'+
  "['src/solicitudes_unificadas.jsx?v="+version+"']"+
  '} onNavigate={onNavigate}/><ReposicionesPanelF91 role="teacher" onNavigate={onNavigate}/>',
  'teacher exam B5 lazy mount');
put(appRel,app);
const changedAfter=git(candidateDir,'diff','--name-only').split(/\r?\n/).filter(Boolean).sort();
assert.deepEqual(changedAfter,
 ['modulos/examenes.html','src/app.jsx','src/examenes_bundle.jsx','src/examenes_modes.jsx',rel].sort(),
 'Unexpected scope: must touch only five existing files');
const studentRoutes=app.match(/src\/solicitudes_unificadas\.jsx\?v=F111R57B5PDF20261109C/g)||[];
assert.equal(studentRoutes.length,4,'Three existing loaders and one explicit teacher lazy route');
assert(candidate.includes("f92Post('reposListarOpcionesR57'"),'Real B5 eligible list absent');
assert(candidate.includes("f92Post('reposResolverSolicitudR57'"),'Real superadmin decision absent');
assert(candidate.includes("f92Post('reposInvitarSolicitudR57'"),'Real teacher invitation absent');
assert(candidate.includes("f92Post('reposCrearSolicitudR57'"),'Real student request absent');
assert(app.includes("component=\"ReposicionesR57Docente\"")&&candidate.includes("window,{ReposicionesR57Estudiante,ReposicionesR57Admin,ReposicionesR57Docente}"),'Teacher lazy component cannot resolve');
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
console.log(JSON.stringify({scope:'F111_R57_B5_PLUS_B6D_FRONTEND_SELECTIVE',baseline:git(candidateDir,'rev-parse','HEAD'),featureSource:currentFeature,changed:changedAfter,source_sha256:digest(candidate),app_sha256:digest(app),excluded:['social_skill','vista_docente','student_modules','student_deep_links','finances','admin_students'],productionWrites:0,merged:false,published:false},null,2));
