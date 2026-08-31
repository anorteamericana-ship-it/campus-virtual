import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const BASE='d936100f5158c808e50f6122b414613cd4fa8442';
const PREIMAGE='6f1197412a11cd5ee2f20cf251d7d876aa0b57c4';
const EXPECTED='44f859bb7bb4088e6a46a2a1981b357772cd7a82';
const HISTORICAL_HEAD='8420891483d968bd225aedcd95b9d18e2a74312a';
const exactScope=process.argv.includes('--exact-scope');
const must=(ok,label)=>{if(!ok)throw new Error(`CS21A210J FAIL: ${label}`)};
const buf=fs.readFileSync('src/becas_admin.jsx');
const src=buf.toString('utf8');
const blobSha=crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

must(blobSha===EXPECTED,`exact historical blob imported: ${blobSha}`);
must(src.includes("function bkSafeUserError(raw, fallback, context = '')"),'Becas sanitizer exists');
must(src.includes("console.warn('[AdminBecas] Detalle técnico oculto al operador.'"),'technical details console-only');

for(const expected of [
  "bkSafeUserError(res?.error || res?.mensaje, 'No se pudo crear la beca. Intentá de nuevo.', 'crear_beca')",
  "bkSafeUserError(r?.error || r?.mensaje, 'No se pudo cargar la lista de becas. Intentá de nuevo.', 'cargar_becas')",
  "bkSafeUserError(res?.error || res?.mensaje, 'No se pudo cambiar el estado. Intentá de nuevo.', 'cambiar_estado_beca')",
  "bkSafeUserError(res?.error || res?.mensaje, 'No se pudo cambiar la visibilidad. Intentá de nuevo.', 'cambiar_visibilidad_beca')",
  "bkSafeUserError(res?.error || res?.mensaje, 'No se pudo guardar la beca. Intentá de nuevo.', 'editar_beca')",
]) must(src.includes(expected),`safe action boundary: ${expected}`);

for(const bad of [
  "msg: (res && res.error) || 'No se pudo crear la beca.'",
  "setErr((r && r.error) || 'No se pudo cargar la lista de becas.')",
  '.catch(e => setErr(e.message))',
  "msg: (res && res.error) || 'No se pudo cambiar el estado.'",
  "msg: (res && res.error) || 'No se pudo cambiar la visibilidad.'",
  "msg: (res && res.error) || 'No se pudo guardar.'",
]) must(!src.includes(bad),`raw sink absent: ${bad}`);

must((src.match(/finally \{ setEnviando\(false\); \}/g)||[]).length===2,'create/edit sending state released');
must((src.match(/finally \{ setBusy\(null\); \}/g)||[]).length===2,'toggle busy states released');

for(const keep of [
  'window.crearBeca({','window.editarBeca({',
  'window.cambiarBecaActivo({ id: b.id, activo: !b.activa })',
  'window.cambiarBecaVisibilidad({ id: b.id, visible: !b.visible_inscripcion })',
  'window.getBecas({})','pct_matricula','pct_cuota','cupo_total','compatible_ina','compatible_sin_ina','visible_inscripcion'
]) must(src.includes(keep),`business contract preserved: ${keep}`);

if(exactScope){
  const changed=execFileSync('git',['diff','--name-only',`${BASE}...HEAD`],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean).sort();
  const allowed=[
    '.github/workflows/qa-admin-becas-current-tip-cs21a210j.yml',
    '00_DOCUMENTACION/ADMIN_BECAS_CURRENT_TIP_CS21A210J_2026-08-31.md',
    'scripts/qa_admin_becas_current_tip_cs21a210j.mjs',
    'src/becas_admin.jsx',
  ].sort();
  must(JSON.stringify(changed)===JSON.stringify(allowed),`exact scope mismatch: ${changed.join(', ')}`);
}

console.log('CS21A210J ADMIN BECAS CURRENT TIP: PASS');
console.log(`BASE=${BASE}`);
console.log(`PREIMAGE=${PREIMAGE}`);
console.log(`HISTORICAL_HEAD=${HISTORICAL_HEAD}`);
console.log(`EXPECTED_BLOB=${EXPECTED}`);
console.log('EXACT_HISTORICAL_IMPORT=YES');
console.log('BUSINESS_LOGIC=PRESERVED');
console.log(`EXACT_SCOPE=${exactScope?'VERIFIED':'SKIPPED'}`);
console.log('EVIDENCE=E0_E1_SOURCE_ONLY');
console.log('APPS_SCRIPT_WRITE=NO');
console.log('DRIVE_ACL_CHANGE=NO');
console.log('PROD=NOT_TOUCHED');
