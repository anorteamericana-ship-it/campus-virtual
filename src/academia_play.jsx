/* global React, Icon */
// F98.4-Z6-CS16 · Academia Play mapa visual de progreso por nivel/unidad.
// Lee ACADEMIA_PLAY_BANK, muestra avance 100% por unidad y no genera notas oficiales.

const { useMemo: apUseMemo, useState: apUseState, useEffect: apUseEffect } = React;

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


const AP_COGNITIVE_AREAS = {
  Vocabulario: { icon: '🧠', label: 'Memoria verbal', tone: 'red' },
  Gramática: { icon: '▦', label: 'Estructura lógica', tone: 'navy' },
  Speaking: { icon: '💬', label: 'Producción oral', tone: 'blue' },
  Escucha: { icon: '🎧', label: 'Discriminación auditiva', tone: 'blue' },
  Lectura: { icon: '📖', label: 'Comprensión lectora', tone: 'gold' },
  Mixto: { icon: '⚡', label: 'Agilidad mixta', tone: 'gold' },
  'En vivo': { icon: '🎯', label: 'Respuesta rápida', tone: 'red' },
};
function apCognitiveArea(category){ return AP_COGNITIVE_AREAS[category] || { icon:'◆', label:'Práctica', tone:'navy' }; }

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


const AP_PLAY_RELEASE = 'V1.9';

const AP_SOUND_MANIFEST = {
  click: 'assets/sounds/click_soft.mp3',
  tap: 'assets/sounds/tap_card.mp3',
  correct: 'assets/sounds/correct_chime.mp3',
  wrong: 'assets/sounds/wrong_soft.mp3',
  complete: 'assets/sounds/complete_win.mp3',
  achievement: 'assets/sounds/achievement_confetti.mp3',
  locked: 'assets/sounds/locked_tap.mp3',
  unlock: 'assets/sounds/unlock.mp3',
};
const AP_SOUND_FAILED = {};

function apTonePattern(name) {
  if (name === 'wrong') return [{ f: 180, d: .12, type: 'sine' }, { f: 135, d: .18, type: 'sine' }];
  if (name === 'locked') return [{ f: 160, d: .08, type: 'square' }];
  if (name === 'complete') return [{ f: 392, d: .10 }, { f: 523.25, d: .12 }, { f: 659.25, d: .16 }, { f: 783.99, d: .22 }];
  if (name === 'achievement') return [{ f: 523.25, d: .10 }, { f: 659.25, d: .12 }, { f: 783.99, d: .14 }, { f: 1046.5, d: .25 }];
  if (name === 'unlock') return [{ f: 330, d: .10 }, { f: 440, d: .12 }, { f: 660, d: .18 }];
  if (name === 'correct') return [{ f: 523.25, d: .10 }, { f: 659.25, d: .16 }];
  if (name === 'tap') return [{ f: 320, d: .045, type: 'triangle' }];
  return [{ f: 260, d: .035, type: 'triangle' }];
}

function apPlayTone(name) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const now = ctx.currentTime;
    let offset = 0;
    apTonePattern(name).forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = note.type || 'triangle';
      osc.frequency.setValueAtTime(note.f, now + offset);
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(name === 'click' || name === 'tap' ? 0.025 : 0.055, now + offset + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + note.d);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + note.d + 0.03);
      offset += note.d * .72;
    });
    window.setTimeout(() => { try { ctx.close(); } catch (_) {} }, Math.max(360, offset * 1000 + 220));
  } catch (_) {}
}

function apPlaySound(name, enabled) {
  if (enabled === false) return;
  const url = AP_SOUND_MANIFEST[name];
  if (!url || AP_SOUND_FAILED[name]) { apPlayTone(name); return; }
  try {
    const audio = new Audio(url);
    audio.volume = name === 'wrong' || name === 'locked' ? 0.22 : 0.28;
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(() => { AP_SOUND_FAILED[name] = true; apPlayTone(name); });
  } catch (_) { AP_SOUND_FAILED[name] = true; apPlayTone(name); }
}


function apStorageUserKey(usuario) {
  const ced = apNormCedula(usuario?.cedula || usuario?.CEDULA || usuario?.identificacion || usuario?.IDENTIFICACION || usuario?.documento || usuario?.DOCUMENTO || usuario?.id || usuario?.ID);
  const cod = String(usuario?.codigo || usuario?.CODIGO || usuario?.CODIGO_ESTUDIANTE || '').trim().toUpperCase();
  const name = String(usuario?.nombre || usuario?.NOMBRE || 'estudiante').trim().toLowerCase().replace(/\s+/g, '_');
  return ced || cod || name || 'guest';
}

function apReadState(userKey) {
  try {
    const raw = localStorage.getItem('an_academia_play_state_' + userKey);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') {
      return {
        games: parsed.games && typeof parsed.games === 'object' ? parsed.games : {},
        seenGames: Array.isArray(parsed.seenGames) ? parsed.seenGames : [],
        celebrationEnabled: parsed.celebrationEnabled !== false,
      };
    }
  } catch (_) {}
  return { games: {}, seenGames: [], celebrationEnabled: true };
}

function apWriteState(userKey, nextState) {
  try { localStorage.setItem('an_academia_play_state_' + userKey, JSON.stringify(nextState)); } catch (_) {}
}

function apMergeStates(localState, remoteState) {
  const local = localState && typeof localState === 'object' ? localState : { games:{}, seenGames:[], celebrationEnabled:true };
  const remote = remoteState && typeof remoteState === 'object' ? remoteState : null;
  if (!remote) return local;
  const next = {
    ...local,
    games: { ...(local.games || {}) },
    seenGames: Array.from(new Set([...(local.seenGames || []), ...(remote.seenGames || [])])),
  };
  Object.entries(remote.games || {}).forEach(([gameId, item]) => {
    const cur = next.games[gameId] || {};
    next.games[gameId] = {
      ...cur,
      ...item,
      percent: Math.max(apSafePct(cur.percent || 0), apSafePct(item.percent || 0)),
      attempts: Math.max(Number(cur.attempts || 0), Number(item.attempts || 0)),
      synced: true,
    };
  });
  return next;
}

function apToken() {
  try { if (typeof window.getSessionToken === 'function') return window.getSessionToken() || ''; } catch (_) {}
  try { return localStorage.getItem('session_token') || localStorage.getItem('an_session_token') || localStorage.getItem('token') || ''; } catch (_) { return ''; }
}

function apBackendUrl() {
  const u = window.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';
  if (!window.APPS_SCRIPT_URL) window.APPS_SCRIPT_URL = u;
  return u;
}

async function apPost(fn, payload = {}, timeoutMs = 18000) {
  const url = apBackendUrl();
  if (!url) return { ok:false, error:'backend_no_configurado' };
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({ fn, token:apToken(), ...payload }),
      signal:controller?.signal,
    });
    const raw = await res.text();
    return raw ? JSON.parse(raw) : { ok:false, error:'respuesta_vacia' };
  } catch (err) {
    return { ok:false, error:err?.name === 'AbortError' ? 'timeout' : (err?.message || String(err)) };
  } finally { if (timer) window.clearTimeout(timer); }
}

function apStateFromRemote(items) {
  const games = {};
  const seenGames = [];
  (items || []).forEach(item => {
    const id = String(item.game_id || item.GAME_ID || '').trim();
    if (!id) return;
    seenGames.push(id);
    games[id] = {
      title: item.game_title || item.GAME_TITLE || '',
      percent: apSafePct(item.percent || item.PERCENT || 0),
      attempts: Number(item.attempts || item.ATTEMPTS || 0) || 0,
      lastPlayedAt: item.last_played_at || item.LAST_PLAYED_AT || '',
      synced: true,
    };
  });
  return { games, seenGames };
}


function apSafePct(v) { return Math.max(0, Math.min(100, Math.round(Number(v) || 0))); }

function apResultTone(percent) {
  if (percent >= 100) return 'ok';
  if (percent >= 60) return 'navy';
  if (percent > 0) return 'red';
  return 'muted';
}

function apResultLabel(percent) {
  const safe = apSafePct(percent);
  if (safe >= 100) return '100%';
  if (safe > 0) return safe + '%';
  return 'Nuevo';
}

function apMarkSeen(playState, gameId) {
  if (!gameId) return playState;
  if ((playState.seenGames || []).includes(gameId)) return playState;
  return { ...playState, seenGames: [...(playState.seenGames || []), gameId] };
}

function apPlayCelebrationChime() { apPlaySound('achievement', true); }

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



function apAreaIdToCategory(areaId) {
  const id = String(areaId || '').toUpperCase();
  if (id === 'VOCAB') return 'Vocabulario';
  if (id === 'GRAM') return 'Gramática';
  if (id === 'SPEAK') return 'Speaking';
  if (id === 'LISTEN') return 'Escucha';
  if (id === 'READ') return 'Lectura';
  if (id === 'MIX') return 'Mixto';
  return id || 'Mixto';
}

function apTemplateName(templateId) {
  const map = {
    VOCAB_01:'Vocabulary Sprint', VOCAB_02:'Word Match', GRAM_01:'Grammar Fix', GRAM_02:'Sentence Order',
    SPEAK_01:'Phrase Builder', SPEAK_02:'Response Builder', LISTEN_01:'Listening Choice', LISTEN_02:'Listen & Match',
    READ_01:'Reading Flash', READ_02:'Detail Hunter', MIX_01:'Mini Challenge', MIX_02:'Survival Mission'
  };
  return map[String(templateId || '').toUpperCase()] || String(templateId || 'Juego');
}

function apAreaAccent(areaId) {
  const id = String(areaId || '').toUpperCase();
  if (id === 'VOCAB') return 'red';
  if (id === 'GRAM') return 'navy';
  if (id === 'SPEAK' || id === 'LISTEN') return 'blue';
  if (id === 'READ' || id === 'MIX') return 'gold';
  return 'navy';
}


function apLevelLabel(levelId) {
  const id = String(levelId || '').toUpperCase();
  if (id === 'B1') return 'Básico I';
  if (id === 'B2') return 'Básico II';
  if (id === 'I1') return 'Intermedio I';
  if (id === 'I2') return 'Intermedio II';
  return id || 'Nivel';
}

function apLevelShort(levelId) {
  const id = String(levelId || '').toUpperCase();
  return id || 'NIVEL';
}

function apLevelTone(levelId) {
  const id = String(levelId || '').toUpperCase();
  if (id === 'B1') return 'gold';
  if (id === 'B2') return 'red';
  if (id === 'I1') return 'blue';
  if (id === 'I2') return 'ok';
  return 'navy';
}

function apDefaultUnitForLevel(levelId) {
  const id = String(levelId || 'B1').toUpperCase();
  return id + '-U01';
}

function apUnitShort(unitId) {
  const raw = String(unitId || '').toUpperCase();
  const m = raw.match(/U\d{2}$/);
  return m ? m[0] : raw;
}

const AP_LEVEL_ORDER = ['B1', 'B2', 'I1', 'I2'];

function apBankGameToCard(game) {
  const areaId = String(game.area_id || game.AREA_ID || '').toUpperCase();
  const templateId = String(game.template_id || game.TEMPLATE_ID || '').toUpperCase();
  const unitId = String(game.unit_id || game.UNIT_ID || '').toUpperCase();
  const levelId = String(game.level_id || game.LEVEL_ID || '').toUpperCase();
  const gameId = String(game.game_id || game.id || game.GAME_ID || '').toUpperCase();
  const category = apAreaIdToCategory(areaId);
  const templateName = apTemplateName(templateId);
  const scope = String(game.status || game.access_scope || '').toLowerCase();
  return {
    ...game,
    source:'bank',
    id:gameId,
    game_id:gameId,
    title:String(game.title || game.game_title || templateName || gameId),
    type:templateName,
    category,
    area_id:areaId,
    template_id:templateId,
    unit_id:unitId,
    level_id:levelId,
    skill:templateId,
    unit:levelId + ' · ' + unitId,
    desc:'Juego generado desde el banco curricular. ' + (Number(game.item_count || 0) || 5) + ' ítems de práctica.',
    duration:(Number(game.item_count || 0) || 5) + ' ítems · práctica',
    level:levelId || 'Banco',
    status:scope === 'free' ? 'free' : 'matriculated',
    accent:apAreaAccent(areaId),
    item_count:Number(game.item_count || 0) || 0,
    min_difficulty:Number(game.min_difficulty || 0) || 0,
    max_difficulty:Number(game.max_difficulty || 0) || 0,
  };
}

function apCorrectIndex(letter) {
  const s = String(letter || '').trim().toUpperCase();
  return { A:0, B:1, C:2, D:3 }[s] ?? 0;
}

function apSplitOrderWords(words, sentence) {
  const raw = String(words || '').trim();
  if (raw) {
    const parts = /[\/|;,]/.test(raw) ? raw.split(/\s*[\/|;,]\s*/g) : raw.split(/\s+/g);
    const clean = parts.map(x => String(x || '').trim()).filter(Boolean);
    if (clean.length) return clean;
  }
  return String(sentence || '').trim().split(/\s+/g).filter(Boolean);
}

function apFlowFromBankGame(game, items) {
  const safeItems = (items || []).filter(Boolean);
  const first = safeItems[0] || {};
  const itemType = String(first.item_type || first.ITEM_TYPE || '').toUpperCase();
  const title = String(game?.title || game?.game_title || first.game_title || first.GAME_TITLE || game?.game_id || first.game_id || 'Juego del banco');
  const unit = String(game?.unit_id || first.unit_id || first.UNIT_ID || 'Banco');
  const area = apAreaIdToCategory(game?.area_id || first.area_id || first.AREA_ID);
  const base = {
    source:'bank', title, badge:'Banco', unit,
    intro:'Práctica cargada desde el banco curricular. No genera nota oficial.',
    how:['Leé la instrucción.', 'Respondé cada ítem.', 'Solo se registra premio si completás 100%.'],
    bankGame:game || {},
  };
  if (itemType === 'MATCH') {
    return {
      ...base,
      kind:'match',
      pairs:safeItems.map((it, index) => ({
        id:String(it.play_item_id || it.PLAY_ITEM_ID || index),
        en:String(it.match_left || it.MATCH_LEFT || it.stem || it.STEM || 'Item ' + (index + 1)),
        es:String(it.match_right || it.MATCH_RIGHT || it.option_a || it.OPTION_A || 'Respuesta ' + (index + 1)),
      })).filter(x => x.en && x.es),
    };
  }
  if (itemType === 'ORDER') {
    return {
      ...base,
      kind:'order',
      questions:safeItems.map((it, index) => {
        const answerText = String(it.correct_sentence || it.CORRECT_SENTENCE || '').trim();
        const answer = answerText.split(/\s+/g).filter(Boolean);
        return {
          type:area,
          prompt:String(it.prompt_es || it.PROMPT_ES || 'Ordená la oración.'),
          stem:String(it.stem || it.STEM || 'Ordená las palabras.'),
          words:apSplitOrderWords(it.words_to_order || it.WORDS_TO_ORDER, answerText),
          answer:answer.length ? answer : apSplitOrderWords('', answerText),
          explain:String(it.explanation_es || it.EXPLANATION_ES || 'Revisá el orden natural de la oración.'),
          key:String(it.play_item_id || it.PLAY_ITEM_ID || index),
        };
      }).filter(q => q.words.length && q.answer.length),
    };
  }
  return {
    ...base,
    kind:'choice',
    questions:safeItems.map((it, index) => {
      const type = String(it.item_type || it.ITEM_TYPE || itemType || 'MCQ').toUpperCase();
      return {
        type:area,
        prompt:String(it.prompt_es || it.PROMPT_ES || (type === 'READING_MCQ' ? 'Leé y elegí la mejor respuesta.' : type === 'DIALOGUE_MCQ' ? 'Leé el diálogo y respondé.' : 'Elegí la respuesta correcta.')),
        stem:String(it.stem || it.STEM || 'Pregunta ' + (index + 1)),
        context:String(it.mini_text_or_dialogue || it.MINI_TEXT_OR_DIALOGUE || ''),
        options:[it.option_a || it.OPTION_A, it.option_b || it.OPTION_B, it.option_c || it.OPTION_C, it.option_d || it.OPTION_D].map(x => String(x || '').trim()),
        correct:apCorrectIndex(it.correct_option || it.CORRECT_OPTION),
        explain:String(it.explanation_es || it.EXPLANATION_ES || 'Respuesta de práctica.'),
        key:String(it.play_item_id || it.PLAY_ITEM_ID || index),
      };
    }).filter(q => q.stem && q.options.every(Boolean)),
  };
}

function apStateFromCompletions(items) {
  const games = {};
  const seenGames = [];
  (items || []).forEach(item => {
    const id = String(item.GAME_ID || item.game_id || '').trim();
    if (!id) return;
    seenGames.push(id);
    games[id] = {
      title:item.GAME_TITLE || item.game_title || id,
      percent:100,
      attempts:1,
      lastPlayedAt:item.FECHA_ISO || item.fecha_iso || '',
      synced:true,
      completed100:true,
    };
  });
  return { games, seenGames };
}


function apIsCompletedGame(playState, gameId) {
  return apSafePct(playState?.games?.[gameId]?.percent || 0) >= 100;
}

function apUnitNumber(unitId) {
  const raw = String(unitId || '').toUpperCase();
  const m = raw.match(/U(\d{2})$/);
  return m ? Number(m[1]) : 0;
}

function apBuildUnitProgress(levelId, bankLevelGames, playState) {
  const map = {};
  (bankLevelGames || []).forEach(g => {
    const unitId = String(g.unit_id || '').toUpperCase();
    if (!unitId) return;
    if (!map[unitId]) map[unitId] = { id:unitId, games:[], completed:0, areas:{} };
    map[unitId].games.push(g);
    if (apIsCompletedGame(playState, g.id)) map[unitId].completed += 1;
    const area = g.category || apAreaIdToCategory(g.area_id) || 'Mixto';
    if (!map[unitId].areas[area]) map[unitId].areas[area] = { total:0, completed:0 };
    map[unitId].areas[area].total += 1;
    if (apIsCompletedGame(playState, g.id)) map[unitId].areas[area].completed += 1;
  });
  return Array.from({ length:16 }, (_, i) => {
    const id = String(levelId || 'B1').toUpperCase() + '-U' + String(i + 1).padStart(2, '0');
    const data = map[id] || { id, games:[], completed:0, areas:{} };
    const total = data.games.length || 0;
    return {
      ...data,
      id,
      total,
      percent: total ? Math.round((data.completed / total) * 100) : 0,
      number:i + 1,
    };
  });
}

function apUnitMedalLabel(completed, total) {
  if (!total) return 'Sin banco';
  if (completed >= total) return 'Oro';
  if (completed >= 10) return 'Plata';
  if (completed >= 6) return 'Bronce';
  if (completed >= 1) return 'Iniciado';
  return 'Pendiente';
}

function APUnitProgressMap({ levelId, levelLabel, bankLevelGames, playState, selectedUnit, onSelectUnit, onRefresh }) {
  const units = apBuildUnitProgress(levelId, bankLevelGames, playState);
  const totalGames = units.reduce((sum, u) => sum + u.total, 0);
  const totalCompleted = units.reduce((sum, u) => sum + u.completed, 0);
  const totalPercent = totalGames ? Math.round((totalCompleted / totalGames) * 100) : 0;
  const fullUnits = units.filter(u => u.total && u.completed >= u.total).length;
  const startedUnits = units.filter(u => u.completed > 0 && u.completed < u.total).length;
  const areas = ['Vocabulario', 'Gramática', 'Speaking', 'Escucha', 'Lectura', 'Mixto'];
  return (
    <div className={'ap-panel ap-progress-map ap-progress-map-' + String(levelId || '').toLowerCase()}>
      <div className="ap-progress-map-head">
        <div>
          <APBadge tone={apLevelTone(levelId)}>Mapa de progreso</APBadge>
          <h3>{levelLabel} · 16 unidades</h3>
          <p>Seguimiento visual por juegos completados al 100%. No genera nota oficial.</p>
        </div>
        <div className="ap-progress-map-score">
          <strong>{totalCompleted}/{totalGames || 192}</strong>
          <span>juegos 100%</span>
        </div>
      </div>
      <div className="ap-progress-map-summary">
        <div><strong>{totalPercent}%</strong><span>avance del nivel</span></div>
        <div><strong>{fullUnits}</strong><span>unidades oro</span></div>
        <div><strong>{startedUnits}</strong><span>unidades iniciadas</span></div>
        <button type="button" className="ap-btn ap-btn-light" onClick={onRefresh}>Actualizar</button>
      </div>
      <APProgress value={totalPercent} label={'Progreso total ' + (levelId || '')} />
      <div className="ap-unit-map-grid" aria-label={'Mapa de unidades ' + levelLabel}>
        {units.map(unit => {
          const medal = apUnitMedalLabel(unit.completed, unit.total || 12);
          const active = selectedUnit === unit.id;
          return (
            <button key={unit.id} type="button" className={(active ? 'active ' : '') + (unit.percent >= 100 ? 'is-gold ' : unit.completed ? 'is-started ' : '')} onClick={() => onSelectUnit(unit.id)}>
              <span className="ap-unit-map-top"><b>{apUnitShort(unit.id)}</b><em>{medal}</em></span>
              <strong>{unit.completed}/{unit.total || 12}</strong>
              <i style={{ width:(unit.total ? unit.percent : 0) + '%' }} />
              <small>{unit.percent}% completado</small>
              <span className="ap-area-dots" aria-label="Áreas de la unidad">
                {areas.map(area => {
                  const a = unit.areas?.[area] || { total:2, completed:0 };
                  const done = a.total ? Math.round((a.completed / a.total) * 100) : 0;
                  return <em key={area} className={done >= 100 ? 'done' : done > 0 ? 'started' : ''} title={area + ' ' + (a.completed || 0) + '/' + (a.total || 2)}>{area.charAt(0)}</em>;
                })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function APGameCard({ game, isFreeUser, onOpen, playState, soundOn }) {
  const locked = !apCanOpen(game, isFreeUser);
  const area = apCognitiveArea(game.category);
  const gameState = playState?.games?.[game.id] || null;
  const best = apSafePct(gameState?.percent || 0);
  const isNew = !locked && !(playState?.seenGames || []).includes(game.id);
  return (
    <button type="button" className={'ap-game-card ap-game-card-visual ' + (game.status === 'live' ? 'is-live ' : '') + (locked ? 'is-locked ' : '') + (best >= 100 ? 'is-complete ' : '') + (game.accent || '')} onClick={() => { apPlaySound(locked ? 'locked' : 'tap', soundOn); onOpen(game); }}>
      <div className="ap-game-visual-head">
        <span className={'ap-cog-icon ' + area.tone} aria-hidden="true">{area.icon}</span>
        <div className="ap-game-mini-badges">
          {isNew && <APBadge tone="red">Nuevo</APBadge>}
          {gameState && <APBadge tone={apResultTone(best)}>{apResultLabel(best)}</APBadge>}
        </div>
      </div>
      <span className="ap-game-eyebrow">{game.status === 'live' && <i aria-hidden="true" />} {game.type}</span>
      <strong>{game.title}</strong>
      <span className="ap-cog-label">{area.label}</span>
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

function APAchievementTrack({ freeGames, playState, onToggleCelebration }) {
  const completed = freeGames.filter(g => apSafePct(playState?.games?.[g.id]?.percent || 0) >= 100).length;
  return (
    <div className="ap-panel ap-achievement-panel">
      <div className="ap-achievement-head">
        <div>
          <span className="ap-small-label">Línea de logros</span>
          <h3>{completed}/{freeGames.length} al 100%</h3>
        </div>
        <button type="button" className={'ap-sound-toggle ' + ((playState?.celebrationEnabled ?? true) ? 'active' : '')} onClick={onToggleCelebration}>
          {(playState?.celebrationEnabled ?? true) ? '🔊 Sonidos on' : '🔇 Sonidos off'}
        </button>
      </div>
      <div className="ap-achievement-line" aria-label="Progreso de juegos gratis al 100%">
        {freeGames.map((game, index) => {
          const pct = apSafePct(playState?.games?.[game.id]?.percent || 0);
          const isSeen = (playState?.seenGames || []).includes(game.id);
          const state = pct >= 100 ? 'done' : pct > 0 ? 'progress' : !isSeen ? 'new' : 'idle';
          return (
            <div key={game.id} className={'ap-achievement-node ' + state}>
              <span className="ap-achievement-dot">{pct >= 100 ? '✓' : index + 1}</span>
              <strong>{game.title}</strong>
              <small>{pct >= 100 ? '100% completado' : pct > 0 ? pct + '% logrado' : !isSeen ? 'Nuevo' : 'Pendiente'}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function APAreaGrid({ categories, filter, setFilter, isFreeUser, playState }) {
  return (
    <div className="ap-area-grid" aria-label="Áreas cognitivas Academia Play">
      {categories.filter(cat => cat !== 'Todos' && cat !== 'Gratis').map(cat => {
        const info = apCognitiveArea(cat);
        const games = AP_GAMES.filter(g => g.category === cat);
        const unlocked = games.filter(g => apCanOpen(g, isFreeUser)).length;
        const completed = games.filter(g => apSafePct(playState?.games?.[g.id]?.percent || 0) >= 100).length;
        const fresh = games.filter(g => apCanOpen(g, isFreeUser) && !(playState?.seenGames || []).includes(g.id)).length;
        return (
          <button type="button" key={cat} className={'ap-area-card ' + info.tone + (filter === cat ? ' active' : '')} onClick={() => setFilter(cat)}>
            <span className="ap-area-icon" aria-hidden="true">{info.icon}</span>
            <div className="ap-area-copy">
              <strong>{info.label}</strong>
              <small>{cat}</small>
            </div>
            <div className="ap-area-stats">
              <span>{unlocked}/{games.length} visibles</span>
              <span>{completed} al 100%{fresh ? ' · ' + fresh + ' nuevo' + (fresh > 1 ? 's' : '') : ''}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}



function APMedalShelf({ freeGames, playState }) {
  const completed = freeGames.filter(g => apSafePct(playState?.games?.[g.id]?.percent || 0) >= 100);
  const allDone = completed.length === freeGames.length && freeGames.length > 0;
  return (
    <div className="ap-medal-shelf" aria-label="Medallas visuales Academia Play">
      <div className={'ap-medal-card master ' + (allDone ? 'done' : '')}>
        <span aria-hidden="true">🏆</span>
        <strong>Starter Pack</strong>
        <small>{allDone ? 'Colección completa' : completed.length + '/' + freeGames.length + ' completados'}</small>
      </div>
      {freeGames.map(game => {
        const pct = apSafePct(playState?.games?.[game.id]?.percent || 0);
        return (
          <div key={game.id} className={'ap-medal-card ' + (pct >= 100 ? 'done' : pct > 0 ? 'progress' : 'idle')}>
            <span aria-hidden="true">{pct >= 100 ? '🏅' : pct > 0 ? '⭐' : '◇'}</span>
            <strong>{game.title}</strong>
            <small>{pct >= 100 ? '100%' : pct > 0 ? pct + '%' : 'Pendiente'}</small>
          </div>
        );
      })}
    </div>
  );
}

function APCelebrationOverlay({ celebration, onClose }) {
  const pieces = apUseMemo(() => Array.from({ length: 18 }, (_, i) => ({
    left: 6 + (i * 5), delay: (i % 6) * 0.08, rotate: (i % 2 ? 12 : -12) + i * 4,
  })), []);
  if (!celebration) return null;
  return (
    <div className="ap-celebration" role="status" aria-live="polite">
      <div className="ap-celebration-card">
        <span className="ap-celebration-emoji" aria-hidden="true">🎉</span>
        <strong>¡{celebration.title} al 100%!</strong>
        <p>Medalla visual desbloqueada.</p>
        <button type="button" className="ap-btn ap-btn-light" onClick={onClose}>Cerrar</button>
      </div>
      <div className="ap-confetti" aria-hidden="true">
        {pieces.map((p, i) => <span key={i} style={{ left: p.left + '%', animationDelay: p.delay + 's', transform: 'rotate(' + p.rotate + 'deg)' }} />)}
      </div>
    </div>
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

function APStartScreen({ flow, isFreeUser, onStart, onBack, soundOn }) {
  return (
    <div className="ap-practice-card ap-start-card ap-enter">
      <div className="ap-practice-top">
        <button type="button" className="ap-btn ap-btn-light" onClick={() => { apPlaySound('click', soundOn); onBack(); }}>← Juegos</button>
        <APBadge tone={isFreeUser ? 'ok' : 'navy'}>{flow.badge || (isFreeUser ? 'Gratis' : 'Demo')}</APBadge>
      </div>
      <span className="ap-small-label">{flow.unit || 'Práctica demo'}</span>
      <h3>{flow.title}</h3>
      <p>{flow.intro}</p>
      <div className="ap-how-list" aria-label="Cómo se juega">
        {(flow.how || []).map((step, i) => <div key={step}><span>{i + 1}</span><strong>{step}</strong></div>)}
      </div>
      <p className="ap-demo-note">Práctica visual: sin notas oficiales.</p>
      <div className="ap-hero-actions ap-center-actions">
        <button type="button" className="ap-btn ap-btn-primary" onClick={() => { apPlaySound('unlock', soundOn); onStart(); }}>Empezar</button>
        <button type="button" className="ap-btn ap-btn-ghost" onClick={() => { apPlaySound('click', soundOn); onBack(); }}>Volver a juegos</button>
      </div>
    </div>
  );
}

function APSummary({ title, score, total, errors, onReset, onBack }) {
  const safeTotal = Math.max(Number(total || 0), 1);
  const safeScore = Number(score || 0);
  const pct = Math.round((safeScore / safeTotal) * 100);
  const perfect = pct >= 100;
  const good = safeScore >= Math.ceil(safeTotal * 0.7);
  return (
    <div className="ap-summary ap-summary-celebrate ap-enter">
      <div className="ap-summary-burst" aria-hidden="true">{perfect ? '🏆' : good ? '✨' : '💪'}</div>
      <APBadge tone={perfect ? 'ok' : 'red'}>Resumen · conteo animado</APBadge>
      <h3>{perfect ? '¡100% completado!' : good ? 'Buen trabajo' : 'Sigamos practicando'}</h3>
      <p>Resultado de práctica: {safeScore}/{safeTotal}. No es nota oficial; solo sirve para práctica y logros visuales.</p>
      <div className="ap-summary-grid ap-summary-grid-vivid">
        <div className="ap-summary-count navy"><span>Correctas</span><strong>{safeScore}</strong><small>{title}</small></div>
        <div className="ap-summary-count red"><span>Avance</span><strong>{pct}%</strong><small>{perfect ? 'listo para medalla' : 'podés repetir'}</small></div>
        <div className="ap-summary-count gold"><span>Errores</span><strong>{Number(errors || 0)}</strong><small>sin castigo</small></div>
      </div>
      <div className="ap-hero-actions ap-center-actions">
        <button type="button" className="ap-btn ap-btn-primary" onClick={onReset}>Practicar otra vez</button>
        <button type="button" className="ap-btn ap-btn-ghost" onClick={onBack}>Volver al catálogo</button>
      </div>
    </div>
  );
}

function APChoiceRunner({ flow, isFreeUser, onBack, onComplete, soundOn }) {
  const [phase, setPhase] = apUseState('intro');
  const [qIndex, setQIndex] = apUseState(0);
  const [selected, setSelected] = apUseState(null);
  const [answered, setAnswered] = apUseState(false);
  const [score, setScore] = apUseState(0);
  const [errors, setErrors] = apUseState(0);
  const [results, setResults] = apUseState([]);
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
    const ok = selected === q.correct;
    const nextResults = [...results, ok];
    setResults(nextResults);
    setAnswered(true);
    setScore(nextResults.filter(Boolean).length);
    setErrors(nextResults.filter(v => !v).length);
    if (ok) apPlaySound('correct', soundOn); else apPlaySound('wrong', soundOn);
  }
  function next() {
    if (qIndex >= flow.questions.length - 1) {
      const finalScore = results.filter(Boolean).length;
      const finalErrors = results.filter(v => !v).length;
      const finalPercent = Math.round((finalScore / flow.questions.length) * 100);
      onComplete && onComplete({ title: flow.title, score: finalScore, total: flow.questions.length, errors: finalErrors, percent: finalPercent });
      setPhase('summary'); return; }
    setQIndex(qIndex + 1);
    setSelected(null);
    setAnswered(false);
  }
  function reset() {
    setPhase('intro'); setQIndex(0); setSelected(null); setAnswered(false); setScore(0); setErrors(0); setResults([]);
  }

  if (phase === 'intro') return <APStartScreen flow={flow} isFreeUser={isFreeUser} onStart={() => setPhase('question')} onBack={onBack} soundOn={soundOn} />;
  if (phase === 'summary') return <APSummary title={flow.title} score={score} total={flow.questions.length} errors={errors} onReset={reset} onBack={onBack} />;

  return (
    <div className="ap-practice-card ap-enter">
      <div className="ap-live-region" aria-live="assertive">{liveText}</div>
      <div className="ap-practice-top">
        <button type="button" className="ap-btn ap-btn-light" onClick={() => { apPlaySound('click', soundOn); onBack(); }}>← Juegos</button>
        <div className="ap-practice-meta"><APTimer seconds={answered ? 12 : 20} /><APBadge tone={isFreeUser ? 'ok' : 'navy'}>{isFreeUser ? 'Gratis' : 'Demo estudiante'}</APBadge></div>
      </div>
      <APBadge>{q.type}</APBadge>
      <h3>{flow.title}</h3>
      <p>{flow.intro}</p>
      <div className="ap-question-strip ap-question-strip-vivid"><strong>{q.prompt}</strong><span>Pregunta {qIndex + 1} de {flow.questions.length}</span></div>
      {q.context && <div className="ap-bank-context"><span>{q.context}</span></div>}
      <p className="ap-question-stem">{q.stem}</p>
      <APProgress value={progress} label={'Progreso ' + flow.title} />
      <div className="ap-answer-list ap-answer-list-vivid">
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

function APMatchRunner({ flow, isFreeUser, onBack, onComplete, soundOn }) {
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
      apPlaySound('correct', soundOn);
      if (next.length === total) {
        const percent = Math.round((total / Math.max(total + errors, 1)) * 100);
        onComplete && onComplete({ title: flow.title, score: total, total, errors, percent });
        setPhase('summary');
      }
    } else {
      setErrors(errors + 1); setWrong(selectedLeft.id + '-' + pair.id); apPlaySound('wrong', soundOn);
      window.setTimeout(() => setWrong(''), 260);
    }
  }
  function reset() {
    setPhase('intro'); setSelectedLeft(null); setFixed([]); setErrors(0); setWrong('');
  }

  if (phase === 'intro') return <APStartScreen flow={flow} isFreeUser={isFreeUser} onStart={() => setPhase('question')} onBack={onBack} soundOn={soundOn} />;
  if (phase === 'summary') return <APSummary title={flow.title} score={score} total={total} errors={errors} onReset={reset} onBack={onBack} />;

  return (
    <div className="ap-practice-card ap-match-card ap-enter">
      <div className="ap-live-region" aria-live="assertive">{liveText}</div>
      <div className="ap-practice-top">
        <button type="button" className="ap-btn ap-btn-light" onClick={() => { apPlaySound('click', soundOn); onBack(); }}>← Juegos</button>
        <div className="ap-practice-meta"><APBadge tone="ok">Gratis</APBadge><APBadge>{score}/{total} pares</APBadge></div>
      </div>
      <h3>{flow.title}</h3>
      <div className="ap-runner-steps" aria-label="Cómo unir pares">
        <span><b>1</b>Tocá una palabra en inglés.</span>
        <span><b>2</b>Tocá su significado.</span>
        <span><b>3</b>El par queda fijado.</span>
      </div>
      <div className="ap-match-focus">{selectedLeft ? <>Tocá el significado de <strong>{selectedLeft.en}</strong></> : 'Elegí una palabra para empezar'}</div>
      <APProgress value={Math.round((score / total) * 100)} label="Pares completados" />
      <div className="ap-match-board ap-match-board-vivid">
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

function APOrderRunner({ flow, isFreeUser, onBack, onComplete, soundOn }) {
  const [phase, setPhase] = apUseState('intro');
  const [qIndex, setQIndex] = apUseState(0);
  const [built, setBuilt] = apUseState([]);
  const [answered, setAnswered] = apUseState(false);
  const [score, setScore] = apUseState(0);
  const [errors, setErrors] = apUseState(0);
  const [results, setResults] = apUseState([]);
  const q = flow.questions[qIndex];
  const correct = answered && built.map(x => x.w).join(' ') === q.answer.join(' ');
  const remaining = q.words.map((w, i) => ({ w, key: w + '-' + i })).filter(x => !built.some(b => b.key === x.key));
  const liveText = phase === 'summary'
    ? 'Sentence Order finalizado. Resultado demo ' + score + ' de ' + flow.questions.length + '.'
    : answered ? (correct ? 'Correcto.' : 'Casi. Revisá el orden correcto.') : 'Construí la frase.';

  function confirm() {
    if (!built.length || answered) return;
    const ok = built.map(x => x.w).join(' ') === q.answer.join(' ');
    const nextResults = [...results, ok];
    setResults(nextResults);
    setAnswered(true);
    setScore(nextResults.filter(Boolean).length);
    setErrors(nextResults.filter(v => !v).length);
    if (ok) apPlaySound('correct', soundOn); else apPlaySound('wrong', soundOn);
  }
  function next() {
    if (qIndex >= flow.questions.length - 1) {
      const finalScore = results.filter(Boolean).length;
      const finalErrors = results.filter(v => !v).length;
      const finalPercent = Math.round((finalScore / flow.questions.length) * 100);
      onComplete && onComplete({ title: flow.title, score: finalScore, total: flow.questions.length, errors: finalErrors, percent: finalPercent });
      setPhase('summary'); return; }
    setQIndex(qIndex + 1); setBuilt([]); setAnswered(false);
  }
  function reset() { setPhase('intro'); setQIndex(0); setBuilt([]); setAnswered(false); setScore(0); setErrors(0); setResults([]); }

  if (phase === 'intro') return <APStartScreen flow={flow} isFreeUser={isFreeUser} onStart={() => setPhase('question')} onBack={onBack} soundOn={soundOn} />;
  if (phase === 'summary') return <APSummary title={flow.title} score={score} total={flow.questions.length} errors={errors} onReset={reset} onBack={onBack} />;

  return (
    <div className="ap-practice-card ap-order-card ap-enter">
      <div className="ap-live-region" aria-live="assertive">{liveText}</div>
      <div className="ap-practice-top">
        <button type="button" className="ap-btn ap-btn-light" onClick={() => { apPlaySound('click', soundOn); onBack(); }}>← Juegos</button>
        <div className="ap-practice-meta"><APBadge tone="navy">Demo estudiante</APBadge><APBadge>{qIndex + 1}/{flow.questions.length}</APBadge></div>
      </div>
      <h3>{flow.title}</h3>
      <div className="ap-question-strip ap-question-strip-vivid"><strong>Ordená la oración</strong><span>{q.stem}</span></div>
      <APProgress value={Math.round(((qIndex + 1) / flow.questions.length) * 100)} label="Progreso Sentence Order" />
      <div className="ap-order-label-row"><span>Tu oración</span><small>{built.length}/{q.answer.length} fichas</small></div>
      <div className={'ap-order-workbench ap-order-workbench-vivid ' + (answered ? (correct ? 'correct' : 'wrong') : '')}>
        {built.length ? built.map(item => <button className="ap-word-token placed" key={item.key} type="button" disabled={answered} onClick={() => setBuilt(built.filter(x => x.key !== item.key))}>{item.w}</button>) : <span>Tocá palabras para armar la frase</span>}
      </div>
      <div className="ap-order-label-row"><span>Banco de fichas</span><small>Tocá para agregar</small></div>
      <div className="ap-word-bank ap-word-bank-vivid">
        {remaining.map(item => <button className="ap-word-token" key={item.key} type="button" disabled={answered} onClick={() => setBuilt([...built, item])}>{item.w}</button>)}
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

function APGameRunner({ gameId, isFreeUser, onBack, onComplete, soundOn }) {
  const flow = AP_FLOWS[gameId] || AP_FLOWS.vocabulary;
  return (
    <div className="ap-practice-wrap">
      {flow.kind === 'match'
        ? <APMatchRunner flow={flow} isFreeUser={isFreeUser} onBack={onBack} onComplete={onComplete} soundOn={soundOn} />
        : flow.kind === 'order'
          ? <APOrderRunner flow={flow} isFreeUser={isFreeUser} onBack={onBack} onComplete={onComplete} soundOn={soundOn} />
          : <APChoiceRunner flow={flow} isFreeUser={isFreeUser} onBack={onBack} onComplete={onComplete} soundOn={soundOn} />}
    </div>
  );
}


function APBankGameRunner({ game, isFreeUser, onBack, onComplete, soundOn }) {
  const [status, setStatus] = apUseState('cargando');
  const [flow, setFlow] = apUseState(null);
  const [error, setError] = apUseState('');

  apUseEffect(() => {
    let alive = true;
    setStatus('cargando');
    setError('');
    apPost('academiaPlayBankGetGame', { game_id:game?.game_id || game?.id }, 22000).then(res => {
      if (!alive) return;
      if (res && res.ok) {
        const nextFlow = apFlowFromBankGame(res.game || game, res.items || []);
        const hasContent = nextFlow.kind === 'match' ? nextFlow.pairs?.length : nextFlow.questions?.length;
        if (!hasContent) {
          setError('El juego existe, pero no tiene ítems compatibles para este formato.');
          setStatus('error');
        } else {
          setFlow(nextFlow);
          setStatus('listo');
        }
      } else {
        setError(res?.error || 'No se pudo cargar el juego desde el banco.');
        setStatus('error');
      }
    });
    return () => { alive = false; };
  }, [game?.game_id, game?.id]);

  if (status === 'cargando') {
    return (
      <div className="ap-practice-wrap">
        <div className="ap-practice-card ap-enter">
          <button type="button" className="ap-btn ap-btn-light" onClick={onBack}>← Juegos</button>
          <APBadge tone="navy">Banco curricular</APBadge>
          <h3>Cargando juego real</h3>
          <p>Estamos leyendo {game?.game_id || game?.id} desde ACADEMIA_PLAY_BANK.</p>
          <APProgress value={48} label="Cargando juego desde banco" />
        </div>
      </div>
    );
  }

  if (status === 'error' || !flow) {
    return (
      <div className="ap-practice-wrap">
        <div className="ap-practice-card ap-enter">
          <button type="button" className="ap-btn ap-btn-light" onClick={onBack}>← Juegos</button>
          <APBadge tone="red">Banco curricular</APBadge>
          <h3>No se pudo abrir este juego</h3>
          <p>{error || 'Juego no disponible.'}</p>
          <p className="ap-demo-note">Revisá que CS14 haya importado ACADEMIA_PLAY_BANK y que el GAME_ID exista.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ap-practice-wrap ap-bank-practice-wrap">
      {flow.kind === 'match'
        ? <APMatchRunner flow={flow} isFreeUser={isFreeUser} onBack={onBack} onComplete={onComplete} soundOn={soundOn} />
        : flow.kind === 'order'
          ? <APOrderRunner flow={flow} isFreeUser={isFreeUser} onBack={onBack} onComplete={onComplete} soundOn={soundOn} />
          : <APChoiceRunner flow={flow} isFreeUser={isFreeUser} onBack={onBack} onComplete={onComplete} soundOn={soundOn} />}
    </div>
  );
}

function APLockedState({ game, isFreeUser, onBack, onNavigate, soundOn }) {
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
          <button type="button" className="ap-btn ap-btn-primary" onClick={() => { apPlaySound('click', soundOn); onBack(); }}>Volver a juegos gratis</button>
          {isFreeUser && <button type="button" className="ap-btn ap-btn-ghost" onClick={() => onNavigate && onNavigate('dashboard')}>Solicitar contacto desde Mi Campus</button>}
        </div>
      </div>
    </div>
  );
}



function APStudentView({ usuario, role, rolReal, onNavigate }) {
  const isFreeUser = apEsUsuarioGratis(usuario, role, rolReal);
  const first = apFirstName(usuario);
  const userKey = apStorageUserKey(usuario);
  const cedula = apNormCedula(usuario?.cedula || usuario?.CEDULA || usuario?.identificacion || usuario?.IDENTIFICACION);
  const codigo = String(usuario?.codigo || usuario?.CODIGO || usuario?.CODIGO_ESTUDIANTE || '').trim();
  const [screen, setScreen] = apUseState('catalog');
  const [filter, setFilter] = apUseState('Todos');
  const [activeGame, setActiveGame] = apUseState(null);
  const [playState, setPlayState] = apUseState(() => apReadState(userKey));
  const [syncState, setSyncState] = apUseState('local');
  const [celebration, setCelebration] = apUseState(null);
  const [bankCatalog, setBankCatalog] = apUseState([]);
  const [bankStatus, setBankStatus] = apUseState('sin cargar');
  const [bankLevel, setBankLevel] = apUseState('B1');
  const [bankUnit, setBankUnit] = apUseState('B1-U01');
  const [bankArea, setBankArea] = apUseState('Todos');

  apUseEffect(() => { apWriteState(userKey, playState); }, [userKey, playState]);

  apUseEffect(() => {
    let alive = true;
    const t = window.setTimeout(() => {
      apPost('academiaPlayGetProgress', { user_key:userKey, cedula, codigo }).then(res => {
        if (!alive) return;
        if (res && res.ok) {
          const remote = apStateFromRemote(res.items || []);
          setPlayState(prev => apMergeStates(prev, remote));
          setSyncState('sincronizado');
        } else {
          setSyncState('local');
        }
      });
      apPost('academiaPlayCompletionSummary', { user_key:userKey, cedula, codigo }).then(res => {
        if (!alive) return;
        if (res && res.ok) {
          const completions = apStateFromCompletions(res.items || []);
          setPlayState(prev => apMergeStates(prev, completions));
        }
      });
    }, 650);
    return () => { alive = false; window.clearTimeout(t); };
  }, [userKey]);

  function loadBankCatalog() {
    setBankStatus('cargando');
    apPost('academiaPlayBankCatalog', {}, 32000).then(res => {
      if (res && res.ok) {
        const games = (res.games || []).map(apBankGameToCard);
        setBankCatalog(games);
        setBankStatus(games.length ? 'sincronizado' : 'vacío');
      } else {
        setBankCatalog([]);
        setBankStatus(res?.error || 'error');
      }
    });
  }

  apUseEffect(() => {
    const t = window.setTimeout(loadBankCatalog, 900);
    return () => window.clearTimeout(t);
  }, []);

  apUseEffect(() => {
    if (!celebration) return undefined;
    const t = window.setTimeout(() => setCelebration(null), 2600);
    return () => window.clearTimeout(t);
  }, [celebration]);

  const freeGames = AP_GAMES.filter(g => g.status === 'free');
  const freeGamesCount = freeGames.length;
  const unlockedGames = AP_GAMES.filter(g => apCanOpen(g, isFreeUser)).length;
  const categories = ['Todos', 'Gratis', 'Vocabulario', 'Gramática', 'Speaking', 'Escucha', 'Lectura', 'Mixto', 'En vivo'];
  const filtered = AP_GAMES.filter(g => filter === 'Todos' || (filter === 'Gratis' ? g.status === 'free' : g.category === filter));
  const freeCompleted = freeGames.filter(g => apSafePct(playState?.games?.[g.id]?.percent || 0) >= 100).length;
  const newCount = AP_GAMES.filter(g => apCanOpen(g, isFreeUser) && !(playState?.seenGames || []).includes(g.id)).length;
  const soundOn = playState?.celebrationEnabled !== false;

  const bankLevels = apUseMemo(() => {
    const map = {};
    bankCatalog.forEach(g => { if (g.level_id) map[g.level_id] = (map[g.level_id] || 0) + 1; });
    const found = Object.keys(map).sort((a, b) => (AP_LEVEL_ORDER.indexOf(a) < 0 ? 99 : AP_LEVEL_ORDER.indexOf(a)) - (AP_LEVEL_ORDER.indexOf(b) < 0 ? 99 : AP_LEVEL_ORDER.indexOf(b)) || a.localeCompare(b));
    return (found.length ? found : AP_LEVEL_ORDER).map(id => ({ id, label:apLevelLabel(id), count:map[id] || 0 }));
  }, [bankCatalog]);
  const bankLevelGames = bankCatalog.filter(g => String(g.level_id || '').toUpperCase() === bankLevel);
  const bankTotalCompleted = bankCatalog.filter(g => apSafePct(playState?.games?.[g.id]?.percent || 0) >= 100).length;
  const bankCompleted = bankLevelGames.filter(g => apSafePct(playState?.games?.[g.id]?.percent || 0) >= 100).length;
  const bankUnits = apUseMemo(() => {
    const map = {};
    bankLevelGames.forEach(g => { if (g.unit_id) map[g.unit_id] = (map[g.unit_id] || 0) + 1; });
    return Object.keys(map).sort().map(id => ({ id, count:map[id] }));
  }, [bankCatalog, bankLevel]);
  const bankAreas = ['Todos', 'Vocabulario', 'Gramática', 'Speaking', 'Escucha', 'Lectura', 'Mixto'];
  const bankVisible = bankLevelGames.filter(g => (!bankUnit || g.unit_id === bankUnit) && (bankArea === 'Todos' || g.category === bankArea));
  const selectedLevelLabel = apLevelLabel(bankLevel);
  const selectedUnitProgress = apBuildUnitProgress(bankLevel, bankLevelGames, playState).find(u => u.id === bankUnit) || null;

  apUseEffect(() => {
    const valid = bankUnits.some(u => u.id === bankUnit);
    if (!valid) setBankUnit(bankUnits[0]?.id || apDefaultUnitForLevel(bankLevel));
  }, [bankLevel, bankCatalog]);

  function openGame(game) {
    setPlayState(prev => apMarkSeen(prev, game.id));
    if (game.status === 'live' && apCanOpen(game, isFreeUser)) {
      setActiveGame(game); setScreen('live'); return;
    }
    if (!apCanOpen(game, isFreeUser)) {
      setActiveGame(game); setScreen('locked'); return;
    }
    if (game.source === 'bank') {
      setActiveGame(game); setScreen('bankplay'); return;
    }
    if (!AP_FLOWS[game.id]) {
      setActiveGame(game); setScreen('locked'); return;
    }
    setActiveGame(game); setScreen('play');
  }

  function handleComplete(result) {
    if (!activeGame?.id || !result) return;
    const percent = apSafePct(result.percent || 0);
    const payload = {
      user_key:userKey,
      cedula,
      codigo,
      nombre:String(usuario?.nombre || usuario?.NOMBRE || '').trim(),
      tipo_usuario:isFreeUser ? 'PREMATRICULA' : 'ESTUDIANTE',
      game_id:activeGame.id,
      game_title:activeGame.title,
      category:activeGame.category,
      area_id:activeGame.area_id || activeGame.category,
      template_id:activeGame.template_id || activeGame.skill,
      level_id:activeGame.level_id || '',
      unit_id:activeGame.unit_id || '',
      skill:activeGame.skill,
      percent,
      score:Number(result.score || 0),
      total:Number(result.total || 0),
      errors:Number(result.errors || 0),
      completed:percent >= 100,
      completed_100:percent >= 100,
    };
    setPlayState(prev => {
      const current = prev?.games?.[activeGame.id] || {};
      const nextPercent = Math.max(apSafePct(current.percent || 0), percent);
      const next = {
        ...prev,
        games: {
          ...(prev.games || {}),
          [activeGame.id]: {
            percent: nextPercent,
            attempts: Number(current.attempts || 0) + 1,
            lastPlayedAt: Date.now(),
            title: activeGame.title,
            synced: activeGame.source === 'bank' ? percent >= 100 : false,
            completed100: nextPercent >= 100,
          },
        },
      };
      const firstPerfect = nextPercent >= 100 && apSafePct(current.percent || 0) < 100;
      if (firstPerfect) {
        setCelebration({ title: activeGame.title });
        apPlaySound('achievement', next.celebrationEnabled !== false);
      } else {
        apPlaySound('complete', next.celebrationEnabled !== false);
      }
      return next;
    });

    if (activeGame.source === 'bank') {
      if (percent < 100) { setSyncState('local · banco solo guarda 100%'); return; }
      setSyncState('guardando 100%');
      apPost('academiaPlayMarkCompletion', payload).then(res => {
        if (res && res.ok) setSyncState('100% guardado');
        else setSyncState('pendiente');
      });
      return;
    }

    setSyncState('guardando');
    apPost('academiaPlaySaveProgress', payload).then(res => {
      if (res && res.ok) {
        setPlayState(prev => {
          const current = prev?.games?.[activeGame.id] || {};
          return {
            ...prev,
            games:{
              ...(prev.games || {}),
              [activeGame.id]:{...current, synced:true, attempts:Math.max(Number(current.attempts || 0), Number(res.progress?.ATTEMPTS || res.progress?.attempts || 0) || 0)}
            }
          };
        });
        setSyncState('sincronizado');
      } else {
        setSyncState('pendiente');
      }
    });
  }

  if (screen === 'play') return <><APGameRunner gameId={activeGame?.id} isFreeUser={isFreeUser} onBack={() => setScreen('catalog')} onComplete={handleComplete} soundOn={soundOn} /><APCelebrationOverlay celebration={celebration} onClose={() => setCelebration(null)} /></>;
  if (screen === 'bankplay') return <><APBankGameRunner game={activeGame} isFreeUser={isFreeUser} onBack={() => setScreen('catalog')} onComplete={handleComplete} soundOn={soundOn} /><APCelebrationOverlay celebration={celebration} onClose={() => setCelebration(null)} /></>;
  if (screen === 'locked') return <APLockedState game={activeGame} isFreeUser={isFreeUser} onBack={() => setScreen('catalog')} onNavigate={onNavigate} soundOn={soundOn} />;
  if (screen === 'live') return <APLiveRoom onBack={() => setScreen('catalog')} />;

  return (
    <div className="ap-view ap-view-student">
      <APSectionTitle eyebrow={isFreeUser ? 'Prematrícula · Acceso gratis' : 'Estudiante · Motor banco'} title={isFreeUser ? 'Practicá desde hoy, ' + first : 'Academia Play'}>
        {isFreeUser ? 'Juegos cortos, logros y progreso visual.' : 'Práctica por nivel, unidad, área y juego desde el banco curricular.'}
      </APSectionTitle>

      <div className="ap-dashboard-grid">
        <div className="ap-hero-card ap-cascade ap-cascade-1">
          <APBadge tone="red">Acceso activo</APBadge>
          <h3>{isFreeUser ? 'Entrá a Academia Play y completá tus 5 juegos gratis' : 'Continuá tu ruta por unidades'}</h3>
          <p>{isFreeUser ? 'Tu meta inicial es llevar los 5 juegos gratuitos al 100%.' : 'El banco multi-nivel ya puede cargar juegos reales si CS14A fue importado.'}</p>
          <div className="ap-hero-actions">
            <button type="button" className="ap-btn ap-btn-primary ap-breathe" onClick={() => { apPlaySound('click', soundOn); openGame(AP_GAMES[0]); }}>Practicar ahora</button>
            <button type="button" className="ap-btn ap-btn-ghost" onClick={() => { apPlaySound('click', soundOn); setScreen('catalog'); }}>Ver catálogo</button>
          </div>
        </div>
        <div className="ap-panel ap-daily-card ap-cascade ap-cascade-2">
          <span className="ap-small-label">Resumen rápido</span>
          <div className="ap-week-row"><strong>{freeCompleted}/{freeGamesCount}</strong><span>juegos gratis al 100%</span></div>
          <APProgress value={Math.round((freeCompleted / freeGamesCount) * 100)} label="Logros gratis completados" />
        </div>
        <div className="ap-panel ap-live-preview ap-cascade ap-cascade-2">
          <APBadge tone={bankCatalog.length ? 'ok' : 'navy'}>{bankStatus}</APBadge>
          <h3>{bankCatalog.length || unlockedGames} juegos visibles</h3>
          <p>{bankCatalog.length ? bankCompleted + ' juegos del banco al 100%.' : 'Importá el banco desde admin para activar la ruta real.'}</p>
          <button type="button" className="ap-btn ap-btn-light" onClick={() => { apPlaySound('click', soundOn); loadBankCatalog(); }}>Actualizar banco</button>
        </div>
      </div>

      <div className="ap-stats-grid ap-stats-grid-compact">
        <APStat label="Juegos gratis" value={String(freeGamesCount)} sub="ruta inicial" tone="red" />
        <APStat label="Banco total" value={String(bankCatalog.length)} sub="768 esperados" />
        <APStat label={bankLevel + " 100%"} value={String(bankCompleted)} sub={bankTotalCompleted + " total"} />
        <APStat label="Progreso" value={syncState === 'sincronizado' ? 'Real' : syncState === 'guardando' ? '...' : syncState === '100% guardado' ? '100%' : 'Local'} sub={syncState} />
      </div>

      <APAchievementTrack freeGames={freeGames} playState={playState} onToggleCelebration={() => setPlayState(prev => ({ ...prev, celebrationEnabled: !(prev.celebrationEnabled !== false) }))} />

      <APMedalShelf freeGames={freeGames} playState={playState} />

      <APUnitProgressMap
        levelId={bankLevel}
        levelLabel={selectedLevelLabel}
        bankLevelGames={bankLevelGames}
        playState={playState}
        selectedUnit={bankUnit}
        onSelectUnit={(unitId) => { setBankUnit(unitId); setBankArea('Todos'); }}
        onRefresh={loadBankCatalog}
      />

      <div className="ap-panel ap-bank-student-panel">
        <div className="ap-catalog-head ap-catalog-head-clean">
          <div>
            <APBadge tone={apLevelTone(bankLevel)}>Banco curricular</APBadge>
            <h3>{selectedLevelLabel} · ruta por unidad</h3>
            <p>{bankCatalog.length ? 'Elegí nivel, unidad y área. Cada unidad debe tener 12 juegos.' : 'Todavía no hay juegos importados o el banco no respondió.'}</p>
          </div>
          <button type="button" className="ap-btn ap-btn-light" onClick={loadBankCatalog}>Actualizar</button>
        </div>
        <div className="ap-bank-level-tabs" role="tablist" aria-label="Niveles Academia Play">
          {bankLevels.map(level => (
            <button key={level.id} type="button" className={bankLevel === level.id ? 'active level-' + level.id.toLowerCase() : 'level-' + level.id.toLowerCase()} onClick={() => { setBankLevel(level.id); setBankArea('Todos'); }}>
              <span>{level.label}</span><b>{level.count || 0}</b>
            </button>
          ))}
        </div>
        <div className="ap-bank-unit-tabs" role="tablist" aria-label={'Unidades ' + selectedLevelLabel}>
          {(bankUnits.length ? bankUnits : Array.from({length:16}, (_,i)=>({id:bankLevel + '-U' + String(i+1).padStart(2,'0'), count:0}))).map(unit => (
            <button key={unit.id} type="button" className={bankUnit === unit.id ? 'active' : ''} onClick={() => setBankUnit(unit.id)}>
              <span>{apUnitShort(unit.id)}</span><b>{unit.count || 0}</b>
            </button>
          ))}
        </div>
        <div className="ap-filter-tabs ap-bank-area-tabs" role="tablist" aria-label="Filtrar área del banco">
          {bankAreas.map(area => <button key={area} type="button" className={bankArea === area ? 'active' : ''} onClick={() => setBankArea(area)}>{area}</button>)}
        </div>
        <div className="ap-bank-unit-summary">
          <strong>{bankUnit}</strong>
          <span>{bankVisible.length} juego(s) visibles · {bankVisible.filter(g => apSafePct(playState?.games?.[g.id]?.percent || 0) >= 100).length} al 100% · unidad {selectedUnitProgress ? selectedUnitProgress.completed + '/' + (selectedUnitProgress.total || 12) : '0/12'}</span>
        </div>
        <div className="ap-card-grid ap-card-grid-catalog ap-bank-card-grid">
          {bankVisible.length ? bankVisible.map(g => <APGameCard key={g.id} game={g} isFreeUser={isFreeUser} onOpen={openGame} playState={playState} soundOn={soundOn} />) : <div className="ap-empty-bank"><strong>Sin juegos para este filtro.</strong><span>Validá e importá cada nivel desde Admin → Banco curricular. Si ya importaste, tocá Actualizar.</span></div>}
        </div>
      </div>

      <div className="ap-catalog-head ap-catalog-head-clean">
        <div><h3>Áreas cognitivas demo</h3><p>Catálogo visual inicial y juegos gratis.</p></div>
      </div>
      <APAreaGrid categories={categories} filter={filter} setFilter={setFilter} isFreeUser={isFreeUser} playState={playState} />

      <div className="ap-catalog-head">
        <div><h3>Catálogo demo</h3><p>{filter === 'Todos' ? (isFreeUser ? freeGamesCount + ' gratis · ' + AP_GAMES.length + ' total' : AP_GAMES.length + ' juegos') : 'Filtro: ' + filter}</p></div>
        <div className="ap-filter-tabs" role="tablist" aria-label="Filtrar catálogo de juegos">
          {categories.map(cat => <button key={cat} type="button" className={filter === cat ? 'active' : ''} onClick={() => setFilter(cat)}>{cat}</button>)}
        </div>
      </div>
      <div className="ap-card-grid ap-card-grid-catalog">
        {filtered.map(g => <APGameCard key={g.id} game={g} isFreeUser={isFreeUser} onOpen={openGame} playState={playState} soundOn={soundOn} />)}
      </div>
      <APCelebrationOverlay celebration={celebration} onClose={() => setCelebration(null)} />
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




function APAdminUserProfile({ profile, status, onClose, onRefresh }) {
  if (!profile && !status) return null;
  const summary = profile?.summary || {};
  const rows = profile?.games || [];
  const areas = profile?.areas || [];
  return (
    <div className="ap-panel ap-admin-profile-panel ap-enter">
      <div className="ap-table-title-row">
        <div>
          <APBadge tone="navy">Ficha de progreso</APBadge>
          <h3>{summary.nombre || summary.user_key || 'Usuario'}</h3>
          <p>{summary.tipo_usuario || 'SIN_TIPO'} · {summary.cedula || summary.codigo || summary.user_key || 'sin identificador'}</p>
        </div>
        <button type="button" className="ap-btn ap-btn-light" onClick={onClose}>Cerrar ficha</button>
      </div>
      {status && status !== 'sincronizado' && <p className="ap-demo-note">Estado: {status}</p>}
      {profile ? (
        <>
          <div className="ap-stats-grid ap-stats-grid-profile">
            <APStat label="Intentos" value={String(summary.total_attempts || 0)} sub="práctica real" tone="red" />
            <APStat label="100%" value={String(summary.completed_games || 0)} sub="juegos completados" />
            <APStat label="Promedio" value={String(summary.avg_percent || 0) + '%'} sub="separado de notas" />
            <APStat label="Última actividad" value={summary.last_played_label || '—'} sub="Academia Play" />
          </div>
          <div className="ap-profile-note">
            <strong>Lectura administrativa:</strong>
            <span>{summary.admin_note || 'Sin recomendación todavía.'}</span>
          </div>
          <div className="ap-profile-layout">
            <div>
              <h4>Juegos</h4>
              <div className="ap-profile-game-list">
                {rows.length ? rows.map(item => (
                  <div key={item.game_id} className="ap-profile-game-row">
                    <span><strong>{item.game_title || item.game_id}</strong><small>{item.category || 'Sin área'} · {item.attempts || 0} intento(s)</small></span>
                    <div><APProgress value={item.percent || 0} label={'Progreso ' + (item.game_title || item.game_id)} /><em>{item.percent || 0}%</em></div>
                  </div>
                )) : <p className="ap-demo-note">Este usuario todavía no tiene juegos registrados.</p>}
              </div>
            </div>
            <div>
              <h4>Áreas</h4>
              <div className="ap-profile-area-list">
                {areas.length ? areas.map(area => (
                  <div key={area.category} className="ap-profile-area-row">
                    <strong>{apCognitiveArea(area.category).icon} {area.category}</strong>
                    <small>{area.games} juego(s) · {area.completed} al 100%</small>
                    <APProgress value={area.avg_percent || 0} label={'Área ' + area.category} />
                  </div>
                )) : <p className="ap-demo-note">Sin áreas registradas.</p>}
              </div>
              <div className="ap-hero-actions">
                <button type="button" className="ap-btn ap-btn-primary" onClick={onRefresh}>Actualizar ficha</button>
              </div>
            </div>
          </div>
        </>
      ) : <p className="ap-demo-note">Seleccioná un registro para abrir la ficha.</p>}
    </div>
  );
}


const AP_DEFAULT_BANK_SOURCE_ID = '1mabas6PES9aGeXBTF8a0LGzmAI2cgEhJUmDDYAZq3KU';

function APBankAdminPanel() {
  const [bank, setBank] = apUseState(null);
  const [status, setStatus] = apUseState('cargando');
  const [sourceId, setSourceId] = apUseState(AP_DEFAULT_BANK_SOURCE_ID);
  const [importStatus, setImportStatus] = apUseState('');
  const [importResult, setImportResult] = apUseState(null);

  function loadBank() {
    setStatus('cargando');
    apPost('academiaPlayBankDashboard', {}, 22000).then(res => {
      if (res && res.ok) { setBank(res); setStatus('sincronizado'); }
      else { setBank(null); setStatus(res?.error || 'error'); }
    });
  }

  function validateSource() {
    setImportStatus('validando');
    setImportResult(null);
    apPost('academiaPlayBankValidateImport', { source_spreadsheet_id: sourceId }, 35000).then(res => {
      setImportResult(res);
      setImportStatus(res?.ok ? 'validado' : (res?.error || 'error_validacion'));
    });
  }

  function importSource() {
    const ok = window.confirm('Esto reemplaza solo el/los nivel(es) detectados en la fuente validada y conserva los demás. No toca notas oficiales. ¿Continuar?');
    if (!ok) return;
    setImportStatus('importando');
    apPost('academiaPlayBankImport', { source_spreadsheet_id: sourceId }, 60000).then(res => {
      setImportResult(res);
      setImportStatus(res?.ok && res?.imported ? 'importado' : (res?.error || 'bloqueado'));
      if (res?.ok && res?.imported) loadBank();
    });
  }

  apUseEffect(() => {
    const t = window.setTimeout(loadBank, 700);
    return () => window.clearTimeout(t);
  }, []);

  const levels = bank?.by_level || [];
  const units = bank?.by_unit || [];
  const areas = bank?.by_area || [];
  const templates = bank?.by_template || [];
  const empty = bank && !Number(bank.total_items || 0);
  const resultErrors = importResult?.errors || [];
  const resultWarnings = importResult?.warnings || [];
  const resultOk = importResult?.ok && !resultErrors.length;

  return (
    <div className="ap-panel ap-bank-panel">
      <div className="ap-catalog-head ap-catalog-head-clean">
        <div>
          <APBadge tone={empty ? 'red' : 'navy'}>Banco curricular</APBadge>
          <h3>ACADEMIA_PLAY_BANK</h3>
          <p>{empty ? 'La estructura está lista. Importá la lista pedagógica corregida.' : 'Contenido listo para motor por nivel, unidad, área y template.'}</p>
        </div>
        <button type="button" className="ap-btn ap-btn-light" onClick={loadBank}>Actualizar banco</button>
      </div>

      <div className="ap-import-card">
        <div className="ap-import-head">
          <div>
            <APBadge tone={resultOk ? 'ok' : 'navy'}>CS14 Importador</APBadge>
            <h4>Importar banco por nivel</h4>
            <p>Valida la fuente antes de importar. Reemplaza solo el nivel detectado y conserva los demás.</p>
          </div>
          <span className="ap-import-status">{importStatus || 'pendiente'}</span>
        </div>
        <label className="ap-import-label">
          ID o URL de Google Sheet
          <input value={sourceId} onChange={e => setSourceId(e.target.value)} placeholder="ID del spreadsheet fuente" />
        </label>
        <div className="ap-hero-actions ap-import-actions">
          <button type="button" className="ap-btn ap-btn-light" onClick={validateSource}>Validar fuente</button>
          <button type="button" className="ap-btn ap-btn-primary" onClick={importSource} disabled={!resultOk}>Importar al banco</button>
        </div>
        {importResult ? (
          <div className={"ap-import-result " + (resultOk ? 'is-ok' : 'is-error')}>
            <strong>{importResult.message || (resultOk ? 'Fuente validada' : 'Revisar fuente')}</strong>
            <div className="ap-import-metrics">
              <span>{importResult.total_items || 0} ítems</span>
              <span>{importResult.total_games || 0} juegos</span>
              <span>{importResult.total_units || 0} unidades</span>
              <span>{resultErrors.length} errores</span>
              <span>{resultWarnings.length} alertas</span>
            </div>
            {resultErrors.length ? <div className="ap-import-list"><b>Errores</b>{resultErrors.slice(0, 5).map((x, i) => <small key={i}>{x}</small>)}</div> : null}
            {resultWarnings.length ? <div className="ap-import-list"><b>Alertas</b>{resultWarnings.slice(0, 5).map((x, i) => <small key={i}>{x}</small>)}</div> : null}
          </div>
        ) : null}
      </div>

      <div className="ap-stats-grid ap-stats-grid-compact">
        <APStat label="Ítems" value={bank ? String(bank.total_items || 0) : '...'} sub={status} tone="red" />
        <APStat label="Juegos" value={bank ? String(bank.total_games || 0) : '...'} sub="GAME_ID únicos" />
        <APStat label="Completados" value={bank ? String(bank.total_completions || 0) : '...'} sub="100% registrados" />
      </div>
      <div className="ap-bank-grid">
        <div>
          <h4>Niveles</h4>
          <div className="ap-mini-list">
            {levels.length ? levels.slice(0, 8).map(x => <span key={x.level_id}>{x.level_id || 'SIN NIVEL'} · {x.items} ítems · {x.games} juegos</span>) : <span>Sin contenido importado.</span>}
          </div>
        </div>
        <div>
          <h4>Áreas</h4>
          <div className="ap-mini-list">
            {areas.length ? areas.map(x => <span key={x.area_id}>{x.area_id || 'SIN ÁREA'} · {x.items} ítems · {x.games} juegos</span>) : <span>Sin áreas todavía.</span>}
          </div>
        </div>
        <div>
          <h4>Templates</h4>
          <div className="ap-mini-list">
            {templates.length ? templates.slice(0, 12).map(x => <span key={x.template_id}>{x.template_id || 'SIN TEMPLATE'} · {x.items} ítems</span>) : <span>Sin templates todavía.</span>}
          </div>
        </div>
      </div>
      <div className="ap-bank-unit-strip">
        {units.slice(0, 16).map(x => <span key={x.unit_id}>{x.unit_id || 'SIN UNIDAD'} <b>{x.games}</b></span>)}
      </div>
      <p className="ap-demo-note">CS14 importa el banco validado y sigue guardando solo completados 100%. No toca DATOS, ESTATUS ni notas oficiales.</p>
    </div>
  );
}

function APAdminView() {
  const [dash, setDash] = apUseState(null);
  const [status, setStatus] = apUseState('cargando');
  const [filter, setFilter] = apUseState('Todos');
  const [selected, setSelected] = apUseState(null);
  const [profile, setProfile] = apUseState(null);
  const [profileStatus, setProfileStatus] = apUseState('');

  function loadDashboard() {
    setStatus('cargando');
    apPost('academiaPlayAdminDashboard', { limit: 40 }, 20000).then(res => {
      if (res && res.ok) { setDash(res); setStatus('sincronizado'); }
      else { setDash(null); setStatus(res?.error || 'error'); }
    });
  }

  function loadProfile(item) {
    if (!item) return;
    setSelected(item);
    setProfileStatus('cargando');
    apPost('academiaPlayAdminUserProfile', {
      user_key:item.user_key || '', cedula:item.cedula || '', codigo:item.codigo || '', nombre:item.nombre || ''
    }, 20000).then(res => {
      if (res && res.ok) { setProfile(res); setProfileStatus('sincronizado'); }
      else { setProfile(null); setProfileStatus(res?.error || 'error'); }
    });
  }

  apUseEffect(() => {
    const t = window.setTimeout(loadDashboard, 450);
    return () => window.clearTimeout(t);
  }, []);

  const games = dash?.by_game || [];
  const recent = dash?.recent || [];
  const needs = dash?.needs_attention || [];
  const filteredRecent = recent.filter(item => filter === 'Todos' || String(item.category || '').toLowerCase() === filter.toLowerCase() || String(item.tipo_usuario || '').toLowerCase() === filter.toLowerCase());
  const filters = ['Todos', 'PREMATRICULA', 'ESTUDIANTE', 'Vocabulario', 'Speaking', 'Mixto', 'Gramática', 'Escucha', 'Lectura'];

  return (
    <div className="ap-view ap-view-admin">
      <APSectionTitle eyebrow="Admin · Superadmin" title="Panel Academia Play">
        Progreso real separado de notas oficiales.
      </APSectionTitle>
      <div className="ap-stats-grid">
        <APStat label="Usuarios" value={dash ? String(dash.total_users || 0) : '...'} sub="con práctica registrada" tone="red" />
        <APStat label="Intentos" value={dash ? String(dash.total_attempts || 0) : '...'} sub="en hoja separada" />
        <APStat label="Completados" value={dash ? String(dash.completed_records || 0) : '...'} sub="juegos al 100%" />
        <APStat label="Promedio" value={dash ? String(dash.avg_percent || 0) + '%' : '...'} sub={status === 'sincronizado' ? 'sincronizado' : status} />
      </div>

      <APBankAdminPanel />

      <div className="ap-admin-grid ap-admin-grid-live">
        <div className="ap-panel ap-admin-note-panel">
          <APBadge tone="red">Nota admin</APBadge>
          <h3>Hoja separada</h3>
          <p>Este panel lee ACADEMIA_PLAY_PROGRESS. La ficha por estudiante ayuda a ventas/admin sin tocar notas oficiales.</p>
          <div className="ap-hero-actions">
            <button type="button" className="ap-btn ap-btn-primary" onClick={loadDashboard}>Actualizar panel</button>
            <button type="button" className="ap-btn ap-btn-ghost" onClick={() => setFilter('PREMATRICULA')}>Ver prematrícula</button>
          </div>
        </div>
        <div className="ap-panel ap-admin-note-panel">
          <APBadge tone={needs.length ? 'red' : 'ok'}>{needs.length ? 'Revisar' : 'OK'}</APBadge>
          <h3>{needs.length} con intentos sin 100%</h3>
          <p>{needs.length ? 'Tocá un caso para abrir ficha de progreso.' : 'No hay alertas de práctica pendientes.'}</p>
          <div className="ap-mini-list ap-mini-list-clickable">
            {needs.slice(0, 4).map(item => <button type="button" key={(item.user_key || item.nombre) + item.game_id} onClick={() => loadProfile(item)}>{item.nombre || item.user_key} · {item.game_title} · {item.percent}%</button>)}
          </div>
        </div>
      </div>

      <APAdminUserProfile profile={profile} status={profileStatus} onClose={() => { setProfile(null); setSelected(null); setProfileStatus(''); }} onRefresh={() => loadProfile(selected)} />

      <div className="ap-panel ap-admin-progress-panel">
        <div className="ap-catalog-head ap-catalog-head-clean">
          <div><h3>Juegos con progreso</h3><p>{games.length} juegos con registros reales.</p></div>
        </div>
        <div className="ap-admin-game-grid">
          {games.length ? games.map(g => (
            <div key={g.game_id} className="ap-admin-game-card">
              <strong>{g.game_title || g.game_id}</strong>
              <small>{g.category || 'Sin categoría'} · {g.users} usuarios</small>
              <APProgress value={g.avg_percent || 0} label={'Promedio ' + (g.game_title || g.game_id)} />
              <span>{g.completed} completados · {g.attempts} intentos</span>
            </div>
          )) : <p className="ap-demo-note">Todavía no hay progreso real registrado.</p>}
        </div>
      </div>

      <div className="ap-panel ap-table-panel ap-admin-live-table">
        <div className="ap-table-title-row">
          <h3>Actividad reciente</h3>
          <div className="ap-filter-tabs" role="tablist" aria-label="Filtrar actividad Academia Play">
            {filters.map(f => <button key={f} type="button" className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}
          </div>
        </div>
        <div className="ap-table ap-table-rich ap-table-clickable">
          {filteredRecent.length ? filteredRecent.slice(0, 30).map((item, idx) => (
            <button type="button" key={(item.user_key || item.nombre || idx) + '-' + item.game_id + '-' + idx} onClick={() => loadProfile(item)}>
              <span><strong>{item.nombre || item.user_key || 'Usuario'}</strong><small>{item.tipo_usuario || 'SIN_TIPO'} · {item.game_title || item.game_id}</small></span>
              <strong>{item.percent || 0}%</strong>
              <em>{item.attempts || 0} intento(s)</em>
            </button>
          )) : <div><span>No hay registros para este filtro.</span><strong>—</strong></div>}
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
    <div className="aplay-shell" data-screen-label="Academia Play · V2.4 mapa progreso">
      <div className="aplay-topbar">
        <div>
          <APBadge tone="red">V2.4 · mapa progreso</APBadge>
          <h1>Academia Play</h1>
          <p>{nombre} · Práctica visual sin notas oficiales.</p>
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
