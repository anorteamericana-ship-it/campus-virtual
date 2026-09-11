/* global React, window */
(function ventasConapeRecruitRowC35(){
  'use strict';
  if (!window.React) return;

  const { useEffect, useState } = React;

  function text(v){ return String(v == null ? '' : v).trim(); }
  function upper(v){ return text(v).toUpperCase(); }
  function digits(v){ return text(v).replace(/\D/g, ''); }
  function technical(v, fallback){
    const safe = upper(v).replace(/[^A-Z0-9_]/g, '').slice(0, 64);
    return safe || fallback;
  }
  function submitFailure(r){
    const code = technical(r?.code || r?.error, 'UNKNOWN');
    const stage = technical(r?.stage || r?.error_stage, 'NO_DISPONIBLE');
    return `No se pudo crear el prospecto.\nCódigo: ${code}\nEtapa: ${stage}`;
  }

  function visibleFor(p){
    const financing = upper(p?.financiamiento || p?.FINANCIAMIENTO);
    const etapa = upper(p?.etapa || p?.ETAPA);
    const estadoConape = text(p?.estado_conape_raw || p?.estado_conape);
    const codigo = text(p?.codigo || p?.codigo_estudiante || p?.CODIGO_ESTUDIANTE || p?.rec_m || p?.REC_M);
    const estadoVentas = typeof window.calcularEstadoEstudianteVentas === 'function'
      ? upper(window.calcularEstadoEstudianteVentas(p)?.estado)
      : '';
    if (financing !== 'CONAPE') return false;
    if (estadoConape || codigo || estadoVentas === 'MATRICULADO') return false;
    return !['CANCELADO','ACTIVO','MATRICULADO'].includes(etapa);
  }

  function liveBridge(){
    const bridge = window.CONAPE_PORTAL_BRIDGE_C36;
    return bridge && typeof bridge.preview === 'function' && typeof bridge.submit === 'function' ? bridge : null;
  }

  function comparisonBuilder(){
    return window.conapeRecruitBuildComparisonC371 || window.conapeRecruitBuildComparisonC33 || null;
  }

  function injectStyles(){
    if (document.getElementById('vx-conape-row-c35-style')) return;
    const style = document.createElement('style');
    style.id = 'vx-conape-row-c35-style';
    style.textContent = `
      .vx-c33-launch{display:none!important}
      .vx-c35-rowbtn{border:1px solid #b7d5f5;background:#eef6ff;color:#0d5ea8;border-radius:8px;padding:6px 8px;font:700 10px Poppins,system-ui;line-height:1.05;white-space:nowrap;cursor:pointer}
      .vx-c35-rowbtn:hover{background:#dfeeff}.vx-c35-rowbtn:disabled{opacity:.45;cursor:not-allowed}
      .vx-c35-status{font-size:10px;color:#66758b;margin-top:6px}
      .vx-c33-banner.err{white-space:pre-line}
    `;
    document.head.appendChild(style);
  }

  function RecruitRowModal({ prospecto, onClose, onChanged, onToast }){
    const [state, setState] = useState('loading');
    const [comparison, setComparison] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
      let cancel = false;
      (async () => {
        try {
          let detail = prospecto || {};
          const cedula = digits(detail.cedula || detail.CEDULA);
          if (!cedula) throw new Error('El prospecto no tiene cédula válida.');
          if (typeof window.getProspectoDetalle === 'function') {
            const d = await window.getProspectoDetalle(cedula);
            if (d && d.ok !== false && d.prospecto) detail = { ...detail, ...d.prospecto };
          }
          const bridge = liveBridge();
          const buildComparison = comparisonBuilder();
          if (!bridge || typeof buildComparison !== 'function') {
            throw new Error('El puente CONAPE live no está disponible.');
          }
          const r = await bridge.preview(cedula);
          if (!r || !r.ok) {
            const code = text(r?.error || r?.code);
            throw new Error(code === 'DUPLICATE'
              ? 'CONAPE indica que esta cédula ya está registrada.'
              : code === 'CONAPE_SESSION_NOT_READY'
                ? 'No se pudo abrir automáticamente Reclutar Prospectos en CONAPE.'
                : code === 'CONAPE_LOGIN_FAILED'
                  ? 'CONAPE no confirmó la sesión del bridge.'
                  : code === 'CAMPUS_BACKEND_UNAVAILABLE' || code === 'CAMPUS_BACKEND_INVALID'
                    ? 'El Campus tardó demasiado o devolvió una respuesta inválida al bridge.'
                    : code === 'conape_bridge_unavailable'
                      ? 'No se pudo conectar con el bridge CONAPE.'
                      : 'No se pudo consultar la cédula en CONAPE.');
          }
          const cmp = buildComparison(detail, r.prospecto || r.conape || null);
          if (cancel) return;
          setPreview(r);
          setComparison(cmp);
          setState('ready');
        } catch (e) {
          if (cancel) return;
          setError(e?.message || 'No se pudo preparar el reclutamiento.');
          setState('error');
        }
      })();
      return () => { cancel = true; };
    }, []);

    const submit = async () => {
      if (state !== 'ready' || !preview || preview.can_submit !== true || !comparison) return;
      setState('sending'); setError('');
      try {
        const bridge = liveBridge();
        if (!bridge) throw new Error('El puente CONAPE live no está disponible.');
        const r = await bridge.submit({
          cedula:comparison.payload.cedula,
          payload:comparison.payload,
          sourceVersion:preview.source_version || preview.version || '',
        });
        if (!r || !r.ok) throw new Error(submitFailure(r));
        const estadoConape = text(r.estado_conape_raw || r.estado_conape || '');
        if (typeof onChanged === 'function') {
          onChanged({
            cedula:comparison.payload.cedula,
            ...(estadoConape ? { estado_conape_raw:estadoConape } : {}),
            conape_reclutado:true,
          });
        }
        if (typeof window.ventasDashCacheClear === 'function') window.ventasDashCacheClear();
        setState('done');
        onToast && onToast({ tipo:'ok', msg:estadoConape ? `Prospecto reclutado · CONAPE: ${estadoConape}` : 'Prospecto reclutado en CONAPE.' });
      } catch (e) {
        setError(e?.message || 'No se pudo completar el reclutamiento.');
        setState('ready');
      }
    };

    const rows = comparison?.rows || [];
    return (
      <div className="vx-c33-back" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="vx-c33-modal">
          <div className="vx-c33-head">
            <div>
              <div className="vx-c33-title">Reclutar en CONAPE</div>
              <div className="vx-c33-sub">Campus compara sus datos con la identidad y contactos devueltos por CONAPE.</div>
            </div>
            <button className="vx-c33-x" onClick={onClose}>×</button>
          </div>
          <div className="vx-c33-body">
            {state === 'loading' ? <div className="vx-c33-banner">Consultando la cédula directamente en CONAPE…</div> : null}
            {state === 'done' ? <div className="vx-c33-banner">CONAPE confirmó el reclutamiento.</div> : null}
            {error ? <div className="vx-c33-banner err">{error}</div> : null}
            {comparison ? <React.Fragment>
              <div className="vx-c33-banner">Nombre y apellidos se comparan Campus ↔ CONAPE; <b>nunca se modifican desde Campus</b>.</div>
              <div className="vx-c33-grid">
                <div className="vx-c33-cell h">Dato</div><div className="vx-c33-cell h">Campus</div><div className="vx-c33-cell h">CONAPE</div><div className="vx-c33-cell h">Acción final</div>
                {rows.map(row => <React.Fragment key={row.key}>
                  <div className="vx-c33-cell h">{row.label}</div>
                  <div className="vx-c33-cell">{row.campus || '—'}</div>
                  <div className="vx-c33-cell">{row.conape || '—'}<br/><span className={`vx-c33-tag ${row.state}`}>{row.state === 'conape' ? 'CONAPE' : row.state}</span></div>
                  <div className="vx-c33-cell">{row.final || '—'}<div className="vx-c33-rule">{row.rule}</div></div>
                </React.Fragment>)}
              </div>
              <div className="vx-c33-banner" style={{marginTop:14}}>Teléfono final: <b>{comparison.payload.telefono || 'pendiente'}</b> · Correo final: <b>{comparison.payload.correo || 'sin correo'}</b>.</div>
            </React.Fragment> : null}
          </div>
          <div className="vx-c33-foot">
            <button className="vx-c33-btn alt" onClick={onClose}>Cerrar</button>
            <button className="vx-c33-btn go" onClick={submit} disabled={state !== 'ready' || !preview || preview.can_submit !== true}>{state === 'sending' ? 'Enviando…' : state === 'done' ? 'Enviado' : 'Enviar solicitud'}</button>
          </div>
        </div>
      </div>
    );
  }

  function ConapeRecruitRowButtonC35({ prospecto, onChanged, onToast }){
    const [open, setOpen] = useState(false);
    if (!visibleFor(prospecto)) return null;
    return <React.Fragment>
      <button type="button" className="vx-c35-rowbtn" onClick={e => { e.stopPropagation(); setOpen(true); }}>Reclutar</button>
      {open ? <RecruitRowModal prospecto={prospecto} onClose={() => setOpen(false)} onChanged={onChanged} onToast={onToast} /> : null}
    </React.Fragment>;
  }

  injectStyles();
  window.ConapeRecruitRowButtonC35 = ConapeRecruitRowButtonC35;
})();
