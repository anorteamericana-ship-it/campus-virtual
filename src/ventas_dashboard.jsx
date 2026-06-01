/* global React, ReactDOM, window */
/* ============================================================================
   VENTAS — Dashboard principal (ventas_dashboard.jsx)
   Pantalla de prospectos para asesores (rol `ventas`) y `superadmin`.
   - Asesor: ve solo sus prospectos (ASESOR_REF === nombre del usuario).
   - Superadmin: ve todo, con selector "Ver como asesor".
   Carga real desde Apps Script; si no hay sesión/backend, cae a datos demo
   claramente etiquetados para poder revisar la herramienta.
   ============================================================================ */
const { useState, useEffect, useMemo, useCallback } = React;
const sleepV = ms => new Promise(r => setTimeout(r, ms));

function VentasApp() {
  const sesion = useMemo(() => (window.getSesion ? window.getSesion() : null), []);
  const [demo, setDemo] = useState(!sesion);
  const usuario = sesion || { nombre: 'Leonardo Salazar', rol: 'superadmin' };
  const rolReal = usuario.rol || 'ventas';
  const esSuper = rolReal === 'superadmin';

  const [asesorView, setAsesorView] = useState('');       // superadmin: filtro opcional
  const [prospectos, setProspectos] = useState(null);     // null = cargando
  const [resumen, setResumen] = useState(null);
  const [filtro, setFiltro] = useState({ etapa: '', fin: '', q: '' });
  const [drawerCed, setDrawerCed] = useState(null);
  const [lightbox, setLightbox] = useState(null);          // { src, caption }
  const [toast, setToast] = useState(null);

  const scopeAsesor = esSuper ? asesorView : usuario.nombre;

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Carga de datos ──
  useEffect(() => {
    let cancel = false;
    setProspectos(null); setResumen(null);
    (async () => {
      if (demo) {
        await sleepV(420);
        const lista = scopeAsesor ? window.DEMO_PROSPECTOS.filter(p => p.asesor_ref === scopeAsesor) : window.DEMO_PROSPECTOS;
        if (!cancel) { setProspectos(lista); setResumen(window.calcResumen(lista)); }
        return;
      }
      try {
        const [pl, rs] = await Promise.all([
          window.getProspectosAsesor(scopeAsesor || undefined),
          window.getResumenVentas(scopeAsesor || undefined),
        ]);
        const lista = Array.isArray(pl) ? pl : (pl && (pl.prospectos || (pl.ok && pl.data))) || null;
        if (!lista) throw new Error('respuesta inválida');
        if (!cancel) {
          setProspectos(lista);
          setResumen((rs && rs.ok !== false) ? (rs.resumen || rs) : window.calcResumen(lista));
        }
      } catch (_) {
        if (!cancel) setDemo(true);   // dispara recarga en modo demo
      }
    })();
    return () => { cancel = true; };
  }, [scopeAsesor, demo]);

  // Optimistic update cuando el drawer cambia una etapa
  const onChanged = useCallback(({ cedula, etapa }) => {
    setProspectos(prev => {
      if (!prev) return prev;
      const next = prev.map(p => p.cedula === cedula ? { ...p, etapa, fecha_activacion: etapa === 'ACTIVO' ? window.HOY : p.fecha_activacion } : p);
      setResumen(window.calcResumen(next));
      return next;
    });
  }, []);

  const funnelCounts = useMemo(() => {
    const c = {};
    (prospectos || []).forEach(p => { c[p.etapa] = (c[p.etapa] || 0) + 1; });
    return c;
  }, [prospectos]);

  const filtered = useMemo(() => {
    if (!prospectos) return [];
    const q = filtro.q.trim().toLowerCase();
    return prospectos.filter(p => {
      if (filtro.etapa && p.etapa !== filtro.etapa) return false;
      if (filtro.fin && p.financiamiento !== filtro.fin) return false;
      if (q && !(`${p.nombre} ${p.cedula}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [prospectos, filtro]);

  const cargando = prospectos === null || resumen === null;
  const inicial = (window.nombrePila(usuario.nombre) || 'U').charAt(0).toUpperCase();

  return (
    <React.Fragment>
      {demo && (
        <div className="vx-demo">
          Modo demostración · datos de ejemplo (sin conexión al servidor). Las acciones se simulan localmente.
        </div>
      )}

      {/* HEADER */}
      <header className="vx-header">
        <div className="vx-header-in">
          <div className="vx-logo" />
          <div>
            <div className="vx-brand-t1">Academia Norteamericana</div>
            <div className="vx-brand-t2">Ventas · Prospectos</div>
          </div>
          <div className="vx-header-spacer" />
          {esSuper && (
            <div className="vx-asesor-pick">
              <label htmlFor="vx-asesor">Ver como asesor:</label>
              <select id="vx-asesor" value={asesorView} onChange={e => setAsesorView(e.target.value)}>
                <option value="">Todos</option>
                {window.ASESORES_V.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}
          <div className="vx-user">
            <div className="vx-user-av">{inicial}</div>
            <div className="vx-user-meta">
              <div className="vx-user-name">{usuario.nombre}</div>
              <div className="vx-user-role">{esSuper ? 'Superadmin' : 'Asesor'}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="vx-wrap">
        {/* KPIs */}
        <div className="vx-sec">
          {cargando ? <window.KPISkeleton /> : <window.KPIRow resumen={resumen} />}
        </div>

        {/* EMBUDO */}
        <div className="vx-sec">
          <div className="vx-sec-h">Embudo de conversión{scopeAsesor ? ` · ${scopeAsesor}` : ''}</div>
          {cargando
            ? <div className="vx-sk" style={{ height: 280, borderRadius: 16 }} />
            : <window.Funnel counts={funnelCounts} total={(prospectos || []).length} />}
        </div>

        {/* FILTROS + TABLA */}
        <div className="vx-sec">
          <div className="vx-sec-h">Prospectos</div>
          {cargando ? (
            <React.Fragment>
              <div className="vx-sk" style={{ height: 56, borderRadius: 12, marginBottom: 14 }} />
              <window.TableSkeleton />
            </React.Fragment>
          ) : (
            <React.Fragment>
              <div style={{ marginBottom: 14 }}>
                <window.FilterBar filtro={filtro} setFiltro={setFiltro} resultCount={filtered.length} />
              </div>
              {filtered.length === 0 ? (
                <div className="vx-tablecard">
                  <div className="vx-empty">
                    <div className="vx-empty-icon">🔍</div>
                    <div style={{ fontWeight: 600, color: 'var(--v-ink-2)' }}>
                      {(prospectos || []).length === 0 ? 'No hay prospectos en esta vista todavía.' : 'Ningún prospecto coincide con los filtros.'}
                    </div>
                  </div>
                </div>
              ) : (
                <React.Fragment>
                  <window.ProspectoTable lista={filtered} onOpen={p => setDrawerCed(p.cedula)} />
                  <window.ProspectoCards lista={filtered} onOpen={p => setDrawerCed(p.cedula)} />
                </React.Fragment>
              )}
            </React.Fragment>
          )}
        </div>
      </div>

      {/* DRAWER */}
      {drawerCed && (
        <window.ProspectoDrawer
          cedula={drawerCed}
          asesor={usuario.nombre}
          demo={demo}
          onClose={() => setDrawerCed(null)}
          onToast={setToast}
          onView={(src, caption) => setLightbox({ src, caption })}
          onChanged={onChanged}
        />
      )}

      <window.Lightbox src={lightbox?.src} caption={lightbox?.caption} onClose={() => setLightbox(null)} />
      <window.VToast toast={toast} />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<VentasApp />);
