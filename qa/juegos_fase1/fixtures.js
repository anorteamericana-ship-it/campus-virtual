// QA juegos fase 1 · datos ficticios para el harness. No son datos de estudiantes ni del banco real.
(function () {
  'use strict';

  const how = ['Paso de prueba 1.', 'Paso de prueba 2.', 'Paso de prueba 3.'];

  // Una sola pregunta con 4 opciones distintas: permite repetir intentos rápido en la prueba de posiciones.
  const single4 = {
    kind: 'choice', title: 'QA · 4 opciones', badge: 'QA', unit: 'Posiciones', intro: 'Prueba de mezcla.', how,
    questions: [
      { type: 'QA', prompt: 'Choose the meaning.', stem: 'breakfast', options: ['Desayuno', 'Cena', 'Almuerzo', 'Merienda'], correct: 0, explain: 'Breakfast = desayuno.' },
    ],
  };

  // Pares con textos largos y cortos mezclados: obliga a botones de 1, 2 y 3 renglones.
  const matchLong = {
    kind: 'match', title: 'QA · Pareo largo', badge: 'QA', unit: 'Pareo', intro: 'Prueba de líneas.', how,
    pairs: [
      { id: 'wake', en: 'to wake up early before sunrise', es: 'despertarse temprano antes del amanecer' },
      { id: 'hw', en: 'homework', es: 'tarea' },
      { id: 'dress', en: 'to get dressed for a job interview', es: 'vestirse para una entrevista de trabajo' },
      { id: 'bus', en: 'to commute by bus to the city center every morning', es: 'viajar en bus al centro de la ciudad cada mañana' },
      { id: 'class', en: 'class', es: 'clase' },
      { id: 'teeth', en: 'to brush your teeth after breakfast', es: 'cepillarse los dientes después del desayuno' },
    ],
  };

  // Ítems con la forma que devuelve academiaPlayBankGetGame (claves en minúscula), inventados para QA.
  function mcq(id, stem, a, b, c, d, correct, extra) {
    return Object.assign({ play_item_id: id, item_type: 'MCQ', prompt_es: 'Elige el significado correcto.', stem, option_a: a, option_b: b, option_c: c, option_d: d, correct_option: correct, explanation_es: 'Explicación de prueba.' }, extra || {});
  }
  const bankGame = (id, title, area, template) => ({ source: 'bank', id, game_id: id, title, level_id: 'B1', unit_id: 'B1-U01', area_id: area, template_id: template });

  const bank = {
    mcq: {
      game: bankGame('QA-B1-U01-VOCAB-01', 'QA B1 U01 · Vocabulary Sprint', 'VOCAB', 'VOCAB_01'),
      items: [
        mcq('QA-1', 'reliable', 'confiable', 'compañero de cuarto', 'llevarse bien', 'amigo cercano', 'A'),
        mcq('QA-2', 'supportive', 'que apoya', 'honesto', 'compañero de cuarto', 'llevarse bien', 'A'),
        mcq('QA-3', 'honest', 'honesto', 'amigo cercano', 'compañero de cuarto', 'llevarse bien', 'A'),
        mcq('QA-4', 'roommate', 'compañero de cuarto', 'confiable', 'honesto', 'que apoya', 'A'),
        mcq('QA-5', 'to get along', 'llevarse bien', 'confiable', 'amigo cercano', 'que apoya', 'A'),
      ],
    },
    reading: {
      game: bankGame('QA-B1-U01-READ-01', 'QA B1 U01 · Reading Flash', 'READ', 'READ_01'),
      items: [
        mcq('QA-R1', '¿Qué tema se practica en el texto?', 'friendship', 'weather', 'sports', 'food', 'A', {
          item_type: 'READING_MCQ', prompt_es: 'Leé y elegí la mejor respuesta.',
          mini_text_or_dialogue: 'In class, students talk about friendship. The teacher gives a short example: "A reliable friend keeps promises and listens carefully."',
        }),
        mcq('QA-R2', '¿Qué hace un amigo confiable según el texto?', 'Keeps promises.', 'Forgets names.', 'Arrives late.', 'Never listens.', 'A', {
          item_type: 'READING_MCQ', prompt_es: 'Leé y elegí la mejor respuesta.',
          mini_text_or_dialogue: 'In class, students talk about friendship. The teacher gives a short example: "A reliable friend keeps promises and listens carefully."',
        }),
      ],
    },
    match: {
      game: bankGame('QA-B1-U01-VOCAB-02', 'QA B1 U01 · Word Match', 'VOCAB', 'VOCAB_02'),
      items: [
        { play_item_id: 'QA-M1', item_type: 'MATCH', match_left: 'reliable', match_right: 'confiable' },
        { play_item_id: 'QA-M2', item_type: 'MATCH', match_left: 'supportive', match_right: 'que apoya' },
        { play_item_id: 'QA-M3', item_type: 'MATCH', match_left: 'roommate', match_right: 'compañero/a de cuarto' },
        { play_item_id: 'QA-M4', item_type: 'MATCH', match_left: 'to get along', match_right: 'llevarse bien' },
        { play_item_id: 'QA-M5', item_type: 'MATCH', match_left: 'close friend', match_right: 'amigo/a cercano/a' },
      ],
    },
    order: {
      game: bankGame('QA-B1-U01-GRAM-02', 'QA B1 U01 · Sentence Order', 'GRAM', 'GRAM_02'),
      items: [
        { play_item_id: 'QA-O1', item_type: 'ORDER', prompt_es: 'Ordená la oración.', stem: 'friend / A / keeps / reliable / promises', words_to_order: 'friend | A | keeps | reliable | promises', correct_sentence: 'A reliable friend keeps promises', explanation_es: 'Adjetivo antes del sustantivo.' },
        { play_item_id: 'QA-O2', item_type: 'ORDER', prompt_es: 'Ordená la oración.', stem: 'honest / I / friends / trust', words_to_order: 'honest | I | friends | trust', correct_sentence: 'I trust honest friends', explanation_es: 'Sujeto + verbo + objeto.' },
      ],
    },
  };

  window.AP_QA_FIXTURES = { flows: { single4, matchLong }, bank };
})();
