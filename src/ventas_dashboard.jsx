/* global React, ReactDOM, window */
/* ============================================================================
   VENTAS — Dashboard principal (ventas_dashboard.jsx) · CS21A20F
   Panel del vendedor reorganizado según prioridad operativa. Bloques:
     1. Estudiantes · 2. Grupos Disponibles · 3. Mis matrículas · 4. Mi embudo
   Tabla + drawer existentes intactos. UNA sola llamada: getDashboardVentas.
   Sin fallback demo: con sesión real, si falla → error + Reintentar (no ceros).
   Vista previa de diseño solo con ?preview=fiorella | ?preview=roger.

   SEC-005-B1 · Guard de sesión real (ver <VentasGate/> al final del archivo):
   - NO existe ningún fallback que cree sesión: ni superadmin, ni nombre
     hardcodeado, ni sesión demo/fake. La identidad SIEMPRE proviene de la
     sesión validada (window.getSesion) y se pasa a <VentasApp/> como prop.
   - Sin sesión / sin token → redirección a login.html.
   - Rol permitido: superadmin | admin | ventas. Otro rol → "No autorizado".
   ============================================================================ */
const { useState, useEffect, useMemo, useCallback } = React;
const sleepV = ms => new Promise(r => setTimeout(r, ms));

// Roles con acceso al panel de ventas.
const VX_ROLES_PERMITIDOS = ['superadmin', 'admin', 'ventas'];

// Redirección dura al login. No crea ni toca ninguna sesión.
function vxIrALogin() {
  try { window.location.replace('login.html'); }
  catch (_) { window.location.href = 'login.html'; }
}

// CS21A153 · fuente real de asesores de ventas.
// Reutiliza el endpoint público ya existente del backend canónico, que lee
// USUARIOS y filtra rol=ventas + activo=TRUE. No usa ASESORES_V como fallback.
async function vxGetAsesoresActivos() {
  const base = window.SCRIPT_URL_V || window.APPS_SCRIPT_URL || '';
  if (!base) throw new Error('ventas_endpoint_missing');
  const res = await fetch(`${base}?fn=getAsesoresActivos`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`ventas_asesores_http_${res.status}`);
  const data = await res.json();
  if (!data || data.ok === false || !Array.isArray(data.asesores)) {
    throw new Error((data && (data.error || data.mensaje)) || 'ventas_asesores_invalid');
  }
  return data.asesores
    .map(a => String((a && a.nombre) || '').trim())
    .filter(Boolean)
    .filter((nombre, i, arr) => arr.indexOf(nombre) === i);
}

// VENTAS-DASHBOARD-002 · La sección "Documentos del estudiante" se trasladó al
// drawer (ProspectoDrawer en ventas_drawer.jsx): aparece dentro del detalle del
// estudiante y se habilita solo cuando está MATRICULADO. Ya no es modal flotante.


function VentasApp({ sesion }) {
  // SEC-005-B1: la identidad viene SIEMPRE del gate (sesión real validada).
  // No hay fallback superadmin/demo aquí.
  const usuario = sesion;
  const previewKey = useMemo(() => {
    const k = new URLSearchParams(window.location.search).get('preview');
    const t = k ? k.toLowerCase() : '';
    return (t && window.DEMO_DASHBOARD && window.DEMO_DASHBOARD[t]) ? t : '';
  }, []);
  const rolReal = usuario.rol || 'ventas';
  // Supervisor (superadmin/admin): puede ver el panel "como" otro asesor.
  const esSupervisor = rolReal === 'superadmin' || rolReal === 'admin';
  const rolLabel = rolReal === 'superadmin' ? 'Superadmin'
                 : rolReal === 'admin'      ? 'Administración'
                 : 'Asesor';

  const [asesorView, setAsesorView] = useState('');       // supervisor: ver como asesor
  const [asesoresReales, setAsesoresReales] = useState([]);
  const [asesoresEstado, setAsesoresEstado] = useState('idle'); // idle|loading|ok|error
  const [dash, setDash] = useState(null);                 // null = cargando
  const [filtro, setFiltro] = useState({ etapa: '', fin: '', q: '' });
  const [drawerCed, setDrawerCed] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [toast, setToast] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  // DEMO queda limitado a la vista previa explícita. En operación real,
  // el selector usa únicamente asesores devueltos por getAsesoresActivos().
  const asesoresSelector = previewKey ? (window.ASESORES_V || []) : asesoresReales;
  const asesorSelectorValue = asesorView || (previewKey ? (asesoresSelector[0] || '') : '');

  // El endpoint necesita SIEMPRE un asesor concreto. Un supervisor espera la
  // lista real antes de cargar el dashboard; nunca cae a su propio nombre.
  const scopeAsesor = esSupervisor
    ? (asesorView || (previewKey ? usuario.nombre : ''))
    : usuario.nombre;

  useEffect(() => {
    if (!esSupervisor || previewKey) return undefined;
    let cancel = false;
    setAsesoresEstado('loading');
    vxGetAsesoresActivos()
      .then(nombres => {
        if (cancel) return;
        setAsesoresReales(nombres);
        setAsesorView(prev => (prev && nombres.includes(prev)) ? prev : (nombres[0] || ''));
        setAsesoresEstado('ok');
      })
      .catch(err => {
        if (cancel) return;
        console.error('[Ventas CS21A153] No se pudo cargar la lista real de asesores.', err);
        setAsesoresReales([]);
        setAsesorView('');
        setAsesoresEstado('error');
      });
    return () => { cancel = true; };
  }, [esSupervisor, previewKey]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Carga: UNA sola llamada a getDashboardVentas ──
  useEffect(() => {
    let cancel = false;
    setDash(null); setErrorCarga(null);
    (async () => {
      // Vista previa de diseño (gated). NO es fallback de la sesión real.
      if (previewKey) {
        await sleepV(360);
        const d = window.DEMO_DASHBOARD[previewKey];
        if (!cancel) setDash({ ...d, prospectos: (d.prospectos || []).map(window.adaptProspectoDash) });
        return;
      }
      // Supervisor real: no consultar con identidad administrativa como asesor.
      if (esSupervisor && !scopeAsesor) return;
      try {
        const data = await window.getDashboardVentas(scopeAsesor);
        if (cancel) return;
        if (!data || !data.ok) {
          console.error('[Ventas CS21A173] No se pudo cargar el dashboard real.', data && (data.error || data.mensaje));
          throw new Error('ventas_dashboard_unavailable');
        }
        setDash({
          asesor: data.asesor,
          semana_actual: data.semana_actual || { matriculas: 0, promedio_4s: 0 },
          embudo: Array.isArray(data.embudo) ? data.embudo : [],
          prospectos: (data.prospectos || []).map(window.adaptProspectoDash),
          grupos_disponibles: data.grupos_disponibles || [],
          total_prospectos: data.total_prospectos,
        });
      } catch (e) {
        console.error('[Ventas CS21A173] Falló la carga del dashboard real.', e);
        if (!cancel) setErrorCarga('No pudimos cargar tu panel. Recargá la página e intentá nuevamente.');
      }
    })();
    return () => { cancel = true; };
  }, [scopeAsesor, reloadTick, previewKey, esSupervisor]);

  // Update optimista cuando el drawer cambia algo del prospecto.
  const onChanged = useCallback(({ cedula, ...campos }) => {
    setDash(prev => {
      if (!prev) return prev;
      return { ...prev, prospectos: prev.prospectos.map(p => p.cedula === cedula ? { ...p, ...campos } : p) };
    });
  }, []);

  const prospectos = dash ? dash.prospectos : null;

  const filtered = useMemo(() => {
    if (!prospectos) return [];
    const q = filtro.q.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    const qLocalPhone = qDigits.length === 11 && qDigits.startsWith('506') ? qDigits.slice(3) : qDigits;

    const base = prospectos.filter(p => {
      if (filtro.etapa && p.etapa !== filtro.etapa) return false;
      if (filtro.fin && p.financiamiento !== filtro.fin) return false;

      if (q) {
        const searchableText = `${p.nombre || ''} ${p.cedula || ''} ${p.telefono || ''} ${p.whatsapp || ''}`.toLowerCase();
        const searchableDigits = `${p.cedula || ''} ${p.telefono || ''} ${p.whatsapp || ''}`.replace(/\D/g, '');
        const textMatch = searchableText.includes(q);
        const digitMatch = !!qDigits && (
          searchableDigits.includes(qDigits) ||
          (!!qLocalPhone && searchableDigits.includes(qLocalPhone))
        );
        if (!textMatch && !digitMatch) return false;
      }

      return true;
    });
    // VENTAS-UX-001-A: ordenar por prioridad (rojo→amarillo→verde→gris) y, dentro
    // de cada grupo, por fecha más reciente primero. Orden estable (índice) como
    // desempate cuando no hay fecha confiable. NO altera el filtrado de arriba.
    return base
      .map((p, i) => ({ p, i, pr: window.calcularPrioridadProspecto(p) }))
      .sort((a, b) => {
        if (a.pr.peso !== b.pr.peso) return a.pr.peso - b.pr.peso;
        const fa = a.p.fecha_registro || a.p.f_lead || '';
        const fb = b.p.fecha_registro || b.p.f_lead || '';
        if (fa && fb && fa !== fb) return fb < fa ? -1 : 1;   // más reciente primero
        return a.i - b.i;                                      // estable
      })
      .map(x => x.p);
  }, [prospectos, filtro]);

  // Click en una etapa del embudo → filtra la tabla (toggle).
  const pickEtapa = useCallback((key) => {
    setFiltro(f => ({ ...f, etapa: f.etapa === key ? '' : key }));
  }, []);

  // SEC-003C-VENTAS: cerrar sesión real. Revoca la sesión en el servidor
  // (fn=cerrarSesion vía cerrarSesionServidor → ACTIVA=FALSE, CIERRE_MOTIVO=LOGOUT)
  // y luego redirige al login. cerrarSesionServidor() limpia an_usuario en su
  // finally aunque la red falle; el fallback local sólo aplica si no existiera.
  const cerrarSesion = useCallback(async () => {
    try {
      if (typeof window.cerrarSesionServidor === 'function') {
        await window.cerrarSesionServidor();
      } else {
        sessionStorage.removeItem('an_usuario');
      }
    } catch (_) {}
    try {
      sessionStorage.removeItem('an_just_logged_in');
      localStorage.removeItem('an_role');
    } catch (_) {}
    window.location.href = 'login.html';
  }, []);

  const cargando = dash === null && !errorCarga;
  const inicial = (window.nombrePila(usuario.nombre) || 'U').charAt(0).toUpperCase();

  return (
    <React.Fragment>
      {previewKey && (
        <div className="vx-preview-ribbon">
          Vista previa de diseño · datos de ejemplo ({dash ? dash.asesor : '…'}). No conectado al servidor.
        </div>
      )}

      {/* HEADER — sin cambios */}
      <header className="vx-header">
        <div className="vx-header-in">
          <div className="vx-logo" />
          <div>
            <div className="vx-brand-t1">Academia Norteamericana</div>
            <div className="vx-brand-t2">Ventas · Estudiantes</div>
          </div>
          <div className="vx-header-spacer" />
          {esSupervisor && (
            <div className="vx-asesor-pick">
              <label htmlFor="vx-asesor">Ver como asesor:</label>
              <select
                id="vx-asesor"
                value={asesorSelectorValue}
                disabled={!previewKey && (asesoresEstado === 'loading' || asesoresSelector.length === 0)}
                onChange={e => setAsesorView(e.target.value)}>
                {!previewKey && asesoresEstado === 'loading' ? <option value="">Cargando asesores…</option> : null}
                {!previewKey && asesoresEstado === 'error' ? <option value="">No disponibles</option> : null}
                {!previewKey && asesoresEstado === 'ok' && asesoresSelector.length === 0 ? <option value="">Sin asesores activos</option> : null}
                {asesoresSelector.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {!previewKey && asesoresEstado === 'error' ? (
                <span style={{ fontSize: 11, color: 'var(--v-danger, #B42318)' }}>No pudimos cargar los asesores.</span>
              ) : null}
            </div>
          )}
          <div className="vx-user">
            <div className="vx-user-av">{inicial}</div>
            <div className="vx-user-meta">
              <div className="vx-user-name">{usuario.nombre}</div>
              <div className="vx-user-role">{rolLabel}</div>
            </div>
          </div>
          <button
            className="vx-btn vx-btn-ghost"
            style={{ marginLeft: 12, flexShrink: 0 }}
            title="Cerrar sesión"
            onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="vx-wrap">
        {errorCarga ? (
          <div className="vx-error-card">
            <div className="vx-error-icon"><window.Vico d={window.VI.alert} size={26} /></div>
            <div className="vx-error-title">No pudimos cargar tu panel</div>
            <div className="vx-error-msg">{errorCarga}</div>
            <button className="vx-btn vx-btn-navy" onClick={() => setReloadTick(t => t + 1)}>Reintentar</button>
          </div>
        ) : cargando ? (
          <window.ResumenSkeleton />
        ) : (
          <React.Fragment>
            {/* 1 · ESTUDIANTES (tabla y reglas de permanencia intactas) */}
            <div className="vx-sec">
              <div className="vx-sec-h">Estudiantes</div>
              <window.FiltroChip etapa={filtro.etapa} onClear={() => setFiltro(f => ({ ...f, etapa: '' }))} />
              <div style={{ marginBottom: 14 }}>
                <window.FilterBar filtro={filtro} setFiltro={setFiltro} resultCount={filtered.length} />
              </div>
              {filtered.length === 0 ? (
                <div className="vx-tablecard">
                  <div className="vx-empty">
                    <div className="vx-empty-icon">🔍</div>
                    <div style={{ fontWeight: 600, color: 'var(--v-ink-2)' }}>
                      {prospectos.length === 0
                        ? 'No tenés prospectos en esta vista todavía.'
                        : 'Ningún prospecto coincide con los filtros.'}
                    </div>
                  </div>
                </div>
              ) : (
                <React.Fragment>
                  <window.ProspectoTable lista={filtered} onOpen={p => setDrawerCed(p.cedula)} />
                  <window.ProspectoCards lista={filtered} onOpen={p => setDrawerCed(p.cedula)} />
                </React.Fragment>
              )}
            </div>

            {/* 2 · GRUPOS DISPONIBLES */}
            <div className="vx-sec">
              <div className="vx-sec-h">Grupos Disponibles</div>
              <window.MisGrupos grupos={dash.grupos_disponibles} />
            </div>

            {/* 3 · MIS MATRÍCULAS (mes actual, por semanas — VENTAS-DASHBOARD-002) */}
            <div className="vx-sec vx-sec-week">
              <window.MiMatriculasMes asesor={scopeAsesor} />
            </div>

            {/* 4 · MI EMBUDO */}
            <div className="vx-sec">
              <div className="vx-sec-h">Mi embudo</div>
              <window.MiEmbudo embudo={dash.embudo} etapaActiva={filtro.etapa} onPick={pickEtapa} />
            </div>
          </React.Fragment>
        )}
      </div>

      {/* DRAWER — intacto. La sección "Documentos del estudiante" vive AHORA dentro
          del propio drawer (VENTAS-DASHBOARD-002 O6–O8), no como botón flotante. */}
      {drawerCed && (
        <window.ProspectoDrawer
          cedula={drawerCed}
          seed={prospectos ? prospectos.find(p => p.cedula === drawerCed) : null}
          asesor={scopeAsesor}
          usuario={usuario}
          demo={!!previewKey}
          esSuperadmin={rolReal === 'superadmin'}
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

// ── Pantalla "No autorizado" (rol fuera de la lista permitida) ──────────────
function NoAutorizado({ rol }) {
  return (
    <div className="vx-wrap">
      <div className="vx-error-card">
        <div className="vx-error-title">No autorizado</div>
        <div className="vx-error-msg">
          Tu cuenta{rol ? <> (rol <strong>{rol}</strong>)</> : null} no tiene acceso
          al panel de ventas.
        </div>
        <button className="vx-btn vx-btn-navy" onClick={vxIrALogin}>Volver al login</button>
      </div>
    </div>
  );
}

// ── Guard de sesión (SEC-005-B1) ───────────────────────────────────────────
// Resuelve la identidad ANTES de montar el panel. No fabrica sesiones.
//   1) getSesion() + token; si falta cualquiera → login.html.
//   2) validarSesionServidor() (si existe); si no es ok → cierra sesión y login.
//   3) rol ∈ {superadmin, admin, ventas}; si no → "No autorizado".
function VentasGate() {
  const [estado, setEstado] = useState('check');   // 'check' | 'ok' | 'denegado'
  const [sesion, setSesion] = useState(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const ses = (typeof window.getSesion === 'function') ? window.getSesion() : null;
      const token = (typeof window.getSessionToken === 'function')
        ? window.getSessionToken()
        : (ses && ses.token) || '';

      // 1) Sin sesión o sin token → al login. No se crea ninguna sesión.
      if (!ses || !token) { vxIrALogin(); return; }

      // 2) Validación contra el servidor (si la función está disponible).
      if (typeof window.validarSesionServidor === 'function') {
        let r = null;
        try { r = await window.validarSesionServidor(); } catch (_) { r = null; }
        if (cancel) return;
        if (!r || !r.ok) {
          // Sesión inválida/expirada o sin conexión: limpiamos y al login.
          try {
            if (typeof window.cerrarSesionServidor === 'function') {
              await window.cerrarSesionServidor();
            } else {
              sessionStorage.removeItem('an_usuario');
            }
          } catch (_) {}
          if (!cancel) vxIrALogin();
          return;
        }
      }

      // 3) Rol permitido.
      if (cancel) return;
      if (!VX_ROLES_PERMITIDOS.includes(ses.rol)) {
        setSesion(ses);
        setEstado('denegado');
        return;
      }
      setSesion(ses);
      setEstado('ok');
    })();
    return () => { cancel = true; };
  }, []);

  if (estado === 'check') return null;                         // sin flash de UI
  if (estado === 'denegado') return <NoAutorizado rol={sesion ? sesion.rol : ''} />;
  return <VentasApp sesion={sesion} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<VentasGate />);