import fs from 'node:fs';

const contract = JSON.parse(fs.readFileSync('security/sec002_proforma_public_acl_contract_cs21a196.json', 'utf8'));
const identity = JSON.parse(fs.readFileSync('security/sec002_identity_legacy_contract_cs21a174.json', 'utf8'));
const ventas = fs.readFileSync('src/ventas_drawer.jsx', 'utf8');
const matriculas = fs.readFileSync('src/matriculas_admin.jsx', 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(`CS21A196R guard: ${msg}`);
}

must(contract.severity === 'P1', 'current public proformas remain P1');
must(contract.state === 'OPEN_BLOCKER', 'blocker remains open until migration');
must(contract.rebased_from === 'PR_188_CS21A196', 'parallel evidence remains traceable');
must(contract.base_pr === 204, 'contract is rebased onto current stack');
must(contract.drive_evidence.real_recent_samples_checked >= 3, 'at least three recent real proformas remain recorded');
must(contract.drive_evidence.real_recent_samples_anyone_reader === contract.drive_evidence.real_recent_samples_checked, 'all sampled proformas were anyone-reader');
must(contract.drive_evidence.acl_change_in_this_cut === 'NONE', 'contract-only cut does not claim ACL change');
must(contract.historical_backend_evidence.sharing_behavior === 'DriveApp.Access.ANYONE_WITH_LINK + DriveApp.Permission.VIEW', 'historical publisher evidence remains explicit');
must(contract.historical_backend_evidence.private_bytes_delivery_demonstrated === false, 'private bytes must not be invented');
must(contract.historical_backend_evidence.fresh_modular_QA_snapshot === 'PENDING_ISSUE_111', 'fresh modular snapshot remains pending');
must(contract.release_gate === 'BLOCK_UNTIL_PRIVATE_STAFF_DELIVERY_AND_ACL_MIGRATION_E2', 'release remains blocked');

must(ventas.includes('WhatsApp · adjuntar PDF'), 'Ventas manual attachment behavior remains');
must(matriculas.includes('WhatsApp · adjuntar PDF'), 'Matrículas manual attachment behavior remains');
must(!ventas.includes('Podés verla aquí: ${url}'), 'Ventas public proforma link must not return to WhatsApp');
must(!matriculas.includes('Podés verla aquí: ${url}'), 'Matrículas public proforma link must not return to WhatsApp');
const ventasDirect = /<a className="vx-btn vx-btn-navy" href=\{url\}/.test(ventas);
const matriculasDirect = /<a className="btn btn-primary" href=\{url\}/.test(matriculas);
must(ventasDirect, 'Ventas direct staff URL consumer remains inventoried until private delivery exists');
must(matriculasDirect, 'Matrículas direct staff URL consumer remains inventoried until private delivery exists');
must(identity.historical_acl_evidence?.current_object_acl === 'NOT_PROVEN', 'identity evidence boundary from CS21A195R remains present');

console.log('CS21A196R SEC002 PROFORMA PUBLIC ACL REBASE: PASS');
console.log('RECENT_REAL_PROFORMAS_ANYONE_READER=3/3');
console.log('WHATSAPP_PUBLIC_LINK=REMOVED');
console.log('STAFF_DIRECT_URL_CONSUMERS=2');
console.log('PRIVATE_BYTES_BACKEND=NOT_DEMONSTRATED');
console.log('ACL_CHANGE=NONE');
console.log('RELEASE_GATE=PRIVATE_STAFF_DELIVERY_PLUS_ACL_E2');
