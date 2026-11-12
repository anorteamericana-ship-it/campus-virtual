/* Northbound · Aventura 002 · "Un recuerdo de North City".
 * Solo datos: usa los mismos motores que la aventura 001 (choice, pick, build, spell, type, say, line).
 * Fuente curricular: src/syllabus.jsx · Básico I · Unit 2, lecciones 3 y 4
 *   L3: nombrar objetos y posesiones con adjetivos posesivos · L4: pronombres posesivos ("Is this your book? Yes, it's mine").
 * Repaso de la Unidad 1: saludos según la hora, deletrear el nombre, cortesía.
 * Contenido original. Estado: BORRADOR IA, sin revisión docente.
 * Cargar después de lab2_content.js.
 */
(function () {
  'use strict';
  var base = window.LAB2_CONTENT;
  if (!base) throw new Error('Northbound: falta lab2_content.js');
  var ep = {
    id: 'ADV002-SOUVENIR-B1', level: 'B1', unit: 2, number: 2,
    title: 'A Souvenir from North City', title_es: 'Un recuerdo de North City',
    place: 'City Gifts · North City', status: 'BORRADOR IA',
    syllabus: {
      source: 'src/syllabus.jsx · Básico I · Unit 2, L3–L4; repaso de Unit 1',
      objectives: [
        'U2: nombrar objetos con this/these y a/an.',
        'U2: decir de quién es algo con my, your, his, her y con mine.',
        'Repaso U1: saludar por la tarde, deletrear tu nombre, agradecer y despedirte.'
      ]
    },
    story_es: 'Sábado, 3:30 de la tarde. Querés mandarle un recuerdo a tu familia y entrás a City Gifts. Adentro hay más de una cosa sin dueño, y alguien que ya conocés.',
    cast: [
      { id: 'okafor', name: 'Mr. Okafor', role: 'dueño de City Gifts', tone: 'amber' },
      { id: 'sam', name: 'Sam', role: 'tu conocido de North Coffee', tone: 'teal' }
    ],
    scenes: [
      {
        id: 'ADV002-S1', stage: 'Escena 1 · Mirar', title: 'What\'s this?', title_es: '¿Qué es esto?',
        skills: ['listening', 'reading'],
        goal_es: 'Nombrar lo que hay en la tienda: uno o varios, con a o con an (B1/U2).',
        why_es: 'Mr. Okafor te va enseñando la tienda. Primero reconocés.',
        steps: [
          { kind: 'line', clock: '15:30', text_es: 'Sábado, 3:30 de la tarde. Empujás la puerta de City Gifts y suena una campanilla. Detrás del mostrador hay un señor de anteojos.' },
          { kind: 'choice', clock: '15:30', who: 'okafor', listen: true, say: 'Good afternoon! Welcome to City Gifts.', ask_es: '¿Cómo lo saludás a esta hora?',
            options: [
              { t: 'Good afternoon!', ok: true },
              { t: 'Good morning!', react: 'Morning? It\'s half past three!', why_es: 'Good morning es antes del mediodía. Son las 3:30 de la tarde.' },
              { t: 'Good night!', react: 'Not yet! We close at six.', why_es: 'Good night es para despedirse de noche, no para saludar.' }
            ], then: 'Take a look around. This is a mug. And this is a keychain.', explain_es: 'Después del mediodía y hasta que oscurece: Good afternoon.' },
          { kind: 'line', clock: '15:31', text_es: 'Mr. Okafor levanta un llavero pequeño con forma de faro y te mira, esperando.' },
          { kind: 'choice', clock: '15:31', who: 'okafor', say: 'What\'s this?', ask_es: 'Es un solo llavero.',
            options: [
              { t: 'It\'s a keychain.', ok: true },
              { t: 'It\'s a mug.', react: 'A mug? You can\'t drink from this!', why_es: 'Mug es la taza. El llavero es keychain.' },
              { t: 'They\'re keychains.', react: 'Just one! One keychain.', why_es: 'They\'re es para varios. Aquí hay uno solo: It\'s a...' }
            ], then: 'That\'s right. A keychain.', explain_es: 'Una sola cosa: What\'s this? — It\'s a + objeto.' },
          { kind: 'line', clock: '15:32', text_es: 'Ahora abre un abanico de cinco postales de la ciudad.' },
          { kind: 'choice', clock: '15:32', who: 'okafor', say: 'And what are these?', ask_es: 'Son varias postales.',
            options: [
              { t: 'They\'re postcards.', ok: true },
              { t: 'It\'s a postcard.', react: 'One? I have five here!', why_es: 'It\'s a es para una sola. Son varias: They\'re + plural.' },
              { t: 'This is postcards.', react: 'Hmm... These are postcards.', why_es: 'This es para una cosa. Con varias se usa these, o They\'re.' }
            ], then: 'Yes! Postcards of North City.', explain_es: 'Varias cosas: What are these? — They\'re + objeto en plural.' },
          { kind: 'line', clock: '15:33', text_es: 'Junto a la puerta hay un paraguas azul. Lo señala.' },
          { kind: 'choice', clock: '15:33', who: 'okafor', say: 'And this? What\'s this?', ask_es: 'Umbrella empieza con sonido de vocal.',
            options: [
              { t: 'It\'s an umbrella.', ok: true },
              { t: 'It\'s a umbrella.', react: 'Almost! Listen: AN umbrella.', why_es: 'Antes de un sonido de vocal se usa an: an umbrella, an apple.' },
              { t: 'They\'re umbrellas.', react: 'Only one umbrella, I\'m afraid.', why_es: 'Hay un solo paraguas: It\'s an...' }
            ], then: 'Good! You need it in North City.', explain_es: 'A antes de consonante (a mug), an antes de vocal (an umbrella).' },
          { kind: 'pick', clock: '15:34', who: 'okafor', flag: 'gift', say: 'So, what would you like? A mug, a postcard or a keychain?',
            ask_es: 'Elegí tu recuerdo. No hay respuesta incorrecta: te lo llevás al final.',
            options: [
              { t: 'A mug, please.', value: 'mug', then: 'A mug. Good choice!' },
              { t: 'A postcard, please.', value: 'postcard', then: 'A postcard. Good choice!' },
              { t: 'A keychain, please.', value: 'keychain', then: 'A keychain. Good choice!' }
            ], explain_es: 'Para pedir algo en una tienda basta el objeto y please.' }
        ]
      },
      {
        id: 'ADV002-S2', stage: 'Escena 2 · De quién es', title: 'Is this your phone?', title_es: '¿Es tuyo este teléfono?',
        skills: ['reading', 'writing'],
        goal_es: 'Decir de quién es un objeto con my, your y his (B1/U2).',
        why_es: 'Hay un teléfono olvidado en el mostrador y entra alguien conocido. Ahora armás las frases vos.',
        steps: [
          { kind: 'line', clock: '15:40', text_es: 'Suena la campanilla otra vez. Es Sam, el de la cafetería. En el mostrador hay un teléfono que no es tuyo.' },
          { kind: 'choice', clock: '15:40', who: 'sam', say: 'Hey, {name}! Good to see you again! One {drink} on Monday?', ask_es: 'Ya se conocen: se vieron en North Coffee.',
            options: [
              { t: 'Hi, Sam! Good to see you, too.', ok: true },
              { t: 'Nice to meet you.', react: 'We met at the café, remember?', why_es: 'Nice to meet you es solo para la primera vez. A alguien que ya conocés: Good to see you.' },
              { t: 'Good morning, Sam.', react: 'It\'s the afternoon, my friend!', why_es: 'Son las 3:40 de la tarde.' }
            ], then: 'I\'m looking for a gift for my mom.', explain_es: 'Good to see you (again) se dice al reencontrarse con alguien.' },
          { kind: 'build', clock: '15:41', who: 'okafor', say: 'Excuse me. Is this your phone?', ask_es: 'No es tuyo. Armá la respuesta.',
            answer: ['No', 'it\'s', 'not', 'my', 'phone'], extra: ['your', 'are'], then: 'Hmm. Whose phone is it?', explain_es: 'It\'s not my phone: my = mío, de quien habla.' },
          { kind: 'line', clock: '15:42', text_es: 'Sam se toca los bolsillos, cada vez más rápido.' },
          { kind: 'choice', clock: '15:42', who: 'sam', say: 'Oh no. Where\'s my phone?', ask_es: 'Preguntale si el del mostrador es el suyo.',
            options: [
              { t: 'Sam, is this your phone?', ok: true },
              { t: 'Sam, is this my phone?', react: 'Your phone? I don\'t know! Is it?', why_es: 'My es de quien habla. Le estás preguntando a Sam por el de él: your.' },
              { t: 'Sam, this is her phone.', react: 'Her phone? Whose?', why_es: 'Her es de ella. Le hablás a Sam directamente: your.' }
            ], then: 'Yes! It\'s my phone. Thank you!', explain_es: 'Your = de la persona con quien hablás.' },
          { kind: 'build', clock: '15:43', who: 'okafor', say: 'So it\'s Sam\'s phone?', ask_es: 'Contale a Mr. Okafor de quién es. Sam es hombre.',
            answer: ['Yes', 'it\'s', 'his', 'phone'], extra: ['her', 'my'], then: 'Good. Mystery solved.', explain_es: 'His = de él. Her = de ella.' },
          { kind: 'spell', clock: '15:44', who: 'okafor', say: 'And your name, for the receipt? How do you spell it?', own: true, ask_es: 'Deletreá tu nombre para el recibo, como en la cafetería.' }
        ]
      },
      {
        id: 'ADV002-S3', stage: 'Escena 3 · Reto', title: 'It\'s mine!', title_es: '¡Es mío!',
        skills: ['reading', 'writing', 'speaking'],
        goal_es: 'Resolver de quién son unas llaves, pagar y despedirte, sin pistas (B1/U2 con repaso de U1).',
        why_es: 'Todo junto: objetos, de quién son, y las frases de cortesía que ya sabés.',
        noHints: true,
        steps: [
          { kind: 'line', clock: '15:50', text_es: 'Mr. Okafor encuentra unas llaves junto a la caja. El llavero dice SAM.' },
          { kind: 'choice', clock: '15:50', who: 'okafor', say: 'And these keys? Are these your keys?', ask_es: 'Son varias llaves y son de Sam.',
            options: [
              { t: 'No, they\'re Sam\'s keys.', ok: true },
              { t: 'No, it\'s Sam\'s keys.', react: 'It? There are three keys here!', why_es: 'Son varias llaves: They\'re, no It\'s.' },
              { t: 'Yes, they\'re my keys.', react: 'Really? Then why does it say SAM?', why_es: 'No son tuyas: el llavero dice Sam.' }
            ], then: 'Sam! Are these yours?', explain_es: 'Sam\'s keys = las llaves de Sam. Con varias cosas: They\'re.' },
          { kind: 'choice', clock: '15:51', who: 'sam', say: 'My keys! Yes, they\'re mine!', ask_es: 'Mine significa "mías". ¿Qué le decís al dárselas?',
            options: [
              { t: 'Here you are.', ok: true },
              { t: 'They\'re mine.', react: 'Hey! No, they\'re mine!', why_es: 'Mine es de quien habla. Las llaves son de Sam.' },
              { t: 'Thank you.', react: 'No, no. Thank YOU!', why_es: 'Vos le estás dando algo: Here you are. Él da las gracias.' }
            ], then: 'Thank you, {name}! First my phone, now my keys.', explain_es: 'Here you are se dice al entregarle algo a alguien.' },
          { kind: 'type', clock: '15:52', who: 'sam', say: 'Thank you so much!', ask_es: 'Te agradece. Escribí lo que se contesta.',
            accept: ['you\'re welcome', 'you are welcome'], explain_es: 'A thank you se contesta You\'re welcome.' },
          { kind: 'choice', clock: '15:53', who: 'okafor', say: 'Here\'s your {gift}. Is this your bag, too?', ask_es: 'La bolsa sí es tuya. Contestá con la palabra nueva.',
            options: [
              { t: 'Yes, it\'s mine. Thank you.', ok: true },
              { t: 'Yes, it\'s yours. Thank you.', react: 'Mine? No, I don\'t think so!', why_es: 'Yours = tuya (de él). La bolsa es tuya: mine.' },
              { t: 'Yes, they\'re mine.', react: 'They? It\'s just one bag.', why_es: 'Es una sola bolsa: it\'s.' }
            ], then: 'You\'re welcome!', explain_es: 'It\'s mine = es mío. Es lo mismo que It\'s my bag, más corto.' },
          { kind: 'say', clock: '15:54', who: 'okafor', say: 'Have a nice afternoon!', phrase: 'Thank you! Goodbye!', ask_es: 'Despedite en voz alta.' },
          { kind: 'line', clock: '15:55', text_es: 'Salís de City Gifts con tu recuerdo. Sam sale detrás, con su teléfono y sus llaves: «See you Monday at the café!».' }
        ]
      }
    ]
  };
  window.LAB2_CONTENT = Object.assign({}, base, {
    version: 'adventure-002.0.1', weekly: true, weeklyId: ep.id,
    stops: { B1: [{ unit: 2, topic: 'Aventura · Un recuerdo en City Gifts', episode: ep.id }], B2: [], I1: [], I2: [] },
    episodes: [ep]
  });
})();
