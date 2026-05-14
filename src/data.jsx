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
  { name: 'Básico II',    book: 'Interchange 1',     color: '#E8372A', status: 'locked' },
  { name: 'Intermedio I', book: 'Interchange 2',     color: '#2B7FC1', status: 'locked' },
  { name: 'Intermedio II',book: 'Interchange 3',     color: '#4CAF50', status: 'locked' },
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
    color: '#E8372A',
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
    color: '#2B7FC1',
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
    color: '#4CAF50',
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

// Expose globals
Object.assign(window, {
  STUDENT, LEVELS, GRADES, ICAN_SESSIONS,
  FEEDBACK, HOMEWORK, MATERIALS, MESSAGES, PAYMENTS, CERTIFICATES,
  LEVEL_FINANCE,
});
