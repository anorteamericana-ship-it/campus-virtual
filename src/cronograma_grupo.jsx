/* global React */
// ── CronogramaGrupo v2 — Calendario mensual de lecciones ────────────────
// Lee CALENDARIO_LECCIONES vía Apps Script.
// Roles: student / teacher / admin / superadmin
// • student / teacher → grupo fijo (sessionStorage.an_usuario.grupo)
// • admin / superadmin → selector de grupo

const SCRIPT_URL_CG = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';

const GRUPOS_DISPONIBLES = [
  { cod:'B1-LM69-C3-0125', niveles:['B1','B2','I1'], docente:'Rachelle Cruz',    dias:'LM', programa:'SIN_INA' },
  { cod:'B1-KJ69-C3-0225', niveles:['B1','B2','I1'], docente:'Emily Vega',       dias:'KJ', programa:'SIN_INA' },
  { cod:'B1-L469-B6-0325', niveles:['B1','B2'],      docente:'John Álvarez',     dias:'LJ', programa:'SIN_INA' },
  { cod:'B1-KJ94-B6-0425', niveles:['B1','B2'],      docente:'John Álvarez',     dias:'KJ', programa:'SIN_INA' },
  { cod:'B1-LM69-C1-0126', niveles:['B1'],           docente:'Ana Salazar',      dias:'LM', programa:'SIN_INA' },
  { cod:'B1-L469-B1-0226', niveles:['B1','B2'],      docente:'Sulivany Medina',  dias:'LJ', programa:'SIN_INA' },
  { cod:'B1-SA94-C1-0326', niveles:['B1'],           docente:'John Álvarez',     dias:'SA', programa:'SIN_INA' },
  { cod:'B1-L469-B2-0426', niveles:['B1'],           docente:'Yendry Aguilar',   dias:'LJ', programa:'SIN_INA' },
  { cod:'B1-LM69-C2-0526', niveles:['B1'],           docente:'Por definir',      dias:'LM', programa:'INA', ican_dias:'VIE', ican_hora:'18:00-20:00' },
  { cod:'B1-LM94-B3-0626', niveles:['B1'],           docente:'Por definir',      dias:'LM', programa:'INA', ican_dias:'SAB', ican_hora:'08:00-10:00' },
];

const NIVEL_COLOR_CG  = { B1:'#E5A823', B2:'#E8372A', I1:'#2B7FC1', I2:'#4CAF50' };
const NIVEL_LABEL_CG  = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
const NIVEL_OFFSET    = { B1:0, B2:32, I1:64, I2:96 };

const TIPO_BADGE = {
  CLASE:           '',
  PROGRESS_CHECK:  'PC',
  EVAL_ORAL:       'Oral',
  EVAL_ESCRITO:    'Escrito',
  ICAN:            'I CAN',
};
const TIPO_LABEL_LARGO = {
  CLASE:           'Clase regular',
  PROGRESS_CHECK:  'Progress Check',
  EVAL_ORAL:       'Examen Oral',
  EVAL_ESCRITO:    'Examen Escrito',
  ICAN:            'Sesión I CAN',
};

// Color base por nivel
const NIVEL_BASE = {
  B1: { dark:'#9A6A00', mid:'#E5A823', light:'#FFF8DC', lighter:'#FFFDF0' },
  B2: { dark:'#8B1A10', mid:'#E8372A', light:'#FDECEA', lighter:'#FFF5F4' },
  I1: { dark:'#0D47A1', mid:'#2B7FC1', light:'#E8F1FD', lighter:'#F0F7FF' },
  I2: { dark:'#1B5E20', mid:'#4CAF50', light:'#EBF5EB', lighter:'#F5FBF5' },
};

// Paleta de celda — devuelve {bg, fg, accent}
// v4.22: las lecciones CERRADAS usan el MISMO color que los segmentos llenos
// de la barra de progreso superior (base.dark) para unificar visualmente.
function paletaCelda(estado, tipo, nivel) {
  const base = NIVEL_BASE[nivel] || NIVEL_BASE.B1;

  if (estado === 'FERIADO') return { bg:'#FDECEA', fg:'#B71C1C', accent:'#B71C1C' };
  if (estado === 'HOY')     return { bg: base.mid, fg:'#FFFFFF', accent: base.dark };

  // v4.16: I CAN sessions — verde
  if (tipo === 'ICAN') {
    if (estado === 'CERRADA') return { bg:'#1B5E20', fg:'#FFFFFF', accent:'#1B5E20' };
    return { bg:'#F1F8E9', fg:'#2E7D32', accent:'#4CAF50' };
  }

  if (estado === 'CERRADA') {
    if (tipo === 'EVAL_ORAL' || tipo === 'EVAL_ESCRITO') {
      return { bg:'#7B5600', fg:'#FFFFFF', accent:'#7B5600' };
    }
    // ★ FIX: antes era { bg: base.light, fg: base.dark } — ahora coincide con
    //   la barra de progreso (base.dark) para consistencia visual.
    return { bg: base.dark, fg:'#FFFFFF', accent: base.dark };
  }

  // CALCULADA / PROGRAMADA / PRE_CAMPUS / LIBRE (todo lo no-dado)
  if (tipo === 'EVAL_ORAL' || tipo === 'EVAL_ESCRITO') {
    return { bg:'#FFFDE7', fg:'#9B6A00', accent:'#F9A825' };
  }
  return { bg: base.lighter, fg: base.mid, accent: base.mid + '60' };
}

// Color para segmento de progress bar
function colorProgreso(estado, tipo, nivel) {
  const base = NIVEL_BASE[nivel] || NIVEL_BASE.B1;
  if (estado === 'HOY')       return base.mid;
  if (estado === 'FERIADO')   return '#FFCA28';
  if (estado === 'CERRADA')   return base.dark;
  if (tipo === 'EVAL_ORAL' || tipo === 'EVAL_ESCRITO') return '#F9A825';
  return base.light;
}

// Feriados CR — fallback para mostrar nombres en panel
const FERIADOS_CR_NAMES = {
  '2026-01-01':'Año Nuevo',
  '2026-04-02':'Jueves Santo',
  '2026-04-03':'Viernes Santo',
  '2026-04-11':'Día de Juan Santamaría',
  '2026-05-01':'Día del Trabajo',
  '2026-07-25':'Anexión de Guanacaste',
  '2026-08-02':'Día de la Virgen de los Ángeles',
  '2026-08-15':'Día de la Madre',
  '2026-09-15':'Día de la Independencia',
  '2026-12-25':'Navidad',
};

const MESES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MES_CORTO     = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DIA_INICIAL   = ['L','M','M','J','V','S','D']; // semana inicia lunes

function parseISO(iso) { return iso ? new Date(iso + 'T00:00:00') : null; }
function isoOf(d) { return d.toISOString().slice(0,10); }
function fmtDDMMM(iso) {
  const d = parseISO(iso); if (!d) return '—';
  return `${String(d.getDate()).padStart(2,'0')}/${MES_CORTO[d.getMonth()]}`;
}
function fmtLargo(iso) {
  const d = parseISO(iso); if (!d) return '—';
  return `${String(d.getDate()).padStart(2,'0')}/${MES_CORTO[d.getMonth()]}/${d.getFullYear()}`;
}
function diasEntre(iso) {
  const d = parseISO(iso); if (!d) return null;
  const h = new Date(); h.setHours(0,0,0,0);
  return Math.round((d - h) / 86400000);
}
function idLeccion(nivel, num) {
  return 'L' + String((NIVEL_OFFSET[nivel] || 0) + num).padStart(3,'0');
}

// ─────────────────────────────────────────────────────────────────────────
// MOCK — para preview sin backend
// ─────────────────────────────────────────────────────────────────────────
function mockLecciones(codGrupo, nivel) {
  const offsetNivel = NIVEL_OFFSET[nivel] || 0;
  const parts = codGrupo.split('-');
  const diasCode = (parts[1] || 'LM').replace(/\d/g, '');
  const esSabado = diasCode === 'SA';

  const PROG = new Set([4,8,13,16,21,24,28,30]);
  const ORAL = new Set([9,17,25,31]);
  const ESCR = new Set([18,32]);
  const FER  = new Set(Object.keys(FERIADOS_CR_NAMES));
  const DOW  = { LM:[1,3], KJ:[2,4], LJ:[1,2,3,4], SA:[6] }[diasCode] || [1,3];
  const DOWLBL = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

  const start = new Date('2026-01-12T00:00:00');
  start.setDate(start.getDate() + offsetNivel * (DOW.length >= 4 ? 1 : 3));
  const out = [];
  let cur = new Date(start);
  let lec = 1;
  const hoyISO = '2026-05-15';
  while (lec <= 32) {
    const iso = isoOf(cur);
    if (DOW.includes(cur.getDay())) {
      if (FER.has(iso)) {
        // v4.15: feriado no consume número de lección — se inserta sin número
        out.push({ leccion: null, fecha: iso, dia: DOWLBL[cur.getDay()],
                   turno:'', tipo:'CLASE', estado:'FERIADO' });
        // lec NO incrementa — la lección se corre al siguiente día hábil
      } else {
        let tipo = 'CLASE';
        if (PROG.has(lec)) tipo = 'PROGRESS_CHECK';
        else if (ORAL.has(lec)) tipo = 'EVAL_ORAL';
        else if (ESCR.has(lec)) tipo = 'EVAL_ESCRITO';
        const estado = iso < hoyISO ? 'CERRADA' : iso === hoyISO ? 'HOY' : 'PROGRAMADA';
        if (esSabado) {
          // dos turnos mismo día
          out.push({ leccion:lec, fecha:iso, dia:DOWLBL[6],
                     turno:'Mañana (9am-12md)', tipo, estado });
          lec++;
          if (lec <= 32) {
            let t2 = 'CLASE';
            if (PROG.has(lec)) t2 = 'PROGRESS_CHECK';
            else if (ORAL.has(lec)) t2 = 'EVAL_ORAL';
            else if (ESCR.has(lec)) t2 = 'EVAL_ESCRITO';
            out.push({ leccion:lec, fecha:iso, dia:DOWLBL[6],
                       turno:'Tarde (1pm-4pm)', tipo:t2, estado });
            lec++;
          }
        } else {
          out.push({ leccion:lec, fecha:iso, dia:DOWLBL[cur.getDay()],
                     turno:'', tipo, estado });
          lec++;
        }
      }
    } else if (FER.has(iso)) {
      // feriado en día que normalmente sería de clase: solo si DOW lo cubre
    }
    cur.setDate(cur.getDate() + 1);
    if (out.length > 80) break; // safety
  }

  // v4.16: generar sesiones I CAN para grupos INA
  const grupoMeta = GRUPOS_DISPONIBLES.find(g => g.cod === codGrupo);
  const esINA = grupoMeta?.programa === 'INA';
  if (esINA && grupoMeta?.ican_dias) {
    const DOW_ICAN = { 'VIE': 5, 'SAB': 6, 'LUN': 1, 'MAR': 2, 'MIE': 3, 'JUE': 4 };
    const diaCAN = DOW_ICAN[grupoMeta.ican_dias] || 5;
    const DOWLBL2 = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    // Generar 16 sesiones I CAN comenzando desde la fecha de inicio del grupo + 1 semana
    let curCAN = new Date(start);
    curCAN.setDate(curCAN.getDate() + 7);
    // Avanzar al primer día I CAN
    while (curCAN.getDay() !== diaCAN) curCAN.setDate(curCAN.getDate() + 1);
    for (let ic = 1; ic <= 16; ic++) {
      const isoCAN = isoOf(curCAN);
      if (!FER.has(isoCAN)) {
        out.push({
          leccion:    ic,
          fecha:      isoCAN,
          dia:        DOWLBL2[curCAN.getDay()],
          turno:      grupoMeta.ican_hora || '',
          tipo:       'ICAN',
          estado:     isoCAN < hoyISO ? 'CERRADA' : isoCAN === hoyISO ? 'HOY' : 'PROGRAMADA',
          esICAN:     true,
        });
      }
      curCAN.setDate(curCAN.getDate() + 7);
    }
  }

  return out;
}

function mockDetalle(nivel, num, tipo) {
  const titulos = {
    CLASE: ['Greetings & Introductions', 'Personal Information', 'Daily Routines', 'Hobbies & Interests',
            'Family & Friends', 'Food & Drinks', 'Travel Plans', 'Past Experiences'],
    PROGRESS_CHECK: 'Progress Check — repaso de unidades',
    EVAL_ORAL: 'Oral Test ' + Math.ceil(num/8),
    EVAL_ESCRITO: 'Written Test ' + Math.ceil(num/16),
  };
  const titulo = tipo === 'CLASE' ? titulos.CLASE[num % titulos.CLASE.length] : titulos[tipo];
  return {
    ok: true,
    leccion: {
      id: idLeccion(nivel, num),
      nivel: NIVEL_LABEL_CG[nivel].toUpperCase(),
      unidad: `UNIT ${Math.ceil(num/2)}`,
      titulo,
      tipo: tipo === 'CLASE' ? 'PRACTICA' : tipo === 'PROGRESS_CHECK' ? 'EVALUACION_FORMATIVA' : 'PRACTICA+EVALUACION',
      objetivo: tipo === 'EVAL_ORAL'
        ? 'Evaluar la producción ORAL en inglés basada en las unidades cubiertas. El estudiante demostrará fluidez, precisión gramatical y vocabulario apropiado.'
        : tipo === 'PROGRESS_CHECK'
        ? 'Revisar el progreso de los estudiantes en las unidades anteriores mediante actividades formativas en pares.'
        : 'Desarrollar las cuatro habilidades del idioma (escuchar, hablar, leer y escribir) según los contenidos de la unidad.',
      speaking: 'Pair work, role play, free conversation',
      grammar: 'Present simple, articles, possessive adjectives',
      pronunciacion: 'Word stress, sentence rhythm',
      writing: 'Sentence-level writing, simple paragraphs',
      pdf_drive_id: num % 3 === 0 ? '194St9CmIBLDbsTex39MnuGjOhe74MJWE' : '',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
function CronogramaGrupo({ rol = 'admin' }) {
  const usr = React.useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('an_usuario') || 'null'); } catch { return null; }
  }, []);

  const esAdmin    = rol === 'admin' || rol === 'superadmin';
  const esSuperadmin = rol === 'superadmin';
  const esStudent  = rol === 'student';
  const grupoInicial = esAdmin
    ? GRUPOS_DISPONIBLES[0].cod
    : (usr?.grupo || GRUPOS_DISPONIBLES[0].cod);

  const [codGrupo, setCodGrupo] = React.useState(grupoInicial);
  const meta = GRUPOS_DISPONIBLES.find(g => g.cod === codGrupo)
    || { cod: codGrupo, niveles:['B1'], docente:'—', dias:'LM' };
  const niveles = meta.niveles;

  // ── CONTROL DE ACCESO POR NIVEL (solo student) ─────────────────────
  // Reglas:
  //   • student: solo niveles con estatus CA / APR / CNV son "desbloqueados"
  //   • teacher / admin: acceso total
  const nivelesEstatus = (esStudent && usr?.niveles_estatus) ? usr.niveles_estatus : null;
  const nivelActivoStudent = esStudent ? (usr?.nivel_activo || '') : '';

  const nivelDesbloqueado = React.useCallback((n) => {
    if (!esStudent) return true;
    if (!nivelesEstatus) return true; // sin datos: no bloqueamos (fail-open en dev)
    const e = nivelesEstatus[n];
    return e === 'CA' || e === 'APR' || e === 'CNV';
  }, [esStudent, nivelesEstatus]);

  // Nivel inicial: para student, preferir nivel_activo si está en el grupo
  const nivelInicial = (esStudent && nivelActivoStudent && niveles.includes(nivelActivoStudent))
    ? nivelActivoStudent
    : niveles[0];
  const [nivel, setNivel] = React.useState(nivelInicial);
  const nivelBloqueado = !nivelDesbloqueado(nivel);

  React.useEffect(() => {
    if (!niveles.includes(nivel)) setNivel(niveles[0]);
  }, [codGrupo]); // eslint-disable-line

  // Data
  const [lecciones, setLecciones]   = React.useState([]);
  const [loading, setLoading]       = React.useState(true);
  const [error, setError]           = React.useState(null);
  const [usandoMock, setUsandoMock] = React.useState(false);

  const cargar = React.useCallback(() => {
    setLoading(true); setError(null);
    if (nivel === 'ICAN') {
      // Usar las sesiones I CAN del mock
      const grupoMeta = GRUPOS_DISPONIBLES.find(g => g.cod === codGrupo);
      if (grupoMeta?.programa === 'INA') {
        const mock = mockLecciones(codGrupo, 'B1');
        setLecciones(mock.filter(l => l.esICAN));
      } else {
        setLecciones([]);
      }
      setUsandoMock(true);
      setLoading(false);
      return;
    }
    return fetch(`${SCRIPT_URL_CG}?fn=getFechasGrupo&cod_grupo=${encodeURIComponent(codGrupo)}&nivel=${encodeURIComponent(nivel)}`)
      .then(r => r.json())
      .then(d => {
        if (d?.ok && Array.isArray(d.lecciones) && d.lecciones.length) {
          setLecciones(d.lecciones); setUsandoMock(false);
        } else {
          setLecciones(mockLecciones(codGrupo, nivel)); setUsandoMock(true);
        }
      })
      .catch(() => {
        setLecciones(mockLecciones(codGrupo, nivel)); setUsandoMock(true);
      })
      .finally(() => setLoading(false));
  }, [codGrupo, nivel]);

  React.useEffect(() => { cargar(); }, [cargar]);

  // Selección de lección (panel lateral)
  const [selLec, setSelLec]         = React.useState(null);
  const [detalle, setDetalle]       = React.useState(null);
  const [cargandoDet, setCargandoDet] = React.useState(false);

  // v4.22: Cobertura puntual de lecciones (admin)
  // Override local por id_leccion — sobrevive a re-fetches del detalle.
  const [coberturas, setCoberturas]     = React.useState({});
  const [modalCobertura, setModalCobertura] = React.useState(null); // { selLec } | null
  const [modalEditarCerrada, setModalEditarCerrada] = React.useState(null); // { selLec } | null
  const [toast, setToast]               = React.useState(null);     // { msg, kind } | null

  const showToast = React.useCallback((msg, kind = 'ok') => {
    setToast({ msg, kind, t: Date.now() });
    setTimeout(() => setToast(t => (t && Date.now() - t.t >= 3800) ? null : t), 4000);
  }, []);

  const onCoberturaAsignada = React.useCallback((idLec, docente_cobertura, docente_anterior) => {
    setCoberturas(prev => ({
      ...prev,
      [idLec]: { docente_cobertura, docente_anterior, ts: Date.now() },
    }));
    setModalCobertura(null);
    showToast(`Cobertura asignada: la lección la dará ${docente_cobertura}`, 'ok');
  }, [showToast]);

  // Auto-seleccionar HOY o primera PROGRAMADA/CALCULADA al cargar
  React.useEffect(() => {
    if (!lecciones.length) return;
    const sel = lecciones.find(l => l.estado === 'HOY')
             || lecciones.find(l => l.estado === 'PROGRAMADA')
             || lecciones.find(l => l.estado === 'CALCULADA')
             || lecciones[0];
    setSelLec(sel);
  }, [lecciones]);

  React.useEffect(() => {
    if (!selLec) { setDetalle(null); return; }
    if (selLec.estado === 'FERIADO') { setDetalle(null); return; }
    // ✱ Si el nivel está bloqueado para el estudiante: NO llamar getLeccionDetalle
    if (nivelBloqueado) { setDetalle(null); return; }
    setCargandoDet(true);
    const id = idLeccion(nivel, selLec.leccion);
    fetch(`${SCRIPT_URL_CG}?fn=getLeccionDetalle&id_leccion=${id}`)
      .then(r => r.json())
      .then(d => {
        if (d?.ok && d.leccion) setDetalle(d.leccion);
        else setDetalle(mockDetalle(nivel, selLec.leccion, selLec.tipo).leccion);
      })
      .catch(() => setDetalle(mockDetalle(nivel, selLec.leccion, selLec.tipo).leccion))
      .finally(() => setCargandoDet(false));
  }, [selLec, nivel, nivelBloqueado]);

  // Stats
  const stats = React.useMemo(() => {
    const esFutura     = l => l.estado === 'CALCULADA' || l.estado === 'PROGRAMADA';
    const cerradas     = lecciones.filter(l => l.estado === 'CERRADA').length;
    const feriados     = lecciones.filter(l => l.estado === 'FERIADO').length;
    const calculadas   = lecciones.filter(esFutura).length;
    const hoy          = lecciones.filter(l => l.estado === 'HOY').length;
    const proxima      = lecciones.find(l => esFutura(l) || l.estado === 'HOY');
    const primera      = lecciones[0];
    const ultima       = [...lecciones].reverse()
                          .find(l => l.estado === 'CERRADA' || esFutura(l) || l.estado === 'HOY');
    return { cerradas, feriados, calculadas, hoy, proxima, primera, ultima, total: lecciones.length };
  }, [lecciones]);

  const nivelColor = NIVEL_COLOR_CG[nivel] || NIVEL_COLOR_CG.B1;

  // Construir lista de meses a renderizar
  const meses = React.useMemo(() => {
    if (!lecciones.length) return [];
    const fechas = lecciones.map(l => parseISO(l.fecha)).filter(Boolean);
    if (!fechas.length) return [];
    const fMin = new Date(Math.min(...fechas));
    const fMax = new Date(Math.max(...fechas));
    const out = [];
    const cur = new Date(fMin.getFullYear(), fMin.getMonth(), 1);
    const fin = new Date(fMax.getFullYear(), fMax.getMonth(), 1);
    while (cur <= fin) {
      out.push(new Date(cur));
      cur.setMonth(cur.getMonth() + 1);
    }
    return out;
  }, [lecciones]);

  // Mapa fecha → lecciones (puede haber 2 para SA)
  const mapaLecciones = React.useMemo(() => {
    const m = {};
    lecciones.forEach(l => {
      if (!m[l.fecha]) m[l.fecha] = [];
      m[l.fecha].push(l);
    });
    return m;
  }, [lecciones]);

  return (
    <div data-screen-label="Cronograma de grupo" style={{ position:'relative' }}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'flex-end',
        flexWrap:'wrap', gap:14, marginBottom:18,
      }}>
        <div>
          <div style={{
            fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase',
            color:'var(--ink-3)', marginBottom:6,
          }}>
            Calendario de lecciones · {esAdmin ? 'Administración' : rol === 'teacher' ? 'Vista docente' : 'Mis lecciones'}
          </div>
          <h1 style={{
            fontFamily:'var(--f-serif)', fontWeight:500, letterSpacing:'-0.025em',
            fontSize:32, lineHeight:1.05, margin:0, color:'var(--ink)',
          }}>
            {rol === 'student' ? 'Mis lecciones' : 'Cronograma de grupo'}
          </h1>
          <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:6 }}>
            {rol === 'student'
              ? 'Calendario de tus 32 lecciones, con fechas reales y material.'
              : 'Vista única de las 32 lecciones — reemplaza los spreadsheets por grupo.'}
            {usandoMock && (
              <span style={{
                marginLeft:10, padding:'2px 8px', fontSize:10, fontWeight:700,
                background:'color-mix(in srgb, var(--an-gold) 18%, white)',
                color:'#7B5600', borderRadius:'var(--r-pill)', letterSpacing:'0.06em',
              }}>VISTA PREVIA · datos simulados</span>
            )}
          </div>
        </div>

        {/* Selector grupo */}
        <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
          {esAdmin ? (
            <div>
              <div style={labelStyle}>Grupo</div>
              <select value={codGrupo} onChange={e => setCodGrupo(e.target.value)} style={selectStyle}>
                {GRUPOS_DISPONIBLES.map(g => (
                  <option key={g.cod} value={g.cod}>{g.cod} · {g.docente}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <div style={labelStyle}>{rol === 'teacher' ? 'Grupo asignado' : 'Mi grupo'}</div>
              <div style={{
                padding:'10px 14px', background:'var(--surface)',
                border:'1.5px solid var(--line)', borderRadius:'var(--r-md)',
                fontFamily:'var(--f-mono)', fontWeight:600, fontSize:13,
                color:'var(--ink)', minWidth:200,
              }}>
                {codGrupo}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── NIVEL TABS ─────────────────────────────────────────────────── */}
      {niveles.length > 1 && (
        <div style={{
          display:'flex', gap:6, marginBottom:14, padding:5,
          background:'var(--bg-deep)', borderRadius:'var(--r-md)', width:'fit-content',
        }}>
          {niveles.map(n => {
            const c = NIVEL_COLOR_CG[n];
            const active = n === nivel;
            const locked = !nivelDesbloqueado(n);
            return (
              <button key={n} onClick={() => setNivel(n)} style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'8px 16px', borderRadius:'var(--r-sm)', border:'none',
                background: active ? 'var(--surface)' : 'transparent',
                boxShadow: active ? 'var(--sh-1)' : 'none',
                cursor:'pointer', fontWeight:600, fontSize:13,
                color: active ? 'var(--ink)' : 'var(--ink-3)',
                opacity: locked && !active ? 0.6 : 1,
                transition:'background .15s',
              }}>
                <span style={{ width:10, height:10, borderRadius:3, background:c,
                               flexShrink:0, opacity: active ? 1 : 0.5 }} />
                <span style={{ fontFamily:'var(--f-mono)', fontWeight:700 }}>{n}</span>
                <span style={{ opacity: active ? 1 : 0.7 }}>· {NIVEL_LABEL_CG[n]}</span>
                {locked && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                       style={{ marginLeft:2, color:'var(--ink-3)' }} aria-label="Bloqueado">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                )}
              </button>
            );
          })}
          {meta.programa === 'INA' && (
            <button
              onClick={() => setNivel('ICAN')}
              style={{
                padding:'6px 14px', borderRadius:'var(--r-sm)', fontWeight:700, fontSize:12,
                border:'none', cursor:'pointer', transition:'all .15s',
                background: nivel === 'ICAN' ? '#4CAF50' : 'transparent',
                color:       nivel === 'ICAN' ? 'white'   : 'var(--ink-3)',
              }}>
              I CAN
            </button>
          )}
        </div>
      )}

      {/* ── PROGRESS BAR ───────────────────────────────────────────────── */}
      <ProgressBar32 lecciones={lecciones} stats={stats} loading={loading}
                     onClickSeg={l => setSelLec(l)} selLec={selLec} nivel={nivel} />

      {error && (
        <div style={errorBoxStyle}>
          <span>⚠ {error}</span>
          <button onClick={cargar} className="btn btn-ghost"
                  style={{ padding:'6px 12px', fontSize:12 }}>Reintentar</button>
        </div>
      )}

      {/* ── CALENDARIO + PANEL ─────────────────────────────────────────── */}
      <div style={{
        display:'grid', gridTemplateColumns:'minmax(0, 1fr) 360px',
        gap:18, marginTop:14, alignItems:'start',
      }}>
        {/* Calendario */}
        <div className="card" style={{ padding:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14, flexWrap:'wrap', gap:10 }}>
            <div style={{
              fontFamily:'var(--f-serif)', fontWeight:500, fontSize:18,
              letterSpacing:'-0.01em', color:'var(--ink)',
            }}>
              Calendario · {NIVEL_LABEL_CG[nivel]}
            </div>
            <div style={{ fontSize:11, color:'var(--ink-3)' }}>
              Click sobre una lección para ver el detalle
            </div>
          </div>

          {loading ? (
            <SkeletonMeses />
          ) : !lecciones.length ? (
            <div style={{ padding:60, textAlign:'center', color:'var(--ink-3)' }}>
              No hay lecciones registradas para este nivel.
            </div>
          ) : (
            <div style={{
              display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',
              gap:18,
            }}>
              {meses.map(mes => (
                <Mes key={`${mes.getFullYear()}-${mes.getMonth()}`}
                     mes={mes}
                     mapaLecciones={mapaLecciones}
                     selLec={selLec}
                     nivel={nivel}
                     onClickLec={l => setSelLec(l)} />
              ))}
            </div>
          )}

          {/* Leyenda */}
          <Leyenda />
        </div>

        {/* Panel detalle sticky */}
        <PanelDetalle
          selLec={selLec}
          detalle={detalle}
          cargando={cargandoDet}
          nivelColor={nivelColor}
          stats={stats}
          nivel={nivel}
          codGrupo={codGrupo}
          docente={meta.docente}
          bloqueado={nivelBloqueado}
          esAdmin={esAdmin}
          rol={rol}
          codigoUsr={usr?.codigo || ''}
          grupoUsr={usr?.grupo || codGrupo}
          esSuperadmin={esSuperadmin}
          adminNombre={usr?.nombre || ''}
          cobertura={selLec ? coberturas[idLeccion(nivel, selLec.leccion)] : null}
          onPedirCobertura={() => setModalCobertura({ selLec })}
          onPedirEditarCerrada={() => setModalEditarCerrada({ selLec })}
          onCerrar={() => setSelLec(null)}
        />
      </div>

      {modalCobertura && (
        <ModalCobertura
          selLec={modalCobertura.selLec}
          codGrupo={codGrupo}
          nivel={nivel}
          docenteTitular={meta.docente}
          adminNombre={usr?.nombre || 'admin'}
          onCerrar={() => setModalCobertura(null)}
          onAsignada={onCoberturaAsignada}
        />
      )}

      {modalEditarCerrada && (
        <ModalEditarCerrada
          selLec={modalEditarCerrada.selLec}
          codGrupo={codGrupo}
          nivel={nivel}
          superadminNombre={usr?.nombre || 'superadmin'}
          onCerrar={() => setModalEditarCerrada(null)}
          onGuardado={(mensaje) => {
            setModalEditarCerrada(null);
            showToast(mensaje || 'Lección actualizada', 'ok');
            // Forzar refetch del detalle re-tocando selLec
            setSelLec(s => (s ? { ...s } : s));
          }}
        />
      )}

      {toast && (
        <div
          role="status"
          style={{
            position:'fixed', bottom:24, right:24, zIndex:1200,
            background: toast.kind === 'err' ? '#7A1F15' : '#1E4D2B',
            color:'#FFFFFF',
            padding:'12px 16px',
            borderRadius:'var(--r-md)',
            boxShadow:'0 12px 32px rgba(0,0,0,0.25)',
            display:'flex', alignItems:'center', gap:10,
            maxWidth:380, fontSize:13, fontWeight:600,
            letterSpacing:'0.01em',
          }}>
          <span style={{
            width:22, height:22, borderRadius:'50%',
            background:'rgba(255,255,255,0.18)',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
          }}>
            {toast.kind === 'err' ? '!' : '✓'}
          </span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Estilos compartidos
// ─────────────────────────────────────────────────────────────────────────
const labelStyle = {
  fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
  color:'var(--ink-3)', marginBottom:6,
};
const selectStyle = {
  padding:'10px 36px 10px 14px',
  border:'1.5px solid var(--line)',
  borderRadius:'var(--r-md)',
  background:'var(--surface)',
  fontFamily:'var(--f-mono)', fontWeight:600, fontSize:13,
  color:'var(--ink)', outline:'none', cursor:'pointer',
  minWidth:280, appearance:'none',
  backgroundImage:'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238B8178\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")',
  backgroundRepeat:'no-repeat',
  backgroundPosition:'right 12px center',
};
const errorBoxStyle = {
  marginTop:12, padding:'10px 14px', display:'flex', justifyContent:'space-between',
  alignItems:'center', gap:10,
  background:'color-mix(in srgb, var(--danger) 6%, white)',
  border:'1px solid color-mix(in srgb, var(--danger) 25%, white)',
  borderRadius:'var(--r-sm)', fontSize:12, color:'var(--danger)',
};

// ─────────────────────────────────────────────────────────────────────────
// Barra de 32 segmentos
// ─────────────────────────────────────────────────────────────────────────
function ProgressBar32({ lecciones, stats, loading, onClickSeg, selLec, nivel }) {
  // Para SA, lecciones.length puede ser >32; agrupamos por número de lección únicos
  const unicas = React.useMemo(() => {
    const seen = new Set();
    return lecciones.filter(l => {
      if (seen.has(l.leccion)) return false;
      seen.add(l.leccion); return true;
    });
  }, [lecciones]);

  return (
    <div className="card" style={{ padding:'14px 18px' }}>
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'baseline',
        marginBottom:10, gap:14, flexWrap:'wrap',
      }}>
        <div>
          <span style={{
            fontFamily:'var(--f-serif)', fontSize:22, fontWeight:500,
            letterSpacing:'-0.02em', color:'var(--ink)',
          }}>
            {stats.cerradas + stats.hoy}
          </span>
          <span style={{ fontSize:14, color:'var(--ink-3)', marginLeft:6 }}>
            de 32 lecciones dadas
          </span>
        </div>
        <div style={{ fontSize:12, color:'var(--ink-2)' }}>
          {stats.proxima ? (
            <>
              Próxima:&nbsp;
              <strong style={{ color:'var(--an-navy)', fontFamily:'var(--f-mono)' }}>
                Lec {String(stats.proxima.leccion).padStart(2,'0')}
              </strong>
              &nbsp;·&nbsp;{fmtLargo(stats.proxima.fecha)}
              <span style={{ color:'var(--ink-3)' }}>
                &nbsp;({diasEntre(stats.proxima.fecha) === 0 ? 'hoy' :
                       diasEntre(stats.proxima.fecha) === 1 ? 'mañana' :
                       `en ${diasEntre(stats.proxima.fecha)} días`})
              </span>
            </>
          ) : <span style={{ color:'var(--ink-3)' }}>Curso finalizado</span>}
        </div>
      </div>

      {loading ? (
        <div style={{ height:10, background:'var(--bg-deep)', borderRadius:4 }} />
      ) : (
        <div style={{ display:'flex', gap:2, height:10 }}>
          {unicas.map(l => (
            <div key={l.leccion}
                 onClick={() => onClickSeg(l)}
                 title={`Lec ${l.leccion} · ${fmtDDMMM(l.fecha)} · ${l.estado}`}
                 style={{
                   flex:1, height:'100%', borderRadius:2,
                   background: colorProgreso(l.estado, l.tipo, nivel),
                   cursor:'pointer',
                   boxShadow: selLec && selLec.leccion === l.leccion
                     ? '0 0 0 2px var(--ink) inset' : 'none',
                   transition: 'transform .15s',
                 }}
                 onMouseEnter={e => e.currentTarget.style.transform = 'scaleY(1.5)'}
                 onMouseLeave={e => e.currentTarget.style.transform = 'scaleY(1)'} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Mes (cuadrícula Lun-Dom)
// ─────────────────────────────────────────────────────────────────────────
function Mes({ mes, mapaLecciones, selLec, nivel, onClickLec }) {
  const year  = mes.getFullYear();
  const month = mes.getMonth();
  const primeroDelMes = new Date(year, month, 1);
  const ultimoDelMes  = new Date(year, month + 1, 0);
  // Día de semana del 1 (0=Dom, 1=Lun…); reorientamos a Lun=0
  const dowPrimero = (primeroDelMes.getDay() + 6) % 7;
  const numDias    = ultimoDelMes.getDate();
  const totalCeldas = Math.ceil((dowPrimero + numDias) / 7) * 7;

  const celdas = [];
  for (let i = 0; i < totalCeldas; i++) {
    const diaNum = i - dowPrimero + 1;
    const dentro = diaNum >= 1 && diaNum <= numDias;
    const fecha  = dentro ? new Date(year, month, diaNum) : null;
    const iso    = fecha ? isoOf(fecha) : null;
    const lecs   = iso ? (mapaLecciones[iso] || []) : [];
    celdas.push({ diaNum, dentro, iso, lecs });
  }

  return (
    <div style={{
      border:'1px solid var(--line)', borderRadius:'var(--r-md)',
      background:'var(--surface)', overflow:'hidden',
    }}>
      {/* Header del mes */}
      <div style={{
        padding:'10px 14px',
        background:'var(--surface-2)',
        borderBottom:'1px solid var(--line)',
        display:'flex', justifyContent:'space-between', alignItems:'baseline',
      }}>
        <div style={{
          fontFamily:'var(--f-serif)', fontSize:16, fontWeight:600,
          color:'var(--ink)', letterSpacing:'-0.015em',
        }}>
          {MESES_NOMBRES[month]}
        </div>
        <div style={{ fontSize:11, color:'var(--ink-3)', fontFamily:'var(--f-mono)' }}>
          {year}
        </div>
      </div>

      {/* Dow header */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)',
                    padding:'6px 4px', borderBottom:'1px solid var(--line)' }}>
        {DIA_INICIAL.map((d, i) => (
          <div key={i} style={{
            textAlign:'center', fontSize:10, fontWeight:700,
            color: i >= 5 ? 'var(--ink-3)' : 'var(--ink-2)',
            letterSpacing:'0.1em',
          }}>{d}</div>
        ))}
      </div>

      {/* Celdas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)',
                    gap:2, padding:3 }}>
        {celdas.map((c, i) => (
          <CeldaDia key={i} celda={c} selLec={selLec} nivel={nivel} onClickLec={onClickLec} />
        ))}
      </div>
    </div>
  );
}

function CeldaDia({ celda, selLec, nivel, onClickLec }) {
  const { diaNum, dentro, lecs } = celda;

  if (!dentro) {
    return <div style={{ minHeight:48 }} />;
  }
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const esFinde = ((new Date(celda.iso + 'T00:00:00')).getDay() % 7 === 0 ||
                   (new Date(celda.iso + 'T00:00:00')).getDay() === 6);

  if (!lecs.length) {
    return (
      <div style={{
        minHeight:48, padding:'4px 5px',
        background:'var(--bg-deep)', borderRadius:6,
        opacity: esFinde ? 0.6 : 1,
      }}>
        <div style={{ fontSize:10, color:'var(--ink-3)', fontWeight:600, fontFamily:'var(--f-mono)' }}>
          {diaNum}
        </div>
      </div>
    );
  }

  // 1 o 2 lecciones (caso SA)
  return (
    <div style={{
      minHeight:48,
      display:'grid',
      gridTemplateRows: lecs.length === 2 ? '1fr 1fr' : '1fr',
      gap: 2,
    }}>
      {lecs.map((lec, i) => (
        <BloqueLeccion key={i} lec={lec} diaNum={i === 0 ? diaNum : null}
                       nivel={nivel}
                       selected={selLec && selLec.fecha === lec.fecha && selLec.leccion === lec.leccion}
                       onClick={() => onClickLec(lec)} />
      ))}
    </div>
  );
}

function BloqueLeccion({ lec, diaNum, selected, onClick, nivel }) {
  const pal = paletaCelda(lec.estado, lec.tipo, nivel);
  const badge = TIPO_BADGE[lec.tipo];
  const isFeriado = lec.estado === 'FERIADO';
  const isHoy = lec.estado === 'HOY';

  return (
    <div
      onClick={onClick}
      style={{
        background: pal.bg,
        border: `1.5px solid ${selected ? pal.accent : (isHoy ? '#F57F17' : 'transparent')}`,
        borderRadius: 6,
        padding: '4px 5px',
        cursor: 'pointer',
        display:'flex', flexDirection:'column', justifyContent:'space-between',
        minHeight: 0,
        position:'relative',
        boxShadow: selected ? `0 0 0 2px ${pal.accent}` : (isHoy ? '0 0 0 1px #F57F17' : 'none'),
        transition: 'transform .12s, box-shadow .12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.97)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:2 }}>
        {diaNum != null && (
          <span style={{ fontSize:10, fontWeight:700, color: pal.fg, fontFamily:'var(--f-mono)' }}>
            {diaNum}
          </span>
        )}
        {!diaNum && <span />}
        {badge && (
          <span style={{
            fontSize:8, fontWeight:800, color:'white', background:pal.accent,
            padding:'1px 4px', borderRadius:3, letterSpacing:'0.04em',
            textTransform:'uppercase', lineHeight:1.2,
          }}>
            {badge}
          </span>
        )}
        {isHoy && !badge && (
          <span style={{
            fontSize:8, fontWeight:800, color:'white', background:'#F57F17',
            padding:'1px 4px', borderRadius:3, letterSpacing:'0.04em',
            textTransform:'uppercase', lineHeight:1.2,
          }}>HOY</span>
        )}
      </div>
      <div style={{ marginTop:'auto' }}>
        {isFeriado ? (
          <div style={{ fontSize:10, fontWeight:700, color:pal.fg, lineHeight:1.1 }}>
            🚫 Feriado
          </div>
        ) : (
          <>
            <div style={{
              fontSize:10, fontWeight:700, color:pal.fg, fontFamily:'var(--f-mono)',
              lineHeight:1.1,
            }}>
              Lec {String(lec.leccion).padStart(2,'0')}
            </div>
            {lec.turno && (
              <div style={{ fontSize:8, color:pal.fg, opacity:0.7, fontWeight:600, marginTop:1 }}>
                {lec.turno.includes('Mañana') ? '☀ AM' : '🌙 PM'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Panel de detalle (sticky a la derecha)
// ─────────────────────────────────────────────────────────────────────────
function PanelDetalle({ selLec, detalle, cargando, nivelColor, stats, nivel, codGrupo, docente, bloqueado, esAdmin, rol, codigoUsr, grupoUsr, esSuperadmin, adminNombre, cobertura, onPedirCobertura, onPedirEditarCerrada, onCerrar }) {
  return (
    <div style={{ position:'sticky', top:16, display:'flex', flexDirection:'column', gap:12 }}>

      {/* Resumen del nivel */}
      <div className="card" style={{ padding:16, overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:nivelColor }} />
        <div style={{ marginTop:4 }}>
          <div style={labelStyle}>Nivel activo</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span style={{
              fontFamily:'var(--f-mono)', fontSize:22, fontWeight:700, color:nivelColor,
            }}>{nivel}</span>
            <span style={{
              fontFamily:'var(--f-serif)', fontWeight:500, fontSize:15,
              color:'var(--ink)', letterSpacing:'-0.015em',
            }}>{NIVEL_LABEL_CG[nivel]}</span>
            {bloqueado && (
              <span style={{
                marginLeft:'auto', padding:'2px 8px', fontSize:10, fontWeight:700,
                background:'color-mix(in srgb, var(--ink-3) 15%, white)',
                color:'var(--ink-2)', borderRadius:'var(--r-pill)',
                letterSpacing:'0.06em', display:'inline-flex', alignItems:'center', gap:4,
              }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                BLOQUEADO
              </span>
            )}
          </div>
        </div>
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(3, 1fr)',
          gap:6, marginTop:12, textAlign:'center',
        }}>
          <MiniStat n={stats.cerradas + stats.hoy} l="dadas" c="#2E7D32" />
          <MiniStat n={stats.feriados}             l="feriados" c="#C67100" />
          <MiniStat n={stats.calculadas}           l="por venir" c="#1565C0" />
        </div>
      </div>

      {/* Detalle de la lección seleccionada */}
      {selLec ? (
        <DetalleLeccion
          selLec={selLec}
          detalle={detalle}
          cargando={cargando}
          nivel={nivel}
          bloqueado={bloqueado}
          esAdmin={esAdmin}
          rol={rol}
          codigoUsr={codigoUsr}
          grupoUsr={grupoUsr}
          esSuperadmin={esSuperadmin}
          cobertura={cobertura}
          docenteTitular={docente}
          onPedirCobertura={onPedirCobertura}
          onPedirEditarCerrada={onPedirEditarCerrada}
          onCerrar={onCerrar}
        />
      ) : (
        <div className="card" style={{ padding:'24px 18px', textAlign:'center' }}>
          <div style={{ fontSize:30, marginBottom:6, opacity:0.4 }}>📅</div>
          <div style={{ fontSize:12, color:'var(--ink-3)' }}>
            Seleccioná una lección del calendario para ver el detalle.
          </div>
        </div>
      )}

      {/* Footer info */}
      <div style={{
        padding:'10px 14px', background:'var(--surface-2)',
        border:'1px dashed var(--line-2)', borderRadius:'var(--r-md)',
        fontSize:10, color:'var(--ink-3)', letterSpacing:'0.04em', lineHeight:1.5,
      }}>
        Fuente: <strong style={{ fontFamily:'var(--f-mono)', color:'var(--ink-2)' }}>CALENDARIO_LECCIONES</strong><br/>
        Grupo: <strong style={{ fontFamily:'var(--f-mono)', color:'var(--ink-2)' }}>{codGrupo}</strong><br/>
        Docente: <strong style={{ color:'var(--ink-2)' }}>{docente}</strong>
      </div>
    </div>
  );
}

function DetalleLeccion({ selLec, detalle, cargando, nivel, bloqueado, esAdmin, rol, codigoUsr, grupoUsr, esSuperadmin, cobertura, docenteTitular, onPedirCobertura, onPedirEditarCerrada, onCerrar }) {
  const pal = paletaCelda(selLec.estado, selLec.tipo, nivel);
  const isFeriado = selLec.estado === 'FERIADO';
  const feriadoName = FERIADOS_CR_NAMES[selLec.fecha] || 'Feriado nacional';
  const dias = diasEntre(selLec.fecha);
  const estadoLabel =
    selLec.estado === 'CERRADA'    ? '✓ Clase dada' :
    selLec.estado === 'HOY'        ? '● Hoy' :
    selLec.estado === 'PROGRAMADA' ? '○ Programada' :
    selLec.estado === 'CALCULADA'  ? '○ Proyectada' : '🚫 Feriado CR';

  // Color "apagado" para nivel bloqueado: ignoramos la paleta normal
  const palVis = bloqueado && !isFeriado
    ? { bg:'#F2EFEA', fg:'#6A6058', accent:'#8B8178' }
    : pal;

  return (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      <div style={{ height:5, background: palVis.accent }} />
      <div style={{ padding:'14px 18px 18px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
          <div>
            <div style={{ ...labelStyle, marginBottom:4 }}>
              {isFeriado ? 'Feriado' : selLec.leccion ? `Lección ${String(selLec.leccion).padStart(2,'0')} · ${idLeccion(nivel, selLec.leccion)}` : 'Sin lección asignada'}
            </div>
            <div style={{
              fontFamily:'var(--f-serif)', fontSize:20, fontWeight:500,
              color:'var(--ink)', lineHeight:1.15, letterSpacing:'-0.02em',
            }}>
              {fmtLargo(selLec.fecha)}
            </div>
            <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:3 }}>
              {selLec.dia}
              {selLec.turno && <> · {selLec.turno}</>}
              {dias === 0 ? '' : dias === 1 ? ' · mañana' : dias > 1 ? ` · en ${dias} días` : ` · hace ${-dias} días`}
            </div>
          </div>
          <button onClick={onCerrar} title="Cerrar"
                  style={{ background:'none', border:'none', cursor:'pointer',
                           padding:4, color:'var(--ink-3)', lineHeight:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Status badge */}
        <div style={{
          marginTop:10,
          display:'inline-block',
          padding:'4px 10px',
          background: palVis.bg,
          color: palVis.fg,
          fontSize:11, fontWeight:700, letterSpacing:'0.04em',
          borderRadius:'var(--r-pill)',
        }}>
          {estadoLabel}
        </div>
        {!isFeriado && selLec.tipo !== 'CLASE' && !bloqueado && (
          <div style={{
            marginLeft:6, display:'inline-block',
            padding:'4px 10px', background: pal.accent, color:'white',
            fontSize:11, fontWeight:700, letterSpacing:'0.04em',
            borderRadius:'var(--r-pill)',
          }}>
            {TIPO_LABEL_LARGO[selLec.tipo]}
          </div>
        )}

        {/* Cuerpo */}
        {isFeriado ? (
          <div style={{
            marginTop:14, padding:'14px 14px',
            background: pal.bg,
            border: `1px solid ${pal.accent}33`,
            borderRadius:'var(--r-md)',
          }}>
            <div style={{ fontSize:24, marginBottom:6 }}>🚫</div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:16, fontWeight:500, color:pal.fg }}>
              {feriadoName}
            </div>
            <div style={{ fontSize:11, color:pal.fg, opacity:0.8, marginTop:4 }}>
              No hay clase este día. La lección se proyecta al siguiente día hábil.
            </div>
          </div>
        ) : bloqueado ? (
          <div style={{
            marginTop:14, padding:'18px 16px',
            background: '#F6F2EC',
            border: '1px dashed #C9BFB1',
            borderRadius:'var(--r-md)',
            textAlign:'center',
          }}>
            <div style={{
              width:42, height:42, margin:'0 auto 10px',
              borderRadius:'50%', background:'#E7DECD',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#6A6058',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div style={{
              fontFamily:'var(--f-serif)', fontSize:16, fontWeight:600,
              color:'var(--ink)', letterSpacing:'-0.015em', marginBottom:4,
            }}>
              Nivel bloqueado
            </div>
            <div style={{ fontSize:12, color:'var(--ink-2)', lineHeight:1.5, maxWidth:260, margin:'0 auto' }}>
              Completá los niveles anteriores para acceder al título,
              temas y material de esta lección.
            </div>
            <div style={{
              marginTop:12, fontSize:10, color:'var(--ink-3)',
              fontFamily:'var(--f-mono)', letterSpacing:'0.06em',
            }}>
              {idLeccion(nivel, selLec.leccion)} · {fmtDDMMM(selLec.fecha)}
            </div>
          </div>
        ) : cargando ? (
          <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:6 }}>
            <div style={skeletonLine(70)} />
            <div style={skeletonLine(40)} />
            <div style={skeletonLine(85)} />
          </div>
        ) : !detalle ? (
          <div style={{ marginTop:14, fontSize:12, color:'var(--ink-3)', fontStyle:'italic' }}>
            No se pudo cargar el detalle de la lección.
          </div>
        ) : (
          <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:12 }}>
            {/* Cobertura aplicada — banner */}
            {cobertura && (
              <div style={{
                padding:'10px 12px',
                background:'#F1F8E9',
                border:'1px solid #C5E1A5',
                borderRadius:'var(--r-md)',
                display:'flex', alignItems:'flex-start', gap:10,
              }}>
                <span style={{
                  width:22, height:22, flexShrink:0, borderRadius:'50%',
                  background:'#2E7D32', color:'#FFF',
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, fontWeight:800,
                }}>✓</span>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{
                    fontSize:9, fontWeight:700, letterSpacing:'0.12em',
                    textTransform:'uppercase', color:'#1B5E20', marginBottom:2,
                  }}>
                    Cobertura asignada
                  </div>
                  <div style={{ fontSize:13, color:'var(--ink)', fontWeight:600, lineHeight:1.35 }}>
                    {cobertura.docente_cobertura}
                  </div>
                  {cobertura.docente_anterior && (
                    <div style={{
                      fontSize:11, color:'var(--ink-3)', marginTop:2,
                      textDecoration:'line-through',
                    }}>
                      Titular: {cobertura.docente_anterior}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Unidad + título */}
            <div>
              {detalle.unidad && (
                <div style={{
                  fontSize:10, fontWeight:700, color:'var(--ink-3)',
                  letterSpacing:'0.1em', textTransform:'uppercase',
                }}>
                  {detalle.unidad}
                </div>
              )}
              <div style={{
                fontFamily:'var(--f-serif)', fontSize:17, fontWeight:600,
                color:'var(--ink)', lineHeight:1.25, letterSpacing:'-0.015em',
                marginTop:2,
              }}>
                {detalle.titulo || 'Sin título registrado'}
              </div>
            </div>

            {/* Objetivo */}
            {detalle.objetivo && (
              <Bloque titulo="Objetivo" texto={detalle.objetivo} />
            )}

            {/* Temas */}
            {detalle.speaking      && <Bloque titulo="Speaking"      texto={detalle.speaking} compact />}
            {detalle.grammar       && <Bloque titulo="Grammar"       texto={detalle.grammar} compact />}
            {detalle.pronunciacion && <Bloque titulo="Pronunciación" texto={detalle.pronunciacion} compact />}
            {detalle.writing       && <Bloque titulo="Writing"       texto={detalle.writing} compact />}

            {/* Botón material PDF — backend decide acceso por rol/estado */}
            <BotonMaterialPDF
              selLec={selLec}
              nivel={nivel}
              rol={rol}
              codigoUsr={codigoUsr}
              grupoUsr={grupoUsr}
              detalle={detalle}
            />

            {/* Botón Asignar cobertura — solo admin + lección PROGRAMADA */}
            {esAdmin && selLec.estado === 'PROGRAMADA' && (
              <button
                type="button"
                onClick={onPedirCobertura}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'10px 14px',
                  background:'var(--surface)',
                  border:'1.5px solid var(--ink)',
                  color:'var(--ink)',
                  fontSize:13, fontWeight:700,
                  borderRadius:'var(--r-md)',
                  cursor:'pointer',
                  letterSpacing:'0.02em',
                  marginTop: detalle.pdf_drive_id ? 0 : 2,
                  fontFamily:'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-deep)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 1l4 4-4 4"/>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <path d="M7 23l-4-4 4-4"/>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                {cobertura ? 'Reasignar cobertura' : 'Asignar cobertura'}
              </button>
            )}

            {/* Botón Editar (SUPERADMIN) — solo lecciones CERRADA/CALCULADA */}
            {esSuperadmin && (selLec.estado === 'CERRADA' || selLec.estado === 'CALCULADA') && (
              <button
                type="button"
                onClick={onPedirEditarCerrada}
                title="Acción reservada para superadmin: edita datos de una lección ya cerrada."
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'10px 14px',
                  background:'#FFF8E1',
                  border:'1.5px dashed #9A6A00',
                  color:'#9A6A00',
                  fontSize:12, fontWeight:700,
                  borderRadius:'var(--r-md)',
                  cursor:'pointer',
                  letterSpacing:'0.04em',
                  textTransform:'uppercase',
                  marginTop:2,
                  fontFamily:'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FFECB3'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFF8E1'; }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  <path d="M11 15.5l1.5 1.5L16 13"/>
                </svg>
                Editar lección cerrada
                <span style={{
                  marginLeft:4, padding:'2px 6px',
                  background:'#9A6A00', color:'#FFF',
                  borderRadius:'var(--r-pill)',
                  fontSize:9, letterSpacing:'0.1em',
                }}>SUPERADMIN</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Bloque({ titulo, texto, compact }) {
  return (
    <div>
      <div style={{
        fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
        color:'var(--ink-3)', marginBottom:3,
      }}>{titulo}</div>
      <div style={{
        fontSize: compact ? 12 : 13,
        color:'var(--ink-2)', lineHeight:1.5,
      }}>{texto}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Botón "Ver material PDF" + Modal embebido
// Backend v4.22.4: getMaterialLeccion decide acceso por rol/estado.
// ─────────────────────────────────────────────────────────────────
function BotonMaterialPDF({ selLec, nivel, rol, codigoUsr, grupoUsr, detalle }) {
  const [mat, setMat]           = React.useState(null);
  const [cargando, setCargando] = React.useState(true);
  const [errRed, setErrRed]     = React.useState(false);
  const [abierto, setAbierto]   = React.useState(false);

  const leccionNum = selLec.leccion;
  const tipo       = selLec.tipo;
  const riel       = tipo === 'ICAN' ? 'ican' : 'curso';

  React.useEffect(() => {
    let vivo = true;
    setMat(null);
    setErrRed(false);
    setCargando(true);
    setAbierto(false);

    const helper = window.fetchMaterialLeccion;
    if (typeof helper !== 'function') {
      // Helper no cargado — degradar a fallback con pdf_drive_id si existe.
      setCargando(false);
      return () => { vivo = false; };
    }

    helper({
      nivel,
      leccion: leccionNum,
      riel,
      rol,
      codigo:    rol === 'student' ? codigoUsr : undefined,
      cod_grupo: rol === 'student' ? grupoUsr  : undefined,
    })
      .then(d => { if (vivo) setMat(d || { ok: false }); })
      .catch(()=> { if (vivo) setErrRed(true); })
      .finally(()=>{ if (vivo) setCargando(false); });

    return () => { vivo = false; };
  }, [leccionNum, tipo, nivel, rol, codigoUsr, grupoUsr, riel]);

  // Skeleton mientras consulta permisos
  if (cargando) {
    return (
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        padding:'10px 14px',
        background:'var(--bg-deep)',
        border:'1px dashed var(--line)',
        borderRadius:'var(--r-md)',
        fontSize:12, color:'var(--ink-3)',
        letterSpacing:'0.04em', marginTop:2,
      }}>
        <span style={{
          width:12, height:12, borderRadius:'50%',
          border:'2px solid var(--line)',
          borderTopColor:'var(--ink-3)',
          animation:'an-spin .8s linear infinite',
          display:'inline-block',
        }} />
        Verificando material…
      </div>
    );
  }

  // Fallback de red: usar pdf_drive_id del detalle si está
  if (errRed || !mat || mat.ok === false) {
    if (detalle && detalle.pdf_drive_id) {
      return (
        <a
          href={`https://drive.google.com/file/d/${detalle.pdf_drive_id}/view`}
          target="_blank" rel="noopener noreferrer"
          style={btnPDFActivo}>
          <IconoPDF />
          Ver material PDF
        </a>
      );
    }
    return (
      <button type="button" disabled
        title="No se pudo verificar el material. Reintentá más tarde."
        style={btnPDFDisabled}>
        <IconoPDF />
        Material no disponible
      </button>
    );
  }

  // Sin acceso: botón deshabilitado, motivo en tooltip
  if (!mat.acceso) {
    const motivo = mat.motivo || 'Material disponible solo para estudiantes activos.';
    return (
      <button type="button" disabled
        title={motivo}
        style={btnPDFDisabled}>
        <IconoCandado />
        Material disponible al rematricularte
      </button>
    );
  }

  // Con acceso: botón activo → modal embebido
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        style={{ ...btnPDFActivo, border:'none', cursor:'pointer', fontFamily:'inherit' }}>
        <IconoPDF />
        Ver material PDF
        {mat.tipo_pdf === 'estudiante' && (
          <span style={{
            marginLeft:6, padding:'2px 7px', borderRadius:'var(--r-pill)',
            background:'rgba(255,255,255,0.18)', fontSize:10, fontWeight:700,
            letterSpacing:'0.08em', textTransform:'uppercase',
          }}>Estudiante</span>
        )}
        {mat.tipo_pdf === 'profe' && (
          <span style={{
            marginLeft:6, padding:'2px 7px', borderRadius:'var(--r-pill)',
            background:'rgba(255,255,255,0.18)', fontSize:10, fontWeight:700,
            letterSpacing:'0.08em', textTransform:'uppercase',
          }}>Profe</span>
        )}
      </button>

      {abierto && (
        <ModalPDF
          pdfId={mat.pdf_id}
          pdfUrl={mat.pdf_url}
          titulo={mat.titulo || detalle?.titulo || ''}
          unidad={mat.unidad || detalle?.unidad || ''}
          leccion={leccionNum}
          nivel={nivel}
          tipoPdf={mat.tipo_pdf}
          onCerrar={() => setAbierto(false)}
        />
      )}
    </>
  );
}

const btnPDFActivo = {
  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
  padding:'10px 14px',
  background:'var(--an-granate)', color:'white',
  fontSize:13, fontWeight:700,
  borderRadius:'var(--r-md)',
  textDecoration:'none',
  letterSpacing:'0.02em',
  marginTop:2,
};
const btnPDFDisabled = {
  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
  padding:'10px 14px',
  background:'var(--bg-deep)',
  border:'1.5px solid var(--line)',
  color:'var(--ink-3)',
  fontSize:13, fontWeight:600,
  borderRadius:'var(--r-md)',
  cursor:'not-allowed',
  letterSpacing:'0.02em',
  marginTop:2,
  fontFamily:'inherit',
};
function IconoPDF() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M9 13h6M9 17h4"/>
    </svg>
  );
}
function IconoCandado() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function ModalPDF({ pdfId, pdfUrl, titulo, unidad, leccion, nivel, tipoPdf, onCerrar }) {
  // ESC cierra
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onCerrar]);

  const colorNivel = NIVEL_COLOR_CG[nivel] || 'var(--an-granate)';
  const idLec = idLeccion(nivel, leccion);
  const embedUrl = `https://drive.google.com/file/d/${pdfId}/preview`;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
      style={{
        position:'fixed', inset:0, zIndex:1100,
        background:'rgba(20, 16, 12, 0.65)',
        backdropFilter:'blur(4px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'min(3vh, 24px) min(3vw, 24px)',
        animation:'an-fade-in .14s ease-out',
      }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Material PDF — ${titulo}`}
        style={{
          width:'100%', height:'100%',
          maxWidth: 1080,
          background:'var(--surface)',
          borderRadius:'var(--r-lg, 12px)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.18)',
          overflow:'hidden',
          display:'flex', flexDirection:'column',
        }}>
        {/* Header — banda con color del nivel */}
        <div style={{
          padding:'12px 18px 12px 18px',
          borderBottom:'1px solid var(--line)',
          background:'var(--surface)',
          display:'flex', alignItems:'center', gap:14,
        }}>
          {/* Pill nivel */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            padding:'4px 10px',
            background:`${colorNivel}18`,
            border:`1px solid ${colorNivel}55`,
            borderRadius:'var(--r-pill)',
            flexShrink:0,
          }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:colorNivel }} />
            <span style={{
              fontSize:10, fontWeight:800, color:colorNivel,
              letterSpacing:'0.12em', textTransform:'uppercase',
            }}>{idLec}</span>
          </div>

          <div style={{ minWidth:0, flex:1 }}>
            {unidad && (
              <div style={{
                fontSize:10, fontWeight:700, letterSpacing:'0.14em',
                textTransform:'uppercase', color:'var(--ink-3)',
              }}>{unidad}</div>
            )}
            <div style={{
              fontFamily:'var(--f-serif)', fontSize:17, fontWeight:600,
              color:'var(--ink)', letterSpacing:'-0.015em', lineHeight:1.2,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {titulo || 'Material de la lección'}
            </div>
          </div>

          {/* Abrir en Drive */}
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank" rel="noopener noreferrer"
              style={{
                display:'inline-flex', alignItems:'center', gap:7,
                padding:'8px 14px',
                background:'var(--surface)',
                border:'1.5px solid var(--ink)',
                color:'var(--ink)',
                fontSize:12, fontWeight:700,
                borderRadius:'var(--r-md)',
                textDecoration:'none',
                letterSpacing:'0.02em',
                whiteSpace:'nowrap',
                flexShrink:0,
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <path d="M15 3h6v6M10 14L21 3"/>
              </svg>
              Abrir en Drive
            </a>
          )}

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            style={{
              background:'none', border:'none', cursor:'pointer',
              padding:6, color:'var(--ink-2)', lineHeight:0,
              borderRadius:'var(--r-sm, 6px)',
              flexShrink:0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-deep)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Iframe Drive preview */}
        <div style={{ flex:1, minHeight:0, background:'#222', position:'relative' }}>
          {pdfId ? (
            <iframe
              src={embedUrl}
              title={`Material PDF — ${titulo || idLec}`}
              allow="autoplay"
              allowFullScreen
              style={{
                width:'100%', height:'100%', border:'none', display:'block',
                background:'#222',
              }}
            />
          ) : (
            <div style={{
              position:'absolute', inset:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#FFFFFFAA', fontSize:13,
            }}>
              No hay PDF disponible para esta lección.
            </div>
          )}
        </div>

        {/* Footer aclaración Drive permisos */}
        <div style={{
          padding:'8px 18px',
          background:'var(--surface-2)',
          borderTop:'1px solid var(--line)',
          fontSize:10, color:'var(--ink-3)',
          letterSpacing:'0.04em', lineHeight:1.5,
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
          flexWrap:'wrap',
        }}>
          <span>
            {tipoPdf === 'estudiante'
              ? 'Visualizando el material del estudiante. Disponible mientras estés matriculado.'
              : tipoPdf === 'profe'
                ? 'Material del docente — uso interno. No compartir con estudiantes.'
                : 'Material de la lección.'}
          </span>
          <span style={{ fontFamily:'var(--f-mono)' }}>
            Embebido vía Google Drive · ESC para cerrar
          </span>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ n, l, c }) {
  return (
    <div>
      <div style={{
        fontFamily:'var(--f-serif)', fontSize:22, fontWeight:600,
        color:c, lineHeight:1, letterSpacing:'-0.02em',
      }}>{n}</div>
      <div style={{
        fontSize:9, color:'var(--ink-3)', marginTop:2, fontWeight:600,
        letterSpacing:'0.08em', textTransform:'uppercase',
      }}>{l}</div>
    </div>
  );
}

function skeletonLine(widthPct) {
  return {
    height: 11, width: `${widthPct}%`,
    background: 'linear-gradient(90deg, var(--bg-deep) 0%, var(--surface-2) 50%, var(--bg-deep) 100%)',
    backgroundSize: '200% 100%',
    animation: 'an-shimmer 1.4s linear infinite',
    borderRadius: 4,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Leyenda
// ─────────────────────────────────────────────────────────────────────────
function Leyenda() {
  const items = [
    { bg:'#EBF5EB', ac:'#2E7D32', l:'Clase dada' },
    { bg:'#EBF0FB', ac:'#1565C0', l:'Próxima' },
    { bg:'#F3E5F5', ac:'#7B1FA2', l:'Progress Check' },
    { bg:'#FFF8E1', ac:'#F57F17', l:'Examen Oral' },
    { bg:'#FFF3E0', ac:'#E65100', l:'Examen Escrito' },
    { bg:'#FFF9C4', ac:'#F57F17', l:'Hoy' },
    { bg:'#FDECEA', ac:'#B71C1C', l:'Feriado' },
  ];
  return (
    <div style={{
      marginTop:14, paddingTop:14, borderTop:'1px solid var(--line)',
      display:'flex', flexWrap:'wrap', gap:14, fontSize:11, color:'var(--ink-2)',
    }}>
      {items.map(it => (
        <span key={it.l} style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{
            width:14, height:14, borderRadius:4,
            background:it.bg, border:`1.5px solid ${it.ac}`,
          }} />
          {it.l}
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Skeleton mientras carga
// ─────────────────────────────────────────────────────────────────────────
function SkeletonMeses() {
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',
      gap:18,
    }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          border:'1px solid var(--line)', borderRadius:'var(--r-md)',
          background:'var(--surface)', padding:14,
        }}>
          <div style={{ ...skeletonLine(40), height:16, marginBottom:10 }} />
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:3,
          }}>
            {Array.from({ length: 35 }).map((_, j) => (
              <div key={j} style={{
                height:42, background:'var(--bg-deep)', borderRadius:6,
                opacity: 0.4 + 0.4 * Math.random(),
              }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Animación shimmer + fade + spin (inyectada una vez)
(function injectShimmer() {
  if (typeof document === 'undefined' || document.getElementById('an-shimmer-css')) return;
  const s = document.createElement('style');
  s.id = 'an-shimmer-css';
  s.textContent = `
    @keyframes an-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes an-fade-in { from { opacity: 0 } to { opacity: 1 } }
    @keyframes an-spin    { to { transform: rotate(360deg) } }
  `;
  document.head.appendChild(s);
})();

// ────────────────────────────────────────────────────────────────────────
// Modal de Asignar Cobertura
// ────────────────────────────────────────────────────────────────────────
function ModalCobertura({ selLec, codGrupo, nivel, docenteTitular, adminNombre, onCerrar, onAsignada }) {
  const [docentes, setDocentes]   = React.useState([]);
  const [cargandoDoc, setCargandoDoc] = React.useState(true);
  const [docSel, setDocSel]       = React.useState('');
  const [motivo, setMotivo]       = React.useState('');
  const [enviando, setEnviando]   = React.useState(false);
  const [err, setErr]             = React.useState(null);

  // Cargar lista de docentes activos. getDocentesAtrasados devuelve docentes[].nombre
  React.useEffect(() => {
    let alive = true;
    setCargandoDoc(true); setErr(null);
    const fetcher = window.fetchDocentesAtrasados;
    Promise.resolve(fetcher ? fetcher() : { ok:false }).then(r => {
      if (!alive) return;
      let lista = [];
      if (r && r.ok && Array.isArray(r.docentes)) {
        lista = r.docentes
          .map(d => (d.nombre || '').trim())
          .filter(n => !!n && n.toUpperCase() !== (docenteTitular || '').toUpperCase());
      }
      // Fallback: lista local de docentes conocidos (mock dev)
      if (!lista.length) {
        lista = [
          'SULIVANY MEDINA FONSECA',
          'EMILY VEGA RAMÍREZ',
          'RACHELLE CRUZ MORA',
          'ANA SALAZAR JIMÉNEZ',
          'JOHN ÁLVAREZ GONZÁLEZ',
          'YENDRY AGUILAR ROJAS',
        ].filter(n => n.toUpperCase() !== (docenteTitular || '').toUpperCase().toUpperCase());
      }
      // Quitar duplicados
      lista = Array.from(new Set(lista));
      setDocentes(lista);
      setCargandoDoc(false);
    }).catch(() => {
      if (alive) { setDocentes([]); setCargandoDoc(false); }
    });
    return () => { alive = false; };
  }, [docenteTitular]);

  // Cerrar con ESC
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !enviando) onCerrar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCerrar, enviando]);

  const handleAsignar = async () => {
    if (!docSel) { setErr('Seleccioná un docente.'); return; }
    setEnviando(true); setErr(null);
    const riel = selLec.tipo === 'ICAN' ? 'ican' : 'curso';
    const payload = {
      cod_grupo: codGrupo,
      nivel,
      leccion: selLec.leccion,
      riel,
      docente_cobertura: docSel,
      motivo: motivo.trim(),
      registrado_por: adminNombre,
    };
    const fn = window.fetchAsignarCobertura;
    let res;
    try {
      res = fn ? await fn(payload) : { ok: false, error: 'fetchAsignarCobertura no disponible' };
    } catch (e) {
      res = { ok: false, error: 'Error de red: ' + e.message };
    }
    if (res && res.ok) {
      const idLec = idLeccion(nivel, selLec.leccion);
      onAsignada(idLec, res.docente_cobertura || docSel, res.docente_anterior || docenteTitular);
    } else {
      setErr((res && res.error) || 'No se pudo asignar la cobertura.');
      setEnviando(false);
    }
  };

  const idLec = idLeccion(nivel, selLec.leccion);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !enviando) onCerrar(); }}
      style={{
        position:'fixed', inset:0, zIndex:1100,
        background:'rgba(20, 16, 12, 0.55)',
        backdropFilter:'blur(3px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:18,
        animation:'an-fade-in .14s ease-out',
      }}>
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width:'100%', maxWidth:460,
          background:'var(--surface)',
          borderRadius:'var(--r-lg, 12px)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.32), 0 4px 16px rgba(0,0,0,0.12)',
          overflow:'hidden',
          display:'flex', flexDirection:'column',
          maxHeight:'calc(100vh - 36px)',
        }}>
        {/* Header */}
        <div style={{
          padding:'18px 22px 14px',
          borderBottom:'1px solid var(--line)',
          display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14,
        }}>
          <div>
            <div style={{
              fontSize:10, fontWeight:700, letterSpacing:'0.18em',
              textTransform:'uppercase', color:'var(--ink-3)',
            }}>
              Cobertura puntual
            </div>
            <div style={{
              fontFamily:'var(--f-serif)', fontSize:20, fontWeight:500,
              color:'var(--ink)', letterSpacing:'-0.02em',
              marginTop:4, lineHeight:1.15,
            }}>
              ¿Quién dará esta lección?
            </div>
          </div>
          <button
            type="button"
            onClick={() => !enviando && onCerrar()}
            aria-label="Cerrar"
            style={{
              background:'none', border:'none', cursor: enviando ? 'not-allowed' : 'pointer',
              padding:4, color:'var(--ink-3)', lineHeight:0,
              opacity: enviando ? 0.4 : 1,
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding:'16px 22px 4px', overflowY:'auto' }}>
          {/* Contexto de la lección */}
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'10px 16px',
            padding:'12px 14px',
            background:'var(--surface-2)',
            border:'1px solid var(--line)',
            borderRadius:'var(--r-md)',
            marginBottom:16,
          }}>
            <ContextField label="Grupo" value={codGrupo} mono />
            <ContextField label="Nivel" value={`${nivel} · ${NIVEL_LABEL_CG[nivel] || ''}`} />
            <ContextField
              label="Lección"
              value={`${idLec} · #${String(selLec.leccion).padStart(2,'0')}`}
              mono
            />
            <ContextField label="Fecha" value={fmtLargo(selLec.fecha)} />
            <div style={{ gridColumn:'1 / -1' }}>
              <ContextField
                label="Docente titular"
                value={docenteTitular || '—'}
              />
            </div>
          </div>

          {/* Selector docente */}
          <label style={{ display:'block', marginBottom:14 }}>
            <div style={labelStyle}>Docente de cobertura *</div>
            <select
              value={docSel}
              onChange={e => { setDocSel(e.target.value); setErr(null); }}
              disabled={cargandoDoc || enviando}
              style={{ ...selectStyle, minWidth:0, width:'100%' }}>
              <option value="">
                {cargandoDoc ? 'Cargando docentes…' : 'Seleccionar docente…'}
              </option>
              {docentes.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>

          {/* Motivo */}
          <label style={{ display:'block', marginBottom:14 }}>
            <div style={labelStyle}>Motivo <span style={{ color:'var(--ink-3)', fontWeight:500 }}>(opcional)</span></div>
            <input
              type="text"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              disabled={enviando}
              placeholder="ej. Titular incapacitado"
              style={{
                width:'100%',
                padding:'10px 14px',
                border:'1.5px solid var(--line)',
                borderRadius:'var(--r-md)',
                background:'var(--surface)',
                fontSize:13, color:'var(--ink)',
                fontFamily:'inherit',
                outline:'none',
                boxSizing:'border-box',
              }}
            />
          </label>

          {err && (
            <div style={{
              padding:'10px 12px',
              background:'color-mix(in srgb, var(--danger, #B71C1C) 8%, white)',
              border:'1px solid color-mix(in srgb, var(--danger, #B71C1C) 28%, white)',
              borderRadius:'var(--r-sm)',
              fontSize:12, color:'var(--danger, #B71C1C)',
              marginBottom:12, fontWeight:600,
            }}>
              ⚠ {err}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:'14px 22px 18px',
          borderTop:'1px solid var(--line)',
          display:'flex', justifyContent:'flex-end', gap:10,
        }}>
          <button
            type="button"
            onClick={() => !enviando && onCerrar()}
            disabled={enviando}
            style={{
              padding:'10px 16px',
              background:'transparent',
              border:'1.5px solid var(--line-2, var(--line))',
              color:'var(--ink-2)',
              fontSize:13, fontWeight:600,
              borderRadius:'var(--r-md)',
              cursor: enviando ? 'not-allowed' : 'pointer',
              fontFamily:'inherit',
            }}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAsignar}
            disabled={enviando || !docSel || cargandoDoc}
            style={{
              padding:'10px 18px',
              background: (enviando || !docSel) ? '#9F8F7D' : 'var(--ink)',
              border:'none',
              color:'#FFFFFF',
              fontSize:13, fontWeight:700,
              borderRadius:'var(--r-md)',
              cursor: (enviando || !docSel) ? 'not-allowed' : 'pointer',
              letterSpacing:'0.02em',
              fontFamily:'inherit',
              display:'inline-flex', alignItems:'center', gap:8,
            }}>
            {enviando ? (
              <>
                <span style={{
                  width:12, height:12, borderRadius:'50%',
                  border:'2px solid rgba(255,255,255,0.4)',
                  borderTopColor:'#FFF',
                  animation:'an-spin .8s linear infinite',
                  display:'inline-block',
                }} />
                Asignando…
              </>
            ) : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Modal SUPERADMIN — Editar lección CERRADA
// Edita retro / PC / asistencia / notas. La lección permanece CERRADA.
// ─────────────────────────────────────────────────────────────────
const LECCIONES_CON_PC = [4, 8, 13, 16, 21, 24, 28, 30];

function ModalEditarCerrada({ selLec, codGrupo, nivel, superadminNombre, onCerrar, onGuardado }) {
  const leccionNum = selLec.leccion;
  const tipo       = selLec.tipo;
  const riel       = tipo === 'ICAN' ? 'ican' : 'curso';

  const tieneNotas = tipo === 'EVAL_ORAL' || tipo === 'EVAL_ESCRITO';
  const tienePC    = LECCIONES_CON_PC.includes(leccionNum) && riel === 'curso';

  const TABS = React.useMemo(() => {
    const t = [{ id: 'retro', label: 'Retroalimentación' }];
    if (tienePC)    t.push({ id: 'pc',    label: 'Progress Check' });
    t.push({ id: 'asist', label: 'Asistencia' });
    if (tieneNotas) t.push({ id: 'notas', label: 'Notas' });
    return t;
  }, [tienePC, tieneNotas]);

  const [tab, setTab]               = React.useState(TABS[0].id);
  const [cargando, setCargando]     = React.useState(true);
  const [errCarga, setErrCarga]     = React.useState('');
  const [estudiantes, setEst]       = React.useState([]); // [{cod, nombre}]
  const [form, setForm]             = React.useState({}); // { [cod]: {presente, retro, pc, nota} }
  const [initial, setInitial]       = React.useState({}); // snapshot para detectar dirty
  const [confirmar, setConfirmar]   = React.useState(false);
  const [enviando, setEnviando]     = React.useState(false);
  const [errEnvio, setErrEnvio]     = React.useState('');

  // Cargar estudiantes + intentar precargar valores actuales
  React.useEffect(() => {
    let vivo = true;
    setCargando(true); setErrCarga('');

    const cargar = async () => {
      // Paso 1: lista de estudiantes del nivel (cerrar)
      let lista = [];
      try {
        const r = await window.fetchEstudiantesParaCierre(codGrupo, nivel);
        if (!r?.ok) {
          if (vivo) { setErrCarga(r?.error || 'No se pudieron cargar los estudiantes.'); setCargando(false); }
          return;
        }
        lista = r.estudiantes || [];
      } catch (e) {
        if (vivo) { setErrCarga('Error de red: ' + e.message); setCargando(false); }
        return;
      }

      // Paso 2: precargar valores actuales (si el endpoint existe)
      let actual = {};
      try {
        const r = await window.fetchLeccionCerradaDetalle({
          cod_grupo: codGrupo, nivel, leccion: leccionNum, riel,
        });
        if (r?.ok && Array.isArray(r.estudiantes)) {
          for (const e of r.estudiantes) {
            const cod = e.cod_estudiante || e.cod || e.codigo;
            if (cod) actual[String(cod)] = e;
          }
        }
      } catch { /* opcional: si no existe, arrancamos en blanco */ }

      if (!vivo) return;
      const init = {};
      for (const e of lista) {
        const cod = String(e.code || e.cod || e.codigo);
        const a = actual[cod] || {};
        init[cod] = {
          presente: a.presente !== undefined ? !!a.presente : true,
          retro:    a.retro || a.retroalimentacion || '',
          pc:       a.pc || a.progress_check || '',
          nota:     a.nota !== undefined && a.nota !== null ? String(a.nota) : '',
        };
      }
      setEst(lista.map(e => ({
        cod: String(e.code || e.cod || e.codigo),
        nombre: e.name || e.nombre || '—',
      })));
      setForm(init);
      setInitial(JSON.parse(JSON.stringify(init)));
      setCargando(false);
    };

    cargar();
    return () => { vivo = false; };
  }, [codGrupo, nivel, leccionNum, riel]);

  // ESC + bloquear scroll
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !enviando) handleCerrar(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enviando]);

  const dirty = React.useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(initial);
  }, [form, initial]);

  const updateField = (cod, field, value) => {
    setForm(prev => ({ ...prev, [cod]: { ...prev[cod], [field]: value } }));
    setErrEnvio('');
  };

  const handleCerrar = () => {
    if (enviando) return;
    if (dirty && !window.confirm('Tenés cambios sin guardar. ¿Cerrar igual?')) return;
    onCerrar();
  };

  // Detectar qué grupos cambiaron
  const cambios = React.useMemo(() => {
    const cambioRetro = [];
    const cambioPC    = [];
    const cambioAsist = [];
    const cambioNota  = [];
    for (const e of estudiantes) {
      const a = form[e.cod] || {};
      const b = initial[e.cod] || {};
      if ((a.retro || '') !== (b.retro || '')) cambioRetro.push({ cod_estudiante: e.cod, comentario: a.retro || '' });
      if (tienePC && (a.pc || '') !== (b.pc || '')) cambioPC.push({ cod_estudiante: e.cod, comentario: a.pc || '' });
      if (!!a.presente !== !!b.presente) cambioAsist.push({ cod_estudiante: e.cod, presente: !!a.presente });
      if (tieneNotas && (a.nota || '') !== (b.nota || '')) cambioNota.push({ cod_estudiante: e.cod, nota: a.nota });
    }
    return { cambioRetro, cambioPC, cambioAsist, cambioNota };
  }, [form, initial, estudiantes, tienePC, tieneNotas]);

  const totalCambios =
    cambios.cambioRetro.length + cambios.cambioPC.length +
    cambios.cambioAsist.length + cambios.cambioNota.length;

  const handleGuardar = async () => {
    if (enviando || !totalCambios) return;
    setEnviando(true); setErrEnvio('');

    const calls = [];
    const resumen = [];

    if (cambios.cambioRetro.length) {
      calls.push(
        window.fetchEditarRetroPCCerrada({
          tipo: 'retro',
          cod_grupo: codGrupo,
          leccion_num: leccionNum,
          lista: cambios.cambioRetro,
          editado_por: superadminNombre,
        }).then(r => {
          if (!r?.ok) throw new Error(r?.error || 'Error guardando retro.');
          resumen.push(r.mensaje || `Retro: ${r.actualizados || 0}↻ ${r.agregados || 0}+`);
        })
      );
    }
    if (cambios.cambioPC.length) {
      calls.push(
        window.fetchEditarRetroPCCerrada({
          tipo: 'pc',
          cod_grupo: codGrupo,
          leccion_num: leccionNum,
          lista: cambios.cambioPC,
          editado_por: superadminNombre,
        }).then(r => {
          if (!r?.ok) throw new Error(r?.error || 'Error guardando PC.');
          resumen.push(r.mensaje || `PC: ${r.actualizados || 0}↻ ${r.agregados || 0}+`);
        })
      );
    }
    if (cambios.cambioAsist.length || cambios.cambioNota.length) {
      calls.push(
        window.fetchEditarAsistenciaNotaCerrada({
          cod_grupo: codGrupo,
          nivel,
          leccion: leccionNum,
          asistencias: cambios.cambioAsist,
          notas:       cambios.cambioNota,
          editado_por: superadminNombre,
        }).then(r => {
          if (!r?.ok) throw new Error(r?.error || 'Error guardando asistencia/notas.');
          resumen.push(r.mensaje ||
            `Asistencia: ${r.asistencia_editada || 0} · Notas: ${r.notas_editadas || 0}`);
        })
      );
    }

    try {
      await Promise.all(calls);
      onGuardado(`Lección actualizada · ${resumen.join(' · ')}`);
    } catch (e) {
      setErrEnvio(e.message || 'Error guardando cambios.');
      setEnviando(false);
      setConfirmar(false);
    }
  };

  const colorNivel = NIVEL_COLOR_CG[nivel] || 'var(--an-granate)';
  const idLec = idLeccion(nivel, leccionNum);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !enviando) handleCerrar(); }}
      style={{
        position:'fixed', inset:0, zIndex:1100,
        background:'rgba(20, 16, 12, 0.6)',
        backdropFilter:'blur(3px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'min(3vh, 24px) min(3vw, 18px)',
        animation:'an-fade-in .14s ease-out',
      }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Editar lección cerrada ${idLec}`}
        style={{
          width:'100%', maxWidth:760, maxHeight:'calc(100vh - 36px)',
          background:'var(--surface)',
          borderRadius:'var(--r-lg, 12px)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.18)',
          overflow:'hidden',
          display:'flex', flexDirection:'column',
        }}>

        {/* Header */}
        <div style={{
          padding:'16px 22px 12px',
          borderBottom:'1px solid var(--line)',
          background:'#FFF8E1',
          display:'flex', alignItems:'flex-start', gap:14,
        }}>
          <div style={{
            width:36, height:36, borderRadius:8,
            background:'#9A6A00', color:'#FFF',
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              <path d="M11 15.5l1.5 1.5L16 13"/>
            </svg>
          </div>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{
              fontSize:10, fontWeight:800, letterSpacing:'0.18em',
              textTransform:'uppercase', color:'#9A6A00',
            }}>
              Poder superadmin · Lección cerrada
            </div>
            <div style={{
              fontFamily:'var(--f-serif)', fontSize:19, fontWeight:600,
              color:'var(--ink)', letterSpacing:'-0.015em',
              marginTop:2, lineHeight:1.2,
            }}>
              Editar {idLec}
              <span style={{
                marginLeft:8, padding:'2px 8px', borderRadius:'var(--r-pill)',
                background:colorNivel, color:'#FFF',
                fontSize:10, fontWeight:800, letterSpacing:'0.12em',
                textTransform:'uppercase', verticalAlign:'middle',
                fontFamily:'var(--f-sans, inherit)',
              }}>{nivel}</span>
            </div>
            <div style={{
              fontSize:11, color:'var(--ink-2)', marginTop:4,
              fontFamily:'var(--f-mono)', letterSpacing:'0.02em',
            }}>
              {codGrupo} · {fmtLargo(selLec.fecha)} · {TIPO_LABEL_LARGO[tipo] || tipo}
            </div>
          </div>
          <button
            type="button"
            onClick={() => !enviando && handleCerrar()}
            aria-label="Cerrar"
            style={{
              background:'none', border:'none', cursor: enviando ? 'not-allowed' : 'pointer',
              padding:4, color:'#9A6A00', lineHeight:0, opacity: enviando ? 0.4 : 1,
              flexShrink:0,
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display:'flex', gap:0,
          borderBottom:'1px solid var(--line)',
          padding:'0 22px',
          background:'var(--surface)',
        }}>
          {TABS.map(t => {
            const activo = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                disabled={enviando}
                style={{
                  padding:'12px 14px',
                  background:'transparent',
                  border:'none',
                  borderBottom: activo ? `2.5px solid ${colorNivel}` : '2.5px solid transparent',
                  color: activo ? 'var(--ink)' : 'var(--ink-3)',
                  fontSize:12, fontWeight: activo ? 700 : 600,
                  cursor: enviando ? 'not-allowed' : 'pointer',
                  fontFamily:'inherit',
                  letterSpacing:'0.02em',
                  marginBottom:-1,
                }}>
                {t.label}
              </button>
            );
          })}
          <div style={{ flex:1 }} />
          {totalCambios > 0 && (
            <div style={{
              alignSelf:'center',
              fontSize:10, fontWeight:700, letterSpacing:'0.12em',
              textTransform:'uppercase', color:'#9A6A00',
              padding:'4px 10px', background:'#FFF3CD',
              border:'1px solid #FFE082',
              borderRadius:'var(--r-pill)',
            }}>
              {totalCambios} cambio{totalCambios !== 1 ? 's' : ''} sin guardar
            </div>
          )}
        </div>

        {/* Cuerpo */}
        <div style={{
          flex:1, overflowY:'auto',
          padding:'16px 22px',
          background:'var(--bg, var(--surface))',
        }}>
          {cargando ? (
            <div style={{
              padding:'40px 16px', textAlign:'center',
              color:'var(--ink-3)', fontSize:13,
            }}>
              <div style={{
                width:24, height:24, margin:'0 auto 10px',
                borderRadius:'50%',
                border:'2.5px solid var(--line)', borderTopColor:'var(--ink)',
                animation:'an-spin .8s linear infinite',
              }} />
              Cargando estudiantes y datos de la lección…
            </div>
          ) : errCarga ? (
            <div style={{
              padding:'14px 16px',
              background:'color-mix(in srgb, var(--danger, #B71C1C) 8%, white)',
              border:'1px solid color-mix(in srgb, var(--danger, #B71C1C) 28%, white)',
              borderRadius:'var(--r-md)',
              fontSize:12, color:'var(--danger, #B71C1C)',
            }}>⚠ {errCarga}</div>
          ) : estudiantes.length === 0 ? (
            <div style={{
              padding:'30px 16px', textAlign:'center',
              color:'var(--ink-3)', fontSize:13, fontStyle:'italic',
            }}>
              No hay estudiantes activos (CA) en este nivel.
            </div>
          ) : (
            <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:10 }}>
              {estudiantes.map((e, i) => (
                <FilaEditar
                  key={e.cod}
                  est={e}
                  idx={i}
                  tab={tab}
                  valores={form[e.cod] || {}}
                  initial={initial[e.cod] || {}}
                  onChange={(field, value) => updateField(e.cod, field, value)}
                  disabled={enviando}
                  colorNivel={colorNivel}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:'12px 22px 14px',
          borderTop:'1px solid var(--line)',
          background:'var(--surface)',
          display:'flex', alignItems:'center', gap:10,
          flexWrap:'wrap',
        }}>
          <div style={{
            fontSize:10, color:'var(--ink-3)',
            letterSpacing:'0.04em', flex:1, minWidth:160,
          }}>
            Editado por <b style={{ color:'var(--ink-2)' }}>{superadminNombre || 'superadmin'}</b>.
            La lección permanece <b>CERRADA</b>.
          </div>

          {errEnvio && (
            <div style={{
              fontSize:11, color:'var(--danger, #B71C1C)', fontWeight:700,
              padding:'6px 10px',
              background:'color-mix(in srgb, var(--danger, #B71C1C) 8%, white)',
              border:'1px solid color-mix(in srgb, var(--danger, #B71C1C) 24%, white)',
              borderRadius:'var(--r-sm)',
            }}>⚠ {errEnvio}</div>
          )}

          <button
            type="button"
            onClick={() => !enviando && handleCerrar()}
            disabled={enviando}
            style={{
              padding:'10px 16px',
              background:'transparent',
              border:'1.5px solid var(--line-2, var(--line))',
              color:'var(--ink-2)',
              fontSize:13, fontWeight:600,
              borderRadius:'var(--r-md)',
              cursor: enviando ? 'not-allowed' : 'pointer',
              fontFamily:'inherit',
            }}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => setConfirmar(true)}
            disabled={enviando || !totalCambios}
            style={{
              padding:'10px 18px',
              background: (!totalCambios || enviando) ? '#C9BFB1' : '#9A6A00',
              border:'none',
              color:'#FFFFFF',
              fontSize:13, fontWeight:700,
              borderRadius:'var(--r-md)',
              cursor: (!totalCambios || enviando) ? 'not-allowed' : 'pointer',
              letterSpacing:'0.02em',
              fontFamily:'inherit',
              display:'inline-flex', alignItems:'center', gap:8,
            }}>
            {enviando ? 'Guardando…' : `Guardar (${totalCambios})`}
          </button>
        </div>

        {/* Sub-modal de confirmación */}
        {confirmar && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget && !enviando) setConfirmar(false); }}
            style={{
              position:'absolute', inset:0,
              background:'rgba(20, 16, 12, 0.55)',
              display:'flex', alignItems:'center', justifyContent:'center',
              padding:20, animation:'an-fade-in .14s ease-out',
            }}>
            <div style={{
              width:'100%', maxWidth:420,
              background:'var(--surface)',
              borderRadius:'var(--r-lg, 12px)',
              boxShadow:'0 24px 64px rgba(0,0,0,0.32)',
              overflow:'hidden',
            }}>
              <div style={{
                padding:'18px 22px 12px',
                borderBottom:'1px solid var(--line)',
              }}>
                <div style={{
                  fontSize:10, fontWeight:800, letterSpacing:'0.18em',
                  textTransform:'uppercase', color:'#9A6A00', marginBottom:4,
                }}>Confirmá el cambio</div>
                <div style={{
                  fontFamily:'var(--f-serif)', fontSize:18, fontWeight:600,
                  color:'var(--ink)', letterSpacing:'-0.015em', lineHeight:1.25,
                }}>
                  Vas a modificar datos de una lección <span style={{ color:'#9A6A00' }}>CERRADA</span>.
                </div>
              </div>
              <div style={{ padding:'14px 22px', fontSize:13, color:'var(--ink-2)', lineHeight:1.5 }}>
                Esta acción queda registrada con tu nombre y la fecha.
                La lección permanece cerrada y los estudiantes verán los nuevos valores.
                <ul style={{
                  margin:'10px 0 0', paddingLeft:18,
                  fontSize:12, color:'var(--ink-2)',
                }}>
                  {cambios.cambioRetro.length > 0 && <li><b>{cambios.cambioRetro.length}</b> retroalimentación{cambios.cambioRetro.length !== 1 ? 'es' : ''}</li>}
                  {cambios.cambioPC.length    > 0 && <li><b>{cambios.cambioPC.length}</b> Progress Check</li>}
                  {cambios.cambioAsist.length > 0 && <li><b>{cambios.cambioAsist.length}</b> asistencia{cambios.cambioAsist.length !== 1 ? 's' : ''}</li>}
                  {cambios.cambioNota.length  > 0 && <li><b>{cambios.cambioNota.length}</b> nota{cambios.cambioNota.length !== 1 ? 's' : ''}</li>}
                </ul>
              </div>
              <div style={{
                padding:'12px 22px 18px',
                display:'flex', justifyContent:'flex-end', gap:10,
              }}>
                <button type="button"
                  onClick={() => !enviando && setConfirmar(false)}
                  disabled={enviando}
                  style={{
                    padding:'9px 14px', background:'transparent',
                    border:'1.5px solid var(--line)', color:'var(--ink-2)',
                    fontSize:13, fontWeight:600, borderRadius:'var(--r-md)',
                    cursor: enviando ? 'not-allowed' : 'pointer', fontFamily:'inherit',
                  }}>
                  Cancelar
                </button>
                <button type="button"
                  onClick={handleGuardar}
                  disabled={enviando}
                  style={{
                    padding:'9px 16px', background:'#9A6A00', border:'none',
                    color:'#FFF', fontSize:13, fontWeight:700, borderRadius:'var(--r-md)',
                    cursor: enviando ? 'not-allowed' : 'pointer', fontFamily:'inherit',
                    display:'inline-flex', alignItems:'center', gap:8,
                  }}>
                  {enviando ? (
                    <>
                      <span style={{
                        width:11, height:11, borderRadius:'50%',
                        border:'2px solid rgba(255,255,255,0.4)',
                        borderTopColor:'#FFF',
                        animation:'an-spin .8s linear infinite',
                        display:'inline-block',
                      }} />
                      Guardando…
                    </>
                  ) : 'Sí, modificar lección cerrada'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilaEditar({ est, idx, tab, valores, initial, onChange, disabled, colorNivel }) {
  const cambiado = (campo) => (valores[campo] || '') !== (initial[campo] || '');
  const cambiadoBool = (campo) => !!valores[campo] !== !!initial[campo];

  return (
    <li style={{
      padding:'12px 14px',
      background:'var(--surface)',
      border:'1px solid var(--line)',
      borderRadius:'var(--r-md)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
        <span style={{
          width:24, height:24, borderRadius:'50%',
          background:'var(--bg-deep)',
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          fontSize:11, fontWeight:700, color:'var(--ink-2)',
          flexShrink:0,
        }}>{idx + 1}</span>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{
            fontSize:13, fontWeight:600, color:'var(--ink)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>{est.nombre}</div>
          <div style={{
            fontSize:10, fontFamily:'var(--f-mono)', color:'var(--ink-3)',
            letterSpacing:'0.04em',
          }}>{est.cod}</div>
        </div>
      </div>

      {tab === 'retro' && (
        <textarea
          value={valores.retro || ''}
          onChange={(e) => onChange('retro', e.target.value)}
          disabled={disabled}
          placeholder="Retroalimentación para el estudiante…"
          rows={2}
          style={textAreaStyle(cambiado('retro'), colorNivel)}
        />
      )}

      {tab === 'pc' && (
        <textarea
          value={valores.pc || ''}
          onChange={(e) => onChange('pc', e.target.value)}
          disabled={disabled}
          placeholder="Comentario de Progress Check…"
          rows={2}
          style={textAreaStyle(cambiado('pc'), colorNivel)}
        />
      )}

      {tab === 'asist' && (
        <div style={{ display:'flex', gap:8 }}>
          <ToggleAsist
            label="Presente"
            activo={!!valores.presente}
            cambiado={cambiadoBool('presente') && !!valores.presente}
            onClick={() => !disabled && onChange('presente', true)}
            disabled={disabled}
            color="#1E4D2B"
          />
          <ToggleAsist
            label="Ausente"
            activo={!valores.presente}
            cambiado={cambiadoBool('presente') && !valores.presente}
            onClick={() => !disabled && onChange('presente', false)}
            disabled={disabled}
            color="#7A1F15"
          />
        </div>
      )}

      {tab === 'notas' && (
        <input
          type="text"
          inputMode="decimal"
          value={valores.nota || ''}
          onChange={(e) => onChange('nota', e.target.value)}
          disabled={disabled}
          placeholder="Nota (ej. 85)"
          style={{
            ...textAreaStyle(cambiado('nota'), colorNivel),
            fontFamily:'var(--f-mono)', fontSize:14, padding:'8px 12px',
          }}
        />
      )}
    </li>
  );
}

function textAreaStyle(cambiado, colorNivel) {
  return {
    width:'100%',
    padding:'8px 12px',
    border: cambiado ? `1.5px solid ${colorNivel}` : '1.5px solid var(--line)',
    background: cambiado ? `color-mix(in srgb, ${colorNivel} 6%, var(--surface))` : 'var(--surface)',
    borderRadius:'var(--r-sm, 8px)',
    fontSize:13, color:'var(--ink)',
    fontFamily:'inherit',
    outline:'none', resize:'vertical',
    boxSizing:'border-box',
    lineHeight:1.4,
  };
}

function ToggleAsist({ label, activo, cambiado, onClick, disabled, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding:'8px 14px',
        background: activo ? color : 'var(--surface)',
        border: cambiado ? `1.5px dashed ${color}` : `1.5px solid ${activo ? color : 'var(--line)'}`,
        color:    activo ? '#FFF'  : 'var(--ink-2)',
        fontSize:12, fontWeight:700,
        borderRadius:'var(--r-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing:'0.04em', textTransform:'uppercase',
        fontFamily:'inherit',
        flex:1,
      }}>
      {label}
    </button>
  );
}

function ContextField({ label, value, mono }) {
  return (
    <div style={{ minWidth:0 }}>
      <div style={{
        fontSize:9, fontWeight:700, letterSpacing:'0.12em',
        textTransform:'uppercase', color:'var(--ink-3)', marginBottom:2,
      }}>{label}</div>
      <div style={{
        fontSize:12, color:'var(--ink)', fontWeight:600,
        fontFamily: mono ? 'var(--f-mono)' : 'inherit',
        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
      }}>
        {value}
      </div>
    </div>
  );
}

Object.assign(window, { CronogramaGrupo });
