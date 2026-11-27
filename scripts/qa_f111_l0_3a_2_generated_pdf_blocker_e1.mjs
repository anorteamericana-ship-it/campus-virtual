// F111 L0-3a-2 — prueba de integración faltante, debe permanecer roja
// hasta que los PDF generados se consuman como Blob privado autenticado.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const data=fs.readFileSync(new URL('../src/ventas_data.jsx',import.meta.url),'utf8');
const drawer=fs.readFileSync(new URL('../src/ventas_drawer.jsx',import.meta.url),'utf8');
const admin=fs.readFileSync(new URL('../src/admin_students.jsx',import.meta.url),'utf8');
const a=data.slice(data.indexOf('async function generarDocumentoVentasSeguro('),data.indexOf('// ── Matrícula firmada:',data.indexOf('async function generarDocumentoVentasSeguro(')));
const b=drawer.slice(drawer.indexOf('const generar = async ('),drawer.indexOf('const pickSigned =',drawer.indexOf('const generar = async (')));
assert(a.includes('r.private_delivery') && a.includes('new Blob('),
  'Ventas debe convertir PDF privado del backend a Blob');
assert(!b.includes('window.open(r.url'),
  'Ventas no puede abrir URL pública al generar documento');
assert(admin.includes('private_delivery') && admin.includes('data_base64'),
  'Administración debe consumir PDF privado y no solamente data.url');
console.log('PASS_E1_F111_L0_3A_2_PDF_CONSUMERS checks=3');
