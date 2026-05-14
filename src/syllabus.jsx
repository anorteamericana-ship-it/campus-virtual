/* global window */
// ─────────────────────────────────────────────────────────────────────────
// SÍLABUS CANÓNICO · Academia Norteamericana
// Fuente: Datos del Módulo – Nivel Básico I (INA · Resolución 2519)
// Cada nivel tiene estructura idéntica: 32 lecciones (3h c/u) + 16 I CAN (2h c/u)
// ─────────────────────────────────────────────────────────────────────────

// ── Bloque prioridad INA — siempre visible al inicio ─────────────────────
const PRIORITY_BLOCK = {
  title: 'Antes de empezar — Material obligatorio INA',
  note: 'Requerido por Resolución 2519. El INA exige que todo estudiante y docente revise este material antes de iniciar lecciones.',
  items: [
    { id: 'reg-estudiantil', code: '1.1', title: 'Reglamento estudiantil',              type: 'pdf',   required: true,  minutes: 20, desc: 'Derechos, deberes y conducta académica.' },
    { id: 'reg-netiqueta',   code: '1.2', title: 'Reglamento de netiqueta',             type: 'pdf',   required: true,  minutes: 10, desc: 'Normas de comportamiento en sesiones virtuales (Zoom).' },
    { id: 'welcome-video',   code: '1.3', title: 'Video de bienvenida al Programa',     type: 'video', required: true,  minutes: 6,  desc: 'Introducción al Campus Virtual y al programa.' },
    { id: 'guia-zoom',       code: '1.4', title: 'Guía — Uso de Zoom y Google Meet',    type: 'pdf',   required: false, minutes: 8,  desc: 'Herramientas principal y de contingencia.' },
    { id: 'guia-contingencia',code:'1.5', title: 'Guía — Contingencias técnicas',       type: 'pdf',   required: false, minutes: 5,  desc: 'Qué hacer si fallan audio, video o conexión.' },
  ],
};

// ── Sílabus de Básico I — 32 lecciones + 16 I CAN intercaladas ──────────
// patterns: 2 lecciones → 1 I CAN (siguiendo el documento oficial)
// Fields per lesson:
//   n         : número secuencial (1..32)
//   unit      : Unidad del libro (ej: 'Unit 1')
//   title     : objetivo/título resumen
//   kind      : 'lesson' | 'exam-oral' | 'exam-written'
//   progress  : true si incluye Progress Check
//   objective : objetivo específico (del documento)
//   activity  : situación de aprendizaje (del documento)
//   hours     : duración (3 o 2)
//   materials : [{ kind, title, for: 'estudiante'|'docente'|'ambos', path?, pages? }]
// I CAN slots son separados — se emiten como sesiones, no como lecciones del módulo.

const SYLLABUS_BASICO_I = {
  levelId: 'b1',
  levelName: 'Básico I',
  cefr: 'A1',
  book: 'Student Book Interchange 5ª edición · Intro',
  platform: 'Zoom (contingencia: Google Meet)',
  totalHours: 128,
  totalLessons: 32,
  totalICAN: 16,
  moduleHours: 96,
  icanHours: 32,
  objective: 'Al finalizar el nivel Intro, el estudiante demostrará competencia inicial en la interpretación y producción de enunciados básicos, estableciendo una base sólida de gramática y léxico para avanzar con confianza al nivel A2.',
  specificObjective: 'Dominar el uso del presente simple y presente continuo, formular y responder preguntas wh- y yes/no, describir personas, objetos y rutinas, y aplicar vocabulario esencial en interacciones cotidianas.',
  lessons: [
    { n: 1,  unit:'Unit 1', kind:'lesson', hours:3, title:'Alfabeto y saludos', objective:'Reconocer y usar el alfabeto incluyendo letras y combinaciones básicas.', activity:'Diálogo en parejas intercambiando saludos y deletreando nombres completos.' },
    { n: 2,  unit:'Unit 1', kind:'lesson', hours:3, title:'Presentaciones y cortesía', objective:'Aplicar expresiones de cortesía y presentaciones formales e informales.', activity:"Role play de presentación personal usando 'please', 'thank you' y 'you're welcome'." },
    { n: 3,  unit:'Unit 2', kind:'lesson', hours:3, title:'Objetos de aula y posesivos', objective:'Identificar y nombrar objetos de aula y posesiones personales con adjetivos posesivos.', activity:'Actividad de clasificación de objetos: señalar y nombrar elementos del salón.' },
    { n: 4,  unit:'Unit 2', kind:'lesson', hours:3, progress:true, title:'Posesivos · Progress Check', objective:'Describir posesiones personales usando pronombres posesivos.', activity:"Encuesta a compañeros con 'Is this your book? Yes, it's mine'." },
    { n: 5,  unit:'Unit 3', kind:'lesson', hours:3, title:'Ciudades y países', objective:'Describir ciudades y países usando vocabulario geográfico.', activity:"Mapa interactivo: indicar el origen de compañeros usando 'I am from...'." },
    { n: 6,  unit:'Unit 3', kind:'lesson', hours:3, title:'Adjetivos de personalidad', objective:'Identificar y usar adjetivos de personalidad para describir personas.', activity:'Entrevista: describir a un amigo usando adjetivos de personalidad.' },
    { n: 7,  unit:'Unit 4', kind:'lesson', hours:3, title:'Ropa y colores', objective:'Identificar prendas de vestir y colores básicos.', activity:'Juego: describir atuendos de compañeros.' },
    { n: 8,  unit:'Unit 4', kind:'lesson', hours:3, progress:true, title:'Clima y estaciones · Progress Check', objective:'Describir el clima y las estaciones usando vocabulario apropiado.', activity:'Simulación de pronóstico del tiempo usando imágenes y oraciones.' },
    { n: 9,  unit:'Units 1–4', kind:'exam-oral', hours:3, title:'Examen Oral 1', objective:'Evaluación oral Units 1–4 (15% de la nota final).', activity:'Consultar temas y criterios en el Planeamiento de la lección.' },
    { n:10,  unit:'Unit 5', kind:'lesson', hours:3, title:'La hora y horarios', objective:'Decir la hora y describir horarios diarios.', activity:'Actividad de reloj: leer y escribir la hora, planificar la rutina diaria.' },
    { n:11,  unit:'Unit 5', kind:'lesson', hours:3, title:'Rutinas y frecuencia', objective:'Describir actividades cotidianas usando adverbios de frecuencia.', activity:"Encuesta: preguntar 'What do you do at 7 am?' y registrar respuestas." },
    { n:12,  unit:'Unit 6', kind:'lesson', hours:3, title:'De compras — turismo', objective:'Identificar lugares de compra y vocabulario de objetos turísticos.', activity:'Role play de turista comprando recuerdos.' },
    { n:13,  unit:'Unit 6', kind:'lesson', hours:3, progress:true, title:'Turismo · Progress Check', objective:'Describir atracciones turísticas y precios de souvenirs.', activity:'Presentación: promocionar un lugar turístico.' },
    { n:14,  unit:'Unit 7', kind:'lesson', hours:3, title:'Planes de fin de semana', objective:'Hablar de planes de fin de semana usando presente simple y futuro cercano.', activity:'Diálogo grupal sobre planes de fin de semana.' },
    { n:15,  unit:'Unit 7', kind:'lesson', hours:3, title:'Tareas y ocio', objective:'Describir tareas domésticas y actividades de ocio.', activity:"Entrevista: 'What do you do on weekends?'." },
    { n:16,  unit:'Unit 8', kind:'lesson', hours:3, progress:true, title:'Ocupaciones · Progress Check', objective:'Formular y responder preguntas wh- con do/does sobre ocupaciones.', activity:'Encuesta laboral usando wh- questions.' },
    { n:17,  unit:'Units 5–8', kind:'exam-oral', hours:3, title:'Examen Oral 2', objective:'Evaluación oral Units 5–8 (15% de la nota final).', activity:'Consultar temas y criterios en el Planeamiento de la lección.' },
    { n:18,  unit:'Units 1–8', kind:'exam-written', hours:3, title:'Examen Escrito 1', objective:'Evaluación escrita Units 1–8 (5% de la nota final).', activity:'Formulario en plataforma FORMS y/o Drive.' },
    { n:19,  unit:'Unit 9',  kind:'lesson', hours:3, title:'Comida y hábitos', objective:'Describir gustos y hábitos alimentarios con some/any.', activity:'Debate: expresar preferencias de comida.' },
    { n:20,  unit:'Unit 10', kind:'lesson', hours:3, title:'Rutinas diarias', objective:'Comunicar rutinas diarias con present simple.', activity:'Redacción de horarios diarios.' },
    { n:21,  unit:'Unit 10', kind:'lesson', hours:3, title:'Present simple — formas', objective:'Usar formas afirmativas, negativas e interrogativas en present simple.', activity:'Juego de roles preguntando hábitos.' },
    { n:22,  unit:'Unit 11', kind:'lesson', hours:3, title:'Ubicaciones y direcciones', objective:'Describir ubicaciones usando preposiciones de lugar.', activity:'Actividad de mapa: dar direcciones.' },
    { n:23,  unit:'Unit 12', kind:'lesson', hours:3, title:"Habilidades y permisos — can/can't", objective:"Expresar habilidades y permisos con can/can't.", activity:'Juego de roles pidiendo y dando permiso.' },
    { n:24,  unit:'Unit 12', kind:'lesson', hours:3, progress:true, title:'Present continuous · Progress Check', objective:'Describir acciones en progreso con present continuous.', activity:'Simulación de llamadas describiendo actividades actuales.' },
    { n:25,  unit:'Units 9–12', kind:'exam-oral', hours:3, title:'Examen Oral 3', objective:'Evaluación oral Units 9–12 (15% de la nota final).', activity:'Consultar temas y criterios en el Planeamiento de la lección.' },
    { n:26,  unit:'Unit 13', kind:'lesson', hours:3, title:'Planes futuros — going to', objective:'Hablar de planes futuros usando going to.', activity:'Plan de fin de semana: presentar intenciones futuras.' },
    { n:27,  unit:'Unit 14', kind:'lesson', hours:3, title:'Past simple — experiencias', objective:'Describir experiencias pasadas con past simple.', activity:'Narración de anécdotas personales.' },
    { n:28,  unit:'Unit 14', kind:'lesson', hours:3, progress:true, title:'Past simple · Progress Check', objective:'Formular preguntas en pasado con wh- words.', activity:'Entrevista sobre experiencias pasadas.' },
    { n:29,  unit:'Unit 15', kind:'lesson', hours:3, title:'Lugares de origen', objective:'Describir lugares de origen y hábitos pasados.', activity:'Actividad: escribir sobre tu ciudad natal.' },
    { n:30,  unit:'Unit 16', kind:'lesson', hours:3, progress:true, title:"Must/mustn't · Progress Check", objective:"Usar expresiones de permiso y prohibición con must/mustn't.", activity:'Debate sobre normas y reglas.' },
    { n:31,  unit:'Units 13–16', kind:'exam-oral', hours:3, title:'Examen Oral 4', objective:'Evaluación oral Units 13–16 (15% de la nota final).', activity:'Consultar temas y criterios en el Planeamiento de la lección.' },
    { n:32,  unit:'Units 9–16', kind:'exam-written', hours:3, title:'Examen Escrito 2', objective:'Evaluación escrita Units 9–16 (5% de la nota final).', activity:'Formulario en plataforma FORMS y/o Drive.' },
  ],
};

// I CAN insertion positions — según documento, una sesión después de cada lección par
// (posiciones: después de L2, L4, L6, L8, L10, L12, L14, L16, L18, L20, L22, L24, L26, L28, L30, L31 → 16 sesiones)
const ICAN_SLOTS_AFTER = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 31];

// ── Other levels: reuse structure but different book/content ─────────────
const SYLLABUS_BY_LEVEL = {
  b1: SYLLABUS_BASICO_I,
  b2: { ...SYLLABUS_BASICO_I, levelId:'b2', levelName:'Básico II',    cefr:'A2', book:'Student Book Interchange 1', lessons: SYLLABUS_BASICO_I.lessons.map(l => ({ ...l })) },
  i1: { ...SYLLABUS_BASICO_I, levelId:'i1', levelName:'Intermedio I', cefr:'B1', book:'Student Book Interchange 2', lessons: SYLLABUS_BASICO_I.lessons.map(l => ({ ...l })) },
  i2: { ...SYLLABUS_BASICO_I, levelId:'i2', levelName:'Intermedio II',cefr:'B2', book:'Student Book Interchange 3', lessons: SYLLABUS_BASICO_I.lessons.map(l => ({ ...l })) },
};

// ── Day pattern parsing: 'Mar/Jue 6–9pm' → [2,4] ────────────────────────
// 0=dom, 1=lun, 2=mar, 3=mié, 4=jue, 5=vie, 6=sáb
const DAY_MAP = { 'dom':0, 'lun':1, 'mar':2, 'mié':3, 'mie':3, 'jue':4, 'vie':5, 'sáb':6, 'sab':6 };
function parseScheduleDays(sch) {
  const days = [];
  const norm = sch.toLowerCase().replace(/[–—-]/g, '-');
  Object.keys(DAY_MAP).forEach(k => { if (norm.includes(k)) days.push(DAY_MAP[k]); });
  return [...new Set(days)].sort((a,b)=>a-b);
}

// Add days to a date, advancing by scheduled weekdays only
function addLessonDays(startDate, weekdays, lessonIdx) {
  // lessonIdx=0 returns startDate if startDate is on a weekday
  const d = new Date(startDate.getTime());
  let count = 0;
  while (true) {
    if (weekdays.includes(d.getDay())) {
      if (count === lessonIdx) return new Date(d.getTime());
      count++;
    }
    d.setDate(d.getDate() + 1);
  }
}

// ── Build group schedule: spread syllabus over real dates ────────────────
// group: { scheduleDays: 'Mar/Jue 6–9pm', startDate: '2026-05-05' }
// suspensions: [{ lessonN, action:'suspended'|'rescheduled', newDate?, reason, by, detail }]
function buildGroupSchedule(levelId, group, suspensions = []) {
  const syl = SYLLABUS_BY_LEVEL[levelId];
  if (!syl) return [];
  const weekdays = parseScheduleDays(group.scheduleDays || 'Lun/Mié');
  const start = new Date(group.startDate + 'T00:00:00');

  // 1) base scheduled dates — 32 lessons, skip I CAN (I CAN is separate stream)
  const items = [];
  for (let i = 0; i < syl.lessons.length; i++) {
    const les = syl.lessons[i];
    const date = addLessonDays(start, weekdays, i);
    items.push({
      ...les,
      baseDate: date,
      date: new Date(date.getTime()),  // may change via suspensions
      status: 'scheduled',              // scheduled | done | suspended | rescheduled
      suspension: null,
    });
  }

  // 2) apply suspensions (in order)
  suspensions.forEach(s => {
    const idx = items.findIndex(x => x.n === s.lessonN);
    if (idx < 0) return;
    if (s.action === 'suspended' && !s.newDate) {
      // cascade: push this and subsequent lessons to next scheduled weekday
      // simpler: bump each following lesson to the next weekday slot
      for (let j = idx; j < items.length; j++) {
        const cur = items[j];
        // advance by 1 weekday slot
        const d = new Date(cur.date.getTime());
        d.setDate(d.getDate() + 1);
        while (!weekdays.includes(d.getDay())) d.setDate(d.getDate() + 1);
        items[j].date = d;
      }
      items[idx].status = 'suspended';
      items[idx].suspension = s;
    } else if (s.action === 'rescheduled' && s.newDate) {
      // moved to a specific new date; subsequent lessons stay
      items[idx].date = new Date(s.newDate + 'T00:00:00');
      items[idx].status = 'rescheduled';
      items[idx].suspension = s;
    }
    if (s.action === 'done') items[idx].status = 'done';
  });

  return items;
}

// ── Demo group + suspensions ─────────────────────────────────────────────
// Santiago está en G0001-2026 · Básico I · Lun/Mié 6–9pm · inicio 5 may 2026
// El prototipo asume "hoy" = 18 abr 2026 según contexto del sistema, pero como
// el grupo inicia en mayo, mejor usar fechas que reflejen un grupo "en curso":
// Lo movemos un ciclo atrás visualmente → inicio real 2 feb 2026 para que
// hoy (18 abr 2026) caiga ~lección 21 y existan lecciones pasadas/futuras visibles.
const DEMO_GROUP = {
  code: 'G0001-2026',
  levelId: 'b1',
  scheduleDays: 'Lun/Mié 6–9pm',
  startDate: '2026-02-02',
  teacher: 'Ricardo Arias',
};

const DEMO_SUSPENSIONS = [
  { lessonN: 8,  action:'rescheduled', newDate:'2026-02-28', reason:'Enfermedad del profesor', by:'teacher', byName:'Ricardo Arias', detail:'Gripe — reprogramado vía consenso en WhatsApp al sábado.', approvedBy:'Admin', approvedDate:'2026-02-24' },
  { lessonN: 12, action:'suspended',   reason:'Feriado oficial',          by:'system', byName:'Sistema', detail:'11 Abril — Día de Juan Santamaría. Cascada aplicada.' },
];

// ── I CAN sessions for the week — student-facing catalog ──────────────────
const ICAN_CATALOG = [
  { id:'ic-401', topic:'Apertura · Introducing Yourself', level:'Básico I · A1', teacher:'Sofía Méndez',  date:'vie 24 abr', time:'6:00–8:00 pm', cap:20, enrolled:13, status:'open',    language:'Español · Inglés' },
  { id:'ic-402', topic:'Apertura · Introducing Yourself', level:'Básico I · A1', teacher:'Kevin Brown',   date:'sáb 25 abr', time:'9:00–11:00 am',cap:20, enrolled:17, status:'filling', language:'Inglés' },
  { id:'ic-403', topic:'Family & Friends',                level:'Básico I · A1', teacher:'Laura Vargas',  date:'vie 24 abr', time:'8:30–10:30 pm',cap:20, enrolled:7,  status:'open',    language:'Español · Inglés' },
  { id:'ic-404', topic:'Shopping Situations',             level:'Básico II · A2',teacher:'Daniel Castro', date:'mié 22 abr', time:'6:00–8:00 pm', cap:20, enrolled:11, status:'open',    language:'Inglés' },
  { id:'ic-405', topic:'Giving Directions',               level:'Intermedio I',  teacher:'Ana Castro',    date:'jue 23 abr', time:'7:00–9:00 pm', cap:20, enrolled:9,  status:'open',    language:'Inglés' },
];

// I CAN sessions history — for admin/teacher tracking
const ICAN_HISTORY = [
  { id:'ic-380', topic:'Apertura · Introducing Yourself', teacher:'Sofía Méndez',  date:'2026-04-17', attended:14, cap:20, status:'given',     duration:2 },
  { id:'ic-381', topic:'Apertura · Introducing Yourself', teacher:'Kevin Brown',   date:'2026-04-18', attended:18, cap:20, status:'given',     duration:2 },
  { id:'ic-382', topic:'Family & Friends',                teacher:'Laura Vargas',  date:'2026-04-17', attended:6,  cap:20, status:'given',     duration:2 },
  { id:'ic-383', topic:'At the Restaurant',               teacher:'Ricardo Arias', date:'2026-04-15', attended:0,  cap:20, status:'cancelled', duration:0, cancelledBy:'Ricardo Arias', cancelReason:'Enfermedad', detail:'Estudiantes redirigidos a sesión de Laura Vargas ese día.' },
  { id:'ic-384', topic:'Shopping Situations',             teacher:'Daniel Castro', date:'2026-04-16', attended:11, cap:20, status:'given',     duration:2 },
];

// ── Format helpers ───────────────────────────────────────────────────────
const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DAYS_ES_SHORT = ['dom','lun','mar','mié','jue','vie','sáb'];
const DAYS_ES_LONG  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

function fmtDate(d) {
  if (!d) return '—';
  const dd = d instanceof Date ? d : new Date(d);
  return `${DAYS_ES_SHORT[dd.getDay()]} ${dd.getDate()} ${MONTHS_ES[dd.getMonth()]}`;
}
function fmtDateLong(d) {
  if (!d) return '—';
  const dd = d instanceof Date ? d : new Date(d);
  return `${DAYS_ES_LONG[dd.getDay()]} ${dd.getDate()} de ${MONTHS_ES[dd.getMonth()]} ${dd.getFullYear()}`;
}

// Expose globals
Object.assign(window, {
  PRIORITY_BLOCK,
  SYLLABUS_BY_LEVEL, SYLLABUS_BASICO_I,
  ICAN_SLOTS_AFTER,
  DEMO_GROUP, DEMO_SUSPENSIONS,
  ICAN_CATALOG, ICAN_HISTORY,
  buildGroupSchedule, parseScheduleDays,
  fmtDate, fmtDateLong, MONTHS_ES, DAYS_ES_SHORT, DAYS_ES_LONG,
});
