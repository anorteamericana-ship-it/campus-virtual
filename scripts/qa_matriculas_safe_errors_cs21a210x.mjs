import fs from 'node:fs';

const src=fs.readFileSync('src/matriculas.jsx','utf8');
function must(ok,label){if(!ok){console.error(`FAIL|${label}`);process.exitCode=1;return;}console.log(`OK|${label}`);}
function count(s,n){return s.split(n).length-1;}

must(src.includes('function matriculasSafeUserError('),'safe-user helper exists');
must(src.includes("console.error('[Matrículas]'"),'technical detail remains console-only');
must(count(src,'matriculasSafeUserError(')===5,'exactly four call sites plus helper');

for(const [needle,label] of [
  ["setError(matriculasSafeUserError(d,'No se pudieron cargar los prospectos.','getProspectos'))",'prospects backend safe'],
  ["setError(matriculasSafeUserError(e,'No se pudieron cargar los prospectos.','getProspectos'))",'prospects transport safe'],
  ["setErrGuardar(matriculasSafeUserError(data,'No se pudo guardar la matrícula.','actualizarEstatus'))",'matricula save backend safe'],
  ["setErrGuardar(matriculasSafeUserError(e,'No se pudo guardar la matrícula.','actualizarEstatus'))",'matricula save transport safe']
]) must(src.includes(needle),label);

for(const raw of [
  "setError(d.error || d.mensaje || 'Error al cargar prospectos')",
  'setError(e.message)',
  "setErrGuardar(data.error || 'Error al guardar la matrícula')",
  "setErrGuardar('Error de conexión: ' + e.message)"
]) must(!src.includes(raw),`raw sink removed: ${raw}`);

for(const needle of ['?fn=getProspectos','?fn=getGruposDisponibles','?fn=actualizarEstatus']) must(src.includes(needle),`endpoint preserved: ${needle}`);
must(src.includes("body: JSON.stringify({ fn: 'getProspectos', token: window.getSessionToken ? window.getSessionToken() : '', decay_pre_matricula: true })"),'getProspectos POST payload preserved');
must(src.includes("if (MAT_DEMO) { setGrupos([]); setCargandoGrupos(false); return; }"),'demo groups fail-closed preserved');
must(src.includes("if (MAT_DEMO) { setErrGuardar('Modo demostración: esta vista es solo lectura. No se enviaron cambios.'); return; }"),'demo save fail-closed preserved');
must(src.includes("const previewReadOnly = React.useCallback"),'preview action boundary preserved');
for(const state of ['showWizard','fichaProsp','verProsp','proformaProsp','conapeProsp','genProsp']) must(src.includes(`${state} && !MAT_DEMO && (`),`demo mount guard preserved: ${state}`);

if(!process.exitCode) console.log('CS21A210X PASS');
