import fs from 'node:fs';
import vm from 'node:vm';

const path = 'apps_script_patches/ZZ_SEC004_DEMO_READONLY_OUTER_GUARD_V3.gs';
const src = fs.readFileSync(path, 'utf8');
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else {
    failures.push(name);
    console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`);
  }
};

check('guard source compiles as JavaScript', (() => {
  try { new vm.Script(src, { filename:path }); return true; } catch (e) { console.error(e); return false; }
})());
check('guard has no person-specific legacy demo helpers', !/_demoKeylor|DEMO_OLDE|Demo2026|profe2026/i.test(src));
check('guard requires generic identity adapter', src.includes("typeof _sec004DemoIdentityAdapter_ !== 'function'"));
check('guard supports generic simulated-write adapter', src.includes("typeof _sec004DemoSimulatedWriteAdapter_ === 'function'"));
check('missing adapter is fail-closed', src.includes("error: 'sec004_policy_unbound'"));
check('unknown demo routes are fail-closed', src.includes("error: 'demo_read_only'"));
check('file name explicitly is not order proof', /file name is not proof of order/i.test(src));
check('guard wraps validarSesion', src.includes('var _sec004ValidarSesionBase_ = validarSesion;') && src.includes('validarSesion = function(token)'));
check('guard wraps iniciarSesion', src.includes('var _sec004IniciarSesionBase_ = iniciarSesion;') && src.includes('iniciarSesion = function(body)'));
check('guard wraps doPost exactly once', (src.match(/\bdoPost\s*=\s*function\s*\(e\)/g) || []).length === 1);
check('guard delegates no-token public requests', src.includes("if (!token) return _sec004DoPostBase_(e);"));
check('logout remains session bookkeeping', src.includes("if (key === 'cerrarsesion') return _sec004DoPostBase_(e);"));
const doPostBody = src.slice(src.lastIndexOf('doPost = function(e) {'));
check('scope validation precedes simulated writes', doPostBody.indexOf('_sec004DemoScopeAllowed_(fn, body, session, policy)') > -1 && doPostBody.indexOf('_sec004DemoScopeAllowed_(fn, body, session, policy)') < doPostBody.indexOf('var simulated = _sec004DemoSimulatedWriteAdapter_(fn, body'));

const allowBlock = src.slice(
  src.indexOf('var SEC004_DEMO_SAFE_READS = {'),
  src.indexOf('};', src.indexOf('var SEC004_DEMO_SAFE_READS = {')) + 2
);
const safeReadCount = (allowBlock.match(/:\s*true/g) || []).length;
check('safe-read allowlist remains narrow (23 routes)', safeReadCount === 23, `observed=${safeReadCount}`);
for (const forbidden of [
  'recalcularnotafinaloficial',
  'reportarpago',
  'marcarsolicitudaplicada',
  'crearestudiante',
  'englishlabwordsearchcreateroom',
  'futurebrandnewmutation'
]) {
  check(`mutation not allowlisted: ${forbidden}`, !allowBlock.includes(`'${forbidden}'`));
}

function makeContext({ withAdapter=true } = {}) {
  let baseCalls = 0;
  const ctx = {
    JSON,
    Object,
    Array,
    String,
    ContentService: {
      MimeType: { JSON:'JSON' },
      createTextOutput: x => ({ setMimeType: () => x })
    },
    _an4406_parseBody_: e => JSON.parse(e?.postData?.contents || '{}'),
    _an4406_json_: x => x,
    validarSesion: token => {
      if (token === 'demo-token') return { ok:true, rol:'teacher', codigo:'DEMO-T', nombre:'Demo Teacher' };
      if (token === 'real-token') return { ok:true, rol:'teacher', codigo:'REAL-T', nombre:'Real Teacher' };
      return { ok:false, error:'sesion_requerida' };
    },
    iniciarSesion: body => ({ ok:true, rol:'teacher', codigo:body?.usuario === 'demo' ? 'DEMO-T' : 'REAL-T', nombre:'Teacher' }),
    doPost: e => {
      baseCalls++;
      const body = JSON.parse(e?.postData?.contents || '{}');
      return { ok:true, base:true, fn:body.fn || '' };
    },
    __getBaseCalls: () => baseCalls,
    __resetBaseCalls: () => { baseCalls = 0; }
  };

  if (withAdapter) {
    ctx._sec004DemoIdentityAdapter_ = session => {
      if (session?.codigo !== 'DEMO-T') return { is_demo:false };
      return {
        is_demo:true,
        kind:'teacher',
        scope:{
          groups:['G-DEMO'],
          student_codes:['S-DEMO'],
          cedulas:['C-DEMO'],
          teachers:['T-DEMO']
        }
      };
    };
    ctx._sec004DemoSimulatedWriteAdapter_ = (fn, body) => {
      if (String(fn).toLowerCase() === 'guardarasistenciadocente') {
        return { ok:true, demo:true, simulated:true, cod_grupo:body.cod_grupo || '' };
      }
      return null;
    };
  }
  vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename:path });
  return ctx;
}

const req = (fn, token='', extra={}) => ({
  parameter:{},
  postData:{ contents:JSON.stringify({ fn, token, ...extra }) }
});

{
  const ctx = makeContext();
  ctx.__resetBaseCalls();
  let r = ctx.doPost(req('crearInscripcionPublica'));
  check('public no-token request delegates', r?.base === true && ctx.__getBaseCalls() === 1);

  ctx.__resetBaseCalls();
  r = ctx.doPost(req('recalcularNotaFinalOficial', 'real-token', { cod_grupo:'REAL' }));
  check('real authenticated mutation delegates', r?.base === true && ctx.__getBaseCalls() === 1);

  ctx.__resetBaseCalls();
  r = ctx.doPost(req('futureBrandNewMutation', 'demo-token'));
  check('unknown future demo route denied before base', r?.error === 'demo_read_only' && ctx.__getBaseCalls() === 0);

  ctx.__resetBaseCalls();
  r = ctx.doPost(req('getGrupoInfo', 'demo-token', { cod_grupo:'G-DEMO' }));
  check('demo safe read with allowed scope delegates', r?.base === true && ctx.__getBaseCalls() === 1);

  ctx.__resetBaseCalls();
  r = ctx.doPost(req('getGrupoInfo', 'demo-token', { cod_grupo:'REAL-GROUP' }));
  check('demo forged scope denied before base', r?.error === 'demo_read_only' && ctx.__getBaseCalls() === 0);

  ctx.__resetBaseCalls();
  r = ctx.doPost(req('guardarAsistenciaDocente', 'demo-token', { cod_grupo:'G-DEMO' }));
  check('synthetic demo write only through adapter', r?.simulated === true && r?.demo === true && ctx.__getBaseCalls() === 0);

  const login = ctx.iniciarSesion({ usuario:'demo' });
  check('demo login exposes read-only mode', login?.ok === true && login?.demo === true && login?.read_only === true && login?.demo_kind === 'teacher');
}

{
  const ctx = makeContext({ withAdapter:false });
  ctx.__resetBaseCalls();
  const r = ctx.doPost(req('getInfoGeneral', 'demo-token'));
  check('authenticated request fails closed when identity adapter is missing', r?.error === 'sec004_policy_unbound' && ctx.__getBaseCalls() === 0);
  const login = ctx.iniciarSesion({ usuario:'real-or-demo' });
  check('login fails closed when identity adapter is missing', login?.error === 'sec004_policy_unbound');
}

if (failures.length) {
  console.error(`SEC004 CS21A163 QA: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC004 CS21A163 QA: PASS');
