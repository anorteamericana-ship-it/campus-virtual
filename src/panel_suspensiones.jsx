/* global React, fetchGetSolicitudesSuspension, fetchResolverSolicitudSuspension */

// ─────────────────────────────────────────────────────────────────
// PanelSuspensiones — Solicitudes de suspensión o reprogramación (admin)
// Lista PENDIENTES (default), aprueba o rechaza. La aprobación
// aplica la suspensión o mueve una lección a un espacio libre validado.
// ─────────────────────────────────────────────────────────────────

const PSU_NIVEL = { B1:'#E5A823', B2:'#E8372A', I1:'#2B7FC1', I2:'#4CAF50' };
const PSU_NIVEL_INK = { B1:'#9A6A00', B2:'#8B1A10', I1:'#0D47A1', I2:'#1B5E20' };
const PSU_MES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function psuFmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2,'0')} ${PSU_MES[d.getMonth()]} ${d.getFullYear()}`;
}
function psuFmtTs(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2,'0')}/${PSU_MES[d.getMonth()]} ${
    String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function PanelSuspensiones() {
  const adminNombre = React.useMemo(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem('an_usuario') || 'null');
      return u?.nombre || 'admin';
    } catch { return 'admin'; }
  }, []);

  const [estado, setEstado]       = React.useState('PENDIENTE');
  const [lista, setLista]         = React.useState([]);
  const [cargando, setCargando]   = React.useState(true);
  const [err, setErr]             = React.useState('');
  const [resolviendo, setResolviendo] = React.useState(null); // {id, accion} | null
  const [confirmAprobar, setConfirmAprobar] = React.useState(null); // sol | null
  const [modalRechazar, setModalRechazar]   = React.useState(null); // sol | null
  const [toast, setToast]         = React.useState(null);

  const showToast = React.useCallback((msg, kind = 'ok') => {
    const t = { msg, kind, ts: Date.now() };
    setToast(t);
    setTimeout(() => setToast(cur => (cur && cur.ts === t.ts ? null : cur)), 4200);
  }, []);

  const refrescar = React.useCallback(() => {
    setCargando(true); setErr('');
    window.fetchGetSolicitudesSuspension(estado)
      .then(r => {
        if (!r?.ok) {
          setErr(r?.error || 'No se pudo cargar la cola.');
          setLista([]);
          return;
        }
        setLista(r.solicitudes || []);
      })
      .catch(e => { setErr('Error de red: ' + e.message); setLista([]); })
      .finally(() => setCargando(false));
  }, [estado]);

  React.useEffect(() => { refrescar(); }, [refrescar]);

  const handleAprobar = async (sol) => {
    setResolviendo({ id: sol.id, accion: 'aprobar' });
    const res = await window.fetchResolverSolicitudSuspension({
      id: sol.id,
      accion: 'aprobar',
      resuelto_por: adminNombre,
      nota_resolucion: '',
    });
    setResolviendo(null);
    setConfirmAprobar(null);
    if (!res?.ok) {
      showToast(res?.error || 'No se pudo aprobar la solicitud.', 'err');
      return;
    }
    setLista(prev => prev.filter(s => s.id !== sol.id));
    const mensaje = res.cambio?.mensaje || res.suspension?.mensaje || res.mensaje || 'Cambio aprobado y aplicado.';
    showToast(`Aplicada · ${mensaje}`, 'ok');
  };

  const handleRechazar = async (sol, nota) => {
    setResolviendo({ id: sol.id, accion: 'rechazar' });
    const res = await window.fetchResolverSolicitudSuspension({
      id: sol.id,
      accion: 'rechazar',
      resuelto_por: adminNombre,
      nota_resolucion: nota || '',
    });
    setResolviendo(null);
    setModalRechazar(null);
    if (!res?.ok) {
      showToast(res?.error || 'No se pudo rechazar la solicitud.', 'err');
      return;
    }
    setLista(prev => prev.filter(s => s.id !== sol.id));
    showToast('Rechazada · el calendario no cambió.', 'ok');
  };

  const total = lista.length;

  return (
    <div className="page" style={{ padding:'28px 32px 60px', maxWidth:1100, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:18, flexWrap:'wrap', marginBottom:22 }}>
        <div style={{ flex:1, minWidth:240 }}>
          <div style={{
            fontSize:11, fontWeight:700, letterSpacing:'0.14em',
            textTransform:'uppercase', color:'var(--ink-3)', marginBottom:6,
          }}>Calendario · Operaciones</div>
          <h1 style={{
            fontFamily:'var(--f-serif)', fontWeight:500, letterSpacing:'-0.02em',
            fontSize:32, lineHeight:1.05, margin:0, color:'var(--ink)',
          }}>Suspensión o reprogramación</h1>
          <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:8, maxWidth:560 }}>
            Los docentes pueden solicitar suspender una clase o mover una lección a un espacio libre. La aprobación valida choques, orden académico y duración antes de modificar el calendario.
          </div>
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <FiltroEstado value={estado} onChange={setEstado} cargando={cargando} />
          <button type="button" onClick={refrescar} disabled={cargando}
            style={{
              padding:'9px 14px',
              background:'var(--surface)',
              border:'1.5px solid var(--ink)',
              color:'var(--ink)',
              fontSize:12, fontWeight:700,
              borderRadius:'var(--r-md)',
              cursor: cargando ? 'wait' : 'pointer',
              letterSpacing:'0.04em',
              fontFamily:'inherit',
              display:'inline-flex', alignItems:'center', gap:6,
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                 style={{ animation: cargando ? 'an-spin .8s linear infinite' : 'none' }}>
              <path d="M3 12a9 9 0 0 1 15.5-6.5L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.5L3 16M3 21v-5h5"/>
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',
        gap:14, marginBottom:22,
      }}>
        <Stat
          label={`${estado.charAt(0)}${estado.slice(1).toLowerCase()}${estado === 'TODAS' ? '' : 's'}`}
          num={cargando ? '—' : total}
          tone={estado === 'PENDIENTE' ? 'alert' : undefined}
        />
        <div style={{
          padding:'14px 16px', borderRadius:'var(--r-md)',
          background:'#FFF8E1', border:'1px dashed #B7791F',
          fontSize:11, color:'#7A4F00', lineHeight:1.5,
        }}>
          <b>Aprobar</b> aplica el tipo solicitado: suspensión desplaza el patrón; reprogramación mueve solo la lección seleccionada. Toda acción queda registrada.
        </div>
      </div>

      {/* Cola */}
      {cargando ? (
        <LoadingState variant="skeleton" />
      ) : err ? (
        <div style={{
          padding:'18px 16px', background:'#FDECEA',
          border:'1px solid #F5C2BD', borderRadius:'var(--r-md)',
          color:'#8B1A10', fontSize:13, fontWeight:600,
        }}>⚠ {err}</div>
      ) : total === 0 ? (
        <EmptyCola estado={estado} />
      ) : (
        <ul style={{ listStyle:'none', margin:0, padding:0,
          display:'flex', flexDirection:'column', gap:14 }}>
          {lista.map(sol => (
            <TarjetaSolicitud
              key={sol.id}
              sol={sol}
              resolviendo={resolviendo}
              onAprobar={() => setConfirmAprobar(sol)}
              onRechazar={() => setModalRechazar(sol)}
            />
          ))}
        </ul>
      )}

      {/* Modal: confirmar APROBAR */}
      {confirmAprobar && (
        <ModalConfirmarAprobar
          sol={confirmAprobar}
          enviando={resolviendo?.accion === 'aprobar'}
          onCerrar={() => resolviendo?.accion !== 'aprobar' && setConfirmAprobar(null)}
          onConfirmar={() => handleAprobar(confirmAprobar)}
        />
      )}

      {/* Modal: nota de RECHAZO */}
      {modalRechazar && (
        <ModalRechazar
          sol={modalRechazar}
          enviando={resolviendo?.accion === 'rechazar'}
          onCerrar={() => resolviendo?.accion !== 'rechazar' && setModalRechazar(null)}
          onConfirmar={(nota) => handleRechazar(modalRechazar, nota)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div role="status" style={{
          position:'fixed', bottom:24, right:24, zIndex:1300,
          background: toast.kind === 'err' ? '#7A1F15' : '#1E4D2B',
          color:'#FFF',
          padding:'12px 16px',
          borderRadius:'var(--r-md)',
          boxShadow:'0 12px 32px rgba(0,0,0,0.32)',
          fontSize:13, fontWeight:600,
          maxWidth:420, lineHeight:1.4,
          animation:'an-fade-in .14s ease-out',
        }}>{toast.msg}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
function FiltroEstado({ value, onChange, cargando }) {
  const opciones = ['PENDIENTE', 'APLICADA', 'RECHAZADA', 'TODAS'];
  return (
    <div style={{
      display:'inline-flex', gap:0,
      border:'1.5px solid var(--line)',
      borderRadius:'var(--r-md)',
      background:'var(--surface)',
      overflow:'hidden',
    }}>
      {opciones.map(o => {
        const activo = o === value;
        return (
          <button key={o} type="button"
            onClick={() => !cargando && onChange(o)}
            disabled={cargando}
            style={{
              padding:'9px 12px',
              background: activo ? 'var(--ink)' : 'transparent',
              border:'none',
              color: activo ? '#FFF' : 'var(--ink-2)',
              fontSize:11, fontWeight:700,
              letterSpacing:'0.06em',
              textTransform:'uppercase',
              cursor: cargando ? 'wait' : 'pointer',
              fontFamily:'inherit',
            }}>{o}</button>
        );
      })}
    </div>
  );
}

// (ColaSkeleton y skLine eliminados — usa <LoadingState variant="skeleton"/>.)

function EmptyCola({ estado }) {
  return (
    <div style={{
      padding:'40px 20px', textAlign:'center',
      background:'var(--surface)',
      border:'1px dashed var(--line-2, var(--line))',
      borderRadius:'var(--r-md)',
    }}>
      <div style={{ fontSize:34, opacity:0.4, marginBottom:8 }}>✓</div>
      <div style={{
        fontFamily:'var(--f-serif)', fontSize:18, color:'var(--ink)',
        fontWeight:500, letterSpacing:'-0.015em',
      }}>
        {estado === 'PENDIENTE'
          ? 'No hay solicitudes pendientes.'
          : `Sin solicitudes ${estado.toLowerCase()}.`}
      </div>
      <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:6 }}>
        Cuando un docente solicite suspensión o reprogramación aparecerá acá.
      </div>
    </div>
  );
}

// ── Tarjeta ────────────────────────────────────────────────────────────
function TarjetaSolicitud({ sol, onAprobar, onRechazar, resolviendo }) {
  const nivel = sol.nivel || '';
  const c     = PSU_NIVEL[nivel] || '#777';
  const ink   = PSU_NIVEL_INK[nivel] || 'var(--ink)';
  const esICAN= (sol.riel || 'curso') === 'ican';
  const esReprogramacion = String(sol.tipo || '').toUpperCase() === 'REPROGRAMACION';
  const isPendiente = sol.estado === 'PENDIENTE';
  const bloqueado = !!resolviendo && resolviendo.id === sol.id;

  return (
    <li style={{
      padding:18,
      background:'var(--surface)',
      border:'1px solid var(--line)',
      borderLeft:`5px solid ${c}`,
      borderRadius:'var(--r-md)',
      display:'grid',
      gridTemplateColumns:'1fr auto',
      gap:'14px 22px',
      alignItems:'start',
    }}>
      <div style={{ minWidth:0 }}>
        {/* Encabezado */}
        <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:8 }}>
          <span style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'3px 9px',
            background:`${c}18`, border:`1px solid ${c}55`,
            color: ink,
            borderRadius:'var(--r-pill)',
            fontSize:10, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase',
          }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:c }} />
            {nivel}
          </span>
          <span style={{
            fontFamily:'var(--f-mono)', fontSize:11, color:'var(--ink-3)',
            letterSpacing:'0.04em',
          }}>{sol.cod_grupo}</span>
          <span style={{ fontSize:11, color:'var(--ink-3)' }}>·</span>
          <span style={{
            fontFamily:'var(--f-serif)', fontSize:18, fontWeight:600,
            color:'var(--ink)', letterSpacing:'-0.015em',
          }}>
            Lección {String(sol.leccion).padStart(2,'0')}
          </span>
          <span style={{
            padding:'2px 8px',
            background: esReprogramacion ? '#E8F1FD' : '#FFF3CD',
            color: esReprogramacion ? '#0D47A1' : '#7A4F00',
            border:`1px solid ${esReprogramacion ? '#B7D2F3' : '#FFE082'}`,
            fontSize:10, fontWeight:850, letterSpacing:'0.08em',
            borderRadius:'var(--r-pill)', textTransform:'uppercase',
          }}>{esReprogramacion ? 'Reprogramación' : 'Suspensión'}</span>
          {esICAN && (
            <span style={{
              padding:'2px 8px', background:'#4CAF50', color:'#FFF',
              fontSize:10, fontWeight:800, letterSpacing:'0.1em',
              borderRadius:'var(--r-pill)', textTransform:'uppercase',
            }}>I CAN</span>
          )}
          {!isPendiente && (
            <span style={{
              padding:'2px 8px',
              background: sol.estado === 'APLICADA' ? '#E8F5E9' : '#FDECEA',
              color:      sol.estado === 'APLICADA' ? '#2E7D32' : '#8B1A10',
              border:`1px solid ${sol.estado === 'APLICADA' ? '#A5D6A7' : '#F5C2BD'}`,
              fontSize:10, fontWeight:800, letterSpacing:'0.1em',
              borderRadius:'var(--r-pill)', textTransform:'uppercase',
            }}>{sol.estado}</span>
          )}
        </div>

        {/* Motivo */}
        <div style={{
          marginTop:10,
          padding:'10px 12px',
          background:'var(--surface-2)',
          border:'1px solid var(--line)',
          borderRadius:'var(--r-md)',
          fontSize:13, color:'var(--ink)', lineHeight:1.5,
        }}>
          <div style={{
            fontSize:9, fontWeight:700, letterSpacing:'0.14em',
            textTransform:'uppercase', color:'var(--ink-3)', marginBottom:4,
          }}>Motivo</div>
          {sol.motivo || <i style={{ color:'var(--ink-3)' }}>— sin motivo —</i>}
        </div>

        {esReprogramacion && (
          <div style={{
            marginTop:10, padding:'10px 12px', background:'#F5F9FF',
            border:'1px solid #B7D2F3', borderRadius:'var(--r-md)',
            display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'center',
          }}>
            <div>
              <div style={{ fontSize:9, fontWeight:750, letterSpacing:'0.14em', textTransform:'uppercase', color:'#0D47A1' }}>Nueva fecha</div>
              <div style={{ fontSize:13, fontWeight:750, marginTop:3 }}>{psuFmt(sol.fecha_destino)}</div>
            </div>
            <div style={{ fontFamily:'var(--f-mono)', fontSize:12, fontWeight:800, color:'#0D47A1' }}>
              {sol.hora_destino_inicio || '—'}–{sol.hora_destino_fin || '—'}
            </div>
          </div>
        )}

        {/* Meta */}
        <div style={{
          marginTop:10, display:'flex', flexWrap:'wrap', gap:'4px 18px',
          fontSize:11, color:'var(--ink-3)',
        }}>
          <span>Solicitante: <b style={{ color:'var(--ink-2)' }}>{sol.solicitante || '—'}</b></span>
          <span>Solicitada: <b style={{ color:'var(--ink-2)', fontFamily:'var(--f-mono)' }}>{psuFmtTs(sol.fecha)}</b></span>
          <span>Riel: <b style={{ color:'var(--ink-2)' }}>{esICAN ? 'I CAN' : 'Curso'}</b></span>
          {!isPendiente && sol.resuelto_por && (
            <span>Resuelto por: <b style={{ color:'var(--ink-2)' }}>{sol.resuelto_por}</b></span>
          )}
        </div>

        {!isPendiente && sol.nota && (
          <div style={{
            marginTop:8, fontSize:11, color:'var(--ink-2)',
            fontStyle:'italic', lineHeight:1.5,
          }}>
            Nota de resolución: "{sol.nota}"
          </div>
        )}
      </div>

      {/* Acciones */}
      {isPendiente && (
        <div style={{
          display:'flex', flexDirection:'column', gap:8,
          alignItems:'stretch', minWidth:160,
        }}>
          <button type="button" onClick={onAprobar} disabled={bloqueado}
            style={{
              padding:'10px 14px',
              background: bloqueado ? '#C9BFB1' : '#1E4D2B',
              border:'none', color:'#FFF',
              fontSize:12, fontWeight:700,
              borderRadius:'var(--r-md)',
              cursor: bloqueado ? 'wait' : 'pointer',
              letterSpacing:'0.06em', textTransform:'uppercase',
              fontFamily:'inherit',
              display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
            }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7"/>
            </svg>
            Aprobar
          </button>
          <button type="button" onClick={onRechazar} disabled={bloqueado}
            style={{
              padding:'10px 14px',
              background:'var(--surface)',
              border:'1.5px solid #7A1F15',
              color:'#7A1F15',
              fontSize:12, fontWeight:700,
              borderRadius:'var(--r-md)',
              cursor: bloqueado ? 'wait' : 'pointer',
              letterSpacing:'0.06em', textTransform:'uppercase',
              fontFamily:'inherit',
              display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
            }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M6 18L18 6"/>
            </svg>
            Rechazar
          </button>
        </div>
      )}
    </li>
  );
}

// ── Modal: confirmar APROBAR (impacto en calendario) ───────────────────
function ModalConfirmarAprobar({ sol, enviando, onCerrar, onConfirmar }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !enviando) onCerrar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enviando, onCerrar]);

  const nivelC = PSU_NIVEL[sol.nivel] || 'var(--ink)';
  const esReprogramacion = String(sol.tipo || '').toUpperCase() === 'REPROGRAMACION';
  const titulo = esReprogramacion
    ? `Aprobar reprogramación de la lección ${String(sol.leccion).padStart(2,'0')}`
    : `Aprobar suspensión de la lección ${String(sol.leccion).padStart(2,'0')}`;

  return (
    <div onClick={(e)=>{ if (e.target === e.currentTarget && !enviando) onCerrar(); }} style={{
      position:'fixed', inset:0, zIndex:4300, background:'rgba(20,16,12,.62)',
      backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:18,
    }}>
      <div role="dialog" aria-modal="true" style={{
        width:'100%', maxWidth:530, background:'var(--surface)', borderRadius:'var(--r-lg,12px)',
        boxShadow:'0 24px 70px rgba(0,0,0,.4)', overflow:'hidden', display:'flex', flexDirection:'column',
      }}>
        <div style={{
          padding:'18px 22px 14px', background:esReprogramacion?'#EEF5FF':'#FFF3CD',
          borderBottom:`1px solid ${esReprogramacion?'#B7D2F3':'#FFE082'}`,
          display:'flex', alignItems:'flex-start', gap:14,
        }}>
          <div style={{
            width:36, height:36, borderRadius:8, background:esReprogramacion?'#0D47A1':'#7A4F00',
            color:'#FFF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>{esReprogramacion?'↻':'!'}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:'.16em', textTransform:'uppercase', color:esReprogramacion?'#0D47A1':'#7A4F00' }}>
              {esReprogramacion ? 'Mover solo esta lección' : 'Desplazar calendario desde esta lección'}
            </div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:19, fontWeight:650, marginTop:2, lineHeight:1.2 }}>
              {titulo}
              <span style={{
                marginLeft:8, padding:'2px 8px', borderRadius:'var(--r-pill)', background:nivelC,
                color:'#FFF', fontSize:10, fontWeight:800, verticalAlign:'middle',
              }}>{sol.nivel}</span>
            </div>
          </div>
        </div>

        <div style={{ padding:'16px 22px', fontSize:13, color:'var(--ink-2)', lineHeight:1.6 }}>
          {esReprogramacion ? (
            <>
              La lección <b>{String(sol.leccion).padStart(2,'0')}</b> del grupo <b style={{fontFamily:'var(--f-mono)'}}>{sol.cod_grupo}</b>{' '}
              se moverá a <b>{psuFmt(sol.fecha_destino)}</b>, de <b>{sol.hora_destino_inicio}</b> a <b>{sol.hora_destino_fin}</b>.
              Las demás fechas permanecen iguales. Antes de aplicar, el sistema volverá a validar duración, orden y choques del grupo/docente.
            </>
          ) : (
            <>
              La lección <b>{String(sol.leccion).padStart(2,'0')}</b> del grupo <b style={{fontFamily:'var(--f-mono)'}}>{sol.cod_grupo}</b>{' '}
              quedará suspendida y todas las lecciones posteriores se moverán al siguiente espacio del patrón. Las 32 lecciones se mantienen.
            </>
          )}

          <div style={{ marginTop:13, padding:'10px 12px', background:'var(--surface-2)', border:'1px solid var(--line)', borderRadius:'var(--r-md)' }}>
            <div style={{ fontSize:9, fontWeight:750, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:4 }}>Motivo del docente</div>
            <div style={{ color:'var(--ink)' }}>{sol.motivo || <i>(sin motivo)</i>}</div>
            <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:6 }}>Solicitante: {sol.solicitante || '—'}</div>
          </div>
        </div>

        <div style={{ padding:'14px 22px 18px', borderTop:'1px solid var(--line)', display:'flex', justifyContent:'flex-end', gap:10 }}>
          <button type="button" disabled={enviando} onClick={() => !enviando && onCerrar()} style={{
            padding:'10px 16px', background:'#FFF', border:'1.5px solid var(--line)', borderRadius:'var(--r-md)', fontFamily:'inherit', cursor:'pointer',
          }}>Cancelar</button>
          <button type="button" disabled={enviando} onClick={onConfirmar} style={{
            padding:'10px 18px', background:enviando?'#C9BFB1':'#1E4D2B', color:'#FFF', border:0,
            borderRadius:'var(--r-md)', fontWeight:800, fontFamily:'inherit', cursor:enviando?'wait':'pointer',
          }}>{enviando ? 'Aplicando…' : (esReprogramacion ? 'Aprobar y reprogramar' : 'Aprobar y suspender')}</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: RECHAZAR (nota opcional) ────────────────────────────────────
function ModalRechazar({ sol, enviando, onCerrar, onConfirmar }) {
  const [nota, setNota] = React.useState('');
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !enviando) onCerrar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enviando, onCerrar]);

  return (
    <div onClick={(e)=>{ if (e.target === e.currentTarget && !enviando) onCerrar(); }}
      style={{
        position:'fixed', inset:0, zIndex:1100,
        background:'rgba(20,16,12,0.55)',
        backdropFilter:'blur(3px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:18,
      }}>
      <div role="dialog" aria-modal="true"
        style={{
          width:'100%', maxWidth:460,
          background:'var(--surface)',
          borderRadius:'var(--r-lg, 12px)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.32)',
          overflow:'hidden',
          display:'flex', flexDirection:'column',
        }}>
        <div style={{
          padding:'18px 22px 14px',
          borderBottom:'1px solid var(--line)',
        }}>
          <div style={{
            fontSize:10, fontWeight:700, letterSpacing:'0.18em',
            textTransform:'uppercase', color:'var(--ink-3)',
          }}>Rechazar solicitud</div>
          <div style={{
            fontFamily:'var(--f-serif)', fontSize:19, fontWeight:600,
            color:'var(--ink)', letterSpacing:'-0.015em',
            marginTop:2, lineHeight:1.2,
          }}>
            Lección {String(sol.leccion).padStart(2,'0')} de {sol.cod_grupo}
          </div>
          <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:6, lineHeight:1.5 }}>
            El calendario no cambia. La solicitud queda marcada como rechazada
            y el docente puede solicitarla de nuevo si fuera necesario.
          </div>
        </div>
        <div style={{ padding:'16px 22px 4px' }}>
          <label style={{ display:'block' }}>
            <div style={{
              fontSize:10, fontWeight:700, letterSpacing:'0.14em',
              textTransform:'uppercase', color:'var(--ink-3)', marginBottom:6,
            }}>Nota de resolución <span style={{ color:'var(--ink-3)', fontWeight:500 }}>(opcional)</span></div>
            <textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              disabled={enviando}
              rows={3}
              placeholder="Ej.: la sede no está realmente cerrada."
              style={{
                width:'100%',
                padding:'10px 12px',
                border:'1.5px solid var(--line)',
                background:'var(--surface)',
                borderRadius:'var(--r-md)',
                fontSize:13, color:'var(--ink)',
                fontFamily:'inherit',
                outline:'none', resize:'vertical',
                boxSizing:'border-box', lineHeight:1.5,
              }}
            />
          </label>
        </div>
        <div style={{
          padding:'14px 22px 18px',
          borderTop:'1px solid var(--line)',
          display:'flex', justifyContent:'flex-end', gap:10, marginTop:12,
        }}>
          <button type="button"
            onClick={() => !enviando && onCerrar()}
            disabled={enviando}
            style={{
              padding:'10px 16px', background:'transparent',
              border:'1.5px solid var(--line-2, var(--line))',
              color:'var(--ink-2)',
              fontSize:13, fontWeight:600,
              borderRadius:'var(--r-md)',
              cursor: enviando ? 'not-allowed' : 'pointer',
              fontFamily:'inherit',
            }}>Cancelar</button>
          <button type="button"
            onClick={() => onConfirmar(nota.trim())}
            disabled={enviando}
            style={{
              padding:'10px 18px',
              background: enviando ? '#C9BFB1' : '#7A1F15',
              border:'none', color:'#FFF',
              fontSize:13, fontWeight:700,
              borderRadius:'var(--r-md)',
              cursor: enviando ? 'not-allowed' : 'pointer',
              fontFamily:'inherit',
              display:'inline-flex', alignItems:'center', gap:8,
            }}>
            {enviando ? 'Rechazando…' : 'Rechazar solicitud'}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PanelSuspensiones });
