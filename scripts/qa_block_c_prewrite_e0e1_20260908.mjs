import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const must=(ok,msg)=>{ if(!ok) throw new Error(`BLOCK_C_PREWRITE_FAIL: ${msg}`); };
const hash=p=>execFileSync('git',['hash-object',p],{encoding:'utf8'}).trim();

const expected={
  'src/inscripcion.jsx':'78a94f6f3b8420027f69ce6d2e545a682ed99da3',
  'src/matriculas_admin.jsx':'e87e89ff00a023fd6961e7447b55561e002b45fb',
  'src/data.jsx':'f9f1a414f6cd951aecb5390a33254d513a987358',
  'src/ventas_drawer.jsx':'273ab0a22fa8b03ab5e3821c20ee742dea4b4668',
  'src/vista_docente.jsx':'ec415d0ba2c1b52c56732cc6d09a11e026cbfbd4',
  'src/teacher_views.jsx':'1a074b296da58dcb3aaf475475edb86aa70afa3d',
  'qa/apps_script_qa_guard_cs21a138.gs':'26a011034a64df9bf5e00d2cd48baa757f7e379d',
};
for(const [p,h] of Object.entries(expected)) must(fs.existsSync(p) && hash(p)===h,`preimage drift ${p}: ${fs.existsSync(p)?hash(p):'missing'}`);

const ins=fs.readFileSync('src/inscripcion.jsx','utf8');
for(const x of ["insPost('crearInscripcionPublica', payload)","origen_web: 'INSCRIPCION_PUBLICA_IP5A'",'generar_pdf_identidad_conape: true','grupo_tentativo: selectedGroup.codigo']) must(ins.includes(x),`C1 inscripción contract missing ${x}`);

const mat=fs.readFileSync('src/matriculas_admin.jsx','utf8');
for(const x of ["fn: 'generarMatricula'",'cedula,','grupo: grupoSel.codigo']) must(mat.includes(x),`C1 matrícula contract missing ${x}`);

const ventas=fs.readFileSync('src/ventas_drawer.jsx','utf8');
for(const x of ["origen: 'VENDEDOR'",'numero_comprobante: numComp.trim()','monto_reportado: parseFloat(monto)','foto_base64:','await window.reportarPago(body)']) must(ventas.includes(x),`C2 reportarPago contract missing ${x}`);

const data=fs.readFileSync('src/data.jsx','utf8');
must(data.includes("_solpPost('reportarPago', body)"),'C2 reportarPago transport missing');
must(data.includes("fn: 'cerrarLeccionCompleta'"),'C3 close transport missing');

const vista=fs.readFileSync('src/vista_docente.jsx','utf8');
for(const x of ['cod_grupo: lec.cod_grupo','nivel: lec.nivel','leccion: leccionNum','riel,','docente_real: docenteNombre','registrado_por: registradoPor || docenteNombre','asistencias,','retroalimentacion,','progress_check,']) must(vista.includes(x),`C3 payload missing ${x}`);

const teacher=fs.readFileSync('src/teacher_views.jsx','utf8');
for(const x of ["?fn=registrarNotaEstatus",'cod_estudiante: r.code','grupo:          codGrupo','tipo_eval:      tipoEval','leccion_num:    lec','nota:           parseFloat(notas[r.code])','registrado_por: \'DOCENTE\'']) must(teacher.includes(x),`C4 payload missing ${x}`);

const apply=fs.readFileSync('src/aplicar_pago.jsx','utf8');
for(const x of ["fn:             'aplicarPago'",'request_id:     requestIdRef.current','doc:            compr.doc','monto_total:    total','rubros,']) must(apply.includes(x),`C2 aplicarPago contract missing ${x}`);

const report=fs.readFileSync('00_DOCUMENTACION/BLOQUE_C_PREWRITE_E0_E1_2026-09-08.md','utf8');
for(const x of ['BLOQUEADO_HUMANO','65','B1=CA','B2=PE','I1=PE','I2=PE','request_id','Promise.allSettled','Issue #272','E4 STOP']) must(report.includes(x),`report marker missing ${x}`);

const changed=execFileSync('git',['diff','--name-only','6b747fdbb1aeb4d610ad54ace2ded856fc3f95cc...HEAD'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
const allowed=new Set(['00_DOCUMENTACION/BLOQUE_C_PREWRITE_E0_E1_2026-09-08.md','scripts/qa_block_c_prewrite_e0e1_20260908.mjs','.github/workflows/qa-block-c-prewrite-e0e1-20260908.yml']);
for(const p of changed) must(allowed.has(p),`unexpected changed path ${p}`);

console.log('BLOCK C PREWRITE E0/E1 PASS');
console.log('BACKEND_REHEARSAL_SOURCE=UNVERIFIED_IN_GITHUB');
console.log('C0=BLOQUEADO_HUMANO');
console.log('C1_C2_C3_C4=E0_E1_ONLY');
console.log('E4=STOP');
