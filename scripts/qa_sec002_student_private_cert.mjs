import fs from 'node:fs';

const path = 'src/student_modules.jsx';
const src = fs.readFileSync(path, 'utf8');
const start = src.indexOf('// CertificadosView —');
const end = src.indexOf('// PerfilView —', start);
if (start < 0 || end < 0) throw new Error('No se pudo aislar la sección CertificadosView');
const cert = src.slice(start, end);

const must = [
  "postStudentModules('descargarMiCertificadoPrivado'",
  'data_base64',
  'application/pdf',
  'new Blob(',
  'URL.createObjectURL(',
  'URL.revokeObjectURL(',
  'crypto.subtle.digest',
  'window.atob(',
  'size_bytes',
  'sha256',
  'codigo={codigo}',
  'disabled={abriendo}',
];
for (const token of must) {
  if (!cert.includes(token)) throw new Error(`Falta guard SEC-002 frontend: ${token}`);
}

if (/href=\{row\.url\}/.test(cert)) throw new Error('Certificados todavía abre row.url directo');
if (/window\.open\(row\.url/.test(cert)) throw new Error('Certificados todavía usa window.open(row.url)');
if (/location(?:\.href)?\s*=\s*row\.url/.test(cert)) throw new Error('Certificados todavía navega a row.url');

const call = cert.match(/postStudentModules\('descargarMiCertificadoPrivado',\s*\{([\s\S]*?)\}\)/);
if (!call) throw new Error('No se encontró request al endpoint privado');
for (const field of ['codigo', 'nivel']) {
  if (!new RegExp(`\\b${field}\\b`).test(call[1])) throw new Error(`Request privado no envía ${field}`);
}

if (!/String\(r\.mime_type[\s\S]*application\/pdf/.test(cert)) throw new Error('No se valida MIME PDF');
if (!/Number\(r\.size_bytes[\s\S]*bytes\.length/.test(cert)) throw new Error('No se valida size_bytes contra contenido decodificado');
if (!/String\(r\.sha256[\s\S]*digestHex/.test(cert)) throw new Error('No se valida sha256 del contenido');

console.log('PASS SEC-002 student private certificate frontend guard');
