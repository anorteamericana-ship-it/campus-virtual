import fs from 'node:fs';

const app=fs.readFileSync('src/app.jsx','utf8');
const sidebar=fs.readFileSync('src/sidebar.jsx','utf8');
const src=fs.readFileSync('src/permisos_roles.jsx','utf8');
function must(cond,label){if(!cond)throw new Error(`CS21A210M FAIL: ${label}`);console.log(`OK|${label}`);}

must(app.includes("permisos_roles: rolReal === 'superadmin'"),'router gates Permisos/Roles to real superadmin');
must(app.includes(": <NoAutorizadoCampus rol={rolReal} />"),'router has explicit unauthorized fallback');
must(!app.includes('permisos_roles: <LazyRoute title="Permisos y roles"'),'ungated router mapping removed');
must(sidebar.includes("...(esSuperadmin ? [{ id: 'permisos_roles', label: 'Permisos y roles', icon: 'settings' }] : []),"),'sidebar exposes Permisos/Roles only to superadmin');
must(!sidebar.includes("        { id: 'permisos_roles', label: 'Permisos y roles', icon: 'settings' },"),'ungated sidebar item removed');

must(src.includes("function prSafeUserError(raw, fallback, context = '')"),'safe error helper exists');
must(src.includes("console.warn('[PermisosRoles] Detalle técnico oculto al operador.'"),'technical error stays console-only');
must(src.includes("setErr(prSafeUserError(e?.message || String(e), 'No se pudo cargar la revisión de permisos. Intentá de nuevo.', 'cargar_permisos'))"),'load catch crosses safe boundary');
must(!src.includes('setErr(e.message || String(e))'),'raw error sink removed');

must(src.includes('function prActionLabel(v)'),'action presentation mapper exists');
must(src.includes('function prRoleLabel(v)'),'role presentation mapper exists');
must(src.includes('function prOperatorText(v, fallback = \'—\')'),'data-supplied copy sanitizer exists');
must(src.includes('>Acciones protegidas</PermisosButton>'),'operator tab label is non-technical');
must(src.includes('title="Acciones protegidas"'),'operator KPI label is non-technical');
must(src.includes('title="Acciones protegidas por módulo"'),'operator table title is non-technical');
must(src.includes('["fn","Acción"]'),'endpoint column presented as action');
must(src.includes('["roles_backend","Roles del sistema"]'),'backend-role copy presented as system roles');
must(src.includes('["endpoints","Acciones"]'),'ownership endpoint copy presented as actions');
must(src.includes("prActionLabel(e.fn), prRoles(e.roles_esperados), prRoles(e.roles_backend)"),'CSV humanizes action and roles');
must(src.includes("if (k === 'fn' || k === 'endpoint') return prActionLabel(v);"),'table humanizes endpoint values');
must(src.includes("if (k === 'endpoints')"),'ownership action lists humanized');
must(src.includes("prOperatorText(r.titulo"),'risk/recommendation titles cross operator boundary');
must(src.includes("prOperatorText(r.texto"),'risk/recommendation text crosses operator boundary');

must(!src.includes('>Endpoints</PermisosButton>'),'raw Endpoints tab absent');
must(!src.includes('Leyendo mapa de permisos del backend'),'backend loading copy absent');
must(!src.includes('sub={data.version || \'F42\'}'),'internal version badge absent');
must(!src.includes('["fn","Endpoint"]'),'raw Endpoint column absent');
must(!src.includes('["roles_backend","Roles backend"]'),'raw backend-role header absent');
must(!src.includes("[['modulo','endpoint','roles_esperados','roles_backend','estado','nota']"),'raw CSV headers absent');

must(src.includes("postPermisosRoles('auditoriaRolesPermisos', {})"),'audit endpoint contract preserved');
must(src.includes("const token = window.getSessionToken ? window.getSessionToken() : '';"),'session token preserved');
must(src.includes("method: 'POST'"),'POST transport preserved');
must(src.includes('body: JSON.stringify({ fn, token, ...payload })'),'token body contract preserved');
must(src.includes('const endpoints = data?.endpoints || [];'),'raw backend contract remains internal');
must(src.includes("const endpointsFiltrados = endpoints.filter(e => filtro === 'todos'"),'internal filter semantics preserved');
must(src.includes('setData(r);'),'successful data assignment preserved');
must(src.includes('finally { setLoading(false); }'),'loading release preserved');

console.log('CS21A210M PASS: superadmin frontend gate + operator-safe Permisos/Roles presentation; backend authorization remains outside this source proof');
