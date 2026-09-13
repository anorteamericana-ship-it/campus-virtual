from pathlib import Path


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, text):
    Path(path).write_text(text, encoding='utf-8')


def one(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 occurrence, got {count}')
    return text.replace(old, new, 1)


# Bridge
path = 'services/conape-bridge/server_v2.mjs'
s = read(path)
s = one(
    s,
    "const SOURCE_TTL_MS = Math.max(60_000, Number(process.env.SOURCE_TTL_MS || 180_000));\nconst STARTED_AT = new Date().toISOString();",
    "const SOURCE_TTL_MS = Math.max(60_000, Number(process.env.SOURCE_TTL_MS || 180_000));\nconst MIRROR_SERVICE_URL = String(process.env.CONAPE_MIRROR_SERVICE_URL || '').trim();\nconst MIRROR_HMAC_SECRET = String(process.env.CONAPE_MIRROR_HMAC_SECRET || '');\nconst MIRROR_SYNC_INTERVAL_MS = Math.max(60_000, Number(process.env.CONAPE_MIRROR_SYNC_INTERVAL_MS || 1_800_000));\nconst MIRROR_REQUEST_TIMEOUT_MS = Math.max(5_000, Number(process.env.CONAPE_MIRROR_REQUEST_TIMEOUT_MS || 20_000));\nconst STARTED_AT = new Date().toISOString();",
    'bridge constants',
)

start = s.index('async function listProspectStatusesForSales(body) {')
end = s.index('\nfunction categoryStatus(code) {', start)
new_block = r'''function mirrorEnvelope(payload) {
  if (!MIRROR_HMAC_SECRET) throw new AppError('CONAPE_MIRROR_NOT_CONFIGURED', 'El servicio de espejo CONAPE no está configurado.', 503, 'MIRROR');
  const ts = String(Date.now());
  const nonce = crypto.randomBytes(18).toString('base64url');
  const payload_json = JSON.stringify(payload || {});
  const sig = crypto.createHmac('sha256', MIRROR_HMAC_SECRET).update(`${ts}\n${nonce}\n${payload_json}`, 'utf8').digest('hex');
  return { ts, nonce, payload_json, sig };
}

async function mirrorServiceCall(payload, timeoutMs = MIRROR_REQUEST_TIMEOUT_MS) {
  if (!MIRROR_SERVICE_URL || !MIRROR_HMAC_SECRET) throw new AppError('CONAPE_MIRROR_NOT_CONFIGURED', 'El servicio de espejo CONAPE no está configurado.', 503, 'MIRROR');
  let response;
  try {
    response = await fetch(MIRROR_SERVICE_URL, {
      method:'POST',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body:JSON.stringify(mirrorEnvelope(payload)),
      redirect:'follow',
      signal:AbortSignal.timeout(Math.max(5_000, Number(timeoutMs || MIRROR_REQUEST_TIMEOUT_MS))),
    });
  } catch (cause) {
    const error = new AppError('CONAPE_MIRROR_UNAVAILABLE', 'El espejo CONAPE no está disponible.', 503, 'MIRROR');
    error.cause = cause;
    throw error;
  }
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw || '{}'); }
  catch { throw new AppError('CONAPE_MIRROR_INVALID_RESPONSE', 'El espejo CONAPE devolvió una respuesta inválida.', 503, 'MIRROR'); }
  if (!response.ok || !data || data.ok !== true) {
    const error = new AppError(txt(data?.code || 'CONAPE_MIRROR_REJECTED'), 'El espejo CONAPE rechazó la operación.', 503, 'MIRROR');
    throw error;
  }
  return data;
}

function validateMirrorSnapshot(list) {
  const rowsCsv = Number(list?.rows_csv);
  const rowsHtmlAll = Number(list?.rows_html_all);
  const valid = list?.method === 'CSV_DOWNLOAD'
    && list?.columns_ok === true
    && list?.counts_match === true
    && Number.isInteger(rowsCsv) && rowsCsv > 0
    && Number.isInteger(rowsHtmlAll) && rowsHtmlAll > 0
    && rowsCsv === rowsHtmlAll
    && Array.isArray(list?.rows) && list.rows.length > 0;
  if (!valid) {
    console.log(JSON.stringify({
      event:'conape_mirror_sync_abort', version:VERSION,
      rows_csv:Number.isInteger(rowsCsv) ? rowsCsv : null,
      rows_html_all:Number.isInteger(rowsHtmlAll) ? rowsHtmlAll : null,
      counts_match:false, pii:false,
    }));
    const error = new AppError('CONAPE_SNAPSHOT_ABORTED', 'La lectura completa de CONAPE no pasó el control de integridad.', 503, 'LIST');
    Object.assign(error, {
      rows_csv:Number.isInteger(rowsCsv) ? rowsCsv : null,
      rows_html_all:Number.isInteger(rowsHtmlAll) ? rowsHtmlAll : null,
      counts_match:false,
      columns_ok:list?.columns_ok === true,
      method:txt(list?.method || ''),
    });
    throw error;
  }
  return { rowsCsv, rowsHtmlAll };
}

async function syncMirrorFromConape(reason = 'manual') {
  const isolated = createIsolatedConapeSession();
  let list;
  try {
    list = await listProspectsFromHome(isolated);
  } catch (error) {
    console.log(JSON.stringify({
      event:'conape_mirror_sync_abort', version:VERSION, reason,
      rows_csv:Number.isInteger(error?.rows_csv) ? error.rows_csv : null,
      rows_html_all:Number.isInteger(error?.rows_html_all) ? error.rows_html_all : null,
      counts_match:false, pii:false,
    }));
    throw error;
  } finally {
    await isolated.close().catch(() => {});
  }
  const { rowsCsv, rowsHtmlAll } = validateMirrorSnapshot(list);
  const applied = await mirrorServiceCall({
    action:'apply_snapshot',
    method:list.method,
    columns_ok:true,
    counts_match:true,
    rows_csv:rowsCsv,
    rows_html_all:rowsHtmlAll,
    captured_at:list.captured_at || nowIso(),
    rows:list.rows,
  }, Math.max(MIRROR_REQUEST_TIMEOUT_MS, 60_000));
  if (applied?.written !== true) throw new AppError('CONAPE_MIRROR_WRITE_FAILED', 'El servicio no confirmó la actualización del espejo.', 503, 'MIRROR');
  console.log(JSON.stringify({ event:'conape_mirror_sync_ok', version:VERSION, reason, rows:rowsCsv, movements:Number(applied.movements || 0), pii:false }));
  return { list, applied, rowsCsv, rowsHtmlAll };
}

async function salesScope(body) {
  const auth = await authorizeCampusSession(body?.token);
  const asesor = txt(body?.asesor || '');
  const dashboard = await campusCall({ fn:'getDashboardVentas', token:auth.token, asesor });
  if (!dashboard?.ok || !Array.isArray(dashboard?.prospectos)) {
    throw new AppError('CAMPUS_SALES_SCOPE_UNAVAILABLE', 'No se pudo resolver el alcance de Ventas.', 503, 'CAMPUS');
  }
  const allowedCedulas = new Set(dashboard.prospectos.map(campusCedula).filter(Boolean));
  return { auth, asesor, allowedCedulas };
}

async function listProspectStatusesForSales(body) {
  const { allowedCedulas } = await salesScope(body);
  try {
    const mirror = await mirrorServiceCall({ action:'read_mirror' });
    const rows = (Array.isArray(mirror?.rows) ? mirror.rows : [])
      .filter(row => allowedCedulas.has(digits(row?.cedula)))
      .map(salesStatusRow);
    return {
      ok:true,
      code:'PROSPECT_SALES_STATUS_READY',
      source:'MIRROR',
      row_count:rows.length,
      ultimo_sync:txt(mirror?.ultimo_sync || ''),
      rows,
    };
  } catch (error) {
    console.log(JSON.stringify({ event:'conape_mirror_read_failed', version:VERSION, code:txt(error?.code || 'UNAVAILABLE'), pii:false }));
    return { ok:false, code:'CONAPE_MIRROR_UNAVAILABLE', source:'MIRROR', rows:[], stale:true };
  }
}

async function refreshMirrorForSales(body) {
  const { allowedCedulas } = await salesScope(body);
  const { list, applied, rowsCsv, rowsHtmlAll } = await syncMirrorFromConape('manual');
  const rows = list.rows.filter(row => allowedCedulas.has(digits(row?.cedula))).map(salesStatusRow);
  return {
    ok:true,
    code:'PROSPECT_SALES_STATUS_REFRESHED',
    source:'LIVE',
    row_count:rows.length,
    columns_ok:true,
    counts_match:true,
    rows_csv:rowsCsv,
    rows_html_all:rowsHtmlAll,
    mirror_applied:true,
    movements:Number(applied.movements || 0),
    captured_at:list.captured_at || nowIso(),
    ultimo_sync:txt(applied.ultimo_sync || ''),
    rows,
  };
}

let mirrorSyncTimer = null;
async function scheduledMirrorSync() {
  try { await syncMirrorFromConape('scheduled_30m'); }
  catch (error) {
    console.log(JSON.stringify({ event:'conape_mirror_scheduled_failed', version:VERSION, code:txt(error?.code || 'UNAVAILABLE'), pii:false }));
  }
}
function startMirrorScheduler() {
  if (!MIRROR_SERVICE_URL || !MIRROR_HMAC_SECRET) {
    console.log(JSON.stringify({ event:'conape_mirror_scheduler_disabled', version:VERSION, configured:false, pii:false }));
    return;
  }
  mirrorSyncTimer = setInterval(() => { void scheduledMirrorSync(); }, MIRROR_SYNC_INTERVAL_MS);
  if (typeof mirrorSyncTimer?.unref === 'function') mirrorSyncTimer.unref();
  console.log(JSON.stringify({ event:'conape_mirror_scheduler_ready', version:VERSION, interval_ms:MIRROR_SYNC_INTERVAL_MS, pii:false }));
}
'''
s = s[:start] + new_block + s[end:]
s = one(
    s,
    "    else if (url.pathname === '/v1/prospects/sales-status') action = 'prospects_sales_status';\n    else if (url.pathname === '/v1/recruit/preview') action = 'preview';",
    "    else if (url.pathname === '/v1/prospects/sales-status') action = 'prospects_sales_status';\n    else if (url.pathname === '/v1/prospects/refresh') action = 'prospects_refresh';\n    else if (url.pathname === '/v1/recruit/preview') action = 'preview';",
    'bridge refresh route',
)
s = one(
    s,
    "    else if (action === 'prospects_sales_status') result = await listProspectStatusesForSales(body);\n    else if (action === 'preview') result = await serial(() => preview(body));",
    "    else if (action === 'prospects_sales_status') result = await listProspectStatusesForSales(body);\n    else if (action === 'prospects_refresh') result = await refreshMirrorForSales(body);\n    else if (action === 'preview') result = await serial(() => preview(body));",
    'bridge refresh dispatch',
)
s = one(
    s,
    "server.listen(PORT, '0.0.0.0', () => console.log(JSON.stringify({ event:'bridge_ready', version:VERSION, port:PORT, clean_runtime:true, pii:false })));",
    "server.listen(PORT, '0.0.0.0', () => {\n  console.log(JSON.stringify({ event:'bridge_ready', version:VERSION, port:PORT, clean_runtime:true, pii:false }));\n  startMirrorScheduler();\n});",
    'bridge scheduler startup',
)
s = one(
    s,
    "async function shutdown() {\n  try { await ConapeSession.close(); } catch {}",
    "async function shutdown() {\n  if (mirrorSyncTimer) clearInterval(mirrorSyncTimer);\n  try { await ConapeSession.close(); } catch {}",
    'bridge scheduler shutdown',
)
if 'conapeMirrorApplySnapshotV44' in s:
    raise SystemExit('bridge still references monolith mirror function')
write(path, s)

# Client
path = 'src/conape_bridge_client_c3_6.js'
c = read(path)
c = one(c, "  function bridgeBase(){ return cleanBase(window.CONAPE_PORTAL_BRIDGE_URL || ''); }\n", "  function bridgeBase(){ return cleanBase(window.CONAPE_PORTAL_BRIDGE_URL || ''); }\n  let lastSalesAsesor = '';\n", 'client advisor memory')
old = """  // V4.4: esta llamada mantiene el contrato de lectura de estados para Ventas,\n  // pero el bridge primero ejecuta la lectura completa CONAPE y persiste el espejo\n  // únicamente cuando CSV y Rows=All coinciden.\n  async function salesStatuses(asesor){\n    return postBridge('/v1/prospects/sales-status', { asesor:String(asesor || '').trim() });\n  }\n"""
new = """  // Entrada a Ventas: solo lee el espejo existente. No dispara lectura viva de CONAPE.\n  async function salesStatuses(asesor){\n    lastSalesAsesor = String(asesor || lastSalesAsesor || '').trim();\n    return postBridge('/v1/prospects/sales-status', { asesor:lastSalesAsesor });\n  }\n\n  // Botón manual y post CREATE/UPDATE: sí fuerzan lectura viva + validación + persistencia.\n  async function refreshMirror(asesor){\n    lastSalesAsesor = String(asesor || lastSalesAsesor || '').trim();\n    return postBridge('/v1/prospects/refresh', { asesor:lastSalesAsesor });\n  }\n"""
c = one(c, old, new, 'client mirror calls')
c = one(c, "    salesStatuses,\n    active:!!bridgeBase(),\n    version:'V4.4',", "    salesStatuses,\n    refreshMirror,\n    active:!!bridgeBase(),\n    version:'V4.4.1',", 'client api')
c = one(c, "          const fresh = await salesStatuses('');", "          const fresh = await refreshMirror(lastSalesAsesor);", 'post recruit refresh')
write(path, c)

# Dashboard
path = 'src/ventas_dashboard.jsx'
d = read(path)
d = one(d, "  const [reloadTick, setReloadTick] = useState(0);\n", "  const [reloadTick, setReloadTick] = useState(0);\n  const [conapeSync, setConapeSync] = useState({ state: 'idle', ultimo_sync: '', message: '' });\n", 'dashboard sync state')
marker = """  useEffect(() => {\n    if (!toast) return;\n    const t = setTimeout(() => setToast(null), 3200);\n    return () => clearTimeout(t);\n  }, [toast]);\n"""
insert = marker + """\n  const applyConapeRows = useCallback((rows) => {\n    if (!Array.isArray(rows)) return;\n    const byCedula = new Map(rows.map(row => [String(row?.cedula || '').replace(/\\D/g, ''), row]).filter(([ced]) => !!ced));\n    setDash(prev => prev ? {\n      ...prev,\n      prospectos: prev.prospectos.map(p => window.mergeConapeStatusVentas(p, byCedula.get(String(p?.cedula || '').replace(/\\D/g, '')))),\n    } : prev);\n  }, []);\n"""
d = one(d, marker, insert, 'dashboard apply helper')
start = d.index("        const bridge = window.CONAPE_PORTAL_BRIDGE_V3")
end = d.index("      } catch (e) {", start)
overlay = """        const bridge = window.CONAPE_PORTAL_BRIDGE_V3 || window.CONAPE_PORTAL_BRIDGE_C37 || window.CONAPE_PORTAL_BRIDGE_C36;\n        if (bridge && typeof bridge.salesStatuses === 'function') {\n          try {\n            const conape = await bridge.salesStatuses(scopeAsesor);\n            if (!cancel && conape?.ok && Array.isArray(conape.rows)) {\n              applyConapeRows(conape.rows);\n              setConapeSync({ state:'ok', ultimo_sync:String(conape.ultimo_sync || ''), message:'' });\n            } else if (!cancel && conape && conape.ok === false) {\n              setConapeSync(prev => ({ ...prev, state:'error', message:'Mostrando la última información disponible' }));\n              console.warn('[Ventas CONAPE] Espejo temporalmente no disponible.', { code:String(conape.code || conape.error || 'UNKNOWN') });\n            }\n          } catch (conapeError) {\n            if (!cancel) {\n              setConapeSync(prev => ({ ...prev, state:'error', message:'Mostrando la última información disponible' }));\n              console.warn('[Ventas CONAPE] Espejo temporalmente no disponible.', { code:String(conapeError?.code || 'UNAVAILABLE') });\n            }\n          }\n        }\n"""
d = d[:start] + overlay + d[end:]
d = one(
    d,
    "  }, [scopeAsesor, reloadTick, previewKey, esSupervisor]);\n\n  // Update optimista cuando el drawer cambia algo del prospecto.",
    "  }, [scopeAsesor, reloadTick, previewKey, esSupervisor, applyConapeRows]);\n\n  const refreshConape = useCallback(async () => {\n    if (previewKey || !scopeAsesor) return;\n    const bridge = window.CONAPE_PORTAL_BRIDGE_V3 || window.CONAPE_PORTAL_BRIDGE_C37 || window.CONAPE_PORTAL_BRIDGE_C36;\n    if (!bridge || typeof bridge.refreshMirror !== 'function') {\n      setConapeSync(prev => ({ ...prev, state:'error', message:'Actualización no disponible' }));\n      return;\n    }\n    setConapeSync(prev => ({ ...prev, state:'loading', message:'' }));\n    try {\n      const fresh = await bridge.refreshMirror(scopeAsesor);\n      if (!fresh?.ok || !Array.isArray(fresh.rows)) {\n        setConapeSync(prev => ({ ...prev, state:'error', message:'No se pudo actualizar · mostrando última sincronización' }));\n        return;\n      }\n      applyConapeRows(fresh.rows);\n      setConapeSync({ state:'ok', ultimo_sync:String(fresh.ultimo_sync || fresh.captured_at || ''), message:'Actualizado' });\n    } catch (error) {\n      setConapeSync(prev => ({ ...prev, state:'error', message:'No se pudo actualizar · mostrando última sincronización' }));\n      console.warn('[Ventas CONAPE] Actualización manual no disponible.', { code:String(error?.code || 'UNAVAILABLE') });\n    }\n  }, [previewKey, scopeAsesor, applyConapeRows]);\n\n  useEffect(() => {\n    if (previewKey || !scopeAsesor) return undefined;\n    const timer = setInterval(async () => {\n      const bridge = window.CONAPE_PORTAL_BRIDGE_V3 || window.CONAPE_PORTAL_BRIDGE_C37 || window.CONAPE_PORTAL_BRIDGE_C36;\n      if (!bridge || typeof bridge.salesStatuses !== 'function') return;\n      try {\n        const mirror = await bridge.salesStatuses(scopeAsesor);\n        if (mirror?.ok && Array.isArray(mirror.rows)) {\n          applyConapeRows(mirror.rows);\n          setConapeSync({ state:'ok', ultimo_sync:String(mirror.ultimo_sync || ''), message:'' });\n        }\n      } catch (_) {}\n    }, 30 * 60 * 1000);\n    return () => clearInterval(timer);\n  }, [previewKey, scopeAsesor, applyConapeRows]);\n\n  // Update optimista cuando el drawer cambia algo del prospecto.",
    'dashboard refresh and poll',
)
header_marker = '          <div className="vx-user">\n'
button = """          {!previewKey && (\n            <div style={{ display:'flex', alignItems:'center', gap:8, marginRight:12 }}>\n              <button\n                className=\"vx-btn vx-btn-ghost\"\n                type=\"button\"\n                disabled={conapeSync.state === 'loading' || !scopeAsesor}\n                onClick={refreshConape}\n                title={conapeSync.state === 'error' ? 'No se pudo actualizar; se mantiene la última información visible.' : 'Leer CONAPE ahora y actualizar el espejo'}>\n                {conapeSync.state === 'loading' ? 'Actualizando…' : 'Actualizar CONAPE'}\n              </button>\n              <span style={{ fontSize:11, maxWidth:190, color:conapeSync.state === 'error' ? '#B42318' : 'var(--v-muted, #64748B)' }}>\n                {conapeSync.message || (conapeSync.ultimo_sync ? `Última: ${conapeSync.ultimo_sync}` : '')}\n              </span>\n            </div>\n          )}\n""" + header_marker
d = one(d, header_marker, button, 'dashboard button')
write(path, d)

# ventas.html cache bust
path = 'ventas.html'
v = read(path)
v = one(v, 'src/conape_bridge_client_c3_6.js?v=V4.4.0', 'src/conape_bridge_client_c3_6.js?v=V4.4.1', 'client cache')
v = one(v, 'src/ventas_dashboard.jsx?v=V4.3.1', 'src/ventas_dashboard.jsx?v=V4.4.1', 'dashboard cache')
write(path, v)

# CI contract
path = '.github/workflows/qa-conape-live-c3-6.yml'
w = read(path)
w = one(w, "      - 'src/conape_bridge_client_c3_6.js'\n", "      - 'src/conape_bridge_client_c3_6.js'\n      - 'src/ventas_dashboard.jsx'\n", 'workflow path dashboard')
gate = """      - name: Scheduled mirror + manual refresh contract\n        run: |\n          grep -F \"CONAPE_MIRROR_SERVICE_URL\" services/conape-bridge/server_v2.mjs\n          grep -F \"CONAPE_MIRROR_HMAC_SECRET\" services/conape-bridge/server_v2.mjs\n          grep -F \"1_800_000\" services/conape-bridge/server_v2.mjs\n          grep -F \"url.pathname === '/v1/prospects/refresh'\" services/conape-bridge/server_v2.mjs\n          grep -F \"action:'read_mirror'\" services/conape-bridge/server_v2.mjs\n          grep -F \"action:'apply_snapshot'\" services/conape-bridge/server_v2.mjs\n          ! grep -F \"conapeMirrorApplySnapshotV44\" services/conape-bridge/server_v2.mjs\n          grep -F \"async function refreshMirror\" src/conape_bridge_client_c3_6.js\n          grep -F \"Actualizar CONAPE\" src/ventas_dashboard.jsx\n          grep -F \"30 * 60 * 1000\" src/ventas_dashboard.jsx\n"""
anchor = """      - name: Node syntax · bridge legacy\n        run: node --check services/conape-bridge/server.mjs\n"""
w = one(w, anchor, gate + anchor, 'workflow scheduled gate')
write(path, w)

# Remove one-shot machinery from resulting branch tree.
Path('.github/workflows/tmp-conape-v4-4-refactor.yml').unlink()
Path('scripts/tmp_conape_v4_4_refactor.py').unlink()
