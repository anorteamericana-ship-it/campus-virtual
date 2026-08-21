import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const scannerPath='src/document-scanner.js';
const writerPath='scripts/write_document_scanner_lab_cs21a147.mjs';
for(const p of [scannerPath,writerPath]) if(!fs.existsSync(p)) throw new Error('Falta '+p);

const scanner=fs.readFileSync(scannerPath,'utf8');
const writer=fs.readFileSync(writerPath,'utf8');
const checks=[
  [scanner.includes("version:'CS21A148-1'"),'scanner CS21A148-1'],
  [scanner.includes('function homographyDestToSource('),'homografía nativa'],
  [scanner.includes('async function warpQuadNative('),'warp manual nativo'],
  [scanner.includes("detectionMethod:'manual_native_homography'"),'método manual trazable'],
  [scanner.includes('await new Promise(resolve=>setTimeout(resolve,0))'),'procesamiento cede control a UI'],
  [scanner.includes('SAFE_MARGIN_ID = 0.018'),'margen seguro identidad'],
  [scanner.includes('SAFE_MARGIN_TITLE = 0.012'),'margen seguro título'],
  [!writer.includes('Preparando motor de recorte…'),'laboratorio no espera motor al abrir'],
  [!writer.includes('await window.ANDocumentScanner.ensureCv()'),'laboratorio no inicializa OpenCV al cargar'],
  [!writer.includes('await window.ANDocumentScanner.detectCorners(source,def.kind)'),'selección de foto no lanza detección pesada'],
  [writer.includes('Motor de recorte manual listo · sin carga pesada.'),'estado inmediato del laboratorio'],
  [writer.includes('Subir esta foto'),'confirmación explícita antes de subir'],
  [writer.includes('ESTA ES LA ÚNICA IMAGEN QUE SE SUBIRÁ'),'solo imagen final confirmada'],
  [!scanner.includes('fetch('),'scanner no envía documentos por fetch'],
  [!scanner.includes('XMLHttpRequest'),'scanner no usa XHR']
];
let fail=false;
for(const [ok,label] of checks){console.log((ok?'PASS ':'FAIL ')+label);if(!ok)fail=true;}
for(const p of [scannerPath,writerPath]){
  const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});
  console.log((r.status===0?'PASS ':'FAIL ')+'sintaxis '+p);
  if(r.status!==0){if(r.stderr)console.error(r.stderr);fail=true;}
}
if(fail) process.exit(1);
console.log('CS21A148 manual-native QA PASS');
