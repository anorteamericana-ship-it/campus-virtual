import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const enforce = argv.includes('--enforce');
const backendArg = argv.find(x => x.startsWith('--backend='));
const backendPath = backendArg ? backendArg.slice('--backend='.length) : '';

if (!backendPath) {
  console.error('Usage: node scripts/audit_sec002_drive_public_sharing.mjs --backend=/path/to/Code.gs [--enforce]');
  process.exit(2);
}
if (!fs.existsSync(backendPath)) {
  console.error(`Backend not found: ${backendPath}`);
  process.exit(2);
}

const source = fs.readFileSync(backendPath, 'utf8');
const lines = source.split(/\r?\n/);

const CLASS_BY_FUNCTION = Object.freeze({
  _subirComprobanteADrive: 'payment_or_bank_proof',
  uploadFotoPerfilEstudiante: 'student_profile_or_passport_photo',
  _exportarHojaComoPDF: 'commercial_proforma_with_personal_data',
  _guardarFotoProspecto: 'student_identity_document',
  subirDocumentoExtra: 'student_extra_document',
  _matFirmadaFindLatestFile_: 'signed_enrollment_document',
  subirMatriculaFirmadaVentas: 'signed_enrollment_document',
  notificarMatriculaFirmadaVentas: 'signed_enrollment_document',
  _ventasDocPublicarSiSePuede_: 'ventas_generated_student_document',
  _ventasDocBuscarExistente_: 'ventas_generated_student_document',
  uploadInscripcionAdminImage: 'public_enrollment_marketing_or_ui_asset',
  _cs21a76PublicFile_: 'teacher_private_document'
});

const EXPLICIT_PUBLIC_CLASSES = new Set([
  'public_enrollment_marketing_or_ui_asset'
]);

function enclosingFunction(lineIndex) {
  // Source uses top-level function declarations. Search backwards only for the
  // closest declaration; this is an audit aid, not a JavaScript parser.
  for (let i = lineIndex; i >= 0; i -= 1) {
    const m = lines[i].match(/^\s*function\s+([A-Za-z0-9_$]+)\s*\(/);
    if (m) return m[1];
  }
  return '(top-level)';
}

const hits = [];
for (let i = 0; i < lines.length; i += 1) {
  if (!lines[i].includes('DriveApp.Access.ANYONE_WITH_LINK')) continue;
  const fn = enclosingFunction(i);
  const documentClass = CLASS_BY_FUNCTION[fn] || 'UNCLASSIFIED';
  const allowedPublic = EXPLICIT_PUBLIC_CLASSES.has(documentClass);
  hits.push({
    line: i + 1,
    function: fn,
    document_class: documentClass,
    allowed_public: allowedPublic
  });
}

const unclassified = hits.filter(x => x.document_class === 'UNCLASSIFIED');
const sensitivePublic = hits.filter(x => !x.allowed_public && x.document_class !== 'UNCLASSIFIED');

const report = {
  audit: 'SEC-002 Drive ANYONE_WITH_LINK source inventory',
  backend: path.basename(backendPath),
  occurrences: hits.length,
  explicit_public_occurrences: hits.filter(x => x.allowed_public).length,
  sensitive_public_occurrences: sensitivePublic.length,
  unclassified_occurrences: unclassified.length,
  hits
};

console.log(JSON.stringify(report, null, 2));

if (unclassified.length) {
  console.error(`SEC-002: ${unclassified.length} ANYONE_WITH_LINK occurrence(s) are not classified.`);
  process.exit(1);
}
if (enforce && sensitivePublic.length) {
  console.error(`SEC-002: FAIL — ${sensitivePublic.length} sensitive ANYONE_WITH_LINK occurrence(s) remain.`);
  process.exit(1);
}

console.error(
  sensitivePublic.length
    ? `SEC-002: INVENTORY COMPLETE — ${sensitivePublic.length} sensitive public-sharing occurrence(s) remain; remediation required.`
    : 'SEC-002: PASS — no classified sensitive ANYONE_WITH_LINK occurrence remains.'
);
