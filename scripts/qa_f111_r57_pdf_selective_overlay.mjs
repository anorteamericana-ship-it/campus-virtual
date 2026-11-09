// F111 R57 B6-D — build only the written PDF frontend overlay from LIVE main.
// Does not copy the rest of the 32-file draft PR; does not merge, publish or write to main.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const [baseDir,featureDir]=process.argv.slice(2);
if(!baseDir||!featureDir)throw new Error('Usage: node scripts/qa_f111_r57_pdf_selective_overlay.mjs <clean-main-worktree> <feature-worktree>');
const p=(root,relative)=>path.join(root,relative);
const read=(root,relative)=>fs.readFileSync(p(root,relative),'utf8').replace(/\r\n/g,'\n');
const hash=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
const modePath='src/examenes_modes.jsx';
const reviewedMode=read(featureDir,modePath);
assert.equal(hash(reviewedMode),'0321e49e09f221e7a27d3020717d65a0f95cf7dd7a623a4e917d229e7a5b3c7b',
 'Reviewed R57 modes have changed; refuse unknown frontend delta');
const getStatus=()=>execFileSync('git',['status','--porcelain'],{cwd:baseDir,encoding:'utf8'});
assert.equal(getStatus(),'','Base worktree must be clean before selective overlay');
const appPath='src/app.jsx',htmlPath='modulos/examenes.html';
const old='F98.4M',stamp='F111R57WRITTENPDF20261109B';
const app=read(baseDir,appPath),html=read(baseDir,htmlPath);
assert.equal(app.split(old).length-1,3,'Expected exactly 3 exam iframe cache references in main');
assert.equal(html.split(old).length-1,4,'Expected exactly 4 exam HTML cache references in main');
fs.writeFileSync(p(baseDir,appPath),app.replaceAll(old,stamp));
fs.writeFileSync(p(baseDir,htmlPath),html.replaceAll(old,stamp));
fs.writeFileSync(p(baseDir,modePath),reviewedMode);
const sources=['examenes_css.jsx','examenes_appcss.jsx','examenes_data.jsx',
 'examenes_render.jsx','examenes_modes.jsx','examenes_app.jsx'];
const bundlePath='src/examenes_bundle.jsx';
const originalBundle=read(baseDir,bundlePath);
const marker='// ===== '+sources[0]+' =====';
const first=originalBundle.indexOf(marker);
assert(first>0&&originalBundle.slice(0,first).includes('Generado desde:'),
 'Invalid base bundle structure');
const prefix=originalBundle.slice(0,first);
const bundle=prefix+sources.map(name=>'// ===== '+name+' =====\n\n'+read(baseDir,'src/'+name)+'\n').join('');
fs.writeFileSync(p(baseDir,bundlePath),bundle);
const fileList=execFileSync('git',['diff','--name-only'],{cwd:baseDir,encoding:'utf8'}).trim().split(/\r?\n/).sort();
const expected=[appPath,htmlPath,bundlePath,modePath].sort();
assert.deepEqual(fileList,expected,'Selective candidate must touch EXACTLY four files');
const candidate=read(baseDir,bundlePath);
assert(candidate.includes('reposGenerarPdfEscritoR57')&&candidate.includes('reposConsultarPdfEscritoR57'),
 'Written PDF endpoints missing in effective bundle');
assert(candidate.includes('reposicionSyncPending'),'F90 submission uncertainty warning missing');
assert(!read(baseDir,appPath).includes('src/social_skill_docente_f111.jsx'),
 'Social Skill script leaked into PDF-only release');
const summary={scope:'F111_R57_B6D_WRITTEN_PDF_UI_ONLY',
 base:execFileSync('git',['rev-parse','HEAD'],{cwd:baseDir,encoding:'utf8'}).trim(),
 feature:execFileSync('git',['rev-parse','HEAD'],{cwd:featureDir,encoding:'utf8'}).trim(),
 changed_files:fileList,
 excluded_live_impacts:['social_skill','vista_docente','student_modules','solicitudes_unificadas','payment/CONAPE/admin_students'],
 bundle_sha256:hash(bundle),mode_sha256:hash(reviewedMode),production_writes:0,
 merged:false,published:false,decision:'CANDIDATE_ONLY'};
console.log(JSON.stringify(summary,null,2));
