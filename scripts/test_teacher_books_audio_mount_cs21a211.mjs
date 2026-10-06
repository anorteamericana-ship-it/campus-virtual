import fs from 'node:fs';

const source = fs.readFileSync('src/book_inline_audio_cs21a63.js', 'utf8');
const campus = fs.readFileSync('campus.html', 'utf8');

const checks = [
  [source.includes("const VERSION = 'F98.4-Z6-CS21A211';"), 'version CS21A211'],
  [source.includes('section[data-book-viewer="institutional"]'), 'selector institucional'],
  [source.includes('section[data-screen-label*="CS21A75"][data-screen-label*="Libros"]'), 'selector CS21A75'],
  [source.includes('section[data-screen-label*="CS21A60"][data-screen-label*="Libros"]'), 'compatibilidad CS21A60'],
  [source.includes('section[data-screen-label*="CS21A58"][data-screen-label*="libros"]'), 'compatibilidad CS21A58'],
  [source.includes('document.querySelectorAll(VIEWER_SELECTOR).forEach(attachToViewer);'), 'scanner usa VIEWER_SELECTOR'],
  [campus.includes('src/book_inline_audio_cs21a63.js?v=F98.4Z6CS21A211'), 'cache bust campus'],
];

let failed = 0;
for (const [ok, label] of checks) {
  console.log((ok ? 'PASS ' : 'FAIL ') + label);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log('PASS ' + checks.length + '/' + checks.length);