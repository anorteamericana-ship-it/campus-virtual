// F111 HISTORY-01 · contrato de UI sin sesión, notas ni tráfico real.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=fs.readFileSync('src/examenes_app.jsx','utf8');
const bundle=fs.readFileSync('src/examenes_bundle.jsx','utf8');
const marker='// ===== examenes_app.jsx =====';
const pos=bundle.indexOf(marker);
assert.ok(pos>0&&bundle.indexOf(marker,pos+1)<0,'sección app única');
const norm=x=>x.replace(/\r\n/g,'\n').trim();
assert.equal(norm(bundle.slice(pos+marker.length)),norm(app),
  'app completa idéntica al segmento app del bundle');
const begin=app.indexOf('function StudentWrittenHistoryF111()');
const end=app.indexOf('function App() {',begin);
assert.ok(begin>0&&end>begin,'componente de historial aislado');
const history=app.slice(begin,end);
for(const token of [
  "examPostLive('examListStudentWrittenHistory',{})",
  "examGetStudentWrittenReceiptPdf",
  "examGetStudentWrittenFinalReportPdf",
  "String(r.attempt_id||'')!==id",
  "r.mime!=='application/pdf'",
  "binary.slice(0,4)!=='%PDF'",
  "/^F111-RES-[A-F0-9]{20}$/",
  "URL.revokeObjectURL(url)",
  "data-f111-student-written-history",
  "data-f111-history-receipt",
  "data-f111-history-final"
])assert.ok(history.includes(token),'contrato faltante: '+token);
assert.ok(!history.includes('FINAL_SCORE_100'),'no se deriva nota del navegador');
assert.ok(!history.includes('setStage('),'historial no reabre exámenes');
assert.ok(!history.includes('localStorage'),'no persistir PDFs en navegador');
const studentBlock=app.slice(app.indexOf("if (INITIAL_VIEW_CONFIG.role === 'student')"),app.indexOf("// Docente: vista operativa limpia"));
assert.ok(studentBlock.includes('<StudentWrittenHistoryF111 />'));
assert.ok(studentBlock.includes('<StudentLiveExamApp />'));
assert.ok(!app.slice(app.indexOf("if (INITIAL_VIEW_CONFIG.role === 'teacher')")).includes('<StudentWrittenHistoryF111 />'),
 'el componente no se monta en la ruta docente/admin');
console.log('F111 HISTORY-01 FRONT PASS: estudiante, grupo anterior, endpoints autenticados, PDF seguro, bundle sincronizado');
