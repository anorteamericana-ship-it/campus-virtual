/* global window */
// ── Data: users, courses, lessons, icanSessions, grades, messages ──────────

const STUDENT = {
  code: '0001',
  name: 'Santiago Salazar Chacón',
  short: 'Santiago',
  initials: 'SS',
  email: 'santiago.salazar@alumno.anorteamerican.com',
  phone: '+506 8888-1234',
  avatar: null,
  group: 'G0001-2026',
  level: 'Básico I',
  levelIdx: 0, // 0..3
  book: 'Interchange Intro',
  teacher: 'Ricardo Arias Arroyo',
  startDate: '2026-05-05',
  schedule: 'Lun/Mié 6:00–9:00 pm',
  horas: 50, // de 96 (56% = ~18/32 lecciones × 3h = 54h, aprox 50h)
  progress: 56, // %
};

const LEVELS = [
  { name: 'Básico I',     book: 'Interchange Intro', color: '#E5A823', status: 'progress' },
  { name: 'Básico II',    book: 'Interchange 1',     color: '#D03020', status: 'locked' },
  { name: 'Intermedio I', book: 'Interchange 2',     color: '#1060C0', status: 'locked' },
  { name: 'Intermedio II',book: 'Interchange 3',     color: '#208840', status: 'locked' },
];

const NEXT_LESSONS = [
  { n: 16, date: 'Hoy · Mié 15 jul', time: '6:00–9:00 pm', title: 'Where do you work?', unit: 'Progress Check U7–U8', type: 'prg', status: 'next' },
  { n: 17, date: 'Lun 20 jul',       time: '6:00–9:00 pm', title: 'Oral Test 2',        unit: 'Units 05–08',         type: 'oral', status: 'pending', weight: '15%' },
  { n: 18, date: 'Mié 22 jul',       time: '6:00–9:00 pm', title: 'Written Test 1',     unit: 'Units 01–08',         type: 'esc',  status: 'pending', weight: '5%' },
  { n: 19, date: 'Lun 27 jul',       time: '6:00–9:00 pm', title: 'I always eat breakfast.', unit: 'Unit 09',         type: 'lec',  status: 'pending' },
  { n: 20, date: 'Mié 29 jul',       time: '6:00–9:00 pm', title: 'What sports do you like?', unit: 'Unit 10',       type: 'lec',  status: 'pending' },
];

const RECENT_LESSONS = [
  { n: 14, date: 'Mié 8 jul',  title: 'Does it have a view?', unit: 'Unit 07', type: 'lec',  grade: 'A' },
  { n: 15, date: 'Lun 13 jul', title: 'Does it have a view?', unit: 'Unit 07', type: 'lec',  grade: 'A' },
];

const GRADES = [
  { lesson: 9,  title: 'Oral Test 1',    unit: 'Units 01–04', date: '27 may 2026', score: 22, max: 25, pct: 88.0, weight: '15%', final: '13.2%', grade: 'B+', type: 'oral' },
  { lesson: 18, title: 'Written Test 1', unit: 'Units 01–08', date: '22 jul 2026', score: null, max: 25,  pct: null, weight: '5%',  final: '—', grade: '—', type: 'esc', status: 'pending' },
  { lesson: 17, title: 'Oral Test 2',    unit: 'Units 05–08', date: '20 jul 2026', score: null, max: 25, pct: null, weight: '15%', final: '—', grade: '—', type: 'oral', status: 'pending' },
  { lesson: 4,  title: 'Progress Check', unit: 'U1–U2',       date: '19 may 2026', score: 9,  max: 10, pct: 90.0, weight: '2%',  final: '1.8%',  grade: 'A',  type: 'prg' },
  { lesson: 8,  title: 'Progress Check', unit: 'U3–U4',       date: '26 may 2026', score: 10, max: 10, pct: 100, weight: '2%',  final: '2.0%',  grade: 'A+', type: 'prg' },
  { lesson: 13, title: 'Progress Check', unit: 'U5–U6',       date: '23 jun 2026', score: 8,  max: 10, pct: 80,  weight: '2%',  final: '1.6%',  grade: 'B',  type: 'prg' },
  { lesson: 16, title: 'Progress Check', unit: 'U7–U8',       date: 'Hoy',        score: null, max: 10, pct: null, weight: '2%',  final: '—',    grade: '—', type: 'prg', status: 'today' },
];

const ICAN_SESSIONS = [
  { id: 's1', day: 'Vie 17 jul', time: '9:00–11:00 am',  topic: 'Describing People & Clothing', teacher: 'Sofía Méndez', seats: 14, cap: 20, enrolled: false, shift: 'mañana' },
  { id: 's2', day: 'Vie 17 jul', time: '6:00–8:00 pm',   topic: 'Daily Routines & Small Talk',  teacher: 'Kevin Brown',  seats: 12, cap: 20, enrolled: true,  shift: 'tarde'  },
  { id: 's3', day: 'Sáb 18 jul', time: '9:00–11:00 am',  topic: 'Food & Restaurants',           teacher: 'Ana Castro',   seats: 20, cap: 20, enrolled: false, shift: 'mañana' },
  { id: 's4', day: 'Vie 24 jul', time: '9:00–11:00 am',  topic: 'Travel Plans',                 teacher: 'Sofía Méndez', seats: 9,  cap: 20, enrolled: false, shift: 'mañana' },
  { id: 's5', day: 'Vie 24 jul', time: '6:00–8:00 pm',   topic: 'Job Interviews',               teacher: 'Kevin Brown',  seats: 16, cap: 20, enrolled: false, shift: 'tarde'  },
  { id: 's6', day: 'Sáb 25 jul', time: '9:00–11:00 am',  topic: 'Weekend Stories',              teacher: 'Ana Castro',   seats: 6,  cap: 20, enrolled: false, shift: 'mañana' },
];

const FEEDBACK = [
  { lesson: 15, date: '13 jul', teacher: 'Ricardo Arias', text: 'Muy buen uso de "have/has". Tus descripciones fueron claras y naturales. Sigue practicando la pronunciación de "-th".' },
  { lesson: 14, date: '8 jul',  teacher: 'Ricardo Arias', text: 'Excelente participación hoy. Atento a los pronombres posesivos — confundiste "its" con "it\'s" un par de veces.' },
  { lesson: 13, date: '23 jun', teacher: 'Ricardo Arias', text: 'Nota del Progress Check: 80%. Repasa preposiciones de lugar (in front of / behind / next to) antes del próximo test oral.' },
];

const HOMEWORK = [
  { id: 'hw1', title: 'Workbook p.42–45 · Units 7 exercises', due: '16 jul', status: 'pending', assigned: '13 jul', type: 'workbook' },
  { id: 'hw2', title: 'Listening Self-Study · U7 "At home"',  due: '17 jul', status: 'pending', assigned: '13 jul', type: 'listening' },
  { id: 'hw3', title: 'Video: Our Town (10 min) + 5 preguntas', due: '20 jul', status: 'pending', assigned: '15 jul', type: 'video' },
  { id: 'hw4', title: 'Workbook p.36–39 · Unit 6',            due: '8 jul',  status: 'done',    assigned: '6 jul',  type: 'workbook', grade: 'A' },
  { id: 'hw5', title: 'Speaking Practice · Describe tu casa', due: '10 jul', status: 'done',    assigned: '8 jul',  type: 'speaking', grade: 'A-' },
  { id: 'hw6', title: 'Reading · "My neighborhood" + quiz',   due: '6 jul',  status: 'done',    assigned: '1 jul',  type: 'reading', grade: 'B+' },
];

const MATERIALS = [
  { title: 'Interchange Intro — Student\'s Book', type: 'pdf',   size: '48 MB', unit: 'Completo',  icon: 'book' },
  { title: 'Workbook Intro',                     type: 'pdf',   size: '22 MB', unit: 'Completo',  icon: 'book' },
  { title: 'Self-Study Audio · Units 7–8',       type: 'audio', size: '32 MB', unit: 'U7–U8',     icon: 'audio' },
  { title: 'Video Program · Unit 7',             type: 'video', size: '140 MB',unit: 'U7',        icon: 'video' },
  { title: 'Grammar Reference — Past Tense',     type: 'pdf',   size: '2.1 MB',unit: 'Material',  icon: 'doc' },
  { title: 'Vocabulary List · Unit 7 (printable)', type: 'pdf', size: '0.8 MB',unit: 'U7',       icon: 'doc' },
];

const MESSAGES = [
  { from: 'Ricardo Arias', role: 'Docente', me: false, text: 'Hola Santiago, recuerda el Oral Test 2 el próximo lunes. ¿Tienes dudas sobre Units 5–8?', time: '10:32 am' },
  { from: 'Santiago',      role: 'Yo',      me: true,  text: 'Gracias profe. Sí, estoy un poco nervioso con las unidades de rutinas y profesiones.',      time: '10:45 am' },
  { from: 'Ricardo Arias', role: 'Docente', me: false, text: 'Tranquilo. Revisa el material de U6 que te envié y practica con las preguntas del banco. El viernes hay I CAN de Daily Routines — te recomiendo reservar.', time: '10:48 am' },
  { from: 'Santiago',      role: 'Yo',      me: true,  text: 'Listo, ya reservé la sesión de la tarde del viernes. ¡Gracias!', time: '11:01 am' },
];

const PAYMENTS = [
  { id: 'F-2026-0189', concept: 'Mensualidad Julio 2026',  amount: 85000, date: '5 jul 2026',  status: 'paid' },
  { id: 'F-2026-0142', concept: 'Mensualidad Junio 2026',  amount: 85000, date: '5 jun 2026',  status: 'paid' },
  { id: 'F-2026-0098', concept: 'Mensualidad Mayo 2026 + Matrícula', amount: 135000, date: '5 may 2026', status: 'paid' },
  { id: 'F-2026-0245', concept: 'Mensualidad Agosto 2026', amount: 85000, date: '5 ago 2026',  status: 'upcoming' },
];

// Estados por concepto: 'paid' | 'pending' | 'upcoming' (en tiempo) | 'locked' (nivel futuro) | 'waived'
// Cada nivel = Matrícula (1) + Cuotas mensuales (4) + Certificado (1)
const LEVEL_FINANCE = [
  {
    id: 'b1',
    name: 'Básico I',
    book: 'Interchange Intro',
    period: 'May – Ago 2026',
    color: '#E5A823',
    status: 'current',           // completed | current | next | locked
    academicStatus: 'aprobado',  // aprobado | cursando | pendiente | locked
    // resumen financiero
    matricula:   { amount: 50000, status: 'paid', date: '5 may 2026', id: 'F-2026-0098' },
    cuotas: [
      { n: 1, label: 'Mayo',   amount: 85000, status: 'paid',     date: '5 may 2026', id: 'F-2026-0098' },
      { n: 2, label: 'Junio',  amount: 85000, status: 'paid',     date: '5 jun 2026', id: 'F-2026-0142' },
      { n: 3, label: 'Julio',  amount: 85000, status: 'paid',     date: '5 jul 2026', id: 'F-2026-0189' },
      { n: 4, label: 'Agosto', amount: 85000, status: 'upcoming', date: '5 ago 2026', id: 'F-2026-0245' },
    ],
    certificado: { amount: 18000, status: 'pending', label: 'Certificado de Nivel', note: 'Se emite al aprobar · opcional' },
  },
  {
    id: 'b2',
    name: 'Básico II',
    book: 'Interchange 1',
    period: 'Sep – Dic 2026',
    color: '#D03020',
    status: 'next',
    academicStatus: 'pendiente',
    matricula:   { amount: 50000, status: 'pending', date: 'Vence 20 ago 2026', note: 'Reserva tu cupo' },
    cuotas: [
      { n: 1, label: 'Septiembre', amount: 85000, status: 'locked', date: '5 sep' },
      { n: 2, label: 'Octubre',    amount: 85000, status: 'locked', date: '5 oct' },
      { n: 3, label: 'Noviembre',  amount: 85000, status: 'locked', date: '5 nov' },
      { n: 4, label: 'Diciembre',  amount: 85000, status: 'locked', date: '5 dic' },
    ],
    certificado: { amount: 18000, status: 'locked', label: 'Certificado de Nivel' },
  },
  {
    id: 'i1',
    name: 'Intermedio I',
    book: 'Interchange 2',
    period: 'Ene – Abr 2027',
    color: '#1060C0',
    status: 'locked',
    academicStatus: 'locked',
    matricula:   { amount: 50000, status: 'locked' },
    cuotas: [
      { n: 1, label: 'Enero',   amount: 85000, status: 'locked' },
      { n: 2, label: 'Febrero', amount: 85000, status: 'locked' },
      { n: 3, label: 'Marzo',   amount: 85000, status: 'locked' },
      { n: 4, label: 'Abril',   amount: 85000, status: 'locked' },
    ],
    certificado: { amount: 18000, status: 'locked', label: 'Certificado de Nivel' },
  },
  {
    id: 'i2',
    name: 'Intermedio II',
    book: 'Interchange 3',
    period: 'May – Ago 2027',
    color: '#208840',
    status: 'locked',
    academicStatus: 'locked',
    matricula:   { amount: 50000, status: 'locked' },
    cuotas: [
      { n: 1, label: 'Mayo',   amount: 85000, status: 'locked' },
      { n: 2, label: 'Junio',  amount: 85000, status: 'locked' },
      { n: 3, label: 'Julio',  amount: 85000, status: 'locked' },
      { n: 4, label: 'Agosto', amount: 85000, status: 'locked' },
    ],
    certificado: { amount: 35000, status: 'locked', label: 'Diploma Final · INA', note: 'Incluye trámite oficial' },
  },
];

const CERTIFICATES = [
  { title: 'Certificado de Inscripción · INA Resolución 2519', issued: '5 may 2026', status: 'active' },
  { title: 'Constancia de Matrícula · Básico I',              issued: '5 may 2026', status: 'active' },
];

// ── Teacher view data ─────────────────────────────────────────────────────
const GROUP_ROSTER = [
  { code: '0001', name: 'Salazar Chacón Santiago',     avg: 88, att: 94, status: 'al-dia', oral: 22, lastSeen: 'Hoy' },
  { code: '0002', name: 'Rodríguez Mora Ana Lucía',     avg: 92, att: 100, status: 'al-dia', oral: 24, lastSeen: 'Hoy' },
  { code: '0003', name: 'Vargas Jiménez Carlos Mario',  avg: 78, att: 81, status: 'atencion', oral: 19, lastSeen: 'Hoy' },
  { code: '0004', name: 'Miranda Solano Luisa Fernanda',avg: 85, att: 88, status: 'al-dia', oral: 21, lastSeen: 'Hoy' },
  { code: '0005', name: 'Herrera Quesada Marco Antonio',avg: 71, att: 69, status: 'riesgo', oral: 17, lastSeen: 'Hace 4 días' },
  { code: '0006', name: 'Campos Brenes Diana Marcela',  avg: 95, att: 100, status: 'al-dia', oral: 25, lastSeen: 'Hoy' },
  { code: '0007', name: 'Vega Soto Esteban Rodrigo',    avg: 82, att: 88, status: 'al-dia', oral: 20, lastSeen: 'Hoy' },
  { code: '0008', name: 'Fonseca Luna Patricia Elena',  avg: 90, att: 94, status: 'al-dia', oral: 23, lastSeen: 'Hoy' },
  { code: '0009', name: 'Mora Quirós Alejandro David',  avg: 68, att: 63, status: 'riesgo', oral: 14, lastSeen: 'Hace 1 semana' },
  { code: '0010', name: 'Jiménez Rojas Valeria Sofía',  avg: 87, att: 94, status: 'al-dia', oral: 22, lastSeen: 'Hoy' },
];

const TEACHER_GROUPS = [
  { code: 'G0001-2026', level: 'Básico I',     sch: 'Lun/Mié 6–9pm',   students: 10, progress: 56, lec: '16 / 32' },
  { code: 'G0014-2026', level: 'Básico II',    sch: 'Mar/Jue 6–9pm',   students: 8,  progress: 38, lec: '12 / 32' },
  { code: 'G0022-2026', level: 'Intermedio I', sch: 'Sáb 8am–1pm',     students: 12, progress: 72, lec: '23 / 32' },
];

// ── Admin view data ───────────────────────────────────────────────────────
const ADMIN_KPIS = {
  students: 284,
  groups: 22,
  teachers: 11,
  retention: 89,
  revenue: 24140000, // CRC este mes
  newEnrollments: 38,
};

const ADMIN_GROUPS = [
  { code: 'G0001-2026', level: 'Básico I',     teacher: 'Ricardo Arias',  students: 10, cap: 12, schedule: 'Lun/Mié 6–9pm',   progress: 56, status: 'activo' },
  { code: 'G0002-2026', level: 'Básico I',     teacher: 'Sofía Méndez',   students: 8,  cap: 12, schedule: 'Mar/Jue 6–9pm',   progress: 54, status: 'activo' },
  { code: 'G0003-2026', level: 'Básico I',     teacher: 'Kevin Brown',    students: 12, cap: 12, schedule: 'Sáb 8am–1pm',     progress: 58, status: 'lleno' },
  { code: 'G0014-2026', level: 'Básico II',    teacher: 'Ricardo Arias',  students: 8,  cap: 12, schedule: 'Mar/Jue 6–9pm',   progress: 38, status: 'activo' },
  { code: 'G0022-2026', level: 'Intermedio I', teacher: 'Ricardo Arias',  students: 12, cap: 12, schedule: 'Sáb 8am–1pm',     progress: 72, status: 'lleno' },
  { code: 'G0031-2026', level: 'Intermedio II',teacher: 'Ana Castro',     students: 6,  cap: 12, schedule: 'Lun/Mié 9am–12pm',progress: 81, status: 'activo' },
];

const ADMIN_ALERTS = [
  { level: 'high',   title: 'G0031 bajo cupo mínimo', detail: 'Solo 6 estudiantes en Intermedio II — revisar política de apertura.', date: 'Hoy' },
  { level: 'med',    title: '2 estudiantes en riesgo en G0001', detail: 'Herrera Quesada y Mora Quirós con asistencia <70%.', date: 'Hoy' },
  { level: 'low',    title: 'Renovación INA Resolución 2519',  detail: 'Vencimiento en 14 meses — iniciar trámite en noviembre.', date: 'Hace 2 días' },
];

// Expose globals
Object.assign(window, {
  STUDENT, LEVELS, NEXT_LESSONS, RECENT_LESSONS, GRADES, ICAN_SESSIONS,
  FEEDBACK, HOMEWORK, MATERIALS, MESSAGES, PAYMENTS, CERTIFICATES,
  LEVEL_FINANCE,
  GROUP_ROSTER, TEACHER_GROUPS, ADMIN_KPIS, ADMIN_GROUPS, ADMIN_ALERTS,
});
