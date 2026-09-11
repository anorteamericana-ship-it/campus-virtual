import fs from 'node:fs/promises';

/* C3.7.6 · cierre determinista del submit CONAPE
   - conserva correo existente de CONAPE: Campus solo completa correo si CONAPE está vacío
   - usa setter/eventos equivalentes al E4 local que sí funcionó
   - pulsa Crear nuevo Prospecto con click real de Playwright
   - observa request + response del POST CREATE
   - éxito visible tiene precedencia; invalid_fields es solo telemetría después del click
   - confirma fallback por relectura del prospecto en el reporte
*/
const configured = Number(process.env.CAMPUS_REQUEST_TIMEOUT_MS || 70000);
const campusTimeoutMs = Number.isFinite(configured) ? Math.max(30000, configured) : 70000;
const nativeTimeout = AbortSignal.timeout.bind(AbortSignal);
AbortSignal.timeout = function campusAwareTimeout(ms) {
  return nativeTimeout(Number(ms) === 30000 ? campusTimeoutMs : ms);
};

const sourceUrl = new URL('./server_c3_7.mjs', import.meta.url);
const runtimeUrl = new URL('./server_c3_7_6_runtime.mjs', import.meta.url);
let source = await fs.readFile(sourceUrl, 'utf8');

function replaceBlock(startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) throw new Error(`C3_7_6_${label}_CONTRACT_MISMATCH`);
  source = source.slice(0, start) + replacement + '\n' + source.slice(end);
}

const newPlan = `function contactPlan(campus,conape){
  const phone=campusPhone(campus),mail=campusEmail(campus),conapePhone=digits(conape?.telefono).slice(-8),conapeMail=email(conape?.correo);
  if(phone&&phone.length!==8)throw new AppError('CONTACT_VALIDATION_FAILED','El WhatsApp del Campus no tiene 8 dígitos.',422);
  if(!conapeMail&&!validEmail(mail))throw new AppError('CONTACT_VALIDATION_FAILED','El correo del Campus no es válido.',422);
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
  const createResponses=[];
  const isCreate=req=>{
    try{
      const u=new URL(req.url());
      if(req.method()!=='POST'||!u.pathname.endsWith('/apex/wwv_flow.accept'))return false;
      const params=new URLSearchParams(String(req.postData()||''));
      return upper(params.get('p_request'))==='CREATE';
    }catch{return false;}
  };
  const onRequest=req=>{if(isCreate(req))createRequests.push({at:Date.now()});};
  const onResponse=res=>{try{const req=res.request();if(isCreate(req))createResponses.push({status:res.status(),at:Date.now()});}catch{}};
  p.on('request',onRequest);
  p.on('response',onResponse);
  try{
    let button=p.getByRole('button',{name:/crear nuevo prospecto/i}).first();
    if(!(await button.count()))button=p.locator('#B204785015526859057').first();
    if(!(await button.count()))throw new AppError('CREATE_BUTTON_NOT_FOUND','No se encontró Crear nuevo Prospecto.',503);

    const before=await p.evaluate(()=>{
      const visible=el=>{try{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;}catch{return false;}};
      const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
      const classify=text=>{
        if(/PROSPECTO REGISTRAD|REGISTRAD[OA] CORRECTAMENTE|CREAD[OA] CORRECTAMENTE|GUARDAD[OA] CORRECTAMENTE/.test(text))return 'PROSPECTO_REGISTRADO';
        if(/YA (FUE )?REGISTRAD|YA SE ENCUENTRA|YA EXIST|DUPLIC|PERTENECE A OTRO|OTRO RECLUTADOR|EN PROCESO/.test(text))return 'YA_REGISTRADO';
        if(/OBLIGATOR|REQUERID|DEBE INGRESAR|DEBE COMPLETAR/.test(text))return 'CAMPO_OBLIGATORIO';
        if(/INVALID|NO ES VALIDO|FORMATO|NO CORRESPONDE/.test(text))return 'DATO_INVALIDO';
        if(/NO AUTORIZAD|SIN PERMISO|NO TIENE ACCESO/.test(text))return 'SIN_PERMISO';
        if(/ERROR|NO SE PUDO|NO FUE POSIBLE/.test(text))return 'ERROR_DE_PORTAL';
        return text?'ALERTA_NO_CLASIFICADA':'';
      };
      const nodes=Array.from(document.querySelectorAll('[role="alert"],.t-Alert,.a-Alert,.t-Body-alert,.t-Form-error,.apex-page-item-error,.t-Alert--danger,.t-Alert--warning')).filter(visible);
      const summaries=[...new Set(nodes.map(n=>classify(norm(n.textContent||''))).filter(Boolean))];
      const alertDomIds=[...new Set(nodes.map(n=>{
        if(n.id)return '#'+n.id;
        const classes=Array.from(n.classList||[]).filter(c=>/^[A-Za-z0-9_-]{1,80}$/.test(c)).slice(0,3);
        return classes.length?classes.map(c=>'.'+c).join(''):String(n.tagName||'').toLowerCase();
      }).filter(Boolean))].slice(0,20);
      const apexErrorItemIds=Array.from(document.querySelectorAll('.apex-page-item-error')).map(el=>el.id||'').filter(Boolean).slice(0,20);
      const text=norm(nodes.map(n=>n.textContent||'').join(' '));
      const ids=['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'];
      const invalid=ids.map(id=>document.getElementById(id)).filter(el=>el&&el.willValidate&&!el.validity.valid).map(el=>el.id);
      return {path:location.pathname,invalid_fields:invalid,alerts_before:summaries,alert_dom_ids:alertDomIds,apex_error_item_ids:apexErrorItemIds,alert_text_length:text.length};
    });
    if(before.invalid_fields.length){
      console.log(JSON.stringify({event:'conape_create_telemetry',action:'submit',stage:'before_create_click',create_count:0,apex_http_status:null,success_message:false,server_error_message:false,duplicate_message:false,invalid_field_ids:before.invalid_fields,alerts_before:before.alerts_before,visible_alerts:before.alerts_before,alert_dom_ids:before.alert_dom_ids,apex_error_item_ids:before.apex_error_item_ids,alert_text_length:before.alert_text_length,form_reset:false,path_before:before.path,path_after:before.path,ms_click_to_response:null,ms_response_to_classification:null,pii:false}));
      throw new AppError('FORM_INVALID_BEFORE_CREATE','El formulario CONAPE no está válido antes de Crear nuevo Prospecto.',422);
    }

    const clickAt=Date.now();
    await button.click({timeout:15000});

    const responseDeadline=Date.now()+30000;
    while(Date.now()<responseDeadline&&!createResponses.length)await sleep(100);
    const response=createResponses[0]||null;
    const responseAt=response?.at||Date.now();

    const classifyDeadline=Date.now()+10000;
    let outcome=null;
    while(Date.now()<classifyDeadline){
      await sleep(250);
      outcome=await p.evaluate(()=>{
        const visible=el=>{try{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;}catch{return false;}};
        const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
        const classify=text=>{
          if(/PROSPECTO REGISTRAD|REGISTRAD[OA] CORRECTAMENTE|CREAD[OA] CORRECTAMENTE|GUARDAD[OA] CORRECTAMENTE/.test(text))return 'PROSPECTO_REGISTRADO';
          if(/YA (FUE )?REGISTRAD|YA SE ENCUENTRA|YA EXIST|DUPLIC|PERTENECE A OTRO|OTRO RECLUTADOR|EN PROCESO/.test(text))return 'YA_REGISTRADO';
          if(/OBLIGATOR|REQUERID|DEBE INGRESAR|DEBE COMPLETAR/.test(text))return 'CAMPO_OBLIGATORIO';
          if(/INVALID|NO ES VALIDO|FORMATO|NO CORRESPONDE/.test(text))return 'DATO_INVALIDO';
          if(/NO AUTORIZAD|SIN PERMISO|NO TIENE ACCESO/.test(text))return 'SIN_PERMISO';
          if(/ERROR|NO SE PUDO|NO FUE POSIBLE/.test(text))return 'ERROR_DE_PORTAL';
          return text?'ALERTA_NO_CLASIFICADA':'';
        };
        const nodes=Array.from(document.querySelectorAll('[role="alert"],.t-Alert,.a-Alert,.t-Body-alert,.t-Form-error,.apex-page-item-error,.t-Alert--danger,.t-Alert--warning')).filter(visible);
        const text=norm(nodes.map(n=>n.textContent||'').join(' '));
        const summaries=[...new Set(nodes.map(n=>classify(norm(n.textContent||''))).filter(Boolean))];
        const duplicate=summaries.includes('YA_REGISTRADO');
        const success=summaries.includes('PROSPECTO_REGISTRADO')&&!duplicate;
        const serverError=summaries.some(c=>['CAMPO_OBLIGATORIO','DATO_INVALIDO','SIN_PERMISO','ERROR_DE_PORTAL'].includes(c));
        const alertDomIds=[...new Set(nodes.map(n=>{
          if(n.id)return '#'+n.id;
          const classes=Array.from(n.classList||[]).filter(c=>/^[A-Za-z0-9_-]{1,80}$/.test(c)).slice(0,3);
          return classes.length?classes.map(c=>'.'+c).join(''):String(n.tagName||'').toLowerCase();
        }).filter(Boolean))].slice(0,20);
        const apexErrorItemIds=Array.from(document.querySelectorAll('.apex-page-item-error')).map(el=>el.id||'').filter(Boolean).slice(0,20);
        const invalid=Array.from(document.querySelectorAll('input,select,textarea')).filter(el=>el.willValidate&&!el.validity.valid).map(el=>el.id||el.name||'field').filter(Boolean).slice(0,20);
        const ids=['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'];
        const formPresent=!!document.getElementById('P2_PRS_CEDULA');
        const formReset=formPresent&&ids.every(id=>!String(document.getElementById(id)?.value||'').trim());
        return {success_message:success,duplicate_message:duplicate,server_error_message:serverError,visible_alerts:summaries.slice(0,5),alert_dom_ids:alertDomIds,apex_error_item_ids:apexErrorItemIds,alert_text_length:text.length,invalid_fields:invalid,form_reset:formReset,path:location.pathname};
      }).catch(()=>null);
      if(outcome?.success_message||outcome?.duplicate_message||outcome?.server_error_message)break;
    }

    const classifiedAt=Date.now();
    const telemetry={action:'submit',stage:'after_create_click',create_count:createRequests.length,apex_http_status:response?.status??null,success_message:!!outcome?.success_message,server_error_message:!!outcome?.server_error_message,duplicate_message:!!outcome?.duplicate_message,invalid_field_ids:Array.isArray(outcome?.invalid_fields)?outcome.invalid_fields:[],alerts_before:Array.isArray(before?.alerts_before)?before.alerts_before:[],visible_alerts:Array.isArray(outcome?.visible_alerts)?outcome.visible_alerts:[],alert_dom_ids:Array.isArray(outcome?.alert_dom_ids)?outcome.alert_dom_ids:[],apex_error_item_ids:Array.isArray(outcome?.apex_error_item_ids)?outcome.apex_error_item_ids:[],alert_text_length:Number.isFinite(outcome?.alert_text_length)?outcome.alert_text_length:0,form_reset:!!outcome?.form_reset,path_before:before.path,path_after:outcome?.path||'',ms_click_to_response:response?Math.max(0,responseAt-clickAt):null,ms_response_to_classification:response?Math.max(0,classifiedAt-responseAt):null,pii:false};
    console.log(JSON.stringify({event:'conape_create_telemetry',...telemetry}));
    return {createCount:createRequests.length,outcome:outcome||{},telemetry};
  }finally{
    p.off('request',onRequest);
    p.off('response',onResponse);
  }
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
const newSubmitTail="const created=await clickCreateOnce(p),outcome=created.outcome||{};if(created.createCount!==1)throw new AppError('WRITE_RESULT_UNCERTAIN','No se pudo confirmar una única solicitud CREATE. No repita el envío.',409);if(outcome.success_message&&outcome.server_error_message){const estado=await readEstadoAfterCreate(p,auth.cedula);if(estado){ConapeSession.lastActivity=nowIso();return{ok:true,confirmed:true,code:'CREATED',create_request_observed:true,write_count:1,success_signal:true,estado_conape_raw:estado,conape_session:ConapeSession.snapshot()};}throw new AppError('PORTAL_ERROR','CONAPE mostró señales contradictorias y el prospecto no apareció en el listado.',422);}if(outcome.success_message){ConapeSession.lastActivity=nowIso();return{ok:true,confirmed:true,code:'CREATED',create_request_observed:true,write_count:1,success_signal:true,estado_conape_raw:'',conape_session:ConapeSession.snapshot()};}if(outcome.duplicate_message)throw new AppError('DUPLICATE','CONAPE indicó que el prospecto ya existe.',409);if(outcome.server_error_message)throw new AppError('PORTAL_ERROR','CONAPE rechazó la creación.',422);const estado=await readEstadoAfterCreate(p,auth.cedula);if(!estado)throw new AppError('WRITE_RESULT_UNCERTAIN','CONAPE recibió la operación, pero no confirmó el resultado. No la repita.',409);ConapeSession.lastActivity=nowIso();return{ok:true,confirmed:true,code:'CREATED',create_request_observed:true,write_count:1,success_signal:true,estado_conape_raw:estado,conape_session:ConapeSession.snapshot()};";
if(!source.includes(oldSubmitTail))throw new Error('C3_7_6_SUBMIT_TAIL_CONTRACT_MISMATCH');
source=source.replace(oldSubmitTail,newSubmitTail).replaceAll("version:'C3.7'","version:'C3.7.6'");
await fs.writeFile(runtimeUrl,source,'utf8');
console.log(JSON.stringify({event:'bridge_runtime_patch',version:'C3.7.6',campus_timeout_ms:campusTimeoutMs,preserve_existing_conape_email:true,real_create_button_click:true,observe_create_response:true,success_precedence:true,invalid_after_click_telemetry_only:true,verify_created_in_report:true,pii:false}));
await import(`${runtimeUrl.href}?v=${Date.now()}`);
