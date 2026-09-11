import { chromium } from 'playwright';

const HOME = String(process.env.CONAPE_PORTAL_HOME_URL || 'https://online.conape.go.cr/apex/f?p=302:1').trim();
const FRIENDLY_HOME = 'https://online.conape.go.cr/apex/r/conaweb/prospectaci%C3%B3n-reclutador/home';
const USER = String(process.env.CONAPE_PORTAL_USERNAME || '');
const PASS = String(process.env.CONAPE_PORTAL_PASSWORD || '');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();

async function readApexSession(p) {
  return p.evaluate(() => {
    const clean = value => /^\d{4,}$/.test(String(value ?? '').trim()) ? String(value).trim() : '';
    try {
      const u = new URL(location.href);
      const friendly = clean(u.searchParams.get('session'));
      if (friendly) return friendly;
      const legacy = String(u.searchParams.get('p') || '').split(':');
      const fromLegacy = clean(legacy[2]);
      if (fromLegacy) return fromLegacy;
    } catch {}
    for (const node of [document.querySelector('input[name="p_instance"]'),document.querySelector('input[name="pInstance"]'),document.getElementById('pInstance')]) {
      const value = clean(node?.value);
      if (value) return value;
    }
    return '';
  }).catch(()=> '');
}

async function authState(p) {
  return p.evaluate(() => {
    const n = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
    const visible = el => { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; };
    const cleanSession = value => /^\d{4,}$/.test(String(value ?? '').trim());
    const password = Array.from(document.querySelectorAll('input[type="password"]')).some(visible);
    const ids=['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'];
    const form=ids.every(id=>!!document.getElementById(id));
    const path=decodeURIComponent(location.pathname||'').toLowerCase();
    const title=n(document.title||'');
    const route=path.includes('/prospectacion-reclutador/') || (path.includes('/prospectaci')&&path.includes('reclutador'));
    let sessionPresent=false;
    try {
      const u=new URL(location.href);
      sessionPresent=cleanSession(u.searchParams.get('session'));
      if(!sessionPresent) sessionPresent=cleanSession(String(u.searchParams.get('p')||'').split(':')[2]);
    } catch {}
    if(!sessionPresent) sessionPresent=[document.querySelector('input[name="p_instance"]'),document.querySelector('input[name="pInstance"]'),document.getElementById('pInstance')].some(node=>cleanSession(node?.value));
    return {password,form,route,sessionPresent,authenticated:!password&&(form||(sessionPresent&&(route||title.includes('PROSPECTACION RECLUTADOR'))))};
  }).catch(()=>({password:false,form:false,route:false,sessionPresent:false,authenticated:false}));
}

async function login(p) {
  let state=await authState(p);
  if(state.authenticated)return state;
  await p.goto(HOME,{waitUntil:'domcontentloaded',timeout:30000});
  state=await authState(p);
  if(state.authenticated)return state;
  const pass=p.locator('input[type="password"]:visible').first();
  if(!(await pass.count()))throw new Error('LOGIN_FORM_NOT_FOUND');
  let user=p.getByLabel(/usuario|c[eé]dula|identificaci[oó]n|user/i).first();
  if(!(await user.count()))user=p.locator('input:visible:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])').first();
  if(!(await user.count()))throw new Error('LOGIN_USER_NOT_FOUND');
  await user.fill(USER);
  await pass.fill(PASS);
  let button=p.getByRole('button',{name:/ingresar|iniciar sesi[oó]n|entrar|acceder|login|sign in/i}).first();
  if(await button.count())await button.click();else await pass.press('Enter');
  const until=Date.now()+45000;
  while(Date.now()<until){await sleep(500);state=await authState(p);if(state.authenticated)return state;}
  throw new Error('LOGIN_FAILED');
}

async function homeWithSession(p) {
  let state=await authState(p);
  if(!state.authenticated) state=await login(p);
  const session=await readApexSession(p);
  if(!session) throw new Error('APEX_SESSION_MISSING');
  const u=new URL(FRIENDLY_HOME);
  u.searchParams.set('session',session);
  await p.goto(u.href,{waitUntil:'domcontentloaded',timeout:30000});
  state=await authState(p);
  const after=await readApexSession(p);
  if(!state.authenticated||!after) throw new Error('HOME_SESSION_LOST');
  return state;
}

async function inspectCandidates(p) {
  let labelCount=0;
  let contextCount=0;
  let visibleContextCount=0;
  for(const frame of p.frames()){
    const part=await frame.evaluate(()=>{
      const n=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
      const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
      const controls=Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]'));
      const labels=controls.filter(el=>visible(el)&&/(^| )RECLUTAR( |$)/.test(n([el.textContent||'',el.value||'',el.getAttribute('aria-label')||'',el.getAttribute('title')||''].join(' ')))).length;
      const links=Array.from(document.querySelectorAll('a[href]')).filter(el=>{
        const href=String(el.getAttribute('href')||'');
        return /prospecto/i.test(href)&&/(?:\?|&)p2_eve_id=/i.test(href)&&/(?:\?|&)p2_pro_id=/i.test(href);
      });
      return {labels,contexts:links.length,visibleContexts:links.filter(visible).length};
    }).catch(()=>({labels:0,contexts:0,visibleContexts:0}));
    labelCount+=part.labels;contextCount+=part.contexts;visibleContextCount+=part.visibleContexts;
  }
  return {labelCount,contextCount,visibleContextCount,frames:p.frames().length};
}

async function clickRecruit(p) {
  const selector='button,a,[role="button"],input[type="button"],input[type="submit"]';
  const deadline=Date.now()+15000;
  while(Date.now()<deadline){
    for(const frame of p.frames()){
      const items=frame.locator(selector);
      const index=await items.evaluateAll((nodes,source)=>{
        const re=new RegExp(source,'i');
        const n=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
        const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
        return nodes.findIndex(el=>visible(el)&&re.test(n([el.textContent||'',el.value||'',el.getAttribute('aria-label')||'',el.getAttribute('title')||''].join(' '))));
      },'(^| )RECLUTAR( |$)').catch(()=>-1);
      if(index>=0){await items.nth(index).click({timeout:15000});return 'LABEL';}
    }
    for(const frame of p.frames()){
      const links=frame.locator('a[href]');
      const index=await links.evaluateAll(nodes=>{
        const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
        return nodes.findIndex(el=>{if(!visible(el))return false;const href=String(el.getAttribute('href')||'');return /prospecto/i.test(href)&&/(?:\?|&)p2_eve_id=/i.test(href)&&/(?:\?|&)p2_pro_id=/i.test(href);});
      }).catch(()=>-1);
      if(index>=0){await links.nth(index).click({timeout:15000});return 'CONTEXT_LINK';}
    }
    await sleep(250);
  }
  return 'NONE';
}

const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
const context=await browser.newContext({locale:'es-CR',timezoneId:'America/Costa_Rica'});
const page=await context.newPage();
page.setDefaultTimeout(15000);
try{
  if(!USER||!PASS)throw new Error('CREDENTIALS_MISSING');
  await login(page);
  await homeWithSession(page);
  const candidates=await inspectCandidates(page);
  const method=await clickRecruit(page);
  let form=false;
  const until=Date.now()+15000;
  while(Date.now()<until){await sleep(250);form=(await authState(page)).form;if(form)break;}
  console.log(JSON.stringify({event:'conape_nav_selftest',result:form?'PASS':'FAIL',method,candidate_label_count:candidates.labelCount,context_link_count:candidates.contextCount,visible_context_link_count:candidates.visibleContextCount,frame_count:candidates.frames,form_ready:form,session_param_present:true,pii:false}));
}catch(error){
  console.log(JSON.stringify({event:'conape_nav_selftest',result:'FAIL',code:norm(error?.message||'SELFTEST_ERROR').replace(/[^A-Z0-9_]/g,'').slice(0,64)||'SELFTEST_ERROR',pii:false}));
}finally{
  try{await context.close();}catch{}
  try{await browser.close();}catch{}
}
