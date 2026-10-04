import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const EXPECTED_BLOB='8ef1c14088d489267baa68cf76810d4291538be3';
const blob=execFileSync('git',['hash-object','src/admin_students.jsx'],{encoding:'utf8'}).trim();
const src=fs.readFileSync('src/admin_students.jsx','utf8');
const app=fs.readFileSync('src/app.jsx','utf8');
if(!app.includes("admin_students: ['src/admin_students.jsx")) throw new Error('admin_students effective route missing');

const effective=[
  'setResyncEst({codigo,loading:false,ok:r.ok,error:r.error})',
  '{ error:data.error || data.mensaje }',
  '{ error:data.mensaje || data.error, search_url:data.search_url }',
  "{ error:(data && (data.mensaje || data.error)) || 'No se pudo regenerar el certificado.' }",
  "{ error:(data && (data.mensaje || data.error)) || 'No se pudo generar el certificado.' }",
];
const certPreview1="error: (preview && (preview.error || preview.mensaje)) || 'No se pudo preparar la vista previa'";
const certPreview2="error:(preview && (preview.error || preview.mensaje)) || 'No se pudo preparar la regeneración'";

if(blob===EXPECTED_BLOB){
  for(const token of effective){ if(!src.includes(token)) throw new Error(`effective sink missing: ${token}`); }
  if(!src.includes("resyncEst?.codigo===codigo&&resyncEst.error?'Error: '+resyncEst.error")) throw new Error('resync error projection missing');
  if(!src.includes('>❌ {r.error}</div>')) throw new Error('document error projection missing');
  if(!src.includes('>❌ {certResult.error}{certResult.search_url')) throw new Error('certificate error projection missing');
  if(!src.includes(certPreview1)||!src.includes(certPreview2)) throw new Error('cert preview findings changed');
  if(!src.includes("adminStudentsSafeUserError(certEstado.mensaje || certEstado.error, 'No se pudo completar la operación de certificados. Intentá de nuevo.', 'certificados')")) throw new Error('certEstado render sanitizer missing');

  const out=execFileSync('node',['scripts/audit_raw_user_error_surface_v3_cs21a210s.mjs'],{encoding:'utf8'});
  if(!out.includes('FILE_COUNT|7|src/admin_students.jsx')) throw new Error('V3 admin_students count changed');
  const report=fs.readFileSync('00_DOCUMENTACION/ADMIN_STUDENTS_ERROR_BOUNDARY_CS21A210BF_2026-09-01.md','utf8');
  for(const marker of ['EFFECTIVE_VISIBLE · 5','ALREADY_SANITIZED_AT_RENDER · 2','BACKEND CURRENT SNAPSHOT UNVERIFIED']) if(!report.includes(marker)) throw new Error(`report marker missing ${marker}`);
  console.log('CS21A210BF admin_students exact audit snapshot PASS');
  console.log('EFFECTIVE_VISIBLE=5');
  console.log('ALREADY_SANITIZED_AT_RENDER=2');
} else {
  execFileSync('node',['scripts/qa_admin_students_safe_errors_cs21a210bg.mjs'],{stdio:'inherit'});
  for(const token of effective){ if(src.includes(token)) throw new Error(`BF descendant resurrected raw effective sink: ${token}`); }
  if(!src.includes(certPreview1)||!src.includes(certPreview2)) throw new Error('BF descendant preview setters changed');
  if(!src.includes("adminStudentsSafeUserError(certEstado.mensaje || certEstado.error, 'No se pudo completar la operación de certificados. Intentá de nuevo.', 'certificados')")) throw new Error('BF descendant render sanitizer missing');
  const out=execFileSync('node',['scripts/audit_raw_user_error_surface_v3_cs21a210s.mjs'],{encoding:'utf8'});
  if(!out.includes('FILE_COUNT|2|src/admin_students.jsx')) throw new Error('BF descendant should retain exactly two render-sanitized scanner findings');
  console.log('CS21A210BF descendant safe via BG PASS');
  console.log('EFFECTIVE_VISIBLE_RAW=0');
  console.log('ALREADY_SANITIZED_AT_RENDER=2');
}
console.log('E2=NO');
