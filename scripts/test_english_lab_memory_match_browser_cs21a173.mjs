#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const outputDir = path.join(process.cwd(), 'qa-output', 'cs21a173-memory-match');
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const requests = [];
page.on('request', request => requests.push(request.url()));
page.on('console', message => {
  if (message.type() === 'error') console.error('BROWSER CONSOLE:', message.text());
});
page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));

try {
  await page.goto(`${base}/src/english_lab_games/memory_match_preview_cs21a173.html`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  const shell = page.locator('[data-game-engine="MEMORY_MATCH"]');
  await shell.waitFor({ state: 'visible', timeout: 15000 });

  const cards = page.locator('.elmm-card');
  const cardCount = await cards.count();
  if (cardCount !== 12) throw new Error(`Se esperaban 12 tarjetas; llegaron ${cardCount}.`);

  const initialTimer = await page.locator('.elmm-timer-copy strong').textContent();
  await page.waitForTimeout(1200);
  const nextTimer = await page.locator('.elmm-timer-copy strong').textContent();
  if (initialTimer === nextTimer) throw new Error('El temporizador visual no avanzó.');

  for (let index = 0; index < cardCount; index += 2) {
    await cards.nth(index).click();
    await cards.nth(index + 1).click();
    try {
      await page.waitForFunction(
        expected => document.querySelectorAll('.elmm-card.is-matched').length === expected,
        index + 2,
        { timeout: 5000 },
      );
    } catch (error) {
      const diagnostic = await page.evaluate(() => ({
        matched: document.querySelectorAll('.elmm-card.is-matched').length,
        disabled: Array.from(document.querySelectorAll('.elmm-card')).filter(card => card.disabled).length,
        open: document.querySelectorAll('.elmm-card.is-open').length,
        announcement: document.querySelector('.elmm-live-announcement')?.textContent || '',
        status: document.querySelector('.elmm-status-row')?.textContent || '',
        log: document.querySelector('#log')?.textContent || '',
      }));
      console.error(`PAIR DIAGNOSTIC index=${index}: ${JSON.stringify(diagnostic)}`);
      await page.screenshot({
        path: path.join(outputDir, `memory-match-failure-pair-${index}.png`),
        fullPage: true,
      });
      throw error;
    }
  }

  await page.waitForFunction(
    () => String(document.querySelector('#log')?.textContent || '').includes('COMPLETE'),
    null,
    { timeout: 5000 },
  );
  const eventLog = await page.locator('#log').textContent();
  if (!String(eventLog || '').includes('COMPLETE')) throw new Error('No se emitió el cierre COMPLETE del tablero.');
  await page.waitForFunction(() => document.body.textContent.includes('Tablero completado'), null, { timeout: 5000 });

  await page.locator('#modeBtn').click();
  await page.waitForFunction(() => document.body.textContent.includes('Seleccioná dos tarjetas que formen un par.'), null, { timeout: 5000 });
  await page.waitForFunction(() => document.querySelectorAll('.elmm-card.is-matched').length === 0, null, { timeout: 5000 });
  const resetMatched = await page.locator('.elmm-card.is-matched').count();
  if (resetMatched !== 0) throw new Error(`El cambio de modo conservó ${resetMatched} tarjetas encontradas.`);

  const forbiddenRequests = requests.filter(url => /script\.google\.com|spreadsheets|ACADEMIA_PLAY_BANK/i.test(url));
  if (forbiddenRequests.length) throw new Error(`El preview hizo solicitudes prohibidas: ${forbiddenRequests.join(', ')}`);

  const jsonRequests = requests.filter(url => /\.json(?:\?|$)/i.test(url));
  if (jsonRequests.length !== 1 || !jsonRequests[0].includes('memory_match_room_cs21a173.json')) {
    throw new Error(`Se esperaba un único paquete JSON; observados: ${jsonRequests.join(', ')}`);
  }

  await page.screenshot({
    path: path.join(outputDir, 'memory-match-desktop.png'),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-game-engine="MEMORY_MATCH"]').waitFor({ state: 'visible', timeout: 15000 });
  const viewportWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  if (viewportWidth > 410) throw new Error(`Desborde horizontal móvil: ${viewportWidth}px.`);
  await page.screenshot({
    path: path.join(outputDir, 'memory-match-mobile.png'),
    fullPage: true,
  });

  const report = {
    verdict: 'APTO',
    cardCount,
    timerChanged: initialTimer !== nextTimer,
    completeState: true,
    resetClearsMatches: resetMatched === 0,
    compactJsonRequests: jsonRequests,
    forbiddenRequests,
    screenshots: ['memory-match-desktop.png', 'memory-match-mobile.png'],
  };
  fs.writeFileSync(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log('CS21A173 MEMORY MATCH BROWSER: APTO');
} finally {
  await browser.close();
}
