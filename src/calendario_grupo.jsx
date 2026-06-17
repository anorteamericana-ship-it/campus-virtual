/* global React, CronogramaGrupo, AdminEstudiantesView */
// CALGRUPO_F1_20260616_PANEL_NUEVO
// Panel nuevo de transición: fusiona el calendario operativo con acceso rápido
// a estudiantes del grupo y Auditoría Académica, sin borrar las vistas viejas.
// Fase 1 = visual/routing solamente. No toca backend ni Apps Script.

function CalendarioGrupoOperativo({ rol = 'superadmin', onNavigate }) {
  const [grupoSeleccionado, setGrupoSeleccionado] = React.useState(null);
  const [mostrarEstudiantes, setMostrarEstudiantes] = React.useState(false);

  const irAuditoria = React.useCallback(() => {
    if (onNavigate) onNavigate('auditoria_academica');
  }, [onNavigate]);

  const handleNavigateFromCronograma = React.useCallback((target, opts = {}) => {
    // En la vista vieja, el modal de una clase usa onNavigate('estudiantes', { grupo }).
    // En este panel nuevo interceptamos esa navegación para cargar estudiantes abajo,
    // manteniendo al usuario dentro de Calendario de Grupo.
    if (target === 'estudiantes' && opts && opts.grupo) {
      setGrupoSeleccionado(opts.grupo);
      setMostrarEstudiantes(true);
      setTimeout(() => {
        const el = document.getElementById('calgrupo-estudiantes-panel');
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      return;
    }
    if (onNavigate) onNavigate(target, opts);
  }, [onNavigate]);

  return (
    <section data-screen-label="Calendario de Grupo · Fase 1" style={{ padding: 24 }}>
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:18,
        marginBottom:18, flexWrap:'wrap',
      }}>
        <div style={{ minWidth:260 }}>
          <div style={{
            fontSize:10, fontWeight:800, letterSpacing:'0.22em', textTransform:'uppercase',
            color:'var(--ink-3)', marginBottom:6,
          }}>
            Centro operativo · calendario vivo
          </div>
          <h1 style={{
            fontFamily:'var(--f-serif)', fontWeight:500, letterSpacing:'-0.03em',
            fontSize:34, lineHeight:1.05, margin:'0 0 6px', color:'var(--ink)',
          }}>
            Calendario de Grupo
          </h1>
          <div style={{ fontSize:13, color:'var(--ink-2)', lineHeight:1.45, maxWidth:720 }}>
            Panel nuevo para comparar y evolucionar: calendario arriba, grupo seleccionado y estudiantes abajo.
            Esta fase no cambia datos, CONAPE, certificados ni Apps Script.
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
        display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:12,
        marginBottom:18,
      }}>
        <CalGrupoHint
          n="1"
          title="Calendario vivo"
          text="Usa la misma fuente del cronograma: si una clase se suspende o se mueve, la vista se actualiza por lección."
        />
        <CalGrupoHint
          n="2"
          title="Grupo seleccionado"
          text="Desde una clase podés cargar estudiantes del grupo sin salir de esta pantalla."
        />
        <CalGrupoHint
          n="3"
          title="Auditoría conectada"
          text="Botón preparado para abrir Auditoría Académica desde el flujo operativo."
        />
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
              Mantenemos la vista actual para comparación; la siguiente fase agranda casillas y limpia la lectura.
            </div>
          </div>
          <div style={{ fontSize:11, color:'var(--ink-3)', fontWeight:700 }}>
            Tip: abrí una clase y tocá “Ver estudiantes de este grupo”.
          </div>
        </div>
        <div style={{ padding: 18 }}>
          <CronogramaGrupo rol={rol} onNavigate={handleNavigateFromCronograma} />
        </div>
      </div>

      <div id="calgrupo-estudiantes-panel" style={{
        background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--r-lg)',
        boxShadow:'var(--sh-1)', overflow:'hidden',
      }}>
        <div style={{
          padding:'14px 18px', borderBottom:'1px solid var(--line)',
          background: grupoSeleccionado
            ? 'linear-gradient(135deg, var(--an-navy), #123A73)'
            : 'linear-gradient(180deg, #fff, var(--surface-2))',
          color: grupoSeleccionado ? 'white' : 'var(--ink)',
          display:'flex', justifyContent:'space-between', alignItems:'center', gap:14, flexWrap:'wrap',
        }}>
          <div>
            <div style={{
              fontSize:10, fontWeight:800, letterSpacing:'0.16em', textTransform:'uppercase',
              opacity: grupoSeleccionado ? 0.78 : 1,
              color: grupoSeleccionado ? 'rgba(255,255,255,0.78)' : 'var(--ink-3)',
            }}>
              Estudiantes del grupo
            </div>
            <div style={{
              fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, letterSpacing:'-0.02em',
              marginTop:2,
            }}>
              {grupoSeleccionado ? grupoSeleccionado : 'Seleccioná un grupo desde el calendario'}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            {grupoSeleccionado && (
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
              border: grupoSeleccionado ? '1px solid rgba(255,255,255,0.35)' : '1px solid var(--line)',
              background: grupoSeleccionado ? 'rgba(255,255,255,0.10)' : 'var(--surface)',
              color: grupoSeleccionado ? 'white' : 'var(--ink-2)',
              fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
            }}>
              Auditoría
            </button>
          </div>
        </div>

        {!grupoSeleccionado ? (
          <div style={{ padding:'34px 24px', textAlign:'center', color:'var(--ink-3)' }}>
            <div style={{ fontSize:30, marginBottom:8, opacity:0.55 }}>🗓️</div>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--ink)', marginBottom:4 }}>
              Todavía no hay grupo cargado abajo
            </div>
            <div style={{ fontSize:13, lineHeight:1.5 }}>
              Abrí una clase en el calendario y usá el botón <strong>Ver estudiantes de este grupo</strong>.
              En la siguiente fase haremos que la selección sea más directa.
            </div>
          </div>
        ) : mostrarEstudiantes ? (
          <div style={{ background:'var(--bg)', borderTop:'1px solid var(--line)' }}>
            <AdminEstudiantesView onNavigate={onNavigate} grupoInicial={grupoSeleccionado} />
          </div>
        ) : (
          <div style={{ padding:'22px 24px', color:'var(--ink-2)', fontSize:13, lineHeight:1.55 }}>
            Grupo listo para cargar estudiantes. Usá <strong>Mostrar estudiantes</strong> para abrir la radiografía actual sin salir de Calendario de Grupo.
          </div>
        )}
      </div>
    </section>
  );
}

function CalGrupoHint({ n, title, text }) {
  return (
    <div style={{
      padding:'12px 14px', border:'1px solid var(--line)', borderRadius:'var(--r-md)',
      background:'var(--surface)', display:'flex', gap:12, alignItems:'flex-start',
      minHeight:86,
    }}>
      <div style={{
        width:28, height:28, borderRadius:'50%', flexShrink:0,
        background:'var(--an-gold)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:12, fontWeight:900, fontFamily:'var(--f-mono)',
      }}>{n}</div>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:800, color:'var(--ink)', marginBottom:3 }}>{title}</div>
        <div style={{ fontSize:11.5, color:'var(--ink-3)', lineHeight:1.45 }}>{text}</div>
      </div>
    </div>
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
