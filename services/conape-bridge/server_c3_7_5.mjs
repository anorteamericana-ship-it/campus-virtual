import fs from 'node:fs/promises';

/* C3.7.5 · cierre del submit CONAPE
   - conserva correo existente de CONAPE: Campus solo completa correo si CONAPE está vacío
   - usa setter/eventos equivalentes al E4 local que sí funcionó
   - pulsa Crear nuevo Prospecto con un click real de Playwright
   - confirma por mensaje de éxito o por relectura del prospecto en el reporte
*/
const configured = Number(process.env.CAMPUS_REQUEST_TIMEOUT_MS || 70000);
const campusTimeoutMs = Number.isFinite(configured) ? Math.max(30000, configured) : 70000;
const nativeTimeout = AbortSignal.timeout.bind(AbortSignal);
AbortSignal.timeout = function campusAwareTimeout(ms) {
  return nativeTimeout(Number(ms) === 30000 ? campusTimeoutMs : ms);
};

const sourceUrl = new URL('./server_c3_7.mjs', import.meta.url);
const runtimeUrl = new URL('./server_c3_7_5_runtime.mjs', import.meta.url);
let source = await fs.readFile(sourceUrl, 'utf8');

function replaceBlock(startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) throw new Error(`C3_7_5_${label}_CONTRACT_MISMATCH`);
  source = source.slice(0, start) + replacement + '\n' + source.slice(end);
}

const newPlan = `function contactPlan(campus,conape){
  const phone=campusPhone(campus),mail=campusEmail(campus),conapePhone=digits(conape?.telefono).slice(-8),conapeMail=email(conape?.correo);
  if(phone&&phone.length!==8)throw new AppError('CONTACT_VALIDATION_FAILED','El WhatsApp del Campus no tiene 8 dígitos.',422);
  if(!validEmail(mail))throw new AppError('CONTACT_VALIDATION_FAILED','El correo del Campus no es válido.',422);
  const correoAlterno=conapeMail&&mail&&mail!==conapeMail?mail:'';
  return {telefono:phone||conapePhone,correo:conapeMail||mail,correo_campus_alterno:correoAlterno,update_telefono:!!phone&&phone!==conapePhone,update_correo:!conapeMail&&!!mail,preserve_correo_conape:!!conapeMail};
}`;
replaceBlock('function contactPlan(', 'async function fillContacts(', newPlan, 'CONTACT_PLAN');

const newFill = `async function fillContacts(p,plan){
  const setField=async(id,value)=>p.evaluate(({id,value})=>{
    const el=document.getElementById(id); if(!el)return false;
    const proto=Object.getPrototypeOf(el),desc=Object.getOwnPropertyDescriptor(proto,'value');
    if(desc?.set)desc.set.call(el,value); else el.value=value;
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    el.focus(); el.blur();
    return true;
  },{id,value});
  if(plan.update_telefono){if(!(await setField('P2_PRS_CELULAR',plan.telefono)))throw new AppError('CONTACT_FIELD_MISSING','No se encontró el campo de teléfono CONAPE.',503);}
  if(plan.update_correo){if(!(await setField('P2_PRS_EMAIL',plan.correo)))throw new AppError('CONTACT_FIELD_MISSING','No se encontró el campo de correo CONAPE.',503);}
  const state=await lookupState(p);
  if(!state.identity_ready)throw new AppError('IDENTITY_LOOKUP_FAILED','La identidad CONAPE dejó de estar disponible antes de crear.',409);
  if(plan.telefono&&digits(state.telefono).slice(-8)!==plan.telefono)throw new AppError('CONTACT_VALIDATION_FAILED','El teléfono no quedó aplicado en el formulario CONAPE.',422);
  if(plan.update_correo&&plan.correo&&email(state.correo)!==plan.correo)throw new AppError('CONTACT_VALIDATION_FAILED','El correo no quedó aplicado en el formulario CONAPE.',422);
  return state;
}`;
replaceBlock('async function fillContacts(', 'async function clickCreateOnce(', newFill, 'FILL_CONTACTS');

const newClick = `async function clickCreateOnce(p){
  const createRequests=[];
  const onRequest=req=>{try{const u=new URL(req.url());if(req.method()!=='POST'||!u.pathname.endsWith('/apex/wwv_flow.accept'))return;const params=new URLSearchParams(String(req.postData()||''));if(upper(params.get('p_request'))==='CREATE')createRequests.push({request:'CREATE'});}catch{}};
  p.on('request',onRequest);
  try{
    let button=p.getByRole('button',{name:/crear nuevo prospecto/i}).first();
    if(!(await button.count()))button=p.locator('#B204785015526859057').first();
    if(!(await button.count()))throw new AppError('CREATE_BUTTON_NOT_FOUND','No se encontró Crear nuevo Prospecto.',503);
    await button.click({timeout:15000});
    const until=Date.now()+20000;
    let outcome=null;
    while(Date.now()<until){
      await sleep(500);
      outcome=await p.evaluate(()=>{
        const visible=el=>{try{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;}catch{return false;}};
        const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
        const nodes=Array.from(document.querySelectorAll('[role="alert"],.t-Alert,.a-Alert,.t-Body-alert,.t-Form-error,.apex-page-item-error,.t-Alert--danger,.t-Alert--warning')).filter(visible);
        const text=norm(nodes.map(n=>n.textContent||'').join(' '));
        const invalid=Array.from(document.querySelectorAll('input,select,textarea')).filter(el=>el.willValidate&&!el.validity.valid).map(el=>el.id||el.name||'field').filter(Boolean);
        return {success_message:/CREAD|REGISTRAD|GUARDAD|CORRECTAMENTE|EXITOS/.test(text)&&!/ERROR|INVALID|NO SE PUDO|NO FUE POSIBLE/.test(text),duplicate_message:/YA EXIST|DUPLIC/.test(text),error_message:/ERROR|INVALID|OBLIGATOR|REQUERID|NO SE PUDO|NO FUE POSIBLE/.test(text)||invalid.length>0,visible_alerts:nodes.length,invalid_fields:invalid.slice(0,10),path:location.pathname,form_present:!!document.getElementById('P2_PRS_CEDULA')};
      }).catch(()=>null);
      if(outcome?.success_message||outcome?.duplicate_message||outcome?.error_message||outcome?.form_present===false)break;
    }
    return {createCount:createRequests.length,outcome:outcome||{}};
  }finally{p.off('request',onRequest);}
}`;
replaceBlock('async function clickCreateOnce(', 'async function readEstadoAfterCreate(', newClick, 'CLICK_CREATE');

const newReadEstado = `async function readEstadoAfterCreate(p,cedula){
  try{
    try{await p.goto(CONAPE_HOME,{waitUntil:'domcontentloaded',timeout:30000});}catch{}
    await sleep(800); await ConapeSession.login(p);
    const search=p.locator('input[type="search"]:visible,input[id$="_search_field"]:visible').first();
    if(!(await search.count()))return '';
    for(let attempt=0;attempt<5;attempt+=1){
      await search.fill(cedula);
      const go=p.getByRole('button',{name:/^go$/i}).first();
      if(await go.count())await go.click();else await search.press('Enter');
      const until=Date.now()+3000;
      while(Date.now()<until){
        await sleep(500);
        const estado=await p.evaluate(value=>{
          const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
          const clean=v=>String(v||'').replace(/\\D/g,'');
          for(const table of document.querySelectorAll('table')){
            const headers=Array.from(table.querySelectorAll('thead th')).map(th=>norm(th.textContent));
            const iCed=headers.findIndex(h=>h==='CEDULA'||h.includes('CEDULA')),iEstado=headers.findIndex(h=>h==='ESTADO');
            if(iCed<0||iEstado<0)continue;
            for(const tr of table.querySelectorAll('tbody tr')){const cells=Array.from(tr.querySelectorAll('td'));if(cells.length<=Math.max(iCed,iEstado))continue;if(clean(cells[iCed].textContent)===value)return String(cells[iEstado].textContent||'').trim();}
          }
          return '';
        },cedula).catch(()=> '');
        if(estado)return estado;
      }
      await sleep(700);
    }
    return '';
  }catch{return '';}
}`;
replaceBlock('async function readEstadoAfterCreate(', '\n\nasync function preview(', newReadEstado, 'READ_ESTADO');

const oldSubmitTail="const created=await clickCreateOnce(p),outcome=created.outcome||{};if(created.createCount!==1)throw new AppError('WRITE_RESULT_UNCERTAIN','No se pudo confirmar una única solicitud CREATE. No repita el envío.',409);if(outcome.duplicate_message)throw new AppError('DUPLICATE','CONAPE indicó que el prospecto ya existe.',409);if(outcome.error_message)throw new AppError('PORTAL_ERROR','CONAPE rechazó la creación.',422);if(!outcome.success_message)throw new AppError('WRITE_RESULT_UNCERTAIN','CONAPE recibió CREATE pero no confirmó el resultado. No repita el envío.',409);const estado=await readEstadoAfterCreate(p,auth.cedula);ConapeSession.lastActivity=nowIso();return{ok:true,confirmed:true,code:'CREATED',create_request_observed:true,write_count:1,success_signal:true,estado_conape_raw:estado,conape_session:ConapeSession.snapshot()};";
const newSubmitTail="const created=await clickCreateOnce(p),outcome=created.outcome||{};if(created.createCount!==1)throw new AppError('WRITE_RESULT_UNCERTAIN','No se pudo confirmar una única solicitud CREATE. No repita el envío.',409);if(outcome.duplicate_message)throw new AppError('DUPLICATE','CONAPE indicó que el prospecto ya existe.',409);if(outcome.error_message)throw new AppError('PORTAL_ERROR','CONAPE rechazó la creación.',422);const estado=await readEstadoAfterCreate(p,auth.cedula);if(!outcome.success_message&&!estado)throw new AppError('WRITE_RESULT_UNCERTAIN','CONAPE recibió la operación, pero no confirmó el resultado. No la repita.',409);ConapeSession.lastActivity=nowIso();return{ok:true,confirmed:true,code:'CREATED',create_request_observed:true,write_count:1,success_signal:true,estado_conape_raw:estado,conape_session:ConapeSession.snapshot()};";
if(!source.includes(oldSubmitTail))throw new Error('C3_7_5_SUBMIT_TAIL_CONTRACT_MISMATCH');
source=source.replace(oldSubmitTail,newSubmitTail).replaceAll("version:'C3.7'","version:'C3.7.5'");
await fs.writeFile(runtimeUrl,source,'utf8');
console.log(JSON.stringify({event:'bridge_runtime_patch',version:'C3.7.5',campus_timeout_ms:campusTimeoutMs,preserve_existing_conape_email:true,real_create_button_click:true,verify_created_in_report:true,pii:false}));
await import(`${runtimeUrl.href}?v=${Date.now()}`);
