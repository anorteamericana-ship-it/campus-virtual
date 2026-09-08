import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE='24067c41445e5aacee9fe33a230c653efd4cfdf8';
const app=execFileSync('git',['show',`${BASE}:src/app.jsx`],{encoding:'utf8',maxBuffer:20*1024*1024});
const op=execFileSync('git',['show',`${BASE}:src/docente_operativo.jsx`],{encoding:'utf8',maxBuffer:20*1024*1024});
const teacher=execFileSync('git',['show',`${BASE}:src/teacher_views.jsx`],{encoding:'utf8',maxBuffer:30*1024*1024});
const admin=execFileSync('git',['show',`${BASE}:src/admin_students.jsx`],{encoding:'utf8',maxBuffer:30*1024*1024});
const guard=execFileSync('git',['show',`${BASE}:qa/apps_script_qa_guard_cs21a138.gs`],{encoding:'utf8',maxBuffer:10*1024*1024});
const report=fs.readFileSync('00_DOCUMENTACION/C4_WRITE_SEMANTICS_AUDIT_2026-09-08.md','utf8');
const must=(c,m)=>{if(!c) throw new Error(m);};

must(app.includes("docente_operativo: ['src/vista_docente.jsx") && app.includes("'src/teacher_views.jsx") && app.includes("'src/docente_operativo.jsx"),'docente_operativo effective route changed');
for(const token of [
  "docOpPost('registrarNotaComponenteOficial'",
  'codigo: est.code',
  'cod_estudiante: est.code',
  'grupo,',
  'cod_grupo: grupo',
  'nivel,',
  'componente: d.tipo',
  'tipo_eval: d.tipo',
  'nota_100: nota',
  'registrado_por:',
  'nota < 0 || nota > 100',
]) must(op.includes(token),`operational grade token missing: ${token}`);

must(teacher.includes('Promise.allSettled('),'teacher batch Promise.allSettled missing');
must(teacher.includes('estudiantesConNota.map'),'teacher grade batch mapping missing');
must(teacher.includes('?fn=registrarNotaEstatus'),'teacher registrarNotaEstatus endpoint missing');

must(admin.includes("postAdminStudents('registrarNotaComponenteOficial', payload)"),'admin official grade endpoint missing');
must(admin.includes("postAdminStudents('registrarNotaEstatus', { ...payload, nota: puntosCalc })"),'admin legacy fallback transform missing');

must(guard.includes('var _qaRegistrarNotaBaseCS21A138_ = registrarNotaEstatus;'),'historical registrarNota guard missing');
must(guard.includes('_qaRequireWriteCS21A138_(body, { student:true, group:true })'),'historical registrarNota identity guard changed');

for(const marker of [
  'un solo handler y un solo estudiante sintético',
  'nota: puntosCalc',
  'append vs upsert',
  'C4 continúa `E4 STOP`',
  'E2/E3/E4: NO',
]) must(report.includes(marker),`report marker missing: ${marker}`);

console.log('C4_WRITE_SEMANTICS=PASS_E0');
console.log('CURRENT_OPERATIONAL_UI=registrarNotaComponenteOficial');
console.log('LEGACY_REGISTRAR_NOTA=SEPARATE_DIRECT_E4_ONLY');
console.log('BATCH_AND_ADMIN_FALLBACK=NOT_ALLOWED_FOR_FIRST_E4');
console.log('C4_E4=STOP_PENDING_C0_AND_REHEARSAL_SOURCE');
