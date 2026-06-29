/* global React, CronogramaGrupo, AdminEstudiantesView, AdminEstudianteResumenIndividual */
// F98.4-Z6-AH · Calendario académico Super Admin · hotfix aperturas/carga estudiantes
// - Calendario superior permanente.
// - Selección de grupo desde cualquier lección.
// - Vista de grupo inicia en "Vista previa antes de aprobar o reprobar".
// - Buscador individual global que sustituye únicamente el panel inferior.

function calGrupoNormAG(v) {
  return String(v == null ? '' : v)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toLowerCase();
}

async function calGrupoPostAG(fn, payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const r = await fetch(`${window.APPS_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type':'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...payload }),
  });
  return await r.json();
}

function CalendarioGrupoOperativo({ rol = 'superadmin', onNavigate }) {
  const [grupoSeleccionado, setGrupoSeleccionado] = React.useState(null);
  const [mostrarEstudiantes, setMostrarEstudiantes] = React.useState(false);
  const [busqueda, setBusqueda] = React.useState('');
  const [padron, setPadron] = React.useState(null);
  const [buscando, setBuscando] = React.useState(false);
  const [errorBusqueda, setErrorBusqueda] = React.useState('');
  const [estudianteSeleccionado, setEstudianteSeleccionado] = React.useState(null);
  const [resultadosAbiertos, setResultadosAbiertos] = React.useState(false);

  const irAuditoria = React.useCallback(() => {
    if (onNavigate) onNavigate('auditoria_academica');
  }, [onNavigate]);

  const scrollPanel = React.useCallback((behavior = 'smooth') => {
    // El drawer del calendario bloquea temporalmente el scroll del body.
    // Esperar a que se desmonte y a que React pinte el panel inferior evita
    // que el click parezca no hacer nada.
    const mover = () => {
      const el = document.getElementById('calgrupo-estudiantes-panel');
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior, block:'start' });
    };
    requestAnimationFrame(() => requestAnimationFrame(mover));
    setTimeout(mover, 260);
  }, []);

  React.useEffect(() => {
    if ((grupoSeleccionado && mostrarEstudiantes) || estudianteSeleccionado) {
      scrollPanel('smooth');
    }
  }, [grupoSeleccionado, mostrarEstudiantes, estudianteSeleccionado, scrollPanel]);

  const handleNavigateFromCronograma = React.useCallback((target, opts = {}) => {
    if (target === 'estudiantes' && opts && opts.grupo) {
      setGrupoSeleccionado(opts.grupo);
      setMostrarEstudiantes(true);
      setEstudianteSeleccionado(null);
      setBusqueda('');
      setResultadosAbiertos(false);
      return;
    }
    if (onNavigate) onNavigate(target, opts);
  }, [onNavigate, scrollPanel]);

  React.useEffect(() => {
    const q = calGrupoNormAG(busqueda);
    if (q.length < 2 || padron || buscando) return;
    const timer = setTimeout(() => {
      setBuscando(true);
      setErrorBusqueda('');
      calGrupoPostAG('getTodosEstudiantes')
        .then(d => {
          if (d && d.ok && Array.isArray(d.estudiantes)) setPadron(d.estudiantes);
          else setErrorBusqueda((d && d.error) || 'No se pudo cargar el padrón de estudiantes.');
        })
        .catch(e => setErrorBusqueda('Error de conexión: ' + (e?.message || e)))
        .finally(() => setBuscando(false));
    }, 220);
    return () => clearTimeout(timer);
  }, [busqueda, padron, buscando]);

  const resultados = React.useMemo(() => {
    const q = calGrupoNormAG(busqueda);
    if (q.length < 2 || !Array.isArray(padron)) return [];
    return padron.filter(e => {
      const hay = [e.nombre, e.display, e.codigo, e.cedula, e.email, e.telefono, e.grupo]
        .some(v => calGrupoNormAG(v).includes(q));
      return hay;
    }).slice(0, 10);
  }, [busqueda, padron]);

  const elegirEstudiante = React.useCallback((est) => {
    setEstudianteSeleccionado(est);
    setBusqueda(est?.nombre || est?.display || est?.codigo || '');
    setResultadosAbiertos(false);
    setMostrarEstudiantes(false);
  }, []);

  const limpiarFicha = React.useCallback(() => {
    setEstudianteSeleccionado(null);
    setBusqueda('');
    setResultadosAbiertos(false);
    if (grupoSeleccionado) setMostrarEstudiantes(true);
  }, [grupoSeleccionado]);

  const panelTitulo = estudianteSeleccionado
    ? (estudianteSeleccionado.nombre || estudianteSeleccionado.display || estudianteSeleccionado.codigo)
    : (grupoSeleccionado || 'Seleccioná un grupo desde el calendario');

  return (
    <section data-screen-label="Calendario de Grupo" style={{ padding:24 }}>
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:18,
        marginBottom:18, flexWrap:'wrap',
      }}>
        <div style={{ minWidth:260 }}>
          <div style={{
            fontSize:10, fontWeight:800, letterSpacing:'0.22em', textTransform:'uppercase',
            color:'var(--ink-3)', marginBottom:6,
          }}>
            Centro operativo · calendario académico
          </div>
          <h1 style={{
            fontFamily:'var(--f-serif)', fontWeight:500, letterSpacing:'-0.03em',
            fontSize:36, lineHeight:1.05, margin:'0 0 6px', color:'var(--ink)',
          }}>
            Calendario de Grupo
          </h1>
          <div style={{ fontSize:13.5, color:'var(--ink-2)', lineHeight:1.5, maxWidth:820 }}>
            Tocá cualquier lección para seleccionar todas las fechas visibles del mismo grupo.
            Las aperturas B1 proyectadas aparecen en naranja en cada día de su horario hasta la fecha de inicio.
          </div>
        </div>

        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          {grupoSeleccionado && (
            <div style={{
              padding:'8px 12px', borderRadius:'var(--r-pill)',
              background:'color-mix(in srgb, var(--an-navy) 9%, white)',
              border:'1px solid color-mix(in srgb, var(--an-navy) 18%, white)',
              color:'var(--an-navy-ink)', fontSize:12, fontWeight:800,
              fontFamily:'var(--f-mono)',
            }}>
              Grupo activo · {grupoSeleccionado}
            </div>
          )}
          <button type="button" onClick={irAuditoria} style={{
            display:'inline-flex', alignItems:'center', gap:8,
            padding:'9px 14px', borderRadius:'var(--r-md)',
            border:'1px solid var(--line)', background:'var(--surface)',
            color:'var(--ink-2)', fontSize:12, fontWeight:800,
            cursor:'pointer', fontFamily:'inherit',
          }}>
            <IconMiniAudit />
            Abrir Auditoría Académica
          </button>
        </div>
      </div>

      <div style={{
        background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--r-lg)',
        boxShadow:'var(--sh-1)', overflow:'hidden', marginBottom:22,
      }}>
        <div style={{
          padding:'12px 16px', borderBottom:'1px solid var(--line)',
          display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap',
          background:'linear-gradient(180deg, #fff, var(--surface-2))',
        }}>
          <div>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--ink-3)' }}>
              Vista calendario
            </div>
            <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:2 }}>
              Lecciones sólidas, selección completa por grupo y aperturas B1 visibles cada semana.
            </div>
          </div>
          <div style={{ fontSize:11, color:'var(--ink-3)', fontWeight:700 }}>
            Tocá una lección para abrir el grupo o revisar su detalle.
          </div>
        </div>
        <div style={{ padding:14 }}>
          <CronogramaGrupo rol={rol} onNavigate={handleNavigateFromCronograma} />
        </div>
      </div>

      <div id="calgrupo-estudiantes-panel" style={{
        background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--r-lg)',
        boxShadow:'var(--sh-1)', overflow:'visible',
      }}>
        <div style={{
          padding:'14px 18px', borderBottom:'1px solid var(--line)',
          background: (grupoSeleccionado || estudianteSeleccionado)
            ? 'linear-gradient(135deg, var(--an-navy), #123A73)'
            : 'linear-gradient(180deg, #fff, var(--surface-2))',
          color: (grupoSeleccionado || estudianteSeleccionado) ? 'white' : 'var(--ink)',
          display:'flex', justifyContent:'space-between', alignItems:'center', gap:14, flexWrap:'wrap',
          borderRadius:'var(--r-lg) var(--r-lg) 0 0',
        }}>
          <div>
            <div style={{
              fontSize:10, fontWeight:800, letterSpacing:'0.16em', textTransform:'uppercase',
              color:(grupoSeleccionado || estudianteSeleccionado) ? 'rgba(255,255,255,0.78)' : 'var(--ink-3)',
            }}>
              {estudianteSeleccionado ? 'Ficha individual' : 'Estudiantes del grupo'}
            </div>
            <div style={{
              fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, letterSpacing:'-0.02em', marginTop:2,
            }}>
              {panelTitulo}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            {estudianteSeleccionado && (
              <button type="button" onClick={limpiarFicha} style={{
                padding:'8px 12px', borderRadius:'var(--r-md)', border:'1px solid rgba(255,255,255,.35)',
                background:'rgba(255,255,255,.10)', color:'white', fontSize:12, fontWeight:800, cursor:'pointer',
              }}>Volver al grupo</button>
            )}
            {grupoSeleccionado && !estudianteSeleccionado && (
              <button type="button" onClick={() => setMostrarEstudiantes(v => !v)} style={{
                padding:'8px 12px', borderRadius:'var(--r-md)',
                border:'1px solid rgba(255,255,255,0.35)',
                background:'rgba(255,255,255,0.10)', color:'white',
                fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
              }}>
                {mostrarEstudiantes ? 'Ocultar estudiantes' : 'Mostrar estudiantes'}
              </button>
            )}
            <button type="button" onClick={irAuditoria} style={{
              padding:'8px 12px', borderRadius:'var(--r-md)',
              border:(grupoSeleccionado || estudianteSeleccionado) ? '1px solid rgba(255,255,255,0.35)' : '1px solid var(--line)',
              background:(grupoSeleccionado || estudianteSeleccionado) ? 'rgba(255,255,255,0.10)' : 'var(--surface)',
              color:(grupoSeleccionado || estudianteSeleccionado) ? 'white' : 'var(--ink-2)',
              fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
            }}>Auditoría</button>
          </div>
        </div>

        <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--line)', background:'linear-gradient(180deg,#fff,#fbfaf8)', position:'relative', zIndex:5 }}>
          <div style={{ display:'grid', gridTemplateColumns:'minmax(260px,1fr) auto', gap:10, alignItems:'center' }}>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-3)', fontSize:14 }}>🔎</span>
              <input
                value={busqueda}
                onChange={e => {
                  const value = e.target.value;
                  setBusqueda(value);
                  setResultadosAbiertos(true);
                  if (!value) {
                    setEstudianteSeleccionado(null);
                    if (grupoSeleccionado) setMostrarEstudiantes(true);
                  }
                }}
                onFocus={() => setResultadosAbiertos(true)}
                placeholder="Buscar estudiante por nombre, código, cédula, correo o teléfono…"
                style={{
                  width:'100%', padding:'11px 12px 11px 38px', borderRadius:10,
                  border:'1px solid var(--line,#ddd)', background:'white', fontSize:13,
                  outline:'none', fontFamily:'inherit', boxShadow:'inset 0 1px 0 rgba(0,0,0,.02)',
                }}
              />
              {resultadosAbiertos && calGrupoNormAG(busqueda).length >= 2 && (
                <div style={{
                  position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:20,
                  background:'white', border:'1px solid var(--line,#ddd)', borderRadius:10,
                  boxShadow:'0 16px 32px rgba(20,33,61,.16)', maxHeight:320, overflowY:'auto',
                }}>
                  {buscando ? (
                    <div style={{ padding:14, color:'var(--ink-3)', fontSize:12 }}>Cargando padrón…</div>
                  ) : errorBusqueda ? (
                    <div style={{ padding:14, color:'#C62828', fontSize:12, fontWeight:700 }}>{errorBusqueda}</div>
                  ) : resultados.length ? resultados.map(est => (
                    <button key={est.codigo} type="button" onMouseDown={e => { e.preventDefault(); elegirEstudiante(est); }} style={{
                      width:'100%', padding:'10px 12px', border:'none', borderBottom:'1px solid #F0ECE7',
                      background:'white', cursor:'pointer', textAlign:'left', display:'grid',
                      gridTemplateColumns:'1fr auto', gap:10, alignItems:'center', fontFamily:'inherit',
                    }}>
                      <div>
                        <div style={{ fontSize:12.5, fontWeight:900, color:'var(--an-navy,#14213D)' }}>{est.nombre || est.display || 'Sin nombre'}</div>
                        <div style={{ marginTop:2, fontSize:10.5, color:'var(--ink-3,#888)' }}>{est.codigo} · {est.cedula || 'sin cédula'} · {est.grupo || 'sin grupo'}</div>
                      </div>
                      <span style={{ fontSize:10, fontWeight:900, color:'var(--ink-3,#888)' }}>{est.nivel_actual || '—'}</span>
                    </button>
                  )) : (
                    <div style={{ padding:14, color:'var(--ink-3)', fontSize:12 }}>No encontré estudiantes con ese dato.</div>
                  )}
                </div>
              )}
            </div>
            {(busqueda || estudianteSeleccionado) && (
              <button type="button" onClick={limpiarFicha} style={{
                padding:'10px 13px', borderRadius:10, border:'1px solid var(--line,#ddd)',
                background:'white', color:'var(--ink-2)', fontWeight:800, cursor:'pointer',
              }}>Limpiar</button>
            )}
          </div>
          <div style={{ marginTop:6, fontSize:10.5, color:'var(--ink-3,#888)' }}>
            La búsqueda abre una sola ficha con Básico I, Básico II, Intermedio I e Intermedio II. Pagos se muestran únicamente como MOROSO SÍ/NO.
          </div>
        </div>

        {estudianteSeleccionado ? (
          <AdminEstudianteResumenIndividual estudianteBase={estudianteSeleccionado} onClose={limpiarFicha} />
        ) : !grupoSeleccionado ? (
          <div style={{ padding:'34px 24px', textAlign:'center', color:'var(--ink-3)' }}>
            <div style={{ fontSize:30, marginBottom:8, opacity:.55 }}>🗓️</div>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--ink)', marginBottom:4 }}>Seleccioná un grupo o buscá un estudiante</div>
            <div style={{ fontSize:13, lineHeight:1.5 }}>
              Abrí una clase y usá <strong>Ver estudiantes de este grupo</strong>, o buscá directamente a una persona arriba.
            </div>
          </div>
        ) : mostrarEstudiantes ? (
          <div style={{ background:'var(--bg)', borderTop:'1px solid var(--line)' }}>
            <AdminEstudiantesView
              key={`calgrupo-${grupoSeleccionado}`}
              onNavigate={onNavigate}
              grupoInicial={grupoSeleccionado}
              modo="calgrupo"
            />
          </div>
        ) : (
          <div style={{ padding:'22px 24px', color:'var(--ink-2)', fontSize:13, lineHeight:1.55 }}>
            Grupo listo. Usá <strong>Mostrar estudiantes</strong> para cargar directamente la vista previa de cierre académico.
          </div>
        )}
      </div>
    </section>
  );
}

function IconMiniAudit() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
      <path d="M9 9h1" />
    </svg>
  );
}

Object.assign(window, { CalendarioGrupoOperativo });
