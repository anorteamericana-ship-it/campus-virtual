import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE='ecaa2b58122e15043bde86a050fe9534d8d2618c';
const PRE='8ef1c14088d489267baa68cf76810d4291538be3';
const CANDIDATE='930be81710ed20708c54b6b94c53676a42ee9b8d';
const path='src/admin_students.jsx';
const hash=(text)=>execFileSync('git',['hash-object','--stdin'],{input:text,encoding:'utf8'}).trim();
const currentHash=()=>execFileSync('git',['hash-object',path],{encoding:'utf8'}).trim();

const pre=execFileSync('git',['show',`${BASE}:${path}`],{encoding:'utf8',maxBuffer:20*1024*1024});
if(hash(pre)!==PRE) throw new Error(`preimage hash mismatch ${hash(pre)}`);

const replacements=[
  ["setResyncEst({codigo,loading:false,ok:r.ok,error:r.error});", "setResyncEst({codigo,loading:false,ok:r.ok,error:r.ok?'':adminStudentsSafeUserError(r.error || r.mensaje, 'No se pudo sincronizar CONAPE. Intentá de nuevo.', 'resincronizar_estudiante')});"],
  ["{ error:data.error || data.mensaje }", "{ error:adminStudentsSafeUserError(data.error || data.mensaje, 'No pudimos generar el documento. Intentá de nuevo.', 'generar_documento') }"],
  ["{ error:data.mensaje || data.error, search_url:data.search_url }", "{ error:adminStudentsSafeUserError(data.mensaje || data.error, 'No pudimos localizar el certificado. Intentá de nuevo.', 'buscar_certificado'), search_url:data.search_url }"],
  ["{ error:(data && (data.mensaje || data.error)) || 'No se pudo regenerar el certificado.' }", "{ error:adminStudentsSafeUserError(data && (data.mensaje || data.error), 'No se pudo regenerar el certificado.', 'regenerar_certificado') }"],
  ["{ error:(data && (data.mensaje || data.error)) || 'No se pudo generar el certificado.' }", "{ error:adminStudentsSafeUserError(data && (data.mensaje || data.error), 'No se pudo generar el certificado.', 'generar_certificado') }"],
];

let expected=pre;
for(const [from,to] of replacements){
  const n=expected.split(from).length-1;
  if(n!==1) throw new Error(`preimage source occurrence ${n}: ${from}`);
  expected=expected.replace(from,to);
}
const current=fs.readFileSync(path,'utf8');
if(current!==expected) throw new Error('candidate does not reconstruct byte-for-byte from exact preimage');
if(currentHash()!==CANDIDATE) throw new Error(`candidate blob mismatch ${currentHash()}`);
for(const [from,to] of replacements){
  if(current.includes(from)) throw new Error(`old effective sink remains: ${from}`);
  if((current.split(to).length-1)!==1) throw new Error(`safe replacement count mismatch: ${to}`);
}
const preview1="error: (preview && (preview.error || preview.mensaje)) || 'No se pudo preparar la vista previa'";
const preview2="error:(preview && (preview.error || preview.mensaje)) || 'No se pudo preparar la regeneración'";
if(!current.includes(preview1)||!current.includes(preview2)) throw new Error('render-sanitized preview setters changed');
if(!current.includes("adminStudentsSafeUserError(certEstado.mensaje || certEstado.error, 'No se pudo completar la operación de certificados. Intentá de nuevo.', 'certificados')")) throw new Error('certEstado render sanitizer changed');

const out=execFileSync('node',['scripts/audit_raw_user_error_surface_v3_cs21a210s.mjs'],{encoding:'utf8',maxBuffer:20*1024*1024});
const findings=Number((out.match(/DIRECT_RAW_SINK_FINDINGS=(\d+)/)||[])[1]);
const files=Number((out.match(/FILES_WITH_FINDINGS=(\d+)/)||[])[1]);
if(findings!==23||files!==12) throw new Error(`unexpected V3 ${findings}/${files}`);
if(!out.includes('FILE_COUNT|2|src/admin_students.jsx')) throw new Error('admin_students should retain exactly two scanner findings already sanitized at render');
console.log('CS21A210BG admin_students safe errors PASS');
console.log(`PREIMAGE=${PRE}`);
console.log(`CANDIDATE=${CANDIDATE}`);
console.log(`V3=${findings}/${files}`);
console.log('E2=NO');
