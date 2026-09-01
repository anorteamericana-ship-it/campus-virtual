import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE='6e3fd61d046ff67b33952526f2aadb7219e31111';
const files={
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

for(const [path,expected] of Object.entries(files)){
  const current=fs.readFileSync(path,'utf8');
  if(hash(current)!==expected) throw new Error(`${path}: frozen BB preimage mismatch`);
  const base=execFileSync('git',['show',`${BASE}:${path}`],{encoding:'utf8',maxBuffer:20*1024*1024});
  if(base!==current) throw new Error(`${path}: working copy differs from exact BB base`);
  if(count(current,anchor)!==1) throw new Error(`${path}: activation anchor count mismatch`);
  if(count(current,activationOld)!==1) throw new Error(`${path}: activation raw block count mismatch`);
  if(count(current,opsOld)!==1) throw new Error(`${path}: operations raw block count mismatch`);
  if(current.includes('function examAdminSafeUserError(')) throw new Error(`${path}: helper already present`);
  const next=current.replace(anchor,helper+anchor).replace(activationOld,activationNew).replace(opsOld,opsNew);
  fs.writeFileSync(path,next);
}
console.log('CS21A210BC bootstrap source transform PASS');
