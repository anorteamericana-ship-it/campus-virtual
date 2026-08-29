/* global React */
/* ============================================================================
   Matrículas · Admin — componentes nuevos (Cambios 6, 8, 9, 10)
   Se exportan a window para que src/matriculas.jsx los consuma.
   Envuelto en IIFE: en campus.html conviven ~20 scripts Babel en el mismo
   scope global, así que NO declaramos consts a nivel de módulo.
   ============================================================================ */
(function () {
  const { useState, useEffect } = React;
  const API = window.APPS_SCRIPT_URL;

  const enc = encodeURIComponent;
  // Fase 3.6 — modo demo (preview): NO tocar el backend real. getProspectoDetalle,
  // notas, proformas y CONAPE devuelven datos de ejemplo. Se activa con
  // ?demo=1 / ?preview=… en la URL.
  const MAT_ADMIN_DEMO = (() => {
    try { const q = new URLSearchParams(location.search); return q.get('demo') === '1' || !!q.get('preview'); }
    catch (_) { return false; }
  })();
  const DEMO_DETALLE = {
    '120180140': { nombre: 'RODRIGUEZ PALACIOS DEBORA', cedula: '1-2018-0140', tipo_id: 'Cédula nacional', correo: 'debora.rp@gmail.com', whatsapp: '8888-8888', telefono: '8888-8888', sexo: 'F', fecha_nac: '2003-02-11', provincia: 'San José', canton: 'Desamparados', distrito: 'San Antonio', direccion: 'Barrio San Antonio, 200m sur de la iglesia, casa verde.', programa: 'INA', modalidad: 'INTENSIVO', grupo_tentativo: 'B1-LM18-C3-0726', financiamiento: 'PROPIO', beca: '', beca_estado: '', etapa: 'ACTIVO', como_entero: 'Recomendación', asesor_ref: 'Asesora Demo 1', conocimientos_previos: 'Básico', notas: 'Matriculada el 5-jun. Pago de matrícula reportado por la asesora.', codigo_estudiante: '17193', es_menor: false, f_lead: '2026-06-04', f_activo: '2026-06-05' },
    '116880490': { nombre: 'CAMPOS UREÑA JOSUÉ', cedula: '1-1688-0490', tipo_id: 'Cédula nacional', correo: 'josue.campos@outlook.com', whatsapp: '6045-1120', sexo: 'M', fecha_nac: '2002-01-30', provincia: 'Heredia', canton: 'San Rafael', programa: 'INA', modalidad: 'INTENSIVO', grupo_tentativo: 'B1-LM18-C3-0726', financiamiento: 'CONAPE', etapa: 'CONAPE_SOLICITUD', asesor_ref: 'Asesora Demo 1', conape: { equipo: 'BASICO', toeic: true, sostenimiento: '₡40,000 por mes' }, notas: 'Inició la solicitud CONAPE.', es_menor: false, f_lead: '2026-05-21' },
  };
  function demoDetalle(cedula) {
    const k = String(cedula || '').replace(/\D/g, '');
    return DEMO_DETALLE[k] || { nombre: 'Prospecto (demo)', cedula, correo: '—', whatsapp: '—', programa: '—', financiamiento: '—', etapa: '—', notas: '(datos de ejemplo — modo demo)' };
  }

  async function apiGet(qs) {
    if (MAT_ADMIN_DEMO) {
      if (qs.includes('fn=getProspectoDetalle')) {
        const m = qs.match(/cedula=([^&]+)/);
        return { ok: true, prospecto: demoDetalle(m ? decodeURIComponent(m[1]) : '') };
      }
      if (qs.includes('fn=generarProformaProspecto')) return { ok: true, url_programa: '#demo', url_equipo: '#demo' };
      if (qs.includes('fn=actualizarEstadoConapeProspecto')) return { ok: true, novedad: 'aprobado_sin_desembolso', ultima_consulta: '2026-06-04 10:00', nombre_ws: 'SALAZAR CHACON (demo)' };
      return { ok: true };
    }
    const r = await fetch(`${API}?${qs}`);
    return await r.json();
  }
  // POST en text/plain para esquivar el preflight CORS (mismo patrón que ventas_data.jsx).
  async function apiPost(payload) {
    if (MAT_ADMIN_DEMO) {
      // En demo NO tocamos el backend real: getProspectoDetalle/getBecas
      // devuelven datos de ejemplo (mismo comportamiento que tenía apiGet).
      const fn = payload && payload.fn;
      if (fn === 'getProspectoDetalle') return { ok: true, prospecto: demoDetalle(payload.cedula || '') };
      if (fn === 'getBecas' && window.getBecas) return await window.getBecas(payload);
      if (fn === 'generarProformaProspecto') return { ok: true, url_programa: '#demo', url_equipo: '#demo' };
      if (fn === 'actualizarEstadoConapeProspecto') return { ok: true, novedad: 'aprobado_sin_desembolso', ultima_consulta: '2026-06-04 10:00', nombre_ws: 'SALAZAR CHACON (demo)' };
      return { ok: true };
    }
    const token = window.getSessionToken ? window.getSessionToken() : '';
    // FIX-ROUTING-POST-APPS-SCRIPT-001: el Apps Script enruta por e.parameter.fn,
    // así que el ?fn= DEBE conservarse en la URL (sin él → "Función POST no
    // reconocida"). Sigue siendo POST text/plain; el token NO va en la URL.
    const fn = (payload && payload.fn) || '';
    const r = await fetch(`${API}?fn=${encodeURIComponent(fn)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      // FIX-MATRICULAS-ADMIN-003: apiPost SIEMPRE envía el token en el body JSON.
      // Sin esto el backend respondía 'sesion_requerida'. Si el payload ya trae
      // token explícito, ese gana (token: payload.token || token).
      body: JSON.stringify({ ...payload, token: payload.token || token }),
    });
    return await r.json();
  }
  // Endpoints de prospecto: self-contained. NO dependemos de window.getProspectoDetalle
  // ni window.agregarNotaProspecto — esas viven en ventas_data.jsx, que NO se carga en
  // campus.html (sí en la app de ventas). Llamarlas acá daba undefined() → pantalla en
  // blanco. Acá las invocamos directo contra el Apps Script.
  async function getDetalle(cedula) {
    // FIX-MATRICULAS-ADMIN-001: POST text/plain (apiPost), NO GET con fn/token en
    // la URL — ese GET provocaba el Error CORS ("Failed to fetch") al abrir el
    // modal "Generar matrícula". apiPost ya inyecta el token en el body.
    return await apiPost({ fn: 'getProspectoDetalle', cedula });
  }
  async function postNota(cedula, asesor, texto) {
    return await apiPost({ fn: 'agregarNotaProspecto', cedula, asesor, texto });
  }

  // Getter case-insensitive: tolera columnas MAYÚSCULAS de la hoja y llaves
  // minúsculas normalizadas. Aplana tutor.* y conape.* a tutor_x / conape_x.
  function flatten(d) {
    const o = { ...(d || {}) };
    if (d && d.tutor && typeof d.tutor === 'object') {
      o.tutor_nombre = d.tutor.nombre; o.tutor_cedula = d.tutor.cedula;
      o.tutor_correo = d.tutor.correo; o.tutor_tel = d.tutor.tel;
    }
    if (d && d.conape && typeof d.conape === 'object') {
      o.conape_equipo = d.conape.equipo; o.conape_toeic = d.conape.toeic;
      o.conape_sostenimiento = d.conape.sostenimiento;
    }
    return o;
  }
  function makeGet(obj) {
    const low = {};
    Object.keys(obj || {}).forEach(k => { low[k.toLowerCase()] = obj[k]; });
    return (...keys) => {
      for (const k of keys) {
        const v = low[String(k).toLowerCase()];
        if (v != null && v !== '') return v;
      }
      return '';
    };
  }
  function rolActual() {
    try { return (window.getSesion && window.getSesion() || {}).rol || ''; }
    catch (_) { return ''; }
  }
  function waNumber(raw) {
    let d = String(raw || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.length === 8) d = '506' + d;          // CR sin prefijo → anteponer 506
    return d;
  }
  const PLAN_LABEL = { BASICO: 'Plan Básico', PREMIUM: 'Plan Premium', NINGUNO: 'Sin equipo' };
  const boolTxt = (v) => (v === true || /^(true|s[ií]|1)$/i.test(String(v))) ? 'Sí'
    : (v === false || /^(false|no|0)$/i.test(String(v))) ? 'No' : (v || '');

  // ── Shell de modal ─────────────────────────────────────────────────────────
  function Modal({ size = 'md', kicker, title, onClose, children, footer }) {
    useEffect(() => {
      const h = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', h);
      return () => window.removeEventListener('keydown', h);
    }, [onClose]);
    return (
      <div className="mat-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className={`mat-modal ${size}`}>
          <div className="mat-modal-head">
            <div>
              {kicker && <div className="mat-modal-kicker">{kicker}</div>}
              <div className="mat-modal-title">{title}</div>
            </div>
            <button className="mat-x" onClick={onClose} aria-label="Cerrar">×</button>
          </div>
          <div className="mat-modal-body">{children}</div>
          {footer && <div className="mat-modal-foot">{footer}</div>}
        </div>
      </div>
    );
  }

  // ── Helpers de resumen ──────────────────────────────────────────────────────
  // Decodificador de días self-contained. Los códigos de grupos_abiertos llegan
  // limpios del backend (v4.30.2): "LM", "KJ", "S", "LJ".
  const DIAS_C = { L: 'Lun', K: 'Mar', M: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb' };
  function decodeDiasLocal(cod) {
    const c = String(cod || '').toUpperCase().trim();
    if (!c) return '';
    if (c === 'LJ') return 'Lun a Jue';
    const parts = c.split('').map(ch => DIAS_C[ch]).filter(Boolean);
    return parts.length ? parts.join('/') : c;
  }
  const MESES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
  function fmtFechaCorta(f) {
    const [y, m, d] = String(f || '').split('-').map(Number);
    if (!y || !m || !d) return String(f || '—');
    return `${d} ${MESES_C[m - 1]} ${y}`;
  }
  // Agrupa un array de prospectos por una llave (tolerante a MAY/min y vacío).
  function agrupar(prospectos, keys, vacioLabel) {
    const acc = {};
    (prospectos || []).forEach(p => {
      let v = '';
      for (const k of keys) { if (p[k] != null && String(p[k]).trim() !== '') { v = String(p[k]).trim(); break; } }
      const label = v || vacioLabel;
      acc[label] = (acc[label] || 0) + 1;
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }

  // ── Helpers de formato para las cards de grupo (Fase 2 · Cambio 1) ──────────
  // Self-contained dentro del IIFE (no dependemos de inscripcion_parts.jsx, que
  // NO se carga en campus.html). El admin trabaja en 24h; el formulario público
  // —que sí usa am/pm— tiene su propio formato y no se toca.
  const DIAS_LARGO_L = { L: 'Lunes', K: 'Martes', M: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado' };
  const MESES_LARGO_L = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const MESES_AB_L = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  // Código de días confiable de un grupo: 2º segmento del código (ej.
  // "B1-LM18-C3-0726" → "LM"); si no, deduce del campo dias.
  function diasCodeDe(g) {
    const code = String(g.codigo || '').toUpperCase();
    const seg = code.split('-')[1] || '';
    const fromCode = (seg.match(/^[LKMJVS]+/) || [''])[0];
    if (fromCode) return fromCode;
    return String(g.dias || '').toUpperCase().replace(/[^LKMJVS]/g, '');
  }
  // Línea 2 · nombre completo de días unidos por " y ". "LJ" → "Lunes a Jueves".
  function diasLargoY(g) {
    const c = diasCodeDe(g);
    if (!c) return '—';
    if (c === 'LJ') return 'Lunes a Jueves';                 // Super Intensivo · 4 días seguidos
    const orden = 'LKMJVS';
    const uniq = [...new Set(c.replace(/[^LKMJVS]/g, '').split(''))]
      .sort((a, b) => orden.indexOf(a) - orden.indexOf(b));
    const parts = uniq.map(ch => DIAS_LARGO_L[ch]).filter(Boolean);
    return parts.length ? parts.join(' y ') : '—';
  }
  // Convierte una hora a 24h "HH:mm". Acepta "HH:mm" (passthrough) o "6pm"/"6:30pm".
  function to24(h) {
    if (h == null || h === '') return '';
    const s = String(h).trim().toLowerCase();
    let m = s.match(/^(\d{1,2}):(\d{2})$/);                  // ya viene 24h
    if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
    m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);        // 12h → 24h
    if (m) { let hh = Number(m[1]) % 12; if (m[3] === 'pm') hh += 12; return `${String(hh).padStart(2, '0')}:${m[2] || '00'}`; }
    return s;
  }
  // Línea 3 · "HH:mm a HH:mm".
  function hora24Rango(g) {
    const a = to24(g.hora_ini), b = to24(g.hora_fin);
    return [a, b].filter(Boolean).join(' a ');
  }
  // Línea 4 · "Cuatrimestre 3 (Septiembre a Diciembre 2026)".
  // Tipo+nº del código (-C{N}- cuatrimestre/4 meses · -B{N}- bimestre/2 meses);
  // meses+año de fecha_inicio.
  function periodoParen(g) {
    const code = String(g.codigo || '').toUpperCase();
    const segs = code.split('-');
    let tipo = null, dur = 4, num = '';
    for (let i = 1; i < segs.length; i++) {                  // i=1: saltar el nivel (B1/I1…)
      const m = segs[i].match(/^([CB])(\d+)$/);
      if (m) { tipo = m[1] === 'B' ? 'Bimestre' : 'Cuatrimestre'; dur = m[1] === 'B' ? 2 : 4; num = m[2]; break; }
    }
    if (!tipo) return '—';
    const [y, mo] = String(g.fecha_inicio || '').split('-').map(Number);
    let rango = '';
    if (y && mo) { const endIdx = (mo - 1 + dur - 1) % 12; rango = `${MESES_LARGO_L[mo - 1]} a ${MESES_LARGO_L[endIdx]} ${y}`; }
    const izq = num ? `${tipo} ${num}` : tipo;
    return rango ? `${izq} (${rango})` : izq;
  }
  // Línea 5 · "14-sep-2026" (mes abreviado en minúscula).
  function fechaInicia(f) {
    const [y, m, d] = String(f || '').split('-').map(Number);
    if (!y || !m || !d) return '—';
    return `${String(d).padStart(2, '0')}-${MESES_AB_L[m - 1]}-${y}`;
  }

  // ── Cambio 6 (revisado) + Fase 2 · Resumen de Matrículas ────────────────────
  // Bloques: grupos abiertos (6 líneas exactas) · distribución de prospectos
  // (interactivo) · distribución de matriculados (informativo) · resumen por
  // asesor (4 métricas, interactivo) · comparativa. Los bloques interactivos
  // filtran la lista PRE MATRÍCULA (props filtroGrupo/filtroAsesor + toggles).
  function MatResumenActivos({ resumen, prospectos, filtroGrupo, filtroAsesor, onToggleGrupo, onToggleAsesor }) {
    if (!resumen && !(prospectos && prospectos.length)) return null;
    const r = resumen || {};
    const grupos = Array.isArray(r.grupos_abiertos) ? r.grupos_abiertos : [];
    const distrib = agrupar(prospectos, ['GRUPO_TENTATIVO', 'grupo_tentativo', 'grupo'], '(Sin grupo)');
    const matriculados = (Array.isArray(r.grupos_con_matriculados) ? r.grupos_con_matriculados : [])
      .filter(m => Number(m.matriculados) > 0);
    // Cambio 4: preferir asesores_resumen (v4.33.0). Fallback: conteo simple desde prospectos.
    const porAsesorFallback = agrupar(prospectos, ['ASESOR_REF', 'asesor_ref', 'asesor'], '(Sin asesor)');
    const asesores = (Array.isArray(r.asesores_resumen) && r.asesores_resumen.length)
      ? r.asesores_resumen
      : porAsesorFallback.map(([nombre, n]) => ({ nombre, prospectos: n, mat_semana: null, mat_mes: null, rendimiento: null }));
    const tasa = r.tasa_conversion;
    const totalProsp = (prospectos || []).length;

    const cupoBadge = (g) => {
      const disp = Number(g.cupo_disponible);
      if (disp === 0) return ['Cerrado', 'mat-gb-red'];
      if (disp <= 3) return ['Pocos cupos', 'mat-gb-yellow'];
      return ['Disponible', 'mat-gb-green'];
    };
    const dispCls = (disp) => Number(disp) === 0 ? 'mat-disp-red' : Number(disp) <= 3 ? 'mat-disp-yellow' : 'mat-disp-green';

    const HINT = {
      prospectos: 'Leads + matrículas generadas pero con matrícula B1 sin pagar todavía.',
      mat_semana: 'Matrículas con pago de B1 confirmado en los últimos 7 días.',
      mat_mes: 'Matrículas con pago de B1 confirmado en los últimos 30 días.',
      rendimiento: 'Conversión = mat_mes / (mat_mes + prospectos) × 100.',
    };

    return (
      <div className="mat-resumen2">
        {/* ── Grupos abiertos para inscripción (Cambio 1) ── */}
        <div className="card mat-r2-grupos">
          <div className="mat-res-h">Grupos abiertos para inscripción</div>
          {grupos.length === 0 ? (
            <div className="mat-r2-empty">No hay grupos con inicio próximo.</div>
          ) : (
            <div className="mat-gb-grid">
              {grupos.map((g, i) => {
                const [badgeTxt, badgeCls] = cupoBadge(g);
                const disp = Number(g.cupo_disponible) || 0;
                return (
                  <div key={g.codigo || i} className="mat-gb-card">
                    <div className="mat-gb-top">
                      <span className="mat-gb-cod">{g.codigo || '—'}</span>
                      <span className={`mat-gb-badge ${badgeCls}`}>{badgeTxt}</span>
                    </div>
                    <div className="mat-gb-dias">{diasLargoY(g)}</div>
                    <div className="mat-gb-hora">{hora24Rango(g) || '—'}</div>
                    <div className="mat-gb-periodo">{periodoParen(g)}</div>
                    <div className="mat-gb-inicia">Inicia {fechaInicia(g.fecha_inicio)}</div>
                    <div className={`mat-gb-cupos ${badgeCls}`}>{disp} {disp === 1 ? 'cupo disponible' : 'cupos disponibles'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Distribución de prospectos por grupo (Cambio 2 · interactivo) ── */}
        <div className="card mat-r2-distrib">
          <div className="mat-res-h">Distribución de prospectos por grupo</div>
          {distrib.length === 0 ? (
            <div className="mat-r2-empty">Sin prospectos en pre matrícula.</div>
          ) : (
            <div className="mat-kv-list">
              {distrib.map(([g, n]) => (
                <div key={g} role="button" tabIndex={0}
                  className={'mat-kv mat-kv-click' + (filtroGrupo === g ? ' active' : '')}
                  onClick={() => onToggleGrupo && onToggleGrupo(g)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleGrupo && onToggleGrupo(g); } }}>
                  <span className="mat-kv-k mono">{g}</span>
                  <span className="mat-kv-n">{n} <i>{n === 1 ? 'prospecto' : 'prospectos'}</i></span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Distribución de matriculados por grupo (Cambio 3 · informativo) ── */}
        <div className="card mat-r2-matric">
          <div className="mat-res-h">Distribución de matriculados por grupo</div>
          {matriculados.length === 0 ? (
            <div className="mat-r2-empty">Aún no hay grupos con estudiantes matriculados.</div>
          ) : (
            <table className="mat-mtable">
              <thead>
                <tr><th>Grupo</th><th className="num">Matriculados / disponible</th></tr>
              </thead>
              <tbody>
                {matriculados.map((m, i) => (
                  <tr key={m.codigo || i}>
                    <td className="mono">{m.codigo || '—'}</td>
                    <td className="num">
                      <b>{m.matriculados != null ? m.matriculados : '—'}</b>
                      {' / '}
                      <span className={dispCls(m.cupo_disponible)}>disponible: {m.cupo_disponible != null ? m.cupo_disponible : '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Resumen por asesor (Cambio 4 · 4 métricas · interactivo) ── */}
        <div className="card mat-r2-asesor">
          <div className="mat-res-h">Resumen por asesor</div>
          {asesores.length === 0 ? (
            <div className="mat-r2-empty">Sin prospectos asignados.</div>
          ) : (
            <table className="mat-atable">
              <thead>
                <tr>
                  <th>Asesor</th>
                  <th className="num">Prospectos <span className="mat-hint" title={HINT.prospectos}>?</span></th>
                  <th className="num">Mat. semana <span className="mat-hint" title={HINT.mat_semana}>?</span></th>
                  <th className="num">Mat. mes <span className="mat-hint" title={HINT.mat_mes}>?</span></th>
                  <th className="num">Rendimiento <span className="mat-hint" title={HINT.rendimiento}>?</span></th>
                </tr>
              </thead>
              <tbody>
                {asesores.map((a, i) => {
                  const inactivo = Number(a.prospectos || 0) === 0 && Number(a.mat_mes || 0) === 0;
                  const active = filtroAsesor && filtroAsesor === a.nombre;
                  return (
                    <tr key={a.nombre || a.cedula || i}
                      className={'mat-arow' + (inactivo ? ' inactivo' : '') + (active ? ' active' : '')}
                      onClick={() => onToggleAsesor && onToggleAsesor(a.nombre)}>
                      <td className="mat-arow-name">{a.nombre || '—'}</td>
                      <td className="num">{a.prospectos != null ? a.prospectos : '—'}</td>
                      <td className="num">{a.mat_semana != null ? a.mat_semana : '—'}</td>
                      <td className="num">{a.mat_mes != null ? a.mat_mes : '—'}</td>
                      <td className="num">{a.rendimiento != null ? `${Number(a.rendimiento).toFixed(1)}%` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Comparativa (se mantiene) ── */}
        <div className="card mat-r2-comp">
          <div className="mat-res-h">Comparativa</div>
          <div className="mat-comp">
            <div className="mat-comp-row">
              <span className="mat-comp-l">Activos</span>
              <span className="mat-comp-v">{r.total_activos != null ? r.total_activos : '—'}</span>
            </div>
            <div className="mat-comp-row">
              <span className="mat-comp-l">PRE MATRÍCULA</span>
              <span className="mat-comp-v">{r.total_prospectos_no_activos != null ? r.total_prospectos_no_activos : totalProsp}</span>
            </div>
            <div className="mat-comp-row mat-comp-tasa">
              <span className="mat-comp-l">Tasa de conversión</span>
              <span className="mat-comp-v">{tasa != null ? `${tasa}%` : '—'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Cambio 8 · Modal "Ver formulario" ───────────────────────────────────────
  function FRow({ label, value, editable, onChange, full, mono, textarea, tag }) {
    const v = value == null ? '' : value;
    return (
      <div className={'mat-frow' + (full ? ' full' : '')}>
        <div className="mat-flabel">{label}{tag && <span className="mat-readonly-tag" style={{ marginLeft: 6 }}>{tag}</span>}</div>
        {editable
          ? (textarea
            ? <textarea className="mat-ftext" value={v} onChange={e => onChange(e.target.value)} />
            : <input className="mat-finput" value={v} onChange={e => onChange(e.target.value)} />)
          : <div className={'mat-fval' + (mono ? ' mono' : '')}>{v !== '' ? String(v) : '—'}</div>}
      </div>
    );
  }

  // ── Bug A · Section a nivel de MÓDULO (no inline) ───────────────────────────
  // Antes esto estaba definido DENTRO de MatProspectoModal. Cada onChange/keystroke
  // re-renderiza el modal y, al ser un componente declarado inline, React veía un
  // TIPO de componente nuevo en cada render → desmontaba y remontaba TODO el subárbol
  // (incluidos los <input>) → el cursor perdía el foco y la UI parpadeaba en cada letra.
  // Como componente estable de módulo, los <FRow> conservan su identidad y el texto se
  // escribe fluido. val/editableOf/onCh llegan por props (cierres sobre el estado local).
  function Section({ title, fields, val, editableOf, onCh }) {
    return (
      <div className="mat-sec">
        <div className="mat-sec-h">{title}</div>
        <div className="mat-grid">
          {fields.map(f => (
            <FRow key={f.k} label={f.label} value={val(f)} editable={editableOf(f)}
              onChange={onCh(f)} full={f.full} mono={f.mono} textarea={f.textarea}
              tag={f.ro ? 'solo lectura' : null} />
          ))}
        </div>
      </div>
    );
  }

  // SEC-002 CS21A174 · CONSUMIDOR LEGACY TEMPORAL.
  // Cédula frente/dorso y título todavía llegan como URL Drive/LH3 histórica. Los
  // candidatos alternativos conservan la operación actual, pero NO son el arreglo
  // de seguridad y NO autorizan setSharing público ni ampliar ACL. El destino es
  // entrega privada autenticada expediente+document_type -> Blob/ObjectURL. Issue
  // #111 gobierna el backend; retirar ACL solo después de migrar y probar consumidores.
  function extractDriveId(url) {
    const s = String(url || '');
    let m = s.match(/[?&]id=([\w-]+)/);          // uc?export=view&id= · thumbnail?id=
    if (m) return m[1];
    m = s.match(/\/d\/([\w-]+)/);                 // lh3 .../d/{id} · file/d/{id}
    if (m) return m[1];
    return '';
  }
  function driveCandidates(url) {
    const id = extractDriveId(url);
    const list = [url];
    if (id) {
      list.push(`https://drive.google.com/thumbnail?id=${id}&sz=w1000`);
      list.push(`https://drive.google.com/uc?export=view&id=${id}`);
      list.push(`https://lh3.googleusercontent.com/d/${id}=w1000`);
    }
    return [...new Set(list.filter(Boolean))];
  }
  function MatDocPhoto({ cap, src, onOpen }) {
    const [idx, setIdx] = useState(0);
    const cands = driveCandidates(src);
    if (idx >= cands.length) {
      return (
        <div className="mat-photo-empty">
          <span>Foto no disponible</span>
          <span className="mat-photo-cap">{cap}</span>
        </div>
      );
    }
    const cur = cands[idx];
    return (
      <div className="mat-photo" onClick={() => onOpen(cur)}>
        <img src={cur} alt={cap} onError={() => setIdx(i => i + 1)} />
        <div className="mat-photo-cap">{cap}</div>
      </div>
    );
  }

  function MatProspectoModal({ cedula, nombre, onClose, onToast }) {
    const rol = rolActual();
    const canEditAll = rol === 'admin' || rol === 'superadmin';
    const isVentas = rol === 'ventas';

    const [detalle, setDetalle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [edited, setEdited] = useState({});
    const [notaNueva, setNotaNueva] = useState('');
    const [lightbox, setLightbox] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      let cancel = false;
      getDetalle(cedula)
        .then(d => { if (cancel) return; const p = (d && (d.prospecto || (d.ok !== false ? d : null))); if (p) setDetalle(flatten(p)); else setError((d && d.error) || 'No se pudo cargar el prospecto.'); })
        .catch(e => { if (!cancel) setError(e.message); })
        .finally(() => { if (!cancel) setLoading(false); });
      return () => { cancel = true; };
    }, [cedula]);

    const get = makeGet(detalle || {});
    const val = (f) => {
      if (edited[f.k] !== undefined) return edited[f.k];
      let v = get(...(f.al || [f.k]));
      if (f.bool) v = boolTxt(v);
      return v == null ? '' : v;
    };
    const onCh = (f) => (nv) => setEdited(e => ({ ...e, [f.k]: nv }));
    const editableOf = (f) => canEditAll && !f.ro && !f.bool;

    const fin = get('financiamiento', 'FINANCIAMIENTO');
    const esConape = /conape/i.test(fin);
    const esMenor = boolTxt(get('es_menor', 'ES_MENOR')) === 'Sí' || get('tutor_nombre', 'TUTOR_NOMBRE');

    const guardarNota = async () => {
      if (!notaNueva.trim()) return;
      setSaving(true);
      try {
        const asesor = (window.getSesion && window.getSesion() || {}).nombre || 'Asesor';
        const r = await postNota(cedula, asesor, notaNueva.trim());
        if (r && r.ok) { onToast('Nota guardada.', 'ok'); setNotaNueva(''); }
        else onToast((r && r.error) || 'No se pudo guardar la nota.', 'err');
      } catch (e) { onToast('Error de conexión: ' + e.message, 'err'); }
      finally { setSaving(false); }
    };
    const guardarCambios = () => onToast('Próximamente: guardado completo de campos.', 'info');

    const footer = loading || error ? (
      <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
    ) : isVentas ? (
      <>
        <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        <button className="btn btn-primary" onClick={guardarNota} disabled={saving || !notaNueva.trim()}>
          {saving ? 'Guardando…' : 'Guardar nota'}
        </button>
      </>
    ) : canEditAll ? (
      <>
        <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        <button className="btn btn-primary" onClick={guardarCambios}>Guardar cambios</button>
      </>
    ) : (
      <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
    );

    return (
      <Modal size="lg" kicker={`Prospecto · ${cedula}`} title={nombre || get('nombre', 'NOMBRE') || 'Formulario'} onClose={onClose} footer={footer}>
        {loading && <div className="mat-center"><div className="mat-spin" />Cargando formulario…</div>}
        {!loading && error && <div className="mat-center" style={{ color: 'var(--danger)' }}>⚠️ {error}</div>}
        {!loading && !error && detalle && (
          <>
            {isVentas && (
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                Como asesor de ventas solo podés editar el bloque de <b>notas</b>. El resto es de solo lectura.
              </div>
            )}

            <Section title="Datos personales" val={val} editableOf={editableOf} onCh={onCh} fields={[
              { k: 'nombre', label: 'Nombre completo', full: true },
              { k: 'cedula', label: 'Cédula', mono: true },
              { k: 'tipo_id', label: 'Tipo de identificación' },
              { k: 'correo', label: 'Correo' },
              { k: 'whatsapp', label: 'WhatsApp', mono: true },
              { k: 'telefono', label: 'Teléfono', mono: true },
              { k: 'sexo', label: 'Sexo' },
              { k: 'fecha_nac', label: 'Fecha de nacimiento' },
              { k: 'provincia', label: 'Provincia' },
              { k: 'canton', label: 'Cantón' },
              { k: 'distrito', label: 'Distrito' },
              { k: 'direccion', label: 'Dirección', full: true, textarea: true },
            ]} />

            {esMenor && (
              <Section title="Encargado / Tutor" val={val} editableOf={editableOf} onCh={onCh} fields={[
                { k: 'tutor_nombre', label: 'Nombre del encargado', full: true },
                { k: 'tutor_cedula', label: 'Cédula', mono: true },
                { k: 'tutor_tel', label: 'Teléfono', mono: true },
                { k: 'tutor_correo', label: 'Correo', full: true },
              ]} />
            )}

            <Section title="Programa y financiamiento" val={val} editableOf={editableOf} onCh={onCh} fields={[
              { k: 'programa', label: 'Programa' },
              { k: 'modalidad', label: 'Modalidad' },
              { k: 'grupo_tentativo', label: 'Grupo tentativo', mono: true, al: ['grupo_tentativo', 'GRUPO_TENTATIVO', 'grupo'] },
              { k: 'financiamiento', label: 'Financiamiento' },
              { k: 'beca', label: 'Beca' },
              { k: 'beca_estado', label: 'Estado de beca', al: ['beca_estado', 'BECA_ESTADO'] },
            ]} />

            {esConape && (
              <Section title="CONAPE" val={val} editableOf={editableOf} onCh={onCh} fields={[
                { k: 'conape_equipo', label: 'Equipo' },
                { k: 'conape_toeic', label: 'TOEIC', bool: true },
                { k: 'conape_sostenimiento', label: 'Sostenimiento', full: true },
                { k: 'conape_ws_ultimo_desembolso', label: 'WS · Último desembolso', ro: true, al: ['conape_ws_ultimo_desembolso', 'CONAPE_WS_ULTIMO_DESEMBOLSO'] },
                { k: 'conape_ws_ultima_consulta', label: 'WS · Última consulta', ro: true, al: ['conape_ws_ultima_consulta', 'CONAPE_WS_ULTIMA_CONSULTA'] },
              ]} />
            )}

            <Section title="Seguimiento" val={val} editableOf={editableOf} onCh={onCh} fields={[
              { k: 'como_entero', label: '¿Cómo se enteró?', al: ['como_entero', 'COMO_ENTERO'] },
              { k: 'asesor_ref', label: 'Asesor de referencia', al: ['asesor_ref', 'ASESOR_REF', 'asesor'] },
              { k: 'conocimientos_previos', label: 'Conocimientos previos', al: ['conocimientos_previos', 'CONOCIMIENTOS_PREVIOS'] },
              { k: 'etapa', label: 'Etapa', al: ['etapa', 'ETAPA'] },
              { k: 'notas', label: 'Notas', full: true, textarea: true, al: ['notas', 'NOTAS'] },
            ]} />

            {isVentas && (
              <div className="mat-sec">
                <div className="mat-sec-h">Agregar nota</div>
                <textarea className="mat-ftext" value={notaNueva} placeholder="Escribí una nota de seguimiento…"
                  onChange={e => setNotaNueva(e.target.value)} />
              </div>
            )}

            <Section title="Fechas del proceso" val={val} editableOf={editableOf} onCh={onCh} fields={[
              { k: 'f_lead', label: 'F. Lead', ro: true, al: ['f_lead', 'F_LEAD'] },
              { k: 'f_solicitud', label: 'F. Solicitud', ro: true, al: ['f_solicitud', 'F_SOLICITUD'] },
              { k: 'f_documentos', label: 'F. Documentos', ro: true, al: ['f_documentos', 'F_DOCUMENTOS'] },
              { k: 'f_aprobado', label: 'F. Aprobado', ro: true, al: ['f_aprobado', 'F_APROBADO'] },
              { k: 'f_desembolso', label: 'F. Desembolso', ro: true, al: ['f_desembolso', 'F_DESEMBOLSO'] },
              { k: 'f_pago_academia', label: 'F. Pago academia', ro: true, al: ['f_pago_academia', 'F_PAGO_ACADEMIA'] },
              { k: 'f_activo', label: 'F. Activo', ro: true, al: ['f_activo', 'F_ACTIVO'] },
            ]} />

            <div className="mat-sec">
              <div className="mat-sec-h">Documentos adjuntos</div>
              <div className="mat-photos">
                {[
                  ['Cédula · frente', get('foto_ced_frente', 'FOTO_CED_FRENTE')],
                  ['Cédula · dorso', get('foto_ced_dorso', 'FOTO_CED_DORSO')],
                  ['Título', get('foto_titulo', 'FOTO_TITULO')],
                ].map(([cap, src]) => src ? (
                  <MatDocPhoto key={cap} cap={cap} src={src} onOpen={(s) => setLightbox({ src: s, cap })} />
                ) : (
                  <div key={cap} className="mat-photo-empty">
                    <span>Sin archivo</span>
                    <span className="mat-photo-cap">{cap}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {lightbox && (
          <div className="mat-lightbox" onClick={() => setLightbox(null)}>
            <img src={lightbox.src} alt={lightbox.cap} />
          </div>
        )}
      </Modal>
    );
  }

  // ── Cambio 9 · Modal "Crear proformas" ──────────────────────────────────────
  function PFCard({ icon, title, subtitle, disabled, disabledMsg, tipo, cedula, whatsapp, planLabel, existingUrl, onToast }) {
    const [loading, setLoading] = useState(false);
    const [url, setUrl] = useState(existingUrl || '');
    const [regen, setRegen] = useState(false); // forzar mostrar botón generar aunque exista url previa

    const generar = async () => {
      setLoading(true);
      try {
        // FIX-MATRICULAS-ADMIN-002: POST text/plain (apiPost), NO GET con fn en
        // la URL. Mismos datos que antes (cedula, tipo); apiPost agrega el token.
        const r = await apiPost({ fn: 'generarProformaProspecto', cedula, tipo });
        if (r && r.ok) {
          const u = tipo === 'curso' ? r.url_programa : r.url_equipo;
          if (u) { setUrl(u); setRegen(false); onToast(`Proforma ${tipo === 'curso' ? 'del curso' : 'del equipo'} generada.`, 'ok'); }
          else onToast('El backend no devolvió la URL de la proforma.', 'err');
        } else onToast((r && r.error) || 'No se pudo generar la proforma.', 'err');
      } catch (e) { onToast('Error de conexión: ' + e.message, 'err'); }
      finally { setLoading(false); }
    };

    const msg = tipo === 'curso'
      ? `Hola! Te envío la proforma del curso de inglés. Podés verla aquí: ${url}`
      : `Hola! Te envío la proforma del equipo (${planLabel}). Podés verla aquí: ${url}`;
    const waHref = whatsapp ? `https://wa.me/${waNumber(whatsapp)}?text=${enc(msg)}` : null;

    return (
      <div className={'mat-pcard' + (disabled ? ' disabled' : '')}>
        <div className="mat-pcard-ic">{icon}</div>
        <div>
          <div className="mat-pcard-t">{title}</div>
          <div className="mat-pcard-sub">{subtitle}</div>
        </div>
        <div className="mat-pcard-spacer" />
        {disabled ? (
          <div className="mat-pcard-note">{disabledMsg}</div>
        ) : loading ? (
          <div className="mat-pcard-gen"><div className="mat-spin" />Generando proforma… (puede tardar 10–15s)</div>
        ) : url && !regen ? (
          <>
            <a className="btn btn-primary" href={url} target="_blank" rel="noopener" style={{ textDecoration: 'none', justifyContent: 'center' }}>Descargar</a>
            {waHref && <a className="btn btn-ghost" href={waHref} target="_blank" rel="noopener" style={{ textDecoration: 'none', justifyContent: 'center' }}>Enviar por WhatsApp</a>}
            <button className="btn btn-ghost" style={{ justifyContent: 'center', fontSize: 12 }} onClick={() => setRegen(true)}>Regenerar</button>
          </>
        ) : (
          <>
            {existingUrl && (
              <a className="mat-pcard-note" href={existingUrl} target="_blank" rel="noopener" style={{ textAlign: 'center', fontWeight: 600 }}>Ver proforma actual</a>
            )}
            <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={generar}>
              {existingUrl ? 'Regenerar' : 'GENERAR'}
            </button>
          </>
        )}
      </div>
    );
  }

  function MatProformasModal({ cedula, nombre, onClose, onToast }) {
    const [detalle, setDetalle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      let cancel = false;
      getDetalle(cedula)
        .then(d => { if (cancel) return; const p = (d && (d.prospecto || (d.ok !== false ? d : null))); if (p) setDetalle(flatten(p)); else setError((d && d.error) || 'No se pudo cargar el prospecto.'); })
        .catch(e => { if (!cancel) setError(e.message); })
        .finally(() => { if (!cancel) setLoading(false); });
      return () => { cancel = true; };
    }, [cedula]);

    const get = makeGet(detalle || {});
    const programa = get('programa', 'PROGRAMA');
    const modalidad = get('modalidad', 'MODALIDAD');
    const equipoRaw = String(get('conape_equipo', 'CONAPE_EQUIPO') || '').toUpperCase();
    const whatsapp = get('whatsapp', 'WHATSAPP', 'telefono', 'TELEFONO');
    const sinEquipo = !equipoRaw || equipoRaw === 'NINGUNO';
    const planLabel = PLAN_LABEL[equipoRaw] || equipoRaw || 'Equipo';
    const urlCurso = get('proforma_url', 'PROFORMA_URL', 'url_programa', 'proforma_programa_url');
    const urlEquipo = get('proforma_equipo_url', 'PROFORMA_EQUIPO_URL', 'url_equipo');

    return (
      <Modal size="lg" kicker={`Proformas · ${cedula}`} title={nombre || get('nombre', 'NOMBRE') || 'Crear proformas'} onClose={onClose}
        footer={<button className="btn btn-ghost" onClick={onClose}>Cerrar</button>}>
        {loading && <div className="mat-center"><div className="mat-spin" />Cargando datos del prospecto…</div>}
        {!loading && error && <div className="mat-center" style={{ color: 'var(--danger)' }}>⚠️ {error}</div>}
        {!loading && !error && detalle && (
          <div className="mat-pf-cards">
            <PFCard icon="📄" title="Proforma del Curso"
              subtitle={`Programa de inglés (${programa || '—'} · ${modalidad || '—'})`}
              tipo="curso" cedula={cedula} whatsapp={whatsapp} planLabel={planLabel}
              existingUrl={urlCurso} onToast={onToast} />
            <PFCard icon="💻" title="Proforma del Equipo"
              subtitle={sinEquipo ? 'Sin equipo CONAPE' : planLabel}
              disabled={sinEquipo} disabledMsg="Este prospecto no eligió equipo CONAPE."
              tipo="equipo" cedula={cedula} whatsapp={whatsapp} planLabel={planLabel}
              existingUrl={urlEquipo} onToast={onToast} />
          </div>
        )}
      </Modal>
    );
  }

  // ── Cambio 10 · Modal "Actualizar estado CONAPE" ────────────────────────────
  const NOVEDAD_META = {
    no_encontrado: { cls: 'mat-cs-red', badge: 'No encontrado', bg: '#E8372A', msg: 'CONAPE aún NO le ha dado visto bueno. Aún no aparece en la planilla.' },
    aprobado_sin_desembolso: { cls: 'mat-cs-yellow', badge: 'Aprobado', bg: '#E5A823', msg: 'CONAPE le dio visto bueno pero aún no formaliza el primer desembolso.' },
    con_desembolso: { cls: 'mat-cs-green', badge: 'Con desembolso', bg: '#4CAF50', msg: '' },
  };
  function MatConapeModal({ cedula, nombre, onClose, onToast, onResult }) {
    const [loading, setLoading] = useState(true);
    const [res, setRes] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
      let cancel = false;
      // FIX-MATRICULAS-ADMIN-002: POST text/plain (apiPost), NO GET con fn en la URL.
      apiPost({ fn: 'actualizarEstadoConapeProspecto', cedula })
        .then(r => {
          if (cancel) return;
          if (r && r.ok) { setRes(r); onResult && onResult(r.novedad); }
          else { setError((r && r.error) || 'No se pudo consultar el estado CONAPE.'); onToast && onToast((r && r.error) || 'No se pudo consultar el estado CONAPE.', 'err'); }
        })
        .catch(e => { if (!cancel) { setError(e.message); onToast && onToast('Error de conexión: ' + e.message, 'err'); } })
        .finally(() => { if (!cancel) setLoading(false); });
      return () => { cancel = true; };
    }, [cedula]);

    const meta = res ? (NOVEDAD_META[res.novedad] || NOVEDAD_META.no_encontrado) : null;
    const desembMsg = res && res.novedad === 'con_desembolso'
      ? `Desembolso #${res.num_desembolso || '—'} del período ${res.periodo_mes || '—'}/${res.periodo_anio || '—'}${res.fecha ? ` (${res.fecha})` : ''}`
      : '';

    return (
      <Modal size="sm" kicker="Estado CONAPE" title={nombre || cedula} onClose={onClose}
        footer={<button className="btn btn-ghost" onClick={onClose}>Cerrar</button>}>
        {loading && <div className="mat-center"><div className="mat-spin" />Consultando el WS de CONAPE…</div>}
        {!loading && error && <div className="mat-center" style={{ color: 'var(--danger)' }}>⚠️ {error}</div>}
        {!loading && !error && res && (
          <>
            <div className="mat-conape-kv">
              <div className="kv"><b>Última consulta</b><span className="mono">{res.ultima_consulta || '—'}</span></div>
              <div className="kv"><b>Cédula consultada</b><span className="mono">{cedula}</span></div>
              <div className="kv"><b>Nombre en padrón CONAPE</b><span>{res.nombre_ws || '—'}</span></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <span className="mat-conape-badge" style={{ background: `color-mix(in srgb, ${meta.bg} 14%, white)`, color: meta.bg }}>{meta.badge}</span>
            </div>
            <div className={`mat-conape-state ${meta.cls}`}>
              <div className="dot" />
              <div className="msg">{res.novedad === 'con_desembolso' ? desembMsg : meta.msg}</div>
            </div>
          </>
        )}
      </Modal>
    );
  }

  // ── Fase 2.5 · Modal "Generar matrícula" ────────────────────────────────────
  // Convierte un prospecto en estudiante matriculado vía el endpoint backend
  // generarMatricula (v4.32.1). NO paga: tras generar, el flujo sigue en
  // "Aplicar Pago" (pantalla existente del campus). Reemplaza al viejo
  // activarEstudiante (deprecated).
  const fmtCRC_M = (n) => '₡' + (Number(n) || 0).toLocaleString('es-CR');

  // Etiqueta una opción de grupo: "B1-LM18-C3-0726 · Lun/Mié · 6pm a 9pm · Inicia 14 sep 2026"
  function labelGrupo(g) {
    const dias = decodeDiasLocal(g.dias);
    const horario = [g.hora_ini, g.hora_fin].filter(Boolean).join(' a ');
    const inicia = g.fecha_inicio ? `Inicia ${fmtFechaCorta(g.fecha_inicio)}` : '';
    return [g.codigo, dias, horario, inicia].filter(Boolean).join(' · ');
  }

  function GMField({ label, value, mono }) {
    return (
      <div className="mat-frow">
        <div className="mat-flabel">{label}</div>
        <div className={'mat-fval' + (mono ? ' mono' : '')}>{value != null && value !== '' ? String(value) : '—'}</div>
      </div>
    );
  }

  function MatGenerarMatriculaModal({ cedula, nombre, gruposAbiertos, onClose, onToast, onSuccess }) {
    const [detalle, setDetalle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [grupoCod, setGrupoCod] = useState('');
    const [becaEstadoLocal, setBecaEstadoLocal] = useState('');
    const [becasActivas, setBecasActivas] = useState([]); // Fase 3.8: % dinámicos
    const [submitting, setSubmitting] = useState(false);

    // Carga del prospecto (self-contained, igual que los otros modales admin).
    useEffect(() => {
      let cancel = false;
      getDetalle(cedula)
        .then(d => {
          if (cancel) return;
          const p = (d && (d.prospecto || (d.ok !== false ? d : null)));
          if (p) setDetalle(flatten(p));
          else setError((d && d.error) || 'No se pudo cargar el prospecto.');
        })
        .catch(e => { if (!cancel) setError(e.message); })
        .finally(() => { if (!cancel) setLoading(false); });
      return () => { cancel = true; };
    }, [cedula]);

    // Fase 3.8 — becas activas (cualquiera, incluso internas) para % dinámicos.
    // El admin puede asignar/aprobar cualquier beca activa, no solo Impacta/Mujer.
    useEffect(() => {
      let cancel = false;
      // FIX-MATRICULAS-ADMIN-001: getBecas por POST text/plain (apiPost), no por
      // GET — así no se dispara el Error CORS al abrir el modal de matrícula.
      apiPost({ fn: 'getBecas', solo_activas: true })
        .then(r => { if (!cancel && r && r.ok) setBecasActivas(r.becas || []); })
        .catch(() => {});
      return () => { cancel = true; };
    }, []);

    const get = makeGet(detalle || {});
    const programa = String(get('programa', 'PROGRAMA') || '').toUpperCase();
    const modalidad = String(get('modalidad', 'MODALIDAD') || '').toUpperCase();
    const beca = String(get('beca', 'BECA') || '').toUpperCase();
    const becaEstadoOrig = String(get('beca_estado', 'BECA_ESTADO') || '').toUpperCase();
    const grupoTentativo = String(get('grupo_tentativo', 'GRUPO_TENTATIVO', 'grupo') || '');
    const financiamiento = String(get('financiamiento', 'FINANCIAMIENTO') || '').toUpperCase();

    // Grupos compatibles: mismo programa (INA/SIN_INA) y misma modalidad que el prospecto.
    const compat = (gruposAbiertos || []).filter(g =>
      String(g.programa || '').toUpperCase() === programa &&
      String(g.modalidad || '').toUpperCase() === modalidad
    );

    // Defaults una vez cargado el detalle: grupo = GRUPO_TENTATIVO (si es compatible),
    // si no el primero compatible; estado de beca = el original del prospecto.
    useEffect(() => {
      if (!detalle) return;
      setBecaEstadoLocal(becaEstadoOrig);
      const def = compat.find(g => g.codigo === grupoTentativo) || compat[0];
      setGrupoCod(def ? def.codigo : '');
    }, [detalle]); // eslint-disable-line react-hooks/exhaustive-deps

    const grupoSel = compat.find(g => g.codigo === grupoCod) || null;

    // ── Preview de precios (frontend) ──
    // Fase 3.8 — % por rubro dinámicos: buscamos la beca del prospecto en
    // CONFIG_BECAS. Si no se encuentra (beca vieja), fallback histórico
    // (MUJER 50% / otras 25%). Matrícula y cuota pueden tener % distintos.
    const becaDef = becasActivas.find(b => String(b.id || '').toUpperCase() === beca
      || String(b.nombre || '').toUpperCase().replace(/^BECA\s+/, '') === beca);
    const aprobada = becaEstadoLocal === 'APROBADA';
    const fbPct = beca === 'MUJER' ? 50 : 25;
    const pctMatricula = aprobada ? (becaDef ? becaDef.pct_matricula : fbPct) : 0;
    const pctCuota = aprobada ? (becaDef ? becaDef.pct_cuota : fbPct) : 0;
    const precioCuota = Number(grupoSel?.precio_cuota) || 0;
    const precioMatricula = Number(grupoSel?.precio_matricula) || 0;
    const precioCertificado = Number(grupoSel?.precio_certificado) || 0;
    const totalCuotas = modalidad === 'SUPER_INTENSIVO' ? 8 : 16;
    const cuotaFinal = Math.round(precioCuota * (1 - pctCuota / 100));
    const matriculaFinal = Math.round(precioMatricula * (1 - pctMatricula / 100));
    const certificadoFinal = precioCertificado; // SIN descuento
    const costoCurso = cuotaFinal * totalCuotas;
    // % a mostrar en los textos (representativo): el de cuota, o matrícula si cuota=0.
    const descPct = becaDef ? (becaDef.pct_cuota || becaDef.pct_matricula) : fbPct;
    // FIX-GENERAR-MATRICULA-CONSOLIDADO: `descuento` se usaba en el Preview de
    // precios (gm-strike / gm-disc) pero NUNCA estaba declarado → ReferenceError
    // al renderizar el modal "Generar matrícula" → PANTALLA EN BLANCO. Es el
    // descuento efectivo (>0 si la beca aprobada aplica % a cuota o matrícula).
    const descuento = Math.max(pctMatricula || 0, pctCuota || 0);

    const tieneCompat = compat.length > 0;
    const tienePrecios = !!grupoSel && (precioCuota > 0 || precioMatricula > 0);

    const generar = async () => {
      if (!grupoSel || submitting) return;
      setSubmitting(true);
      try {
        // FIX-ADMIN-STABILITY-004/005: helper local apiPost (POST text/plain, sin
        // ?fn= en la URL; apiPost ya inyecta el token). Mismo payload.
        const data = await apiPost({
          fn: 'generarMatricula',
          cedula,
          grupo: grupoSel.codigo,
          beca: beca || '',
          beca_estado: becaEstadoLocal || '',
        });
        // Respuesta válida y exitosa → seguimos el flujo (padre redirige a Aplicar Pago).
        if (data && typeof data === 'object' && data.ok === true) {
          onSuccess(data);
        } else if (data && typeof data === 'object' && 'ok' in data) {
          // Error tipado del backend { ok:false, error:'...' } → toast controlado.
          onToast(data.error || 'No se pudo generar la matrícula.', 'err');
          setSubmitting(false);
        } else {
          // Respuesta inesperada (null, texto, HTML, sin ok) → NUNCA pantalla blanca.
          onToast('No se pudo generar la matrícula. Respuesta inválida del servidor.', 'err');
          setSubmitting(false);
        }
      } catch (e) {
        onToast('Error de conexión: ' + (e && e.message ? e.message : 'desconocido'), 'err');
        setSubmitting(false);
      }
    };

    const footer = (loading || error) ? (
      <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
    ) : (
      <>
        <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancelar</button>
        <button className="btn btn-primary" onClick={generar}
          disabled={submitting || !grupoSel}
          style={{ background: 'var(--an-navy)', borderColor: 'var(--an-navy)' }}>
          {submitting ? 'Generando…' : 'Generar matrícula'}
        </button>
      </>
    );

    return (
      <Modal size="lg" kicker={`Generar matrícula · ${cedula}`}
        title={nombre || get('nombre', 'NOMBRE') || 'Generar matrícula'}
        onClose={submitting ? () => {} : onClose} footer={footer}>
        {loading && <div className="mat-center"><div className="mat-spin" />Cargando datos del prospecto…</div>}
        {!loading && error && <div className="mat-center" style={{ color: 'var(--danger)' }}>⚠️ {error}</div>}
        {!loading && !error && detalle && (
          <>
            {/* ── Sección A · Datos del prospecto (read-only) ── */}
            <div className="mat-sec">
              <div className="mat-sec-h">Datos del prospecto <span className="mat-readonly-tag">solo lectura</span></div>
              <div className="mat-grid">
                <GMField label="Cédula" value={get('cedula', 'CEDULA') || cedula} mono />
                <GMField label="Nombre completo" value={get('nombre', 'NOMBRE') || nombre} />
                <GMField label="Teléfono" value={get('telefono', 'TELEFONO', 'whatsapp', 'WHATSAPP')} mono />
                <GMField label="Email" value={get('correo', 'CORREO', 'email', 'EMAIL')} />
                <GMField label="Financiamiento" value={financiamiento} />
                <GMField label="Modalidad" value={modalidad} />
                <GMField label="Programa" value={programa} />
              </div>
            </div>

            {/* ── Sección B · Grupo (editable) ── */}
            <div className="mat-sec">
              <div className="mat-sec-h">Grupo de inscripción</div>
              {!tieneCompat ? (
                <div className="gm-warn">
                  No hay grupos abiertos compatibles con <b>{programa || '—'}</b> · <b>{modalidad || '—'}</b>.
                  Cerrá el modal y avisá al director para crear uno.
                </div>
              ) : (
                <>
                  <select className="gm-select" value={grupoCod} onChange={e => setGrupoCod(e.target.value)}>
                    {compat.map(g => (
                      <option key={g.codigo} value={g.codigo}>{labelGrupo(g)}</option>
                    ))}
                  </select>
                  {!tienePrecios && (
                    <div className="gm-note">
                      ⚠️ El grupo seleccionado no trae precios desde el backend. El preview mostrará ₡0;
                      verificá los precios del grupo en APOLLO antes de generar.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Sección C · Beca (condicional) ── */}
            {beca && (
              <div className="mat-sec">
                <div className="mat-sec-h">Beca solicitada</div>
                {becaEstadoLocal === 'SOLICITADA' ? (
                  <div className="gm-beca">
                    <div className="gm-beca-info">
                      <span className="gm-beca-tipo">Beca {beca}</span>
                      <span className="gm-beca-desc">Descuento de {descPct}% sobre cuota y matrícula (no aplica al certificado).</span>
                    </div>
                    <div className="gm-beca-actions">
                      <button className="btn btn-ghost gm-reject" onClick={() => setBecaEstadoLocal('RECHAZADA')}>Rechazar beca</button>
                      <button className="btn btn-primary gm-approve" onClick={() => setBecaEstadoLocal('APROBADA')}>Aprobar beca</button>
                    </div>
                  </div>
                ) : becaEstadoLocal === 'APROBADA' ? (
                  <div className="gm-beca-state gm-beca-ok">
                    <div><b>Beca {beca} aprobada</b> · −{descPct}% en cuota y matrícula</div>
                    {becaEstadoOrig === 'SOLICITADA' && (
                      <button className="gm-link" onClick={() => setBecaEstadoLocal('SOLICITADA')}>Cambiar</button>
                    )}
                  </div>
                ) : (
                  <div className="gm-beca-state gm-beca-no">
                    <div><b>Beca {beca} rechazada</b> · no se aplica descuento</div>
                    {becaEstadoOrig === 'SOLICITADA' && (
                      <button className="gm-link" onClick={() => setBecaEstadoLocal('SOLICITADA')}>Cambiar</button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Sección D · Preview de precios ── */}
            <div className="mat-sec">
              <div className="mat-sec-h">Preview de precios</div>
              <div className="gm-preview">
                <div className="gm-pcol">
                  <div className="gm-prow">
                    <span>Cuota mensual</span>
                    <span className="gm-amt">
                      {descuento > 0 && <i className="gm-strike">{fmtCRC_M(precioCuota)}</i>}
                      <b className={descuento > 0 ? 'gm-disc' : ''}>{fmtCRC_M(cuotaFinal)}</b>
                    </span>
                  </div>
                  <div className="gm-prow">
                    <span>Total cuotas</span>
                    <span className="gm-amt"><b>{totalCuotas}</b></span>
                  </div>
                  <div className="gm-prow gm-ptotal">
                    <span>Costo del curso</span>
                    <span className="gm-amt"><b>{fmtCRC_M(costoCurso)}</b></span>
                  </div>
                  <div className="gm-pformula">cuota × cuotas</div>
                </div>
                <div className="gm-pcol">
                  <div className="gm-prow">
                    <span>Matrícula</span>
                    <span className="gm-amt">
                      {descuento > 0 && <i className="gm-strike">{fmtCRC_M(precioMatricula)}</i>}
                      <b className={descuento > 0 ? 'gm-disc' : ''}>{fmtCRC_M(matriculaFinal)}</b>
                    </span>
                  </div>
                  <div className="gm-prow">
                    <span>Certificado B1</span>
                    <span className="gm-amt"><b>{fmtCRC_M(certificadoFinal)}</b></span>
                  </div>
                  <div className="gm-prow">
                    <span>Convenio</span>
                    <span className="gm-amt"><b>{financiamiento || '—'}</b></span>
                  </div>
                </div>
              </div>
              <div className="gm-next">
                Al generar la matrícula se registra al estudiante en APOLLO. <b>Todavía no se cobra:</b> el
                siguiente paso es aplicar el pago de matrícula B1 desde la pantalla <b>Aplicar Pago</b>.
              </div>
            </div>
          </>
        )}
      </Modal>
    );
  }

  // ── Toast compartido ────────────────────────────────────────────────────────
  function MatToast({ toast, onClose }) {
    useEffect(() => {
      if (!toast) return;
      const t = setTimeout(onClose, 4200);
      return () => clearTimeout(t);
    }, [toast]);
    if (!toast) return null;
    return (
      <div className={`mat-toast ${toast.tipo || 'info'}`} onClick={onClose} role="status">
        <span>{toast.tipo === 'ok' ? '✓' : toast.tipo === 'err' ? '⚠️' : 'ℹ️'}</span>
        <span>{toast.msg}</span>
      </div>
    );
  }

  // ── Fase 3.6 · "Ver ficha de estudiante" (read-only) ────────────────────────
  // Para prospectos ya activados (con CODIGO_ESTUDIANTE). Muestra el expediente
  // como el drawer del vendedor pero de solo lectura: si el admin quiere editar,
  // va por el flujo normal.
  function MatFichaEstudianteModal({ cedula, nombre, codigo, onClose, onToast }) {
    const [detalle, setDetalle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lightbox, setLightbox] = useState(null);

    useEffect(() => {
      let cancel = false;
      getDetalle(cedula)
        .then(d => { if (cancel) return; const p = (d && (d.prospecto || (d.ok !== false ? d : null))); if (p) setDetalle(flatten(p)); else setError((d && d.error) || 'No se pudo cargar la ficha.'); })
        .catch(e => { if (!cancel) setError(e.message); })
        .finally(() => { if (!cancel) setLoading(false); });
      return () => { cancel = true; };
    }, [cedula]);

    const get = makeGet(detalle || {});
    const val = (f) => { let v = get(...(f.al || [f.k])); if (f.bool) v = boolTxt(v); return v == null ? '' : v; };
    const ro = () => false;       // todo solo lectura
    const noop = () => () => {};
    const fin = get('financiamiento', 'FINANCIAMIENTO');
    const esConape = /conape/i.test(fin);
    const esMenor = boolTxt(get('es_menor', 'ES_MENOR')) === 'Sí' || !!get('tutor_nombre', 'TUTOR_NOMBRE');
    const cod = codigo || get('codigo_estudiante', 'CODIGO_ESTUDIANTE');

    const footer = <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>;

    return (
      <Modal size="lg" kicker={`Ficha de estudiante${cod ? ' · ' + cod : ''}`} title={nombre || get('nombre', 'NOMBRE') || 'Estudiante'} onClose={onClose} footer={footer}>
        {loading && <div className="mat-center"><div className="mat-spin" />Cargando ficha…</div>}
        {!loading && error && <div className="mat-center" style={{ color: 'var(--danger)' }}>⚠️ {error}</div>}
        {!loading && !error && detalle && (
          <>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
              Solo lectura. Para editar datos del estudiante, usá el flujo normal de estudiantes.
            </div>

            <Section title="Datos personales" val={val} editableOf={ro} onCh={noop} fields={[
              { k: 'nombre', label: 'Nombre completo', full: true },
              { k: 'cedula', label: 'Cédula', mono: true },
              { k: 'correo', label: 'Correo' },
              { k: 'whatsapp', label: 'WhatsApp', mono: true },
              { k: 'telefono', label: 'Teléfono', mono: true },
              { k: 'sexo', label: 'Sexo' },
              { k: 'fecha_nac', label: 'Fecha de nacimiento' },
              { k: 'provincia', label: 'Provincia' },
              { k: 'canton', label: 'Cantón' },
              { k: 'direccion', label: 'Dirección', full: true, textarea: true },
            ]} />

            {esMenor && (
              <Section title="Encargado / Tutor" val={val} editableOf={ro} onCh={noop} fields={[
                { k: 'tutor_nombre', label: 'Nombre del encargado', full: true },
                { k: 'tutor_cedula', label: 'Cédula', mono: true },
                { k: 'tutor_tel', label: 'Teléfono', mono: true },
                { k: 'tutor_correo', label: 'Correo', full: true },
              ]} />
            )}

            <Section title="Programa y financiamiento" val={val} editableOf={ro} onCh={noop} fields={[
              { k: 'codigo_estudiante', label: 'Código de estudiante', mono: true, al: ['codigo_estudiante', 'CODIGO_ESTUDIANTE'] },
              { k: 'programa', label: 'Programa' },
              { k: 'modalidad', label: 'Modalidad' },
              { k: 'grupo_tentativo', label: 'Grupo', mono: true, al: ['grupo_tentativo', 'GRUPO_TENTATIVO', 'grupo'] },
              { k: 'financiamiento', label: 'Financiamiento' },
              { k: 'beca', label: 'Beca' },
            ]} />

            {esConape && (
              <Section title="CONAPE" val={val} editableOf={ro} onCh={noop} fields={[
                { k: 'conape_equipo', label: 'Equipo' },
                { k: 'conape_toeic', label: 'TOEIC', bool: true },
                { k: 'conape_sostenimiento', label: 'Sostenimiento', full: true },
              ]} />
            )}

            <Section title="Seguimiento" val={val} editableOf={ro} onCh={noop} fields={[
              { k: 'asesor_ref', label: 'Asesor de referencia', al: ['asesor_ref', 'ASESOR_REF', 'asesor'] },
              { k: 'notas', label: 'Notas', full: true, textarea: true, al: ['notas', 'NOTAS'] },
            ]} />

            <div className="mat-sec">
              <div className="mat-sec-h">Documentos adjuntos</div>
              <div className="mat-photos">
                {[
                  ['Cédula · frente', get('foto_ced_frente', 'FOTO_CED_FRENTE')],
                  ['Cédula · dorso', get('foto_ced_dorso', 'FOTO_CED_DORSO')],
                  ['Título', get('foto_titulo', 'FOTO_TITULO')],
                ].map(([cap, src]) => src ? (
                  <MatDocPhoto key={cap} cap={cap} src={src} onOpen={(s) => setLightbox({ src: s, cap })} />
                ) : (
                  <div key={cap} className="mat-photo-empty">
                    <span>Sin archivo</span>
                    <span className="mat-photo-cap">{cap}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {lightbox && (
          <div className="mat-lightbox" onClick={() => setLightbox(null)}>
            <img src={lightbox.src} alt={lightbox.cap} />
          </div>
        )}
      </Modal>
    );
  }

  Object.assign(window, {
    MatResumenActivos, MatProspectoModal, MatProformasModal, MatConapeModal,
    MatGenerarMatriculaModal, MatFichaEstudianteModal, MatToast,
  });
})();
