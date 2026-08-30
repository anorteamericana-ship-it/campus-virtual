import fs from 'node:fs';

const contract = JSON.parse(fs.readFileSync('security/sec002_identity_legacy_contract_cs21a174.json', 'utf8'));
const ventas = fs.readFileSync('src/ventas_parts.jsx', 'utf8');
const matriculas = fs.readFileSync('src/matriculas_admin.jsx', 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(`CS21A195 guard: ${msg}`);
}

const ev = contract.historical_acl_evidence || {};
must(contract.no_acl_change === true, 'no ACL change must remain explicit');
must(contract.no_consumer_switch_before_backend === true, 'consumer switch must remain blocked before backend');
must(ev.publisher_call === '_guardarFotoProspecto', 'historical publisher must remain mapped');
must(ev.sharing_behavior === 'DriveApp.Access.ANYONE_WITH_LINK + DriveApp.Permission.VIEW', 'historical public sharing evidence must remain explicit');
must(ev.returned_delivery === 'lh3.googleusercontent.com/d/{file_id}', 'historical lh3 delivery evidence must remain explicit');
must(ev.current_object_acl === 'NOT_PROVEN', 'current object ACL must not be overstated');
must(ev.fresh_modular_QA_snapshot === 'PENDING_ISSUE_111', 'fresh modular QA snapshot must remain pending');
must(String(contract.evidence_rule || '').includes('current object ACL is not proven'), 'evidence boundary must remain explicit');

for (const field of ['FOTO_CED_FRENTE', 'FOTO_CED_DORSO', 'FOTO_TITULO']) {
  must(contract.fields.includes(field), `missing legacy field ${field}`);
}

must(ventas.includes('function vxDriveCandidates(url)'), 'Ventas legacy candidate builder must remain inventoried');
must(ventas.includes('https://drive.google.com/thumbnail'), 'Ventas direct Drive candidate must remain present until migration');
must(ventas.includes('https://lh3.googleusercontent.com/d/'), 'Ventas lh3 candidate must remain present until migration');
must(matriculas.includes('function driveCandidates(url)'), 'Matrículas legacy candidate builder must remain inventoried');
must(matriculas.includes('https://drive.google.com/thumbnail'), 'Matrículas direct Drive candidate must remain present until migration');
must(matriculas.includes('https://lh3.googleusercontent.com/d/'), 'Matrículas lh3 candidate must remain present until migration');

must(contract.target_delivery?.proposed_operation === 'descargarDocumentoIdentidadPrivado', 'private endpoint contract must remain stable');
must(Array.isArray(contract.runtime_gate) && contract.runtime_gate.some(x => x.includes('representative current legacy identity/title objects')), 'runtime gate must require actual current-object ACL evidence');

console.log('CS21A195 SEC002 IDENTITY LEGACY EVIDENCE: PASS');
console.log('HISTORICAL_PUBLIC_SHARING=PROVEN');
console.log('CURRENT_OBJECT_ACL=NOT_PROVEN');
console.log('ACTIVE_LEGACY_CONSUMERS=VENTAS+MATRICULAS_ADMIN');
console.log('ACL_CHANGE=NONE');
console.log('BACKEND_SNAPSHOT=PENDING_ISSUE_111');
