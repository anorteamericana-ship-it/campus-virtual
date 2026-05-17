/* global React, PageHeader */

// ─────────────────────────────────────────────────────────────────────────
// VISTA RADIOGRAFÍA DE GRUPOS — admin_students.jsx
// Reemplaza la antigua vista padrón. Muestra cada grupo activo como un chip
// (coloreado por su nivel activo HOY); al hacer click se carga la radiografía
// completa con tablas por nivel: aprobados (anterior), cursando (actual) y
// proyectados (siguiente).
// ─────────────────────────────────────────────────────────────────────────

const SCRIPT_URL_AS = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';

// ─────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────
function useAdminGrupos() {
  const [grupos, setGrupos]   = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetch(`${SCRIPT_URL_AS}?fn=getAdminDashboard`)
      .then(r => r.json())
      .then(d => { if (d.ok) setGrupos(d.grupos || []); })
      .finally(() => setLoading(false));
  }, []);
  return { grupos, loading };
}

function useRadiografia(codGrupo, refreshKey) {
  const [data, setData]       = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (!codGrupo) return;
    setLoading(true); setData(null);
    fetch(`${SCRIPT_URL_AS}?fn=getRadiografiaGrupo&cod_grupo=${encodeURIComponent(codGrupo)}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d); })
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

  const estados = ['CA','APR','REP','CNV','RI','RJ','PE'];

  async function handleGuardar() {
    if (!nuevoEstatus || nuevoEstatus === estudiante.estatus) { onClose(); return; }
    setLoading(true); setError('');
    try {
      const resp = await fetch(SCRIPT_URL_AS, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          fn: 'actualizarEstatus',
          cod_estudiante: String(estudiante.codigo || estudiante.rec_m || ''),
          nivel,
          estatus: nuevoEstatus,
          nota: estudiante.nota || null,
          grupo: String(estudiante.grupo || estudiante.GRUPO || ''),
        })
      });
      const data = await resp.json();
      if (data.ok) { onSuccess(); onClose(); }
      else setError(data.error || 'Error al actualizar');
    } catch(e) { setError('Error de conexión'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:12, padding:24, minWidth:320, boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>
          Cambiar estatus — {nivel}
        </div>
        <div style={{ fontSize:13, color:'var(--text-secondary, #666)', marginBottom:12 }}>
          {estudiante.display || estudiante.nombre} · actual: <strong>{estudiante.estatus}</strong>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
          {estados.map(s => (
            <button key={s} onClick={() => setNuevoEstatus(s)} style={{
              padding:'6px 14px', borderRadius:6, border:'2px solid',
              borderColor: nuevoEstatus===s ? 'var(--brand, #14213D)' : 'var(--border, #ddd)',
              background: nuevoEstatus===s ? 'var(--brand, #14213D)' : 'white',
              color: nuevoEstatus===s ? 'white' : 'var(--text, #222)',
              fontWeight:700, fontSize:12, cursor:'pointer'
            }}>{s}</button>
          ))}
        </div>
        {error && <div style={{ color:'var(--err, #C62828)', fontSize:12, marginBottom:8 }}>{error}</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'7px 16px', borderRadius:6, border:'1px solid var(--border, #ddd)', background:'white', cursor:'pointer' }}>Cancelar</button>
          <button onClick={handleGuardar} disabled={loading} style={{ padding:'7px 16px', borderRadius:6, background:'var(--brand, #14213D)', color:'white', border:'none', fontWeight:700, cursor:'pointer' }}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function abrirPago(est, niv, onNavigate) {
  sessionStorage.setItem('an_pago_prefill', JSON.stringify({
    codigo: String(est.codigo),
    nivel: niv,
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
    fetch(`${SCRIPT_URL_AS}?fn=getGrupoInfo&cod_grupo=${encodeURIComponent(codGrupo)}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setInfo(d); })
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
    }}>
      <div style={{ fontWeight: 800, fontSize: 13, fontFamily:'var(--f-mono, monospace)', letterSpacing:'-0.01em' }}>{grupo.code}</div>
      <div style={{ fontSize: 11, opacity: 0.8, marginTop:2 }}>{cfg.nombre}</div>
      <div style={{ fontSize: 11, marginTop: 4, fontWeight:600 }}>{grupo.estudiantes ?? grupo.students ?? 0} est.</div>
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
    color: 'rgba(255,255,255,0.45)',
    border: '1px solid rgba(255,255,255,0.30)',
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
      {dadas}/{total} clases
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

function TablaEstudiantes({ estudiantes, nivelKey, periodo, programa, sortCol, sortDir, toggleSort, sortEstudiantes, onRefresh, onNavigate, onAbrirPanel, generarCertificadoFila }) {
  const cfg = NIVEL_CONFIG[nivelKey];
  const [modalEstatus, setModalEstatus] = React.useState(null);
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
      {/* Tabla */}
      {abierto && (
      <div style={{ overflowX: 'auto', border: `1px solid ${cfg.color}`, borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: cfg.bg }}>
              {[
                { label:'Cód.',     sort:'codigo' },
                { label:'Cédula',   sort:null },
                { label:'Nombre',    sort:'nombre' },
                { label:'Convenio',  sort:null },
                { label:'Estado',    sort:'estatus' },
                { label:'Mora',      sort:'mora' },
                { label:'Matrícula', sort:null },
                { label:'Cuota',     sort:null },
                { label:'Cert.',     sort:null },
                { label:'Nota',      sort:'nota' },
              ].map(h => (
                <th
                  key={h.label}
                  onClick={h.sort && toggleSort ? () => toggleSort(h.sort) : undefined}
                  style={{
                    padding:'8px 10px', textAlign:'left', fontWeight:700, color:cfg.color,
                    whiteSpace:'nowrap', fontSize:11, letterSpacing:'0.04em',
                    cursor: h.sort && toggleSort ? 'pointer' : 'default',
                    userSelect: h.sort ? 'none' : 'auto',
                  }}
                >
                  {h.label}{h.sort ? sortArrow(h.sort) : ''}
                </th>
              ))}
              <th style={{ padding:'8px 10px' }}></th>
            </tr>
          </thead>
          <tbody>
            {estudiantesOrdenados.map((e, i) => {
              const codigo    = e.codigo || e.rec_m || '—';
              const cedula    = e.cedula || '—';
              const nombre    = e.display || e.nombre || '—';
              const convenio  = e.convenio || '';
              const estatus   = e.estatus || e.status_actual || 'PE';
              // v4.16: solo hay mora si hay lecciones dadas Y no hay pagos
              // Si cuotas_pagadas === 0 pero el nivel acaba de empezar (sin lecciones), no es mora
              const hayActividad = (e.cuotas_pagadas || 0) > 0 || (e.matricula_pagada === true);
              const moraBruta    = typeof e.mora !== 'undefined' ? e.mora : (e.morosidad === 'SI' || e.morosidad === true);
              const mora         = moraBruta && (hayActividad || e.estatus === 'APR' || e.estatus === 'REP');
              const matricula    = e.matricula_pagada ?? e.matricula ?? e.mat ?? false;
              const cuotasPagadas = typeof e.cuotas_pagadas === 'number' ? e.cuotas_pagadas : null;
              const cuotasEsperadas = e.cuotas_esperadas || 4;
              const periodoTexto    = e.periodo_texto || '';
              const cert      = e.certificado_pagado ?? e.certificado ?? e.cert ?? false;
              const certNum   = e.cert_num || '';
              const nota      = Number(e.nota || 0);
              return (
                <tr key={codigo + '-' + i} style={{ background: rowBg(estatus, i), borderBottom:'1px solid var(--line, #EEE)' }}>
                  <td style={{ padding:'7px 10px', fontWeight:600, fontFamily:'var(--f-mono, monospace)' }}>{codigo}</td>
                  <td style={{ padding:'7px 10px', color:'var(--ink-2, #555)', fontFamily:'var(--f-mono, monospace)', fontSize:11 }}>{cedula}</td>
                  <td style={{ padding:'7px 10px', fontWeight:500 }}>{nombre}</td>
                  <td style={{ padding:'7px 10px' }}>
                    {convenio ? (
                      <span style={{
                        background: convenio==='CONAPE' ? '#E3F2FD' : convenio.toString().toUpperCase().includes('BECA') ? '#E8F5E9' : 'var(--surface, #F5F5F5)',
                        color: convenio==='CONAPE' ? '#1565C0' : convenio.toString().toUpperCase().includes('BECA') ? '#2E7D32' : 'var(--ink-3, #888)',
                        padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:'0.02em',
                      }}>
                        {String(convenio).toUpperCase().includes('BECA') ? 'BECA' : convenio}
                      </span>
                    ) : <span style={{ color:'var(--ink-3, #999)', fontSize:11 }}>Regular</span>}
                  </td>
                  <td style={{ padding:'7px 10px' }}>
                    <EstadoBadge estado={estatus} />
                    {periodoTexto && (
                      <div style={{ fontSize:9, color:'var(--ink-3, #999)', marginTop:2, fontWeight:500, letterSpacing:'0.01em', whiteSpace:'nowrap' }}>
                        {periodoTexto}
                      </div>
                    )}
                  </td>
                  <td style={{ padding:'7px 10px' }}>
                    {estatus === 'PE' ? (
                      <span style={{ color:'var(--ink-3, #BBB)', fontSize:13 }}>—</span>
                    ) : (
                      <span style={{ color: mora ? 'var(--err, #C62828)' : 'var(--ok, #2E7D32)', fontWeight:800, fontSize:11, letterSpacing:'0.04em' }}>
                        {mora ? 'SI' : 'NO'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding:'7px 10px', fontSize:13, color: matricula ? 'var(--ok, #2E7D32)' : 'var(--ink-3, #BBB)' }}>{matricula ? '✓' : '—'}</td>
                  <td style={{ padding:'7px 10px' }}>
                    <CuotasChecks cuotas={cuotasPagadas} esperadas={cuotasEsperadas} />
                  </td>
                  <td style={{ padding:'7px 10px', fontSize:13, color: cert ? 'var(--ok, #2E7D32)' : 'var(--ink-3, #BBB)' }} title={certNum || undefined}>
                    {cert ? '✓' : '—'}
                    {certNum && (
                      <div style={{ fontSize:9, color:'var(--ink-3, #999)', fontFamily:'var(--f-mono, monospace)', fontWeight:500, marginTop:1 }}>{certNum}</div>
                    )}
                  </td>
                  <td style={{ padding:'7px 10px', fontWeight:700, color: nota>=70?'var(--ok, #2E7D32)':nota>0?'var(--err, #C62828)':'var(--ink-3, #BBB)' }}>
                    {nota > 0 ? `${nota}%` : '—'}
                  </td>
                  <td style={{ padding:'7px 8px', whiteSpace:'nowrap' }}>
                    <button
                      onClick={() => generarCertificadoFila && generarCertificadoFila(e, nivelKey)}
                      title="Generar certificado de nivel"
                      style={{ padding:'3px 8px', marginRight:4, borderRadius:4,
                        border: e.estatus==='APR' ? '1px solid #4CAF50' : '1px solid var(--border, #ddd)',
                        fontSize:11, cursor: e.estatus==='APR' ? 'pointer' : 'not-allowed',
                        background: e.estatus==='APR' ? 'color-mix(in srgb,#4CAF50 10%,white)' : '#f5f5f5',
                        opacity: e.estatus==='APR' ? 1 : 0.4 }}>
                      🏅
                    </button>
                    <button
                      onClick={() => onAbrirPanel && onAbrirPanel(e)}
                      title="Ver ficha del estudiante"
                      style={{ padding:'3px 8px', marginRight:4, borderRadius:4, border:'1px solid var(--border, #ddd)', fontSize:11, cursor:'pointer', background:'white' }}>
                      👤
                    </button>
                    <button
                      onClick={() => setModalEstatus({ estudiante: e, nivel: nivelKey })}
                      title="Cambiar estatus"
                      style={{ padding:'3px 8px', marginRight:4, borderRadius:4, border:'1px solid var(--border, #ddd)', fontSize:11, cursor:'pointer', background:'white' }}>
                      ✏️
                    </button>
                    <button
                      onClick={() => abrirPago(e, nivelKey, onNavigate)}
                      title="Aplicar pago"
                      style={{ padding:'3px 8px', borderRadius:4, border:'1px solid var(--border, #ddd)', fontSize:11, cursor:'pointer', background:'white' }}>
                      💳
                    </button>
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

// ─────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
function AdminEstudiantesView({ onNavigate }) {
  const { grupos, loading: loadingGrupos } = useAdminGrupos();
  const [grupoSel, setGrupoSel] = React.useState(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [estudiantePanelAbierto, setEstudiantePanelAbierto] = React.useState(null);
  const [certEstado, setCertEstado] = React.useState(null);
  // { loading: true } | { ok, registro, nombre, url, error }

  const handleGenerarCertificado = async (est, nivel) => {
    setCertEstado({ loading: true, codigo: est.codigo, nivel });
    try {
      const resp = await fetch(SCRIPT_URL_AS + '?fn=generarCertificado', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          fn: 'generarCertificado',
          codigo: String(est.codigo || ''),
          nivel: nivel,
          grupo: String(est.grupo || ''),
        }),
      });
      const data = await resp.json();
      setCertEstado({ ...data, codigo: est.codigo, nivel });
      if (data.ok) {
        // Recargar la radiografía para mostrar el nuevo REG_CERTIFICADOS
        setTimeout(() => { setCertEstado(null); }, 4000);
      }
    } catch(e) {
      setCertEstado({ ok: false, error: 'Error de conexión', codigo: est.codigo, nivel });
    }
  };
  const { data, loading: loadingRad } = useRadiografia(grupoSel, refreshKey);
  const grupoInfoDetalle = useGrupoInfo(grupoSel);

  // Estado de ordenamiento (compartido entre tablas de niveles)
  const [sortCol, setSortCol] = React.useState('codigo');
  const [sortDir, setSortDir] = React.useState('asc');

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

  const grupoInfo = grupos.find(g => g.code === grupoSel);

  // Construir secciones desde getRadiografiaGrupo (data.niveles = { B1:[], B2:[], I1:[], I2:[] })
  const secciones = React.useMemo(() => {
    if (!data || !data.niveles) return [];
    return ORDEN_NIVELES
      .filter(n => data.niveles[n] && data.niveles[n].length > 0)
      .map(n => ({ nivel: n, estudiantes: data.niveles[n] }));
  }, [data]);

  // Lección estimada — derivada del código del grupo (NIVEL-DIAS-...-NNYY)
  const diasCode = extraerDias(grupoSel);
  const leccionActual = grupoInfoDetalle
    ? calcularLeccionActual(grupoInfoDetalle.startDate, diasCode, 'CA')
    : 0;

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        kicker="Administración"
        title={<>Grupos <em>activos</em></>}
        sub="Click en un grupo para ver su radiografía completa"
      />

      {/* Grid de chips */}
      {loadingGrupos ? (
        <div style={{ color:'var(--ink-3, #888)', padding:20 }}>Cargando grupos…</div>
      ) : grupos.length === 0 ? (
        <div style={{ color:'var(--ink-3, #888)', padding:20 }}>No hay grupos activos.</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, minmax(0,1fr))', gap:12, marginBottom:32 }}>
          {grupos.map(g => (
            <ChipGrupo
              key={g.code}
              grupo={g}
              seleccionado={grupoSel === g.code}
              onClick={() => setGrupoSel(g.code)}
            />
          ))}
        </div>
      )}

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
              <div style={{ fontWeight:700, fontSize:20, marginTop:1, fontFamily:'var(--f-serif, Fraunces, serif)', letterSpacing:'-0.02em' }}>
                {grupoInfo.estudiantes ?? grupoInfo.students ?? 0}
              </div>
            </div>
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
            secciones.map(s => (
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
                onAbrirPanel={(est) => setEstudiantePanelAbierto(est)}
                generarCertificadoFila={(est, niv) => handleGenerarCertificado(est, niv)}
              />
            ))
          )}
        </div>
      )}

      {estudiantePanelAbierto && (
        <PanelEstudianteDrawer
          est={estudiantePanelAbierto}
          onClose={() => setEstudiantePanelAbierto(null)}
          onNavigate={onNavigate}
        />
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
            <span>⏳ Generando certificado {certEstado.nivel}...</span>
          ) : certEstado.ok ? (
            <div>
              <div style={{ fontWeight:700, marginBottom:4 }}>
                🏅 Certificado generado — {certEstado.registro}
              </div>
              <div style={{ fontSize:11, opacity:0.85, marginBottom:8 }}>
                {certEstado.nombre}
              </div>
              <a href={certEstado.url} target="_blank" rel="noreferrer"
                style={{ color:'white', fontWeight:700, textDecoration:'underline' }}>
                Abrir PDF →
              </a>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight:700, marginBottom:4 }}>❌ Error</div>
              <div style={{ fontSize:12 }}>{certEstado.error}</div>
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
const SCRIPT_URL_PANEL = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';

const NIVEL_COLOR_P  = { B1:'#E5A823', B2:'#E8372A', I1:'#2B7FC1', I2:'#4CAF50' };
const NIVEL_LABEL_P  = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
const NIVEL_ORDER_P  = ['B1','B2','I1','I2'];

function PanelEstudianteDrawer({ est, onClose, onNavigate }) {
  const [detalle, setDetalle]     = React.useState(null);
  const [cargando, setCargando]   = React.useState(true);
  const [error, setError]         = React.useState('');
  const [tabActiva, setTabActiva] = React.useState('pagos');

  React.useEffect(() => {
    if (!est) return;
    setCargando(true); setError(''); setDetalle(null);
    fetch(`${SCRIPT_URL_PANEL}?fn=getEstudiante&codigo=${encodeURIComponent(est.codigo || est.rec_m || '')}`)
      .then(r => r.json())
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
          <div style={{ position:'absolute', right:-20, bottom:-20, width:140, height:140, borderRadius:'50%', background:'var(--an-granate, #8B1E3F)', opacity:0.15 }} />

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
                  <span>Cuota: <strong style={{ color:'var(--an-gold, #E5A823)' }}>₡{cuotaPactada.toLocaleString('es-CR')}</strong></span>
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
    fetch(`${SCRIPT_URL_PANEL}?fn=getAsistenciaEstudiante&codigo=${encodeURIComponent(codigo)}`)
      .then(r => r.json())
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
  const certNum      = String(niveles[nivelActivo]?.cert || '').trim();

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
      desc: `Título oficial de ${NIVEL_LABEL_D[nivelActivo] || nivelActivo}. Requiere APR y certificado pagado.`,
      icono: '🏅', color: '#E5A823',
      ok: estatusAct === 'APR' && !!certNum,
      razon: !detalle ? 'Cargando…' : estatusAct !== 'APR' ? `Nivel debe estar APR (actual: ${estatusAct || '—'})` : !certNum ? 'REG_CERTIFICADOS vacío' : null,
    },
  ];

  const [gen, setGen] = React.useState({});
  const [res, setRes] = React.useState({});

  const generar = async (tipo) => {
    if (gen[tipo]) return;
    setGen(g => ({...g, [tipo]: true}));
    setRes(r => ({...r, [tipo]: null}));
    try {
      const resp = await fetch(SCRIPT_URL_PANEL, {
        method:'POST',
        headers:{ 'Content-Type':'text/plain' },
        body: JSON.stringify({ fn:'generarDocumento', tipo, codigo: String(est.codigo || est.rec_m || ''), nivel: nivelActivo }),
      });
      const data = await resp.json();
      setRes(r => ({...r, [tipo]: data.ok ? { url:data.url, nombre:data.nombre } : { error:data.error }}));
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
                <div style={{ width:40, height:40, borderRadius:'var(--r-md, 8px)', background:`color-mix(in srgb, ${color} 15%, white)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                  {icono}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:3 }}>{titulo}</div>
                  <div style={{ fontSize:11, color:'var(--ink-3, #999)', lineHeight:1.4 }}>{desc}</div>
                  {razon && (
                    <div style={{ marginTop:6, fontSize:11, color:'#C67100', fontWeight:600, padding:'2px 8px', background:'color-mix(in srgb,#E5A823 10%,white)', borderRadius:5, display:'inline-block' }}>
                      🔒 {razon}
                    </div>
                  )}
                  {r?.url && (
                    <div style={{ marginTop:8, padding:'8px 12px', background:'color-mix(in srgb,#2E7D32 8%,white)', border:'1px solid #2E7D32', borderRadius:'var(--r-md, 8px)', display:'flex', alignItems:'center', gap:8 }}>
                      <span>✅</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'#2E7D32', marginBottom:1 }}>PDF generado</div>
                        <div style={{ fontSize:10, color:'var(--ink-3, #999)', fontFamily:'var(--f-mono, monospace)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.nombre}</div>
                      </div>
                      <a href={r.url} target="_blank" rel="noreferrer" style={{ padding:'4px 12px', borderRadius:5, background:'#2E7D32', color:'white', fontSize:11, fontWeight:700, textDecoration:'none' }}>Abrir</a>
                    </div>
                  )}
                  {r?.error && (
                    <div style={{ marginTop:6, padding:'6px 10px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md, 8px)', fontSize:11, color:'#8B0000' }}>❌ {r.error}</div>
                  )}
                </div>
                <button
                  disabled={!ok || cargando}
                  onClick={() => generar(tipo)}
                  style={{ padding:'8px 14px', borderRadius:'var(--r-md, 8px)', border:`2px solid ${ok ? color : 'var(--line, #eee)'}`, background: ok ? color : 'var(--surface-3, #eee)', color: ok ? 'white' : 'var(--ink-3, #999)', fontWeight:700, fontSize:11, cursor: ok && !cargando ? 'pointer' : 'not-allowed', whiteSpace:'nowrap', opacity: cargando ? 0.7 : 1 }}>
                  {cargando ? '⏳…' : 'Generar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop:14, fontSize:11, color:'var(--ink-3, #999)', padding:'10px 14px', background:'var(--surface-2, #f9f9f9)', borderRadius:'var(--r-md, 8px)' }}>
        📁 Los PDFs se guardan automáticamente en Drive en la carpeta del estudiante.
      </div>
    </div>
  );
}

Object.assign(window, { AdminEstudiantesView });
