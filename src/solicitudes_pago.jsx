/* global React, getSolicitudesPago, marcarSolicitudAplicada, rechazarSolicitudPago, getSesion */
// ─────────────────────────────────────────────────────────────────────────
// SolicitudesPagoView — Fase 3.5
// Cola de comprobantes que los vendedores reportan. El admin VERIFICA el
// dinero en BDBANCARIO (cruzando el N° de comprobante) y marca la solicitud
// como aplicada, o la rechaza. La imagen es EVIDENCIA, no automatización:
// aplicar el pago real se sigue haciendo en "Aplicar Pago".
// ─────────────────────────────────────────────────────────────────────────

const SP_MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function spFmtTs(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${SP_MES[d.getMonth()]} · ${
    String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function spColones(n) {
  const v = Number(n) || 0;
  return '₡' + v.toLocaleString('es-CR');
}
function spCedula(raw) {
  const d = String(raw == null ? '' : raw).replace(/\D/g, '');
  if (d.length === 9) return `${d[0]}-${d.slice(1, 5)}-${d.slice(5)}`;
  return String(raw || '');
}
const SP_ESTADO = {
  PENDIENTE: { label: 'Pendiente', bg: '#FFF4D6', fg: '#8A5A00', bd: '#F2D584' },
  APLICADO:  { label: 'Aplicado',  bg: '#E4F4E9', fg: '#1E4D2B', bd: '#A7D3B4' },
  RECHAZADO: { label: 'Rechazado', bg: '#ECEEF1', fg: '#5A626E', bd: '#CDD3DC' },
  DUPLICADO: { label: 'Duplicado', bg: '#FBE4E1', fg: '#8B1A10', bd: '#F0BDB6' },
};

function SpEstadoBadge({ estado }) {
  const m = SP_ESTADO[estado] || { label: estado, bg: 'var(--surface-2)', fg: 'var(--ink-2)', bd: 'var(--line)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px',
      background: m.bg, color: m.fg, border: `1px solid ${m.bd}`,
      borderRadius: 'var(--r-pill)', fontSize: 11, fontWeight: 800,
      letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.fg }} />
      {m.label}
    </span>
  );
}

function SpToast({ toast }) {
  if (!toast) return null;
  const bg = toast.kind === 'err' ? '#7A1F15' : toast.kind === 'warn' ? '#8A5A00' : '#1E4D2B';
  return (
    <div role="status" style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 1300, background: bg, color: '#FFF',
      padding: '12px 16px', borderRadius: 'var(--r-md)', boxShadow: '0 12px 32px rgba(0,0,0,0.32)',
      fontSize: 13, fontWeight: 600, maxWidth: 420, lineHeight: 1.4, animation: 'an-fade-in .14s ease-out',
    }}>{toast.msg}</div>
  );
}

function spTieneComprobante(sol) {
  if (sol?.tiene_comprobante === true) return true;
  const demoLocal = String(sol?.url_comprobante || '');
  return demoLocal.startsWith('data:');
}

function SolicitudesPagoView({ onNavigate, categoria = 'TODAS', embedded = false }) {
  const adminNombre = React.useMemo(() => {
    try { return (window.getSesion && window.getSesion() || {}).nombre || 'admin'; } catch (_) { return 'admin'; }
  }, []);

  const [estado, setEstado] = React.useState('PENDIENTE');
  const [asesor, setAsesor] = React.useState('');
  const [desde, setDesde] = React.useState('');
  const [hasta, setHasta] = React.useState('');

  const [lista, setLista] = React.useState([]);
  const [pendientes, setPendientes] = React.useState(0);
  const [asesores, setAsesores] = React.useState([]);
  const [cargando, setCargando] = React.useState(true);
  const [err, setErr] = React.useState('');

  const [verComprobante, setVerComprobante] = React.useState(null); // sol + ObjectURL privado
  const [abriendoComprobante, setAbriendoComprobante] = React.useState('');
  const [verDetalle, setVerDetalle] = React.useState(null);         // sol
  const [confirmAplicar, setConfirmAplicar] = React.useState(null); // sol
  const [modalRechazar, setModalRechazar] = React.useState(null);   // sol
  const [accionando, setAccionando] = React.useState(null);         // id
  const [toast, setToast] = React.useState(null);

  const showToast = React.useCallback((msg, kind = 'ok') => {
    const t = { msg, kind, ts: Date.now() };
    setToast(t);
    setTimeout(() => setToast(cur => (cur && cur.ts === t.ts ? null : cur)), 4200);
  }, []);

  const refrescar = React.useCallback(() => {
    setCargando(true); setErr('');
    window.getSolicitudesPago({ estado, asesor, fecha_desde: desde, fecha_hasta: hasta })
      .then(r => {
        if (!r || !r.ok) { setErr((r && r.error) || 'No se pudo cargar la cola.'); setLista([]); return; }
        const base = r.solicitudes || [];
        const filtrada = categoria === 'MATRICULA'
          ? base.filter(x => String(x.tipo_pago || '').toUpperCase() === 'MATRICULA')
          : categoria === 'CUOTAS'
            ? base.filter(x => String(x.tipo_pago || '').toUpperCase() !== 'MATRICULA')
            : base;
        setLista(filtrada);
        if (typeof r.pendientes === 'number') setPendientes(r.pendientes);
      })
      .catch(e => { setErr('Error de red: ' + e.message); setLista([]); })
      .finally(() => setCargando(false));
  }, [estado, asesor, desde, hasta, categoria]);

  React.useEffect(() => { refrescar(); }, [refrescar]);

  // Poblar el dropdown de asesores una vez (de TODAS las solicitudes).
  React.useEffect(() => {
    window.getSolicitudesPago({ estado: 'TODOS' }).then(r => {
      if (r && r.ok) {
        const set = new Set((r.solicitudes || []).map(s => s.nombre_reporta).filter(Boolean));
        setAsesores([...set].sort());
        if (typeof r.pendientes === 'number') setPendientes(r.pendientes);
      }
    }).catch(() => {});
  }, []);

  const aplicar = async (sol) => {
    setAccionando(sol.id);
    const res = await window.marcarSolicitudAplicada({ id: sol.id, admin_nombre: adminNombre });
    setAccionando(null); setConfirmAplicar(null);
    if (!res || !res.ok) { showToast((res && res.error) || 'No se pudo marcar como aplicada.', 'err'); return; }
    showToast('Solicitud marcada como aplicada. ✅', 'ok');
    window.dispatchEvent(new Event('an:solicitudes-pago-changed'));
    refrescar();
  };

  const rechazar = async (sol, motivo) => {
    setAccionando(sol.id);
    const res = await window.rechazarSolicitudPago({ id: sol.id, admin_nombre: adminNombre, motivo });
    setAccionando(null); setModalRechazar(null);
    if (!res || !res.ok) { showToast((res && res.error) || 'No se pudo rechazar.', 'err'); return; }
    showToast('Solicitud rechazada.', 'ok');
    window.dispatchEvent(new Event('an:solicitudes-pago-changed'));
    refrescar();
  };

  // FIX-NAVEGACION-APLICAR-PAGO-001 — antes mandaba al prospecto en Matrículas.
  // Ahora lleva directo a "Aplicar Pago" con el estudiante de la solicitud ya
  // cargado (paso 2). NO aplica el pago ni marca la solicitud automáticamente.
  const irAAplicarPago = (sol) => {
    const codigo = String(
      sol.estudiante_codigo ||
      sol.codigo ||
      sol.rec_m ||
      sol.REC_M ||
      sol.CODIGO_ESTUDIANTE ||
      ''
    ).trim();
    const cedula = String(sol.estudiante_cedula || sol.cedula || '').trim();

    if (!codigo && !cedula) {
      showToast('La solicitud no tiene código ni cédula del estudiante.', 'err');
      return;
    }

    try {
      sessionStorage.setItem('an_pago_prefill', JSON.stringify({
        origen: 'solicitudes_pago',
        codigo,
        cedula,
        nivel: sol.nivel || '',
        tipo_pago: sol.tipo_pago || '',
        numero_comprobante: sol.numero_comprobante || '',
        monto_reportado: sol.monto_reportado || '',
        solicitud_id: sol.id || '',
        forcePaso: 2,
      }));
    } catch (_) {}
    if (onNavigate) onNavigate('aplicar_pago');
  };

  const cerrarComprobante = React.useCallback(() => {
    setVerComprobante(cur => {
      if (cur?._object_url) {
        try { URL.revokeObjectURL(cur._object_url); } catch (_) {}
      }
      return null;
    });
  }, []);

  const verComp = async (sol) => {
    const id = String(sol?.id || '').trim();
    if (!id || abriendoComprobante) return;
    setAbriendoComprobante(id);
    const preview = window.open('', '_blank');
    if (preview) {
      try {
        preview.opener = null;
        preview.document.title = 'Verificando comprobante…';
        preview.document.body.innerHTML = '<p style="font-family:system-ui;padding:24px">Verificando comprobante…</p>';
      } catch (_) {}
    }
    try {
      const r = await window.descargarComprobantePagoPrivado(id);
      if (!r?.ok || !r.blob) throw new Error(r?.mensaje || r?.error || 'No se pudo abrir el comprobante.');
      const objectUrl = URL.createObjectURL(r.blob);
      const mime = String(r.mime_type || r.blob.type || '').toLowerCase();
      if (mime === 'application/pdf') {
        if (preview && !preview.closed) preview.location.replace(objectUrl);
        else {
          const a = document.createElement('a');
          a.href = objectUrl; a.download = r.nombre || `comprobante-${id}.pdf`;
          document.body.appendChild(a); a.click(); a.remove();
        }
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
        return;
      }
      if (/^image\/(jpeg|png)$/i.test(mime)) {
        try { if (preview && !preview.closed) preview.close(); } catch (_) {}
        setVerComprobante({ ...sol, _object_url:objectUrl, _mime:mime, _nombre:r.nombre || `comprobante-${id}` });
        return;
      }

      try { if (preview && !preview.closed) preview.close(); } catch (_) {}
      const a = document.createElement('a');
      a.href = objectUrl; a.download = r.nombre || `comprobante-${id}`;
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (e) {
      try { if (preview && !preview.closed) preview.close(); } catch (_) {}
      showToast(e?.message || 'No se pudo abrir el comprobante.', 'err');
    } finally {
      setAbriendoComprobante('');
    }
  };

  return (
    <div className="page" data-screen-label={`Admin · ${categoria === 'MATRICULA' ? 'Solicitudes de matrícula' : categoria === 'CUOTAS' ? 'Solicitudes de cuotas' : 'Solicitudes de pago'}`} style={{ padding: embedded ? 0 : '28px 32px 60px', maxWidth: 1240, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>
            Pagos · Operaciones
          </div>
          <h1 style={{ fontFamily: 'var(--f-serif)', fontWeight: 500, letterSpacing: '-0.02em', fontSize: 32, lineHeight: 1.05, margin: 0, color: 'var(--ink)' }}>
            {categoria === 'MATRICULA' ? 'Solicitudes de matrícula' : categoria === 'CUOTAS' ? 'Solicitudes de cuotas y otros pagos' : 'Solicitudes de pago'}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8, maxWidth: 640 }}>
            Comprobantes que reportan los asesores. Verificá el monto en{' '}
            <b>BDBANCARIO</b> cruzando el N° de comprobante, aplicá el pago en{' '}
            <i>Aplicar Pago</i> y marcá la solicitud como aplicada. <b>La imagen es evidencia, no se aplica sola.</b>
          </div>
        </div>
        <button type="button" onClick={refrescar} disabled={cargando}
          style={{
            padding: '9px 14px', background: 'var(--surface)', border: '1.5px solid var(--ink)',
            color: 'var(--ink)', fontSize: 12, fontWeight: 700, borderRadius: 'var(--r-md)',
            cursor: cargando ? 'wait' : 'pointer', letterSpacing: '0.04em', fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: cargando ? 'an-spin .8s linear infinite' : 'none' }}>
            <path d="M3 12a9 9 0 0 1 15.5-6.5L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.5L3 16M3 21v-5h5" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
        padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-md)', marginBottom: 18,
      }}>
        <div>
          <SpFiltroLbl>Estado</SpFiltroLbl>
          <SpSegmented value={estado} onChange={setEstado} cargando={cargando}
            opciones={['PENDIENTE', 'APLICADO', 'RECHAZADO', 'DUPLICADO', 'TODOS']} />
        </div>
        <div>
          <SpFiltroLbl>Asesor</SpFiltroLbl>
          <select value={asesor} onChange={e => setAsesor(e.target.value)} style={spSelectStyle}>
            <option value="">Todos los asesores</option>
            {asesores.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <SpFiltroLbl>Desde</SpFiltroLbl>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={spSelectStyle} />
        </div>
        <div>
          <SpFiltroLbl>Hasta</SpFiltroLbl>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={spSelectStyle} />
        </div>
        {(asesor || desde || hasta) && (
          <button type="button" onClick={() => { setAsesor(''); setDesde(''); setHasta(''); }}
            style={{
              padding: '9px 12px', background: 'transparent', border: '1.5px solid var(--line-2, var(--line))',
              color: 'var(--ink-2)', fontSize: 12, fontWeight: 600, borderRadius: 'var(--r-md)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Limpiar filtros</button>
        )}
        <div style={{ flex: 1 }} />
        <div style={{
          padding: '6px 14px', borderRadius: 'var(--r-pill)',
          background: pendientes ? '#FFF4D6' : 'var(--surface-2)',
          border: `1px solid ${pendientes ? '#F2D584' : 'var(--line)'}`,
          color: pendientes ? '#8A5A00' : 'var(--ink-3)', fontSize: 12, fontWeight: 700,
        }}>
          {pendientes} pendiente{pendientes === 1 ? '' : 's'}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
        {cargando ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Cargando solicitudes…</div>
        ) : err ? (
          <div style={{ padding: '20px', color: '#8B1A10', fontSize: 13, fontWeight: 600 }}>⚠ {err}</div>
        ) : lista.length === 0 ? (
          <SpEmpty estado={estado} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 980 }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', textAlign: 'left' }}>
                  {['Reportado', 'Reportó', 'Estudiante', 'Tipo', 'N° Comprobante', 'Monto', 'Comprobante', 'Estado', 'Acciones'].map((h, i) => (
                    <th key={i} style={{
                      padding: '11px 14px', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map(sol => (
                  <SpFila key={sol.id} sol={sol} accionando={accionando}
                    onVerComprobante={() => verComp(sol)}
                    onAplicarPago={() => irAAplicarPago(sol)}
                    onAplicar={() => setConfirmAplicar(sol)}
                    onRechazar={() => setModalRechazar(sol)}
                    onVerDetalle={() => setVerDetalle(sol)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {verComprobante && <SpComprobanteModal sol={verComprobante} onClose={cerrarComprobante} />}
      {verDetalle && <SpDetalleModal sol={verDetalle} onClose={() => setVerDetalle(null)} onVerComprobante={() => { verComp(verDetalle); setVerDetalle(null); }} />}
      {confirmAplicar && (
        <SpConfirmAplicar sol={confirmAplicar} enviando={accionando === confirmAplicar.id}
          onClose={() => accionando !== confirmAplicar.id && setConfirmAplicar(null)}
          onConfirmar={() => aplicar(confirmAplicar)} />
      )}
      {modalRechazar && (
        <SpRechazarModal sol={modalRechazar} enviando={accionando === modalRechazar.id}
          onClose={() => accionando !== modalRechazar.id && setModalRechazar(null)}
          onConfirmar={(motivo) => rechazar(modalRechazar, motivo)} />
      )}
      <SpToast toast={toast} />
    </div>
  );
}

// ── Filtros chrome ───────────────────────────────────────────────────────
function SpFiltroLbl({ children }) {
  return <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5 }}>{children}</div>;
}
const spSelectStyle = {
  padding: '8px 10px', border: '1.5px solid var(--line)', borderRadius: 'var(--r-md)',
  background: 'var(--surface)', color: 'var(--ink)', fontSize: 12.5, fontFamily: 'inherit', outline: 'none',
};
function SpSegmented({ value, onChange, opciones, cargando }) {
  return (
    <div style={{ display: 'inline-flex', border: '1.5px solid var(--line)', borderRadius: 'var(--r-md)', background: 'var(--surface)', overflow: 'hidden' }}>
      {opciones.map(o => {
        const activo = o === value;
        return (
          <button key={o} type="button" onClick={() => !cargando && onChange(o)} disabled={cargando}
            style={{
              padding: '8px 11px', background: activo ? 'var(--ink)' : 'transparent', border: 'none',
              color: activo ? '#FFF' : 'var(--ink-2)', fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.05em', textTransform: 'uppercase', cursor: cargando ? 'wait' : 'pointer', fontFamily: 'inherit',
            }}>{o === 'TODOS' ? 'Todos' : SP_ESTADO[o] ? SP_ESTADO[o].label : o}</button>
        );
      })}
    </div>
  );
}

function SpEmpty({ estado }) {
  return (
    <div style={{ padding: '48px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 32, opacity: 0.4, marginBottom: 8 }}>✓</div>
      <div style={{ fontFamily: 'var(--f-serif)', fontSize: 18, color: 'var(--ink)', fontWeight: 500, letterSpacing: '-0.015em' }}>
        {estado === 'PENDIENTE' ? 'No hay solicitudes pendientes.' : `Sin solicitudes en este filtro.`}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
        Cuando un asesor reporte un comprobante aparecerá acá.
      </div>
    </div>
  );
}

// ── Fila de tabla ────────────────────────────────────────────────────────
function SpFila({ sol, accionando, onVerComprobante, onAplicarPago, onAplicar, onRechazar, onVerDetalle }) {
  const pendiente = sol.estado === 'PENDIENTE';
  const bloqueado = accionando === sol.id;
  const td = { padding: '12px 14px', borderBottom: '1px solid var(--line)', verticalAlign: 'top' };
  return (
    <tr>
      <td style={{ ...td, whiteSpace: 'nowrap', color: 'var(--ink-2)', fontFamily: 'var(--f-mono)', fontSize: 12 }}>{spFmtTs(sol.timestamp)}</td>
      <td style={{ ...td, whiteSpace: 'nowrap' }}>{sol.nombre_reporta || '—'}</td>
      <td style={td}>
        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{sol.estudiante_nombre || '—'}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--f-mono)' }}>{spCedula(sol.estudiante_cedula)}</div>
      </td>
      <td style={{ ...td, whiteSpace: 'nowrap' }}>
        <div style={{ fontWeight: 600, fontSize: 12 }}>{sol.tipo_pago}</div>
        {sol.nivel ? <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{sol.nivel}</div> : null}
      </td>
      <td style={{ ...td, fontFamily: 'var(--f-mono)', fontWeight: 700, whiteSpace: 'nowrap' }}>{sol.numero_comprobante || '—'}</td>
      <td style={{ ...td, fontFamily: 'var(--f-mono)', fontWeight: 700, whiteSpace: 'nowrap' }}>{spColones(sol.monto_reportado)}</td>
      <td style={td}>
        {spTieneComprobante(sol) ? (
          <button type="button" onClick={onVerComprobante} style={spLinkBtn}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" />
            </svg>
            Ver
          </button>
        ) : <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>—</span>}
      </td>
      <td style={td}><SpEstadoBadge estado={sol.estado} /></td>
      <td style={{ ...td, minWidth: 200 }}>
        {pendiente ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button type="button" onClick={onAplicarPago} style={spActBtn('ghost')} disabled={bloqueado}>Aplicar pago</button>
            <button type="button" onClick={onAplicar} style={spActBtn('green')} disabled={bloqueado}>Marcar aplicada</button>
            <button type="button" onClick={onRechazar} style={spActBtn('red')} disabled={bloqueado}>Rechazar</button>
          </div>
        ) : (
          <button type="button" onClick={onVerDetalle} style={spActBtn('ghost')}>Ver detalles</button>
        )}
      </td>
    </tr>
  );
}

const spLinkBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px',
  background: 'var(--surface)', border: '1.5px solid var(--an-navy)', color: 'var(--an-navy)',
  borderRadius: 'var(--r-md)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
};
function spActBtn(kind) {
  const base = { padding: '6px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };
  if (kind === 'green') return { ...base, background: '#1E4D2B', border: '1px solid #1E4D2B', color: '#FFF' };
  if (kind === 'red') return { ...base, background: 'var(--surface)', border: '1.5px solid #7A1F15', color: '#7A1F15' };
  return { ...base, background: 'var(--surface)', border: '1.5px solid var(--line-2, var(--line))', color: 'var(--ink-2)' };
}

// ── Modal: ver comprobante (imagen) ───────────────────────────────────────
function SpComprobanteModal({ sol, onClose }) {
  React.useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={spScrim}>
      <div role="dialog" aria-modal="true" style={{ width: '100%', maxWidth: 520, background: 'var(--surface)', borderRadius: 'var(--r-lg, 12px)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Comprobante · {sol.numero_comprobante}</div>
            <div style={{ fontFamily: 'var(--f-serif)', fontSize: 17, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>{sol.estudiante_nombre}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: 'var(--ink-3)', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 16, overflowY: 'auto', background: 'var(--surface-2)', display: 'flex', justifyContent: 'center' }}>
          <img src={sol._object_url} alt="Comprobante de pago" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--line)', background: '#fff' }} />
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>Monto reportado: <b style={{ fontFamily: 'var(--f-mono)' }}>{spColones(sol.monto_reportado)}</b></span>
          <button type="button" onClick={() => {
            const a = document.createElement('a');
            a.href = sol._object_url; a.download = sol._nombre || `comprobante-${sol.id || 'pago'}`;
            document.body.appendChild(a); a.click(); a.remove();
          }} style={spLinkBtn}>Descargar copia</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: detalle read-only (estados no pendientes) ──────────────────────
function SpDetalleModal({ sol, onClose, onVerComprobante }) {
  React.useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const filas = [
    ['Estudiante', sol.estudiante_nombre],
    ['Cédula', spCedula(sol.estudiante_cedula)],
    ['Código', sol.estudiante_codigo || '—'],
    ['Reportó', sol.nombre_reporta],
    ['Reportado', spFmtTs(sol.timestamp)],
    ['Tipo', sol.tipo_pago + (sol.nivel ? ` · ${sol.nivel}` : '')],
    ['N° Comprobante', sol.numero_comprobante],
    ['Monto', spColones(sol.monto_reportado)],
    ['Notas del asesor', sol.notas_reporta || '—'],
  ];
  if (sol.admin_nombre) filas.push(['Resuelto por', sol.admin_nombre]);
  if (sol.estado === 'RECHAZADO') filas.push(['Motivo de rechazo', sol.motivo_rechazo || '—']);
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={spScrim}>
      <div role="dialog" aria-modal="true" style={{ width: '100%', maxWidth: 480, background: 'var(--surface)', borderRadius: 'var(--r-lg, 12px)', boxShadow: '0 24px 64px rgba(0,0,0,0.36)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Solicitud de pago</div>
            <div style={{ marginTop: 6 }}><SpEstadoBadge estado={sol.estado} /></div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: 'var(--ink-3)', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '8px 20px 16px', overflowY: 'auto' }}>
          {filas.map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '9px 0', borderBottom: i < filas.length - 1 ? '1px dashed var(--line)' : 'none' }}>
              <div style={{ flex: '0 0 130px', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{k}</div>
              <div style={{ flex: 1, fontSize: 13, color: 'var(--ink)' }}>{v}</div>
            </div>
          ))}
        </div>
        {spTieneComprobante(sol) ? (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
            <button type="button" onClick={onVerComprobante} style={{ ...spLinkBtn, width: '100%', justifyContent: 'center' }}>Ver comprobante</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Modal: confirmar aplicada ──────────────────────────────────────────────
function SpConfirmAplicar({ sol, enviando, onClose, onConfirmar }) {
  React.useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' && !enviando) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enviando, onClose]);
  return (
    <div onClick={e => e.target === e.currentTarget && !enviando && onClose()} style={spScrim}>
      <div role="dialog" aria-modal="true" style={{ width: '100%', maxWidth: 460, background: 'var(--surface)', borderRadius: 'var(--r-lg, 12px)', boxShadow: '0 24px 64px rgba(0,0,0,0.36)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px 14px', background: '#E4F4E9', borderBottom: '1px solid #A7D3B4' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1E4D2B' }}>Confirmar aplicación</div>
          <div style={{ fontFamily: 'var(--f-serif)', fontSize: 19, fontWeight: 600, color: 'var(--ink)', marginTop: 4, lineHeight: 1.2 }}>
            ¿Confirmás que ya aplicaste este pago en BDBANCARIO?
          </div>
        </div>
        <div style={{ padding: '16px 22px', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          Comprobante <b style={{ fontFamily: 'var(--f-mono)' }}>{sol.numero_comprobante}</b> de{' '}
          <b>{sol.estudiante_nombre}</b> por <b style={{ fontFamily: 'var(--f-mono)' }}>{spColones(sol.monto_reportado)}</b>.
          Marcarla como aplicada la saca de la cola de pendientes. Esto <b>no</b> aplica el pago por sí solo — asegurate de haberlo hecho en <i>Aplicar Pago</i>.
        </div>
        <div style={{ padding: '14px 22px 18px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={() => !enviando && onClose()} disabled={enviando} style={spModalGhost}>Cancelar</button>
          <button type="button" onClick={onConfirmar} disabled={enviando}
            style={{ ...spModalSolid, background: enviando ? '#9DB3A4' : '#1E4D2B' }}>
            {enviando ? 'Aplicando…' : 'Sí, marcar aplicada'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: rechazar (motivo) ───────────────────────────────────────────────
function SpRechazarModal({ sol, enviando, onClose, onConfirmar }) {
  const [motivo, setMotivo] = React.useState('');
  React.useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' && !enviando) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enviando, onClose]);
  return (
    <div onClick={e => e.target === e.currentTarget && !enviando && onClose()} style={spScrim}>
      <div role="dialog" aria-modal="true" style={{ width: '100%', maxWidth: 460, background: 'var(--surface)', borderRadius: 'var(--r-lg, 12px)', boxShadow: '0 24px 64px rgba(0,0,0,0.32)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Rechazar solicitud</div>
          <div style={{ fontFamily: 'var(--f-serif)', fontSize: 19, fontWeight: 600, color: 'var(--ink)', marginTop: 2, lineHeight: 1.2 }}>
            {sol.estudiante_nombre} · {sol.numero_comprobante}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.5 }}>
            El asesor verá que la solicitud fue rechazada. Explicá el motivo para que pueda corregir y reenviar.
          </div>
        </div>
        <div style={{ padding: '16px 22px 4px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>Motivo</div>
          <textarea value={motivo} onChange={e => setMotivo(e.target.value)} disabled={enviando} rows={3}
            placeholder="Ej.: Comprobante ilegible / el monto no coincide con BDBANCARIO."
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', background: 'var(--surface)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }} />
        </div>
        <div style={{ padding: '14px 22px 18px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
          <button type="button" onClick={() => !enviando && onClose()} disabled={enviando} style={spModalGhost}>Cancelar</button>
          <button type="button" onClick={() => onConfirmar(motivo.trim())} disabled={enviando || !motivo.trim()}
            style={{ ...spModalSolid, background: (enviando || !motivo.trim()) ? '#C2A9A4' : '#7A1F15' }}>
            {enviando ? 'Rechazando…' : 'Rechazar solicitud'}
          </button>
        </div>
      </div>
    </div>
  );
}

const spScrim = {
  position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(20,16,12,0.55)',
  backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
};
const spModalGhost = {
  padding: '10px 16px', background: 'transparent', border: '1.5px solid var(--line-2, var(--line))',
  color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'inherit',
};
const spModalSolid = {
  padding: '10px 18px', border: 'none', color: '#FFF', fontSize: 13, fontWeight: 700,
  borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'inherit',
};

Object.assign(window, { SolicitudesPagoView });
