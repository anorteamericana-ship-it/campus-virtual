import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const must=(ok,msg)=>{ if(!ok) throw new Error(`C1_RETRY_BOUNDARY_FAIL: ${msg}`); };
const hash=p=>execFileSync('git',['hash-object',p],{encoding:'utf8'}).trim();

const frozen={
  'src/inscripcion.jsx':'78a94f6f3b8420027f69ce6d2e545a682ed99da3',
  'src/matriculas_admin.jsx':'e87e89ff00a023fd6961e7447b55561e002b45fb',
};
for(const [p,h] of Object.entries(frozen)) must(hash(p)===h,`preimage drift ${p}`);

const ins=fs.readFileSync('src/inscripcion.jsx','utf8');
const mat=fs.readFileSync('src/matriculas_admin.jsx','utf8');

const insStart=ins.indexOf('async function submit(){');
const insEnd=ins.indexOf('\n  if(loading && !config',insStart);
must(insStart>=0 && insEnd>insStart,'inscripcion submit boundary missing');
const insSubmit=ins.slice(insStart,insEnd);
must(insSubmit.includes("setSubmitting(true); setSubmitError('');"),'inscripcion UI concurrency gate changed');
must(insSubmit.includes("insPost('crearInscripcionPublica', payload)"),'crearInscripcionPublica call missing');
must(!/request_id|idempot/i.test(insSubmit),'crearInscripcionPublica client operation identity unexpectedly changed; re-audit');

const matStart=mat.indexOf('const generar = async () => {');
const matEnd=mat.indexOf('\n    const footer =',matStart);
must(matStart>=0 && matEnd>matStart,'generarMatricula boundary missing');
const matSubmit=mat.slice(matStart,matEnd);
must(matSubmit.includes('if (!grupoSel || submitting) return;'),'generarMatricula UI concurrency gate changed');
for(const token of ["fn: 'generarMatricula'",'cedula,','grupo: grupoSel.codigo','beca: beca || \'\'','beca_estado: becaEstadoLocal || \'\'']) must(matSubmit.includes(token),`generarMatricula token missing ${token}`);
must(!/request_id|idempot/i.test(matSubmit),'generarMatricula client operation identity unexpectedly changed; re-audit');

const report=fs.readFileSync('00_DOCUMENTACION/C1_RETRY_IDEMPOTENCY_BOUNDARY_2026-09-08.md','utf8');
for(const marker of ['respuesta perdida','no autoriza retry','B1=CA','B2/I1/I2=PE','LOG_ACTIVACIONES','C0-SCHEMA62','E4 PASS']) must(report.includes(marker),`report marker missing ${marker}`);

const changed=execFileSync('git',['diff','--name-only','6ee9b2880e61c12da730ed6fb7f20d654c75e54b...HEAD'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
const allowed=new Set([
  '00_DOCUMENTACION/C1_RETRY_IDEMPOTENCY_BOUNDARY_2026-09-08.md',
  'scripts/qa_c1_retry_idempotency_boundary_20260908.mjs',
  '.github/workflows/qa-c1-retry-idempotency-boundary-20260908.yml',
]);
for(const p of changed) must(allowed.has(p),`unexpected changed path ${p}`);

console.log('C1 RETRY/IDEMPOTENCY BOUNDARY PASS');
console.log('CLIENT_IDEMPOTENCY_KEY=ABSENT_IN_FROZEN_CALLS');
console.log('SERVER_DEDUPE=UNVERIFIED');
console.log('C1_E4=STOP');
