import fs from 'node:fs';

const contract = JSON.parse(fs.readFileSync('security/sec002_proforma_public_acl_contract_cs21a196.json', 'utf8'));
const ventas = fs.readFileSync('src/ventas_drawer.jsx', 'utf8');
const matriculas = fs.readFileSync('src/matriculas_admin.jsx', 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(`CS21A196 guard: ${msg}`);
}

must(contract.severity === 'P1', 'current public proformas must remain P1');
must(contract.state === 'OPEN_BLOCKER', 'blocker must stay open until migration');
must(contract.drive_evidence.real_recent_samples_checked >= 3, 'at least three recent real proformas must be recorded');
must(contract.drive_evidence.real_recent_samples_anyone_reader === contract.drive_evidence.real_recent_samples_checked, 'all sampled recent proformas were anyone-reader');
must(contract.drive_evidence.acl_change_in_this_cut === 'NONE', 'contract-only cut must not claim ACL changes');
must(contract.historical_backend_evidence.sharing_behavior === 'DriveApp.Access.ANYONE_WITH_LINK + DriveApp.Permission.VIEW', 'backend public-sharing evidence must remain explicit');
must(contract.historical_backend_evidence.private_bytes_delivery_demonstrated === false, 'private bytes must not be invented');
must(contract.historical_backend_evidence.fresh_modular_QA_snapshot === 'PENDING_ISSUE_111', 'fresh backend snapshot must remain pending');
must(contract.release_gate === 'BLOCK_UNTIL_PRIVATE_STAFF_DELIVERY_AND_ACL_MIGRATION_E2', 'release gate must remain blocking');

must(ventas.includes('WhatsApp · adjuntar PDF'), 'Ventas manual attachment behavior from CS21A175 must remain');
must(matriculas.includes('WhatsApp · adjuntar PDF'), 'Matrículas manual attachment behavior from CS21A175 must remain');
must(!ventas.includes('Podés verla aquí: ${url}'), 'Ventas must not restore public proforma link in WhatsApp');
must(!matriculas.includes('Podés verla aquí: ${url}'), 'Matrículas must not restore public proforma link in WhatsApp');

const ventasDirect = /<a className="vx-btn vx-btn-navy" href=\{url\}/.test(ventas);
const matriculasDirect = /<a className="btn btn-primary" href=\{url\}/.test(matriculas);
must(ventasDirect, 'Ventas direct staff URL consumer must remain inventoried until private delivery exists');
must(matriculasDirect, 'Matrículas direct staff URL consumer must remain inventoried until private delivery exists');

console.log('CS21A196 SEC002 PROFORMA PUBLIC ACL CONTRACT: PASS');
console.log('RECENT_REAL_PROFORMAS_ANYONE_READER=3/3');
console.log('WHATSAPP_PUBLIC_LINK=REMOVED');
console.log('STAFF_DIRECT_URL_CONSUMERS=2');
console.log('PRIVATE_BYTES_BACKEND=NOT_DEMONSTRATED');
console.log('ACL_CHANGE=NONE');
console.log('RELEASE_GATE=PRIVATE_STAFF_DELIVERY_PLUS_ACL_E2');
