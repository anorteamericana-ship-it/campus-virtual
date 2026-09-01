import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const expected = {
  'src/examenes_modes.jsx': '9d86826c3c3d0ac12e4a915d461e9fcc42be3705',
  'src/examenes_bundle.jsx': '4ee147afe2c06c3318d075b478a47497994a93dc',
};
const blob = text => execFileSync('git',['hash-object','--stdin'],{input:text,encoding:'utf8'}).trim();
for (const [path, sha] of Object.entries(expected)) {
  const s = fs.readFileSync(path,'utf8');
  if (blob(s) !== sha) throw new Error(`${path}: frozen BA preimage mismatch`);
  for (const fn of ['function AdminMode(','function ActivationBackendPanel(','function BackendOperationsPanel(','function TeacherBackendReviewPanel(']) {
    if (!s.includes(fn)) throw new Error(`${path}: missing ${fn}`);
  }
  if (!s.includes('<ActivationBackendPanel onPreview={onPreview} />')) throw new Error(`${path}: ActivationBackendPanel not mounted in AdminMode`);
  if (!s.includes('<BackendOperationsPanel />')) throw new Error(`${path}: BackendOperationsPanel not mounted in AdminMode`);
  if (s.includes('<TeacherBackendReviewPanel')) throw new Error(`${path}: TeacherBackendReviewPanel unexpectedly mounted`);
  const activationRaw = "const detail = r && (r.mensaje || r.error || (r.errores && r.errores.join(' · ')));";
  const opsRaw = "else { setMsg(''); setErr((r && (r.mensaje || r.error)) || 'No se pudo completar la operación.'); }";
  if ((s.split(activationRaw).length - 1) !== 1) throw new Error(`${path}: activation raw projection count mismatch`);
  if ((s.split(opsRaw).length - 1) !== 1) throw new Error(`${path}: operations raw projection count mismatch`);
  const adminStart=s.indexOf('function AdminMode(');
  const adminSlice=s.slice(adminStart);
  if (!adminSlice.includes('<ActivationBackendPanel onPreview={onPreview} />') || !adminSlice.includes('<BackendOperationsPanel />')) throw new Error(`${path}: effective admin mount relation missing`);
}
console.log('CS21A210BB effective admin boundary audit PASS');
console.log('EFFECTIVE_ADMIN_RAW_PROJECTIONS_PER_REPRESENTATION=2');
console.log('SYNCHRONIZED_RAW_PROJECTIONS_TOTAL=4');
console.log('TEACHER_BACKEND_REVIEW_PANEL_MOUNTED=NO');
console.log('NEXT_FUNCTIONAL_SCOPE=activation_and_backend_operations_only');
