#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const shell=read('src/english_lab_live_v2.jsx');
const legacyShell=read('src/english_lab_live.jsx');
const lazy=read('src/lazy_loader.jsx');
const app=read('src/app.jsx');

// The outer Campus route remains stable, while the canonical lazy loader owns the
// explicit transition from the historical filename to the v2 source file.
assert.match(app,/english_lab_live:\s*\['src\/english_lab_live\.jsx\?v=F98\.4Z6CS20H'\]/,
  'Campus route must retain its stable English LAB entry');
assert.match(app,/component="EnglishLabLiveTeacherView"/,'teacher route must retain its public component contract');
assert.match(app,/component="EnglishLabLiveStudentView"/,'student route must retain its public component contract');
assert.match(lazy,/\^src\\\/english_lab_live\\\.jsx/,'lazy loader must recognize only the historical English LAB entry');
assert.match(lazy,/return 'src\/english_lab_live_v2\.jsx\?v=ELV2E10QA-20260827'/,
  'lazy loader must resolve the stable route to the current v2 source');
assert.match(lazy,/fetch\(src, \{ cache: 'no-cache' \}\)/,'canonical source must be fetched directly without a generated artifact');
assert.match(lazy,/window\.Babel\.transform\(code, \{ presets: \['react'\], plugins: \['transform-block-scoping'\] \}\)/,
  'canonical source must compile with the Campus Babel configuration');

assert.match(shell,/const API_VERSION = 'english_lab_live\.v2'/,'canonical shell must own the exact v2 transport');
assert.match(shell,/const SHELL_VERSION = 'ELV2-E10-QA-20260827'/,'canonical shell version is stale');
assert.equal((shell.match(/window\.EnglishLabLiveTeacherView=TeacherView/g)||[]).length,1,
  'canonical shell must publish the teacher component exactly once');
assert.equal((shell.match(/window\.EnglishLabLiveStudentView=StudentView/g)||[]).length,1,
  'canonical shell must publish the student component exactly once');
assert.match(shell,/grid\.length===14&&grid\.every\(row=>Array\.isArray\(row\)&&row\.length===14\)/,
  'canonical Word Search shell must validate the real 14 by 14 grid');
assert.match(shell,/onRetry:\(\)=>run\(action,stableSpec\)/,
  'canonical timeout retry must preserve the original request specification');

// The historical shell remains rollback evidence only. Loading both files in the
// same route would reassign the same globals and create an ambiguous runtime owner.
assert.match(legacyShell,/window\.EnglishLabLiveTeacherView/,'historical rollback shell unexpectedly missing');
assert.doesNotMatch(app,/english_lab_live_v2\.jsx/,'app route must not load the v2 shell in parallel with the lazy normalization');

const browserFiles=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const absolute=path.join(dir,entry.name);
    if(entry.isDirectory())walk(absolute);
    else if(/\.mjs$/i.test(entry.name)&&/browser/i.test(entry.name))browserFiles.push(absolute);
  }
}
walk(path.join(root,'scripts'));

const runtimePatchCandidates=[];
const fabricatedHtmlCandidates=[];
for(const file of browserFiles){
  const source=fs.readFileSync(file,'utf8');
  if(/route\.fulfill[\s\S]{0,1200}(?:original\.)?replace\(/.test(source)||/body\s*:\s*[^,\n]*\.replace\(/.test(source)){
    runtimePatchCandidates.push(path.relative(root,file).split(path.sep).join('/'));
  }
  if(/route\.fulfill[\s\S]{0,800}(?:contentType\s*:\s*['"]text\/html|body\s*:\s*(?:harness|html|documentHtml)\b)/i.test(source)){
    fabricatedHtmlCandidates.push(path.relative(root,file).split(path.sep).join('/'));
  }
}
assert.deepEqual(runtimePatchCandidates,[],
  'Ningún browser test debe reemplazar código servido para fabricar el comportamiento bajo prueba');
assert.deepEqual(fabricatedHtmlCandidates,[],
  'Ningún browser test debe fabricar el documento HTML bajo prueba mediante route.fulfill');

console.log(JSON.stringify({
  ok:true,
  version:'ELV2-SOURCE-TRUTH-20260827',
  source_of_truth:'src/english_lab_live_v2.jsx',
  stable_outer_route:true,
  canonical_lazy_normalization:true,
  parallel_shell_load:false,
  browser_runtime_code_patch:false,
  browser_html_fabrication:false,
  browser_tests_scanned:browserFiles.length
},null,2));
