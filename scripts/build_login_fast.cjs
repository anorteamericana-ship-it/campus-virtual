'use strict';
// F111 AUTOPASS1: JSX de login compilado antes de servir al navegador.
// El original JSX es la única fuente editable; los *.compiled.js son artefactos de publicación.
const fs = require('node:fs');
const path = require('node:path');
const Babel = require('../vendor/babel.js');

const root = path.resolve(__dirname, '..');
const pairs = [
  ['src/data.jsx', 'src/data.login.compiled.js'],
  ['src/login.jsx', 'src/login.compiled.js'],
];
const banner = '// GENERATED: scripts/build_login_fast.cjs; edit the .jsx source, not this file.\n';
const check = process.argv.includes('--check');
let failed = false;

for (const [input, output] of pairs) {
  const original = fs.readFileSync(path.join(root, input), 'utf8');
  // Mismas opciones que los scripts text/babel del login histórico: React, sin plugins extra.
  const result = Babel.transform(original, {
    filename: input,
    presets: ['react'],
    comments: false,
    compact: true,
  });
  const generated = banner + result.code + '\n';
  const target = path.join(root, output);
  if (check) {
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== generated) {
      console.error('STALE BUILD: ' + output + ' — ejecutar node scripts/build_login_fast.cjs');
      failed = true;
    } else {
      console.log('PASS ' + output + ' (' + Buffer.byteLength(generated) + ' bytes)');
    }
  } else {
    fs.writeFileSync(target, generated, 'utf8');
    console.log('BUILT ' + output + ' (' + Buffer.byteLength(generated) + ' bytes)');
  }
}
if (failed) process.exitCode = 1;
