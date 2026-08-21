import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const scannerPath='src/document-scanner.js';
const writerPath='scripts/write_document_scanner_lab_cs21a147.mjs';
for(const p of [scannerPath,writerPath]) if(!fs.existsSync(p)) throw new Error('Falta '+p);
const scanner=fs.readFileSync(scannerPath,'utf8');
const writer=fs.readFileSync(writerPath,'utf8');
let fail=false;
function check(ok,label){console.log((ok?'PASS ':'FAIL ')+label);if(!ok)fail=true;}
function close(a,b,eps=1e-7){return Math.abs(a-b)<=eps;}

const staticChecks=[
  [scanner.includes("version:'CS21A149-1'"),'scanner CS21A149-1'],
  [!/(ensureCv|detectCorners|normalizeImage|processFile|CV_URLS|docs\.opencv\.org|\bcv\.)/i.test(scanner),'OpenCV y rutas automáticas eliminadas del scanner final'],
  [scanner.includes('function validateQuad('),'validador geométrico real'],
  [scanner.includes('scanner_puntos_cruzados'),'cruces rechazados'],
  [scanner.includes('scanner_cuadrilatero_no_convexo'),'no convexos rechazados'],
  [scanner.includes('scanner_coordenada_no_finita'),'guardia coordenadas no finitas'],
  [scanner.includes("if(Math.abs(den)<1e-9)"),'guardia denominador homografía'],
  [!scanner.includes("out.height>out.width"),'sin autorrotación por relación ancho/alto'],
  [scanner.includes('rotateSource90'),'rotación manual explícita'],
  [scanner.includes('qualityCalibrated:false'),'calidad marcada como no calibrada'],
  [scanner.includes('cropMs')&&scanner.includes('longTasks')&&scanner.includes('jpgBytes'),'benchmark scanner presente'],
  [!scanner.includes('original:')&&!scanner.includes('source,original'),'API final no expone original/source como resultado'],
  [writer.includes('Rotar 90°'),'botón Rotar 90°'],
  [writer.includes('Reiniciar esquinas'),'botón Reiniciar esquinas'],
  [writer.includes('magnifier'),'lupa 3×'],
  [writer.includes('Prueba reproducible 90°')&&writer.includes('Prueba reproducible 180°'),'fixtures orientación 90°/180°'],
  [writer.includes('Tiempo hasta editor')&&writer.includes('Tiempo de recorte')&&writer.includes('Long tasks')&&writer.includes('Memoria aproximada'),'benchmark visible en laboratorio'],
  [writer.includes('Posible borde cortado'),'advertencia posible borde cortado'],
  [writer.includes('ESTA ES LA ÚNICA IMAGEN QUE SE SUBIRÁ'),'contrato de una sola imagen final'],
  [!writer.includes('ensureCv')&&!writer.includes('detectCorners'),'laboratorio sin rutas OpenCV']
];
for(const [ok,label] of staticChecks) check(ok,label);

try{
  const window={__AN_SCANNER_QA__:true};
  const context=vm.createContext({window,console,setTimeout,clearTimeout,TextEncoder});
  vm.runInContext(scanner,context,{filename:scannerPath});
  const api=window.ANDocumentScanner;
  assert(api&&api.__qa,'faltan hooks QA');
  const q=api.__qa;
  const valid=[{x:.1,y:.1},{x:.9,y:.1},{x:.9,y:.9},{x:.1,y:.9}];
  check(q.validateQuad(valid).valid,'QA matemática · rectángulo válido');
  const crossed=[{x:.1,y:.1},{x:.9,y:.9},{x:.9,y:.1},{x:.1,y:.9}];
  const cr=q.validateQuad(crossed);
  check(!cr.valid&&cr.code==='scanner_puntos_cruzados','QA matemática · puntos cruzados rechazados');
  const dup=[{x:.1,y:.1},{x:.1,y:.1},{x:.9,y:.9},{x:.1,y:.9}];
  check(!q.validateQuad(dup).valid,'QA matemática · puntos duplicados rechazados');
  const thin=[{x:.1,y:.1},{x:.9,y:.1},{x:.9,y:.10001},{x:.1,y:.10001}];
  check(!q.validateQuad(thin).valid,'QA matemática · geometría casi degenerada rechazada');
  const nan=[{x:.1,y:.1},{x:NaN,y:.1},{x:.9,y:.9},{x:.1,y:.9}];
  check(!q.validateQuad(nan).valid&&q.validateQuad(nan).code==='scanner_coordenada_no_finita','QA matemática · NaN rechazado');
  const inf=[{x:.1,y:.1},{x:Infinity,y:.1},{x:.9,y:.9},{x:.1,y:.9}];
  check(!q.validateQuad(inf).valid,'QA matemática · Infinity rechazado');

  const rect=[{x:0,y:0},{x:100,y:0},{x:100,y:60},{x:0,y:60}];
  const H0=q.homographyDestToSource(rect,rect);
  check(rect.every((p,i)=>{const r=q.projectPoint(H0,p.x,p.y);return close(r.x,rect[i].x)&&close(r.y,rect[i].y)}),'QA matemática · homografía identidad');
  const src=[{x:12,y:8},{x:118,y:15},{x:105,y:84},{x:6,y:70}];
  const H1=q.homographyDestToSource(rect,src);
  check(rect.every((p,i)=>{const r=q.projectPoint(H1,p.x,p.y);return close(r.x,src[i].x,1e-6)&&close(r.y,src[i].y,1e-6)}),'QA matemática · perspectiva conocida mapea esquinas correctamente');
  let singular=false;try{q.homographyDestToSource(rect,[{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0}])}catch(e){singular=String(e.message)==='scanner_geometria_invalida'}
  check(singular,'QA matemática · homografía singular rechazada');
  let denGuard=false;try{q.projectPoint([1,0,0,0,1,0,-1,0,1],1,0)}catch(e){denGuard=String(e.message)==='scanner_geometria_invalida'}
  check(denGuard,'QA matemática · denominador cero rechazado');
}catch(err){console.error('FAIL QA matemática: '+(err&&err.stack||err));fail=true;}

for(const p of [scannerPath,writerPath]){
  const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});
  check(r.status===0,'sintaxis '+p);
  if(r.status!==0&&r.stderr) console.error(r.stderr);
}
if(fail) process.exit(1);
console.log('CS21A149 scanner QA PASS');
