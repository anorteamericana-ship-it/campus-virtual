import http from 'node:http';
import crypto from 'node:crypto';
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 8080);
const CAMPUS_URL = String(process.env.CAMPUS_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec').trim();
const CONAPE_HOME = String(process.env.CONAPE_PORTAL_HOME_URL || 'https://online.conape.go.cr/apex/f?p=302:1').trim();
const CONAPE_USER = String(process.env.CONAPE_PORTAL_USERNAME || '');
const CONAPE_PASSWORD = String(process.env.CONAPE_PORTAL_PASSWORD || '');
const SOURCE_TTL_MS = Math.max(60_000, Number(process.env.SOURCE_TTL_MS || 180_000));
const REQUEST_TIMEOUT_MS = 30_000;
const KEEPALIVE_MS = Math.max(120_000, Number(process.env.CONAPE_KEEPALIVE_MS || 240_000));
const ALLOWED_ORIGINS = new Set(String(process.env.CAMPUS_ALLOWED_ORIGINS || 'https://anorteamerican.com,https://www.anorteamerican.com,https://anorteamericana-ship-it.github.io').split(',').map(v => v.trim()).filter(Boolean));
const ROLE_ALLOW = new Set(['VENTAS','ASESOR','ASESORA','ADMIN','ADMINISTRADOR','SUPERADMIN','SUPER ADMIN']);
const sourceVersions = new Map();
const rateBuckets = new Map();
let queue = Promise.resolve();

class AppError extends Error {
  constructor(code, message, status = 400) { super(message); this.code = code; this.status = status; }
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const digits = v => String(v ?? '').replace(/\D/g, '');
const txt = v => String(v ?? '').trim();
const upper = v => txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
const email = v => txt(v).toLowerCase();
const sha = v => crypto.createHash('sha256').update(String(v ?? ''), 'utf8').digest('hex');
const identityHash = s => sha([txt(s?.apellido_1), txt(s?.apellido_2), txt(s?.nombre)].join('\n'));
const nowIso = () => new Date().toISOString();

function first(obj, keys) { for (const key of keys) { const value = obj?.[key]; if (value != null && txt(value) !== '') return value; } return ''; }
function campusPhone(p) { const d = digits(first(p, ['whatsapp','WHATSAPP','telefono','TELEFONO','tel1','TEL1'])); if (d.length === 11 && d.startsWith('506')) return d.slice(3); return d.slice(-8); }
function campusEmail(p) { return email(first(p, ['correo','CORREO','email','EMAIL','correo_electronico','CORREO_ELECTRONICO'])); }
function campusCedula(p) { return digits(first(p, ['cedula','CEDULA','num_cedula','NUM_CEDULA'])); }
function financing(p) { return upper(first(p, ['financiamiento','FINANCIAMIENTO','tipo_financiamiento','TIPO_FINANCIAMIENTO'])); }
function roleOf(session) { return upper(first(session, ['rol','ROL','role','ROLE','tipo_usuario','TIPO_USUARIO'])); }
function userBinding(session) { return sha([roleOf(session), txt(first(session, ['usuario','USUARIO','email','EMAIL'])), txt(first(session, ['codigo','CODIGO','cedula','CEDULA']))].join('|')); }
function validEmail(v) { const s = email(v); return !s || (s.length <= 128 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)); }
function serial(task) { const run = queue.then(task, task); queue = run.catch(() => {}); return run; }
function pruneState() { const now = Date.now(); for (const [k,v] of sourceVersions) if (!v || v.expiresAt <= now || v.consumed) sourceVersions.delete(k); for (const [k,v] of rateBuckets) if (!v || now-v.startedAt > 120000) rateBuckets.delete(k); }
function rateLimit(token) { pruneState(); const key = sha(token), now = Date.now(), current = rateBuckets.get(key); if (!current || now-current.startedAt >= 60000) { rateBuckets.set(key,{startedAt:now,count:1}); return; } current.count += 1; if (current.count > 30) throw new AppError('RATE_LIMITED','Demasiadas solicitudes. Intente de nuevo en un minuto.',429); }

async function campusCall(payload) {
  const response = await fetch(CAMPUS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),redirect:'follow',signal:AbortSignal.timeout(REQUEST_TIMEOUT_MS)});
  const raw = await response.text();
  if (!response.ok || !raw || raw.trim().startsWith('<')) throw new AppError('CAMPUS_BACKEND_UNAVAILABLE','No se pudo validar la sesión del Campus.',503);
  try { return JSON.parse(raw); } catch { throw new AppError('CAMPUS_BACKEND_INVALID','El Campus devolvió una respuesta inválida.',503); }
}

async function authorizeCampusSession(token) {
  const cleanToken = txt(token);
  if (!cleanToken) throw new AppError('CAMPUS_TOKEN_REQUIRED','Sesión de Campus requerida.',401);
  rateLimit(cleanToken);
  const session = await campusCall({fn:'validarSesion',token:cleanToken});
  if (!session?.ok) throw new AppError('CAMPUS_SESSION_INVALID','La sesión del Campus no es válida.',401);
  const role = roleOf(session);
  if (!ROLE_ALLOW.has(role)) throw new AppError('CAMPUS_ROLE_FORBIDDEN','Rol no autorizado para usar CONAPE.',403);
  if (session.demo === true || session.read_only === true) throw new AppError('CAMPUS_READ_ONLY','La cuenta es de solo lectura.',403);
  return {session,token:cleanToken,binding:userBinding(session)};
}

async function authorizeCampus(token, cedula) {
  const base = await authorizeCampusSession(token);
  const cleanCedula = digits(cedula);
  if (cleanCedula.length < 8 || cleanCedula.length > 12) throw new AppError('CEDULA_INVALID','Cédula inválida.',422);
  const detail = await campusCall({fn:'getProspectoDetalle',token:base.token,cedula:cleanCedula});
  if (!detail || detail.ok === false) throw new AppError('PROSPECT_ACCESS_DENIED','No se pudo acceder a este prospecto.',403);
  const prospecto = detail.prospecto || detail;
  if (campusCedula(prospecto) !== cleanCedula) throw new AppError('PROSPECT_CEDULA_MISMATCH','La cédula no coincide con el prospecto autorizado.',409);
  if (financing(prospecto) !== 'CONAPE') throw new AppError('PROSPECT_NOT_CONAPE','El prospecto no utiliza financiamiento CONAPE.',422);
  return {...base,prospecto,cedula:cleanCedula};
}

const ConapeSession = {
  browser:null, context:null, page:null,
  state:'DISCONNECTED', connectedAt:'', lastActivity:'', lastError:'', generation:0,
  snapshot(extra={}) { return {ok:true,status:this.state,connected:this.state==='CONNECTED',connected_at:this.connectedAt||null,last_activity:this.lastActivity||null,last_error:this.lastError||null,generation:this.generation,...extra}; },
  async close() { try { await this.context?.close(); } catch {} try { await this.browser?.close(); } catch {} this.browser=null; this.context=null; this.page=null; this.state='DISCONNECTED'; this.connectedAt=''; this.lastActivity=nowIso(); },
  async browserPage() {
    if (this.browser?.isConnected() && this.context && this.page && !this.page.isClosed()) return this.page;
    try { await this.close(); } catch {}
    this.browser = await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
    this.context = await this.browser.newContext({locale:'es-CR',timezoneId:'America/Costa_Rica'});
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(15000);
    this.browser.on('disconnected',()=>{this.browser=null;this.context=null;this.page=null;this.state='DISCONNECTED';this.lastActivity=nowIso();});
    return this.page;
  },
  async formReady(p) { return p.evaluate(()=>['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'].every(id=>!!document.getElementById(id))).catch(()=>false); },
  async authState(p) {
    return p.evaluate(()=>{
      const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
      const title=norm(document.title||'');
      const password=!!document.querySelector('input[type="password"]:not([disabled])');
      const form=['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'].every(id=>!!document.getElementById(id));
      return {password,form,authenticated:!password&&(form||title.includes('PROSPECTACION RECLUTADOR')),title,path:location.pathname};
    }).catch(()=>({password:false,form:false,authenticated:false,title:'',path:''}));
  },
  async login(p) {
    if (!CONAPE_USER || !CONAPE_PASSWORD) throw new AppError('CONAPE_CREDENTIALS_MISSING','Credenciales CONAPE no configuradas en el bridge.',503);
    let state = await this.authState(p);
    if (state.authenticated) return state;
    await p.goto(CONAPE_HOME,{waitUntil:'domcontentloaded',timeout:30000});
    state = await this.authState(p);
    if (state.authenticated) return state;
    const pass=p.locator('input[type="password"]:visible').first();
    if (!(await pass.count())) throw new AppError('CONAPE_LOGIN_FORM_NOT_FOUND','No se encontró el formulario de acceso de CONAPE.',503);
    let user=p.getByLabel(/usuario|c[eé]dula|identificaci[oó]n|user/i).first();
    if (!(await user.count())) user=p.locator('input:visible:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])').first();
    if (!(await user.count())) throw new AppError('CONAPE_LOGIN_USER_NOT_FOUND','No se encontró el campo de usuario de CONAPE.',503);
    await user.fill(CONAPE_USER); await pass.fill(CONAPE_PASSWORD);
    let login=p.getByRole('button',{name:/ingresar|iniciar sesi[oó]n|entrar|acceder|login|sign in/i}).first();
    if (await login.count()) await login.click(); else await pass.press('Enter');
    const until=Date.now()+45000;
    while(Date.now()<until){ await sleep(500); state=await this.authState(p); if(state.authenticated) return state; }
    throw new AppError('CONAPE_LOGIN_FAILED','CONAPE no confirmó la sesión del bridge.',503);
  },
  async clickRecruit(p) {
    return p.evaluate(()=>{
      const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
      const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
      const hit=Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible).find(el=>{const label=norm([el.textContent||'',el.value||'',el.getAttribute('aria-label')||'',el.getAttribute('title')||''].join(' '));return /(^| )RECLUTAR( |$)/.test(label);});
      if(!hit)return false;hit.click();return true;
    }).catch(()=>false);
  },
  async openProspecto(p) {
    if (await this.formReady(p)) return p;
    const state=await this.login(p);
    if (state.form) return p;
    const urls=[];
    try { const current=new URL(p.url()); if(current.hostname==='online.conape.go.cr'&&decodeURIComponent(current.pathname).toLowerCase().endsWith('/home')){ current.pathname=current.pathname.replace(/\/home$/i,'/prospecto'); urls.push(current.href); } } catch {}
    urls.push('https://online.conape.go.cr/apex/r/conaweb/prospectaci%C3%B3n-reclutador/prospecto');
    urls.push('https://online.conape.go.cr/apex/f?p=302:2');
    for (const url of [...new Set(urls)]) {
      try { await p.goto(url,{waitUntil:'domcontentloaded',timeout:30000}); const until=Date.now()+10000; while(Date.now()<until){ if(await this.formReady(p)) return p; const s=await this.authState(p); if(s.password) break; await sleep(350); } } catch {}
    }
    try { await p.goto(CONAPE_HOME,{waitUntil:'domcontentloaded',timeout:30000}); await this.login(p); } catch {}
    for(let i=0;i<3;i+=1){ const clicked=await this.clickRecruit(p); if(clicked){ const until=Date.now()+12000; while(Date.now()<until){ await sleep(400); if(await this.formReady(p)) return p; } } await sleep(700); }
    throw new AppError('CONAPE_PROSPECTO_NOT_READY','CONAPE está autenticado pero no pudo preparar la pantalla Prospecto.',503);
  },
  async connect() {
    if (this.state==='CONNECTED' && this.page && !this.page.isClosed()) {
      const s=await this.authState(this.page); if(s.authenticated){ this.lastActivity=nowIso(); return this.snapshot({ready:s.form?'PROSPECTO':'HOME'}); }
    }
    this.state='CONNECTING'; this.lastError=''; this.lastActivity=nowIso();
    try {
      const p=await this.browserPage(); await this.login(p); await this.openProspecto(p);
      this.state='CONNECTED'; this.connectedAt=this.connectedAt||nowIso(); this.lastActivity=nowIso(); this.lastError=''; this.generation+=1;
      return this.snapshot({ready:'PROSPECTO'});
    } catch(error){ this.state='ERROR'; this.lastError=txt(error?.code||'CONAPE_CONNECT_FAILED'); this.lastActivity=nowIso(); throw error; }
  },
  async ensureProspecto() { if(this.state!=='CONNECTED') await this.connect(); const p=await this.browserPage(); try { await this.openProspecto(p); this.state='CONNECTED'; this.lastActivity=nowIso(); return p; } catch(error){ this.state='ERROR'; this.lastError=txt(error?.code||'CONAPE_SESSION_ERROR'); throw error; } }
};

async function freshProspecto() { const p=await ConapeSession.ensureProspecto(); try { await p.reload({waitUntil:'domcontentloaded',timeout:30000}); } catch {} if (!(await ConapeSession.formReady(p))) await ConapeSession.openProspecto(p); return p; }
async function lookupState(p) { return p.evaluate(()=>{ const val=id=>String(document.getElementById(id)?.value||'').trim(); const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;}; const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim(); const nodes=Array.from(document.querySelectorAll('[role="alert"],.t-Alert,.a-Alert,.t-Body-alert,.t-Form-error,.apex-page-item-error,.t-Alert--danger,.t-Alert--warning')).filter(visible); const alertText=norm(nodes.map(n=>n.textContent||'').join(' ')); const state={cedula:val('P2_PRS_CEDULA'),apellido_1:val('P2_PRS_APELLIDO_1'),apellido_2:val('P2_PRS_APELLIDO_2'),nombre:val('P2_PRS_NOMBRE'),telefono:val('P2_PRS_CELULAR'),correo:val('P2_PRS_EMAIL'),visible_alerts:nodes.length,duplicate_warning:/YA EXIST|DUPLIC/.test(alertText)&&/CEDULA|PROSPECT/.test(alertText),validation_warning:/ERROR|INVALID|OBLIGATOR|REQUERID/.test(alertText)}; state.identity_ready=!!(state.apellido_1&&state.nombre); return state; }); }
async function lookupCedula(cedula) { const p=await freshProspecto(); await p.evaluate(value=>{ const el=document.getElementById('P2_PRS_CEDULA'); if(!el)throw new Error('cedula_field_missing'); const proto=Object.getPrototypeOf(el),desc=Object.getOwnPropertyDescriptor(proto,'value'); if(desc?.set)desc.set.call(el,value); else el.value=value; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); el.focus(); el.blur(); },cedula); const until=Date.now()+15000; let state=await lookupState(p); while(Date.now()<until&&!state.identity_ready&&!state.duplicate_warning&&!state.validation_warning){await sleep(400);state=await lookupState(p);} if(state.duplicate_warning)throw new AppError('DUPLICATE','CONAPE indica que esta cédula ya fue reclutada.',409); if(state.validation_warning&&!state.identity_ready)throw new AppError('CONAPE_VALIDATION','CONAPE mostró una validación para esta cédula.',422); if(!state.identity_ready)throw new AppError('IDENTITY_LOOKUP_FAILED','CONAPE no devolvió nombre y apellidos para esta cédula.',422); ConapeSession.lastActivity=nowIso(); return {p,state}; }
function contactPlan(campus,conape){ const phone=campusPhone(campus),mail=campusEmail(campus),conapePhone=digits(conape?.telefono).slice(-8),conapeMail=email(conape?.correo); if(phone&&phone.length!==8)throw new AppError('CONTACT_VALIDATION_FAILED','El WhatsApp del Campus no tiene 8 dígitos.',422); if(!validEmail(mail))throw new AppError('CONTACT_VALIDATION_FAILED','El correo del Campus no es válido.',422); return {telefono:phone||conapePhone,correo:mail||conapeMail,update_telefono:!!phone&&phone!==conapePhone,update_correo:!!mail&&mail!==conapeMail}; }
async function fillContacts(p,plan){ if(plan.update_telefono)await p.locator('#P2_PRS_CELULAR').fill(plan.telefono); if(plan.update_correo)await p.locator('#P2_PRS_EMAIL').fill(plan.correo); const state=await lookupState(p); if(!state.identity_ready)throw new AppError('IDENTITY_LOOKUP_FAILED','La identidad CONAPE dejó de estar disponible antes de crear.',409); if(plan.telefono&&digits(state.telefono).slice(-8)!==plan.telefono)throw new AppError('CONTACT_VALIDATION_FAILED','El teléfono no quedó aplicado en el formulario CONAPE.',422); if(plan.correo&&email(state.correo)!==plan.correo)throw new AppError('CONTACT_VALIDATION_FAILED','El correo no quedó aplicado en el formulario CONAPE.',422); return state; }
async function clickCreateOnce(p){ const createRequests=[]; const onRequest=req=>{try{const u=new URL(req.url());if(req.method()!=='POST'||!u.pathname.endsWith('/apex/wwv_flow.accept'))return;const params=new URLSearchParams(String(req.postData()||''));if(upper(params.get('p_request'))==='CREATE')createRequests.push({request:'CREATE'});}catch{}}; p.on('request',onRequest); try{ const clicked=await p.evaluate(()=>{const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};const hit=Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible).find(el=>norm([el.textContent||'',el.value||'',el.getAttribute('aria-label')||'',el.getAttribute('title')||''].join(' ')).includes('CREAR NUEVO PROSPECTO'));if(!hit)return false;hit.click();return true;}); if(!clicked)throw new AppError('CREATE_BUTTON_NOT_FOUND','No se encontró Crear nuevo Prospecto.',503); const until=Date.now()+20000; let outcome=null; while(Date.now()<until){await sleep(500);outcome=await p.evaluate(()=>{const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();const nodes=Array.from(document.querySelectorAll('[role="alert"],.t-Alert,.a-Alert,.t-Body-alert,.t-Form-error,.apex-page-item-error')).filter(visible);const text=norm(nodes.map(n=>n.textContent||'').join(' '));return{success_message:/CREAD|REGISTRAD|GUARDAD|CORRECTAMENTE|EXITOS/.test(text)&&!/ERROR|INVALID/.test(text),duplicate_message:/YA EXIST|DUPLIC/.test(text),error_message:/ERROR|INVALID|OBLIGATOR|REQUERID/.test(text),visible_alerts:nodes.length};}).catch(()=>null);if(outcome?.success_message||outcome?.duplicate_message||outcome?.error_message)break;} return {createCount:createRequests.length,outcome:outcome||{}}; } finally {p.off('request',onRequest);} }
async function readEstadoAfterCreate(p,cedula){ try{const back=p.getByRole('button',{name:/regresar/i}).first();if(await back.count())await back.click();else await p.goto(CONAPE_HOME,{waitUntil:'domcontentloaded',timeout:30000});await sleep(1000);await ConapeSession.login(p);const search=p.locator('input[type="search"]:visible,input[id$="_search_field"]:visible').first();if(!(await search.count()))return '';await search.fill(cedula);const go=p.getByRole('button',{name:/^go$/i}).first();if(await go.count())await go.click();else await search.press('Enter');await sleep(1500);return await p.evaluate(value=>{const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();const clean=v=>String(v||'').replace(/\D/g,'');for(const table of document.querySelectorAll('table')){const headers=Array.from(table.querySelectorAll('thead th')).map(th=>norm(th.textContent));const iCed=headers.findIndex(h=>h==='CEDULA'||h.includes('CEDULA'));const iEstado=headers.findIndex(h=>h==='ESTADO');if(iCed<0||iEstado<0)continue;for(const tr of table.querySelectorAll('tbody tr')){const cells=Array.from(tr.querySelectorAll('td'));if(cells.length<=Math.max(iCed,iEstado))continue;if(clean(cells[iCed].textContent)===value)return String(cells[iEstado].textContent||'').trim();}}return '';},cedula);}catch{return '';} }

async function preview(body){ const auth=await authorizeCampus(body?.token,body?.cedula); const {state}=await lookupCedula(auth.cedula); const plan=contactPlan(auth.prospecto,state); pruneState(); const token=crypto.randomBytes(24).toString('base64url'); sourceVersions.set(token,{cedula:auth.cedula,binding:auth.binding,identityHash:identityHash(state),expiresAt:Date.now()+SOURCE_TTL_MS,consumed:false}); return {ok:true,found:true,prospecto:{cedula:auth.cedula,apellido_1:state.apellido_1,apellido_2:state.apellido_2,nombre:state.nombre,telefono:state.telefono,correo:state.correo},source_version:token,source_expires_at:new Date(Date.now()+SOURCE_TTL_MS).toISOString(),can_submit:true,contact_plan:{update_telefono:plan.update_telefono,update_correo:plan.update_correo},identity_source:'CONAPE_CEDULA_LOOKUP',conape_session:ConapeSession.snapshot()}; }
async function submit(body){ const forbidden=['nombre','apellido_1','apellido_2','P2_PRS_NOMBRE','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2']; const prospectoBody=body?.prospecto&&typeof body.prospecto==='object'?body.prospecto:{}; if(forbidden.some(k=>Object.prototype.hasOwnProperty.call(prospectoBody,k)))throw new AppError('IDENTITY_FIELDS_FORBIDDEN','Nombre y apellidos no pueden enviarse desde Campus.',422); const auth=await authorizeCampus(body?.token,body?.cedula||prospectoBody.cedula); const source=sourceVersions.get(txt(body?.source_version)); if(!source)throw new AppError('SOURCE_VERSION_REQUIRED','Debe volver a consultar la cédula antes de enviar.',409); if(source.consumed)throw new AppError('SOURCE_VERSION_USED','Esta previsualización ya fue utilizada.',409); if(source.expiresAt<=Date.now()){sourceVersions.delete(txt(body?.source_version));throw new AppError('SOURCE_VERSION_EXPIRED','La consulta venció; vuelva a consultar la cédula.',409);} if(source.cedula!==auth.cedula)throw new AppError('CEDULA_MISMATCH','La cédula cambió desde la consulta.',409); if(source.binding!==auth.binding)throw new AppError('SOURCE_VERSION_OWNER_MISMATCH','La consulta pertenece a otra sesión.',403); source.consumed=true; const sourceKey=txt(body?.source_version); try{const {p,state}=await lookupCedula(auth.cedula);if(identityHash(state)!==source.identityHash)throw new AppError('IDENTITY_CHANGED','La identidad devuelta por CONAPE cambió; vuelva a consultar.',409);const plan=contactPlan(auth.prospecto,state);const afterFill=await fillContacts(p,plan);if(identityHash(afterFill)!==source.identityHash)throw new AppError('IDENTITY_CHANGED','La identidad CONAPE cambió antes del envío.',409);const created=await clickCreateOnce(p),outcome=created.outcome||{};if(created.createCount!==1)throw new AppError('WRITE_RESULT_UNCERTAIN','No se pudo confirmar una única solicitud CREATE. No repita el envío.',409);if(outcome.duplicate_message)throw new AppError('DUPLICATE','CONAPE indicó que el prospecto ya existe.',409);if(outcome.error_message)throw new AppError('PORTAL_ERROR','CONAPE rechazó la creación.',422);if(!outcome.success_message)throw new AppError('WRITE_RESULT_UNCERTAIN','CONAPE recibió CREATE pero no confirmó el resultado. No repita el envío.',409);const estado=await readEstadoAfterCreate(p,auth.cedula);ConapeSession.lastActivity=nowIso();return{ok:true,confirmed:true,code:'CREATED',create_request_observed:true,write_count:1,success_signal:true,estado_conape_raw:estado,conape_session:ConapeSession.snapshot()};}finally{sourceVersions.delete(sourceKey);} }

function corsHeaders(origin){return origin&&ALLOWED_ORIGINS.has(origin)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}:{}}
function sendJson(res,status,data,origin=''){const body=JSON.stringify(data);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(body),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...corsHeaders(origin)});res.end(body);}
function readJson(req,max=32768){return new Promise((resolve,reject)=>{const chunks=[];let size=0;req.on('data',chunk=>{size+=chunk.length;if(size>max){reject(new AppError('BODY_TOO_LARGE','Solicitud demasiado grande.',413));req.destroy();return;}chunks.push(chunk);});req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}'));}catch{reject(new AppError('BAD_JSON','JSON inválido.',400));}});req.on('error',reject);});}

const server=http.createServer(async(req,res)=>{const rid=crypto.randomBytes(8).toString('hex'),started=Date.now(),origin=txt(req.headers.origin);let action='unknown';try{const url=new URL(req.url||'/',`http://127.0.0.1:${PORT}`);if(req.method==='GET'&&url.pathname==='/health'){sendJson(res,200,{ok:true,service:'CONAPE_PORTAL_BRIDGE',version:'C3.7',session:ConapeSession.snapshot(),time:nowIso()});return;}if(origin&&!ALLOWED_ORIGINS.has(origin))throw new AppError('ORIGIN_FORBIDDEN','Origen no autorizado.',403);if(req.method==='OPTIONS'){if(!origin||!ALLOWED_ORIGINS.has(origin))throw new AppError('ORIGIN_FORBIDDEN','Origen no autorizado.',403);res.writeHead(204,corsHeaders(origin));res.end();return;}if(req.method!=='POST')throw new AppError('METHOD_NOT_ALLOWED','Método no permitido.',405);const body=await readJson(req);let run;if(url.pathname==='/v1/session/status'){action='session_status';run=async()=>{await authorizeCampusSession(body?.token);return ConapeSession.snapshot();};}else if(url.pathname==='/v1/session/connect'){action='session_connect';run=async()=>{await authorizeCampusSession(body?.token);return ConapeSession.connect();};}else if(url.pathname==='/v1/session/disconnect'){action='session_disconnect';run=async()=>{await authorizeCampusSession(body?.token);await ConapeSession.close();return ConapeSession.snapshot();};}else if(url.pathname==='/v1/recruit/preview'){action='preview';run=()=>preview(body);}else if(url.pathname==='/v1/recruit/submit'){action='submit';run=()=>submit(body);}else throw new AppError('NOT_FOUND','Ruta no encontrada.',404);const result=await serial(run);console.log(JSON.stringify({rid,action,result:result.code||result.status||'OK',ms:Date.now()-started,pii:false}));sendJson(res,200,result,origin);}catch(error){const status=Number(error?.status||500),code=txt(error?.code||'BRIDGE_ERROR');console.log(JSON.stringify({rid,action,result:code,status,ms:Date.now()-started,pii:false}));sendJson(res,status,{ok:false,error:code,message:status>=500?'Servicio CONAPE temporalmente no disponible.':txt(error?.message||'Operación rechazada.'),session:ConapeSession.snapshot()},origin);}});
server.listen(PORT,'0.0.0.0',()=>console.log(JSON.stringify({event:'bridge_ready',version:'C3.7',port:PORT,pii:false})));

const keepalive=setInterval(()=>{if(ConapeSession.state!=='CONNECTED')return;serial(async()=>{try{const p=await ConapeSession.browserPage();const s=await ConapeSession.authState(p);if(!s.authenticated){await ConapeSession.connect();console.log(JSON.stringify({event:'conape_session_reconnected',pii:false}));}else{ConapeSession.lastActivity=nowIso();}}catch(error){ConapeSession.state='ERROR';ConapeSession.lastError=txt(error?.code||'KEEPALIVE_FAILED');console.log(JSON.stringify({event:'conape_keepalive_failed',code:ConapeSession.lastError,pii:false}));}});},KEEPALIVE_MS);keepalive.unref();
async function shutdown(){clearInterval(keepalive);try{await ConapeSession.close();}catch{}server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),5000).unref();}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
