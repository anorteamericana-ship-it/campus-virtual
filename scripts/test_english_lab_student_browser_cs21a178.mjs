#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4176';
const output = path.resolve('qa-output/cs21a178-student-sync');
fs.mkdirSync(output, {recursive:true});

const launchOptions = {headless:true};
if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) {
  launchOptions.executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
}
const browser = await chromium.launch(launchOptions);
const cases = [
  {id:'QA-P1',name:'student-1-desktop',viewport:{width:1440,height:900},waiting:false},
  {id:'QA-P2',name:'student-2-mobile',viewport:{width:390,height:844},waiting:true},
];
const results = [];

try {
  for (const item of cases) {
    const context = await browser.newContext({viewport:item.viewport});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`);
    });
    await page.goto(`${base}/src/english_lab_games/memory_match_student_sync_preview_cs21a178.html?player=${item.id}`, {waitUntil:'networkidle'});
    await page.getByRole('button', {name:'Entrar a sala'}).click();
    try {
      await page.locator('[data-live-game="MEMORY_MATCH"]').waitFor({state:'visible',timeout:15000});
    } catch (error) {
      const diagnosticBody = await page.locator('body').innerText();
      throw new Error(`${item.id} no mostró el tablero. Pantalla: ${diagnosticBody}\nErrores: ${errors.join(' | ')}\n${error.message}`);
    }

    const body = await page.locator('body').innerText();
    assert.equal(body.includes('Enviar respuesta'), false, `${item.id} conservó la pantalla genérica.`);
    assert.equal(body.includes('LEGACY NO DEBE MOSTRARSE'), false, `${item.id} mostró la pregunta heredada.`);
    if (item.waiting) assert.match(body, /Esperando turno/i, 'El segundo estudiante debe ver el turno en espera.');

    const diagnostic = await page.evaluate(() => ({
      guardInstalled: !!(window.EnglishLabLiveSyncCS21A177 && window.EnglishLabLiveSyncCS21A177.isInstalled()),
      metrics: window.EnglishLabLiveSyncCS21A177 ? window.EnglishLabLiveSyncCS21A177.getMetrics() : [],
      calls: window.__QA_BACKEND_CALLS__ || [],
    }));
    assert.equal(diagnostic.guardInstalled, true);
    assert.ok(diagnostic.metrics.some(metric => metric.endpoint === 'englishLabLiveJoinRoom'));
    assert.ok(
      diagnostic.metrics.some(metric => metric.join_upgrade === true),
      `No se registró join_upgrade para ${item.id}: ${JSON.stringify(diagnostic)}`,
    );
    assert.ok(diagnostic.calls.some(call => call.endpoint === 'englishLabMemoryMatchGetPlayerState'));
    assert.deepEqual(errors, [], `Errores del navegador para ${item.id}: ${errors.join(' | ')}`);

    await page.screenshot({path:path.join(output, `${item.name}.png`), fullPage:true});
    results.push({player:item.id,viewport:item.viewport,boardVisible:true,legacyQuestionVisible:false,joinUpgrade:true});
    await context.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(output,'result.json'), `${JSON.stringify({verdict:'APTO_SINTETICO',results},null,2)}\n`);
console.log(JSON.stringify({verdict:'APTO_SINTETICO',results},null,2));
