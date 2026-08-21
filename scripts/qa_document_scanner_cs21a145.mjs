import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const files={
  jsx:'src/inscripcion.jsx',
  html:'inscripcion.html',
  css:'styles/inscripcion.css',
  scanner:'src/document-scanner.js'
};
for(const p of Object.values(files)) if(!fs.existsSync(p)) throw new Error('Falta '+p);

const jsx=fs.readFileSync(files.jsx,'utf8');
const html=fs.readFileSync(files.html,'utf8');
const css=fs.readFileSync(files.css,'utf8');
const scanner=fs.readFileSync(files.scanner,'utf8');

// CS21A145 QA: no buscar la palabra "OCR" de forma literal porque el propio
// comentario de seguridad "No OCR" provocaba un falso FAIL. En cambio se
// bloquean motores/APIs OCR concretos y cualquier salida de red desde scanner.
const ocrSurface=(scanner+'\n'+html).toLowerCase();
const forbiddenOcrPatterns=[
  /tesseract(?:\.js)?/,
  /ocrad(?:\.js)?/,
  /ocr\.space/,
  /vision\.googleapis\.com/,
  /cloudvision/,
  /google[\s_-]*vision/,
  /mlkit/,
  /text[\s_-]*recognizer/,
  /recognize[\s_-]*text/,
  /paddleocr/,
  /easyocr/
];
const hasOcrEngine=forbiddenOcrPatterns.some(re=>re.test(ocrSurface));

const checks=[
  [jsx.includes("const INS_VERSION = 'F98.4-Z6-IP4B';"),'frontend IP4B'],
  [jsx.includes('foto_ced_frente_original'),'frente original en estado'],
  [jsx.includes('foto_ced_dorso_original'),'dorso original en estado'],
  [jsx.includes('foto_titulo_original'),'título original en estado'],
  [jsx.includes('documento_identidad_pdf'),'PDF identidad alternativo'],
  [jsx.includes('titulo_pdf'),'PDF título alternativo'],
  [jsx.includes('DocumentImageUpload'),'uploader scanner imágenes'],
  [jsx.includes('PdfDocumentUpload'),'uploader PDF passthrough'],
  [jsx.includes("documento_identidad_modo: form.documento_identidad_pdf ? 'PDF_ORIGINAL' : 'FOTOS_NORMALIZADAS'"),'modo identidad explícito'],
  [jsx.includes("titulo_modo: form.titulo_pdf ? 'PDF_ORIGINAL' : 'IMAGEN_NORMALIZADA'"),'modo título explícito'],
  [jsx.includes('generar_pdf_identidad_conape: !form.documento_identidad_pdf'),'generador PDF solo en ruta fotos'],
  [html.includes('https://docs.opencv.org/4.10.0/opencv.js'),'OpenCV oficial cargado'],
  [html.includes('src/document-scanner.js?v=CS21A145-1'),'scanner local cargado'],
  [css.includes('CS21A145 · scanner documental + PDF passthrough'),'CSS scanner'],
  [scanner.includes("status:'PDF_ORIGINAL_REQUIERE_REVISION_ASESOR'"),'PDF queda para revisión asesor'],
  [scanner.includes('cv.getPerspectiveTransform'),'corrección perspectiva local'],
  [scanner.includes('cv.findContours'),'detección de bordes local'],
  [scanner.includes('requiresRetake: score < 60'),'calidad baja fuerza repetición'],
  [!hasOcrEngine,'scanner no incorpora motor/API OCR'],
  [!scanner.includes('fetch('),'scanner no envía documentos a red'],
  [!scanner.includes('XMLHttpRequest'),'scanner no usa XHR'],
];

let fail=false;
for(const [ok,label] of checks){
  console.log((ok?'PASS ':'FAIL ')+label);
  if(!ok) fail=true;
}

const syntax=spawnSync(process.execPath,['--check',files.scanner],{encoding:'utf8'});
console.log((syntax.status===0?'PASS ':'FAIL ')+'sintaxis document-scanner.js');
if(syntax.status!==0){ console.error(syntax.stderr); fail=true; }

if(fail) process.exit(1);
console.log('CS21A145 frontend static QA PASS');
