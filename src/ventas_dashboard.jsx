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

// Normaliza para comparar nombres de asesor sin tropezar con may/min ni tildes.
const normAsesor = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
// Filtro demo TOLERANTE: la sesión real puede traer "Fiorella Salazar" mientras el
// dato demo dice "Fiorela Salazar". Compara por nombre completo o por primer nombre
// con prefijo, para que el modo demostración nunca quede vacío por un detalle de tipeo.
function filtrarDemoPorAsesor(lista, asesor) {
  const a = normAsesor(asesor);
  if (!a) return lista;
  const aFirst = a.split(/\s+/)[0];
  const hit = lista.filter(p => {
    const r = normAsesor(p.asesor_ref);
    if (!r) return false;
    const rFirst = r.split(/\s+/)[0];
    return r === a || r.startsWith(a) || a.startsWith(r) || rFirst.startsWith(aFirst) || aFirst.startsWith(rFirst);
  });
  return hit;
}

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
  const [errorCarga, setErrorCarga] = useState(null);      // error de carga con sesión real (no enmascarar con demo)
  const [reloadTick, setReloadTick] = useState(0);         // reintento manual

  const scopeAsesor = esSuper ? asesorView : usuario.nombre;

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Carga de datos ──
  // Bug A (panel de Fiorella en CERO): antes ambas llamadas iban en un solo
  // Promise.all y CUALQUIER rechazo (p.ej. getResumenVentas con respuesta no-JSON
  // o un hipo de red en una de las dos) tumbaba TODO al fallback demo. El demo
  // filtra por nombre y, como la sesión real trae "Fiorella Salazar" pero el demo
  // dice "Fiorela Salazar", quedaba en 0 → panel entero en cero, enmascarando los
  // 5 prospectos reales. Fix: (1) los PROSPECTOS son la fuente de verdad y se piden
  // solos; (2) el RESUMEN va aparte y, si falla, se calcula localmente con los
  // prospectos ya cargados; (3) con sesión real NUNCA caemos a demo en silencio:
  // mostramos un error con "Reintentar" en vez de ceros engañosos.
  useEffect(() => {
    let cancel = false;
    setProspectos(null); setResumen(null); setErrorCarga(null);
    (async () => {
      if (demo) {
        await sleepV(420);
        const lista = scopeAsesor ? filtrarDemoPorAsesor(window.DEMO_PROSPECTOS, scopeAsesor) : window.DEMO_PROSPECTOS;
        if (!cancel) { setProspectos(lista); setResumen(window.calcResumen(lista)); }
        return;
      }
      // 1) PROSPECTOS — fuente de verdad del panel.
      let lista = null;
      try {
        const pl = await window.getProspectosAsesor(scopeAsesor || undefined);
        lista = Array.isArray(pl) ? pl
              : (pl && (pl.prospectos || (pl.data && pl.data.prospectos) || (pl.ok && pl.data))) || null;
        if (!lista) throw new Error('Respuesta sin lista de prospectos');
      } catch (e) {
        if (cancel) return;
        if (sesion) {
          // Sesión real: no enmascarar con demo. Mostrar error real + permitir reintento.
          setErrorCarga('No pudimos cargar tus prospectos desde el servidor. Revisá la conexión e intentá de nuevo.');
          setProspectos([]); setResumen(window.calcResumen([]));
        } else {
          setDemo(true);   // sin sesión (revisión de la herramienta) → datos demo
        }
        return;
      }
      if (cancel) return;
      setProspectos(lista);
      // 2) RESUMEN — independiente. Si falla o no trae KPIs, se calcula con los prospectos.
      try {
        const rs = await window.getResumenVentas(scopeAsesor || undefined);
        const mapped = window.mapResumenVentas ? window.mapResumenVentas(rs, lista) : null;
        if (!cancel) setResumen(mapped || window.calcResumen(lista));
      } catch (_) {
        if (!cancel) setResumen(window.calcResumen(lista));
      }
    })();
    return () => { cancel = true; };
  }, [scopeAsesor, demo, reloadTick]);

  // Optimistic update cuando el drawer cambia algo del prospecto (etapa, beca,
  // proformas, …). Merge genérico: respeta cualquier campo que envíe el drawer.
  const onChanged = useCallback(({ cedula, ...campos }) => {
    setProspectos(prev => {
      if (!prev) return prev;
      const next = prev.map(p => {
        if (p.cedula !== cedula) return p;
        const merged = { ...p, ...campos };
        if (campos.etapa === 'ACTIVO') merged.fecha_activacion = window.HOY;
        return merged;
      });
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
                    <div className="vx-empty-icon">{errorCarga ? '⚠️' : '🔍'}</div>
                    <div style={{ fontWeight: 600, color: 'var(--v-ink-2)' }}>
                      {errorCarga
                        ? errorCarga
                        : (prospectos || []).length === 0 ? 'No hay prospectos en esta vista todavía.' : 'Ningún prospecto coincide con los filtros.'}
                    </div>
                    {errorCarga && (
                      <button className="vx-clear" style={{ marginTop: 12 }}
                        onClick={() => { setErrorCarga(null); setReloadTick(t => t + 1); }}>
                        Reintentar
                      </button>
                    )}
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
          esSuperadmin={esSuper}
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
