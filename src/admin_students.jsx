/* global React, PageHeader */
// CALGRUPO_F2_20260616_ESTUDIANTES_COMPACTO_OPERATIVO
// CALGRUPO_F5_20260617_CERTIFICADOS_MASIVOS_UI
// CALGRUPO_F6_20260617_ESTADOS_CERTIFICADO_VISUAL_SIN_BACKEND
// CALGRUPO_F7_20260617_ESTUDIANTES_VIEJO_LIMPIO_SIN_CALENDARIO
// CALGRUPO_F10_20260617_FILTROS_OPERATIVOS_RIESGO_VISUAL
// CALGRUPO_F13_20260617_SEGUIMIENTO_RAPIDO_WHATSAPP
// CALGRUPO_F14_20260617_EXPORT_RESUMEN_OPERATIVO
// CALGRUPO_F15_20260617_MAPA_NIVELES_ENFOQUE_OPERATIVO
// CALGRUPO_F19_20260617_REPORTE_IMPRIMIBLE_GRUPO

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
async function postAdminStudents(fn, payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const r = await fetch(`${SCRIPT_URL_AS}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      fn,
      token,
      ...payload,
    }),
  });
  return await r.json();
}

async function resincronizarEstudianteIndividual(codigo) {
  // Llama sincronizarCONAPE con param 'codigo' (dispatcher GET).
  // Devuelve { ok, mensaje, error }.
  try {
    const resp = await postAdminStudents('sincronizarCONAPE', { codigo: String(codigo) });
    return resp;
  } catch(e) {
    return { ok: false, error: 'Error de conexión: ' + (e.message || e) };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────
function useAdminGrupos() {
  const [grupos, setGrupos]   = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState('');
  React.useEffect(() => {
    let activo = true;
    setError('');
    postAdminStudents('getAdminDashboard')
      .then(d => {
        if (!activo) return;
        if (d && d.ok) {
          setGrupos(d.grupos || []);
        } else {
          setError((d && d.error) || 'Respuesta no válida del servidor');
        }
      })
      .catch(e => { if (activo) setError('Error de conexión: ' + (e.message || e)); })
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, []);
  return { grupos, loading, error };
}

function useRadiografia(codGrupo, refreshKey) {
  const [data, setData]       = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (!codGrupo) return;
    setLoading(true); setData(null);
    postAdminStudents('getRadiografiaGrupo', { cod_grupo: codGrupo })
      .then(d => { if (d && d.ok) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [codGrupo, refreshKey]);
  return { data, loading };
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
        setError(data.error || 'Error al actualizar');
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
      setReintentoMsg('⚠ ' + (r.error || 'No se pudo sincronizar'));
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
              <span>Estatus guardado en APOLLO, pero CONAPE no se sincronizó</span>
            </div>
            <div style={{ marginBottom: reintentoMsg ? 8 : 0 }}>
              Las hojas 4-7 de CONAPE quedaron sin actualizar. Podés reintentar ahora o sincronizar después.
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
    APR: { label:'Aprobado',   bg:'#E8F5E9', color:'#2E7D32' },
    REP: { label:'Reprobado',  bg:'#FFEBEE', color:'#C62828' },
    RI:  { label:'Retirado+',  bg:'#FFF3E0', color:'#E65100' },
    RJ:  { label:'Retirado',   bg:'#FAFAFA', color:'#757575' },
    CNV: { label:'Convalida',  bg:'#F3E5F5', color:'#6A1B9A' },
    PE:  { label:'Proyectado', bg:'#F5F5F5', color:'#9E9E9E' },
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
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 7px', borderRadius:999, background:t.bg, color:t.fg, border:`1px solid ${t.bd}`, fontSize:10.5, fontWeight:800, lineHeight:1.1, whiteSpace:'nowrap' }}>
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
  if (st === 'APR' && certPago) {
    return {
      key:'listo', tone:'blue', label:'Listo para crear', sub:'APR + certificado pagado',
      hint:'Puede generar el certificado por primera vez. Después debe cambiar a Ver PDF.',
      canVer:false, canCrear:true,
    };
  }
  if (st === 'APR' && !certPago) {
    return {
      key:'falta_pago', tone:'warn', label:'Falta pago', sub:'Certificado no pagado',
      hint:'El estudiante está APR, pero no aparece pago de certificado.',
      canVer:false, canCrear:false,
    };
  }
  if (certPago && st !== 'APR') {
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
    ok:    { bg:'#E8F5E9', fg:'#2E7D32', bd:'#BFE4C3' },
    blue:  { bg:'#E3F2FD', fg:'#1565C0', bd:'#B9DAF5' },
    warn:  { bg:'#FFF8E1', fg:'#9A6200', bd:'#F1D18A' },
    muted: { bg:'var(--surface-2,#f8f8f8)', fg:'var(--ink-3,#888)', bd:'var(--line,#ddd)' },
  };
  const t = tones[state.tone] || tones.muted;
  return (
    <div title={state.hint} style={{ display:'inline-flex', flexDirection:'column', gap:2, padding:'5px 8px', borderRadius:9, background:t.bg, color:t.fg, border:`1px solid ${t.bd}`, minWidth:118 }}>
      <span style={{ fontSize:10.5, fontWeight:900, lineHeight:1.1 }}>{state.label}</span>
      <span style={{ fontSize:9.5, fontWeight:700, opacity:.78, lineHeight:1.15, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:138 }}>{state.sub}</span>
    </div>
  );
}

function CertificadoCell({ certPago, certNum, estatus, onCrear, onVer }) {
  const state = certVisualState({ estatus, certPago, certNum });
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-start' }}>
      <CertificadoEstadoBox state={state} />
      {state.canVer && (
        <button onClick={onVer} title="Buscar/abrir PDF existente. No genera copias nuevas." style={{ padding:'5px 9px', borderRadius:7, border:'1px solid #BFE4C3', background:'#E8F5E9', color:'#2E7D32', fontSize:11, fontWeight:800, cursor:'pointer', whiteSpace:'nowrap' }}>
          Ver PDF
        </button>
      )}
      {state.canCrear && (
        <button onClick={onCrear} title="Crear certificado por primera vez" style={{
          padding:'6px 10px', borderRadius:8, border:'1px solid #1565C0',
          background:'#E3F2FD', color:'#1565C0', fontSize:11, fontWeight:800,
          cursor:'pointer', whiteSpace:'nowrap',
        }}>
          Crear certificado
        </button>
      )}
    </div>
  );
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
  if (estatus === 'APR') return 'rgba(76,175,80,0.07)';   // verde muy suave
  if (estatus === 'CA')  return idx%2===0 ? 'white' : 'var(--surface, #FAFAF7)'; // normal
  if (estatus === 'RI' || estatus === 'RJ') return 'rgba(0,0,0,0.03)'; // gris muy suave
  if (estatus === 'REP') return 'rgba(232,55,42,0.05)';  // rojo muy suave
  return idx%2===0 ? 'white' : 'var(--surface, #FAFAF7)';
}

function TablaEstudiantes({ estudiantes, nivelKey, periodo, programa, sortCol, sortDir, toggleSort, sortEstudiantes, onRefresh, onNavigate, onAbrirPanel, generarCertificadoFila, generarCertificadosNivel, filtroOperativo }) {
  const cfg = NIVEL_CONFIG[nivelKey];
  const [modalEstatus, setModalEstatus] = React.useState(null);
  const [resyncEst, setResyncEst] = React.useState(null);
  // { codigo, loading, ok?, error? }
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
              ? 'Genera solo certificados pendientes: APR + certificado pagado + sin REG_CERTIFICADOS. Omite los ya registrados.'
              : 'Pendientes detectados. La generación masiva queda desactivada hasta validar F5 backend para proteger consecutivos.'}
            style={{
              marginLeft:4, padding:'4px 9px', borderRadius:7,
              border:'1px solid rgba(255,255,255,0.55)', background:'rgba(255,255,255,0.18)',
              color:'white', fontSize:10.5, fontWeight:900, cursor: generarCertificadosNivel ? 'pointer' : 'help', letterSpacing:'0.04em',
              textTransform:'uppercase', whiteSpace:'nowrap', opacity: generarCertificadosNivel ? 1 : 0.82,
            }}>
            🏅 Cert. pendientes ({certPendientes})
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
        <table style={{ width: '100%', minWidth: 1120, borderCollapse: 'separate', borderSpacing: 0, fontSize: 12 }}>
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
                { label:'Acciones',    sort:null,     width:220 },
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
              const estatus   = e.estatus || e.status_actual || 'PE';
              const mora = typeof e.mora !== 'undefined' ? !!e.mora : (e.morosidad === 'SI' || e.morosidad === true);
              const matricula    = e.matricula_pagada ?? e.matricula ?? e.mat ?? false;
              const cuotasPagadas = typeof e.cuotas_pagadas === 'number' ? e.cuotas_pagadas : null;
              const cuotasEsperadas = e.cuotas_esperadas || 4;
              const periodoTexto    = e.periodo_texto || '';
              const certPago  = certPagoEstudiante(e);
              const certNum   = certRegistroEstudiante(e);
              const nota      = Number(e.nota || 0);
              const cuotasLabel = cuotasPagadas == null ? '—' : `${cuotasPagadas}/${cuotasEsperadas}`;
              return (
                <tr key={codigo + '-' + i} style={{ background: rowBg(estatus, i), borderBottom:'1px solid var(--line, #EEE)' }}>
                  <td style={{ padding:'10px 10px', fontWeight:800, fontFamily:'var(--f-mono, monospace)', color:'var(--ink,#222)', verticalAlign:'top' }}>{codigo}</td>
                  <td style={{ padding:'10px 10px', verticalAlign:'top' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, alignItems:'start' }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:800, color:'var(--ink,#222)', lineHeight:1.25 }}>{nombre}</div>
                        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', marginTop:4 }}>
                          <span style={{ color:'var(--ink-3,#888)', fontFamily:'var(--f-mono,monospace)', fontSize:10.5 }}>{cedula}</span>
                          {edad !== null && <PillMini label="Edad" value={`${edad}`} tone="muted" />}
                        </div>
                      </div>
                      <WhatsAppMini est={e} filtro={filtroOperativo} />
                    </div>
                  </td>
                  <td style={{ padding:'10px 10px', verticalAlign:'top' }}>
                    {convenio ? (
                      <span style={{
                        background: convenio==='CONAPE' ? '#E3F2FD' : convenio.toString().toUpperCase().includes('BECA') ? '#E8F5E9' : 'var(--surface, #F5F5F5)',
                        color: convenio==='CONAPE' ? '#1565C0' : convenio.toString().toUpperCase().includes('BECA') ? '#2E7D32' : 'var(--ink-3, #888)',
                        padding:'3px 9px', borderRadius:999, fontSize:10, fontWeight:900, letterSpacing:'0.04em', whiteSpace:'nowrap',
                      }}>
                        {String(convenio).toUpperCase().includes('BECA') ? 'BECA' : convenio}
                      </span>
                    ) : <span style={{ color:'var(--ink-3, #999)', fontSize:11 }}>Regular</span>}
                  </td>
                  <td style={{ padding:'10px 10px', verticalAlign:'top' }}>
                    <EstadoBadge estado={estatus} />
                    {periodoTexto && (
                      <div style={{ fontSize:9.5, color:'var(--ink-3, #999)', marginTop:4, fontWeight:600, letterSpacing:'0.01em', whiteSpace:'nowrap' }}>
                        {periodoTexto}
                      </div>
                    )}
                  </td>
                  <td style={{ padding:'10px 10px', verticalAlign:'top' }}>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
                      {estatus === 'PE'
                        ? <PillMini label="Mora" value="—" tone="muted" />
                        : <PillMini label="Mora" value={mora ? 'SI' : 'NO'} tone={mora ? 'bad' : 'ok'} />}
                      <PillMini label="Matr." value={matricula ? '✓' : '—'} tone={matricula ? 'ok' : 'muted'} />
                      <PillMini label="Cuotas" value={cuotasLabel} tone={cuotasPagadas >= cuotasEsperadas ? 'ok' : cuotasPagadas > 0 ? 'warn' : 'muted'} />
                    </div>
                    <div style={{ marginTop:6 }}><CuotasChecks cuotas={cuotasPagadas} esperadas={cuotasEsperadas} /></div>
                  </td>
                  <td style={{ padding:'10px 10px', verticalAlign:'top' }}>
                    <CertificadoCell
                      certPago={certPago}
                      certNum={certNum}
                      estatus={estatus}
                      onCrear={() => generarCertificadoFila && generarCertificadoFila(e, nivelKey)}
                      onVer={() => onAbrirPanel && onAbrirPanel(e, 'documentos')}
                    />
                  </td>
                  <td style={{ padding:'10px 10px', verticalAlign:'top' }}>
                    <span style={{
                      display:'inline-flex', minWidth:46, justifyContent:'center', padding:'4px 8px', borderRadius:999,
                      background: nota>=70 ? '#E8F5E9' : nota>0 ? '#FFEBEE' : 'var(--surface-2,#f8f8f8)',
                      color: nota>=70 ? '#2E7D32' : nota>0 ? '#C62828' : 'var(--ink-3,#999)',
                      fontWeight:900, fontFamily:'var(--f-mono,monospace)', fontSize:11,
                    }}>
                      {nota > 0 ? `${nota}%` : '—'}
                    </span>
                  </td>
                  <td style={{ padding:'10px 8px', whiteSpace:'nowrap', verticalAlign:'top' }}>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                      <button onClick={() => onAbrirPanel && onAbrirPanel(e, 'pagos')} title="Ver ficha del estudiante" style={{ padding:'5px 8px', borderRadius:7, border:'1px solid var(--border, #ddd)', fontSize:11, cursor:'pointer', background:'white', fontWeight:700 }}>👤 Ficha</button>
                      <button onClick={() => setModalEstatus({ estudiante: e, nivel: nivelKey })} title="Cambiar estatus" style={{ padding:'5px 8px', borderRadius:7, border:'1px solid var(--border, #ddd)', fontSize:11, cursor:'pointer', background:'white', fontWeight:700 }}>✏️ Estado</button>
                      <button
                        onClick={async () => {
                          if (resyncEst?.loading) return;
                          setResyncEst({ codigo, loading: true });
                          const r = await resincronizarEstudianteIndividual(codigo);
                          setResyncEst({ codigo, loading: false, ok: r.ok, error: r.error });
                          setTimeout(() => setResyncEst(null), 3000);
                        }}
                        disabled={resyncEst?.codigo === codigo && resyncEst?.loading}
                        title={
                          resyncEst?.codigo === codigo && resyncEst.loading ? 'Sincronizando CONAPE…'
                          : resyncEst?.codigo === codigo && resyncEst.ok ? 'CONAPE sincronizado'
                          : resyncEst?.codigo === codigo && resyncEst.error ? ('Error: ' + resyncEst.error)
                          : 'Resincronizar CONAPE individual'
                        }
                        style={{
                          padding:'5px 8px', borderRadius:7,
                          border:'1px solid ' + (resyncEst?.codigo === codigo && resyncEst?.ok ? '#2E7D32' : resyncEst?.codigo === codigo && resyncEst?.error ? '#C62828' : 'var(--border, #ddd)'),
                          fontSize:11, fontWeight:700,
                          cursor: resyncEst?.codigo === codigo && resyncEst?.loading ? 'wait' : 'pointer',
                          background: resyncEst?.codigo === codigo && resyncEst?.ok ? '#E8F5E9' : resyncEst?.codigo === codigo && resyncEst?.error ? '#FFEBEE' : 'white',
                        }}>
                        <span style={{ display:'inline-block', animation: resyncEst?.codigo === codigo && resyncEst?.loading ? 'an-spin 0.9s linear infinite' : 'none' }}>
                          {resyncEst?.codigo === codigo && resyncEst?.ok ? '✓ CONAPE' : resyncEst?.codigo === codigo && resyncEst?.error ? '⚠ CONAPE' : '↻ CONAPE'}
                        </span>
                      </button>
                      <button onClick={() => abrirPago(e, nivelKey, onNavigate)} title="Aplicar pago" style={{ padding:'5px 8px', borderRadius:7, border:'1px solid var(--border, #ddd)', fontSize:11, cursor:'pointer', background:'white', fontWeight:700 }}>💳 Pago</button>
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
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
function AdminEstudiantesView({ onNavigate, grupoInicial, modo }) {
  const { grupos, loading: loadingGrupos, error: errorGrupos } = useAdminGrupos();
  const embebidoCalGrupo = modo === 'calgrupo';
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
    setSyncConape({ loading: true });
    setToast(null);
    try {
      const data = await postAdminStudents('sincronizarCONAPE', { cod_grupo: grupoSel });
      if (data.ok) {
        const n = data.total ?? data.actualizados ?? data.estudiantes ?? data.count ?? 0;
        setToast({ tipo: 'ok', msg: `CONAPE actualizado — ${n} estudiante${n === 1 ? '' : 's'}` });
        setRefreshKey(k => k + 1);
      } else {
        setToast({ tipo: 'err', msg: data.error || 'Error al sincronizar CONAPE' });
      }
    } catch (e) {
      setToast({ tipo: 'err', msg: 'Error de conexión: ' + (e.message || e) });
    } finally {
      setSyncConape({ loading: false });
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
    setCertEstado({ loading: true, masivo: true, nivel });
    try {
      const data = await postAdminStudents('generarCertificadosNivel', {
        grupo: grupoSel,
        nivel: nivel,
      });
      setCertEstado({ ...data, masivo: true, nivel });
      if (data.ok) {
        const r = data.resumen || {};
        setToast({
          tipo: (r.errores || 0) ? 'err' : 'ok',
          msg: `Certificados ${nivel}: ${r.generados || 0} creados · ${r.ya_existentes || 0} ya existían · ${r.no_aptos || 0} no aptos${(r.errores || 0) ? ` · ${r.errores} errores` : ''}`,
        });
        setRefreshKey(k => k + 1);
        setTimeout(() => { setCertEstado(null); }, 6500);
      }
    } catch(e) {
      setCertEstado({ ok: false, masivo: true, error: 'Error de conexión', nivel });
    }
  };
  const { data, loading: loadingRad } = useRadiografia(grupoSel, refreshKey);
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
          {/* Header del grupo */}
          <div style={{
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
                {syncConape.loading ? 'Sincronizando…' : 'Sync CONAPE'}
              </button>
            )}
          </div>

          {/* Secciones por nivel */}
          {loadingRad ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--ink-3, #888)' }}>
              Cargando radiografía del grupo…
            </div>
          ) : secciones.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--ink-3, #888)' }}>
              Sin estudiantes registrados en este grupo
            </div>
          ) : (
            <React.Fragment>
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
                  generarCertificadosNivel={null}
                  filtroOperativo={filtroOperativo}
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
            <span>⏳ {certEstado.masivo ? `Generando certificados del nivel ${certEstado.nivel}...` : `Generando certificado ${certEstado.nivel}...`}</span>
          ) : certEstado.ok ? (
            certEstado.masivo ? (
              <div>
                <div style={{ fontWeight:700, marginBottom:4 }}>🏅 Certificados del nivel {certEstado.nivel}</div>
                <div style={{ fontSize:11, opacity:0.9, lineHeight:1.45 }}>
                  {(certEstado.resumen?.generados || 0)} creados · {(certEstado.resumen?.ya_existentes || 0)} ya existían · {(certEstado.resumen?.no_aptos || 0)} no aptos · {(certEstado.resumen?.errores || 0)} errores
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
              <div style={{ fontSize:12 }}>{certEstado.mensaje || certEstado.error}</div>
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
      .then(d => { if (d.ok) setDetalle(d); else setError(d.error || 'Error al cargar'); })
      .catch(e => setError('Error de conexión: ' + e.message))
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
          {tabActiva === 'notas' && !cargando && (
            <TabNotasPanel niveles={niveles} nivelActivo={nivelActivo} />
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
function TabNotasPanel({ niveles, nivelActivo }) {
  return (
    <div>
      <div style={{ fontFamily:'var(--f-serif, serif)', fontSize:20, fontWeight:500, color:'var(--an-navy-ink, #14213D)', marginBottom:16 }}>
        Notas por nivel
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12 }}>
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
                    { label:'Oral 1 (U1-4)',   val: h.o1, max:15 },
                    { label:'Oral 2 (U5-8)',   val: h.o2, max:15 },
                    { label:'Oral 3 (U9-12)',  val: h.o3, max:15 },
                    { label:'Oral 4 (U13-16)', val: h.o4, max:15 },
                    { label:'Escrito 1',       val: h.e1, max:15 },
                    { label:'Escrito 2',       val: h.e2, max:15 },
                    { label:'Social',          val: h.s1, max:10 },
                  ].filter(e => e.val > 0).map(({ label, val, max }) => (
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
    </div>
  );
}

// ── TAB ASISTENCIA ────────────────────────────────────────────────────────
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

  const nivelAntMap  = { B1:null, B2:'B1', I1:'B2', I2:'I1' };
  const nivAnt       = nivelAntMap[nivelActivo];
  const estatusAnt   = nivAnt ? String(niveles[nivAnt]?.estatus || '').toUpperCase() : null;
  const estatusAct   = String(niveles[nivelActivo]?.estatus || '').toUpperCase();
  const nivelInfo    = niveles[nivelActivo] || {};
  const certLoose    = String(nivelInfo.cert || '').trim();
  const certLooseReg = (/^SJ\d{0,3}-|-[0-9]{4}$|CERT|REG/i.test(certLoose) && !/^\d+(\.\d+)?$/.test(certLoose)) ? certLoose : '';
  const certNum      = certRegistroEstudiante({ ...est, ...nivelInfo }) || certLooseReg;
  const certPagoAct  = certPagoEstudiante({ ...est, ...nivelInfo }) || (!!certLoose && /^\d+(\.\d+)?$/.test(certLoose) && Number(certLoose) > 0);
  const certStateAct = certVisualState({ estatus: estatusAct, certPago: certPagoAct, certNum });

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
      ok: !!nivAnt && estatusAnt === 'APR',
      razon: !detalle ? 'Cargando…' : !nivAnt ? 'No aplica para Básico I' : estatusAnt !== 'APR' ? `${nivAnt} debe estar APR (actual: ${estatusAnt || '—'})` : null,
    },
    {
      tipo: 'CERTIFICACION',
      titulo: 'Certificación de Nivel',
      desc: certNum
        ? `Certificado registrado: ${certNum}. No se genera copia; se busca el PDF existente o firmado en Drive.`
        : `Estado: ${certStateAct.label}. ${certStateAct.sub}.`,
      icono: '🏅', color: '#E5A823',
      ok: !!certNum,
      razon: !detalle ? 'Cargando…' : certNum ? null : certStateAct.hint,
      certState: certStateAct,
    },
  ];

  const [gen, setGen] = React.useState({});
  const [res, setRes] = React.useState({});

  const generar = async (tipo) => {
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
      setRes(r => ({...r, [tipo]: data.ok ? { url:data.url, nombre:data.nombre } : { error:data.error }}));
    } catch(e) {
      setRes(r => ({...r, [tipo]: { error:'Error de conexión' }}));
    } finally {
      setGen(g => ({...g, [tipo]: false}));
    }
  };

  const buscarCertificado = async () => {
    const tipo = 'CERTIFICACION';
    if (gen[tipo]) return;
    setGen(g => ({...g, [tipo]: true}));
    setRes(r => ({...r, [tipo]: null}));
    try {
      const data = await postAdminStudents('buscarCertificadoExistente', {
        codigo: String(est.codigo || est.rec_m || ''),
        nivel: nivelActivo,
        grupo: String(est.grupo || ''),
        registro: certNum,
      });
      if (data.ok) {
        setRes(r => ({...r, [tipo]: { url:data.url, nombre:data.nombre, mensaje:data.mensaje }}));
        if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        setRes(r => ({...r, [tipo]: { error:data.mensaje || data.error, search_url:data.search_url }}));
      }
    } catch(e) {
      setRes(r => ({...r, [tipo]: { error:'Error de conexión' }}));
    } finally {
      setGen(g => ({...g, [tipo]: false}));
    }
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, fontSize:13, color:'var(--ink-3, #999)' }}>
        Nivel activo:
        <span style={{ padding:'3px 12px', borderRadius:999, fontWeight:700, fontSize:12, background:`color-mix(in srgb, ${NIVEL_COLOR_D[nivelActivo]} 14%, white)`, color: NIVEL_COLOR_D[nivelActivo] }}>
          {NIVEL_LABEL_D[nivelActivo] || nivelActivo}
        </span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {docs.map(({ tipo, titulo, desc, icono, color, ok, razon, certState }) => {
          const r = res[tipo]; const cargando = gen[tipo];
          return (
            <div key={tipo} style={{
              border:`2px solid ${ok ? color : 'var(--line, #eee)'}`,
              borderRadius:'var(--r-lg, 12px)', padding:'16px 18px',
              background: ok ? `color-mix(in srgb, ${color} 4%, white)` : 'var(--surface-2, #f9f9f9)',
              opacity: ok ? 1 : 0.65,
            }}>
              <div style={{ display:'grid', gridTemplateColumns:'40px 1fr auto', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:40, height:40, borderRadius:'var(--r-md, 8px)', background:`color-mix(in srgb, ${color} 15%, white)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                  {icono}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:3 }}>{titulo}</div>
                  <div style={{ fontSize:11, color:'var(--ink-3, #999)', lineHeight:1.4 }}>{desc}</div>
                  {certState && (
                    <div style={{ marginTop:8 }}>
                      <CertificadoEstadoBox state={certState} />
                    </div>
                  )}
                  {razon && (
                    <div style={{ marginTop:6, fontSize:11, color:'#C67100', fontWeight:600, padding:'2px 8px', background:'color-mix(in srgb,#E5A823 10%,white)', borderRadius:5, display:'inline-block' }}>
                      🔒 {razon}
                    </div>
                  )}
                  {r?.url && (
                    <div style={{ marginTop:8, padding:'8px 12px', background:'color-mix(in srgb,#2E7D32 8%,white)', border:'1px solid #2E7D32', borderRadius:'var(--r-md, 8px)', display:'flex', alignItems:'center', gap:8 }}>
                      <span>✅</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'#2E7D32', marginBottom:1 }}>{tipo === 'CERTIFICACION' ? 'PDF localizado' : 'PDF generado'}</div>
                        <div style={{ fontSize:10, color:'var(--ink-3, #999)', fontFamily:'var(--f-mono, monospace)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.nombre}</div>
                      </div>
                      <a href={r.url} target="_blank" rel="noreferrer" style={{ padding:'4px 12px', borderRadius:5, background:'#2E7D32', color:'white', fontSize:11, fontWeight:700, textDecoration:'none' }}>Abrir</a>
                    </div>
                  )}
                  {r?.error && (
                    <div style={{ marginTop:6, padding:'6px 10px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md, 8px)', fontSize:11, color:'#8B0000' }}>
                      ❌ {r.error}
                      {r.search_url && <a href={r.search_url} target="_blank" rel="noreferrer" style={{ marginLeft:8, color:'#8B0000', fontWeight:800 }}>Buscar en Drive</a>}
                    </div>
                  )}
                </div>
                {tipo === 'CERTIFICACION' && certNum ? (
                  <button
                    type="button"
                    onClick={buscarCertificado}
                    disabled={cargando}
                    title="Abre el PDF existente más reciente con el nombre oficial. No crea copias nuevas."
                    style={{ padding:'8px 14px', borderRadius:'var(--r-md, 8px)', border:`2px solid ${color}`, background: color, color:'white', fontWeight:700, fontSize:11, cursor:cargando?'wait':'pointer', whiteSpace:'nowrap', textDecoration:'none', opacity:cargando?0.7:1 }}>
                    {cargando ? 'Buscando…' : 'Ver PDF'}
                  </button>
                ) : (
                  <button
                    disabled={!ok || cargando}
                    onClick={() => generar(tipo)}
                    style={{ padding:'8px 14px', borderRadius:'var(--r-md, 8px)', border:`2px solid ${ok ? color : 'var(--line, #eee)'}`, background: ok ? color : 'var(--surface-3, #eee)', color: ok ? 'white' : 'var(--ink-3, #999)', fontWeight:700, fontSize:11, cursor: ok && !cargando ? 'pointer' : 'not-allowed', whiteSpace:'nowrap', opacity: cargando ? 0.7 : 1 }}>
                    {cargando ? '⏳…' : 'Generar'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop:14, fontSize:11, color:'var(--ink-3, #999)', padding:'10px 14px', background:'var(--surface-2, #f9f9f9)', borderRadius:'var(--r-md, 8px)' }}>
        📁 Certificados: si ya existe REG_CERTIFICADOS, esta vista no debe crear otro consecutivo. Solo busca/abre el PDF existente; si suben el firmado con el mismo nombre, Drive debe devolver el más reciente desde backend.
      </div>
    </div>
  );
}

Object.assign(window, { AdminEstudiantesView });
