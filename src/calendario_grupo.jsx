/* global React, CronogramaGrupo, AdminEstudiantesView */
// CALGRUPO_F11_20260617_MODO_ENFOQUE_CALENDARIO_ESTUDIANTES
// CALGRUPO_F12_20260617_PRIORIDADES_SEMANA_PANEL_EJECUTIVO
// CALGRUPO_F16_20260617_PULIDO_VISUAL_CENTRO_OPERATIVO
// Centro operativo: calendario + grupo activo + estudiantes + auditoría.
// Fase 11 = modo de enfoque visual: completo / solo calendario / solo estudiantes.
// No toca backend ni Apps Script.

const CALGRUPO_RECENT_KEY = 'an_calgrupo_recientes_v1';

function calGrupoInferNivel(codGrupo) {
  const p = String(codGrupo || '').trim().split('-')[0].toUpperCase();
  return ['B1','B2','I1','I2'].includes(p) ? p : '';
}

function calGrupoNormCode(v) {
  return String(v || '').trim().toUpperCase().replace(/\s+/g, '');
}

function calGrupoReadRecent() {
  try {
    const raw = localStorage.getItem(CALGRUPO_RECENT_KEY);
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr.filter(Boolean).slice(0, 8) : [];
  } catch (_) { return []; }
}

function calGrupoSaveRecent(code) {
  const clean = calGrupoNormCode(code);
  if (!clean) return [];
  const next = [clean, ...calGrupoReadRecent().filter(x => x !== clean)].slice(0, 8);
  try { localStorage.setItem(CALGRUPO_RECENT_KEY, JSON.stringify(next)); } catch (_) {}
  return next;
}

function CalendarioGrupoOperativo({ rol = 'superadmin', onNavigate }) {
  const [grupoSeleccionado, setGrupoSeleccionado] = React.useState(null);
  const [mostrarEstudiantes, setMostrarEstudiantes] = React.useState(false);
  const [grupoInput, setGrupoInput] = React.useState('');
  const [recientes, setRecientes] = React.useState(() => calGrupoReadRecent());
  const [copiado, setCopiado] = React.useState(false);
  const [modoVista, setModoVista] = React.useState('completo');
  const [calSnapshot, setCalSnapshot] = React.useState(null);

  const recibirSnapshotCalendario = React.useCallback((snap) => {
    if (!snap || typeof snap !== 'object') return;
    setCalSnapshot(snap);
  }, []);

  const scrollAEstudiantes = React.useCallback(() => {
    setTimeout(() => {
      const el = document.getElementById('calgrupo-estudiantes-panel');
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }, []);

  const seleccionarGrupo = React.useCallback((grupo, abrirEstudiantes = true) => {
    const clean = calGrupoNormCode(grupo);
    if (!clean) return;
    setGrupoSeleccionado(clean);
    setGrupoInput(clean);
    setMostrarEstudiantes(!!abrirEstudiantes);
    setRecientes(calGrupoSaveRecent(clean));
    if (abrirEstudiantes) scrollAEstudiantes();
  }, [scrollAEstudiantes]);

  const limpiarGrupo = React.useCallback(() => {
    setGrupoSeleccionado(null);
    setGrupoInput('');
    setMostrarEstudiantes(false);
  }, []);

  const copiarGrupo = React.useCallback(() => {
    if (!grupoSeleccionado) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(grupoSeleccionado);
      }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1300);
    } catch (_) {}
  }, [grupoSeleccionado]);

  const irAuditoria = React.useCallback(() => {
    if (onNavigate) onNavigate('auditoria_academica', {
      grupo: grupoSeleccionado || '',
      nivel: calGrupoInferNivel(grupoSeleccionado),
      origen: 'calendario_grupo',
    });
  }, [onNavigate, grupoSeleccionado]);

  const handleNavigateFromCronograma = React.useCallback((target, opts = {}) => {
    // En la vista vieja, el modal de una clase usa onNavigate('estudiantes', { grupo }).
    // En este panel nuevo interceptamos esa navegación para cargar estudiantes abajo,
    // manteniendo al usuario dentro de Calendario de Grupo.
    if (target === 'estudiantes' && opts && opts.grupo) {
      seleccionarGrupo(opts.grupo, true);
      return;
    }
    if (target === 'auditoria_academica' && opts && opts.grupo) {
      seleccionarGrupo(opts.grupo, false);
      if (onNavigate) onNavigate(target, { ...opts, origen: 'calendario_grupo' });
      return;
    }
    if (onNavigate) onNavigate(target, opts);
  }, [onNavigate, seleccionarGrupo]);

  const nivelActivo = calGrupoInferNivel(grupoSeleccionado);
  const mostrarCalendario = modoVista !== 'estudiantes';
  const mostrarPanelEstudiantes = modoVista !== 'calendario';

  return (
    <section data-screen-label="Calendario de Grupo · Fase 11" style={{ padding: 24 }}>
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
            Panel nuevo para operar desde el calendario: calendario arriba, grupo activo y estudiantes abajo.
            Ahora podés cargar un grupo directo por código, usar recientes o seleccionarlo desde una clase.
          </div>
        </div>

        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' }}>
          {grupoSeleccionado && (
            <div style={{
              padding:'8px 12px', borderRadius:'var(--r-pill)',
              background:'color-mix(in srgb, var(--an-navy) 9%, white)',
              border:'1px solid color-mix(in srgb, var(--an-navy) 18%, white)',
              color:'var(--an-navy-ink)', fontSize:12, fontWeight:800,
              fontFamily:'var(--f-mono)',
            }}>
              Grupo activo · {grupoSeleccionado} {nivelActivo ? `· ${nivelActivo}` : ''}
            </div>
          )}
          {grupoSeleccionado && (
            <button type="button" onClick={copiarGrupo} style={calGrupoTopBtn()}>
              {copiado ? 'Copiado ✓' : 'Copiar código'}
            </button>
          )}
          <button type="button" onClick={irAuditoria} style={calGrupoTopBtn()}>
            <IconMiniAudit />
            {grupoSeleccionado ? 'Auditar grupo activo' : 'Abrir Auditoría Académica'}
          </button>
        </div>
      </div>

      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap',
        padding:'10px 12px', marginBottom:14, border:'1px solid var(--line)', borderRadius:'var(--r-lg)',
        background:'var(--surface)', boxShadow:'var(--sh-1)',
      }}>
        <div>
          <div style={{ fontSize:10, fontWeight:900, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3)' }}>Modo de trabajo</div>
          <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:2 }}>Elegí qué querés ver según la tarea del momento: planificación, operación o ambos.</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button type="button" onClick={() => setModoVista('completo')} style={calGrupoModeBtn(modoVista === 'completo')}>Completo</button>
          <button type="button" onClick={() => setModoVista('calendario')} style={calGrupoModeBtn(modoVista === 'calendario')}>Solo calendario</button>
          <button type="button" onClick={() => { setModoVista('estudiantes'); if (grupoSeleccionado) { setMostrarEstudiantes(true); scrollAEstudiantes(); } }} style={calGrupoModeBtn(modoVista === 'estudiantes')}>Solo estudiantes</button>
        </div>
      </div>

      <div style={{
        background:'linear-gradient(135deg, #fff, color-mix(in srgb, var(--an-gold) 5%, white))',
        border:'1px solid var(--line)', borderRadius:'var(--r-lg)', boxShadow:'var(--sh-1)',
        padding:'14px 16px', marginBottom:18,
      }}>
        <div style={{ display:'grid', gridTemplateColumns:'minmax(260px, 1fr) auto', gap:12, alignItems:'end' }}>
          <div>
            <div style={{ fontSize:10, fontWeight:900, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:6 }}>
              Selector directo de grupo
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input
                value={grupoInput}
                onChange={e => setGrupoInput(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') seleccionarGrupo(grupoInput, true); }}
                placeholder="Ej: B1-LM18-C3-0726"
                style={{
                  flex:1, minWidth:220, padding:'10px 12px', borderRadius:'var(--r-md)',
                  border:'1px solid var(--line)', background:'white', outline:'none',
                  fontFamily:'var(--f-mono)', fontSize:13, fontWeight:800, letterSpacing:'0.01em',
                }}
              />
              <button type="button" onClick={() => seleccionarGrupo(grupoInput, true)} style={calGrupoPrimaryBtn()}>
                Cargar grupo
              </button>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
            {grupoSeleccionado && (
              <>
                <button type="button" onClick={() => { setModoVista('estudiantes'); setMostrarEstudiantes(true); scrollAEstudiantes(); }} style={calGrupoSoftBtn()}>
                  Ver estudiantes
                </button>
                <button type="button" onClick={limpiarGrupo} style={calGrupoSoftBtn()}>
                  Limpiar
                </button>
              </>
            )}
          </div>
        </div>

        {recientes.length > 0 && (
          <div style={{ display:'flex', gap:7, alignItems:'center', flexWrap:'wrap', marginTop:11 }}>
            <span style={{ fontSize:10, fontWeight:900, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--ink-3)' }}>Recientes</span>
            {recientes.map(code => (
              <button key={code} type="button" onClick={() => seleccionarGrupo(code, true)} style={{
                padding:'5px 8px', borderRadius:'var(--r-pill)', border:`1px solid ${grupoSeleccionado === code ? 'var(--an-navy)' : 'var(--line)'}`,
                background: grupoSeleccionado === code ? 'var(--an-navy)' : 'white',
                color: grupoSeleccionado === code ? 'white' : 'var(--ink-2)',
                fontSize:10.5, fontWeight:900, fontFamily:'var(--f-mono)', cursor:'pointer',
              }}>
                {code}
              </button>
            ))}
          </div>
        )}
      </div>

      <CalGrupoFocusRail
        grupoSeleccionado={grupoSeleccionado}
        modoVista={modoVista}
        snapshot={calSnapshot}
        onModo={setModoVista}
        onSelectGrupo={(code) => seleccionarGrupo(code, true)}
        onEstudiantes={() => { setModoVista('estudiantes'); if (grupoSeleccionado) { setMostrarEstudiantes(true); scrollAEstudiantes(); } }}
        onAuditoria={irAuditoria}
      />

      {mostrarCalendario && (
        <CalGrupoPrioridades
          snapshot={calSnapshot}
          grupoSeleccionado={grupoSeleccionado}
          recientes={recientes}
          onSelectGrupo={(code) => seleccionarGrupo(code, true)}
          onSoloEstudiantes={() => { setModoVista('estudiantes'); if (grupoSeleccionado) { setMostrarEstudiantes(true); scrollAEstudiantes(); } }}
          onAuditoria={irAuditoria}
        />
      )}

      {mostrarCalendario && (
        <>
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
          text="Cargalo desde una clase, por código o desde recientes. La radiografía se abre abajo sin salir de esta pantalla."
        />
        <CalGrupoHint
          n="3"
          title="Auditoría conectada"
          text="Si ya seleccionaste un grupo, Auditoría Académica abre con ese grupo y nivel cargados."
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
              Podés seleccionar grupos desde una clase o cargar el código directamente arriba.
            </div>
          </div>
          <div style={{ fontSize:11, color:'var(--ink-3)', fontWeight:700 }}>
            Tip: abrí una clase y tocá “Ver estudiantes de este grupo”.
          </div>
        </div>
        <div style={{ padding: 18 }}>
          <CronogramaGrupo rol={rol} onNavigate={handleNavigateFromCronograma} onDataSnapshot={recibirSnapshotCalendario} />
        </div>
      </div>
        </>
      )}

      {mostrarPanelEstudiantes && (
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
              <button type="button" onClick={() => setMostrarEstudiantes(v => !v)} style={calGrupoPanelBtn(grupoSeleccionado)}>
                {mostrarEstudiantes ? 'Ocultar estudiantes' : 'Mostrar estudiantes'}
              </button>
            )}
            <button type="button" onClick={irAuditoria} style={calGrupoPanelBtn(grupoSeleccionado)}>
              {grupoSeleccionado ? 'Auditoría del grupo' : 'Auditoría'}
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
              Abrí una clase en el calendario y usá el botón <strong>Ver estudiantes de este grupo</strong>,
              o escribí el código del grupo en el selector directo de arriba.
            </div>
          </div>
        ) : mostrarEstudiantes ? (
          <div style={{ background:'var(--bg)', borderTop:'1px solid var(--line)' }}>
            <AdminEstudiantesView onNavigate={onNavigate} grupoInicial={grupoSeleccionado} modo="calgrupo" />
          </div>
        ) : (
          <div style={{ padding:'22px 24px', color:'var(--ink-2)', fontSize:13, lineHeight:1.55 }}>
            Grupo listo para cargar estudiantes. Usá <strong>Mostrar estudiantes</strong> para abrir la radiografía actual sin salir de Calendario de Grupo.
          </div>
        )}
      </div>
      )}

      {!mostrarPanelEstudiantes && grupoSeleccionado && (
        <div style={{
          padding:'16px 18px', border:'1px solid var(--line)', borderRadius:'var(--r-lg)', background:'var(--surface)', boxShadow:'var(--sh-1)',
          display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap',
        }}>
          <div>
            <div style={{ fontSize:10, fontWeight:900, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3)' }}>Grupo activo</div>
            <div style={{ fontFamily:'var(--f-mono)', fontWeight:900, color:'var(--an-navy-ink)', marginTop:2 }}>{grupoSeleccionado}</div>
          </div>
          <button type="button" onClick={() => { setModoVista('estudiantes'); setMostrarEstudiantes(true); scrollAEstudiantes(); }} style={calGrupoPrimaryBtn()}>Abrir estudiantes del grupo</button>
        </div>
      )}
    </section>
  );
}

function calGrupoIsoLocal(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return '';
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function calGrupoMonday(dt = new Date()) {
  const d = new Date(dt);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  d.setHours(0,0,0,0);
  return d;
}

function calGrupoAddDays(dt, n) {
  const d = new Date(dt);
  d.setDate(d.getDate() + n);
  return d;
}

function calGrupoLecNum(l) {
  return Number(l?.leccion ?? l?.n ?? l?.lesson ?? 0) || 0;
}

function calGrupoItemCode(it) {
  return calGrupoNormCode(it?.grupo?.code || it?.grupo?.cod_grupo || it?.cod_grupo || '');
}

function calGrupoItemFecha(it) {
  return String(it?.leccion?.fecha || it?.fecha || '').slice(0, 10);
}

function calGrupoBuildPrioridades(snapshot, grupoSeleccionado, recientes) {
  const grupos = Array.isArray(snapshot?.gruposReales) ? snapshot.gruposReales : [];
  const rawItems = Array.isArray(snapshot?.items)
    ? snapshot.items
    : (Array.isArray(snapshot?.lecciones) && snapshot?.codGrupo
      ? snapshot.lecciones.map(l => ({ grupo:{ code:snapshot.codGrupo, nivelId:snapshot.nivel }, leccion:l }))
      : []);

  const hoyIso = calGrupoIsoLocal(new Date());
  const lunes = calGrupoMonday(new Date());
  const domingo = calGrupoAddDays(lunes, 6);
  const lunesIso = calGrupoIsoLocal(lunes);
  const domingoIso = calGrupoIsoLocal(domingo);

  const items = rawItems.filter(it => calGrupoItemFecha(it));
  const hoy = items.filter(it => calGrupoItemFecha(it) === hoyIso || String(it?.leccion?.estado || '').toUpperCase() === 'HOY');
  const semana = items.filter(it => {
    const f = calGrupoItemFecha(it);
    return f >= lunesIso && f <= domingoIso;
  });
  const examenes = semana.filter(it => [18,32].includes(calGrupoLecNum(it.leccion)));
  const porCerrar = semana.filter(it => ['HOY','PROGRAMADA'].includes(String(it?.leccion?.estado || '').toUpperCase()));
  const gruposBajos = grupos
    .filter(g => !g.esApertura && Number(g.estudiantes || 0) > 0 && Number(g.estudiantes || 0) < 5)
    .sort((a,b) => Number(a.estudiantes || 0) - Number(b.estudiantes || 0))
    .slice(0, 6);
  const activos = grupos.filter(g => !g.esApertura).length || grupos.length;
  const estudiantes = grupos.reduce((s,g) => s + (Number(g.estudiantes || 0) || 0), 0);
  const grupoActivoItems = grupoSeleccionado
    ? items.filter(it => calGrupoItemCode(it) === grupoSeleccionado).slice(0, 6)
    : [];

  const dedupe = (arr) => {
    const out = [];
    const seen = new Set();
    arr.forEach(it => {
      const code = calGrupoItemCode(it);
      const key = `${code}|${calGrupoItemFecha(it)}|${calGrupoLecNum(it.leccion)}`;
      if (!code || seen.has(key)) return;
      seen.add(key); out.push(it);
    });
    return out;
  };

  return {
    hasData: grupos.length || items.length,
    activos, estudiantes,
    hoy: dedupe(hoy),
    semana: dedupe(semana),
    examenes: dedupe(examenes),
    porCerrar: dedupe(porCerrar),
    gruposBajos,
    grupoActivoItems,
    recientes: Array.isArray(recientes) ? recientes : [],
    lunesIso, domingoIso,
  };
}

function CalGrupoPrioridades({ snapshot, grupoSeleccionado, recientes, onSelectGrupo, onSoloEstudiantes, onAuditoria }) {
  const p = React.useMemo(() => calGrupoBuildPrioridades(snapshot, grupoSeleccionado, recientes), [snapshot, grupoSeleccionado, recientes]);
  const listaHoy = p.hoy.slice(0, 5);
  const listaExamenes = p.examenes.slice(0, 5);
  const estado = !p.hasData ? 'Cargando calendario…'
    : p.hoy.length ? `${p.hoy.length} clase${p.hoy.length === 1 ? '' : 's'} hoy`
    : p.semana.length ? 'Sin clase hoy · revisar semana'
    : 'Sin clases detectadas esta semana';

  return (
    <div style={{
      border:'1px solid var(--line)', borderRadius:'var(--r-lg)', background:'var(--surface)',
      boxShadow:'var(--sh-1)', padding:'14px 16px', marginBottom:18,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14, flexWrap:'wrap', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:900, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3)' }}>
            Prioridades operativas
          </div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--ink)', marginTop:2 }}>{estado}</div>
          <div style={{ fontSize:11.5, color:'var(--ink-3)', marginTop:3 }}>
            Semana {p.lunesIso} → {p.domingoIso}. Usa el snapshot real que carga el cronograma, sin backend nuevo.
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
          {grupoSeleccionado && <button type="button" onClick={onSoloEstudiantes} style={calGrupoSoftBtn()}>Operar grupo activo</button>}
          <button type="button" onClick={onAuditoria} style={calGrupoTopBtn()}>Auditoría</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:10, marginBottom:12 }}>
        <CalGrupoKpi title="Hoy" value={p.hoy.length} sub="clases detectadas" tone={p.hoy.length ? 'navy' : 'muted'} />
        <CalGrupoKpi title="Esta semana" value={p.semana.length} sub="lecciones programadas" tone="gold" />
        <CalGrupoKpi title="Exámenes" value={p.examenes.length} sub="L18 / L32 esta semana" tone={p.examenes.length ? 'red' : 'muted'} />
        <CalGrupoKpi title="Activos" value={p.activos} sub={`${p.estudiantes || 0} estudiantes`} tone="green" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.25fr 1fr 1fr', gap:10 }}>
        <CalGrupoPriorityBox title="Revisar hoy" empty="No hay clases hoy en el snapshot actual.">
          {listaHoy.map(it => <CalGrupoPriorityItem key={`${calGrupoItemCode(it)}-${calGrupoItemFecha(it)}-${calGrupoLecNum(it.leccion)}`} item={it} onSelectGrupo={onSelectGrupo} />)}
        </CalGrupoPriorityBox>
        <CalGrupoPriorityBox title="Exámenes cerca" empty="No hay L18/L32 esta semana.">
          {listaExamenes.map(it => <CalGrupoPriorityItem key={`ex-${calGrupoItemCode(it)}-${calGrupoItemFecha(it)}-${calGrupoLecNum(it.leccion)}`} item={it} onSelectGrupo={onSelectGrupo} compact />)}
        </CalGrupoPriorityBox>
        <CalGrupoPriorityBox title="Grupos con atención" empty="Sin grupos bajo mínimo detectados.">
          {p.gruposBajos.map(g => (
            <button key={g.code} type="button" onClick={() => onSelectGrupo && onSelectGrupo(g.code)} style={calGrupoMiniGroupBtn()}>
              <span style={{ fontFamily:'var(--f-mono)', fontWeight:900 }}>{g.code}</span>
              <span style={{ color:'var(--ink-3)' }}>{Number(g.estudiantes || 0)} est.</span>
            </button>
          ))}
        </CalGrupoPriorityBox>
      </div>
    </div>
  );
}


function CalGrupoFocusRail({ grupoSeleccionado, modoVista, snapshot, onModo, onSelectGrupo, onEstudiantes, onAuditoria }) {
  const p = React.useMemo(() => calGrupoBuildPrioridades(snapshot, grupoSeleccionado, []), [snapshot, grupoSeleccionado]);
  const proximoExamen = (p.examenes || [])[0];
  const siguienteHoy = (p.hoy || [])[0];
  const foco = grupoSeleccionado
    ? `Grupo activo ${grupoSeleccionado}`
    : (siguienteHoy ? `Siguiente grupo hoy: ${calGrupoItemCode(siguienteHoy)}` : 'Sin grupo activo');

  const cards = [
    {
      key:'plan',
      title:'Planificar calendario',
      value: `${p.semana.length || 0} lecciones`,
      sub:'esta semana',
      action:'Solo calendario',
      tone:'navy',
      onClick: () => onModo && onModo('calendario'),
      active: modoVista === 'calendario',
    },
    {
      key:'students',
      title:'Operar grupo',
      value: grupoSeleccionado ? grupoSeleccionado : 'Pendiente',
      sub: grupoSeleccionado ? 'estudiantes / mora / CONAPE' : 'seleccioná un grupo primero',
      action:'Solo estudiantes',
      tone:'gold',
      onClick: onEstudiantes,
      active: modoVista === 'estudiantes',
    },
    {
      key:'audit',
      title:'Auditoría rápida',
      value: proximoExamen ? `L${String(calGrupoLecNum(proximoExamen.leccion)).padStart(2,'0')}` : 'Lista',
      sub: proximoExamen ? `${calGrupoItemCode(proximoExamen)} · examen cercano` : foco,
      action:'Auditar',
      tone:'green',
      onClick: onAuditoria,
      active:false,
    },
  ];

  return (
    <div style={{
      display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:10,
      margin:'0 0 18px',
    }}>
      {cards.map(c => (
        <button key={c.key} type="button" onClick={c.onClick} style={calGrupoFocusCard(c.active, c.tone)}>
          <div style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'flex-start' }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:10, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color:c.active ? 'rgba(255,255,255,.72)' : 'var(--ink-3)' }}>
                {c.title}
              </div>
              <div style={{
                marginTop:5, fontFamily:c.key === 'students' && grupoSeleccionado ? 'var(--f-mono)' : 'var(--f-serif)',
                fontSize:c.key === 'students' && grupoSeleccionado ? 15 : 24,
                fontWeight:c.key === 'students' && grupoSeleccionado ? 900 : 500,
                lineHeight:1.05, color:c.active ? 'white' : 'var(--ink)',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>
                {c.value}
              </div>
              <div style={{ marginTop:6, fontSize:11.5, color:c.active ? 'rgba(255,255,255,.76)' : 'var(--ink-3)', lineHeight:1.35 }}>
                {c.sub}
              </div>
            </div>
            <span style={{
              flexShrink:0, padding:'5px 8px', borderRadius:'var(--r-pill)',
              border:c.active ? '1px solid rgba(255,255,255,.28)' : '1px solid var(--line)',
              background:c.active ? 'rgba(255,255,255,.14)' : 'white',
              color:c.active ? 'white' : 'var(--ink-2)', fontSize:10.5, fontWeight:900,
            }}>{c.action}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function calGrupoFocusCard(active, tone) {
  const accent = tone === 'gold' ? 'var(--an-gold)' : tone === 'green' ? 'var(--ok)' : 'var(--an-navy)';
  return {
    textAlign:'left', fontFamily:'inherit', cursor:'pointer',
    padding:'13px 14px', borderRadius:'var(--r-lg)',
    border: active ? '1px solid var(--an-navy)' : '1px solid var(--line)',
    background: active
      ? 'linear-gradient(135deg, var(--an-navy), #173B70)'
      : `linear-gradient(135deg, white, color-mix(in srgb, ${accent} 6%, white))`,
    boxShadow: active ? '0 16px 32px rgba(12,41,77,.16)' : 'var(--sh-1)',
    borderLeft: active ? '1px solid var(--an-navy)' : `4px solid ${accent}`,
    minHeight:96,
  };
}

function CalGrupoKpi({ title, value, sub, tone }) {
  const palette = {
    navy:['var(--an-navy)', 'color-mix(in srgb, var(--an-navy) 8%, white)'],
    gold:['var(--an-gold)', 'color-mix(in srgb, var(--an-gold) 12%, white)'],
    red:['var(--an-red, #C8302A)', 'color-mix(in srgb, #C8302A 8%, white)'],
    green:['var(--ok)', 'color-mix(in srgb, var(--ok) 8%, white)'],
    muted:['var(--ink-3)', 'var(--surface-2)'],
  }[tone] || ['var(--ink-2)', 'var(--surface-2)'];
  return (
    <div style={{ padding:'12px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--line)', background:palette[1] }}>
      <div style={{ fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--ink-3)' }}>{title}</div>
      <div style={{ fontFamily:'var(--f-serif)', fontSize:28, fontWeight:500, color:palette[0], lineHeight:1, marginTop:4 }}>{value}</div>
      <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:4 }}>{sub}</div>
    </div>
  );
}

function CalGrupoPriorityBox({ title, empty, children }) {
  const arr = React.Children.toArray(children).filter(Boolean);
  return (
    <div style={{ border:'1px solid var(--line)', borderRadius:'var(--r-md)', background:'var(--surface-2)', padding:'10px 10px', minHeight:120 }}>
      <div style={{ fontSize:10, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:8 }}>{title}</div>
      {arr.length ? <div style={{ display:'flex', flexDirection:'column', gap:7 }}>{arr}</div> : <div style={{ fontSize:12, color:'var(--ink-3)', lineHeight:1.45 }}>{empty}</div>}
    </div>
  );
}

function CalGrupoPriorityItem({ item, onSelectGrupo, compact }) {
  const g = item?.grupo || {};
  const l = item?.leccion || {};
  const code = calGrupoItemCode(item);
  const lec = calGrupoLecNum(l);
  const nivel = String(g.nivelId || '').toUpperCase();
  const estado = String(l.estado || '').toUpperCase();
  const esExamen = [18,32].includes(lec);
  return (
    <button type="button" onClick={() => onSelectGrupo && onSelectGrupo(code)} style={{
      textAlign:'left', border:'1px solid var(--line)', background:'white', borderRadius:'var(--r-md)',
      padding: compact ? '8px 9px' : '9px 10px', cursor:'pointer', fontFamily:'inherit',
      display:'grid', gap:3,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'center' }}>
        <span style={{ fontFamily:'var(--f-mono)', fontSize:11, fontWeight:900, color:'var(--an-navy-ink)' }}>{code}</span>
        <span style={{ fontSize:10, fontWeight:900, color: esExamen ? 'var(--an-red, #C8302A)' : 'var(--ink-3)' }}>L{String(lec || '—').padStart(2,'0')}</span>
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', fontSize:10.5, color:'var(--ink-3)' }}>
        {nivel && <span>{nivel}</span>}
        <span>{calGrupoItemFecha(item)}</span>
        {g.hora && <span>{g.hora}</span>}
        {estado && <span>{estado === 'HOY' ? 'Hoy' : estado}</span>}
        {Number(g.estudiantes || 0) > 0 && <span>{g.estudiantes} est.</span>}
      </div>
    </button>
  );
}

function calGrupoMiniGroupBtn() {
  return {
    border:'1px solid var(--line)', background:'white', borderRadius:'var(--r-md)', padding:'8px 9px',
    display:'flex', justifyContent:'space-between', gap:8, alignItems:'center', cursor:'pointer', fontSize:11, fontFamily:'inherit',
  };
}

function calGrupoTopBtn() {
  return {
    display:'inline-flex', alignItems:'center', gap:8,
    padding:'9px 14px', borderRadius:'var(--r-md)',
    border:'1px solid var(--line)', background:'var(--surface)',
    color:'var(--ink-2)', fontSize:12, fontWeight:800,
    cursor:'pointer', fontFamily:'inherit',
  };
}

function calGrupoPrimaryBtn() {
  return {
    padding:'10px 14px', borderRadius:'var(--r-md)', border:'1px solid var(--an-navy)',
    background:'var(--an-navy)', color:'white', fontSize:12, fontWeight:900,
    cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
  };
}

function calGrupoSoftBtn() {
  return {
    padding:'9px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--line)',
    background:'white', color:'var(--ink-2)', fontSize:12, fontWeight:850,
    cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
  };
}

function calGrupoModeBtn(active) {
  return {
    padding:'8px 12px', borderRadius:'var(--r-pill)',
    border: active ? '1px solid var(--an-navy)' : '1px solid var(--line)',
    background: active ? 'var(--an-navy)' : 'white',
    color: active ? 'white' : 'var(--ink-2)',
    fontSize:12, fontWeight:900, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
    boxShadow: active ? '0 8px 18px rgba(12,41,77,.16)' : 'none',
  };
}

function calGrupoPanelBtn(grupoSeleccionado) {
  return {
    padding:'8px 12px', borderRadius:'var(--r-md)',
    border: grupoSeleccionado ? '1px solid rgba(255,255,255,0.35)' : '1px solid var(--line)',
    background: grupoSeleccionado ? 'rgba(255,255,255,0.10)' : 'var(--surface)',
    color: grupoSeleccionado ? 'white' : 'var(--ink-2)',
    fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
  };
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
