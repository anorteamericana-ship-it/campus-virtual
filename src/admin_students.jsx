// F98.4-Z6-CS21A140 · Proyección manual segura del siguiente nivel desde Estudiantes
// F98.4-Z6-CD · Consulta individual: comentario externo, alerta de historial y certificado documental
// Base preservada: F98.4-Z6-CB
// APR histórico usa cédula + año + periodo del evento concreto; evita que
// una matrícula legada del motor canónico invalide un cierre oficial NO.
// F98.4-Z6-BF · Sync CONAPE por grupo reanudable y sin cortes parciales
// F98.4-Z6-BG · pagos por nivel + título final I2 separado
// CALGRUPO_F98_4_Z6_AN_20260630_CONSULTA_CALENDARIO_OPTIMIZADOS
// CALGRUPO_F2_20260616_ESTUDIANTES_COMPACTO_OPERATIVO
// CALGRUPO_F5_20260617_CERTIFICADOS_MASIVOS_UI
// CALGRUPO_F6_20260617_ESTADOS_CERTIFICADO_VISUAL_SIN_BACKEND
// CALGRUPO_F7_20260617_ESTUDIANTES_VIEJO_LIMPIO_SIN_CALENDARIO
// CALGRUPO_F10_20260617_FILTROS_OPERATIVOS_RIESGO_VISUAL
// CALGRUPO_F13_20260617_SEGUIMIENTO_RAPIDO_WHATSAPP
// CALGRUPO_F14_20260617_EXPORT_RESUMEN_OPERATIVO
// CALGRUPO_F15_20260617_MAPA_NIVELES_ENFOQUE_OPERATIVO
// CALGRUPO_F19_20260617_REPORTE_IMPRIMIBLE_GRUPO
// CALGRUPO_F20_20260617_PANEL_OPERATIVO_PREMIUM_PRIORIDADES
// CALGRUPO_F23_20260617_BITACORA_LOCAL_SEGUIMIENTO_VISUAL
// CALGRUPO_F24_20260617_BITACORA_OFICIAL_BACKEND_FALLBACK_LOCAL
// CALGRUPO_F25_20260617_CERTIFICADOS_FIRMADOS_UI_BACKEND
// CALGRUPO_F26_20260617_CERTIFICADOS_MASIVOS_SEGUROS_CONFIRMACION
// CALGRUPO_F29_20260617_NOTAS_MANUALES_OFICIALES_ORALES_SOCIAL

// ─────────────────────────────────────────────────────────────────────────
// VISTA RADIOGRAFÍA DE GRUPOS — admin_students.jsx
// Reemplaza la antigua vista padrón. Muestra cada grupo activo como un chip
// (coloreado por su nivel activo HOY); al hacer click se carga la radiografía
// completa con tablas por nivel: aprobados (anterior), cursando (actual) y
// proyectados (siguiente).
// ─────────────────────────────────────────────────────────────────────────

// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL_AS = window.APPS_SCRIPT_URL;

// ─────────────────────────────────────────────────────────────────────────
// HELPER POST — lecturas sensibles vía POST text/plain con token en el body.
// Conserva `?fn=...` en la URL porque el Apps Script enruta con
// e.parameter.fn. El token NUNCA va en la URL: viaja en el body JSON.
// ─────────────────────────────────────────────────────────────────────────
async function postAdminStudents(fn, payload = {}, timeoutMs = 25000) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const body = JSON.stringify({ fn, token, ...payload });
  const urls = [`${SCRIPT_URL_AS}?fn=${encodeURIComponent(fn)}`, SCRIPT_URL_AS];
  let lastError = null;
  for (let attempt = 0; attempt < urls.length; attempt += 1) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const r = await fetch(urls[attempt], {
        method:'POST',
        headers:{ 'Content-Type':'text/plain;charset=utf-8' },
        body,
        cache:'no-store',
        redirect:'follow',
        signal:controller ? controller.signal : undefined,
      });
      const raw = await r.text();
      const text = String(raw || '').trim();
      if (!text) throw new Error(`El backend no devolvió contenido en ${fn}.`);
      if (/^<!doctype\s+html|^<html/i.test(text)) throw new Error('El backend devolvió HTML en lugar de JSON. Revisá la publicación vigente de Apps Script.');
      let data;
      try { data = JSON.parse(text); } catch (_) { throw new Error(`Respuesta inválida del backend en ${fn}.`); }
      if (!r.ok) throw new Error(data?.mensaje || data?.error || `HTTP ${r.status}`);
      return data;
    } catch (e) {
      lastError = e?.name === 'AbortError' ? new Error(`El backend tardó demasiado en responder (${fn}).`) : e;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  throw lastError || new Error(`No se pudo conectar con el backend en ${fn}.`);
}

function adminStudentsSafeUserError(raw, fallback, context = '') {
  const msg = String(raw == null ? '' : raw).trim();
  if (!msg) return fallback;
  const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);
  const technicalText = /apps?\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\bjson\b|\btoken\b|unauthorized|forbidden|internal server|http\s*\d{3}|status\s*\d{3}|respuesta inv[aá]lida|\bbase64\b|sha-?256|\bmime\b|file_id|request_id|policy_unbound|sec00|apollo\.|getAdmin|getRadiografia|getEstudiante|getCierre|ejecutarCierre|sincronizarCONAPE|generarCertificado|simularCambio|ejecutarCambio/i.test(msg);
  if (technicalCode || technicalText) {
    console.warn('[AdminStudents] Detalle técnico oculto al operador.', { context, error: msg });
    return fallback;
  }
  return msg;
}

function abrirPdfBackend(payload, fallbackUrl = '') {
  try {
    if (payload?.pdf_base64) {
      const bin = atob(payload.pdf_base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: payload.pdf_mime || 'application/pdf' }));
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 120000);
      return true;
    }
    const url = payload?.pdf_url || fallbackUrl;
    if (url) { window.open(url, '_blank', 'noopener,noreferrer'); return true; }
  } catch (_) {}
  return false;
}

function abrirPdfPrivadoAdmin(payload) {
  try {
    const encoded = String(payload?.pdf_base64 || '').replace(/\s+/g, '');
    if (!encoded) return false;
    const mime = String(payload?.pdf_mime || 'application/pdf').trim().toLowerCase();
    if (mime !== 'application/pdf') {
      console.warn('[AdminStudents] PDF privado rechazado por MIME.', { mime });
      return false;
    }
    const maxBytes = 12 * 1024 * 1024;
    if (encoded.length > Math.ceil(maxBytes * 4 / 3) + 8) {
      console.warn('[AdminStudents] PDF privado rechazado por tamaño base64.');
      return false;
    }
    const bin = atob(encoded);
    if (bin.length > maxBytes || bin.slice(0, 5) !== '%PDF-') {
      console.warn('[AdminStudents] PDF privado rechazado por integridad/tamaño.');
      return false;
    }
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    return true;
  } catch (e) {
    console.warn('[AdminStudents] No se pudo abrir el PDF privado.', e);
    return false;
  }
}

async function resincronizarEstudianteIndividual(codigo) {
  // Llama sincronizarCONAPE con param 'codigo' (dispatcher GET).
  // Devuelve { ok, mensaje, error }.
  try {
    const resp = await postAdminStudents('sincronizarCONAPE', { codigo: String(codigo) });
    return resp;
  } catch(e) {
    return { ok: false, error: adminStudentsSafeUserError(e?.message || String(e), 'No se pudo sincronizar CONAPE. Intentá de nuevo.', 'resincronizar_estudiante') };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────
function useAdminGrupos(enabled = true) {
  const [grupos, setGrupos]   = React.useState([]);
  const [loading, setLoading] = React.useState(!!enabled);
  const [error, setError]     = React.useState('');
  React.useEffect(() => {
    let activo = true;
    if (!enabled) {
      setGrupos([]); setError(''); setLoading(false);
      return () => { activo = false; };
    }
    setLoading(true); setError('');
    postAdminStudents('getAdminDashboard')
      .then(d => {
        if (!activo) return;
        if (d && d.ok) {
          setGrupos(d.grupos || []);
        } else {
          setError(adminStudentsSafeUserError(d?.error || d?.mensaje, 'No pudimos cargar los grupos. Intentá de nuevo.', 'cargar_grupos'));
        }
      })
      .catch(e => { if (activo) setError(adminStudentsSafeUserError(e?.message || String(e), 'No pudimos cargar los grupos. Intentá de nuevo.', 'cargar_grupos')); })
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, [enabled]);
  return { grupos, loading, error };
}

function useRadiografia(codGrupo, refreshKey) {
  const [data, setData]       = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState('');
  React.useEffect(() => {
    let activo = true;
    if (!codGrupo) {
      setData(null); setError(''); setLoading(false);
      return () => { activo = false; };
    }
    setLoading(true); setData(null); setError('');
    postAdminStudents('getRadiografiaGrupo', { cod_grupo: codGrupo })
      .then(d => {
        if (!activo) return;
        if (d && d.ok) setData(d);
        else setError(adminStudentsSafeUserError(d?.error || d?.mensaje, 'No pudimos cargar la radiografía del grupo. Intentá de nuevo.', 'cargar_radiografia'));
      })
      .catch(e => { if (activo) setError(adminStudentsSafeUserError(e?.message || String(e), 'No pudimos cargar la radiografía del grupo. Intentá de nuevo.', 'cargar_radiografia')); })
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, [codGrupo, refreshKey]);
  return { data, loading, error };
}


function parseFechaDesembolsoConape(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  let m = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  m = raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function claveConape(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function useUltimosDesembolsosConape() {
  const [porEstudiante, setPorEstudiante] = React.useState({});
  React.useEffect(() => {
    let activo = true;
    postAdminStudents('getSuperAdminMasterDashboard')
      .then(resp => {
        if (!activo || !resp?.ok) return;
        const movimientos = resp?.conape?.movements?.rows || [];
        const sincronizados = resp?.conape?.sync || [];
        const mapa = {};
        [...movimientos, ...sincronizados].forEach(row => {
          const fechaRaw = row.eventDate || row.date || row.detectedAt || '';
          const fecha = parseFechaDesembolsoConape(fechaRaw);
          if (!fecha) return;
          const item = {
            fecha: fechaRaw,
            fechaSort: fecha.getTime(),
            numero: row.disbursement || row.numDisbursement || row.disbursementNumber || '',
          };
          [row.code, row.codigo, row.cedula].map(claveConape).filter(Boolean).forEach(key => {
            const actual = mapa[key];
            if (!actual || item.fechaSort > actual.fechaSort ||
                (item.fechaSort === actual.fechaSort && Number(item.numero || 0) > Number(actual.numero || 0))) {
              mapa[key] = item;
            }
          });
        });
        setPorEstudiante(mapa);
      })
      .catch(() => {});
    return () => { activo = false; };
  }, []);
  return porEstudiante;
}

function formatoFechaDesembolsoConape(item) {
  const fecha = parseFechaDesembolsoConape(item?.fecha);
  return fecha ? fecha.toLocaleDateString('es-CR', { day:'2-digit', month:'2-digit', year:'numeric' }) : '';
}

// ─────────────────────────────────────────────────────────────────────────
// MODAL CAMBIAR ESTATUS
// ─────────────────────────────────────────────────────────────────────────
function ModalEstatus({ estudiante, nivel, onClose, onSuccess }) {
  const [nuevoEstatus, setNuevoEstatus] = React.useState(estudiante.estatus || 'CA');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [conapeFallo, setConapeFallo] = React.useState(false);
  const [reintentando, setReintentando] = React.useState(false);
  const [reintentoMsg, setReintentoMsg] = React.useState('');

  const estados = ['CA','APR','REP','CNV','RI','RJ','PE'];
  const codigoEst = String(estudiante.codigo || estudiante.rec_m || '');

  async function handleGuardar() {
    if (!nuevoEstatus || nuevoEstatus === estudiante.estatus) { onClose(); return; }
    setLoading(true); setError(''); setConapeFallo(false); setReintentoMsg('');
    try {
      const token = window.getSessionToken ? window.getSessionToken() : '';
      const resp = await fetch(SCRIPT_URL_AS, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          fn: 'actualizarEstatus',
          token,
          cod_estudiante: codigoEst,
          nivel,
          estatus: nuevoEstatus,
          nota: estudiante.nota || null,
          grupo: String(estudiante.grupo || estudiante.GRUPO || ''),
        })
      });
      const data = await resp.json();
      if (!data.ok) {
        setError(adminStudentsSafeUserError(data?.error || data?.mensaje, 'No se pudo actualizar el estatus. Intentá de nuevo.', 'actualizar_estatus'));
        return;
      }
      if (data.conape_sync === false) {
        setConapeFallo(true);
      } else {
        onSuccess();
        onClose();
      }
    } catch(e) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  async function handleReintentarSync() {
    setReintentando(true); setReintentoMsg('');
    const r = await resincronizarEstudianteIndividual(codigoEst);
    setReintentando(false);
    if (r.ok) {
      setReintentoMsg('✓ CONAPE sincronizado');
      setTimeout(() => { onSuccess(); onClose(); }, 900);
    } else {
      setReintentoMsg('⚠ ' + adminStudentsSafeUserError(r?.error || r?.mensaje, 'No se pudo sincronizar CONAPE. Intentá de nuevo.', 'reintentar_conape'));
    }
  }

  function handleCerrarConFallo() {
    onSuccess();
    onClose();
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:12, padding:24, minWidth:340, maxWidth:440, boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>
          Cambiar estatus — {nivel}
        </div>
        <div style={{ fontSize:13, color:'var(--text-secondary, #666)', marginBottom:12 }}>
          {estudiante.display || estudiante.nombre} · actual: <strong>{estudiante.estatus}</strong>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
          {estados.map(s => (
            <button key={s} onClick={() => setNuevoEstatus(s)} disabled={conapeFallo} style={{
              padding:'6px 14px', borderRadius:6, border:'2px solid',
              borderColor: nuevoEstatus===s ? 'var(--brand, #14213D)' : 'var(--border, #ddd)',
              background: nuevoEstatus===s ? 'var(--brand, #14213D)' : 'white',
              color: nuevoEstatus===s ? 'white' : 'var(--text, #222)',
              fontWeight:700, fontSize:12,
              cursor: conapeFallo ? 'not-allowed' : 'pointer',
              opacity: conapeFallo ? 0.5 : 1,
            }}>{s}</button>
          ))}
        </div>

        {error && <div style={{ color:'var(--err, #C62828)', fontSize:12, marginBottom:8 }}>{error}</div>}

        {conapeFallo && (
          <div style={{
            padding:'12px 14px', marginBottom:14, borderRadius:8,
            background:'#FFF8E1', border:'1px solid #E59500',
            color:'#7A4900', fontSize:12, lineHeight:1.5,
          }}>
            <div style={{ fontWeight:700, marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:14 }}>⚠</span>
              <span>Estatus guardado en el Campus, pero CONAPE quedó pendiente de actualización</span>
            </div>
            <div style={{ marginBottom: reintentoMsg ? 8 : 0 }}>
              La actualización de CONAPE quedó pendiente. Podés reintentar ahora o sincronizar después.
            </div>
            {reintentoMsg && (
              <div style={{
                fontWeight:600, marginTop:6,
                color: reintentoMsg.startsWith('✓') ? '#2E7D32' : '#C62828',
              }}>{reintentoMsg}</div>
            )}
          </div>
        )}

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          {conapeFallo ? (
            <>
              <button onClick={handleCerrarConFallo} style={{ padding:'7px 16px', borderRadius:6, border:'1px solid var(--border, #ddd)', background:'white', cursor:'pointer', fontSize:12 }}>
                Cerrar y dejar pendiente
              </button>
              <button onClick={handleReintentarSync} disabled={reintentando} style={{ padding:'7px 16px', borderRadius:6, background:'#E59500', color:'white', border:'none', fontWeight:700, cursor: reintentando ? 'wait' : 'pointer', fontSize:12 }}>
                {reintentando ? 'Sincronizando…' : '↻ Reintentar sync'}
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} style={{ padding:'7px 16px', borderRadius:6, border:'1px solid var(--border, #ddd)', background:'white', cursor:'pointer' }}>Cancelar</button>
              <button onClick={handleGuardar} disabled={loading} style={{ padding:'7px 16px', borderRadius:6, background:'var(--brand, #14213D)', color:'white', border:'none', fontWeight:700, cursor:'pointer' }}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function abrirPago(est, niv, onNavigate) {
  // FIX-NAVEGACION-APLICAR-PAGO-001 — obtener el código de forma robusta.
  // est.codigo puede venir vacío en algunas filas; caemos a los alias conocidos
  // antes de rendirnos. Sin código NO navegamos (evita prefill con "undefined").
  const codigo = String(
    est.codigo ||
    est.rec_m ||
    est.REC_M ||
    est.CODIGO ||
    est.CODIGO_ESTUDIANTE ||
    est.cod_estudiante ||
    ''
  ).trim();

  if (!codigo) {
    console.warn('abrirPago: estudiante sin código, no se navega a Aplicar Pago', est);
    alert('No se pudo abrir Aplicar Pago: el estudiante no tiene código.');
    return;
  }

  sessionStorage.setItem('an_pago_prefill', JSON.stringify({
    origen: 'admin_estudiantes',
    codigo,
    nivel: niv || '',
    forcePaso: 2,
    return_route: 'calendario_grupo',
    return_context: { codigo, nivel: niv || '' },
  }));
  if (onNavigate) onNavigate('aplicar_pago');
}

// ─────────────────────────────────────────────────────────────────────────
// COLORES POR NIVEL
// ─────────────────────────────────────────────────────────────────────────
const NIVEL_CONFIG = {
  B1: { nombre: 'Básico I',      color: '#E5A823', bg: 'rgba(229,168,35,0.12)'  },
  B2: { nombre: 'Básico II',     color: '#E8372A', bg: 'rgba(232,55,42,0.10)'   },
  I1: { nombre: 'Intermedio I',  color: '#2B7FC1', bg: 'rgba(43,127,193,0.10)'  },
  I2: { nombre: 'Intermedio II', color: '#4CAF50', bg: 'rgba(76,175,80,0.10)'   },
};

const ORDEN_NIVELES = ['B1','B2','I1','I2'];
const NIVEL_SIGUIENTE_PROYECCION = { B1:'B2', B2:'I1', I1:'I2' };

function nivelToId(nivelTexto) {
  const map = {
    'Básico I': 'B1', 'Básico II': 'B2',
    'Intermedio I': 'I1', 'Intermedio II': 'I2',
    'B1':'B1','B2':'B2','I1':'I1','I2':'I2',
  };
  return map[nivelTexto] || 'B1';
}

function extraerDias(codGrupo) {
  if (!codGrupo) return 'LM';
  const partes = codGrupo.split('-');
  const diasHora = partes[1] || 'LM69';
  return diasHora.replace(/\d/g, '');
}

function useGrupoInfo(codGrupo) {
  const [info, setInfo] = React.useState(null);
  React.useEffect(() => {
    if (!codGrupo) return;
    postAdminStudents('getGrupoInfo', { cod_grupo: codGrupo })
      .then(d => { if (d && d.ok) setInfo(d); })
      .catch(() => {});
  }, [codGrupo]);
  return info;
}

// ─────────────────────────────────────────────────────────────────────────
// LÓGICA DE LECCIÓN ESTIMADA
// ─────────────────────────────────────────────────────────────────────────
function calcularLeccionActual(startDate, diasCode, estatus) {
  // Si el nivel está APR → 32/32
  if (estatus === 'APR') return 32;
  if (!startDate) return 0;

  const diasMap = { LM:[1,3], KJ:[2,4], LJ:[1,4], SA:[6] };
  const dias = diasMap[diasCode] || [1,3];
  const inicio = new Date(startDate);
  inicio.setHours(0,0,0,0);
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  if (hoy < inicio) return 0;

  let count = 0;
  const cursor = new Date(inicio);
  while (cursor <= hoy) {
    if (dias.includes(cursor.getDay())) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  // SA y LJ dan 2 lecciones por sesión
  if (diasCode === 'SA' || diasCode === 'LJ') count *= 2;
  return Math.min(count, 32);
}

// ─────────────────────────────────────────────────────────────────────────
// CHIP DE GRUPO
// ─────────────────────────────────────────────────────────────────────────
function ChipGrupo({ grupo, seleccionado, onClick }) {
  const cfg = NIVEL_CONFIG[nivelToId(grupo.nivel)] || NIVEL_CONFIG.B1;
  const bajoMinimo = (grupo.estudiantes ?? grupo.students ?? 0) < 5;

  // Fecha legible corta (ej "14 set 2026")
  let fechaCorta = '';
  if (grupo.fecha_inicio) {
    const d = new Date(grupo.fecha_inicio + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      const meses = ['ene','feb','mar','abr','may','jun','jul','ago','set','oct','nov','dic'];
      fechaCorta = d.getDate() + ' ' + meses[d.getMonth()] + ' ' + d.getFullYear();
    }
  }

  return (
    <div onClick={onClick} style={{
      background: seleccionado ? cfg.color : cfg.bg,
      border: `2px solid ${cfg.color}`,
      borderRadius: 10,
      padding: '10px 14px',
      cursor: 'pointer',
      transition: 'all 0.15s',
      color: seleccionado ? 'white' : cfg.color,
      boxShadow: seleccionado ? `0 4px 14px ${cfg.bg}` : 'none',
      position: 'relative',
    }}>
      <div style={{ fontWeight: 800, fontSize: 13, fontFamily:'var(--f-mono, monospace)', letterSpacing:'-0.01em' }}>{grupo.code}</div>
      <div style={{ fontSize: 11, opacity: 0.8, marginTop:2 }}>{cfg.nombre}</div>
      {fechaCorta && (
        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3, fontStyle: 'italic' }}>
          Inicia: {fechaCorta}
        </div>
      )}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}>
        <span style={{ fontSize: 11, fontWeight:600 }}>{grupo.estudiantes ?? grupo.students ?? 0} est.</span>
        {bajoMinimo && (
          <span style={{
            fontSize: 9, fontWeight:700, letterSpacing:'0.04em',
            padding:'2px 5px', borderRadius:3,
            background: seleccionado ? 'rgba(255,255,255,0.25)' : 'rgba(220,80,30,0.15)',
            color: seleccionado ? 'white' : '#C0392B',
          }}>⚠ BAJO MÍN.</span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BADGE DE ESTADO
// ─────────────────────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  const map = {
    CA:  { label:'Cursando',   bg:'#E3F2FD', color:'#1565C0' },
    APR: { label:'Aprobado',   bg:'#CFEED6', color:'#176B2B' },
    REP: { label:'Reprobado',  bg:'#FFD7DB', color:'#A91624' },
    RI:  { label:'Retirado+',  bg:'#FFF3E0', color:'#E65100' },
    RJ:  { label:'Retirado',   bg:'#E3E7EA', color:'#455A64' },
    CNV: { label:'Convalida',  bg:'#F3E5F5', color:'#6A1B9A' },
    PE:  { label:'Proyectado', bg:'#ECE8E1', color:'#6F665E' },
  };
  const cfg = map[estado] || map.PE;
  return (
    <span style={{ background:cfg.bg, color:cfg.color, padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:'0.02em' }}>
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CUOTAS COMO CHECKS
// ─────────────────────────────────────────────────────────────────────────
function CuotasChecks({ cuotas, esperadas }) {
  const total   = esperadas || 4;
  const pagadas = Math.min(cuotas || 0, total);
  return (
    <div style={{ display:'flex', gap:3 }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{
          fontSize: 12,
          color: i < pagadas ? 'var(--ok, #2E7D32)' : 'var(--border, #ddd)',
          lineHeight: 1,
        }}>
          {i < pagadas ? '✓' : '○'}
        </span>
      ))}
    </div>
  );
}


function cleanCRPhone(value) {
  const raw = String(value || '').replace(/\D/g, '');
  if (!raw) return '';
  if (raw.length === 8) return '506' + raw;
  if (raw.length === 11 && raw.startsWith('506')) return raw;
  if (raw.length > 8 && raw.startsWith('506')) return raw;
  return raw;
}

function estudiantePhone(est) {
  return cleanCRPhone(
    est.telefono || est.tel || est.tel1 || est.tel_1 || est.telefono1 ||
    est.whatsapp || est.celular || est.TEL1 || est.TELEFONO || ''
  );
}

function edadEstudiante(est) {
  const raw = est.fecha_nacimiento || est.fechaNacimiento || est.nacimiento || est.f_nacimiento || est.FECHA_NAC || est.fecha_nac || '';
  if (!raw) return null;
  let d;
  if (/^\d{4}-\d{2}-\d{2}/.test(String(raw))) d = new Date(String(raw).slice(0,10) + 'T00:00:00');
  else {
    const m = String(raw).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    else d = new Date(raw);
  }
  if (!d || isNaN(d.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - d.getFullYear();
  const mm = hoy.getMonth() - d.getMonth();
  if (mm < 0 || (mm === 0 && hoy.getDate() < d.getDate())) edad--;
  return edad >= 0 && edad < 120 ? edad : null;
}

function primerNombreEstudiante(est = {}) {
  const nombre = String(est.display || est.nombre || est.nombre_completo || '').trim();
  return nombre ? nombre.split(/\s+/)[0] : '';
}

function seguimientoMotivoLabel(filtro = 'todos') {
  const labels = {
    mora: 'mora o pago pendiente',
    riesgo: 'seguimiento académico',
    cert_pend: 'certificado pendiente',
    nota_faltante: 'revisión de nota',
    conape: 'actualización CONAPE',
    apr: 'cierre académico',
    registrados: 'certificado registrado',
  };
  return labels[filtro] || 'seguimiento académico';
}

function seguimientoMensaje(est = {}, filtro = 'todos') {
  const nombre = primerNombreEstudiante(est);
  const saludo = `Hola${nombre ? ' ' + nombre : ''}, te saluda Academia Norteamericana.`;
  if (filtro === 'mora') {
    return `${saludo} Te escribimos para dar seguimiento a tu estado de pago y ayudarte a regularizar cualquier pendiente. Quedamos atentos.`;
  }
  if (filtro === 'cert_pend') {
    return `${saludo} Te escribimos para dar seguimiento al proceso de certificado de tu nivel. Te mantenemos informado por este medio.`;
  }
  if (filtro === 'nota_faltante') {
    return `${saludo} Estamos revisando el cierre académico de tu nivel y queremos confirmar información pendiente. Te contactamos por este medio.`;
  }
  if (filtro === 'riesgo') {
    return `${saludo} Queremos darte seguimiento académico para apoyarte con tu avance en el curso. Quedamos atentos para ayudarte.`;
  }
  if (filtro === 'conape') {
    return `${saludo} Te escribimos para dar seguimiento a tu información relacionada con CONAPE y mantener tu expediente actualizado.`;
  }
  return `${saludo} Te escribimos para dar seguimiento a tu proceso académico en Academia Norteamericana.`;
}


const BITACORA_LOCAL_PREFIX = 'anorte_bitacora_estudiante_v1::';

function codigoEstudianteClave(est = {}) {
  return String(est.codigo || est.rec_m || est.REC_M || est.cedula || est.identificacion || est.id || '').trim() || 'sin_codigo';
}

function bitacoraEstudianteKey(est = {}) {
  return BITACORA_LOCAL_PREFIX + codigoEstudianteClave(est);
}

function leerBitacoraLocal(est = {}) {
  try {
    const raw = window.localStorage ? window.localStorage.getItem(bitacoraEstudianteKey(est)) : '';
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter(x => x && typeof x === 'object').slice(0, 60) : [];
  } catch (_) {
    return [];
  }
}

function guardarBitacoraLocal(est = {}, items = []) {
  try {
    if (!window.localStorage) return false;
    window.localStorage.setItem(bitacoraEstudianteKey(est), JSON.stringify((items || []).slice(0, 60)));
    return true;
  } catch (_) {
    return false;
  }
}


function normalizarBitacoraRemota(item = {}) {
  return {
    id: item.id || item.ID || item.seguimiento_id || Date.now(),
    fecha: item.fecha_iso || item.fecha || item.FECHA || new Date().toISOString(),
    tipo: item.tipo || item.TIPO || 'General',
    nota: item.nota || item.NOTA || item.observacion || item.OBSERVACION || '',
    usuario: item.usuario || item.USUARIO || 'Admin',
    rol: item.rol || item.ROL || '',
    _backend: true,
  };
}

async function listarBitacoraBackend(est = {}) {
  try {
    const resp = await postAdminStudents('listarSeguimientoEstudiante', {
      codigo: codigoEstudianteClave(est),
      cedula: est.cedula || est.identificacion || est.NUM_CEDULA || '',
      cod_grupo: est.grupo || est.GRUPO || est.cod_grupo || '',
    });
    if (!resp || resp.ok !== true) return { ok: false, error: (resp && resp.error) || 'Backend no disponible' };
    return {
      ok: true,
      items: (resp.items || resp.seguimientos || []).map(normalizarBitacoraRemota).slice(0, 80),
      total: resp.total || (resp.items || []).length,
    };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

async function registrarBitacoraBackend(est = {}, item = {}) {
  try {
    const resp = await postAdminStudents('registrarSeguimientoEstudiante', {
      codigo: codigoEstudianteClave(est),
      cedula: est.cedula || est.identificacion || est.NUM_CEDULA || '',
      nombre: est.display || est.nombre || est.NOMBRE || '',
      telefono: estudiantePhone(est),
      cod_grupo: est.grupo || est.GRUPO || est.cod_grupo || '',
      nivel: est.nivel || est.NIVEL || '',
      tipo: item.tipo || 'General',
      nota: item.nota || '',
    });
    if (!resp || resp.ok !== true) return { ok: false, error: (resp && resp.error) || 'No se pudo guardar en backend' };
    return {
      ok: true,
      item: resp.item ? normalizarBitacoraRemota(resp.item) : null,
      items: (resp.items || []).map(normalizarBitacoraRemota).slice(0, 80),
    };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

async function eliminarBitacoraBackend(est = {}, id) {
  try {
    const resp = await postAdminStudents('eliminarSeguimientoEstudiante', {
      id,
      codigo: codigoEstudianteClave(est),
      cedula: est.cedula || est.identificacion || est.NUM_CEDULA || '',
    });
    if (!resp || resp.ok !== true) return { ok: false, error: (resp && resp.error) || 'No se pudo eliminar en backend' };
    return {
      ok: true,
      items: (resp.items || []).map(normalizarBitacoraRemota).slice(0, 80),
    };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

function formatFechaBitacora(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-CR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
  } catch (_) {
    return '—';
  }
}

function seguimientoFlagsEstudiante(est = {}) {
  const flags = [];
  if (moraEstudiante(est)) flags.push({ key:'mora', label:'Mora', tone:'bad' });
  if (riesgoOperativoEstudiante(est)) flags.push({ key:'riesgo', label:'Riesgo', tone:'bad' });
  if (certPendienteEstudiante(est)) flags.push({ key:'cert_pend', label:'Certificado', tone:'blue' });
  if (notaFaltanteEstudiante(est)) flags.push({ key:'nota_faltante', label:'Nota faltante', tone:'warn' });
  if (conapeEstudiante(est)) flags.push({ key:'conape', label:'CONAPE', tone:'blue' });
  if (!flags.length) flags.push({ key:'ok', label:'Sin alerta crítica', tone:'ok' });
  return flags;
}

function tipoBitacoraColor(tipo = '') {
  const t = String(tipo || '').toLowerCase();
  if (t.includes('mora') || t.includes('pago')) return { bg:'#FFEBEE', fg:'#C62828', bd:'#F4B7B7', icon:'💳' };
  if (t.includes('acad') || t.includes('riesgo')) return { bg:'#FFF8E1', fg:'#9A6200', bd:'#F1D18A', icon:'📚' };
  if (t.includes('conape')) return { bg:'#E3F2FD', fg:'#1565C0', bd:'#B9DAF5', icon:'🏦' };
  if (t.includes('cert')) return { bg:'#E8F5E9', fg:'#2E7D32', bd:'#BFE4C3', icon:'🏅' };
  if (t.includes('whatsapp') || t.includes('wa')) return { bg:'rgba(37,211,102,.10)', fg:'#128C4A', bd:'rgba(37,211,102,.35)', icon:'WA' };
  if (t.includes('llamada')) return { bg:'#F3E5F5', fg:'#6A1B9A', bd:'#D7B8DF', icon:'☎' };
  return { bg:'var(--surface-2,#f8f8f8)', fg:'var(--ink-2,#666)', bd:'var(--line,#ddd)', icon:'📝' };
}

function tipoBitacoraInicial(est = {}) {
  if (moraEstudiante(est)) return 'Mora / pago';
  if (riesgoOperativoEstudiante(est)) return 'Académico / riesgo';
  if (certPendienteEstudiante(est)) return 'Certificado';
  if (conapeEstudiante(est)) return 'CONAPE';
  return 'General';
}

function resumenBitacoraLocal(est = {}) {
  const items = leerBitacoraLocal(est);
  return { total: items.length, ultimo: items[0] || null };
}

function WhatsAppMini({ est, filtro = 'todos' }) {
  const phone = estudiantePhone(est);
  const msg = encodeURIComponent(seguimientoMensaje(est, filtro));
  if (!phone) {
    return <span title="Sin teléfono disponible" style={{ width:28, height:28, borderRadius:8, display:'inline-flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--line,#ddd)', color:'var(--ink-3,#999)', background:'var(--surface-2,#f8f8f8)', opacity:0.55 }}>☏</span>;
  }
  return (
    <a href={`https://web.whatsapp.com/send?phone=${phone}&text=${msg}`} target="_blank" rel="noreferrer" title={`WhatsApp · ${seguimientoMotivoLabel(filtro)}`} style={{
      width:28, height:28, borderRadius:8, display:'inline-flex', alignItems:'center', justifyContent:'center', textDecoration:'none',
      border:'1px solid rgba(37,211,102,.35)', background:'rgba(37,211,102,.10)', color:'#128C4A', fontWeight:900, fontSize:13,
    }}>WA</a>
  );
}

function PillMini({ label, value, tone }) {
  const tones = {
    ok:    { bg:'#E8F5E9', fg:'#2E7D32', bd:'#BFE4C3' },
    bad:   { bg:'#FFEBEE', fg:'#C62828', bd:'#F4B7B7' },
    warn:  { bg:'#FFF8E1', fg:'#9A6200', bd:'#F1D18A' },
    blue:  { bg:'#E3F2FD', fg:'#1565C0', bd:'#B9DAF5' },
    muted: { bg:'var(--surface-2,#f8f8f8)', fg:'var(--ink-3,#888)', bd:'var(--line,#ddd)' },
  };
  const t = tones[tone] || tones.muted;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 6px', borderRadius:999, background:t.bg, color:t.fg, border:`1px solid ${t.bd}`, fontSize:9.5, fontWeight:850, lineHeight:1, whiteSpace:'nowrap' }}>
      <span style={{ opacity:.72 }}>{label}</span><strong>{value}</strong>
    </span>
  );
}

function boolCertPago(v) {
  if (v === true) return true;
  if (v === false || v == null) return false;
  if (typeof v === 'number') return v > 0;
  const s = String(v).trim().toUpperCase();
  if (!s || ['NO','FALSE','FALSO','0','PENDIENTE','—','-','N/A'].includes(s)) return false;
  return ['SI','SÍ','TRUE','PAGO','PAGADO','OK','1','X','✓'].includes(s) || Number(s) > 0;
}

function certPagoEstudiante(est = {}) {
  return boolCertPago(
    est.certificado_pagado ?? est.certificadoPago ?? est.certificado_pago ??
    est.cert_pago ?? est.pago_certificado ?? est.CERTIFICADO_PAGADO ??
    est.certificado ?? est.cert ?? false
  );
}

function certRegistroEstudiante(est = {}) {
  const vals = [
    est.cert_num, est.certNum, est.reg_certificados, est.REG_CERTIFICADOS,
    est.registro_certificado, est.REGISTRO_CERTIFICADO, est.numero_certificado,
    est.NUMERO_CERTIFICADO, est.certificado_registro, est.CERTIFICADO_REGISTRO,
  ];
  for (const v of vals) {
    const s = String(v == null ? '' : v).trim();
    if (s && !['NO','FALSE','0','—','-','N/A'].includes(s.toUpperCase())) return s;
  }
  return '';
}

function certVisualState({ estatus, certPago, certNum }) {
  const st = String(estatus || '').toUpperCase();
  if (certNum) {
    return {
      key:'registrado', tone:'ok', label:'Registrado', sub:`# ${certNum}`,
      hint:'Ya tiene número de certificado. No se debe generar otra copia; se debe buscar/abrir el PDF existente o el firmado más reciente en Drive.',
      canVer:true, canCrear:false,
    };
  }
  if ((st === 'APR' || st === 'CNV') && certPago) {
    return {
      key:'listo', tone:'blue', label:'Listo para crear', sub:`${st} + certificado pagado`,
      hint:'Puede generar el certificado por primera vez. Después debe cambiar a Ver PDF.',
      canVer:false, canCrear:true,
    };
  }
  if ((st === 'APR' || st === 'CNV') && !certPago) {
    return {
      key:'falta_pago', tone:'warn', label:'Falta pago', sub:'Certificado no pagado',
      hint:'El estudiante está APR, pero no aparece pago de certificado.',
      canVer:false, canCrear:false,
    };
  }
  if (certPago && st !== 'APR' && st !== 'CNV') {
    return {
      key:'pagado_no_apr', tone:'warn', label:'Pagado', sub:`Falta APR (${st || '—'})`,
      hint:'Hay pago de certificado, pero el nivel todavía no está aprobado.',
      canVer:false, canCrear:false,
    };
  }
  return {
    key:'no_apto', tone:'muted', label:'No apto', sub:`Requiere APR${certPago ? '' : ' + pago'}`,
    hint:'No cumple todavía las condiciones para certificado.',
    canVer:false, canCrear:false,
  };
}

function CertificadoEstadoBox({ state }) {
  const tones = {
    ok:    { bg:'#DDF3E2', fg:'#176B2B', bd:'#9FD5AA' },
    blue:  { bg:'#E3F2FD', fg:'#1565C0', bd:'#B9DAF5' },
    warn:  { bg:'#FFF0C7', fg:'#8A5600', bd:'#E9C36D' },
    muted: { bg:'#ECE8E1', fg:'#6F665E', bd:'#D3CCC2' },
  };
  const t = tones[state.tone] || tones.muted;
  return <div title={state.hint} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 7px',borderRadius:8,background:t.bg,color:t.fg,border:`1px solid ${t.bd}`,maxWidth:148,minHeight:24}}><span style={{fontSize:9.5,fontWeight:900,whiteSpace:'nowrap'}}>{state.label}</span>{state.sub&&<span style={{fontSize:8.5,fontWeight:700,opacity:.78,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{state.sub}</span>}</div>;
}

function CertificadoCell({ certPago, certNum, estatus, onCrear, onVer }) {
  const state = certVisualState({ estatus, certPago, certNum });
  return <div style={{display:'flex',gap:4,alignItems:'center',whiteSpace:'nowrap'}}><CertificadoEstadoBox state={state}/>{state.canVer&&<button onClick={onVer} title="Abrir PDF" aria-label="Abrir PDF" style={{width:27,height:27,borderRadius:7,border:'1px solid #9FD5AA',background:'#DDF3E2',color:'#176B2B',fontSize:10,fontWeight:900,cursor:'pointer'}}>PDF</button>}{state.canCrear&&<button onClick={onCrear} title="Crear certificado" aria-label="Crear certificado" style={{width:27,height:27,borderRadius:7,border:'1px solid #7EB4E2',background:'#E3F2FD',color:'#1565C0',fontSize:14,fontWeight:900,cursor:'pointer'}}>＋</button>}</div>;
}

function moraEstudiante(e = {}) {
  if (typeof e.mora !== 'undefined') return !!e.mora;
  return e.morosidad === 'SI' || e.morosidad === true || String(e.morosidad || '').toUpperCase() === 'SI';
}

function certPendienteEstudiante(e = {}) {
  const st = String(e.estatus || e.status_actual || '').toUpperCase();
  return st === 'APR' && certPagoEstudiante(e) && !certRegistroEstudiante(e);
}

function certRegistradoEstudiante(e = {}) {
  return !!certRegistroEstudiante(e);
}

function conapeEstudiante(e = {}) {
  return String(e.convenio || e.CONVENIO || '').toUpperCase().includes('CONAPE');
}

function notaFaltanteEstudiante(e = {}) {
  const st = String(e.estatus || e.status_actual || '').toUpperCase();
  const nota = Number(e.nota || 0);
  return ['APR','REP','CNV'].includes(st) && !nota;
}

function riesgoOperativoEstudiante(e = {}) {
  const st = String(e.estatus || e.status_actual || '').toUpperCase();
  const nota = Number(e.nota || 0);
  return moraEstudiante(e) || st === 'REP' || st === 'RI' || (nota > 0 && nota < 70);
}

function matchFiltroOperativo(e = {}, filtro = 'todos') {
  const st = String(e.estatus || e.status_actual || '').toUpperCase();
  if (filtro === 'todos') return true;
  if (filtro === 'mora') return moraEstudiante(e);
  if (filtro === 'cert_pend') return certPendienteEstudiante(e);
  if (filtro === 'registrados') return certRegistradoEstudiante(e);
  if (filtro === 'apr') return st === 'APR' || st === 'CNV';
  if (filtro === 'conape') return conapeEstudiante(e);
  if (filtro === 'riesgo') return riesgoOperativoEstudiante(e);
  if (filtro === 'nota_faltante') return notaFaltanteEstudiante(e);
  return true;
}

function resumenOperativoEstudiantes(secciones = []) {
  const arr = secciones.flatMap(s => s.estudiantes || []);
  const total = arr.length;
  const morosos = arr.filter(moraEstudiante).length;
  const conape = arr.filter(conapeEstudiante).length;
  const aprobados = arr.filter(e => ['APR','CNV'].includes(String(e.estatus || e.status_actual || '').toUpperCase())).length;
  const certPend = arr.filter(certPendienteEstudiante).length;
  const certReg = arr.filter(certRegistradoEstudiante).length;
  const riesgo = arr.filter(riesgoOperativoEstudiante).length;
  const notaFaltante = arr.filter(notaFaltanteEstudiante).length;
  return { total, morosos, conape, aprobados, certPend, certReg, riesgo, notaFaltante };
}

function resumenOperativoNivel(estudiantes = []) {
  return resumenOperativoEstudiantes([{ estudiantes }]);
}

function prioridadOperativaNivel(resumen = {}) {
  const score = (resumen.riesgo || 0) * 4 + (resumen.morosos || 0) * 3 + (resumen.certPend || 0) * 2 + (resumen.notaFaltante || 0) * 2;
  if (score >= 8) return { label:'Atención alta', tone:'bad', score };
  if (score >= 3) return { label:'Revisar', tone:'warn', score };
  return { label:'Estable', tone:'ok', score };
}

function MapaNivelesOperativo({ secciones, nivelEnfoque, setNivelEnfoque, setFiltroOperativo }) {
  const items = (secciones || []).map(s => ({
    nivel: s.nivel,
    resumen: resumenOperativoNivel(s.estudiantes || []),
    cfg: NIVEL_CONFIG[s.nivel] || NIVEL_CONFIG.B1,
  }));
  if (!items.length) return null;
  const peor = [...items].sort((a, b) => prioridadOperativaNivel(b.resumen).score - prioridadOperativaNivel(a.resumen).score)[0];
  const nivelPeor = peor?.nivel;

  return (
    <div style={{
      margin:'0 0 16px', padding:'14px 16px', border:'1px solid var(--line,#e6e0d8)', borderRadius:14,
      background:'linear-gradient(135deg, white, color-mix(in srgb, var(--an-navy,#14213D) 3%, white))',
      boxShadow:'0 10px 24px rgba(20,33,61,0.04)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:900, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3,#999)', marginBottom:4 }}>
            Mapa de niveles
          </div>
          <div style={{ fontFamily:'var(--f-serif,serif)', fontSize:20, color:'var(--an-navy,#14213D)', fontWeight:600, lineHeight:1.1 }}>
            Enfoque operativo por nivel
          </div>
          <div style={{ fontSize:12, color:'var(--ink-2,#666)', marginTop:4, lineHeight:1.45 }}>
            Tocá un nivel para trabajar solo esa sección. No modifica datos ni estados.
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
          {nivelEnfoque && (
            <button type="button" onClick={() => setNivelEnfoque(null)} style={{
              border:'1px solid rgba(20,33,61,.18)', background:'white', color:'var(--an-navy,#14213D)',
              borderRadius:9, padding:'7px 10px', fontSize:11, fontWeight:900, cursor:'pointer',
            }}>
              Ver todos los niveles
            </button>
          )}
          {nivelPeor && (
            <button type="button" onClick={() => { setNivelEnfoque(nivelPeor); setFiltroOperativo('todos'); }} style={{
              border:'1px solid rgba(198,40,40,.18)', background:'color-mix(in srgb, #C62828 7%, white)', color:'#C62828',
              borderRadius:9, padding:'7px 10px', fontSize:11, fontWeight:900, cursor:'pointer',
            }}>
              Prioridad: {nivelPeor}
            </button>
          )}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap:10 }}>
        {items.map(({ nivel, resumen, cfg }) => {
          const pri = prioridadOperativaNivel(resumen);
          const active = nivelEnfoque === nivel;
          const priColor = pri.tone === 'bad' ? '#C62828' : pri.tone === 'warn' ? '#9A6200' : '#2E7D32';
          return (
            <button key={nivel} type="button" onClick={() => { setNivelEnfoque(active ? null : nivel); setFiltroOperativo('todos'); }} style={{
              textAlign:'left', padding:'12px 12px', borderRadius:13, cursor:'pointer', fontFamily:'inherit',
              border:`2px solid ${active ? cfg.color : 'var(--line,#e6e0d8)'}`,
              background: active ? `color-mix(in srgb, ${cfg.color} 9%, white)` : 'white',
              boxShadow: active ? '0 12px 22px rgba(20,33,61,.10)' : '0 4px 14px rgba(20,33,61,.04)',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:12, height:12, borderRadius:4, background:cfg.color, display:'inline-block' }} />
                  <strong style={{ fontSize:15, color:'var(--ink,#2b2b2b)' }}>{nivel}</strong>
                </div>
                <span style={{ fontSize:10, fontWeight:900, color:priColor, background: pri.tone === 'bad' ? '#FFEBEE' : pri.tone === 'warn' ? '#FFF8E1' : '#E8F5E9', border:`1px solid ${priColor}33`, padding:'3px 7px', borderRadius:999 }}>
                  {pri.label}
                </span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:6 }}>
                <NivelMiniStat label="Est." value={resumen.total} />
                <NivelMiniStat label="APR/CNV" value={resumen.aprobados} />
                <NivelMiniStat label="Mora" value={resumen.morosos} warn={resumen.morosos > 0} />
                <NivelMiniStat label="Riesgo" value={resumen.riesgo} warn={resumen.riesgo > 0} />
                <NivelMiniStat label="Cert. pend." value={resumen.certPend} warn={resumen.certPend > 0} />
                <NivelMiniStat label="Nota falt." value={resumen.notaFaltante} warn={resumen.notaFaltante > 0} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NivelMiniStat({ label, value, warn }) {
  return (
    <div style={{
      padding:'6px 7px', borderRadius:9, background: warn ? '#FFF8E1' : 'var(--surface-2,#f8f8f8)',
      border:`1px solid ${warn ? '#F1D18A' : 'var(--line,#ececec)'}`,
    }}>
      <div style={{ fontSize:9, fontWeight:900, letterSpacing:'0.08em', textTransform:'uppercase', color: warn ? '#9A6200' : 'var(--ink-3,#888)' }}>{label}</div>
      <div style={{ fontFamily:'var(--f-mono,monospace)', fontSize:14, fontWeight:900, color: warn ? '#9A6200' : 'var(--an-navy,#14213D)', marginTop:1 }}>{value || 0}</div>
    </div>
  );
}

function FiltroOperativoBtn({ active, label, count, tone, onClick }) {
  const tones = {
    navy: { bg:'var(--an-navy,#14213D)', fg:'white', soft:'color-mix(in srgb, var(--an-navy,#14213D) 7%, white)', bd:'color-mix(in srgb, var(--an-navy,#14213D) 22%, white)' },
    ok:   { bg:'#2E7D32', fg:'white', soft:'#E8F5E9', bd:'#BFE4C3' },
    bad:  { bg:'#C62828', fg:'white', soft:'#FFEBEE', bd:'#F4B7B7' },
    warn: { bg:'#9A6200', fg:'white', soft:'#FFF8E1', bd:'#F1D18A' },
    blue: { bg:'#1565C0', fg:'white', soft:'#E3F2FD', bd:'#B9DAF5' },
    muted:{ bg:'var(--ink-2,#666)', fg:'white', soft:'var(--surface-2,#f8f8f8)', bd:'var(--line,#ddd)' },
  };
  const t = tones[tone] || tones.muted;
  return (
    <button type="button" onClick={onClick} style={{
      border:`1px solid ${active ? t.bg : t.bd}`,
      background: active ? t.bg : t.soft,
      color: active ? t.fg : (tone === 'navy' ? 'var(--an-navy,#14213D)' : t.bg),
      borderRadius:999, padding:'7px 10px', fontSize:11, fontWeight:900,
      cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6,
      boxShadow: active ? '0 8px 18px rgba(20,33,61,0.12)' : 'none',
      whiteSpace:'nowrap', fontFamily:'inherit',
    }}>
      <span>{label}</span>
      <strong style={{ fontFamily:'var(--f-mono,monospace)', fontSize:10.5 }}>{count}</strong>
    </button>
  );
}


function htmlEscapeReporte(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildReporteOperativoTexto({ grupoCodigo, estado, resumen, filtro, motivo, estudiantes }) {
  const fecha = new Date().toLocaleString('es-CR');
  const arr = Array.isArray(estudiantes) ? estudiantes : [];
  const lines = arr.map((e, i) => {
    const nombre = e.display || e.nombre || 'Sin nombre';
    const ced = e.cedula || e.identificacion || e.id || '—';
    const tel = estudiantePhone(e) || '—';
    const st = e.estatus || e.status_actual || '—';
    const nota = e.nota || '—';
    const mora = moraEstudiante(e) ? 'SI' : 'NO';
    const cert = certRegistroEstudiante(e) || certVisualState({ estatus:e.estatus, certPago:certPagoEstudiante(e), certNum:certRegistroEstudiante(e) }).label;
    return `${i + 1}. ${nombre} | ${ced} | Tel: ${tel} | Estado: ${st} | Mora: ${mora} | Nota: ${nota} | Cert: ${cert || '—'}`;
  });
  return [
    `REPORTE OPERATIVO DE GRUPO`,
    `Grupo: ${grupoCodigo || '—'}`,
    `Fecha: ${fecha}`,
    `Estado general: ${estado || '—'}`,
    `Filtro: ${filtro === 'todos' ? 'Todos' : motivo}`,
    '',
    `RESUMEN`,
    `Total estudiantes: ${resumen.total || 0}`,
    `Riesgo: ${resumen.riesgo || 0}`,
    `Mora: ${resumen.morosos || 0}`,
    `Certificados pendientes: ${resumen.certPend || 0}`,
    `Certificados registrados: ${resumen.certReg || 0}`,
    `APR/CNV: ${resumen.aprobados || 0}`,
    `CONAPE: ${resumen.conape || 0}`,
    `Nota faltante: ${resumen.notaFaltante || 0}`,
    '',
    `ESTUDIANTES (${arr.length})`,
    ...lines,
  ].join('\n');
}

function buildReporteOperativoHtml({ grupoCodigo, estado, resumen, filtro, motivo, estudiantes }) {
  const fecha = new Date().toLocaleString('es-CR');
  const arr = Array.isArray(estudiantes) ? estudiantes : [];
  const estadoColor = estado === 'Crítico' ? '#C62828' : estado === 'En observación' ? '#9A6200' : '#2E7D32';
  const stats = [
    ['Total estudiantes', resumen.total || 0],
    ['Riesgo', resumen.riesgo || 0],
    ['Mora', resumen.morosos || 0],
    ['Cert. pendientes', resumen.certPend || 0],
    ['Cert. registrados', resumen.certReg || 0],
    ['APR/CNV', resumen.aprobados || 0],
    ['CONAPE', resumen.conape || 0],
    ['Nota faltante', resumen.notaFaltante || 0],
  ];
  const rows = arr.map((e, i) => {
    const certNum = certRegistroEstudiante(e);
    const certPago = certPagoEstudiante(e);
    const cert = certVisualState({ estatus:e.estatus, certPago, certNum });
    const alertas = [
      moraEstudiante(e) ? 'Mora' : '',
      riesgoOperativoEstudiante(e) ? 'Riesgo' : '',
      certPendienteEstudiante(e) ? 'Cert. pendiente' : '',
      conapeEstudiante(e) ? 'CONAPE' : '',
      notaFaltanteEstudiante(e) ? 'Nota faltante' : '',
    ].filter(Boolean).join(' · ');
    return `<tr>
      <td>${i + 1}</td>
      <td><strong>${htmlEscapeReporte(e.display || e.nombre || 'Sin nombre')}</strong><br><small>${htmlEscapeReporte(e.codigo || e.rec_m || '')}</small></td>
      <td>${htmlEscapeReporte(e.cedula || e.identificacion || e.id || '—')}</td>
      <td>${htmlEscapeReporte(estudiantePhone(e) || '—')}</td>
      <td>${htmlEscapeReporte(e.estatus || e.status_actual || '—')}</td>
      <td>${htmlEscapeReporte(e.nota || '—')}</td>
      <td>${moraEstudiante(e) ? '<span class="pill bad">SI</span>' : '<span class="pill ok">NO</span>'}</td>
      <td>${htmlEscapeReporte(certNum || cert.label || '—')}</td>
      <td>${alertas ? htmlEscapeReporte(alertas) : '<span class="muted">Sin alerta visual</span>'}</td>
    </tr>`;
  }).join('');
  const statCards = stats.map(([label, value]) => `<div class="stat"><span>${htmlEscapeReporte(label)}</span><strong>${htmlEscapeReporte(value)}</strong></div>`).join('');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Reporte operativo ${htmlEscapeReporte(grupoCodigo || '')}</title>
<style>
  :root { --navy:#14213D; --gold:#E5A823; --line:#e6e0d8; --ink:#2b2b2b; }
  * { box-sizing:border-box; }
  body { margin:0; padding:28px; font-family:Arial, Helvetica, sans-serif; color:var(--ink); background:#f7f4ef; }
  .page { max-width:1060px; margin:0 auto; background:white; border:1px solid var(--line); border-radius:18px; overflow:hidden; box-shadow:0 18px 50px rgba(20,33,61,.10); }
  header { padding:28px 32px; background:linear-gradient(135deg, var(--navy), #26385f); color:white; display:flex; justify-content:space-between; gap:24px; align-items:flex-start; }
  .kicker { font-size:11px; letter-spacing:.16em; text-transform:uppercase; opacity:.75; font-weight:800; margin-bottom:6px; }
  h1 { margin:0; font-size:30px; line-height:1.05; letter-spacing:-.03em; }
  .meta { text-align:right; font-size:12px; line-height:1.55; opacity:.86; }
  main { padding:24px 32px 32px; }
  .estado { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; border:1px solid ${estadoColor}55; background:${estadoColor}12; color:${estadoColor}; font-size:12px; font-weight:900; margin:0 0 18px; }
  .stats { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:10px; margin-bottom:22px; }
  .stat { padding:12px 14px; border:1px solid var(--line); border-radius:12px; background:#fbfaf8; }
  .stat span { display:block; font-size:10px; letter-spacing:.10em; text-transform:uppercase; color:#777; font-weight:800; margin-bottom:4px; }
  .stat strong { font-size:24px; color:var(--navy); letter-spacing:-.04em; }
  .section-title { font-size:12px; letter-spacing:.14em; text-transform:uppercase; font-weight:900; color:var(--navy); margin:20px 0 10px; }
  table { width:100%; border-collapse:collapse; font-size:11.5px; }
  th { background:#f3efe8; color:#6f665e; text-align:left; padding:9px 8px; font-size:10px; letter-spacing:.08em; text-transform:uppercase; }
  td { border-bottom:1px solid #eee7df; padding:8px; vertical-align:top; }
  small { color:#777; font-size:10px; }
  .pill { display:inline-flex; padding:3px 7px; border-radius:999px; font-size:10px; font-weight:900; }
  .pill.bad { background:#FFEBEE; color:#C62828; border:1px solid #F4B7B7; }
  .pill.ok { background:#E8F5E9; color:#2E7D32; border:1px solid #BFE4C3; }
  .muted { color:#999; }
  .acciones { margin:18px 0 0; padding:14px 16px; background:#FFF8E1; border:1px solid #F1D18A; border-radius:12px; color:#7A4900; font-size:12px; line-height:1.5; }
  .toolbar { display:flex; justify-content:flex-end; gap:8px; padding:14px 32px; border-top:1px solid var(--line); background:#fbfaf8; }
  button { border:0; border-radius:10px; padding:10px 14px; background:var(--navy); color:white; font-weight:800; cursor:pointer; }
  @media print {
    body { background:white; padding:0; }
    .page { box-shadow:none; border:0; border-radius:0; max-width:none; }
    .toolbar { display:none; }
    header { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
    .stats { grid-template-columns:repeat(4, 1fr); }
  }
</style>
</head>
<body>
  <div class="page">
    <header>
      <div>
        <div class="kicker">Academia Norteamericana · Reporte operativo</div>
        <h1>${htmlEscapeReporte(grupoCodigo || 'Grupo')}</h1>
      </div>
      <div class="meta">
        <strong>Generado:</strong> ${htmlEscapeReporte(fecha)}<br>
        <strong>Filtro:</strong> ${htmlEscapeReporte(filtro === 'todos' ? 'Todos' : motivo)}<br>
        <strong>Estudiantes listados:</strong> ${arr.length}
      </div>
    </header>
    <main>
      <div class="estado">Estado general: ${htmlEscapeReporte(estado || '—')}</div>
      <div class="stats">${statCards}</div>
      <div class="acciones">
        <strong>Lectura rápida:</strong>
        ${resumen.riesgo || resumen.morosos || resumen.certPend || resumen.notaFaltante
          ? 'Este grupo tiene puntos de seguimiento. Priorizar riesgo académico, mora, certificados pendientes o notas faltantes según corresponda.'
          : 'El grupo no muestra alertas visuales fuertes en la radiografía actual.'}
      </div>
      <div class="section-title">Detalle de estudiantes</div>
      <table>
        <thead>
          <tr>
            <th>#</th><th>Estudiante</th><th>Cédula</th><th>Teléfono</th><th>Estado</th><th>Nota</th><th>Mora</th><th>Certificado</th><th>Alertas</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="9" class="muted">No hay estudiantes para este filtro.</td></tr>'}</tbody>
      </table>
    </main>
    <div class="toolbar">
      <button onclick="window.print()">Imprimir / Guardar PDF</button>
    </div>
  </div>
</body>
</html>`;
}


function tonoPrioridadOperativa(resumen = {}) {
  const score = (resumen.riesgo || 0) * 4 + (resumen.morosos || 0) * 3 + (resumen.certPend || 0) * 2 + (resumen.notaFaltante || 0) * 2;
  if (score >= 10) return { nivel:'Alta', color:'#C62828', bg:'#FFEBEE', border:'#F4B7B7', icon:'🔥' };
  if (score >= 4) return { nivel:'Media', color:'#9A6200', bg:'#FFF8E1', border:'#F1D18A', icon:'⚠' };
  return { nivel:'Baja', color:'#2E7D32', bg:'#E8F5E9', border:'#BFE4C3', icon:'✓' };
}

function accionesPrioridadOperativa(resumen = {}) {
  const acciones = [];
  if ((resumen.riesgo || 0) > 0) acciones.push({ titulo:'Riesgo académico', texto:`${resumen.riesgo} estudiante(s) requieren revisión académica.`, filtro:'riesgo', tono:'bad' });
  if ((resumen.morosos || 0) > 0) acciones.push({ titulo:'Mora activa', texto:`${resumen.morosos} estudiante(s) deben pasar a seguimiento de pago.`, filtro:'mora', tono:'bad' });
  if ((resumen.certPend || 0) > 0) acciones.push({ titulo:'Certificados pendientes', texto:`${resumen.certPend} certificado(s) listos para revisar proceso.`, filtro:'cert_pend', tono:'blue' });
  if ((resumen.notaFaltante || 0) > 0) acciones.push({ titulo:'Notas faltantes', texto:`${resumen.notaFaltante} nota(s) requieren validación.`, filtro:'nota_faltante', tono:'warn' });
  if ((resumen.conape || 0) > 0) acciones.push({ titulo:'CONAPE', texto:`${resumen.conape} estudiante(s) financiados en el grupo.`, filtro:'conape', tono:'blue' });
  if (!acciones.length) acciones.push({ titulo:'Sin alertas fuertes', texto:'El grupo se ve estable en la radiografía actual.', filtro:'todos', tono:'ok' });
  return acciones.slice(0, 3);
}

function PanelPrioridadOperativa({ resumen, setFiltro }) {
  const tono = tonoPrioridadOperativa(resumen);
  const acciones = accionesPrioridadOperativa(resumen);
  const porcentajeOk = resumen.total ? Math.max(0, Math.round(((resumen.total - resumen.riesgo - resumen.morosos) / resumen.total) * 100)) : 100;
  return (
    <div style={{
      margin:'10px 0 12px', display:'grid', gridTemplateColumns:'minmax(220px, .85fr) minmax(0, 1.65fr)', gap:10,
    }}>
      <div style={{
        border:`1px solid ${tono.border}`, background:`linear-gradient(135deg, ${tono.bg}, white)`,
        borderRadius:14, padding:'12px 14px', minHeight:108, display:'flex', flexDirection:'column', justifyContent:'space-between',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
          <div>
            <div style={{ fontSize:9.5, fontWeight:900, letterSpacing:'0.14em', textTransform:'uppercase', color:tono.color }}>Prioridad operativa</div>
            <div style={{ fontFamily:'var(--f-serif,serif)', fontSize:24, lineHeight:1.05, color:tono.color, fontWeight:700, marginTop:2 }}>{tono.nivel}</div>
          </div>
          <div style={{ width:42, height:42, borderRadius:14, background:'rgba(255,255,255,.75)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, boxShadow:'inset 0 0 0 1px rgba(255,255,255,.8)' }}>{tono.icon}</div>
        </div>
        <div style={{ marginTop:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, color:'var(--ink-3,#777)', fontWeight:800, marginBottom:5 }}>
            <span>Salud visual del grupo</span><span>{porcentajeOk}%</span>
          </div>
          <div style={{ height:7, borderRadius:999, background:'rgba(20,33,61,.10)', overflow:'hidden' }}>
            <div style={{ width:`${porcentajeOk}%`, height:'100%', borderRadius:999, background:tono.color }} />
          </div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap:8 }}>
        {acciones.map((a, idx) => {
          const color = a.tono === 'bad' ? '#C62828' : a.tono === 'warn' ? '#9A6200' : a.tono === 'blue' ? '#1565C0' : '#2E7D32';
          const bg = a.tono === 'bad' ? '#FFEBEE' : a.tono === 'warn' ? '#FFF8E1' : a.tono === 'blue' ? '#E3F2FD' : '#E8F5E9';
          return (
            <button key={idx} type="button" onClick={() => setFiltro(a.filtro)} style={{
              textAlign:'left', border:`1px solid color-mix(in srgb, ${color} 25%, white)`, background:bg,
              borderRadius:14, padding:'11px 12px', cursor:'pointer', minHeight:108,
              boxShadow:'0 8px 18px rgba(20,33,61,0.04)', fontFamily:'inherit',
            }}>
              <div style={{ fontSize:9.5, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color, marginBottom:5 }}>Acción sugerida {idx + 1}</div>
              <div style={{ fontSize:13, fontWeight:900, color:'var(--an-navy,#14213D)', lineHeight:1.15 }}>{a.titulo}</div>
              <div style={{ fontSize:11.5, color:'var(--ink-2,#666)', marginTop:5, lineHeight:1.35 }}>{a.texto}</div>
              <div style={{ marginTop:8, fontSize:10.5, fontWeight:900, color, display:'inline-flex', alignItems:'center', gap:5 }}>
                Aplicar filtro →
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PanelOperativoGrupo({ resumen, filtro, setFiltro, embebidoCalGrupo, estudiantesFiltrados, grupoCodigo }) {
  const estado = resumen.riesgo > 0 || resumen.morosos > 0 || resumen.certPend > 0 || resumen.notaFaltante > 0
    ? (resumen.riesgo + resumen.morosos >= 4 ? 'Crítico' : 'En observación')
    : 'Estable';
  const estadoTone = estado === 'Estable' ? 'ok' : estado === 'Crítico' ? 'bad' : 'warn';
  const filtros = [
    ['todos', 'Todos', resumen.total, 'navy'],
    ['riesgo', 'Riesgo', resumen.riesgo, 'bad'],
    ['mora', 'Mora', resumen.morosos, 'bad'],
    ['cert_pend', 'Cert. pendientes', resumen.certPend, 'blue'],
    ['registrados', 'Cert. registrados', resumen.certReg, 'ok'],
    ['apr', 'APR/CNV', resumen.aprobados, 'ok'],
    ['conape', 'CONAPE', resumen.conape, 'blue'],
    ['nota_faltante', 'Nota faltante', resumen.notaFaltante, 'warn'],
  ];
  const [copiadoSeguimiento, setCopiadoSeguimiento] = React.useState(false);
  const [copiadoResumen, setCopiadoResumen] = React.useState(false);
  const [csvOk, setCsvOk] = React.useState(false);
  const [reporteCopiado, setReporteCopiado] = React.useState(false);
  const seguimientoArr = Array.isArray(estudiantesFiltrados) ? estudiantesFiltrados : [];
  const motivo = seguimientoMotivoLabel(filtro);
  const copiarSeguimiento = React.useCallback(() => {
    const lines = seguimientoArr.map((e, i) => {
      const nombre = e.display || e.nombre || 'Sin nombre';
      const ced = e.cedula || e.identificacion || e.id || '—';
      const phone = estudiantePhone(e) || 'sin teléfono';
      const estado = e.estatus || e.status_actual || '—';
      const nota = e.nota ? ` · Nota ${e.nota}` : '';
      return `${i + 1}. ${nombre} · ${ced} · ${phone} · ${estado}${nota}`;
    });
    const txt = [
      `Seguimiento ${grupoCodigo || ''}${filtro !== 'todos' ? ` · ${motivo}` : ''}`.trim(),
      `Total: ${seguimientoArr.length}`,
      '',
      ...lines,
    ].join('\n');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt);
      setCopiadoSeguimiento(true);
      setTimeout(() => setCopiadoSeguimiento(false), 1300);
    } catch (_) {}
  }, [seguimientoArr, grupoCodigo, filtro, motivo]);

  const copiarResumenOperativo = React.useCallback(() => {
    const txt = [
      `RESUMEN OPERATIVO · ${grupoCodigo || 'GRUPO'}`,
      `Estado: ${estado}`,
      `Total estudiantes: ${resumen.total || 0}`,
      `Riesgo: ${resumen.riesgo || 0}`,
      `Mora: ${resumen.morosos || 0}`,
      `Certificados pendientes: ${resumen.certPend || 0}`,
      `Certificados registrados: ${resumen.certReg || 0}`,
      `APR/CNV: ${resumen.aprobados || 0}`,
      `CONAPE: ${resumen.conape || 0}`,
      `Nota faltante: ${resumen.notaFaltante || 0}`,
      filtro !== 'todos' ? `Filtro activo: ${motivo} (${seguimientoArr.length})` : 'Filtro activo: Todos',
    ].join('\n');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt);
      setCopiadoResumen(true);
      setTimeout(() => setCopiadoResumen(false), 1300);
    } catch (_) {}
  }, [grupoCodigo, estado, resumen, filtro, motivo, seguimientoArr.length]);

  const exportarSeguimientoCsv = React.useCallback(() => {
    const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const rows = [[
      'Grupo', 'Filtro', 'Nombre', 'Cedula', 'Telefono', 'Estado', 'Mora', 'Nota', 'Certificado', 'Registro certificado'
    ]];
    seguimientoArr.forEach(e => {
      const certNum = certRegistroEstudiante(e);
      const certPago = certPagoEstudiante(e);
      const cert = certVisualState({ estatus:e.estatus, certPago, certNum });
      rows.push([
        grupoCodigo || '', motivo, e.display || e.nombre || '', e.cedula || e.identificacion || e.id || '',
        estudiantePhone(e) || '', e.estatus || e.status_actual || '', e.mora || e.moroso || '', e.nota || '',
        cert.label || '', certNum || ''
      ]);
    });
    const csv = '\ufeff' + rows.map(r => r.map(esc).join(',')).join('\n');
    try {
      const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      const safeGrupo = String(grupoCodigo || 'grupo').replace(/[^A-Za-z0-9_-]+/g, '_');
      const safeFiltro = String(filtro || 'todos').replace(/[^A-Za-z0-9_-]+/g, '_');
      a.href = URL.createObjectURL(blob);
      a.download = `seguimiento_${safeGrupo}_${safeFiltro}.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
      setCsvOk(true);
      setTimeout(() => setCsvOk(false), 1300);
    } catch (_) {}
  }, [seguimientoArr, grupoCodigo, filtro, motivo]);

  const abrirReporteOperativo = React.useCallback(() => {
    const html = buildReporteOperativoHtml({ grupoCodigo, estado, resumen, filtro, motivo, estudiantes: seguimientoArr });
    const w = window.open('', '_blank', 'width=1080,height=780');
    if (w && w.document) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      try { w.focus(); } catch (_) {}
      return;
    }
    try {
      const blob = new Blob([html], { type:'text/html;charset=utf-8' });
      const a = document.createElement('a');
      const safeGrupo = String(grupoCodigo || 'grupo').replace(/[^A-Za-z0-9_-]+/g, '_');
      a.href = URL.createObjectURL(blob);
      a.download = `reporte_operativo_${safeGrupo}.html`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    } catch (_) {}
  }, [grupoCodigo, estado, resumen, filtro, motivo, seguimientoArr]);

  const copiarReporteOperativo = React.useCallback(() => {
    const txt = buildReporteOperativoTexto({ grupoCodigo, estado, resumen, filtro, motivo, estudiantes: seguimientoArr });
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt);
      setReporteCopiado(true);
      setTimeout(() => setReporteCopiado(false), 1300);
    } catch (_) {}
  }, [grupoCodigo, estado, resumen, filtro, motivo, seguimientoArr]);
  const estadoColor = estadoTone === 'ok' ? '#2E7D32' : estadoTone === 'bad' ? '#C62828' : '#9A6200';
  return (
    <div style={{
      margin:'0 0 16px', padding: embebidoCalGrupo ? '14px 16px' : '16px 18px',
      border:'1px solid var(--line,#e6e0d8)', borderRadius:14,
      background:'linear-gradient(135deg, white, color-mix(in srgb, var(--an-gold,#E5A823) 4%, white))',
      boxShadow:'0 10px 24px rgba(20,33,61,0.05)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14, flexWrap:'wrap', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:900, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--ink-3,#999)', marginBottom:4 }}>
            Panel operativo del grupo
          </div>
          <div style={{ fontFamily:'var(--f-serif,serif)', fontSize:22, lineHeight:1.05, color:'var(--an-navy,#14213D)', fontWeight:600 }}>
            Diagnóstico rápido de estudiantes
          </div>
          <div style={{ fontSize:12, color:'var(--ink-2,#666)', marginTop:5, lineHeight:1.45 }}>
            Filtros visuales sobre la radiografía actual. No cambia datos, CONAPE ni certificados.
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
          <StatMini label="Estado" value={estado} warn={estado !== 'Estable'} />
          <StatMini label="Total" value={resumen.total} />
          <StatMini label="Riesgo" value={resumen.riesgo} warn={resumen.riesgo > 0} />
        </div>
      </div>
      <PanelPrioridadOperativa resumen={resumen} setFiltro={setFiltro} />
      <div style={{ display:'flex', gap:7, flexWrap:'wrap', alignItems:'center' }}>
        {filtros.map(([k,l,c,t]) => (
          <FiltroOperativoBtn key={k} active={filtro === k} label={l} count={c} tone={t} onClick={() => setFiltro(k)} />
        ))}
      </div>
      <div style={{
        marginTop:12, padding:'10px 12px', borderRadius:12,
        border:'1px solid color-mix(in srgb, #25D366 25%, transparent)',
        background:'color-mix(in srgb, #25D366 6%, white)',
        display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap', alignItems:'center',
      }}>
        <div>
          <div style={{ fontSize:10, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color:'#128C4A' }}>
            Seguimiento rápido
          </div>
          <div style={{ fontSize:12, color:'var(--ink-2,#666)', marginTop:3 }}>
            {filtro === 'todos'
              ? 'Elegí un filtro para preparar una lista de seguimiento más precisa.'
              : `${seguimientoArr.length} estudiante(s) para ${motivo}. Cada botón WA usa un mensaje según este filtro.`}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:7, alignItems:'flex-end' }}>
          <div style={{ fontSize:9.5, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3,#888)' }}>Herramientas de salida</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
          <button type="button" onClick={copiarResumenOperativo} style={{
            border:'1px solid rgba(20,33,61,.18)', background:'white', color:'var(--an-navy,#14213D)',
            borderRadius:9, padding:'7px 10px', fontSize:11, fontWeight:900, cursor:'pointer',
          }}>
            {copiadoResumen ? 'Resumen copiado ✓' : 'Copiar resumen'}
          </button>
          <button type="button" disabled={!seguimientoArr.length} onClick={copiarSeguimiento} style={{
            border:'1px solid rgba(37,211,102,.35)', background: seguimientoArr.length ? 'white' : 'rgba(255,255,255,.45)',
            color: seguimientoArr.length ? '#128C4A' : 'var(--ink-3,#999)', borderRadius:9,
            padding:'7px 10px', fontSize:11, fontWeight:900, cursor: seguimientoArr.length ? 'pointer' : 'not-allowed',
          }}>
            {copiadoSeguimiento ? 'Lista copiada ✓' : 'Copiar lista'}
          </button>
          <button type="button" disabled={!seguimientoArr.length} onClick={exportarSeguimientoCsv} style={{
            border:'1px solid rgba(43,127,193,.25)', background: seguimientoArr.length ? 'white' : 'rgba(255,255,255,.45)',
            color: seguimientoArr.length ? '#1565C0' : 'var(--ink-3,#999)', borderRadius:9,
            padding:'7px 10px', fontSize:11, fontWeight:900, cursor: seguimientoArr.length ? 'pointer' : 'not-allowed',
          }}>
            {csvOk ? 'CSV listo ✓' : 'Exportar CSV'}
          </button>
          <button type="button" disabled={!seguimientoArr.length} onClick={copiarReporteOperativo} style={{
            border:'1px solid rgba(229,168,35,.35)', background: seguimientoArr.length ? 'white' : 'rgba(255,255,255,.45)',
            color: seguimientoArr.length ? '#9A6200' : 'var(--ink-3,#999)', borderRadius:9,
            padding:'7px 10px', fontSize:11, fontWeight:900, cursor: seguimientoArr.length ? 'pointer' : 'not-allowed',
          }}>
            {reporteCopiado ? 'Reporte copiado ✓' : 'Copiar reporte'}
          </button>
          <button type="button" disabled={!seguimientoArr.length} onClick={abrirReporteOperativo} style={{
            border:'1px solid rgba(20,33,61,.25)', background: seguimientoArr.length ? 'var(--an-navy,#14213D)' : 'rgba(20,33,61,.12)',
            color:'white', borderRadius:9, padding:'7px 10px', fontSize:11, fontWeight:900,
            cursor: seguimientoArr.length ? 'pointer' : 'not-allowed',
          }}>
            Reporte / imprimir
          </button>
          </div>
        </div>
      </div>
      {filtro !== 'todos' && (
        <div style={{ marginTop:10, fontSize:11.5, color:'var(--ink-3,#777)', display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
          <span>Filtro activo: <strong style={{ color:estadoColor }}>{filtros.find(f => f[0] === filtro)?.[1] || filtro}</strong></span>
          <button type="button" onClick={() => setFiltro('todos')} style={{ border:'none', background:'transparent', color:'var(--an-navy,#14213D)', fontWeight:900, cursor:'pointer', fontSize:11.5 }}>
            Limpiar filtro
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SUBTÍTULO POR NIVEL (según mezcla de estados)
// ─────────────────────────────────────────────────────────────────────────
function calcularSubtitulo(estudiantes) {
  // Usar nivel_estado del Apps Script si está disponible
  const estadoReal = estudiantes[0]?.nivel_estado;
  if (estadoReal === 'En curso')    return 'En curso';
  if (estadoReal === 'Cerrado')     return 'Cerrado';
  if (estadoReal === 'Proyectado')  return 'Proyectado — próximo nivel';
  // Fallback si no viene del backend
  const estados = estudiantes.map(e => e.estatus);
  if (!estados.length) return '';
  if (estados.every(e => e === 'PE')) return 'Proyectado — próximo nivel';
  if (estados.some(e => e === 'CA'))  return 'En curso';
  if (estados.every(e => e === 'APR')) return 'Cerrado';
  return 'Cerrado';
}

// ─────────────────────────────────────────────────────────────────────────
// HEADER DE NIVEL — chips de exámenes y contador de lecciones
// ─────────────────────────────────────────────────────────────────────────
const EXAMEN_LABEL = {
  ORAL_1: 'O1', ORAL_2: 'O2', ORAL_3: 'O3', ORAL_4: 'O4',
  ESCRITO_1: 'E1', ESCRITO_2: 'E2',
};

function ExamenChip({ examen }) {
  const tipo = examen.tipo;
  const hecho = !!examen.hecho;

  // Estilos base — el chip vive sobre el fondo de color del nivel.
  // Hecho      → pill blanco sólido, texto negro #111, ✓ verde antes del label.
  // Pendiente  → transparente total, texto blanco 50%, borde blanco 30%.
  // Buscamos un contraste claramente perceptible entre los dos estados.
  const baseFilled = {
    background: '#FFFFFF',
    color: '#111111',
    border: '1px solid #FFFFFF',
  };
  const baseEmpty = {
    background: 'transparent',
    color: 'rgba(255,255,255,0.40)',
    border: '1px solid rgba(255,255,255,0.25)',
  };
  const sharedChip = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    padding: '1px 7px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.04em',
    fontFamily: 'var(--f-mono, monospace)',
    lineHeight: '14px',
    whiteSpace: 'nowrap',
  };
  const checkMark = (
    <span style={{ fontSize: 10, lineHeight: 1, color: '#22C55E', fontWeight: 900 }}>✓</span>
  );

  // Variantes especiales INA — mismo criterio binario: dadas > 0 cuenta como hecho.
  if (tipo === 'ICAN' || tipo === 'PROGRESS') {
    const label = tipo === 'ICAN' ? 'I CAN' : 'PC';
    const dadas = examen.dadas ?? 0;
    const total = examen.total ?? 0;
    const esHecho = hecho || dadas > 0;
    const style = esHecho ? baseFilled : baseEmpty;
    return (
      <span style={{ ...sharedChip, ...style }} title={`${label} ${dadas}/${total}`}>
        {esHecho && checkMark}
        {label} {dadas}/{total}
      </span>
    );
  }

  const label = EXAMEN_LABEL[tipo] || tipo;
  const style = hecho ? baseFilled : baseEmpty;
  return (
    <span style={{ ...sharedChip, ...style }} title={hecho ? `${label} hecho` : `${label} pendiente`}>
      {hecho && checkMark}
      {label}
    </span>
  );
}

function LeccionesChip({ dadas, total }) {
  if (!total) return null;
  const sinAvance = dadas === 0;
  const completo  = dadas >= total;

  // Tres estados claros: pendiente, en curso, completo.
  let chipStyle;
  let icono;
  if (sinAvance) {
    chipStyle = {
      background: 'transparent',
      color: 'rgba(255,255,255,0.50)',
      border: '1px solid rgba(255,255,255,0.30)',
    };
    icono = <span style={{ fontSize: 10, lineHeight: 1 }}>📋</span>;
  } else if (completo) {
    chipStyle = {
      background: '#FFFFFF',
      color: '#111111',
      border: '1px solid #FFFFFF',
    };
    icono = <span style={{ fontSize: 10, lineHeight: 1, color: '#22C55E', fontWeight: 900 }}>✓</span>;
  } else {
    chipStyle = {
      background: 'rgba(255,255,255,0.90)',
      color: '#333333',
      border: '1px solid rgba(255,255,255,0.90)',
    };
    icono = <span style={{ fontSize: 10, lineHeight: 1 }}>📋</span>;
  }

  return (
    <span
      title={`Lecciones dadas: ${dadas} de ${total}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '1px 8px', borderRadius: 4,
        fontSize: 11, fontWeight: 700,
        fontFamily: 'var(--f-mono, monospace)',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        lineHeight: '14px',
        ...chipStyle,
      }}
    >
      {icono}
      {dadas}/{total} lecciones
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TABLA DE NIVEL
// ─────────────────────────────────────────────────────────────────────────
function rowBg(estatus, idx) {
  if (estatus === 'APR' || estatus === 'CNV') return '#DDF3E2';
  if (estatus === 'CA')  return idx%2===0 ? '#EDF6FF' : '#E5F1FC';
  if (estatus === 'RI' || estatus === 'RJ' || estatus === 'RE') return '#E9EDF0';
  if (estatus === 'REP') return '#FFE1E4';
  if (estatus === 'PE') return '#F3F0EA';
  return idx%2===0 ? 'white' : '#F8F6F2';
}
function rowAccent(estatus) {
  if (estatus === 'APR' || estatus === 'CNV') return '#2E8B43';
  if (estatus === 'CA') return '#2F78B7';
  if (estatus === 'RI' || estatus === 'RJ' || estatus === 'RE') return '#607D8B';
  if (estatus === 'REP') return '#C62828';
  if (estatus === 'PE') return '#9A8F82';
  return 'transparent';
}

function TablaEstudiantes({ estudiantes, nivelKey, periodo, programa, sortCol, sortDir, toggleSort, sortEstudiantes, onRefresh, onNavigate, onAbrirPanel, generarCertificadoFila, generarCertificadosNivel, regenerarCertificadosNivel, filtroOperativo, ultimosDesembolsosConape }) {
  const cfg = NIVEL_CONFIG[nivelKey];
  const [modalEstatus, setModalEstatus] = React.useState(null);
  const [modalCambio, setModalCambio] = React.useState(null);
  const [resyncEst, setResyncEst] = React.useState(null);
  const [pdfTrasladoBusy, setPdfTrasladoBusy] = React.useState('');
  const [proyeccionBusy, setProyeccionBusy] = React.useState('');

  async function proyectarSiguienteNivel(estudiante, nivelActual) {
    const nivelSiguiente = NIVEL_SIGUIENTE_PROYECCION[nivelActual];
    const codigo = String(estudiante?.codigo || estudiante?.rec_m || '').trim();
    const nombre = estudiante?.display || estudiante?.nombre || codigo;
    const grupo = String(estudiante?.grupo || estudiante?.GRUPO || '').trim();
    if (!codigo || !nivelSiguiente) return;
    const confirmar = window.confirm(
      `¿Proyectar a ${nombre} al nivel ${nivelSiguiente}?\n\n` +
      `Se creará únicamente ${nivelSiguiente} con estado PE (Proyectado). ` +
      'No se aprobará el nivel actual ni se aplicarán pagos.'
    );
    if (!confirmar) return;

    setProyeccionBusy(codigo + '|' + nivelActual);
    try {
      const ficha = await postAdminStudents('getEstudiante', { codigo });
      if (!ficha?.ok) throw new Error(ficha?.error || 'No se pudo verificar el expediente.');

      const nivelExistente = ficha?.niveles?.[nivelSiguiente] || null;
      const estadoExistente = String(nivelExistente?.estatus || nivelExistente?.status || '').trim().toUpperCase();
      if (estadoExistente === 'PE') {
        alert(`${nombre} ya está proyectado en ${nivelSiguiente}.`);
        if (onRefresh) onRefresh();
        return;
      }
      if (estadoExistente) {
        throw new Error(`${nivelSiguiente} ya existe con estado ${estadoExistente}; no se modificó.`);
      }

      const resp = await postAdminStudents('actualizarEstatus', {
        cod_estudiante: codigo,
        nivel: nivelSiguiente,
        estatus: 'PE',
        nota: 0,
        grupo,
      });
      if (!resp?.ok) throw new Error(resp?.error || 'No se pudo crear la proyección.');
      alert(`${nombre} quedó proyectado en ${nivelSiguiente}.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(adminStudentsSafeUserError(err?.message || String(err), 'No se pudo crear la proyección. Intentá de nuevo.', 'crear_proyeccion'));
    } finally {
      setProyeccionBusy('');
    }
  }

  if (!estudiantes.length) return null;
  const subtitulo = calcularSubtitulo(estudiantes);

  // Datos de calendario (período / lecciones / exámenes) — vienen del backend en data.grupo.periodos[niv]
  const periodoTexto    = periodo?.texto || '';
  const periodoEstado   = periodo?.estado || subtitulo || '';
  const lecDadas        = Number(periodo?.lecciones_dadas ?? 0);
  const lecTotal        = Number(periodo?.lecciones_total ?? 0);
  const examenes        = Array.isArray(periodo?.examenes) ? periodo.examenes : [];
  // Niveles proyectados no deben mostrar lecciones ni exámenes — aún no inició el calendario.
  const esProyectado    = periodoEstado === 'Proyectado';
  const mostrarLec      = !esProyectado && lecTotal > 0;
  const mostrarExamenes = !esProyectado && examenes.length > 0;
  const aprobados = estudiantes.filter(e => e.estatus === 'APR' || e.estatus === 'CNV').length;
  const certRegistrados = estudiantes.filter(e => !!certRegistroEstudiante(e)).length;
  const certPendientes = estudiantes.filter(e => {
    const st = String(e.estatus || e.status_actual || '').toUpperCase();
    return st === 'APR' && certPagoEstudiante(e) && !certRegistroEstudiante(e);
  }).length;
  const todosAprobados = estudiantes.every(e => e.estatus === 'APR');
  const [abierto, setAbierto] = React.useState(!todosAprobados);
  const estudiantesOrdenados = sortEstudiantes ? sortEstudiantes(estudiantes) : estudiantes;
  const sortArrow = (col) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';
  const SORTABLE = { codigo:'codigo', nombre:'nombre', estatus:'estatus', mora:'mora', nota:'nota' };
  return (
    <div style={{ marginBottom: 16 }}>
      {/* Header del nivel — clickeable */}
      <div
        onClick={() => setAbierto(!abierto)}
        style={{
          background: cfg.color, color: 'white',
          padding: '10px 16px', borderRadius: abierto ? '8px 8px 0 0' : 8,
          display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        {/* Fila principal — info base del nivel */}
        <span style={{ fontWeight: 800, fontSize: 14, letterSpacing:'0.02em', textTransform:'uppercase' }}>{cfg.nombre}</span>
        <span style={{ fontSize: 12, opacity: 0.9 }}>
          {estudiantes.length} estudiante{estudiantes.length === 1 ? '' : 's'}
        </span>
        {aprobados > 0 && (
          <span style={{ fontSize:11, fontWeight:700, background:'rgba(255,255,255,0.2)', padding:'2px 8px', borderRadius:4, letterSpacing:'0.02em' }}>
            ✓ {aprobados} aprobados
          </span>
        )}
        {certRegistrados > 0 && (
          <span style={{ fontSize:10.5, fontWeight:800, background:'rgba(255,255,255,0.16)', padding:'2px 8px', borderRadius:999, whiteSpace:'nowrap' }}>
            🏅 {certRegistrados} registrados
          </span>
        )}
        {certPendientes > 0 && (
          <button
            onClick={(ev) => { ev.stopPropagation(); if (generarCertificadosNivel) generarCertificadosNivel(nivelKey); }}
            title={generarCertificadosNivel
              ? 'Genera solo certificados pendientes: estudiantes aprobados, certificado pagado y sin certificado registrado. Omite los ya registrados.'
              : 'Generación masiva segura: primero muestra vista previa y solo ejecuta con confirmación. Los certificados existentes no crean un número nuevo.'}
            style={{
              marginLeft:4, padding:'4px 9px', borderRadius:7,
              border:'1px solid rgba(255,255,255,0.55)', background:'rgba(255,255,255,0.18)',
              color:'white', fontSize:10.5, fontWeight:900, cursor: generarCertificadosNivel ? 'pointer' : 'help', letterSpacing:'0.04em',
              textTransform:'uppercase', whiteSpace:'nowrap', opacity: generarCertificadosNivel ? 1 : 0.82,
            }}>
            🏅 Cert. pendientes ({certPendientes})
          </button>
        )}
        {certRegistrados > 0 && regenerarCertificadosNivel && (
          <button
            onClick={(ev) => { ev.stopPropagation(); regenerarCertificadosNivel(nivelKey); }}
            title="Vuelve a crear los PDF seleccionados usando el mismo número de certificado. No genera números nuevos ni cambia el estado académico."
            style={{
              marginLeft:4, padding:'4px 9px', borderRadius:7,
              border:'1px solid rgba(255,255,255,0.72)', background:'rgba(0,0,0,0.16)',
              color:'white', fontSize:10.5, fontWeight:900, cursor:'pointer', letterSpacing:'0.04em',
              textTransform:'uppercase', whiteSpace:'nowrap',
            }}>
            ♻ Rehacer registrados ({certRegistrados})
          </button>
        )}


        {/* Cluster derecho — período, estado, lecciones, exámenes. Wrap a 2da línea
            si no caben; cada item se mantiene compacto (~22px de alto cada fila). */}
        <div style={{
          marginLeft: 'auto',
          display: 'flex', alignItems: 'center', flexWrap: 'wrap',
          gap: '6px 10px',
          justifyContent: 'flex-end',
          // El chevron va aparte; este cluster cubre todo lo demás.
          minWidth: 0,
          // color del nivel disponible para los chips "hecho" (que heredan currentColor cuando se rellenan)
          color: cfg.color,
        }}>
          {periodoTexto && (
            <span style={{
              fontSize:11, fontWeight:700, color:'white',
              background:'rgba(255,255,255,0.18)',
              padding:'2px 10px', borderRadius:999,
              letterSpacing:'0.02em', whiteSpace:'nowrap',
              fontFamily:'var(--f-mono, monospace)',
            }}>
              {periodoTexto}
            </span>
          )}
          {periodoEstado && (
            <span style={{
              fontSize:10, fontWeight:800, color:'white',
              background:'rgba(0,0,0,0.18)',
              padding:'2px 8px', borderRadius:4,
              letterSpacing:'0.06em', textTransform:'uppercase', whiteSpace:'nowrap',
            }}>
              {periodoEstado}
            </span>
          )}
          {mostrarLec && (
            <LeccionesChip dadas={lecDadas} total={lecTotal} />
          )}
          {mostrarExamenes && (
            <span style={{
              display:'inline-flex', alignItems:'center', flexWrap:'wrap',
              gap:4,
            }}>
              {examenes.map((ex, i) => (
                <ExamenChip key={(ex.tipo || 'ex') + '-' + i} examen={ex} />
              ))}
            </span>
          )}
        </div>

        <span style={{ fontSize:11, marginLeft: 4, opacity:0.85, flexShrink:0 }}>{abierto ? '▲' : '▼'}</span>
      </div>
      {/* Tabla — rediseño operativo compacto para Calendario de Grupo */}
      {abierto && (
      <div style={{ overflowX: 'auto', border: `1px solid ${cfg.color}`, borderTop: 'none', borderRadius: '0 0 8px 8px', background:'var(--surface,#fff)' }}>
        <table style={{ width: '100%', minWidth: 1220, borderCollapse: 'separate', borderSpacing: 0, fontSize: 12 }}>
          <thead>
            <tr style={{ background: cfg.bg }}>
              {[
                { label:'Código',      sort:'codigo', width:92 },
                { label:'Estudiante',  sort:'nombre', width:310 },
                { label:'Convenio',    sort:null,     width:90 },
                { label:'Estado',      sort:'estatus',width:130 },
                { label:'Finanzas',    sort:'mora',   width:230 },
                { label:'Certificado', sort:null,     width:160 },
                { label:'Nota',        sort:'nota',   width:82 },
                { label:'Acciones',    sort:null,     width:310 },
              ].map(h => (
                <th
                  key={h.label}
                  onClick={h.sort && toggleSort ? () => toggleSort(h.sort) : undefined}
                  style={{
                    width:h.width, padding:'9px 10px', textAlign:'left', fontWeight:900, color:cfg.color,
                    whiteSpace:'nowrap', fontSize:10, letterSpacing:'0.10em', textTransform:'uppercase',
                    cursor: h.sort && toggleSort ? 'pointer' : 'default', userSelect: h.sort ? 'none' : 'auto',
                    borderBottom:'1px solid color-mix(in srgb, var(--line,#ddd) 80%, transparent)',
                  }}
                >
                  {h.label}{h.sort ? sortArrow(h.sort) : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {estudiantesOrdenados.map((e, i) => {
              const codigo    = e.codigo || e.rec_m || '—';
              const cedula    = e.cedula || '—';
              const nombre    = e.display || e.nombre || '—';
              const edad      = edadEstudiante(e);
              const convenio  = e.convenio || '';
              const ultimoDesembolsoConape = [codigo, e.codigo, e.rec_m, cedula, e.cedula, e.identificacion]
                .map(claveConape).filter(Boolean).map(key => ultimosDesembolsosConape?.[key]).filter(Boolean)
                .sort((a, b) => b.fechaSort - a.fechaSort || Number(b.numero || 0) - Number(a.numero || 0))[0] || null;
              const estatus   = e.estatus || e.status_actual || 'PE';
              const nivelSiguiente = NIVEL_SIGUIENTE_PROYECCION[nivelKey] || '';
              const proyeccionEnCurso = proyeccionBusy === codigo + '|' + nivelKey;
              const mora = typeof e.mora !== 'undefined' ? !!e.mora : (e.morosidad === 'SI' || e.morosidad === true);
              const matricula    = e.matricula_pagada ?? e.matricula ?? e.mat ?? false;
              const cuotasPagadas = typeof e.cuotas_pagadas === 'number' ? e.cuotas_pagadas : null;
              const cuotasEsperadas = e.cuotas_esperadas || 4;
              const periodoTexto    = e.periodo_texto || '';
              const certPago  = certPagoEstudiante(e);
              const certNum   = certRegistroEstudiante(e);
              const nota      = Number(e.nota || 0);
              const cuotasLabel = cuotasPagadas == null ? '—' : `${cuotasPagadas}/${cuotasEsperadas}`;
              const esTraslado = !!e.es_traslado;
              if (esTraslado) {
                const abrirConsultaIndividual = () => {
                  try { sessionStorage.setItem('an_consulta_prefill', JSON.stringify({ codigo, nombre })); } catch (_) {}
                  if (onNavigate) onNavigate('buscador');
                };
                const abrirGrupoActual = () => {
                  if (onNavigate && e.grupo_actual) onNavigate('calendario_grupo', { grupo:e.grupo_actual });
                };
                const abrirPdfTraslado = async () => {
                  const id = e.cambio_id || `${codigo}-${nivelKey}`;
                  setPdfTrasladoBusy(id);
                  try {
                    const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000);
                    if (!r?.ok) throw new Error(r?.error || 'No se pudo generar la constancia.');
                    if (!abrirPdfPrivadoAdmin(r)) alert('No se pudo abrir la constancia. Reintentá desde el historial.');
                    onRefresh?.();
                  } catch (err) { alert(adminStudentsSafeUserError(err?.message || String(err), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion')); }
                  finally { setPdfTrasladoBusy(''); }
                };
                return (
                  <tr key={codigo + '-traslado-' + nivelKey + '-' + i} style={{ background:'#EEF2F6', borderBottom:'1px solid #CDD6DF', borderLeft:'4px solid #607D8B' }}>
                    <td style={{ padding:'6px 8px',fontWeight:900,fontFamily:'var(--f-mono,monospace)',verticalAlign:'middle' }}>{codigo}</td>
                    <td style={{ padding:'6px 8px',verticalAlign:'middle' }}>
                      <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}><span style={{fontWeight:900,color:'var(--ink,#222)',lineHeight:1.1}}>{nombre}</span><span style={{display:'inline-flex',padding:'2px 7px',borderRadius:999,background:'#FFF4E5',border:'1px solid #F2C57C',color:'#9A5B00',fontSize:8.5,fontWeight:900,letterSpacing:'.04em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{e.cintillo_registro || `Traslado al grupo ${e.grupo_actual}`}</span></div>
                      <div style={{marginTop:2,fontSize:9.5,color:'var(--ink-3,#888)'}}>{cedula}{e.motivo_traslado?` · ${e.motivo_traslado}`:''}</div>
                    </td>
                    <td style={{padding:'5px 7px',verticalAlign:'middle'}}>{convenio?<span style={{padding:'3px 9px',borderRadius:999,background:'#EEF4FF',color:'#244A7C',fontSize:10,fontWeight:900}}>{convenio}</span>:'—'}</td>
                    <td style={{padding:'5px 7px',verticalAlign:'middle'}}><span style={{display:'inline-flex',padding:'4px 9px',borderRadius:999,background:'#FFF4E5',color:'#9A5B00',fontSize:10,fontWeight:900}}>TRASLADO</span></td>
                    <td style={{padding:'5px 7px',verticalAlign:'middle',color:'var(--ink-3,#667)',fontSize:10.5,lineHeight:1.3}}>La información financiera y la mora se consultan en el grupo actual.</td>
                    <td style={{padding:'5px 7px',verticalAlign:'middle',color:'var(--ink-3,#999)'}}>—</td>
                    <td style={{padding:'5px 7px',verticalAlign:'middle',color:'var(--ink-3,#999)'}}>—</td>
                    <td style={{padding:'5px 7px',verticalAlign:'middle'}}>
                      <div style={{display:'flex',gap:4,flexWrap:'nowrap'}}>
                        <button type="button" onClick={abrirConsultaIndividual} style={{padding:'4px 6px',borderRadius:7,border:'1px solid var(--line,#ddd)',background:'white',fontSize:10.5,fontWeight:800,cursor:'pointer'}}>⌕ Consulta individual</button>
                        <button type="button" onClick={abrirGrupoActual} disabled={!e.grupo_actual} style={{padding:'4px 6px',borderRadius:7,border:'1px solid #C9D9F1',background:'#EEF4FF',color:'#244A7C',fontSize:10.5,fontWeight:800,cursor:e.grupo_actual?'pointer':'not-allowed'}}>🗓 Grupo actual</button>
                        <button type="button" onClick={abrirPdfTraslado} disabled={pdfTrasladoBusy===(e.cambio_id||`${codigo}-${nivelKey}`)} style={{padding:'4px 7px',borderRadius:7,border:'1px solid #A7D4B0',background:'#EEF8EF',color:'#246B2A',fontSize:10.5,fontWeight:900,cursor:'pointer',whiteSpace:'nowrap'}}>{pdfTrasladoBusy===(e.cambio_id||`${codigo}-${nivelKey}`)?'Generando…':e.pdf_traslado_url?'📄 Abrir traslado':'📄 PDF traslado'}</button>
                      </div>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={codigo + '-' + i} style={{ background:rowBg(estatus,i), borderBottom:'1px solid #D8DDE2', borderLeft:`4px solid ${rowAccent(estatus)}` }}>
                  <td style={{padding:'5px 7px',fontWeight:900,fontFamily:'var(--f-mono,monospace)',color:'var(--ink,#222)',verticalAlign:'middle'}}>{codigo}</td>
                  <td style={{padding:'5px 7px',verticalAlign:'middle'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:7,alignItems:'center'}}>
                      <div style={{ minWidth:0 }}>
                        <div style={{fontWeight:900,color:'var(--ink,#222)',lineHeight:1.15,fontSize:11.5}}>{nombre}</div>
                        {e.cintillo_registro && <div style={{display:'inline-flex',marginTop:5,padding:'3px 7px',borderRadius:999,background:'#EEF4FF',border:'1px solid #C9D9F1',color:'#244A7C',fontSize:9,fontWeight:900,letterSpacing:'.04em',textTransform:'uppercase'}}>{e.cintillo_registro}</div>}
                        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', marginTop:2 }}>
                          <span style={{color:'var(--ink-3,#777)',fontFamily:'var(--f-mono,monospace)',fontSize:9.5}}>{cedula}</span>
                          {edad !== null && <PillMini label="Edad" value={`${edad}`} tone="muted" />}
                        </div>
                      </div>
                      <WhatsAppMini est={e} filtro={filtroOperativo} />
                    </div>
                  </td>
                  <td style={{padding:'5px 7px',verticalAlign:'middle'}}>
                    {convenio ? (
                      <div>
                        <span style={{
                          background: convenio==='CONAPE' ? '#E3F2FD' : convenio.toString().toUpperCase().includes('BECA') ? '#E8F5E9' : 'var(--surface, #F5F5F5)',
                          color: convenio==='CONAPE' ? '#1565C0' : convenio.toString().toUpperCase().includes('BECA') ? '#2E7D32' : 'var(--ink-3, #888)',
                          padding:'3px 9px', borderRadius:999, fontSize:10, fontWeight:900, letterSpacing:'0.04em', whiteSpace:'nowrap',
                        }}>
                          {String(convenio).toUpperCase().includes('BECA') ? 'BECA' : convenio}
                        </span>
                        {conapeEstudiante(e) && ultimoDesembolsoConape && (
                          <div title="Fecha del desembolso más reciente detectado en Seguimiento inmediato" style={{ marginTop:5, color:'#244A7C', fontSize:9.5, fontWeight:800, lineHeight:1.25, whiteSpace:'nowrap' }}>
                            Últ. desembolso: {formatoFechaDesembolsoConape(ultimoDesembolsoConape)}
                          </div>
                        )}
                      </div>
                    ) : <span style={{ color:'var(--ink-3, #999)', fontSize:11 }}>Regular</span>}
                  </td>
                  <td style={{padding:'5px 7px',verticalAlign:'middle'}}>
                    <div style={{display:'inline-flex',alignItems:'center',gap:6}}>
                      <EstadoBadge estado={estatus} />
                      {String(estatus).toUpperCase() === 'CA' && nivelSiguiente && (
                        <button
                          type="button"
                          onClick={() => proyectarSiguienteNivel(e, nivelKey)}
                          disabled={proyeccionEnCurso}
                          title={`Proyectar manualmente a ${nivelSiguiente}`}
                          aria-label={`Proyectar a ${nombre} al nivel ${nivelSiguiente}`}
                          style={{
                            width:24,height:24,borderRadius:999,
                            border:'1px solid #9DBCE2',
                            background:proyeccionEnCurso?'#E7ECF3':'#FFFFFF',
                            color:'#174E8C',fontSize:17,fontWeight:900,lineHeight:1,
                            display:'inline-flex',alignItems:'center',justifyContent:'center',
                            cursor:proyeccionEnCurso?'wait':'pointer',
                            boxShadow:'0 2px 7px rgba(23,78,140,.14)',
                            flexShrink:0,
                          }}
                        >{proyeccionEnCurso ? '…' : '+'}</button>
                      )}
                    </div>
                    {periodoTexto && (
                      <div style={{ fontSize:9.5, color:'var(--ink-3, #999)', marginTop:4, fontWeight:600, letterSpacing:'0.01em', whiteSpace:'nowrap' }}>
                        {periodoTexto}
                      </div>
                    )}
                  </td>
                  <td style={{padding:'5px 7px',verticalAlign:'middle'}}>
                    <div style={{ display:'flex', gap:4, flexWrap:'nowrap', alignItems:'center', whiteSpace:'nowrap' }}>
                      {estatus === 'PE'
                        ? <PillMini label="Mora" value="—" tone="muted" />
                        : <PillMini label="Mora" value={mora ? 'SI' : 'NO'} tone={mora ? 'bad' : 'ok'} />}
                      <PillMini label="Matr." value={matricula ? '✓' : '—'} tone={matricula ? 'ok' : 'muted'} />
                      <PillMini label="Cuotas" value={cuotasLabel} tone={cuotasPagadas >= cuotasEsperadas ? 'ok' : cuotasPagadas > 0 ? 'warn' : 'muted'} />
                    </div>
                  </td>
                  <td style={{padding:'5px 7px',verticalAlign:'middle'}}>
                    <CertificadoCell
                      certPago={certPago}
                      certNum={certNum}
                      estatus={estatus}
                      onCrear={() => generarCertificadoFila && generarCertificadoFila(e, nivelKey)}
                      onVer={() => onAbrirPanel && onAbrirPanel(e, 'documentos')}
                    />
                  </td>
                  <td style={{padding:'5px 7px',verticalAlign:'middle'}}>
                    <span style={{
                      display:'inline-flex', minWidth:46, justifyContent:'center', padding:'4px 8px', borderRadius:999,
                      background: nota>=70 ? '#E8F5E9' : nota>0 ? '#FFEBEE' : 'var(--surface-2,#f8f8f8)',
                      color: nota>=70 ? '#2E7D32' : nota>0 ? '#C62828' : 'var(--ink-3,#999)',
                      fontWeight:900, fontFamily:'var(--f-mono,monospace)', fontSize:11,
                    }}>
                      {nota > 0 ? `${nota}%` : '—'}
                    </span>
                  </td>
                  <td style={{padding:'6px 7px',whiteSpace:'nowrap',verticalAlign:'middle'}}>
                    <div style={{display:'flex',gap:4,flexWrap:'nowrap',alignItems:'center'}}>
                      <button onClick={() => onAbrirPanel && onAbrirPanel(e, 'pagos')} title="Ficha" aria-label="Ficha" style={{width:29,height:29,borderRadius:7,border:'1px solid #C9D2DC',fontSize:13,cursor:'pointer',background:'white'}}>👤</button>
                      <button
                        onClick={() => ['CA','REP'].includes(String(estatus || '').toUpperCase()) && setModalCambio({ estudiante:e, nivel:nivelKey })}
                        disabled={!['CA','REP'].includes(String(estatus || '').toUpperCase())}
                        title={['CA','REP'].includes(String(estatus || '').toUpperCase()) ? 'Evaluar cambio académico individual' : 'Disponible únicamente para un nivel CA o REP'}
                        aria-label="Evaluar cambio académico individual"
                        style={{height:29,padding:'0 8px',borderRadius:7,border:'1px solid '+(['CA','REP'].includes(String(estatus || '').toUpperCase())?'#9DBCE2':'#D5D9DE'),fontSize:10.5,fontWeight:900,cursor:['CA','REP'].includes(String(estatus || '').toUpperCase())?'pointer':'not-allowed',background:['CA','REP'].includes(String(estatus || '').toUpperCase())?'#EAF3FF':'#F1F2F3',color:['CA','REP'].includes(String(estatus || '').toUpperCase())?'#174E8C':'#9AA1A8',opacity:['CA','REP'].includes(String(estatus || '').toUpperCase())?1:.65,whiteSpace:'nowrap'}}>🧭 Evaluar</button>
                      <button onClick={() => setModalEstatus({ estudiante:e, nivel:nivelKey })} title="Cambiar estado" aria-label="Cambiar estado" style={{width:29,height:29,borderRadius:7,border:'1px solid #C9D2DC',fontSize:13,cursor:'pointer',background:'white'}}>✏️</button>
                      <button onClick={async()=>{if(resyncEst?.loading)return;setResyncEst({codigo,loading:true});const r=await resincronizarEstudianteIndividual(codigo);setResyncEst({codigo,loading:false,ok:r.ok,error:r.error});setTimeout(()=>setResyncEst(null),3000);}} disabled={resyncEst?.codigo===codigo&&resyncEst?.loading} title={resyncEst?.codigo===codigo&&resyncEst.loading?'Sincronizando CONAPE…':resyncEst?.codigo===codigo&&resyncEst.ok?'CONAPE sincronizado':resyncEst?.codigo===codigo&&resyncEst.error?'Error: '+resyncEst.error:'Sincronizar CONAPE'} aria-label="Sincronizar CONAPE" style={{width:29,height:29,borderRadius:7,border:'1px solid '+(resyncEst?.codigo===codigo&&resyncEst?.ok?'#2E8B43':resyncEst?.codigo===codigo&&resyncEst?.error?'#C62828':'#C9D2DC'),fontSize:14,fontWeight:900,cursor:resyncEst?.codigo===codigo&&resyncEst?.loading?'wait':'pointer',background:resyncEst?.codigo===codigo&&resyncEst?.ok?'#DDF3E2':resyncEst?.codigo===codigo&&resyncEst?.error?'#FFE1E4':'white'}}>↻</button>
                      <button onClick={() => abrirPago(e,nivelKey,onNavigate)} title="Aplicar pago" aria-label="Aplicar pago" style={{width:29,height:29,borderRadius:7,border:'1px solid #C9D2DC',fontSize:13,cursor:'pointer',background:'white'}}>💳</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
      {modalEstatus && (
        <ModalEstatus
          estudiante={modalEstatus.estudiante}
          nivel={modalEstatus.nivel}
          onClose={() => setModalEstatus(null)}
          onSuccess={() => {
            setModalEstatus(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
      {modalCambio && (
        <AkCambioAcademicoWizard
          codigo={modalCambio.estudiante?.codigo || modalCambio.estudiante?.rec_m || ''}
          nivel={modalCambio.nivel}
          infoNivel={modalCambio.estudiante}
          onClose={() => setModalCambio(null)}
          onSuccess={() => {
            setModalCambio(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}

function StatMini({ label, value, warn }) {
  return (
    <div style={{
      minWidth:94, padding:'9px 12px', borderRadius:12,
      background: warn ? 'color-mix(in srgb, #E59500 11%, white)' : 'white',
      border:`1px solid ${warn ? 'color-mix(in srgb, #E59500 36%, transparent)' : 'var(--line,#e6e0d8)'}`,
      textAlign:'center',
    }}>
      <div style={{ fontSize:10, fontWeight:900, letterSpacing:'0.10em', textTransform:'uppercase', color: warn ? '#9A5A00' : 'var(--ink-3,#999)' }}>{label}</div>
      <div style={{ fontFamily:'var(--f-serif,serif)', fontSize:22, lineHeight:1, color: warn ? '#9A5A00' : 'var(--an-navy,#14213D)', marginTop:3 }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// F30 — Cierre académico seguro por grupo/nivel
// Vista previa antes de tocar ESTATUS. Ejecuta solo con confirmación.
// Marca: CALGRUPO_F30_20260617_CIERRE_ACADEMICO_SEGURO_PREVIEW
// ─────────────────────────────────────────────────────────────────────────
function CierreAcademicoNivelPanel({ grupo, secciones, onRefresh }) {
  const nivelesDisponibles = React.useMemo(() => {
    const set = new Set((secciones || []).map(s => String(s.nivel || '').toUpperCase()).filter(Boolean));
    return ORDEN_NIVELES.filter(n => set.has(n));
  }, [secciones]);

  const [nivel, setNivel] = React.useState('B1');
  const [preview, setPreview] = React.useState(null);
  const [resultado, setResultado] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [ejecutando, setEjecutando] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (nivelesDisponibles.length && !nivelesDisponibles.includes(nivel)) {
      setNivel(nivelesDisponibles[0]);
      setPreview(null);
      setResultado(null);
    }
  }, [nivelesDisponibles.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!grupo || !nivelesDisponibles.length) return null;

  const resumen = preview?.resumen || {};
  const detalle = preview?.detalle || [];
  const accionables = Number(resumen.listo_apr || 0) + Number(resumen.listo_rep || 0);

  async function cargarPreview(n = nivel) {
    if (!grupo || !n) return;
    setLoading(true); setError(''); setResultado(null);
    try {
      const d = await postAdminStudents('getCierreAcademicoNivelPreview', { cod_grupo: grupo, grupo, nivel: n });
      if (d && d.ok) setPreview(d);
      else setError(adminStudentsSafeUserError(d?.mensaje || d?.error, 'No se pudo cargar la vista previa del cierre. Intentá de nuevo.', 'preview_cierre'));
    } catch(e) {
      setError(adminStudentsSafeUserError(e?.message || String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'));
    } finally {
      setLoading(false);
    }
  }

  async function ejecutarCierre() {
    if (!preview || !accionables) return;
    const msg = `Vas a cerrar ${accionables} estudiante(s) de ${grupo} · ${nivel}.\n\nAPR: ${resumen.listo_apr || 0}\nREP: ${resumen.listo_rep || 0}\n\nNo se tocarán incompletos ni ya cerrados. ¿Continuar?`;
    if (!window.confirm(msg)) return;
    setEjecutando(true); setError(''); setResultado(null);
    try {
      const d = await postAdminStudents('ejecutarCierreAcademicoNivel', { cod_grupo: grupo, grupo, nivel, confirmar: true });
      if (d && d.ok) {
        setResultado(d);
        setPreview(d.preview || preview);
        if (onRefresh) onRefresh();
      } else {
        setError(adminStudentsSafeUserError(d?.mensaje || d?.error, 'No se pudo ejecutar el cierre académico. Intentá de nuevo.', 'ejecutar_cierre'));
      }
    } catch(e) {
      setError(adminStudentsSafeUserError(e?.message || String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'));
    } finally {
      setEjecutando(false);
    }
  }

  function badgeDecision(item) {
    const d = String(item.decision || '').toLowerCase();
    if (d === 'apr') return { txt:'APR', bg:'#E8F5E9', fg:'#2E7D32' };
    if (d === 'rep') return { txt:'REP', bg:'#FFEBEE', fg:'#C62828' };
    if (d === 'incompleto') return { txt:'Incompleto', bg:'#FFF8E1', fg:'#8A5A00' };
    if (d === 'ya_cerrado') return { txt:'Ya cerrado', bg:'#E3F2FD', fg:'#1565C0' };
    return { txt:item.decision_label || 'Sin acción', bg:'#F5F5F5', fg:'#666' };
  }

  return (
    <div style={{
      border:'1px solid rgba(20,33,61,.10)', borderRadius:16, padding:18, margin:'0 0 20px',
      background:'linear-gradient(135deg, rgba(20,33,61,.035), rgba(229,168,35,.045))',
      boxShadow:'0 8px 24px rgba(20,33,61,.06)'
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
        <div style={{ flex:'1 1 320px' }}>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:'.14em', textTransform:'uppercase', color:'#E5A823', marginBottom:5 }}>
            Cierre académico seguro
          </div>
          <div style={{ fontFamily:'var(--f-serif, serif)', fontSize:24, fontWeight:500, color:'var(--an-navy-ink,#14213D)', lineHeight:1.1 }}>
            Vista previa antes de aprobar o reprobar
          </div>
          <div style={{ fontSize:12, color:'var(--ink-3,#777)', marginTop:7, lineHeight:1.5 }}>
            Recalcula por nivel, separa incompletos y solo cambia el estado académico con confirmación. Los estudiantes aprobados pasan por las validaciones administrativas existentes.
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', justifyContent:'flex-end' }}>
          {nivelesDisponibles.map(n => (
            <button key={n} onClick={() => { setNivel(n); setPreview(null); setResultado(null); setError(''); }} style={{
              border:'1px solid ' + (nivel === n ? (NIVEL_COLOR_P[n] || '#14213D') : 'var(--line,#ddd)'),
              background: nivel === n ? (NIVEL_COLOR_P[n] || '#14213D') : 'white',
              color: nivel === n ? 'white' : 'var(--ink-2,#444)',
              borderRadius:999, padding:'7px 12px', fontSize:11, fontWeight:800, cursor:'pointer'
            }}>{n}</button>
          ))}
          <button onClick={() => cargarPreview()} disabled={loading || ejecutando} style={{
            border:'none', background:'var(--an-navy,#14213D)', color:'white', borderRadius:999,
            padding:'8px 14px', fontSize:11, fontWeight:800, cursor: loading ? 'wait' : 'pointer'
          }}>{loading ? 'Calculando…' : 'Vista previa'}</button>
          <button onClick={ejecutarCierre} disabled={!preview || !accionables || ejecutando} style={{
            border:'none', background: (!preview || !accionables) ? '#BBB' : '#2E7D32', color:'white', borderRadius:999,
            padding:'8px 14px', fontSize:11, fontWeight:800, cursor: (!preview || !accionables) ? 'not-allowed' : 'pointer'
          }}>{ejecutando ? 'Cerrando…' : 'Cerrar nivel'}</button>
        </div>
      </div>

      {error && <div style={{ marginTop:14, padding:'10px 12px', borderRadius:10, background:'#FFEBEE', color:'#C62828', fontSize:12, fontWeight:700 }}>{error}</div>}
      {resultado && <div style={{ marginTop:14, padding:'10px 12px', borderRadius:10, background:'#E8F5E9', color:'#2E7D32', fontSize:12, fontWeight:700 }}>
        Cierre ejecutado: APR {resultado.resumen?.apr || 0}, REP {resultado.resumen?.rep || 0}, bloqueados {resultado.resumen?.bloqueados || 0}.
      </div>}

      {preview && (
        <div style={{ marginTop:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(0,1fr))', gap:10, marginBottom:14 }}>
            {[
              ['Total', resumen.total || 0, '#14213D'],
              ['Listos APR', resumen.listo_apr || 0, '#2E7D32'],
              ['Listos REP', resumen.listo_rep || 0, '#C62828'],
              ['Incompletos', resumen.incompletos || 0, '#8A5A00'],
              ['Ya cerrados', resumen.ya_cerrados || 0, '#1565C0'],
              ['Sin acción', resumen.sin_accion || 0, '#777'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background:'white', border:'1px solid rgba(20,33,61,.08)', borderRadius:12, padding:'10px 12px' }}>
                <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'.1em', fontWeight:800, color:'var(--ink-3,#888)' }}>{label}</div>
                <div style={{ fontSize:24, fontWeight:800, color, fontFamily:'var(--f-serif, serif)', lineHeight:1 }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ maxHeight:260, overflow:'auto', background:'white', border:'1px solid var(--line,#eee)', borderRadius:12 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead style={{ position:'sticky', top:0, background:'#FAFAFA' }}>
                <tr>
                  {['Estudiante','Código','Estado actual','Nota','Decisión','Faltantes'].map(h => (
                    <th key={h} style={{ padding:'9px 10px', textAlign:'left', fontSize:10, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--ink-3,#777)', borderBottom:'1px solid var(--line,#eee)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detalle.slice(0, 80).map((it, idx) => {
                  const b = badgeDecision(it);
                  return (
                    <tr key={(it.codigo || '') + idx} style={{ borderBottom:'1px solid #F2F2F2' }}>
                      <td style={{ padding:'8px 10px', fontWeight:700 }}>{it.nombre || '—'}<div style={{ fontSize:10, color:'var(--ink-3,#999)', fontWeight:500 }}>{it.cedula || ''}</div></td>
                      <td style={{ padding:'8px 10px', fontFamily:'var(--f-mono,monospace)', fontSize:11 }}>{it.codigo}</td>
                      <td style={{ padding:'8px 10px' }}>{it.estatus || '—'}</td>
                      <td style={{ padding:'8px 10px', fontWeight:800, color:Number(it.nota_total || 0) >= 70 ? '#2E7D32' : '#C62828' }}>{Number(it.nota_total || 0).toFixed(2)}</td>
                      <td style={{ padding:'8px 10px' }}><span style={{ background:b.bg, color:b.fg, borderRadius:999, padding:'3px 8px', fontSize:10, fontWeight:800 }}>{b.txt}</span></td>
                      <td style={{ padding:'8px 10px', color:'var(--ink-3,#888)', fontSize:11 }}>{(it.faltantes || []).join(', ') || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {detalle.length > 80 && <div style={{ marginTop:8, fontSize:11, color:'var(--ink-3,#888)' }}>Mostrando 80 de {detalle.length} registros.</div>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
function AdminEstudiantesView({ onNavigate, grupoInicial, modo }) {
  const embebidoCalGrupo = modo === 'calgrupo';
  // En Calendario de Grupo ya conocemos el código exacto. Evitar una llamada
  // adicional a getAdminDashboard: no es necesaria para cargar la lista y podía
  // hacer que el panel pareciera detenido aunque la radiografía sí estuviera disponible.
  const { grupos, loading: loadingGrupos, error: errorGrupos } = useAdminGrupos(!embebidoCalGrupo);
  const [grupoSel, setGrupoSel] = React.useState(grupoInicial || null);
  const [filtroGrupos, setFiltroGrupos] = React.useState('');
  // Si el caller cambia `grupoInicial` (ej. nueva navegación con otro grupo),
  // adoptarlo. No pisa la selección manual del admin: solo dispara cuando el
  // valor entrante existe y difiere del seleccionado.
  React.useEffect(() => {
    if (grupoInicial && grupoInicial !== grupoSel) setGrupoSel(grupoInicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupoInicial]);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [estudiantePanelAbierto, setEstudiantePanelAbierto] = React.useState(null); // { est, tab }
  const [certEstado, setCertEstado] = React.useState(null);
  // { loading: true } | { ok, registro, nombre, url, error }

  // Rol del usuario activo — solo admin/superadmin ven el botón Sync CONAPE.
  const rolUsuario = React.useMemo(() => {
    try { return (JSON.parse(sessionStorage.getItem('an_usuario') || 'null') || {}).rol || null; }
    catch { return null; }
  }, []);
  const esAdmin = rolUsuario === 'admin' || rolUsuario === 'superadmin';

  // Sincronización CONAPE por grupo
  const [syncConape, setSyncConape] = React.useState({ loading: false });
  const [toast, setToast] = React.useState(null); // { tipo:'ok'|'err', msg }

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  React.useEffect(() => {
    setFiltroOperativo('todos');
  }, [grupoSel]);

  const handleSyncConape = async () => {
    if (!grupoSel || syncConape.loading) return;
    const storageKey = `an_conape_group_job_${grupoSel}`;
    let jobId = '';
    try { jobId = sessionStorage.getItem(storageKey) || ''; } catch (_) {}
    setSyncConape({ loading: true, procesados: 0, total: 0, jobId });
    setToast(null);
    let last = null;
    try {
      for (let guard = 0; guard < 250; guard += 1) {
        last = await postAdminStudents('sincronizarCONAPE', {
          cod_grupo: grupoSel,
          job_id: jobId,
          accion_grupo: jobId ? 'CONTINUAR' : 'INICIAR',
        }, 60000);
        if (!last || last.ok === false) throw new Error(last?.error || 'CONAPE no pudo continuar el trabajo por grupo.');
        jobId = last.job_id || jobId;
        try { if (jobId) sessionStorage.setItem(storageKey, jobId); } catch (_) {}
        setSyncConape({
          loading: !!last.pendiente,
          procesados: Number(last.procesados || 0),
          total: Number(last.total || 0),
          jobId,
          ultimo: last.ultimo || null,
        });
        if (!last.pendiente) break;
        await new Promise(resolve => setTimeout(resolve, 180));
      }
      if (!last || last.pendiente) throw new Error('El trabajo quedó pausado antes de completar la lista. Presione nuevamente para reanudar.');
      try { sessionStorage.removeItem(storageKey); } catch (_) {}
      const n = Number(last.total || 0);
      const errors = Number(last.errores_total || 0);
      if (errors) {
        const sample = (last.errores || []).slice(0, 3).map(x => `${x.codigo}: ${x.error}`).join(' · ');
        setToast({ tipo: 'err', msg: `CONAPE terminó ${last.correctos || 0}/${n}. ${errors} pendiente${errors === 1 ? '' : 's'}${sample ? ` · ${sample}` : ''}` });
      } else {
        setToast({ tipo: 'ok', msg: `CONAPE actualizado — ${n} estudiante${n === 1 ? '' : 's'} confirmado${n === 1 ? '' : 's'}.` });
      }
      setRefreshKey(k => k + 1);
    } catch (e) {
      setSyncConape(s => ({ ...s, loading: false, paused: true, jobId }));
      console.warn('[AdminStudents] Sincronización CONAPE pausada.', e);
      setToast({ tipo: 'err', msg: `Sincronización pausada${last?.procesados != null ? ` en ${last.procesados}/${last.total}` : ''}. Podés reanudarla con Sync CONAPE.` });
    }
  };

  const handleGenerarCertificado = async (est, nivel) => {
    setCertEstado({ loading: true, codigo: est.codigo, nivel });
    try {
      const data = await postAdminStudents('generarCertificado', {
        codigo: String(est.codigo || ''),
        nivel: nivel,
        grupo: String(est.grupo || grupoSel || ''),
      });
      setCertEstado({ ...data, codigo: est.codigo, nivel });
      if (data.ok) {
        // Recargar la radiografía para mostrar el nuevo REG_CERTIFICADOS
        setRefreshKey(k => k + 1);
        setTimeout(() => { setCertEstado(null); }, 5200);
      }
    } catch(e) {
      setCertEstado({ ok: false, error: 'Error de conexión', codigo: est.codigo, nivel });
    }
  };

  const handleGenerarCertificadosNivel = async (nivel) => {
    if (!grupoSel || !nivel) return;
    setCertEstado({ loading: true, masivo: true, preview: true, nivel });
    try {
      const preview = await postAdminStudents('generarCertificadosNivel', {
        grupo: grupoSel,
        nivel: nivel,
        dry_run: true,
        confirmar: false,
      });
      if (!preview || preview.ok !== true) {
        setCertEstado({ ...(preview || {}), ok: false, masivo: true, error: (preview && (preview.error || preview.mensaje)) || 'No se pudo preparar la vista previa', nivel });
        return;
      }
      const r = preview.resumen || {};
      const porGenerar = Number(r.por_generar ?? r.generables ?? r.generados ?? 0) || 0;
      const yaExistentes = Number(r.ya_existentes || 0) || 0;
      const sinPdf = Number(r.sin_pdf || 0) || 0;
      const noAptos = Number(r.no_aptos || 0) || 0;
      const errores = Number(r.errores || 0) || 0;
      const msg = [
        `Grupo: ${grupoSel}`,
        `Nivel: ${nivel}`,
        '',
        `Se crearán certificados nuevos: ${porGenerar}`,
        `Ya registrados / existentes: ${yaExistentes}`,
        `Registrados sin PDF localizado: ${sinPdf}`,
        `No aptos: ${noAptos}`,
        errores ? `Errores previos: ${errores}` : '',
        '',
        'Regla segura: los estudiantes con certificado ya registrado NO generan un número nuevo.',
        '',
        '¿Confirmás ejecutar la generación masiva segura?'
      ].filter(Boolean).join('\n');
      const confirmar = window.confirm(msg);
      if (!confirmar) {
        setCertEstado({ ok: true, cancelado: true, masivo: true, nivel, resumen: r, mensaje: 'Proceso cancelado. No se generó ningún certificado.' });
        setTimeout(() => { setCertEstado(null); }, 4200);
        return;
      }

      setCertEstado({ loading: true, masivo: true, nivel });
      const data = await postAdminStudents('generarCertificadosNivel', {
        grupo: grupoSel,
        nivel: nivel,
        confirmar: true,
        modo: 'ejecutar',
      });
      setCertEstado({ ...data, masivo: true, nivel });
      if (data.ok) {
        const r2 = data.resumen || {};
        setToast({
          tipo: (r2.errores || 0) ? 'err' : 'ok',
          msg: `Certificados ${nivel}: ${r2.generados || 0} creados · ${r2.ya_existentes || 0} ya existían · ${r2.sin_pdf || 0} sin PDF · ${r2.no_aptos || 0} no aptos${(r2.errores || 0) ? ` · ${r2.errores} errores` : ''}`,
        });
        setRefreshKey(k => k + 1);
        setTimeout(() => { setCertEstado(null); }, 7600);
      }
    } catch(e) {
      setCertEstado({ ok: false, masivo: true, error: 'Error de conexión', nivel });
    }
  };
  const handleRegenerarCertificadosNivel = async (nivel) => {
    if (!grupoSel || !nivel) return;
    setCertEstado({ loading: true, masivo: true, regenerando: true, preview: true, nivel });
    try {
      const preview = await postAdminStudents('generarCertificadosNivel', {
        grupo: grupoSel,
        nivel,
        dry_run: true,
        confirmar: false,
        regenerar_registrados: true,
      });
      if (!preview || preview.ok !== true) {
        setCertEstado({ ...(preview || {}), ok:false, masivo:true, regenerando:true, error:(preview && (preview.error || preview.mensaje)) || 'No se pudo preparar la regeneración', nivel });
        return;
      }

      const candidatos = (preview.detalle || []).filter(x => x && x.estado === 'por_regenerar' && x.registro);
      const registrosDefault = candidatos.map(x => x.registro).join(', ');
      if (!registrosDefault) {
        setCertEstado({ ok:false, masivo:true, regenerando:true, nivel, error:'No hay certificados registrados aptos para regenerar en este nivel.' });
        return;
      }

      const seleccionTexto = window.prompt(
        `Regenerar certificados de ${grupoSel} · ${nivel}\n\n` +
        'Se conservará exactamente el mismo número de registro.\n' +
        'Podés dejar todos o borrar los que no querés rehacer.\n\n' +
        'Registros separados por coma:',
        registrosDefault
      );
      if (seleccionTexto === null) {
        setCertEstado({ ok:true, cancelado:true, masivo:true, regenerando:true, nivel, mensaje:'Regeneración cancelada. No se modificó nada.' });
        setTimeout(() => setCertEstado(null), 4200);
        return;
      }
      const registros = String(seleccionTexto || '').split(/[\n,;]+/).map(x => x.trim()).filter(Boolean);
      if (!registros.length) {
        setCertEstado({ ok:false, masivo:true, regenerando:true, nivel, error:'No se indicó ningún registro para regenerar.' });
        return;
      }

      const confirmacion = window.confirm(
        `Se volverán a crear ${registros.length} PDF de ${grupoSel} · ${nivel}.\n\n` +
        registros.join('\n') +
        '\n\nNo se crearán números nuevos. No se cambiará el estado académico ni el número de certificado.\n\n¿Continuar?'
      );
      if (!confirmacion) {
        setCertEstado({ ok:true, cancelado:true, masivo:true, regenerando:true, nivel, mensaje:'Regeneración cancelada. No se modificó nada.' });
        setTimeout(() => setCertEstado(null), 4200);
        return;
      }

      setCertEstado({ loading:true, masivo:true, regenerando:true, nivel });
      const data = await postAdminStudents('generarCertificadosNivel', {
        grupo: grupoSel,
        nivel,
        confirmar: true,
        modo: 'ejecutar',
        regenerar_registrados: true,
        registros,
      });
      setCertEstado({ ...data, masivo:true, regenerando:true, nivel });
      if (data && data.ok) {
        const rr = data.resumen || {};
        const noEncontrados = (data.registros_no_encontrados || []).length;
        setToast({
          tipo: (rr.errores || noEncontrados) ? 'err' : 'ok',
          msg: `Certificados ${nivel}: ${rr.regenerados || 0} regenerados con el mismo número${(rr.errores || 0) ? ` · ${rr.errores} errores` : ''}${noEncontrados ? ` · ${noEncontrados} registros no encontrados` : ''}`,
        });
        setRefreshKey(k => k + 1);
        setTimeout(() => setCertEstado(null), 9000);
      }
    } catch(e) {
      setCertEstado({ ok:false, masivo:true, regenerando:true, error:adminStudentsSafeUserError(e?.message || String(e), 'No se pudo regenerar los certificados. Intentá de nuevo.', 'regenerar_certificados'), nivel });
    }
  };

  const { data, loading: loadingRad, error: errorRad } = useRadiografia(grupoSel, refreshKey);
  const ultimosDesembolsosConape = useUltimosDesembolsosConape();
  const grupoInfoDetalle = useGrupoInfo(grupoSel);

  // Estado de ordenamiento (compartido entre tablas de niveles)
  const [sortCol, setSortCol] = React.useState('codigo');
  const [sortDir, setSortDir] = React.useState('asc');
  const [filtroOperativo, setFiltroOperativo] = React.useState('todos');
  const [nivelEnfoque, setNivelEnfoque] = React.useState(null);

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  function sortEstudiantes(lista) {
    return [...lista].sort((a, b) => {
      let va = a[sortCol];
      let vb = b[sortCol];
      if (va == null) va = '';
      if (vb == null) vb = '';
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb), 'es')
        : String(vb).localeCompare(String(va), 'es');
    });
  }

  // Al tener grupos, seleccionar el primero automáticamente
  React.useEffect(() => {
    if (grupos.length && !grupoSel) setGrupoSel(grupos[0].code);
  }, [grupos]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    setNivelEnfoque(null);
    setFiltroOperativo('todos');
  }, [grupoSel]);

  const grupoInfo = grupos.find(g => g.code === grupoSel) || (grupoSel ? { code: grupoSel, schedule: '—', estudiantes: 0 } : null);

  const gruposFiltrados = React.useMemo(() => {
    const q = String(filtroGrupos || '').trim().toLowerCase();
    const base = grupos || [];
    if (!q) return base;
    return base.filter(g => [g.code, g.nivel, g.schedule, g.horario, g.docente, g.teacher, g.programa, g.periodo_label]
      .some(v => String(v || '').toLowerCase().includes(q)));
  }, [grupos, filtroGrupos]);

  const resumenGrupos = React.useMemo(() => {
    const out = { total: grupos.length, estudiantes: 0, bajoMinimo: 0, porNivel: { B1:0, B2:0, I1:0, I2:0 } };
    (grupos || []).forEach(g => {
      const nEst = Number(g.estudiantes ?? g.students ?? 0) || 0;
      out.estudiantes += nEst;
      if (nEst > 0 && nEst < 5) out.bajoMinimo += 1;
      const niv = nivelToId(g.nivel || g.code?.split('-')?.[0]);
      if (out.porNivel[niv] != null) out.porNivel[niv] += 1;
    });
    return out;
  }, [grupos]);

  // Construir secciones desde getRadiografiaGrupo (data.niveles = { B1:[], B2:[], I1:[], I2:[] })
  const secciones = React.useMemo(() => {
    if (!data || !data.niveles) return [];
    return ORDEN_NIVELES
      .filter(n => data.niveles[n] && data.niveles[n].length > 0)
      .map(n => ({ nivel: n, estudiantes: data.niveles[n] }));
  }, [data]);

  const resumenOperativo = React.useMemo(() => resumenOperativoEstudiantes(secciones), [secciones]);

  // F98.4-Z6-AK: abrir la misma ficha lateral cuando la acción viene desde
  // Calendario académico / Consulta individual. El prefill se consume una vez.
  React.useEffect(() => {
    if (!secciones.length) return;
    const raw = sessionStorage.getItem('an_estudiante_prefill');
    if (!raw) return;
    let pre; try { pre = JSON.parse(raw); } catch (_) { sessionStorage.removeItem('an_estudiante_prefill'); return; }
    const codigoPref = String(pre?.codigo || '').trim();
    if (!codigoPref) { sessionStorage.removeItem('an_estudiante_prefill'); return; }
    const encontrado = secciones.flatMap(s => s.estudiantes || []).find(e => String(e.codigo || e.rec_m || e.CODIGO || '').trim() === codigoPref);
    if (!encontrado) return;
    sessionStorage.removeItem('an_estudiante_prefill');
    setEstudiantePanelAbierto({ est: encontrado, tab: pre?.tab === 'seguimiento' ? 'seguimiento' : 'pagos' });
  }, [secciones]);

  const seccionesFiltradas = React.useMemo(() => {
    const base = nivelEnfoque ? secciones.filter(s => s.nivel === nivelEnfoque) : secciones;
    if (filtroOperativo === 'todos') return base;
    return base
      .map(s => ({ ...s, estudiantes: (s.estudiantes || []).filter(e => matchFiltroOperativo(e, filtroOperativo)) }))
      .filter(s => s.estudiantes.length > 0);
  }, [secciones, filtroOperativo, nivelEnfoque]);

  // Lección estimada — derivada del código del grupo (NIVEL-DIAS-...-NNYY)
  const diasCode = extraerDias(grupoSel);
  const leccionActual = grupoInfoDetalle
    ? calcularLeccionActual(grupoInfoDetalle.startDate, diasCode, 'CA')
    : 0;

  return (
    <div style={{ padding: embebidoCalGrupo ? 0 : 24 }}>
      <style>{`@keyframes an-spin { to { transform: rotate(360deg); } }`}</style>
      {!embebidoCalGrupo && <PageHeader
        kicker="Administración"
        title={<>Grupos <em>activos</em></>}
        sub="Click en un grupo para ver su radiografía completa"
      />}

      {/* Selector limpio de grupos — F7: Estudiantes queda como consulta/listado general, no como calendario */}
      {!embebidoCalGrupo && (loadingGrupos ? (
        <div style={{ color:'var(--ink-3, #888)', padding:20 }}>Cargando grupos…</div>
      ) : errorGrupos ? (
        <div style={{
          padding:'14px 18px', margin:'4px 0 8px', borderRadius:8,
          background:'#FFEBEE', border:'1px solid #E57373', color:'#C62828',
          fontSize:13, fontWeight:600, lineHeight:1.5,
        }}>
          No se pudieron cargar los grupos: {errorGrupos}
        </div>
      ) : grupos.length === 0 ? (
        <div style={{ color:'var(--ink-3, #888)', padding:20 }}>No hay grupos activos.</div>
      ) : (
        <div style={{ marginBottom:24 }}>
          <div style={{
            padding:'16px 18px', borderRadius:14,
            background:'linear-gradient(135deg, color-mix(in srgb, var(--an-navy,#14213D) 5%, white), white)',
            border:'1px solid var(--line,#e6e0d8)', boxShadow:'0 10px 24px rgba(20,33,61,0.05)',
            marginBottom:14,
          }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap', marginBottom:14 }}>
              <div style={{ minWidth:260, flex:'1 1 320px' }}>
                <div style={{ fontSize:10, fontWeight:900, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--ink-3,#8b8178)', marginBottom:4 }}>
                  Consulta administrativa
                </div>
                <div style={{ fontFamily:'var(--f-serif,serif)', fontSize:24, lineHeight:1.05, color:'var(--an-navy,#14213D)', fontWeight:600 }}>
                  Estudiantes por grupo
                </div>
                <div style={{ fontSize:12, color:'var(--ink-2,#6f665e)', marginTop:5, lineHeight:1.45 }}>
                  Esta vista queda para búsqueda, mora, CONAPE y ficha administrativa. La operación diaria del calendario ahora vive en <strong>Calendario de Grupo</strong>.
                </div>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
                <StatMini label="Grupos" value={resumenGrupos.total} />
                <StatMini label="Estudiantes" value={resumenGrupos.estudiantes} />
                <StatMini label="Bajo mínimo" value={resumenGrupos.bajoMinimo} warn={resumenGrupos.bajoMinimo > 0} />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'minmax(260px, 1fr) auto', gap:12, alignItems:'center' }}>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-3,#999)', fontSize:14 }}>🔎</span>
                <input
                  value={filtroGrupos}
                  onChange={e => setFiltroGrupos(e.target.value)}
                  placeholder="Buscar grupo, docente, horario, nivel o programa…"
                  style={{
                    width:'100%', padding:'10px 12px 10px 36px', borderRadius:10,
                    border:'1px solid var(--line,#ddd)', background:'white', fontSize:13,
                    outline:'none', fontFamily:'inherit', boxShadow:'inset 0 1px 0 rgba(0,0,0,0.02)',
                  }}
                />
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end' }}>
                {ORDEN_NIVELES.map(n => {
                  const cfg = NIVEL_CONFIG[n];
                  const active = String(filtroGrupos || '').toLowerCase() === n.toLowerCase();
                  return (
                    <button key={n}
                      onClick={() => setFiltroGrupos(active ? '' : n)}
                      style={{
                        border:`1px solid ${cfg.color}`, color: active ? 'white' : cfg.color,
                        background: active ? cfg.color : cfg.bg, borderRadius:999,
                        padding:'6px 10px', fontSize:11, fontWeight:900,
                        cursor:'pointer', minWidth:58,
                      }}
                    >{n} · {resumenGrupos.porNivel[n] || 0}</button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{
            display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(230px, 1fr))', gap:10,
            maxHeight:360, overflowY:'auto', paddingRight:4,
          }}>
            {gruposFiltrados.map(g => (
              <ChipGrupo
                key={g.code}
                grupo={g}
                seleccionado={grupoSel === g.code}
                onClick={() => setGrupoSel(g.code)}
              />
            ))}
          </div>

          {!gruposFiltrados.length && (
            <div style={{ padding:'22px', textAlign:'center', color:'var(--ink-3,#999)', fontSize:13, border:'1px dashed var(--line,#ddd)', borderRadius:12, marginTop:8 }}>
              No encontré grupos con ese filtro.
            </div>
          )}
        </div>
      ))}

      {/* Panel radiografía */}
      {grupoSel && grupoInfo && (
        <div>
          {/* Header del grupo: en Calendario de Grupo ya existe un encabezado externo. */}
          {!embebidoCalGrupo && <div style={{
            background:'var(--an-navy, #14213D)', color:'white', borderRadius:10,
            padding:'14px 20px', marginBottom:20, display:'flex',
            alignItems:'center', gap:24, flexWrap:'wrap',
          }}>
            <div>
              <div style={{ fontWeight:800, fontSize:16, fontFamily:'var(--f-mono, monospace)', letterSpacing:'-0.01em' }}>{grupoInfo.code}</div>
              <div style={{ fontSize:12, opacity:0.75, marginTop:2 }}>
                {(grupoInfo.schedule || grupoInfo.horario || '—')}
                {grupoInfo.programa ? ` · ${grupoInfo.programa}` : ''}
              </div>
            </div>
            <div style={{ flex:1, minWidth:20 }} />
            <div style={{ textAlign:'center', minWidth:140 }}>
              <div style={{ fontSize:10, opacity:0.7, letterSpacing:'0.1em', textTransform:'uppercase' }}>Docente</div>
              <div style={{ fontWeight:600, fontSize:13, marginTop:2 }}>{grupoInfo.docente || grupoInfo.teacher || '—'}</div>
            </div>
            <div style={{ textAlign:'center', minWidth:90 }}>
              <div style={{ fontSize:10, opacity:0.7, letterSpacing:'0.1em', textTransform:'uppercase' }}>Estudiantes</div>
              <div style={{ fontWeight:700, fontSize:20, marginTop:1, fontFamily:'var(--f-serif)', letterSpacing:'-0.02em' }}>
                {grupoInfo.estudiantes ?? grupoInfo.students ?? 0}
              </div>
            </div>
            {esAdmin && (
              <button
                onClick={handleSyncConape}
                disabled={syncConape.loading}
                title="Sincronizar estudiantes CONAPE de este grupo"
                style={{
                  display:'inline-flex', alignItems:'center', gap:6,
                  padding:'7px 12px', borderRadius:6,
                  background: syncConape.loading ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)',
                  border:'1px solid rgba(255,255,255,0.25)',
                  color:'white', fontSize:11, fontWeight:700,
                  letterSpacing:'0.04em', textTransform:'uppercase',
                  cursor: syncConape.loading ? 'wait' : 'pointer',
                  whiteSpace:'nowrap', flexShrink:0,
                  transition:'background .15s',
                }}
              >
                <span
                  style={{
                    display:'inline-block', fontSize:13, lineHeight:1,
                    animation: syncConape.loading ? 'an-spin 0.9s linear infinite' : 'none',
                  }}
                >↻</span>
                {syncConape.loading ? `CONAPE ${syncConape.procesados || 0}/${syncConape.total || '…'}` : (syncConape.paused ? 'Reanudar CONAPE' : 'Sync CONAPE')}
              </button>
            )}
          </div>}

          {embebidoCalGrupo && (
            <div style={{
              margin:'0 0 14px', padding:'12px 14px',
              display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap',
              background:'linear-gradient(135deg,color-mix(in srgb,var(--an-navy,#14213D) 7%,white),#fff)',
              border:'1px solid var(--line,#e4ddd4)', borderRadius:12,
              boxShadow:'0 8px 20px rgba(20,33,61,.05)'
            }}>
              <div style={{minWidth:240,flex:'1 1 360px'}}>
                <div style={{fontSize:10,fontWeight:900,letterSpacing:'.15em',textTransform:'uppercase',color:'var(--ink-3,#8b8178)'}}>Herramientas del grupo</div>
                <div style={{fontSize:13,fontWeight:800,color:'var(--an-navy,#14213D)',marginTop:3}}>
                  {grupoSel} · gestión completa de estudiantes
                </div>
                <div style={{fontSize:11.5,color:'var(--ink-2,#6f665e)',marginTop:3,lineHeight:1.45}}>
                  Incluye ficha, estado, pagos, cambio de grupo, historial, certificados y sincronización CONAPE individual o masiva.
                </div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end'}}>
                <button
                  type="button"
                  onClick={() => setRefreshKey(k => k + 1)}
                  disabled={loadingRad}
                  style={{
                    padding:'8px 12px',borderRadius:8,border:'1px solid var(--line,#ddd)',
                    background:'white',color:'var(--an-navy,#14213D)',fontSize:11.5,fontWeight:900,
                    cursor:loadingRad?'wait':'pointer',fontFamily:'inherit'
                  }}
                >↻ Actualizar lista</button>
                {esAdmin && (
                  <button
                    type="button"
                    onClick={handleSyncConape}
                    disabled={syncConape.loading}
                    title="Actualizar en CONAPE a todos los estudiantes con huella en este grupo"
                    style={{
                      display:'inline-flex',alignItems:'center',gap:7,padding:'8px 13px',borderRadius:8,
                      border:'1px solid color-mix(in srgb,var(--an-navy,#14213D) 40%,white)',
                      background:syncConape.loading?'#E7ECF3':'var(--an-navy,#14213D)',color:syncConape.loading?'#53627A':'white',
                      fontSize:11.5,fontWeight:900,cursor:syncConape.loading?'wait':'pointer',fontFamily:'inherit',whiteSpace:'nowrap'
                    }}
                  >
                    <span style={{display:'inline-block',animation:syncConape.loading?'an-spin .9s linear infinite':'none'}}>↻</span>
                    {syncConape.loading?`CONAPE ${syncConape.procesados||0}/${syncConape.total||'…'}`:(syncConape.paused?'Reanudar CONAPE':'Sync CONAPE · toda la lista')}
                  </button>
                )}
              </div>
              <div style={{flexBasis:'100%',fontSize:10.8,color:'var(--ink-3,#8b8178)',lineHeight:1.45}}>
                Los estudiantes en <strong>CA</strong> conservan su estado y envían a CONAPE la nota vigente registrada en el expediente académico.
              </div>
            </div>
          )}

          {/* Secciones por nivel. En modo calgrupo inicia exactamente en la vista previa de cierre. */}
          {loadingRad ? (
            <div style={{ textAlign:'center', padding:'44px 24px', color:'var(--ink-3, #888)', background:'white' }}>
              <div style={{ fontSize:26, marginBottom:8, animation:'an-spin 1s linear infinite', display:'inline-block' }}>↻</div>
              <div style={{ fontWeight:800, color:'var(--an-navy,#14213D)' }}>Cargando estudiantes del grupo…</div>
              <div style={{ fontSize:11, marginTop:4 }}>{grupoSel}</div>
            </div>
          ) : errorRad ? (
            <div style={{ padding:22, background:'white' }}>
              <div style={{ padding:'14px 16px', border:'1px solid #F4B7B7', background:'#FFEBEE', color:'#C62828', borderRadius:12 }}>
                <div style={{ fontWeight:900 }}>No se pudo cargar la lista de estudiantes</div>
                <div style={{ fontSize:11.5, marginTop:4, lineHeight:1.45 }}>{errorRad}</div>
              </div>
              <button type="button" onClick={() => setRefreshKey(k => k + 1)} style={{ marginTop:12, padding:'9px 14px', borderRadius:9, border:'1px solid var(--line,#ddd)', background:'white', color:'var(--an-navy,#14213D)', fontWeight:900, cursor:'pointer' }}>Reintentar carga</button>
            </div>
          ) : secciones.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 24px', color:'var(--ink-3, #888)', background:'white' }}>
              <div style={{ fontWeight:900, color:'var(--an-navy,#14213D)' }}>Sin estudiantes registrados en este grupo</div>
              <div style={{ fontSize:11, marginTop:5 }}>{grupoSel}{data && data.total != null ? ` · ${data.total} registros encontrados` : ''}</div>
            </div>
          ) : (
            <React.Fragment>
              <CierreAcademicoNivelPanel
                grupo={grupoSel}
                secciones={secciones}
                onRefresh={() => setRefreshKey(k => k + 1)}
              />
              <PanelOperativoGrupo
                resumen={resumenOperativo}
                filtro={filtroOperativo}
                setFiltro={setFiltroOperativo}
                embebidoCalGrupo={embebidoCalGrupo}
                estudiantesFiltrados={seccionesFiltradas.flatMap(s => s.estudiantes || [])}
                grupoCodigo={grupoSel}
              />
              <MapaNivelesOperativo
                secciones={secciones}
                nivelEnfoque={nivelEnfoque}
                setNivelEnfoque={setNivelEnfoque}
                setFiltroOperativo={setFiltroOperativo}
              />
              {seccionesFiltradas.length === 0 ? (
                <div style={{ textAlign:'center', padding:34, color:'var(--ink-3, #888)', border:'1px dashed var(--line,#ddd)', borderRadius:12, background:'white' }}>
                  No hay estudiantes para el filtro seleccionado.
                </div>
              ) : seccionesFiltradas.map(s => (
                <TablaEstudiantes
                  key={s.nivel}
                  estudiantes={s.estudiantes}
                  nivelKey={s.nivel}
                  periodo={data?.grupo?.periodos?.[s.nivel]}
                  programa={data?.grupo?.programa}
                  sortCol={sortCol}
                  sortDir={sortDir}
                  toggleSort={toggleSort}
                  sortEstudiantes={sortEstudiantes}
                  onRefresh={() => setRefreshKey(k => k + 1)}
                  onNavigate={onNavigate}
                  onAbrirPanel={(est, tab) => setEstudiantePanelAbierto({ est, tab: tab || 'pagos' })}
                  generarCertificadoFila={(est, niv) => handleGenerarCertificado(est, niv)}
                  generarCertificadosNivel={handleGenerarCertificadosNivel}
                  regenerarCertificadosNivel={handleRegenerarCertificadosNivel}
                  filtroOperativo={filtroOperativo}
                  ultimosDesembolsosConape={ultimosDesembolsosConape}
                />
              ))}
            </React.Fragment>
          )}
        </div>
      )}

      {estudiantePanelAbierto && (
        <PanelEstudianteDrawer
          est={estudiantePanelAbierto.est || estudiantePanelAbierto}
          initialTab={estudiantePanelAbierto.tab || 'pagos'}
          onClose={() => setEstudiantePanelAbierto(null)}
          onNavigate={onNavigate}
        />
      )}

      {toast && (
        <div style={{
          position:'fixed', bottom: certEstado ? 110 : 24, right:24, zIndex:1000,
          background: toast.tipo === 'ok' ? '#2E7D32' : '#C62828',
          color:'white', padding:'12px 18px', borderRadius:10,
          boxShadow:'0 4px 20px rgba(0,0,0,0.25)', maxWidth:380,
          fontSize:13, fontWeight:600, lineHeight:1.4,
          display:'flex', alignItems:'center', gap:10,
        }}>
          <span style={{ fontSize:16 }}>{toast.tipo === 'ok' ? '✓' : '⚠'}</span>
          <span style={{ flex:1 }}>{toast.msg}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background:'transparent', border:'none', color:'white', cursor:'pointer', fontSize:18, lineHeight:1, opacity:0.85, padding:0 }}
          >×</button>
        </div>
      )}

      {certEstado && (
        <div style={{
          position:'fixed', bottom:24, right:24, zIndex:999,
          background: certEstado.loading ? '#14213D'
            : certEstado.ok ? '#2E7D32' : '#C62828',
          color:'white', padding:'14px 20px', borderRadius:12,
          boxShadow:'0 4px 20px rgba(0,0,0,0.25)', maxWidth:380,
          fontSize:13, lineHeight:1.5,
        }}>
          {certEstado.loading ? (
            <span>⏳ {certEstado.masivo ? (certEstado.preview ? `Preparando vista previa del nivel ${certEstado.nivel}...` : `Generando certificados seguros del nivel ${certEstado.nivel}...`) : `Generando certificado ${certEstado.nivel}...`}</span>
          ) : certEstado.ok ? (
            certEstado.masivo ? (
              <div>
                <div style={{ fontWeight:700, marginBottom:4 }}>🏅 Certificados del nivel {certEstado.nivel}</div>
                <div style={{ fontSize:11, opacity:0.9, lineHeight:1.45 }}>
                  {certEstado.regenerando ? (
                    <>{(certEstado.resumen?.regenerados || 0)} regenerados · {(certEstado.resumen?.omitidos || 0)} omitidos · {(certEstado.resumen?.no_aptos || 0)} no aptos · {(certEstado.resumen?.errores || 0)} errores</>
                  ) : (
                    <>{(certEstado.resumen?.generados || 0)} creados · {(certEstado.resumen?.ya_existentes || 0)} ya existían · {(certEstado.resumen?.sin_pdf || 0)} sin PDF · {(certEstado.resumen?.no_aptos || 0)} no aptos · {(certEstado.resumen?.errores || 0)} errores</>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight:700, marginBottom:4 }}>
                  {certEstado.existente ? '📁 Certificado existente' : '🏅 Certificado generado'} — {certEstado.registro}
                </div>
                <div style={{ fontSize:11, opacity:0.85, marginBottom:8 }}>
                  {certEstado.mensaje || certEstado.nombre}
                </div>
                {certEstado.url && <a href={certEstado.url} target="_blank" rel="noreferrer"
                  style={{ color:'white', fontWeight:700, textDecoration:'underline' }}>
                  Abrir PDF →
                </a>}
              </div>
            )
          ) : (
            <div>
              <div style={{ fontWeight:700, marginBottom:4 }}>❌ Error</div>
              <div style={{ fontSize:12 }}>{adminStudentsSafeUserError(certEstado.mensaje || certEstado.error, 'No se pudo completar la operación de certificados. Intentá de nuevo.', 'certificados')}</div>
              {certEstado.search_url && <a href={certEstado.search_url} target="_blank" rel="noreferrer" style={{ color:'white', fontWeight:700, textDecoration:'underline', display:'inline-block', marginTop:8 }}>Buscar en Drive →</a>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PANEL ESTUDIANTE DRAWER — overlay lateral con ficha completa
// ─────────────────────────────────────────────────────────────────────────
// (URL del Apps Script ya disponible vía SCRIPT_URL_AS arriba — fuente única window.APPS_SCRIPT_URL)

const NIVEL_COLOR_P  = { B1:'#E5A823', B2:'#E8372A', I1:'#2B7FC1', I2:'#4CAF50' };
const NIVEL_LABEL_P  = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
const NIVEL_ORDER_P  = ['B1','B2','I1','I2'];

function PanelEstudianteDrawer({ est, onClose, onNavigate, initialTab }) {
  const [detalle, setDetalle]     = React.useState(null);
  const [cargando, setCargando]   = React.useState(true);
  const [error, setError]         = React.useState('');
  const [tabActiva, setTabActiva] = React.useState(initialTab || 'pagos');

  React.useEffect(() => { setTabActiva(initialTab || 'pagos'); }, [initialTab, est?.codigo, est?.rec_m]);

  React.useEffect(() => {
    if (!est) return;
    setCargando(true); setError(''); setDetalle(null);
    postAdminStudents('getEstudiante', { codigo: est.codigo || est.rec_m || '' })
      .then(d => { if (d.ok) setDetalle(d); else setError(adminStudentsSafeUserError(d?.error || d?.mensaje, 'No se pudo cargar el expediente. Intentá de nuevo.', 'cargar_expediente')); })
      .catch(e => setError(adminStudentsSafeUserError(e?.message || String(e), 'No se pudo cargar el expediente. Intentá de nuevo.', 'cargar_expediente')))
      .finally(() => setCargando(false));
  }, [est?.codigo, est?.rec_m]);

  React.useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const nivelActivo   = detalle?.grupo?.NIVEL_ACTUAL_ID || est.nivel_actual || 'B1';
  const colorActivo   = NIVEL_COLOR_P[nivelActivo] || '#8B8178';
  const niveles       = detalle?.niveles || {};
  const pagosEst      = detalle ? [...(detalle.pagos || []), ...(detalle.otrosPagos || [])] : [];
  const cuotaPactada  = detalle?.pendientes?.cuota_mensual || null;
  const grupoReal     = detalle?.grupo || null;

  const tabs = [
    ['pagos',       '💳 Pagos'],
    ['seguimiento', '📝 Seguimiento'],
    ['notas',       '📊 Notas'],
    ['asistencia',  '📅 Asistencia'],
    ['documentos',  '📄 Documentos'],
  ];

  return (
    <React.Fragment>
      <div
        onClick={onClose}
        style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.35)',
          zIndex:900, backdropFilter:'blur(2px)',
        }}
      />
      <div style={{
        position:'fixed', top:0, right:0, bottom:0,
        width: 'min(680px, 92vw)',
        background:'var(--surface, #fff)',
        boxShadow:'-4px 0 32px rgba(0,0,0,0.18)',
        zIndex:901,
        display:'flex', flexDirection:'column',
        overflowY:'auto',
      }}>
        <div style={{
          background:'var(--an-navy, #14213D)',
          color:'white', padding:'20px 24px',
          flexShrink:0, position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', right:-20, bottom:-20, width:140, height:140, borderRadius:'50%', background:'var(--an-granate)', opacity:0.15 }} />

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative' }}>
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', opacity:0.7, marginBottom:4 }}>
                Ficha del estudiante
              </div>
              <div style={{ fontFamily:'var(--f-serif, serif)', fontSize:22, fontWeight:500, lineHeight:1.15, marginBottom:8 }}>
                {est.nombre}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:14, fontSize:12, opacity:0.85 }}>
                <span>Cédula: <strong style={{ fontFamily:'var(--f-mono, monospace)' }}>{est.cedula}</strong></span>
                <span>Código: <strong style={{ fontFamily:'var(--f-mono, monospace)' }}>{est.codigo || est.rec_m}</strong></span>
                {grupoReal?.NIVEL_ACTUAL && (
                  <span style={{
                    padding:'2px 10px', borderRadius:999, fontWeight:700, fontSize:11,
                    background:`color-mix(in srgb, ${colorActivo} 20%, white)`,
                    color: colorActivo,
                  }}>
                    {grupoReal.NIVEL_ACTUAL}
                  </span>
                )}
                {cuotaPactada && (
                  <span>Cuota: <strong style={{ color:'var(--an-gold)' }}>₡{cuotaPactada.toLocaleString('es-CR')}</strong></span>
                )}
                {grupoReal?.DOCENTE && (
                  <span>Docente: <strong>{grupoReal.DOCENTE}</strong></span>
                )}
              </div>
            </div>

            <button onClick={onClose} style={{
              background:'rgba(255,255,255,0.12)', border:'none', color:'white',
              width:34, height:34, borderRadius:'50%', cursor:'pointer',
              fontSize:18, display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
            }}>×</button>
          </div>

          <div style={{ display:'flex', gap:4, marginTop:16, position:'relative' }}>
            {tabs.map(([k, l]) => (
              <button key={k} onClick={() => setTabActiva(k)} style={{
                padding:'7px 14px', borderRadius:'var(--r-md, 8px)',
                border:'none', fontSize:12, fontWeight:700, cursor:'pointer',
                background: tabActiva === k ? 'white' : 'rgba(255,255,255,0.1)',
                color: tabActiva === k ? 'var(--an-navy, #14213D)' : 'rgba(255,255,255,0.8)',
                transition:'all .15s',
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ flex:1, padding:'20px 24px', overflowY:'auto' }}>
          {cargando && (
            <div style={{ padding:'20px', textAlign:'center', color:'var(--ink-3, #999)', fontSize:13 }}>
              ⏳ Cargando datos en tiempo real…
            </div>
          )}
          {!cargando && error && (
            <div style={{ padding:'12px 16px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md, 8px)', fontSize:13, color:'#8B0000', marginBottom:16 }}>
              ⚠ {error}
            </div>
          )}
          {tabActiva === 'pagos' && !cargando && (
            <TabPagosPanel pagosEst={pagosEst} niveles={niveles} detalle={detalle} onNavigate={onNavigate} est={est} />
          )}
          {tabActiva === 'seguimiento' && !cargando && (
            <TabSeguimientoPanel est={est} detalle={detalle} />
          )}
          {tabActiva === 'notas' && !cargando && (
            <TabNotasPanel niveles={niveles} nivelActivo={nivelActivo} est={est} detalle={detalle} />
          )}
          {tabActiva === 'asistencia' && !cargando && (
            <TabAsistenciaPanel est={est} detalle={detalle} />
          )}
          {tabActiva === 'documentos' && !cargando && (
            <TabDocumentosPanel est={est} detalle={detalle} nivelActivo={nivelActivo} niveles={niveles} />
          )}
        </div>
      </div>
    </React.Fragment>
  );
}


function BitacoraFlag({ flag }) {
  const tones = {
    ok:   { bg:'#E8F5E9', fg:'#2E7D32', bd:'#BFE4C3' },
    bad:  { bg:'#FFEBEE', fg:'#C62828', bd:'#F4B7B7' },
    warn: { bg:'#FFF8E1', fg:'#9A6200', bd:'#F1D18A' },
    blue: { bg:'#E3F2FD', fg:'#1565C0', bd:'#B9DAF5' },
  };
  const t = tones[flag?.tone] || tones.ok;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 9px', borderRadius:999, background:t.bg, color:t.fg, border:`1px solid ${t.bd}`, fontSize:10.5, fontWeight:900 }}>
      {flag?.label || 'Seguimiento'}
    </span>
  );
}

function TabSeguimientoPanel({ est, detalle }) {
  const [items, setItems] = React.useState(() => leerBitacoraLocal(est));
  const [tipo, setTipo] = React.useState(() => tipoBitacoraInicial(est));
  const [nota, setNota] = React.useState('');
  const [copiado, setCopiado] = React.useState(false);
  const [guardado, setGuardado] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [fuente, setFuente] = React.useState('local');
  const [syncMsg, setSyncMsg] = React.useState('');
  const flags = seguimientoFlagsEstudiante(est);
  const codigo = codigoEstudianteClave(est);
  const nombre = est?.display || est?.nombre || detalle?.estudiante?.nombre || 'Estudiante';
  const telefono = estudiantePhone(est) || 'sin teléfono';

  React.useEffect(() => {
    let activo = true;
    setItems(leerBitacoraLocal(est));
    setTipo(tipoBitacoraInicial(est));
    setNota('');
    setFuente('local');
    setSyncMsg('');
    setSyncing(true);
    listarBitacoraBackend(est)
      .then(resp => {
        if (!activo) return;
        if (resp && resp.ok === true) {
          setItems(resp.items || []);
          setFuente('backend');
          setSyncMsg('Bitácora oficial conectada');
        } else {
          setFuente('local');
          setSyncMsg('No se pudo conectar con la bitácora oficial. El seguimiento queda temporalmente en este navegador.');
        }
      })
      .catch(() => {
        if (!activo) return;
        setFuente('local');
        setSyncMsg('No se pudo conectar con la bitácora oficial. El seguimiento queda temporalmente en este navegador.');
      })
      .finally(() => { if (activo) setSyncing(false); });
    return () => { activo = false; };
  }, [est?.codigo, est?.rec_m, est?.cedula]);

  const agregar = React.useCallback(async () => {
    const texto = String(nota || '').trim();
    if (!texto) return;
    const nuevo = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      tipo,
      nota: texto,
      usuario: 'Admin',
    };
    setGuardado(false);
    setSyncing(true);
    try {
      const remoto = await registrarBitacoraBackend(est, nuevo);
      if (remoto && remoto.ok === true) {
        const next = remoto.items && remoto.items.length ? remoto.items : [remoto.item || normalizarBitacoraRemota(nuevo), ...items].slice(0, 80);
        setItems(next);
        setFuente('backend');
        setSyncMsg('Guardado en bitácora oficial');
      } else {
        const next = [nuevo, ...items].slice(0, 60);
        setItems(next);
        guardarBitacoraLocal(est, next);
        setFuente('local');
        setSyncMsg('Guardado temporalmente en este navegador. La bitácora oficial no está disponible.');
      }
      setNota('');
      setGuardado(true);
      setTimeout(() => setGuardado(false), 1400);
    } finally {
      setSyncing(false);
    }
  }, [nota, tipo, items, est]);

  const borrarItem = React.useCallback(async (id) => {
    if (!id) return;
    setSyncing(true);
    try {
      if (fuente === 'backend') {
        const remoto = await eliminarBitacoraBackend(est, id);
        if (remoto && remoto.ok === true) {
          setItems(remoto.items || []);
          setSyncMsg('Registro eliminado de la bitácora oficial');
          return;
        }
      }
      const next = items.filter(x => x.id !== id);
      setItems(next);
      guardarBitacoraLocal(est, next);
      setFuente('local');
      setSyncMsg('Registro eliminado localmente.');
    } finally {
      setSyncing(false);
    }
  }, [items, est, fuente]);

  const recargarBitacora = React.useCallback(async () => {
    setSyncing(true);
    const resp = await listarBitacoraBackend(est);
    if (resp && resp.ok === true) {
      setItems(resp.items || []);
      setFuente('backend');
      setSyncMsg('Bitácora oficial actualizada');
    } else {
      setItems(leerBitacoraLocal(est));
      setFuente('local');
      setSyncMsg('No se pudo conectar con la bitácora oficial. El seguimiento queda temporalmente en este navegador.');
    }
    setSyncing(false);
  }, [est]);

  const copiarBitacora = React.useCallback(() => {
    const lines = [
      `BITÁCORA DE SEGUIMIENTO · ${nombre}`,
      `Código: ${codigo}`,
      `Teléfono: ${telefono}`,
      `Fuente: ${fuente === 'backend' ? 'oficial' : 'local'}`,
      `Alertas: ${flags.map(f => f.label).join(', ')}`,
      '',
      ...(items.length ? items.map((it, idx) => `${idx + 1}. ${formatFechaBitacora(it.fecha)} · ${it.tipo || 'General'} · ${it.nota || ''}`) : ['Sin registros.']),
    ];
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(lines.join('\n'));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1400);
    } catch (_) {}
  }, [items, nombre, codigo, telefono, flags, fuente]);

  const plantillas = [
    ['WA enviado', 'Se envió WhatsApp de seguimiento. Pendiente respuesta del estudiante.'],
    ['No respondió', 'Se intentó contactar al estudiante, pero no respondió. Reintentar seguimiento.'],
    ['Pago', 'Se dio seguimiento por estado de pago/mora. Pendiente confirmación administrativa.'],
    ['Académico', 'Se dio seguimiento académico por avance, asistencia o nota. Pendiente nueva revisión.'],
    ['CONAPE', 'Se revisó información CONAPE. Pendiente actualización/confirmación del expediente.'],
    ['Certificado', 'Se dio seguimiento al proceso de certificado. Validar pago, registro o PDF en Drive.'],
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ border:'1px solid var(--line,#e6e0d8)', borderRadius:14, padding:'14px 16px', background:'linear-gradient(135deg, white, color-mix(in srgb, var(--an-gold,#E5A823) 5%, white))' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:10, fontWeight:900, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3,#888)' }}>Bitácora de seguimiento</div>
            <div style={{ fontFamily:'var(--f-serif,serif)', fontSize:22, color:'var(--an-navy,#14213D)', fontWeight:700, marginTop:2 }}>Seguimiento del estudiante</div>
            <div style={{ fontSize:12, color:'var(--ink-2,#666)', marginTop:5, lineHeight:1.45 }}>
              {fuente === 'backend'
                ? 'Conectada a la bitácora oficial del Campus. Los registros quedan guardados de forma centralizada.'
                : 'Respaldo temporal en este navegador mientras la bitácora oficial no esté disponible.'}
            </div>
          </div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap', justifyContent:'flex-end' }}>
            <StatMini label="Registros" value={items.length} />
            <StatMini label="Código" value={codigo} />
            <StatMini label="Fuente" value={fuente === 'backend' ? 'Oficial' : 'Local'} />
          </div>
        </div>
        <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginTop:12, alignItems:'center' }}>
          {flags.map(f => <BitacoraFlag key={f.key} flag={f} />)}
          <button type="button" onClick={recargarBitacora} disabled={syncing} style={{ border:'1px solid rgba(20,33,61,.16)', background:'white', color:'var(--an-navy,#14213D)', borderRadius:999, padding:'5px 10px', fontSize:10.5, fontWeight:900, cursor: syncing ? 'wait' : 'pointer' }}>
            {syncing ? 'Sincronizando…' : 'Recargar'}
          </button>
        </div>
        {syncMsg ? <div style={{ marginTop:9, fontSize:11, color: fuente === 'backend' ? '#2E7D32' : '#9A6200', fontWeight:800 }}>{syncMsg}</div> : null}
      </div>

      <div style={{ border:'1px solid var(--line,#e6e0d8)', borderRadius:14, padding:'14px 16px', background:'white' }}>
        <div style={{ display:'grid', gridTemplateColumns:'minmax(150px, 210px) 1fr', gap:10, alignItems:'start' }}>
          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3,#888)', marginBottom:5 }}>Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ width:'100%', padding:'9px 10px', borderRadius:9, border:'1px solid var(--line,#ddd)', fontSize:12, fontWeight:800, background:'white' }}>
              {['General','WhatsApp','Llamada','Mora / pago','Académico / riesgo','CONAPE','Certificado'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3,#888)', marginBottom:5 }}>Nota rápida</label>
            <textarea value={nota} onChange={e => setNota(e.target.value)} placeholder="Ejemplo: Se contactó por WhatsApp, queda pendiente respuesta..." rows={3} style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1px solid var(--line,#ddd)', resize:'vertical', fontSize:12, lineHeight:1.45, fontFamily:'inherit' }} />
          </div>
        </div>
        <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginTop:10 }}>
          {plantillas.map(([label, texto]) => (
            <button key={label} type="button" onClick={() => setNota(texto)} style={{ border:'1px solid rgba(20,33,61,.14)', background:'var(--surface-2,#f8f8f8)', color:'var(--an-navy,#14213D)', borderRadius:999, padding:'5px 9px', fontSize:10.5, fontWeight:900, cursor:'pointer' }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap', marginTop:12, alignItems:'center' }}>
          <div style={{ fontSize:11.5, color:'var(--ink-3,#777)' }}>Teléfono: <strong>{telefono}</strong></div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
            <button type="button" onClick={copiarBitacora} style={{ border:'1px solid rgba(20,33,61,.20)', background:'white', color:'var(--an-navy,#14213D)', borderRadius:9, padding:'8px 12px', fontSize:11, fontWeight:900, cursor:'pointer' }}>
              {copiado ? 'Copiado ✓' : 'Copiar bitácora'}
            </button>
            <button type="button" onClick={agregar} disabled={!String(nota || '').trim() || syncing} style={{ border:'1px solid rgba(229,168,35,.45)', background: String(nota || '').trim() && !syncing ? 'var(--an-gold,#E5A823)' : 'rgba(229,168,35,.22)', color: String(nota || '').trim() && !syncing ? 'white' : '#9A6200', borderRadius:9, padding:'8px 13px', fontSize:11, fontWeight:900, cursor:String(nota || '').trim() && !syncing ? 'pointer' : 'not-allowed' }}>
              {guardado ? 'Guardado ✓' : (fuente === 'backend' ? 'Guardar nota oficial' : 'Guardar nota')}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {items.length === 0 ? (
          <div style={{ padding:'18px', textAlign:'center', color:'var(--ink-3,#888)', border:'1px dashed var(--line,#ddd)', borderRadius:12, background:'var(--surface-2,#fafafa)', fontSize:12 }}>
            Sin notas todavía. Agregá una nota rápida para documentar el seguimiento.
          </div>
        ) : items.map(it => {
          const c = tipoBitacoraColor(it.tipo);
          return (
            <div key={it.id} style={{ border:`1px solid ${c.bd}`, background:c.bg, borderRadius:12, padding:'11px 12px', display:'grid', gridTemplateColumns:'34px 1fr auto', gap:10, alignItems:'start' }}>
              <div style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,.65)', color:c.fg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize: c.icon === 'WA' ? 11 : 17 }}>{c.icon}</div>
              <div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                  <strong style={{ fontSize:12.5, color:c.fg }}>{it.tipo || 'General'}</strong>
                  <span style={{ fontSize:10.5, color:'var(--ink-3,#777)', fontWeight:800 }}>{formatFechaBitacora(it.fecha)}</span>
                  {it._backend ? <span style={{ fontSize:9.5, fontWeight:900, color:'#2E7D32', background:'rgba(46,125,50,.10)', border:'1px solid rgba(46,125,50,.18)', borderRadius:999, padding:'2px 6px' }}>OFICIAL</span> : null}
                </div>
                <div style={{ marginTop:4, fontSize:12, color:'var(--ink,#222)', lineHeight:1.45, whiteSpace:'pre-wrap' }}>{it.nota}</div>
              </div>
              <button type="button" onClick={() => borrarItem(it.id)} title="Eliminar registro" style={{ border:'none', background:'rgba(255,255,255,.65)', color:c.fg, borderRadius:8, width:28, height:28, cursor:'pointer', fontWeight:900 }}>×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── TAB PAGOS ─────────────────────────────────────────────────────────────
function TabPagosPanel({ pagosEst, niveles, detalle, onNavigate, est }) {
  const fmtCRC = n => '₡' + (n||0).toLocaleString('es-CR');
  const totalPagado = pagosEst.reduce((a, p) => a + (parseFloat(p.monto || p.pago || 0)), 0);

  const abrirPagoLocal = () => {
    sessionStorage.setItem('an_pago_prefill', JSON.stringify({
      codigo: String(est.codigo || est.rec_m || ''),
      nivel: detalle?.grupo?.NIVEL_ACTUAL_ID || 'B1',
    }));
    if (onNavigate) onNavigate('aplicar_pago');
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontFamily:'var(--f-serif, serif)', fontSize:20, fontWeight:500, color:'var(--an-navy-ink, #14213D)' }}>
          Historial de pagos
        </div>
        <button onClick={abrirPagoLocal} style={{
          padding:'8px 16px', borderRadius:'var(--r-md, 8px)',
          background:'var(--an-navy, #14213D)', color:'white',
          border:'none', fontWeight:700, fontSize:12, cursor:'pointer',
        }}>
          + Aplicar pago
        </button>
      </div>

      <div style={{ padding:'14px 18px', background:'color-mix(in srgb,#2E7D32 6%,white)', border:'1px solid color-mix(in srgb,#2E7D32 25%,white)', borderRadius:'var(--r-md, 8px)', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:12, color:'var(--ink-3, #999)', fontWeight:600 }}>Total pagado</div>
        <div style={{ fontFamily:'var(--f-serif, serif)', fontSize:22, fontWeight:500, color:'#2E7D32' }}>{fmtCRC(totalPagado)}</div>
      </div>

      {pagosEst.length === 0 ? (
        <div style={{ textAlign:'center', padding:'32px', color:'var(--ink-3, #999)', fontSize:13 }}>
          No hay pagos registrados.
        </div>
      ) : (
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:'var(--surface-2, #f5f5f5)' }}>
              {['Fecha','Recibo','Concepto','Grupo','Monto'].map(h => (
                <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--ink-3, #999)', letterSpacing:'0.08em', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagosEst.map((p, i) => (
              <tr key={i} style={{ borderBottom:'1px solid var(--line, #eee)' }}>
                <td style={{ padding:'8px 10px', color:'var(--ink-3, #999)' }}>{p.fecha || '—'}</td>
                <td style={{ padding:'8px 10px', fontFamily:'var(--f-mono, monospace)', fontSize:11 }}>{p.recibo || p.id || '—'}</td>
                <td style={{ padding:'8px 10px', fontWeight:500 }}>{p.concepto || p.descripcion || '—'}</td>
                <td style={{ padding:'8px 10px', fontSize:11, color:'var(--ink-3, #999)', fontFamily:'var(--f-mono, monospace)' }}>{p.grupo || '—'}</td>
                <td style={{ padding:'8px 10px', fontWeight:700, textAlign:'right', fontFamily:'var(--f-mono, monospace)', color:'#2E7D32' }}>
                  {fmtCRC(parseFloat(p.monto || p.pago || 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── TAB NOTAS ─────────────────────────────────────────────────────────────
function TabNotasPanel({ niveles, nivelActivo, est, detalle }) {
  const [tipoEval, setTipoEval] = React.useState('ORAL_1');
  const [nota100, setNota100] = React.useState('');
  const [comentario, setComentario] = React.useState('');
  const [guardando, setGuardando] = React.useState(false);
  const [resultado, setResultado] = React.useState(null);
  const [resumenF29, setResumenF29] = React.useState(null);

  const hActivo = niveles?.[nivelActivo] || {};
  const codigoEst = est?.codigo || est?.rec_m || detalle?.codigo || detalle?.CODIGO || '';
  const grupoActual = hActivo.grupo || hActivo.GRUPO || detalle?.grupo?.COD_GRUPO || detalle?.grupo?.GRUPO || est?.grupo || est?.cod_grupo || '';
  const programaTxt = String(hActivo.programa || hActivo.PROGRAMA || detalle?.grupo?.PROGRAMA || detalle?.grupo?.PLAN || est?.programa || est?.convenio || '').toUpperCase();
  const esINA = programaTxt.includes('INA') && !programaTxt.includes('SIN');

  const opciones = [
    ['ORAL_1', 'Oral 1', 15, 'L9'],
    ['ORAL_2', 'Oral 2', 15, 'L17'],
    ['ORAL_3', 'Oral 3', 15, 'L25'],
    ['ORAL_4', 'Oral 4', 15, 'L31'],
    ['ESCRITO_1', 'Escrito 1', esINA ? 5 : 15, 'L18'],
    ['ESCRITO_2', 'Escrito 2', esINA ? 5 : 15, 'L32'],
    ['SOCIAL', 'Social Skill', 10, 'Conducta/asistencia'],
  ];
  const optActual = opciones.find(o => o[0] === tipoEval) || opciones[0];
  const maxActual = optActual[2];
  const notaNum = Number(nota100);
  const puntosCalc = Number.isFinite(notaNum) && notaNum >= 0 ? Math.round((Math.min(100, Math.max(0, notaNum)) * maxActual / 100) * 100) / 100 : '';

  const componentesActuales = [
    ['ORAL_1', 'Oral 1', hActivo.o1, 15],
    ['ORAL_2', 'Oral 2', hActivo.o2, 15],
    ['ORAL_3', 'Oral 3', hActivo.o3, 15],
    ['ORAL_4', 'Oral 4', hActivo.o4, 15],
    ['ESCRITO_1', 'Escrito 1', hActivo.e1, esINA ? 5 : 15],
    ['ESCRITO_2', 'Escrito 2', hActivo.e2, esINA ? 5 : 15],
    ['SOCIAL', 'Social', hActivo.s1, 10],
  ];
  const totalActual = componentesActuales.reduce((a, c) => a + (Number(c[2]) || 0), 0);

  React.useEffect(() => {
    let vivo = true;
    setResumenF29(null);
    if (!codigoEst || !nivelActivo) return undefined;
    postAdminStudents('getResumenNotasOficialesEstudiante', {
      codigo: codigoEst,
      cod_estudiante: codigoEst,
      grupo: grupoActual,
      nivel: nivelActivo,
    }).then(r => {
      if (!vivo) return;
      if (r && r.ok) setResumenF29(r);
    }).catch(() => {});
    return () => { vivo = false; };
  }, [codigoEst, grupoActual, nivelActivo]);

  const guardarNotaOficial = async () => {
    if (!codigoEst || !nivelActivo || !grupoActual) {
      setResultado({ ok:false, error:'Faltan código, grupo o nivel para guardar.' });
      return;
    }
    if (!Number.isFinite(notaNum) || notaNum < 0 || notaNum > 100) {
      setResultado({ ok:false, error:'Digite una nota válida de 0 a 100.' });
      return;
    }
    setGuardando(true);
    setResultado(null);
    const payload = {
      codigo: codigoEst,
      cod_estudiante: codigoEst,
      cedula: est?.cedula || detalle?.cedula || '',
      nombre: est?.nombre || detalle?.nombre || '',
      grupo: grupoActual,
      nivel: nivelActivo,
      tipo_eval: tipoEval,
      nota_100: notaNum,
      max_puntos: maxActual,
      programa: esINA ? 'INA' : 'SIN_INA',
      comentario,
    };
    try {
      let r = await postAdminStudents('registrarNotaComponenteOficial', payload);
      if (!r || (!r.ok && String(r.error || '').includes('no reconocida'))) {
        r = await postAdminStudents('registrarNotaEstatus', { ...payload, nota: puntosCalc });
      }
      setResultado(r);
      if (r && r.ok) {
        setNota100('');
        setComentario('');
        try {
          const resumen = await postAdminStudents('getResumenNotasOficialesEstudiante', payload);
          if (resumen && resumen.ok) setResumenF29(resumen);
        } catch (_) {}
      }
    } catch (e) {
      setResultado({ ok:false, error:adminStudentsSafeUserError(e?.message || String(e), 'No se pudo guardar la calificación. Intentá de nuevo.', 'guardar_calificacion') });
    } finally {
      setGuardando(false);
    }
  };

  const resumenComponentes = resumenF29?.componentes || null;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'flex-start', marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:'var(--f-serif, serif)', fontSize:20, fontWeight:500, color:'var(--an-navy-ink, #14213D)' }}>
            Notas por nivel
          </div>
          <div style={{ fontSize:11, color:'var(--ink-3,#777)', marginTop:3 }}>
            F29: orales y Social Skill pueden guardarse como componente oficial. Escritos vienen de exámenes revisados, pero quedan visibles para control.
          </div>
        </div>
        <div style={{ textAlign:'right', minWidth:110 }}>
          <div style={{ fontSize:10, fontWeight:900, color:'var(--ink-3,#777)', textTransform:'uppercase', letterSpacing:'.08em' }}>Nota actual</div>
          <div style={{ fontFamily:'var(--f-serif, serif)', fontSize:28, color: totalActual >= 70 ? '#2E7D32' : totalActual > 0 ? '#C00000' : 'var(--ink-3,#999)', lineHeight:1 }}>
            {totalActual > 0 ? Math.round(totalActual * 10) / 10 : '—'}
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12, marginBottom:16 }}>
        {NIVEL_ORDER_P.map(niv => {
          const h = niveles[niv];
          const c = NIVEL_COLOR_P[niv];
          const esActivo = niv === nivelActivo;
          return (
            <div key={niv} style={{
              border:`2px solid ${h ? c : 'var(--line, #eee)'}`,
              borderRadius:'var(--r-lg, 12px)', padding:'16px 18px',
              background: h ? `color-mix(in srgb, ${c} 4%, white)` : 'var(--surface-2, #f9f9f9)',
              opacity: h ? 1 : 0.5,
              position:'relative',
            }}>
              {esActivo && (
                <div style={{ position:'absolute', top:8, right:8, fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', background:c, color:'white', padding:'2px 7px', borderRadius:999 }}>
                  Activo
                </div>
              )}
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:c, marginBottom:8 }}>
                {NIVEL_LABEL_P[niv]}
              </div>
              {h ? (
                <React.Fragment>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12 }}>
                    <div style={{ fontFamily:'var(--f-serif, serif)', fontSize:38, fontWeight:500, color:c, lineHeight:1, letterSpacing:'-0.04em' }}>
                      {h.nota > 0 ? h.nota : '—'}
                    </div>
                    {h.nota > 0 && <div style={{ fontSize:12, color:'var(--ink-3, #999)', fontWeight:600 }}>/100</div>}
                  </div>
                  {[
                    { label:'Oral 1 (L9)',    val: h.o1, max:15 },
                    { label:'Oral 2 (L17)',   val: h.o2, max:15 },
                    { label:'Oral 3 (L25)',   val: h.o3, max:15 },
                    { label:'Oral 4 (L31)',   val: h.o4, max:15 },
                    { label:'Escrito 1',      val: h.e1, max: esINA ? 5 : 15 },
                    { label:'Escrito 2',      val: h.e2, max: esINA ? 5 : 15 },
                    { label:'Social',         val: h.s1, max:10 },
                  ].filter(e => Number(e.val) > 0).map(({ label, val, max }) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                      <span style={{ color:'var(--ink-3, #999)' }}>{label}</span>
                      <span style={{ fontFamily:'var(--f-mono, monospace)', fontWeight:700, color: val >= (max*0.7) ? '#2E7D32' : '#C00000' }}>
                        {val}/{max}
                      </span>
                    </div>
                  ))}
                  <div style={{ fontSize:10, color:'var(--ink-3, #999)', marginTop:8, fontFamily:'var(--f-mono, monospace)' }}>
                    Estatus: <strong>{h.estatus || '—'}</strong>
                    {h.cert && <span style={{ marginLeft:8, color:'#2E7D32' }}>🏅 {h.cert}</span>}
                  </div>
                </React.Fragment>
              ) : (
                <div style={{ fontSize:12, color:'var(--ink-3, #999)', fontStyle:'italic' }}>Sin registro aún.</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ border:'1px solid rgba(20,33,61,.14)', borderRadius:14, padding:14, background:'linear-gradient(135deg,rgba(20,33,61,.035),rgba(229,168,35,.06))' }}>
        <div style={{ display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap', alignItems:'flex-start', marginBottom:12 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:900, color:'var(--an-navy,#14213D)' }}>Registro oficial de componente</div>
            <div style={{ fontSize:11, color:'var(--ink-3,#777)', marginTop:2 }}>
              Convierte la nota 0–100 al peso real del componente y actualiza el registro académico.
            </div>
          </div>
          <div style={{ fontSize:10.5, fontWeight:900, color: esINA ? '#1565C0' : '#7A4B00', background: esINA ? '#E3F2FD' : '#FFF8E1', border:`1px solid ${esINA ? '#B9DAF5' : '#F1D18A'}`, borderRadius:999, padding:'4px 9px' }}>
            {esINA ? 'CON INA' : 'SIN INA'}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1.2fr .8fr .8fr', gap:10, alignItems:'end' }}>
          <label style={{ fontSize:11, fontWeight:800, color:'var(--ink-2,#555)' }}>
            Componente
            <select value={tipoEval} onChange={e => setTipoEval(e.target.value)} style={{ width:'100%', marginTop:5, padding:'9px 10px', borderRadius:9, border:'1px solid var(--line,#ddd)', background:'white', fontWeight:800 }}>
              {opciones.map(o => <option key={o[0]} value={o[0]}>{o[1]} · máx. {o[2]} pts · {o[3]}</option>)}
            </select>
          </label>
          <label style={{ fontSize:11, fontWeight:800, color:'var(--ink-2,#555)' }}>
            Nota 0–100
            <input value={nota100} onChange={e => setNota100(e.target.value)} type="number" min="0" max="100" step="0.01" placeholder="Ej. 86" style={{ width:'100%', marginTop:5, padding:'9px 10px', borderRadius:9, border:'1px solid var(--line,#ddd)', fontWeight:900 }} />
          </label>
          <div style={{ padding:'9px 10px', borderRadius:9, border:'1px solid rgba(46,125,50,.18)', background:'rgba(46,125,50,.07)' }}>
            <div style={{ fontSize:10, fontWeight:900, color:'#2E7D32', textTransform:'uppercase', letterSpacing:'.08em' }}>Puntos</div>
            <div style={{ fontFamily:'var(--f-mono,monospace)', fontWeight:900, color:'#2E7D32' }}>{puntosCalc === '' ? '—' : `${puntosCalc}/${maxActual}`}</div>
          </div>
        </div>

        <textarea value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Comentario opcional para seguimiento académico…" rows={2} style={{ width:'100%', marginTop:10, padding:'9px 10px', borderRadius:9, border:'1px solid var(--line,#ddd)', resize:'vertical', fontFamily:'inherit', fontSize:12 }} />

        <div style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'center', marginTop:10, flexWrap:'wrap' }}>
          <div style={{ fontSize:10.5, color:'var(--ink-3,#777)' }}>
            Nivel: <strong>{nivelActivo}</strong> · Grupo: <strong>{grupoActual || '—'}</strong> · Código: <strong>{codigoEst || '—'}</strong>
          </div>
          <button type="button" onClick={guardarNotaOficial} disabled={guardando || !codigoEst || !grupoActual || !nivelActivo} style={{ border:'none', background:'var(--an-navy,#14213D)', color:'white', borderRadius:9, padding:'9px 14px', fontSize:11, fontWeight:900, cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? .7 : 1 }}>
            {guardando ? 'Guardando…' : 'Guardar nota oficial'}
          </button>
        </div>

        {resultado && (
          <div style={{ marginTop:10, padding:'9px 11px', borderRadius:10, background: resultado.ok ? '#E8F5E9' : '#FFEBEE', border:`1px solid ${resultado.ok ? '#BFE4C3' : '#F4B7B7'}`, color: resultado.ok ? '#2E7D32' : '#C62828', fontSize:12, fontWeight:800 }}>
            {resultado.ok ? `✅ Guardado. ${resultado.tipo_eval || tipoEval}: ${resultado.puntos ?? puntosCalc} pts. Total: ${resultado.nota_total ?? resultado.total ?? 'actualizado'}` : `❌ ${adminStudentsSafeUserError(resultado.error || resultado.mensaje, 'No se pudo guardar. Intentá de nuevo.', 'resultado_calificacion')}`}
          </div>
        )}

        {resumenComponentes && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
            {Object.entries(resumenComponentes).map(([k, v]) => (
              <span key={k} style={{ fontSize:10.5, fontWeight:900, border:'1px solid rgba(20,33,61,.12)', background:'white', borderRadius:999, padding:'4px 8px', color:'var(--ink-2,#555)' }}>
                {k}: {v?.puntos || 0}/{v?.max || '—'}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabAsistenciaPanel({ est, detalle }) {
  const [asistencia, setAsistencia] = React.useState(null);
  const [cargando, setCargando]     = React.useState(true);

  React.useEffect(() => {
    const codigo = est.codigo || est.rec_m;
    if (!codigo) return;
    postAdminStudents('getAsistenciaEstudiante', { codigo })
      .then(d => { if (d.ok) setAsistencia(d.asistencia || []); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [est.codigo, est.rec_m]);

  if (cargando) return <div style={{ padding:'20px', textAlign:'center', color:'var(--ink-3, #999)', fontSize:13 }}>⏳ Cargando asistencia…</div>;

  if (!asistencia || asistencia.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'40px', color:'var(--ink-3, #999)' }}>
        <div style={{ fontSize:36, marginBottom:10 }}>📅</div>
        <div style={{ fontSize:13 }}>No hay registros de asistencia aún.</div>
      </div>
    );
  }

  const total     = asistencia.length;
  const presentes = asistencia.filter(a => a.presente === true || a.presente === 'TRUE').length;
  const pct       = Math.round((presentes / total) * 100);
  const colorPct  = pct >= 85 ? '#2E7D32' : pct >= 70 ? '#C67100' : '#C00000';

  return (
    <div>
      <div style={{ fontFamily:'var(--f-serif, serif)', fontSize:20, fontWeight:500, color:'var(--an-navy-ink, #14213D)', marginBottom:16 }}>
        Asistencia
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'Lecciones', val: total },
          { label:'Presentes', val: presentes },
          { label:'Asistencia', val: `${pct}%`, color: colorPct },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ padding:'14px 16px', background:'var(--surface-2, #f9f9f9)', border:'1px solid var(--line, #eee)', borderRadius:'var(--r-md, 8px)', textAlign:'center' }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3, #999)', marginBottom:6 }}>{label}</div>
            <div style={{ fontFamily:'var(--f-serif, serif)', fontSize:26, fontWeight:500, color: color || 'var(--an-navy-ink, #14213D)' }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ height:8, background:'var(--line, #eee)', borderRadius:4, marginBottom:20, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background: colorPct, borderRadius:4, transition:'width 0.5s' }} />
      </div>

      <div style={{ fontWeight:700, fontSize:12, color:'var(--ink-3, #999)', marginBottom:10, letterSpacing:'0.08em', textTransform:'uppercase' }}>
        Detalle por lección
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {asistencia.map((a, i) => {
          const presente = a.presente === true || a.presente === 'TRUE';
          const comentario = a.comentario || a.retroalimentacion || '';
          return (
            <div key={i} style={{
              display:'grid', gridTemplateColumns:'auto auto 1fr',
              gap:10, alignItems:'flex-start',
              padding:'10px 14px',
              background: presente ? 'color-mix(in srgb,#2E7D32 4%,white)' : 'color-mix(in srgb,#C00000 4%,white)',
              border:`1px solid ${presente ? 'color-mix(in srgb,#2E7D32 20%,white)' : 'color-mix(in srgb,#C00000 15%,white)'}`,
              borderRadius:'var(--r-md, 8px)',
            }}>
              <div style={{ fontSize:11, fontWeight:700, fontFamily:'var(--f-mono, monospace)', color:'var(--ink-3, #999)', minWidth:24 }}>
                #{a.leccion_num || (i+1)}
              </div>
              <div style={{
                padding:'2px 8px', borderRadius:999, fontSize:10, fontWeight:700,
                background: presente ? '#2E7D32' : '#C00000',
                color:'white', whiteSpace:'nowrap',
              }}>
                {presente ? '✓ Presente' : '✗ Ausente'}
              </div>
              <div>
                {a.fecha_leccion && (
                  <div style={{ fontSize:11, color:'var(--ink-3, #999)', marginBottom: comentario ? 3 : 0 }}>
                    {a.fecha_leccion}
                  </div>
                )}
                {comentario && (
                  <div style={{ fontSize:11, color:'var(--ink-2, #555)', lineHeight:1.4 }}>
                    {comentario}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── TAB DOCUMENTOS ────────────────────────────────────────────────────────
function TabDocumentosPanel({ est, detalle, nivelActivo, niveles }) {
  const NIVEL_LABEL_D = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
  const NIVEL_COLOR_D = { B1:'#E5A823', B2:'#E8372A', I1:'#2B7FC1', I2:'#4CAF50' };
  const ORDEN_NIVELES_D = ['B1','B2','I1','I2'];
  const nivelesSeguros = niveles || {};

  const nivelAntMap  = { B1:null, B2:'B1', I1:'B2', I2:'I1' };
  const nivAnt       = nivelAntMap[nivelActivo];
  const estatusAnt   = nivAnt ? String(nivelesSeguros[nivAnt]?.estatus || '').toUpperCase() : null;

  // F98.3-C: cada certificado se resuelve exclusivamente desde la fila del
  // nivel seleccionado. Nunca se hereda el número de la fila/table activa.
  const nivelesConFila = ORDEN_NIVELES_D.filter(n => nivelesSeguros[n] && typeof nivelesSeguros[n] === 'object');
  const firmaCertificados = nivelesConFila.map(n => `${n}:${certRegistroEstudiante(nivelesSeguros[n])}`).join('|');
  const nivelCertDefault = (() => {
    const registrados = nivelesConFila.filter(n => !!certRegistroEstudiante(nivelesSeguros[n]));
    if (registrados.length) return registrados[registrados.length - 1];
    if (nivelesConFila.includes(nivelActivo)) return nivelActivo;
    return nivelesConFila[0] || nivelActivo || 'B1';
  })();
  const [nivelCert, setNivelCert] = React.useState(nivelCertDefault);

  React.useEffect(() => {
    const registrados = nivelesConFila.filter(n => !!certRegistroEstudiante(nivelesSeguros[n]));
    const proximo = registrados.length
      ? registrados[registrados.length - 1]
      : (nivelesConFila.includes(nivelActivo) ? nivelActivo : (nivelesConFila[0] || nivelActivo || 'B1'));
    setNivelCert(proximo);
  }, [est?.codigo, est?.rec_m, nivelActivo, firmaCertificados]);

  const nivelInfoCert = nivelesSeguros[nivelCert] || {};
  const estatusCert   = String(nivelInfoCert.estatus || '').toUpperCase();
  const certNum       = certRegistroEstudiante(nivelInfoCert);
  const certPago      = certPagoEstudiante(nivelInfoCert);
  const certState     = certVisualState({ estatus: estatusCert, certPago, certNum });
  const grupoCert     = String(nivelInfoCert.grupo || detalle?.cod_grupo || est.grupo || '').trim();
  const certKey       = `CERTIFICACION_${nivelCert}`;

  const docs = [
    {
      tipo: 'CERTIFICADO',
      titulo: 'Documento de Inscripción',
      desc: 'Constancia oficial de matrícula al programa. Incluye nivel, horario y lineamientos.',
      icono: '📋', color: '#2B7FC1',
      ok: !!detalle,
      razon: !detalle ? 'Cargando datos…' : null,
    },
    {
      tipo: 'MATRICULA_2',
      titulo: 'Carta No Deuda CONAPE',
      desc: `Requerida por CONAPE para ${NIVEL_LABEL_D[nivelActivo] || nivelActivo}. Requiere nivel anterior aprobado.`,
      icono: '🏦', color: '#4CAF50',
      ok: !!nivAnt && (estatusAnt === 'APR' || estatusAnt === 'CNV'),
      razon: !detalle ? 'Cargando…' : !nivAnt ? 'No aplica para Básico I' : (estatusAnt !== 'APR' && estatusAnt !== 'CNV') ? `${nivAnt} debe estar APR o CNV (actual: ${estatusAnt || '—'})` : null,
    },
  ];

  const [gen, setGen] = React.useState({});
  const [res, setRes] = React.useState({});

  const generarDocumentoComun = async (tipo) => {
    if (gen[tipo]) return;
    setGen(g => ({...g, [tipo]: true}));
    setRes(r => ({...r, [tipo]: null}));
    try {
      const token = window.getSessionToken ? window.getSessionToken() : '';
      const resp = await fetch(SCRIPT_URL_AS, {
        method:'POST',
        headers:{ 'Content-Type':'text/plain' },
        body: JSON.stringify({ fn:'generarDocumento', token, tipo, codigo: String(est.codigo || est.rec_m || ''), nivel: nivelActivo }),
      });
      const data = await resp.json();
      setRes(r => ({...r, [tipo]: data.ok ? { url:data.url, nombre:data.nombre } : { error:data.error || data.mensaje }}));
    } catch(e) {
      setRes(r => ({...r, [tipo]: { error:'Error de conexión' }}));
    } finally {
      setGen(g => ({...g, [tipo]: false}));
    }
  };

  const buscarCertificado = async () => {
    if (gen[certKey] || !certNum) return;
    setGen(g => ({...g, [certKey]: true}));
    setRes(r => ({...r, [certKey]: null}));
    try {
      const data = await postAdminStudents('buscarCertificadoExistente', {
        codigo: String(est.codigo || est.rec_m || ''),
        nivel: nivelCert,
        grupo: grupoCert,
        registro: certNum,
      });
      if (data.ok) {
        setRes(r => ({...r, [certKey]: { url:data.url, nombre:data.nombre, mensaje:data.mensaje }}));
        if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        setRes(r => ({...r, [certKey]: { error:data.mensaje || data.error, search_url:data.search_url }}));
      }
    } catch(e) {
      setRes(r => ({...r, [certKey]: { error:'Error de conexión' }}));
    } finally {
      setGen(g => ({...g, [certKey]: false}));
    }
  };

  const regenerarCertificadoMismoRegistro = async () => {
    if (gen[certKey] || !certNum) return;
    const confirmar = window.confirm(
      `Se volverá a crear el PDF de ${NIVEL_LABEL_D[nivelCert] || nivelCert} con el registro ${certNum}.\n\n` +
      'El sistema comprueba que el número de certificado corresponde exactamente al nivel seleccionado. No se cambiará el estado académico ni se generará un número nuevo.\n\n¿Continuar?'
    );
    if (!confirmar) return;
    setGen(g => ({...g, [certKey]: true}));
    setRes(r => ({...r, [certKey]: null}));
    try {
      const data = await postAdminStudents('generarCertificado', {
        codigo: String(est.codigo || est.rec_m || ''),
        nivel: nivelCert,
        grupo: grupoCert,
        registro_esperado: certNum,
        forzar_generar: true,
      });
      if (data && data.ok) {
        setRes(r => ({...r, [certKey]: { url:data.url, nombre:data.nombre, mensaje:data.mensaje }}));
        if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        setRes(r => ({...r, [certKey]: { error:(data && (data.mensaje || data.error)) || 'No se pudo regenerar el certificado.' }}));
      }
    } catch(e) {
      setRes(r => ({...r, [certKey]: { error:'Error de conexión' }}));
    } finally {
      setGen(g => ({...g, [certKey]: false}));
    }
  };

  const generarCertificadoNuevo = async () => {
    if (gen[certKey] || !certState.canCrear) return;
    const confirmar = window.confirm(
      `Generar por primera vez el certificado de ${NIVEL_LABEL_D[nivelCert] || nivelCert}.\n\n` +
      `Estado: ${estatusCert || '—'} · Pago de certificado: ${certPago ? 'Sí' : 'No'}\n\n¿Continuar?`
    );
    if (!confirmar) return;
    setGen(g => ({...g, [certKey]: true}));
    setRes(r => ({...r, [certKey]: null}));
    try {
      const data = await postAdminStudents('generarCertificado', {
        codigo: String(est.codigo || est.rec_m || ''),
        nivel: nivelCert,
        grupo: grupoCert,
      });
      if (data && data.ok) {
        setRes(r => ({...r, [certKey]: { url:data.url, nombre:data.nombre, mensaje:data.mensaje }}));
        if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        setRes(r => ({...r, [certKey]: { error:(data && (data.mensaje || data.error)) || 'No se pudo generar el certificado.' }}));
      }
    } catch(e) {
      setRes(r => ({...r, [certKey]: { error:'Error de conexión' }}));
    } finally {
      setGen(g => ({...g, [certKey]: false}));
    }
  };

  const certResult = res[certKey];
  const certLoading = !!gen[certKey];
  const certColor = NIVEL_COLOR_D[nivelCert] || '#E5A823';

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, fontSize:13, color:'var(--ink-3, #999)' }}>
        Nivel activo:
        <span style={{ padding:'3px 12px', borderRadius:999, fontWeight:700, fontSize:12, background:`color-mix(in srgb, ${NIVEL_COLOR_D[nivelActivo]} 14%, white)`, color: NIVEL_COLOR_D[nivelActivo] }}>
          {NIVEL_LABEL_D[nivelActivo] || nivelActivo}
        </span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {docs.map(({ tipo, titulo, desc, icono, color, ok, razon }) => {
          const r = res[tipo]; const cargando = gen[tipo];
          return (
            <div key={tipo} style={{
              border:`2px solid ${ok ? color : 'var(--line, #eee)'}`,
              borderRadius:'var(--r-lg, 12px)', padding:'16px 18px',
              background: ok ? `color-mix(in srgb, ${color} 4%, white)` : 'var(--surface-2, #f9f9f9)',
              opacity: ok ? 1 : 0.65,
            }}>
              <div style={{ display:'grid', gridTemplateColumns:'40px 1fr auto', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:40, height:40, borderRadius:'var(--r-md, 8px)', background:`color-mix(in srgb, ${color} 15%, white)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{icono}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:3 }}>{titulo}</div>
                  <div style={{ fontSize:11, color:'var(--ink-3, #999)', lineHeight:1.4 }}>{desc}</div>
                  {razon && <div style={{ marginTop:6, fontSize:11, color:'#C67100', fontWeight:600, padding:'2px 8px', background:'color-mix(in srgb,#E5A823 10%,white)', borderRadius:5, display:'inline-block' }}>🔒 {razon}</div>}
                  {r?.url && <div style={{ marginTop:8, padding:'8px 12px', background:'color-mix(in srgb,#2E7D32 8%,white)', border:'1px solid #2E7D32', borderRadius:'var(--r-md, 8px)', display:'flex', alignItems:'center', gap:8 }}><span>✅</span><div style={{ flex:1 }}><div style={{ fontSize:11, fontWeight:700, color:'#2E7D32' }}>PDF generado</div><div style={{ fontSize:10, color:'var(--ink-3, #999)' }}>{r.nombre}</div></div><a href={r.url} target="_blank" rel="noreferrer" style={{ padding:'4px 12px', borderRadius:5, background:'#2E7D32', color:'white', fontSize:11, fontWeight:700, textDecoration:'none' }}>Abrir</a></div>}
                  {r?.error && <div style={{ marginTop:6, padding:'6px 10px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md, 8px)', fontSize:11, color:'#8B0000' }}>❌ {r.error}</div>}
                </div>
                <button disabled={!ok || cargando} onClick={() => generarDocumentoComun(tipo)} style={{ padding:'8px 14px', borderRadius:'var(--r-md, 8px)', border:`2px solid ${ok ? color : 'var(--line, #eee)'}`, background: ok ? color : 'var(--surface-3, #eee)', color: ok ? 'white' : 'var(--ink-3, #999)', fontWeight:700, fontSize:11, cursor: ok && !cargando ? 'pointer' : 'not-allowed', whiteSpace:'nowrap', opacity:cargando?0.7:1 }}>{cargando ? '⏳…' : 'Generar'}</button>
              </div>
            </div>
          );
        })}

        <div style={{ border:`2px solid ${certColor}`, borderRadius:'var(--r-lg, 12px)', padding:'16px 18px', background:`color-mix(in srgb, ${certColor} 4%, white)` }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
            <span style={{ fontSize:11, color:'var(--ink-3,#777)', fontWeight:700 }}>Certificado correspondiente a:</span>
            {nivelesConFila.map(n => {
              const reg = certRegistroEstudiante(nivelesSeguros[n]);
              const selected = n === nivelCert;
              return <button key={n} type="button" onClick={() => setNivelCert(n)} style={{ padding:'5px 10px', borderRadius:999, border:`1px solid ${NIVEL_COLOR_D[n]}`, background:selected ? NIVEL_COLOR_D[n] : 'white', color:selected ? 'white' : NIVEL_COLOR_D[n], fontSize:10.5, fontWeight:800, cursor:'pointer' }}>{reg ? '✓ ' : ''}{NIVEL_LABEL_D[n] || n}</button>;
            })}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'40px 1fr auto', gap:12, alignItems:'flex-start' }}>
            <div style={{ width:40, height:40, borderRadius:'var(--r-md, 8px)', background:`color-mix(in srgb, ${certColor} 15%, white)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🏅</div>
            <div>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:3 }}>Certificación de Nivel — {NIVEL_LABEL_D[nivelCert] || nivelCert}</div>
              <div style={{ fontSize:11, color:'var(--ink-3, #777)', lineHeight:1.45 }}>
                {certNum
                  ? `Registro oficial de ${nivelCert}: ${certNum}. Las acciones siguientes operan únicamente sobre este nivel.`
                  : `Estado ${nivelCert}: ${estatusCert || '—'}. ${certState.sub}.`}
              </div>
              <div style={{ marginTop:8 }}><CertificadoEstadoBox state={certState} /></div>
              {!certNum && certState.hint && <div style={{ marginTop:6, fontSize:11, color:'#C67100', fontWeight:600, padding:'2px 8px', background:'color-mix(in srgb,#E5A823 10%,white)', borderRadius:5, display:'inline-block' }}>🔒 {certState.hint}</div>}
              {certResult?.url && <div style={{ marginTop:8, padding:'8px 12px', background:'color-mix(in srgb,#2E7D32 8%,white)', border:'1px solid #2E7D32', borderRadius:'var(--r-md, 8px)', display:'flex', alignItems:'center', gap:8 }}><span>✅</span><div style={{ flex:1 }}><div style={{ fontSize:11, fontWeight:700, color:'#2E7D32' }}>{certResult.mensaje || `PDF de ${nivelCert} listo`}</div><div style={{ fontSize:10, color:'var(--ink-3, #999)' }}>{certResult.nombre}</div></div><a href={certResult.url} target="_blank" rel="noreferrer" style={{ padding:'4px 12px', borderRadius:5, background:'#2E7D32', color:'white', fontSize:11, fontWeight:700, textDecoration:'none' }}>Abrir</a></div>}
              {certResult?.error && <div style={{ marginTop:6, padding:'8px 10px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md, 8px)', fontSize:11, color:'#8B0000' }}>❌ {certResult.error}{certResult.search_url && <a href={certResult.search_url} target="_blank" rel="noreferrer" style={{ marginLeft:8, color:'#8B0000', fontWeight:800 }}>Buscar en Drive</a>}</div>}
            </div>
            {certNum ? (
              <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'stretch' }}>
                <button type="button" onClick={buscarCertificado} disabled={certLoading} title={`Abre exclusivamente el PDF de ${nivelCert} registrado como ${certNum}.`} style={{ padding:'8px 14px', borderRadius:'var(--r-md, 8px)', border:`2px solid ${certColor}`, background:certColor, color:'white', fontWeight:700, fontSize:11, cursor:certLoading?'wait':'pointer', whiteSpace:'nowrap', opacity:certLoading?0.7:1 }}>{certLoading ? 'Procesando…' : `Ver PDF ${nivelCert}`}</button>
                <button type="button" onClick={regenerarCertificadoMismoRegistro} disabled={certLoading} title={`Regenera únicamente ${nivelCert} usando ${certNum}.`} style={{ padding:'7px 10px', borderRadius:'var(--r-md, 8px)', border:`1px solid ${certColor}`, background:'white', color:certColor, fontWeight:800, fontSize:10.5, cursor:certLoading?'wait':'pointer', whiteSpace:'nowrap', opacity:certLoading?0.7:1 }}>♻ Regenerar {nivelCert}</button>
              </div>
            ) : (
              <button type="button" onClick={generarCertificadoNuevo} disabled={!certState.canCrear || certLoading} style={{ padding:'8px 14px', borderRadius:'var(--r-md, 8px)', border:`2px solid ${certState.canCrear ? certColor : 'var(--line,#ddd)'}`, background:certState.canCrear ? certColor : 'var(--surface-3,#eee)', color:certState.canCrear ? 'white' : 'var(--ink-3,#999)', fontWeight:700, fontSize:11, cursor:certState.canCrear && !certLoading ? 'pointer' : 'not-allowed', whiteSpace:'nowrap', opacity:certLoading?0.7:1 }}>{certLoading ? 'Procesando…' : `Generar ${nivelCert}`}</button>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop:14, fontSize:11, color:'var(--ink-3, #777)', padding:'10px 14px', background:'var(--surface-2, #f9f9f9)', borderRadius:'var(--r-md, 8px)' }}>
        El nivel activo y el nivel del certificado son datos distintos. Cada botón comprueba que el número de certificado corresponde a la fila académica seleccionada antes de abrir o regenerar el PDF.
      </div>
    </div>
  );
}



// ─────────────────────────────────────────────────────────────────────────
// F98.4-Z6-BD · FICHA INDIVIDUAL CON COMPROBANTES REALES POR NIVEL
// - Consulta ubicada antes del calendario.
// - Estado académico y morosidad aparecen juntos.
// - Cada nivel despliega sus movimientos reales de matrícula, cuotas y certificado.
// - OTROS_PAGOS.ncuenta 60–63 se reconoce como matrícula B1/B2/I1/I2.
// ─────────────────────────────────────────────────────────────────────────
function agIndNorm(v) {
  return String(v == null ? '' : v).trim();
}
function agIndGrupoCorto(grupo) {
  const p = agIndNorm(grupo).split('-').filter(Boolean);
  return p.length >= 2 ? p.slice(-2).join('-') : agIndNorm(grupo);
}
function agIndUpper(v) {
  return agIndNorm(v).toUpperCase();
}
function agIndPlain(v) {
  return agIndUpper(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function agIndPresente(v) {
  const n = agIndUpper(v);
  return v === true || Number(v) === 1 || n === 'TRUE' || n === 'SI' || n === 'PRESENTE' || n === 'P';
}
function agIndMoroso(nivelData, pendienteData) {
  const estatus = agIndUpper(nivelData?.estatus || pendienteData?.estatus);
  if (!estatus || estatus === 'PE' || estatus === 'CNV') return false;
  if (pendienteData?.mora_exigible != null) return Number(pendienteData.mora_exigible || 0) > 0;
  const mat = Number(pendienteData?.matricula_pend || 0) || 0;
  const cuotas = Number(pendienteData?.cuotas_pend || 0) || 0;
  const cert = Number(pendienteData?.cert_pend || 0) || 0;
  const programa = Number(pendienteData?.programa_completo_pend ?? pendienteData?.titulo_pend ?? 0) || 0;
  const toeic = Number(pendienteData?.toeic_pend || 0) || 0;
  if (estatus === 'APR') return mat > 0 || cuotas > 0 || cert > 0 || programa > 0 || toeic > 0;
  return mat > 0 || cuotas > 0 || toeic > 0 || (agIndUpper(nivelData?.nivel)==='I2' && (cert > 0 || programa > 0));
}
function agIndAsistenciaNivel(rows, nivel, grupo) {
  const nv = agIndUpper(nivel);
  const gp = agIndUpper(grupo);
  const filtradas = (rows || []).filter(r => {
    const rn = agIndUpper(r?.nivel || r?.NIVEL);
    const rg = agIndUpper(r?.cod_grupo || r?.COD_GRUPO || r?.grupo || r?.GRUPO);
    if (rn) return rn === nv;
    return gp && rg === gp;
  });
  const total = filtradas.length;
  const presentes = filtradas.filter(r => agIndPresente(r?.presente ?? r?.PRESENTE)).length;
  return { total, presentes, pct: total ? Math.round((presentes / total) * 100) : null };
}
function agIndStatusTone(estatus) {
  const e = agIndUpper(estatus);
  if (e === 'APR' || e === 'CNV') return { bg:'#E8F5E9', fg:'#2E7D32', bd:'#BFE4C3' };
  if (e === 'CA') return { bg:'#E3F2FD', fg:'#1565C0', bd:'#B9DAF5' };
  if (e === 'REP' || e === 'RI' || e === 'RJ') return { bg:'#FFEBEE', fg:'#C62828', bd:'#F4B7B7' };
  return { bg:'#F4F1EC', fg:'#7B7168', bd:'#DED7CF' };
}
function agIndMoney(v) {
  const n = Number(v || 0) || 0;
  try {
    return new Intl.NumberFormat('es-CR', { style:'currency', currency:'CRC', maximumFractionDigits:0 }).format(n);
  } catch (_) {
    return '₡' + Math.round(n).toLocaleString('es-CR');
  }
}
function agIndNivelMovimiento(mov) {
  const nc = String(mov?.ncuenta == null ? '' : mov.ncuenta).trim();
  const cuentaNivel = { '54':'B1', '60':'B1', '61':'B2', '62':'I1', '63':'I2', '43':'B1', '44':'B2', '45':'I1', '46':'I2', '47':'I2', '48':'I2' };
  if (cuentaNivel[nc]) return cuentaNivel[nc];
  const texto = agIndPlain([mov?.concepto, mov?.Concepto, mov?.descripcion, mov?.grupo].filter(Boolean).join(' '))
    .replace(/[_-]+/g, ' ');
  const cod = texto.match(/(?:^|\s)(B1|B2|I1|I2)(?:\s|$)/);
  if (cod) return cod[1];
  if (/INTERMEDIO\s*(II|2)\b/.test(texto)) return 'I2';
  if (/INTERMEDIO\s*(I|1)\b/.test(texto)) return 'I1';
  if (/BASICO\s*(II|2)\b/.test(texto)) return 'B2';
  if (/BASICO\s*(I|1)\b/.test(texto)) return 'B1';
  if (/MATRICULA\s*(1ER|PRIMER)\s*INGRESO/.test(texto)) return 'B1';
  return '';
}
function agIndTipoMovimiento(mov, fuente) {
  const nc = Number(mov?.ncuenta || 0) || 0;
  const texto = agIndPlain([mov?.concepto, mov?.Concepto, mov?.descripcion].filter(Boolean).join(' '));
  if (nc === 54 || (nc >= 60 && nc <= 63) || texto.includes('MATRICULA')) return 'Matrícula';
  if (nc === 47 || texto.includes('PROGRAMA_COMPLETO') || texto.includes('TITULO_I2') || texto.includes('TITULO FINAL')) return 'Programa completo';
  if (nc === 48 || texto.includes('TOEIC')) return 'TOEIC';
  if ((nc >= 43 && nc <= 46) || texto.includes('CERTIF')) return 'Certificado';
  if (texto.includes('CUOTA') || fuente === 'PAGOS') return 'Cuota';
  return 'Otro movimiento';
}
function agIndMovimientos(detalle) {
  const out = [];
  (detalle?.pagos || []).forEach((p, i) => {
    const monto = Number(p?.monto ?? p?.PAGO ?? 0) || 0;
    const concepto = agIndNorm(p?.concepto || p?.Concepto);
    const recibo = agIndNorm(p?.recibo || p?.RECIBO);
    if (monto <= 0 || /^CUOTA_0\b/i.test(concepto) || recibo === '0') return;
    const mov = { ...p, fuente:'PAGOS', monto, concepto };
    mov.nivel = agIndNivelMovimiento(mov);
    mov.tipo = agIndTipoMovimiento(mov, 'PAGOS');
    mov.id = `p-${recibo || i}-${mov.nivel || 'x'}`;
    out.push(mov);
  });
  (detalle?.otrosPagos || []).forEach((p, i) => {
    const monto = Number(p?.monto ?? 0) || 0;
    if (monto <= 0) return;
    const mov = { ...p, fuente:'OTROS PAGOS', monto };
    mov.nivel = agIndNivelMovimiento(mov);
    mov.tipo = agIndTipoMovimiento(mov, 'OTROS PAGOS');
    mov.concepto = agIndNorm(p?.descripcion || p?.concepto || 'Movimiento aplicado');
    mov.id = `o-${agIndNorm(p?.recibo) || i}-${mov.nivel || 'x'}`;
    out.push(mov);
  });
  const ordenTipo = { 'Matrícula':1, 'Cuota':2, 'Certificado':3, 'Programa completo':4, 'TOEIC':5, 'Otro movimiento':6 };
  return out.sort((a, b) => (ordenTipo[a.tipo] || 9) - (ordenTipo[b.tipo] || 9));
}
function agIndResumenMovimientos(movs, pendiente) {
  const totalTipo = tipo => movs.filter(m => m.tipo === tipo).reduce((s, m) => s + (Number(m.monto) || 0), 0);
  return {
    matriculaPagada: totalTipo('Matrícula'),
    cuotasPagadas: totalTipo('Cuota'),
    certificadoPagado: totalTipo('Certificado'),
    tituloPagado: totalTipo('Programa completo'),
    toeicPagado: totalTipo('TOEIC'),
    otrosPagados: totalTipo('Otro movimiento'),
    matriculaPendiente: Number(pendiente?.matricula_pend || 0) || 0,
    cuotasPendientes: Number(pendiente?.cuotas_pend || 0) || 0,
    certificadoPendiente: Number(pendiente?.cert_pend || 0) || 0,
    tituloPendiente: Number(pendiente?.programa_completo_pend ?? pendiente?.titulo_pend ?? 0) || 0,
    toeicPendiente: Number(pendiente?.toeic_pend || 0) || 0,
    totalPagado: movs.reduce((s, m) => s + (Number(m.monto) || 0), 0),
  };
}

// F98.4-Z6-BD: un cero calculado no demuestra que un nivel esté pagado.
// La consulta individual informa comprobantes reales por nivel. PE y niveles
// sin fila de ESTATUS no generan una afirmación de mora ni de pago.
function agIndFinanzasNivel(estatus, movs, resumen) {
  const estado = agIndUpper(estatus);
  const aplica = !!estado && estado !== 'PE' && estado !== 'SIN REGISTRO';
  const matriculas = (movs || []).filter(m => m.tipo === 'Matrícula');
  const cuotas = (movs || []).filter(m => m.tipo === 'Cuota');
  const certificados = (movs || []).filter(m => m.tipo === 'Certificado');
  const titulos = (movs || []).filter(m => m.tipo === 'Programa completo');
  const toeic = (movs || []).filter(m => m.tipo === 'TOEIC');
  const totalComprobantes = matriculas.length + cuotas.length + certificados.length + titulos.length + toeic.length;
  if (!aplica) {
    return {
      aplica:false,
      label:'NO APLICA',
      bg:'#F4F1EC', fg:'#756D65', bd:'#DED7CF',
      matriculas:0, cuotas:0, certificados:0, titulos:0, toeic:0, totalComprobantes:0,
      detalle:'Sin matrícula activa; no se afirma MORA NO ni curso pagado.',
    };
  }
  const conComprobantes = totalComprobantes > 0;
  return {
    aplica:true,
    label:conComprobantes ? 'CON COMPROBANTES' : 'SIN COMPROBANTES',
    bg:conComprobantes ? '#E3F2FD' : '#FFF8E1',
    fg:conComprobantes ? '#1565C0' : '#9A6200',
    bd:conComprobantes ? '#B9DAF5' : '#F1D18A',
    matriculas:matriculas.length,
    cuotas:cuotas.length,
    certificados:certificados.length,
    titulos:titulos.length,
    toeic:toeic.length,
    totalComprobantes,
    detalle:conComprobantes ? `${totalComprobantes} comprobante(s) aplicado(s) al nivel.` : 'No hay comprobantes clasificados para este nivel.',
    resumen:resumen || {},
  };
}


function agIndFinanzasIntentos(detalle, nivel) {
  const mapa = detalle?.finanzas_por_intento || {};
  return Array.isArray(mapa?.[nivel]) ? mapa[nivel] : [];
}
function agIndRubroLabel(tipo) {
  return ({MATRICULA:'Matrícula',CUOTA:'Cuotas',CERTIFICADO:'Certificado',PROGRAMA_COMPLETO:'Programa completo',TOEIC:'TOEIC'}[tipo] || tipo);
}
function AgIndRubroIntento({ tipo, rubro, color, certificadoRegistro }) {
  const r=rubro||{},comps=Array.isArray(r.comprobantes)?r.comprobantes:[],deuda=Number(r.deuda_exigible||0),saldo=Number(r.saldo_contractual||0),alDia=deuda<=0.005;
  const esCertificado=tipo==='CERTIFICADO',registroCert=agIndNorm(certificadoRegistro),certEmitido=!!registroCert;
  const estadoLabel=esCertificado?(certEmitido?'EMITIDO':'PENDIENTE'):(alDia?'AL DÍA':agIndMoney(deuda));
  const estadoColor=esCertificado?(certEmitido?'#2E7D32':'#9A6200'):(alDia?'#2E7D32':'#C62828');
  return <div style={{padding:'8px 9px',borderRadius:9,border:'1px solid #E2DDD6',background:'white',minWidth:0}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:6,alignItems:'center'}}><span style={{fontSize:8.5,fontWeight:950,letterSpacing:'.07em',textTransform:'uppercase',color:'#756D65'}}>{agIndRubroLabel(tipo)}</span><span style={{width:18,height:3,borderRadius:999,background:color}}/></div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:7,marginTop:5}}><span style={{fontSize:8.5,color:'#81776F'}}>Aplicado</span><b style={{fontSize:10.5,fontFamily:'var(--f-mono,monospace)',color:'#14213D'}}>{agIndMoney(r.aplicado)}</b></div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:7,marginTop:2}}><span style={{fontSize:8.5,color:'#81776F'}}>{esCertificado?'Documento':'Pendiente'}</span><b style={{fontSize:9.5,color:estadoColor}}>{estadoLabel}</b></div>
    {esCertificado&&!certEmitido&&<div style={{marginTop:2,fontSize:7.8,color:deuda>0.005?'#B42318':'#8A6D3B'}}>{deuda>0.005?`Saldo financiero: ${agIndMoney(deuda)}. Documento aún no emitido.`:'Pago cubierto; falta emitir el documento oficial.'}</div>}
    {esCertificado&&certEmitido&&<div style={{marginTop:2,fontSize:7.8,color:'#2E7D32'}}>Registro oficial: {registroCert}</div>}
    {!esCertificado&&alDia&&saldo>0.005&&<div style={{marginTop:2,fontSize:7.8,color:'#8A6D3B'}}>Saldo contractual futuro: {agIndMoney(saldo)}</div>}
    <div style={{marginTop:6,paddingTop:5,borderTop:'1px dashed #E6E0D9'}}>{comps.length?comps.map((c,i)=><div key={c.id||i} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:5,fontSize:7.8,color:'#5D6673',marginTop:i?3:0}}><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.fecha||'Sin fecha'} · Rec. {c.recibo||'—'}{c.documento?` · Doc. ${c.documento}`:''}</span><b style={{fontFamily:'var(--f-mono,monospace)',color:'#25364F'}}>{agIndMoney(c.monto)}</b></div>):<div style={{fontSize:7.8,color:'#9A9087'}}>Sin comprobante aplicado en este intento.</div>}</div>
  </div>;
}
function AgIndIntentoFinanciero({ intento, color, nivel, certificadoRegistro }) {
  const it=intento||{},rubros=it.rubros||{},tipos=nivel==='I2'?['MATRICULA','CUOTA','CERTIFICADO','PROGRAMA_COMPLETO','TOEIC']:['MATRICULA','CUOTA','CERTIFICADO'];
  const deuda=Number(it.deuda_exigible||0),alDia=deuda<=0.005,excedente=Number(it.excedente_bancario||0),periodo=it.periodo?.corto||it.periodo?.largo||'';
  return <div style={{border:'1px solid #DCD5CC',borderRadius:11,overflow:'hidden',background:'#FDFCFA'}}>
    <div style={{padding:'8px 10px',background:it.es_actual?'#EEF5FC':'#F3EFE9',display:'flex',justifyContent:'space-between',gap:10,alignItems:'flex-start',flexWrap:'wrap',borderBottom:'1px solid #DDD6CE'}}>
      <div><div style={{fontSize:11,fontWeight:950,color:'#14213D'}}>{it.etiqueta||`Intento ${it.numero||''}`}</div><div style={{fontSize:8.5,color:'#667085',marginTop:2}}>{it.grupo||'Grupo sin identificar'}{periodo?` · ${periodo}`:''} · {it.estatus||'—'}{it.nota!==''&&it.nota!=null?` · nota ${it.nota}`:''}</div></div>
      <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end'}}><span style={{padding:'4px 7px',borderRadius:999,border:`1px solid ${alDia?'#BFE4C3':'#F4B7B7'}`,background:alDia?'#E8F5E9':'#FFEBEE',color:alDia?'#2E7D32':'#C62828',fontSize:8.5,fontWeight:950}}>{alDia?'FINANZAS AL DÍA':`DEUDA ${agIndMoney(deuda)}`}</span>{excedente>0.005&&<span style={{padding:'4px 7px',borderRadius:999,border:'1px solid #E8C67A',background:'#FFF7DF',color:'#8A5A00',fontSize:8.5,fontWeight:950}}>EXCEDENTE {agIndMoney(excedente)}</span>}</div>
    </div>
    <div style={{padding:8}}><div style={{display:'grid',gridTemplateColumns:`repeat(${tipos.length},minmax(135px,1fr))`,gap:6,overflowX:'auto'}}>{tipos.map(t=><AgIndRubroIntento key={t} tipo={t} rubro={rubros[t]} color={color} certificadoRegistro={t==='CERTIFICADO'?certificadoRegistro:''}/>)}</div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:14,flexWrap:'wrap',marginTop:6,fontSize:8.2,color:'#667085'}}><span>Aplicado: <b style={{color:'#14213D'}}>{agIndMoney(it.total_aplicado)}</b></span>{Number(it.depositado_banco||0)>0&&<span>Depositado: <b style={{color:'#14213D'}}>{agIndMoney(it.depositado_banco)}</b></span>}<span>Contrato: <b style={{color:'#14213D'}}>{agIndMoney(it.total_contractual)}</b></span></div>
    </div>
  </div>;
}

function AkActionButton({ children, onClick, danger, disabled, title }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} style={{
      padding:'8px 11px', borderRadius:9, border:`1px solid ${danger ? '#F3B7B7' : '#D8E0EA'}`,
      background:danger ? '#FFF1F1' : 'white', color:danger ? '#B42318' : '#14213D',
      fontSize:10.5, fontWeight:900, cursor:disabled ? 'not-allowed' : 'pointer', opacity:disabled ? .55 : 1,
      whiteSpace:'nowrap', boxShadow:'0 2px 7px rgba(20,33,61,.035)'
    }}>{children}</button>
  );
}

function agCambioHora12(v) {
  const m = String(v || '').match(/^(\d{1,2}):(\d{2})/);
  if (!m) return String(v || '');
  const h = Number(m[1]), min = m[2], pm = h >= 12;
  const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${h12}:${min} ${pm ? 'p.m.' : 'a.m.'}`;
}
function agCambioDias(v) {
  const k = String(v || '').toUpperCase().trim();
  return ({LM:'Lunes y miércoles',KJ:'Martes y jueves',MJ:'Martes y jueves',LJ:'Lunes a jueves',L4:'Lunes a jueves',SA:'Sábado',S:'Sábado',V:'Viernes',MV:'Miércoles y viernes'})[k] || k || 'Días sin definir';
}
function agCambioTipoPeriodo(v) {
  const k = String(v || '').toUpperCase().trim();
  return k.startsWith('B') ? 'Bimestre' : k.startsWith('C') ? 'Cuatrimestre' : 'Periodo sin definir';
}
function agCambioFecha(v) {
  const raw = String(v || '').trim();
  if (!raw) return 'Fecha de inicio sin definir';
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00` : raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('es-CR', { day:'2-digit', month:'short', year:'numeric' }).replace('.', '');
}
function agCambioEstadoGrupo(v) {
  const k = String(v || '').toUpperCase().trim();
  return ({'EN CURSO':'En curso','PROYECTADO':'Proyectado','COMPLETADO':'Completado'})[k] || v || 'Estado sin definir';
}
function agCambioOpcionGrupo(g) {
  const nivel = g?.nivel_nombre || NIVEL_LABEL_P[g?.nivel] || g?.nivel || 'Nivel sin definir';
  const tipo = g?.tipo_periodo_nombre || agCambioTipoPeriodo(g?.tipo_periodo);
  const periodo = g?.periodo_corto || 'periodo sin definir';
  const inicio = agCambioFecha(g?.fecha_inicio);
  const horario = `${agCambioDias(g?.dias)} ${agCambioHora12(g?.hora_ini)}–${agCambioHora12(g?.hora_fin)}`;
  return `${nivel} · ${tipo} · ${periodo} · inicia ${inicio} · ${horario} · ${agCambioEstadoGrupo(g?.comentario)} · ${g?.cupo ?? 0} cupos · ${g?.grupo || ''}`;
}

function AkCambioAcademicoWizard({ codigo, nivel, infoNivel, onClose, onSuccess }) {
  const [contexto, setContexto] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [tipoCaso, setTipoCaso] = React.useState('');
  const [grupoDestino, setGrupoDestino] = React.useState('');
  const [motivo, setMotivo] = React.useState('');
  const [detalleOtro, setDetalleOtro] = React.useState('');
  const [simulacion, setSimulacion] = React.useState(null);
  const [simulando, setSimulando] = React.useState(false);
  const [ejecutando, setEjecutando] = React.useState(false);
  const [confirmacion, setConfirmacion] = React.useState('');

  function seleccionarCaso(ctx, codigoCaso) {
    const habilitado = (ctx?.tipos_caso || []).find(x => x.codigo === codigoCaso && x.habilitado);
    const caso = habilitado ? codigoCaso : ((ctx?.tipos_caso || []).find(x => x.habilitado)?.codigo || '');
    setTipoCaso(caso);
    const candidatos = ctx?.candidatos_por_caso?.[caso] || [];
    setGrupoDestino((candidatos.find(x => x.seleccionable) || candidatos[0] || {}).grupo || '');
    const motivos = ctx?.motivos_por_caso?.[caso] || [];
    setMotivo(motivos.length === 1 ? motivos[0] : '');
    setDetalleOtro('');
    setSimulacion(null);
    setConfirmacion('');
  }

  React.useEffect(() => {
    let activo = true;
    setLoading(true); setError('');
    postAdminStudents('getCambioGrupoContexto', { codigo, nivel })
      .then(r => {
        if (!activo) return;
        if (!r?.ok) { setError(adminStudentsSafeUserError(r?.error || r?.mensaje, 'No se pudo evaluar el expediente. Intentá de nuevo.', 'evaluar_cambio_grupo')); return; }
        setContexto(r);
        seleccionarCaso(r, r.caso_sugerido || '');
      })
      .catch(e => activo && setError(adminStudentsSafeUserError(e?.message || String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion')))
      .finally(() => activo && setLoading(false));
    return () => { activo = false; };
  }, [codigo, nivel]);

  const candidatos = contexto?.candidatos_por_caso?.[tipoCaso] || [];
  const motivos = contexto?.motivos_por_caso?.[tipoCaso] || [];
  const casoInfo = (contexto?.tipos_caso || []).find(x => x.codigo === tipoCaso) || {};
  const candidato = candidatos.find(x => x.grupo === grupoDestino);

  function cambiarCaso(caso) {
    seleccionarCaso(contexto, caso);
  }

  async function simular() {
    if (!tipoCaso || !grupoDestino || !motivo) {
      setError('Seleccioná el tipo de movimiento, el grupo destino y el motivo.');
      return;
    }
    if (motivo === 'Otro' && (detalleOtro.trim().length < 15 || detalleOtro.trim().length > 500)) {
      setError('La explicación de “Otro” debe tener entre 15 y 500 caracteres.');
      return;
    }
    setSimulando(true); setError(''); setSimulacion(null); setConfirmacion('');
    try {
      const r = await postAdminStudents('simularCambioGrupo', {
        codigo, nivel, tipo_caso:tipoCaso,
        grupo_origen:contexto?.actual?.grupo || infoNivel?.grupo || '',
        grupo_destino:grupoDestino, motivo, detalle_otro:detalleOtro.trim(),
      }, 45000);
      if (!r?.ok) setError(adminStudentsSafeUserError(r?.error || r?.mensaje, 'No fue posible simular el movimiento. Intentá de nuevo.', 'simular_cambio_grupo'));
      else setSimulacion(r.simulacion);
    } catch(e) {
      setError(adminStudentsSafeUserError(e?.message || String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'));
    } finally {
      setSimulando(false);
    }
  }

  async function ejecutar() {
    if (!simulacion || confirmacion.trim() !== String(codigo)) return;
    setEjecutando(true); setError('');
    try {
      const r = await postAdminStudents('ejecutarCambioGrupo', {
        codigo, nivel, tipo_caso:tipoCaso,
        grupo_origen:simulacion?.antes?.grupo || contexto?.actual?.grupo || '',
        grupo_destino:grupoDestino, motivo, detalle_otro:detalleOtro.trim(),
        confirmacion_individual:String(codigo),
      }, 45000);
      if (!r?.ok) { setError(adminStudentsSafeUserError(r?.error || r?.mensaje, 'No fue posible ejecutar el movimiento. Intentá de nuevo.', 'ejecutar_cambio_grupo')); return; }
      alert(adminStudentsSafeUserError(r?.mensaje, r?.ya_aplicado ? 'El movimiento ya estaba aplicado; no se creó un duplicado.' : 'Movimiento aplicado correctamente.', 'resultado_cambio_grupo'));
      onSuccess?.(r);
      onClose();
    } catch(e) {
      setError(adminStudentsSafeUserError(e?.message || String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'));
    } finally {
      setEjecutando(false);
    }
  }

  const fin = simulacion?.financiero || {};
  const conape = simulacion?.conape || {};
  const antes = simulacion?.antes || {};
  const despues = simulacion?.despues || {};

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2500, background:'rgba(7,20,40,.72)', display:'flex', alignItems:'center', justifyContent:'center', padding:18 }}>
      <div style={{ width:'min(1080px,96vw)', maxHeight:'92vh', overflowY:'auto', background:'#F8F6F2', borderRadius:16, boxShadow:'0 28px 80px rgba(0,0,0,.35)', border:'1px solid #DDE4EC' }}>
        <div style={{ padding:'18px 20px', background:'#0D2B51', color:'white', borderRadius:'16px 16px 0 0', display:'flex', justifyContent:'space-between', gap:16, alignItems:'center' }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:'.15em', fontWeight:900, textTransform:'uppercase', opacity:.72 }}>Expediente individual</div>
            <div style={{ fontSize:21, fontWeight:900, marginTop:3 }}>Evaluar cambio académico · {NIVEL_LABEL_P[nivel]}</div>
            <div style={{ fontSize:11.5, opacity:.82, marginTop:3 }}>Estudiante {codigo} · ninguna acción masiva disponible</div>
          </div>
          <button type="button" onClick={onClose} disabled={ejecutando} style={{ width:34, height:34, borderRadius:999, border:'1px solid rgba(255,255,255,.4)', background:'rgba(255,255,255,.1)', color:'white', fontSize:20, cursor:'pointer' }}>×</button>
        </div>

        <div style={{ padding:20 }}>
          {loading && <div style={{ padding:35, textAlign:'center', color:'#667085', fontWeight:800 }}>Preparando expediente académico, grupo, intentos y pagos…</div>}
          {error && <div style={{ marginBottom:14, padding:'11px 13px', borderRadius:10, background:'#FFEBEE', border:'1px solid #F2B8B8', color:'#B42318', fontSize:12, fontWeight:800 }}>{error}</div>}

          {!loading && contexto && (
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:9,marginBottom:14}}>
                <AgIndMetric label="Estado actual" value={contexto?.actual?.estatus || '—'} warn={!['CA','REP'].includes(contexto?.actual?.estatus)} sub={contexto?.actual?.periodo_corto || ''}/>
                <AgIndMetric label="Grupo actual" value={contexto?.actual?.grupo || '—'} sub={contexto?.actual?.tipo_periodo ? `Periodo ${contexto.actual.tipo_periodo}` : ''}/>
                <AgIndMetric label="Intentos" value={contexto?.actual?.numero_intento || 1} sub={contexto?.actual?.intento_id || 'Intento histórico'}/>
                <AgIndMetric label="Comprobantes nivel" value={contexto?.financiero?.total_comprobantes || 0} sub={`Matr. ${contexto?.financiero?.matricula_count||0} · Cuotas ${contexto?.financiero?.cuota_count||0} · Cert. ${contexto?.financiero?.certificado_count||0}`}/>
              </div>

              {!!(contexto.bloqueos || []).length && <div style={{marginBottom:14,padding:'12px 14px',borderRadius:10,background:'#FFEBEE',border:'1px solid #F2B8B8',color:'#B42318'}}><b>Expediente bloqueado.</b>{(contexto.bloqueos||[]).map((x,i)=><div key={i} style={{marginTop:5,fontSize:11.5}}>• {x}</div>)}</div>}

              <div style={{ display:'grid', gridTemplateColumns:'minmax(250px,.9fr) minmax(280px,1.1fr)', gap:14 }}>
                <div style={{ background:'white', border:'1px solid #E0E6ED', borderRadius:13, padding:15 }}>
                  <div style={{ fontSize:10, fontWeight:900, letterSpacing:'.1em', textTransform:'uppercase', color:'#667085', marginBottom:10 }}>1. Tipo de movimiento</div>
                  <div style={{display:'grid',gap:8}}>
                    {(contexto.tipos_caso || []).map(c => <button key={c.codigo} type="button" disabled={!c.habilitado} onClick={()=>c.habilitado&&cambiarCaso(c.codigo)} style={{textAlign:'left',padding:'10px 11px',borderRadius:10,border:`1px solid ${tipoCaso===c.codigo?'#174E8C':'#D8E0EA'}`,background:tipoCaso===c.codigo?'#EAF3FF':'white',color:c.habilitado?'#14213D':'#8B929A',cursor:c.habilitado?'pointer':'not-allowed',opacity:c.habilitado?1:.62}}><div style={{fontSize:11.5,fontWeight:950}}>{c.label}</div><div style={{fontSize:9.8,lineHeight:1.35,marginTop:3,color:c.habilitado?'#667085':'#9AA1A8'}}>{c.habilitado?c.descripcion:c.razon}</div></button>)}
                  </div>
                  {casoInfo.descripcion&&<div style={{marginTop:10,padding:'9px 10px',borderRadius:8,background:'#F7F4EF',fontSize:10.5,color:'#615850',lineHeight:1.45}}>{casoInfo.descripcion}</div>}
                </div>

                <div style={{ background:'white', border:'1px solid #E0E6ED', borderRadius:13, padding:15 }}>
                  <div style={{ fontSize:10, fontWeight:900, letterSpacing:'.1em', textTransform:'uppercase', color:'#667085', marginBottom:10 }}>2. Destino y motivo</div>
                  <label style={{display:'block',fontSize:10,fontWeight:900,marginBottom:5}}>Grupo destino</label>
                  <select value={grupoDestino} onChange={e=>{setGrupoDestino(e.target.value);setSimulacion(null);setConfirmacion('');}} style={{ width:'100%', padding:'10px 11px', borderRadius:9, border:'1px solid #BFC9D6', background:'white', fontWeight:800, color:'#14213D' }}>
                    {!candidatos.length&&<option value="">Sin destinos compatibles</option>}
                    {candidatos.map(g => <option key={g.grupo} value={g.grupo} disabled={!g.seleccionable}>{agCambioOpcionGrupo(g)}</option>)}
                  </select>
                  {candidato&&<div style={{marginTop:9,padding:'11px 12px',borderRadius:10,background:candidato.seleccionable?'#E8F5E9':'#FFF3E0',border:`1px solid ${candidato.seleccionable?'#BFE4C3':'#F0C27B'}`,color:candidato.seleccionable?'#246B2A':'#8A5200'}}>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
                      <span style={{padding:'4px 7px',borderRadius:999,background:'white',border:'1px solid currentColor',fontSize:9,fontWeight:950}}>{candidato.nivel_nombre || NIVEL_LABEL_P[candidato.nivel] || candidato.nivel}</span>
                      <span style={{padding:'4px 7px',borderRadius:999,background:'white',border:'1px solid currentColor',fontSize:9,fontWeight:950}}>{candidato.tipo_periodo_nombre || agCambioTipoPeriodo(candidato.tipo_periodo)}</span>
                      <span style={{padding:'4px 7px',borderRadius:999,background:'white',border:'1px solid currentColor',fontSize:9,fontWeight:950}}>{agCambioEstadoGrupo(candidato.comentario)}</span>
                      {candidato.cambio_tipo_periodo&&<span style={{padding:'4px 7px',borderRadius:999,background:'#FFF7DF',border:'1px solid #D9AF50',color:'#7A4A00',fontSize:9,fontWeight:950}}>Cambio de periodo permitido</span>}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(150px,1fr))',gap:'6px 14px',fontSize:10.5,lineHeight:1.35}}>
                      <div><b>Periodo:</b> {candidato.periodo_corto || 'Sin definir'}</div>
                      <div><b>Inicio:</b> {agCambioFecha(candidato.fecha_inicio)}</div>
                      <div><b>Horario:</b> {agCambioDias(candidato.dias)} · {agCambioHora12(candidato.hora_ini)}–{agCambioHora12(candidato.hora_fin)}</div>
                      <div><b>Docente:</b> {candidato.docente || 'Sin docente'}</div>
                      <div><b>Código:</b> {candidato.grupo}</div>
                      <div><b>Cupo:</b> {candidato.cupo} disponible(s) de {candidato.capacidad}</div>
                    </div>
                    <div style={{marginTop:8,paddingTop:7,borderTop:'1px dashed currentColor',fontSize:10.5,fontWeight:850,lineHeight:1.4}}>{candidato.recomendacion}</div>
                  </div>}

                  <label style={{display:'block',fontSize:10,fontWeight:900,margin:'12px 0 5px'}}>Motivo oficial</label>
                  <select value={motivo} onChange={e=>{setMotivo(e.target.value);setSimulacion(null);setConfirmacion('');}} style={{ width:'100%', padding:'10px 11px', borderRadius:9, border:'1px solid #BFC9D6', background:'white', fontWeight:800, color:'#14213D' }}>
                    <option value="">Seleccionar motivo…</option>
                    {motivos.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                  {motivo==='Otro'&&<textarea value={detalleOtro} onChange={e=>setDetalleOtro(e.target.value)} rows={3} maxLength={500} placeholder="Explique el motivo (15–500 caracteres)" style={{width:'100%',boxSizing:'border-box',marginTop:8,padding:9,borderRadius:9,border:'1px solid #BFC9D6',resize:'vertical',fontFamily:'inherit'}}/>}
                </div>
              </div>

              <div style={{display:'flex',justifyContent:'flex-end',marginTop:13}}>
                <button type="button" onClick={simular} disabled={simulando||!tipoCaso||!grupoDestino||!motivo||!!(contexto.bloqueos||[]).length} style={{padding:'10px 16px',borderRadius:9,border:'none',background:'#14213D',color:'white',fontWeight:900,cursor:simulando?'wait':'pointer',opacity:(!tipoCaso||!grupoDestino||!motivo||!!(contexto.bloqueos||[]).length)?.55:1}}>{simulando?'Analizando…':'Simular antes y después'}</button>
              </div>

              {simulacion&&<div style={{marginTop:16,display:'grid',gap:13}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(260px,1fr))',gap:12}}>
                  {[['ANTES',antes,'#FFF7E6','#7A4A00'],['DESPUÉS',despues,'#E8F5E9','#246B2A']].map(([label,obj,bg,fg])=><div key={label} style={{padding:14,border:'1px solid #DDE4EC',borderRadius:12,background:bg,color:fg}}><div style={{fontSize:10,fontWeight:950,letterSpacing:'.12em'}}>{label}</div><div style={{marginTop:7,fontSize:12,lineHeight:1.55}}><b>{obj.estatus||'—'} · {NIVEL_LABEL_P[nivel]}</b><br/>Grupo: {obj.grupo||'—'}<br/>Periodo: {obj.periodo_corto||'—'}{obj.numero_intento?` · intento ${obj.numero_intento}`:''}</div></div>)}
                </div>

                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(165px,1fr))',gap:9}}>
                  <AgIndMetric label="Nuevo intento" value={fin.nuevo_intento?'SÍ':'NO'} warn={false}/>
                  <AgIndMetric label="Matrícula nueva" value={fin.nueva_matricula?'SÍ':'NO'} warn={false}/>
                  <AgIndMetric label="Cuotas nuevas" value={fin.nuevas_cuotas?'SÍ':'NO'} warn={false}/>
                  <AgIndMetric label="Certificado" value={fin.certificado_convalidado?'CONVALIDADO':fin.certificado_nuevo?'PENDIENTE':'SIN CAMBIO'} warn={false}/>
                  <AgIndMetric label="Pagos anteriores" value={fin.convalida_pagos?'CONSERVADOS':'NO HEREDADOS'} warn={false}/>
                  <AgIndMetric label="CONAPE" value={conape.estado||'—'} warn={conape.requiere_modificacion===true} sub={(conape.formularios||[]).join(' · ')}/>
                </div>

                {!!(simulacion.warnings||[]).length&&<div style={{padding:'12px 14px',borderRadius:11,background:'#FFF3E0',border:'1px solid #F0C27B',color:'#7A4400'}}><div style={{fontSize:10,fontWeight:900,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:6}}>Advertencias</div>{simulacion.warnings.map((w,i)=><div key={i} style={{fontSize:11.5,fontWeight:700,marginTop:i?5:0}}>• {w}</div>)}</div>}

                {conape.requiere_modificacion&&<div style={{padding:'11px 13px',borderRadius:10,background:'#EEF4FF',border:'1px solid #C9D9F1',color:'#244A7C',fontSize:11.5,lineHeight:1.5}}><b>El nuevo plan no se actualizará todavía en CONAPE.</b> El expediente quedará <b>PENDIENTE DE APROBACIÓN</b> y la sincronización individual será bloqueada hasta resolver el trámite.</div>}

                <div style={{padding:'12px 13px',borderRadius:10,background:'white',border:'1px solid #D7DEE7'}}>
                  <label style={{display:'block',fontSize:10.5,fontWeight:900,color:'#344054'}}>Confirmación individual</label>
                  <div style={{fontSize:10,color:'#667085',margin:'4px 0 7px'}}>Escribí exactamente el código <b>{codigo}</b>. Solo se modificará este expediente.</div>
                  <input value={confirmacion} onChange={e=>setConfirmacion(e.target.value.replace(/[^0-9]/g,''))} style={{width:'100%',boxSizing:'border-box',padding:'10px 11px',borderRadius:9,border:'1px solid #BFC9D6',fontFamily:'var(--f-mono)',fontWeight:900}}/>
                </div>

                <div style={{display:'flex',justifyContent:'flex-end',gap:9}}>
                  <button type="button" onClick={onClose} disabled={ejecutando} style={{padding:'10px 15px',borderRadius:9,border:'1px solid #C9D2DE',background:'white',color:'#344054',fontWeight:900,cursor:'pointer'}}>Cancelar</button>
                  <button type="button" onClick={ejecutar} disabled={confirmacion.trim()!==String(codigo)||ejecutando} style={{padding:'10px 17px',borderRadius:9,border:'none',background:'#B42318',color:'white',fontWeight:900,cursor:(confirmacion.trim()!==String(codigo)||ejecutando)?'not-allowed':'pointer',opacity:(confirmacion.trim()!==String(codigo)||ejecutando)?.55:1}}>{ejecutando?'Aplicando expediente…':'Aplicar únicamente a este estudiante'}</button>
                </div>
              </div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


function AkComentarioAdminModal({ codigo, comentarioAdmin, onClose, onSaved }) {
  const [comentarioValue,setComentarioValue]=React.useState(comentarioAdmin||'');
  const [comentarioBusy,setComentarioBusy]=React.useState(false);
  React.useEffect(()=>setComentarioValue(comentarioAdmin||''),[comentarioAdmin,codigo]);
  async function guardarComentario(){
    setComentarioBusy(true);
    try{
      const r=await postAdminStudents('guardarComentarioAdminEstudiante',{codigo,comentario:comentarioValue});
      if(!r?.ok)throw new Error(r?.error||'No se pudo guardar el comentario.');
      onSaved?.(r.comentario_admin||'');
      onClose?.();
    }catch(e){alert(adminStudentsSafeUserError(e?.message||String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'));}finally{setComentarioBusy(false);}
  }
  return <div style={{position:'fixed',inset:0,zIndex:2750,background:'rgba(7,20,40,.58)',display:'flex',alignItems:'center',justifyContent:'center',padding:18}}><div style={{width:'min(620px,94vw)',background:'white',borderRadius:14,boxShadow:'0 24px 70px rgba(0,0,0,.35)',overflow:'hidden'}}><div style={{padding:'13px 15px',background:'#173A67',color:'white',fontWeight:950}}>Comentario interno · {codigo}</div><div style={{padding:15}}><div style={{fontSize:10,color:'#667085',marginBottom:7}}>Este comentario es interno y queda asociado al expediente del estudiante. Solo administración autorizada puede leerlo o modificarlo.</div><textarea value={comentarioValue} onChange={e=>setComentarioValue(e.target.value)} maxLength={3000} rows={7} style={{width:'100%',resize:'vertical',border:'1px solid #CCD6E2',borderRadius:9,padding:10,fontFamily:'inherit',fontSize:12,lineHeight:1.45,boxSizing:'border-box'}}/><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginTop:10}}><span style={{fontSize:9,color:'#8A8178'}}>{comentarioValue.length}/3000</span><div style={{display:'flex',gap:7}}><button type="button" onClick={onClose} disabled={comentarioBusy} style={{padding:'8px 11px',borderRadius:8,border:'1px solid #CCD6E2',background:'white',fontWeight:850,cursor:'pointer'}}>Cancelar</button><button type="button" onClick={guardarComentario} disabled={comentarioBusy} style={{padding:'8px 12px',borderRadius:8,border:'1px solid #173A67',background:'#173A67',color:'white',fontWeight:950,cursor:'pointer'}}>{comentarioBusy?'Guardando…':'Guardar comentario'}</button></div></div></div></div></div>;
}

function AkHistorialCambiosModal({ codigo, onClose, onReverted }) {
  const [estado,setEstado]=React.useState({loading:true,error:'',rows:[]});
  const [busy,setBusy]=React.useState('');
  const [docBusy,setDocBusy]=React.useState('');
  const [approveBusy,setApproveBusy]=React.useState('');
  const [formBusy,setFormBusy]=React.useState('');
  function cargar(){setEstado({loading:true,error:'',rows:[]});postAdminStudents('getHistorialCambiosGrupo',{codigo}).then(r=>{if(r?.ok)setEstado({loading:false,error:'',rows:r.historial||[]});else setEstado({loading:false,error:adminStudentsSafeUserError(r?.error||r?.mensaje,'No se pudo cargar el historial. Intentá de nuevo.','cargar_historial'),rows:[]});}).catch(e=>setEstado({loading:false,error:adminStudentsSafeUserError(e?.message||String(e),'No se pudo cargar el historial. Intentá de nuevo.','cargar_historial'),rows:[]}));}
  React.useEffect(cargar,[codigo]);
  async function revertir(id){if(!confirm('¿Revertir este cambio? Solo continuará si no existen movimientos posteriores.'))return;setBusy(id);const r=await postAdminStudents('revertirCambioGrupo',{cambio_id:id});setBusy('');if(!r?.ok){alert(r?.reversion_asistida?`Reversión asistida requerida:\n${(r.bloqueos||[]).join('\n')||adminStudentsSafeUserError(r?.error||r?.mensaje,'No se pudo revertir.','revertir_cambio')}`:adminStudentsSafeUserError(r?.error||r?.mensaje,'No se pudo revertir.','revertir_cambio'));return;}onReverted?.(r);cargar();}
  async function abrirDocumento(r){
    const simple=String(r.TIPO_OPERACION||'').toUpperCase()==='TRASLADO_SIMPLE';
    const key=`${r.CAMBIO_ID}-${simple?'T':'C'}`;setDocBusy(key);
    try{
      const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true},80000);
      if(!resp?.ok)throw new Error(resp?.error||'No se pudo generar el documento.');
      if(!abrirPdfPrivadoAdmin(resp))alert('No se pudo abrir el documento. Reintentá la operación.');
      cargar();
    }catch(e){alert(adminStudentsSafeUserError(e?.message||String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'));}finally{setDocBusy('');}
  }
  async function regenerarCarta(r){
    if(!confirm('Se recalcularán pagos y mora. La carta anterior será reemplazada. ¿Continuar?'))return;
    const key=`${r.CAMBIO_ID}-R`;setDocBusy(key);
    try{
      const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true},80000);
      if(!resp?.ok)throw new Error(resp?.error||'No se pudo regenerar la carta.');
      if(resp?.estado==='LISTA_PARA_FIRMA'){
        const diag=resp?.diagnostico_emision||{};
        const extra=diag?.tipo_caso==='REPETICION'&&!diag?.solicitud_definida
          ?'\n\nLa carta documenta la repetición y la actualización del plan. No solicita todavía el siguiente desembolso.'
          :'';
        alert(`Carta recalculada y lista para firma.${extra}`);
      }else{
        const financiero=resp?.estado_financiero||{};
        const diag=resp?.diagnostico_emision||{};
        const pendientes=Array.isArray(financiero?.niveles_financieros_pendientes)
          ?financiero.niveles_financieros_pendientes:[];
        const detalleFinanciero=pendientes.map(x=>{
          const p=x?.detalle_financiero||{};
          const rubros=[];
          const add=(label,value)=>{const n=Number(value||0);if(n>0.005)rubros.push(`${label}: ₡${Math.round(n).toLocaleString('es-CR')}`);};
          add('Matrícula',p.matricula_pend);
          add('Cuotas',p.cuotas_pend);
          if(p.certificado_exigible!==false)add('Certificado',p.cert_pend);
          if(p.programa_completo_exigible||p.titulo_exigible)add('Programa completo',p.programa_completo_pend??p.titulo_pend);
          if(p.toeic_cobrable&&!p.toeic_omitido)add('TOEIC',p.toeic_pend);
          const nivel=x?.nivel_nombre||x?.nivel||'Nivel no identificado';
          const intento=x?.numero_intento?` · intento ${x.numero_intento}`:'';
          const fuente=x?.fuente_confirmacion?` · fuente: ${x.fuente_confirmacion}`:'';
          const busqueda=x?.reconciliacion_busqueda||{};
          const oficial=x?.reconciliacion_oficial||{};
          const lookup=busqueda?.clave
            ?` · 7-morosidad ${busqueda.clave}: ${oficial?.conflicto?'DUPLICADO CONFLICTIVO':(oficial?.estado||'SIN COINCIDENCIA')}`
            :'';
          return `• ${nivel}${intento}${x?.periodo?` · ${x.periodo}`:''}: ${rubros.length?rubros.join(', '):'revisión financiera requerida'}${fuente}${lookup}`;
        });
        const causas=Array.isArray(diag?.causas_bloqueo)?diag.causas_bloqueo:[];
        const lineasCausa=causas.map(c=>`• ${c?.mensaje||c?.codigo||'Bloqueo sin descripción'}`);
        let titulo='La carta continúa como borrador.';
        if(diag?.apto_financiero===false)titulo='La carta continúa como borrador porque existen obligaciones exigibles.';
        else if(diag?.apto_academico===false)titulo='La carta continúa como borrador por una condición académica pendiente.';
        else if(diag?.solicitud_definida===false)titulo='La carta continúa como borrador porque no existe una solicitud elegible.';
        const lineas=[...lineasCausa,...detalleFinanciero];
        alert(`${titulo}${lineas.length?`\n\n${lineas.join('\n')}`:'\n\nNo se pudo determinar la causa. Reintentá y, si continúa, revisá el caso antes de emitir la carta.'}`);
      }
      if(!abrirPdfPrivadoAdmin(resp))alert('La carta se actualizó, pero no se pudo abrir el PDF. Reintentá desde el historial.');
      cargar();
    }catch(e){alert(adminStudentsSafeUserError(e?.message||String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'));}finally{setDocBusy('');}
  }
  async function descargarFormularioConape(r){
    const key=`${r.CAMBIO_ID}-F`;setFormBusy(key);
    try{
      const resp=await postAdminStudents('getFormularioConapePrefill',{cambio_id:r.CAMBIO_ID},80000);
      if(!resp?.ok)throw new Error(resp?.error||'No se pudo preparar el formulario CONAPE.');
      const control=resp.control||{};
      const bloqueos=Array.isArray(control.bloqueos)?control.bloqueos:[];
      if(bloqueos.length)throw new Error(bloqueos.join('\n'));
      const actual=control.nivel_actual||{};
      const solicitado=control.nivel_solicitado||control.sd18_solicita||null;
      const incluidos=Array.isArray(control.sd17_incluye)?control.sd17_incluye:[];
      if(solicitado?.pago_completo)throw new Error('No se puede generar el formulario: el nivel solicitado ya aparece como pagado.');
      const nombreNivel=x=>x?.nivel_nombre||x?.nivel||'No definido';
      const lineas=[
        'CONTROL PREVENTIVO CONAPE',
        '',
        `Nivel actual pagado: ${control.nivel_actual_pagado?'SÍ · ':'NO · '}${nombreNivel(actual)}`,
        `Resultado académico actual: ${control.nivel_actual_aprobado?'APROBATORIO':'NO HABILITA'}${control.nota_actual!=null?` · nota ${control.nota_actual}`:''}${control.criterio_aprobacion?` · ${control.criterio_aprobacion}`:''}`,
        `Nivel solicitado: ${solicitado?nombreNivel(solicitado):'No existe un PE posterior pendiente'}`,
        `SD-17 incluye: ${incluidos.length?incluidos.map(nombreNivel).join(', '):'Ningún nivel'}`,
        `SD-18 solicita: ${solicitado?nombreNivel(solicitado):'Sin asignatura automática'}`,
        `Tipo de ciclo: ${control.tipo_ciclo||'Por revisar'}`
      ];
      const advertencias=Array.isArray(control.advertencias)?control.advertencias:[];
      if(advertencias.length)lineas.push('',`Advertencias:\n• ${advertencias.join('\n• ')}`);
      lineas.push('','Revisá este control antes de crear el PDF. ¿Continuar con la descarga?');
      if(!confirm(lineas.join('\n')))return;

      if(!window.PDFLib||!window.PDFLib.PDFDocument){
        if(!window.__anPdfLibLoading){window.__anPdfLibLoading=new Promise((resolve,reject)=>{const sc=document.createElement('script');sc.src='vendor/pdf-lib.min.js?v=1.17.1-BU';sc.async=true;sc.onload=()=>resolve(window.PDFLib);sc.onerror=()=>reject(new Error('No se pudo cargar el módulo local para prellenar PDF.'));document.head.appendChild(sc);}).finally(()=>{window.__anPdfLibLoading=null;});}
        await window.__anPdfLibLoading;
      }
      if(!window.PDFLib||!window.PDFLib.PDFDocument)throw new Error('El módulo para prellenar el PDF no está disponible.');
      const templateUrl=resp.template_url||'assets/forms/Formulario-8-Modificar-Plan-Estudios-y-Desembolsos.pdf';
      const tr=await fetch(templateUrl,{cache:'no-store'});if(!tr.ok)throw new Error(`No se pudo cargar la plantilla oficial (${tr.status}).`);
      const bytes=await tr.arrayBuffer();
      const {PDFDocument,StandardFonts,rgb}=window.PDFLib;
      const pdfDoc=await PDFDocument.load(bytes,{ignoreEncryption:true});
      const form=pdfDoc.getForm();
      const font=await pdfDoc.embedFont(StandardFonts.Helvetica);
      const faltantes=[];
      const text=resp.fields?.text||{},checks=resp.fields?.check||{},radios=resp.fields?.radio||{};
      Object.entries(text).forEach(([name,value])=>{
        if(value===null||value===undefined||String(value)==='')return;
        try{
          const field=form.getTextField(name);
          try{if(field.isReadOnly?.())field.disableReadOnly();}catch(_){ }
          field.setText(String(value));
          try{const n=String(value).length;field.setFontSize(n>70?5.8:n>45?6.5:n>28?7.5:9);}catch(_){ }
        }catch(e){faltantes.push(`${name}: ${e?.message||e}`);}
      });
      Object.entries(checks).forEach(([name,value])=>{try{const f=form.getCheckBox(name);value?f.check():f.uncheck();}catch(e){faltantes.push(`${name}: ${e?.message||e}`);}});
      Object.entries(radios).forEach(([name,value])=>{if(!value)return;try{const f=form.getRadioGroup(name);const opts=f.getOptions?.()||[];let selected=String(value);if(!opts.includes(selected)){const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();selected=opts.find(o=>norm(o)===norm(value))||opts.find(o=>norm(o).includes(norm(value)))||'';}if(selected)f.select(selected);else faltantes.push(`${name}: opción ${value} no disponible`);}catch(e){faltantes.push(`${name}: ${e?.message||e}`);}});
      (resp.clear_radio||[]).forEach(name=>{try{form.getRadioGroup(name).clear();}catch(e){faltantes.push(`${name}: ${e?.message||e}`);}});
      (resp.overlay_radios||[]).forEach(group=>{try{
        let field;try{field=form.getRadioGroup(group.name);}catch(_){field=form.createRadioGroup(group.name);}
        const page=pdfDoc.getPages()[Math.max(0,Number(group.page||1)-1)];
        const existing=field.getOptions?.()||[];
        (group.options||[]).forEach(o=>{if(existing.includes(String(o.value)))return;field.addOptionToPage(String(o.value),page,{x:Number(o.x)||0,y:Number(o.y)||0,width:Number(o.width)||18,height:Number(o.height)||18,borderWidth:1,backgroundColor:rgb(1,1,1),borderColor:rgb(0,0,0),textColor:rgb(0,0,0)});});
        if(group.selected)field.select(String(group.selected));
      }catch(e){faltantes.push(`${group?.name||'radio editable'}: ${e?.message||e}`);}});
      try{form.updateFieldAppearances(font);}catch(_){ }
      (resp.draw_text||[]).forEach(d=>{try{const page=pdfDoc.getPages()[Math.max(0,Number(d.page||1)-1)];page.drawText(String(d.text||''),{x:Number(d.x)||0,y:Number(d.y)||0,size:Number(d.size)||9,font});}catch(_){ }});
      const out=await pdfDoc.save({useObjectStreams:false});
      const blob=new Blob([out],{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=resp.file_name||`FORMULARIOS_CONAPE_${r.CODIGO}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),45000);
      const pendientes=resp.campos_pendientes||[];
      const msg=['Formulario oficial prellenado y descargado.','El PDF permanece editable para revisar o completar los campos faltantes.'];
      if(pendientes.length)msg.push('\nPendientes de revisión:\n• '+pendientes.join('\n• '));
      if(faltantes.length)msg.push('\nCampos que el navegador no logró escribir:\n• '+faltantes.slice(0,8).join('\n• '));
      alert(msg.join('\n'));
    }catch(e){alert(adminStudentsSafeUserError(e?.message||String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'));}finally{setFormBusy('');}
  }
  async function aprobarConape(r){
    const estado=String(r.CONAPE_EXPEDIENTE_ESTADO||r.CONAPE_SYNC||'').toUpperCase();
    if(estado==='APLICADO_CONAPE'){alert('Este expediente ya está actualizado en CONAPE.');return;}
    const referencia=prompt('Referencia o detalle de la respuesta de CONAPE (opcional):','Aprobación recibida por la Academia');
    if(referencia===null)return;
    const confirmacion=prompt(`Para publicar únicamente el expediente ${r.CODIGO}, escribí exactamente su código:`,'');
    if(confirmacion===null)return;
    if(String(confirmacion).trim()!==String(r.CODIGO)){alert('El código no coincide. No se modificó CONAPE.');return;}
    if(!confirm('Se actualizará únicamente este expediente en CONAPE. ¿Continuar?'))return;
    setApproveBusy(r.CAMBIO_ID);
    try{
      const resp=await postAdminStudents('aprobarAplicarCambioConape',{cambio_id:r.CAMBIO_ID,codigo:r.CODIGO,confirmacion_individual:String(r.CODIGO),referencia_aprobacion:referencia,respuesta_conape:referencia},90000);
      if(!resp?.ok)throw new Error(resp?.error||'No fue posible publicar el plan CONAPE.');
      const fin=resp?.estado_financiero||{};
      alert((resp?.mensaje||'Plan CONAPE publicado.')+(resp?.carta_no_deuda_lista?'':'\n\nLa carta de no deuda todavía no es apta: primero aplicá los pagos pendientes y luego usá “Recalcular carta”.'));
      cargar();onReverted?.(resp);
    }catch(e){alert(adminStudentsSafeUserError(e?.message||String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'));}finally{setApproveBusy('');}
  }
  async function marcarEntregado(r){
    if(!confirm('¿Confirmar que la constancia fue entregada al estudiante?'))return;
    const key=`${r.CAMBIO_ID}-E`;setDocBusy(key);
    try{const resp=await postAdminStudents('marcarConstanciaTrasladoEntregada',{cambio_id:r.CAMBIO_ID});if(!resp?.ok)throw new Error(resp?.error||'No se pudo registrar la entrega.');cargar();}
    catch(e){alert(adminStudentsSafeUserError(e?.message||String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'));}finally{setDocBusy('');}
  }
  return <div style={{position:'fixed',inset:0,zIndex:2500,background:'rgba(7,20,40,.68)',display:'flex',alignItems:'center',justifyContent:'center',padding:18}}><div style={{width:'min(1080px,96vw)',maxHeight:'90vh',overflowY:'auto',background:'white',borderRadius:15,boxShadow:'0 28px 80px rgba(0,0,0,.35)'}}>
    <div style={{padding:'16px 18px',background:'#0D2B51',color:'white',display:'flex',justifyContent:'space-between',alignItems:'center',borderRadius:'15px 15px 0 0'}}><div><div style={{fontSize:10,fontWeight:900,letterSpacing:'.12em',textTransform:'uppercase',opacity:.7}}>Auditoría inmutable</div><div style={{fontSize:20,fontWeight:900}}>Historial y documentos de cambios</div></div><button onClick={onClose} style={{background:'none',border:'none',color:'white',fontSize:24,cursor:'pointer'}}>×</button></div>
    <div style={{padding:17}}>{estado.loading?<div style={{padding:25,textAlign:'center'}}>Cargando historial…</div>:estado.error?<div style={{padding:12,background:'#FFEBEE',color:'#B42318',borderRadius:9}}>{estado.error}</div>:!estado.rows.length?<div style={{padding:25,textAlign:'center',color:'#667085'}}>No existen cambios registrados.</div>:<div style={{display:'grid',gap:9}}>{estado.rows.map(r=>{
      const simple=String(r.TIPO_OPERACION||'').toUpperCase()==='TRASLADO_SIMPLE';
      const docKey=`${r.CAMBIO_ID}-${simple?'T':'C'}`;
      return <div key={r.CAMBIO_ID} style={{border:'1px solid #E0E6ED',borderRadius:11,padding:12,display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:12,alignItems:'center'}}>
        <div>
          <div style={{fontWeight:900,color:'#14213D'}}>{r.NIVEL} · {r.GRUPO_ORIGEN} → {r.GRUPO_DESTINO}</div>
          <div style={{fontSize:10.5,color:'#667085',marginTop:3}}>{String(r.FECHA||'')} · {r.MOTIVO} · {r.ESTADO_APROBACION}</div>
          <div style={{fontSize:10.5,color:'#667085',marginTop:2}}>{r.horario_origen||'Horario origen sin registrar'} → {r.horario_destino||'Horario destino sin registrar'}</div>
          <div style={{fontSize:10.5,color:'#667085',marginTop:2}}>Por {r.APROBADO_POR_1||'—'} · CONAPE {r.CONAPE_SYNC||'—'} · INA {r.INA_ESTADO||'—'}</div>
          {r.PDF_TRASLADO_ESTADO&&<div style={{fontSize:10,color:'#246B2A',fontWeight:900,marginTop:3}}>Constancia: {r.PDF_TRASLADO_ESTADO}</div>}
          {r.CARTA_CONAPE_ESTADO&&<div style={{fontSize:10,color:'#244A7C',fontWeight:900,marginTop:3}}>Carta CONAPE: {r.CARTA_CONAPE_ESTADO}</div>}
          {!simple&&<div style={{fontSize:10,color:String(r.CONAPE_EXPEDIENTE_ESTADO||'').toUpperCase()==='APLICADO_CONAPE'?'#246B2A':'#B42318',fontWeight:900,marginTop:3}}>Expediente CONAPE: {r.CONAPE_EXPEDIENTE_ESTADO||r.CONAPE_SYNC||'PENDIENTE'}</div>}
          {r.CONAPE_REFERENCIA&&<div style={{fontSize:9.5,color:'#667085',marginTop:2}}>Referencia: {r.CONAPE_REFERENCIA}</div>}
          {r.REVERSADO_EN&&<div style={{fontSize:10.5,color:'#B42318',fontWeight:900,marginTop:3}}>Reversado: {String(r.REVERSADO_EN)}</div>}
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end',maxWidth:430}}>
          <AkActionButton disabled={docBusy===docKey} onClick={()=>abrirDocumento(r)}>{docBusy===docKey?'Generando…':simple?(r.PDF_TRASLADO_URL?'📄 Abrir traslado':'📄 Generar traslado'):(r.CARTA_CONAPE_URL?'📄 Abrir carta CONAPE':'📄 Carta CONAPE')}</AkActionButton>
          {!simple&&r.CARTA_CONAPE_URL&&<AkActionButton disabled={docBusy===`${r.CAMBIO_ID}-R`} onClick={()=>regenerarCarta(r)}>{docBusy===`${r.CAMBIO_ID}-R`?'Recalculando…':'↻ Recalcular carta'}</AkActionButton>}
          {!simple&&<AkActionButton disabled={formBusy===`${r.CAMBIO_ID}-F`} onClick={()=>descargarFormularioConape(r)}>{formBusy===`${r.CAMBIO_ID}-F`?'Preparando…':'⬇ Descargar formulario CONAPE'}</AkActionButton>}
          {!simple&&String(r.CONAPE_EXPEDIENTE_ESTADO||r.CONAPE_SYNC||'').toUpperCase()!=='APLICADO_CONAPE'&&<AkActionButton disabled={approveBusy===r.CAMBIO_ID} onClick={()=>aprobarConape(r)}>{approveBusy===r.CAMBIO_ID?'Publicando…':'✓ CONAPE aprobó · Publicar plan'}</AkActionButton>}
          {simple&&r.PDF_TRASLADO_URL&&String(r.PDF_TRASLADO_ESTADO||'').toUpperCase()!=='ENTREGADO_AL_ESTUDIANTE'&&<AkActionButton disabled={docBusy===`${r.CAMBIO_ID}-E`} onClick={()=>marcarEntregado(r)}>{docBusy===`${r.CAMBIO_ID}-E`?'Guardando…':'✓ Marcar entregado'}</AkActionButton>}
          <AkActionButton danger disabled={!!r.REVERSADO_EN||busy===r.CAMBIO_ID||String(r.REVERSIBLE||'').toUpperCase()!=='SI'} title={String(r.REVERSIBLE||'').toUpperCase()==='SI'?'Reversión automática disponible':'Este cambio requiere revisión asistida; no se revierte desde el botón.'} onClick={()=>revertir(r.CAMBIO_ID)}>{busy===r.CAMBIO_ID?'Revisando…':String(r.REVERSIBLE||'').toUpperCase()==='SI'?'↶ Deshacer':'Revisión asistida'}</AkActionButton>
        </div>
      </div>;
    })}</div>}</div>
  </div></div>;
}

function AdminEstudianteResumenIndividual({ estudianteBase, onClose, onNavigate }) {
  const codigo = agIndNorm(estudianteBase?.codigo || estudianteBase?.rec_m || estudianteBase?.CODIGO);
  const [estado, setEstado] = React.useState({ loading:true, detalle:null, asistencia:[], comentarioAdmin:'', historial:[], error:'' });
  const [nivelAbierto, setNivelAbierto] = React.useState('');
  const [refreshKey,setRefreshKey]=React.useState(0);
  const [modalEstado,setModalEstado]=React.useState(null);
  const [modalCambio,setModalCambio]=React.useState(null);
  const [historial,setHistorial]=React.useState(false);
  const [comentarioOpen,setComentarioOpen]=React.useState(false);
  const [syncing,setSyncing]=React.useState('');
  const [toast,setToast]=React.useState('');
  const nivelColor={B1:'#C88A00',B2:'#CF3028',I1:'#1769A5',I2:'#2E7D32'};

  React.useEffect(() => {
    let activo = true;
    if (!codigo) { setEstado({ loading:false, detalle:null, asistencia:[], comentarioAdmin:'', historial:[], error:'El estudiante no tiene código de expediente.' }); return () => { activo=false; }; }
    setEstado(v=>({ ...v, loading:true, error:'' }));
    Promise.all([postAdminStudents('getEstudiante', { codigo }),postAdminStudents('getAsistenciaEstudiante', { codigo }),postAdminStudents('getComentarioAdminEstudiante',{codigo}).catch(()=>({ok:false})),postAdminStudents('getHistorialCambiosGrupo',{codigo}).catch(()=>({ok:false,historial:[]}))])
      .then(([ficha, asist, comentario, historialResp]) => {
        if (!activo) return;
        if (!ficha || ficha.ok !== true) { setEstado({ loading:false, detalle:null, asistencia:[], comentarioAdmin:'', historial:[], error:adminStudentsSafeUserError(ficha?.error||ficha?.mensaje,'No se pudo cargar el expediente. Intentá de nuevo.','agenda_expediente') }); return; }
        setEstado({ loading:false, detalle:ficha, asistencia:(asist&&asist.ok&&Array.isArray(asist.asistencia))?asist.asistencia:[], comentarioAdmin:comentario?.ok?agIndNorm(comentario.comentario_admin):'', historial:historialResp?.ok&&Array.isArray(historialResp.historial)?historialResp.historial:[], error:'' });
      }).catch(e => activo && setEstado({ loading:false, detalle:null, asistencia:[], comentarioAdmin:'', historial:[], error:adminStudentsSafeUserError(e?.message||String(e),'No se pudo cargar el expediente. Intentá de nuevo.','agenda_expediente') }));
    return () => { activo=false; };
  }, [codigo,refreshKey]);

  function refrescar(msg){if(msg)setToast(msg);setRefreshKey(k=>k+1);setTimeout(()=>setToast(''),4500);}
  async function syncConape(nivel){setSyncing(nivel);const r=await resincronizarEstudianteIndividual(codigo);setSyncing('');refrescar(r?.ok?'CONAPE actualizado correctamente.':'CONAPE quedó pendiente: '+(r?.error||'error de sincronización'));}
  function abrirFicha(info,nivel){sessionStorage.setItem('an_estudiante_prefill',JSON.stringify({codigo,nivel,grupo:info.grupo,tab:'ficha'}));if(onNavigate)onNavigate('estudiantes',{grupo:info.grupo});else setToast('La ficha completa ya está abierta en esta consulta.');}

  if (estado.loading) return <div style={{padding:'42px 24px',textAlign:'center',color:'var(--ink-3,#888)'}}>Cargando ficha individual…</div>;
  if (estado.error || !estado.detalle) return <div style={{padding:24}}><div style={{padding:'14px 16px',border:'1px solid #F4B7B7',background:'#FFEBEE',color:'#C62828',borderRadius:12,fontWeight:700}}>{estado.error||'Ficha no disponible.'}</div><button type="button" onClick={onClose} style={{marginTop:12,padding:'9px 14px',borderRadius:9,border:'1px solid var(--line,#ddd)',background:'white',cursor:'pointer',fontWeight:800}}>Cerrar consulta</button></div>;

  const d=estado.detalle,est=d.estudiante||{},niveles=d.niveles||{},pend=d.pendientes?.por_nivel||{},movimientos=agIndMovimientos(d),comentarioAdmin=agIndNorm(estado.comentarioAdmin),historialCount=Array.isArray(estado.historial)?estado.historial.length:0;
  const nombre=agIndNorm(est.NOMBRE||estudianteBase?.nombre||estudianteBase?.display)||'Estudiante',cedula=agIndNorm(est.NUM_CEDULA||estudianteBase?.cedula),telefono=agIndNorm(est.TELEFONO||estudianteBase?.telefono),correo=agIndNorm(est.email||est.EMAIL||estudianteBase?.email),convenio=agIndNorm(est.CONVENIO||estudianteBase?.convenio)||'—',grupoActual=agIndNorm(d.cod_grupo||est.GRUPO||estudianteBase?.grupo)||'—';
  const totalAsis=estado.asistencia.length,totalPres=estado.asistencia.filter(r=>agIndPresente(r?.presente??r?.PRESENTE)).length,pctGlobal=totalAsis?Math.round(totalPres/totalAsis*100):null,orden=['B1','B2','I1','I2'];
  const gridCols='minmax(190px,1.2fr) minmax(112px,.62fr) minmax(128px,.72fr) minmax(215px,1.08fr) minmax(118px,.66fr) 82px 92px 30px';

  return <div style={{padding:'14px 16px 22px',background:'var(--bg,#f7f4ef)'}}>
    {toast&&<div style={{position:'fixed',right:22,bottom:22,zIndex:2600,padding:'11px 15px',borderRadius:10,background:toast.startsWith('CONAPE quedó')?'#B42318':'#2E7D32',color:'white',fontSize:12,fontWeight:900,boxShadow:'0 8px 25px rgba(0,0,0,.24)'}}>{toast}</div>}
    <div style={{background:'linear-gradient(135deg,#112A4C,#193C68)',color:'white',borderRadius:14,padding:'14px 16px',marginBottom:12,boxShadow:'0 10px 24px rgba(20,33,61,.16)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:14,flexWrap:'wrap',alignItems:'flex-start'}}>
        <div style={{minWidth:260}}><div style={{fontSize:9.5,fontWeight:900,letterSpacing:'.16em',textTransform:'uppercase',opacity:.68}}>Consulta individual · filtro de ESTATUS</div><div style={{fontFamily:'var(--f-serif,serif)',fontSize:25,fontWeight:650,marginTop:3}}>{nombre}</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,max-content))',columnGap:17,rowGap:4,marginTop:8,fontSize:10.5,opacity:.9}}><span>Código <b>{codigo}</b></span>{cedula&&<span>Cédula <b>{cedula}</b></span>}<span>Grupo actual <b>{grupoActual}</b></span><span>Convenio <b>{convenio}</b></span>{telefono&&<span>Teléfono <b>{telefono}</b></span>}{correo&&<span>Correo <b>{correo}</b></span>}</div></div>
        <div style={{display:'flex',flexDirection:'column',gap:7,alignItems:'stretch'}}>
          <div style={{display:'flex',gap:7,alignItems:'stretch',flexWrap:'wrap',justifyContent:'flex-end'}}><div style={{minWidth:110,padding:'8px 10px',borderRadius:9,background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.22)',textAlign:'center'}}><div style={{fontSize:8.5,fontWeight:900,textTransform:'uppercase',letterSpacing:'.1em',opacity:.72}}>Asistencia total</div><div style={{marginTop:2,fontSize:21,fontWeight:900,color:pctGlobal==null?'white':(pctGlobal>=70?'#BDE9C4':'#FFC4C0')}}>{pctGlobal==null?'—':`${pctGlobal}%`}</div><div style={{fontSize:8.5,opacity:.72}}>{totalAsis?`${totalPres}/${totalAsis} registros`:'Sin registros'}</div></div><button type="button" onClick={()=>setHistorial(true)} title={historialCount?`${historialCount} cambio(s) registrado(s). Revisar historial.`:'No existen cambios registrados.'} style={{padding:'8px 11px',borderRadius:9,border:`1px solid ${historialCount?'#F1C45C':'rgba(255,255,255,.24)'}`,background:historialCount?'#F6C453':'rgba(255,255,255,.1)',color:historialCount?'#3F2A00':'white',fontWeight:950,cursor:'pointer',boxShadow:historialCount?'0 0 0 3px rgba(246,196,83,.16)':'none'}}>{historialCount?`🕘 Historial · ${historialCount} por revisar`:'🕘 Historial'}</button><button type="button" onClick={onClose} style={{padding:'8px 11px',borderRadius:9,border:'1px solid rgba(255,255,255,.24)',background:'white',color:'#14213D',fontWeight:900,cursor:'pointer'}}>Cerrar</button></div>
          <button type="button" onClick={()=>setComentarioOpen(true)} title={comentarioAdmin||'Agregar comentario interno'} style={{alignSelf:'flex-end',minWidth:220,padding:'8px 11px',borderRadius:9,border:`1px solid ${comentarioAdmin?'#F1C45C':'rgba(255,255,255,.32)'}`,background:comentarioAdmin?'#FFF3CF':'rgba(255,255,255,.12)',color:comentarioAdmin?'#5B3B00':'white',fontWeight:950,cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{comentarioAdmin?'📝 Comentario registrado':'＋ Agregar comentario'}</button>
        </div>
      </div>
    </div>

    <div style={{overflowX:'auto',borderRadius:12}}>
      <div style={{minWidth:1040}}>
        <div style={{display:'grid',gridTemplateColumns:gridCols,gap:8,padding:'0 13px 7px 18px',fontSize:8.5,fontWeight:900,letterSpacing:'.09em',textTransform:'uppercase',color:'#756D65'}}><span>Nivel y grupo</span><span>Convenio</span><span>Estado</span><span>Finanzas / comprobantes</span><span>Certificado</span><span>Nota</span><span>Asistencia</span><span></span></div>
        <div style={{display:'grid',gap:8}}>{orden.map(nivel=>{const info=niveles[nivel]||{},pendienteNivel=pend[nivel]||{},estatus=agIndUpper(info.estatus)||'SIN REGISTRO',tone=agIndStatusTone(estatus),grupo=agIndNorm(info.grupo)||'—',notaNum=info.nota===''||info.nota==null||isNaN(Number(info.nota))?null:Number(info.nota),asis=agIndAsistenciaNivel(estado.asistencia,nivel,grupo),color=nivelColor[nivel]||'#8B8178',movsNivel=movimientos.filter(m=>m.nivel===nivel),resumen=agIndResumenMovimientos(movsNivel,pendienteNivel),finanzas=agIndFinanzasNivel(estatus,movsNivel,resumen),abierto=nivelAbierto===nivel,periodoCorto=agIndNorm(info.periodo_corto)||'PERIODO SIN DEFINIR',periodoLargo=agIndNorm(info.periodo_largo),convNivel=agIndNorm(info.convenio)||convenio,intentos=Array.isArray(info.intentos)?info.intentos:[],trasladoDesde=agIndNorm(info.traslado_desde),gruposPagoAplicados=Array.isArray(pendienteNivel?.grupos_pago_aplicados)?pendienteNivel.grupos_pago_aplicados:[],pagosConvalidados=!!pendienteNivel?.pagos_convalidados,finIntentos=agIndFinanzasIntentos(d,nivel),finActual=finIntentos.find(x=>x?.es_actual)||finIntentos[finIntentos.length-1]||null,deudaFin=Number(finActual?.deuda_exigible||0),excedenteFin=Number(finActual?.excedente_bancario||0),finLabel=finIntentos.length?(deudaFin>0.005?`DEUDA ${agIndMoney(deudaFin)}`:'AL DÍA'):finanzas.label,finTone=deudaFin>0.005?{bg:'#FFEBEE',fg:'#C62828',bd:'#F4B7B7'}:{bg:'#E8F5E9',fg:'#2E7D32',bd:'#BFE4C3'},certRegistro=agIndNorm(info.reg_certificados||info.cert_num),certPendienteDocumento=!certRegistro&&['APR','CNV'].includes(estatus);
          return <div key={nivel} style={{background:'white',border:'1px solid #DED8D0',borderRadius:11,boxShadow:abierto?'0 10px 24px rgba(20,33,61,.10)':'0 3px 10px rgba(20,33,61,.035)',overflow:'hidden'}}>
            <button type="button" onClick={()=>setNivelAbierto(abierto?'':nivel)} aria-expanded={abierto} style={{width:'100%',border:'none',background:'white',cursor:'pointer',padding:'9px 12px 9px 0',display:'grid',gridTemplateColumns:`8px ${gridCols}`,gap:8,alignItems:'center',textAlign:'left',fontFamily:'inherit'}}>
              <span style={{alignSelf:'stretch',background:color,borderRadius:'0 6px 6px 0'}}></span>
              <div><div style={{display:'flex',alignItems:'baseline',gap:7,flexWrap:'wrap'}}><span style={{fontSize:14,fontWeight:950,color}}>{NIVEL_LABEL_P[nivel]}</span><span style={{fontSize:9,fontWeight:900,color:'#5D6673'}}>{periodoCorto}</span></div><div style={{fontSize:10,color:'#596273',marginTop:2,fontFamily:'var(--f-mono,monospace)'}}>{grupo}</div>{periodoLargo&&<div style={{fontSize:8.5,color:'#8A8178',marginTop:1}}>{periodoLargo}</div>}{trasladoDesde&&<div style={{fontSize:8.5,color:'#8A5600',fontWeight:900,marginTop:2}}>↪ desde {agIndGrupoCorto(trasladoDesde)}</div>}</div>
              <span style={{justifySelf:'start',display:'inline-flex',padding:'4px 7px',borderRadius:999,background:'#EEF4FF',color:'#244A7C',border:'1px solid #C9D9F1',fontSize:9,fontWeight:900,maxWidth:108,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{convNivel}</span>
              <div><span style={{display:'inline-flex',padding:'4px 8px',borderRadius:999,background:tone.bg,color:tone.fg,border:`1px solid ${tone.bd}`,fontSize:9.5,fontWeight:950}}>{estatus}</span>{intentos.length>1&&<div style={{fontSize:8.5,color:'#9A5B00',fontWeight:900,marginTop:3}}>{intentos.length} intentos</div>}</div>
              <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}><span style={{display:'inline-flex',padding:'4px 7px',borderRadius:999,background:finIntentos.length?finTone.bg:finanzas.bg,color:finIntentos.length?finTone.fg:finanzas.fg,border:`1px solid ${finIntentos.length?finTone.bd:finanzas.bd}`,fontSize:9,fontWeight:950}}>{finLabel}</span>{finIntentos.length>1&&<span style={{fontSize:8.5,color:'#7A4A00',fontWeight:900}}>{finIntentos.length} intentos separados</span>}{excedenteFin>0.005&&<span style={{fontSize:8.5,color:'#8A5A00',fontWeight:900}}>Excedente {agIndMoney(excedenteFin)}</span>}{!finIntentos.length&&!finanzas.aplica&&<span style={{fontSize:9,color:'#756D65',fontWeight:800}}>Sin matrícula / obligación</span>}</div>
              <div><span title={certRegistro?`Registro oficial ${certRegistro}`:(certPendienteDocumento?'Nivel aprobado sin documento oficial emitido.':'El nivel aún no habilita emisión de certificado.')} style={{display:'inline-flex',padding:'4px 7px',borderRadius:999,background:certRegistro?'#E8F5E9':certPendienteDocumento?'#FFF8E1':'#F4F1EC',color:certRegistro?'#2E7D32':certPendienteDocumento?'#9A6200':'#756D65',border:`1px solid ${certRegistro?'#BFE4C3':certPendienteDocumento?'#F1D18A':'#DED7CF'}`,fontSize:8.5,fontWeight:950,maxWidth:112,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{certRegistro?`EMITIDO · ${certRegistro}`:certPendienteDocumento?'PENDIENTE':'NO EMITIDO'}</span></div>
              <div style={{fontSize:12,fontWeight:950,color:notaNum!=null&&notaNum<70?'#C62828':'#14213D'}}>{notaNum==null?'—':notaNum.toFixed(notaNum%1?1:0)}</div>
              <div><div style={{fontSize:11,fontWeight:950,color:asis.pct!=null&&asis.pct<70?'#C62828':'#14213D'}}>{asis.pct==null?'—':`${asis.pct}%`}</div>{asis.total>0&&<div style={{fontSize:8.5,color:'#81776F'}}>{asis.presentes}/{asis.total}</div>}</div>
              <span style={{width:25,height:25,borderRadius:999,display:'inline-flex',alignItems:'center',justifyContent:'center',background:abierto?color:'#F1EEE9',color:abierto?'white':'#6B625A',fontSize:14,fontWeight:900,transform:abierto?'rotate(180deg)':'none'}}>⌄</span>
            </button>
            {abierto&&<div style={{padding:'8px 12px 12px 16px',borderTop:'1px solid #EAE4DC',background:'#FBFAF8'}}>
              <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:7}}><div style={{fontSize:9.5,fontWeight:800,color:['CA','REP'].includes(estatus)?'#256B36':'#7A6250'}}>Cambio académico: {['CA','REP'].includes(estatus)?'evaluación individual habilitada':'no aplica para este estado'}</div><div style={{display:'flex',gap:5,flexWrap:'wrap'}}><AkActionButton onClick={()=>abrirFicha(info,nivel)}>👤 Ficha</AkActionButton><AkActionButton onClick={()=>setModalEstado({nivel,info})}>✏️ Estado</AkActionButton><AkActionButton disabled={syncing===nivel} onClick={()=>syncConape(nivel)}>{syncing===nivel?'↻ Actualizando…':'↻ CONAPE'}</AkActionButton><AkActionButton disabled={!finanzas.aplica} title={!finanzas.aplica?'El nivel no tiene matrícula activa. No se permite registrar pagos por adelantado.':''} onClick={()=>finanzas.aplica&&abrirPago({...estudianteBase,...est,codigo,grupo},nivel,onNavigate)}>💳 Pago</AkActionButton><AkActionButton disabled={!['CA','REP'].includes(estatus)} onClick={()=>['CA','REP'].includes(estatus)&&setModalCambio({nivel,info})}>🧭 Evaluar cambio</AkActionButton></div></div>
              {pagosConvalidados&&<div style={{margin:'0 0 7px',padding:'6px 9px',borderRadius:8,background:'#EEF7FF',border:'1px solid #BFD8EE',color:'#244A7C',fontSize:9.5,fontWeight:750}}>↪ {agIndNorm(pendienteNivel?.pagos_leyenda)||`Pagos conservados y aplicados a ${agIndGrupoCorto(grupo)}.`}</div>}
              {finIntentos.length?<div style={{display:'grid',gap:7}}>{finIntentos.map((it,i)=><AgIndIntentoFinanciero key={it.intento_id||i} intento={it} color={color} nivel={nivel} certificadoRegistro={certRegistro}/>)}</div>:<div style={{padding:'9px 10px',border:'1px dashed #D9D0C7',borderRadius:8,color:'#81776F',fontSize:10,background:'white'}}>{finanzas.aplica?'El backend todavía no separó los comprobantes por intento.':'No aplica: el nivel no tiene matrícula activa ni obligación financiera.'}</div>}
            </div>}
          </div>;
        })}</div>
      </div>
    </div>
    <div style={{marginTop:8,fontSize:9.5,color:'var(--ink-3,#81776f)'}}>La columna financiera separa comprobantes por intento. Los excedentes se informan, pero no se aplican automáticamente. PE y SIN REGISTRO se presentan como NO APLICA.</div>
    {modalEstado&&<ModalEstatus estudiante={{...estudianteBase,...est,codigo,display:nombre,grupo:modalEstado.info.grupo,estatus:modalEstado.info.estatus,nota:modalEstado.info.nota}} nivel={modalEstado.nivel} onClose={()=>setModalEstado(null)} onSuccess={()=>refrescar('Estado actualizado.')}/>} 
    {modalCambio&&<AkCambioAcademicoWizard codigo={codigo} nivel={modalCambio.nivel} infoNivel={modalCambio.info} onClose={()=>setModalCambio(null)} onSuccess={()=>refrescar('Cambio académico individual aplicado. Revisá grupo, intento, pagos y estado CONAPE.')}/>} 
    {historial&&<AkHistorialCambiosModal codigo={codigo} onClose={()=>setHistorial(false)} onReverted={()=>refrescar('Cambio de grupo reversado.')}/>} 
    {comentarioOpen&&<AkComentarioAdminModal codigo={codigo} comentarioAdmin={comentarioAdmin} onClose={()=>setComentarioOpen(false)} onSaved={(comentario)=>{setEstado(v=>({...v,comentarioAdmin:comentario||''}));setToast('Comentario administrativo actualizado.');setTimeout(()=>setToast(''),4500);}}/>}
  </div>;
}

function AgIndMetric({ label, value, warn, sub }) {
  return (
    <div style={{ minWidth:92, padding:'7px 9px', borderRadius:9, background:warn ? '#FFF1F1' : '#F8F7F5', border:`1px solid ${warn ? '#F4B7B7' : '#EAE5DF'}` }}>
      <div style={{ fontSize:8.5, fontWeight:900, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--ink-3,#8b8178)' }}>{label}</div>
      <div style={{ marginTop:2, fontSize:12.5, fontWeight:900, color:warn ? '#C62828' : 'var(--an-navy,#14213D)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{value}</div>
      {sub && <div style={{ fontSize:8.5, color:'var(--ink-3,#8b8178)', marginTop:1 }}>{sub}</div>}
    </div>
  );
}

function AgIndPagoResumen({ label, pagado, pendiente, comprobantes=0, aplica=true, color }) {
  if (!aplica) {
    return (
      <div style={{ minWidth:120, padding:'7px 8px', borderRadius:8, background:'#F7F4EF', border:'1px solid #E4DDD5' }}>
        <div style={{ display:'flex',justifyContent:'space-between',gap:6,alignItems:'center' }}><span style={{fontSize:8.5,fontWeight:950,textTransform:'uppercase',letterSpacing:'.07em',color:'#756D65'}}>{label}</span><span style={{width:18,height:3,borderRadius:999,background:color}} /></div>
        <div style={{marginTop:7,fontSize:9.5,fontWeight:900,color:'#756D65'}}>NO APLICA</div>
        <div style={{marginTop:2,fontSize:8.5,color:'#91877E'}}>Nivel sin matrícula activa</div>
      </div>
    );
  }
  const tiene = Number(comprobantes || 0) > 0;
  return (
    <div style={{ minWidth:120, padding:'7px 8px', borderRadius:8, background:'white', border:'1px solid #E4DDD5' }}>
      <div style={{ display:'flex',justifyContent:'space-between',gap:6,alignItems:'center' }}><span style={{fontSize:8.5,fontWeight:950,textTransform:'uppercase',letterSpacing:'.07em',color:'#756D65'}}>{label}</span><span style={{width:18,height:3,borderRadius:999,background:color}} /></div>
      <div style={{ marginTop:4,display:'grid',gridTemplateColumns:'auto 1fr',columnGap:6,rowGap:2,fontSize:9 }}><span style={{color:'#81776F'}}>Comprobantes</span><b style={{textAlign:'right',color:tiene?'#1565C0':'#9A6200'}}>{Number(comprobantes||0)}</b><span style={{color:'#81776F'}}>Aplicado</span><b style={{textAlign:'right',fontFamily:'var(--f-mono,monospace)',color:'#14213D'}}>{agIndMoney(pagado)}</b><span style={{color:'#81776F'}}>Pendiente calc.</span><b style={{textAlign:'right',fontFamily:'var(--f-mono,monospace)',color:Number(pendiente||0)>0?'#C67100':'#596273'}}>{agIndMoney(pendiente)}</b></div>
    </div>
  );
}

Object.assign(window, { AdminEstudiantesView, AdminEstudianteResumenIndividual });
