/* global React, Icon, Chip, PageHeader */
// NOTE: ADMIN_GROUPS fue eliminado de data.jsx. Estos arrays están en [] como
// fallback temporal hasta cablear el hook useAdminDashboard() de admin_views.jsx.

// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL_MAT = window.APPS_SCRIPT_URL;

// Modo demo (preview sin backend): ?demo=1 o ?preview=… → lista de prospectos
// de ejemplo para poder demostrar el indicador 💵 de pagos reportados (Fase 3.5).
// En producción (sin flag) NO se usa: la lista viene del Apps Script.
const MAT_DEMO = (() => {
  try { const q = new URLSearchParams(location.search); return q.get('demo') === '1' || !!q.get('preview'); }
  catch (_) { return false; }
})();
const DEMO_PROSPECTOS_MAT = [
  // Activada (código presente) → Ver formulario + Ver ficha. Tiene pago pendiente (badge 💵).
  { CEDULA: '120180140', NOMBRE: 'RODRIGUEZ PALACIOS DEBORA', GRUPO_TENTATIVO: 'B1-LM18-C3-0726', PROGRAMA: 'INA', ESTADO: 'PENDIENTE_PAGO', ETAPA: 'PAGO_ACADEMIA', TIMESTAMP: '2026-06-04', ASESOR_REF: 'Fiorella Salazar', CODIGO_ESTUDIANTE: '17193', FINANCIAMIENTO: 'PROPIO',
    CORREO: 'debora.rp@gmail.com', WHATSAPP: '8888-8888', TELEFONO: '8888-8888', SEXO: 'F', FECHA_NAC: '2003-02-11', PROVINCIA: 'San José', CANTON: 'Desamparados', MODALIDAD: 'INTENSIVO', BECA: '', ES_MENOR: false },
  // CONAPE en LEAD → Ver formulario + Crear proforma + Actualizar CONAPE + Generar matrícula.
  { CEDULA: '116880490', NOMBRE: 'CAMPOS UREÑA JOSUÉ', GRUPO_TENTATIVO: 'B1-LM18-C3-0726', PROGRAMA: 'INA', ESTADO: 'PENDIENTE_CONAPE', ETAPA: 'CONAPE_SOLICITUD', TIMESTAMP: '2026-05-21', ASESOR_REF: 'Fiorella Salazar', CODIGO_ESTUDIANTE: '', FINANCIAMIENTO: 'CONAPE',
    CORREO: 'josue.campos@outlook.com', WHATSAPP: '6045-1120', MODALIDAD: 'INTENSIVO', CONAPE_EQUIPO: 'BASICO' },
  // CONAPE más avanzado (documentos) → ya NO muestra Crear proforma. Sí Actualizar CONAPE + Generar matrícula.
  { CEDULA: '118420567', NOMBRE: 'JIMÉNEZ ROJAS MARÍA FERNANDA', GRUPO_TENTATIVO: 'B1-KJ18-C3-0826', PROGRAMA: 'INA', ESTADO: 'PENDIENTE_CONAPE', ETAPA: 'CONAPE_DOCUMENTOS', TIMESTAMP: '2026-05-02', ASESOR_REF: 'Fiorella Salazar', CODIGO_ESTUDIANTE: '', FINANCIAMIENTO: 'CONAPE',
    CORREO: 'mafer.jimenez@gmail.com', WHATSAPP: '8845-2210', MODALIDAD: 'SUPER_INTENSIVO', CONAPE_EQUIPO: 'PREMIUM' },
  // LEAD propio → Ver formulario + Generar matrícula (nada de CONAPE ni proforma).
  { CEDULA: '118100588', NOMBRE: 'GUTIÉRREZ LEÓN SOFÍA', GRUPO_TENTATIVO: '', PROGRAMA: 'SIN_INA', ESTADO: 'PENDIENTE_PAGO', ETAPA: 'LEAD', TIMESTAMP: '2026-06-03', ASESOR_REF: 'Roger Cruz', CODIGO_ESTUDIANTE: '', FINANCIAMIENTO: 'PROPIO',
    CORREO: 'sofia.gl@gmail.com', WHATSAPP: '8455-2098', MODALIDAD: 'INTENSIVO' },
  // BECA en LEAD → Ver formulario + Generar matrícula (beca no muestra proforma).
  { CEDULA: '120030099', NOMBRE: 'BRENES VEGA ALLISON', GRUPO_TENTATIVO: '', PROGRAMA: 'SIN_INA', ESTADO: 'PENDIENTE_PAGO', ETAPA: 'LEAD', TIMESTAMP: '2026-05-28', ASESOR_REF: 'Kimberly Guzmán', CODIGO_ESTUDIANTE: '', FINANCIAMIENTO: 'BECA',
    CORREO: 'allison.bv@gmail.com', WHATSAPP: '8677-1290', MODALIDAD: 'INTENSIVO', BECA: 'Beca 25%' },
  // CANCELADO (con auditoría) → solo Ver formulario, acciones deshabilitadas, badge rojo + detalle.
  { CEDULA: '118990156', NOMBRE: 'HERRERA BRENES PAOLA', GRUPO_TENTATIVO: '', PROGRAMA: 'SIN_INA', ESTADO: 'CANCELADO', ETAPA: 'CANCELADO', TIMESTAMP: '2026-04-30', ASESOR_REF: 'Fiorella Salazar', CODIGO_ESTUDIANTE: '', FINANCIAMIENTO: 'PROPIO',
    CORREO: 'paola.hb@gmail.com', WHATSAPP: '8290-1145', MODALIDAD: 'INTENSIVO',
    CANCELADO_POR: 'Fiorella Salazar', CANCELADO_FECHA: '2026-05-12', CANCELADO_MOTIVO: 'Desistió por motivos laborales. Reintentar el próximo cuatrimestre.' },
];

// ────────────────────────────────────────────────────────────────────────
// HOOK — Prospectos desde Apps Script
// ────────────────────────────────────────────────────────────────────────
function useProspectos() {
  const [prospectos, setProspectos] = React.useState([]);
  const [resumen, setResumen] = React.useState(null); // v4.30.1: desglose activos por nivel + comparativa
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (MAT_DEMO) { setProspectos(DEMO_PROSPECTOS_MAT); setResumen(null); setLoading(false); return; }
    if (MAT_DEMO) { setProspectos(DEMO_PROSPECTOS_MAT); setResumen(null); setLoading(false); return; }
    setLoading(true);
    // Fase 3.6 · Cambio 2 — decay del panel PRE MATRÍCULA: el backend filtra los
    // prospectos con matrícula B1 pagada antes del lunes de esta semana. Los
    // CANCELADOS siguen viniendo. El filtrado es 100% backend.
    fetch(`${SCRIPT_URL_MAT}?fn=getProspectos`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: 'getProspectos', decay_pre_matricula: true }),
    })
      .then(r => r.json())
      .then(d => { if (d.ok) { setProspectos(d.prospectos || []); setResumen(d.resumen || null); } else setError(d.error || d.mensaje || 'Error al cargar prospectos'); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tick]);
  return { prospectos, resumen, loading, error, reload: () => setTick(t => t + 1) };
}

// ─────────────────────────────────────────────────────────────────────────
// DATOS DE APOYO
// ─────────────────────────────────────────────────────────────────────────
const ESTUDIANTES_DB = [
  { cedula:'1-1801-0123', nombre:'SALAZAR CHACÓN SANTIAGO', correo:'santiago@example.com', tel:'+506 8888-1234', fechaNac:'2000-03-15', tipo:'nacional', edad:26 },
  { cedula:'1-0720-0456', nombre:'RODRÍGUEZ MORA ANA LUCÍA', correo:'ana@example.com', tel:'+506 8877-9901', fechaNac:'1995-07-22', tipo:'nacional', edad:30 },
  { cedula:'2-0540-1234', nombre:'CHEN VILLALOBOS MING', correo:'ming@example.com', tel:'+506 7711-0022', fechaNac:'1998-11-05', tipo:'nacional', edad:27 },
  { cedula:'155812340012', nombre:'OKONKWO ADEBAYO PAUL', correo:'paul@example.com', tel:'+506 6622-3344', fechaNac:'2001-01-20', tipo:'dimex', edad:25 },
];

const NIVEL_META_M = {
  b1:{ nombre:'Básico I', emoji:'🟡', color:'#E5A823' },
  b2:{ nombre:'Básico II', emoji:'🔴', color:'#E8372A' },
  i1:{ nombre:'Intermedio I', emoji:'🔵', color:'#2B7FC1' },
  i2:{ nombre:'Intermedio II', emoji:'🟢', color:'#4CAF50' },
};

const fmtMoney = (n) => '₡' + (n||0).toLocaleString('es-CR');
const fmtCR = (d) => d ? new Date(d).toLocaleDateString('es-CR',{day:'numeric',month:'short',year:'numeric'}) : '—';

function cedulaFormat(raw, tipo) {
  const d = raw.replace(/\D/g,'');
  if (tipo==='nacional') {
    if (d.length<=1) return d;
    if (d.length<=5) return `${d[0]}-${d.slice(1)}`;
    return `${d[0]}-${d.slice(1,5)}-${d.slice(5,9)}`;
  }
  return d.slice(0,12);
}

// ─────────────────────────────────────────────────────────────────────────
// ESTADO INICIAL DEL WIZARD
// ─────────────────────────────────────────────────────────────────────────
const initMatricula = (grupoPresel = null) => ({
  // Paso 1
  cedulaTipo: 'nacional',
  cedulaVal: '',
  estudianteEncontrado: null,
  esNuevo: false,
  // Datos nuevos
  nombreNuevo:'', correoNuevo:'', telNuevo:'', fechaNacNuevo:'',
  // Menor
  esMenor: false,
  repNombre:'', repCedula:'', repCorreo:'', repTel:'', repParentesco:'',
  // Paso 2
  grupoSelId: grupoPresel || '',
  // Paso 3
  nivelId: 'b1',
  tieneExamenUbicacion: false,
  resultadoExamen: '',
  // Paso 4
  financiamiento: 'propio', // propio | conape
  conapeExpediente: '',
  // Paso 5
  beca: 'none', becaCustomNombre:'', becaCustomPct:25,
  // Paso 6 – precios (desde el grupo)
  matriculaAmt: 50000, cuotaAmt: 85000, nCuotas: 4, certificadoAmt: 18000,
  toeic: false, toeicAmt: 136730, rubrosExtra: [],
  // Paso 7
  generarConstancia: true,
  generarProforma: true,
  enviarWhatsApp: true,
  confirmado: false,
});

// ─────────────────────────────────────────────────────────────────────────
// WIZARD PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
function WizardMatricula({ onClose, onCrear, grupoPresel = null }) {
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState(initMatricula(grupoPresel));
  const [errors, setErrors]   = React.useState({});
  const [guardando, setGuardando] = React.useState(false);
  const [errGuardar, setErrGuardar] = React.useState('');
  const [exitoRecibo, setExitoRecibo] = React.useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // v4.16: cargar grupos disponibles desde Apps Script
  const [grupos, setGrupos] = React.useState([]);
  const [cargandoGrupos, setCargandoGrupos] = React.useState(true);
  React.useEffect(() => {
    // (SCRIPT_URL_MAT se hereda del scope del módulo — fuente única window.APPS_SCRIPT_URL)
    fetch(`${SCRIPT_URL_MAT}?fn=getGruposDisponibles`)
      .then(r => r.json())
      .then(d => {
        if (d?.ok && Array.isArray(d.grupos)) {
          // Mapear al formato que espera MStep2
          setGrupos(d.grupos.map(g => ({
            code:     g.code,
            level:    g.nivel,
            schedule: g.schedule,
            docente:  g.docente,
            students: g.inscritos,
            cap:      g.capacidad,
            programa: g.programa,
            status:   g.cupoDisp > 0 ? 'activo' : 'lleno',
            precio_cuota:       g.precio_cuota       || 0,
            precio_matricula:   g.precio_matricula   || 0,
            precio_certificado: g.precio_certificado || 0,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setCargandoGrupos(false));
  }, []);

  const grupoSel = grupos.find(g => g.code === form.grupoSelId);
  const nivelMeta = NIVEL_META_M[form.nivelId] || NIVEL_META_M.b1;
  const accentColor = nivelMeta.color;

  // Resumen financiero
  const descuento = form.beca==='impacta' ? 0.25 : form.beca==='mujer' ? 0.50 : form.beca==='custom' ? form.becaCustomPct/100 : 0;
  const matFinal = Math.round(form.matriculaAmt * (1-descuento));
  const cuotasFinal = Math.round(form.cuotaAmt * form.nCuotas * (1-descuento));
  const totalNivel = matFinal + cuotasFinal;

  const STEPS = ['Identificación','Grupo','Nivel','Financiamiento','Beca','Proforma','Confirmar'];

  const validate = () => {
    const e = {};
    if (step===1) {
      if (!form.cedulaVal) e.cedula = 'Ingresa la cédula';
      else if (!form.estudianteEncontrado && !form.nombreNuevo) e.nombre = 'Ingresa el nombre';
      if (form.esMenor && !form.repNombre) e.repNombre = 'Nombre del representante requerido';
    }
    if (step===2 && !form.grupoSelId) e.grupo = 'Selecciona un grupo';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate() && step < 7) setStep(s=>s+1); };
  const prev = () => { if (step > 1) setStep(s=>s-1); };

  const confirmar = async () => {
    if (!form.confirmado || guardando) return;
    setGuardando(true);
    setErrGuardar('');
    try {
      const nivelMap = { b1:'B1', b2:'B2', i1:'I1', i2:'I2' };
      const codEstudiante = form.estudianteEncontrado?.rec_m || form.codigo || '';
      if (!codEstudiante) {
        // Estudiante nuevo — no tiene código en el sistema todavía
        // Mostrar aviso y no llamar al Script
        setExitoRecibo('PENDIENTE-NUEVO');
        setGuardando(false);
        return;
      }
      const res = await fetch(`${SCRIPT_URL_MAT}?fn=actualizarEstatus`, {
        method: 'POST',
        body: JSON.stringify({
          cod_estudiante: codEstudiante,
          nivel:   nivelMap[form.nivelId] || 'B1',
          estatus: 'CA',
          nota:    null,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErrGuardar(data.error || 'Error al guardar la matrícula');
        setGuardando(false);
        return;
      }
      const reciboNum = data.recibo || data.rowIndex || '—';
      setExitoRecibo(reciboNum);
      const est = form.estudianteEncontrado || { nombre: form.nombreNuevo };
      onCrear({ estudiante: est.nombre, grupo: form.grupoSelId });
    } catch(e) {
      setErrGuardar('Error de conexión: ' + e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(10,8,20,0.72)', zIndex:300,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{
        background:'var(--surface)', borderRadius:'var(--r-xl)',
        width:'100%', maxWidth:940, maxHeight:'91vh',
        display:'flex', flexDirection:'column',
        boxShadow:'0 24px 80px rgba(0,0,0,0.4)', overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding:'16px 26px', borderBottom:'1px solid var(--line)',
          display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0,
          background:`linear-gradient(135deg, color-mix(in srgb, ${accentColor} 7%, white) 0%, var(--surface) 100%)`,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:42, height:42, borderRadius:'var(--r-md)', background:accentColor, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
              {nivelMeta.emoji}
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3)' }}>
                Nueva matrícula · Paso {step} de 7
              </div>
              <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, color:'var(--an-navy-ink)', letterSpacing:'-0.02em' }}>
                {STEPS[step-1]}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:5 }}>
            {STEPS.map((_,i) => (
              <div key={i} style={{ width: i+1===step?26:9, height:9, borderRadius:5,
                background: i+1<step ? 'var(--ok)' : i+1===step ? accentColor : 'var(--line-2)',
                transition:'all .3s' }} />
            ))}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:24, color:'var(--ink-3)', cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ display:'grid', gridTemplateColumns:'196px 1fr', flex:1, overflow:'hidden' }}>
          {/* Sidebar pasos */}
          <div style={{ borderRight:'1px solid var(--line)', padding:'18px 10px', background:'var(--surface-2)', overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
            {STEPS.map((l,i) => (
              <div key={i} onClick={() => i+1<step && setStep(i+1)} style={{
                display:'flex', alignItems:'center', gap:9,
                padding:'9px 10px', borderRadius:'var(--r-md)',
                background: i+1===step ? `color-mix(in srgb, ${accentColor} 10%, white)` : 'transparent',
                border: i+1===step ? `1px solid ${accentColor}` : '1px solid transparent',
                cursor: i+1<step ? 'pointer' : 'default',
              }}>
                <div style={{
                  width:22, height:22, borderRadius:'50%', flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:10, fontWeight:700,
                  background: i+1<step ? 'var(--ok)' : i+1===step ? accentColor : 'var(--line-2)',
                  color: i+1<=step ? 'white' : 'var(--ink-3)',
                }}>
                  {i+1<step ? '✓' : i+1}
                </div>
                <div style={{ fontSize:12, fontWeight: i+1===step?700:500, color: i+1===step?'var(--ink)':'var(--ink-2)' }}>{l}</div>
              </div>
            ))}

            {/* Mini summary */}
            {step >= 3 && (
              <div style={{ marginTop:14, padding:10, background:'var(--surface)', borderRadius:'var(--r-md)', border:'1px solid var(--line)', fontSize:11, color:'var(--ink-2)' }}>
                {[
                  form.estudianteEncontrado?.nombre.split(' ').slice(0,2).join(' ') || form.nombreNuevo.split(' ')[0] || '—',
                  form.grupoSelId || '—',
                  `${nivelMeta.emoji} ${nivelMeta.nombre}`,
                  form.financiamiento==='conape' ? '🏦 CONAPE' : '💳 Pago propio',
                  form.beca !== 'none' ? `🎓 Beca` : null,
                ].filter(Boolean).map((v,i) => (
                  <div key={i} style={{ padding:'3px 0', borderBottom:'1px dashed var(--line)', marginBottom:2 }}>{v}</div>
                ))}
              </div>
            )}
          </div>

          {/* Main content */}
          <div style={{ overflowY:'auto', padding:'26px 32px' }}>
            {step===1 && <MStep1 form={form} set={set} errors={errors} accentColor={accentColor} />}
            {step===2 && <MStep2 form={form} set={set} errors={errors} accentColor={accentColor} grupoPresel={grupoPresel} grupos={grupos} cargandoGrupos={cargandoGrupos} />}
            {step===3 && <MStep3 form={form} set={set} errors={errors} accentColor={accentColor} nivelMeta={nivelMeta} />}
            {step===4 && <MStep4 form={form} set={set} errors={errors} accentColor={accentColor} />}
            {step===5 && <MStep5 form={form} set={set} errors={errors} accentColor={accentColor} nivelMeta={nivelMeta} />}
            {step===6 && <MStep6 form={form} set={set} errors={errors} accentColor={accentColor} nivelMeta={nivelMeta}
              descuento={descuento} matFinal={matFinal} cuotasFinal={cuotasFinal} totalNivel={totalNivel} />}
            {step===7 && <MStep7 form={form} set={set} accentColor={accentColor} nivelMeta={nivelMeta}
              descuento={descuento} matFinal={matFinal} cuotasFinal={cuotasFinal} totalNivel={totalNivel}
              grupoSel={grupoSel} onConfirm={() => set('confirmado', !form.confirmado)} />}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding:'14px 26px', borderTop:'1px solid var(--line)',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          background:'var(--surface-2)', flexShrink:0,
        }}>
          <button onClick={prev} disabled={step===1} className="btn btn-ghost">← Anterior</button>
          <div style={{ fontSize:11, color:'var(--ink-3)' }}>Paso {step} / 7</div>
          {step < 7
            ? <button onClick={next} className="btn btn-primary" style={{ background:accentColor, borderColor:accentColor, minWidth:130 }}>Siguiente →</button>
            : <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                {errGuardar && (
                  <div style={{ fontSize:11, color:'#C00000', fontWeight:600, maxWidth:300, textAlign:'right' }}>⚠ {errGuardar}</div>
                )}
                {exitoRecibo && (
                  <div style={{ fontSize:11, color: exitoRecibo==='PENDIENTE-NUEVO' ? 'var(--warn,#B45309)' : 'var(--ok)', fontWeight:700 }}>
                    {exitoRecibo === 'PENDIENTE-NUEVO'
                      ? '⚠ Matrícula registrada localmente. El estudiante es nuevo — agréguelo primero a APOLLO_G3 para activar la sincronización.'
                      : `✅ Matrícula registrada · Recibo #${exitoRecibo}`}
                  </div>
                )}
                <button onClick={exitoRecibo ? onClose : confirmar}
                  disabled={(!form.confirmado && !exitoRecibo) || guardando}
                  className="btn btn-primary"
                  style={{ background: exitoRecibo?'var(--ok)':'var(--an-granate)', borderColor: exitoRecibo?'var(--ok)':'var(--an-granate)', minWidth:170, opacity:(!form.confirmado&&!exitoRecibo)||guardando?0.4:1 }}>
                  {exitoRecibo ? 'Cerrar ✓' : guardando ? 'Guardando…' : 'MATRICULAR'}
                </button>
              </div>
          }
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 1 — Identificación del estudiante
// ─────────────────────────────────────────────────────────────────────────
function MStep1({ form, set, errors, accentColor }) {
  const buscar = () => {
    const found = ESTUDIANTES_DB.find(e => e.cedula.replace(/\D/g,'') === form.cedulaVal.replace(/\D/g,''));
    if (found) {
      set('estudianteEncontrado', found);
      set('esNuevo', false);
      set('esMenor', found.edad < 18);
    } else {
      set('estudianteEncontrado', null);
      set('esNuevo', true);
    }
  };

  const est = form.estudianteEncontrado;

  return (
    <div>
      <MSectionTitle color={accentColor}>Tipo de identificación</MSectionTitle>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['nacional','Cédula Nacional'],['dimex','DIMEX'],['pasaporte','Pasaporte']].map(([k,l]) => (
          <button key={k} onClick={() => { set('cedulaTipo',k); set('cedulaVal',''); set('estudianteEncontrado',null); set('esNuevo',false); }} style={{
            padding:'7px 14px', borderRadius:'var(--r-md)',
            border:`2px solid ${form.cedulaTipo===k ? accentColor : 'var(--line)'}`,
            background: form.cedulaTipo===k ? `color-mix(in srgb, ${accentColor} 10%, white)` : 'var(--surface)',
            fontWeight: form.cedulaTipo===k?700:500, fontSize:12, cursor:'pointer',
            color: form.cedulaTipo===k ? accentColor : 'var(--ink-2)',
          }}>{l}</button>
        ))}
      </div>

      <MSectionTitle color={accentColor} error={errors.cedula}>Número de identificación</MSectionTitle>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', background:'var(--surface)', border:`1px solid ${errors.cedula?'var(--danger)':'var(--line)'}`, borderRadius:'var(--r-md)', overflow:'hidden' }}>
          <span style={{ padding:'0 14px', color:'var(--ink-3)', fontSize:13, borderRight:'1px solid var(--line)', height:'100%', display:'flex', alignItems:'center' }}>
            {form.cedulaTipo==='nacional' ? '🪪' : form.cedulaTipo==='dimex' ? '🌍' : '🛂'}
          </span>
          <input
            value={form.cedulaVal}
            onChange={e => { set('cedulaVal', cedulaFormat(e.target.value, form.cedulaTipo)); set('estudianteEncontrado',null); set('esNuevo',false); }}
            onKeyDown={e => e.key==='Enter' && buscar()}
            placeholder={form.cedulaTipo==='nacional'?'1-2345-6789':form.cedulaTipo==='dimex'?'155812340012':'AB1234567'}
            style={{ flex:1, border:'none', outline:'none', padding:'12px 14px', fontFamily:'var(--f-mono)', fontSize:14, background:'transparent' }}
            autoFocus
          />
        </div>
        <button onClick={buscar} className="btn btn-primary" style={{ background:accentColor, borderColor:accentColor }}>Buscar</button>
      </div>

      {/* Resultado búsqueda */}
      {est && (
        <div style={{ padding:'16px 18px', background:'color-mix(in srgb, var(--ok) 6%, white)', border:'1px solid var(--ok)', borderRadius:'var(--r-lg)', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--ok)', color:'white', fontSize:18, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {est.nombre.split(' ').slice(0,2).map(w=>w[0]).join('')}
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ok)' }}>Estudiante encontrado en el sistema</div>
              <div style={{ fontFamily:'var(--f-serif)', fontSize:20, fontWeight:500, letterSpacing:'-0.01em', color:'var(--an-navy-ink)', marginTop:3 }}>{est.nombre}</div>
              <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:2 }}>{est.correo} · {est.tel} · Nació {fmtCR(est.fechaNac)}</div>
            </div>
          </div>
        </div>
      )}

      {form.esNuevo && (
        <div style={{ padding:'16px', background:'color-mix(in srgb, var(--an-gold) 8%, white)', border:'1px solid var(--an-gold)', borderRadius:'var(--r-md)', marginBottom:20 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#6B4A00', marginBottom:10 }}>
            Estudiante nuevo — ingresar datos
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <MInput label="Nombre completo (apellidos primero)" value={form.nombreNuevo} onChange={v=>set('nombreNuevo',v)} error={errors.nombre} placeholder="SALAZAR CHACÓN SANTIAGO" upper />
            <MInput label="Correo electrónico" value={form.correoNuevo} onChange={v=>set('correoNuevo',v)} placeholder="correo@ejemplo.com" />
            <MInput label="Teléfono" value={form.telNuevo} onChange={v=>set('telNuevo',v)} placeholder="+506 8888-1234" />
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>Fecha de nacimiento</div>
              <input type="date" value={form.fechaNacNuevo} onChange={e=>set('fechaNacNuevo',e.target.value)}
                style={{ width:'100%', padding:'10px 12px', border:'1px solid var(--line)', borderRadius:'var(--r-md)', fontFamily:'inherit' }} />
            </div>
          </div>
        </div>
      )}

      {/* Menor de edad */}
      {(est || form.esNuevo) && (
        <>
          <MSectionTitle color={accentColor}>¿El estudiante es menor de edad?</MSectionTitle>
          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginBottom: form.esMenor?16:0 }}>
            <MToggle value={form.esMenor} onChange={v=>set('esMenor',v)} color={accentColor} />
            <span style={{ fontSize:13, color:'var(--ink-2)' }}>Sí, menor de edad — requiere representante legal</span>
          </label>
          {form.esMenor && (
            <div style={{ padding:'14px', background:'var(--surface-2)', borderRadius:'var(--r-md)', border:'1px solid var(--line)', marginTop:10 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--an-granate)', marginBottom:10 }}>
                Datos del representante legal <span style={{ color:'var(--danger)', marginLeft:4 }}>*Obligatorio</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <MInput label="Nombre del representante" value={form.repNombre} onChange={v=>set('repNombre',v)} error={errors.repNombre} placeholder="CHACÓN MORA KARLA" upper />
                <MInput label="Cédula del representante" value={form.repCedula} onChange={v=>set('repCedula',v)} placeholder="1-2345-6789" mono />
                <MInput label="Correo del representante" value={form.repCorreo} onChange={v=>set('repCorreo',v)} placeholder="karla@example.com" />
                <MInput label="Teléfono" value={form.repTel} onChange={v=>set('repTel',v)} placeholder="+506 7777-8888" />
                <div style={{ gridColumn:'span 2' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>Parentesco</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {['Padre','Madre','Tutor legal','Abuelo/a','Otro'].map(p => (
                      <button key={p} onClick={() => set('repParentesco',p)} style={{
                        padding:'6px 12px', borderRadius:'var(--r-md)', cursor:'pointer', fontSize:12,
                        border:`1.5px solid ${form.repParentesco===p?accentColor:'var(--line)'}`,
                        background: form.repParentesco===p?`color-mix(in srgb, ${accentColor} 10%, white)`:'var(--surface)',
                        color: form.repParentesco===p?accentColor:'var(--ink-2)', fontWeight:form.repParentesco===p?700:400,
                      }}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop:10, padding:'8px 12px', background:'color-mix(in srgb, var(--info) 8%, white)', border:'1px solid color-mix(in srgb, var(--info) 30%, white)', borderRadius:8, fontSize:11, color:'var(--an-navy)' }}>
                ℹ️ El representante solo tendrá acceso de <strong>solo lectura</strong> al campus — podrá ver el progreso, asistencia y notas, pero no podrá publicar ni interactuar.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 2 — Grupo
// ─────────────────────────────────────────────────────────────────────────
function MStep2({ form, set, errors, accentColor, grupoPresel, grupos, cargandoGrupos }) {
  const gruposFiltrados = (grupos || []).filter(g => g.status !== 'lleno' || g.students < g.cap);

  return (
    <div>
      <MSectionTitle color={accentColor} error={errors.grupo}>Seleccionar grupo</MSectionTitle>
      {grupoPresel && (
        <div style={{ padding:'8px 12px', background:'color-mix(in srgb, var(--ok) 8%, white)', border:'1px solid var(--ok)', borderRadius:'var(--r-md)', fontSize:12, color:'var(--ok)', marginBottom:12 }}>
          ✓ Grupo preseleccionado: <strong>{grupoPresel}</strong> — podés cambiarlo si es necesario.
        </div>
      )}
      {cargandoGrupos && (
        <div style={{ padding:'24px', textAlign:'center', color:'var(--ink-3)', fontSize:13 }}>
          Cargando grupos disponibles…
        </div>
      )}
      {!cargandoGrupos && gruposFiltrados.length === 0 && (
        <div style={{ padding:'24px', textAlign:'center', color:'var(--ink-3)', fontSize:13 }}>
          No hay grupos disponibles en este momento. Contactá a la academia.
        </div>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {gruposFiltrados.map(g => {
          const pct = (g.students/g.cap)*100;
          const lleno = g.students >= g.cap;
          const sel = form.grupoSelId === g.code;
          const levelColor = g.level.includes('Básico I')?'#E5A823':g.level.includes('Básico II')?'#E8372A':g.level.includes('Intermedio I')?'#2B7FC1':'#4CAF50';
          return (
            <button key={g.code} onClick={() => {
              if (lleno) return;
              set('grupoSelId', g.code);
              // Autocompletar precios desde el grupo seleccionado
              if (g.precio_cuota)       set('cuota',      g.precio_cuota);
              if (g.precio_matricula)   set('matricula',  g.precio_matricula);
              if (g.precio_certificado) set('certificado', g.precio_certificado);
            }} disabled={lleno} style={{
              display:'grid', gridTemplateColumns:'auto 1fr auto', gap:16, alignItems:'center',
              padding:'14px 16px', borderRadius:'var(--r-md)', textAlign:'left', cursor: lleno?'not-allowed':'pointer',
              border:`2px solid ${sel ? accentColor : 'var(--line)'}`,
              background: sel ? `color-mix(in srgb, ${accentColor} 6%, white)` : lleno ? 'var(--surface-2)' : 'var(--surface)',
              opacity: lleno ? 0.55 : 1,
            }}>
              <div style={{ width:8, height:44, borderRadius:4, background: levelColor }} />
              <div>
                <div style={{ display:'flex', gap:10, alignItems:'baseline' }}>
                  <span style={{ fontFamily:'var(--f-mono)', fontWeight:700, fontSize:14 }}>{g.code}</span>
                  <span style={{ fontSize:12, color:'var(--ink-2)' }}>{g.level}</span>
                  <span style={{ fontSize:11, color:'var(--ink-3)' }}>{g.schedule}</span>
                </div>
                <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>
                  {g.teacher} · {g.progress}% avanzado
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:60, height:5, background:'var(--bg-deep)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background: pct===100?'var(--danger)':pct>=80?'var(--warn)':'var(--ok)' }} />
                  </div>
                  <span style={{ fontFamily:'var(--f-mono)', fontSize:11, fontWeight:700 }}>{g.students}/{g.cap}</span>
                </div>
                {lleno
                  ? <span style={{ fontSize:10, color:'var(--danger)', fontWeight:700 }}>GRUPO LLENO</span>
                  : <span style={{ fontSize:10, color:'var(--ok)' }}>{g.cap-g.students} cupo{g.cap-g.students!==1?'s':''} disponible{g.cap-g.students!==1?'s':''}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 3 — Nivel y examen de ubicación
// ─────────────────────────────────────────────────────────────────────────
function MStep3({ form, set, errors, accentColor, nivelMeta }) {
  return (
    <div>
      <MSectionTitle color={accentColor}>Nivel de entrada</MSectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {Object.entries(NIVEL_META_M).map(([k,m]) => (
          <button key={k} onClick={() => set('nivelId',k)} style={{
            padding:'16px 10px', borderRadius:'var(--r-md)', cursor:'pointer',
            border:`2px solid ${form.nivelId===k ? m.color : 'var(--line)'}`,
            background: form.nivelId===k ? `color-mix(in srgb, ${m.color} 12%, white)` : 'var(--surface)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:6,
          }}>
            <span style={{ fontSize:26 }}>{m.emoji}</span>
            <span style={{ fontWeight:700, fontSize:11, color: form.nivelId===k?m.color:'var(--ink-2)' }}>{m.nombre}</span>
          </button>
        ))}
      </div>

      <MSectionTitle color={accentColor}>Examen de ubicación</MSectionTitle>
      <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginBottom:14 }}>
        <MToggle value={form.tieneExamenUbicacion} onChange={v=>set('tieneExamenUbicacion',v)} color={accentColor} />
        <div>
          <div style={{ fontWeight:600, fontSize:13 }}>Este estudiante hizo examen de ubicación</div>
          <div style={{ fontSize:11, color:'var(--ink-3)' }}>El resultado puede confirmar o ajustar el nivel asignado</div>
        </div>
      </label>

      {form.tieneExamenUbicacion && (
        <div style={{ padding:'14px', background:'var(--surface-2)', borderRadius:'var(--r-md)', marginBottom:20 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Resultado / Nota</div>
              <input value={form.resultadoExamen} onChange={e=>set('resultadoExamen',e.target.value)}
                placeholder="Ej: 85/100 · A2 · Básico II" style={{ width:'100%', padding:'10px 12px', border:'1px solid var(--line)', borderRadius:'var(--r-md)', fontFamily:'inherit' }} />
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Nivel sugerido por examen</div>
              <div style={{ padding:'10px 12px', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--r-md)', fontSize:13, color: nivelMeta.color, fontWeight:700 }}>
                {nivelMeta.emoji} {nivelMeta.nombre} (nivel seleccionado arriba)
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding:'12px 14px', background:`color-mix(in srgb, ${accentColor} 5%, white)`, border:`1px solid ${accentColor}`, borderRadius:'var(--r-md)', fontSize:12, color:'var(--ink-2)', lineHeight:1.5 }}>
        El nivel <strong style={{ color: accentColor }}>{nivelMeta.emoji} {nivelMeta.nombre}</strong> se asignará a este estudiante. Podrá cambiarse manualmente en cualquier momento desde el perfil del estudiante.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 4 — Financiamiento
// ─────────────────────────────────────────────────────────────────────────
function MStep4({ form, set, errors, accentColor }) {
  return (
    <div>
      <MSectionTitle color={accentColor}>Tipo de financiamiento</MSectionTitle>
      <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
        <MRadioCard
          value="propio" current={form.financiamiento}
          onChange={() => set('financiamiento','propio')}
          accent={accentColor}>
          <div>
            <div style={{ fontWeight:700, fontSize:15 }}>Pago propio <span style={{ fontWeight:400, fontSize:12, color:'var(--ink-3)' }}>— sin intermediario financiero</span></div>
            <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:3 }}>El estudiante paga directamente a la academia en las fechas acordadas.</div>
          </div>
        </MRadioCard>
        <MRadioCard
          value="conape" current={form.financiamiento}
          onChange={() => set('financiamiento','conape')}
          accent="var(--an-navy)">
          <div>
            <div style={{ fontWeight:700, fontSize:15 }}>CONAPE <span style={{ fontWeight:400, fontSize:12, color:'var(--ink-3)' }}>— Comisión Nacional de Préstamos para Educación</span></div>
            <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:3 }}>Se genera proforma oficial con todos los rubros para el trámite ante CONAPE.</div>
            <div style={{ fontSize:11, color:'var(--an-navy)', fontWeight:600, marginTop:4 }}>Incluye: matrícula + cuotas + certificado + TOEIC (si aplica)</div>
          </div>
        </MRadioCard>
      </div>

      {form.financiamiento === 'conape' && (
        <div style={{ padding:'16px', background:'color-mix(in srgb, var(--an-navy) 5%, white)', border:'1px solid color-mix(in srgb, var(--an-navy) 20%, white)', borderRadius:'var(--r-md)' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--an-navy)', marginBottom:10 }}>Datos CONAPE</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <MInput label="Número de expediente CONAPE" value={form.conapeExpediente} onChange={v=>set('conapeExpediente',v)} placeholder="Ej: 2026-12345" mono />
            <div style={{ padding:'10px 12px', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--r-md)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--ink-3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>Estado del trámite</div>
              <select defaultValue="en_proceso" style={{ width:'100%', border:'none', outline:'none', fontFamily:'inherit', fontSize:13, background:'transparent', color:'var(--ink)' }}>
                <option value="en_proceso">En proceso</option>
                <option value="aprobado">Aprobado</option>
                <option value="desembolsado">Desembolsado</option>
                <option value="denegado">Denegado</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop:12, fontSize:12, color:'var(--ink-3)', lineHeight:1.5, padding:'8px 12px', background:'var(--surface)', borderRadius:8 }}>
            📋 La proforma se genera en el Paso 6 con todos los rubros del nivel. Incluye TOEIC si lo activas. Formato aceptado por CONAPE para trámites educativos.
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 5 — Beca
// ─────────────────────────────────────────────────────────────────────────
function MStep5({ form, set, errors, accentColor, nivelMeta }) {
  const opciones = [
    { k:'none', l:'Sin beca', pct:null, desc:'El estudiante paga el precio regular.' },
    { k:'impacta', l:'Beca Impacta', pct:25, desc:'25% de descuento en matrícula y cuotas.' },
    { k:'mujer', l:'Beca Mujer', pct:50, desc:'50% de descuento en matrícula y cuotas.' },
    { k:'custom', l:'Beca personalizada', pct:null, desc:'Define nombre y porcentaje.' },
  ];
  return (
    <div>
      <MSectionTitle color={accentColor}>Beca disponible</MSectionTitle>
      <div style={{ fontSize:11, color:'var(--ink-3)', marginBottom:14 }}>
        Solo una beca activa por estudiante. Aplica únicamente a matrícula y cuotas, <strong>nunca</strong> al certificado ni rubros adicionales.
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
        {opciones.map(o => (
          <MRadioCard key={o.k} value={o.k} current={form.beca} onChange={() => set('beca',o.k)} accent={accentColor}>
            <div style={{ flex:1 }}>
              <span style={{ fontWeight:700, fontSize:13 }}>{o.l}</span>
              {o.pct && <span style={{ fontFamily:'var(--f-mono)', fontWeight:700, color:accentColor, marginLeft:10 }}>{o.pct}% dto.</span>}
              <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:2 }}>{o.desc}</div>
            </div>
          </MRadioCard>
        ))}
      </div>
      {form.beca==='custom' && (
        <div style={{ padding:'14px', background:'var(--surface-2)', borderRadius:'var(--r-md)', marginTop:8 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <MInput label="Nombre de la beca" value={form.becaCustomNombre} onChange={v=>set('becaCustomNombre',v)} placeholder="Ej: Beca Comunidad" />
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Porcentaje de descuento</div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <input type="range" min={5} max={100} step={5} value={form.becaCustomPct} onChange={e=>set('becaCustomPct',Number(e.target.value))} style={{ flex:1, accentColor }} />
                <span style={{ fontFamily:'var(--f-mono)', fontWeight:700, fontSize:18, color:accentColor, minWidth:44 }}>{form.becaCustomPct}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 6 — Proforma
// ─────────────────────────────────────────────────────────────────────────
function MStep6({ form, set, errors, accentColor, nivelMeta, descuento, matFinal, cuotasFinal, totalNivel }) {
  const est = form.estudianteEncontrado || { nombre: form.nombreNuevo };
  const grupoSel = [].find(g => g.code===form.grupoSelId);
  const becaLabel = form.beca==='none'?null:form.beca==='impacta'?'Beca Impacta 25%':form.beca==='mujer'?'Beca Mujer 50%':`${form.becaCustomNombre} ${form.becaCustomPct}%`;

  return (
    <div>
      <MSectionTitle color={accentColor}>Rubros del nivel</MSectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
        <MMontoInput label="Matrícula" value={form.matriculaAmt} onChange={v=>set('matriculaAmt',v)} />
        <MMontoInput label={`Cuota mensual (×${form.nCuotas})`} value={form.cuotaAmt} onChange={v=>set('cuotaAmt',v)} />
        <MMontoInput label="Certificado del nivel (opcional)" value={form.certificadoAmt} onChange={v=>set('certificadoAmt',v)} />
        <div>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginBottom:8 }}>
            <MToggle value={form.toeic} onChange={v=>set('toeic',v)} color={accentColor} />
            <span style={{ fontSize:13, fontWeight:600 }}>Incluir TOEIC</span>
          </label>
          {form.toeic && <MMontoInput label="Monto TOEIC" value={form.toeicAmt} onChange={v=>set('toeicAmt',v)} />}
        </div>
      </div>

      {/* Vista previa de la proforma */}
      <div style={{
        border:'2px solid var(--an-navy)', borderRadius:'var(--r-lg)',
        overflow:'hidden', marginBottom:20,
      }}>
        {/* Header proforma */}
        <div style={{ background:'var(--an-navy)', color:'white', padding:'14px 20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontFamily:'var(--f-serif)', fontSize:18, fontWeight:500, letterSpacing:'-0.01em' }}>Proforma de Matrícula</div>
              <div style={{ fontSize:10, opacity:0.75, marginTop:2 }}>Academia Norteamericana Internacional · INA Resolución 2519</div>
            </div>
            <div style={{ textAlign:'right', fontSize:11, opacity:0.8 }}>
              <div>Fecha: {new Date().toLocaleDateString('es-CR')}</div>
              <div>Válida: 30 días</div>
            </div>
          </div>
        </div>

        {/* Datos */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, fontSize:12, background:'var(--surface-2)' }}>
          <div><span style={{ color:'var(--ink-3)', fontWeight:600 }}>Estudiante: </span>{est.nombre}</div>
          <div><span style={{ color:'var(--ink-3)', fontWeight:600 }}>Cédula: </span>{form.cedulaVal}</div>
          <div><span style={{ color:'var(--ink-3)', fontWeight:600 }}>Grupo: </span>{form.grupoSelId}</div>
          <div><span style={{ color:'var(--ink-3)', fontWeight:600 }}>Nivel: </span>{nivelMeta.emoji} {nivelMeta.nombre}</div>
          <div><span style={{ color:'var(--ink-3)', fontWeight:600 }}>Docente: </span>{grupoSel?.teacher || '—'}</div>
          <div><span style={{ color:'var(--ink-3)', fontWeight:600 }}>Horario: </span>{grupoSel?.schedule || '—'}</div>
        </div>

        {/* Rubros */}
        <div style={{ padding:'14px 20px' }}>
          {[
            { label:'Matrícula', base:form.matriculaAmt, final:matFinal, desc:descuento>0 },
            { label:`Cuotas (${form.nCuotas} × ${fmtMoney(form.cuotaAmt)})`, base:form.cuotaAmt*form.nCuotas, final:cuotasFinal, desc:descuento>0 },
            { label:'Certificado del nivel (opcional)', base:form.certificadoAmt, final:form.certificadoAmt, desc:false },
            ...(form.toeic ? [{ label:'Prueba TOEIC', base:form.toeicAmt, final:form.toeicAmt, desc:false }] : []),
          ].map((r,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px dashed var(--line)' }}>
              <div style={{ fontSize:13 }}>{r.label}</div>
              <div style={{ textAlign:'right' }}>
                {r.desc && <div style={{ fontSize:11, textDecoration:'line-through', color:'var(--ink-3)', fontFamily:'var(--f-mono)' }}>{fmtMoney(r.base)}</div>}
                <div style={{ fontFamily:'var(--f-mono)', fontWeight:700, fontSize:13, color: r.desc?'var(--ok)':'var(--ink)' }}>{fmtMoney(r.final)}</div>
              </div>
            </div>
          ))}
          {becaLabel && (
            <div style={{ marginTop:6, padding:'6px 10px', background:'color-mix(in srgb, var(--ok) 8%, white)', borderRadius:6, fontSize:12, color:'var(--ok)', fontWeight:600 }}>
              🎓 {becaLabel} aplicada a matrícula y cuotas
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, paddingTop:12, borderTop:'2px solid var(--an-navy)' }}>
            <span style={{ fontWeight:700, fontSize:14 }}>Total a pagar (sin certificado)</span>
            <span style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, color:'var(--an-navy)', letterSpacing:'-0.02em' }}>{fmtMoney(totalNivel)}</span>
          </div>
        </div>
        {form.financiamiento==='conape' && (
          <div style={{ padding:'8px 20px 12px', background:'color-mix(in srgb, var(--an-navy) 5%, white)', fontSize:11, color:'var(--an-navy)', borderTop:'1px solid var(--line)' }}>
            📋 Esta proforma está en formato CONAPE · Expediente: {form.conapeExpediente || '(pendiente)'}
          </div>
        )}
      </div>

      {form.financiamiento==='conape' && (
        <button className="btn btn-ghost" style={{ width:'100%', marginBottom:12 }} onClick={() => alert('Generando PDF...')}>
          <Icon name="download" size={14} className="" /> Descargar proforma CONAPE (PDF)
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 7 — Confirmación
// ─────────────────────────────────────────────────────────────────────────
function MStep7({ form, set, accentColor, nivelMeta, descuento, matFinal, cuotasFinal, totalNivel, grupoSel, onConfirm }) {
  const est = form.estudianteEncontrado || { nombre: form.nombreNuevo, correo: form.correoNuevo };
  const accessCode = `AN-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
  const becaLabel = form.beca==='none'?null:form.beca==='impacta'?'Beca Impacta 25%':form.beca==='mujer'?'Beca Mujer 50%':`${form.becaCustomNombre} ${form.becaCustomPct}%`;

  return (
    <div>
      {/* Resumen en tarjeta azul */}
      <div style={{
        padding:'20px 24px', marginBottom:20,
        background:'linear-gradient(135deg, var(--an-navy) 0%, #1A3E75 100%)',
        borderRadius:'var(--r-lg)', color:'white', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', right:-20, top:-20, width:120, height:120, borderRadius:'50%', background:accentColor, opacity:0.2 }} />
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', opacity:0.75 }}>Matrícula lista para confirmar</div>
        <div style={{ fontFamily:'var(--f-serif)', fontSize:28, fontWeight:500, letterSpacing:'-0.025em', marginTop:4 }}>{est.nombre}</div>
        <div style={{ fontSize:13, opacity:0.85, marginTop:2 }}>{nivelMeta.emoji} {nivelMeta.nombre} · {form.grupoSelId} · {grupoSel?.schedule}</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        {[
          ['Grupo', form.grupoSelId || '—'],
          ['Nivel', `${nivelMeta.emoji} ${nivelMeta.nombre}`],
          ['Docente', grupoSel?.teacher || '—'],
          ['Financiamiento', form.financiamiento==='conape'?'🏦 CONAPE':'💳 Pago propio'],
          ['Beca', becaLabel || 'Sin beca'],
          ['Total nivel', fmtMoney(totalNivel)],
          ...(form.esMenor ? [['Representante', form.repNombre], ['Parentesco', form.repParentesco]] : []),
        ].map(([k,v],i) => (
          <div key={i} style={{ padding:'10px 14px', background:'var(--surface-2)', borderRadius:'var(--r-md)', borderLeft:`4px solid ${accentColor}` }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)' }}>{k}</div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginTop:3 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Acciones post-matrícula */}
      <MSectionTitle color={accentColor}>Acciones al confirmar</MSectionTitle>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
        {[
          ['generarConstancia', 'Generar constancia de matrícula (PDF)', `Incluye código de acceso al campus`],
          ['generarProforma', 'Generar proforma de pago', form.financiamiento==='conape'?'Formato CONAPE':'Desglose de rubros para pago propio'],
          ['enviarWhatsApp', 'Enviar bienvenida por WhatsApp', `Al número ${form.estudianteEncontrado?.tel||form.telNuevo||'(no ingresado)'}`],
        ].map(([k,l,s]) => (
          <label key={k} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 14px', cursor:'pointer', background:'var(--surface-2)', borderRadius:'var(--r-md)', border:'1px solid var(--line)' }}>
            <MToggle value={form[k]} onChange={v=>set(k,v)} color={accentColor} />
            <div>
              <div style={{ fontWeight:600, fontSize:13 }}>{l}</div>
              <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:1 }}>{s}</div>
            </div>
          </label>
        ))}
      </div>

      {/* Código de acceso */}
      <div style={{ padding:'14px 16px', background:`color-mix(in srgb, ${accentColor} 6%, white)`, border:`1px solid ${accentColor}`, borderRadius:'var(--r-md)', marginBottom:20 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:accentColor, marginBottom:4 }}>Código de acceso al campus (se enviará al estudiante)</div>
        <div style={{ fontFamily:'var(--f-mono)', fontSize:20, fontWeight:700, letterSpacing:'0.08em', color:'var(--ink)' }}>{accessCode}</div>
      </div>

      {/* Confirmación */}
      <label style={{
        display:'flex', gap:14, padding:'16px 18px',
        border:`2px solid ${form.confirmado?'var(--ok)':'var(--line)'}`,
        borderRadius:'var(--r-md)', cursor:'pointer',
        background: form.confirmado?'color-mix(in srgb, var(--ok) 5%, white)':'var(--surface)',
        transition:'all .2s',
      }}>
        <input type="checkbox" checked={form.confirmado} onChange={onConfirm} style={{ width:20, height:20, marginTop:2, accentColor:'var(--ok)' }} />
        <div>
          <div style={{ fontWeight:700, fontSize:14, color:'var(--ink)' }}>Confirmo la matrícula de {est.nombre.split(' ')[0]}</div>
          <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:3 }}>El estudiante quedará activo en el grupo {form.grupoSelId} y recibirá acceso al campus virtual.</div>
        </div>
      </label>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────────────────
function MSectionTitle({ children, color, error }) {
  return (
    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
      color: error ? 'var(--danger)' : color, marginBottom:10, marginTop:4 }}>
      {children}{error && <span style={{ textTransform:'none', letterSpacing:0, fontWeight:400, marginLeft:8, color:'var(--danger)' }}>{error}</span>}
    </div>
  );
}
function MInput({ label, value, onChange, placeholder, error, upper, mono }) {
  return (
    <div>
      {label && <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{label}</div>}
      <input value={value} onChange={e => onChange(upper ? e.target.value.toUpperCase() : e.target.value)}
        placeholder={placeholder}
        style={{
          width:'100%', padding:'10px 12px',
          border: `1px solid ${error?'var(--danger)':'var(--line)'}`,
          borderRadius:'var(--r-md)', fontFamily: mono?'var(--f-mono)':'inherit', fontSize:13,
          background:'var(--surface)', color:'var(--ink)',
          boxSizing:'border-box',
        }} />
      {error && <div style={{ fontSize:10, color:'var(--danger)', marginTop:3 }}>{error}</div>}
    </div>
  );
}
function MMontoInput({ label, value, onChange }) {
  return (
    <div>
      {label && <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{label}</div>}
      <div style={{ display:'flex', alignItems:'center', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--r-md)', overflow:'hidden' }}>
        <span style={{ padding:'0 12px', background:'var(--bg-deep)', color:'var(--ink-3)', fontSize:13, fontWeight:700, borderRight:'1px solid var(--line)', height:'100%', display:'flex', alignItems:'center' }}>₡</span>
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
          style={{ flex:1, border:'none', outline:'none', padding:'10px 12px', fontFamily:'var(--f-mono)', fontSize:13, background:'transparent' }} />
      </div>
    </div>
  );
}
function MToggle({ value, onChange, color }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width:34, height:20, borderRadius:10, background:value?(color||'var(--ok)'):'var(--line-2)', position:'relative', cursor:'pointer', transition:'background .15s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:2, left:value?16:2, width:16, height:16, borderRadius:'50%', background:'white', boxShadow:'0 1px 3px rgba(0,0,0,0.2)', transition:'left .15s' }} />
    </div>
  );
}
function MRadioCard({ value, current, onChange, accent, children }) {
  const sel = current === value;
  return (
    <label style={{
      display:'flex', alignItems:'flex-start', gap:12, padding:'12px 14px',
      border:`2px solid ${sel?(accent||'var(--an-granate)'):'var(--line)'}`,
      borderRadius:'var(--r-md)', cursor:'pointer',
      background: sel?`color-mix(in srgb, ${accent||'var(--an-granate)'} 6%, white)`:'var(--surface)',
      transition:'all .15s',
    }}>
      <input type="radio" checked={sel} onChange={onChange} style={{ marginTop:3 }} />
      {children}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// VISTA PRINCIPAL: MatriculasView
// ─────────────────────────────────────────────────────────────────────────
function MatriculasView({ onNavigate }) {
  const [showWizard, setShowWizard] = React.useState(false);
  const [grupoPresel, setGrupoPresel] = React.useState(null);
  const { prospectos, resumen, loading, error, reload } = useProspectos();

  // Fase 3.5 — cruce con solicitudes de pago PENDIENTES. Set de cédulas (solo
  // dígitos) con comprobantes esperando atención + contador por cédula.
  const [pagosPend, setPagosPend] = React.useState({});   // { cedulaDigits: count }
  React.useEffect(() => {
    let cancel = false;
    const cargar = () => {
      if (typeof window.getSolicitudesPago !== 'function') return;
      window.getSolicitudesPago({ estado: 'PENDIENTE' }).then(r => {
        if (cancel || !r || !r.ok) return;
        const m = {};
        (r.solicitudes || []).forEach(s => {
          const k = String(s.estudiante_cedula || '').replace(/\D/g, '');
          if (k) m[k] = (m[k] || 0) + 1;
        });
        setPagosPend(m);
      }).catch(() => {});
    };
    cargar();
    window.addEventListener('an:solicitudes-pago-changed', cargar);
    return () => { cancel = true; window.removeEventListener('an:solicitudes-pago-changed', cargar); };
  }, []);
  const cedDigits = v => String(v == null ? '' : v).replace(/\D/g, '');
  const pagosDe = p => pagosPend[cedDigits(p.CEDULA || p.cedula)] || 0;

  // Fase 3.6 — cortes de cancelación (demo): el vendedor cancela y el admin lo
  // refleja con badge rojo. En producción estos datos vienen en getProspectos
  // (CANCELADO_POR / CANCELADO_FECHA / CANCELADO_MOTIVO).
  const [cancelStore, setCancelStore] = React.useState({});
  React.useEffect(() => {
    if (!MAT_DEMO) return;
    const cargar = () => { try { setCancelStore(window.getCanceladosDemo ? window.getCanceladosDemo() : {}); } catch (_) {} };
    cargar();
    window.addEventListener('an:prospecto-cancelado', cargar);
    window.addEventListener('focus', cargar);
    return () => { window.removeEventListener('an:prospecto-cancelado', cargar); window.removeEventListener('focus', cargar); };
  }, []);

  // Fase 3.5 — "Ir al prospecto" desde Solicitudes deja la cédula en sessionStorage.
  const [focusCed, setFocusCed] = React.useState(() => {
    try { const c = sessionStorage.getItem('an_mat_focus_ced'); if (c) { sessionStorage.removeItem('an_mat_focus_ced'); return c; } } catch (_) {}
    return null;
  });

  // Modales admin (Cambios 8/9/10) + toast + memoria de novedad CONAPE por cédula
  const [verProsp, setVerProsp] = React.useState(null);      // {cedula, nombre}
  const [proformaProsp, setProformaProsp] = React.useState(null);
  const [conapeProsp, setConapeProsp] = React.useState(null);
  const [genProsp, setGenProsp] = React.useState(null);      // Fase 2.5: {cedula, nombre}
  const [fichaProsp, setFichaProsp] = React.useState(null);  // Fase 3.6: {cedula, nombre}
  const [toast, setToast] = React.useState(null);            // {tipo, msg}
  const [conapeNov, setConapeNov] = React.useState({});      // {cedula: novedad}
  const showToast = React.useCallback((msg, tipo = 'info') => setToast({ msg, tipo }), []);

  // Fase 2 · Cambio 2 — filtros interactivos del resumen → lista PRE MATRÍCULA.
  // null = sin filtro. Grupo y asesor se combinan con AND.
  const [filtroGrupo, setFiltroGrupo] = React.useState(null);
  const [filtroAsesor, setFiltroAsesor] = React.useState(null);
  // Extractores tolerantes a MAY/min, alineados con agrupar() de matriculas_admin.jsx.
  const grupoDe = p => String(p.GRUPO_TENTATIVO || p.grupo_tentativo || p.grupo || '').trim() || '(Sin grupo)';
  const asesorDe = p => String(p.ASESOR_REF || p.asesor_ref || p.asesor || '').trim() || '(Sin asesor)';
  const toggleGrupo = g => setFiltroGrupo(cur => cur === g ? null : g);
  const toggleAsesor = a => setFiltroAsesor(cur => cur === a ? null : a);
  // Si tras un reload el grupo/asesor filtrado ya no existe entre los prospectos,
  // limpiar ese filtro automáticamente (los demás se mantienen).
  React.useEffect(() => {
    if (filtroGrupo && !prospectos.some(p => grupoDe(p) === filtroGrupo)) setFiltroGrupo(null);
    if (filtroAsesor && !prospectos.some(p => asesorDe(p) === filtroAsesor)) setFiltroAsesor(null);
  }, [prospectos]); // eslint-disable-line react-hooks/exhaustive-deps
  // Lista visible: aplica ambos filtros (AND).
  const prospectosFiltrados = prospectos.filter(p =>
    (!filtroGrupo || grupoDe(p) === filtroGrupo) &&
    (!filtroAsesor || asesorDe(p) === filtroAsesor) &&
    (!focusCed || cedDigits(p.CEDULA || p.cedula) === cedDigits(focusCed))
  );

  // Fase 2.5 — "Generar matrícula": solo admin/superadmin y solo si el prospecto
  // aún NO tiene CODIGO_ESTUDIANTE (si lo tiene, ya fue matriculado).
  const rolSesion = (() => {
    try { return (window.getSesion && window.getSesion() || {}).rol || ''; } catch (_) { return ''; }
  })();
  const puedeGenerar = rolSesion === 'admin' || rolSesion === 'superadmin';
  const yaMatriculado = p => String(p.CODIGO_ESTUDIANTE || p.codigo_estudiante || '').trim() !== '';

  // ── Fase 3.6 · Cambio 1 — visibilidad de botones por contexto ──────────────
  const etapaDe = p => String(p.ETAPA || p.etapa || '').trim().toUpperCase();
  const finDe = p => String(p.FINANCIAMIENTO || p.financiamiento || '').trim().toUpperCase();
  // Datos de cancelación: producción (columnas) o store demo.
  const cancelDe = p => {
    const por = p.CANCELADO_POR || p.cancelado_por;
    if (por) return { por, fecha: p.CANCELADO_FECHA || p.cancelado_fecha || '', motivo: p.CANCELADO_MOTIVO || p.cancelado_motivo || '' };
    const c = cancelStore[cedDigits(p.CEDULA || p.cedula)];
    if (c) return { por: c.cancelado_por, fecha: c.cancelado_fecha, motivo: c.cancelado_motivo };
    return null;
  };
  const esCancelado = p => !!cancelDe(p) || etapaDe(p) === 'CANCELADO' || String(p.ESTADO || '').toUpperCase() === 'CANCELADO';
  // Crear proforma: solo CONAPE y solo mientras la etapa es LEAD o CONAPE_SOLICITUD.
  const verCrearProforma = p => !esCancelado(p) && finDe(p) === 'CONAPE' && ['LEAD', 'CONAPE_SOLICITUD'].includes(etapaDe(p));
  // Actualizar CONAPE: CONAPE y aún sin código (luego lo cubre el sync).
  const verActualizarConape = p => !esCancelado(p) && finDe(p) === 'CONAPE' && !yaMatriculado(p);
  // Generar matrícula: admin y sin código todavía.
  const verGenerar = p => !esCancelado(p) && puedeGenerar && !yaMatriculado(p);
  // Ver ficha de estudiante: ya tiene código (activado).
  const verFicha = p => !esCancelado(p) && yaMatriculado(p);

  // Tras generar la matrícula: toast con el código + redirección a "Aplicar Pago"
  // con datos pre-cargados (mecanismo existente an_pago_prefill que ya lee
  // AplicarPago en su useEffect inicial). NO modificamos la pantalla de pago.
  const handleGenSuccess = (resp) => {
    setGenProsp(null);
    const cod = resp && resp.codigo_estudiante;
    showToast(`✅ Matrícula generada. Código de estudiante: ${cod || '—'}. Aplicando pago de matrícula…`, 'ok');
    reload();
    try {
      sessionStorage.setItem('an_pago_prefill', JSON.stringify({ codigo: cod, nivel: 'B1' }));
    } catch (_) { /* sessionStorage no disponible */ }
    if (onNavigate) {
      // Pequeña pausa para que el admin alcance a ver el toast con el código.
      setTimeout(() => onNavigate('aplicar_pago'), 1100);
    }
    // Si no hay onNavigate, el toast con el código queda visible y el admin
    // navega manualmente a "Aplicar Pago".
  };

  const finProspecto = p => String(p.FINANCIAMIENTO || p.financiamiento || '').toUpperCase();
  const esCONAPE = p => finProspecto(p) === 'CONAPE';
  const novClass = nov => nov === 'con_desembolso' ? 'nov-green' : nov === 'aprobado_sin_desembolso' ? 'nov-yellow' : nov === 'no_encontrado' ? 'nov-red' : '';

  const handleAbrir = (grupo = null) => { setGrupoPresel(grupo); setShowWizard(true); };
  const handleCrear = () => { reload(); };

  const estadoMeta = {
    PENDIENTE_PAGO:    { label:'Pago pendiente',     color:'var(--warn)',       bg:'color-mix(in srgb, var(--warn) 10%, white)' },
    PENDIENTE_CONAPE:  { label:'CONAPE en proceso',  color:'var(--an-blue,#2B7FC1)', bg:'color-mix(in srgb, #2B7FC1 10%, white)' },
    ACTIVO:            { label:'Activo',             color:'var(--ok)',         bg:'color-mix(in srgb, var(--ok) 10%, white)' },
  };

  const nivelDe = p => p.PROGRAMA === 'INA' ? 'Básico I con INA' : 'Básico I';
  const fechaDe = ts => {
    if (!ts) return '—';
    // Fechas "YYYY-MM-DD" se parsean como LOCAL (no UTC) para no correr un día.
    const s = String(ts);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s);
    if (isNaN(d)) return s.split(' ')[0] || s.split('T')[0] || '—';
    return d.toLocaleDateString('es-CR', { day:'numeric', month:'short', year:'numeric' });
  };

  const activar = async (p) => {
    // ── DEPRECADO (Fase 2.5) ──────────────────────────────────────────────────
    // El flujo "activar estudiante" (endpoint activarEstudiante) quedó obsoleto:
    // integraba mal a APOLLO. Lo reemplaza "Generar matrícula" (MatGenerarMatriculaModal
    // → endpoint generarMatricula). Se conserva la función sin uso por compatibilidad,
    // pero ya no hay botón que la invoque. NO reutilizar.
    console.warn('activar() está deprecado; usar Generar matrícula (generarMatricula).');
  };

  return (
    <div>
      <PageHeader
        kicker="Gestión académica"
        title={<>Matrículas</>}
        sub="Registro de nuevos estudiantes y seguimiento del proceso de matrícula"
      />

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          ['Total prospectos', prospectos.length, 'registros'],
          ['Activos', prospectos.filter(p=>p.ESTADO==='ACTIVO').length, 'estudiantes'],
          ['Pago pendiente', prospectos.filter(p=>p.ESTADO==='PENDIENTE_PAGO').length, 'por activar'],
          ['CONAPE', prospectos.filter(p=>p.ESTADO==='PENDIENTE_CONAPE').length, 'en proceso'],
        ].map(([l,n,s],i) => (
          <div key={i} className="card" style={{ padding:16 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)' }}>{l}</div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:32, fontWeight:500, color:'var(--an-navy-ink)', letterSpacing:'-0.03em', marginTop:4 }}>{n}</div>
            <div style={{ fontSize:11, color:'var(--ink-3)' }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Resumen de Matrículas: grupos abiertos · distribución prospectos/matriculados · asesores · comparativa (Cambio 6 + Fase 2) */}
      <window.MatResumenActivos resumen={resumen} prospectos={prospectos}
        filtroGrupo={filtroGrupo} filtroAsesor={filtroAsesor}
        onToggleGrupo={toggleGrupo} onToggleAsesor={toggleAsesor} />

      {/* Calendario de matrículas por día/vendedor (Fase 3.7) */}
      <window.CalendarioMatriculasAdmin />

      {/* Tabla */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <div className="card-title">PRE MATRÍCULA</div>
            {(filtroGrupo || filtroAsesor || focusCed) && (
              <div className="mat-filtros">
                <span className="mat-filtros-lbl">Mostrando:</span>
                {focusCed && (
                  <span className="mat-chip">💵 Pago reportado · <b>{focusCed}</b>
                    <button onClick={() => setFocusCed(null)} aria-label="Quitar foco de cédula">×</button>
                  </span>
                )}
                {filtroGrupo && (
                  <span className="mat-chip">Grupo <b>{filtroGrupo}</b>
                    <button onClick={() => setFiltroGrupo(null)} aria-label="Quitar filtro de grupo">×</button>
                  </span>
                )}
                {filtroAsesor && (
                  <span className="mat-chip">Asesor <b>{filtroAsesor}</b>
                    <button onClick={() => setFiltroAsesor(null)} aria-label="Quitar filtro de asesor">×</button>
                  </span>
                )}
                <span className="mat-filtros-count">{prospectosFiltrados.length} de {prospectos.length}</span>
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-ghost" style={{ fontSize:12 }}>
              <Icon name="download" size={14} className="" /> Exportar
            </button>
          </div>
        </div>
        <table className="table-soft">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Grupo</th>
              <th>Nivel</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{ padding:'24px', textAlign:'center', color:'var(--ink-3)', fontSize:13 }}>⏳ Cargando prospectos…</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={6} style={{ padding:'24px', textAlign:'center', color:'var(--an-granate)', fontSize:13, fontWeight:600 }}>⚠️ {error}</td></tr>
            )}
            {!loading && !error && prospectos.length === 0 && (
              <tr><td colSpan={6} style={{ padding:'24px', textAlign:'center', color:'var(--ink-3)', fontSize:13 }}>Aún no hay prospectos registrados.</td></tr>
            )}
            {!loading && !error && prospectos.length > 0 && prospectosFiltrados.length === 0 && (
              <tr><td colSpan={6} style={{ padding:'24px', textAlign:'center', color:'var(--ink-3)', fontSize:13 }}>Ningún prospecto coincide con el filtro activo.</td></tr>
            )}
            {!loading && !error && prospectosFiltrados.map((p,i) => {
              const em = estadoMeta[p.ESTADO] || { label:p.ESTADO||'—', color:'var(--ink-3)', bg:'var(--surface-2)' };
              const nombre = p.NOMBRE || '—';
              const grupo = p.GRUPO_TENTATIVO || '—';
              const initials = nombre.split(' ').slice(0,2).map(w=>w[0]||'').join('') || '?';
              const cancel = cancelDe(p);
              const cancelado = esCancelado(p);
              return (
                <tr key={p.CEDULA || i} style={cancelado ? { background:'color-mix(in srgb, var(--an-red) 4%, transparent)' } : null}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background: cancelado ? 'var(--ink-3)' : 'var(--an-navy)', color:'white', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {initials}
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                          <span style={{ fontWeight:600, fontSize:13, color: cancelado ? 'var(--ink-2)' : 'var(--ink)' }}>{nombre}</span>
                          {cancelado && (
                            <span title={cancel ? `Motivo: ${cancel.motivo}` : ''}
                              style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px',
                                background:'#FBE4E1', color:'#8B1A10', border:'1px solid #F0BDB6',
                                borderRadius:'var(--r-pill)', fontSize:10, fontWeight:800, letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
                              CANCELADO
                            </span>
                          )}
                          {!cancelado && pagosDe(p) > 0 && (
                            <span title={`${pagosDe(p)} comprobante(s) de pago reportado(s) — revisar en Solicitudes`}
                              style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px',
                                background:'#FFF4D6', color:'#8A5A00', border:'1px solid #F2D584',
                                borderRadius:'var(--r-pill)', fontSize:10.5, fontWeight:800, whiteSpace:'nowrap' }}>
                              💵 {pagosDe(p)} pago{pagosDe(p) === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                        {cancelado && cancel && (
                          <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:3, lineHeight:1.45 }}>
                            Cancelado por <b style={{ color:'var(--ink-2)' }}>{cancel.por || '—'}</b>
                            {cancel.fecha ? <> · {fechaDe(cancel.fecha)}</> : null}
                            {cancel.motivo ? <div style={{ fontStyle:'italic' }}>Motivo: {cancel.motivo}</div> : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily:'var(--f-mono)', fontWeight:600 }}>{grupo}</td>
                  <td style={{ fontSize:12 }}>{nivelDe(p)}</td>
                  <td style={{ fontSize:12, color:'var(--ink-2)' }}>{fechaDe(p.TIMESTAMP)}</td>
                  <td>
                    <span style={{ padding:'4px 10px', borderRadius:'var(--r-pill)', fontSize:11, fontWeight:700,
                      background:em.bg, color:em.color }}>
                      {em.label}
                    </span>
                  </td>
                  <td style={{ textAlign:'right' }}>
                    <div className="mat-row-actions">
                      <button className="mat-act-btn" onClick={() => setVerProsp({ cedula: p.CEDULA, nombre })}>Ver formulario</button>
                      {verFicha(p) && (
                        <button className="mat-act-btn" onClick={() => setFichaProsp({ cedula: p.CEDULA, nombre, codigo: p.CODIGO_ESTUDIANTE || p.codigo_estudiante })}>
                          Ver ficha de estudiante
                        </button>
                      )}
                      {verCrearProforma(p) && (
                        <button className="mat-act-btn" onClick={() => setProformaProsp({ cedula: p.CEDULA, nombre })}>Crear proforma</button>
                      )}
                      {verActualizarConape(p) && (
                        <button className={`mat-act-btn conape ${novClass(conapeNov[p.CEDULA])}`}
                          onClick={() => setConapeProsp({ cedula: p.CEDULA, nombre })}>
                          Actualizar CONAPE
                        </button>
                      )}
                      {verGenerar(p) && (
                        <button className="mat-act-btn" onClick={() => setGenProsp({ cedula: p.CEDULA, nombre })}>
                          Generar matrícula
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Botón rápido por grupo */}
      <div className="card" style={{ marginTop:20, padding:'16px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div className="card-title" style={{ fontSize:16 }}>Matricular en grupo específico</div>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {[].filter(g => g.students < g.cap).map(g => (
            <button key={g.code} onClick={() => handleAbrir(g.code)} style={{
              padding:'8px 14px', borderRadius:'var(--r-md)', fontSize:12, fontWeight:600,
              border:'1px solid var(--line)', background:'var(--surface)', cursor:'pointer',
              display:'flex', gap:6, alignItems:'center',
            }}>
              <span style={{ color:'var(--ink-3)', fontFamily:'var(--f-mono)' }}>{g.code}</span>
              <span style={{ color:'var(--ink-2)' }}>{g.level}</span>
              <span style={{ color:'var(--ok)', fontSize:10 }}>{g.cap-g.students} cupos</span>
            </button>
          ))}
        </div>
      </div>

      {showWizard && (
        <WizardMatricula
          onClose={() => setShowWizard(false)}
          onCrear={handleCrear}
          grupoPresel={grupoPresel}
        />
      )}

      {/* Modales admin (Cambios 8/9/10) */}
      {fichaProsp && (
        <window.MatFichaEstudianteModal cedula={fichaProsp.cedula} nombre={fichaProsp.nombre} codigo={fichaProsp.codigo}
          onClose={() => setFichaProsp(null)} onToast={showToast} />
      )}
      {verProsp && (
        <window.MatProspectoModal cedula={verProsp.cedula} nombre={verProsp.nombre}
          onClose={() => setVerProsp(null)} onToast={showToast} />
      )}
      {proformaProsp && (
        <window.MatProformasModal cedula={proformaProsp.cedula} nombre={proformaProsp.nombre}
          onClose={() => setProformaProsp(null)} onToast={showToast} />
      )}
      {conapeProsp && (
        <window.MatConapeModal cedula={conapeProsp.cedula} nombre={conapeProsp.nombre}
          onClose={() => setConapeProsp(null)} onToast={showToast}
          onResult={(nov) => setConapeNov(m => ({ ...m, [conapeProsp.cedula]: nov }))} />
      )}
      {genProsp && (
        <window.MatGenerarMatriculaModal cedula={genProsp.cedula} nombre={genProsp.nombre}
          gruposAbiertos={(resumen && resumen.grupos_abiertos) || []}
          onClose={() => setGenProsp(null)} onToast={showToast} onSuccess={handleGenSuccess} />
      )}
      <window.MatToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

Object.assign(window, { MatriculasView });
