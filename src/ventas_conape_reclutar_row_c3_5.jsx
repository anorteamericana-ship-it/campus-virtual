/* global React, window */
(function ventasConapeRecruitRowC35(){
  'use strict';
  if (!window.React) return;

  const { useEffect, useState } = React;

  function text(v){ return String(v == null ? '' : v).trim(); }
  function upper(v){ return text(v).toUpperCase(); }
  function digits(v){ return text(v).replace(/\D/g, ''); }

  function visibleFor(p){
    const financing = upper(p?.financiamiento || p?.FINANCIAMIENTO);
    const etapa = upper(p?.etapa || p?.ETAPA);
    return financing === 'CONAPE' && !['CANCELADO','ACTIVO','MATRICULADO'].includes(etapa);
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
          if (typeof window.conapePortalRecruitPreviewVentasSeguro !== 'function' || typeof window.conapeRecruitBuildComparisonC33 !== 'function') {
            throw new Error('El módulo CONAPE no está disponible.');
          }
          const r = await window.conapePortalRecruitPreviewVentasSeguro(cedula);
          if (!r || !r.ok) {
            const code = text(r?.error || r?.code);
            throw new Error(code === 'DUPLICATE'
              ? 'CONAPE indica que esta cédula ya está registrada.'
              : 'No se pudo consultar la cédula en CONAPE.');
          }
          const cmp = window.conapeRecruitBuildComparisonC33(detail, r.prospecto || r.conape || null);
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
        const r = await window.conapePortalRecruitSubmitVentasSeguro({
          cedula:comparison.payload.cedula,
          payload:comparison.payload,
          sourceVersion:preview.source_version || preview.version || '',
        });
        if (!r || !r.ok) {
          const code = text(r?.code || r?.error);
          throw new Error(code === 'DUPLICATE'
            ? 'CONAPE reportó que el prospecto ya existe.'
            : code === 'WRITE_RESULT_UNCERTAIN'
              ? 'CONAPE recibió la operación, pero no confirmó el resultado. No la repita.'
              : 'CONAPE no confirmó el envío.');
        }
        const estadoConape = text(r.estado_conape_raw || r.estado_conape || '');
        if (estadoConape && typeof onChanged === 'function') {
          onChanged({ cedula:comparison.payload.cedula, estado_conape_raw:estadoConape });
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
              <div className="vx-c33-sub">CONAPE obtiene nombre y apellidos por cédula. Campus solo compara teléfono y correo.</div>
            </div>
            <button className="vx-c33-x" onClick={onClose}>×</button>
          </div>
          <div className="vx-c33-body">
            {state === 'loading' ? <div className="vx-c33-banner">Consultando la cédula directamente en CONAPE…</div> : null}
            {state === 'done' ? <div className="vx-c33-banner">CONAPE confirmó el reclutamiento.</div> : null}
            {error ? <div className="vx-c33-banner err">{error}</div> : null}
            {comparison ? <React.Fragment>
              <div className="vx-c33-banner">Nombre y apellidos vienen de CONAPE y <b>nunca se modifican desde Campus</b>.</div>
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