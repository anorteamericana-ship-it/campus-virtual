/* global React, window */
(function ventasConapeRecruitC33() {
  'use strict';

  const OriginalDrawer = window.ProspectoDrawer;
  if (typeof OriginalDrawer !== 'function' || !window.React) {
    console.error('[C3.3] ProspectoDrawer/React no disponible.');
    return;
  }

  const { useMemo, useState } = React;

  function digits(value) {
    return String(value || '').replace(/\D/g, '');
  }
  function phoneDigits(value) {
    const d = digits(value);
    if (d.length === 11 && d.startsWith('506')) return d.slice(3);
    return d.slice(-8);
  }
  function email(value) {
    return String(value || '').trim().toLowerCase();
  }
  function textKey(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();
  }
  function first(obj, keys) {
    for (const key of keys) {
      const value = obj && obj[key];
      if (value != null && String(value).trim() !== '') return value;
    }
    return '';
  }

  function campusRecord(raw) {
    const p = raw || {};
    return {
      cedula: digits(first(p, ['cedula','CEDULA'])),
      nombre: String(first(p, ['nombre','NOMBRE'])).trim(),
      correo: email(first(p, ['correo','email','CORREO','EMAIL','correo_electronico','CORREO_ELECTRONICO'])),
      whatsapp: phoneDigits(first(p, ['whatsapp','WHATSAPP','telefono','TELEFONO','tel1','TEL1'])),
    };
  }

  function conapeRecord(raw) {
    const p = raw || {};
    return {
      cedula: digits(first(p, ['cedula','CEDULA'])),
      nombre: String(first(p, ['nombre','NOMBRE','nombre_completo'])).trim(),
      correo: email(first(p, ['correo','email','CORREO','EMAIL','correo_electronico'])),
      telefono: phoneDigits(first(p, ['telefono','telefono_celular','TELEFONO','TELEFONO_CELULAR'])),
    };
  }

  function cmp(a, b, normalizer = textKey) {
    const av = normalizer(a);
    const bv = normalizer(b);
    if (!av && !bv) return 'vacio';
    if (!av || !bv) return 'falta';
    return av === bv ? 'igual' : 'diferente';
  }

  function buildComparison(campusRaw, conapeRaw) {
    const campus = campusRecord(campusRaw);
    const conape = conapeRecord(conapeRaw);
    const conapeEmailLocked = !!conape.correo;
    return {
      campus,
      conape,
      rows: [
        { key:'cedula', label:'Cédula', campus:campus.cedula, conape:conape.cedula, final:conape.cedula || campus.cedula, state:cmp(campus.cedula, conape.cedula, digits), rule:'Solo dígitos' },
        { key:'nombre', label:'Nombre', campus:campus.nombre, conape:conape.nombre, final:conape.nombre || campus.nombre, state:cmp(campus.nombre, conape.nombre), rule:'Comparación normalizada' },
        { key:'correo', label:'Correo', campus:campus.correo, conape:conape.correo, final:conapeEmailLocked ? conape.correo : campus.correo, state:cmp(campus.correo, conape.correo, email), rule:conapeEmailLocked ? 'CONAPE existente: no se modifica' : 'Completar con correo Campus' },
        { key:'telefono', label:'Teléfono', campus:campus.whatsapp, conape:conape.telefono, final:campus.whatsapp || conape.telefono, state:cmp(campus.whatsapp, conape.telefono, phoneDigits), rule:'Usar WhatsApp del prospecto · solo dígitos' },
      ],
      payload: {
        cedula: conape.cedula || campus.cedula,
        nombre: conape.nombre || campus.nombre,
        correo: conapeEmailLocked ? conape.correo : campus.correo,
        correo_campus_secundario: conapeEmailLocked && campus.correo && campus.correo !== conape.correo ? campus.correo : '',
        telefono: campus.whatsapp || conape.telefono,
        preserve_existing_email: conapeEmailLocked,
      },
      emailLocked: conapeEmailLocked,
    };
  }

  async function postCampus(fn, payload) {
    const url = window.APPS_SCRIPT_URL || window.SCRIPT_URL_V || '';
    if (!url) return { ok:false, error:'campus_backend_missing' };
    const token = window.getSessionToken ? window.getSessionToken() : '';
    try {
      const res = await fetch(url, {
        method:'POST',
        headers:{ 'Content-Type':'text/plain;charset=utf-8' },
        body:JSON.stringify({ fn, token, ...payload }),
      });
      const raw = await res.text();
      if (!raw || raw.trim().startsWith('<')) return { ok:false, error:'respuesta_invalida' };
      return JSON.parse(raw);
    } catch (error) {
      console.error(`[C3.3] ${fn} falló.`, error);
      return { ok:false, error:'servicio_no_disponible' };
    }
  }

  async function recruitPreview(cedula) {
    return postCampus('conapePortalRecruitPreview', { cedula:digits(cedula) });
  }
  async function recruitSubmit({ cedula, payload, sourceVersion }) {
    return postCampus('conapePortalRecruitSubmit', {
      cedula:digits(cedula),
      source_version:sourceVersion || '',
      prospecto:payload,
    });
  }

  function injectStyles() {
    if (document.getElementById('vx-conape-recruit-c33-style')) return;
    const style = document.createElement('style');
    style.id = 'vx-conape-recruit-c33-style';
    style.textContent = `
      .vx-c33-launch{position:fixed;right:28px;bottom:28px;z-index:1205;border:0;border-radius:999px;padding:12px 18px;background:#0d66c2;color:#fff;font:600 13px Poppins,system-ui;box-shadow:0 10px 28px rgba(15,40,80,.24);cursor:pointer}
      .vx-c33-launch:disabled{opacity:.45;cursor:not-allowed}
      .vx-c33-back{position:fixed;inset:0;z-index:1300;background:rgba(10,22,42,.52);display:flex;align-items:center;justify-content:center;padding:18px}
      .vx-c33-modal{width:min(920px,96vw);max-height:90vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 22px 64px rgba(0,0,0,.28);font-family:Poppins,system-ui}
      .vx-c33-head{padding:20px 22px 14px;border-bottom:1px solid #e5eaf1;display:flex;justify-content:space-between;gap:16px;align-items:start}
      .vx-c33-title{font-size:18px;font-weight:700;color:#10233f}.vx-c33-sub{font-size:12px;color:#66758b;margin-top:4px}.vx-c33-x{border:0;background:transparent;font-size:24px;cursor:pointer;color:#607086}
      .vx-c33-body{padding:18px 22px}.vx-c33-banner{padding:11px 13px;border-radius:10px;background:#eef6ff;color:#174c7d;font-size:12px;margin-bottom:14px}.vx-c33-banner.warn{background:#fff5e8;color:#8a4a00}.vx-c33-banner.err{background:#fff0f0;color:#9d2020}
      .vx-c33-grid{display:grid;grid-template-columns:130px 1fr 1fr 1fr;gap:1px;background:#e5eaf1;border:1px solid #e5eaf1;border-radius:10px;overflow:hidden}.vx-c33-cell{background:#fff;padding:10px 12px;font-size:12px;min-width:0;word-break:break-word}.vx-c33-cell.h{font-weight:700;background:#f7f9fc;color:#40516a}.vx-c33-tag{display:inline-block;margin-top:4px;padding:2px 7px;border-radius:999px;font-size:10px;font-weight:700}.vx-c33-tag.igual{background:#e8f7ed;color:#237342}.vx-c33-tag.diferente{background:#fff3df;color:#8b5700}.vx-c33-tag.falta,.vx-c33-tag.vacio{background:#eef1f5;color:#5c6979}
      .vx-c33-rule{font-size:10px;color:#77869b;margin-top:4px}.vx-c33-foot{padding:14px 22px 20px;border-top:1px solid #e5eaf1;display:flex;justify-content:flex-end;gap:10px}.vx-c33-btn{border:0;border-radius:9px;padding:10px 14px;font:600 12px Poppins,system-ui;cursor:pointer}.vx-c33-btn.alt{background:#eef1f5;color:#2d3e56}.vx-c33-btn.go{background:#0d66c2;color:white}.vx-c33-btn:disabled{opacity:.45;cursor:not-allowed}
      @media(max-width:720px){.vx-c33-grid{grid-template-columns:95px 1fr}.vx-c33-cell:nth-child(4n+3),.vx-c33-cell:nth-child(4n+4){border-top:1px solid #eef1f5}.vx-c33-launch{right:16px;bottom:16px}}
    `;
    document.head.appendChild(style);
  }

  function RecruitModal({ seed, cedula, onClose, onToast }) {
    const [state, setState] = useState('idle');
    const [campus, setCampus] = useState(null);
    const [preview, setPreview] = useState(null);
    const [comparison, setComparison] = useState(null);
    const [error, setError] = useState('');

    const load = async () => {
      if (state === 'loading') return;
      setState('loading'); setError('');
      try {
        let detail = seed || {};
        if (typeof window.getProspectoDetalle === 'function') {
          const d = await window.getProspectoDetalle(cedula);
          if (d && d.ok !== false && d.prospecto) detail = { ...detail, ...d.prospecto };
        }
        const c = campusRecord(detail);
        setCampus(c);
        if (!c.cedula) throw new Error('El prospecto no tiene cédula válida.');
        const r = await recruitPreview(c.cedula);
        if (!r || !r.ok) {
          setPreview(null);
          setComparison(buildComparison(c, null));
          setState('contract-missing');
          return;
        }
        const ext = r.prospecto || r.conape || null;
        setPreview(r);
        setComparison(buildComparison(c, ext));
        setState('ready');
      } catch (e) {
        setError(e && e.message ? e.message : 'No se pudo preparar el reclutamiento.');
        setState('error');
      }
    };

    React.useEffect(() => { load(); }, []);

    const submit = async () => {
      if (!comparison || !preview || preview.can_submit !== true || state === 'sending') return;
      setState('sending'); setError('');
      const r = await recruitSubmit({
        cedula:comparison.payload.cedula,
        payload:comparison.payload,
        sourceVersion:preview.source_version || preview.version || '',
      });
      if (r && r.ok) {
        setState('done');
        if (typeof window.ventasDashCacheClear === 'function') window.ventasDashCacheClear();
        onToast && onToast({ tipo:'ok', msg:'Prospecto reclutado en CONAPE.' });
      } else {
        setState('ready');
        setError('CONAPE no confirmó el envío. No se registró como completado.');
      }
    };

    const rows = comparison ? comparison.rows : [];
    return (
      <div className="vx-c33-back" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="vx-c33-modal">
          <div className="vx-c33-head">
            <div><div className="vx-c33-title">Reclutar en CONAPE</div><div className="vx-c33-sub">Compará primero. El Campus no sobrescribe silenciosamente datos ya existentes en CONAPE.</div></div>
            <button className="vx-c33-x" onClick={onClose}>×</button>
          </div>
          <div className="vx-c33-body">
            {state === 'loading' || state === 'idle' ? <div className="vx-c33-banner">Consultando el registro de CONAPE y preparando la comparación…</div> : null}
            {state === 'contract-missing' ? <div className="vx-c33-banner warn">La pantalla ya está agregada, pero el puente seguro de escritura CONAPE todavía no está desplegado. C3.3 permanece bloqueado hasta descubrir y validar el formulario real de “Reclutar”.</div> : null}
            {state === 'done' ? <div className="vx-c33-banner">CONAPE confirmó el reclutamiento. El seguimiento podrá continuar desde el Campus.</div> : null}
            {error ? <div className="vx-c33-banner err">{error}</div> : null}
            {comparison ? (
              <React.Fragment>
                <div className="vx-c33-grid">
                  <div className="vx-c33-cell h">Dato</div><div className="vx-c33-cell h">Campus</div><div className="vx-c33-cell h">CONAPE</div><div className="vx-c33-cell h">Se enviará / conservará</div>
                  {rows.map(row => <React.Fragment key={row.key}>
                    <div className="vx-c33-cell h">{row.label}</div>
                    <div className="vx-c33-cell">{row.campus || '—'}</div>
                    <div className="vx-c33-cell">{row.conape || '—'}<br/><span className={`vx-c33-tag ${row.state}`}>{row.state}</span></div>
                    <div className="vx-c33-cell">{row.final || '—'}<div className="vx-c33-rule">{row.rule}</div></div>
                  </React.Fragment>)}
                </div>
                {comparison.emailLocked && comparison.payload.correo_campus_secundario ? <div className="vx-c33-banner warn" style={{marginTop:14}}>CONAPE ya tiene un correo y no se modificará. El correo del Campus se conservará como contacto alterno: <b>{comparison.payload.correo_campus_secundario}</b>.</div> : null}
                <div className="vx-c33-banner" style={{marginTop:14}}>Teléfono a usar: <b>{comparison.payload.telefono || 'sin WhatsApp disponible'}</b>. Se envía sin guiones ni espacios y sale del WhatsApp registrado en el prospecto.</div>
              </React.Fragment>
            ) : null}
          </div>
          <div className="vx-c33-foot">
            <button className="vx-c33-btn alt" onClick={onClose}>Cerrar</button>
            <button className="vx-c33-btn go" onClick={submit} disabled={!preview || preview.can_submit !== true || state === 'sending' || state === 'done'}>{state === 'sending' ? 'Enviando…' : state === 'done' ? 'Enviado' : 'Enviar solicitud'}</button>
          </div>
        </div>
      </div>
    );
  }

  function RecruitLauncher(props) {
    const [open, setOpen] = useState(false);
    const seed = props.seed || {};
    const financing = String(seed.financiamiento || seed.FINANCIAMIENTO || '').toUpperCase();
    const etapa = String(seed.etapa || seed.ETAPA || '').toUpperCase();
    const visible = financing === 'CONAPE' && !['CANCELADO','ACTIVO','MATRICULADO'].includes(etapa);
    const cedula = props.cedula || seed.cedula || seed.CEDULA || '';
    if (!visible) return null;
    return (
      <React.Fragment>
        <button className="vx-c33-launch" onClick={() => setOpen(true)}>Reclutar en CONAPE</button>
        {open ? <RecruitModal seed={seed} cedula={cedula} onClose={() => setOpen(false)} onToast={props.onToast} /> : null}
      </React.Fragment>
    );
  }

  function ProspectoDrawerConapeRecruit(props) {
    return <React.Fragment><OriginalDrawer {...props}/><RecruitLauncher {...props}/></React.Fragment>;
  }

  injectStyles();
  window.ProspectoDrawer = ProspectoDrawerConapeRecruit;
  Object.assign(window, {
    conapeRecruitDigitsC33:digits,
    conapeRecruitPhoneDigitsC33:phoneDigits,
    conapeRecruitEmailC33:email,
    conapeRecruitBuildComparisonC33:buildComparison,
    conapePortalRecruitPreviewVentasSeguro:recruitPreview,
    conapePortalRecruitSubmitVentasSeguro:recruitSubmit,
  });
})();
