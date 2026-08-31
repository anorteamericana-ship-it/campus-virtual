import fs from 'node:fs';
import path from 'node:path';

const ROOT='src';
const failOnFindings=process.argv.includes('--fail-on-findings');
const extensions=new Set(['.js','.jsx','.mjs','.ts','.tsx']);
const findings=[];
const sinkNames=new Set(['setError','setErr','setErrLocal','setPrefillError','setNotice','setMessage','setMsg','showToast','setToast','toast','alert','setState','setData','dispatch']);

function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) walk(p);
    else if(extensions.has(path.extname(ent.name).toLowerCase())) scan(p);
  }
}
function lineOf(src,index){return src.slice(0,index).split(/\r?\n/).length;}
function protectedBySafeHelper(s){return /(?:safe(?:user)?error|safeusererror|normalizarmensajeerrorcampus|usersafe|errorsafe|captureerrormessage|errormessage\s*\()/i.test(s);}
function rawTechnicalProperty(s){return /\b[A-Za-z_$][\w$]*(?:\?\.)?\.(?:message|error)\b/.test(s);}
function extractCall(src,openIndex){
  let depth=0, quote='', escape=false;
  for(let i=openIndex;i<src.length&&i<openIndex+1600;i++){
    const c=src[i];
    if(quote){
      if(escape){escape=false;continue;}
      if(c==='\\'){escape=true;continue;}
      if(c===quote){quote='';continue;}
      continue;
    }
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c==='(')depth++;
    else if(c===')'){
      depth--;
      if(depth===0)return src.slice(openIndex,i+1);
    }
  }
  return src.slice(openIndex,Math.min(src.length,openIndex+800));
}
function add(file,index,kind,call){
  findings.push({file,line:lineOf(fs.readFileSync(file,'utf8'),index),kind,text:call.replace(/\s+/g,' ').trim().slice(0,420)});
}
function scan(file){
  const src=fs.readFileSync(file,'utf8');
  // direct function sinks, including minified one-line sources
  const re=/\b(setError|setErr|setErrLocal|setPrefillError|setNotice|setMessage|setMsg|showToast|setToast|toast|alert|setState|setData|dispatch)\s*\(/g;
  let m;
  while((m=re.exec(src))){
    const call=extractCall(src,m.index);
    const name=m[1];
    if(protectedBySafeHelper(call))continue;
    if(!rawTechnicalProperty(call))continue;
    // Mapped/branched backend codes are not raw display (e.g. ERR_MSG[data.error], data.error === 'timeout').
    if(/ERR_MSG\s*\[[^\]]+\.error\]/.test(call)&&!/[+`]\s*[^)]*\.error/.test(call))continue;
    if(name==='setState'||name==='setData'||name==='dispatch'){
      if(!/\b(?:error|err|message|msg|notice)\s*:/.test(call))continue;
    }
    const kind=/\b[A-Za-z_$][\w$]*(?:\?\.)?\.message\b/.test(call)?'RAW_EXCEPTION_SINK':'RAW_BACKEND_ERROR_SINK';
    findings.push({file,line:lineOf(src,m.index),kind,text:call.replace(/\s+/g,' ').trim().slice(0,420)});
  }
  // window.alert is not captured by word-boundary name above as a distinct sink name; inspect explicitly.
  const wa=/\bwindow\.alert\s*\(/g;
  while((m=wa.exec(src))){
    const call=extractCall(src,m.index);
    if(protectedBySafeHelper(call)||!rawTechnicalProperty(call))continue;
    findings.push({file,line:lineOf(src,m.index),kind:'RAW_ALERT_SINK',text:call.replace(/\s+/g,' ').trim().slice(0,420)});
  }
}

walk(ROOT);
findings.sort((a,b)=>a.file.localeCompare(b.file)||a.line-b.line||a.kind.localeCompare(b.kind));
console.log('CS21A210G RAW USER ERROR SURFACE AUDIT V2');
console.log(`FILES_ROOT=${ROOT}`);
console.log(`DIRECT_RAW_SINK_FINDINGS=${findings.length}`);
for(const f of findings)console.log(`FINDING|${f.kind}|${f.file}:${f.line}|${f.text}`);
console.log('NOTE=V2 ignores downstream rendering of already-sanitized state and success/business mensaje fields');
console.log('NOTE=V2 ignores mapped/branched login error codes and sinks wrapped in recognized safe-error helpers');
console.log('EVIDENCE=AUDIT_ONLY_NO_FUNCTIONAL_CHANGE');
if(failOnFindings&&findings.length)process.exitCode=2;
