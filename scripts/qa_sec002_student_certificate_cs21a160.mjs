import fs from 'node:fs';

const src = fs.readFileSync('src/student_modules.jsx', 'utf8');

function check(condition, message) {
  if (!condition) {
    console.error(`FAIL CS21A160: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

check(src.includes('<CertificadosContenido data={data} codigo={codigo} />'), 'student code reaches certificate content');
check(src.includes('<CertificadoEstadoCardF984 key={row.nivel} row={row} codigo={codigo} />'), 'student code reaches each certificate card');
check(src.includes("postStudentModules('descargarMiCertificadoPrivado'"), 'private certificate endpoint is wired');
check(src.includes("String(r.mime_type || '').trim().toLowerCase() !== 'application/pdf'"), 'private certificate requires PDF MIME');
check(src.includes('bytes.length > 2 * 1024 * 1024'), 'private certificate enforces 2 MB client limit');
check(src.includes('bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45'), 'private certificate validates PDF magic');
check(src.includes("window.crypto.subtle.digest('SHA-256', bytes)"), 'private certificate verifies SHA-256 when Web Crypto is available');
check(src.includes("new Blob([bytes], { type:'application/pdf' })"), 'private certificate creates local PDF Blob');
check(src.includes('URL.createObjectURL(archivo.blob)'), 'private certificate opens via temporary ObjectURL');
check(src.includes('URL.revokeObjectURL(objectUrl)'), 'private certificate revokes temporary ObjectURL');
check(src.includes('onClick={abrirPrivado}'), 'certificate action uses private opener');
check(!src.includes('href={row.url}'), 'certificate card no longer opens public row.url');
check(!src.includes('<a className="btn btn-primary" href={row.url}'), 'public certificate anchor is absent');

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A160 static QA PASS');
