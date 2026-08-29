import fs from 'node:fs';

const campus = fs.readFileSync('campus.html', 'utf8');
const profile = fs.readFileSync('src/teacher_profile_cs21a76.jsx', 'utf8');
const contract = JSON.parse(fs.readFileSync('security/sec002_teacher_profile_private_contract_v1.json', 'utf8'));

function must(text, needle, label) {
  if (!text.includes(needle)) throw new Error(`Missing ${label}: ${needle}`);
}
function mustNot(text, needle, label) {
  if (text.includes(needle)) throw new Error(`Forbidden ${label}: ${needle}`);
}

must(campus, 'src/teacher_profile_cs21a76.jsx', 'active teacher profile entrypoint');
must(profile, "post('getPerfilDocenteCS21A76')", 'teacher profile read');
must(profile, "post('guardarPerfilDocenteCS21A76'", 'teacher profile write');
must(profile, "post('uploadFotoPerfilDocenteCS21A76'", 'teacher photo upload');
must(profile, "post('uploadDocumentoDocenteCS21A76'", 'teacher document upload');
must(profile, 'body: JSON.stringify({ fn, token, ...payload })', 'authenticated token transport');

must(profile, 'function tp76SafeUserError(', 'safe teacher-profile error helper');
must(profile, "console.warn('[TeacherProfile] Detalle técnico oculto al docente.'", 'console-only teacher diagnostic');
must(profile, "tp76SafeUserError(error?.message || String(error), 'No pudimos cargar tu perfil. Intentá de nuevo.', 'cargar_perfil')", 'safe load error');
must(profile, "tp76SafeUserError(error?.message || String(error), 'No se pudo guardar el perfil. Intentá de nuevo.', 'guardar_perfil')", 'safe save error');
must(profile, "tp76SafeUserError(error?.message || String(error), 'No se pudo actualizar la fotografía.', 'subir_foto')", 'safe photo error');
must(profile, "tp76SafeUserError(error?.message || String(error), 'No se pudo actualizar el documento.', `subir_documento:${type}`)", 'safe document error');

mustNot(profile, "setState(previous => ({ ...previous, loading: false, error: error?.message || String(error) }))", 'raw load error');
mustNot(profile, "setNotice(error?.message || String(error))", 'raw teacher notice error');

// Privacy is deliberately not faked in this source-only cut: direct URL consumers remain blockers.
must(profile, 'data.foto?.disponible ? data.foto.url :', 'current direct teacher photo URL blocker');
must(profile, "window.open(document.vista_url, '_blank', 'noopener,noreferrer')", 'current direct teacher document URL blocker');
if (contract.status !== 'active_source_confirmed_private_backend_snapshot_pending') throw new Error('Unexpected teacher-profile contract status');
if (contract.privacy_migration.endpoint_names_resolved !== false) throw new Error('Private endpoint names must remain unresolved before the fresh modular snapshot');
if (contract.this_cut.changes_private_transport !== false || contract.this_cut.changes_acl !== false || contract.this_cut.changes_apps_script !== false) {
  throw new Error('CS21A184 must remain source/contract only');
}
if (!Array.isArray(contract.personal_document_classes) || contract.personal_document_classes.length !== 3) throw new Error('Expected exactly three teacher personal document classes');
for (const item of contract.personal_document_classes) {
  if (item.private_read_required !== true) throw new Error(`Private read not required for ${item.class}`);
}

console.log('CS21A184 TEACHER PROFILE SOURCE: PASS');
console.log('ACTIVE_SURFACE=PASS');
console.log('SAFE_USER_ERRORS=PASS');
console.log('PRIVATE_URL_BLOCKERS=DOCUMENTED_NOT_FAKE_FIXED');
console.log('BACKEND_ENDPOINT_NAMES=UNRESOLVED_UNTIL_SNAPSHOT');
