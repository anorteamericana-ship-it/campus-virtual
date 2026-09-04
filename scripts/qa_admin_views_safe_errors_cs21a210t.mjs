import fs from 'node:fs';

const src=fs.readFileSync('src/admin_views.jsx','utf8');
function must(ok,label){if(!ok){console.error(`FAIL|${label}`);process.exitCode=1;return;}console.log(`OK|${label}`);}
function count(s,n){return s.split(n).length-1;}

must(src.includes('function adminViewsSafeUserError('),'safe-user helper exists');
must(src.includes("console.error('[Admin Views]'"),'technical detail stays console-only');
must(count(src,'adminViewsSafeUserError(')===7,'exactly six call sites plus helper');

must(src.includes("setError(adminViewsSafeUserError(d, 'No se pudo cargar el dashboard.', 'getAdminDashboard'))"),'dashboard backend safe boundary');
must(src.includes("setError(adminViewsSafeUserError(e, 'No se pudo cargar el dashboard.', 'getAdminDashboard'))"),'dashboard transport safe boundary');
must(src.includes("setError(adminViewsSafeUserError(res, 'No se pudo cargar el perfil administrativo.', 'getMiPerfilAdmin'))"),'profile backend safe boundary');
must(src.includes("setError(adminViewsSafeUserError(err, 'No se pudo cargar el perfil administrativo.', 'getMiPerfilAdmin'))"),'profile transport safe boundary');
must(src.includes("alert(adminViewsSafeUserError(r, 'No se pudo sincronizar CONAPE.', 'sincronizarCONAPE'))"),'CONAPE backend safe boundary');
must(src.includes("alert(adminViewsSafeUserError(e, 'No se pudo sincronizar CONAPE.', 'sincronizarCONAPE'))"),'CONAPE transport safe boundary');

for(const raw of [
  "setError(d.error || 'No se pudo cargar el dashboard')",
  'setError(e.message)',
  "setError((res && (res.mensaje || res.error)) || 'No se pudo cargar el perfil administrativo.')",
  "setError(err && err.message ? err.message : 'No se pudo cargar el perfil administrativo.')",
  "alert('Error: ' + (r.error || 'sin detalle'))",
  "alert('Error: ' + e.message)"
]) must(!src.includes(raw),`raw sink removed: ${raw}`);

for(const fn of ['getAdminDashboard','getMiPerfilAdmin','sincronizarCONAPE']) must(src.includes(`'${fn}'`),`contract preserved: ${fn}`);
must(src.includes('function adminPreviewMode()'),'shared preview detector preserved');
must(src.includes("if (esDemo) { setData({ ok: true, grupos: [] }); setLoading(false);"),'dashboard preview avoids backend preserved');
must(src.includes("if (adminPreview) { alert('Modo demostración: esta vista es solo lectura. No se enviaron cambios.'); return; }"),'CONAPE preview fail-closed preserved');
must(src.includes("postCampus('sincronizarCONAPE')"),'real CONAPE operation preserved outside preview');
must(src.includes('if (error)   return <ErrorState message={error}'),'dashboard visible error boundary preserved');

if(!process.exitCode) console.log('CS21A210T PASS');
