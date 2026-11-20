/* EXAM PREP LAB · Banco de demostración v1
 * 36 ítems ORIGINALES escritos por IA (Claude) para Academia Norteamericana.
 * Estado editorial: DRAFT (BORRADOR IA). Ningún ítem ha sido revisado por una docente.
 * No contiene preguntas, audios ni imágenes de ETS ni de terceros.
 * Audio: voces sintéticas Kokoro-82M (Apache-2.0) generadas localmente; ver make_audio.py.
 *
 * Categorías de error (solo se asignan cuando el distractor tiene un motivo identificable):
 *   GRAMATICA · VOCABULARIO · INFERENCIA · INFO_EXPLICITA · CONFUSION_AUDITIVA · DISTRACTOR · TIEMPO
 * Las opciones tienen id estable (a,b,c,d). La letra visible (A–D) se asigna al mostrar.
 * Partes 1 y 2: las opciones se dicen en el audio con su letra; NUNCA se barajan ni se muestran antes de responder.
 */
window.EPL_BANK = {
  bank_id: 'EPL-DEMO',
  version: '1.0.0-draft',
  created_at: '2026-11-19',
  exam_profile: 'TOEIC_LR_LINEAR_2H',
  voices: {
    US_F: { engine: 'kokoro', voice: 'af_heart', lang: 'en-us', label: 'Mujer · EE. UU.' },
    US_M: { engine: 'kokoro', voice: 'am_michael', lang: 'en-us', label: 'Hombre · EE. UU.' },
    UK_F: { engine: 'kokoro', voice: 'bf_emma', lang: 'en-gb', label: 'Mujer · Reino Unido' },
    UK_M: { engine: 'kokoro', voice: 'bm_george', lang: 'en-gb', label: 'Hombre · Reino Unido' },
    NARR: { engine: 'kokoro', voice: 'am_adam', lang: 'en-us', label: 'Narrador' }
  },
  common: {
    source_type: 'ORIGINAL_IA',
    source_url: null,
    license: 'Contenido propio de Academia Norteamericana (borrador). Uso interno.',
    attribution: 'Academia Norteamericana · Exam Prep Lab',
    author: 'Claude (IA)',
    reviewer: null,
    review_status: 'DRAFT',
    version: 1,
    created_at: '2026-11-19',
    updated_at: '2026-11-19'
  },

  /* Conjuntos (Partes 3, 4, 6 y 7). Los ítems referencian passage_group_id. */
  groups: [
    {
      passage_group_id: 'G-P3-01', part: 3, topic: 'pedidos y entregas', audio_asset: 'audio/G-P3-01.mp3',
      intro: 'Listen to the following conversation.',
      script: [
        { v: 'US_F', t: "Hi, this is Karen from Brightline Dental. We ordered twenty boxes of printer paper from your store last week, but we've only received ten." },
        { v: 'UK_M', t: "I'm sorry about that. Let me check your order. It looks like the other ten boxes were sent to our warehouse by mistake." },
        { v: 'US_F', t: "We really need the paper by Friday. We're printing reminder letters for our patients' appointments next month." },
        { v: 'UK_M', t: "Of course. I'll have the boxes delivered to your office tomorrow morning, and I'll take fifteen percent off your next order for the inconvenience." }
      ],
      item_ids: ['P3-01', 'P3-02', 'P3-03'],
      vocabulary: [['warehouse', 'bodega, almacén'], ['by mistake', 'por error'], ['inconvenience', 'molestia, inconveniente'], ['take X percent off', 'descontar X por ciento']]
    },
    {
      passage_group_id: 'G-P3-02', part: 3, topic: 'reuniones y salas', audio_asset: 'audio/G-P3-02.mp3',
      intro: 'Listen to the following conversation. Then look at the schedule.',
      graphic: {
        title: 'Wednesday afternoon — Room availability',
        columns: ['Room', 'Seats', 'Available'],
        rows: [['Room A', '12', 'Booked 1:00–5:00'], ['Room 3B', '4', '2:00–4:00'], ['Garden Room', '10', '3:30–5:00']]
      },
      script: [
        { v: 'US_M', t: "Emma, the clients from Hartwell Foods want to move our meeting to Wednesday afternoon. Is a conference room free then?" },
        { v: 'UK_F', t: "Let me look. Room A is booked all afternoon, but the small room on the third floor is free from two to four." },
        { v: 'US_M', t: "Hmm. They're bringing six people." },
        { v: 'UK_F', t: "Well, the Garden Room has space for ten, and it's available after three thirty." },
        { v: 'US_M', t: "That works. I'll reserve it for the start of that time and let the clients know." }
      ],
      item_ids: ['P3-04', 'P3-05', 'P3-06'],
      vocabulary: [['booked', 'reservado, ocupado'], ['seats (verbo)', 'tiene capacidad para'], ['reserve', 'reservar']]
    },
    {
      passage_group_id: 'G-P4-01', part: 4, topic: 'transporte · anuncio', audio_asset: 'audio/G-P4-01.mp3',
      intro: 'Listen to the following announcement.',
      script: [
        { v: 'UK_F', t: "Attention, passengers travelling to Riverside on the five-fifteen express. Because of maintenance work on the tracks near Millbrook, this train will depart from Platform Seven instead of Platform Two. The departure time has not changed. Passengers who need help with their luggage may ask any staff member wearing a green jacket. We would also like to remind you that the café on the upper level will close early today, at six o'clock. Thank you for your patience." }
      ],
      item_ids: ['P4-01', 'P4-02', 'P4-03'],
      vocabulary: [['maintenance work', 'trabajos de mantenimiento'], ['depart', 'salir, partir'], ['instead of', 'en lugar de'], ['luggage', 'equipaje']]
    },
    {
      passage_group_id: 'G-P4-02', part: 4, topic: 'oficina · mensaje de voz', audio_asset: 'audio/G-P4-02.mp3',
      intro: 'Listen to the following telephone message.',
      script: [
        { v: 'US_M', t: "Hi Daniel, it's Mark Stevens from the marketing department. I'm calling about the brochure for our new line of kitchen appliances. I looked at the draft you sent this morning, and the photos look great. However, the prices on page three are from last year's catalog. Could you update them using the spreadsheet I e-mailed you? The printer needs the final file by Monday at noon. I know that doesn't give you much time. If you have any questions, I'll be at my desk until five today." }
      ],
      item_ids: ['P4-04', 'P4-05', 'P4-06'],
      vocabulary: [['brochure', 'folleto'], ['draft', 'borrador'], ['appliances', 'electrodomésticos'], ['update', 'actualizar']]
    },
    {
      passage_group_id: 'G-P6-01', part: 6, topic: 'avisos internos',
      intro: 'Read the following e-mail.',
      passage: {
        kind: 'email',
        header: [['To', 'All staff'], ['From', 'Facilities Office'], ['Subject', 'Parking lot repairs']],
        body: [
          'Beginning Monday, June 3, the north parking lot will be closed for resurfacing. The work is expected to take about two weeks. [[1]]',
          'During this period, employees may park in the south lot or at the Greenway Garage on Elm Street. The garage is [[2]] a ten-minute walk from our building. Parking there is free for staff; simply show your employee badge at the entrance.',
          '[[3]], a shuttle will run between the garage and the main entrance every fifteen minutes from 7:00 to 9:30 A.M. We apologize for any [[4]] this may cause.'
        ]
      },
      item_ids: ['P6-01', 'P6-02', 'P6-03', 'P6-04'],
      vocabulary: [['resurfacing', 'repavimentación'], ['badge', 'gafete, carné'], ['shuttle', 'buseta de traslado']]
    },
    {
      passage_group_id: 'G-P7-01', part: 7, topic: 'anuncios comunitarios',
      intro: 'Read the following advertisement.',
      passage: {
        kind: 'notice',
        title: 'Lakeside Community Center — Spring Computer Classes',
        body: [
          'Lakeside Community Center is offering free computer classes for adults this spring. Classes meet on Tuesday and Thursday evenings from 6:00 to 7:30 P.M. in Room 12.',
          'Beginner Level (April 2 – April 25): Learn how to use e-mail, create documents, and search the Internet safely.',
          'Intermediate Level (May 7 – May 30): Learn how to build spreadsheets and prepare simple presentations.',
          'Each class is limited to 15 participants. To register, visit the front desk or call 555-0148 by March 28. Laptops are provided by the center, but participants must bring their own USB drive.'
        ]
      },
      item_ids: ['P7-01', 'P7-02', 'P7-03'],
      vocabulary: [['register', 'inscribirse'], ['provided', 'proporcionado'], ['limited to', 'limitado a']]
    },
    {
      passage_group_id: 'G-P7-02', part: 7, topic: 'hoteles y eventos (textos múltiples)',
      intro: 'Read the following Web page and e-mail.',
      passages: [
        {
          kind: 'table',
          title: 'Pinecrest Hotel — Meeting Room Rates',
          columns: ['Room', 'Capacity', 'Half day', 'Full day'],
          rows: [['Cedar Room', '20', '$150', '$250'], ['Maple Room', '40', '$250', '$400'], ['Grand Hall', '120', '$600', '$1,000']],
          notes: [
            'All prices include a projector and Wi-Fi.',
            'Catering is available for groups of 25 or more.',
            'Bookings changed less than 7 days before the event are charged a $50 fee.'
          ]
        },
        {
          kind: 'email',
          header: [['To', 'events@pinecresthotel.com'], ['From', 'Olivia Grant, Norvale Engineering'], ['Date', 'September 12'], ['Subject', 'Booking #4471']],
          body: [
            'Dear events team,',
            'We have reserved the Cedar Room for a full-day workshop on September 16. However, the number of participants has grown from 18 to 32, so we will need a larger room. Could you move our booking to a room that can hold this group? We would also like lunch to be served to all participants.',
            'Please let me know the new total cost.',
            'Best regards,\nOlivia Grant\nTraining Coordinator'
          ]
        }
      ],
      item_ids: ['P7-04', 'P7-05', 'P7-06', 'P7-07', 'P7-08'],
      vocabulary: [['rates', 'tarifas'], ['catering', 'servicio de comida'], ['grown', 'aumentado (en este contexto)'], ['fee', 'cargo, cobro']]
    }
  ],

  items: [
    /* ───────── PARTE 1 · Photographs ───────── */
    {
      item_id: 'P1-01', part: 1, skill: 'listening', difficulty: 1, topic: 'exteriores sin personas',
      image_asset: 'img/P1-01.svg', image_alt: 'Fotografía de práctica 1 (descripción disponible después de responder).',
      image_desc_after: 'Varias bicicletas estacionadas en fila en un soporte, junto a la entrada de un edificio, con una banca y árboles. No hay personas.',
      audio_asset: 'audio/P1-01.mp3', shuffle: false,
      script: [
        { v: 'NARR', t: 'Look at the picture.' },
        { v: 'US_F', t: 'A. Some bicycles are being repaired.' }, { gap: 0.6 },
        { v: 'US_F', t: 'B. Several bicycles are parked in a row.' }, { gap: 0.6 },
        { v: 'US_F', t: 'C. A cyclist is riding along the path.' }, { gap: 0.6 },
        { v: 'US_F', t: 'D. The bicycles have been loaded onto a truck.' }, { gap: 5 }
      ],
      options: [
        { id: 'a', text: 'Some bicycles are being repaired.' },
        { id: 'b', text: 'Several bicycles are parked in a row.' },
        { id: 'c', text: 'A cyclist is riding along the path.' },
        { id: 'd', text: 'The bicycles have been loaded onto a truck.' }
      ],
      correct: 'b',
      explanation: 'La foto muestra bicicletas quietas, una al lado de la otra: “parked in a row” lo describe exactamente.',
      distractors: {
        a: { cat: 'DISTRACTOR', why: '“are being repaired” (pasiva en progreso) exige que alguien las esté reparando en ese momento. No hay personas en la foto.' },
        c: { cat: 'DISTRACTOR', why: 'Menciona a un ciclista. En la foto no hay nadie; la palabra “cyclist” se parece a “bicycles” para atraerte.' },
        d: { cat: 'INFERENCIA', why: 'No se ve ningún camión. Es una suposición que la imagen no respalda.' }
      },
      confusion: [['being repaired', 'Pasiva en progreso: solo es correcta si se ve la acción ocurriendo.'], ['parked / park', '“parked” = estacionado; “park” también puede ser parque.']],
      strategy: 'En la Parte 1, antes de oír las opciones, preguntate: ¿hay personas? ¿qué están haciendo? ¿qué objetos y en qué posición? Descartá toda opción con personas o acciones que no se ven.'
    },
    {
      item_id: 'P1-02', part: 1, skill: 'listening', difficulty: 2, topic: 'bodega con una persona',
      image_asset: 'img/P1-02.svg', image_alt: 'Fotografía de práctica 2 (descripción disponible después de responder).',
      image_desc_after: 'Un hombre con chaleco coloca una caja sobre un carrito de carga en una bodega. Detrás hay estantes con cajas.',
      audio_asset: 'audio/P1-02.mp3', shuffle: false,
      script: [
        { v: 'NARR', t: 'Look at the picture.' },
        { v: 'UK_M', t: "A. He's opening a box with a knife." }, { gap: 0.6 },
        { v: 'UK_M', t: "B. He's placing a box on a cart." }, { gap: 0.6 },
        { v: 'UK_M', t: "C. He's stacking chairs in a corner." }, { gap: 0.6 },
        { v: 'UK_M', t: 'D. Some shelves are being installed.' }, { gap: 5 }
      ],
      options: [
        { id: 'a', text: "He's opening a box with a knife." },
        { id: 'b', text: "He's placing a box on a cart." },
        { id: 'c', text: "He's stacking chairs in a corner." },
        { id: 'd', text: 'Some shelves are being installed.' }
      ],
      correct: 'b',
      explanation: 'El hombre sostiene una caja y la está poniendo sobre el carrito: “placing a box on a cart”.',
      distractors: {
        a: { cat: 'DISTRACTOR', why: 'Usa el objeto correcto (box) con una acción equivocada (opening with a knife).' },
        c: { cat: 'CONFUSION_AUDITIVA', why: '“stacking” suena a una acción de bodega, pero los objetos son sillas y no aparecen.' },
        d: { cat: 'DISTRACTOR', why: 'Los estantes ya están instalados; nadie los está instalando.' }
      },
      confusion: [['placing', 'colocar, poner'], ['cart', 'carrito'], ['stacking', 'apilar']],
      strategy: 'Cuando hay una persona, el verbo principal casi siempre decide la respuesta. Escuchá el verbo antes que el objeto.'
    },

    /* ───────── PARTE 2 · Question–Response ───────── */
    {
      item_id: 'P2-01', part: 2, skill: 'listening', difficulty: 1, topic: 'oficina',
      audio_asset: 'audio/P2-01.mp3', shuffle: false,
      script: [
        { v: 'US_F', t: 'When does the new printer arrive?' }, { gap: 0.6 },
        { v: 'UK_M', t: 'A. It prints in color.' }, { gap: 0.5 },
        { v: 'UK_M', t: 'B. On Thursday morning, I think.' }, { gap: 0.5 },
        { v: 'UK_M', t: 'C. Yes, it arrived.' }, { gap: 5 }
      ],
      options: [{ id: 'a', text: 'It prints in color.' }, { id: 'b', text: 'On Thursday morning, I think.' }, { id: 'c', text: 'Yes, it arrived.' }],
      correct: 'b',
      explanation: '“When” pide un momento. “On Thursday morning” es la única opción que da tiempo.',
      distractors: {
        a: { cat: 'CONFUSION_AUDITIVA', why: '“prints” repite el sonido de “printer” pero no responde cuándo.' },
        c: { cat: 'DISTRACTOR', why: 'Una pregunta con “When” no se responde con Yes/No. Además cambia el tiempo verbal (arrived).' }
      },
      confusion: [['printer / prints', 'Palabra repetida o parecida = trampa frecuente en la Parte 2.']],
      strategy: 'Fijate en la primera palabra (When, Who, Where, Why, How). Si una opción repite una palabra de la pregunta, desconfiá.'
    },
    {
      item_id: 'P2-02', part: 2, skill: 'listening', difficulty: 1, topic: 'capacitación',
      audio_asset: 'audio/P2-02.mp3', shuffle: false,
      script: [
        { v: 'UK_M', t: "Who's leading the training session this afternoon?" }, { gap: 0.6 },
        { v: 'US_F', t: 'A. In Conference Room B.' }, { gap: 0.5 },
        { v: 'US_F', t: 'B. Ms. Patel from Human Resources.', say: 'B. Mizz Patel from Human Resources.' }, { gap: 0.5 },
        { v: 'US_F', t: 'C. It was very helpful.' }, { gap: 5 }
      ],
      options: [{ id: 'a', text: 'In Conference Room B.' }, { id: 'b', text: 'Ms. Patel from Human Resources.' }, { id: 'c', text: 'It was very helpful.' }],
      correct: 'b',
      explanation: '“Who” pide una persona: “Ms. Patel”.',
      distractors: {
        a: { cat: 'DISTRACTOR', why: 'Responde dónde (Where), no quién.' },
        c: { cat: 'GRAMATICA', why: 'Habla en pasado de una sesión que todavía no ocurre (this afternoon).' }
      },
      confusion: [["Who's", 'contracción de Who is'], ['leading', 'dirigir, impartir']],
      strategy: 'Una respuesta correcta puede no tener ninguna palabra de la pregunta. Juzgá el tipo de información, no las palabras.'
    },
    {
      item_id: 'P2-03', part: 2, skill: 'listening', difficulty: 2, topic: 'documentos',
      audio_asset: 'audio/P2-03.mp3', shuffle: false,
      script: [
        { v: 'US_F', t: 'Would you like me to e-mail you the report, or will you pick it up?' }, { gap: 0.6 },
        { v: 'US_M', t: 'A. Please send it to me.' }, { gap: 0.5 },
        { v: 'US_M', t: "B. Yes, I'd like that." }, { gap: 0.5 },
        { v: 'US_M', t: 'C. The report was finished yesterday.' }, { gap: 5 }
      ],
      options: [{ id: 'a', text: 'Please send it to me.' }, { id: 'b', text: "Yes, I'd like that." }, { id: 'c', text: 'The report was finished yesterday.' }],
      correct: 'a',
      explanation: 'Es una pregunta de elección (A o B). “Please send it to me” elige la primera opción: que se lo envíen.',
      distractors: {
        b: { cat: 'DISTRACTOR', why: 'Ante “¿A o B?”, un “Yes” no elige nada.' },
        c: { cat: 'CONFUSION_AUDITIVA', why: 'Repite “report”, pero no dice cómo quiere recibirlo.' }
      },
      confusion: [['pick it up', 'recogerlo']],
      strategy: 'Si la pregunta tiene “or”, la respuesta suele elegir una opción, proponer otra o decir que da igual.'
    },
    {
      item_id: 'P2-04', part: 2, skill: 'listening', difficulty: 3, topic: 'comercios',
      audio_asset: 'audio/P2-04.mp3', shuffle: false,
      script: [
        { v: 'UK_F', t: "Isn't the pharmacy open on Sundays?" }, { gap: 0.6 },
        { v: 'US_M', t: 'A. Only until two in the afternoon.' }, { gap: 0.5 },
        { v: 'US_M', t: 'B. I opened a new account.' }, { gap: 0.5 },
        { v: 'US_M', t: 'C. On the second floor.' }, { gap: 5 }
      ],
      options: [{ id: 'a', text: 'Only until two in the afternoon.' }, { id: 'b', text: 'I opened a new account.' }, { id: 'c', text: 'On the second floor.' }],
      correct: 'a',
      explanation: 'Respuesta indirecta: no dice “sí”, pero confirma que abre el domingo y agrega un límite de horario.',
      distractors: {
        b: { cat: 'CONFUSION_AUDITIVA', why: '“opened” imita a “open” con otro significado (abrir una cuenta).' },
        c: { cat: 'DISTRACTOR', why: 'Responde dónde queda, no si abre.' }
      },
      confusion: [["Isn't ... open?", 'Pregunta negativa: se responde igual que “Is it open?”.']],
      strategy: 'Las respuestas correctas de nivel alto son indirectas. Preguntate: ¿esta frase tendría sentido en una conversación real?'
    },

    /* ───────── PARTE 3 · Conversations ───────── */
    { item_id: 'P3-01', part: 3, skill: 'listening', difficulty: 1, topic: 'pedidos', passage_group_id: 'G-P3-01',
      stem: 'What problem does the woman mention?',
      options: [{ id: 'a', text: 'An order is incomplete.' }, { id: 'b', text: 'A bill is incorrect.' }, { id: 'c', text: 'A product is damaged.' }, { id: 'd', text: 'A price has increased.' }],
      correct: 'a', explanation: 'Pidió 20 cajas y solo recibió 10: el pedido está incompleto.',
      distractors: { b: { cat: 'INFERENCIA', why: 'Nunca se habla de una factura.' }, c: { cat: 'INFO_EXPLICITA', why: 'No se menciona daño; las cajas que llegaron están bien.' }, d: { cat: 'INFERENCIA', why: 'No se menciona ningún aumento de precio.' } },
      strategy: 'Leé las preguntas ANTES de que empiece el audio. La primera pregunta casi siempre se responde al inicio.' },
    { item_id: 'P3-02', part: 3, skill: 'listening', difficulty: 2, topic: 'pedidos', passage_group_id: 'G-P3-01',
      stem: 'Why does the woman need the paper by Friday?',
      options: [{ id: 'a', text: 'To print letters for patients' }, { id: 'b', text: 'To prepare for an inspection' }, { id: 'c', text: 'To train new employees' }, { id: 'd', text: 'To send invoices to clients' }],
      correct: 'a', explanation: 'Dice que van a imprimir “reminder letters for our patients’ appointments”.',
      distractors: { b: { cat: 'INFERENCIA', why: 'No se menciona una inspección.' }, c: { cat: 'INFERENCIA', why: 'No se habla de empleados nuevos.' }, d: { cat: 'DISTRACTOR', why: '“invoices” es otro tipo de documento impreso; atrae porque se habla de papel.' } },
      strategy: 'Las respuestas parafrasean: “reminder letters” se convierte en “letters”.' },
    { item_id: 'P3-03', part: 3, skill: 'listening', difficulty: 2, topic: 'pedidos', passage_group_id: 'G-P3-01',
      stem: 'What does the man offer to do?',
      options: [{ id: 'a', text: 'Refund the full payment' }, { id: 'b', text: 'Give a discount on a future order' }, { id: 'c', text: 'Deliver the paper on Friday' }, { id: 'd', text: 'Call the warehouse manager' }],
      correct: 'b', explanation: '“I’ll take fifteen percent off your next order” = descuento en un pedido futuro.',
      distractors: { a: { cat: 'INFERENCIA', why: 'Ofrece un descuento, no un reembolso completo.' }, c: { cat: 'INFO_EXPLICITA', why: 'Promete entregar mañana en la mañana, no el viernes. El viernes es la fecha límite de ella.' }, d: { cat: 'DISTRACTOR', why: 'Menciona la bodega, pero no ofrece llamar a nadie.' } },
      strategy: '“What does the man offer…” se responde casi siempre al final, con “I’ll…” o “Let me…”.' },
    { item_id: 'P3-04', part: 3, skill: 'listening', difficulty: 1, topic: 'reuniones', passage_group_id: 'G-P3-02',
      stem: 'Why does the man need a conference room?',
      options: [{ id: 'a', text: 'To meet with clients' }, { id: 'b', text: 'To interview job applicants' }, { id: 'c', text: 'To hold a training session' }, { id: 'd', text: 'To celebrate a retirement' }],
      correct: 'a', explanation: 'Los clientes de Hartwell Foods quieren mover la reunión al miércoles.',
      distractors: { b: { cat: 'INFERENCIA', why: 'No hay candidatos ni entrevistas.' }, c: { cat: 'INFERENCIA', why: 'No se habla de capacitación.' }, d: { cat: 'INFERENCIA', why: 'No hay celebración.' } },
      strategy: 'La primera línea de la conversación suele dar el propósito.' },
    { item_id: 'P3-05', part: 3, skill: 'listening', difficulty: 3, topic: 'reuniones', passage_group_id: 'G-P3-02',
      stem: 'What does the man imply when he says, "They\'re bringing six people"?',
      options: [{ id: 'a', text: 'The room on the third floor is too small.' }, { id: 'b', text: 'He needs to order more food.' }, { id: 'c', text: 'The meeting should be postponed.' }, { id: 'd', text: 'He wants the woman to attend.' }],
      correct: 'a', explanation: 'Ella ofreció la sala pequeña del tercer piso (4 asientos). Él responde con el número de personas: no caben.',
      distractors: { b: { cat: 'INFERENCIA', why: 'No se habla de comida.' }, c: { cat: 'INFERENCIA', why: 'Siguen buscando sala; no proponen posponer.' }, d: { cat: 'INFERENCIA', why: 'No le pide a ella que asista.' } },
      strategy: 'En preguntas de intención, ubicá la frase y lo que se dijo JUSTO antes. La frase responde a eso.' },
    { item_id: 'P3-06', part: 3, skill: 'listening', difficulty: 3, topic: 'reuniones', passage_group_id: 'G-P3-02',
      stem: 'Look at the graphic. What time will the meeting most likely begin?',
      options: [{ id: 'a', text: '1:00' }, { id: 'b', text: '2:00' }, { id: 'c', text: '3:30' }, { id: 'd', text: '4:00' }],
      correct: 'c', explanation: 'Eligen el Garden Room, disponible desde las 3:30, y él la reserva para el inicio de ese horario.',
      distractors: { a: { cat: 'DISTRACTOR', why: '1:00 es cuando empieza la reserva de Room A, que está ocupada.' }, b: { cat: 'INFO_EXPLICITA', why: '2:00 corresponde a Room 3B, que descartaron por ser pequeña.' }, d: { cat: 'DISTRACTOR', why: '4:00 aparece en la tabla, pero es el cierre de Room 3B.' } },
      strategy: 'Con gráficos, el audio da un dato (la sala) y la tabla da la respuesta (la hora). Nunca está todo en un solo lado.' },

    /* ───────── PARTE 4 · Talks ───────── */
    { item_id: 'P4-01', part: 4, skill: 'listening', difficulty: 1, topic: 'transporte', passage_group_id: 'G-P4-01',
      stem: 'Why has a change been made?',
      options: [{ id: 'a', text: 'Because of track maintenance' }, { id: 'b', text: 'Because of bad weather' }, { id: 'c', text: 'Because of a staff shortage' }, { id: 'd', text: 'Because a train is delayed' }],
      correct: 'a', explanation: '“Because of maintenance work on the tracks” explica el cambio de andén.',
      distractors: { b: { cat: 'INFERENCIA', why: 'No se menciona el clima.' }, c: { cat: 'INFERENCIA', why: 'No se habla de falta de personal.' }, d: { cat: 'INFO_EXPLICITA', why: 'El anuncio dice que la hora de salida NO cambió.' } },
      strategy: 'Los anuncios dicen primero el qué y el porqué; después las instrucciones.' },
    { item_id: 'P4-02', part: 4, skill: 'listening', difficulty: 2, topic: 'transporte', passage_group_id: 'G-P4-01',
      stem: 'What are passengers who need help told to do?',
      options: [{ id: 'a', text: 'Call the information desk' }, { id: 'b', text: 'Speak to a staff member in a green jacket' }, { id: 'c', text: 'Go to Platform Two' }, { id: 'd', text: 'Visit the upper level' }],
      correct: 'b', explanation: 'Pueden pedir ayuda a cualquier funcionario con chaqueta verde.',
      distractors: { a: { cat: 'INFERENCIA', why: 'No se menciona un mostrador de información.' }, c: { cat: 'INFO_EXPLICITA', why: 'Platform Two es el andén ANTERIOR; el tren sale del Siete.' }, d: { cat: 'DISTRACTOR', why: 'El nivel superior se menciona por el café, no por la ayuda.' } } },
    { item_id: 'P4-03', part: 4, skill: 'listening', difficulty: 2, topic: 'transporte', passage_group_id: 'G-P4-01',
      stem: 'What does the speaker say about the café?',
      options: [{ id: 'a', text: 'It is offering discounts.' }, { id: 'b', text: 'It will close earlier than usual.' }, { id: 'c', text: 'It has moved to Platform Seven.' }, { id: 'd', text: 'It opens at six o\'clock.' }],
      correct: 'b', explanation: '“Will close early today, at six o’clock”.',
      distractors: { a: { cat: 'INFERENCIA', why: 'No hay descuentos.' }, c: { cat: 'DISTRACTOR', why: 'Mezcla dos datos del anuncio (café y andén Siete).' }, d: { cat: 'CONFUSION_AUDITIVA', why: 'Six o’clock es la hora de CIERRE, no de apertura.' } } },
    { item_id: 'P4-04', part: 4, skill: 'listening', difficulty: 1, topic: 'oficina', passage_group_id: 'G-P4-02',
      stem: 'What is the speaker mainly discussing?',
      options: [{ id: 'a', text: 'A product brochure' }, { id: 'b', text: 'A job interview' }, { id: 'c', text: 'A kitchen renovation' }, { id: 'd', text: 'A sales report' }],
      correct: 'a', explanation: 'Llama por el folleto (brochure) de la nueva línea de electrodomésticos.',
      distractors: { b: { cat: 'INFERENCIA', why: 'No hay entrevista.' }, c: { cat: 'CONFUSION_AUDITIVA', why: '“kitchen” aparece, pero se refiere a electrodomésticos de cocina, no a una remodelación.' }, d: { cat: 'DISTRACTOR', why: 'Menciona una hoja de cálculo, no un reporte de ventas.' } } },
    { item_id: 'P4-05', part: 4, skill: 'listening', difficulty: 2, topic: 'oficina', passage_group_id: 'G-P4-02',
      stem: 'What problem does the speaker mention?',
      options: [{ id: 'a', text: 'Some photos are blurry.' }, { id: 'b', text: 'Some prices are out of date.' }, { id: 'c', text: 'A file is missing.' }, { id: 'd', text: 'A printer is broken.' }],
      correct: 'b', explanation: 'Los precios de la página tres son del catálogo del año pasado: desactualizados.',
      distractors: { a: { cat: 'INFO_EXPLICITA', why: 'Dice que las fotos “look great”.' }, c: { cat: 'INFERENCIA', why: 'Ningún archivo falta.' }, d: { cat: 'DISTRACTOR', why: '“printer” aquí es la imprenta que espera el archivo, no una máquina dañada.' } },
      strategy: '“However” anuncia el problema. Cuando lo oigas, prestá máxima atención.' },
    { item_id: 'P4-06', part: 4, skill: 'listening', difficulty: 3, topic: 'oficina', passage_group_id: 'G-P4-02',
      stem: 'Why does the speaker say, "I know that doesn\'t give you much time"?',
      options: [{ id: 'a', text: 'To acknowledge a tight deadline' }, { id: 'b', text: 'To cancel a project' }, { id: 'c', text: 'To request a later meeting' }, { id: 'd', text: 'To complain about a delay' }],
      correct: 'a', explanation: 'Acaba de decir que el archivo final se necesita el lunes al mediodía: reconoce que el plazo es corto.',
      distractors: { b: { cat: 'INFERENCIA', why: 'El proyecto sigue; pide una corrección.' }, c: { cat: 'INFERENCIA', why: 'No propone reunión.' }, d: { cat: 'INFERENCIA', why: 'No se queja; es comprensivo.' } } },

    /* ───────── PARTE 5 · Incomplete Sentences ───────── */
    { item_id: 'P5-01', part: 5, skill: 'reading', difficulty: 1, topic: 'forma de palabra', shuffle: true,
      stem: 'The new software allows employees to submit expense reports more ------- than before.',
      options: [{ id: 'a', text: 'quick' }, { id: 'b', text: 'quickly' }, { id: 'c', text: 'quickness' }, { id: 'd', text: 'quicker' }],
      correct: 'b', explanation: '“more ___” modifica al verbo “submit”: hace falta un adverbio, “quickly”.',
      distractors: { a: { cat: 'GRAMATICA', why: 'Adjetivo; no modifica un verbo.' }, c: { cat: 'GRAMATICA', why: 'Sustantivo.' }, d: { cat: 'GRAMATICA', why: '“more quicker” es un doble comparativo incorrecto.' } },
      strategy: 'Si las cuatro opciones son la misma raíz, es una pregunta de gramática: mirá qué palabra hay antes y después del espacio.' },
    { item_id: 'P5-02', part: 5, skill: 'reading', difficulty: 1, topic: 'vocabulario de oficina', shuffle: true,
      stem: 'All visitors must ------- at the front desk before entering the laboratory.',
      options: [{ id: 'a', text: 'register' }, { id: 'b', text: 'attend' }, { id: 'c', text: 'collect' }, { id: 'd', text: 'display' }],
      correct: 'a', explanation: '“register at the front desk” = registrarse en recepción.',
      distractors: { b: { cat: 'VOCABULARIO', why: '“attend” necesita un objeto (attend a meeting).' }, c: { cat: 'VOCABULARIO', why: '“collect” también necesita un objeto.' }, d: { cat: 'VOCABULARIO', why: '“display” = exhibir; no tiene sentido aquí.' } } },
    { item_id: 'P5-03', part: 5, skill: 'reading', difficulty: 2, topic: 'preposiciones de tiempo', shuffle: true,
      stem: 'The quarterly sales meeting has been postponed ------- next Tuesday.',
      options: [{ id: 'a', text: 'at' }, { id: 'b', text: 'until' }, { id: 'c', text: 'since' }, { id: 'd', text: 'during' }],
      correct: 'b', explanation: '“postpone until + fecha” = posponer hasta.',
      distractors: { a: { cat: 'GRAMATICA', why: '“at” va con horas (at 3:00), no con días.' }, c: { cat: 'GRAMATICA', why: '“since” mira al pasado.' }, d: { cat: 'GRAMATICA', why: '“during” indica un periodo, no un punto de llegada.' } } },
    { item_id: 'P5-04', part: 5, skill: 'reading', difficulty: 2, topic: 'tiempos verbales', shuffle: true,
      stem: 'By the time the director arrived, the team ------- the presentation.',
      options: [{ id: 'a', text: 'finishes' }, { id: 'b', text: 'will finish' }, { id: 'c', text: 'had finished' }, { id: 'd', text: 'has been finishing' }],
      correct: 'c', explanation: '“By the time + pasado” pide pasado perfecto: la acción terminó antes de la llegada.',
      distractors: { a: { cat: 'GRAMATICA', why: 'Presente; choca con “arrived”.' }, b: { cat: 'GRAMATICA', why: 'Futuro; choca con “arrived”.' }, d: { cat: 'GRAMATICA', why: 'Presente perfecto continuo; no encaja con un punto en el pasado.' } } },
    { item_id: 'P5-05', part: 5, skill: 'reading', difficulty: 2, topic: 'colocaciones', shuffle: true,
      stem: 'Ms. Chen was ------- for her outstanding contribution to the customer service program.',
      options: [{ id: 'a', text: 'recognized' }, { id: 'b', text: 'realized' }, { id: 'c', text: 'reminded' }, { id: 'd', text: 'required' }],
      correct: 'a', explanation: '“be recognized for” = ser reconocida por un logro.',
      distractors: { b: { cat: 'VOCABULARIO', why: '“realize” = darse cuenta; falso amigo de “realizar”.' }, c: { cat: 'VOCABULARIO', why: '“remind” = recordarle algo a alguien.' }, d: { cat: 'VOCABULARIO', why: '“require” = exigir.' } } },
    { item_id: 'P5-06', part: 5, skill: 'reading', difficulty: 3, topic: 'pronombres relativos', shuffle: true,
      stem: 'Applicants ------- résumés are received after May 15 will not be considered.',
      options: [{ id: 'a', text: 'who' }, { id: 'b', text: 'whose' }, { id: 'c', text: 'which' }, { id: 'd', text: 'whom' }],
      correct: 'b', explanation: 'Los currículos son DE los candidatos: posesivo “whose”.',
      distractors: { a: { cat: 'GRAMATICA', why: '“who” sería sujeto, pero el sujeto de la cláusula ya es “résumés”.' }, c: { cat: 'GRAMATICA', why: '“which” no se usa para personas.' }, d: { cat: 'GRAMATICA', why: '“whom” es objeto; aquí hace falta posesión.' } } },

    /* ───────── PARTE 6 · Text Completion ───────── */
    { item_id: 'P6-01', part: 6, skill: 'reading', difficulty: 3, topic: 'inserción de oración', passage_group_id: 'G-P6-01', blank: 1, shuffle: true,
      stem: 'Choose the sentence that best fits blank 1.',
      options: [{ id: 'a', text: 'We will let you know if the schedule changes.' }, { id: 'b', text: 'Thank you for attending the safety training.' }, { id: 'c', text: 'The new parking fees will be announced soon.' }, { id: 'd', text: 'Please return your badge to the security office.' }],
      correct: 'a', explanation: 'Sigue a “The work is expected to take about two weeks”: avisar si cambia el plazo es la continuación lógica.',
      distractors: { b: { cat: 'INFERENCIA', why: 'No hay ninguna capacitación en el texto.' }, c: { cat: 'INFO_EXPLICITA', why: 'El texto dice después que parquear es gratis para el personal.' }, d: { cat: 'INFO_EXPLICITA', why: 'Al contrario: deben mostrar el gafete en el parqueo.' } },
      strategy: 'Para insertar una oración, leé la anterior y la siguiente. La correcta conecta con ambas y no contradice nada del texto.' },
    { item_id: 'P6-02', part: 6, skill: 'reading', difficulty: 1, topic: 'forma de palabra', passage_group_id: 'G-P6-01', blank: 2, shuffle: true,
      stem: 'Blank 2',
      options: [{ id: 'a', text: 'approximate' }, { id: 'b', text: 'approximately' }, { id: 'c', text: 'approximation' }, { id: 'd', text: 'approximated' }],
      correct: 'b', explanation: 'Modifica a “a ten-minute walk”: hace falta el adverbio “approximately”.',
      distractors: { a: { cat: 'GRAMATICA', why: 'Adjetivo.' }, c: { cat: 'GRAMATICA', why: 'Sustantivo.' }, d: { cat: 'GRAMATICA', why: 'Participio; no tiene sentido.' } } },
    { item_id: 'P6-03', part: 6, skill: 'reading', difficulty: 2, topic: 'conectores', passage_group_id: 'G-P6-01', blank: 3, shuffle: true,
      stem: 'Blank 3',
      options: [{ id: 'a', text: 'However' }, { id: 'b', text: 'In addition' }, { id: 'c', text: 'Otherwise' }, { id: 'd', text: 'Instead' }],
      correct: 'b', explanation: 'La buseta es un beneficio MÁS (además del parqueo gratis): “In addition”.',
      distractors: { a: { cat: 'GRAMATICA', why: '“However” introduce contraste, y no lo hay.' }, c: { cat: 'GRAMATICA', why: '“Otherwise” = de lo contrario.' }, d: { cat: 'GRAMATICA', why: '“Instead” = en lugar de; la buseta no reemplaza nada.' } } },
    { item_id: 'P6-04', part: 6, skill: 'reading', difficulty: 1, topic: 'vocabulario de avisos', passage_group_id: 'G-P6-01', blank: 4, shuffle: true,
      stem: 'Blank 4',
      options: [{ id: 'a', text: 'inconvenience' }, { id: 'b', text: 'information' }, { id: 'c', text: 'improvement' }, { id: 'd', text: 'instruction' }],
      correct: 'a', explanation: '“We apologize for any inconvenience” es una fórmula fija de disculpa.',
      distractors: { b: { cat: 'VOCABULARIO', why: 'No se pide disculpas por información.' }, c: { cat: 'VOCABULARIO', why: 'Una mejora no causa molestias.' }, d: { cat: 'VOCABULARIO', why: 'No tiene sentido con “apologize”.' } } },

    /* ───────── PARTE 7 · Reading Comprehension ───────── */
    { item_id: 'P7-01', part: 7, skill: 'reading', difficulty: 1, topic: 'idea principal', passage_group_id: 'G-P7-01', shuffle: true,
      stem: 'What is being advertised?',
      options: [{ id: 'a', text: 'Free classes' }, { id: 'b', text: 'Job openings' }, { id: 'c', text: 'A computer sale' }, { id: 'd', text: 'Volunteer opportunities' }],
      correct: 'a', explanation: 'Primera oración: “offering free computer classes for adults”.',
      distractors: { b: { cat: 'INFERENCIA', why: 'No hay puestos de trabajo.' }, c: { cat: 'DISTRACTOR', why: 'Se mencionan computadoras, pero no se venden.' }, d: { cat: 'INFERENCIA', why: 'No se buscan voluntarios.' } },
      strategy: 'Preguntas de propósito: leé el título y la primera oración. Casi siempre basta.' },
    { item_id: 'P7-02', part: 7, skill: 'reading', difficulty: 1, topic: 'detalle', passage_group_id: 'G-P7-01', shuffle: true,
      stem: 'What will participants learn in the Intermediate Level?',
      options: [{ id: 'a', text: 'How to send e-mail' }, { id: 'b', text: 'How to create spreadsheets' }, { id: 'c', text: 'How to search the Internet' }, { id: 'd', text: 'How to repair computers' }],
      correct: 'b', explanation: 'Intermediate: “build spreadsheets and prepare simple presentations”.',
      distractors: { a: { cat: 'INFO_EXPLICITA', why: 'Eso es del nivel Beginner.' }, c: { cat: 'INFO_EXPLICITA', why: 'También es del nivel Beginner.' }, d: { cat: 'INFERENCIA', why: 'No se enseña reparación.' } } },
    { item_id: 'P7-03', part: 7, skill: 'reading', difficulty: 2, topic: 'detalle', passage_group_id: 'G-P7-01', shuffle: true,
      stem: 'What must participants bring?',
      options: [{ id: 'a', text: 'A laptop' }, { id: 'b', text: 'A USB drive' }, { id: 'c', text: 'A registration fee' }, { id: 'd', text: 'A photo ID' }],
      correct: 'b', explanation: '“participants must bring their own USB drive”.',
      distractors: { a: { cat: 'INFO_EXPLICITA', why: 'Las laptops las da el centro.' }, c: { cat: 'INFO_EXPLICITA', why: 'Las clases son gratis.' }, d: { cat: 'INFERENCIA', why: 'No se pide identificación.' } } },
    { item_id: 'P7-04', part: 7, skill: 'reading', difficulty: 1, topic: 'propósito', passage_group_id: 'G-P7-02', shuffle: true,
      stem: 'Why did Ms. Grant write the e-mail?',
      options: [{ id: 'a', text: 'To change a reservation' }, { id: 'b', text: 'To cancel an event' }, { id: 'c', text: 'To complain about a service' }, { id: 'd', text: 'To request a refund' }],
      correct: 'a', explanation: 'Pide mover la reserva a una sala más grande.',
      distractors: { b: { cat: 'INFERENCIA', why: 'El taller sigue en pie.' }, c: { cat: 'INFERENCIA', why: 'No hay queja.' }, d: { cat: 'INFERENCIA', why: 'Pide el nuevo costo, no un reembolso.' } } },
    { item_id: 'P7-05', part: 7, skill: 'reading', difficulty: 2, topic: 'vocabulario en contexto', passage_group_id: 'G-P7-02', shuffle: true,
      stem: 'In the e-mail, the word "grown" in paragraph 2, line 1, is closest in meaning to',
      options: [{ id: 'a', text: 'increased' }, { id: 'b', text: 'developed' }, { id: 'c', text: 'planted' }, { id: 'd', text: 'matured' }],
      correct: 'a', explanation: 'El número de participantes pasó de 18 a 32: “aumentó”.',
      distractors: { b: { cat: 'VOCABULARIO', why: '“developed” es otro significado de grow, no el de este contexto.' }, c: { cat: 'VOCABULARIO', why: '“planted” se relaciona con plantas.' }, d: { cat: 'VOCABULARIO', why: '“matured” = madurar.' } },
      strategy: 'En vocabulario en contexto, reemplazá la palabra por cada opción y leé la oración completa.' },
    { item_id: 'P7-06', part: 7, skill: 'reading', difficulty: 2, topic: 'referencia cruzada', passage_group_id: 'G-P7-02', shuffle: true,
      stem: 'Which room will most likely be assigned to Ms. Grant\'s group?',
      options: [{ id: 'a', text: 'The Cedar Room' }, { id: 'b', text: 'The Maple Room' }, { id: 'c', text: 'The Grand Hall' }, { id: 'd', text: 'A room at another hotel' }],
      correct: 'b', explanation: 'Son 32 personas: el Cedar Room (20) no alcanza; el Maple Room (40) sí, y es la opción más pequeña que sirve.',
      distractors: { a: { cat: 'INFO_EXPLICITA', why: 'Es la sala actual, que tiene capacidad para 20.' }, c: { cat: 'INFERENCIA', why: 'Cabe, pero es mucho más grande y cara de lo necesario.' }, d: { cat: 'INFERENCIA', why: 'Nada indica que tengan que cambiar de hotel.' } } },
    { item_id: 'P7-07', part: 7, skill: 'reading', difficulty: 3, topic: 'inferencia entre textos', passage_group_id: 'G-P7-02', shuffle: true,
      stem: 'What is suggested about lunch for the workshop?',
      options: [{ id: 'a', text: 'It can be provided because of the group\'s size.' }, { id: 'b', text: 'It is included in the room price.' }, { id: 'c', text: 'It must be ordered from another company.' }, { id: 'd', text: 'It costs $50 per person.' }],
      correct: 'a', explanation: 'La página dice que hay catering para grupos de 25 o más; el grupo ahora es de 32.',
      distractors: { b: { cat: 'INFO_EXPLICITA', why: 'El precio incluye proyector y Wi-Fi, no comida.' }, c: { cat: 'INFERENCIA', why: 'El hotel sí ofrece catering.' }, d: { cat: 'DISTRACTOR', why: '$50 es el cargo por cambio de reserva, no el precio de la comida.' } },
      strategy: 'Si la pregunta no se responde con un solo texto, buscá el dato que los une (aquí: el tamaño del grupo).' },
    { item_id: 'P7-08', part: 7, skill: 'reading', difficulty: 3, topic: 'inferencia entre textos', passage_group_id: 'G-P7-02', shuffle: true,
      stem: 'How much will Norvale Engineering most likely pay for the room, not including food?',
      options: [{ id: 'a', text: '$250' }, { id: 'b', text: '$400' }, { id: 'c', text: '$450' }, { id: 'd', text: '$650' }],
      correct: 'c', explanation: 'Maple Room día completo = $400. El cambio se pide el 12 de septiembre para un evento el 16 (menos de 7 días): +$50. Total $450.',
      distractors: { a: { cat: 'INFO_EXPLICITA', why: '$250 es el Cedar Room día completo (la sala anterior).' }, b: { cat: 'INFO_EXPLICITA', why: 'Olvida el cargo de $50 por cambiar con menos de 7 días.' }, d: { cat: 'INFERENCIA', why: 'Suma $250 + $400 sin motivo.' } } }
  ]
};
