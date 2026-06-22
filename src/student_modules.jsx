// F96.0_20260622_MENU_ESTUDIANTE_FLUJO_Y_CERTIFICADOS_HONESTOS
// F92.7_20260620_MIS_NOTAS_COMPLETAS_ORDEN_CRONOGRAMA
// F86_20260619_EXAMEN_ORAL_CONTEXTO_EXACTO
/* global React, Icon, Ring, Chip, Stat, AnimatedBar, LEVELS, PRECIOS,
   useUsuario, useEstudiante, EmptyState, ErrorState */
// ──────────────────────────────────────────────────────────────────────────
// student_modules.jsx — vistas del estudiante (sin datos inventados)
// Cada módulo lee del Apps Script o muestra un estado vacío honesto.
// ──────────────────────────────────────────────────────────────────────────

// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL_SM = window.APPS_SCRIPT_URL;

// FIX-ADMIN-CORE-POST-001: lectura sensible vía POST text/plain (token en body).
async function postStudentModules(fn, payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const res = await fetch(`${SCRIPT_URL_SM}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...payload }),
  });
  return await res.json();
}

const NIVEL_NOMBRE_SM = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
const NIVEL_LIBRO_SM  = { B1:'Interchange Intro', B2:'Interchange 1', I1:'Interchange 2', I2:'Interchange 3' };
const NIVEL_COLOR_SM  = { B1:'#E5A823', B2:'#E8372A', I1:'#2B7FC1', I2:'#4CAF50' };

const ESTATUS_LABEL_SM = {
  CA:  'Cursando',
  APR: 'Aprobado',
  CNV: 'Convalidado',
  PE:  'Pendiente',
  RPB: 'Reprobado',
};

function calcularNivelActivoSM(niveles, fallback) {
  if (!niveles) return fallback || '';
  const ORDEN = ['B1','B2','I1','I2'];
  const est = (n) => typeof niveles[n] === 'object' ? niveles[n]?.estatus : niveles[n];
  return ORDEN.find(n => est(n) === 'CA')
    || [...ORDEN].reverse().find(n => ['APR','CNV'].includes(est(n)))
    || fallback || '';
}
function estatusDe(niveles, nivel) {
  const v = niveles?.[nivel];
  return (typeof v === 'object' ? v?.estatus : v) || '';
}
function notaDeNivelSM(niveles, nivel) {
  const v = niveles?.[nivel];
  return typeof v === 'object' ? (v?.nota ?? v?.NOTA ?? null) : null;
}

// Parte el concepto crudo del backend en (concepto limpio | comprobante).
// Formato típico: "TIPO_NIVEL-BANCO-NUMERO-FECHA"
//   TIPO  = CUOTA | MATRICULA | CERTIFICADO
//   NIVEL = B1 | B2 | I1 | I2  (puede faltar en casos rotos: "CERTIFICADO_-BCR-...")
// Solo presentación visual; el dato crudo no se modifica.
function partirConcepto(conceptoRaw) {
  const c = String(conceptoRaw || '').trim();
  if (!c) return { concepto: '—', comprobante: '' };
  const m = c.match(/^(CUOTA|MATRICULA|CERTIFICADO)_(B1|B2|I1|I2)?/i);
  if (m) {
    const tipo  = m[1].toUpperCase();
    const nivel = m[2] ? m[2].toUpperCase() : '';
    const conceptoLimpio = nivel ? `${tipo}_${nivel}` : tipo;
    let resto = c.slice(m[0].length);
    resto = resto.replace(/^[-_\s]+/, '');
    return { concepto: conceptoLimpio, comprobante: resto || '' };
  }
  return { concepto: c, comprobante: '' };
}

// ──────────────────────────────────────────────────────────────────────────
// Shared PageHeader (re-exported para otros módulos)
// ──────────────────────────────────────────────────────────────────────────
function PageHeader({ kicker, title, sub, right }) {
  return (
    <div style={{ marginBottom:24, display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
      <div>
        {kicker && <div className="hero-kicker" style={{ marginBottom:8 }}>{kicker}</div>}
        <h1 style={{ fontFamily:'var(--f-serif)', fontSize:40, fontWeight:400, letterSpacing:'-0.035em', lineHeight:1.05, margin:0, color:'var(--an-navy-ink)' }}>
          {title}
        </h1>
        {sub && <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:6, maxWidth:640 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// Pequeño guard: si no hay sesión, mostrar bloque uniforme.
function GuardSesion({ children, usr }) {
  if (!usr) {
    return (
      <EmptyState
        icon="👤"
        title="No hay sesión activa"
        subtitle="Ingresá tu código de estudiante en el panel superior para cargar esta vista."
      />
    );
  }
  return children;
}

// Hook compartido: getEstudiante por sesión actual
function useEstudianteDeSesion() {
  const usr = useUsuario();
  const codigo = usr?.codigo || '';
  const r = useEstudiante(codigo);
  return { usr, ...r };
}

// ──────────────────────────────────────────────────────────────────────────
// estaDesbloqueada / LeccionLocked — preservadas para compatibilidad
// (cronograma_grupo y otros consumidores siguen importándolas)
// ──────────────────────────────────────────────────────────────────────────
function estaDesbloqueada(/* leccionNum, acceso */) {
  // En esta versión el control de acceso vive en cronograma_grupo (por nivel
  // académico CA/APR/CNV). Esta función queda como no-op desbloqueada para
  // no romper consumidores externos.
  return true;
}
function LeccionLocked() {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:32, gap:8, color:'var(--ink-3)', textAlign:'center',
    }}>
      <span style={{ fontSize:28 }}>🔒</span>
      <div style={{ fontWeight:600, fontSize:14 }}>Lección bloqueada</div>
      <div style={{ fontSize:12 }}>Completá el nivel anterior para acceder.</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// NotasView — expediente académico completo por nivel
// ──────────────────────────────────────────────────────────────────────────
const EVAL_SCHEMA_SM = [
  { key:'ORAL_1', tipo:'oral', titulo:'1.er Examen Oral', leccion:9, max:15, orden:1 },
  { key:'ORAL_2', tipo:'oral', titulo:'2.º Examen Oral', leccion:17, max:15, orden:2 },
  { key:'ESCRITO_1', tipo:'esc', titulo:'1.er Examen Escrito', leccion:18, max:15, orden:3 },
  { key:'ORAL_3', tipo:'oral', titulo:'3.er Examen Oral', leccion:25, max:15, orden:4 },
  { key:'ORAL_4', tipo:'oral', titulo:'4.º Examen Oral', leccion:31, max:15, orden:5 },
  { key:'ESCRITO_2', tipo:'esc', titulo:'2.º Examen Escrito', leccion:32, max:15, orden:6 },
  { key:'SOCIAL', tipo:'prog', titulo:'Participación / Social Skill', leccion:'', max:10, orden:7 },
];
function _smNivelEval_(e) {
  const raw = String(e?.nivel || e?.NIVEL || e?.nivel_actual || '').trim().toUpperCase();
  if (['B1','B2','I1','I2'].includes(raw)) return raw;
  const txt = String(e?.titulo || e?.tipo || e?.unidad || '').toUpperCase();
  if (txt.includes('BÁSICO II') || txt.includes('BASICO II') || txt.includes('B2')) return 'B2';
  if (txt.includes('BÁSICO I') || txt.includes('BASICO I') || txt.includes('B1')) return 'B1';
  if (txt.includes('INTERMEDIO II') || txt.includes('I2')) return 'I2';
  if (txt.includes('INTERMEDIO I') || txt.includes('I1')) return 'I1';
  return '';
}
function _smOfficialType_(e) {
  const direct = String(e?.tipo_oficial || '').trim().toUpperCase();
  if (EVAL_SCHEMA_SM.some(d => d.key === direct)) return direct;
  const tipo = String(e?.tipo || '').trim().toUpperCase().replace(/\s+/g,'_');
  if (EVAL_SCHEMA_SM.some(d => d.key === tipo)) return tipo;
  const txt = String(e?.titulo || e?.tipo || '').toLowerCase();
  if (txt.includes('1.er examen oral') || txt.includes('oral_1')) return 'ORAL_1';
  if (txt.includes('2.º examen oral') || txt.includes('2.o examen oral') || txt.includes('oral_2')) return 'ORAL_2';
  if (txt.includes('3.er examen oral') || txt.includes('oral_3')) return 'ORAL_3';
  if (txt.includes('4.º examen oral') || txt.includes('4.o examen oral') || txt.includes('oral_4')) return 'ORAL_4';
  if (txt.includes('1.er examen escrito') || txt.includes('escrito_1')) return 'ESCRITO_1';
  if (txt.includes('2.º examen escrito') || txt.includes('2.o examen escrito') || txt.includes('escrito_2')) return 'ESCRITO_2';
  if (txt.includes('social') || txt.includes('particip')) return 'SOCIAL';
  return '';
}
function _smEvalKind_(e) {
  const key = _smOfficialType_(e);
  const def = EVAL_SCHEMA_SM.find(d => d.key === key);
  return def?.tipo || 'other';
}
function _smFechaLarga_(iso) {
  if (!iso) return '—';
  const raw = String(iso).trim();
  const s = raw.slice(0,10);
  const d = new Date(s + 'T12:00:00');
  if (isNaN(d)) return raw;
  return d.toLocaleDateString('es-CR', { day:'2-digit', month:'long', year:'numeric' });
}
function _smChipToneByStatus_(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'APR') return 'green';
  if (s === 'CA') return 'gold';
  if (s === 'CNV') return 'navy';
  return 'navy';
}
function _smReposTone_(estado) {
  const s = String(estado || '').toUpperCase();
  if (s === 'PENDIENTE_PAGO') return { bg:'#FFF4D6', border:'#E5A823', kicker:'#8A5A00', title:'#6C1A1A' };
  if (['JUSTIFICADA_GRATUITA','PAGADA_AUTORIZADA','AUTORIZADA','PROGRAMADA'].includes(s)) return { bg:'#EAF6EE', border:'#4CAF50', kicker:'#2E7D32', title:'#123524' };
  return { bg:'#FFF7E8', border:'#E5A823', kicker:'#8A5A00', title:'#6C1A1A' };
}
function _smReposMensaje_(row) {
  const s = String(row?.ESTADO || '').toUpperCase();
  if (s === 'PENDIENTE_PAGO') return 'Administración indicó que la reposición requiere ₡10.000. Adjuntá el comprobante para habilitarla.';
  if (['JUSTIFICADA_GRATUITA','PAGADA_AUTORIZADA','AUTORIZADA','PROGRAMADA'].includes(s)) return 'Tu reposición ya fue autorizada. El docente coordinará una fecha tentativa o podrá aplicarla cuando ambos estén disponibles.';
  if (String(row?.SOLICITUD_ESTADO || '').toUpperCase() === 'ENVIADA') return 'Tu solicitud fue recibida y se encuentra en revisión por Administración.';
  return 'Enviá la solicitud dentro de las primeras 24 horas y adjuntá el respaldo. Administración definirá si procede sin costo o requiere ₡10.000.';
}
function _smStatusLabel_(row) {
  const s = String(row?.estado || '').toUpperCase();
  const map = {
    REGISTRADA:'Registrada', SIN_NOTA:'Sin nota', PROGRAMADA:'Programada',
    PENDIENTE_JUSTIFICACION:'Pendiente de solicitud', SOLICITUD_EN_PROCESO:'Solicitud en proceso', PENDIENTE_PAGO:'Pendiente de pago',
    JUSTIFICADA_GRATUITA:'Autorizada', PAGADA_AUTORIZADA:'Autorizada', AUTORIZADA:'Autorizada',
    PENDIENTE_COORDINAR_FECHA:'Pendiente de coordinar', FECHA_TENTATIVA_REGISTRADA:'Fecha tentativa',
    VENCIDA_0:'Vencida · 0', APLICADA:'Aplicada'
  };
  return map[s] || s.replaceAll('_',' ') || 'Sin nota';
}
function _smStatusTone_(row) {
  const s = String(row?.estado || '').toUpperCase();
  if (s === 'VENCIDA_0' || s === 'SIN_NOTA') return { bg:'#FDECEA', color:'#991B1B' };
  if (row?.registrada || s === 'REGISTRADA' || s === 'APLICADA') return { bg:'#E7F4EA', color:'#176B36' };
  if (['PROGRAMADA','JUSTIFICADA_GRATUITA','PAGADA_AUTORIZADA','AUTORIZADA','PENDIENTE_COORDINAR_FECHA','FECHA_TENTATIVA_REGISTRADA'].includes(s)) return { bg:'#E7F1FA', color:'#0C4F86' };
  return { bg:'#FFF4D6', color:'#805500' };
}
function _smEvalDateText_(row) {
  if (row?.fecha_programada) return `Tentativa: ${_smFechaLarga_(row.fecha_programada)}`;
  const s = String(row?.estado || '').toUpperCase();
  const base = row?.fecha_clase || row?.fecha || row?.fecha_original || '';
  if (!base) return row?.key === 'SOCIAL' ? 'Cierre del nivel' : '—';
  if (!row?.registrada && s === 'PROGRAMADA') return `Programada: ${_smFechaLarga_(base)}`;
  if (row?.es_reposicion || row?.reposicion_id) return `Clase original: ${_smFechaLarga_(row?.fecha_original || base)}`;
  return _smFechaLarga_(base);
}
function _smCanonicalRows_(evaluaciones, reposRows, nivel) {
  const raw = (Array.isArray(evaluaciones) ? evaluaciones : []).filter(e => _smNivelEval_(e) === nivel);
  const repos = (Array.isArray(reposRows) ? reposRows : []).filter(r => String(r.NIVEL || '').toUpperCase() === nivel && !['CANCELADA','APLICADA'].includes(String(r.ESTADO || '').toUpperCase()));
  return EVAL_SCHEMA_SM.map(def => {
    const found = raw.find(e => _smOfficialType_(e) === def.key) || null;
    const rep = repos.find(r => Number(r.LECCION || 0) === Number(def.leccion || -1)) || null;
    const registered = found ? (found.registrada === true || (found.registrada == null && found.nota != null && String(found.estado || '').toUpperCase() !== 'SIN_NOTA')) : false;
    const fechaBase = found?.fecha_clase || found?.fecha || '';
    let estado = String(found?.estado || '').toUpperCase();
    if (!registered && rep) {
      const solicitudEstado = String(rep.SOLICITUD_ESTADO || found?.solicitud_estado || '').toUpperCase();
      estado = solicitudEstado === 'ENVIADA' ? 'SOLICITUD_EN_PROCESO' : String(rep.ESTADO || estado || 'PENDIENTE_JUSTIFICACION').toUpperCase();
    }
    if (!registered && !rep && estado !== 'VENCIDA_0') {
      const f = String(fechaBase || '').slice(0,10);
      const today = new Date().toISOString().slice(0,10);
      const nivelEnCurso = String(found?.nivel_estatus || '').toUpperCase() === 'CA';
      if (def.key === 'SOCIAL') estado = nivelEnCurso ? 'PROGRAMADA' : 'SIN_NOTA';
      else estado = f && f >= today ? 'PROGRAMADA' : 'SIN_NOTA';
    }
    return {
      ...def,
      ...(found || {}),
      key:def.key, tipo_normalizado:def.tipo, titulo:(rep && !registered ? `${def.titulo} · reposición` : def.titulo),
      leccion:def.leccion, orden:def.orden, nivel,
      nota:registered ? Number(found?.nota || 0) : 0,
      max:Number(found?.max || def.max),
      pct:registered ? Number(found?.pct ?? ((Number(found?.nota || 0) / Number(found?.max || def.max))*100)) : 0,
      registrada:registered, faltante:!registered, estado,
      es_reposicion:!!(rep || found?.es_reposicion || found?.reposicion_id),
      reposicion_id:rep?.REPOSICION_ID || found?.reposicion_id || '',
      fecha_clase:fechaBase,
      fecha_original:rep?.FECHA_ORIGINAL || found?.fecha_original || '',
      fecha_programada:rep?.FECHA_PROGRAMADA || found?.fecha_programada || '',
      fecha_limite:rep?.FECHA_LIMITE || found?.fecha_limite || ''
    };
  });
}
function NotasView({ onNavigate }) {
  const { usr, data, loading, error, reload } = useEstudianteDeSesion();
  const codigo = usr?.codigo || '';
  const [evaluaciones, setEvaluaciones] = React.useState(null);
  const [evalErr, setEvalErr] = React.useState('');
  const [reposRows, setReposRows] = React.useState([]);
  const [reposErr, setReposErr] = React.useState('');

  React.useEffect(() => {
    if (!codigo) return;
    let cancelled = false;
    setEvalErr(''); setEvaluaciones(null);
    postStudentModules('getMisNotasF921', { codigo })
      .then(d => { if (!cancelled) setEvaluaciones(d?.ok && Array.isArray(d.evaluaciones) ? d.evaluaciones : []); })
      .catch(() => { if (!cancelled) { setEvaluaciones([]); setEvalErr('Sin conexión'); } });
    return () => { cancelled = true; };
  }, [codigo]);
  React.useEffect(() => {
    if (!codigo) return;
    let cancelled = false;
    setReposErr('');
    postStudentModules('reposMiEstadoF92', { codigo })
      .then(r => { if (!cancelled) setReposRows(r?.ok && Array.isArray(r.rows) ? r.rows : []); })
      .catch(() => { if (!cancelled) { setReposRows([]); setReposErr('Sin conexión'); } });
    return () => { cancelled = true; };
  }, [codigo]);

  return <div>
    <PageHeader kicker="Mi rendimiento" title={<>Mis <em>Notas</em></>} sub="Expediente académico por nivel y evaluaciones oficiales" />
    <GuardSesion usr={usr}>
      {loading && !data ? <SkeletonTable /> : error ? <ErrorState message={error} onRetry={reload} /> :
        <NotasContenido data={data} evaluaciones={evaluaciones} evalErr={evalErr} reposRows={reposRows} reposErr={reposErr} onNavigate={onNavigate} />}
    </GuardSesion>
  </div>;
}

function NotasContenido({ data, evaluaciones, evalErr, reposRows, reposErr, onNavigate }) {
  const niveles = data?.niveles || {};
  const nivelActivo = calcularNivelActivoSM(niveles);
  const [selectedLevel, setSelectedLevel] = React.useState(nivelActivo || 'B1');
  const [filter, setFilter] = React.useState('all');
  React.useEffect(() => { if (nivelActivo) setSelectedLevel(nivelActivo); }, [nivelActivo]);

  const selected = selectedLevel || nivelActivo || 'B1';
  const rowsByLevel = _smCanonicalRows_(evaluaciones, reposRows, selected);
  const visibleRows = rowsByLevel.filter(e => filter === 'all' || e.tipo_normalizado === filter);
  const completedLevel = rowsByLevel.filter(e => e.registrada);
  const totalPuntos = Math.round(rowsByLevel.reduce((a,e)=>a+Number(e.nota||0),0)*100)/100;
  const totalMax = rowsByLevel.reduce((a,e)=>a+Number(e.max||0),0) || 100;
  const avgLevel = completedLevel.length ? (completedLevel.reduce((a,e)=>a+Number(e.pct||0),0)/completedLevel.length).toFixed(1) : null;
  const notaNivel = notaDeNivelSM(niveles, selected);
  const estatusNivel = estatusDe(niveles, selected) || (selected === nivelActivo ? 'CA' : 'PE');
  const activeRepos = (Array.isArray(reposRows) ? reposRows : []).filter(r => !['APLICADA','VENCIDA_0','CANCELADA'].includes(String(r.ESTADO || '').toUpperCase()));
  const pendingRepos = activeRepos.filter(r => String(r.NIVEL || '').toUpperCase() === selected);
  const pendingAlert = activeRepos[0] || null;

  const gradeLetter = (pct) => pct >= 95?'A+':pct >= 90?'A':pct >= 85?'A-':pct >= 80?'B+':pct >= 75?'B':pct >= 70?'B-':pct >= 65?'C':'D';
  const gradeColor = (g) => g?.startsWith('A')?'var(--ok)':g?.startsWith('B')?'var(--an-navy)':g?.startsWith('C')?'var(--warn)':'var(--danger)';

  return <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
    {pendingAlert && (() => { const tone=_smReposTone_(pendingAlert.ESTADO); return <section style={{border:`1px solid ${tone.border}`,background:tone.bg,borderRadius:20,padding:18,boxShadow:'var(--sh-1)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'flex-start',flexWrap:'wrap'}}>
        <div><div style={{fontSize:10.5,fontWeight:900,letterSpacing:'.14em',textTransform:'uppercase',color:tone.kicker}}>Aviso académico importante</div>
          <div style={{fontFamily:'var(--f-serif)',fontSize:30,lineHeight:1.02,color:tone.title,marginTop:4}}>Tenés una reposición pendiente</div>
          <div style={{fontSize:13,color:'var(--ink-2)',marginTop:8,maxWidth:860,lineHeight:1.6}}><strong>Examen oral · Lección {String(pendingAlert.LECCION||'').padStart(2,'0')}</strong><br/>
            Fecha original: {_smFechaLarga_(pendingAlert.FECHA_ORIGINAL)} · Solicitud hasta: {_smFechaLarga_(pendingAlert.SOLICITUD_LIMITE_AT||pendingAlert.SOLICITUD_LIMITE)} · Aplicación máxima: {_smFechaLarga_(pendingAlert.FECHA_LIMITE)}.<br/>{_smReposMensaje_(pendingAlert)}
            <div style={{marginTop:10,padding:'10px 12px',borderRadius:12,background:'rgba(255,255,255,.72)',border:'1px solid rgba(138,90,0,.18)',color:'var(--ink-2)'}}>La reposición <strong>no bloquea tu acceso al curso</strong>. Si vence sin aplicarse, este componente queda en 0; el nivel se aprueba con un acumulado final de 70 o más.</div>
          </div></div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}><span style={{padding:'7px 12px',borderRadius:999,background:'#fff',border:`1px solid ${tone.border}`,color:tone.kicker,fontSize:11,fontWeight:900}}>{String(pendingAlert.SOLICITUD_ESTADO||pendingAlert.ESTADO||'').replaceAll('_',' ')}</span><button className="btn btn-primary" type="button" onClick={()=>onNavigate&&onNavigate('solicitudes_estudiante')}>Ir a Solicitudes</button></div>
      </div></section>; })()}

    <section className="card" style={{padding:18}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-end',flexWrap:'wrap',marginBottom:14}}><div><div className="card-title">Resumen por nivel</div><div style={{fontSize:12,color:'var(--ink-3)',marginTop:3}}>Se abre en tu nivel actual. Seleccioná otro nivel para consultar su historial.</div></div><div style={{fontSize:11,color:'var(--ink-3)',fontWeight:800}}>{selected===nivelActivo?'Vista actual del nivel en curso':'Vista histórica seleccionada'}</div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>{['B1','B2','I1','I2'].map(n=>{const est=estatusDe(niveles,n)||(n===nivelActivo?'CA':'PE'),nota=notaDeNivelSM(niveles,n),active=n===selected,color=NIVEL_COLOR_SM[n]||'var(--an-navy)';return <button key={n} type="button" onClick={()=>setSelectedLevel(n)} style={{border:`2px solid ${active?color:'var(--line)'}`,background:active?`color-mix(in srgb, ${color} 8%, white)`:'#fff',borderRadius:18,padding:16,textAlign:'left',cursor:'pointer',fontFamily:'inherit'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:10.5,fontWeight:900,letterSpacing:'.13em',textTransform:'uppercase',color:'var(--ink-3)'}}>{NIVEL_NOMBRE_SM[n]}</span>{active&&<span style={{fontSize:10,fontWeight:900,color}}>{n===nivelActivo?'ACTUAL':'VISTA'}</span>}</div><div style={{fontFamily:'var(--f-serif)',fontSize:28,lineHeight:1,color,marginTop:8}}>{n}</div><div style={{fontSize:12,color:'var(--ink-2)',marginTop:4}}>{nota!=null?`${nota}/100 acumulado`:(est==='CA'?'Nivel en curso':'Sin nota final registrada')}</div><div style={{marginTop:8}}><Chip tone={_smChipToneByStatus_(est)} dot>{ESTATUS_LABEL_SM[est]||est||'Pendiente'}</Chip></div></button>})}</div>
    </section>

    <div className="grid-4"><Stat label="Nivel consultado" num={selected} sub={NIVEL_NOMBRE_SM[selected]} pct={0} color={NIVEL_COLOR_SM[selected]}/><Stat label="Acumulado oficial" num={String(totalPuntos)} suffix="/100" sub={estatusNivel==='CA'?'Nota en construcción':'Total del nivel'} subTone={totalPuntos>=70?'ok':''} pct={totalPuntos} color="var(--an-granate)"/><Stat label="Evaluaciones registradas" num={`${completedLevel.length}/7`} sub={`${7-completedLevel.length} pendientes o programadas`} pct={(completedLevel.length/7)*100} color="var(--an-navy)"/><Stat label="Promedio de evaluaciones" num={avgLevel||'—'} suffix={avgLevel?'%':''} sub={completedLevel.length?`${completedLevel.length} calificadas`:'Sin datos aún'} pct={Number(avgLevel||0)} color="var(--an-gold)"/></div>

    <section className="card" style={{padding:0,overflow:'hidden'}}>
      <div style={{padding:'16px 18px 12px',borderBottom:'1px solid var(--line)',display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-end',flexWrap:'wrap'}}><div><div className="card-title">Detalle de evaluaciones</div><div style={{fontSize:12,color:'var(--ink-3)',marginTop:4}}>Todas las evaluaciones oficiales de <strong>{NIVEL_NOMBRE_SM[selected]}</strong> aparecen siempre en el orden del cronograma. {pendingRepos.length?`${pendingRepos.length} reposición activa.`:''}</div></div><div className="tabs" style={{margin:0}}>{[['all','Todo'],['oral','Orales'],['esc','Escritos'],['prog','Progress Check']].map(([k,l])=><button key={k} className={`tab ${filter===k?'active':''}`} onClick={()=>setFilter(k)}>{l}</button>)}</div></div>
      <div style={{overflowX:'auto'}}><table className="table-soft" style={{minWidth:940}}><thead><tr><th style={{width:72}}>Lec.</th><th>Evaluación</th><th style={{width:190}}>Fecha</th><th style={{width:160}}>Estado</th><th style={{textAlign:'right',width:120}}>Puntaje</th><th style={{textAlign:'right',width:80}}>%</th><th style={{textAlign:'center',width:80}}>Nota</th></tr></thead><tbody>
        {evaluaciones===null?<tr><td colSpan={7} style={{padding:24,textAlign:'center'}}>Cargando…</td></tr>:visibleRows.map(row=>{const pct=Number(row.pct||0),grade=gradeLetter(pct),tone=_smStatusTone_(row);const statusUpper=String(row.estado||'').toUpperCase(),rowBg=(statusUpper==='SIN_NOTA'||statusUpper==='VENCIDA_0')?'color-mix(in srgb, var(--danger) 3%, white)':statusUpper==='PROGRAMADA'?'#F8FAFE':'#fff';return <tr key={row.key} style={{background:rowBg}}><td style={{fontFamily:'var(--f-mono)',color:'var(--ink-3)'}}>{row.leccion?`L${String(row.leccion).padStart(2,'0')}`:'—'}</td><td><div style={{fontWeight:750}}>{row.titulo}</div><div style={{fontSize:11,color:'var(--ink-3)',marginTop:3}}>{NIVEL_NOMBRE_SM[selected]}{row.es_reposicion?' · Reposición':''}</div></td><td style={{fontSize:12,color:'var(--ink-2)'}}>{_smEvalDateText_(row)}</td><td><span style={{display:'inline-flex',padding:'5px 9px',borderRadius:999,background:tone.bg,color:tone.color,fontSize:10,fontWeight:900}}>{_smStatusLabel_(row)}</span></td><td style={{textAlign:'right',fontFamily:'var(--f-mono)',fontWeight:750}}>{row.registrada?`${Number(row.nota||0)}/${row.max}`:(String(row.estado||'').toUpperCase()==='PROGRAMADA'?`—/${row.max}`:`0/${row.max}`)}</td><td style={{textAlign:'right',fontWeight:750}}>{row.registrada?`${Math.round(pct)}%`:(String(row.estado||'').toUpperCase()==='PROGRAMADA'?'—':'0%')}</td><td style={{textAlign:'center'}}><span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',minWidth:38,height:38,borderRadius:10,background:row.registrada?`color-mix(in srgb, ${gradeColor(grade)} 14%, white)`:String(row.estado||'').toUpperCase()==='PROGRAMADA'?'#EEF2F7':'#FDECEA',color:row.registrada?gradeColor(grade):String(row.estado||'').toUpperCase()==='PROGRAMADA'?'#40516A':'#991B1B',fontWeight:800}}>{row.registrada?grade:String(row.estado||'').toUpperCase()==='PROGRAMADA'?'—':'0'}</span></td></tr>})}
      </tbody><tfoot><tr style={{background:'#F7F3EC',borderTop:'2px solid var(--an-navy)'}}><td colSpan={4} style={{fontWeight:900,color:'var(--an-navy)',textAlign:'right'}}>SUMA TOTAL DEL NIVEL</td><td style={{textAlign:'right',fontFamily:'var(--f-mono)',fontSize:16,fontWeight:900,color:'var(--an-navy)'}}>{totalPuntos}/{totalMax}</td><td style={{textAlign:'right',fontWeight:900,color:'var(--an-navy)'}}>{Math.round((totalPuntos/totalMax)*100)}%</td><td style={{textAlign:'center',fontWeight:900,color:totalPuntos>=70?'var(--ok)':'var(--danger)'}}>{totalPuntos>=70?'APR':'—'}</td></tr></tfoot></table></div>
      {(evalErr||reposErr)&&<div style={{padding:'10px 18px',fontSize:11,color:'var(--danger)',borderTop:'1px solid var(--line)'}}>Algunos datos no pudieron actualizarse. Recargá la vista.</div>}
    </section>
  </div>;
}

// ──────────────────────────────────────────────────────────────────────────
// TareasView — pendiente backend
// ──────────────────────────────────────────────────────────────────────────
function TareasView() {
  const usr = useUsuario();
  return (
    <div>
      <PageHeader
        kicker="Trabajo independiente"
        title={<>Mis <em>Tareas</em></>}
        sub="Self-study semanal · conecta tu progreso entre clases"
      />
      <GuardSesion usr={usr}>
        <EmptyState
          icon="📚"
          title="Tareas próximamente disponibles"
          subtitle="Estamos terminando de conectar este módulo con el sistema académico. Pronto podrás ver tus asignaciones y entregas acá."
        />
      </GuardSesion>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// MaterialesView (versión simple — la versión completa vive en syllabus_views.jsx)
// app.jsx usa la de syllabus_views; esta queda como fallback honesto.
// ──────────────────────────────────────────────────────────────────────────
function MaterialesViewLegacy() {
  const usr = useUsuario();
  return (
    <div>
      <PageHeader
        kicker="Recursos del curso"
        title={<>Materiales de <em>clase</em></>}
        sub="PDFs y recursos disponibles del nivel activo"
      />
      <GuardSesion usr={usr}>
        <EmptyState
          icon="📖"
          title="Materiales próximamente disponibles"
          subtitle="El acceso a los PDFs de cada lección está siendo conectado al cronograma del grupo. Mientras tanto podés verlos desde el calendario de lecciones."
        />
      </GuardSesion>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// MensajesView — pendiente backend
// ──────────────────────────────────────────────────────────────────────────
function MensajesView() {
  const usr = useUsuario();
  return (
    <div>
      <PageHeader
        kicker="Comunicación"
        title={<>Mis <em>Mensajes</em></>}
        sub="Canal directo con tu docente y administración"
      />
      <GuardSesion usr={usr}>
        <EmptyState
          icon="💬"
          title="Mensajes próximamente disponibles"
          subtitle="Estamos terminando de conectar este módulo. Mientras tanto, podés contactar a tu docente o a administración por los canales habituales."
        />
      </GuardSesion>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// PagosView — pendientes reales del Apps Script
// ──────────────────────────────────────────────────────────────────────────
function PagosView() {
  const { usr, data, loading, error, reload } = useEstudianteDeSesion();
  return (
    <div>
      <PageHeader
        kicker="Gestión financiera"
        title={<>Pagos y <em>estado de cuenta</em></>}
        sub="Matrícula, cuotas, certificado e historial · información en tiempo real"
      />
      <GuardSesion usr={usr}>
        {loading && !data ? (
          <SkeletonTable />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <PagosContenido data={data} />
        )}
      </GuardSesion>
    </div>
  );
}

function PagosContenido({ data }) {
  const pendientes  = data?.pendientes  || {};
  const niveles     = data?.niveles     || {};
  const pagos       = data?.pagos       || [];
  const otrosPagos  = data?.otrosPagos  || [];
  const grupo       = data?.grupo       || {};

  const nivelActivo = calcularNivelActivoSM(niveles);
  const nivelColor  = NIVEL_COLOR_SM[nivelActivo] || 'var(--an-granate)';

  // v4.15: campos reales del GS
  const matPend    = (pendientes.matricula   || 0) > 0;
  const certPend   = (pendientes.certificado || 0) > 0;
  const cuotaMonto = pendientes.cuotas_pendiente || 0;
  const cuotaMens  = pendientes.cuota_mensual    || 0;
  const nCuotasPer = pendientes.n_cuotas_periodo || 4;
  const cuotasPend = cuotaMens > 0 ? Math.round(cuotaMonto / cuotaMens) : (cuotaMonto > 0 ? 1 : 0);
  const totalPendientes = (matPend ? 1 : 0) + cuotasPend + (certPend ? 1 : 0);

  const alDia = totalPendientes === 0;

  const fmt = (n) => n != null ? '₡' + Number(n).toLocaleString('es-CR') : '—';

  const todosPagos = [...pagos, ...otrosPagos];

  return (
    <>
      {/* HERO */}
      <div className="card" style={{
        padding:'22px 28px', marginBottom:16,
        background: alDia
          ? 'linear-gradient(135deg, #FBF8F2 0%, #FFFFFF 50%, color-mix(in srgb, var(--ok) 8%, white) 100%)'
          : 'linear-gradient(135deg, #FBF8F2 0%, #FFFFFF 50%, color-mix(in srgb, var(--an-gold) 10%, white) 100%)',
      }}>
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:24, alignItems:'center' }}>
          <div style={{
            width:60, height:60, borderRadius:'50%',
            background: alDia ? 'var(--ok)' : 'var(--an-gold)',
            display:'flex', alignItems:'center', justifyContent:'center', color:'white',
            boxShadow:`0 8px 20px -6px ${alDia ? 'rgba(46,125,50,0.4)' : 'rgba(229,168,35,0.4)'}`,
          }}>
            {alDia
              ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
              : <span style={{ fontFamily:'var(--f-serif)', fontSize:28, fontWeight:600, lineHeight:1 }}>{totalPendientes}</span>}
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3)' }}>
              Tu estado global
            </div>
            <div style={{
              fontFamily:'var(--f-serif)', fontWeight:500,
              fontSize:38, lineHeight:1.05, letterSpacing:'-0.035em',
              color: alDia ? 'var(--ok)' : 'var(--an-granate-ink)',
              marginTop:3,
            }}>
              {alDia ? 'Al día ✓' : (totalPendientes === 1 ? '1 concepto por cubrir' : `${totalPendientes} conceptos por cubrir`)}
            </div>
            <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:4 }}>
              {nivelActivo ? <>Cursando <strong style={{ color:'var(--ink)' }}>{NIVEL_NOMBRE_SM[nivelActivo]}</strong></> : 'Sin nivel activo'}
              {grupo.CODIGO_GRUPO && <> · Grupo {grupo.CODIGO_GRUPO}</>}
            </div>
          </div>
        </div>
      </div>

      {/* Desglose de pendientes */}
      <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:16 }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)' }}>
          <div className="card-title">Por cubrir</div>
        </div>
        {totalPendientes === 0 ? (
          <div style={{ padding:'32px 20px', textAlign:'center', color:'var(--ok)' }}>
            ✓ No tenés conceptos pendientes en este momento.
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column' }}>
            {matPend && (
              <FilaConcepto
                label="Matrícula"
                sub={nivelActivo ? NIVEL_NOMBRE_SM[nivelActivo] : '—'}
                monto={fmt(pendientes.matricula)}
                fecha={pendientes.matricula_vence || ''}
                color={nivelColor}
                accent="warn"
              />
            )}
            {cuotasPend > 0 && (
              <FilaConcepto
                label={`${cuotasPend} cuota${cuotasPend>1?'s':''} mensual${cuotasPend>1?'es':''}`}
                sub={nivelActivo ? `Mensualidades de ${NIVEL_NOMBRE_SM[nivelActivo]}` : 'Mensualidades'}
                monto={fmt(cuotaMens != null ? cuotaMens * cuotasPend : null)}
                fecha={pendientes.cuota_vence || ''}
                color={nivelColor}
                accent="warn"
              />
            )}
            {certPend && (
              <FilaConcepto
                label="Certificado del nivel"
                sub={nivelActivo ? NIVEL_NOMBRE_SM[nivelActivo] : '—'}
                monto={fmt(pendientes.certificado)}
                fecha=""
                color={nivelColor}
                accent="neutral"
              />
            )}
          </div>
        )}
      </div>

      {/* Historial de pagos */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <div className="card-title">Historial de pagos</div>
          {todosPagos.length > 0 && <span style={{ fontSize:11, color:'var(--ink-3)' }}>{todosPagos.length} movimientos</span>}
        </div>
        {todosPagos.length === 0 ? (
          <div style={{ padding:'28px 20px', textAlign:'center', color:'var(--ink-3)', fontSize:13 }}>
            Sin pagos registrados aún.
          </div>
        ) : (
          <table className="table-soft">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Comprobante</th>
                <th style={{ textAlign:'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {todosPagos.map((p, i) => {
                const crudo = p.concepto || p.CONCEPTO || p.descripcion || p.DESCRIPCION || '';
                const { concepto, comprobante } = partirConcepto(crudo);
                return (
                <tr key={i}>
                  <td style={{ fontSize:12, color:'var(--ink-2)' }}>{p.fecha || p.FECHA || '—'}</td>
                  <td>
                    <div style={{ fontWeight:600 }}>{concepto || '—'}</div>
                    {(p.grupo || p.GRUPO) && <div style={{ fontSize:11, color:'var(--ink-3)' }}>{p.grupo || p.GRUPO}</div>}
                  </td>
                  <td style={{ fontSize:12, fontFamily:'var(--f-mono)', color:'var(--ink-2)' }}>{comprobante || '—'}</td>
                  <td style={{ textAlign:'right', fontFamily:'var(--f-mono)', fontWeight:600 }}>{fmt(p.monto ?? p.MONTO)}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{
        marginTop:20, padding:'14px 18px',
        border:'1px solid var(--line)', borderRadius:'var(--r-md)',
        background:'var(--surface)', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap',
        fontSize:13, color:'var(--ink-2)',
      }}>
        <div style={{ flex:1, minWidth:240 }}>
          <strong style={{ color:'var(--ink)' }}>¿Alguna dificultad este mes?</strong>{' '}
          Podemos acomodar fechas — escribinos a administración.
        </div>
        {/* STUDENT-CONTACT-ADMIN-002: Estado de cuenta → contacto de COBROS
            dinámico (getContactoCampus tipo='cobros'). Abre WhatsApp solo si hay
            número real; si no, estado honesto. Sin números quemados. */}
        <ContactoAdmin est={data?.estudiante || data} tipo="cobros" />
      </div>
    </>
  );
}

function FilaConcepto({ label, sub, monto, fecha, color, accent }) {
  const accentColor = accent === 'warn' ? 'var(--warn)' : 'var(--ink-3)';
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap:14, alignItems:'center',
      padding:'14px 20px', borderBottom:'1px solid var(--line)',
    }}>
      <span style={{
        width:10, height:10, borderRadius:'50%',
        background: color, border:`2px solid ${color}`,
        boxShadow:`0 0 0 3px color-mix(in srgb, ${color} 20%, transparent)`,
      }} />
      <div>
        <div style={{ fontWeight:600, fontSize:14 }}>{label}</div>
        <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>
          {sub}{fecha ? ` · vence ${fecha}` : ''}
        </div>
      </div>
      <div style={{ fontFamily:'var(--f-mono)', fontSize:14, fontWeight:700, color:'var(--ink)' }}>
        {monto}
      </div>
      <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', color: accentColor, textTransform:'uppercase' }}>
        Pendiente
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// CertificadosView — derivados del objeto niveles
// ──────────────────────────────────────────────────────────────────────────
function CertificadosView() {
  const { usr, data, loading, error, reload } = useEstudianteDeSesion();
  return (
    <div>
      <PageHeader
        kicker="Documentos oficiales"
        title={<>Mis <em>Certificados</em></>}
        sub="Estado académico para solicitud, emisión y futura descarga"
      />
      <GuardSesion usr={usr}>
        {loading && !data ? (
          <SkeletonGrid />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <CertificadosContenido data={data} />
        )}
      </GuardSesion>
    </div>
  );
}

function CertificadosContenido({ data }) {
  const niveles = data?.niveles || {};
  const ORDEN = ['B1','B2','I1','I2'];
  // F96: APR/CNV demuestra elegibilidad académica, no que exista un PDF emitido.
  const elegibles = ORDEN
    .filter(n => ['APR','CNV'].includes(estatusDe(niveles, n)))
    .map(n => ({ nivel:n, estatus: estatusDe(niveles, n), nota: notaDeNivelSM(niveles, n) }));
  const porDesbloquear = ORDEN.filter(n => !elegibles.find(d => d.nivel === n));

  if (elegibles.length === 0) {
    return (
      <>
        <EmptyState
          icon="🎖️"
          title="Aún no tenés niveles elegibles para certificado"
          subtitle="La elegibilidad académica inicia al aprobar o convalidar un nivel. La emisión oficial se confirma por separado."
        />
        <div style={{ marginTop:24 }}>
          <div className="card-h" style={{ padding:'0 4px' }}>
            <div className="card-title">Por desbloquear</div>
          </div>
          <PorDesbloquearGrid niveles={porDesbloquear} estatusNiveles={niveles} />
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:16, marginBottom:24 }}>
        {elegibles.map(d => (
          <div key={d.nivel} className="card" style={{
            padding:24, background:'linear-gradient(135deg, #FFFFFF 0%, #FBF8F2 100%)',
            position:'relative', overflow:'hidden', minHeight:200,
            borderTop:`4px solid ${NIVEL_COLOR_SM[d.nivel]}`,
          }}>
            <div style={{
              position:'absolute', right:-40, bottom:-40, width:180, height:180,
              background: NIVEL_COLOR_SM[d.nivel], opacity:0.06, borderRadius:'50%',
            }} />
            <div style={{ display:'flex', alignItems:'flex-start', gap:16, position:'relative' }}>
              <div style={{
                width:56, height:56, borderRadius:'50%',
                background: NIVEL_COLOR_SM[d.nivel],
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', flexShrink:0, boxShadow:'var(--sh-1)',
              }}>
                <Icon name="certificates" size={26} className="" />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:NIVEL_COLOR_SM[d.nivel] }}>
                  {d.estatus === 'CNV' ? 'Convalidado · elegible' : 'Aprobado · elegible'}
                </div>
                <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, lineHeight:1.2, margin:'6px 0', color:'var(--an-navy-ink)' }}>
                  Certificado · {NIVEL_NOMBRE_SM[d.nivel]}
                </div>
                <div style={{ fontSize:12, color:'var(--ink-2)' }}>
                  {NIVEL_LIBRO_SM[d.nivel]}{d.nota != null ? ` · Nota final: ${d.nota}/100` : ''}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:20, position:'relative' }}>
              <div style={{padding:'10px 12px',borderRadius:12,background:'var(--bg-deep)',fontSize:11.5,color:'var(--ink-2)',lineHeight:1.55}}>
                Este nivel es elegible académicamente. La emisión, el número oficial y el archivo PDF deben ser confirmados por administración.
              </div>
              {/* STUDENT-CONTACT-ADMIN-002: certificación académica → contacto
                  ACADÉMICO, solo si hay número real (si no, texto honesto arriba). */}
              <ContactoAdmin est={data?.estudiante || data} tipo="academico" hideWhenPending size={11} />
            </div>
          </div>
        ))}
      </div>

      {porDesbloquear.length > 0 && (
        <div>
          <div className="card-h" style={{ padding:'0 4px' }}>
            <div className="card-title">Por desbloquear</div>
          </div>
          <PorDesbloquearGrid niveles={porDesbloquear} estatusNiveles={niveles} />
        </div>
      )}
    </>
  );
}

function PorDesbloquearGrid({ niveles, estatusNiveles }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12 }}>
      {niveles.map(n => {
        const estatus = estatusDe(estatusNiveles, n);
        const enCurso = estatus === 'CA';
        return (
          <div key={n} className="card" style={{
            textAlign:'center', padding:20,
            opacity: enCurso ? 1 : 0.55,
            borderTop:`3px solid ${NIVEL_COLOR_SM[n]}`,
          }}>
            <div style={{
              width:54, height:54, margin:'0 auto 10px',
              borderRadius:'50%', background: enCurso ? NIVEL_COLOR_SM[n] : 'var(--bg-deep)',
              color: enCurso ? 'white' : 'var(--ink-3)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--f-mono)', fontWeight:700,
            }}>
              {enCurso ? '●' : '🔒'}
            </div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:16, fontWeight:500 }}>{NIVEL_NOMBRE_SM[n]}</div>
            <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>
              {enCurso ? 'En curso · al aprobar' : (estatus ? ESTATUS_LABEL_SM[estatus] : 'Bloqueado')}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// PerfilView — datos reales del estudiante
// ──────────────────────────────────────────────────────────────────────────
function PerfilView({ onNavigate } = {}) {
  const { usr, data, loading, error, reload } = useEstudianteDeSesion();
  const rolPerfil = String(usr?.rol || usr?.role || '').toLowerCase();
  const esTeacherPerfil = rolPerfil === 'teacher' || rolPerfil === 'docente';
  return (
    <div>
      <PageHeader
        kicker="Mi cuenta"
        title={esTeacherPerfil ? <>Teacher</> : <>Mi <em>Perfil</em></>}
        sub={esTeacherPerfil ? 'Información profesional del docente' : 'Información personal y académica'}
      />
      <GuardSesion usr={usr}>
        {loading && !data ? (
          <SkeletonGrid />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <PerfilContenido usr={usr} data={data} onNavigate={onNavigate} />
        )}
      </GuardSesion>
    </div>
  );
}

function PerfilContenido({ usr, data, onNavigate }) {
  const est     = data?.estudiante || {};
  const grupo   = data?.grupo      || {};
  const niveles = data?.niveles    || {};
  const rolPerfil = String(usr?.rol || usr?.role || '').toLowerCase();
  const esTeacherPerfil = rolPerfil === 'teacher' || rolPerfil === 'docente';

  const nivelActivo = calcularNivelActivoSM(niveles, usr?.nivel_activo);
  const nombre   = est.NOMBRE || usr?.nombre || '—';
  const initials = nombre !== '—'
    ? nombre.split(' ').slice(0,2).map(w => w[0] || '').join('').toUpperCase()
    : '—';
  const correo   = est.CORREO || est.EMAIL || usr?.correo || usr?.email || '—';
  const telefono = est.TELEFONO || est.WHATSAPP || usr?.telefono || usr?.whatsapp || '—';
  const cedula   = est.CEDULA || est.NUM_CEDULA || usr?.cedula || '—';
  const codigo   = est.CODIGO || est.REC_M || usr?.codigo || '—';
  const docente  = grupo.DOCENTE || '—';
  const horario  = grupo.HORARIO || grupo.DIAS || '—';

  const ORDEN = ['B1','B2','I1','I2'];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:20 }}>
      {/* Identity */}
      <div className="card" style={{ textAlign:'center' }}>
        <div style={{
          width:120, height:120, borderRadius:'50%',
          background:'linear-gradient(135deg, var(--an-granate), var(--an-red))',
          color:'white', fontFamily:'var(--f-serif)', fontSize:44, fontWeight:500,
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 14px', boxShadow:'var(--sh-2)', border:'4px solid white',
        }}>{initials}</div>
        <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, lineHeight:1.15, color:'var(--an-navy-ink)' }}>
          {nombre}
        </div>
        <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:4, fontFamily:'var(--f-mono)' }}>
          {esTeacherPerfil ? 'Docente' : 'Código'} {esTeacherPerfil ? '' : codigo}
        </div>

        <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap', marginTop:14 }}>
          <Chip tone="granate">{esTeacherPerfil ? 'Docente activo' : 'Estudiante activo'}</Chip>
          {!esTeacherPerfil && grupo.CODIGO_GRUPO && <Chip tone="navy">{grupo.CODIGO_GRUPO}</Chip>}
        </div>

        <div style={{ marginTop:22, textAlign:'left', borderTop:'1px solid var(--line)', paddingTop:16 }}>
          {(esTeacherPerfil
            ? [
                ['Correo', correo],
                ['Teléfono', telefono],
                ['Cédula', cedula],
              ]
            : [
                ['Correo', correo],
                ['Teléfono', telefono],
                ['Cédula', cedula],
                ['Nivel actual', nivelActivo ? NIVEL_NOMBRE_SM[nivelActivo] : '—'],
                ['Libro', nivelActivo ? NIVEL_LIBRO_SM[nivelActivo] : '—'],
                ['Docente', docente],
                ['Horario', horario],
              ]
          ).map(([k, v], i, arr) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'7px 0', borderBottom: i < arr.length-1 ? '1px solid var(--line)' : 'none' }}>
              <span style={{ color:'var(--ink-3)', fontWeight:600 }}>{k}</span>
              <span style={{ color:'var(--ink)', fontWeight:500, textAlign:'right', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis' }}>{v}</span>
            </div>
          ))}
          {esTeacherPerfil && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:16 }}>
              <button type="button" className="btn btn-primary" style={{ justifyContent:'center', padding:'10px 12px', fontSize:12 }}
                onClick={() => alert('Curriculum pendiente de configurar por administración.')}>
                CURRICULUM
              </button>
              <button type="button" className="btn btn-ghost" style={{ justifyContent:'center', padding:'10px 12px', fontSize:12 }}
                onClick={() => alert('Aval INA pendiente de configurar por administración.')}>
                AVAL INA
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Camino / Configuración */}
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {!esTeacherPerfil && <ReposicionStudentCardF92 onNavigate={onNavigate} />}
        {!esTeacherPerfil && (
          <div className="card">
            <div className="card-h">
              <div className="card-title">Mi camino</div>
              {nivelActivo && <Chip tone="granate" dot>En {NIVEL_NOMBRE_SM[nivelActivo]}</Chip>}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
              {ORDEN.map((n, i) => {
                const estatus = estatusDe(niveles, n);
                const esActivo = n === nivelActivo;
                const aprobado = estatus === 'APR' || estatus === 'CNV';
                const c = NIVEL_COLOR_SM[n];
                return (
                  <div key={n} style={{
                    padding:'14px 12px', borderRadius:'var(--r-md)',
                    background: esActivo
                      ? `color-mix(in srgb, ${c} 10%, white)`
                      : aprobado
                        ? 'color-mix(in srgb, var(--ok) 8%, white)'
                        : 'var(--surface-2)',
                    border: esActivo ? `2px solid ${c}` : '1px solid var(--line)',
                  }}>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color: esActivo ? c : 'var(--ink-3)' }}>
                      {n}
                    </div>
                    <div style={{ fontFamily:'var(--f-serif)', fontSize:16, fontWeight:500, marginTop:3, color:'var(--ink)' }}>
                      {NIVEL_NOMBRE_SM[n]}
                    </div>
                    <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>
                      {NIVEL_LIBRO_SM[n]}
                    </div>
                    <div style={{ marginTop:8, fontSize:11, fontWeight:700, color: esActivo ? c : aprobado ? 'var(--ok)' : 'var(--ink-3)' }}>
                      {esActivo ? '● Cursando' : aprobado ? '✓ ' + ESTATUS_LABEL_SM[estatus] : (ESTATUS_LABEL_SM[estatus] || 'Pendiente')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-h">
            <div className="card-title">Configuración</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {[
              { label:'Notificaciones por correo', sub:'Recordatorios y avisos académicos', key:'notif_email', disabled:true },
              { label:'Recordatorios por WhatsApp', sub:'Avisos de clase y evaluaciones', key:'notif_wa', disabled:true },
              { label:'Modo oscuro', sub:'Cambia la apariencia del campus', key:'dark_mode', disabled:false },
            ].map((cfg, i, arr) => {
              const [on, setOn] = React.useState(() => {
                try { return localStorage.getItem('an_cfg_' + cfg.key) === '1'; } catch { return false; }
              });
              const toggle = () => {
                if (cfg.disabled) return;
                const next = !on;
                setOn(next);
                try { localStorage.setItem('an_cfg_' + cfg.key, next ? '1' : '0'); } catch {}
              };
              return (
                <div key={cfg.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom: i < arr.length-1 ? '1px solid var(--line)' : 'none', opacity: cfg.disabled ? 0.5 : 1 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{cfg.label}</div>
                    <div style={{ fontSize:11, color:'var(--ink-3)' }}>{cfg.disabled ? cfg.sub + ' — Próximamente' : cfg.sub}</div>
                  </div>
                  <div onClick={toggle} style={{ width:44, height:24, borderRadius:12, background: on ? 'var(--ok)' : 'var(--line-2)', cursor: cfg.disabled ? 'not-allowed' : 'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                    <div style={{ position:'absolute', top:3, left: on ? 23 : 3, width:18, height:18, borderRadius:'50%', background:'white', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', transition:'left .2s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// ExamenOralView — F89 contenido completo sin barras internas
// ──────────────────────────────────────────────────────────────────────────
function ExamenOralView({ context = null }) {
  const ctx = context && typeof context === 'object' ? context : {};
  const [frameHeight,setFrameHeight]=React.useState(1200);
  const params = new URLSearchParams();
  if (ctx.grupo) params.set('grupo', ctx.grupo);
  if (ctx.nivel) params.set('nivel', ctx.nivel);
  if (ctx.leccion) params.set('leccion', String(ctx.leccion));
  if (ctx.fecha) params.set('fecha', String(ctx.fecha).slice(0,10));
  if (ctx.reposicion_id) params.set('reposicion_id', String(ctx.reposicion_id));
  params.set('v', 'F91');
  const src = `modulos/examen_oral.html?${params.toString()}`;
  const titulo = ({9:'1.er Examen Oral',17:'2.º Examen Oral',25:'3.er Examen Oral',31:'4.º Examen Oral'})[Number(ctx.leccion || 0)] || 'Examen Oral';
  React.useEffect(() => {
    const handler = (event) => {
      if (event.origin !== window.location.origin) return;
      if(event.data?.type==='an:oral-height'){
        const h=Math.max(900,Math.min(12000,Number(event.data.height)||1200));
        setFrameHeight(h);
        return;
      }
      if (event.data?.type !== 'an:oral-updated') return;
      window.dispatchEvent(new CustomEvent('an:oral-updated', { detail:event.data }));
      window.dispatchEvent(new CustomEvent('an:teacher-session-changed'));
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);
  return <div className="oral-shell-f89" style={{padding:0,overflow:'visible',width:'100%',minWidth:0}}>
    <iframe src={src} scrolling="no" style={{width:'100%',height:frameHeight,border:0,display:'block',overflow:'hidden'}} title={titulo}/>
  </div>;
}

// ──────────────────────────────────────────────────────────────────────────
// Skeletons
// ──────────────────────────────────────────────────────────────────────────
function SkeletonTable() {
  const ln = { background:'var(--bg-deep)', borderRadius:6 };
  return (
    <div>
      <div className="grid-4" style={{ marginBottom:24 }}>
        {[0,1,2,3].map(i => (
          <div key={i} className="card" style={{ height:90 }}>
            <div style={{ ...ln, width:80, height:9, marginBottom:10 }} />
            <div style={{ ...ln, width:60, height:24 }} />
          </div>
        ))}
      </div>
      <div className="card" style={{ height:240 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ display:'flex', gap:14, padding:'12px 0', borderBottom: i<4 ? '1px solid var(--line)' : 'none' }}>
            <div style={{ ...ln, width:48, height:14 }} />
            <div style={{ ...ln, flex:1, height:14 }} />
            <div style={{ ...ln, width:60, height:14 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// STUDENT-CONTACT-ADMIN-002: acción de contacto DINÁMICA por ÁREA y reutilizable.
// Abre WhatsApp SOLO si window.getContactoCampus devuelve un número real para el
// área pedida (academico / cobros / administracion / ventas); si no, muestra
// texto honesto (sin botón falso) o nada (hideWhenPending). NUNCA números quemados.
const _AN_CONTACTO_LABEL = {
  cobros:         'Contactar cobros',
  academico:      'Contactar área académica',
  administracion: 'Contactar administración',
  ventas:         'Contactar asesor',
};
const _AN_CONTACTO_PENDING = {
  cobros:         'Contacto de cobros pendiente de configurar.',
  academico:      'Contacto académico pendiente de configurar.',
  administracion: 'Contacto administrativo pendiente de configurar.',
  ventas:         'Contacto de ventas pendiente de configurar.',
};
function ContactoAdmin({ est, usr, tipo = 'administracion', label, pendingText, hideWhenPending = false, size = 12 }) {
  const fn = window.getContactoCampus || window.getContactoAdministracion;
  const sesion = usr || (window.getSesion ? window.getSesion() : null);
  const c = (typeof fn === 'function') ? fn(est, sesion, tipo) : { disponible: false };
  const lbl  = label || _AN_CONTACTO_LABEL[tipo] || _AN_CONTACTO_LABEL.administracion;
  const pend = pendingText != null ? pendingText
    : (_AN_CONTACTO_PENDING[tipo] || _AN_CONTACTO_PENDING.administracion);
  if (c.disponible && c.whatsappUrl) {
    return (
      <a className="btn btn-ghost" href={c.whatsappUrl} target="_blank" rel="noopener"
         style={{ fontSize:size }}>
        {lbl}{c.nombre ? ` · ${c.nombre}` : ''}
      </a>
    );
  }
  if (hideWhenPending) return null;
  return <span style={{ fontSize:size, color:'var(--ink-3)', fontWeight:600 }}>{pend}</span>;
}

function SkeletonGrid() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12 }}>
      {[0,1,2,3].map(i => (
        <div key={i} className="card" style={{ height:160 }}>
          <div style={{ background:'var(--bg-deep)', height:18, width:'60%', borderRadius:4, marginBottom:8 }} />
          <div style={{ background:'var(--bg-deep)', height:14, width:'80%', borderRadius:4 }} />
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  PageHeader, ContactoAdmin,
  NotasView, TareasView, MensajesView, PagosView,
  CertificadosView, PerfilView, ExamenOralView,
  estaDesbloqueada, LeccionLocked,
  MaterialesViewLegacy,
});
