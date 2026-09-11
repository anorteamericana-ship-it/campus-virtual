import fs from 'node:fs/promises';

/* C3.7.7 · submit CONAPE desde formulario fresco
   - compone C3.7.6 sin desmontar su replaceBlock
   - cada submit abre Home, verifica contexto, pulsa Reclutar Prospectos y renderiza formulario nuevo
   - clickRecruit usa click real de Playwright
   - conserva telemetría C3.7.6 y sus invariantes de identidad/contacto
*/
const builderUrl = new URL('./server_c3_7_5.mjs', import.meta.url);
const buildOnlyUrl = new URL('./server_c3_7_6_build_only.mjs', import.meta.url);
const priorRuntimeUrl = new URL('./server_c3_7_6_runtime.mjs', import.meta.url);
const runtimeUrl = new URL('./server_c3_7_7_runtime.mjs', import.meta.url);

let builder = await fs.readFile(builderUrl, 'utf8');
const runMarker = 'await import(`${runtimeUrl.href}?v=${Date.now()}`);';
if (!builder.includes(runMarker)) throw new Error('C3_7_7_BUILDER_CONTRACT_MISMATCH');
builder = builder.replace(runMarker, '');
await fs.writeFile(buildOnlyUrl, builder, 'utf8');
await import(`${buildOnlyUrl.href}?build=${Date.now()}`);

let source = await fs.readFile(priorRuntimeUrl, 'utf8');
function replaceBlock(startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) throw new Error(`C3_7_7_${label}_CONTRACT_MISMATCH`);
  source = source.slice(0, start) + replacement + '\n' + source.slice(end);
}

const newClickRecruit = `  async clickRecruit(p) {
    const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
    const candidates=[
      p.getByRole('button',{name:/reclutar prospectos/i}).first(),
      p.getByRole('link',{name:/reclutar prospectos/i}).first()
    ];
    for(const candidate of candidates){
      try{if(await candidate.count()&&await candidate.isVisible()){await candidate.click({timeout:15000});return true;}}catch{}
    }
    const interactive=p.locator('button,a,[role="button"],input[type="button"],input[type="submit"]');
    const count=Math.min(await interactive.count(),120);
    for(let i=0;i<count;i+=1){
      const candidate=interactive.nth(i);
      try{
        if(!(await candidate.isVisible()))continue;
        const label=await candidate.evaluate(el=>[el.textContent||'',el.value||'',el.getAttribute('aria-label')||'',el.getAttribute('title')||''].join(' '));
        if(!norm(label).includes('RECLUTAR PROSPECTOS'))continue;
        await candidate.click({timeout:15000});
        return true;
      }catch{}
    }
    return false;
  },`;
replaceBlock('  async clickRecruit(p) {', '  async openProspecto(p) {', newClickRecruit, 'CLICK_RECRUIT');

const contextHelpers = `async function conapeHomeContextReady(p){
  return p.evaluate(()=>{
    const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
    const hasValue=el=>{
      if(!el)return false;
      const tag=String(el.tagName||'').toUpperCase();
      if(tag==='SELECT'){
        const value=String(el.value||'').trim();
        const option=norm(el.selectedOptions?.[0]?.textContent||'');
        return !!value|| (!!option&&!/SELECCIONE|SELECCIONAR|SELECT/.test(option));
      }
      if('value' in el&&String(el.value||'').trim())return true;
      const rendered=el.querySelector?.('.select2-selection__rendered,.apex-item-display-only,.display_only,[role="combobox"]');
      const text=norm(rendered?.textContent||el.textContent||'');
      return !!text&&!/SELECCIONE|SELECCIONAR|SELECT/.test(text);
    };
    const ready=target=>{
      const labels=Array.from(document.querySelectorAll('label,.t-Form-label,[class*="label"]')).filter(el=>norm(el.textContent||'').includes(target));
      for(const label of labels){
        const forId=label.htmlFor||label.getAttribute('for')||'';
        if(forId&&hasValue(document.getElementById(forId)))return true;
        const scope=label.closest('.t-Form-fieldContainer,.t-Form-inputContainer,.form-group')||label.parentElement;
        if(scope){
          const controls=Array.from(scope.querySelectorAll('select,input,textarea,[role="combobox"],.select2-selection__rendered,.apex-item-display-only,.display_only'));
          if(controls.some(hasValue))return true;
          const residual=norm(scope.textContent||'').replace(target,'').trim();
          if(residual&&!/SELECCIONE|SELECCIONAR|SELECT/.test(residual))return true;
        }
      }
      const named=Array.from(document.querySelectorAll('[id],[name]')).filter(el=>norm((el.id||'')+' '+(el.getAttribute('name')||'')).includes(target));
      return named.some(hasValue);
    };
    return {prospectador:ready('PROSPECTADOR'),evento:ready('EVENTO')};
  }).catch(()=>({prospectador:false,evento:false}));
}

async function freshProspectoFromHome(){
  const p=await ConapeSession.browserPage();
  await p.goto(CONAPE_HOME,{waitUntil:'domcontentloaded',timeout:30000});
  await ConapeSession.login(p);
  const context=await conapeHomeContextReady(p);
  if(!context.prospectador||!context.evento)throw new AppError('CONAPE_HOME_CONTEXT_NOT_READY','CONAPE no confirmó Prospectador y Evento en la pantalla principal.',503);
  const clicked=await ConapeSession.clickRecruit(p);
  if(!clicked)throw new AppError('CONAPE_RECRUIT_BUTTON_NOT_FOUND','No se encontró Reclutar Prospectos en la pantalla principal.',503);
  const until=Date.now()+12000;
  while(Date.now()<until){
    await sleep(250);
    if(await ConapeSession.formReady(p)){markProspectoEntry(p,'HOME_CLICK_RECRUIT');return p;}
  }
  throw new AppError('CONAPE_PROSPECTO_NOT_READY','CONAPE no renderizó un formulario nuevo de Prospecto.',503);
}`;
if(!source.includes('async function freshProspecto() {'))throw new Error('C3_7_7_FRESH_HELPER_CONTRACT_MISMATCH');
source=source.replace('async function freshProspecto() {',contextHelpers+'\n\nasync function freshProspecto() {');

const newOpenProspecto = `  async openProspecto(p) {
    await this.login(p);
    let homeHref='';
    try{
      await p.goto(CONAPE_HOME,{waitUntil:'domcontentloaded',timeout:30000});
      await this.login(p);
      homeHref=p.url();
      const context=await conapeHomeContextReady(p);
      if(context.prospectador&&context.evento){
        const clicked=await this.clickRecruit(p);
        if(clicked){
          const until=Date.now()+12000;
          while(Date.now()<until){await sleep(250);if(await this.formReady(p)){markProspectoEntry(p,'HOME_CLICK_RECRUIT');return p;}}
        }
      }
    }catch{}

    const urls=[],entryByUrl=new Map();
    try{
      const current=new URL(homeHref||p.url());
      if(current.hostname==='online.conape.go.cr'&&decodeURIComponent(current.pathname).toLowerCase().endsWith('/home')){
        current.pathname=current.pathname.replace(/\\/home$/i,'/prospecto');
        urls.push(current.href);entryByUrl.set(current.href,'HOME_DERIVED');
      }
    }catch{}
    const directBare='https://online.conape.go.cr/apex/r/conaweb/prospectaci%C3%B3n-reclutador/prospecto';
    const legacy='https://online.conape.go.cr/apex/f?p=302:2';
    urls.push(directBare);entryByUrl.set(directBare,'DIRECT_BARE');
    urls.push(legacy);entryByUrl.set(legacy,'F_P_302_2');
    for(const url of [...new Set(urls)]){
      try{
        await p.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
        const until=Date.now()+10000;
        while(Date.now()<until){
          if(await this.formReady(p)){markProspectoEntry(p,entryByUrl.get(url)||'DIRECT_BARE');return p;}
          const state=await this.authState(p);if(state.password)break;await sleep(350);
        }
      }catch{}
    }
    throw new AppError('CONAPE_PROSPECTO_NOT_READY','CONAPE está autenticado pero no pudo preparar la pantalla Prospecto.',503);
  },`;
replaceBlock('  async openProspecto(p) {', '  async connect() {', newOpenProspecto, 'OPEN_PROSPECTO');

const newLookup = `async function lookupCedulaOnPage(p,cedula){
  await p.evaluate(value=>{
    const el=document.getElementById('P2_PRS_CEDULA');
    if(!el)throw new Error('cedula_field_missing');
    const proto=Object.getPrototypeOf(el),desc=Object.getOwnPropertyDescriptor(proto,'value');
    if(desc?.set)desc.set.call(el,value);else el.value=value;
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    el.focus();el.blur();
  },cedula);
  const until=Date.now()+15000;
  let state=await lookupState(p);
  while(Date.now()<until&&!state.identity_ready&&!state.duplicate_warning&&!state.validation_warning){await sleep(400);state=await lookupState(p);}
  if(state.duplicate_warning)throw new AppError('DUPLICATE','CONAPE indica que esta cédula ya fue reclutada.',409);
  if(state.validation_warning&&!state.identity_ready)throw new AppError('CONAPE_VALIDATION','CONAPE mostró una validación para esta cédula.',422);
  if(!state.identity_ready)throw new AppError('IDENTITY_LOOKUP_FAILED','CONAPE no devolvió nombre y apellidos para esta cédula.',422);
  ConapeSession.lastActivity=nowIso();
  return {p,state};
}
async function lookupCedula(cedula){const p=await freshProspecto();return lookupCedulaOnPage(p,cedula);}`;
replaceBlock('async function lookupCedula(', 'function contactPlan(', newLookup, 'LOOKUP_CEDULA');

const oldSubmitLookup='try{const {p,state}=await lookupCedula(auth.cedula);';
const newSubmitLookup='try{const p=await freshProspectoFromHome();const {state}=await lookupCedulaOnPage(p,auth.cedula);';
if(!source.includes(oldSubmitLookup))throw new Error('C3_7_7_SUBMIT_FRESH_PAGE_CONTRACT_MISMATCH');
source=source.replace(oldSubmitLookup,newSubmitLookup).replaceAll("version:'C3.7.6'","version:'C3.7.7'");

await fs.writeFile(runtimeUrl, source, 'utf8');
console.log(JSON.stringify({event:'bridge_fresh_submit_patch',version:'C3.7.7',submit_fresh_home_click:true,real_recruit_click:true,home_context_verified:true,telemetry_preserved:true,pii:false}));
await import(`${runtimeUrl.href}?v=${Date.now()}`);
