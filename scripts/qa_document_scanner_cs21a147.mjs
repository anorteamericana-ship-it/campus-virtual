import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const scannerPath='src/document-scanner.js';
const writerPath='scripts/write_document_scanner_lab_cs21a147.mjs';
for(const p of [scannerPath,writerPath]) if(!fs.existsSync(p)) throw new Error('Falta '+p);

const scanner=fs.readFileSync(scannerPath,'utf8');
const writer=fs.readFileSync(writerPath,'utf8');
const checks=[
  [scanner.includes("version:'CS21A147-1'"),'scanner CS21A147-1'],
  [scanner.includes('async function ensureCv('),'OpenCV con carga robusta'],
  [scanner.includes('CV_URLS'),'fallback de carga OpenCV'],
  [scanner.includes('async function detectCorners('),'sugerencia automática de esquinas'],
  [scanner.includes('async function normalizeWithCorners('),'recorte manual de 4 esquinas'],
  [scanner.includes('SAFE_MARGIN_ID = 0.018'),'margen seguro identidad'],
  [scanner.includes('SAFE_MARGIN_TITLE = 0.012'),'margen seguro título'],
  [scanner.includes('finalImage:'),'salida única finalImage'],
  [!scanner.includes('fetch('),'scanner no envía documentos por fetch'],
  [!scanner.includes('XMLHttpRequest'),'scanner no usa XHR'],
  [writer.includes('Subir esta foto'),'confirmación explícita antes de subir'],
  [writer.includes('ESTA ES LA ÚNICA IMAGEN QUE SE SUBIRÁ'),'solo imagen final en flujo prospecto'],
  [writer.includes("state.source='';state.points=[];state.confirmed=true"),'fuente descartada al confirmar'],
  [writer.includes('Cédula frente') && writer.includes('Cédula dorso') && writer.includes('Título / certificado'),'tres documentos guiados'],
  [writer.includes('PDF de identidad se genera después, internamente'),'PDF fuera del paso prospecto'],
  [!writer.includes('COPIA NORMALIZADA'),'UX ya no habla de copia normalizada']
];
let fail=false;
for(const [ok,label] of checks){console.log((ok?'PASS ':'FAIL ')+label);if(!ok)fail=true;}
for(const p of [scannerPath,writerPath]){
  const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});
  console.log((r.status===0?'PASS ':'FAIL ')+'sintaxis '+p);
  if(r.status!==0){if(r.stderr)console.error(r.stderr);fail=true;}
}
if(fail) process.exit(1);
console.log('CS21A147 scanner/final-photo QA PASS');
