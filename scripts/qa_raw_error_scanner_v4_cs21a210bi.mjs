import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const V3='scripts/audit_raw_user_error_surface_v3_cs21a210s.mjs';
const V4='scripts/audit_raw_user_error_surface_v4_cs21a210bi.mjs';
const v3Hash=execFileSync('git',['hash-object',V3],{encoding:'utf8'}).trim();
if(v3Hash!=='1f8c3ba22af2745eb153473c1e321cb61f430819') throw new Error(`V3 historical scanner changed ${v3Hash}`);
const v4src=fs.readFileSync(V4,'utf8');
if(!v4src.includes('function isBareSetter(src,index)')) throw new Error('V4 bare-setter guard missing');
if(!v4src.includes("return !/[.\\w$]/.test(prev);")) throw new Error('V4 member-call exclusion missing');

const v3=execFileSync('node',[V3],{encoding:'utf8',maxBuffer:20*1024*1024});
const v4=execFileSync('node',[V4],{encoding:'utf8',maxBuffer:20*1024*1024});
const count=(out,key)=>Number((out.match(new RegExp(`^${key}=(\\d+)$`,'m'))||[])[1]);
const v3Find=count(v3,'DIRECT_RAW_SINK_FINDINGS');
const v4Find=count(v4,'DIRECT_RAW_SINK_FINDINGS');
const v3Files=count(v3,'FILES_WITH_FINDINGS');
const v4Files=count(v4,'FILES_WITH_FINDINGS');
if(!(v4Find<v3Find)) throw new Error(`V4 must remove at least one demonstrated false positive: ${v3Find}->${v4Find}`);
if(v4Files>v3Files) throw new Error(`V4 file count regressed ${v3Files}->${v4Files}`);
if(!v3.includes('src/english_lab_free_access_cs21a66.js')) throw new Error('V3 false-positive fixture missing');
if(v4.includes('src/english_lab_free_access_cs21a66.js')) throw new Error('V4 still flags sessionStorage.setItem false positive');
for(const file of ['src/admin_students.jsx','src/cronograma.jsx','src/examenes_bundle.jsx','src/examenes_modes.jsx']){
  if(!v3.includes(file)) throw new Error(`V3 expected residual missing ${file}`);
  if(!v4.includes(file)) throw new Error(`V4 unexpectedly lost known bare-setter residual ${file}`);
}
const fixture=`sessionStorage.setItem('k', err.message);\nsetError(err.message);\nobj.setError(err.message);\nsetCustomThing(data.error);\n`;
const bare=[];
const re=/\b(set[A-Z][A-Za-z0-9_$]*|setError|setErr|setErrLocal|setPrefillError|setNotice|setMessage|setMsg|showToast|setToast|toast|alert|dispatch)\s*\(/g;
let m; while((m=re.exec(fixture))){ const prev=m.index>0?fixture[m.index-1]:''; if(!/[.\w$]/.test(prev)) bare.push(m[1]); }
if(JSON.stringify(bare)!==JSON.stringify(['setError','setCustomThing'])) throw new Error(`bare-setter fixture failed ${JSON.stringify(bare)}`);
console.log(`CS21A210BI scanner V4 PASS V3=${v3Find}/${v3Files} V4=${v4Find}/${v4Files}`);
console.log('V3_BLOB_FROZEN=PASS');
console.log('MEMBER_METHOD_FALSE_POSITIVE_EXCLUDED=PASS');
console.log('KNOWN_BARE_SETTER_RESIDUALS_PRESERVED=PASS');
console.log('E2=NO');
