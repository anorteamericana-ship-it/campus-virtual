import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students.jsx', 'utf8');

function must(ok, label) {
  if (!ok) throw new Error(`CS21A194 FAIL: ${label}`);
}

must(src.includes('function adminStudentsSafeUserError('), 'CS21A191 safe-error boundary preserved');
must(src.includes('function adminCertSha256HexCS21A194('), 'admin certificate SHA-256 helper exists');
must(src.includes('async function adminCertPrivadoBlobCS21A194('), 'admin private certificate helper exists');
must(src.includes("postAdminStudents('descargarMiCertificadoPrivado'"), 'private certificate endpoint is used');
must(src.includes("'application/pdf'"), 'PDF MIME validation exists');
must(src.includes('2 * 1024 * 1024'), '2 MB certificate limit exists');
must(src.includes('expectedSize > 0 && expectedSize !== bytes.length'), 'announced size must match actual bytes');
must(src.includes('bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45'), 'PDF signature validation exists');
must(src.includes("window.crypto.subtle.digest('SHA-256', bytes)"), 'SHA-256 integrity validation exists');
must(src.includes('URL.createObjectURL(archivo.blob)'), 'private Blob is opened via ObjectURL');
must(src.includes('URL.revokeObjectURL(objectUrl)'), 'temporary ObjectURL is revoked');

must(!src.includes("if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');"), 'certificate handlers no longer open backend URL directly');
must(!src.includes('certResult?.url'), 'certificate result no longer stores navigable URL state');
must(!src.includes('href={certResult.url}'), 'certificate success UI has no direct Drive link');

const privateCalls = (src.match(/adminCertPrivadoBlobCS21A194\(/g) || []).length;
must(privateCalls >= 4, 'helper definition plus three private certificate openings present');

const generatorCalls = (src.match(/postAdminStudents\('generarCertificado'/g) || []).length;
must(generatorCalls >= 2, 'certificate generation and regeneration business calls preserved');
must(src.includes('registro_esperado: certNum'), 'same-registration regeneration preserved');
must(src.includes('forzar_generar: true'), 'forced regeneration flag preserved');
must(src.includes('certResult?.opened'), 'certificate UI renders private-open success state');

must(src.includes('include_base64:true'), 'CS21A193 private CONAPE delivery preserved');
must(src.includes('Bitácora oficial conectada'), 'CS21A192 operational copy preserved');

console.log('CS21A194 SEC002 ADMIN PRIVATE CERTIFICATE: PASS');
console.log(`PRIVATE_CERT_HELPER_REFERENCES=${privateCalls}`);
console.log(`CERT_GENERATOR_CALLS=${generatorCalls}`);
console.log('DIRECT_CERTIFICATE_URL_OPEN=NO');
console.log('DRIVE_ACL_CHANGE=NO');
console.log('BACKEND_QA_ENDPOINT=REQUIRED_BEFORE_E2');
