import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const outDir = path.join(process.cwd(), 'qa-output', 'teacher-resources-cs21a157');
fs.mkdirSync(outDir, { recursive:true });

const teacherSession = {
  rol:'teacher',
  nombre:'QA Teacher',
  cedula:'QA-TEACHER',
  token:'qa-readonly-token',
  expira:'2099-12-31T23:59:59.000Z',
  grupo:'SJ01-B1-LM69-QA',
  grupoActivo:'SJ01-B1-LM69-QA',
  grupos:['SJ01-B1-LM69-QA'],
  tipoUsuario:'docente',
};

function mock(fn) {
  const common = { ok:true, rows:[], items:[], data:[], grupos:[], estudiantes:[], sesiones:[], pendientes:[], qa:true };
  if (fn === 'validarSesion') return { ok:true, rol:'teacher', qa:true };
  if (fn === 'getDocenteSesionActivaF87') return { ok:true, sesion:null, qa:true };
  if (fn === 'getDocenteGruposActuales') return { ok:true, grupos:[{ COD_GRUPO:'SJ01-B1-LM69-QA' }], qa:true };
  if (fn === 'teacherBooksOpenImageBook') {
    const image = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="390"><rect width="100%" height="100%" fill="white"/><text x="30" y="60" font-size="24">QA BOOK</text></svg>');
    return {
      ok:true,
      level:'B1',
      book_type:'SB',
      pages:[
        { source_page:1, display_index:1, file_id:'QA-P1', image_url:image, fallback_url:image },
        { source_page:2, display_index:2, file_id:'QA-P2', image_url:image, fallback_url:image },
      ],
      unit_starts:Array.from({ length:16 }, (_, index) => index + 1),
      qa:true,
    };
  }
  if (fn === 'getBibliotecaNivelEstudiante') return {
    ok:true,
    catalogo:{
      audios_unidades:[{
        key:'U01',
        label:'Unidad 01',
        pistas:[{ id:'QA-AUDIO-01', nombre:'Unit 01 Track 01.mp3' }],
      }],
      recursos:[{ id:'QA-DICT', nombre:'WORD BY WORD DICTIONARY', url:'https://example.test/dictionary' }],
    },
    qa:true,
  };
  return common;
}

async function isVisible(locator) {
  return locator.isVisible().catch(() => false);
}

async function ensureTeacherMenuOpen(page, viewport) {
  if (viewport.width > 900) return;
  const open = await page.evaluate(() => document.body.classList.contains('an-mobile-nav-open'));
  if (open) return;
  const toggle = page.locator('.an-mobile-nav-toggle:visible').first();
  await toggle.click();
  await page.waitForFunction(() => document.body.classList.contains('an-mobile-nav-open'), null, { timeout:5000 });
}

async function assertActive(nav, expected, label) {
  assert.equal(await nav.getAttribute('aria-current'), expected ? 'page' : null, `${label}: aria-current incorrecto.`);
  assert.equal(await nav.evaluate(node => node.classList.contains('active')), expected, `${label}: clase active incorrecta.`);
}

async function teacherDiagnostic(page, pageErrors) {
  return page.evaluate(errors => {
    const outer = document.querySelector('section[data-screen-label^="Docente · CS21A4"]');
    const viewer = document.querySelector('section[data-screen-label*="CS21A75"][data-screen-label*="Libros"]');
    return {
      storedIntent:sessionStorage.getItem('an_teacher_materiales_tab') || '',
      bookResourceType:typeof window.__AN_BOOK_RESOURCES_COMPONENT__,
      materialViewName:window.MaterialesView?.name || '',
      materialMarkers:Object.keys(window.MaterialesView || {}).filter(key => key.startsWith('__')),
      outerLabel:outer?.getAttribute('data-screen-label') || '',
      outerText:String(outer?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 500),
      viewerPresent:Boolean(viewer),
      rootText:String(document.getElementById('root')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 800),
      pageErrors:errors,
    };
  }, [...pageErrors]);
}

const results = [];
const browser = await chromium.launch({ headless:true });

for (const viewport of [{ width:1440, height:900 }, { width:390, height:844 }]) {
  const context = await browser.newContext({ viewport, ignoreHTTPSErrors:true });
  await context.addInitScript(({ user }) => {
    sessionStorage.setItem('an_usuario', JSON.stringify(user));
    sessionStorage.removeItem('an_just_logged_in');
    sessionStorage.setItem('an_teacher_materiales_tab', 'info');
    localStorage.setItem('an_role', 'teacher');
    localStorage.setItem('an_active_teacher', 'materiales');
    localStorage.setItem('an_active', 'materiales');
  }, { user:teacherSession });

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('**/script.google.com/**', async route => {
    const request = route.request();
    let fn = '';
    try {
      fn = new URL(request.url()).searchParams.get('fn') || '';
      const raw = request.postData() || '';
      if (raw) fn = JSON.parse(raw).fn || fn;
    } catch (_) {}
    await route.fulfill({ status:200, contentType:'application/json; charset=utf-8', body:JSON.stringify(mock(fn)) });
  });

  await page.goto(`${baseURL}/campus.html`, { waitUntil:'domcontentloaded', timeout:30000 });
  await page.waitForFunction(() => document.querySelector('aside.teacher-sb') && document.getElementById('root')?.innerText?.trim().length > 20, null, { timeout:20000 });

  await ensureTeacherMenuOpen(page, viewport);
  const menu = page.locator('aside.teacher-sb');
  const infoNav = menu.locator('.sb-item[data-nav-id="info_programa_docente"]');
  const canonicalNav = menu.locator('.sb-item[data-nav-id="libros_docente"]');
  await infoNav.waitFor({ state:'visible', timeout:10000 });
  await canonicalNav.waitFor({ state:'visible', timeout:10000 });
  assert.equal(await menu.getByText('Libros y Audios', { exact:true }).count(), 1, 'Debe existir una única opción Libros y Audios.');
  assert.equal(await menu.getByText('Biblioteca digital', { exact:true }).count(), 0);
  assert.equal(await menu.getByText('Libros de texto', { exact:true }).count(), 0);
  assert.equal(await menu.getByText('Audios', { exact:true }).count(), 0);
  await assertActive(infoNav, true, 'Estado inicial Información General');
  await assertActive(canonicalNav, false, 'Estado inicial Libros y Audios');

  await canonicalNav.click();
  await page.waitForTimeout(700);
  const diagnostic = await teacherDiagnostic(page, pageErrors);
  console.log(`CS21A163_DIAGNOSTIC_${viewport.width}: ${JSON.stringify(diagnostic)}`);
  fs.writeFileSync(path.join(outDir, `diagnostic-${viewport.width}.json`), JSON.stringify(diagnostic, null, 2));
  await page.screenshot({ path:path.join(outDir, `diagnostic-${viewport.width}.png`), fullPage:true });
  assert.equal(diagnostic.storedIntent, 'libros', 'El clic debe publicar la subruta libros.');
  assert.equal(diagnostic.bookResourceType, 'function', 'El componente reutilizable de libros debe estar publicado.');
  assert.equal(diagnostic.outerLabel, 'Docente · CS21A4 · libros', 'TeacherHub debe conservar el control de la subruta libros.');
  assert.deepEqual(diagnostic.pageErrors, [], `Errores de página al montar libros: ${diagnostic.pageErrors.join(' | ')}`);

  const viewer = page.locator('section[data-screen-label*="CS21A75"][data-screen-label*="Libros"]');
  await viewer.waitFor({ state:'visible', timeout:20000 });
  await assertActive(infoNav, false, 'Después de abrir Libros y Audios');
  await assertActive(canonicalNav, true, 'Después de abrir Libros y Audios');

  await ensureTeacherMenuOpen(page, viewport);
  await infoNav.click();
  const infoScreen = page.locator('section[data-screen-label="Docente · CS21A4 · info"]');
  await infoScreen.waitFor({ state:'visible', timeout:15000 });
  await assertActive(infoNav, true, 'Después de volver a Información General');
  await assertActive(canonicalNav, false, 'Después de volver a Información General');

  await ensureTeacherMenuOpen(page, viewport);
  await canonicalNav.click();
  await viewer.waitFor({ state:'visible', timeout:20000 });
  await assertActive(infoNav, false, 'Segunda apertura de Libros y Audios');
  await assertActive(canonicalNav, true, 'Segunda apertura de Libros y Audios');

  await page.getByRole('button', { name:'SB', exact:true }).waitFor({ state:'visible', timeout:10000 });
  await page.getByRole('button', { name:'TB', exact:true }).waitFor({ state:'visible', timeout:10000 });
  await page.getByRole('button', { name:'WB', exact:true }).waitFor({ state:'visible', timeout:10000 });

  const inline = viewer.locator('.an-book-inline-audio-cs21a65');
  await inline.waitFor({ state:'visible', timeout:15000 });
  const audioSelect = inline.getByLabel('Audio de la unidad seleccionada');
  const resourceSelect = inline.getByLabel('Recursos adicionales del nivel');
  await audioSelect.waitFor({ state:'visible', timeout:10000 });
  await resourceSelect.waitFor({ state:'visible', timeout:10000 });
  await page.waitForFunction(() => {
    const audio = document.querySelector('select[aria-label="Audio de la unidad seleccionada"]');
    const resource = document.querySelector('select[aria-label="Recursos adicionales del nivel"]');
    return audio?.options?.length > 1 && resource?.options?.length > 1;
  }, null, { timeout:15000 });

  assert.match(await audioSelect.locator('option').nth(1).textContent(), /Unit 01 Track 01/i);
  assert.match(await resourceSelect.locator('option').nth(1).textContent(), /Diccionario Word by Word/i);

  const markers = await page.evaluate(() => ({
    oldNormalizer:Boolean(window.Sidebar?.__cs21a156TeacherResources),
    oldUnified:Boolean(window.Sidebar?.__cs21a65UnifiedResources),
    compatibility:window.__AN_RESOURCES_PANEL_COMPATIBILITY__?.version || '',
    inlineVersion:window.__AN_BOOK_INLINE_AUDIO_VERSION__ || '',
    storedIntent:sessionStorage.getItem('an_teacher_materiales_tab') || '',
    guardMode:window.__AN_TEACHER_BOOK_NAVIGATION_CS21A135?.authorityMode || '',
  }));
  assert.equal(markers.oldNormalizer, false);
  assert.equal(markers.oldUnified, false);
  assert.match(markers.compatibility, /CS21A157/);
  assert.equal(markers.storedIntent, 'libros');
  assert.equal(markers.guardMode, 'TEACHER_PORTAL_OWNS_VIEWER');

  assert.deepEqual(pageErrors, []);
  const name = viewport.width <= 900 ? 'teacher-mobile.png' : 'teacher-desktop.png';
  await page.screenshot({ path:path.join(outDir, name), fullPage:true });
  results.push({ viewport, diagnostic, markers, inlineVisible:await isVisible(inline), sameRouteAlternation:true });
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(outDir, 'result.json'), JSON.stringify({ ok:true, results }, null, 2));
console.log('OK: Libros y Audios docente alterna dentro de materiales en escritorio y móvil, con pistas y recursos integrados.');
