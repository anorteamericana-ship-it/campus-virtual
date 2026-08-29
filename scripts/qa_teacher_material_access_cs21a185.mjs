import fs from 'node:fs';

const base = fs.readFileSync('src/teacher_cs21a.jsx', 'utf8');
const viewer = fs.readFileSync('src/teacher_cs21a_docs_viewer.jsx', 'utf8');
const contract = JSON.parse(fs.readFileSync('security/teacher_material_access_contract_v1.json', 'utf8'));

function must(ok, label) {
  if (!ok) throw new Error(`CS21A185 FAIL: ${label}`);
}

must(viewer.includes("u.rol !== 'teacher'"), 'teacher-only viewer wrapper remains explicit');
must(viewer.includes('drive.google.com/file/d/') || viewer.includes('drive.google.com/drive/folders/'), 'direct Drive material URLs remain detectable blocker');
must(base.includes('drive.google.com/drive/folders/'), 'teacher base still contains direct Drive folders as documented blocker');
must(contract.classification === 'SEC-005', 'contract classification');
must(contract.current_frontend.drive_ids_embedded_in_public_bundle === true, 'public-bundle exposure documented');
must(contract.drive_acl_evidence.anyone_reader_observed === true, 'anyone-reader evidence documented');
must(contract.drive_acl_evidence.acl_changed_by_this_cut === false, 'no ACL mutation claim');
must(contract.target_contract.endpoint_names_resolved === false, 'backend endpoint names remain unresolved until snapshot');
must(contract.release_claim === 'NOT_FIXED_PRIVATE_DELIVERY_PENDING', 'no false fixed claim');
must(base.includes('teacherMaterialSafeUserError'), 'safe teacher material/user error helper present');
must(base.includes("'No se pudo cargar el resumen docente. Intentá de nuevo.'"), 'stable teacher-facing attendance fallback present');
must(!base.includes("setState(s=>({ ...s, loading:false, error:e?.message || String(e) }))"), 'raw attendance error no longer rendered');

console.log('CS21A185 TEACHER MATERIAL ACCESS: PASS');
console.log('TEACHER_UI_ROLE_GATE=PASS');
console.log('PUBLIC_DRIVE_ACL=DOCUMENTED_P1_NOT_REMOVED');
console.log('SAFE_TEACHER_ATTENDANCE_ERRORS=PASS');
console.log('PRIVATE_DELIVERY=BLOCKED_UNTIL_FRESH_BACKEND_SNAPSHOT');
