import fs from 'node:fs';

const path = 'src/matriculas.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceExact(before, after, label) {
  const count = src.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: preimagen inesperada (${count})`);
  src = src.replace(before, after);
  console.log(`${label}: replaced 1`);
}

replaceExact(
`  React.useEffect(() => {
    // (SCRIPT_URL_MAT se hereda del scope del módulo — fuente única window.APPS_SCRIPT_URL)`,
`  React.useEffect(() => {
    if (MAT_DEMO) { setGrupos([]); setCargandoGrupos(false); return; }
    // (SCRIPT_URL_MAT se hereda del scope del módulo — fuente única window.APPS_SCRIPT_URL)`,
'wizard group read guard');

replaceExact(
`  const confirmar = async () => {
    if (!form.confirmado || guardando) return;
    setGuardando(true);`,
`  const confirmar = async () => {
    if (!form.confirmado || guardando) return;
    if (MAT_DEMO) { setErrGuardar('Modo demostración: esta vista es solo lectura. No se enviaron cambios.'); return; }
    setGuardando(true);`,
'wizard write guard');

replaceExact(
`  const showToast = React.useCallback((msg, tipo = 'info') => setToast({ msg, tipo }), []);`,
`  const showToast = React.useCallback((msg, tipo = 'info') => setToast({ msg, tipo }), []);
  const previewReadOnly = React.useCallback(() => {
    showToast('Modo demostración: esta vista es solo lectura. No se consultan ni modifican expedientes reales.', 'info');
  }, [showToast]);`,
'preview action boundary');

replaceExact(
`  const handleAbrir = (grupo = null) => { setGrupoPresel(grupo); setShowWizard(true); };`,
`  const handleAbrir = (grupo = null) => { if (MAT_DEMO) { previewReadOnly(); return; } setGrupoPresel(grupo); setShowWizard(true); };`,
'open wizard guard');

for (const [before, after, label] of [
  ["onClick={() => setVerProsp({ cedula, nombre })}", "onClick={() => MAT_DEMO ? previewReadOnly() : setVerProsp({ cedula, nombre })}", 'view prospect guard'],
  ["onClick={() => setProformaProsp({ cedula, nombre })}", "onClick={() => MAT_DEMO ? previewReadOnly() : setProformaProsp({ cedula, nombre })}", 'proforma guard'],
  ["onClick={() => setConapeProsp({ cedula, nombre })}", "onClick={() => MAT_DEMO ? previewReadOnly() : setConapeProsp({ cedula, nombre })}", 'conape guard'],
  ["onClick={() => setFichaProsp({ cedula, nombre, codigo: p.CODIGO_ESTUDIANTE || p.codigo_estudiante })}", "onClick={() => MAT_DEMO ? previewReadOnly() : setFichaProsp({ cedula, nombre, codigo: p.CODIGO_ESTUDIANTE || p.codigo_estudiante })}", 'student file guard'],
  ["onClick={() => setGenProsp({ cedula, nombre })}", "onClick={() => MAT_DEMO ? previewReadOnly() : setGenProsp({ cedula, nombre })}", 'generate enrollment guard'],
]) replaceExact(before, after, label);

for (const state of ['showWizard', 'fichaProsp', 'verProsp', 'proformaProsp', 'conapeProsp', 'genProsp']) {
  replaceExact(`${state} && (`, `${state} && !MAT_DEMO && (`, `${state} mount guard`);
}

fs.writeFileSync(path, src, 'utf8');
console.log('CS21A198B exact Matriculas preview read-only patch applied');
