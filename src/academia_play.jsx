/* global React, Icon */
// F98.4-Z6-CS3 · Academia Play V1.6 catálogo móvil + prematrícula unificada.
// Frontend/demo únicamente: no llama backend, no guarda intentos, no crea rankings y no modifica notas oficiales.

const { useMemo: apUseMemo, useState: apUseState } = React;

function apNormCedula(v) {
  return String(v || '').replace(/[^0-9]/g, '');
}

function apRole(role, rolReal) {
  return String(rolReal || role || '').toLowerCase();
}

function apEsUsuarioGratis(usuario, role, rolReal) {
  const rol = apRole(role, rolReal);
  if (rol !== 'student') return false;
  const tipo = String(usuario?.tipoUsuario || usuario?.tipo_usuario || usuario?.origen || usuario?.ORIGEN || usuario?.etapa || usuario?.ETAPA || '').toLowerCase();
  const explicito = /gratis|free|prospect|prematric|lead|formulario/.test(tipo);
  const cod = String(usuario?.codigo || usuario?.CODIGO || usuario?.CODIGO_ESTUDIANTE || '').trim();
  const grupo = String(usuario?.grupo || usuario?.GRUPO || usuario?.grupo_actual || usuario?.GRUPO_ACTUAL || '').trim();
  const matricula = String(usuario?.matricula || usuario?.MATRICULA || usuario?.estadoAcademico || usuario?.ESTADO_ACADEMICO || '').trim();
  const nivel = String(usuario?.nivel_activo || usuario?.NIVEL_ACTIVO || usuario?.estatus_activo || usuario?.ESTATUS_ACTIVO || '').trim();
  const niveles = usuario?.niveles_estatus || usuario?.NIVELES_ESTATUS || null;
  const tieneNivelOficial = !!(nivel || (niveles && typeof niveles === 'object' && Object.values(niveles).some(v => String(v || '').trim())));
  return explicito || (!cod && !grupo && !matricula && !tieneNivelOficial);
}

function apEsUsuarioPiloto(usuario, role, rolReal) {
  const rol = apRole(role, rolReal);
  if (rol === 'superadmin' || rol === 'admin' || rol === 'teacher' || rol === 'student') return true;
  const ced = apNormCedula(usuario?.cedula || usuario?.CEDULA || usuario?.identificacion || usuario?.IDENTIFICACION || usuario?.documento || usuario?.DOCUMENTO || usuario?.id || usuario?.ID);
  const cod = String(usuario?.codigo || usuario?.CODIGO || usuario?.CODIGO_ESTUDIANTE || '').trim().toUpperCase();
  if (ced === '120180140' || cod === '120814') return true;
  try {
    const q = new URLSearchParams(window.location.search || '');
    if (q.get('aplay') === '1' || q.get('play') === '1') return true;
    if (localStorage.getItem('an_academia_play_piloto') === '1') return true;
  } catch (_) {}
  return false;
}

function apFirstName(usuario) {
  const raw = String(usuario?.nombre || usuario?.NOMBRE || 'Estudiante').trim();
  return raw.split(/\s+/)[0] || 'Estudiante';
}

function apShuffleStatic(arr) {
  return [...arr].sort((a, b) => String(a.es || a.label || a).localeCompare(String(b.es || b.label || b)));
}

const AP_GAMES = [
  {
    id: 'vocabulary', title: 'Vocabulary Sprint', type: 'Vocabulario', category: 'Vocabulario', skill: 'Words', unit: 'B1 · Unidad 1',
    desc: 'Selección rápida de palabras esenciales para presentarte, saludar y entender instrucciones.',
    duration: '7 preg · ≈5 min', level: 'Desde Básico I', status: 'free', accent: 'red',
  },
  {
    id: 'word_match', title: 'Word Match', type: 'Asociación', category: 'Vocabulario', skill: 'Match', unit: 'B1 · Rutinas',
    desc: 'Uní palabras en inglés con su significado en español, un par a la vez.',
    duration: '8 pares · ≈4 min', level: 'Básico I–II', status: 'free', accent: 'navy',
  },
  {
    id: 'daily', title: 'Daily Challenge', type: 'Reto diario', category: 'Mixto', skill: 'Mixed', unit: 'Libre',
    desc: 'Cinco preguntas mezcladas para practicar sin esperar a que se active la matrícula.',
    duration: '5 preg · ≈3 min', level: 'Todos los niveles', status: 'free', accent: 'gold',
  },
  {
    id: 'phrase_builder', title: 'Phrase Builder', type: 'Frases útiles', category: 'Speaking', skill: 'Phrase', unit: 'B1 · Presentarse',
    desc: 'Construí respuestas cortas para nombre, edad, país, teléfono y disponibilidad.',
    duration: '6 preg · ≈5 min', level: 'Desde Básico I', status: 'free', accent: 'blue',
  },
  {
    id: 'survival_english', title: 'Survival English', type: 'Clase real', category: 'Mixto', skill: 'Classroom', unit: 'B1 · Aula',
    desc: 'Frases de supervivencia para pedir ayuda, repetir, confirmar y participar en Zoom.',
    duration: '6 preg · ≈6 min', level: 'Desde Básico I', status: 'free', accent: 'navy',
  },
  {
    id: 'grammar', title: 'Grammar Builder', type: 'Gramática', category: 'Gramática', skill: 'Grammar', unit: 'B1–B2',
    desc: 'Elegí la estructura correcta y recibí explicación inmediata.',
    duration: '6 preg · ≈8 min', level: 'Desde Básico II', status: 'matriculated', accent: 'navy',
  },
  {
    id: 'sentence_order', title: 'Sentence Order', type: 'Ordenar oración', category: 'Gramática', skill: 'Syntax', unit: 'B1 · Preguntas',
    desc: 'Construí frases correctas acomodando palabras en el orden natural.',
    duration: '5 frases · ≈7 min', level: 'Desde Básico I', status: 'matriculated', accent: 'blue',
  },
  {
    id: 'listening', title: 'Listening Boost', type: 'Escucha', category: 'Escucha', skill: 'Listening', unit: 'B2 · Diálogos',
    desc: 'Práctica de escucha guiada. En CS3 usa transcripción demo hasta definir audio real.',
    duration: '5 escenas · ≈6 min', level: 'Desde Básico II', status: 'matriculated', accent: 'blue',
  },
  {
    id: 'reading_flash', title: 'Reading Flash', type: 'Lectura', category: 'Lectura', skill: 'Reading', unit: 'I1 · Mini texto',
    desc: 'Leé un texto corto y respondé comprensión general, detalle y vocabulario.',
    duration: '5 preg · ≈7 min', level: 'Desde Intermedio I', status: 'matriculated', accent: 'gold',
  },
  {
    id: 'live', title: 'Live Trivia', type: 'En vivo', category: 'En vivo', skill: 'Live', unit: 'Grupo',
    desc: 'Sala grupal que la docente activa durante la clase. Resultado de actividad, no ranking permanente.',
    duration: 'La define el docente', level: 'Con tu grupo', status: 'live', accent: 'red',
  },
  {
    id: 'conversation_cards', title: 'Conversation Cards', type: 'Speaking', category: 'Speaking', skill: 'Speaking', unit: 'Club I CAN',
    desc: 'Tarjetas de conversación para practicar en clase o Club I CAN. Aún no se guarda evidencia.',
    duration: 'Próximamente', level: 'Todos los niveles', status: 'soon', accent: 'muted',
  },
  {
    id: 'pronunciation_lab', title: 'Pronunciation Lab', type: 'Pronunciación', category: 'Speaking', skill: 'Pronunciation', unit: 'Voz',
    desc: 'Módulo reservado para audio/voz. No se simula producción sin definir tecnología y permisos.',
    duration: 'Próximamente', level: 'Todos los niveles', status: 'soon', accent: 'muted',
  },
];

const AP_FLOWS = {
  vocabulary: {
    kind: 'choice', title: 'Vocabulary Sprint', badge: 'Gratis', unit: 'Primeras palabras',
    intro: 'Elegí la traducción correcta antes de que se agote el tiempo.',
    how: ['Leé la palabra o frase en inglés.', 'Marcá una opción y confirmá.', 'Al final ves un resumen demo.'],
    questions: [
      { type: 'Vocabulario', prompt: '¿Qué significa…?', stem: 'breakfast', options: ['Cena', 'Desayuno', 'Almuerzo', 'Merienda'], correct: 1, explain: 'Breakfast = desayuno.' },
      { type: 'Vocabulario', prompt: 'Choose the greeting.', stem: 'Saludo para la mañana:', options: ['Good morning', 'I am twenty', 'Red table', 'She works'], correct: 0, explain: '“Good morning” es un saludo.' },
      { type: 'Vocabulario', prompt: 'Choose the meaning.', stem: 'Classmate', options: ['Compañero de clase', 'Profesor', 'Horario', 'Cuaderno'], correct: 0, explain: 'Classmate es una persona que estudia con vos.' },
      { type: 'Vocabulario', prompt: 'Complete the idea.', stem: 'My phone number is ____.', options: ['8788-3939', 'Monday', 'Costa Rica', 'Fine'], correct: 0, explain: 'Un número telefónico responde a “phone number”.' },
      { type: 'Vocabulario', prompt: 'Choose the correct phrase.', stem: 'Para despedirte:', options: ['See you later', 'How old are you?', 'I live in', 'Open the book'], correct: 0, explain: '“See you later” se usa para despedirse.' },
      { type: 'Vocabulario', prompt: 'Choose the classroom object.', stem: 'Cuaderno:', options: ['Notebook', 'Window', 'Teacher', 'Schedule'], correct: 0, explain: 'Notebook = cuaderno.' },
      { type: 'Vocabulario', prompt: 'Choose the day.', stem: 'Martes:', options: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'], correct: 0, explain: 'Tuesday = martes.' },
    ],
  },
  daily: {
    kind: 'choice', title: 'Daily Challenge', badge: 'Gratis', unit: 'Reto mixto',
    intro: 'Un reto corto con vocabulario, gramática y preguntas de clase.',
    how: ['Respondé cinco preguntas rápidas.', 'No hay nota oficial.', 'Podés repetir para practicar.'],
    questions: [
      { type: 'Daily', prompt: 'Choose the correct answer.', stem: 'How are you?', options: ['I am fine, thanks.', 'I am Costa Rica.', 'I am Monday.', 'I am English.'], correct: 0, explain: '“I am fine, thanks” responde cómo estás.' },
      { type: 'Daily', prompt: 'Complete.', stem: 'She ____ a student.', options: ['is', 'are', 'am', 'be'], correct: 0, explain: 'Con “she” usamos “is”.' },
      { type: 'Daily', prompt: 'Choose the question.', stem: 'Respuesta: I live in Guadalupe.', options: ['Where do you live?', 'How old are you?', 'What time is it?', 'Who is she?'], correct: 0, explain: 'Where pregunta por lugar.' },
      { type: 'Daily', prompt: 'Choose the classroom instruction.', stem: 'Abrí el libro.', options: ['Open your book.', 'Close your eyes.', 'Stand up.', 'Spell your name.'], correct: 0, explain: 'Open your book = abrí el libro.' },
      { type: 'Daily', prompt: 'Choose the correct sentence.', stem: 'Presentación:', options: ['My name is Camila.', 'My name are Camila.', 'I name Camila.', 'Name my is Camila.'], correct: 0, explain: 'My name is + nombre.' },
    ],
  },
  phrase_builder: {
    kind: 'choice', title: 'Phrase Builder', badge: 'Gratis', unit: 'Respuestas cortas',
    intro: 'Practicá frases que sirven desde la primera clase y en prematrícula.',
    how: ['Leé la situación.', 'Elegí la frase que sí podrías decir en clase.', 'Revisá la explicación antes de avanzar.'],
    questions: [
      { type: 'Frases', prompt: 'Choose the best phrase.', stem: 'Querés decir tu nombre:', options: ['My name is Camila.', 'I have name Camila.', 'Name me Camila.', 'I am name Camila.'], correct: 0, explain: 'Para presentarte usamos “My name is…”.' },
      { type: 'Frases', prompt: 'Choose the best phrase.', stem: 'Querés decir tu país:', options: ['I am from Costa Rica.', 'I from Costa Rica am.', 'I have Costa Rica.', 'My country are Costa Rica.'], correct: 0, explain: 'I am from + país.' },
      { type: 'Frases', prompt: 'Choose the best phrase.', stem: 'Querés pedir repetición:', options: ['Can you repeat, please?', 'Repeat you can please?', 'I repeat teacher.', 'You repeat me.'], correct: 0, explain: '“Can you repeat, please?” es natural y educado.' },
      { type: 'Frases', prompt: 'Choose the best phrase.', stem: 'Querés decir que no entendiste:', options: ['I don’t understand.', 'I no understand.', 'I not understand.', 'Me understand no.'], correct: 0, explain: 'La forma correcta es “I don’t understand”.' },
      { type: 'Frases', prompt: 'Choose the best phrase.', stem: 'Querés confirmar horario:', options: ['The class is at 6 p.m.', 'Class are six.', 'The class have six.', 'At six class is.'], correct: 0, explain: 'The class is at + hora.' },
      { type: 'Frases', prompt: 'Choose the best phrase.', stem: 'Querés decir tu teléfono:', options: ['My phone number is 8788-3939.', 'My phone is years old.', 'Phone number my is.', 'I phone 8788.'], correct: 0, explain: 'My phone number is + número.' },
    ],
  },
  survival_english: {
    kind: 'choice', title: 'Survival English', badge: 'Gratis', unit: 'Frases de clase',
    intro: 'Frases mínimas para sobrevivir en Zoom, pedir ayuda y seguir instrucciones.',
    how: ['Pensá qué dirías en clase.', 'Elegí la opción más natural.', 'El feedback es inmediato y sin nota.'],
    questions: [
      { type: 'Clase real', prompt: 'Choose the best phrase.', stem: 'No escuchás bien:', options: ['I can’t hear you.', 'I can’t see you.', 'I am not hear.', 'You no sound.'], correct: 0, explain: 'I can’t hear you = no te escucho.' },
      { type: 'Clase real', prompt: 'Choose the best phrase.', stem: 'No ves la pantalla:', options: ['I can’t see the screen.', 'I can’t listen the screen.', 'I no see screen.', 'Screen cannot me.'], correct: 0, explain: 'I can’t see the screen = no veo la pantalla.' },
      { type: 'Clase real', prompt: 'Choose the best phrase.', stem: 'Querés preguntar significado:', options: ['What does it mean?', 'What is mean it?', 'Mean what does?', 'It mean what?'], correct: 0, explain: 'What does it mean? = ¿qué significa?' },
      { type: 'Clase real', prompt: 'Choose the best phrase.', stem: 'Necesitás un minuto:', options: ['Give me a minute, please.', 'Give minute me.', 'I minute please.', 'Minute for I.'], correct: 0, explain: 'Give me a minute, please.' },
      { type: 'Clase real', prompt: 'Choose the best phrase.', stem: 'Querés entrar a participar:', options: ['Can I answer?', 'I can answer?', 'Answer can I am?', 'Can answer me?'], correct: 0, explain: 'Can I answer? = ¿puedo responder?' },
      { type: 'Clase real', prompt: 'Choose the best phrase.', stem: 'Te desconectaste:', options: ['I got disconnected.', 'I disconnected me.', 'I lose Zoom.', 'Zoom go out.'], correct: 0, explain: 'I got disconnected = se me cayó la conexión.' },
    ],
  },
  grammar: {
    kind: 'choice', title: 'Grammar Builder', badge: 'Matrícula activa', unit: 'Estructuras base',
    intro: 'Elegí la estructura correcta y revisá por qué funciona.',
    how: ['Leé la situación.', 'Escogé la frase correcta.', 'Usá la explicación para corregir patrones.'],
    questions: [
      { type: 'Grammar', prompt: 'Choose the correct sentence.', stem: 'Presentación personal:', options: ['I am Camila.', 'I are Camila.', 'I has Camila.', 'Me am Camila.'], correct: 0, explain: 'I + am.' },
      { type: 'Grammar', prompt: 'Complete.', stem: 'They ____ classmates.', options: ['are', 'is', 'am', 'be'], correct: 0, explain: 'They + are.' },
      { type: 'Grammar', prompt: 'Choose the question.', stem: 'Pregunta correcta:', options: ['Where do you live?', 'Where you live do?', 'Do where live you?', 'Where live you do?'], correct: 0, explain: 'Where + do + subject + verb.' },
      { type: 'Grammar', prompt: 'Negative form.', stem: 'She is not a teacher.', options: ['Correcta', 'Incorrecta', 'Falta do', 'Falta are'], correct: 0, explain: 'Con “be” se niega con not.' },
      { type: 'Grammar', prompt: 'Complete.', stem: 'We ____ English on Mondays.', options: ['study', 'studies', 'studying', 'are study'], correct: 0, explain: 'Con “we” usamos el verbo base: study.' },
      { type: 'Grammar', prompt: 'Choose the correct sentence.', stem: 'Rutina:', options: ['He works at night.', 'He work at night.', 'He working night.', 'He are work.'], correct: 0, explain: 'He/she/it + verbo con -s en presente simple.' },
    ],
  },
  word_match: {
    kind: 'match', title: 'Word Match', badge: 'Gratis', unit: 'Rutinas diarias',
    intro: 'Uní cada palabra en inglés con su significado en español.',
    how: ['Tocá una palabra en inglés.', 'Tocá su significado en español.', 'El par correcto queda fijado.'],
    pairs: [
      { id: 'wake', en: 'to wake up', es: 'despertarse' },
      { id: 'breakfast', en: 'breakfast', es: 'desayuno' },
      { id: 'shower', en: 'to shower', es: 'ducharse' },
      { id: 'brush', en: 'to brush', es: 'cepillarse' },
      { id: 'dress', en: 'to get dressed', es: 'vestirse' },
      { id: 'study', en: 'to study', es: 'estudiar' },
      { id: 'class', en: 'class', es: 'clase' },
      { id: 'homework', en: 'homework', es: 'tarea' },
    ],
  },
  sentence_order: {
    kind: 'order', title: 'Sentence Order', badge: 'Matrícula activa', unit: 'Orden de preguntas',
    intro: 'Tocá palabras para construir la oración correcta.',
    how: ['Armá la frase en la zona superior.', 'Confirmá cuando creás que está lista.', 'Si fallás, podés limpiar y probar otra vez.'],
    questions: [
      { stem: 'do / you / where / live ?', words: ['do', 'you', 'where', 'live', '?'], answer: ['where', 'do', 'you', 'live', '?'], explain: 'Where + do + you + live?' },
      { stem: 'name / is / my / Camila', words: ['name', 'is', 'my', 'Camila'], answer: ['my', 'name', 'is', 'Camila'], explain: 'My name is + nombre.' },
      { stem: 'from / I / Costa Rica / am', words: ['from', 'I', 'Costa Rica', 'am'], answer: ['I', 'am', 'from', 'Costa Rica'], explain: 'I am from + país.' },
      { stem: 'old / are / how / you ?', words: ['old', 'are', 'how', 'you', '?'], answer: ['how', 'old', 'are', 'you', '?'], explain: 'How old are you?' },
      { stem: 'help / I / need / please', words: ['help', 'I', 'need', 'please'], answer: ['I', 'need', 'help', 'please'], explain: 'I need help, please.' },
    ],
  },
  listening: {
    kind: 'choice', title: 'Listening Boost', badge: 'Matrícula activa', unit: 'Transcripción demo',
    intro: 'En CS3 no hay audio real. Se muestra la idea de escucha con guion/transcripción para no simular tecnología inexistente.',
    how: ['Leé el mini diálogo como si fuera audio.', 'Respondé detalle o idea principal.', 'Cuando haya audio real se cambia la fuente, no la UI.'],
    questions: [
      { type: 'Escucha demo', prompt: 'Mini diálogo:', stem: 'A: What time is class? B: It is at six p.m.', options: ['At 6 p.m.', 'At 9 a.m.', 'On Saturday', 'In Costa Rica'], correct: 0, explain: 'La respuesta dice “at six p.m.”.' },
      { type: 'Escucha demo', prompt: 'Mini diálogo:', stem: 'A: Where are you from? B: I am from Costa Rica.', options: ['Costa Rica', 'Canada', 'The classroom', 'Monday'], correct: 0, explain: 'B responde su país.' },
      { type: 'Escucha demo', prompt: 'Mini diálogo:', stem: 'A: Can you repeat, please? B: Sure.', options: ['Pide repetir', 'Pide permiso para salir', 'Da su edad', 'Compra un libro'], correct: 0, explain: '“Can you repeat, please?” pide repetición.' },
      { type: 'Escucha demo', prompt: 'Mini diálogo:', stem: 'A: Do you have homework? B: Yes, page ten.', options: ['Page ten', 'Page two', 'No homework', 'Next week'], correct: 0, explain: 'La tarea está en la página diez.' },
      { type: 'Escucha demo', prompt: 'Mini diálogo:', stem: 'A: How do you spell your last name? B: O-T-O-Y-A.', options: ['O-T-O-Y-A', 'O-T-A-Y-A', 'O-T-O-L-A', 'A-T-O-Y-A'], correct: 0, explain: 'El deletreo es O-T-O-Y-A.' },
    ],
  },
  reading_flash: {
    kind: 'choice', title: 'Reading Flash', badge: 'Matrícula activa', unit: 'Mini lectura',
    intro: 'Leé rápido y respondé comprensión básica. Es práctica, no examen.',
    how: ['Leé el texto corto.', 'Respondé una pregunta por pantalla.', 'Usá el feedback para revisar vocabulario.'],
    questions: [
      { type: 'Lectura', prompt: 'Read and answer.', stem: 'Camila studies English on Mondays and Wednesdays. Her class starts at 6 p.m.', options: ['She studies on Mondays and Wednesdays.', 'She studies on Saturdays.', 'She starts at 9 a.m.', 'She teaches English.'], correct: 0, explain: 'El texto dice Mondays and Wednesdays.' },
      { type: 'Lectura', prompt: 'Read and answer.', stem: 'The teacher sends the Zoom link before class. Students must connect on time.', options: ['Students must connect on time.', 'Students arrive at a classroom.', 'The link is after class.', 'The teacher cancels class.'], correct: 0, explain: 'La idea principal es conectarse puntualmente.' },
      { type: 'Lectura', prompt: 'Vocabulary in context.', stem: '“Before class” means:', options: ['Antes de clase', 'Después de clase', 'Durante el examen', 'Sin clase'], correct: 0, explain: 'Before = antes.' },
      { type: 'Lectura', prompt: 'Read and answer.', stem: 'Ana is a new student. She wants to practice greetings and basic questions.', options: ['She is new.', 'She is a teacher.', 'She finished Intermedio II.', 'She wants a certificate only.'], correct: 0, explain: 'El texto dice “a new student”.' },
      { type: 'Lectura', prompt: 'Choose the best title.', stem: 'Students practice vocabulary, grammar and speaking every week.', options: ['Weekly English Practice', 'A Bank Payment', 'A Laptop Sale', 'A Vacation Plan'], correct: 0, explain: 'El título resume la práctica semanal de inglés.' },
    ],
  },
};

const AP_SKILL_TRACKS = [
  { id: 'starter', title: 'Starter Pack', desc: 'Vocabulario, frases de clase y presentaciones.', games: ['Vocabulary Sprint', 'Phrase Builder', 'Survival English'], tone: 'red' },
  { id: 'grammar', title: 'Grammar Path', desc: 'Estructuras, orden de oración y preguntas.', games: ['Grammar Builder', 'Sentence Order'], tone: 'navy' },
  { id: 'skills', title: 'Skills Lab', desc: 'Escucha, lectura, speaking y retos en vivo.', games: ['Listening Boost', 'Reading Flash', 'Live Trivia'], tone: 'gold' },
];

function APBadge({ children, tone }) {
  return <span className={'ap-badge ' + (tone || '')}>{children}</span>;
}

function APSectionTitle({ eyebrow, title, children }) {
  return (
    <div className="ap-section-head">
      <span className="ap-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

function APStat({ label, value, sub, tone }) {
  return (
    <div className={'ap-stat ' + (tone || '')}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

function APProgress({ value, label }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="ap-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={safe} aria-label={label || 'Progreso'}>
      <div style={{ width: safe + '%' }} />
    </div>
  );
}

function APTimer({ seconds }) {
  const tone = seconds <= 5 ? 'critical' : seconds <= 10 ? 'warn' : 'normal';
  return <span className={'ap-timer ' + tone} aria-label={'Quedan ' + seconds + ' segundos'}>{seconds}s</span>;
}

function apStatusLabel(status, isFreeUser) {
  if (status === 'free') return 'Gratis';
  if (status === 'live') return isFreeUser ? 'Matrícula' : 'En vivo';
  if (status === 'soon') return 'Próximamente';
  return isFreeUser ? 'Matrícula' : 'Disponible';
}

function apStatusHint(status, isFreeUser) {
  if (status === 'free') return 'Jugar';
  if (status === 'soon') return 'En diseño';
  if (status === 'live') return isFreeUser ? 'Disponible al activar matrícula' : 'Entrar a sala demo';
  return isFreeUser ? 'Disponible al activar matrícula' : 'Jugar demo';
}

function apCanOpen(game, isFreeUser) {
  if (!game) return false;
  if (game.status === 'soon') return false;
  if (game.status === 'free') return true;
  if (game.status === 'live') return !isFreeUser;
  return !isFreeUser;
}

function APGameCard({ game, isFreeUser, onOpen }) {
  const locked = !apCanOpen(game, isFreeUser);
  return (
    <button type="button" className={'ap-game-card ' + (game.status === 'live' ? 'is-live ' : '') + (locked ? 'is-locked ' : '') + (game.accent || '')} onClick={() => onOpen(game)}>
      <span className="ap-game-eyebrow">{game.status === 'live' && <i aria-hidden="true" />} {game.type}</span>
      <strong>{game.title}</strong>
      <em>{game.desc}</em>
      <small>{game.level} · {game.duration}</small>
      <span className="ap-card-tags">
        {game.skill && <i>{game.skill}</i>}
        {game.unit && <i>{game.unit}</i>}
      </span>
      <span className="ap-game-foot">
        <APBadge tone={game.status === 'free' ? 'ok' : game.status === 'live' ? 'red' : game.status === 'soon' ? 'muted' : 'navy'}>{apStatusLabel(game.status, isFreeUser)}</APBadge>
        <b>{apStatusHint(game.status, isFreeUser)}</b>
      </span>
    </button>
  );
}

function APSkillTracks({ isFreeUser }) {
  return (
    <div className="ap-track-grid" aria-label="Rutas sugeridas Academia Play">
      {AP_SKILL_TRACKS.map(track => (
        <div key={track.id} className={'ap-track-card ' + track.tone}>
          <APBadge tone={track.tone === 'red' ? 'red' : track.tone === 'gold' ? '' : 'navy'}>{isFreeUser && track.id !== 'starter' ? 'Al activar matrícula' : 'Ruta sugerida'}</APBadge>
          <h3>{track.title}</h3>
          <p>{track.desc}</p>
          <div>{track.games.map(g => <span key={g}>{g}</span>)}</div>
        </div>
      ))}
    </div>
  );
}

function APStartScreen({ flow, isFreeUser, onStart, onBack }) {
  return (
    <div className="ap-practice-card ap-start-card ap-enter">
      <div className="ap-practice-top">
        <button type="button" className="ap-btn ap-btn-light" onClick={onBack}>← Juegos</button>
        <APBadge tone={isFreeUser ? 'ok' : 'navy'}>{flow.badge || (isFreeUser ? 'Gratis' : 'Demo')}</APBadge>
      </div>
      <span className="ap-small-label">{flow.unit || 'Práctica demo'}</span>
      <h3>{flow.title}</h3>
      <p>{flow.intro}</p>
      <div className="ap-how-list" aria-label="Cómo se juega">
        {(flow.how || []).map((step, i) => <div key={step}><span>{i + 1}</span><strong>{step}</strong></div>)}
      </div>
      <p className="ap-demo-note">Esta práctica es visual/demo: no guarda intentos, no crea notas oficiales y no alimenta rankings permanentes.</p>
      <div className="ap-hero-actions ap-center-actions">
        <button type="button" className="ap-btn ap-btn-primary" onClick={onStart}>Empezar</button>
        <button type="button" className="ap-btn ap-btn-ghost" onClick={onBack}>Volver a juegos</button>
      </div>
    </div>
  );
}

function APSummary({ title, score, total, errors, onReset, onBack }) {
  const good = Number(score || 0) >= Math.ceil(Number(total || 1) * 0.7);
  return (
    <div className="ap-summary ap-enter">
      <APBadge tone="red">Resumen demo</APBadge>
      <h3>{good ? 'Buen trabajo' : 'Sigamos practicando'}</h3>
      <p>Resultado visual: {score}/{total}. Este intento no se guarda y no afecta nota oficial.</p>
      <div className="ap-summary-grid">
        <APStat label="Correctas" value={String(score)} sub={title} />
        <APStat label="Total" value={String(total)} sub="actividad demo" />
        <APStat label="Errores" value={String(errors || 0)} sub="sin castigo" />
      </div>
      <div className="ap-hero-actions ap-center-actions">
        <button type="button" className="ap-btn ap-btn-primary" onClick={onReset}>Practicar otra vez</button>
        <button type="button" className="ap-btn ap-btn-ghost" onClick={onBack}>Volver al catálogo</button>
      </div>
    </div>
  );
}

function APChoiceRunner({ flow, isFreeUser, onBack }) {
  const [phase, setPhase] = apUseState('intro');
  const [qIndex, setQIndex] = apUseState(0);
  const [selected, setSelected] = apUseState(null);
  const [answered, setAnswered] = apUseState(false);
  const [score, setScore] = apUseState(0);
  const [errors, setErrors] = apUseState(0);
  const q = flow.questions[qIndex];
  const correct = answered && selected === q.correct;
  const progress = Math.round(((qIndex + 1) / flow.questions.length) * 100);
  const liveText = phase === 'summary'
    ? 'Práctica finalizada. Resultado demo ' + score + ' de ' + flow.questions.length + '.'
    : answered
      ? (correct ? 'Correcto. Respuesta guardada.' : 'Casi. Revisá esta estructura.')
      : phase === 'question' ? 'Pregunta activa: ' + flow.title : 'Inicio del juego ' + flow.title;

  function confirm() {
    if (selected === null || answered) return;
    setAnswered(true);
    if (selected === q.correct) setScore(score + 1);
    else setErrors(errors + 1);
  }
  function next() {
    if (qIndex >= flow.questions.length - 1) { setPhase('summary'); return; }
    setQIndex(qIndex + 1);
    setSelected(null);
    setAnswered(false);
  }
  function reset() {
    setPhase('intro'); setQIndex(0); setSelected(null); setAnswered(false); setScore(0); setErrors(0);
  }

  if (phase === 'intro') return <APStartScreen flow={flow} isFreeUser={isFreeUser} onStart={() => setPhase('question')} onBack={onBack} />;
  if (phase === 'summary') return <APSummary title={flow.title} score={score} total={flow.questions.length} errors={errors} onReset={reset} onBack={onBack} />;

  return (
    <div className="ap-practice-card ap-enter">
      <div className="ap-live-region" aria-live="assertive">{liveText}</div>
      <div className="ap-practice-top">
        <button type="button" className="ap-btn ap-btn-light" onClick={onBack}>← Juegos</button>
        <div className="ap-practice-meta"><APTimer seconds={answered ? 12 : 20} /><APBadge tone={isFreeUser ? 'ok' : 'navy'}>{isFreeUser ? 'Gratis' : 'Demo estudiante'}</APBadge></div>
      </div>
      <APBadge>{q.type}</APBadge>
      <h3>{flow.title}</h3>
      <p>{flow.intro}</p>
      <div className="ap-question-strip"><strong>{q.prompt}</strong><span>Pregunta {qIndex + 1} de {flow.questions.length}</span></div>
      <p className="ap-question-stem">{q.stem}</p>
      <APProgress value={progress} label={'Progreso ' + flow.title} />
      <div className="ap-answer-list">
        {q.options.map((opt, idx) => {
          const state = !answered ? (idx === selected ? 'selected' : '') : idx === q.correct ? 'correct' : idx === selected ? 'wrong' : 'locked';
          return (
            <button type="button" key={opt} disabled={answered} className={'ap-answer ' + state} onClick={() => setSelected(idx)}>
              <span>{String.fromCharCode(65 + idx)}</span>{opt}
            </button>
          );
        })}
      </div>
      {!answered ? (
        <button type="button" className="ap-btn ap-btn-primary ap-confirm-btn" disabled={selected === null} onClick={confirm}>Confirmar respuesta</button>
      ) : (
        <div className={'ap-feedback ' + (correct ? 'correct' : 'wrong')}>
          <strong>{correct ? '¡Correcto!' : 'Casi'}</strong>
          <span>{correct ? 'Respuesta guardada · bloqueado' : 'Revisá esta estructura · respuesta guardada'}</span>
          <p>{q.explain}</p>
          <button type="button" className="ap-btn ap-btn-primary" onClick={next}>Siguiente pregunta →</button>
        </div>
      )}
    </div>
  );
}

function APMatchRunner({ flow, isFreeUser, onBack }) {
  const [phase, setPhase] = apUseState('intro');
  const [selectedLeft, setSelectedLeft] = apUseState(null);
  const [fixed, setFixed] = apUseState([]);
  const [errors, setErrors] = apUseState(0);
  const [wrong, setWrong] = apUseState('');
  const rightItems = apUseMemo(() => apShuffleStatic(flow.pairs), [flow]);
  const score = fixed.length;
  const total = flow.pairs.length;
  const liveText = phase === 'summary'
    ? 'Word Match finalizado. Resultado demo ' + score + ' de ' + total + '.'
    : wrong ? 'Ese par no coincide. Probá otra vez.' : selectedLeft ? 'Tocá el significado de ' + selectedLeft.en + '.' : 'Elegí una palabra en inglés.';

  function pickRight(pair) {
    if (!selectedLeft || fixed.includes(pair.id)) return;
    if (selectedLeft.id === pair.id) {
      const next = [...fixed, pair.id];
      setFixed(next); setSelectedLeft(null); setWrong('');
      if (next.length === total) setPhase('summary');
    } else {
      setErrors(errors + 1); setWrong(selectedLeft.id + '-' + pair.id);
      window.setTimeout(() => setWrong(''), 260);
    }
  }
  function reset() {
    setPhase('intro'); setSelectedLeft(null); setFixed([]); setErrors(0); setWrong('');
  }

  if (phase === 'intro') return <APStartScreen flow={flow} isFreeUser={isFreeUser} onStart={() => setPhase('question')} onBack={onBack} />;
  if (phase === 'summary') return <APSummary title={flow.title} score={score} total={total} errors={errors} onReset={reset} onBack={onBack} />;

  return (
    <div className="ap-practice-card ap-match-card ap-enter">
      <div className="ap-live-region" aria-live="assertive">{liveText}</div>
      <div className="ap-practice-top">
        <button type="button" className="ap-btn ap-btn-light" onClick={onBack}>← Juegos</button>
        <div className="ap-practice-meta"><APBadge tone="ok">Gratis</APBadge><APBadge>{score}/{total} pares</APBadge></div>
      </div>
      <h3>{flow.title}</h3>
      <p>{selectedLeft ? <>Tocá el significado de <strong>{selectedLeft.en}</strong></> : 'Tocá una palabra en inglés y luego su significado.'}</p>
      <APProgress value={Math.round((score / total) * 100)} label="Pares completados" />
      <div className="ap-match-board">
        <div className="ap-match-col">
          <span className="ap-small-label">Inglés</span>
          {flow.pairs.map(pair => {
            const done = fixed.includes(pair.id);
            const active = selectedLeft?.id === pair.id;
            return <button key={pair.id} type="button" disabled={done} className={'ap-match-chip ' + (done ? 'fixed ' : '') + (active ? 'selected ' : '')} onClick={() => setSelectedLeft(pair)}>{done ? '✓ ' : ''}{pair.en}</button>;
          })}
        </div>
        <div className="ap-match-col">
          <span className="ap-small-label">Español</span>
          {rightItems.map(pair => {
            const done = fixed.includes(pair.id);
            const bad = wrong.endsWith('-' + pair.id);
            return <button key={pair.id} type="button" disabled={done} className={'ap-match-chip ' + (done ? 'fixed ' : '') + (bad ? 'wrong ' : '')} onClick={() => pickRight(pair)}>{done ? '✓ ' : ''}{pair.es}</button>;
          })}
        </div>
      </div>
      <p className="ap-demo-note">Los pares fijados bajan su contraste pero siguen legibles. El error no castiga, solo te deja intentar otra vez.</p>
    </div>
  );
}

function APOrderRunner({ flow, isFreeUser, onBack }) {
  const [phase, setPhase] = apUseState('intro');
  const [qIndex, setQIndex] = apUseState(0);
  const [built, setBuilt] = apUseState([]);
  const [answered, setAnswered] = apUseState(false);
  const [score, setScore] = apUseState(0);
  const [errors, setErrors] = apUseState(0);
  const q = flow.questions[qIndex];
  const correct = answered && built.map(x => x.w).join(' ') === q.answer.join(' ');
  const remaining = q.words.map((w, i) => ({ w, key: w + '-' + i })).filter(x => !built.some(b => b.key === x.key));
  const liveText = phase === 'summary'
    ? 'Sentence Order finalizado. Resultado demo ' + score + ' de ' + flow.questions.length + '.'
    : answered ? (correct ? 'Correcto.' : 'Casi. Revisá el orden correcto.') : 'Construí la frase.';

  function confirm() {
    if (!built.length || answered) return;
    const ok = built.map(x => x.w).join(' ') === q.answer.join(' ');
    setAnswered(true);
    if (ok) setScore(score + 1); else setErrors(errors + 1);
  }
  function next() {
    if (qIndex >= flow.questions.length - 1) { setPhase('summary'); return; }
    setQIndex(qIndex + 1); setBuilt([]); setAnswered(false);
  }
  function reset() { setPhase('intro'); setQIndex(0); setBuilt([]); setAnswered(false); setScore(0); setErrors(0); }

  if (phase === 'intro') return <APStartScreen flow={flow} isFreeUser={isFreeUser} onStart={() => setPhase('question')} onBack={onBack} />;
  if (phase === 'summary') return <APSummary title={flow.title} score={score} total={flow.questions.length} errors={errors} onReset={reset} onBack={onBack} />;

  return (
    <div className="ap-practice-card ap-order-card ap-enter">
      <div className="ap-live-region" aria-live="assertive">{liveText}</div>
      <div className="ap-practice-top">
        <button type="button" className="ap-btn ap-btn-light" onClick={onBack}>← Juegos</button>
        <div className="ap-practice-meta"><APBadge tone="navy">Demo estudiante</APBadge><APBadge>{qIndex + 1}/{flow.questions.length}</APBadge></div>
      </div>
      <h3>{flow.title}</h3>
      <div className="ap-question-strip"><strong>Ordená la oración</strong><span>{q.stem}</span></div>
      <APProgress value={Math.round(((qIndex + 1) / flow.questions.length) * 100)} label="Progreso Sentence Order" />
      <div className={'ap-order-workbench ' + (answered ? (correct ? 'correct' : 'wrong') : '')}>
        {built.length ? built.map(item => <button key={item.key} type="button" disabled={answered} onClick={() => setBuilt(built.filter(x => x.key !== item.key))}>{item.w}</button>) : <span>Tocá palabras para armar la frase</span>}
      </div>
      <div className="ap-word-bank">
        {remaining.map(item => <button key={item.key} type="button" disabled={answered} onClick={() => setBuilt([...built, item])}>{item.w}</button>)}
      </div>
      {!answered ? (
        <div className="ap-hero-actions">
          <button type="button" className="ap-btn ap-btn-primary" disabled={!built.length} onClick={confirm}>Confirmar orden</button>
          <button type="button" className="ap-btn ap-btn-ghost" disabled={!built.length} onClick={() => setBuilt([])}>Limpiar</button>
        </div>
      ) : (
        <div className={'ap-feedback ' + (correct ? 'correct' : 'wrong')}>
          <strong>{correct ? '¡Correcto!' : 'Casi'}</strong>
          <span>{correct ? 'La frase está en orden natural.' : 'Orden correcto: ' + q.answer.join(' ')}</span>
          <p>{q.explain}</p>
          <button type="button" className="ap-btn ap-btn-primary" onClick={next}>Siguiente frase →</button>
        </div>
      )}
    </div>
  );
}

function APGameRunner({ gameId, isFreeUser, onBack }) {
  const flow = AP_FLOWS[gameId] || AP_FLOWS.vocabulary;
  return (
    <div className="ap-practice-wrap">
      {flow.kind === 'match'
        ? <APMatchRunner flow={flow} isFreeUser={isFreeUser} onBack={onBack} />
        : flow.kind === 'order'
          ? <APOrderRunner flow={flow} isFreeUser={isFreeUser} onBack={onBack} />
          : <APChoiceRunner flow={flow} isFreeUser={isFreeUser} onBack={onBack} />}
    </div>
  );
}

function APLockedState({ game, isFreeUser, onBack, onNavigate }) {
  const isSoon = game?.status === 'soon';
  const title = isSoon ? 'Juego en preparación' : 'Disponible al activar tu matrícula';
  const desc = isSoon
    ? 'Este juego sigue en diseño. No se presenta como promesa productiva ni se conecta a backend.'
    : 'Los usuarios gratis pueden practicar los juegos marcados como Gratis. Este juego se desbloquea cuando admisiones active la matrícula.';
  return (
    <div className="ap-locked-state ap-enter">
      <div className="ap-panel">
        <APBadge tone={isSoon ? 'muted' : 'red'}>{game?.title || 'Juego'}</APBadge>
        <h3>{title}</h3>
        <p>{desc}</p>
        <div className="ap-hero-actions">
          <button type="button" className="ap-btn ap-btn-primary" onClick={onBack}>Volver a juegos gratis</button>
          {isFreeUser && <button type="button" className="ap-btn ap-btn-ghost" onClick={() => onNavigate && onNavigate('dashboard')}>Solicitar contacto desde Mi Campus</button>}
        </div>
      </div>
    </div>
  );
}

function APStudentView({ usuario, role, rolReal, onNavigate }) {
  const isFreeUser = apEsUsuarioGratis(usuario, role, rolReal);
  const [screen, setScreen] = apUseState('dashboard');
  const [activeGame, setActiveGame] = apUseState(null);
  const [filter, setFilter] = apUseState('Todos');
  const first = apFirstName(usuario);
  const freeGames = AP_GAMES.filter(g => g.status === 'free').length;
  const unlockedGames = AP_GAMES.filter(g => apCanOpen(g, isFreeUser)).length;
  const categories = ['Todos', 'Gratis', 'Vocabulario', 'Gramática', 'Speaking', 'Escucha', 'Lectura', 'Mixto', 'En vivo'];
  const filtered = AP_GAMES.filter(g => filter === 'Todos' || (filter === 'Gratis' ? g.status === 'free' : g.category === filter));

  function openGame(game) {
    if (game.status === 'live' && apCanOpen(game, isFreeUser)) {
      setActiveGame(game); setScreen('live'); return;
    }
    if (!apCanOpen(game, isFreeUser) || !AP_FLOWS[game.id]) {
      setActiveGame(game); setScreen('locked'); return;
    }
    setActiveGame(game); setScreen('play');
  }

  if (screen === 'play') return <APGameRunner gameId={activeGame?.id} isFreeUser={isFreeUser} onBack={() => setScreen('catalog')} />;
  if (screen === 'locked') return <APLockedState game={activeGame} isFreeUser={isFreeUser} onBack={() => setScreen('catalog')} onNavigate={onNavigate} />;
  if (screen === 'live') return <APLiveRoom onBack={() => setScreen('catalog')} />;

  return (
    <div className="ap-view ap-view-student">
      <APSectionTitle eyebrow={isFreeUser ? 'Prematrícula · Acceso gratis' : 'Estudiante · Piloto visual'} title={isFreeUser ? 'Practicá desde hoy, ' + first : 'Academia Play'}>
        {isFreeUser
          ? 'No necesitás esperar la matrícula para empezar a soltar el inglés. Esto es práctica libre: no crea notas oficiales.'
          : 'Juegos cortos para reforzar clase. V1.5 sigue siendo visual/demo hasta conectar backend real.'}
      </APSectionTitle>

      <div className="ap-dashboard-grid">
        <div className="ap-hero-card ap-cascade ap-cascade-1">
          <APBadge tone="red">Práctica recomendada de hoy</APBadge>
          <h3>{isFreeUser ? 'Vocabulary Sprint · Primeras palabras' : 'Grammar Builder · Básico I'}</h3>
          <p>{isFreeUser ? 'Vocabulario esencial de presentaciones y saludos para entrar mejor preparada.' : 'Reforzá estructura, vocabulario y respuestas de clase con feedback inmediato.'}</p>
          <div className="ap-hero-actions">
            <button type="button" className="ap-btn ap-btn-primary ap-breathe" onClick={() => openGame(AP_GAMES[0])}>Practicar ahora</button>
            <button type="button" className="ap-btn ap-btn-ghost" onClick={() => setScreen('catalog')}>Ver catálogo de juegos</button>
          </div>
          <p className="ap-demo-note">Se conserva al matricularte solo como idea visual; en CS3 todavía no hay historial productivo.</p>
        </div>
        <div className="ap-panel ap-daily-card ap-cascade ap-cascade-2">
          <span className="ap-small-label">Acceso gratis de hoy</span>
          <div className="ap-week-row"><strong>{isFreeUser ? '2/3' : 'Ilimitado'}</strong><span>{isFreeUser ? 'te queda 1 partida' : 'matrícula activa demo'}</span></div>
          <APProgress value={isFreeUser ? 66 : 100} label="Acceso diario demo" />
          <p>{isFreeUser ? 'El límite es visual/demo. Cuando haya backend se definirá si realmente aplica.' : 'Partidas ilimitadas solo cuando el backend y reglas estén aprobados.'}</p>
        </div>
        <div className="ap-panel ap-live-preview ap-cascade ap-cascade-2">
          <APBadge tone={isFreeUser ? 'muted' : 'red'}>{isFreeUser ? 'Bloqueado' : 'En vivo demo'}</APBadge>
          <h3>Live Trivia</h3>
          <p>{isFreeUser ? 'Tu docente activa salas en vivo para el grupo cuando la matrícula esté activa.' : 'Sala PLAY-4821 · participantes entrando.'}</p>
          <button type="button" className="ap-btn ap-btn-light" onClick={() => openGame(AP_GAMES.find(g => g.id === 'live'))}>{isFreeUser ? 'Ver bloqueo' : 'Entrar a sala'}</button>
        </div>
      </div>

      <div className="ap-stats-grid">
        <APStat label="Acceso" value={isFreeUser ? 'Gratis' : 'Piloto'} sub={isFreeUser ? 'sin matrícula activa' : 'estudiante demo'} tone={isFreeUser ? 'red' : ''} />
        <APStat label="Juegos abiertos" value={String(unlockedGames)} sub={isFreeUser ? freeGames + ' gratis' : 'demo desbloqueado'} />
        <APStat label="Prácticas demo" value={isFreeUser ? '5' : String(AP_GAMES.filter(g => g.status !== 'soon').length)} sub="no se guardan todavía" />
        <APStat label="Nota oficial" value="0" sub="no afecta evaluaciones" />
      </div>

      <APSkillTracks isFreeUser={isFreeUser} />

      <div className="ap-catalog-head">
        <div><h3>Catálogo de juegos</h3><p>{isFreeUser ? freeGames + ' abiertos para vos; el resto se desbloquea al activar matrícula.' : AP_GAMES.length + ' juegos visuales; backend y banco real quedan para otra fase.'}</p></div>
        <div className="ap-filter-tabs" role="tablist" aria-label="Filtrar catálogo de juegos">
          {categories.map(cat => <button key={cat} type="button" className={filter === cat ? 'active' : ''} onClick={() => setFilter(cat)}>{cat}</button>)}
        </div>
      </div>
      <div className="ap-card-grid ap-card-grid-catalog">
        {filtered.map(g => <APGameCard key={g.id} game={g} isFreeUser={isFreeUser} onOpen={openGame} />)}
      </div>
    </div>
  );
}

function APLiveRoom({ onBack }) {
  return (
    <div className="ap-live-room ap-enter">
      <button type="button" className="ap-btn ap-btn-light" onClick={onBack}>← Volver</button>
      <div className="ap-live-main">
        <div className="ap-panel ap-live-lobby">
          <APBadge tone="red">Juego en vivo demo</APBadge>
          <h3>Sala PLAY-4821</h3>
          <p>Esperando al docente. Resultado de actividad; no ranking permanente.</p>
          <div className="ap-participants">
            {['Camila O.', 'Valeria M.', 'José R.', 'María F.', 'Daniela C.'].map((n, i) => <span key={n} className={'ap-person ap-person-' + i}>{n}</span>)}
          </div>
          <div className="ap-hero-actions"><button type="button" className="ap-btn ap-btn-primary">Copiar código</button><button type="button" className="ap-btn ap-btn-ghost">Compartir sala</button></div>
        </div>
        <div className="ap-practice-card">
          <div className="ap-practice-top"><APBadge>Pregunta activa demo</APBadge><APTimer seconds={9} /></div>
          <h3>Choose the correct question.</h3>
          <p>Respuesta esperada: I live in Costa Rica.</p>
          <APProgress value={67} label="Respuestas recibidas" />
          <p><strong>12/18 respondieron</strong> · Se bloquea después de responder.</p>
          <div className="ap-answer-list"><button type="button" className="ap-answer correct"><span>A</span>Where do you live?</button><button type="button" className="ap-answer locked"><span>B</span>How old are you?</button></div>
        </div>
      </div>
    </div>
  );
}

function APTeacherView() {
  const [live, setLive] = apUseState(false);
  const [game, setGame] = apUseState('Vocabulary Sprint');
  return (
    <div className="ap-view ap-view-teacher">
      <APSectionTitle eyebrow="Docente · Piloto visual" title="Crear juego en vivo">
        Control de clase sin backend todavía. No activa salas reales ni guarda resultados.
      </APSectionTitle>
      <div className="ap-teacher-grid">
        <div className="ap-panel ap-enter">
          <APBadge>Configuración demo</APBadge>
          <h3>Preparar sala</h3>
          <div className="ap-form-grid">
            <label>Grupo<span>B1-LM18-C3-0726</span></label>
            <label>Nivel<span>Básico I</span></label>
            <label>Juego<span>{game}</span></label>
            <label>Preguntas<span>10</span></label>
            <label>Tiempo<span>20 s por pregunta</span></label>
            <label>Modo<span>Resultado de actividad</span></label>
          </div>
          <div className="ap-game-mini-selector" aria-label="Seleccionar juego demo">
            {['Vocabulary Sprint','Word Match','Grammar Builder','Sentence Order','Live Trivia'].map(n => <button key={n} type="button" className={game===n?'active':''} onClick={()=>setGame(n)}>{n}</button>)}
          </div>
          <button type="button" className="ap-btn ap-btn-primary" onClick={() => setLive(true)}>Activar juego demo</button>
        </div>
        <div className="ap-panel ap-enter ap-cascade-2">
          <APBadge tone={live ? 'red' : ''}>{live ? 'Juego en curso' : 'Vista previa'}</APBadge>
          <h3>Sala PLAY-4821</h3>
          <p>{live ? '18 conectados · 12 respondieron la pregunta actual.' : 'El docente verá estudiantes conectados y respuestas recibidas.'}</p>
          <APProgress value={live ? 67 : 20} label="Respuestas recibidas" />
          <div className="ap-teacher-actions">
            <button type="button" className="ap-btn ap-btn-light">Pausar</button>
            <button type="button" className="ap-btn ap-btn-primary">Siguiente pregunta</button>
            <button type="button" className="ap-btn ap-btn-ghost">Finalizar</button>
          </div>
        </div>
      </div>
      <div className="ap-panel ap-table-panel">
        <h3>Estudiantes conectados</h3>
        <div className="ap-table">
          {['Camila Otoya', 'Valeria Mora', 'José Rojas', 'María Fernández'].map((n, i) => (
            <div key={n}><span>{n}</span><strong>{i < 3 ? 'Respondió' : 'Esperando'}</strong></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function APAdminView() {
  return (
    <div className="ap-view ap-view-admin">
      <APSectionTitle eyebrow="Admin · Superadmin" title="Panel Academia Play">
        Estado del módulo en piloto. Métricas demo para validar navegación, no producción.
      </APSectionTitle>
      <div className="ap-stats-grid">
        <APStat label="Estado" value="Piloto" sub="sin backend productivo" tone="red" />
        <APStat label="Juegos" value={String(AP_GAMES.length)} sub="catálogo visual" />
        <APStat label="Gratis" value={String(AP_GAMES.filter(g => g.status === 'free').length)} sub="para prospectos" />
        <APStat label="Niveles" value="4" sub="B1 · B2 · I1 · I2" />
      </div>
      <div className="ap-admin-grid">
        <div className="ap-panel">
          <APBadge tone="red">Módulo en piloto</APBadge>
          <h3>Antes de producción falta</h3>
          <ul className="ap-check-list">
            <li>Definir hojas o backend de juegos separado de notas oficiales.</li>
            <li>Banco real de preguntas por nivel, unidad y destreza.</li>
            <li>Permisos por grupo, docente y usuario gratis.</li>
            <li>Historial de práctica sin mezclar con evaluaciones.</li>
            <li>QA mobile, accesibilidad y rendimiento con datos reales.</li>
          </ul>
        </div>
        <div className="ap-panel">
          <h3>Uso por nivel · demo</h3>
          {['Básico I', 'Básico II', 'Intermedio I', 'Intermedio II'].map((n, i) => (
            <div key={n} className="ap-level-row"><span>{n}</span><APProgress value={[72, 48, 28, 12][i]} label={'Uso demo ' + n} /></div>
          ))}
        </div>
      </div>
      <div className="ap-panel ap-table-panel">
        <h3>Catálogo V1.6 · estado demo</h3>
        <div className="ap-table">
          {AP_GAMES.map(g => <div key={g.id}><span>{g.title}</span><strong>{apStatusLabel(g.status, false)}</strong></div>)}
        </div>
      </div>
    </div>
  );
}

function AcademiaPlayView({ usuario, role, rolReal, onNavigate }) {
  const allowed = apEsUsuarioPiloto(usuario, role, rolReal);
  const rol = apRole(role, rolReal);
  const initialMode = rol === 'admin' || rol === 'superadmin' ? 'admin' : rol === 'teacher' ? 'teacher' : 'student';
  const [mode, setMode] = apUseState(initialMode);
  const nombre = usuario?.nombre || usuario?.NOMBRE || 'Estudiante';

  const modes = apUseMemo(() => {
    if (rol === 'admin' || rol === 'superadmin') return ['student', 'teacher', 'admin'];
    if (rol === 'teacher') return ['teacher'];
    return ['student'];
  }, [rol]);

  if (!allowed) {
    return (
      <div className="aplay-shell ap-denied">
        <div className="ap-panel">
          <APBadge tone="red">Piloto visual</APBadge>
          <h2>Academia Play todavía no está conectada para este usuario.</h2>
          <p>No se cargó backend ni se escriben datos. Pedí acceso piloto desde administración.</p>
          <button type="button" className="ap-btn ap-btn-primary" onClick={() => onNavigate && onNavigate('dashboard')}>Volver al Campus</button>
        </div>
      </div>
    );
  }

  return (
    <div className="aplay-shell" data-screen-label="Academia Play · V1.5 demo">
      <div className="aplay-topbar">
        <div>
          <APBadge tone="red">V1.6 demo · catálogo móvil · sin backend</APBadge>
          <h1>Academia Play</h1>
          <p>{nombre} · Este piloto no guarda intentos, no crea rankings y no afecta notas oficiales.</p>
        </div>
        <div className="ap-mode-tabs" role="tablist" aria-label="Vistas del piloto Academia Play">
          {modes.map(m => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
              {m === 'student' ? 'Estudiante' : m === 'teacher' ? 'Docente' : 'Admin'}
            </button>
          ))}
        </div>
      </div>
      {mode === 'student' && <APStudentView usuario={usuario || {}} role={role} rolReal={rolReal} onNavigate={onNavigate} />}
      {mode === 'teacher' && <APTeacherView />}
      {mode === 'admin' && <APAdminView />}
    </div>
  );
}

window.AcademiaPlayView = AcademiaPlayView;
