import fs from 'node:fs/promises';

/* C3.7.8 · contexto APEX verificado después de Reclutar Prospectos
   - compone C3.7.7 y conserva su secuencia Home -> click real -> formulario fresco -> lookup -> CREATE
   - deja de exigir Prospectador/Evento como controles visibles en Home
   - verifica contexto sobre el formulario resultante por presencia no-cero de IDs APEX, sin registrar valores
   - no toca source_version, AbortSignal, cola serial, identidad ni reglas de correo
*/
const builderUrl = new URL('./server_c3_7_7.mjs', import.meta.url);
const buildOnlyUrl = new URL('./server_c3_7_7_build_only.mjs', import.meta.url);
const priorRuntimeUrl = new URL('./server_c3_7_7_runtime.mjs', import.meta.url);
const runtimeUrl = new URL('./server_c3_7_8_runtime.mjs', import.meta.url);

let builder = await fs.readFile(builderUrl, 'utf8');
const runMarker = 'await import(`${runtimeUrl.href}?v=${Date.now()}`);';
if (!builder.includes(runMarker)) throw new Error('C3_7_8_BUILDER_CONTRACT_MISMATCH');
builder = builder.replace(runMarker, '');
await fs.writeFile(buildOnlyUrl, builder, 'utf8');
await import(`${buildOnlyUrl.href}?build=${Date.now()}`);

let source = await fs.readFile(priorRuntimeUrl, 'utf8');
function replaceBlock(startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) throw new Error(`C3_7_8_${label}_CONTRACT_MISMATCH`);
  source = source.slice(0, start) + replacement + '\n' + source.slice(end);
}

const newFreshHelper = `async function conapeProspectoContextReady(p){
  return p.evaluate(()=>{
    const nonZero=v=>{const s=String(v??'').trim();return !!s&&s!=='0';};
    const byId=ids=>ids.some(id=>{const el=document.getElementById(id);if(!el)return false;return nonZero('value' in el?el.value:el.textContent);});
    try{
      const u=new URL(location.href);
      const evento=nonZero(u.searchParams.get('p2_eve_id'))||byId(['P2_EVE_ID','P2_PRS_EVE_ID','P2_EVENTO_ID']);
      const prospectador=nonZero(u.searchParams.get('p2_pro_id'))||byId(['P2_PRO_ID','P2_PRS_PRO_ID','P2_PROSPECTADOR_ID']);
      return {evento,prospectador};
    }catch{
      return {evento:byId(['P2_EVE_ID','P2_PRS_EVE_ID','P2_EVENTO_ID']),prospectador:byId(['P2_PRO_ID','P2_PRS_PRO_ID','P2_PROSPECTADOR_ID'])};
    }
  }).catch(()=>({evento:false,prospectador:false}));
}

async function freshProspectoFromHome(){
  const p=await ConapeSession.browserPage();
  await p.goto(CONAPE_HOME,{waitUntil:'domcontentloaded',timeout:30000});
  await ConapeSession.login(p);
  const clicked=await ConapeSession.clickRecruit(p);
  if(!clicked)throw new AppError('CONAPE_RECRUIT_BUTTON_NOT_FOUND','No se encontró Reclutar Prospectos en la pantalla principal.',503);
  const until=Date.now()+12000;
  while(Date.now()<until){
    await sleep(250);
    if(await ConapeSession.formReady(p)){
      const context=await conapeProspectoContextReady(p);
      if(!context.prospectador||!context.evento)throw new AppError('CONAPE_PROSPECTO_CONTEXT_NOT_READY','CONAPE abrió Prospecto sin confirmar Evento y Prospectador.',503);
      markProspectoEntry(p,'HOME_CLICK_RECRUIT');
      return p;
    }
  }
  throw new AppError('CONAPE_PROSPECTO_NOT_READY','CONAPE no renderizó un formulario nuevo de Prospecto.',503);
}`;
replaceBlock('async function freshProspectoFromHome(){', '\n\nasync function freshProspecto() {', newFreshHelper, 'FRESH_PROSPECTO_CONTEXT');

const newOpenProspecto = `  async openProspecto(p) {
    await this.login(p);
    let homeHref='';
    try{
      await p.goto(CONAPE_HOME,{waitUntil:'domcontentloaded',timeout:30000});
      await this.login(p);
      homeHref=p.url();
      const clicked=await this.clickRecruit(p);
      if(clicked){
        const until=Date.now()+12000;
        while(Date.now()<until){
          await sleep(250);
          if(await this.formReady(p)){
            const context=await conapeProspectoContextReady(p);
            if(context.prospectador&&context.evento){markProspectoEntry(p,'HOME_CLICK_RECRUIT');return p;}
            break;
          }
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
          if(await this.formReady(p)){
            const context=await conapeProspectoContextReady(p);
            if(context.prospectador&&context.evento){markProspectoEntry(p,entryByUrl.get(url)||'DIRECT_BARE');return p;}
            break;
          }
          const state=await this.authState(p);if(state.password)break;await sleep(350);
        }
      }catch{}
    }
    throw new AppError('CONAPE_PROSPECTO_NOT_READY','CONAPE está autenticado pero no pudo preparar Prospecto con contexto de Evento y Prospectador.',503);
  },`;
replaceBlock('  async openProspecto(p) {', '  async connect() {', newOpenProspecto, 'OPEN_PROSPECTO_CONTEXT');

source=source.replaceAll("version:'C3.7.7'","version:'C3.7.8'");
await fs.writeFile(runtimeUrl, source, 'utf8');
console.log(JSON.stringify({event:'bridge_context_after_recruit_patch',version:'C3.7.8',home_precontext_gate:false,prospecto_context_verified:true,context_values_logged:false,submit_fresh_home_click:true,real_recruit_click:true,telemetry_preserved:true,pii:false}));
await import(`${runtimeUrl.href}?v=${Date.now()}`);
