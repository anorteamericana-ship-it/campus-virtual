/* global React, window */
(function ventasConapeRecruitRowV3(){
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
    const bridge = window.CONAPE_PORTAL_BRIDGE_V3 || window.CONAPE_PORTAL_BRIDGE_C36;
    return bridge && typeof bridge.execute === 'function' ? bridge : null;
  }

  function alreadyRecruitedMessage(r){
    const estado = text(r?.estado_conape_raw || r?.estado_conape || r?.confirmation_estado || r?.confirmation?.estado || '');
    return estado
      ? `Este prospecto ya está reclutado en CONAPE. Estado: ${estado}.`
      : 'Este prospecto ya está reclutado en CONAPE.';
  }

  function failureMessage(r){
    const code = technical(r?.code || r?.error, 'UNKNOWN');
    const stage = technical(r?.stage || r?.error_stage, 'NO_DISPONIBLE');
    if (code === 'CAMPUS_BACKEND_UNAVAILABLE' && r?.campus_busy === true) {
      return `El Campus está ocupado, probá de nuevo en unos segundos.\nCódigo: ${code}\nEtapa: ${stage}`;
    }
    if (code === 'IDENTITY_MISMATCH') {
      return `La identidad devuelta por CONAPE no coincide con el prospecto del Campus. No se creó nada.\nCódigo: ${code}\nEtapa: ${stage}`;
    }
    if (code === 'FORM_MODE_UNKNOWN') {
      return `CONAPE no mostró una acción reconocible para este prospecto.\nCódigo: ${code}\nEtapa: ${stage}`;
    }
    if (code === 'DUPLICATE') {
      return `CONAPE indica que esta cédula ya está registrada.\nCódigo: ${code}\nEtapa: ${stage}`;
    }
    if (code === 'CONAPE_LOGIN_FAILED' || code === 'CONAPE_RECRUIT_BUTTON_NOT_FOUND') {
      return `No se pudo preparar Reclutar Prospectos en CONAPE.\nCódigo: ${code}\nEtapa: ${stage}`;
    }
    if (code === 'conape_bridge_unavailable'.toUpperCase()) {
      return `No se pudo conectar con el bridge CONAPE.\nCódigo: ${code}\nEtapa: ${stage}`;
    }
    const msg = text(r?.message);
    return `${msg || 'No se pudo completar el reclutamiento.'}\nCódigo: ${code}\nEtapa: ${stage}`;
  }

  function injectStyles(){
    if (document.getElementById('vx-conape-row-c35-style')) return;
    const style = document.createElement('style');
    style.id = 'vx-conape-row-c35-style';
    style.textContent = `
      .vx-c33-launch{display:none!important}
      .vx-c35-rowbtn{border:1px solid #b7d5f5;background:#eef6ff;color:#0d5ea8;border-radius:8px;padding:6px 8px;font:700 10px Poppins,system-ui;line-height:1.05;white-space:nowrap;cursor:pointer}
      .vx-c35-rowbtn:hover{background:#dfeeff}.vx-c35-rowbtn:disabled{opacity:.45;cursor:not-allowed}
      .vx-c33-banner.err{white-space:pre-line}
      .vx-c35-info{border:1px solid #b7d5f5;background:#eef6ff;color:#174a78;border-radius:10px;padding:11px 12px;line-height:1.45}
      .vx-c35-working{display:flex;align-items:center;gap:10px;padding:14px 0}
      .vx-c35-spin{width:18px;height:18px;border:2px solid #c8d9eb;border-top-color:#0d5ea8;border-radius:50%;animation:vxConapeSpin .8s linear infinite;flex:0 0 auto}
      .vx-c35-timing{font-size:11px;color:#66758b;margin-top:10px;line-height:1.45}
      @keyframes vxConapeSpin{to{transform:rotate(360deg)}}
    `;
    document.head.appendChild(style);
  }

  function RecruitRowModal({ prospecto, onClose, onChanged, onToast }){
    const [state, setState] = useState('running');
    const [phase, setPhase] = useState('Validando Campus');
    const [comparison, setComparison] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    useEffect(() => {
      let cancel = false;
      const timers = [];

      const resetAttemptUi = () => {
        setError('');
        setInfo('');
        setComparison(null);
        setResult(null);
        setState('running');
        setPhase('Validando Campus');
      };

      resetAttemptUi();

      timers.push(setTimeout(() => !cancel && setPhase('Abriendo formulario de CONAPE'), 4000));
      timers.push(setTimeout(() => !cancel && setPhase('Consultando cédula y verificando identidad'), 8000));
      timers.push(setTimeout(() => !cancel && setPhase('Aplicando contactos y enviando CREATE'), 13000));

      (async () => {
        const cedula = digits(prospecto?.cedula || prospecto?.CEDULA);
        try {
          if (!cedula) throw new Error('El prospecto no tiene cédula válida.');
          const bridge = liveBridge();
          if (!bridge) throw new Error('El puente CONAPE V3 no está disponible.');

          if (!cancel) {
            setError('');
            setInfo('');
            setComparison(null);
            setResult(null);
          }

          const r = await bridge.execute(cedula);
          if (cancel) return;
          setResult(r || null);
          setComparison(r?.comparison || null);

          const code = technical(r?.code || r?.error, 'UNKNOWN');
          if (code === 'ALREADY_RECRUITED') {
            setInfo(alreadyRecruitedMessage(r || {}));
            setState('already');
            setPhase('Ya reclutado');
            return;
          }

          if (!r || !r.ok || code !== 'CREATED') {
            setError(failureMessage(r || {}));
            setState('error');
            return;
          }

          const estadoConape = text(r.estado_conape_raw || r.estado_conape || '');
          if (typeof onChanged === 'function') {
            onChanged({
              cedula,
              ...(estadoConape ? { estado_conape_raw:estadoConape } : {}),
              conape_reclutado:true,
            });
          }
          if (typeof window.ventasDashCacheClear === 'function') window.ventasDashCacheClear();
          setState('done');
          setPhase('Confirmado');
          onToast && onToast({ tipo:'ok', msg:estadoConape ? `Prospecto reclutado · CONAPE: ${estadoConape}` : 'Prospecto reclutado en CONAPE.' });
        } catch (e) {
          if (cancel) return;
          setInfo('');
          setResult(null);
          setError(e?.message || 'No se pudo completar el reclutamiento.');
          setState('error');
        }
      })();

      return () => {
        cancel = true;
        timers.forEach(clearTimeout);
      };
    }, []);

    const rows = comparison?.rows || [];
    const timing = result?.timing || {};
    const confirmationMethod = technical(result?.confirmation_method || result?.confirmation?.confirmation_method, '');
    return (
      <div className="vx-c33-back" onMouseDown={e => { if (e.target === e.currentTarget && state !== 'running') onClose(); }}>
        <div className="vx-c33-modal">
          <div className="vx-c33-head">
            <div>
              <div className="vx-c33-title">Reclutar en CONAPE</div>
              <div className="vx-c33-sub">Una sola ejecución: valida Campus, consulta CONAPE, verifica identidad, aplica contactos y crea.</div>
            </div>
            <button className="vx-c33-x" onClick={onClose} disabled={state === 'running'}>×</button>
          </div>
          <div className="vx-c33-body">
            {state === 'running' ? <div className="vx-c35-working"><span className="vx-c35-spin"></span><div><b>Procesando en CONAPE…</b><br/><span>{phase}</span></div></div> : null}
            {state === 'done' ? <div className="vx-c33-banner">CONAPE confirmó el reclutamiento.</div> : null}
            {info ? <div className="vx-c35-info">{info}</div> : null}
            {error ? <div className="vx-c33-banner err">{error}</div> : null}
            {comparison ? <React.Fragment>
              <div className="vx-c33-banner">Resultado de la ejecución. Nombre y apellidos son solo comparación: <b>nunca se modifican desde Campus</b>.</div>
              <div className="vx-c33-grid">
                <div className="vx-c33-cell h">Dato</div><div className="vx-c33-cell h">Campus</div><div className="vx-c33-cell h">CONAPE</div><div className="vx-c33-cell h">Acción final</div>
                {rows.map(row => <React.Fragment key={row.key}>
                  <div className="vx-c33-cell h">{row.label}</div>
                  <div className="vx-c33-cell">{row.campus || '—'}</div>
                  <div className="vx-c33-cell">{row.conape || '—'}<br/><span className={`vx-c33-tag ${row.state}`}>{row.state}</span></div>
                  <div className="vx-c33-cell">{row.final || '—'}<div className="vx-c33-rule">{row.rule}</div></div>
                </React.Fragment>)}
              </div>
              <div className="vx-c33-banner" style={{marginTop:14}}>Teléfono final: <b>{comparison.final?.telefono || 'pendiente'}</b> · Correo final: <b>{comparison.final?.correo || 'sin correo'}</b>.</div>
            </React.Fragment> : null}
            {state !== 'running' && timing.total != null ? <div className="vx-c35-timing">Tiempo total: {timing.total} ms · Campus: {timing.campus ?? '—'} · Formulario: {timing.form ?? '—'} · Lookup: {timing.lookup ?? '—'} · Contactos: {timing.fill ?? '—'} · CREATE: {timing.create ?? '—'} · Confirmación: {timing.confirmation ?? '—'} · Método confirmación: {confirmationMethod || '—'}</div> : null}
          </div>
          <div className="vx-c33-foot">
            <button className="vx-c33-btn alt" onClick={onClose} disabled={state === 'running'}>{state === 'running' ? 'Procesando…' : 'Cerrar'}</button>
          </div>
        </div>
      </div>
    );
  }

  function ConapeRecruitRowButtonC35({ prospecto, onChanged, onToast }){
    const [open, setOpen] = useState(false);
    if (!visibleFor(prospecto)) return null;
    return <React.Fragment>
      <button type="button" className="vx-c35-rowbtn" onClick={e => { e.stopPropagation(); setOpen(true); }}>Reclutar en CONAPE</button>
      {open ? <RecruitRowModal prospecto={prospecto} onClose={() => setOpen(false)} onChanged={onChanged} onToast={onToast} /> : null}
    </React.Fragment>;
  }

  injectStyles();
  window.ConapeRecruitRowButtonC35 = ConapeRecruitRowButtonC35;
})();
