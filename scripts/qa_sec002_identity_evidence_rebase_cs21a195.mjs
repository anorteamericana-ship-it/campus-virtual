import fs from 'node:fs';

const contract = JSON.parse(fs.readFileSync('security/sec002_identity_legacy_contract_cs21a174.json', 'utf8'));
const cert = JSON.parse(fs.readFileSync('security/sec002_legacy_certificate_tree_contract_cs21a194.json', 'utf8'));
const ventas = fs.readFileSync('src/ventas_parts.jsx', 'utf8');
const matriculas = fs.readFileSync('src/matriculas_admin.jsx', 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(`CS21A195R guard: ${msg}`);
}

const ev = contract.historical_acl_evidence || {};
must(contract.no_acl_change === true, 'no ACL change remains explicit');
must(contract.no_consumer_switch_before_backend === true, 'consumer switch remains blocked before backend');
must(ev.publisher_call === '_guardarFotoProspecto', 'historical publisher remains mapped');
must(ev.sharing_behavior === 'DriveApp.Access.ANYONE_WITH_LINK + DriveApp.Permission.VIEW', 'historical public sharing evidence remains explicit');
must(ev.returned_delivery === 'lh3.googleusercontent.com/d/{file_id}', 'historical lh3 delivery remains explicit');
must(ev.current_object_acl === 'NOT_PROVEN', 'current object ACL must not be overstated');
must(ev.fresh_modular_QA_snapshot === 'PENDING_ISSUE_111', 'fresh modular QA snapshot remains pending');
must(String(contract.evidence_rule || '').includes('current object ACL is not proven'), 'evidence boundary remains explicit');
for (const field of ['FOTO_CED_FRENTE', 'FOTO_CED_DORSO', 'FOTO_TITULO']) {
  must(contract.fields.includes(field), `missing legacy field ${field}`);
}
must(ventas.includes('function vxDriveCandidates(url)'), 'Ventas legacy candidate builder remains inventoried');
must(ventas.includes('https://drive.google.com/thumbnail'), 'Ventas Drive candidate remains until migration');
must(ventas.includes('https://lh3.googleusercontent.com/d/'), 'Ventas lh3 candidate remains until migration');
must(matriculas.includes('function driveCandidates(url)'), 'Matrículas legacy candidate builder remains inventoried');
must(matriculas.includes('https://drive.google.com/thumbnail'), 'Matrículas Drive candidate remains until migration');
must(matriculas.includes('https://lh3.googleusercontent.com/d/'), 'Matrículas lh3 candidate remains until migration');
must(contract.target_delivery?.proposed_operation === 'descargarDocumentoIdentidadPrivado', 'CS21A174 proposed operation remains stable');
must(Array.isArray(contract.runtime_gate) && contract.runtime_gate.some(x => x.includes('representative current legacy identity/title objects')), 'runtime gate requires actual current-object ACL evidence');
must(cert.state === 'OPEN_BLOCKER', 'certificate P1 contract from CS21A194R remains present');

console.log('CS21A195R SEC002 IDENTITY LEGACY EVIDENCE REBASE: PASS');
console.log('HISTORICAL_PUBLIC_SHARING=PROVEN');
console.log('CURRENT_OBJECT_ACL=NOT_PROVEN');
console.log('ACTIVE_LEGACY_CONSUMERS=VENTAS+MATRICULAS_ADMIN');
console.log('ACL_CHANGE=NONE');
console.log('BACKEND_SNAPSHOT=PENDING_ISSUE_111');
