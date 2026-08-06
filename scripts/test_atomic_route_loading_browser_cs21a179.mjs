import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4177';
const browserPath = String(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '').trim();
const outDir = path.join(process.cwd(), 'qa-output', 'atomic-route-loading-cs21a179');
fs.mkdirSync(outDir, { recursive:true });

const sessions = {
  student: {
    rol:'student', tipoUsuario:'estudiante', nombre:'QA ESTUDIANTE CONTROLADO',
    codigo:'QA-STUDENT-001', cedula:'QA-CED-STU-001', correo:'qa.student@anorteamericana.test',
    grupo:'SJ01-B1-LM69-QA', cod_grupo:'SJ01-B1-LM69-QA', nivel_activo:'B1', estatus_activo:'CA',
    niveles_estatus:{B1:'CA',B2:'',I1:'',I2:''}, token:'qa-readonly-token', expira:'2099-12-31T23:59:59.000Z',
  },
  teacher: {
    rol:'teacher', tipoUsuario:'docente', nombre:'QA DOCENTE CONTROLADO',
    usuario:'qa_docente', cedula:'QA-CED-DOC-001', correo:'qa.docente@anorteamericana.test',
    grupo:'SJ01-B1-LM69-QA', grupoActivo:'SJ01-B1-LM69-QA', grupos:['SJ01-B1-LM69-QA'],
    programa:'SIN_INA', token:'qa-readonly-token', expira:'2099-12-31T23:59:59.000Z',
  },
  superadmin: {
    rol:'superadmin', tipoUsuario:'superadmin', nombre:'QA SUPERADMIN CONTROLADO',
    usuario:'qa_superadmin', cedula:'QA-CED-ADM-001', permisos:['*'],
    token:'qa-readonly-token', expira:'2099-12-31T23:59:59.000Z',
  },
};

function mockPayload(fn, session) {
  const common = {
    ok:true, qa:true, rows:[], items:[], data:[], grupos:[], estudiantes:[],
    sesiones:[], pendientes:[], solicitudes:[], movimientos:[], calendario:[],
  };
  if (fn === 'validarSesion') return {ok:true, rol:session.rol, qa:true};
  if (fn === 'getDocenteSesionActivaF87') return {ok:true, sesion:null, qa:true};
  if (fn === 'getPerfilDocenteCS21A76') return {
    ok:true,
    perfil:{
      nombre:session.nombre, usuario:session.usuario, cedula:session.cedula,
      correo:session.correo, telefono:'', especialidad:'Docente de Inglés Conversacional',
      foto_url:'', curriculum:null, aval_ina:null,
    },
  };
  if (fn === 'getEstudiante') return {
    ok:true,
    estudiante:{...session,NOMBRE:session.nombre,CODIGO:session.codigo,CEDULA:session.cedula,CORREO:session.correo},
    niveles:{B1:{estatus:'CA'},B2:{},I1:{},I2:{}},
    grupo:{CODIGO_GRUPO:session.grupo || '',NIVEL:'B1',PROGRAMA:'SIN_INA'},
    pendientes:{}, qa:true,
  };
  if (/grupos/i.test(fn)) return {...common,grupos:[],grupo:session.grupo || '',qa:true};
  if (/biblioteca|book|audio|material/i.test(fn)) return {...common,nivel:'B1',book_type:'SB',unit_starts:[],qa:true};
  return common;
}

function activeRoute(role) {
  if (role === 'teacher') return 'dashboard';
  if (role === 'superadmin') return 'dashboard';
  return 'dashboard';
}

async function installTrace(page) {
  await page.evaluate(() => {
    if (typeof window.__CS21A179_STOP_TRACE__ === 'function') window.__CS21A179_STOP_TRACE__();
    const trace = [];
    const root = document.getElementById('root');
    const capture = (kind, detail = null) => {
      const text = String(root?.innerText || '').replace(/\s+/g, ' ').trim();
      trace.push({
        at:performance.now(), kind, detail,
        loading:Boolean(document.querySelector('[data-lazy-route-state="loading"]')),
        legacyTeacherProfile:/Información profesional del docente|Documentos del docente/.test(text),
        canonicalTeacherProfile:Boolean(document.querySelector('.tp76-page')),
        heading:Array.from(document.querySelectorAll('main h1, main h2, #root h1, #root h2'))
          .find(node => node.getClientRects().length)?.textContent?.replace(/\s+/g, ' ').trim() || '',
      });
    };
    const observer = new MutationObserver(() => capture('mutation'));
    if (root) observer.observe(root,{childList:true,subtree:true,characterData:true});
    const committed = event => capture('commit',event?.detail || null);
    window.addEventListener('an:lazy-route-committed',committed);
    window.__CS21A179_ROUTE_TRACE__ = trace;
    window.__CS21A179_STOP_TRACE__ = () => {
      observer.disconnect();
      window.removeEventListener('an:lazy-route-committed',committed);
    };
    capture('start');
  });
}

async function finishTrace(page) {
  return page.evaluate(() => {
    if (typeof window.__CS21A179_STOP_TRACE__ === 'function') window.__CS21A179_STOP_TRACE__();
    return window.__CS21A179_ROUTE_TRACE__ || [];
  });
}

async function sidebarRoutes(page) {
  return page.locator('aside.sb .sb-item[data-nav-id]').evaluateAll(nodes => {
    const seen = new Set();
    const rows = [];
    for (const node of nodes) {
      const id = node.getAttribute('data-nav-id') || '';
      if (!id || seen.has(id) || node.disabled || node.getAttribute('aria-disabled') === 'true') continue;
      seen.add(id);
      rows.push({id,label:String(node.textContent || '').replace(/\s+/g,' ').trim()});
    }
    return rows;
  });
}

async function clickRoute(page, route) {
  const control = page.locator(`aside.sb .sb-item[data-nav-id="${route.id}"]:not([disabled])`).first();
  await control.scrollIntoViewIfNeeded();
  await control.click({timeout:7000});
  await page.waitForTimeout(850);
}

const browser = await chromium.launch(browserPath ? {headless:true,executablePath:browserPath} : {headless:true});
const report = {version:'CS21A179',baseURL,roles:{},profile:{},pageErrors:[]};

for (const role of ['teacher','student','superadmin']) {
  const context = await browser.newContext({viewport:{width:1440,height:900},ignoreHTTPSErrors:true});
  const session = sessions[role];
  await context.addInitScript(({session,route}) => {
    sessionStorage.setItem('an_usuario',JSON.stringify(session));
    sessionStorage.removeItem('an_just_logged_in');
    const uiRole = session.rol === 'superadmin' ? 'admin' : session.rol;
    localStorage.setItem('an_role',uiRole);
    localStorage.setItem(`an_active_${uiRole}`,route);
    localStorage.setItem('an_active',route);
  },{session,route:activeRoute(role)});
  const page = await context.newPage();
  page.on('pageerror',error => report.pageErrors.push({role,message:error.message}));
  await page.route('**/*',async route => {
    const request = route.request();
    const url = request.url();
    if (/\/src\/student_modules\.jsx(?:\?|$)/.test(url)) await new Promise(resolve => setTimeout(resolve,180));
    if (/script\.google\.com\/macros|script\.googleusercontent\.com/i.test(url)) {
      let payload = {};
      try { payload = JSON.parse(request.postData() || '{}'); } catch (_) {}
      let fn = String(payload.fn || '');
      try { fn = fn || new URL(url).searchParams.get('fn') || ''; } catch (_) {}
      await route.fulfill({status:200,contentType:'application/json; charset=utf-8',body:JSON.stringify(mockPayload(fn,session))});
      return;
    }
    await route.continue();
  });
  await page.goto(`${baseURL}/campus.html`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('aside.sb',{timeout:20000});
  await page.waitForTimeout(450);

  const routes = await sidebarRoutes(page);
  const ordered = role === 'teacher'
    ? [...routes.filter(item => item.id === 'perfil'),...routes.filter(item => item.id !== 'perfil')]
    : routes;
  const coverage = [];
  for (const route of ordered) {
    await installTrace(page);
    try {
      await clickRoute(page,route);
      const trace = await finishTrace(page);
      const legacySeen = trace.some(frame => frame.legacyTeacherProfile);
      assert.equal(legacySeen,false,`${role}/${route.id} mostró el perfil docente histórico durante la transición.`);
      const rootText = await page.locator('#root').innerText();
      assert.ok(rootText.trim().length > 20,`${role}/${route.id} dejó la aplicación vacía.`);
      coverage.push({id:route.id,label:route.label,ok:true,commits:trace.filter(frame => frame.kind === 'commit').map(frame => frame.detail)});
      if (role === 'teacher' && route.id === 'perfil') {
        assert.equal(await page.locator('.tp76-page').count(),1,'Mi Perfil debe montar únicamente la vista canónica CS21A76.');
        assert.equal(await page.getByText('Documentos del docente',{exact:true}).count(),0,'La tarjeta histórica no debe aparecer.');
        const commits = trace.filter(frame => frame.kind === 'commit').map(frame => frame.detail);
        assert.ok(commits.some(item => item?.component === 'PerfilView' && /PerfilViewCS21A76/.test(item?.view || '')),
          'El cargador debe comprometer PerfilViewCS21A76 antes de renderizar.');
        report.profile.desktop = {ok:true,trace};
        await page.screenshot({path:path.join(outDir,'teacher-profile-desktop.png'),fullPage:true});
      }
    } catch (error) {
      coverage.push({id:route.id,label:route.label,ok:false,error:error.message});
      throw error;
    }
  }
  report.roles[role] = coverage;
  await context.close();
}

const mobileContext = await browser.newContext({viewport:{width:390,height:844},ignoreHTTPSErrors:true});
const teacher = sessions.teacher;
await mobileContext.addInitScript(session => {
  sessionStorage.setItem('an_usuario',JSON.stringify(session));
  localStorage.setItem('an_role','teacher');
  localStorage.setItem('an_active_teacher','perfil');
  localStorage.setItem('an_active','perfil');
},teacher);
const mobilePage = await mobileContext.newPage();
mobilePage.on('pageerror',error => report.pageErrors.push({role:'teacher-mobile',message:error.message}));
await mobilePage.route('**/*',async route => {
  const request = route.request();
  const url = request.url();
  if (/\/src\/student_modules\.jsx(?:\?|$)/.test(url)) await new Promise(resolve => setTimeout(resolve,180));
  if (/script\.google\.com\/macros|script\.googleusercontent\.com/i.test(url)) {
    let payload={};
    try {payload=JSON.parse(request.postData()||'{}');} catch (_) {}
    let fn=String(payload.fn||'');
    try {fn=fn||new URL(url).searchParams.get('fn')||'';} catch (_) {}
    await route.fulfill({status:200,contentType:'application/json; charset=utf-8',body:JSON.stringify(mockPayload(fn,teacher))});
    return;
  }
  await route.continue();
});
await mobilePage.goto(`${baseURL}/campus.html`,{waitUntil:'domcontentloaded',timeout:30000});
await mobilePage.waitForSelector('.tp76-page',{timeout:20000});
assert.equal(await mobilePage.getByText('Documentos del docente',{exact:true}).count(),0);
assert.ok((await mobilePage.locator('#root').evaluate(root => root.scrollWidth - window.innerWidth)) <= 24,'Mi Perfil desborda horizontalmente en móvil.');
await mobilePage.screenshot({path:path.join(outDir,'teacher-profile-mobile.png'),fullPage:true});
report.profile.mobile={ok:true};
await mobileContext.close();

await browser.close();
assert.deepEqual(report.pageErrors,[],'No debe haber excepciones no controladas durante el recorrido.');
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify(report,null,2));

const routeCount = Object.values(report.roles).reduce((sum,rows) => sum + rows.length,0);
console.log(`OK CS21A179 BROWSER: ${routeCount} opciones visibles recorridas; Perfil canónico aprobado en escritorio y móvil.`);
