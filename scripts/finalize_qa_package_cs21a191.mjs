#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const target=path.join(root,'dist','CAMPUS_QA_CS21A191_CANDIDATO_HANGMAN_LIVE');
const versionPath=path.join(target,'VERSION.txt');
assert.equal(fs.existsSync(versionPath),true,'Falta VERSION.txt del paquete CS21A191.');

let version=fs.readFileSync(versionPath,'utf8');
function set(key,value){
  const line=`${key}=${value}`;
  const re=new RegExp(`^${key}=.*$`,'m');
  version=re.test(version)?version.replace(re,line):version.replace(/\s*$/,'')+`\n${line}\n`;
}
set('VERSION','CS21A191');
set('STATUS','QA_CANDIDATE_NOT_FINAL');
set('PURPOSE','English LAB Live Hangman server-authoritative QA candidate');
set('FRONTEND_LAYER','F98.4-Z6-CS21A191');
set('BACKEND_LAYER','CS21A191-HANGMAN-1');
set('APPS_SCRIPT_CHANGE','YES_QA_ONLY_REPLACE_COMPLETE_99_AFTER_98');
set('APPS_SCRIPT_INSTALL_MODE','SINGLE_COMPLETE_FILE_99_THROUGH_99N_AFTER_98');
set('APPS_SCRIPT_COMPLETE_FILE','BACKEND_QA/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs');
fs.writeFileSync(versionPath,version.replace(/\s*$/,'')+'\n','utf8');

function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
const files=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const absolute=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(absolute);
    else if(entry.name!=='SHA256SUMS.txt') files.push(absolute);
  }
}
walk(target);
files.sort((a,b)=>a.localeCompare(b));
fs.writeFileSync(path.join(target,'SHA256SUMS.txt'),files.map(file=>`${sha256(file)}  ./${path.relative(target,file).split(path.sep).join('/')}`).join('\n')+'\n','utf8');

const finalVersion=fs.readFileSync(versionPath,'utf8');
assert.match(finalVersion,/^PURPOSE=English LAB Live Hangman server-authoritative QA candidate$/m);
assert.match(finalVersion,/^APPS_SCRIPT_CHANGE=YES_QA_ONLY_REPLACE_COMPLETE_99_AFTER_98$/m);
assert.match(finalVersion,/^APPS_SCRIPT_INSTALL_MODE=SINGLE_COMPLETE_FILE_99_THROUGH_99N_AFTER_98$/m);
assert.doesNotMatch(finalVersion,/^APPS_SCRIPT_CHANGE=.*ADD_99/m);
console.log(JSON.stringify({ok:true,version:'CS21A191',metadataFinal:true,appsScriptMode:'SINGLE_COMPLETE_FILE_99_THROUGH_99N_AFTER_98',files:files.length},null,2));
