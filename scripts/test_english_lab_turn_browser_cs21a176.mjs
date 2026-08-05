#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const outputDir = path.join(process.cwd(), 'qa-output', 'cs21a176-live-turns');
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1800, height: 1100 } });
page.on('console', message => {
  if (message.type() === 'error') console.error('BROWSER CONSOLE:', message.text());
});
page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));

try {
  await page.goto(`${base}/src/english_lab_games/memory_match_turn_preview_cs21a176.html`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  const views = page.locator('[data-view]');
  await page.locator('[data-view="student-1"] [data-game-engine="MEMORY_MATCH"]').waitFor({state:'visible',timeout:15000});
  if (await views.count() !== 3) throw new Error('Se esperaban tres vistas sincronizadas.');

  const student1 = page.locator('[data-view="student-1"]');
  const student2 = page.locator('[data-view="student-2"]');
  const teacher = page.locator('[data-view="teacher"]');

  await page.waitForFunction(() => document.querySelector('[data-view="student-1"]')?.textContent.includes('Tu turno'));
  await page.waitForFunction(() => document.querySelector('[data-view="student-2"]')?.textContent.includes('Esperando turno'));

  const student1Enabled = await student1.locator('.elmm-card:not(:disabled)').count();
  const student2Enabled = await student2.locator('.elmm-card:not(:disabled)').count();
  const teacherEnabled = await teacher.locator('.elmm-card:not(:disabled)').count();
  if (student1Enabled !== 12) throw new Error(`Estudiante activo tiene ${student1Enabled}/12 tarjetas habilitadas.`);
  if (student2Enabled !== 0) throw new Error(`Estudiante en espera tiene ${student2Enabled} tarjetas habilitadas.`);
  if (teacherEnabled !== 0) throw new Error(`Docente readOnly tiene ${teacherEnabled} tarjetas habilitadas.`);

  await student1.locator('.elmm-card').nth(0).click();
  await student1.locator('.elmm-card').nth(1).click();

  await page.waitForFunction(() => document.querySelectorAll('[data-view="student-1"] .elmm-card.is-matched').length === 2, null, {timeout:5000});
  await page.waitForFunction(() => document.querySelectorAll('[data-view="student-2"] .elmm-card.is-matched').length === 2, null, {timeout:5000});
  await page.waitForFunction(() => document.querySelectorAll('[data-view="teacher"] .elmm-card.is-matched').length === 2, null, {timeout:5000});

  await page.waitForFunction(() => document.querySelector('[data-view="student-2"]')?.textContent.includes('Tu turno'), null, {timeout:5000});
  await page.waitForFunction(() => document.querySelector('[data-view="student-1"]')?.textContent.includes('Esperando turno'), null, {timeout:5000});

  const student1After = await student1.locator('.elmm-card:not(:disabled)').count();
  const student2After = await student2.locator('.elmm-card:not(:disabled)').count();
  if (student1After !== 0) throw new Error(`Estudiante anterior conserva ${student1After} tarjetas habilitadas.`);
  if (student2After !== 10) throw new Error(`Siguiente estudiante tiene ${student2After}/10 tarjetas disponibles.`);

  const turnTexts = await page.locator('[data-view] .elmm-status-row').allTextContents();
  const report = {
    verdict:'APTO',
    initial:{student1Enabled,student2Enabled,teacherEnabled},
    synchronizedMatchedCards:2,
    afterTurn:{student1Enabled:student1After,student2Enabled:student2After},
    turnTexts,
  };
  fs.writeFileSync(path.join(outputDir,'report.json'),`${JSON.stringify(report,null,2)}\n`);
  await page.screenshot({path:path.join(outputDir,'turns-three-views.png'),fullPage:true});
  console.log('CS21A176 LIVE TURN BROWSER: APTO');
} finally {
  await browser.close();
}
