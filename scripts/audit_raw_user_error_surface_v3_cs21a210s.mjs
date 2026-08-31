import fs from 'node:fs';
import path from 'node:path';

const ROOT='src';
const failOnFindings=process.argv.includes('--fail-on-findings');
const extensions=new Set(['.js','.jsx','.mjs','.ts','.tsx']);
const findings=[];

function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) walk(p);
    else if(extensions.has(path.extname(ent.name).toLowerCase())) scan(p);
  }
}
function lineOf(src,index){return src.slice(0,index).split(/\r?\n/).length;}
function protectedBySafeHelper(s){
  return /(?:safe(?:user)?error|safeusererror|normalizarmensajeerrorcampus|usersafe|errorsafe|captureerrormessage|errormessage\s*\()/i.test(s);
}
function rawTechnicalProperty(s){
  return /\b[A-Za-z_$][\w$]*(?:\?\.)?\.(?:message|error)\b/.test(s);
}
function extractCall(src,openIndex){
  let depth=0, quote='', escape=false, templateExpr=0;
  for(let i=openIndex;i<src.length&&i<openIndex+2200;i++){
    const c=src[i], n=src[i+1];
    if(quote){
      if(escape){escape=false;continue;}
      if(c==='\\'){escape=true;continue;}
      if(quote==='`' && c==='$' && n==='{'){templateExpr++; i++; continue;}
      if(quote==='`' && templateExpr>0){
        if(c==='{') templateExpr++;
        else if(c==='}') templateExpr--;
        continue;
      }
      if(c===quote){quote='';continue;}
      continue;
    }
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c==='(') depth++;
    else if(c===')'){
      depth--;
      if(depth===0) return src.slice(openIndex,i+1);
    }
  }
  return src.slice(openIndex,Math.min(src.length,openIndex+1000));
}
function mappedOrBranched(call){
  if(/ERR_MSG\s*\[[^\]]+\.error\]/.test(call)&&!/[+`]\s*[^)]*\.error/.test(call)) return true;
  if(/(?:\.error|\.message)\s*===?\s*['"][^'"]+['"]/.test(call) && !/[+`]\s*[^)]*\.(?:error|message)/.test(call)) return true;
  return false;
}
function add(src,file,index,name,call){
  const prop=/\.message\b/.test(call)?'RAW_EXCEPTION':'RAW_BACKEND_ERROR';
  const custom=/^set[A-Z]/.test(name) && !/^(setError|setErr|setErrLocal|setPrefillError|setNotice|setMessage|setMsg|setToast|setState|setData)$/.test(name);
  findings.push({
    file,
    line:lineOf(src,index),
    kind:custom?`${prop}_CUSTOM_SETTER`:`${prop}_SINK`,
    sink:name,
    text:call.replace(/\s+/g,' ').trim().slice(0,500),
  });
}
function scan(file){
  const src=fs.readFileSync(file,'utf8');
  const re=/\b(set[A-Z][A-Za-z0-9_$]*|setError|setErr|setErrLocal|setPrefillError|setNotice|setMessage|setMsg|showToast|setToast|toast|alert|dispatch)\s*\(/g;
  let m;
  while((m=re.exec(src))){
    const name=m[1];
    const call=extractCall(src,m.index);
    if(protectedBySafeHelper(call)||!rawTechnicalProperty(call)||mappedOrBranched(call)) continue;
    if(/^(setState|setData|dispatch)$/.test(name) && !/\b(?:error|err|message|msg|notice)\s*:/.test(call)) continue;
    add(src,file,m.index,name,call);
  }
  const wa=/\bwindow\.alert\s*\(/g;
  while((m=wa.exec(src))){
    const call=extractCall(src,m.index);
    if(protectedBySafeHelper(call)||!rawTechnicalProperty(call)||mappedOrBranched(call)) continue;
    add(src,file,m.index,'window.alert',call);
  }
}

walk(ROOT);
findings.sort((a,b)=>a.file.localeCompare(b.file)||a.line-b.line||a.kind.localeCompare(b.kind));
const byFile=new Map();
for(const f of findings) byFile.set(f.file,(byFile.get(f.file)||0)+1);
const custom=findings.filter(f=>f.kind.includes('CUSTOM_SETTER')).length;
console.log('CS21A210S RAW USER ERROR SURFACE AUDIT V3');
console.log(`FILES_ROOT=${ROOT}`);
console.log(`DIRECT_RAW_SINK_FINDINGS=${findings.length}`);
console.log(`FILES_WITH_FINDINGS=${byFile.size}`);
console.log(`CUSTOM_SETTER_FINDINGS=${custom}`);
for(const [file,count] of [...byFile.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))) console.log(`FILE_COUNT|${count}|${file}`);
for(const f of findings) console.log(`FINDING|${f.kind}|${f.sink}|${f.file}:${f.line}|${f.text}`);
console.log('NOTE=V3 expands V2 to React-style custom setters while retaining safe-helper/mapped-code exclusions');
console.log('NOTE=Audit findings require route/ownership review before any functional patch');
console.log('EVIDENCE=AUDIT_ONLY_NO_FUNCTIONAL_CHANGE');
if(failOnFindings&&findings.length) process.exitCode=2;
