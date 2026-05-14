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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fn: 'actualizarEstatus',
          codigo: estudiante.codigo,
          nivel,
          estatus: nuevoEstatus,
          nota: estudiante.nota || null,
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

function abrirPago(est, niv) {
  sessionStorage.setItem('an_pago_prefill', JSON.stringify({
    codigo: est.codigo,
    nombre: est.display || est.nombre,
    nivel: niv,
  }));
  window.location.hash = '#/aplicar-pago';
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
function CuotasChecks({ cuotas }) {
  const total = 4;
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
  const estados = estudiantes.map(e => e.estatus);
  if (!estados.length) return '';
  if (estados.every(e => e === 'PE')) return 'Proyectado — próximo nivel';
  if (estados.some(e => e === 'CA'))  return 'En curso';
  if (estados.every(e => e === 'APR')) return '✓ Nivel completado';
  return 'Cerrado';
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

function TablaEstudiantes({ estudiantes, nivelKey, sortCol, sortDir, toggleSort, sortEstudiantes, onRefresh }) {
  const cfg = NIVEL_CONFIG[nivelKey];
  const [modalEstatus, setModalEstatus] = React.useState(null);
  if (!estudiantes.length) return null;
  const subtitulo = calcularSubtitulo(estudiantes);
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
        <span style={{ fontWeight: 800, fontSize: 14, letterSpacing:'0.02em', textTransform:'uppercase' }}>{cfg.nombre}</span>
        <span style={{ fontSize: 12, opacity: 0.9 }}>
          {estudiantes.length} estudiante{estudiantes.length === 1 ? '' : 's'}
        </span>
        {aprobados > 0 && (
          <span style={{ fontSize:11, fontWeight:700, background:'rgba(255,255,255,0.2)', padding:'2px 8px', borderRadius:4, letterSpacing:'0.02em' }}>
            ✓ {aprobados} aprobados
          </span>
        )}
        {subtitulo && (
          <span style={{ marginLeft:'auto', fontSize:11, fontWeight:600, opacity:0.92, background:'rgba(255,255,255,0.18)', padding:'3px 10px', borderRadius:999, letterSpacing:'0.02em' }}>
            {subtitulo}
          </span>
        )}
        <span style={{ fontSize:11, marginLeft: subtitulo ? 4 : 'auto', opacity:0.85 }}>{abierto ? '▲' : '▼'}</span>
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
              const mora      = typeof e.mora !== 'undefined' ? e.mora : (e.morosidad === 'SI' || e.morosidad === true);
              const matricula = e.matricula_pagada ?? e.matricula ?? e.mat ?? false;
              const cuotasPagadas = typeof e.cuotas_pagadas === 'number' ? e.cuotas_pagadas : null;
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
                  </td>
                  <td style={{ padding:'7px 10px' }}>
                    <span style={{ color: mora ? 'var(--err, #C62828)' : 'var(--ok, #2E7D32)', fontWeight:800, fontSize:11, letterSpacing:'0.04em' }}>
                      {mora ? 'SI' : 'NO'}
                    </span>
                  </td>
                  <td style={{ padding:'7px 10px', fontSize:13, color: matricula ? 'var(--ok, #2E7D32)' : 'var(--ink-3, #BBB)' }}>{matricula ? '✓' : '—'}</td>
                  <td style={{ padding:'7px 10px' }}>
                    <CuotasChecks cuotas={cuotasPagadas} />
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
                      onClick={() => setModalEstatus({ estudiante: e, nivel: nivelKey })}
                      title="Cambiar estatus"
                      style={{ padding:'3px 8px', marginRight:4, borderRadius:4, border:'1px solid var(--border, #ddd)', fontSize:11, cursor:'pointer', background:'white' }}>
                      ✏️
                    </button>
                    <button
                      onClick={() => abrirPago(e, nivelKey)}
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
function AdminEstudiantesView() {
  const { grupos, loading: loadingGrupos } = useAdminGrupos();
  const [grupoSel, setGrupoSel] = React.useState(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
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
            <div style={{ textAlign:'center', minWidth:90 }}>
              <div style={{ fontSize:10, opacity:0.7, letterSpacing:'0.1em', textTransform:'uppercase' }}>Lección</div>
              <div style={{ fontWeight:700, fontSize:20, marginTop:1, fontFamily:'var(--f-serif, Fraunces, serif)', letterSpacing:'-0.02em' }}>
                {leccionActual}<span style={{ fontSize:13, opacity:0.6 }}>/32</span>
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
                sortCol={sortCol}
                sortDir={sortDir}
                toggleSort={toggleSort}
                sortEstudiantes={sortEstudiantes}
                onRefresh={() => setRefreshKey(k => k + 1)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AdminEstudiantesView });
