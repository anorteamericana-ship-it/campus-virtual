import fs from 'node:fs';

const sourcePath = 'src/additional_resources_panel_cs21a68.jsx';
const contractPath = 'security/sec006_additional_resources_access_contract_v1.json';
const source = fs.readFileSync(sourcePath, 'utf8');
const contractRaw = fs.readFileSync(contractPath, 'utf8');
const contract = JSON.parse(contractRaw);

function must(condition, message) {
  if (!condition) throw new Error(message);
}

must(source.includes("post('getBibliotecaNivelEstudiante'"), 'catalog endpoint must remain getBibliotecaNivelEstudiante');
must(source.includes("const canChooseLevel = role === 'admin' || role === 'superadmin';"), 'admin/superadmin level selection must remain explicit');
must(source.includes("if (role === 'teacher' || role === 'docente')"), 'teacher-specific resource filtering must remain explicit');
must(source.includes("filter(isDictionary).slice(0, 1)"), 'teacher view must remain dictionary-limited');
must(source.includes("window.open(url, '_blank', 'noopener,noreferrer')"), 'current URL-based resource opening must remain documented until migration');
must(source.includes('additionalResourcesSafeUserError'), 'CS21A200E safe-error boundary must remain present');

must(contract.contract_id === 'SEC-006-ADDITIONAL-RESOURCES-ACCESS-V1', 'unexpected contract id');
must(contract.classification === 'P1_ACCESS_CONTROL', 'classification must remain P1 access control');
must(contract.drive_evidence?.root_folders_checked === 4, 'must retain 4-root evidence count');
must(contract.drive_evidence?.root_folders_anyone_reader === 4, 'must retain 4/4 anyone-reader root finding');
must(contract.drive_evidence?.representative_files_checked === 1, 'must retain representative file evidence count');
must(contract.drive_evidence?.representative_files_anyone_reader === 1, 'must retain representative file anyone-reader finding');
must(contract.drive_evidence?.drive_object_ids_committed === false, 'Drive object IDs must not be committed in this contract');
must(contract.drive_evidence?.individual_permission_identities_committed === false, 'individual permission identities must not be committed');
must(contract.release_gate === 'BLOCK_UNTIL_ROLE_BOUND_DELIVERY_AND_ACL_E2', 'release gate must remain fail-closed');
must(contract.acl_changed_by_this_cut === false, 'this cut must not claim/change ACL');
must(contract.apps_script_changed_by_this_cut === false, 'this cut must not claim Apps Script changes');
must(contract.production_changed_by_this_cut === false, 'this cut must not claim production changes');
must(contract.release_claim === 'NOT_FIXED_ACCESS_POLICY_PENDING', 'this cut must not claim access fixed');

must(!/drive\.google\.com|docs\.google\.com/i.test(contractRaw), 'contract must not publish Drive URLs');
must(!/emailAddress|@gmail\.com|@ina\.ac\.cr|@est\./i.test(contractRaw), 'contract must not publish individual permission identities');

console.log('CS21A200F SEC-006 ADDITIONAL RESOURCES ACCESS: PASS');
console.log('ROOT_ACL_EVIDENCE=4_OF_4_ANYONE_READER');
console.log('REPRESENTATIVE_FILE_ACL=ANYONE_READER');
console.log('DRIVE_IDS_COMMITTED=NO');
console.log('ACL_CHANGED=NO');
console.log('RELEASE_GATE=BLOCK_UNTIL_ROLE_BOUND_DELIVERY_AND_ACL_E2');
