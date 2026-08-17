import fs from 'node:fs';
import vm from 'node:vm';

const corePath = 'qa/sec004_codegs_demo_core_delta.patch';
const outerPath = 'apps_script_patches/ZZ_SEC004_DEMO_READONLY_OUTER_GUARD.gs';
const core = fs.readFileSync(corePath, 'utf8');
const outer = fs.readFileSync(outerPath, 'utf8');
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};

const coreHunks = (core.match(/^@@ /gm) || []).length;
check('Code.gs demo-core delta has exactly five hunks', coreHunks === 5, `observed=${coreHunks}`);
check('demo-core delta targets Code.gs only', /^--- Code\.gs$/m.test(core) && /^\+\+\+ Code\.gs\.sec004core$/m.test(core));
check('demo-core has no doPost wrapper', !/^[+].*doPost\s*=\s*function\s*\(/m.test(core));
check('student demo secret comes from Script Properties', core.includes("_sec004DemoSecret_('SEC004_DEMO_STUDENT_SECRET')"));
check('teacher demo secret comes from Script Properties', core.includes("_sec004DemoSecret_('SEC004_DEMO_TEACHER_SECRET')"));
check('demo credential minimum remains 20 characters', core.includes("length >= 20"));
check('old literal student secret removed by patch', core.includes("-var DEMO_KEYLOR_STUDENT_PASSWORD = 'Demo2026';"));
check('old literal teacher secret removed by patch', core.includes("-var DEMO_OLDE_TEACHER_PASSWORD = 'profe2026';"));
check('student portal short-circuits synthetic demo before real portal', core.includes('var demo = _sec004DemoStudentPortal_(code);') && core.includes('if (demo) return demo;') && core.includes('return _cs21a72PortalBase_(params);'));
check('demo-core does not alter LAB engine symbols', !/englishLabMemoryMatch|MEMORY_MATCH|memory_match/.test(core));

const doPostWrappers = (outer.match(/\bdoPost\s*=\s*function\s*\(e\)/g) || []).length;
check('outer guard contains exactly one doPost wrapper', doPostWrappers === 1, `observed=${doPostWrappers}`);
check('outer guard declares project-final requirement', /último doPost EFECTIVO del proyecto Apps Script/.test(outer));
check('outer guard wraps validarSesion', outer.includes('var _sec004ValidarSesionBase_ = validarSesion;') && outer.includes('validarSesion = function(token)'));
check('outer guard wraps iniciarSesion', outer.includes('var _sec004IniciarSesionBase_ = iniciarSesion;') && outer.includes('iniciarSesion = function(body)'));
check('outer guard wraps current doPost instead of replacing router internals', outer.includes('var _sec004DoPostBase_ = doPost;'));
check('unknown demo routes fail closed', outer.includes("return _an4406_json_(_sec004DemoDenied_(fn, session));"));
check('logout bookkeeping remains allowed', outer.includes("if (key === 'cerrarsesion') return _sec004DoPostBase_(e);"));
check('scope validation happens before simulated or safe delegation', outer.indexOf('_sec004DemoScopeAllowed_(fn, body, session)') < outer.indexOf('_demoKeylorInterceptPost_(fn, body'));
check('outer guard does not edit LAB engine symbols', !/englishLabMemoryMatch|MEMORY_MATCH|memory_match/.test(outer));

const allowBlock = outer.slice(outer.indexOf('var SEC004_DEMO_SAFE_READS = {'), outer.indexOf('};', outer.indexOf('var SEC004_DEMO_SAFE_READS = {')) + 2);
const safeReadCount = (allowBlock.match(/:\s*true/g) || []).length;
check('safe-read allowlist remains exactly 23 routes', safeReadCount === 23, `observed=${safeReadCount}`);
for (const forbidden of ['recalcularnotafinaloficial','getmiscertificadosestado','getperfildocentecs21a76','examreviewinbox','academiaplaygetprogress']) {
  check(`unsafe route not allowlisted: ${forbidden}`, !allowBlock.includes(`'${forbidden}'`));
}

// Synthetic proof of the architectural intent: when this file is evaluated after
// an existing dispatcher, a route that the accumulated English LAB layer would
// otherwise intercept is denied by the outer demo guard before the base is called.
let baseCalls = 0;
const ctx = {
  JSON,
  _an4406_parseBody_: e => JSON.parse(e?.postData?.contents || '{}'),
  _an4406_json_: x => x,
  _demoKeylorSesion_: s => s?.rol === 'teacher' && s?.codigo === 'DEMO-TEACHER',
  _demoKeylorStudentByCodeCS21A72_: () => null,
  _demoKeylorIsGroup_: g => String(g || '') === '0626',
  _demoKeylorStudents_: () => [],
  _demoKeylorInput_: () => true,
  _demoKeylorInterceptPost_: () => null,
  validarSesion: token => token === 'demo-token' ? {ok:true,rol:'teacher',codigo:'DEMO-TEACHER',nombre:'Demo'} : {ok:true,rol:'teacher',codigo:'REAL',nombre:'Real'},
  iniciarSesion: () => ({ok:true,rol:'teacher',codigo:'REAL'}),
  doPost: e => { baseCalls++; return {ok:true,base:true,fn:JSON.parse(e.postData.contents).fn}; }
};
vm.createContext(ctx);
vm.runInContext(outer, ctx, {filename:'ZZ_SEC004_DEMO_READONLY_OUTER_GUARD.gs'});
const req = (fn, token, extra={}) => ({postData:{contents:JSON.stringify({fn,token,...extra})},parameter:{}});
baseCalls = 0;
let result = ctx.doPost(req('englishLabWordSearchCreateRoom','demo-token',{cod_grupo:'0626'}));
check('outer guard blocks accumulated-layer sentinel route for demo', result?.error === 'demo_read_only' && result?.version === 'SEC004-DEMO-READONLY-1' && baseCalls === 0);
baseCalls = 0;
result = ctx.doPost(req('recalcularNotaFinalOficial','demo-token',{cod_grupo:'0626'}));
check('outer guard blocks base mutation for demo', result?.error === 'demo_read_only' && baseCalls === 0);
baseCalls = 0;
result = ctx.doPost(req('futureBrandNewMutation','demo-token'));
check('outer guard blocks unknown future demo route', result?.error === 'demo_read_only' && baseCalls === 0);
baseCalls = 0;
result = ctx.doPost(req('englishLabWordSearchCreateRoom','real-token',{cod_grupo:'REAL'}));
check('real session still delegates to accumulated/base dispatcher', result?.base === true && baseCalls === 1);
baseCalls = 0;
result = ctx.doPost(req('crearInscripcionPublica',''));
check('public request without token remains delegated', result?.base === true && baseCalls === 1);

if (failures.length) {
  console.error(`SEC004 PROJECT OUTER GUARD QA: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC004 PROJECT OUTER GUARD QA: PASS');
