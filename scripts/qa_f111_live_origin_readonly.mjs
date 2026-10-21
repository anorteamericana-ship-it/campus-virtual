// F111 · Auditoría pública de solo lectura del Campus REAL.
// Compara archivos del repositorio contra el dominio oficial. Nunca usa sesiones,
// credenciales ni endpoints Apps Script; no modifica estudiantes/hojas/servidores.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const OFFICIAL='https://anorteamerican.com/campus-virtual/';
const SPECS=[
 {path:'campus.html',marker:'F1110826CANON20261020',kind:'html'},
 {path:'modulos/examen_oral.html',marker:'const ORAL_F111_ENV_BLOCKED=',kind:'html'},
 {path:'src/cronograma_grupo.jsx',marker:'F111-0826:',kind:'source'},
 {path:'src/student_academic_summary_dom_cs21a113.js',marker:"postStudentPortal('getAsistenciaEstudiante'",kind:'source'}
];
const digest=t=>createHash('sha256').update(t,'utf8').digest('hex').slice(0,16);
function expectedFiles(){
 return SPECS.map(spec=>{
  const value=fs.readFileSync(spec.path,'utf8');
  assert(value.includes(spec.marker),'F111 SOURCE MISSING: '+spec.path);
  return {...spec,content:value,sha:digest(value)};
 });
}
async function inspectOne(spec,fetcher,base=OFFICIAL){
 const url=base+spec.path;
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetcher(url,{
   method:'GET',redirect:'manual',cache:'no-store',
   headers:{Accept:'text/html,text/plain,*/*'},
   signal:controller.signal
  });
  const status=Number(response.status);
  if(status>=300&&status<400)return{path:spec.path,status,verdict:'REDIRECT_NOT_VERIFIED'};
  if(status!==200)return{path:spec.path,status,verdict:'HTTP_NOT_200'};
  const buffer=await response.arrayBuffer();
  if(buffer.byteLength>3_000_000)return{path:spec.path,status,verdict:'OVERSIZED_NOT_VERIFIED'};
  const live=new TextDecoder('utf-8').decode(buffer);
  const liveSha=digest(live);
  const marker=live.includes(spec.marker);
  const norm=v=>v.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
  const repoNormalized=norm(spec.content),liveNormalized=norm(live);
  let verdict='EXACT_MATCH',diff=null;
  // El hosting puede inyectar un beacon público de Cloudflare en HTML.
  // Solo clasificar como equivalente si quitar EXACTAMENTE UN beacon conocido
  // devuelve íntegramente el contenido del repositorio, sin otras diferencias.
  const beaconPattern=/<script\b[^>]*\bsrc="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js\/[^"]+"[^>]*><\/script>/g;
  const beaconMatches=spec.kind==='html'?live.match(beaconPattern)||[]:[];
  const beaconOnly=beaconMatches.length===1&&norm(live.replace(beaconPattern,''))===repoNormalized;
  if(liveSha!==spec.sha){
   if(repoNormalized===liveNormalized)verdict='LINE_ENDINGS_OR_BOM_ONLY';
   else if(beaconOnly)verdict='HOST_CLOUDFLARE_BEACON_ONLY';
   else {
     verdict=spec.kind==='source'&&/^\s*<!doctype html|^\s*<html/i.test(live)
       ? 'WRONG_ASSET_HTML'
       : marker?'CONTENT_DIFFERS':'VERSION_MISSING_MARKER';
     const repoLines=repoNormalized.split('\n'),liveLines=liveNormalized.split('\n');
     let first=0;while(first<Math.max(repoLines.length,liveLines.length)&&repoLines[first]===liveLines[first])first++;
     function excerpt(v){return String(v||'').replace(/\s+/g,' ').slice(0,130);}
     diff={firstLine:first+1,repoLines:repoLines.length,remoteLines:liveLines.length,
       repoExcerpt:excerpt(repoLines[first]),remoteExcerpt:excerpt(liveLines[first])};
   }
  }
  return{path:spec.path,status,verdict,marker,
   remoteSha:liveSha,repoSha:spec.sha,repoBytes:Buffer.byteLength(spec.content,'utf8'),
   remoteBytes:buffer.byteLength,...(beaconOnly?{hostingInjection:'Cloudflare Insights beacon only'}:{}),...(diff?{diff}:{})};
 }catch(e){
  return{path:spec.path,status:null,verdict:'UNREACHABLE',detail:e?.name==='AbortError'?'timeout':'network_or_certificate'};
 }finally{clearTimeout(timer);}
}
function summary(rows){
 if(rows.every(r=>['EXACT_MATCH','LINE_ENDINGS_OR_BOM_ONLY','HOST_CLOUDFLARE_BEACON_ONLY'].includes(r.verdict))){
   return rows.some(r=>r.verdict==='HOST_CLOUDFLARE_BEACON_ONLY')
     ? 'LIVE_SOURCE_MATCH_WITH_CLOUDFLARE_INJECTION'
     : 'LIVE_MATCHES_REPOSITORY';
 }
 if(rows.some(r=>['WRONG_ASSET_HTML','CONTENT_DIFFERS','VERSION_MISSING_MARKER'].includes(r.verdict)))return 'LIVE_MISMATCH_CONFIRMED';
 return 'LIVE_NOT_VERIFIED';
}
function summaryMarkdown(rows,result){
 const header=['## F111 · Comparación pública LIVE (solo GET)','',
 'Dominio consultado: '+OFFICIAL,
 '',
 '**Resultado: '+result+'**',
 '',
 '| Archivo | HTTP | Resultado | SHA remoto | SHA repositorio | Primera diferencia |',
 '|---|---:|---|---|---|---:|'];
 for(const r of rows)header.push('| '+r.path+' | '+(r.status??'—')+
  ' | '+r.verdict+' | '+(r.remoteSha||'—')+' | '+(r.repoSha||'—')+' | '+(r.diff?.firstLine||'—')+' |');
 header.push('','No se utilizaron cookies, tokens, datos personales ni solicitudes POST.',
 'GitHub Pages SUCCESS no equivale a que el dominio institucional sirva estos archivos.',
 'Si el resultado es LIVE_NOT_VERIFIED, **no** declarar coincidencia ni falla de producción.');
 return header.join('\n')+'\n';
}
function fakeResponse({status=200,body='',url=''}) {
 return{status,headers:{get:()=>null},arrayBuffer:async()=>new TextEncoder().encode(body).buffer};
}
async function selftest(){
 const specs=expectedFiles();
 const fixture=specs[0];
 const matched=await inspectOne(fixture,async(url,init)=>{
  assert.equal(init.method,'GET');
  assert.equal(init.redirect,'manual');
  assert(!init.headers.Cookie&&!(new URL(url)).search,'No credenciales ni query');
  return fakeResponse({body:fixture.content});
 });
 assert.equal(matched.verdict,'EXACT_MATCH');
 const beacon='<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js/test-version" crossorigin="anonymous"></script>';
 const marked=await inspectOne(fixture,async()=>fakeResponse({body:fixture.content.replace('</body>',beacon+'</body>')}));
 assert.equal(marked.verdict,'HOST_CLOUDFLARE_BEACON_ONLY','Solo se descuenta una inserción pública conocida');
 const modified=await inspectOne(fixture,async()=>fakeResponse({body:fixture.content.replace('</body>','CAMBIO_REAL'+beacon+'</body>')}));
 assert.equal(modified.verdict,'CONTENT_DIFFERS','No ocultar una modificación real adyacente a Cloudflare');
 const mismatch=await inspectOne(fixture,async()=>fakeResponse({body:'<!DOCTYPE html><title>OTRA VERSION</title>'}));
 assert.equal(mismatch.verdict,'VERSION_MISSING_MARKER');
 const missing=await inspectOne(fixture,async()=>fakeResponse({status:404}));
 assert.equal(missing.verdict,'HTTP_NOT_200');
 const blocked=await inspectOne(fixture,async()=>{throw Error('blocked');});
 assert.equal(blocked.verdict,'UNREACHABLE');
 assert.equal(summary([matched,blocked]),'LIVE_NOT_VERIFIED');
 assert.equal(summary([matched,marked]),'LIVE_SOURCE_MATCH_WITH_CLOUDFLARE_INJECTION');
 assert.equal(summary([matched,mismatch]),'LIVE_MISMATCH_CONFIRMED');
 assert.equal(summary(specs.map(x=>({verdict:'EXACT_MATCH'}))),'LIVE_MATCHES_REPOSITORY');
 assert.equal(SPECS.length,4);
 console.log('F111_LIVE_READONLY_SELFTEST_PASS: 4 GET paths, exact hash, known Cloudflare injection, real diff preserved, mismatch and inconclusive classified');
}
if(process.argv.includes('--selftest'))await selftest();
else{
 const specs=expectedFiles();
 const rows=[];
 for(const spec of specs)rows.push(await inspectOne(spec,fetch));
 const outcome=summary(rows);
 console.log('F111_OFFICIAL_CAMPUS_ORIGIN_CHECK='+outcome);
 for(const row of rows)console.log(JSON.stringify(row));
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summaryMarkdown(rows,outcome));
 // No enmascarar un fallo como LIVE PASS. La auditoría registra estado explícito
 // incluso cuando WAF/hosting no permite lectura desde GitHub Actions.
}
