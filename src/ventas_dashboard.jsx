/* global React, ReactDOM, window */
/* ============================================================================
   VENTAS — Dashboard principal (ventas_dashboard.jsx) · Fase 3
   Panel del vendedor reorganizado para responder en 3 segundos
   "¿qué tengo que hacer hoy?". Tres bloques nuevos arriba:
     1. Mi semana  · 2. Mi embudo (clickeable)  · 3. Mis grupos disponibles
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

// ── VENTAS-DOC-002-B · Documentos del estudiante (hoja matrícula / CONAPE) ─────
// Modal que reutiliza el endpoint SEGURO de ventas (generarDocumentoVentas).
// Solo ofrece los botones cuando el estudiante ya tiene CÓDIGO real (admin
// finalizó la matrícula). El backend es la barrera real (propiedad + estado);
// el frontend solo mejora la UX. NUNCA llama generarDocumento directo.
function DocumentosModalVentas({ prospecto, demo, onClose, onToast }) {
  const [det, setDet] = useState(prospecto || {});
  const [cargando, setCargando] = useState(!demo);
  const [busy, setBusy] = useState('');     // '' | 'CERTIFICADO' | 'MATRICULA_2'
  const [err, setErr] = useState('');

  // Enriquecer con el detalle real (código/etapa/nivel) si no es preview.
  useEffect(() => {
    if (demo) return;
    let cancel = false;
    (async () => {
      try {
        const d = await window.getProspectoDetalle(prospecto.cedula);
        if (cancel) return;
        const p = d && (d.prospecto || (d.ok !== false ? d : null));
        if (p && typeof p === 'object') setDet(prev => ({ ...prev, ...p }));
      } catch (_) { /* usa el seed */ }
      finally { if (!cancel) setCargando(false); }
    })();
    return () => { cancel = true; };
  }, [prospecto.cedula, demo]);

  // Campo real del código de estudiante (tolerante a mayúsculas / alias).
  const codigo = String(
    det.codigo || det.codigo_estudiante || det.CODIGO_ESTUDIANTE || det.rec_m || ''
  ).trim();
  const tieneCodigo = !!codigo;
  const nivel = det.nivel || det.NIVEL || 'B1';

  const generar = async (tipo) => {
    if (busy) return;
    setBusy(tipo); setErr('');
    try {
      const r = await window.generarDocumentoVentasSeguro({
        cedula: det.cedula || prospecto.cedula, codigo, nivel, tipo,
      });
      if (r && r.ok && r.url) {
        window.open(r.url, '_blank', 'noopener');
        onToast && onToast({ tipo: 'ok', msg: 'Documento generado correctamente.' });
      } else {
        const fallback = tipo === 'MATRICULA_2'
          ? 'Documento CONAPE no disponible todavía. Puede requerir nivel anterior aprobado.'
          : 'No se pudo generar el documento.';
        const msg = (r && r.error) || fallback;
        setErr(msg);
        onToast && onToast({ tipo: 'err', msg });
      }
    } catch (_) {
      const msg = 'No se pudo generar el documento.';
      setErr(msg);
      onToast && onToast({ tipo: 'err', msg });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="vx-modal-scrim" onClick={busy ? undefined : onClose}>
      <div className="vx-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="vx-modal-head">
          <div className="vx-modal-title">Documentos del estudiante</div>
          <div className="vx-modal-sub">{det.nombre || prospecto.nombre || prospecto.cedula}</div>
        </div>
        <div className="vx-modal-body">
          {cargando ? (
            <div style={{ fontSize: 13, color: 'var(--v-ink-3)', padding: '8px 0' }}>Cargando…</div>
          ) : !tieneCodigo ? (
            <div style={{ fontSize: 13, color: 'var(--v-ink-3)', lineHeight: 1.5, padding: '6px 0' }}>
              Los documentos estarán disponibles cuando administración finalice la matrícula.
            </div>
          ) : (
            <React.Fragment>
              <div style={{ fontSize: 12, color: 'var(--v-ink-3)', marginBottom: 12, lineHeight: 1.5 }}>
                Generá y enviá al estudiante los documentos de su matrícula. Código:{' '}
                <strong style={{ fontFamily: 'monospace', color: 'var(--v-ink-2)' }}>{codigo}</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="vx-btn vx-btn-navy" style={{ justifyContent: 'center' }}
                  disabled={!!busy} onClick={() => generar('CERTIFICADO')}>
                  {busy === 'CERTIFICADO' ? 'Generando…' : '📄 Hoja de matrícula'}
                </button>
                <button className="vx-btn vx-btn-ghost" style={{ justifyContent: 'center' }}
                  disabled={!!busy} onClick={() => generar('MATRICULA_2')}>
                  {busy === 'MATRICULA_2' ? 'Generando…' : '📄 Documento CONAPE'}
                </button>
              </div>
              {err && (
                <div className="vx-inline-err" style={{ marginTop: 12 }}>
                  <span>{err}</span>
                </div>
              )}
            </React.Fragment>
          )}
        </div>
        <div className="vx-modal-foot">
          <button className="vx-btn vx-btn-ghost" onClick={onClose} disabled={!!busy}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

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

  const [asesorView, setAsesorView] = useState('');       // superadmin: ver como asesor
  const [dash, setDash] = useState(null);                 // null = cargando
  const [filtro, setFiltro] = useState({ etapa: '', fin: '', q: '' });
  const [drawerCed, setDrawerCed] = useState(null);
  const [docsProsp, setDocsProsp] = useState(null);   // VENTAS-DOC-002-B: modal documentos
  const [lightbox, setLightbox] = useState(null);
  const [toast, setToast] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  // El endpoint necesita SIEMPRE un asesor concreto. Superadmin: el seleccionado
  // o, por defecto, su propio nombre.
  const scopeAsesor = esSupervisor ? (asesorView || usuario.nombre) : usuario.nombre;

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
      try {
        const data = await window.getDashboardVentas(scopeAsesor);
        if (cancel) return;
        if (!data || !data.ok) throw new Error((data && data.error) || 'No se pudo cargar el panel.');
        setDash({
          asesor: data.asesor,
          semana_actual: data.semana_actual || { matriculas: 0, promedio_4s: 0 },
          embudo: Array.isArray(data.embudo) ? data.embudo : [],
          prospectos: (data.prospectos || []).map(window.adaptProspectoDash),
          grupos_disponibles: data.grupos_disponibles || [],
          total_prospectos: data.total_prospectos,
        });
      } catch (e) {
        if (!cancel) setErrorCarga(e.message || 'No pudimos cargar tu panel desde el servidor.');
      }
    })();
    return () => { cancel = true; };
  }, [scopeAsesor, reloadTick, previewKey]);

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
    return prospectos.filter(p => {
      if (filtro.etapa && p.etapa !== filtro.etapa) return false;
      if (filtro.fin && p.financiamiento !== filtro.fin) return false;
      if (q && !(`${p.nombre} ${p.cedula}`.toLowerCase().includes(q))) return false;
      return true;
    });
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
            <div className="vx-brand-t2">Ventas · Prospectos</div>
          </div>
          <div className="vx-header-spacer" />
          {esSupervisor && (
            <div className="vx-asesor-pick">
              <label htmlFor="vx-asesor">Ver como asesor:</label>
              <select id="vx-asesor" value={asesorView} onChange={e => setAsesorView(e.target.value)}>
                {window.ASESORES_V.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
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
            {/* 1 · MI SEMANA */}
            <div className="vx-sec vx-sec-week">
              <window.MiSemana semana={dash.semana_actual} />
            </div>

            {/* 1b · MIS MATRÍCULAS POR DÍA (Fase 3.7) */}
            <div className="vx-sec">
              <window.MiCalendarioSemanal asesor={usuario.nombre} />
            </div>

            {/* 2 · MI EMBUDO */}
            <div className="vx-sec">
              <div className="vx-sec-h">Mi embudo</div>
              <window.MiEmbudo embudo={dash.embudo} etapaActiva={filtro.etapa} onPick={pickEtapa} />
            </div>

            {/* 3 · MIS GRUPOS DISPONIBLES */}
            <div className="vx-sec">
              <div className="vx-sec-h">Mis grupos disponibles</div>
              <window.MisGrupos grupos={dash.grupos_disponibles} />
            </div>

            {/* 4 · PROSPECTOS (tabla intacta) */}
            <div className="vx-sec">
              <div className="vx-sec-h">Prospectos</div>
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
          </React.Fragment>
        )}
      </div>

      {/* DRAWER — intacto, + acción sugerida por etapa */}
      {drawerCed && (
        <window.ProspectoDrawer
          cedula={drawerCed}
          seed={prospectos ? prospectos.find(p => p.cedula === drawerCed) : null}
          asesor={usuario.nombre}
          usuario={usuario}
          demo={!!previewKey}
          esSuperadmin={rolReal === 'superadmin'}
          onClose={() => { setDrawerCed(null); setDocsProsp(null); }}
          onToast={setToast}
          onView={(src, caption) => setLightbox({ src, caption })}
          onChanged={onChanged}
        />
      )}

      {/* VENTAS-DOC-002-B · acceso a Documentos del estudiante desde el detalle abierto */}
      {drawerCed && (
        <button
          className="vx-btn vx-btn-navy"
          style={{ position: 'fixed', left: 24, bottom: 24, zIndex: 1100,
                   boxShadow: '0 8px 24px rgba(0,0,0,.22)', flexShrink: 0 }}
          title="Documentos del estudiante"
          onClick={() => setDocsProsp(
            (prospectos ? prospectos.find(p => p.cedula === drawerCed) : null) || { cedula: drawerCed }
          )}>
          📄 Documentos del estudiante
        </button>
      )}
      {docsProsp && (
        <DocumentosModalVentas
          prospecto={docsProsp}
          demo={!!previewKey}
          onClose={() => setDocsProsp(null)}
          onToast={setToast}
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
