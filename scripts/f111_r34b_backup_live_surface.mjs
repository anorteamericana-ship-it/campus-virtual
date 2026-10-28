// F111 R34-B: capture public LIVE frontend assets, read-only, with byte-for-byte hashes.
// Creates ONE backup snapshot outside both git repos; no production mutation.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=String.raw`C:\Users\leodr\Documents\CampusVirtual\F111_OFICIAL`;
const output=path.join(root,'_RESPALDO_FRONTEND_LIVE_R34B_20261028');
const base='https://anorteamerican.com/campus-virtual/';
const pages=['campus.html','login.html','inscripcion.html','modulos/examen_oral.html'];
const queue=[...pages],seen=new Set(),files=[],failures=[];
const allowed=/^[a-zA-Z0-9_\-./]+$/;
function norm(x){
 if(!x||x.startsWith('#')||/^(?:[a-z]+:|\/\/|data:|mailto:)/i.test(x))return null;
 let y=x.split(/[?#]/)[0].replace(/^\.\//,'').replace(/^\//,'');
 if(y.startsWith('campus-virtual/'))y=y.slice('campus-virtual/'.length);
 if(!allowed.test(y)||y.includes('..')||y.includes('\\')||y.endsWith('/'))return null;
 return y;
}
function add(x){const n=norm(x);if(n&&!seen.has(n)&&!queue.includes(n))queue.push(n)}
try{await fs.access(output);throw Error('BACKUP_ALREADY_EXISTS_DO_NOT_OVERWRITE');}
catch(e){if(e.code!=='ENOENT')throw e}
await fs.mkdir(path.join(output,'files'),{recursive:true});
while(queue.length){
 const local=queue.shift();if(seen.has(local))continue;seen.add(local);
 const url=new URL(local,base).href;
 try{
  const res=await fetch(url,{redirect:'follow'});
  if(!res.ok)throw Error('HTTP '+res.status);
  const buffer=Buffer.from(await res.arrayBuffer());
  if(buffer.length>8_000_000)throw Error('unexpected_file_too_large');
  const file=path.join(output,'files',...local.split('/'));
  await fs.mkdir(path.dirname(file),{recursive:true});
  await fs.writeFile(file,buffer);
  files.push({path:local,bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex')});
  if(/\.html$/i.test(local)||/\.css$/i.test(local)){
    const html=buffer.toString('utf8');
    if(/\.html$/i.test(local)){
      for(const m of html.matchAll(/<(?:script|link|img|source|a)\b[^>]*(?:src|href)\s*=\s*['"]([^'"]+)['"]/ig))
        { const u=new URL(m[1],new URL(local,base)); if(u.origin===new URL(base).origin&&u.pathname.startsWith('/campus-virtual/')) add(u.pathname.slice('/campus-virtual/'.length)); }
    }
    if(/\.css$/i.test(local))for(const m of html.matchAll(/url\(\s*['"]?([^)'"]+)/ig))
      { const u=new URL(m[1],new URL(local,base)); if(u.origin===new URL(base).origin&&u.pathname.startsWith('/campus-virtual/')) add(u.pathname.slice('/campus-virtual/'.length)); }
  }
 } catch(e){failures.push({path:local,error:String(e?.message||e).slice(0,100)})}
 if(seen.size>260)throw Error('UNEXPECTED_REFERENCE_EXPANSION');
}
const manifest={type:'F111_R34B_FRONTEND_PUBLIC_BASELINE',observedUtc:new Date().toISOString(),
base,files:files.length,errors:failures.length,hash:'sha256',entries:files,unavailable:failures,
limitations:['public HTTP resources only','dynamic imports and server configuration not certified','not a verified complete restore image']};
await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2),'utf8');
console.log(JSON.stringify({folder:output,files:files.length,errors:failures.length,failed:failures.slice(0,15),
critical:files.filter(x=>pages.includes(x.path)),manifest:path.join(output,'manifest.json')}));
if(failures.length)process.exitCode=2;
