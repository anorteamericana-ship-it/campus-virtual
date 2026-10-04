/* global React, window */
(function(){
  'use strict';

  const { useCallback, useEffect, useMemo, useRef, useState } = React;
  const BUILD = 'CONAPE_PROSPECTACION_V2_REFRESH_UI_20261004';
  const MAX_BYTES = 2 * 1024 * 1024;

  function injectStyles() {
    if (document.getElementById('cpv1-ventas-styles')) return;
    const style = document.createElement('style');
    style.id = 'cpv1-ventas-styles';
    style.textContent = `
      .cpv1-card{background:#fff;border:1px solid #e4e8ef;border-radius:18px;box-shadow:0 8px 28px rgba(17,38,67,.06);overflow:hidden}
      .cpv1-head{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;padding:20px 22px;border-bottom:1px solid #eef1f5}
      .cpv1-kicker{font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#426b9b}
      .cpv1-title{margin:3px 0 5px;font-size:20px;line-height:1.15;color:#14233b}
      .cpv1-sub{font-size:12px;color:#6d7788;line-height:1.45}
      .cpv1-refresh{border:1px solid #cad5e3;background:#fff;color:#183b63;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer}
      .cpv1-refresh:disabled{opacity:.55;cursor:not-allowed}
      .cpv1-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:16px 22px;background:#f8fafc}
      .cpv1-kpi{border:1px solid #e8edf3;background:#fff;border-radius:12px;padding:12px}
      .cpv1-kpi b{display:block;font-size:24px;line-height:1;color:#152b49}.cpv1-kpi span{display:block;margin-top:6px;font-size:10px;font-weight:800;color:#758094;text-transform:uppercase}
      .cpv1-kpi[data-tone="green"]{border-color:#bfe7ce;background:#f3fbf6}.cpv1-kpi[data-tone="yellow"]{border-color:#f1dc94;background:#fffaf0}.cpv1-kpi[data-tone="red"]{border-color:#efb8b8;background:#fff5f5}
      .cpv1-body{padding:18px 22px 22px}
      .cpv1-admin{margin-bottom:18px;border:1px dashed #b8c8dc;border-radius:14px;padding:14px;background:#f8fbff}
      .cpv1-admin-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.cpv1-file{max-width:100%;font-size:12px}
      .cpv1-btn{border:0;border-radius:10px;padding:9px 13px;font-weight:850;cursor:pointer}.cpv1-btn.primary{background:#123e70;color:#fff}.cpv1-btn.secondary{background:#e9f0f8;color:#173b63}.cpv1-btn:disabled{opacity:.5;cursor:not-allowed}
      .cpv1-preview{margin-top:12px;padding:12px;border-radius:10px;background:#fff;border:1px solid #dce5ef;font-size:12px;color:#42536a}.cpv1-preview strong{color:#172b47}
      .cpv1-msg{margin-top:10px;font-size:12px;font-weight:700}.cpv1-msg.ok{color:#17633a}.cpv1-msg.err{color:#a52d2d}
      .cpv1-events{display:grid;gap:8px}.cpv1-event{display:grid;grid-template-columns:10px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 12px;border:1px solid #e7ebf0;border-radius:12px;background:#fff}
      .cpv1-dot{width:10px;height:10px;border-radius:50%}.cpv1-event[data-sem="NUEVO"] .cpv1-dot{background:#2f9e61}.cpv1-event[data-sem="PENDIENTE"] .cpv1-dot{background:#d6a21f}.cpv1-event[data-sem="VENCIDO"] .cpv1-dot{background:#cb3a3a}
      .cpv1-event-title{font-size:12px;font-weight:900;color:#1a2d47}.cpv1-event-meta{margin-top:3px;font-size:10px;color:#758094}.cpv1-event-age{font-size:10px;font-weight:900;color:#536174;white-space:nowrap}
      .cpv1-open{border:0;background:transparent;padding:0;color:#194f86;font-weight:900;cursor:pointer;text-align:left}
      .cpv1-empty{padding:16px;border-radius:12px;background:#f7f9fb;color:#6e7989;font-size:12px}
      .cpv1-more{margin-top:10px;border:0;background:transparent;color:#194f86;font-size:11px;font-weight:900;cursor:pointer}
      .cpv1-current{margin-top:18px;border-top:1px solid #edf0f4;padding-top:14px}.cpv1-current summary{cursor:pointer;font-size:12px;font-weight:900;color:#243c5c}
      .cpv1-table-wrap{overflow:auto;margin-top:10px}.cpv1-table{width:100%;border-collapse:collapse;min-width:780px;font-size:10px}.cpv1-table th,.cpv1-table td{padding:8px;border-bottom:1px solid #edf0f4;text-align:left;vertical-align:top}.cpv1-table th{font-size:9px;text-transform:uppercase;color:#788497;background:#f8fafc}.cpv1-table td{color:#33455e}
      @media(max-width:760px){.cpv1-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.cpv1-head{flex-direction:column}.cpv1-event{grid-template-columns:10px minmax(0,1fr)}.cpv1-event-age{grid-column:2}}
    `;
    document.head.appendChild(style);
  }

  async function callApi(fn, payload = {}) {
    const base = window.SCRIPT_URL_V || window.APPS_SCRIPT_URL || '';
    if (!base) return { ok:false, error:'endpoint_no_disponible' };
    const token = window.getSessionToken ? window.getSessionToken() : '';
    const res = await fetch(`${base}?fn=${encodeURIComponent(fn)}`, {
      method:'POST',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body:JSON.stringify({ fn, token, ...payload }),
      cache:'no-store',
    });
    const raw = await res.text();
    try { return JSON.parse(raw); }
    catch (_) { return { ok:false, error:'respuesta_invalida' }; }
  }

  function safePanelMessage(raw, fallback, context = '') {
    const msg = String(raw == null ? '' : raw).trim();
    if (!msg) return fallback;
    const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);
    const technicalText = /apps?\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\bjson\b|\btoken\b|sesion_requerida|unauthorized|forbidden|internal server|status\s*\d{3}|base64|snapshot_hash|csv_base64/i.test(msg);
    if (technicalCode || technicalText) {
      console.warn('[CONAPE Prospectacion V1] Detalle tecnico oculto al usuario.', { context, error:msg });
      return fallback;
    }
    return msg;
  }

  function fileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ''));
      fr.onerror = () => reject(new Error('No se pudo leer el CSV.'));
      fr.readAsDataURL(file);
    });
  }

  function formatValue(v) {
    const s = String(v == null ? '' : v).trim();
    return s || '—';
  }

  function ConapeProspectacionPanelV1({ asesor, rol, onOpenProspecto, onConapeUpdated }) {
    injectStyles();
    const isAdmin = rol === 'admin' || rol === 'superadmin';
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAll, setShowAll] = useState(false);
    const [candidate, setCandidate] = useState(null);
    const [preview, setPreview] = useState(null);
    const [adminBusy, setAdminBusy] = useState(false);
    const [adminMsg, setAdminMsg] = useState('');
    const [adminOk, setAdminOk] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshMsg, setRefreshMsg] = useState('');
    const [refreshOk, setRefreshOk] = useState(true);
    const autoAttemptRef = useRef('');

    const load = useCallback(async () => {
      if (!asesor && rol === 'ventas') return null;
      setLoading(true);
      setError('');
      try {
        const r = await callApi('getConapeProspectacionVentas', { asesor: asesor || '' });
        if (!r || r.ok !== true) {
          setError(safePanelMessage(r?.mensaje || r?.error, 'No se pudo cargar Prospectación CONAPE.', 'cargar_panel'));
          return null;
        }
        setData(r);
        return r;
      } catch (e) {
        console.warn('[CONAPE Prospectacion V1] Fallo al cargar panel.', e);
        setError(safePanelMessage(e?.message, 'No se pudo cargar Prospectación CONAPE.', 'cargar_panel_exception'));
        return null;
      } finally {
        setLoading(false);
      }
    }, [asesor, rol]);

    const refreshLive = useCallback(async ({ automatic = false } = {}) => {
      if (!asesor && rol === 'ventas') return null;
      const bridge = window.CONAPE_PORTAL_BRIDGE_V3 || window.CONAPE_PORTAL_BRIDGE_C37 || window.CONAPE_PORTAL_BRIDGE_C36;
      if (!bridge || typeof bridge.refreshProspectacionVentas !== 'function') {
        setRefreshOk(false);
        setRefreshMsg('Actualización CONAPE no disponible · se conserva la última lectura.');
        return null;
      }

      setRefreshing(true);
      setRefreshOk(true);
      setRefreshMsg(automatic ? 'Actualizando CONAPE en segundo plano…' : 'Consultando CONAPE…');
      try {
        const r = await bridge.refreshProspectacionVentas();
        if (!r || r.ok !== true) {
          setRefreshOk(false);
          setRefreshMsg('No se pudo actualizar · se conserva la última lectura válida.');
          return null;
        }
        const fresh = await load();
        const changes = Number(r.movimientos_registrados || 0);
        setRefreshOk(true);
        setRefreshMsg(changes > 0 ? `Actualizado · ${changes} cambio${changes === 1 ? '' : 's'} detectado${changes === 1 ? '' : 's'}.` : 'Actualizado · sin cambios nuevos.');
        if (typeof onConapeUpdated === 'function') onConapeUpdated();
        return fresh;
      } catch (e) {
        console.warn('[CONAPE Prospectacion V2] Actualización viva no disponible.', { code:String(e?.code || e?.message || 'UNAVAILABLE') });
        setRefreshOk(false);
        setRefreshMsg('No se pudo actualizar · se conserva la última lectura válida.');
        return null;
      } finally {
        setRefreshing(false);
      }
    }, [asesor, rol, load, onConapeUpdated]);

    useEffect(() => {
      let alive = true;
      (async () => {
        const snapshot = await load();
        if (!alive || !snapshot || snapshot.requiere_actualizacion !== true) return;
        const key = `${asesor || 'ALL'}|${snapshot.actualizado_en || 'SIN_SNAPSHOT'}`;
        if (autoAttemptRef.current === key) return;
        autoAttemptRef.current = key;
        await refreshLive({ automatic:true });
      })();
      return () => { alive = false; };
    }, [asesor, load, refreshLive]);

    async function selectCsv(ev) {
      const file = ev.target.files && ev.target.files[0];
      setCandidate(null); setPreview(null); setAdminMsg(''); setAdminOk(false);
      if (!file) return;
      if (!/\.csv$/i.test(file.name)) { setAdminMsg('Seleccione un archivo .csv descargado de CONAPE.'); return; }
      if (file.size > MAX_BYTES) { setAdminMsg('El CSV supera el límite de 2 MB.'); return; }
      setAdminBusy(true);
      try {
        const csv_base64 = await fileAsDataUrl(file);
        const r = await callApi('previsualizarConapeProspectacionCsv', { csv_base64, file_name:file.name });
        setCandidate({ file, csv_base64 });
        setPreview(r);
        const ok = !!r?.ok;
        setAdminOk(ok);
        setAdminMsg(ok
          ? 'Previsualización lista. Revise los conteos antes de importar.'
          : safePanelMessage(r?.mensaje || r?.error, 'El archivo no es compatible con el reporte CONAPE esperado.', 'previsualizar_csv'));
      } catch (e) {
        console.warn('[CONAPE Prospectacion V1] Fallo al previsualizar CSV.', e);
        setAdminOk(false);
        setAdminMsg(safePanelMessage(e?.message, 'No se pudo leer o previsualizar el CSV.', 'previsualizar_csv_exception'));
      } finally {
        setAdminBusy(false);
      }
    }

    async function confirmImport() {
      if (!candidate || !preview?.ok || adminBusy) return;
      setAdminBusy(true); setAdminMsg(''); setAdminOk(false);
      try {
        const r = await callApi('importarConapeProspectacionCsv', { csv_base64:candidate.csv_base64, file_name:candidate.file.name });
        if (!r || r.ok !== true) {
          setAdminMsg(safePanelMessage(r?.mensaje || r?.error, 'No se pudo importar el CSV de CONAPE.', 'importar_csv'));
          return;
        }
        setAdminOk(true);
        setAdminMsg(safePanelMessage(r.mensaje, 'CONAPE actualizado.', 'importar_csv_ok'));
        setCandidate(null); setPreview(null);
        await load();
        if (typeof onConapeUpdated === 'function') onConapeUpdated();
      } catch (e) {
        console.warn('[CONAPE Prospectacion V1] Fallo al importar CSV.', e);
        setAdminOk(false);
        setAdminMsg(safePanelMessage(e?.message, 'No se pudo importar el CSV de CONAPE.', 'importar_csv_exception'));
      } finally {
        setAdminBusy(false);
      }
    }

    const summary = data?.summary || { nuevos:0, pendientes:0, vencidos:0, prospectos_con_estado:0 };
    const events = Array.isArray(data?.events) ? data.events : [];
    const visibleEvents = showAll ? events : events.slice(0, 12);
    const rows = Array.isArray(data?.rows) ? data.rows : [];

    return (
      <section className="cpv1-card" data-build={BUILD}>
        <div className="cpv1-head">
          <div>
            <div className="cpv1-kicker">CONAPE · Prospectación</div>
            <h3 className="cpv1-title">Movimientos que no desaparecen al actualizar</h3>
            <div className="cpv1-sub">
              Ventas usa el estado operativo derivado de Prospectación. Los valores 01/09/2026 son códigos: depósito 01 · período 09 · año 2026, no fechas.
              {data?.actualizado_en ? ` Última lectura: ${data.actualizado_en}${data?.edad_minutos != null ? ` · hace ${data.edad_minutos} min` : ''}.` : ''}
              {data?.ttl_minutos ? ` Se consulta CONAPE al abrir solo cuando han pasado ${data.ttl_minutos} min.` : ''}
            </div>
            {refreshMsg ? <div className={`cpv1-msg ${refreshOk ? 'ok' : 'err'}`}>{refreshMsg}</div> : null}
          </div>
          <button type="button" className="cpv1-refresh" onClick={() => refreshLive({ automatic:false })} disabled={refreshing}>{refreshing ? 'Actualizando…' : 'Actualizar CONAPE'}</button>
        </div>

        <div className="cpv1-kpis">
          <div className="cpv1-kpi" data-tone="green"><b>{summary.nuevos || 0}</b><span>Nuevos</span></div>
          <div className="cpv1-kpi" data-tone="yellow"><b>{summary.pendientes || 0}</b><span>Pendientes 7–13 d</span></div>
          <div className="cpv1-kpi" data-tone="red"><b>{summary.vencidos || 0}</b><span>Vencidos 14+ d</span></div>
          <div className="cpv1-kpi"><b>{summary.prospectos_con_estado || 0}</b><span>Estado actual</span></div>
        </div>

        <div className="cpv1-body">
          {isAdmin && (
            <div className="cpv1-admin">
              <div className="cpv1-sub" style={{ marginBottom:10 }}>Respaldo manual administrativo · úselo solo si la actualización automática de Prospectación no está disponible.</div>
              <div className="cpv1-admin-row">
                <input className="cpv1-file" type="file" accept=".csv,text/csv" onChange={selectCsv} disabled={adminBusy} aria-label="CSV de Prospectación CONAPE" />
                {preview?.ok && <button type="button" className="cpv1-btn primary" onClick={confirmImport} disabled={adminBusy}>{adminBusy ? 'Importando…' : 'Confirmar importación'}</button>}
                {candidate && <button type="button" className="cpv1-btn secondary" onClick={() => { setCandidate(null); setPreview(null); setAdminMsg(''); setAdminOk(false); }} disabled={adminBusy}>Cancelar</button>}
              </div>
              {preview && (
                <div className="cpv1-preview">
                  <strong>{preview.baseline ? 'Línea base' : 'Cambios detectados'}</strong> · {preview.total || 0} registros · {preview.nuevos || 0} nuevos · {preview.filas_actualizadas || 0} filas actualizadas · {preview.eventos_estimados || 0} movimientos persistentes.
                  {preview.bloqueado ? ' El archivo parece filtrado; no se puede aplicar.' : ''}
                </div>
              )}
              {adminMsg && <div className={`cpv1-msg ${adminOk ? 'ok' : 'err'}`}>{adminMsg}</div>}
            </div>
          )}

          {error ? <div className="cpv1-empty">No se pudo cargar Prospectación CONAPE: {error}</div> : null}
          {!error && !loading && events.length === 0 ? <div className="cpv1-empty">Todavía no hay movimientos de Prospectación registrados. La primera importación crea la línea base sin generar alertas históricas.</div> : null}

          <div className="cpv1-events">
            {visibleEvents.map(ev => (
              <div className="cpv1-event" data-sem={ev.semaforo} key={ev.movimiento_id}>
                <span className="cpv1-dot" />
                <div>
                  <button type="button" className="cpv1-open" onClick={() => onOpenProspecto && onOpenProspecto(ev.cedula)}>{ev.titulo || ev.tipo}</button>
                  <div className="cpv1-event-meta">{ev.nombre || ev.cedula} · {formatValue(ev.valor_antes)} → {formatValue(ev.valor_despues)}{ev.fecha_evento ? ` · fecha CONAPE ${ev.fecha_evento}` : ''}</div>
                </div>
                <div className="cpv1-event-age">{ev.semaforo} · {Number(ev.dias || 0)} d</div>
              </div>
            ))}
          </div>
          {events.length > 12 && <button type="button" className="cpv1-more" onClick={() => setShowAll(v => !v)}>{showAll ? 'Mostrar menos' : `Ver todos los movimientos (${events.length})`}</button>}

          <details className="cpv1-current">
            <summary>Estado actual CONAPE ({rows.length})</summary>
            <div className="cpv1-table-wrap">
              <table className="cpv1-table">
                <thead><tr><th>Prospecto</th><th>CONAPE operativo</th><th>Acción Ventas</th><th>Aprobación</th><th>Formalización</th><th>Código último depósito</th><th>Código próximo depósito</th></tr></thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.cedula}>
                      <td><button type="button" className="cpv1-open" onClick={() => onOpenProspecto && onOpenProspecto(row.cedula)}>{row.nombre || row.cedula}</button></td>
                      <td>{formatValue(row.conape_estado || row.estado)}</td><td>{formatValue(row.conape_accion)}</td><td>{formatValue(row.aprobacion)}</td><td>{formatValue(row.formalizacion)}</td><td>{formatValue(row.ultimo_desembolso)}</td><td>{formatValue(row.proximo_desembolso)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </section>
    );
  }

  window.ConapeProspectacionPanelV1 = ConapeProspectacionPanelV1;
  window.__CONAPE_PROSPECTACION_V1_UI__ = BUILD;
})();