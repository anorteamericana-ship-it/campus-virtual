/* global React, Icon, Chip, Stat, PageHeader */

const SCRIPT_URL_AV = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';

// ─────────────────────────────────────────────────────────────────
// Hook: lee el dashboard administrativo desde Apps Script
// Devuelve { data, loading, error, refetch } — data trae { kpis, grupos, alertas }
// ─────────────────────────────────────────────────────────────────
function useNovedadesConape() {
  const [novedades, setNovedades] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [ultimoSync, setUltimoSync] = React.useState(null);
  const [resumen, setResumen] = React.useState({ total: null, sinVincular: 0, sinDesembolso: 0 });
  React.useEffect(() => {
    fetch(`${SCRIPT_URL_AV}?fn=getNovedadesConape`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setNovedades(d.novedades || []);
          setUltimoSync(d.ultimoSync || null);
          setResumen({
            total: d.total ?? null,
            sinVincular: d.sinVincular || 0,
            sinDesembolso: d.sinDesembolso || 0,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return { novedades, loading, ultimoSync, resumen };
}

function useAdminDashboard() {
  const [data, setData]       = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState(null);
  const [tick, setTick]       = React.useState(0);

  React.useEffect(() => {
    let cancel = false;
    setLoading(true);
    setError(null);
    fetch(`${SCRIPT_URL_AV}?fn=getAdminDashboard`)
      .then(r => r.json())
      .then(d => {
        if (cancel) return;
        if (d.ok) setData(d);
        else      setError(d.error || 'No se pudo cargar el dashboard');
      })
      .catch(e => { if (!cancel) setError(e.message); })
      .finally(()=> { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [tick]);

  return { data, loading, error, refetch: () => setTick(t => t + 1) };
}

// Pantalla de carga / error compartida del módulo admin
function AdminLoadingState({ loading, error }) {
  return (
    <div style={{ padding:'80px 20px', textAlign:'center' }}>
      {loading ? (
        <>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:22, color:'var(--an-navy-ink)', marginBottom:8 }}>Cargando datos…</div>
          <div style={{ fontSize:13, color:'var(--ink-3)' }}>Consultando Apps Script</div>
        </>
      ) : (
        <>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:22, color:'var(--danger)', marginBottom:8 }}>No se pudo cargar el panel</div>
          <div style={{ fontSize:13, color:'var(--ink-3)' }}>{error}</div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CONSTANTES DEL NEGOCIO
// ─────────────────────────────────────────────────────────────────────────

const FERIADOS_CR_2026 = new Set([
  '2026-01-01','2026-04-09','2026-04-10','2026-04-11','2026-05-01',
  '2026-07-25','2026-08-02','2026-08-15','2026-09-15',
  '2026-10-12','2026-11-01','2026-12-08','2026-12-25',
]);

const NIVEL_META = {
  b1: { nombre:'Básico I',      emoji:'🟡', color:'#E5A823', css:'var(--lvl-basic1)', toneChip:'gold' },
  b2: { nombre:'Básico II',     emoji:'🔴', color:'#E8372A', css:'var(--lvl-basic2)', toneChip:'red'  },
  i1: { nombre:'Intermedio I',  emoji:'🔵', color:'#2B7FC1', css:'var(--lvl-inter1)', toneChip:'navy' },
  i2: { nombre:'Intermedio II', emoji:'🟢', color:'#4CAF50', css:'var(--lvl-inter2)', toneChip:'green'},
};

// Construye lista de docentes desde grupos reales de APOLLO (getAdminDashboard)
// grupos = data.grupos del dashboard — cada uno tiene: code, docente, schedule, nivelId
// Retorna: [{ id, nombre, grupos:[{code, schedule, nivelId, horarioCod}] }]
// horarioCod: extrae "LM69", "KJ69", "SA94", "LJ69" del código del grupo
function buildDocentesActivos(grupos) {
  const map = {};
  (grupos || []).forEach(g => {
    const nombre = (g.docente || '').trim();
    if (!nombre || nombre === 'POR DEFINIR') return;
    if (!map[nombre]) {
      map[nombre] = {
        id:     nombre,
        nombre: nombre,
        grupos: [],
      };
    }
    // Extraer segmento horario del código: B1-LM69-C3-0126 → "LM69"
    const partes = (g.code || '').split('-');
    const horarioCod = partes.length >= 2 ? partes[1] : '';
    map[nombre].grupos.push({
      code:       g.code,
      schedule:   g.schedule || '',
      nivelId:    g.nivelId  || '',
      horarioCod: horarioCod,       // ej: "LM69", "KJ69", "SA94", "LJ69"
    });
  });
  // Ordenar alfabético por nombre
  return Object.values(map).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

// Detecta conflicto real de horario:
// Un docente NO puede tener dos grupos con el mismo horarioCod activo
// (mismo día y misma franja horaria = imposible estar en ambos)
function detectarConflictoDocente(docente, nuevoHorarioCod) {
  if (!docente || !nuevoHorarioCod) return false;
  return docente.grupos.some(g => g.horarioCod === nuevoHorarioCod);
}

// Mapa de días → código de 2 letras
const DIAS_CODIGO = {
  'Lun/Mié':            'LM',
  'Mar/Jue':            'KJ',
  'Sáb':                'SA',
  'Sáb (día completo)': 'SA',
  'Lun/Mar/Mié/Jue':    'L4',
  'Mar/Mié/Jue/Vie':    'L4',
  'Lun/Mié/Jue/Vie':    'L4',
};

// Mapa hora inicio → código de 2 dígitos (hora inicio + hora fin abreviada)
// 06:00 → 6 a 9   = "69"
// 09:00 → 9 a 4   = "94"
const HORA_CODIGO = {
  '06:00': '69',
  '09:00': '94',
};

// Periodo derivado de la fecha de inicio + modalidad.
// Intensivo (cuatrimestre): Ene→C1, May→C2, Sep→C3
// Súper Intensivo (bimestre): Ene→B1, Mar→B2, May→B3, Jul→B4, Sep→B5, Nov→B6
function periodoFromFecha(fechaIso, modalidad) {
  if (!fechaIso) return '';
  const m = new Date(fechaIso).getMonth(); // 0-11
  if (modalidad === 'super_intensivo') {
    const map = { 0:'B1', 2:'B2', 4:'B3', 6:'B4', 8:'B5', 10:'B6' };
    return map[m] || `B${Math.floor(m/2)+1}`;
  }
  const map = { 0:'C1', 4:'C2', 8:'C3' };
  return map[m] || `C${Math.floor(m/4)+1}`;
}

// Lee el consecutivo más alto en `grupos` y devuelve el siguiente como string de 2 dígitos.
// Soporta tanto el formato viejo (G0033-2026) como el nuevo (B1-LM69-C3-0126).
// `grupos` es la lista que viene de useAdminDashboard().data.grupos
function siguienteConsecutivo(grupos) {
  let max = 0;
  (grupos || []).forEach(g => {
    const c = g.code || '';
    // Nuevo formato: ...-NNYY al final
    let m = c.match(/-(\d{2})(\d{2})$/);
    if (m) { const n = parseInt(m[1], 10); if (n > max) max = n; return; }
    // Viejo formato: G0033-2026
    m = c.match(/G0*(\d+)-\d{4}/);
    if (m) { const n = parseInt(m[1], 10); if (n > max) max = n; }
  });
  return (max + 1).toString().padStart(2, '0');
}

// Genera el código de grupo: NIVEL-DIASHORA-PERIODO-CONSECYY
// Ej: B1-LM69-C3-0126
function generarCodigoGrupo(form, grupos) {
  const nivel    = (form.niveles?.[0] || 'b1').toUpperCase();
  const diasCod  = DIAS_CODIGO[form.dias] || 'XX';
  const horaCod  = HORA_CODIGO[form.horaInicio] || form.horaInicio.replace(':','').slice(0,2);
  const periodo  = periodoFromFecha(form.fechaInicio, form.modalidad) || 'C1';
  const consec   = siguienteConsecutivo(grupos);
  const año      = form.fechaInicio
    ? String(new Date(form.fechaInicio).getFullYear()).slice(-2)
    : String(new Date().getFullYear()).slice(-2);
  return { code: `${nivel}-${diasCod}${horaCod}-${periodo}-${consec}${año}`, consec, periodo, año };
}

// Tipo de lección según número
function tipoLeccion(n) {
  if ([9,17,25,31].includes(n)) return 'oral';
  if ([18,32].includes(n)) return 'escrito';
  if ([4,8,13,16,21,24,28,30].includes(n)) return 'progress';
  return 'normal';
}

// Avanzar al siguiente día hábil (sin feriados, dentro de los días del grupo)
function nextClassDay(fecha, diasSemana) {
  const d = new Date(fecha);
  d.setDate(d.getDate() + 1);
  for (let i = 0; i < 60; i++) {
    const iso = d.toISOString().slice(0,10);
    if (diasSemana.includes(d.getDay()) && !FERIADOS_CR_2026.has(iso)) return new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return d;
}

// Generar cronograma de 32 lecciones
function generarCronograma(fechaInicio, diasSemana) {
  const lecciones = [];
  let cur = new Date(fechaInicio);
  // Encontrar primer día hábil válido desde fechaInicio
  while (!diasSemana.includes(cur.getDay()) || FERIADOS_CR_2026.has(cur.toISOString().slice(0,10))) {
    cur.setDate(cur.getDate() + 1);
  }
  for (let n = 1; n <= 32; n++) {
    lecciones.push({ n, fecha: new Date(cur), tipo: tipoLeccion(n) });
    cur = nextClassDay(cur, diasSemana);
  }
  return lecciones;
}

// Días de la semana según texto
function parseDias(str) {
  const m = { 'dom':0,'lun':1,'mar':2,'mié':3,'mie':3,'jue':4,'vie':5,'sáb':6,'sab':6 };
  const lower = str.toLowerCase();
  return Object.keys(m).filter(k => lower.includes(k)).map(k => m[k]);
}

const fmtCR = (d) => {
  if (!d) return '—';
  return d.toLocaleDateString('es-CR',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
};
const fmtMes = (d) => d ? d.toLocaleDateString('es-CR',{day:'numeric',month:'short'}) : '—';
const fmtMoney = (n) => '₡' + (n||0).toLocaleString('es-CR');

// Fechas de inicio válidas (primero de cada período, no feriado)
function fechasValidas(modalidad) {
  const year = 2026;
  const candidatos = modalidad === 'super_intensivo'
    ? [ // Inicio de bimestre
        new Date(year,0,5), new Date(year,2,2), new Date(year,4,4),
        new Date(year,6,6), new Date(year,8,1), new Date(year,10,2),
      ]
    : [ // Inicio de cuatrimestre
        new Date(year,0,5), new Date(year,4,4), new Date(year,8,1),
      ];
  return candidatos.filter(d => !FERIADOS_CR_2026.has(d.toISOString().slice(0,10)));
}

// Opciones de días según modalidad
const DIAS_OPTIONS = {
  super_intensivo: ['Lun/Mar/Mié/Jue','Mar/Mié/Jue/Vie','Lun/Mié/Jue/Vie','Otro'],
  intensivo:       ['Lun/Mié','Mar/Jue','Sáb (día completo)','Otro'],
};

// Estado inicial del wizard
const initState = () => ({
  modelo:'ina', niveles:['b1'], modalidad:'intensivo',
  dias:'Lun/Mié', horaInicio:'06:00', fechaInicio:null,
  docente:'', entrega:'virtual', linkZoom:'', salon:'', capacidad:12,
  matricula:20000, matriculaObligatoria:true,
  cuota:89000,
  certificadosPorNivel:{ b1:15000, b2:15000, i1:15000, i2:15000 },
  certificadoPrograma:45000,
  toeic:false, toeicMonto:136730,
  rubrosExtra:[],
  beca:'none', becaCustomNombre:'', becaCustomPct:25,
  disponibleInscripcion:false,
  cronograma:[],
  confirmado:false,
});

// ─────────────────────────────────────────────────────────────────────────
// WIZARD PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
function WizardCrearGrupo({ onClose, onCrear, grupos }) {
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState(initState());
  const [errors, setErrors]     = React.useState({});
  const [guardando, setGuardando] = React.useState(false);
  const [avisoManual, setAvisoManual] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Docentes reales construidos desde APOLLO — se recalcula cuando cambian los grupos
  const docentesActivos = React.useMemo(() => buildDocentesActivos(grupos), [grupos]);

  const nivel = NIVEL_META[form.niveles[0]] || NIVEL_META['b1'];
  const nCuotas = form.modalidad === 'super_intensivo' ? 2 : 4;

  // Resumen financiero
  const descuento = form.beca === 'impacta' ? 0.25 : form.beca === 'mujer' ? 0.50 : form.beca === 'custom' ? (form.becaCustomPct/100) : 0;
  const matBase = form.matriculaObligatoria ? form.matricula : 0;
  const cuotasBase = form.cuota * nCuotas;
  const matFinal = Math.round(matBase * (1 - descuento));
  const cuotasFinal = Math.round(cuotasBase * (1 - descuento));
  const totalNivel = matFinal + cuotasFinal;
  const nNiveles = form.niveles.length;
  const certTotal = form.niveles.reduce((s,k) => s + (form.certificadosPorNivel[k]||0), 0)
    + (nNiveles === 4 ? form.certificadoPrograma : 0);
  const totalPrograma = totalNivel * nNiveles + certTotal;

  // Validación por paso
  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.nivel) e.nivel = 'Selecciona un nivel';
      if (!form.modalidad) e.modalidad = 'Selecciona modalidad';
    }
    if (step === 2) {
      if (!form.dias) e.dias = 'Selecciona días';
      if (!form.fechaInicio) e.fechaInicio = 'Selecciona fecha de inicio';
    }
    if (step === 3) {
      if (!form.docente) e.docente = 'Selecciona un docente';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    if (step === 4) {
      // Generate cronograma
      if (form.fechaInicio) {
        const dias = parseDias(form.dias);
        const cr = generarCronograma(new Date(form.fechaInicio), dias.length ? dias : [1,3]);
        set('cronograma', cr);
      }
    }
    if (step < 6) setStep(s => s + 1);
  };
  const prev = () => { if (step > 1) setStep(s => s - 1); };

  const confirmar = async () => {
    if (!form.confirmado || guardando) return;
    const { code, consec, periodo } = generarCodigoGrupo(form, grupos);
    const docenteObj = docentesActivos.find(d => d.id === form.docente);

    // Intentar guardar en Apps Script con timeout de 5 s
    setGuardando(true);
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${SCRIPT_URL_AV}?fn=crearGrupo`, {
        method: 'POST',
        body: JSON.stringify({
          codigo_grupo:            code,
          docente:                 docenteObj?.nombre || '—',
          modalidad:               form.modalidad,
          dias:                    form.dias,
          hora_ini:                form.horaInicio,
          hora_fin:                form.horaInicio === '06:00' ? '21:00' : '16:00',
          fecha_inicio:            form.fechaInicio,
          periodo_inicio:          periodo,
          programa:                form.modelo === 'ina' ? 'INA' : 'SIN_INA',
          activo:                  true,
          capacidad:               form.capacidad || 40,
          nivel_inicio:            (form.niveles[0] || 'b1').toUpperCase(),
          tipo_periodo:            form.modalidad === 'super_intensivo' ? 'B' : 'C',
          año_inicio:              form.fechaInicio ? new Date(form.fechaInicio).getFullYear() : new Date().getFullYear(),
          dias_sem:                form.modalidad === 'super_intensivo' ? 4 : (form.dias.includes('Sáb') ? 1 : 2),
          consecutivo:             parseInt(consec, 10),
          // v4.15 — campos nuevos
          disponible_inscripcion:  form.disponibleInscripcion === true,
          precio_cuota:            form.cuota,
          precio_matricula:        form.matriculaObligatoria ? form.matricula : 0,
          precio_certificado:      form.certificadosPorNivel[form.niveles[0]] || 0,
          precio_titulo:           form.niveles.length === 4 ? form.certificadoPrograma : 0,
          beca_grupo:              form.beca === 'none' ? '' : form.beca === 'impacta' ? 'IMPACTA' : form.beca === 'mujer' ? 'MUJER' : form.becaCustomNombre.toUpperCase(),
          beca_pct:                form.beca === 'none' ? 0 : form.beca === 'impacta' ? 25 : form.beca === 'mujer' ? 50 : form.becaCustomPct,
          toeic:                   form.toeic === true,
          toeic_monto:             form.toeic ? form.toeicMonto : 0,
        }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      const data = await res.json();
      if (!data.ok) setAvisoManual(true);
    } catch(_) {
      setAvisoManual(true);
    } finally {
      setGuardando(false);
    }

    onCrear(code);
    onClose();
  };

  const STEPS_LABELS = ['Tipo y nivel','Horario','Docente','Precios','Cronograma','Confirmación'];

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(10,8,20,0.7)', zIndex:300,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background:'var(--surface)', borderRadius:'var(--r-xl)',
        width:'100%', maxWidth:980, maxHeight:'90vh',
        display:'flex', flexDirection:'column',
        boxShadow:'0 24px 80px rgba(0,0,0,0.4)',
        overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding:'18px 28px', borderBottom:'1px solid var(--line)',
          display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0,
          background: `linear-gradient(135deg, color-mix(in srgb, ${nivel.color} 8%, white) 0%, var(--surface) 100%)`,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{
              width:44, height:44, borderRadius:'var(--r-md)',
              background: nivel.color, color:'white',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20, fontWeight:700,
            }}>{nivel.emoji}</div>
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3)' }}>
                Nuevo grupo · Paso {step} de 6
              </div>
              <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, color:'var(--an-navy-ink)', letterSpacing:'-0.02em' }}>
                {STEPS_LABELS[step-1]}
              </div>
            </div>
          </div>
          {/* Step progress dots */}
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            {STEPS_LABELS.map((_,i) => (
              <div key={i} style={{
                width: i+1===step ? 28 : 10, height:10,
                borderRadius:5,
                background: i+1 < step ? 'var(--ok)' : i+1===step ? nivel.color : 'var(--line-2)',
                transition:'all .3s',
              }} />
            ))}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:24, color:'var(--ink-3)', cursor:'pointer', padding:4, lineHeight:1 }}>×</button>
        </div>

        {/* Body — sidebar steps + content */}
        <div style={{ display:'grid', gridTemplateColumns: step===4 ? '200px 1fr 260px' : '200px 1fr', flex:1, overflow:'hidden' }}>
          {/* Left sidebar: step list */}
          <div style={{ borderRight:'1px solid var(--line)', padding:'20px 12px', background:'var(--surface-2)', overflowY:'auto' }}>
            {STEPS_LABELS.map((l, i) => (
              <div key={i} onClick={() => i+1 < step && setStep(i+1)} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'10px 12px', borderRadius:'var(--r-md)', marginBottom:4,
                background: i+1===step ? `color-mix(in srgb, ${nivel.color} 10%, white)` : 'transparent',
                border: i+1===step ? `1px solid ${nivel.color}` : '1px solid transparent',
                cursor: i+1 < step ? 'pointer' : 'default',
              }}>
                <div style={{
                  width:24, height:24, borderRadius:'50%', flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:700,
                  background: i+1 < step ? 'var(--ok)' : i+1===step ? nivel.color : 'var(--line-2)',
                  color: i+1 <= step ? 'white' : 'var(--ink-3)',
                }}>
                  {i+1 < step ? '✓' : i+1}
                </div>
                <div style={{ fontSize:12, fontWeight: i+1===step ? 700 : 500, color: i+1===step ? 'var(--ink)' : 'var(--ink-2)' }}>
                  {l}
                </div>
              </div>
            ))}

            {/* Mini summary sidebar */}
            {step >= 2 && (
              <div style={{ marginTop:18, padding:12, background:'var(--surface)', borderRadius:'var(--r-md)', border:'1px solid var(--line)' }}>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:8 }}>Resumen</div>
                {[
                  [nivel.nombre, nivel.emoji],
                  [form.modalidad==='super_intensivo'?'Súper Intensivo':'Intensivo', '⚡'],
                  [form.modelo==='ina'?'Con INA':'Sin INA', '📋'],
                  form.fechaInicio && [fmtMes(new Date(form.fechaInicio)), '📅'],
                  form.docente && [docentesActivos.find(d=>d.id===form.docente)?.nombre?.split(' ')[0], '👤'],
                ].filter(Boolean).map(([v,e],i) => (
                  <div key={i} style={{ fontSize:11, color:'var(--ink-2)', padding:'3px 0', display:'flex', gap:6 }}>
                    <span>{e}</span><span>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main content */}
          <div style={{ overflowY:'auto', padding:'28px 32px' }}>
            {step===1 && <Step1 form={form} set={set} errors={errors} nivel={nivel} />}
            {step===2 && <Step2 form={form} set={set} errors={errors} nivel={nivel} nCuotas={nCuotas} />}
            {step===3 && <Step3 form={form} set={set} errors={errors} nivel={nivel} docentesActivos={docentesActivos} nuevoHorarioCod={(() => { const p=(DIAS_CODIGO[form.dias]||'XX')+(HORA_CODIGO[form.horaInicio]||''); return p; })()} />}
            {step===4 && <Step4 form={form} set={set} errors={errors} nivel={nivel} nCuotas={nCuotas}
              matFinal={matFinal} cuotasFinal={cuotasFinal} descuento={descuento} />}
            {step===5 && <Step5 form={form} set={set} nivel={nivel} />}
            {step===6 && <Step6 form={form} nivel={nivel} nCuotas={nCuotas}
              matFinal={matFinal} cuotasFinal={cuotasFinal} totalNivel={totalNivel} totalPrograma={totalPrograma}
              descuento={descuento} grupos={grupos} docentesActivos={docentesActivos} onConfirm={() => set('confirmado', !form.confirmado)} />}
          </div>

          {/* Paso 4: sidebar financiero en vivo */}
          {step===4 && (
            <FinanceSidebar form={form} nivel={nivel} nCuotas={nCuotas}
              matFinal={matFinal} cuotasFinal={cuotasFinal}
              totalNivel={totalNivel} totalPrograma={totalPrograma}
              descuento={descuento} />
          )}
        </div>

        {/* Footer nav */}
        <div style={{
          padding:'16px 28px', borderTop:'1px solid var(--line)',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          background:'var(--surface-2)', flexShrink:0,
        }}>
          <button onClick={prev} disabled={step===1} className="btn btn-ghost">← Anterior</button>
          <div style={{ fontSize:11, color:'var(--ink-3)' }}>
            Paso {step} de 6 — {form.nivel && nivel.nombre}
          </div>
          {step < 6
            ? <button onClick={next} className="btn btn-primary" style={{ background: nivel.color, borderColor: nivel.color, minWidth:140 }}>
                Siguiente →
              </button>
            : <button onClick={confirmar} disabled={!form.confirmado || guardando}
                className="btn btn-primary"
                style={{ background:'var(--an-granate)', borderColor:'var(--an-granate)', minWidth:180, opacity: form.confirmado&&!guardando?1:0.4 }}>
                {guardando ? 'Creando grupo…' : 'ABRIR GRUPO'}
              </button>
          }
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 1 — Tipo y nivel
// ─────────────────────────────────────────────────────────────────────────
function Step1({ form, set, errors, nivel }) {
  const Opt = ({ value, current, onChange, children, accent }) => (
    <label style={{
      display:'flex', alignItems:'flex-start', gap:14, padding:'14px 16px',
      border:`2px solid ${current===value ? (accent||'var(--an-granate)') : 'var(--line)'}`,
      borderRadius:'var(--r-md)', cursor:'pointer', marginBottom:10,
      background: current===value ? `color-mix(in srgb, ${accent||'var(--an-granate)'} 6%, white)` : 'var(--surface)',
      transition:'all .15s',
    }}>
      <input type="radio" name={value} checked={current===value} onChange={onChange} style={{ marginTop:2 }} />
      {children}
    </label>
  );

  return (
    <div>
      <SectionTitle>Modelo del grupo</SectionTitle>
      <Opt value="ina" current={form.modelo} onChange={() => set('modelo','ina')} accent="var(--an-navy)">
        <div>
          <div style={{ fontWeight:700, fontSize:15 }}>Con INA <span style={{ fontWeight:400, fontSize:12, color:'var(--ink-3)' }}>· Acreditado INA Resolución 2519</span></div>
          <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:3 }}>128h totales (96h curso + 32h Club I CAN) · Certificado oficial INA · Compatible con CONAPE</div>
        </div>
      </Opt>
      <Opt value="sin_ina" current={form.modelo} onChange={() => set('modelo','sin_ina')} accent="var(--ink-3)">
        <div>
          <div style={{ fontWeight:700, fontSize:15 }}>Sin INA <span style={{ fontWeight:400, fontSize:12, color:'var(--ink-3)' }}>· Programa propio de la academia</span></div>
          <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:3 }}>96h · Certificado propio · Sin Club I CAN obligatorio</div>
        </div>
      </Opt>

      <SectionTitle error={errors.nivel}>Nivel(es) del grupo</SectionTitle>
      <div style={{ fontSize:11, color:'var(--ink-3)', marginBottom:10 }}>
        Seleccioná uno o varios niveles. El color del wizard refleja el primer nivel seleccionado.
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:8 }}>
        {Object.entries(NIVEL_META).map(([k, m]) => {
          const sel = form.niveles.includes(k);
          return (
            <button key={k} onClick={() => {
              const orden = ['b1','b2','i1','i2'];
              if (sel) {
                if (form.niveles.length === 1) return;
                set('niveles', form.niveles.filter(n => n !== k));
              } else {
                const nuevo = [...form.niveles, k].sort((a,b) => orden.indexOf(a)-orden.indexOf(b));
                set('niveles', nuevo);
              }
            }} style={{
              padding:'16px 10px', borderRadius:'var(--r-md)', cursor:'pointer',
              border:`2px solid ${sel ? m.color : 'var(--line)'}`,
              background: sel ? `color-mix(in srgb, ${m.color} 12%, white)` : 'var(--surface)',
              display:'flex', flexDirection:'column', alignItems:'center', gap:8,
              transition:'all .15s', position:'relative',
            }}>
              {sel && (
                <div style={{
                  position:'absolute', top:6, right:6, width:16, height:16,
                  borderRadius:'50%', background:m.color, color:'white',
                  fontSize:10, fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>\u2713</div>
              )}
              <span style={{ fontSize:28 }}>{m.emoji}</span>
              <span style={{ fontWeight:700, fontSize:12, color: sel ? m.color : 'var(--ink-2)', textAlign:'center' }}>{m.nombre}</span>
            </button>
          );
        })}
      </div>
      {form.niveles.length === 4 && (
        <div style={{ padding:'10px 14px', background:'color-mix(in srgb, var(--ok) 8%, white)', border:'1px solid var(--ok)', borderRadius:'var(--r-md)', fontSize:12, color:'var(--ok)', fontWeight:600, marginBottom:16 }}>
          \u2713 Programa completo \u2014 el estudiante podr\u00e1 optar al T\u00edtulo del Programa al finalizar los 4 niveles sin convalidar
        </div>
      )}
      {form.niveles.length > 1 && form.niveles.length < 4 && (
        <div style={{ padding:'10px 14px', background:'color-mix(in srgb, var(--warn) 8%, white)', border:'1px solid var(--warn)', borderRadius:'var(--r-md)', fontSize:12, color:'#7A5000', marginBottom:16 }}>
          \u26a0\ufe0f Con {form.niveles.length} niveles el estudiante no podr\u00e1 acreditar el T\u00edtulo del Programa completo.
        </div>
      )}
      {errors.nivel && <ErrMsg>{errors.nivel}</ErrMsg>}

      <SectionTitle error={errors.modalidad}>Modalidad</SectionTitle>
      <Opt value="intensivo" current={form.modalidad} onChange={() => set('modalidad','intensivo')} accent="var(--an-granate)">
        <div>
          <div style={{ fontWeight:700, fontSize:15 }}>Intensivo <span style={{ fontSize:12, color:'var(--ink-3)', fontWeight:400 }}>— Inglés Rápido</span></div>
          <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:3 }}>2 días/semana · ~4 meses por nivel · 4 cuotas mensuales</div>
        </div>
      </Opt>
      <Opt value="super_intensivo" current={form.modalidad} onChange={() => set('modalidad','super_intensivo')} accent="var(--an-granate)">
        <div>
          <div style={{ fontWeight:700, fontSize:15 }}>Súper Intensivo <span style={{ fontSize:12, color:'var(--ink-3)', fontWeight:400 }}>— Inglés en 8 meses</span></div>
          <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:3 }}>4 días/semana · ~2 meses por nivel · 2 cuotas mensuales</div>
        </div>
      </Opt>
      {errors.modalidad && <ErrMsg>{errors.modalidad}</ErrMsg>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 2 — Horario y fecha
// ─────────────────────────────────────────────────────────────────────────
function Step2({ form, set, errors, nivel, nCuotas }) {
  const diasOpts = DIAS_OPTIONS[form.modalidad] || [];
  const fechasOpts = fechasValidas(form.modalidad);

  // Calcular fecha fin estimada
  const finEstimado = React.useMemo(() => {
    if (!form.fechaInicio) return null;
    const dias = parseDias(form.dias);
    if (!dias.length) return null;
    const cr = generarCronograma(new Date(form.fechaInicio), dias);
    return cr[cr.length - 1]?.fecha;
  }, [form.fechaInicio, form.dias]);

  return (
    <div>
      <SectionTitle error={errors.dias}>Días de clase</SectionTitle>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
        {diasOpts.map(d => (
          <button key={d} onClick={() => set('dias', d)} style={{
            padding:'8px 16px', borderRadius:'var(--r-md)',
            border:`2px solid ${form.dias===d ? nivel.color : 'var(--line)'}`,
            background: form.dias===d ? `color-mix(in srgb, ${nivel.color} 10%, white)` : 'var(--surface)',
            fontWeight: form.dias===d ? 700 : 500, fontSize:13, cursor:'pointer',
            color: form.dias===d ? nivel.color : 'var(--ink-2)',
          }}>{d}</button>
        ))}
      </div>
      {form.dias==='Otro' && (
        <input placeholder="Ej: Lun/Mié/Vie" value={form.dias==='Otro'?'':form.dias} onChange={e => set('dias', e.target.value)}
          style={{ width:'100%', padding:'10px 12px', border:'1px solid var(--line)', borderRadius:'var(--r-md)', marginBottom:16, fontFamily:'inherit' }} />
      )}
      {errors.dias && <ErrMsg>{errors.dias}</ErrMsg>}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        <div>
          <SectionTitle>Hora de inicio</SectionTitle>
          <select value={form.horaInicio} onChange={e => set('horaInicio', e.target.value)}
            style={{ width:'100%', padding:'10px 12px', border:'1px solid var(--line)', borderRadius:'var(--r-md)', fontFamily:'inherit' }}>
            {['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
              .map(h => <option key={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <SectionTitle>Hora de fin (calculada)</SectionTitle>
          <div style={{ padding:'10px 12px', border:'1px solid var(--line)', borderRadius:'var(--r-md)', background:'var(--surface-2)', fontFamily:'var(--f-mono)', fontSize:14, color:'var(--ink-2)' }}>
            {(() => { const [h,m] = form.horaInicio.split(':').map(Number); return `${String(h+3).padStart(2,'0')}:${String(m).padStart(2,'0')}`; })()}
            <span style={{ fontSize:10, color:'var(--ink-3)', marginLeft:6 }}>3h por lección</span>
          </div>
        </div>
      </div>

      <SectionTitle error={errors.fechaInicio}>Fecha de inicio</SectionTitle>
      <div style={{ fontSize:11, color:'var(--ink-3)', marginBottom:10 }}>
        Solo se muestran fechas válidas según el calendario académico y feriados de Costa Rica.
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:16 }}>
        {fechasOpts.map((f, i) => {
          const iso = f.toISOString().slice(0,10);
          const sel = form.fechaInicio === iso;
          return (
            <button key={i} onClick={() => set('fechaInicio', iso)} style={{
              padding:'12px 10px', borderRadius:'var(--r-md)',
              border:`2px solid ${sel ? nivel.color : 'var(--line)'}`,
              background: sel ? `color-mix(in srgb, ${nivel.color} 10%, white)` : 'var(--surface)',
              cursor:'pointer', textAlign:'left',
            }}>
              <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, color: sel ? nivel.color : 'var(--ink)', lineHeight:1 }}>
                {f.getDate()}
              </div>
              <div style={{ fontSize:11, color: sel ? nivel.color : 'var(--ink-2)', fontWeight:600, marginTop:2, textTransform:'capitalize' }}>
                {f.toLocaleDateString('es-CR',{month:'long', year:'numeric'})}
              </div>
            </button>
          );
        })}
      </div>
      {errors.fechaInicio && <ErrMsg>{errors.fechaInicio}</ErrMsg>}

      <div style={{ marginTop:12, marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>
          O eleg\u00ed cualquier fecha
        </div>
        <input type="date" value={form.fechaInicio||''}
          onChange={e => set('fechaInicio', e.target.value)}
          style={{ padding:'10px 12px', border:`2px solid ${nivel.color}`, borderRadius:'var(--r-md)', fontFamily:'inherit', fontSize:14, color:'var(--ink)' }}
        />
        {form.fechaInicio && (() => {
          const dias = parseDias(form.dias);
          if (!dias.length) return null;
          const cr = generarCronograma(new Date(form.fechaInicio), dias);
          const fin = cr[cr.length-1]?.fecha;
          if (!fin) return null;
          const mes = fin.getMonth();
          if ([3,4,7,8,11,0].includes(mes)) return null;
          return (
            <div style={{ marginTop:8, padding:'8px 12px', background:'color-mix(in srgb, var(--warn) 10%, white)', border:'1px solid var(--warn)', borderRadius:'var(--r-md)', fontSize:12, color:'#7A5000' }}>
              \u26a0\ufe0f El fin estimado ({fmtCR(fin)}) se sale del per\u00edodo est\u00e1ndar. Pod\u00e9s continuar \u2014 es solo una advertencia.
            </div>
          );
        })()}
      </div>

      {form.fechaInicio && (
        <div style={{
          padding:'16px 18px', background:`color-mix(in srgb, ${nivel.color} 6%, white)`,
          border:`1px solid ${nivel.color}`, borderRadius:'var(--r-md)',
          fontSize:13, lineHeight:1.6,
        }}>
          <div style={{ fontWeight:700, color: nivel.color, marginBottom:4 }}>Vista previa del cronograma</div>
          Este grupo tendrá <strong>32 lecciones de 3h</strong>
          {form.modelo==='ina' && <> + <strong>16 sesiones I CAN de 2h</strong></>}.
          <br/>
          Inicio: <strong>{fmtCR(new Date(form.fechaInicio))}</strong>
          {finEstimado && <> &nbsp;→&nbsp; Fin estimado: <strong>{fmtCR(finEstimado)}</strong></>}
          <br/>
          <span style={{ fontSize:11, color:'var(--ink-3)' }}>Feriados de Costa Rica 2026 excluidos automáticamente.</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 3 — Docente y salón
// ─────────────────────────────────────────────────────────────────────────
function Step3({ form, set, errors, nivel, docentesActivos, nuevoHorarioCod }) {
  const docenteSel = docentesActivos.find(d => d.id === form.docente);
  const conflict   = docenteSel && nuevoHorarioCod
    ? detectarConflictoDocente(docenteSel, nuevoHorarioCod)
    : false;

  // Etiqueta de carga del docente basada en grupos activos reales
  function cargaLabel(n) {
    if (n === 0) return { label:'Disponible', color:'white', bg:'var(--ok)' };
    if (n === 1) return { label:'1 grupo',    color:'var(--warn)', bg:'color-mix(in srgb, var(--warn) 15%, white)' };
    if (n === 2) return { label:'2 grupos',   color:'#C05000', bg:'color-mix(in srgb, var(--warn) 25%, white)' };
    return               { label:`${n} grupos — muy ocupado`, color:'var(--danger)', bg:'color-mix(in srgb, var(--danger) 12%, white)' };
  }

  return (
    <div>
      <SectionTitle error={errors.docente}>Docente asignado</SectionTitle>

      {docentesActivos.length === 0 && (
        <div style={{ padding:'16px', background:'var(--surface-2)', borderRadius:'var(--r-md)', fontSize:13, color:'var(--ink-3)', marginBottom:16 }}>
          No hay docentes registrados en APOLLO. Asignales grupos desde la hoja GRUPOS.
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
        {docentesActivos.map(d => {
          const carga = cargaLabel(d.grupos.length);
          const seleccionado = form.docente === d.id;
          const tieneConflicto = nuevoHorarioCod ? detectarConflictoDocente(d, nuevoHorarioCod) : false;
          return (
            <label key={d.id} style={{
              display:'flex', alignItems:'flex-start', gap:12, padding:'12px 14px',
              border:`2px solid ${seleccionado ? nivel.color : tieneConflicto ? 'var(--danger)' : 'var(--line)'}`,
              borderRadius:'var(--r-md)', cursor: tieneConflicto ? 'not-allowed' : 'pointer',
              background: seleccionado
                ? `color-mix(in srgb, ${nivel.color} 6%, white)`
                : tieneConflicto
                  ? 'color-mix(in srgb, var(--danger) 4%, white)'
                  : 'var(--surface)',
              opacity: tieneConflicto ? 0.6 : 1,
            }}>
              <input
                type="radio"
                checked={seleccionado}
                disabled={tieneConflicto}
                onChange={() => !tieneConflicto && set('docente', d.id)}
                style={{ marginTop:3 }}
              />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{d.nombre}</div>
                <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:3 }}>
                  {d.grupos.length === 0
                    ? 'Sin grupos activos — totalmente disponible'
                    : d.grupos.map(g => `${g.code} · ${g.schedule}`).join('  |  ')
                  }
                </div>
                {tieneConflicto && (
                  <div style={{ fontSize:11, color:'var(--danger)', fontWeight:600, marginTop:4 }}>
                    ⛔ Conflicto de horario — ya tiene un grupo en {nuevoHorarioCod}
                  </div>
                )}
              </div>
              <div style={{
                fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:'var(--r-pill)',
                background: carga.bg, color: carga.color, whiteSpace:'nowrap',
              }}>
                {carga.label}
              </div>
            </label>
          );
        })}
      </div>

      {errors.docente && <ErrMsg>{errors.docente}</ErrMsg>}
      {conflict && (
        <div style={{ padding:'10px 14px', background:'color-mix(in srgb, var(--danger) 8%, white)', border:'1px solid var(--danger)', borderRadius:'var(--r-md)', fontSize:12, color:'var(--danger)', marginBottom:16, fontWeight:600 }}>
          ⛔ El docente seleccionado ya tiene un grupo en este horario ({nuevoHorarioCod}). Seleccioná otro docente o cambiá el horario.
        </div>
      )}

      <SectionTitle>Modalidad de entrega</SectionTitle>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['virtual','Virtual (Zoom/Meet)'],['presencial','Presencial'],['mixta','Mixta']].map(([k,l]) => (
          <button key={k} onClick={() => set('entrega',k)} style={{
            padding:'8px 14px', borderRadius:'var(--r-md)',
            border:`2px solid ${form.entrega===k ? nivel.color : 'var(--line)'}`,
            background: form.entrega===k ? `color-mix(in srgb, ${nivel.color} 10%, white)` : 'var(--surface)',
            fontWeight: form.entrega===k ? 700 : 500, fontSize:12, cursor:'pointer',
            color: form.entrega===k ? nivel.color : 'var(--ink-2)',
          }}>{l}</button>
        ))}
      </div>

      {(form.entrega==='virtual'||form.entrega==='mixta') && (
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', letterSpacing:'0.1em', textTransform:'uppercase', display:'block', marginBottom:6 }}>
            Link de Zoom / Meet
          </label>
          <input value={form.linkZoom} onChange={e => set('linkZoom',e.target.value)}
            placeholder="https://zoom.us/j/..." style={{ width:'100%', padding:'10px 12px', border:'1px solid var(--line)', borderRadius:'var(--r-md)', fontFamily:'inherit' }} />
        </div>
      )}
      {(form.entrega==='presencial'||form.entrega==='mixta') && (
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', letterSpacing:'0.1em', textTransform:'uppercase', display:'block', marginBottom:6 }}>
            Salón / Aula
          </label>
          <input value={form.salon} onChange={e => set('salon',e.target.value)}
            placeholder="Ej: Aula A1, Sala Azul..." style={{ width:'100%', padding:'10px 12px', border:'1px solid var(--line)', borderRadius:'var(--r-md)', fontFamily:'inherit' }} />
        </div>
      )}

      <SectionTitle>Capacidad máxima</SectionTitle>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <input type="range" min={5} max={20} value={form.capacidad} onChange={e => set('capacidad', Number(e.target.value))}
          style={{ flex:1, accentColor: nivel.color }} />
        <div style={{ fontFamily:'var(--f-serif)', fontSize:32, fontWeight:500, color: nivel.color, minWidth:56, textAlign:'right' }}>
          {form.capacidad}
        </div>
        <div style={{ fontSize:12, color:'var(--ink-3)' }}>estudiantes</div>
      </div>
      <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:4 }}>Mín. 5 · Máx. 20 · Recomendado: 12</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 4 — Precios y rubros
// ─────────────────────────────────────────────────────────────────────────
function Step4({ form, set, errors, nivel, nCuotas, matFinal, cuotasFinal, descuento }) {
  const [nuevoRubro, setNuevoRubro] = React.useState({ nombre:'', monto:0, obligatorio:false });

  const addRubro = () => {
    if (!nuevoRubro.nombre) return;
    set('rubrosExtra', [...form.rubrosExtra, { ...nuevoRubro, id: Date.now() }]);
    setNuevoRubro({ nombre:'', monto:0, obligatorio:false });
  };

  const removeRubro = (id) => set('rubrosExtra', form.rubrosExtra.filter(r => r.id !== id));

  return (
    <div>
      <SectionTitle>Disponibilidad</SectionTitle>
      <label style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, cursor:'pointer', padding:'12px 14px', background:'var(--surface-2)', borderRadius:'var(--r-md)', border:`2px solid ${form.disponibleInscripcion ? nivel.color : 'var(--line)'}` }}>
        <Toggle value={form.disponibleInscripcion} onChange={v => set('disponibleInscripcion', v)} color={nivel.color} />
        <div>
          <div style={{ fontWeight:700, fontSize:13 }}>Disponible para inscripción pública</div>
          <div style={{ fontSize:11, color:'var(--ink-3)' }}>Aparece en el formulario de inscripción para nuevos estudiantes</div>
        </div>
      </label>

      <SectionTitle>Matrícula</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, marginBottom:16, alignItems:'center' }}>
        <MontoInput value={form.matricula} onChange={v => set('matricula', v)} label="Monto de matrícula" />
        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>
          <Toggle value={form.matriculaObligatoria} onChange={v => set('matriculaObligatoria',v)} color={nivel.color} />
          Obligatoria
        </label>
      </div>

      <SectionTitle>Cuota mensual</SectionTitle>
      <MontoInput value={form.cuota} onChange={v => set('cuota', v)} label="Monto por cuota" />
      <div style={{ fontSize:11, color:'var(--ink-3)', marginBottom:16 }}>
        × {nCuotas} cuotas = <strong>{fmtMoney(form.cuota * nCuotas)}</strong> por nivel
      </div>

      <SectionTitle>Certificados por nivel</SectionTitle>
      <div style={{ fontSize:11, color:'var(--ink-3)', marginBottom:12 }}>
        Monto del certificado por cada nivel seleccionado. Nunca reciben descuento de becas.
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
        {form.niveles.map(k => {
          const m = NIVEL_META[k];
          return (
            <div key={k} style={{ display:'grid', gridTemplateColumns:'1fr 160px', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--surface-2)', borderRadius:'var(--r-md)', borderLeft:`4px solid ${m.color}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:16 }}>{m.emoji}</span>
                <span style={{ fontWeight:600, fontSize:13 }}>{m.nombre}</span>
                <span style={{ fontSize:11, color:'var(--ink-3)' }}>· Certificado de nivel</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--r-md)', overflow:'hidden' }}>
                <span style={{ padding:'8px 10px', background:'var(--bg-deep)', color:'var(--ink-3)', fontSize:12, fontWeight:700, borderRight:'1px solid var(--line)' }}>₡</span>
                <input type="number" value={form.certificadosPorNivel[k]||0}
                  onChange={e => set('certificadosPorNivel', {...form.certificadosPorNivel, [k]: Number(e.target.value)})}
                  style={{ flex:1, border:'none', outline:'none', padding:'8px 10px', fontFamily:'var(--f-mono)', fontSize:13, background:'transparent', width:80 }} />
              </div>
            </div>
          );
        })}
      </div>
      {form.niveles.length === 4 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 160px', alignItems:'center', gap:12, padding:'10px 14px', background:'color-mix(in srgb, var(--an-navy) 6%, white)', borderRadius:'var(--r-md)', borderLeft:'4px solid var(--an-navy)', marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16 }}>🎓</span>
            <span style={{ fontWeight:600, fontSize:13, color:'var(--an-navy-ink)' }}>Título del Programa Completo</span>
            <span style={{ fontSize:11, color:'var(--ink-3)' }}>· Solo si cursa los 4 niveles sin convalidar</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--r-md)', overflow:'hidden' }}>
            <span style={{ padding:'8px 10px', background:'var(--bg-deep)', color:'var(--ink-3)', fontSize:12, fontWeight:700, borderRight:'1px solid var(--line)' }}>₡</span>
            <input type="number" value={form.certificadoPrograma}
              onChange={e => set('certificadoPrograma', Number(e.target.value))}
              style={{ flex:1, border:'none', outline:'none', padding:'8px 10px', fontFamily:'var(--f-mono)', fontSize:13, background:'transparent', width:80 }} />
          </div>
        </div>
      )}
      <div style={{ fontSize:11, color:'var(--ink-3)', marginBottom:20 }}>Los certificados no reciben descuento de becas.</div>

      <SectionTitle>Rubros adicionales</SectionTitle>
      <label style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, cursor:'pointer' }}>
        <Toggle value={form.toeic} onChange={v => set('toeic',v)} color={nivel.color} />
        <div>
          <div style={{ fontWeight:600, fontSize:13 }}>Incluir Prueba TOEIC</div>
          <div style={{ fontSize:11, color:'var(--ink-3)' }}>Reconocida internacionalmente · se puede incluir en proforma CONAPE</div>
        </div>
        {form.toeic && (
          <div style={{ marginLeft:'auto' }}>
            <input type="number" value={form.toeicMonto} onChange={e => set('toeicMonto', Number(e.target.value))}
              style={{ width:110, padding:'6px 10px', border:'1px solid var(--line)', borderRadius:8, fontFamily:'var(--f-mono)' }} />
          </div>
        )}
      </label>

      {form.rubrosExtra.map(r => (
        <div key={r.id} style={{ display:'flex', gap:10, alignItems:'center', padding:'8px 12px', background:'var(--surface-2)', borderRadius:8, marginBottom:6 }}>
          <div style={{ flex:1, fontSize:13, fontWeight:500 }}>{r.nombre}</div>
          <div style={{ fontFamily:'var(--f-mono)', fontSize:13 }}>{fmtMoney(r.monto)}</div>
          {r.obligatorio && <span style={{ fontSize:10, fontWeight:700, color:'var(--an-granate)', background:'color-mix(in srgb, var(--an-granate) 10%, white)', padding:'2px 6px', borderRadius:4 }}>OBLIGATORIO</span>}
          <button onClick={() => removeRubro(r.id)} style={{ background:'none', border:'none', color:'var(--ink-3)', cursor:'pointer', fontSize:16 }}>×</button>
        </div>
      ))}

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr auto auto', gap:8, alignItems:'center', padding:'10px 12px', background:'var(--surface-2)', borderRadius:8, marginBottom:20 }}>
        <input placeholder="Nombre del rubro" value={nuevoRubro.nombre} onChange={e => setNuevoRubro(r => ({...r, nombre:e.target.value}))}
          style={{ padding:'7px 10px', border:'1px solid var(--line)', borderRadius:6, fontFamily:'inherit' }} />
        <input type="number" placeholder="Monto" value={nuevoRubro.monto||''} onChange={e => setNuevoRubro(r => ({...r, monto:Number(e.target.value)}))}
          style={{ padding:'7px 10px', border:'1px solid var(--line)', borderRadius:6, fontFamily:'var(--f-mono)' }} />
        <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
          <input type="checkbox" checked={nuevoRubro.obligatorio} onChange={e => setNuevoRubro(r => ({...r, obligatorio:e.target.checked}))} />
          Obligatorio
        </label>
        <button onClick={addRubro} className="btn btn-ghost" style={{ fontSize:12 }}>+ Agregar</button>
      </div>

      <SectionTitle>Becas disponibles</SectionTitle>
      <div style={{ fontSize:11, color:'var(--ink-3)', marginBottom:10 }}>
        Solo una beca activa por grupo. Aplica a matrícula y cuotas, nunca al certificado.
      </div>
      {[
        ['none', 'Sin beca', '0%', ''],
        ['impacta', 'Beca Impacta', '25%', 'Descuento en matrícula y cuotas'],
        ['mujer', 'Beca Mujer', '50%', 'Descuento en matrícula y cuotas'],
        ['custom', 'Beca personalizada', '', 'Configura nombre y porcentaje'],
      ].map(([k,l,pct,desc]) => (
        <label key={k} style={{
          display:'flex', gap:12, padding:'10px 14px', borderRadius:'var(--r-md)',
          border:`2px solid ${form.beca===k ? nivel.color : 'var(--line)'}`,
          background: form.beca===k ? `color-mix(in srgb, ${nivel.color} 6%, white)` : 'var(--surface)',
          cursor:'pointer', marginBottom:8, alignItems:'center',
        }}>
          <input type="radio" checked={form.beca===k} onChange={() => set('beca',k)} />
          <div style={{ flex:1 }}>
            <span style={{ fontWeight:700, fontSize:13 }}>{l}</span>
            {pct && <span style={{ marginLeft:8, fontFamily:'var(--f-mono)', fontWeight:700, color: nivel.color }}>{pct}</span>}
            {desc && <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>{desc}</div>}
          </div>
        </label>
      ))}
      {form.beca==='custom' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8, padding:'12px 14px', background:'var(--surface-2)', borderRadius:'var(--r-md)' }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', display:'block', marginBottom:4 }}>Nombre de la beca</label>
            <input value={form.becaCustomNombre} onChange={e => set('becaCustomNombre',e.target.value)}
              placeholder="Ej: Beca Comunidad" style={{ width:'100%', padding:'8px 10px', border:'1px solid var(--line)', borderRadius:6, fontFamily:'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', display:'block', marginBottom:4 }}>Porcentaje de descuento</label>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="range" min={5} max={100} step={5} value={form.becaCustomPct} onChange={e => set('becaCustomPct',Number(e.target.value))}
                style={{ flex:1, accentColor: nivel.color }} />
              <span style={{ fontFamily:'var(--f-mono)', fontWeight:700, fontSize:16, color: nivel.color, minWidth:40 }}>{form.becaCustomPct}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FinanceSidebar({ form, nivel, nCuotas, matFinal, cuotasFinal, totalNivel, totalPrograma, descuento }) {
  const becaLabel = form.beca==='none' ? null : form.beca==='impacta' ? 'Beca Impacta' : form.beca==='mujer' ? 'Beca Mujer' : form.becaCustomNombre || 'Beca personalizada';
  const extras = form.rubrosExtra.filter(r => r.obligatorio);

  return (
    <div style={{ borderLeft:'1px solid var(--line)', padding:'28px 20px', background:'var(--surface-2)', overflowY:'auto' }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:14 }}>
        Resumen financiero
      </div>
      <FinRow label="Matrícula" val={fmtMoney(form.matriculaObligatoria ? form.matricula : 0)} muted={!form.matriculaObligatoria} />
      <FinRow label={`Cuotas (×${nCuotas})`} val={fmtMoney(form.cuota * nCuotas)} />
      {extras.map(r => <FinRow key={r.id} label={r.nombre} val={fmtMoney(r.monto)} />)}
      {form.toeic && <FinRow label="TOEIC" val={fmtMoney(form.toeicMonto)} />}
      <div style={{ borderTop:'1px solid var(--line)', margin:'10px 0' }} />
      <FinRow label="Total nivel (sin cert.)" val={fmtMoney((form.matriculaObligatoria?form.matricula:0) + form.cuota*nCuotas)} bold />
      <FinRow label="Certificado (opcional)" val={fmtMoney(form.certificado)} muted />
      <FinRow label="Total programa (4 lvls)" val={fmtMoney(((form.matriculaObligatoria?form.matricula:0)+form.cuota*nCuotas)*4 + form.certificado*4)} bold muted />

      {becaLabel && descuento > 0 && (
        <>
          <div style={{ borderTop:'2px solid var(--ok)', margin:'14px 0 10px' }} />
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ok)', marginBottom:10 }}>
            {becaLabel} (−{Math.round(descuento*100)}%)
          </div>
          <FinRow label="Matrícula con beca" val={fmtMoney(matFinal)} green />
          <FinRow label={`Cuotas con beca (×${nCuotas})`} val={fmtMoney(cuotasFinal)} green />
          <div style={{ borderTop:'1px solid var(--ok)', margin:'10px 0' }} />
          <FinRow label="Total nivel con beca" val={fmtMoney(totalNivel)} bold green />
        </>
      )}

      <div style={{ marginTop:18, padding:'10px 12px', background:'var(--surface)', borderRadius:'var(--r-md)', border:'1px solid var(--line)' }}>
        <div style={{ fontFamily:'var(--f-serif)', fontSize:24, fontWeight:500, color: nivel.color, letterSpacing:'-0.02em' }}>
          {fmtMoney(totalNivel)}
        </div>
        <div style={{ fontSize:10, color:'var(--ink-3)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>
          Total a cobrar por nivel
        </div>
      </div>
    </div>
  );
}

function FinRow({ label, val, bold, muted, green }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', fontSize: bold ? 13 : 12, marginBottom:5,
      opacity: muted && !bold ? 0.6 : 1, fontWeight: bold ? 700 : 400,
      color: green ? 'var(--ok)' : 'var(--ink)',
    }}>
      <span style={{ color: green ? 'var(--ok)' : 'var(--ink-2)' }}>{label}</span>
      <span style={{ fontFamily:'var(--f-mono)' }}>{val}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PASO 5 — Cronograma automático
// ─────────────────────────────────────────────────────────────────────────
function Step5({ form, set, nivel }) {
  const { cronograma } = form;
  const [vista, setVista] = React.useState('completo');
  const [mesFoco, setMesFoco] = React.useState(null);
  const [lecSelec, setLecSelec] = React.useState(null);

  React.useEffect(() => {
    if (cronograma.length && !mesFoco) {
      const f = cronograma[0].fecha;
      setMesFoco({ year: f.getFullYear(), month: f.getMonth() });
    }
  }, [cronograma.length]);

  if (!cronograma.length) {
    return (
      <div style={{ textAlign:'center', padding:60, color:'var(--ink-3)' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>⚙️</div>
        <div>Volvé al paso anterior para generar el cronograma.</div>
      </div>
    );
  }

  const fin = cronograma[cronograma.length-1].fecha;
  const fechaMap = {};
  cronograma.forEach(l => { fechaMap[l.fecha.toISOString().slice(0,10)] = l; });

  const icanSet = new Set();
  if (form.modelo === 'ina') {
    let cur = new Date(cronograma[0].fecha);
    const finD = new Date(fin);
    while (cur <= finD) {
      const dow = cur.getDay();
      const diff = (5 - dow + 7) % 7;
      const vie = new Date(cur);
      vie.setDate(cur.getDate() + diff);
      const iso = vie.toISOString().slice(0,10);
      if (vie <= finD && !FERIADOS_CR_2026.has(iso) && !fechaMap[iso]) icanSet.add(iso);
      cur.setDate(cur.getDate() + 7);
    }
  }

  const TSTYLE = {
    normal:   { bg:'var(--an-navy)',    tc:'white',   lbl:'Lec'  },
    oral:     { bg:'var(--an-granate)', tc:'white',   lbl:'Oral' },
    escrito:  { bg:'var(--danger)',     tc:'white',   lbl:'Esc'  },
    progress: { bg:'var(--an-gold)',    tc:'#3A2600', lbl:'PC'   },
    ican:     { bg:'#6B4FA0',          tc:'white',   lbl:'ICAN' },
  };

  const meses = [];
  {
    const ini = new Date(cronograma[0].fecha.getFullYear(), cronograma[0].fecha.getMonth(), 1);
    const finM = new Date(fin.getFullYear(), fin.getMonth(), 1);
    let cur = new Date(ini);
    while (cur <= finM) {
      meses.push({ year: cur.getFullYear(), month: cur.getMonth() });
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
  }

  const DIAS_HDR = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

  function MesGrid({ year, month }) {
    const primer = new Date(year, month, 1);
    const ultimo = new Date(year, month + 1, 0);
    const celdas = [];
    const cur = new Date(primer);
    cur.setDate(1 - primer.getDay());
    for (let i = 0; i < 42; i++) { celdas.push(new Date(cur)); cur.setDate(cur.getDate()+1); }
    const nombre = primer.toLocaleDateString('es-CR',{month:'long',year:'numeric'});
    return (
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:16, fontWeight:500, color:'var(--an-navy-ink)', textTransform:'capitalize' }}>{nombre}</div>
          {vista === 'completo' && (
            <button onClick={() => { setMesFoco({year,month}); setVista('mes'); }} className="btn btn-ghost" style={{ fontSize:11, padding:'4px 10px' }}>Ver mes →</button>
          )}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1, marginBottom:1 }}>
          {DIAS_HDR.map(d => <div key={d} style={{ fontSize:9, fontWeight:700, textAlign:'center', color:'var(--ink-3)', padding:'3px 0', letterSpacing:'0.05em' }}>{d}</div>)}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
          {celdas.map((dia, idx) => {
            const iso = dia.toISOString().slice(0,10);
            const esMes = dia.getMonth() === month;
            const lec = fechaMap[iso];
            const esICAN = icanSet.has(iso);
            const esFer = FERIADOS_CR_2026.has(iso);
            const tipo = lec ? lec.tipo : esICAN ? 'ican' : null;
            const ts = tipo ? TSTYLE[tipo] : null;
            return (
              <div key={idx} onClick={() => lec && setLecSelec(lec)} style={{
                minHeight: vista==='completo' ? 40 : 56, borderRadius:5, padding:'3px 4px',
                background: !esMes ? 'transparent' : esFer ? 'color-mix(in srgb, var(--line) 25%, white)' : ts ? ts.bg : 'var(--surface-2)',
                border:`1px solid ${!esMes?'transparent': ts?ts.bg:'var(--line)'}`,
                opacity: !esMes ? 0.25 : 1, cursor: lec ? 'pointer' : 'default',
                display:'flex', flexDirection:'column', gap:2,
              }}>
                <div style={{ fontSize:10, fontWeight: ts?700:400, color: ts?ts.tc: esFer?'var(--ink-3)':'var(--ink)', lineHeight:1 }}>{dia.getDate()}</div>
                {ts && <div style={{ fontSize:8, fontWeight:700, color:ts.tc, background:'rgba(0,0,0,0.18)', borderRadius:3, padding:'1px 3px', alignSelf:'flex-start', lineHeight:1.4 }}>
                  {tipo==='ican'?'I CAN': `${ts.lbl}${lec?' '+String(lec.n).padStart(2,'0'):''}`}
                </div>}
                {esFer && esMes && <div style={{ fontSize:7, color:'var(--ink-3)' }}>Fer.</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const mesesMostrar = vista === 'completo' ? meses : (mesFoco ? [mesFoco] : []);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:`color-mix(in srgb, ${nivel.color} 6%, white)`, border:`1px solid ${nivel.color}`, borderRadius:'var(--r-md)', marginBottom:14 }}>
        <div style={{ fontSize:12, color:'var(--ink-2)' }}>
          <strong>{cronograma.length} lecciones</strong>
          {form.modelo==='ina' && <> + <strong>~{Math.min(icanSet.size,16)} I CAN</strong> (viernes predeterminado)</>}
          &nbsp;·&nbsp; {fmtCR(cronograma[0].fecha)} → {fmtCR(fin)}
        </div>
        <div style={{ fontSize:10, color:'var(--ink-3)' }}>Clic en lección para editar fecha</div>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
        {[['completo',`Curso completo (${meses.length} meses)`],['mes','Mes específico']].map(([v,l]) => (
          <button key={v} onClick={() => setVista(v)} style={{
            padding:'5px 12px', borderRadius:'var(--r-pill)',
            border:`2px solid ${vista===v?nivel.color:'var(--line)'}`,
            background: vista===v?`color-mix(in srgb, ${nivel.color} 10%, white)`:'var(--surface)',
            fontWeight: vista===v?700:500, fontSize:11, cursor:'pointer',
            color: vista===v?nivel.color:'var(--ink-2)',
          }}>{l}</button>
        ))}
        {vista === 'mes' && mesFoco && (
          <div style={{ display:'flex', gap:4, marginLeft:'auto', alignItems:'center' }}>
            <button onClick={() => setMesFoco(f => { const d=new Date(f.year,f.month-1,1); return {year:d.getFullYear(),month:d.getMonth()}; })} className="btn btn-ghost" style={{ padding:'4px 8px' }}>‹</button>
            <span style={{ fontSize:11, color:'var(--ink-2)', minWidth:120, textAlign:'center', textTransform:'capitalize' }}>
              {new Date(mesFoco.year,mesFoco.month,1).toLocaleDateString('es-CR',{month:'long',year:'numeric'})}
            </span>
            <button onClick={() => setMesFoco(f => { const d=new Date(f.year,f.month+1,1); return {year:d.getFullYear(),month:d.getMonth()}; })} className="btn btn-ghost" style={{ padding:'4px 8px' }}>›</button>
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap' }}>
        {[['normal','Lección'],['oral','Examen Oral'],['escrito','Examen Escrito'],['progress','Progress Check'],['ican','Club I CAN']].map(([k,l]) => (
          <span key={k} style={{ display:'flex', gap:4, alignItems:'center', fontSize:10 }}>
            <span style={{ width:10, height:10, borderRadius:3, background:TSTYLE[k].bg, display:'inline-block' }} />
            <span style={{ color:'var(--ink-2)' }}>{l}</span>
          </span>
        ))}
      </div>

      <div style={{ maxHeight:460, overflowY:'auto', paddingRight:4 }}>
        {mesesMostrar.map(m => <MesGrid key={`${m.year}-${m.month}`} year={m.year} month={m.month} />)}
      </div>

      {lecSelec && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,8,20,0.5)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setLecSelec(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', padding:28, maxWidth:380, width:'100%', boxShadow:'0 16px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
              <div style={{ width:44, height:44, borderRadius:'var(--r-md)', background:TSTYLE[lecSelec.tipo].bg, display:'flex', alignItems:'center', justifyContent:'center', color:TSTYLE[lecSelec.tipo].tc, fontWeight:700, fontSize:18 }}>
                {String(lecSelec.n).padStart(2,'0')}
              </div>
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)' }}>Lección {lecSelec.n}</div>
                <div style={{ fontFamily:'var(--f-serif)', fontSize:18, fontWeight:500 }}>
                  {lecSelec.tipo==='oral'?'Examen Oral':lecSelec.tipo==='escrito'?'Examen Escrito':lecSelec.tipo==='progress'?'Progress Check':'Clase regular'}
                </div>
              </div>
            </div>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--ink-2)', display:'block', marginBottom:6 }}>Mover a otra fecha</label>
            <input type="date" defaultValue={lecSelec.fecha.toISOString().slice(0,10)}
              onChange={e => {
                set('cronograma', cronograma.map(l => l.n===lecSelec.n ? {...l, fecha:new Date(e.target.value+'T00:00:00')} : l));
                setLecSelec({...lecSelec, fecha:new Date(e.target.value+'T00:00:00')});
              }}
              style={{ padding:'10px 12px', border:`2px solid ${TSTYLE[lecSelec.tipo].bg}`, borderRadius:'var(--r-md)', fontFamily:'inherit', fontSize:14, marginBottom:16, display:'block', width:'100%' }} />
            <div style={{ fontSize:11, color:'var(--ink-2)', marginBottom:16 }}>
              {SYLLABUS_BASICO_I_DATA[lecSelec.n] || 'Contenido según plan de estudios'}
            </div>
            <button onClick={() => setLecSelec(null)} className="btn btn-ghost" style={{ width:'100%' }}>← Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Contenido simplificado de lecciones
const SYLLABUS_BASICO_I_DATA = {
  1:'U1 · Alfabeto y saludos',2:'U1 · Presentaciones',3:'U2 · Objetos y posesivos',
  4:'U2 · Progress Check U1–U2',5:'U3 · Ciudades y países',6:'U3 · Personalidad',
  7:'U4 · Ropa y colores',8:'U4 · Progress Check U3–U4',10:'U5 · La hora',
  11:'U5 · Rutinas y frecuencia',12:'U6 · De compras',13:'U6 · Progress Check U5–U6',
  14:'U7 · Planes de fin de semana',15:'U7 · Tareas y ocio',16:'U8 · Progress Check U7–U8',
  19:'U9 · Comida y hábitos',20:'U10 · Rutinas',21:'U10 · Present simple',
  22:'U11 · Ubicaciones',23:'U12 · Can/can\'t',24:'U12 · Progress Check',
  26:'U13 · Planes futuros',27:'U14 · Past simple',28:'U14 · Progress Check',
  29:'U15 · Lugares de origen',30:'U16 · Must/mustn\'t',
};

// ─────────────────────────────────────────────────────────────────────────
// PASO 6 — Resumen y confirmación
// ─────────────────────────────────────────────────────────────────────────
function Step6({ form, nivel, nCuotas, matFinal, cuotasFinal, totalNivel, totalPrograma, descuento, onConfirm, grupos, docentesActivos }) {
  const docente = (docentesActivos||[]).find(d => d.id === form.docente);
  const { code } = generarCodigoGrupo(form, grupos);
  const becaLabel = form.beca==='none' ? 'Sin beca' : form.beca==='impacta' ? 'Beca Impacta 25%' : form.beca==='mujer' ? 'Beca Mujer 50%' : `${form.becaCustomNombre} ${form.becaCustomPct}%`;
  const cr = form.cronograma;

  return (
    <div>
      {/* Código autogenerado */}
      <div style={{
        padding:'20px 24px', marginBottom:20,
        background:'linear-gradient(135deg, var(--an-navy) 0%, #1A3E75 100%)',
        borderRadius:'var(--r-lg)', color:'white', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', right:-20, top:-20, width:120, height:120, borderRadius:'50%', background: nivel.color, opacity:0.2 }} />
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', opacity:0.75 }}>Código del grupo asignado</div>
        <div style={{ fontFamily:'var(--f-mono)', fontSize:42, fontWeight:700, letterSpacing:'0.04em', marginTop:4 }}>{code}</div>
        <div style={{ fontSize:12, opacity:0.8 }}>Listo para recibir estudiantes al confirmar</div>
      </div>

      {/* Tarjeta resumen */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {[
          ['Modelo', form.modelo==='ina' ? 'Con INA · 128h' : 'Sin INA · 96h'],
          ['Nivel', `${nivel.emoji} ${nivel.nombre}`],
          ['Modalidad', form.modalidad==='super_intensivo' ? 'Súper Intensivo (2 cuotas)' : 'Intensivo (4 cuotas)'],
          ['Docente', docente?.nombre || '—'],
          ['Horario', `${form.dias} · ${form.horaInicio}`],
          ['Fecha inicio', form.fechaInicio ? fmtCR(new Date(form.fechaInicio)) : '—'],
          ['Fin estimado', cr.length ? fmtCR(cr[cr.length-1].fecha) : '—'],
          ['Capacidad', `${form.capacidad} estudiantes`],
          ['Entrega', form.entrega],
          ['Beca', becaLabel],
          ['Precio cuota', fmtMoney(form.cuota)],
          ['Precio matrícula', form.matriculaObligatoria ? fmtMoney(form.matricula) : 'Opcional'],
          ['Disponible inscripción', form.disponibleInscripcion ? 'Sí — aparece en formulario' : 'No — solo admin'],
        ].map(([k,v],i) => (
          <div key={i} style={{ padding:'10px 14px', background:'var(--surface-2)', borderRadius:'var(--r-md)', borderLeft:`4px solid ${nivel.color}` }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)' }}>{k}</div>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)', marginTop:3 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Precios */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-h">
          <div className="card-title" style={{ fontSize:16 }}>Estructura de precios</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
          <PrecioBox label={`Matrícula${!form.matriculaObligatoria?' (opcional)':''}`}
            base={form.matricula} final={form.matriculaObligatoria ? matFinal : 0}
            desc={descuento} color={nivel.color} />
          <PrecioBox label={`Cuotas ×${nCuotas}`}
            base={form.cuota*nCuotas} final={cuotasFinal}
            desc={descuento} color={nivel.color} />
          <PrecioBox label="Certificado (opcional)"
            base={form.certificado} final={form.certificado}
            desc={0} color={nivel.color} muted />
        </div>
        {form.toeic && (
          <div style={{ marginTop:10, fontSize:12, color:'var(--ink-2)', padding:'8px 12px', background:'var(--surface-2)', borderRadius:8 }}>
            + TOEIC: <strong>{fmtMoney(form.toeicMonto)}</strong>
          </div>
        )}
        <div style={{ marginTop:14, paddingTop:14, borderTop:'2px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:13, color:'var(--ink-2)' }}>Total por nivel</div>
          <div style={{ fontFamily:'var(--f-serif)', fontSize:28, fontWeight:500, color: nivel.color }}>{fmtMoney(totalNivel)}</div>
        </div>
      </div>

      {/* Cronograma */}
      <div style={{
        padding:'12px 16px', background:'color-mix(in srgb, var(--ok) 8%, white)',
        border:'1px solid var(--ok)', borderRadius:'var(--r-md)', marginBottom:20,
        display:'flex', alignItems:'center', gap:12,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <div>
          <strong style={{ color:'var(--ok)' }}>Cronograma confirmado · 32 lecciones</strong>
          <span style={{ fontSize:12, color:'var(--ink-2)', marginLeft:8 }}>
            {cr.length ? `Del ${fmtMes(cr[0].fecha)} al ${fmtCR(cr[cr.length-1].fecha)}` : ''}
          </span>
        </div>
      </div>

      {/* Confirmación */}
      <label style={{
        display:'flex', gap:14, padding:'16px 18px',
        border:`2px solid ${form.confirmado ? 'var(--ok)' : 'var(--line)'}`,
        borderRadius:'var(--r-md)', cursor:'pointer',
        background: form.confirmado ? 'color-mix(in srgb, var(--ok) 5%, white)' : 'var(--surface)',
        transition:'all .2s',
      }}>
        <input type="checkbox" checked={form.confirmado} onChange={onConfirm} style={{ width:20, height:20, marginTop:1, accentColor:'var(--ok)' }} />
        <div>
          <div style={{ fontWeight:700, fontSize:14, color:'var(--ink)' }}>
            He revisado y confirmo la apertura de este grupo
          </div>
          <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:3 }}>
            Al confirmar, el grupo <strong>{code}</strong> quedará activo y disponible para matrícula de estudiantes.
          </div>
        </div>
      </label>
    </div>
  );
}

function PrecioBox({ label, base, final, desc, color, muted }) {
  const hayDesc = desc > 0 && !muted;
  return (
    <div style={{ padding:'12px 14px', background:'var(--surface-2)', borderRadius:'var(--r-md)', opacity: muted ? 0.7 : 1 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:4 }}>{label}</div>
      {hayDesc && <div style={{ fontSize:11, textDecoration:'line-through', color:'var(--ink-3)', fontFamily:'var(--f-mono)' }}>{fmtMoney(base)}</div>}
      <div style={{ fontFamily:'var(--f-mono)', fontWeight:700, fontSize:18, color: hayDesc ? 'var(--ok)' : color || 'var(--ink)', letterSpacing:'-0.02em' }}>
        {fmtMoney(final)}
      </div>
      {hayDesc && <div style={{ fontSize:10, color:'var(--ok)', fontWeight:700 }}>−{Math.round(desc*100)}%</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────
function SectionTitle({ children, error }) {
  return (
    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
      color: error ? 'var(--danger)' : 'var(--an-granate)', marginBottom:10, marginTop:4 }}>
      {children}{error && <span style={{ textTransform:'none', letterSpacing:0, fontWeight:400, marginLeft:8 }}>{error}</span>}
    </div>
  );
}
function ErrMsg({ children }) {
  return <div style={{ fontSize:11, color:'var(--danger)', marginTop:-6, marginBottom:10 }}>{children}</div>;
}
function MontoInput({ value, onChange, label }) {
  return (
    <div style={{ marginBottom:8 }}>
      {label && <div style={{ fontSize:11, fontWeight:600, color:'var(--ink-2)', marginBottom:4 }}>{label}</div>}
      <div style={{ display:'flex', alignItems:'center', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--r-md)', overflow:'hidden' }}>
        <span style={{ padding:'10px 12px', background:'var(--bg-deep)', color:'var(--ink-3)', fontSize:13, fontWeight:700, borderRight:'1px solid var(--line)' }}>₡</span>
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
          style={{ flex:1, border:'none', outline:'none', padding:'10px 12px', fontFamily:'var(--f-mono)', fontSize:14, background:'transparent' }} />
      </div>
    </div>
  );
}
function Toggle({ value, onChange, color }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width:36, height:20, borderRadius:10,
      background: value ? (color||'var(--ok)') : 'var(--line-2)',
      position:'relative', cursor:'pointer', transition:'background .15s', flexShrink:0,
    }}>
      <div style={{
        position:'absolute', top:2, left: value ? 18 : 2, width:16, height:16,
        borderRadius:'50%', background:'white', boxShadow:'0 1px 3px rgba(0,0,0,0.2)', transition:'left .15s',
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AdminGruposView — tabla + botón que abre wizard
// ─────────────────────────────────────────────────────────────────────────
function AdminGruposView() {
  const { data, loading, error, refetch } = useAdminDashboard();
  const [showWizard, setShowWizard] = React.useState(false);
  const [newGroupCode, setNewGroupCode] = React.useState(null);

  const handleCrear = (code) => { setNewGroupCode(code); refetch(); };

  if (loading || error) return <AdminLoadingState loading={loading} error={error} />;
  const grupos = data?.grupos || [];

  return (
    <div>
      <PageHeader
        kicker="Operación"
        title={<>Gestión de <em>Grupos</em></>}
        sub="Todos los grupos activos · Período 2026"
        right={
          <button className="btn btn-primary" onClick={() => setShowWizard(true)}>
            <Icon name="plus" size={14} className="" /> Abrir nuevo grupo
          </button>
        }
      />

      {newGroupCode && (
        <div style={{
          padding:'14px 18px', marginBottom:20,
          background:'color-mix(in srgb, var(--ok) 8%, white)',
          border:'1px solid var(--ok)', borderRadius:'var(--r-md)',
          display:'flex', alignItems:'center', gap:12,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <div>
            <strong style={{ color:'var(--ok)' }}>¡Grupo {newGroupCode} creado!</strong>
            <span style={{ fontSize:12, color:'var(--ink-2)', marginLeft:8 }}>Activo y disponible para matrículas.</span>
          </div>
          <button onClick={() => setNewGroupCode(null)} style={{ marginLeft:'auto', background:'none', border:'none', color:'var(--ink-3)', cursor:'pointer', fontSize:18 }}>×</button>
        </div>
      )}

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table className="table-soft">
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Nivel</th>
              <th>Docente</th>
              <th style={{ textAlign:'center' }}>Ocupación</th>
              <th>Horario</th>
              <th>Programa</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((g,i) => {
              const cap = g.cap || g.capacidad || 12;
              const studs = g.estudiantes ?? g.students ?? 0;
              const pct  = cap > 0 ? (studs/cap)*100 : 0;
              const nivel = g.nivel || g.level || '—';
              const teacher = g.docente || g.teacher || '—';
              const sch = g.schedule || g.horario || '—';
              return (
                <tr key={i}>
                  <td style={{ fontFamily:'var(--f-mono)', fontWeight:600 }}>{g.code}</td>
                  <td>
                    <Chip tone={String(nivel).includes('Básico I')?'gold':String(nivel).includes('Básico II')?'red':String(nivel).includes('Intermedio I')?'navy':'green'}>
                      {nivel}
                    </Chip>
                  </td>
                  <td style={{ fontSize:13 }}>{teacher}</td>
                  <td style={{ textAlign:'center' }}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:60, height:6, background:'var(--bg-deep)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%', background: pct>=100?'var(--an-granate)':'var(--ok)' }} />
                      </div>
                      <span style={{ fontFamily:'var(--f-mono)', fontWeight:600 }}>{studs}/{cap}</span>
                    </div>
                  </td>
                  <td style={{ fontSize:12 }}>{sch}</td>
                  <td style={{ fontSize:11, color:'var(--ink-3)' }}>{g.programa || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showWizard && (
        <WizardCrearGrupo
          grupos={grupos}
          onClose={() => setShowWizard(false)}
          onCrear={handleCrear}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// VISTAS EXISTENTES — sin cambios
// ─────────────────────────────────────────────────────────────────────────

function AdminDashboard({ setActive }) {
  const { data, loading, error } = useAdminDashboard();
  const { novedades, ultimoSync, resumen: conapeResumen } = useNovedadesConape();
  const [syncing, setSyncing] = React.useState(false);
  const handleSyncConape = async () => {
    setSyncing(true);
    try {
      const r = await fetch(`${SCRIPT_URL_AV}?fn=sincronizarCONAPE`).then(r => r.json());
      if (r.ok) window.location.reload();
      else { alert('Error: ' + (r.error || 'sin detalle')); setSyncing(false); }
    } catch (e) {
      alert('Error: ' + e.message);
      setSyncing(false);
    }
  };
  if (loading || error) return <AdminLoadingState loading={loading} error={error} />;
  const k       = data?.kpis    || {};
  const grupos  = data?.grupos  || [];
  const alertas = data?.alertas || [];
  const fmtMoney2 = (n) => {
    if (n == null || isNaN(n)) return '—';
    if (n >= 1_000_000) return '₡' + (n/1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return '₡' + (n/1_000).toFixed(0) + 'K';
    return '₡' + Number(n).toLocaleString('es-CR');
  };
  const altas = alertas.filter(a => a.level==='high').length;
  return (
    <div>
      <div className="hero">
        <div className="watermark-a">A</div>
        <div className="hero-grid">
          <div>
            <div className="hero-kicker">Panel administrativo · {new Date().toLocaleDateString('es-CR',{month:'long',year:'numeric'})}</div>
            <h1 className="hero-h1">Academia <em>Norteamericana</em></h1>
            <div className="hero-sub">Vista ejecutiva · {k.grupos ?? grupos.length} grupos activos · {k.docentes ?? '—'} docentes · {k.activos ?? '—'} estudiantes matriculados</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              <Chip tone="granate" dot>Período activo</Chip>
              <Chip tone="navy">INA Resolución 2519</Chip>
              <Chip tone="gold">CONAPE aprobado</Chip>
              <button onClick={handleSyncConape} disabled={syncing} style={{
                background: '#1565C0', color: 'white', border: 'none',
                borderRadius: 8, padding: '8px 16px',
                cursor: syncing ? 'wait' : 'pointer', opacity: syncing ? 0.7 : 1,
                fontSize: 13, fontWeight: 600,
              }}>
                {syncing ? '⏳ Sincronizando…' : '🔄 Sincronizar CONAPE'}
              </button>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12 }}>
            {[
              [fmtMoney2(k.ingresoTotal), 'Ingreso total', 'Período actual', 'var(--an-granate)'],
              [k.activos ?? '—',  'Estudiantes activos', '', 'var(--an-navy-ink)'],
              [k.grupos  ?? grupos.length, 'Grupos abiertos',     '', 'var(--an-navy-ink)'],
              [k.docentes ?? '—', 'Docentes activos',    '', 'var(--an-navy-ink)'],
            ].map(([n,l,s,c],i) => (
              <div key={i} style={{ background:'var(--surface-2)', border:'1px solid var(--line)', borderRadius:'var(--r-md)', padding:14 }}>
                <div style={{ fontFamily:'var(--f-serif)', fontSize:34, fontWeight:500, color:c, letterSpacing:'-0.03em', lineHeight:1 }}>{n}</div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)', marginTop:6 }}>{l}</div>
                <div style={{ fontSize:11, color:'var(--ok)', fontWeight:600, marginTop:4 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-h">
          <div className="card-title">Alertas operativas</div>
          <Chip tone="red" dot>{altas} alta prioridad</Chip>
        </div>
        <div style={{ display:'grid', gap:10 }}>
          {alertas.length === 0 && (
            <div style={{ padding:20, textAlign:'center', color:'var(--ink-3)', fontSize:13 }}>Sin alertas operativas en este momento.</div>
          )}
          {alertas.map((a, i) => (
            <div key={i} style={{ display:'flex', gap:14, padding:'12px 14px', borderRadius:'var(--r-md)', background: a.level==='high' ? 'color-mix(in srgb, var(--danger) 7%, white)' : a.level==='med' ? 'color-mix(in srgb, var(--warn) 7%, white)' : 'var(--surface-2)', borderLeft: `4px solid ${a.level==='high'?'var(--danger)':a.level==='med'?'var(--warn)':'var(--ink-3)'}` }}>
              <Icon name="bell" size={20} className="" />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{a.title}</div>
                <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:2 }}>{a.detail}</div>
              </div>
              <div style={{ fontSize:11, color:'var(--ink-3)', whiteSpace:'nowrap' }}>{a.date}</div>
              <button className="btn btn-ghost">Atender</button>
            </div>
          ))}
        </div>
      </div>

      {/* Panel CONAPE */}
      <section style={{ marginTop: 24, marginBottom: 20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700 }}>CONAPE — Novedades</h3>
          {ultimoSync && (
            <span style={{ fontSize:11, color:'var(--ink-3)' }}>
              Último sync: {ultimoSync}
            </span>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
          <div style={{ background:'var(--surface)', borderRadius:10, padding:'12px 16px' }}>
            <div style={{ fontSize:11, color:'var(--ink-3)', fontWeight:600 }}>Total CONAPE</div>
            <div style={{ fontSize:24, fontWeight:800 }}>{conapeResumen.total ?? '—'}</div>
          </div>
          <div style={{ background:'color-mix(in srgb,var(--warn) 10%,white)', borderRadius:10, padding:'12px 16px' }}>
            <div style={{ fontSize:11, color:'var(--ink-3)', fontWeight:600 }}>Sin vincular</div>
            <div style={{ fontSize:24, fontWeight:800, color:'var(--warn)' }}>{conapeResumen.sinVincular || 0}</div>
          </div>
          <div style={{ background:'color-mix(in srgb,var(--danger) 10%,white)', borderRadius:10, padding:'12px 16px' }}>
            <div style={{ fontSize:11, color:'var(--ink-3)', fontWeight:600 }}>Sin desembolso</div>
            <div style={{ fontSize:24, fontWeight:800, color:'var(--danger)' }}>{conapeResumen.sinDesembolso || 0}</div>
          </div>
        </div>

        {novedades.length === 0 ? (
          <div style={{ textAlign:'center', color:'var(--ink-3)', padding:24, fontSize:13 }}>
            Sin novedades desde el último sync
          </div>
        ) : novedades.map((n, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'10px 14px', borderRadius:8, marginBottom:6,
            background:'var(--surface)', borderLeft:'3px solid #1565C0',
          }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:13 }}>{n.nombre}</div>
              <div style={{ fontSize:11, color:'var(--ink-3)' }}>
                {n.grupo || 'Sin grupo'} · Cédula {n.cedula}
              </div>
            </div>
            <div style={{
              background:'#E3F2FD', color:'#1565C0',
              borderRadius:6, padding:'3px 10px', fontSize:11, fontWeight:700,
            }}>
              Desembolso {n.desembolso} · {n.periodo}
            </div>
          </div>
        ))}
      </section>

      <div className="grid-2">
        <div className="card">
          <div className="card-h"><div className="card-title">Distribución por nivel</div><button className="btn btn-ghost" onClick={()=>setActive('grupos')}>Ver grupos →</button></div>
          {[['Básico I',6,62,'var(--lvl-basic1)'],['Básico II',5,54,'var(--lvl-basic2)'],['Intermedio I',6,72,'var(--lvl-inter1)'],['Intermedio II',3,22,'var(--lvl-inter2)'],['Conversacional',2,18,'var(--an-navy)']].map(([l,gr,st,c],i) => {
            const totalStudents=62+54+72+22+18; const pct=(st/totalStudents)*100;
            return (<div key={i} style={{ padding:'10px 0', borderBottom: i<4?'1px solid var(--line)':'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                <div><span style={{ fontWeight:600, fontSize:13 }}>{l}</span><span style={{ fontSize:11, color:'var(--ink-3)', marginLeft:8 }}>{gr} grupos</span></div>
                <div style={{ fontWeight:700, fontFamily:'var(--f-mono)' }}>{st}</div>
              </div>
              <div style={{ height:6, background:'var(--bg-deep)', borderRadius:3, overflow:'hidden' }}><div style={{ width:`${pct}%`, height:'100%', background:c }} /></div>
            </div>);
          })}
        </div>
        <div className="card">
          <div className="card-h"><div className="card-title">Docentes destacados</div><button className="btn btn-ghost" onClick={()=>setActive('docentes')}>Ver todos →</button></div>
          {[{n:'Ricardo Arias Arroyo',gr:3,r:'94%',p:88},{n:'Ana Castro Mora',gr:2,r:'92%',p:91},{n:'Sofía Méndez',gr:2,r:'89%',p:85},{n:'Kevin Brown',gr:2,r:'87%',p:83}].map((t,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom: i<3?'1px solid var(--line)':'none' }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:['var(--an-granate)','var(--an-navy)','var(--an-gold)','#5E8C5E'][i], color:'white', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{t.n.split(' ').slice(0,2).map(w=>w[0]).join('')}</div>
              <div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:13 }}>{t.n}</div><div style={{ fontSize:11, color:'var(--ink-3)' }}>{t.gr} grupos · {t.r} retención · Prom. {t.p}</div></div>
              <Chip tone="green" dot>Activo</Chip>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FinanzasView() {
  return (
    <div>
      <PageHeader kicker="Contabilidad" title={<>Panel <em>Financiero</em></>} sub="Ingresos, cobros pendientes y proyección del período" right={<button className="btn btn-ghost"><Icon name="download" size={14} className="" /> Exportar</button>} />
      <div className="grid-4" style={{ marginBottom:24 }}>
        <Stat label="Ingresos Abr" num="24.1" suffix="M" sub="↑ 12% vs. Mar" subTone="ok" pct={92} color="var(--ok)" />
        <Stat label="Por cobrar" num="2.8" suffix="M" sub="34 facturas" subTone="warn" pct={12} color="var(--warn)" />
        <Stat label="Proyectado May" num="25.5" suffix="M" sub="Base: renovaciones" pct={98} color="var(--an-navy)" />
        <Stat label="Morosidad" num="3" suffix="%" sub="Bajo" subTone="ok" pct={3} color="var(--an-granate)" />
      </div>
      <div className="card"><div className="card-h"><div className="card-title">Ingresos mensuales</div></div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:12, alignItems:'flex-end', height:200, paddingTop:20 }}>
          {[{m:'Nov',v:18.2},{m:'Dic',v:19.8},{m:'Ene',v:20.1},{m:'Feb',v:22.6},{m:'Mar',v:21.5},{m:'Abr',v:24.1,cur:true}].map((b,i) => {
            const h=(b.v/25)*100;
            return <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, height:'100%', justifyContent:'flex-end' }}>
              <div style={{ fontSize:11, fontWeight:700, fontFamily:'var(--f-mono)' }}>{b.v}M</div>
              <div style={{ width:'100%', maxWidth:60, height:`${h}%`, background: b.cur ? 'linear-gradient(to top, var(--an-granate), var(--an-red))' : 'var(--an-navy)', borderRadius:'6px 6px 0 0', minHeight:20 }} />
              <div style={{ fontSize:11, color:'var(--ink-3)', fontWeight:600 }}>{b.m}</div>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}

function AdminPlaceholderView({ title }) {
  return (
    <div>
      <PageHeader kicker="En desarrollo" title={<>{title}</>} sub="Este módulo está en construcción." />
      <div className="card" style={{ textAlign:'center', padding:60, borderStyle:'dashed' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>⚙️</div>
        <div style={{ fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500, color:'var(--an-navy-ink)' }}>Próximamente</div>
      </div>
    </div>
  );
}

Object.assign(window, { AdminDashboard, AdminGruposView, FinanzasView, AdminPlaceholderView });
