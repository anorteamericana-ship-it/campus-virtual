import fs from 'node:fs';

const panel = fs.readFileSync('src/ventas_conape_prospectacion_v1.jsx', 'utf8');
const dashboard = fs.readFileSync('src/ventas_dashboard.jsx', 'utf8');
const html = fs.readFileSync('ventas.html', 'utf8');

let fail = 0;
function check(ok, label) {
  if (ok) console.log('PASS ' + label);
  else { fail++; console.error('FAIL ' + label); }
}

check(panel.includes("callApi('getConapeProspectacionVentas'"), 'Panel reads CONAPE Prospectacion through authenticated endpoint');
check(panel.includes("callApi('previsualizarConapeProspectacionCsv'"), 'Admin previews CSV before importing');
check(panel.includes("callApi('importarConapeProspectacionCsv'"), 'Admin imports only after explicit confirmation');
check(panel.includes("const isAdmin = rol === 'admin' || rol === 'superadmin'"), 'CSV controls are gated to admin/superadmin');
check(panel.includes('const MAX_BYTES = 2 * 1024 * 1024'), 'Frontend enforces 2 MB CSV limit');
check(panel.includes('accept=".csv,text/csv"'), 'File picker accepts CSV only');
check(panel.includes('Movimientos que no desaparecen al actualizar'), 'Persistent-event purpose is explicit in UI');
check(panel.includes('depósito 01 · período 09 · año 2026, no fechas'), 'UI explains disbursement codes are not dates');
check(panel.includes('CONAPE operativo'), 'Current-state table exposes derived operational CONAPE state');
check(panel.includes('Acción Ventas'), 'Current-state table exposes seller action');
check(panel.includes('Código último depósito'), 'UI labels the last disbursement as a code');
check(panel.includes('onOpenProspecto && onOpenProspecto(ev.cedula)'), 'Event opens linked Campus prospect');
check(panel.includes('onOpenProspecto && onOpenProspecto(row.cedula)'), 'Current-state row opens linked Campus prospect');
check(!panel.includes('\uFFFD'), 'Panel contains no Unicode replacement characters');
check(!/[ÃÂ]|â€|ï¿½/.test(panel), 'Panel contains no common UTF-8 mojibake sequences');
check(!/Reclutar|reclutarProspecto|Crear nuevo Prospecto/.test(panel), 'V1 panel does not automate CONAPE recruitment');

check(dashboard.includes('window.ConapeProspectacionPanelV1'), 'Ventas dashboard mounts CONAPE Prospectacion V1 panel');
check(dashboard.includes('asesor={scopeAsesor}'), 'Panel follows active advisor scope');
check(dashboard.includes('rol={rolReal}'), 'Panel receives real role, not simulated advisor role');

const panelScript = 'src/ventas_conape_prospectacion_v1.jsx?v=CONAPE-V2-SALES-20261004';
const dashScript = 'src/ventas_dashboard.jsx?v=CONAPE-V2-SALES-20261004';
check(html.includes(panelScript), 'ventas.html loads V1 panel with cache bust');
check(html.includes(dashScript), 'ventas.html cache-busts dashboard integration');
check(html.indexOf(panelScript) < html.indexOf(dashScript), 'Panel script loads before dashboard consumer');

if (fail) process.exit(1);
console.log('QA_CONAPE_PROSPECTACION_V1_UI=PASS');
