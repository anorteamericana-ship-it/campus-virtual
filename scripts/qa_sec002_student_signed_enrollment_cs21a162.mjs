import fs from 'node:fs';

const src = fs.readFileSync('src/student_experience.jsx', 'utf8');

function check(condition, message) {
  if (!condition) {
    console.error(`FAIL CS21A162: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

check(src.includes("?fn=descargarMatriculaFirmadaPrivada"), 'student signed enrollment calls private endpoint');
check(src.includes("body:JSON.stringify({ fn:'descargarMatriculaFirmadaPrivada', token })"), 'student private request carries only session token, not another student identity');
check(src.includes("String(r.mime_type || '').toLowerCase() !== 'application/pdf'"), 'signed enrollment requires PDF MIME');
check(src.includes('bytes.length > 9 * 1024 * 1024'), 'signed enrollment enforces 9 MB client limit');
check(src.includes('bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45'), 'signed enrollment validates PDF magic');
check(src.includes("window.crypto.subtle.digest('SHA-256', bytes)"), 'signed enrollment verifies SHA-256 when Web Crypto is available');
check(src.includes("new Blob([bytes], { type:'application/pdf' })"), 'signed enrollment creates local PDF Blob');
check(src.includes('URL.createObjectURL(r.blob)'), 'signed enrollment opens with temporary ObjectURL');
check(src.includes('URL.revokeObjectURL(objectUrl)'), 'signed enrollment revokes temporary ObjectURL');
check(src.includes('function StudentSignedEnrollmentPrivateF984()'), 'student private document UI is present');
check(src.includes('<StudentSignedEnrollmentPrivateF984 />'), 'private signed enrollment is mounted in Documents and help');
check(!src.includes('matricula_firmada_url'), 'student UI does not depend on a public signed-enrollment URL field');

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A162 static QA PASS');
