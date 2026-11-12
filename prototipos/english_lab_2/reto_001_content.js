/* Northbound English Lab · Reto semanal 001 · contenido original, solo datos.
 * No utiliza sesiones reales, Apps Script, notas ni información académica.
 * Núcleo: B1/U1 (saludos, presentación, cortesía, deletreo).
 * BONUS explícito: U3 país de origen y U8 ocupaciones (no computa como U1).
 * Estado: BORRADOR IA; revisión docente pendiente.
 */
(function () {
  'use strict';
  var base = window.LAB2_CONTENT;
  if (!base) throw new Error('Northbound: falta el catálogo base');
  var episode = {
    id: 'WEEK01-INTERVIEW-B1',
    level: 'B1',
    unit: 1,
    number: 1,
    title: 'North Coffee Interview',
    title_es: 'Mi primera entrevista en inglés',
    place: 'North Coffee · North City',
    status: 'BORRADOR IA',
    syllabus: {
      source: 'src/syllabus.jsx · Básico I · Unit 1, L1–L2; BONUS Unit 3 y Unit 8',
      objectives: [
        'U1: saludar según el contexto y responder una pregunta simple.',
        'U1: presentarse con My name is y deletrear un nombre.',
        'U1: usar please, thank you, you’re welcome y nice to meet you.',
        'BONUS de exploración: reconocer preguntas sobre país de origen (U3) y ocupación (U8).'
      ]
    },
    story_es: 'En North City encontrás un aviso: North Coffee busca una persona para apoyar en la cafetería. Entrás, saludás a la encargada y tenés tu primera conversación de entrevista. El reto termina con una invitación para conocer el local: no es una oferta de empleo real.',
    cast: [
      { id: 'rivera', name: 'Ms. Rivera', role: 'encargada de North Coffee', tone: 'rose' },
      { id: 'sam', name: 'Sam', role: 'colaborador de la cafetería', tone: 'teal' }
    ],
    scenes: [
      {
        id: 'WEEK01-INTERVIEW-S1',
        stage: 'Escena 1 · Llegar',
        title: 'A good first hello',
        title_es: 'La primera impresión',
        skills: ['reading', 'listening', 'speaking'],
        goal_es: 'Saludá en inglés a la encargada y respondé una pregunta cotidiana (B1/U1).',
        why_es: 'Llegás al local, observás la hora y elegís las palabras para empezar.',
        steps: [
          { kind: 'line', clock: '10:15', text_es: 'Es viernes a las 10:15 a. m. Frente a la cafetería North Coffee, un cartel dice “We are hiring”. Entrás para preguntar por la entrevista.' },
          { kind: 'choice', clock: '10:15', who: 'rivera', say: 'Good morning! Welcome to North Coffee.', ask_es: '¿Cómo la saludás a esta hora?',
            options: [
              { t: 'Good morning!', ok: true },
              { t: 'Good evening!', why_es: 'Good evening es un saludo de la noche. Son las diez de la mañana.' },
              { t: 'Good night!', why_es: 'Good night se usa al despedirse por la noche, no al llegar a una cafetería de mañana.' }
            ], explain_es: 'Morning es mañana. Un saludo correcto abre la conversación.' },
          { kind: 'choice', clock: '10:16', who: 'rivera', say: 'How are you today?', ask_es: 'La encargada pregunta cómo estás. ¿Qué contestás?',
            options: [
              { t: "I'm fine, thank you.", ok: true },
              { t: 'My name is Ms. Rivera.', why_es: 'Esa respuesta serviría si te preguntara tu nombre, no cómo te sentís.' },
              { t: 'Good night.', why_es: 'No es una despedida: Ms. Rivera espera saber cómo estás.' }
            ], explain_es: "I'm fine, thank you es una respuesta sencilla y cortés a How are you?" },
          { kind: 'say', clock: '10:16', who: 'rivera', say: 'Nice to meet you!', phrase: 'Nice to meet you, too.', ask_es: 'Practicá la respuesta en voz alta. El botón registra práctica declarada, no reconoce tu voz.' }
        ]
      },
      {
        id: 'WEEK01-INTERVIEW-S2',
        stage: 'Escena 2 · Presentarse',
        title: 'Tell me your name',
        title_es: 'Tu nombre y el alfabeto',
        skills: ['listening', 'writing', 'reading'],
        goal_es: 'Presentate y deletreá tu nombre en inglés (B1/U1).',
        why_es: 'Ms. Rivera necesita anotar cómo te llamás antes de conversar.',
        steps: [
          { kind: 'line', clock: '10:17', text_es: 'Ms. Rivera abre una libreta: quiere saber tu nombre y anotarlo correctamente.' },
          { kind: 'build', clock: '10:17', who: 'rivera', say: "What's your name?", ask_es: 'Armá una presentación con tu nombre, tocando las palabras en orden.',
            answer: ['My', 'name', 'is', '{name}'], extra: ['are', 'your'],
            explain_es: 'My name is + tu nombre. También podés presentarte con I’m + tu nombre.' },
          { kind: 'spell', clock: '10:18', who: 'rivera', say: 'How do you spell your name?', own: true, ask_es: 'Escribí tu nombre. Podés escuchar cómo suenan sus letras en inglés.' },
          { kind: 'choice', clock: '10:19', who: 'rivera', say: 'Thank you, {name}. Nice to meet you.', ask_es: '¿Cuál respuesta resulta amable y adecuada?',
            options: [
              { t: 'Nice to meet you, too.', ok: true },
              { t: 'Good night.', why_es: 'No es una despedida y todavía es de mañana.' },
              { t: 'How do you spell your name?', why_es: 'La encargada ya está respondiendo a tu presentación.' }
            ], explain_es: 'Nice to meet you, too significa “igualmente, mucho gusto”.' }
        ]
      },
      {
        id: 'WEEK01-INTERVIEW-S3',
        stage: 'Escena 3 · Conversar',
        title: 'Your first interview',
        title_es: 'La entrevista',
        skills: ['reading', 'writing', 'speaking'],
        goal_es: 'Responder con cortesía para terminar tu primera entrevista simulada (B1/U1).',
        why_es: 'Cerrás una conversación corta: presentarte, ayudar, agradecer y despedirte.',
        steps: [
          { kind: 'line', clock: '10:20', text_es: 'Sam trae dos sillas y te ofrece una. Ms. Rivera sonríe: llegó la parte final de tu breve entrevista.' },
          { kind: 'choice', clock: '10:20', who: 'sam', say: 'Would you like a seat?', ask_es: 'Sam te ofrece una silla. ¿Cómo aceptás con cortesía?',
            options: [
              { t: 'Yes, please.', ok: true },
              { t: 'Give me a chair!', why_es: 'Es una orden. Para aceptar una oferta, Yes, please es una respuesta cortés.' },
              { t: 'Good evening.', why_es: 'No está saludándote: te ofrece una silla.' }
            ], explain_es: 'Please se utiliza para pedir o aceptar con cortesía.' },
          { kind: 'build', clock: '10:21', who: 'rivera', say: 'Thank you for coming today!', ask_es: 'Armá una respuesta amable.',
            answer: ['Thank', 'you', 'very', 'much'], extra: ['am', 'are'],
            explain_es: 'Thank you very much expresa agradecimiento.' },
          { kind: 'type', clock: '10:22', who: 'sam', say: 'Thank you for holding the door!', ask_es: 'Sam te da las gracias. Escribí una respuesta en inglés.',
            accept: ["you're welcome", 'you are welcome'], explain_es: 'You’re welcome significa “con gusto”. Recordá el apóstrofo de you’re.' },
          { kind: 'say', clock: '10:23', who: 'rivera', say: 'You did well. Come back for a practice shift!', phrase: 'Thank you, Ms. Rivera. Goodbye!', ask_es: 'Decí tu despedida en voz alta. El sistema no evalúa automáticamente la pronunciación.' },
          { kind: 'line', clock: '10:24', text_es: '¡Entrevista terminada! Ms. Rivera te invita a conocer cómo funciona la cafetería. Conseguís el sello “Primer encuentro”, que representa práctica completada, no una calificación ni una contratación.' }
        ]
      },
      {
        id: 'WEEK01-INTERVIEW-S4',
        stage: 'Bonus · Explorar',
        title: 'One step further',
        title_es: 'Preguntas que vienen después',
        skills: ['reading', 'speaking'],
        goal_es: 'Exploración opcional de B1/U3 (origen) y B1/U8 (ocupaciones). No pertenece a la Unidad 1.',
        why_es: 'Un anticipo para quienes quieran intentar preguntas un poco más avanzadas.',
        steps: [
          { kind: 'line', clock: '10:25', text_es: 'BONUS opcional. Estas preguntas se estudian después: país de origen en la Unidad 3 y ocupaciones en la Unidad 8. No necesitás hacer esta escena para terminar la entrevista.' },
          { kind: 'choice', clock: '10:25', who: 'rivera', say: "I'm from Costa Rica.", ask_es: '¿Qué pregunta corresponde a esta respuesta? (Adelanto B1/U3)',
            options: [
              { t: 'Where are you from?', ok: true },
              { t: "What's your name?", why_es: 'Esa pregunta pide un nombre, no un país.' },
              { t: 'How are you?', why_es: 'Esa pregunta pide cómo te sentís.' }
            ], explain_es: 'Where are you from? pregunta por el lugar de origen. La respuesta es un ejemplo de un personaje, no presupone tu nacionalidad.' },
          { kind: 'choice', clock: '10:26', who: 'sam', say: "I'm a barista.", ask_es: '¿Qué pregunta corresponde a esta respuesta? (Adelanto B1/U8)',
            options: [
              { t: 'What do you do?', ok: true },
              { t: 'Where are you from?', why_es: 'Esa pregunta solicita origen, no ocupación.' },
              { t: 'How do you spell it?', why_es: 'Esa pregunta pide deletrear una palabra.' }
            ], explain_es: 'What do you do? puede utilizarse para preguntar por la ocupación.' },
          { kind: 'say', clock: '10:27', who: 'rivera', say: 'See you soon!', phrase: 'See you soon, Ms. Rivera!', ask_es: 'Despedite en voz alta. ¡Terminaste el bonus!' }
        ]
      }
    ]
  };

  window.LAB2_CONTENT = Object.assign({}, base, {
    version: 'weekly-001.0.1',
    weekly: true,
    weeklyId: episode.id,
    levels: base.levels.map(function (l) {
      if (l.id === 'B1') return Object.assign({}, l, { arc:'First conversations', arc_es:'Un reto breve para practicar conversaciones iniciales.', ready:true });
      return Object.assign({}, l, { ready:false });
    }),
    stops: { B1:[{ unit:1, topic:'Reto semanal · Entrevista en North Coffee', episode:episode.id }], B2:[], I1:[], I2:[] },
    episodes:[episode]
  });
})();
