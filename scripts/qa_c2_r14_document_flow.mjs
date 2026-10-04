import fs from 'node:fs';

const data = fs.readFileSync('src/ventas_data.jsx','utf8');
const drawer = fs.readFileSync('src/ventas_drawer.jsx','utf8');
const parts = fs.readFileSync('src/ventas_parts.jsx','utf8');
const admin = fs.readFileSync('src/admin_students.jsx','utf8');
const app = fs.readFileSync('src/app.jsx','utf8');
const ventasHtml = fs.readFileSync('ventas.html','utf8');
const campusHtml = fs.readFileSync('campus.html','utf8');

let failures = 0;
function check(ok, label) {
  if (ok) console.log('PASS ' + label);
  else { failures += 1; console.error('FAIL ' + label); }
}

check(data.includes("postVentasData('descargarDocumentoInscripcionPrivado'"), 'Ventas consumes private enrollment-document endpoint');
check(parts.includes("'CEDULA_FRENTE'") && parts.includes("'CEDULA_DORSO'") && parts.includes("'TITULO'"), 'three canonical seller identity/title cards exist');
check(parts.includes('onOpenPrivate(tipo, cap)'), 'identity/title view uses private handler');
check(!parts.includes('Documento privado registrado'), 'blind private placeholder removed');
check(!parts.includes('Subir manualmente'), 'manual fake identity/title upload removed');

check(drawer.includes('const puedePreparar = !!codigo && !signedExists;'), 'seller one-shot state is explicit');
check(drawer.includes('Ventas no puede regenerarlo ni sustituirlo; sí puede consultarlo y volver a enviarlo.'), 'seller read-only state is explicit');
check(!drawer.includes('Reemplazar PDF firmado'), 'Ventas does not expose admin replacement action');
check(!drawer.includes('Carta de no deuda (CONAPE)'), 'CONAPE no-debt card removed from Ventas');
check(drawer.includes('1K_yZjUpiPF6MtXgapeFq7J314qqPQ-Ei'), 'official Reglamento Estudiantil reused');
check(drawer.includes("tipo:'CERTIFICADO'"), 'Ventas generates enrollment sheet only through CERTIFICADO type');
check(data.includes("fn:     'generarDocumentoVentas'"), 'Ventas still uses secure generarDocumentoVentas wrapper');
check(!drawer.includes("tipo:'MATRICULA_2'"), 'Ventas no longer requests no-debt document');
check(drawer.includes('notificarMatriculaFirmadaVentasSeguro'), 'seller can resend signed enrollment after first upload');

check(admin.includes("postAdminStudents('getProspectoDetalle'"), 'Admin reads authoritative signed-document status');
check(admin.includes("postAdminStudents('descargarMatriculaFirmadaPrivada'"), 'Admin views signed enrollment privately');
check(admin.includes("postAdminStudents('subirMatriculaFirmadaVentas'"), 'Admin can register replacement signed PDF through same backend contract');
check(admin.includes('El histórico anterior se conserva.'), 'Admin replacement UI communicates historical preservation');
check(admin.includes("fn:'generarDocumento'"), 'Admin enrollment generation keeps canonical generarDocumento call');

check(ventasHtml.includes('src/ventas_data.jsx?v=F98.4Z6C2R14DOC1'), 'Ventas data cache bust applied');
check(ventasHtml.includes('src/ventas_parts.jsx?v=F98.4Z6C2R14DOC1'), 'Ventas parts cache bust applied');
check(ventasHtml.includes('src/ventas_drawer.jsx?v=F98.4Z6C2R14DOC1'), 'Ventas drawer cache bust applied');
check(app.includes('src/admin_students.jsx?v=F98.4Z6C2R14DOC1'), 'Admin students lazy asset cache bust applied');
check(campusHtml.includes('src/app.jsx?v=F98.4Z6C2R14DOC1'), 'Campus app cache bust applied');

if (failures) {
  console.error('C2-R14 DOCUMENT FLOW QA FAIL (' + failures + ')');
  process.exit(1);
}
console.log('C2-R14 DOCUMENT FLOW QA PASS');