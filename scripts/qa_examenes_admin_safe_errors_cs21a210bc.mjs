import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE='6e3fd61d046ff67b33952526f2aadb7219e31111';
const expected={
  'src/examenes_modes.jsx':'9d86826c3c3d0ac12e4a915d461e9fcc42be3705',
  'src/examenes_bundle.jsx':'4ee147afe2c06c3318d075b478a47497994a93dc',
};
const hash=s=>execFileSync('git',['hash-object','--stdin'],{input:s,encoding:'utf8'}).trim();
const count=(s,x)=>s.split(x).length-1;
const helper="function examAdminSafeUserError(response, fallback, context) {\n  const raw = response && (response.mensaje || response.error || (response.errores && response.errores.join(' · ')));\n  const detail = String(raw == null ? '' : raw).trim();\n  if (detail) console.warn('[CS21A210BC][AdminMode][' + (context || 'unknown') + ']', detail);\n  return fallback;\n}\n\n";
const anchor='function ActivationBackendPanel({ onPreview }) {';
const activationOld="const detail = r && (r.mensaje || r.error || (r.errores && r.errores.join(' · ')));\n      setErr(detail || 'No se pudo completar la operación.');";
const activationNew="setErr(examAdminSafeUserError(r, 'No se pudo completar la operación.', 'activation'));";
const opsOld="else { setMsg(''); setErr((r && (r.mensaje || r.error)) || 'No se pudo completar la operación.'); }";
const opsNew="else { setMsg(''); setErr(examAdminSafeUserError(r, 'No se pudo completar la operación.', 'backend_operations')); }";

function transform(s,path){
  if(count(s,anchor)!==1||count(s,activationOld)!==1||count(s,opsOld)!==1) throw new Error(`${path}: BC preimage cardinality mismatch`);
  return s.replace(anchor,helper+anchor).replace(activationOld,activationNew).replace(opsOld,opsNew);
}

for(const [path,sha] of Object.entries(expected)){
  const base=execFileSync('git',['show',`${BASE}:${path}`],{encoding:'utf8',maxBuffer:20*1024*1024});
  if(hash(base)!==sha) throw new Error(`${path}: exact BB preimage hash mismatch`);
  const current=fs.readFileSync(path,'utf8');
  const reconstructed=transform(base,path);
  if(current!==reconstructed) throw new Error(`${path}: current source is not exact BC reconstruction`);
  if(count(current,'function examAdminSafeUserError(')!==1) throw new Error(`${path}: helper cardinality mismatch`);
  if(current.includes(activationOld)||current.includes(opsOld)) throw new Error(`${path}: raw admin projection remains`);
  if(!current.includes('<ActivationBackendPanel onPreview={onPreview} />')||!current.includes('<BackendOperationsPanel />')) throw new Error(`${path}: admin mounts changed`);
  if(current.includes('<TeacherBackendReviewPanel')) throw new Error(`${path}: unmounted teacher legacy panel unexpectedly mounted`);
}
console.log('CS21A210BC exact reconstruction PASS');
console.log('FUNCTIONAL_SCOPE=ActivationBackendPanel+BackendOperationsPanel');
console.log('E2=NO');
