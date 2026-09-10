import fs from 'node:fs';
import { chromium } from 'playwright';

const sourceUrl = new URL('./server.mjs', import.meta.url);
const runtimeUrl = new URL('./server.runtime.c3_6_2.mjs', import.meta.url);
const rawSource = fs.readFileSync(sourceUrl, 'utf8');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const CONAPE_HOME = String(process.env.CONAPE_PORTAL_HOME_URL || 'https://online.conape.go.cr/apex/f?p=302:1').trim();

function safeTarget(raw) {
  try {
    const u = new URL(raw);
    if (u.pathname === '/apex/f') {
      const p = String(u.searchParams.get('p') || '');
      const parts = p.split(':');
      return `${u.origin}${u.pathname}?p=${parts.slice(0, 2).join(':')}`;
    }
    return `${u.origin}${u.pathname}`;
  } catch {
    return 'INVALID_URL';
  }
}

async function diagSnapshot(page, label) {
  const state = await page.evaluate(() => {
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
    const visible = el => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const body = norm(document.body?.innerText || '');
    const passwordVisible = document.querySelectorAll('input[type="password"]:not([type="hidden"])').length;
    const userCandidates = Array.from(document.querySelectorAll('input:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])')).filter(visible).length;
    const controls = Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible);
    const controlText = controls.map(el => norm([el.textContent || '', el.value || '', el.getAttribute('aria-label') || '', el.getAttribute('title') || ''].join(' ')));
    const alerts = Array.from(document.querySelectorAll('[role="alert"],.t-Alert,.a-Alert,.t-Body-alert,.t-Form-error,.apex-page-item-error')).filter(visible);
    const alertText = norm(alerts.map(el => el.textContent || '').join(' '));
    let alertClass = 'NONE';
    if (alertText) {
      if (/CAPTCHA|CHALLENGE|VERIFIC|ROBOT|BOT|CLOUDFLARE/.test(alertText)) alertClass = 'CAPTCHA_OR_CHALLENGE';
      else if (/USUARIO|CONTRASENA|CLAVE|CREDENCIAL/.test(alertText) && /INVALID|INCORRECT|ERROR|NO COINCID|FALL/.test(alertText)) alertClass = 'LOGIN_ERROR';
      else alertClass = 'OTHER';
    }
    return {
      title: String(document.title || '').slice(0, 120),
      password_visible: passwordVisible,
      user_candidates: userCandidates,
      login_candidate: controlText.some(t => /(^| )(LOGIN|INGRESAR|INICIAR SESION|ENTRAR|ACCEDER)( |$)/.test(t)),
      recruit_visible: controlText.some(t => /(^| )RECLUTAR( |$)/.test(t)),
      form_ready: ['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'].every(id => !!document.getElementById(id)),
      logout_visible: controlText.some(t => /CERRAR SESION|LOGOUT/.test(t)),
      mis_aplicaciones: body.includes('MIS APLICACIONES INTERNAS'),
      inicio_sesion: body.includes('INICIO DE SESION'),
      alert_class: alertClass,
      visible_alerts: alerts.length,
    };
  }).catch(() => ({ evaluation_failed:true }));
  return { label, target:safeTarget(page.url()), ...state };
}

async function runLoginDiag() {
  if (String(process.env.CONAPE_LOGIN_DIAG_ON_START || '') !== '1') return;
  const username = String(process.env.CONAPE_PORTAL_USERNAME || '');
  const passwordValue = String(process.env.CONAPE_PORTAL_PASSWORD || '');
  const result = { event:'conape_login_diag', pii:false, credentials_values_emitted:false, checkpoints:[], navigations:[] };
  let browser;
  try {
    browser = await chromium.launch({ headless:true, args:['--disable-dev-shm-usage'] });
    const context = await browser.newContext({ locale:'es-CR', timezoneId:'America/Costa_Rica' });
    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    page.on('response', response => {
      try {
        const req = response.request();
        const u = new URL(response.url());
        if (u.hostname !== 'online.conape.go.cr' || !req.isNavigationRequest() || req.frame() !== page.mainFrame()) return;
        result.navigations.push({ status:response.status(), target:safeTarget(response.url()) });
        if (result.navigations.length > 12) result.navigations.shift();
      } catch {}
    });

    await page.goto(CONAPE_HOME, { waitUntil:'domcontentloaded', timeout:30_000 });
    result.checkpoints.push(await diagSnapshot(page, 'before_login'));

    const pass = page.locator('input[type="password"]:visible').first();
    let user = page.getByLabel(/usuario|c[eé]dula|identificaci[oó]n|user/i).first();
    if (!(await user.count())) user = page.locator('input:visible:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])').first();

    if (!(await pass.count()) || !(await user.count())) {
      result.input_contract = 'MISSING';
      console.log(JSON.stringify(result));
      await context.close();
      return;
    }

    result.input_contract = 'FOUND';
    await user.fill(username);
    await pass.fill(passwordValue);

    let login = page.getByRole('button', { name:/ingresar|iniciar sesi[oó]n|entrar|acceder|login|sign in/i }).first();
    if (!(await login.count())) login = page.locator('button[type="submit"]:visible,input[type="submit"]:visible,input[type="button"]:visible').first();
    result.login_control = (await login.count()) ? 'FOUND' : 'ENTER_FALLBACK';
    if (await login.count()) await login.click(); else await pass.press('Enter');

    const schedule = [1500, 3000, 8000, 15000, 30000];
    let elapsed = 0;
    for (const at of schedule) {
      await sleep(at - elapsed);
      elapsed = at;
      result.checkpoints.push(await diagSnapshot(page, `${at}ms`));
    }
    console.log(JSON.stringify(result));
    await context.close();
  } catch (error) {
    console.log(JSON.stringify({ event:'conape_login_diag_error', pii:false, name:String(error?.name || 'Error'), code:String(error?.code || ''), credentials_values_emitted:false }));
  } finally {
    try { await browser?.close(); } catch {}
  }
}

await runLoginDiag();

// Alinea el matcher productivo con el matcher que ya pasó el discovery E2.
// El portal puede renderizar el control como "Reclutar" o "Reclutar Prospectos"
// según la vista/responsive. Nunca debe aceptar "Reclutamiento" como acción.
const recruitNeedle = ".includes('RECLUTAR PROSPECTOS')";
const recruitHitCount = rawSource.split(recruitNeedle).length - 1;
if (recruitHitCount !== 2) {
  throw new Error(`C3.6.7 recruit matcher expected 2 targets, found ${recruitHitCount}; refusing to start`);
}
const source = rawSource.replaceAll(recruitNeedle, ".match(/(^| )RECLUTAR( |$)/)");

const needle = /  if \(!\(await login\.count\(\)\)\) throw new AppError\('CONAPE_LOGIN_BUTTON_NOT_FOUND'[^\n]*\n\n  await login\.click\(\);\n  const until = Date\.now\(\) \+ 30_000;\n  while \(Date\.now\(\) < until\) \{\n    await sleep\(600\);\n    if \(await recruitVisible\(p\)\) return;\n  \}\n  throw new AppError\('CONAPE_LOGIN_FAILED'[^\n]*;/;

const replacement = `  if (await login.count()) await login.click();
  else await pass.press('Enter');

  await sleep(1200);
  const until = Date.now() + 45_000;
  let homeRetried = false;
  while (Date.now() < until) {
    if (await recruitVisible(p) || await formReady(p)) return;

    const passwordVisible = await p.locator('input[type="password"]:visible').count().catch(() => 0);
    if (!passwordVisible && !homeRetried) {
      homeRetried = true;
      try {
        await p.goto(CONAPE_HOME, { waitUntil:'domcontentloaded', timeout:30_000 });
      } catch {}
      if (await recruitVisible(p) || await formReady(p)) return;
    }

    await sleep(600);
  }
  throw new AppError('CONAPE_LOGIN_FAILED', 'CONAPE no confirmó la sesión del bridge.', 503);`;

const patched = source.replace(needle, replacement);
if (patched === source) {
  throw new Error('C3.6.7 login redirect patch target not found; refusing to start');
}

fs.writeFileSync(runtimeUrl, patched, 'utf8');
await import(runtimeUrl.href + '?v=' + Date.now());
