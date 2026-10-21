// F111 · Contrato de aislamiento oral QA/PROD, sin red externa ni usuarios reales.
// Ejecuta solo el router inline del MISMO examen_oral.html (no crea copia de interfaz).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('modulos/examen_oral.html','utf8');
const start=html.indexOf('// F111: UNA sola interfaz oral, dos entornos explícitos');
const end=html.indexOf('const CRITERIA=',start);
assert(start>0&&end>start,'Se conserva el HTML único con router F111 al inicio');
const block=html.slice(start,end);
const sessionFn=(html.match(/^function getSesion\(\)\{[^\n]+$/m)||[])[0];
assert(sessionFn,'El módulo conserva una única fuente de sesión');
const apiFn=(html.split('\n').find(line=>line.startsWith('async function api('))||'');
assert(apiFn,'La API oral del módulo permanece localizable');
const fullScript=html.slice(html.indexOf('<script>\n',html.indexOf('./oral_bancos_ic5.js'))+8,html.lastIndexOf('</script>'));
new vm.Script(fullScript,'modulos/examen_oral.html');
assert(!html.includes('eval('));
const QA='https://script.google.com/macros/s/AKfycbxEAQ9lAg1Nv0ASX30MAVOzD7IZvwwqSI9MYcNaMhOQ/dev';
const PROD='https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';
const KEY='an_f111_qa_oral_session_only', QA_GROUP='B1-LM69-C3-9926';
function harness(search,qaReturn={}){
  const storage=new Map(),network=[];
  const ctx={location:{search},URLSearchParams,Set,Map,JSON,console,
    sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},
    fetch:async(url,opts)=>{
      network.push({url,body:JSON.parse(opts.body)});
      assert(url.startsWith(QA+'?fn=')||url.startsWith(PROD+'?fn='),'Los únicos endpoints posibles son los dos oficiales');
      const isLogin=url===QA+'?fn=iniciarSesion';
      return{ok:true,text:async()=>JSON.stringify(isLogin?
        {ok:true,rol:'teacher',token:'QA_TOKEN_SIMULADO',grupo:QA_GROUP,nombre:'Docente sintético',...qaReturn}:
        {ok:true,evaluacion:{COD_ESTUDIANTE:'QA-F111-B2-01'}})};
    }};
  vm.createContext(ctx);
  vm.runInContext(block+'\n'+sessionFn+'\n'+apiFn+'\n'+`
    globalThis.F111={qa:ORAL_F111_QA_MODE,url:APPS_SCRIPT_URL,qaURL:ORAL_F111_QA_ENDPOINT,prodURL:ORAL_F111_PROD_ENDPOINT,
    key:ORAL_F111_QA_KEY,group:ORAL_F111_QA_GROUP,guard:oralF111QaGuard,login:oralF111QaLogin,session:getSesion,valid:oralF111QaSesionValida,blocked:ORAL_F111_ENV_BLOCKED,request:api};
  `,ctx);
  return {ctx,store:storage,network,api:ctx.F111};
}

const live=harness('');
live.store.set('an_usuario',JSON.stringify({rol:'teacher',token:'PROD_TOKEN_SIMULADO'}));
assert.equal(live.api.qa,false);assert.equal(live.api.url,PROD);
assert.equal(live.api.session().token,'PROD_TOKEN_SIMULADO');
assert.equal(live.api.guard('oralSaveDraft',{cod_grupo:'B1-LM18-C3-0726'},{rol:'teacher'}).cod_grupo,'B1-LM18-C3-0726',
  'El modo PROD mantiene payload intacto');
assert.equal(live.network.length,0,'Ninguna solicitud QA en modo PROD');
await live.api.request('oralGetPanelDocente',{cod_grupo:'B1-LM18-C3-0726'});
assert.equal(live.network[0].url,PROD+'?fn=oralGetPanelDocente','Solo modo normal usa endpoint de producción en el mock');
assert.equal(live.network[0].body.token,'PROD_TOKEN_SIMULADO');
await assert.rejects(live.api.login('nada'),/prohibido fuera/);

const prodExplicit=harness('?entorno=prod');
assert.equal(prodExplicit.api.url,PROD);
for(const badQuery of ['?entorno=qa','?qa=1','?entorno=QA-F111-B2','?entorno=qa-f111-b2&qa=1']){
  const bad=harness(badQuery);
  bad.store.set('an_usuario',JSON.stringify({token:'PROD_TOKEN_SIMULADO',rol:'teacher'}));
  assert.equal(bad.api.blocked,true,'Parámetro desconocido debe bloquear: '+badQuery);
  assert.equal(bad.api.session().token,undefined,'No leer sesión real con entorno desconocido');
  assert.throws(()=>bad.api.guard('oralSaveDraft',{cod_estudiante:'17196'},bad.api.session()),/Entorno oral no autorizado/);
  assert.equal(bad.network.length,0,'Cero intentos de red en entorno desconocido');
}
assert(html.includes("if(ORAL_F111_ENV_BLOCKED){"),'UI bloquea entorno desconocido antes de cargar panel');

const qa=harness('?entorno=qa-f111-b2');
qa.store.set('an_usuario',JSON.stringify({rol:'superadmin',token:'PROD_TOKEN_SIMULADO'}));
assert.equal(qa.api.qa,true);assert.equal(qa.api.url,QA);
assert.equal(qa.api.session().token,undefined,'QA nunca lee an_usuario del Campus real');
assert.throws(()=>qa.api.guard('oralGetPanelDocente',{},qa.api.session()),/iniciá sesión/);
const l=await qa.api.login('CLAVE_FICTICIA');
assert.equal(l.ambiente,'QA_F111_B2');assert.equal(l.rol,'teacher');
assert.equal(qa.network.length,1);assert.equal(qa.network[0].url,QA+'?fn=iniciarSesion');
assert.equal(qa.network[0].body.usuario,'qa_docente');
assert.equal(qa.store.get('an_usuario'),JSON.stringify({rol:'superadmin',token:'PROD_TOKEN_SIMULADO'}),'QA no sobrescribe producción');
assert(!qa.store.get(KEY).includes('CLAVE_FICTICIA'),'Contraseña nunca persistida');
const safe=qa.api.guard('oralGetPanelDocente',{},qa.api.session());
assert.equal(safe.cod_grupo,QA_GROUP);assert.equal(safe.nivel,'B2');assert.equal(safe.leccion,9);
assert.equal(safe.reposicion_id,'');
const draft=qa.api.guard('oralSaveDraft',{cod_estudiante:'QA-F111-B2-01',leccion:9},qa.api.session());
assert.equal(draft.cod_estudiante,'QA-F111-B2-01');
for(const [fn,body] of [
  ['getGrupoInfo',{}],['oralSaveDraft',{cod_estudiante:'17196'}],
  ['oralGetPanelDocente',{cod_grupo:'B1-KJ18-C3-0826'}],
  ['oralGetPanelDocente',{nivel:'I1'}],['oralGetPanelDocente',{leccion:17}],
  ['oralGetPanelDocente',{reposicion_id:'QA-REPO'}],
  ['oralSaveDraft',{}],['oralGeneratePdf',{cod_estudiante:'17203'}]
]) assert.throws(()=>qa.api.guard(fn,body,qa.api.session()),/QA:/,fn);
await qa.api.request('oralSaveDraft',{cod_estudiante:'QA-F111-B2-01',fn:'aplicarPago',token:'PROD_TOKEN_SIMULADO'});
assert.equal(qa.network[1].url,QA+'?fn=oralSaveDraft','Operación oral QA nunca enruta a producción');
assert.equal(qa.network[1].body.fn,'oralSaveDraft','El cuerpo no puede suplantar la función');
assert.equal(qa.network[1].body.token,'QA_TOKEN_SIMULADO','El cuerpo no puede suplantar token QA con PROD');
await assert.rejects(qa.api.request('oralSaveDraft',{cod_estudiante:'17196'}),/QA:/);
assert.equal(qa.network.length,2,'Solo una operación oral mock en QA, cero mutaciones reales');
const wrong=harness('?entorno=qa-f111-b2',{rol:'admin'});
await assert.rejects(wrong.api.login('CLAVE_FICTICIA'),/no se acreditó/);
assert(!wrong.store.has(KEY),'Login con rol incorrecto no genera token local');
assert(html.includes("ORAL_F111_QA_MODE?ORAL_F111_QA_KEY:'an_usuario'"));
assert(html.includes("if(ORAL_F111_QA_MODE){\n      const members"));
assert(html.includes("members.length!==1||String(members[0].codigo)!==ORAL_F111_QA_STUDENT"));
assert(html.includes("if(new URLSearchParams(location.search).has('preview'))"));
assert(html.includes("loadPanel().finally(reportHeightF89)"));
console.log('F111_ORAL_ENV_ISOLATION_E1_PASS: PROD default intacto, QA /dev fijo, login separado, 8 bloqueos de operaciones y 4 parámetros inválidos bloqueados, cero mutaciones');
