import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const expected = {
  'src/examenes_modes.jsx': '9d86826c3c3d0ac12e4a915d461e9fcc42be3705',
  'src/examenes_bundle.jsx': '4ee147afe2c06c3318d075b478a47497994a93dc',
};
const exact = process.argv.includes('--exact-import');
const blob = text => execFileSync('git',['hash-object','--stdin'],{input:text,encoding:'utf8'}).trim();
for (const [path, sha] of Object.entries(expected)) {
  const s = fs.readFileSync(path,'utf8');
  for (const fn of ['function AdminMode(','function ActivationBackendPanel(','function BackendOperationsPanel(','function TeacherBackendReviewPanel(']) {
    if (!s.includes(fn)) throw new Error(`${path}: missing ${fn}`);
  }
  if (!s.includes('<ActivationBackendPanel onPreview={onPreview} />')) throw new Error(`${path}: ActivationBackendPanel not mounted in AdminMode`);
  if (!s.includes('<BackendOperationsPanel />')) throw new Error(`${path}: BackendOperationsPanel not mounted in AdminMode`);
  if (s.includes('<TeacherBackendReviewPanel')) throw new Error(`${path}: TeacherBackendReviewPanel unexpectedly mounted`);
  const activationRaw = "const detail = r && (r.mensaje || r.error || (r.errores && r.errores.join(' · ')));";
  const opsRaw = "else { setMsg(''); setErr((r && (r.mensaje || r.error)) || 'No se pudo completar la operación.'); }";
  if (exact) {
    if (blob(s) !== sha) throw new Error(`${path}: frozen BA preimage mismatch`);
    if ((s.split(activationRaw).length - 1) !== 1) throw new Error(`${path}: activation raw projection count mismatch`);
    if ((s.split(opsRaw).length - 1) !== 1) throw new Error(`${path}: operations raw projection count mismatch`);
  } else {
    if ((s.split(activationRaw).length - 1) !== 0) throw new Error(`${path}: activation raw projection reintroduced`);
    if ((s.split(opsRaw).length - 1) !== 0) throw new Error(`${path}: operations raw projection reintroduced`);
    if (!s.includes('function examAdminSafeUserError(')) throw new Error(`${path}: safe admin helper missing`);
    if (!s.includes("setErr(examAdminSafeUserError(r, 'No se pudo completar la operación.', 'activation'));")) throw new Error(`${path}: safe activation projection missing`);
    if (!s.includes("setErr(examAdminSafeUserError(r, 'No se pudo completar la operación.', 'backend_operations'))")) throw new Error(`${path}: safe operations projection missing`);
  }
  const adminStart=s.indexOf('function AdminMode(');
  const adminSlice=s.slice(adminStart);
  if (!adminSlice.includes('<ActivationBackendPanel onPreview={onPreview} />') || !adminSlice.includes('<BackendOperationsPanel />')) throw new Error(`${path}: effective admin mount relation missing`);
}
console.log(exact ? 'CS21A210BB exact audit snapshot PASS' : 'CS21A210BB descendant-safe admin boundary PASS');
console.log('TEACHER_BACKEND_REVIEW_PANEL_MOUNTED=NO');
