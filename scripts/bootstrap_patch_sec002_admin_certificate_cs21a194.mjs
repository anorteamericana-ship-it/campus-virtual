import fs from 'node:fs';

const path = 'src/admin_students.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceOne(before, after, label) {
  const count = src.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly 1 preimage, found ${count}`);
  src = src.replace(before, after);
  console.log(`${label}: replaced 1`);
}
function replaceExactCount(before, after, expected, label) {
  const count = src.split(before).length - 1;
  if (count !== expected) throw new Error(`${label}: expected ${expected} preimages, found ${count}`);
  src = src.split(before).join(after);
  console.log(`${label}: replaced ${count}`);
}

replaceOne(
`  } catch (e) {
    console.warn('[AdminStudents] PDF privado rechazado antes de abrir.', e);
    return false;
  }
}

async function resincronizarEstudianteIndividual(codigo) {`,
`  } catch (e) {
    console.warn('[AdminStudents] PDF privado rechazado antes de abrir.', e);
    return false;
  }
}

async function abrirCertificadoAdminPrivado({ codigo, nivel, grupo = '', registro = '' }) {
  try {
    const r = await postAdminStudents('descargarMiCertificadoPrivado', {
      codigo: String(codigo || '').trim(),
      nivel: String(nivel || '').trim().toUpperCase(),
      grupo: String(grupo || '').trim(),
      registro: String(registro || '').trim(),
    }, 60000);
    if (!r?.ok) {
      throw new Error(adminStudentsSafeUserError(r?.mensaje || r?.error, 'No pudimos obtener el certificado de forma segura. Intentá de nuevo.', 'certificado_admin_privado'));
    }
    const b64 = String(r?.data_base64 || '').replace(/\\s+/g, '');
    if (!b64) throw new Error('El certificado privado no incluyó contenido.');
    if (String(r?.mime_type || '').trim().toLowerCase() !== 'application/pdf') throw new Error('Tipo de certificado inválido.');
    if (b64.length > 3 * 1024 * 1024) throw new Error('Certificado demasiado grande.');
    const bin = atob(b64);
    if (bin.length < 5 || bin.slice(0, 5) !== '%PDF-') throw new Error('Firma PDF inválida.');
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    if (bytes.length > 2 * 1024 * 1024) throw new Error('Certificado demasiado grande.');
    const announced = Number(r?.size_bytes || 0);
    if (announced > 0 && announced !== bytes.length) throw new Error('Tamaño de certificado inconsistente.');
    const expectedHash = String(r?.sha256 || '').trim().toLowerCase();
    if (expectedHash && window.crypto?.subtle) {
      const digest = await window.crypto.subtle.digest('SHA-256', bytes);
      const actualHash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
      if (actualHash !== expectedHash) throw new Error('Integridad SHA-256 inválida.');
    }
    const blob = new Blob([bytes], { type:'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);
    const opened = window.open(objectUrl, '_blank', 'noopener,noreferrer');
    if (!opened) { URL.revokeObjectURL(objectUrl); return false; }
    setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
    return true;
  } catch (e) {
    console.warn('[AdminStudents] Certificado privado rechazado antes de abrir.', e);
    return false;
  }
}

async function resincronizarEstudianteIndividual(codigo) {`,
'insert admin private certificate helper'
);

replaceExactCount(
`setRes(r => ({...r, [certKey]: { url:data.url, nombre:data.nombre, mensaje:data.mensaje }}));`,
`setRes(r => ({...r, [certKey]: { nombre:data.nombre, mensaje:data.mensaje }}));`,
3,
'remove public certificate URL from UI state'
);

replaceExactCount(
`if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');`,
`if (!(await abrirCertificadoAdminPrivado({
          codigo: String(est.codigo || est.rec_m || ''),
          nivel: nivelCert,
          grupo: grupoCert,
          registro: String(data.registro || data.registro_certificado || certNum || ''),
        }))) alert('El certificado está listo, pero no pudimos abrirlo de forma segura. Intentá de nuevo.');`,
3,
'replace direct certificate URL navigation'
);

fs.writeFileSync(path, src, 'utf8');
console.log('CS21A194 exact admin private certificate patch applied');
