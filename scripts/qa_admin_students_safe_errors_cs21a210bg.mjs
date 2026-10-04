import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE='fc3fe0c838859ea2247c6ef6bcd06ec315bad6ce';
const PRE='0df389cb1f08fbc8a616f52e28bb21123c964349';
const CANDIDATE='4c68e11919f4ba5b2c697c5adf35758585133a54';
const path='src/admin_students.jsx';
const hash=(text)=>execFileSync('git',['hash-object','--stdin'],{input:text,encoding:'utf8'}).trim();
const currentHash=()=>execFileSync('git',['hash-object',path],{encoding:'utf8'}).trim();

const pre=execFileSync('git',['show',BASE+':'+path],{encoding:'utf8',maxBuffer:20*1024*1024});
if(hash(pre)!==PRE) throw new Error('current-main preimage hash mismatch '+hash(pre));

const current=fs.readFileSync(path,'utf8');
if(currentHash()!==CANDIDATE) throw new Error('C2-R14 candidate blob mismatch '+currentHash());

for (const invariant of [
  'adminStudentsSafeUserError(r.error || r.mensaje,',
  'adminStudentsSafeUserError(data.error || data.mensaje,',
  'adminStudentsSafeUserError(data.mensaje || data.error,',
  'adminStudentsSafeUserError(data && (data.mensaje || data.error),',
]) {
  if (!current.includes(invariant)) throw new Error('safe-error invariant missing: '+invariant);
}
for (const forbidden of [
  'setResyncEst({codigo,loading:false,ok:r.ok,error:r.error});',
  '{ error:data.error || data.mensaje }',
  '{ error:data.mensaje || data.error, search_url:data.search_url }',
]) {
  if (current.includes(forbidden)) throw new Error('old raw sink returned: '+forbidden);
}

const preview1="error: (preview && (preview.error || preview.mensaje)) || 'No se pudo preparar la vista previa'";
const preview2="error:(preview && (preview.error || preview.mensaje)) || 'No se pudo preparar la regeneración'";
if(!current.includes(preview1)||!current.includes(preview2)) throw new Error('render-sanitized preview setters changed');

for (const invariant of [
  "postAdminStudents('getProspectoDetalle'",
  "postAdminStudents('descargarMatriculaFirmadaPrivada'",
  "postAdminStudents('subirMatriculaFirmadaVentas'",
  'Matrícula firmada vigente',
  'Reemplazar firmado',
  'El histórico anterior se conserva.',
  "fn:'generarDocumento'",
]) {
  if (!current.includes(invariant)) throw new Error('C2-R14 admin invariant missing: '+invariant);
}

const out=execFileSync('node',['scripts/audit_raw_user_error_surface_v3_cs21a210s.mjs'],{encoding:'utf8',maxBuffer:20*1024*1024});
const findings=Number((out.match(/DIRECT_RAW_SINK_FINDINGS=(\d+)/)||[])[1]);
const files=Number((out.match(/FILES_WITH_FINDINGS=(\d+)/)||[])[1]);
if(findings!==24||files!==13) throw new Error('unexpected V3 '+findings+'/'+files);
if(!/FILE_COUNT\|2\|src[\\/]admin_students\.jsx/.test(out)) throw new Error('admin_students should retain exactly two historical scanner findings already sanitized at render');

console.log('CS21A210BG admin_students safe errors PASS');
console.log('PREIMAGE='+PRE);
console.log('CANDIDATE='+CANDIDATE);
console.log('V3='+findings+'/'+files);
console.log('E2=NO');
