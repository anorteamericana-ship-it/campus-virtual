import fs from 'node:fs';

const path = 'src/admin_views.jsx';
let src = fs.readFileSync(path, 'utf8');
function replaceExact(before, after, label) {
  const count = src.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: preimagen inesperada (${count})`);
  src = src.replace(before, after);
  console.log(`${label}: replaced 1`);
}

replaceExact(
`const SCRIPT_URL_AV = window.APPS_SCRIPT_URL;`,
`const SCRIPT_URL_AV = window.APPS_SCRIPT_URL;

function adminPreviewMode() {
  try {
    const q = new URLSearchParams(location.search);
    return q.get('demo') === '1' || !!q.get('preview');
  } catch (_) { return false; }
}`,
'preview helper');

replaceExact(
`    const esDemo = (() => { try { const q = new URLSearchParams(location.search); return q.get('demo') === '1' || !!q.get('preview'); } catch (_) { return false; } })();`,
`    const esDemo = adminPreviewMode();`,
'dashboard preview detector');

replaceExact(
`  const esSuperadmin = String(usr?.rol || '').toLowerCase() === 'superadmin';
  const [syncing, setSyncing] = React.useState(false);`,
`  const esSuperadmin = String(usr?.rol || '').toLowerCase() === 'superadmin';
  const adminPreview = adminPreviewMode();
  const [syncing, setSyncing] = React.useState(false);`,
'dashboard preview state');

replaceExact(
`  const handleSyncConape = async () => {
    setSyncing(true);`,
`  const handleSyncConape = async () => {
    if (adminPreview) { alert('Modo demostración: esta vista es solo lectura. No se enviaron cambios.'); return; }
    setSyncing(true);`,
'CONAPE write guard');

replaceExact(
`      right={<button className="btn btn-primary admin-sync-btn" onClick={handleSyncConape} disabled={syncing}>{syncing ? 'Sincronizando…' : 'Sincronizar CONAPE'}</button>}`,
`      right={<button className="btn btn-primary admin-sync-btn" onClick={handleSyncConape} disabled={syncing || adminPreview} title={adminPreview ? 'Modo demostración: solo lectura' : ''}>{syncing ? 'Sincronizando…' : 'Sincronizar CONAPE'}</button>}`,
'CONAPE button disabled');

replaceExact(
`  const [becasConfig, setBecasConfig] = React.useState([]);
  const [becasLoading, setBecasLoading] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));`,
`  const [becasConfig, setBecasConfig] = React.useState([]);
  const [becasLoading, setBecasLoading] = React.useState(false);
  const adminPreview = adminPreviewMode();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));`,
'wizard preview state');

replaceExact(
`  const confirmar = async () => {
    if (!form.confirmado || guardando) return;
    const { code, consec, periodo, año } = generarCodigoGrupo(form, grupos);`,
`  const confirmar = async () => {
    if (!form.confirmado || guardando) return;
    if (adminPreview) { alert('Modo demostración: esta vista es solo lectura. No se abrió ningún grupo.'); return; }
    const { code, consec, periodo, año } = generarCodigoGrupo(form, grupos);`,
'create group write guard');

replaceExact(
`            : <button onClick={confirmar} disabled={!form.confirmado || guardando}
                className="btn btn-primary"
                style={{ background:'var(--an-granate)', borderColor:'var(--an-granate)', minWidth:180, opacity: form.confirmado&&!guardando?1:0.4 }}>
                {guardando ? 'Creando grupo…' : 'ABRIR GRUPO'}`, 
`            : <button onClick={confirmar} disabled={!form.confirmado || guardando || adminPreview}
                title={adminPreview ? 'Modo demostración: solo lectura' : ''}
                className="btn btn-primary"
                style={{ background:'var(--an-granate)', borderColor:'var(--an-granate)', minWidth:180, opacity: form.confirmado&&!guardando&&!adminPreview?1:0.4 }}>
                {guardando ? 'Creando grupo…' : 'ABRIR GRUPO'}`,
'create group button disabled');

fs.writeFileSync(path, src, 'utf8');
console.log('CS21A198C exact Admin preview read-only patch applied');
