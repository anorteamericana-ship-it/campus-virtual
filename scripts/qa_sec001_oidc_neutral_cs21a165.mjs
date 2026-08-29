import fs from 'node:fs';
import vm from 'node:vm';

const adapterPath = 'src/auth_provider_sec001_v2.jsx';
const contractPath = 'security/sec001_oidc_bridge_contract_v2.json';
const lifecyclePath = 'security/sec001_login_lifecycle_map_v2.json';
const src = fs.readFileSync(adapterPath, 'utf8');
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const lifecycle = JSON.parse(fs.readFileSync(lifecyclePath, 'utf8'));
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};

check('adapter compiles', (() => { try { new vm.Script(src, { filename:adapterPath }); return true; } catch (e) { console.error(e); return false; } })());
check('adapter is provider-neutral', !/provider:\s*['"]auth0['"]|createAuth0Client|loginWithRedirect|auth0\./i.test(src));
check('adapter default is disabled', /enabled:\s*false/.test(src));
check('adapter only permits dev/qa', src.includes("['dev', 'qa'].includes(cfg.environment)"));
check('adapter requires OIDC openid scope', src.includes("openid_scope_required"));
check('adapter contains no client secret config', !/clientSecret|client_secret/.test(src));
check('adapter does not accept password or clave', !/\bpassword\b|\bclave\b/.test(src));
check('adapter exposes generic driver only', src.includes('SEC001_OIDC_DRIVER') && src.includes('beginLogin') && src.includes('resolveCallback') && src.includes('getProof'));
check('adapter does not call Campus setSesion', !/setSesion\s*\(/.test(src));
check('adapter does not contain fetch call', !/\bfetch\s*\(/.test(src));
check('adapter does not write storage', !/localStorage|sessionStorage/.test(src));

let redirects = 0;
let fetches = 0;
let storageWrites = 0;
let driverCalls = 0;
const ctx = {
  URL,
  URLSearchParams,
  window: {
    location: { href:'https://qa.example.test/login.html', search:'' },
    fetch: () => { fetches++; },
    localStorage: { setItem: () => { storageWrites++; } },
    sessionStorage: { setItem: () => { storageWrites++; } },
  },
};
ctx.window.location.assign = () => { redirects++; };
vm.createContext(ctx);
vm.runInContext(src, ctx, { filename:adapterPath });
check('load exposes adapter API', !!ctx.window.SEC001_AUTH_PROVIDER_V2);
check('load performs zero redirects', redirects === 0, `observed=${redirects}`);
check('load performs zero fetches', fetches === 0, `observed=${fetches}`);
check('load performs zero storage writes', storageWrites === 0, `observed=${storageWrites}`);
check('default readiness is false', ctx.window.SEC001_AUTH_PROVIDER_V2.getReadiness().ready === false);

ctx.window.SEC001_MANAGED_AUTH_CONFIG_V2 = {
  enabled:true,
  environment:'qa',
  providerId:'oidc-test',
  issuer:'https://issuer.example.test/',
  clientId:'public-client-id',
  redirectUri:'https://qa.example.test/login-callback',
  scope:'openid profile email',
};
ctx.window.SEC001_OIDC_DRIVER = {
  beginLogin: async ({ config, usernameHint }) => { driverCalls++; return { started:true, providerId:config.providerId, usernameHint }; },
  resolveCallback: async ({ config }) => { driverCalls++; return { handled:true, providerId:config.providerId }; },
  getProof: async () => { driverCalls++; return 'opaque-provider-proof'; },
};

check('configured fake QA driver becomes ready', ctx.window.SEC001_AUTH_PROVIDER_V2.getReadiness().ready === true);
const begin = await ctx.window.SEC001_AUTH_PROVIDER_V2.beginLogin({ usernameHint:' qa-user ' });
check('explicit beginLogin delegates once', begin?.started === true && begin?.usernameHint === 'qa-user' && driverCalls === 1);
const callback = await ctx.window.SEC001_AUTH_PROVIDER_V2.resolveCallback();
check('explicit callback delegates once', callback?.handled === true && driverCalls === 2);
const proof = await ctx.window.SEC001_AUTH_PROVIDER_V2.getProviderProof(callback);
check('explicit proof delegates once', proof === 'opaque-provider-proof' && driverCalls === 3);

ctx.window.SEC001_MANAGED_AUTH_CONFIG_V2.environment = 'prod';
check('production environment is rejected', ctx.window.SEC001_AUTH_PROVIDER_V2.getReadiness().ready === false && ctx.window.SEC001_AUTH_PROVIDER_V2.getConfigStatus().errors.includes('non_qa_environment'));

check('contract is vendor-neutral', contract.provider_selection?.locked_to_vendor === false && contract.provider_selection?.required_protocol === 'OpenID Connect');
check('contract forbids production tenant now', contract.provider_selection?.production_tenant_allowed_now === false);
check('contract forbids browser client secret', contract.browser_adapter?.client_secret_allowed === false);
check('future backend endpoint remains unrouted', contract.routing_gate?.doPost_route_may_be_added_before_dev_qa_provider_exists === false);
check('fresh modular Apps Script snapshot required', contract.routing_gate?.apps_script_port_requires_fresh_modular_snapshot === true);
check('provider claims cannot grant Campus authorization', contract.local_authorization_after_identity?.provider_claims_cannot_override_local_fields === true);
check('stable identity includes provider issuer and sub', JSON.stringify(contract.server_provider_verification?.stable_identity_key) === JSON.stringify(['PROVIDER_ID','ISSUER','PROVIDER_SUB']));

check('lifecycle map is current main', lifecycle.observed_base === 'main@53df524d0a9eab867d3b307b3e633f366af92a63');
check('lifecycle confirms adapter unloaded', lifecycle.entrypoint?.v2_adapter_loaded === false);
check('lifecycle confirms legacy password still reaches Apps Script', lifecycle.legacy_credentialing?.password_reaches_apps_script === true);
check('lifecycle preserves existing Campus session consumers', lifecycle.modernization_boundary?.keep_existing_campus_session_dto === true && lifecycle.modernization_boundary?.keep_authenticated_api_consumers === true);

if (failures.length) {
  console.error(`SEC001 OIDC NEUTRAL CS21A165: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC001 OIDC NEUTRAL CS21A165: PASS');
