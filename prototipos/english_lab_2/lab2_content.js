/* English Lab 2.0 · contenido como datos.
 * Este archivo no tiene lógica: solo describe niveles, episodios, escenas y pasos.
 * Todo el contenido es original de Academia Norteamericana. No copia Interchange.
 * Estado académico por episodio: 'BORRADOR IA' | 'REVISADO POR DOCENTE' | 'APROBADO PARA PUBLICACIÓN'.
 * Fuente curricular de B1-U01: src/syllabus.jsx, Básico I, Unit 1, lecciones 1 y 2.
 */
window.LAB2_CONTENT = {
  version: '0.1.0',
  city: 'Port Hazel',
  levels: [
    { id: 'B1', name: 'Básico I', arc: 'Arrival', arc_es: 'Llegás. Primeras palabras para moverte.', ready: true },
    { id: 'B2', name: 'Básico II', arc: 'Settling In', arc_es: 'Te instalás: barrio, compras, rutinas.', ready: false },
    { id: 'I1', name: 'Intermedio I', arc: 'Making It Work', arc_es: 'Trabajo, planes y problemas que resolver.', ready: false },
    { id: 'I2', name: 'Intermedio II', arc: 'Taking the Lead', arc_es: 'Negociás, opinás y explicás con matices.', ready: false }
  ],
  /* Paradas de Básico I. Los temas salen de los títulos de lección del sílabus del repo. */
  stops: {
    B1: [
      { unit: 1, topic: 'Alfabeto, saludos, presentaciones y cortesía', episode: 'B1-U01' },
      { unit: 2, topic: 'Objetos de aula y posesivos' },
      { unit: 3, topic: 'Ciudades, países y personalidad' },
      { unit: 4, topic: 'Ropa, colores, clima y estaciones' },
      { unit: 5, topic: 'La hora, horarios y rutinas' },
      { unit: 6, topic: 'De compras y turismo' },
      { unit: 7, topic: 'Planes de fin de semana, tareas y ocio' },
      { unit: 8, topic: 'Ocupaciones' },
      { unit: 9, topic: 'Comida y hábitos' },
      { unit: 10, topic: 'Rutinas diarias y present simple' },
      { unit: 11, topic: 'Ubicaciones y direcciones' },
      { unit: 12, topic: 'Habilidades, permisos y present continuous' },
      { unit: 13, topic: 'Planes futuros con going to' },
      { unit: 14, topic: 'Experiencias en past simple' },
      { unit: 15, topic: 'Lugares de origen' },
      { unit: 16, topic: 'Obligaciones con must y mustn\'t' }
    ]
  },
  /* Cómo suena el nombre de cada letra, escrito para un hispanohablante. Pendiente de revisión docente. */
  letterSounds: {
    A: 'ei', B: 'bi', C: 'si', D: 'di', E: 'i', F: 'ef', G: 'yi', H: 'eich', I: 'ai', J: 'yei', K: 'kei', L: 'el', M: 'em',
    N: 'en', O: 'ou', P: 'pi', Q: 'kiu', R: 'ar', S: 'es', T: 'ti', U: 'iu', V: 'vi', W: 'dábliu', X: 'eks', Y: 'uai', Z: 'zi'
  },
  /* Confusiones típicas de quien habla español. Se usan para explicar el error, no solo marcarlo. */
  letterTraps: {
    'E>I': 'La letra E se llama "i". La letra I se llama "ai".',
    'I>E': 'La letra I se llama "ai". La letra E se llama "i".',
    'A>E': 'La letra A se llama "ei". La letra E se llama "i".',
    'E>A': 'La letra E se llama "i". La letra A se llama "ei".',
    'G>J': 'G se llama "yi" y J se llama "yei". Fijate en el final.',
    'J>G': 'J se llama "yei" y G se llama "yi". Fijate en el final.',
    'V>B': 'V es "vi", con los dientes sobre el labio. B es "bi", con los dos labios.',
    'B>V': 'B es "bi", con los dos labios. V es "vi", con los dientes sobre el labio.',
    'Z>S': 'En inglés estadounidense, Z se llama "zi". S se llama "es". Son nombres de letras diferentes.',
    'Z>C': 'Z se llama "zi" y vibra. C se llama "si".',
    'Y>I': 'Y se llama "uai". I se llama "ai".'
  },
  episodes: [
    {
      id: 'B1-U01',
      level: 'B1',
      unit: 1,
      number: 1,
      title: 'Arrival Night',
      title_es: 'La noche que llegás',
      place: 'Hazel Street Hostel',
      status: 'BORRADOR IA',
      syllabus: {
        source: 'src/syllabus.jsx · Básico I · Unit 1 · lecciones 1 y 2',
        objectives: [
          'Reconocer y usar el alfabeto para deletrear nombres.',
          'Saludar y despedirse según la hora y la persona.',
          'Presentarse y usar please, thank you y you\'re welcome.'
        ]
      },
      story_es: 'Acabás de llegar a Port Hazel con una maleta y una reserva en un hostal. Nadie habla español. Para que te den la llave vas a tener que saludar, deletrear tu nombre y presentarte.',
      cast: [
        { id: 'maya', name: 'Maya', role: 'recepcionista', tone: 'amber' },
        { id: 'leo', name: 'Leo', role: 'tu compañero de cuarto', tone: 'teal' },
        { id: 'park', name: 'Mrs. Park', role: 'dueña del hostal', tone: 'rose' }
      ],
      scenes: [
        {
          id: 'B1-U01-S1',
          stage: 'Descubrir',
          title: 'The right hello',
          title_es: 'El saludo correcto',
          skills: ['reading', 'listening'],
          goal_es: 'Elegir el saludo o la despedida que calza con la hora y con la persona.',
          why_es: 'Primero reconocés. Tenés reloj y contexto para apoyarte.',
          steps: [
            { kind: 'line', clock: '21:10', text_es: 'Son las 9:10 de la noche. Entrás al hostal con tu maleta. Detrás del mostrador hay una muchacha.' },
            { kind: 'choice', clock: '21:10', who: 'maya', say: 'Good evening! Welcome to Hazel Street Hostel.', ask_es: '¿Cómo la saludás?',
              options: [
                { t: 'Good evening!', ok: true },
                { t: 'Good morning!', why_es: 'Good morning es antes del mediodía. Son las 9 de la noche.' },
                { t: 'Good night!', why_es: 'Good night se dice al despedirse o al irse a dormir. Para saludar de noche es Good evening.' }
              ], explain_es: 'De noche se saluda con Good evening. Good night es para despedirse.' },
            { kind: 'choice', clock: '21:11', who: 'maya', say: 'How are you?', ask_es: 'Ella pregunta cómo estás.',
              options: [
                { t: 'I\'m fine, thank you.', ok: true },
                { t: 'I\'m Maya.', why_es: 'Eso contesta What\'s your name? Ella preguntó cómo estás.' },
                { t: 'Good evening.', why_es: 'Ya se saludaron. Ahora te pregunta cómo estás.' }
              ], explain_es: 'How are you? se contesta con I\'m fine, y es cortés agregar thank you.' },
            { kind: 'line', clock: '07:30', text_es: 'A la mañana siguiente, 7:30. En tu cuarto hay un muchacho de tu edad amarrándose los zapatos.' },
            { kind: 'choice', clock: '07:30', who: 'leo', say: 'Hey! Morning!', ask_es: 'Es de tu edad y habla relajado.',
              options: [
                { t: 'Hi! Good morning.', ok: true },
                { t: 'Good evening, sir.', why_es: 'Son las 7:30 de la mañana, y sir es demasiado formal para alguien de tu edad.' },
                { t: 'Good night.', why_es: 'Good night es para despedirse de noche. Es de mañana y te está saludando.' }
              ], explain_es: 'Con alguien de tu edad basta Hi o Hello. Morning es una forma corta de Good morning.' },
            { kind: 'line', clock: '14:00', text_es: 'A las 2 de la tarde bajás a la sala. Una señora mayor, muy elegante, se te acerca.' },
            { kind: 'choice', clock: '14:00', who: 'park', say: 'Good afternoon. I\'m Mrs. Park. I\'m the owner.', ask_es: 'Es la dueña y no la conocés.',
              options: [
                { t: 'Good afternoon, Mrs. Park. Nice to meet you.', ok: true },
                { t: 'Hey, what\'s up?', why_es: 'Es muy informal para una persona mayor que acabás de conocer.' },
                { t: 'Good morning, Mrs. Park.', why_es: 'Son las 2 de la tarde. Después del mediodía es Good afternoon.' }
              ], explain_es: 'Con alguien mayor o que no conocés: saludo completo, su título (Mr., Mrs., Ms.) y Nice to meet you.' },
            { kind: 'choice', clock: '22:30', who: 'maya', say: 'I\'m going home now. See you tomorrow!', ask_es: 'Son las 10:30 de la noche y Maya se va.',
              options: [
                { t: 'Good night! See you tomorrow.', ok: true },
                { t: 'Good evening!', why_es: 'Good evening es para saludar. Maya se está despidiendo.' },
                { t: 'Nice to meet you.', why_es: 'Nice to meet you se dice cuando conocés a alguien, no al despedirse.' }
              ], explain_es: 'Para despedirse de noche: Good night. See you tomorrow es "nos vemos mañana".' }
          ]
        },
        {
          id: 'B1-U01-S2',
          stage: 'Practicar',
          title: 'Spell it for me',
          title_es: 'Deletréemelo',
          skills: ['listening', 'writing'],
          goal_es: 'Escribir un nombre cuando te lo deletrean en inglés.',
          why_es: 'Ahora producís vos. Tenés pistas de sonido si las pedís.',
          steps: [
            { kind: 'line', clock: '21:15', text_es: 'Maya busca reservas en la computadora y las dice en voz alta, letra por letra. Ayudale escribiendo lo que escuchás.' },
            { kind: 'spell', clock: '21:15', who: 'maya', say: 'The next reservation is under...', word: 'REYES', ask_es: 'Escribí el apellido que deletrea.' },
            { kind: 'spell', clock: '21:16', who: 'maya', say: 'And this one is for Mr...', word: 'GIBSON', ask_es: 'Escribí el apellido.' },
            { kind: 'spell', clock: '21:17', who: 'maya', say: 'First name...', word: 'JAVIER', ask_es: 'Escribí el nombre.' },
            { kind: 'spell', clock: '21:18', who: 'maya', say: 'The Wi-Fi password is...', word: 'HAZEL', ask_es: 'Escribí la clave del Wi-Fi.' },
            { kind: 'spell', clock: '21:19', who: 'maya', say: 'And you? How do you spell your first name?', own: true, ask_es: 'Ahora deletreá tu propio nombre. Escribilo y Maya te lo repite letra por letra.' }
          ]
        },
        {
          id: 'B1-U01-S3',
          stage: 'Aplicar',
          title: 'Check-in',
          title_es: 'El registro',
          skills: ['reading', 'writing', 'speaking'],
          goal_es: 'Registrarte en el hostal: pedir con cortesía, decir y deletrear tu nombre, agradecer.',
          why_es: 'Una conversación completa. Ya no elegís entre opciones: armás y escribís tus respuestas.',
          steps: [
            { kind: 'choice', clock: '21:20', who: 'maya', say: 'Hello! Can I help you?', ask_es: 'Tenés una reserva.',
              options: [
                { t: 'Yes, please. I have a reservation.', ok: true },
                { t: 'Yes. Give me a room.', why_es: 'Sin please suena a orden. En inglés la cortesía va en casi cada frase.' },
                { t: 'No, thank you.', why_es: 'Sí necesitás ayuda: tenés una reserva.' }
              ], explain_es: 'Yes, please es la forma cortés de aceptar ayuda.' },
            { kind: 'build', clock: '21:21', who: 'maya', say: 'Of course. What\'s your name?', ask_es: 'Armá tu respuesta tocando las palabras en orden.',
              answer: ['My', 'name', 'is', '{name}'], extra: ['are', 'you'], explain_es: 'My name is + tu nombre. También sirve I\'m + tu nombre.' },
            { kind: 'spell', clock: '21:22', who: 'maya', say: 'How do you spell that?', own: true, ask_es: 'Deletreá tu nombre para que lo encuentre.' },
            { kind: 'build', clock: '21:23', who: 'maya', say: 'Here it is! Room twelve. Here is your key.', ask_es: 'Te da la llave. Agradecé.',
              answer: ['Thank', 'you', 'very', 'much'], extra: ['Please', 'welcome'], explain_es: 'Thank you very much es "muchas gracias".' },
            { kind: 'say', clock: '21:24', who: 'maya', say: 'Nice to meet you!', phrase: 'Nice to meet you, too.', ask_es: 'Decilo en voz alta, como si Maya estuviera enfrente.' },
            { kind: 'line', clock: '21:25', text_es: 'Subiendo las gradas, le sostenés la puerta a otro huésped.' },
            { kind: 'type', clock: '21:25', who: 'leo', say: 'Oh, thank you!', ask_es: 'Te agradece. Escribí lo que se contesta.',
              accept: ['you\'re welcome', 'you are welcome'], explain_es: 'A thank you se contesta You\'re welcome ("con gusto").' }
          ]
        },
        {
          id: 'B1-U01-S4',
          stage: 'Reto',
          title: 'The mix-up',
          title_es: 'La confusión',
          skills: ['listening', 'reading', 'writing'],
          goal_es: 'Resolver un problema real usando todo lo de la unidad, sin pistas.',
          why_es: 'Todo junto y sin apoyos: así se ve si ya te sale solo.',
          noHints: true,
          steps: [
            { kind: 'line', clock: '08:00', text_es: 'Mañana siguiente, 8:00. Mrs. Park tiene una maleta con una etiqueta mal escrita y no sabe de quién es.' },
            { kind: 'choice', clock: '08:00', who: 'park', say: 'Excuse me. Are you {name}?', ask_es: 'Contestale como corresponde.',
              options: [
                { t: 'Yes, I am. Good morning, Mrs. Park.', ok: true },
                { t: 'Yes, I\'m fine, thank you.', why_es: 'Eso contesta How are you? Ella preguntó si sos vos.' },
                { t: 'Good evening, Mrs. Park.', why_es: 'Son las 8 de la mañana, y no contestaste la pregunta.' }
              ], explain_es: 'Are you...? se contesta Yes, I am o No, I\'m not.' },
            { kind: 'spell', clock: '08:01', who: 'park', say: 'This bag says B-E-G-A. But the name on my list is...', word: 'VEGA', ask_es: 'Escribí el apellido correcto.' },
            { kind: 'build', clock: '08:02', who: 'park', say: 'Vega... Who is that?', ask_es: 'Es Leo, tu compañero de cuarto (roommate). Presentalo.',
              answer: ['This', 'is', 'my', 'roommate', 'Leo'], extra: ['are', 'name'], explain_es: 'Para presentar a alguien: This is + quién es + nombre.' },
            { kind: 'type', clock: '08:03', who: 'park', say: 'Nice to meet you, Leo. And thank you for your help, {name}.', ask_es: 'Ella te agradece. Escribí tu respuesta.',
              accept: ['you\'re welcome', 'you are welcome', 'you\'re welcome mrs park', 'you are welcome mrs park'], explain_es: 'You\'re welcome. Con Mrs. Park podés agregar su nombre.' },
            { kind: 'type', clock: '08:04', who: 'park', say: 'Have a good day!', ask_es: 'Se despide de mañana. Despedite vos también, con una frase de la unidad.',
              accept: ['goodbye', 'good bye', 'bye', 'bye bye', 'see you', 'see you later', 'see you tomorrow', 'goodbye mrs park', 'bye mrs park', 'see you mrs park', 'see you later mrs park', 'thank you goodbye', 'thank you bye', 'thank you see you', 'thank you see you later', 'thank you you too', 'you too', 'thanks you too', 'you too goodbye', 'you too bye'],
              explain_es: 'Para despedirse de día: Goodbye, Bye o See you later. Good night solo de noche.' }
          ]
        }
      ]
    }
  ]
};
