/* global React, Icon, PageHeader, EmptyState, ErrorState, useUsuario, deriveStudentAccess */
// CALGRUPO_F37_20260617_PORTAL_ESTUDIANTE_COMPLETO
// Portal del estudiante completo: vista ejecutiva con datos reales del backend.
// No inventa pagos/notas/exámenes: consume getPortalEstudianteCompleto y deja
// fallback honesto si el endpoint aún no está instalado.

const SCRIPT_URL_SP = window.APPS_SCRIPT_URL;

async function postStudentPortal(fn, payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const res = await fetch(`${SCRIPT_URL_SP}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...payload }),
  });
  return await res.json();
}

const NIVEL_NOMBRE_SP = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
const NIVEL_LIBRO_SP  = { B1:'Interchange Intro', B2:'Interchange 1', I1:'Interchange 2', I2:'Interchange 3' };
const NIVEL_COLOR_SP  = { B1:'#E5A823', B2:'#E8372A', I1:'#2B7FC1', I2:'#4CAF50' };
const ORDEN_NIVELES_SP = ['B1','B2','I1','I2'];

function _spNum(v) {
  if (v === '' || v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function _spMaybeNum(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function _spMoney(n) {
  const v = _spMaybeNum(n);
  return v == null ? '—' : '₡' + v.toLocaleString('es-CR');
}
function _spText(v, fallback = '—') {
  const s = String(v == null ? '' : v).trim();
  return s || fallback;
}
function _spNombre(nombre) {
  const s = String(nombre || '').trim();
  if (!s) return 'Estudiante';
  return s.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}
function _spEstatusNivel(niveles, nivel) {
  const v = niveles?.[nivel];
  return String((v && typeof v === 'object' ? (v.estatus || v.ESTATUS) : v) || '').toUpperCase();
}
function _spNotaNivel(niveles, nivel) {
  const v = niveles?.[nivel];
  if (v && typeof v === 'object') return _spMaybeNum(v.nota ?? v.NOTA);
  return null;
}
function _spNivelActivo(niveles, fallback) {
  return ORDEN_NIVELES_SP.find(n => _spEstatusNivel(niveles, n) === 'CA')
    || [...ORDEN_NIVELES_SP].reverse().find(n => ['APR','CNV'].includes(_spEstatusNivel(niveles, n)))
    || fallback || '';
}
function _spInferNivel(grupo) {
  const s = String(grupo || '').toUpperCase();
  if (s.includes('B1')) return 'B1';
  if (s.includes('B2')) return 'B2';
  if (s.includes('I1')) return 'I1';
  if (s.includes('I2')) return 'I2';
  return '';
}
function _spFecha(iso) {
  if (!iso) return '—';
  const raw = String(iso || '').slice(0,10);
  const d = new Date(raw + 'T00:00:00');
  if (isNaN(d)) return String(iso || '—');
  return d.toLocaleDateString('es-CR', { day:'2-digit', month:'short' });
}
function _spDias(iso) {
  if (!iso) return null;
  const d = new Date(String(iso).slice(0,10) + 'T00:00:00');
  if (isNaN(d)) return null;
  const h = new Date(); h.setHours(0,0,0,0);
  return Math.round((d - h) / 86400000);
}
function _spPctFromAsistencia(asistencia) {
  if (!asistencia) return null;
  const direct = _spMaybeNum(asistencia.porcentaje ?? asistencia.pct ?? asistencia.asistencia_pct);
  if (direct != null) return Math.max(0, Math.min(100, direct));
  const items = asistencia.asistencia || asistencia.items || asistencia.registros || [];
  if (!Array.isArray(items) || !items.length) return null;
  const pres = items.filter(a => {
    const e = String(a.estado || a.status || a.presente || '').toUpperCase();
    return a.presente === true || e === 'P' || e === 'PRESENTE' || e === 'TRUE' || e === 'SI';
  }).length;
  return Math.round((pres / items.length) * 100);
}
function _spPromEvaluaciones(evaluaciones) {
  const arr = Array.isArray(evaluaciones) ? evaluaciones : [];
  const nums = arr.map(e => _spMaybeNum(e.nota ?? e.NOTA ?? e.puntaje ?? e.PUNTAJE)).filter(n => n != null);
  if (!nums.length) return null;
  return Math.round((nums.reduce((a,b)=>a+b,0) / nums.length) * 10) / 10;
}
function _spOrdenLecciones(lecciones) {
  const arr = Array.isArray(lecciones) ? [...lecciones] : [];
  return arr.sort((a,b) => String(a.fecha || a.FECHA || '').localeCompare(String(b.fecha || b.FECHA || '')));
}

function usePortalEstudianteData(codigo) {
  const [state, setState] = React.useState({ loading:true, data:null, error:'' });
  const cargar = React.useCallback(() => {
    if (!codigo) { setState({ loading:false, data:null, error:'Sin código de estudiante en sesión.' }); return; }
    let cancel = false;
    setState(s => ({ ...s, loading:true, error:'' }));
    postStudentPortal('getPortalEstudianteCompleto', { codigo })
      .then(async d => {
        if (cancel) return;
        if (d?.ok) { setState({ loading:false, data:d, error:'' }); return; }
        // Fallback honesto para cuando el Apps Script F37 todavía no está instalado.
        const base = await postStudentPortal('getEstudiante', { codigo }).catch(() => null);
        if (cancel) return;
        if (base?.ok) setState({ loading:false, data:{ ok:true, modo:'fallback_frontend', ...base }, error:'' });
        else setState({ loading:false, data:null, error:d?.error || base?.error || 'No se pudo cargar el portal.' });
      })
      .catch(() => { if (!cancel) setState({ loading:false, data:null, error:'Error de conexión con el servidor.' }); });
    return () => { cancel = true; };
  }, [codigo]);

  React.useEffect(() => cargar(), [cargar]);
  return { ...state, reload:cargar };
}

function StudentPortalView({ toast, onNavigate }) {
  const usr = useUsuario ? useUsuario() : null;
  const codigo = usr?.codigo || usr?.cedula || '';
  const go = (id) => { if (onNavigate) onNavigate(id); };
  const { data, loading, error, reload } = usePortalEstudianteData(codigo);

  if (!usr) {
    return (
      <div data-screen-label="Estudiante · Mi Campus">
        <PageHeader kicker="Mi Campus" title={<>Portal <em>estudiante</em></>} sub="Ingresá con tu usuario para ver tu información académica." />
        <EmptyState icon="👤" title="No hay sesión activa" subtitle="Volvé a iniciar sesión para cargar tu portal." />
      </div>
    );
  }
  if (loading && !data) {
    return <StudentPortalSkeleton />;
  }
  if (error && !data) {
    return (
      <div data-screen-label="Estudiante · Mi Campus">
        <PageHeader kicker="Mi Campus" title={<>Portal <em>estudiante</em></>} sub="Resumen académico, financiero y operativo." />
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  const est = data?.estudiante || data?.base?.estudiante || {};
  const grupo = data?.grupo || data?.base?.grupo || {};
  const niveles = data?.niveles || data?.base?.niveles || {};
  const pendientes = data?.pendientes || data?.base?.pendientes || {};
  const evaluaciones = data?.evaluaciones || [];
  const notasOficiales = data?.notas_oficiales || null;
  const asistencia = data?.asistencia || null;
  const conape = data?.conape || null;
  const examenes = data?.examenes || null;
  const lecciones = _spOrdenLecciones(data?.lecciones || []);
  const ican = data?.ican || null;

  const codGrupo = data?.cod_grupo || grupo.CODIGO_GRUPO || est.GRUPO || usr?.grupo || usr?.grupoActivo || '';
  const nivel = data?.nivel_activo || _spNivelActivo(niveles, usr?.nivel_activo) || _spInferNivel(codGrupo);
  const programa = data?.programa || grupo.PROGRAMA || usr?.programa || 'SIN_INA';
  const nombre = _spNombre(est.NOMBRE || est.nombre || usr?.nombre);
  const cedula = est.CEDULA || est.NUM_CEDULA || usr?.cedula || '';
  const asistenciaPct = _spPctFromAsistencia(asistencia);
  const notaFinal = _spMaybeNum(notasOficiales?.nota_total ?? notasOficiales?.calculada ?? _spNotaNivel(niveles, nivel));
  const promedioEval = _spPromEvaluaciones(evaluaciones);
  const saldoPendiente = _spNum(pendientes.matricula) + _spNum(pendientes.cuotas_pendiente ?? pendientes.cuotas_pendientes) + _spNum(pendientes.certificado);
  const certificadoDisponible = ORDEN_NIVELES_SP.filter(n => ['APR','CNV'].includes(_spEstatusNivel(niveles, n))).length;
  const proximas = lecciones.filter(l => {
    const dias = _spDias(l.fecha || l.FECHA);
    return dias == null || dias >= -1;
  }).slice(0, 6);
  const proxima = proximas[0] || null;
  const examenDisponible = !!(examenes?.disponible || examenes?.available || examenes?.assignment || examenes?.asignacion || examenes?.exam);
  const acceso = (typeof deriveStudentAccess === 'function')
    ? deriveStudentAccess({ estudiante:est, grupo, niveles, pendientes }, { nivel })
    : null;

  const acciones = construirAccionesPortal({ saldoPendiente, examenDisponible, notaFinal, asistenciaPct, certificadoDisponible, conape, nivel, proxima });

  return (
    <div data-screen-label="Estudiante · Mi Campus" style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
        <div>
          <div className="hero-kicker" style={{ marginBottom:8 }}>Mi Campus</div>
          <h1 style={{ fontFamily:'var(--f-serif)', fontSize:42, fontWeight:400, letterSpacing:'-0.04em', lineHeight:1.02, margin:0, color:'var(--an-navy-ink)' }}>
            Hola, <em>{nombre.split(' ')[0] || 'estudiante'}</em>
          </h1>
          <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:7 }}>
            Código <strong>{codigo || '—'}</strong> · Cédula {cedula || '—'} · Grupo {codGrupo || '—'}
          </div>
        </div>
        <button className="btn btn-ghost" type="button" onClick={reload} style={{ padding:'9px 14px' }}>
          Actualizar portal
        </button>
      </div>

      <PortalHero
        nivel={nivel}
        programa={programa}
        grupo={codGrupo}
        acceso={acceso}
        proxima={proxima}
        saldoPendiente={saldoPendiente}
        examenDisponible={examenDisponible}
        onNavigate={go}
      />

      <ReposicionStudentCardF92 onNavigate={go} />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(150px, 1fr))', gap:12 }}>
        <PortalMetric label="Asistencia" value={asistenciaPct != null ? `${asistenciaPct}%` : '—'} tone={asistenciaPct == null ? 'neutral' : asistenciaPct >= 70 ? 'ok' : 'warn'} sub={asistenciaPct == null ? 'Sin registro completo' : asistenciaPct >= 70 ? 'En regla' : 'Revisar'} />
        <PortalMetric label="Nota oficial" value={notaFinal != null ? `${notaFinal}` : '—'} tone={notaFinal == null ? 'neutral' : notaFinal >= 70 ? 'ok' : 'warn'} sub={notaFinal != null ? '/100' : (promedioEval != null ? `Prom. eval. ${promedioEval}` : 'Sin nota final')} />
        <PortalMetric label="Estado de cuenta" value={saldoPendiente > 0 ? _spMoney(saldoPendiente) : 'Al día'} tone={saldoPendiente > 0 ? 'warn' : 'ok'} sub={saldoPendiente > 0 ? 'Pendiente' : 'Sin saldo visible'} />
        <PortalMetric label="Certificados" value={String(certificadoDisponible)} tone={certificadoDisponible ? 'ok' : 'neutral'} sub={certificadoDisponible ? 'Disponible(s)' : 'Aún no disponible'} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.35fr 0.85fr', gap:16, alignItems:'start' }}>
        <PortalPanel title="Ruta académica" subtitle="Progreso por nivel y nota registrada">
          <NivelesPortal niveles={niveles} nivelActivo={nivel} />
        </PortalPanel>

        <PortalPanel title="Acciones recomendadas" subtitle="Qué conviene revisar primero">
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {acciones.length === 0 ? (
              <div style={{ padding:'18px', borderRadius:14, background:'color-mix(in srgb, var(--ok) 8%, transparent)', color:'var(--ok)', fontSize:13, fontWeight:700 }}>
                Todo se ve estable por ahora.
              </div>
            ) : acciones.map((a, i) => (
              <button key={i} type="button" onClick={() => go(a.view)} style={{
                border:'1px solid var(--line)', background:'var(--surface)', borderRadius:14, padding:'12px 13px', textAlign:'left', cursor:'pointer', fontFamily:'inherit', display:'grid', gridTemplateColumns:'auto 1fr', gap:10, alignItems:'start'
              }}>
                <span style={{ width:28, height:28, borderRadius:10, display:'grid', placeItems:'center', background:a.bg, color:a.color, fontWeight:900 }}>{a.icon}</span>
                <span>
                  <span style={{ display:'block', fontSize:13, fontWeight:800, color:'var(--ink)' }}>{a.title}</span>
                  <span style={{ display:'block', fontSize:11.5, color:'var(--ink-3)', lineHeight:1.35, marginTop:2 }}>{a.sub}</span>
                </span>
              </button>
            ))}
          </div>
        </PortalPanel>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'start' }}>
        <PortalPanel title="Próximas lecciones" subtitle="Cronograma del grupo activo">
          <ProximasLeccionesPortal lecciones={proximas} onNavigate={go} />
        </PortalPanel>

        <PortalPanel title="Resumen administrativo" subtitle="Cuenta, CONAPE, examen y Club I CAN">
          <ResumenAdminPortal
            pendientes={pendientes}
            conape={conape}
            examenes={examenes}
            ican={ican}
            programa={programa}
            examenDisponible={examenDisponible}
            onNavigate={go}
          />
        </PortalPanel>
      </div>

      <PortalPanel title="Accesos rápidos" subtitle="Entradas principales del campus">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(155px, 1fr))', gap:10 }}>
          <QuickPortal label="Cronograma" icon="📅" view="cronograma_grupo" go={go} />
          <QuickPortal label="Exámenes" icon="📝" view="examenes" go={go} highlight={examenDisponible} />
          <QuickPortal label="Mis notas" icon="📊" view="notas" go={go} />
          <QuickPortal label="Pagos" icon="💳" view="pagos" go={go} highlight={saldoPendiente > 0} />
          <QuickPortal label="Materiales" icon="📚" view="materiales" go={go} />
          <QuickPortal label="Certificados" icon="🏅" view="certificados" go={go} highlight={certificadoDisponible > 0} />
        </div>
      </PortalPanel>
    </div>
  );
}

function construirAccionesPortal({ saldoPendiente, examenDisponible, notaFinal, asistenciaPct, certificadoDisponible, conape, proxima }) {
  const out = [];
  if (examenDisponible) out.push({ icon:'!', title:'Tenés un examen disponible', sub:'Entrá a Exámenes para iniciar o continuar tu intento oficial.', view:'examenes', bg:'color-mix(in srgb, var(--an-granate) 12%, transparent)', color:'var(--an-granate)' });
  if (proxima && [18,32].includes(Number(proxima.leccion_num || proxima.LECCION_NUM))) out.push({ icon:'E', title:'Examen cercano por cronograma', sub:`La lección ${proxima.leccion_num || proxima.LECCION_NUM} está próxima. Revisá tu cronograma y avisos.`, view:'cronograma_grupo', bg:'color-mix(in srgb, var(--warn) 14%, transparent)', color:'var(--warn)' });
  if (saldoPendiente > 0) out.push({ icon:'₡', title:'Revisar estado de cuenta', sub:`Hay ${_spMoney(saldoPendiente)} pendiente visible en el sistema.`, view:'pagos', bg:'color-mix(in srgb, var(--warn) 14%, transparent)', color:'var(--warn)' });
  if (asistenciaPct != null && asistenciaPct < 70) out.push({ icon:'A', title:'Asistencia bajo mínimo', sub:'La asistencia visible está por debajo del 70%. Revisá tus clases registradas.', view:'cronograma_grupo', bg:'color-mix(in srgb, var(--danger) 10%, transparent)', color:'var(--danger)' });
  if (notaFinal != null && notaFinal < 70) out.push({ icon:'N', title:'Nota en observación', sub:'Tu nota final visible está por debajo de aprobación. Revisá evaluaciones y apoyo académico.', view:'notas', bg:'color-mix(in srgb, var(--danger) 10%, transparent)', color:'var(--danger)' });
  if (certificadoDisponible > 0) out.push({ icon:'🏅', title:'Certificado disponible', sub:'Tenés al menos un nivel aprobado/convalidado. Revisá Certificaciones.', view:'certificados', bg:'color-mix(in srgb, var(--ok) 10%, transparent)', color:'var(--ok)' });
  if (conape?.ok && conape.estado && !/APROB|DESEMBOLS|ACTIVO/i.test(String(conape.estado))) out.push({ icon:'C', title:'Seguimiento CONAPE', sub:'Tu estado CONAPE puede requerir revisión o actualización.', view:'pagos', bg:'color-mix(in srgb, var(--an-navy) 10%, transparent)', color:'var(--an-navy)' });
  return out.slice(0, 5);
}

function PortalHero({ nivel, programa, grupo, acceso, proxima, saldoPendiente, examenDisponible, onNavigate }) {
  const nivelColor = NIVEL_COLOR_SP[nivel] || 'var(--an-granate)';
  const estado = acceso?.label || (saldoPendiente > 0 ? 'Revisar cuenta' : 'Activo');
  const msg = acceso?.mensaje || (examenDisponible ? 'Tenés examen disponible según el cronograma.' : 'Revisá tu próxima clase y mantente al día.');
  return (
    <div style={{
      border:'1px solid var(--line)', borderRadius:24, overflow:'hidden', background:'linear-gradient(135deg, #fff 0%, #FBF8F2 52%, color-mix(in srgb, var(--an-navy) 8%, white) 100%)', boxShadow:'var(--sh-1)'
    }}>
      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:0 }}>
        <div style={{ padding:24 }}>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:14 }}>
            <span style={{ padding:'5px 10px', borderRadius:999, background:nivelColor, color:'#fff', fontSize:11, fontWeight:900, letterSpacing:'0.08em' }}>{nivel || '—'}</span>
            <span style={{ padding:'5px 10px', borderRadius:999, background:'rgba(255,255,255,.75)', border:'1px solid var(--line)', color:'var(--ink-2)', fontSize:11, fontWeight:800 }}>{NIVEL_NOMBRE_SP[nivel] || 'Nivel por definir'}</span>
            <span style={{ padding:'5px 10px', borderRadius:999, background:'rgba(255,255,255,.75)', border:'1px solid var(--line)', color:'var(--ink-2)', fontSize:11, fontWeight:800 }}>{programa || 'SIN_INA'}</span>
          </div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:32, fontWeight:500, letterSpacing:'-0.035em', color:'var(--an-navy-ink)', lineHeight:1.05 }}>
            {estado}
          </div>
          <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:8, lineHeight:1.55, maxWidth:680 }}>{msg}</div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:18 }}>
            <button className="btn btn-primary" type="button" onClick={() => onNavigate('cronograma_grupo')}>Ver cronograma</button>
            <button className="btn btn-ghost" type="button" onClick={() => onNavigate(examenDisponible ? 'examenes' : 'notas')}>{examenDisponible ? 'Ir a examen' : 'Ver notas'}</button>
          </div>
        </div>
        <div style={{ borderLeft:'1px solid var(--line)', padding:22, background:'rgba(255,255,255,.48)', display:'flex', flexDirection:'column', justifyContent:'center', gap:12 }}>
          <MiniHeroLine label="Grupo" value={grupo || '—'} />
          <MiniHeroLine label="Libro" value={NIVEL_LIBRO_SP[nivel] || '—'} />
          <MiniHeroLine label="Próxima clase" value={proxima ? `L${proxima.leccion_num || proxima.LECCION_NUM || '—'} · ${_spFecha(proxima.fecha || proxima.FECHA)}` : 'Sin publicación'} />
          <MiniHeroLine label="Cuenta" value={saldoPendiente > 0 ? _spMoney(saldoPendiente) : 'Al día'} />
        </div>
      </div>
    </div>
  );
}
function MiniHeroLine({ label, value }) {
  return <div><div style={{ fontSize:10.5, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.14em', color:'var(--ink-3)' }}>{label}</div><div style={{ fontSize:15, fontWeight:800, color:'var(--an-navy-ink)', marginTop:2 }}>{value}</div></div>;
}
function PortalMetric({ label, value, sub, tone }) {
  const color = tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn)' : tone === 'danger' ? 'var(--danger)' : 'var(--an-navy)';
  return (
    <div style={{ border:'1px solid var(--line)', borderRadius:18, background:'var(--surface)', padding:16, boxShadow:'var(--sh-1)' }}>
      <div style={{ fontSize:10.5, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.13em', color:'var(--ink-3)' }}>{label}</div>
      <div style={{ fontFamily:'var(--f-serif)', fontSize:28, fontWeight:600, color, lineHeight:1, marginTop:8 }}>{value}</div>
      <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:6 }}>{sub}</div>
    </div>
  );
}
function PortalPanel({ title, subtitle, children }) {
  return (
    <section style={{ border:'1px solid var(--line)', borderRadius:20, background:'var(--surface)', boxShadow:'var(--sh-1)', overflow:'hidden' }}>
      <div style={{ padding:'15px 18px', borderBottom:'1px solid var(--line)' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--an-navy-ink)' }}>{title}</div>
        {subtitle && <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:2 }}>{subtitle}</div>}
      </div>
      <div style={{ padding:16 }}>{children}</div>
    </section>
  );
}
function NivelesPortal({ niveles, nivelActivo }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
      {ORDEN_NIVELES_SP.map(n => {
        const est = _spEstatusNivel(niveles, n) || 'PE';
        const nota = _spNotaNivel(niveles, n);
        const active = n === nivelActivo;
        const color = NIVEL_COLOR_SP[n];
        const pct = est === 'APR' || est === 'CNV' ? 100 : est === 'CA' ? 55 : 8;
        return (
          <div key={n} style={{ border:`1px solid ${active ? color : 'var(--line)'}`, borderRadius:16, padding:14, background: active ? `color-mix(in srgb, ${color} 8%, white)` : '#fff' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
              <strong style={{ color, fontSize:15 }}>{n}</strong>
              <span style={{ fontSize:10, fontWeight:900, color: est === 'APR' || est === 'CNV' ? 'var(--ok)' : est === 'CA' ? 'var(--an-navy)' : 'var(--ink-3)' }}>{est}</span>
            </div>
            <div style={{ fontSize:11.5, color:'var(--ink-3)', marginTop:4 }}>{NIVEL_NOMBRE_SP[n]}</div>
            <div style={{ height:7, borderRadius:999, background:'var(--line)', overflow:'hidden', marginTop:12 }}>
              <div style={{ width:`${pct}%`, height:'100%', background:color }} />
            </div>
            <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:8 }}>Nota: <strong>{nota != null ? nota : '—'}</strong></div>
          </div>
        );
      })}
    </div>
  );
}
function ProximasLeccionesPortal({ lecciones, onNavigate }) {
  if (!lecciones || !lecciones.length) return <div style={{ padding:18, textAlign:'center', color:'var(--ink-3)', fontSize:13 }}>Aún no hay próximas lecciones publicadas para este grupo.</div>;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
      {lecciones.map((l, i) => {
        const num = Number(l.leccion_num || l.LECCION_NUM || l.num || 0);
        const esExamen = num === 18 || num === 32;
        return (
          <button key={i} type="button" onClick={() => onNavigate('cronograma_grupo')} style={{
            border:'1px solid var(--line)', background: esExamen ? 'color-mix(in srgb, var(--an-gold) 10%, white)' : '#fff', borderRadius:14, padding:'11px 12px', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:10, alignItems:'center', textAlign:'left', cursor:'pointer', fontFamily:'inherit'
          }}>
            <span style={{ width:38, height:38, borderRadius:12, display:'grid', placeItems:'center', background: esExamen ? 'var(--an-gold)' : 'var(--an-navy)', color:'#fff', fontWeight:900 }}>{num || '—'}</span>
            <span>
              <span style={{ display:'block', fontWeight:800, fontSize:13, color:'var(--ink)' }}>{l.titulo || l.TITULO || l.tema || l.TEMA || `Lección ${num || '—'}`}</span>
              <span style={{ display:'block', fontSize:11.5, color:'var(--ink-3)', marginTop:2 }}>{_spFecha(l.fecha || l.FECHA)}{l.hora ? ` · ${l.hora}` : ''}</span>
            </span>
            {esExamen && <span style={{ fontSize:10, fontWeight:900, color:'var(--an-granate)', textTransform:'uppercase' }}>Examen</span>}
          </button>
        );
      })}
    </div>
  );
}
function ResumenAdminPortal({ pendientes, conape, examenes, ican, programa, examenDisponible, onNavigate }) {
  const saldo = _spNum(pendientes.matricula) + _spNum(pendientes.cuotas_pendiente ?? pendientes.cuotas_pendientes) + _spNum(pendientes.certificado);
  const esINA = /INA/i.test(String(programa || ''));
  const rows = [
    ['Estado de cuenta', saldo > 0 ? _spMoney(saldo) : 'Al día', saldo > 0 ? 'warn' : 'ok', 'pagos'],
    ['Exámenes', examenDisponible ? 'Disponible' : 'Sin examen abierto', examenDisponible ? 'warn' : 'neutral', 'examenes'],
    ['CONAPE', conape?.ok ? (conape.estado || conape.status || 'Con registro') : 'Sin registro visible', conape?.ok ? 'neutral' : 'neutral', 'pagos'],
    ['Club I CAN', esINA ? (ican?.ok ? 'Registro visible' : 'Sin lectura') : 'No aplica', esINA ? 'neutral' : 'neutral', 'ican'],
  ];
  return <div style={{ display:'flex', flexDirection:'column', gap:9 }}>{rows.map((r,i)=><ResumenRow key={i} label={r[0]} value={r[1]} tone={r[2]} onClick={() => onNavigate(r[3])} />)}</div>;
}
function ResumenRow({ label, value, tone, onClick }) {
  const color = tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn)' : 'var(--ink-2)';
  return <button type="button" onClick={onClick} style={{ border:'1px solid var(--line)', background:'#fff', borderRadius:13, padding:'11px 12px', display:'flex', justifyContent:'space-between', gap:12, cursor:'pointer', fontFamily:'inherit' }}><span style={{ fontSize:12.5, color:'var(--ink-3)' }}>{label}</span><strong style={{ fontSize:12.5, color }}>{value}</strong></button>;
}
function QuickPortal({ label, icon, view, go, highlight }) {
  return <button type="button" onClick={() => go(view)} style={{ border:`1px solid ${highlight ? 'var(--an-gold)' : 'var(--line)'}`, background: highlight ? 'color-mix(in srgb, var(--an-gold) 9%, white)' : '#fff', borderRadius:15, padding:'13px 12px', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:10 }}><span style={{ fontSize:21 }}>{icon}</span><span style={{ fontSize:13, fontWeight:800, color:'var(--ink)' }}>{label}</span></button>;
}
function StudentPortalSkeleton() {
  return (
    <div data-screen-label="Estudiante · Mi Campus" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <PageHeader kicker="Mi Campus" title={<>Portal <em>estudiante</em></>} sub="Cargando tu información…" />
      {[1,2,3].map(i => <div key={i} style={{ height:i===1?190:120, borderRadius:20, background:'linear-gradient(90deg, #eee 0%, #f7f4ee 50%, #eee 100%)', border:'1px solid var(--line)' }} />)}
    </div>
  );
}
