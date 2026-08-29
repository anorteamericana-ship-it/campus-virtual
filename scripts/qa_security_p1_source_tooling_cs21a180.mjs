import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const sec004 = JSON.parse(read('security/sec004_demo_readonly_contract_v3.json'));
const oidc = JSON.parse(read('security/sec001_oidc_bridge_contract_v2.json'));
const snapshotPs = read('scripts/export_apps_script_qa_snapshot_cs21a178.ps1');
const loginHtml = read('login.html');
const failures = [];
const check = (ok, msg) => ok ? console.log(`PASS: ${msg}`) : failures.push(msg);

// Preserve integrated functional candidate beneath this branch.
check(fs.existsSync('scripts/qa_matriculas_ventas_security_cs21a177.mjs'), 'CS21A177 integrated guard present');
check(fs.existsSync('scripts/qa_security_source_candidate_cs21a179.mjs'), 'CS21A179 SEC001 integrated guard present');

// SEC-001 remains partial and inert.
check(oidc.enabled_by_default === false || oidc.runtime?.enabled_by_default === false || read('src/auth_provider_sec001_v2.jsx').includes('enabled: false'), 'OIDC disabled by default');
check(!loginHtml.includes('auth_provider_sec001_v2.jsx'), 'OIDC adapter remains unloaded from login');
check(!read('src/login.jsx').includes('iniciarSesionOidc'), 'traditional login remains active path');

// SEC-004 source candidate remains uninstalled and fail-closed by contract.
check(sec004.id === 'SEC-004' && sec004.version === 3, 'SEC004 V3 contract present');
check(sec004.outer_guard?.identity_adapter_required === '_sec004DemoIdentityAdapter_', 'generic demo identity adapter required');
check(sec004.outer_guard?.adapter_missing_authenticated_behavior === 'deny sec004_policy_unbound', 'missing demo policy fails closed');
check(sec004.outer_guard?.demo_unknown_route_behavior === 'deny demo_read_only', 'unknown demo route fails closed');
check(sec004.outer_guard?.person_specific_demo_helpers_allowed === false, 'person-specific demo helpers prohibited');
check(sec004.deployment?.installed_in_qa === false, 'SEC004 contract does not claim QA install');
check(sec004.deployment?.production_changed === false, 'SEC004 contract does not claim PROD change');

// CS21A178 is strictly read-only tooling and directly answers the snapshot gate.
check(snapshotPs.includes("@('clone-script',$QaScriptId)"), 'snapshot tooling uses clasp clone-script');
check(!/Invoke-Clasp[^\n]*@\(['\"](?:push|deploy|create-deployment|update-deployment|undeploy)/i.test(snapshotPs), 'snapshot tooling contains no clasp write/deploy command');
check(snapshotPs.includes('$MinimumSourceFiles = 37'), 'snapshot tooling rejects old undersized modular packages');
check(fs.existsSync('scripts/apps_script_qa_snapshot_manifest_cs21a178.mjs'), 'snapshot manifest analyzer present');

// Cross-P1 boundary: no source artifact is mistaken for runtime closure.
check(sec004.current_qa_evidence?.fresh_export_available_in_this_session === false, 'SEC004 acknowledges fresh export pending');
check(sec004.backend_port_pending?.required === true, 'SEC004 backend port remains pending');

if (failures.length) {
  console.error('QA SECURITY P1 SOURCE TOOLING CS21A180 FAIL');
  failures.forEach(x => console.error('-', x));
  process.exit(1);
}
console.log('QA SECURITY P1 SOURCE TOOLING CS21A180 PASS');
