import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_TARGET = fileURLToPath(new URL('./server_v2.mjs', import.meta.url));
const target = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_TARGET;

function fail(message) {
  console.error(`CONAPE_V4_2_4_HOTFIX_FAIL: ${message}`);
  process.exit(1);
}

function replaceOnce(source, needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first < 0) fail(`${label}: preimagen ausente`);
  if (source.indexOf(needle, first + needle.length) >= 0) fail(`${label}: preimagen no unica`);
  return source.slice(0, first) + replacement + source.slice(first + needle.length);
}

function replaceBetween(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  if (start < 0) fail(`${label}: inicio ausente`);
  if (source.indexOf(startMarker, start + startMarker.length) >= 0) fail(`${label}: inicio no unico`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (end < 0) fail(`${label}: fin ausente`);
  if (source.indexOf(endMarker, end + endMarker.length) >= 0) fail(`${label}: fin no unico`);
  return source.slice(0, start) + replacement + source.slice(end);
}

let source = fs.readFileSync(target, 'utf8');

for (const marker of [
  "const VERSION = 'V4.2.3';",
  "navMode:'DIRECT_URL'",
  'Camino principal: formulario fresco por URL /prospecto con la misma sesión APEX.',
  "const required = ['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'];",
  'async function runNavSelftest() {',
]) {
  if (!source.includes(marker)) fail(`baseline inesperado; falta ${marker}`);
}

source = replaceOnce(
  source,
  "const VERSION = 'V4.2.3';",
  "const VERSION = 'V4.2.4';",
  'version',
);

const helpers = `
async function readProspectoContext(p) {
  return p.evaluate(() => {
    const nonZero = value => { const s=String(value ?? '').trim(); return !!s && s !== '0'; };
    const itemHasValue = id => {
      try {
        const item = window.apex?.item?.(id);
        if (item && typeof item.getValue === 'function' && nonZero(item.getValue())) return true;
      } catch {}
      const el = document.getElementById(id);
      return !!el && nonZero('value' in el ? el.value : el.textContent);
    };
    let eventFromUrl = false;
    let prospectorFromUrl = false;
    let sessionParamPresent = false;
    try {
      const u = new URL(location.href);
      eventFromUrl = nonZero(u.searchParams.get('p2_eve_id'));
      prospectorFromUrl = nonZero(u.searchParams.get('p2_pro_id'));
      sessionParamPresent = nonZero(u.searchParams.get('session'));
    } catch {}
    return {
      evento:eventFromUrl || itemHasValue('P2_EVE_ID') || itemHasValue('P2_PRS_EVE_ID') || itemHasValue('P2_EVENTO_ID'),
      prospectador:prospectorFromUrl || itemHasValue('P2_PRO_ID') || itemHasValue('P2_PRS_PRO_ID') || itemHasValue('P2_PROSPECTADOR_ID'),
      session_param_present:sessionParamPresent,
    };
  }).catch(() => ({ evento:false, prospectador:false, session_param_present:false }));
}

async function clickContextRecruitLink(p) {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    for (const frame of p.frames()) {
      const links = frame.locator('a[href]');
      const index = await links.evaluateAll(nodes => {
        const visible = el => { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; };
        const nonZero = value => { const s=String(value ?? '').trim(); return !!s && s !== '0'; };
        const param = (href, name) => {
          const hit = String(href || '').match(new RegExp('(?:\\\\?|&)' + name + '=([^&#]*)', 'i'));
          if (!hit) return '';
          try { return decodeURIComponent(hit[1]); } catch { return hit[1]; }
        };
        return nodes.findIndex(el => {
          if (!visible(el)) return false;
          const href = String(el.getAttribute('href') || '');
          return /prospecto/i.test(href) && nonZero(param(href, 'p2_eve_id')) && nonZero(param(href, 'p2_pro_id'));
        });
      }).catch(() => -1);
      if (index >= 0) {
        await links.nth(index).click({ timeout:15_000 });
        return true;
      }
    }
    await sleep(200);
  }
  return false;
}

`;

source = replaceOnce(source, '\nconst ConapeSession = {', `${helpers}const ConapeSession = {`, 'helpers');

const freshFunction = `  async freshProspectoFromHome() {
    const p = await this.browserPage();
    await this.login(p);
    let sessionId = await readApexSession(p);
    if (!sessionId) throw new AppError('CONAPE_APEX_SESSION_MISSING', 'CONAPE no expuso una sesión válida.', 409, 'FORM');

    // V4.2.4: el CREATE solo puede nacer del contexto oficial Home -> Reclutar.
    await p.goto(urlWithSession(CONAPE_FRIENDLY_HOME, sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
    await waitForApexDynamicAction(p);

    let navMode = '';
    if (await clickContextRecruitLink(p)) {
      navMode = 'HOME_CONTEXT_LINK';
    } else if (await clickVisibleByLabel(p, /RECLUTAR PROSPECTOS|(^| )RECLUTAR( |$)/i)) {
      navMode = 'HOME_RECRUIT_BUTTON';
    } else {
      throw new AppError('CONAPE_RECRUIT_CONTEXT_NOT_FOUND', 'CONAPE no expuso una entrada contextual para Reclutar Prospectos.', 409, 'FORM');
    }

    const until = Date.now() + 15_000;
    while (Date.now() < until) {
      if (await this.formReady(p)) {
        await waitForApexDynamicAction(p);
        const context = await readProspectoContext(p);
        console.log(JSON.stringify({
          event:'conape_prospecto_context', version:VERSION, nav_mode:navMode,
          evento:context.evento === true, prospectador:context.prospectador === true,
          session_param_present:context.session_param_present === true, gate:true, pii:false,
        }));
        if (!context.evento || !context.prospectador) {
          throw new AppError('CONAPE_PROSPECTO_CONTEXT_NOT_READY', 'CONAPE abrió Prospecto sin Evento y Prospectador confirmados.', 409, 'FORM');
        }
        sessionId = (await readApexSession(p)) || sessionId;
        this.state = 'CONNECTED';
        this.lastActivity = nowIso();
        return { p, meta:{ sessionId, navMode, context_evento:true, context_prospectador:true } };
      }
      await sleep(200);
    }
    throw new AppError('CONAPE_FORM_NOT_READY', 'CONAPE no dejó listo el formulario de Prospecto.', 409, 'FORM');
  },`;

source = replaceBetween(
  source,
  '  async freshProspectoFromHome() {',
  '\n  },\n};\n\nasync function runNavSelftest() {',
  freshFunction,
  'freshProspectoFromHome',
);

const selftestFunction = `async function runNavSelftest() {
  const result = { ok:true, login:'FAIL', home:'FAIL', recruit_click:'FAIL', form_ready:'FAIL', context:{ evento:false, prospectador:false } };
  let browser;
  let context;
  try {
    browser = await chromium.launch({ headless:true, args:['--disable-dev-shm-usage'] });
    context = await browser.newContext({ locale:'es-CR', timezoneId:'America/Costa_Rica' });
    const p = await context.newPage();
    p.setDefaultTimeout(15_000);
    const s = await ConapeSession.login(p);
    result.login = s?.authenticated ? 'PASS' : 'FAIL';
    const sessionId = await readApexSession(p);
    if (sessionId) {
      await p.goto(urlWithSession(CONAPE_FRIENDLY_HOME, sessionId), { waitUntil:'domcontentloaded', timeout:20_000 });
      result.home = 'PASS';
      const clicked = await clickContextRecruitLink(p) || await clickVisibleByLabel(p, /RECLUTAR PROSPECTOS|(^| )RECLUTAR( |$)/i);
      result.recruit_click = clicked ? 'PASS' : 'FAIL';
      if (clicked) {
        const until = Date.now() + 15_000;
        while (Date.now() < until) {
          if (await ConapeSession.formReady(p)) {
            const meta = await readProspectoContext(p);
            result.context = { evento:meta.evento === true, prospectador:meta.prospectador === true };
            result.form_ready = meta.evento && meta.prospectador ? 'PASS' : 'FAIL';
            break;
          }
          await sleep(200);
        }
      }
    }
    return result;
  } finally {
    try { await context?.close(); } catch {}
    try { await browser?.close(); } catch {}
  }
}`;

source = replaceBetween(
  source,
  'async function runNavSelftest() {',
  '\n\nasync function nativeSetValue',
  selftestFunction,
  'runNavSelftest',
);

source = replaceOnce(
  source,
  "const required = ['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'];",
  "const required = ['P2_PRO_ID','P2_EVE_ID','P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'];",
  'precreate-context-gate',
);

source = replaceOnce(
  source,
  "const controls = Array.from(document.querySelectorAll('input[id^=\"P2_PRS_\"],select[id^=\"P2_PRS_\"],textarea[id^=\"P2_PRS_\"]'));",
  "const controls = Array.from(document.querySelectorAll('#P2_PRO_ID,#P2_EVE_ID,input[id^=\"P2_PRS_\"],select[id^=\"P2_PRS_\"],textarea[id^=\"P2_PRS_\"]'));",
  'precreate-context-telemetry',
);

if (source.includes("navMode:'DIRECT_URL'")) fail('DIRECT_URL sobrevivio al hotfix');
if (!source.includes("const VERSION = 'V4.2.4';")) fail('version V4.2.4 no aplicada');
if (!source.includes("CONAPE_PROSPECTO_CONTEXT_NOT_READY")) fail('gate de contexto no aplicado');
if (!source.includes("'P2_PRO_ID','P2_EVE_ID','P2_PRS_CEDULA'")) fail('gate precreate no incluye contexto');

fs.writeFileSync(target, source, 'utf8');
console.log('CONAPE_V4_2_4_HOTFIX_PASS');
