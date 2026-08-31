import fs from 'node:fs';

const dataSrc = fs.readFileSync('src/ventas_data.jsx', 'utf8');
const drawerSrc = fs.readFileSync('src/ventas_drawer.jsx', 'utf8');
const contract = JSON.parse(fs.readFileSync('security/sec002_ventas_generated_docs_contract_cs21a195.json', 'utf8'));

function check(condition, message) {
  if (!condition) {
    console.error(`FAIL CS21A195: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

check(contract.status === 'BACKEND_PRIVATE_DELIVERY_CONTRACT_PENDING_RUNTIME_UNVERIFIED', 'backend private-delivery gate remains explicit');
check(contract.document_classes?.enrollment_sheet?.drive_acl_samples === 3, 'three enrollment-sheet ACL samples documented');
check(contract.document_classes?.enrollment_sheet?.anyone_reader_samples === 3, '3/3 enrollment-sheet samples remain public-by-link evidence');
check(contract.document_classes?.conape_no_debt_letter?.public_by_link === 'UNPROVEN', 'CONAPE no-debt ACL is not overclaimed');
check(contract.target_private_delivery?.endpoint_name === 'UNRESOLVED_UNTIL_FRESH_QA_SNAPSHOT', 'no backend endpoint name is invented');
check(contract.temporary_blocker?.direct_url_open_preserved === true, 'current URL consumer remains an explicit blocker');
check(contract.production === 'NOT_TOUCHED', 'production remains untouched');

check(dataSrc.includes('async function generarDocumentoVentasSeguro'), 'safe Sales wrapper remains');
check(dataSrc.includes("fn:     'generarDocumentoVentas'"), 'historical/current Sales generation endpoint remains');
check(dataSrc.includes('El backend deriva el asesor del token'), 'advisor ownership intent remains documented in source');
check(drawerSrc.includes('const r = await window.generarDocumentoVentasSeguro'), 'active Sales consumer remains');
check(drawerSrc.includes("if (r && r.ok && r.url)"), 'URL response dependency remains visible as blocker');
check(drawerSrc.includes("window.open(r.url, '_blank', 'noopener');"), 'direct URL open remains visible as blocker until backend replacement');
check(drawerSrc.includes("generar('CERTIFICADO', 'CERTIFICADO'"), 'enrollment-sheet action remains');
check(drawerSrc.includes("generar('CARTA', 'MATRICULA_2'"), 'CONAPE no-debt action remains');
check(drawerSrc.includes('openSignedPrivate'), 'signed-enrollment private path remains separate');

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A195 SEC002 VENTAS GENERATED DOCS: PASS');
console.log('ENROLLMENT_SHEET_PUBLIC_BY_LINK=DEMONSTRATED_3_OF_3_SAMPLES');
console.log('CONAPE_NO_DEBT_PUBLIC_BY_LINK=UNPROVEN');
console.log('DIRECT_URL_CONSUMER=EXPLICIT_TEMPORARY_BLOCKER');
console.log('RUNTIME_PRIVATE_DELIVERY=PENDING');
