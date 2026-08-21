import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const files={
  jsx:'src/inscripcion.jsx',
  css:'styles/inscripcion.css',
  scanner:'src/document-scanner.js'
};
for(const p of Object.values(files)) if(!fs.existsSync(p)) throw new Error('Falta '+p);

const jsx=fs.readFileSync(files.jsx,'utf8');
const css=fs.readFileSync(files.css,'utf8');
const scanner=fs.readFileSync(files.scanner,'utf8');

const checks=[
  [scanner.includes('async function normalizeWithCorners('),'scanner expone normalización por 4 esquinas'],
  [scanner.includes("detectionMethod: 'manual_corners'") || scanner.includes("detectionMethod:'manual_corners'"),'recorte manual trazable'],
  [scanner.includes('normalizeWithCorners,'),'API pública incluye normalizeWithCorners'],
  [jsx.includes('function ManualCornerEditor('),'editor manual presente'],
  [jsx.includes('Ajustar esquinas'),'acción Ajustar esquinas visible'],
  [jsx.includes('onPointerMove={move}') && jsx.includes('onPointerDown={e=>begin(e,i)}'),'drag táctil/mouse por Pointer Events'],
  [jsx.includes('window.ANDocumentScanner.normalizeWithCorners'),'frontend usa scanner manual local'],
  [jsx.includes('original:preview.original'),'original preservado al recalcular'],
  [css.includes('CS21A146 · ajuste manual de cuatro esquinas'),'CSS manual presente'],
  [css.includes('touch-action:none'),'gesto táctil controlado'],
  [!scanner.includes('XMLHttpRequest'),'scanner manual sin XHR'],
  [!scanner.includes('fetch('),'scanner manual sin fetch']
];

let fail=false;
for(const [ok,label] of checks){
  console.log((ok?'PASS ':'FAIL ')+label);
  if(!ok) fail=true;
}

for(const p of ['src/document-scanner.js']){
  const syntax=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});
  console.log((syntax.status===0?'PASS ':'FAIL ')+'sintaxis '+p);
  if(syntax.status!==0){ console.error(syntax.stderr); fail=true; }
}

if(fail) process.exit(1);
console.log('CS21A146 manual-corners static QA PASS');
