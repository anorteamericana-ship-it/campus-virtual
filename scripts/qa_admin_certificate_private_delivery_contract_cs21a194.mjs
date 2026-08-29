import fs from 'node:fs';

const src=fs.readFileSync('src/admin_students.jsx','utf8');
const contract=JSON.parse(fs.readFileSync('security/admin_certificate_private_delivery_contract_v1.json','utf8'));

function must(ok,label){if(!ok)throw new Error(`CS21A194 FAIL: ${label}`);}

must(contract.classification==='SEC-002','SEC-002 classification');
must(contract.drive_acl_evidence.sampled_real_certificates===3,'3 real certificate samples documented');
must(contract.drive_acl_evidence.anyone_reader_observed===3,'3/3 anyone-reader evidence documented');
must(contract.drive_acl_evidence.acl_changed_by_this_cut===false,'no ACL change claim');
must(contract.backend_evidence.descargarMiCertificadoPrivado_present===false,'private backend endpoint remains unproven/absent in observed snapshot');
must(contract.target_contract.endpoint_name_final===false,'endpoint naming remains gated by fresh snapshot');
must(contract.release_claim==='NOT_FIXED_PRIVATE_BACKEND_PENDING','no false fixed claim');

must(src.includes("postAdminStudents('buscarCertificadoExistente'"),'admin existing-certificate consumer remains documented');
must(src.includes("postAdminStudents('generarCertificado'"),'admin generate/regenerate certificate consumer remains documented');
must(src.includes("if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');"),'direct certificate URL blocker remains detectable');
must(src.includes('function abrirPdfBackend(payload)'),'CS21A193 private transfer-doc helper preserved');
must(src.includes('function adminStudentsSafeUserError'),'CS21A191 safe-error boundary preserved');

console.log('CS21A194 ADMIN CERTIFICATE PRIVATE DELIVERY CONTRACT: PASS');
console.log('REAL_CERTIFICATE_ACL=3_OF_3_ANYONE_READER');
console.log('ADMIN_DIRECT_URL_CONSUMER=DOCUMENTED_BLOCKER');
console.log('PRIVATE_CERT_BACKEND=BLOCKED_UNTIL_FRESH_QA_SNAPSHOT');
console.log('ACL_CHANGED=NO');
