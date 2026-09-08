import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE='00cec69010807bc0c67ee79f0d34b280fc372df3';
const view=execFileSync('git',['show',`${BASE}:src/vista_docente.jsx`],{encoding:'utf8',maxBuffer:20*1024*1024});
const guard=execFileSync('git',['show',`${BASE}:qa/apps_script_qa_guard_cs21a138.gs`],{encoding:'utf8',maxBuffer:10*1024*1024});

const must=(cond,msg)=>{ if(!cond) throw new Error(msg); };

for(const token of [
  'const asistencias = {};',
  'const retroalimentacion = {};',
  'const progress_check = {};',
  'for (const s of students)',
  'asistencias[s.code] = !!f.presente;',
  "if (f.retro.trim()) retroalimentacion[s.code] = f.retro.trim();",
  "if (includesPC && f.pc.trim()) progress_check[s.code] = f.pc.trim();",
  "if (!f.retro.trim())",
  "if (includesPC && !f.pc.trim())",
]) must(view.includes(token),`canonical C3 token missing: ${token}`);

must(guard.includes('var asistencia = body && body.asistencias || {};'),'historical guard assistance map missing');
must(guard.includes('var codes = Object.keys(asistencia);'),'historical guard key extraction missing');
must(guard.includes("String(code).toUpperCase().indexOf('QA-') !== 0"),'historical QA prefix check missing');
must(!guard.includes('Object.keys(body.retroalimentacion'),'historical guard unexpectedly validates feedback keys');
must(!guard.includes('Object.keys(body.progress_check'),'historical guard unexpectedly validates progress keys');

const report=fs.readFileSync('00_DOCUMENTACION/C3_IDENTITY_DOMAIN_AUDIT_2026-09-08.md','utf8');
for(const marker of ['P2 · E0 · gap de defensa/harness','keys(retroalimentacion) = keys(asistencias)','C0-SCHEMA62 debe estar cerrado primero','E2/E3/E4: NO']) must(report.includes(marker),`report marker missing: ${marker}`);

console.log('C3_IDENTITY_DOMAIN=PASS_E0');
console.log('CANONICAL_UI_IDENTITY_DOMAIN=COUPLED_TO_ASISTENCIAS');
console.log('DIRECT_PAYLOAD_DEFENSE_GAP=P2_E0');
console.log('C3_E4=STOP_PENDING_C0_AND_REHEARSAL_SOURCE');
