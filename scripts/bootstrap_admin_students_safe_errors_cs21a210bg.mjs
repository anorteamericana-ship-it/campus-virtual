import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const path='src/admin_students.jsx';
const PRE='8ef1c14088d489267baa68cf76810d4291538be3';
const hash=()=>execFileSync('git',['hash-object',path],{encoding:'utf8'}).trim();
let src=fs.readFileSync(path,'utf8');
const before=hash();

const replacements=[
  ["setResyncEst({codigo,loading:false,ok:r.ok,error:r.error});", "setResyncEst({codigo,loading:false,ok:r.ok,error:r.ok?'':adminStudentsSafeUserError(r.error || r.mensaje, 'No se pudo sincronizar CONAPE. Intentá de nuevo.', 'resincronizar_estudiante')});"],
  ["{ error:data.error || data.mensaje }", "{ error:adminStudentsSafeUserError(data.error || data.mensaje, 'No pudimos generar el documento. Intentá de nuevo.', 'generar_documento') }"],
  ["{ error:data.mensaje || data.error, search_url:data.search_url }", "{ error:adminStudentsSafeUserError(data.mensaje || data.error, 'No pudimos localizar el certificado. Intentá de nuevo.', 'buscar_certificado'), search_url:data.search_url }"],
  ["{ error:(data && (data.mensaje || data.error)) || 'No se pudo regenerar el certificado.' }", "{ error:adminStudentsSafeUserError(data && (data.mensaje || data.error), 'No se pudo regenerar el certificado.', 'regenerar_certificado') }"],
  ["{ error:(data && (data.mensaje || data.error)) || 'No se pudo generar el certificado.' }", "{ error:adminStudentsSafeUserError(data && (data.mensaje || data.error), 'No se pudo generar el certificado.', 'generar_certificado') }"],
];

const isCandidate=replacements.every(([,to])=>src.includes(to));
if(before!==PRE && !isCandidate) throw new Error(`Unexpected admin_students preimage ${before}`);
if(before===PRE){
  for(const [from,to] of replacements){
    const count=src.split(from).length-1;
    if(count!==1) throw new Error(`Expected one exact source occurrence, got ${count}: ${from}`);
    src=src.replace(from,to);
  }
  fs.writeFileSync(path,src);
}

src=fs.readFileSync(path,'utf8');
for(const [from,to] of replacements){
  if(src.includes(from)) throw new Error(`raw effective sink still present: ${from}`);
  if((src.split(to).length-1)!==1) throw new Error(`safe replacement mismatch: ${to}`);
}
if(!src.includes("error: (preview && (preview.error || preview.mensaje)) || 'No se pudo preparar la vista previa'")) throw new Error('already-sanitized preview setter changed');
if(!src.includes("error:(preview && (preview.error || preview.mensaje)) || 'No se pudo preparar la regeneración'")) throw new Error('already-sanitized regeneration setter changed');
if(!src.includes("adminStudentsSafeUserError(certEstado.mensaje || certEstado.error, 'No se pudo completar la operación de certificados. Intentá de nuevo.', 'certificados')")) throw new Error('certEstado render sanitizer changed');
const out=execFileSync('node',['scripts/audit_raw_user_error_surface_v3_cs21a210s.mjs'],{encoding:'utf8'});
const findings=Number((out.match(/DIRECT_RAW_SINK_FINDINGS=(\d+)/)||[])[1]);
const files=Number((out.match(/FILES_WITH_FINDINGS=(\d+)/)||[])[1]);
if(findings!==23||files!==12) throw new Error(`Unexpected V3 candidate ${findings}/${files}`);
if(!out.includes('FILE_COUNT|2|src/admin_students.jsx')) throw new Error('admin_students should retain exactly two render-sanitized scanner findings');
console.log('CS21A210BG bootstrap source PASS');
console.log(`BLOB=${hash()}`);
console.log(`V3=${findings}/${files}`);
