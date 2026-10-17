// F111 L0-3a-2 — contrato estático de UI privada; no contacta Campus PROD.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const app=fs.readFileSync(new URL('../src/matriculas_admin.jsx',import.meta.url),'utf8');
const p=app.slice(app.indexOf('function MatDocPhoto('),app.indexOf('function MatProspectoModal('));
assert(p.includes('window.descargarDocumentoProspectoPrivado'),'usa descarga autenticada');
assert(p.includes('cedula, tipo, extractDriveId(src)'),'verifica tipo + propietario en solicitud');
assert(p.includes('URL.createObjectURL(result.blob)'),'usa Blob privado');
assert(p.includes('URL.revokeObjectURL(objectUrl)'),'revoca URL local');
assert(!p.includes('driveCandidates('),'no intenta enlaces públicos alternativos');
assert(!p.includes('drive.google.com'),'no thumbnail/uc');
assert(!p.includes('lh3.googleusercontent'),'no LH3');
assert((app.match(/cedula=\{cedula\} tipo=\{tipo\}/g)||[]).length===2,'ambos modales conectados');
console.log('PASS_E1_F111_L0_3A_2_FRONTEND_STATIC checks=8');
