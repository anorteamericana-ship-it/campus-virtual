// Renderiza el Video 001 cuadro por cuadro desde corner_cup_scene.html y lo codifica con ffmpeg.
// Uso: node media_src/render_video_001.mjs [--frames 2,6.5,8.8]   (con --frames solo saca capturas de prueba)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
const FPS = 30, out = path.join(here, '..', 'media');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.QA_CHANNEL || 'chrome' });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
await page.goto(pathToFileURL(path.join(here, 'corner_cup_scene.html')).href);
const frame = t => page.evaluate(tt => { window.draw(tt); return document.getElementById('c').toDataURL('image/jpeg', 0.93).split(',')[1]; }, t);
const arg = process.argv.indexOf('--frames');
if (arg > 0) {
  for (const t of process.argv[arg + 1].split(',').map(Number)) fs.writeFileSync(`/tmp/v001_t${t}.jpg`, Buffer.from(await frame(t), 'base64'));
} else {
  const dur = await page.evaluate(() => window.DURATION), tmp = path.join(out, 'corner_cup_intro.tmp.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-profile:v', 'main', '-movflags', '+faststart', '-an', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < dur * FPS; i++) if (!ff.stdin.write(Buffer.from(await frame(i / FPS), 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
  ff.stdin.end();
  const code = await new Promise(r => ff.on('close', r));
  if (code !== 0) throw new Error('ffmpeg salió con ' + code);
  fs.renameSync(tmp, path.join(out, 'corner_cup_intro.mp4'));
  fs.writeFileSync(path.join(out, 'corner_cup_poster.jpg'), Buffer.from(await page.evaluate(() => { window.draw(8.6); return document.getElementById('c').toDataURL('image/jpeg', 0.8).split(',')[1]; }), 'base64'));
}
await browser.close();
