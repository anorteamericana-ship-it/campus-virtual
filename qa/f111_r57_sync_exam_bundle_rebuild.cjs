'use strict';
/** Rebuild the effective Exam module bundle from its 6 official sources.
 * Preflight: the previous bundle must match main exactly; never squash unrelated changes.
 * Safe only in the R57 isolated DRAFT worktree, no LIVE action.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const git=(...a)=>cp.execFileSync('git',['-C',root,...a],{encoding:'utf8'}).trimEnd();
assert.equal(git('rev-parse','origin/main'),'949eeab724bf84a4d9db2363278d19e5d01f43f0');
assert.equal(git('status','--porcelain','--','src/examenes_bundle.jsx'),'');
const names=['examenes_css.jsx','examenes_appcss.jsx','examenes_data.jsx','examenes_render.jsx','examenes_modes.jsx','examenes_app.jsx'];
const bundlePath=path.join(root,'src/examenes_bundle.jsx');
const prior=fs.readFileSync(bundlePath,'utf8');
const norm=s=>s.replace(/\r\n/g,'\n');
const priorNorm=norm(prior);
const marker='// ===== '+names[0]+' =====';
const k=priorNorm.indexOf(marker);
assert(k>30,'Original bundle header absent');
const prefix=priorNorm.slice(0,k);
assert(prefix.includes('Generado desde:'),'Provenance missing');
const oldMode=norm(git('show','origin/main:src/examenes_modes.jsx'))+'\n';
const original=prefix+names.map(n=>'// ===== '+n+' =====\n\n'+
  (n==='examenes_modes.jsx'?oldMode:norm(fs.readFileSync(path.join(root,'src',n),'utf8')))+'\n').join('');
assert.equal(priorNorm,original,'Effective exam bundle drift BEFORE targeted rebuild');
const next=prefix+names.map(n=>'// ===== '+n+' =====\n\n'+
  norm(fs.readFileSync(path.join(root,'src',n),'utf8'))+'\n').join('');
assert.notEqual(next,priorNorm);
assert(next.includes('data-r57-sync-pending'),'Expected R57 warning missing from generated bundle');
fs.writeFileSync(bundlePath,prior.includes('\r\n')?next.replace(/\n/g,'\r\n'):next,'utf8');
console.log('R57_EFFECTIVE_EXAM_BUNDLE_REBUILT_6_OF_6 source_bytes='+next.length);
