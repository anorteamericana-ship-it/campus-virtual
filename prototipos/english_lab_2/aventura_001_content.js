/* Northbound · Aventura 001 · "Tu primera entrevista en inglés" (versión audiovisual).
 * Parte del contenido del reto 001 y le agrega, solo con datos:
 *   react / then  -> lo que el personaje contesta en inglés cuando fallás o acertás
 *   listen        -> primero se escucha; los subtítulos quedan a un toque
 *   pick + {drink}-> una decisión sin respuesta incorrecta que cambia líneas posteriores
 * Cargar después de lab2_content.js y reto_001_content.js. Estado: BORRADOR IA.
 */
(function () {
  'use strict';
  var base = window.LAB2_CONTENT;
  if (!base || !base.weekly) throw new Error('Northbound: falta el contenido del reto 001');
  var ep = JSON.parse(JSON.stringify(base.episodes[0]));
  ep.id = 'ADV001-INTERVIEW-B1';
  ep.story_es = 'Viernes, 10:15 de la mañana. En la puerta de The Corner Cup hay un cartel: WE ARE HIRING. Entrás. Lo que pase adentro depende de lo que digás.';

  var extra = {
    'Good morning! Welcome to The Corner Cup.': { listen: true, then: 'Come in, come in! You\'re here about the job, right?',
      react: { 'Good evening!': 'Evening? The sun is up! Let\'s try that again.', 'Good night!': 'Good night? Oh no, please don\'t leave yet!' } },
    'How are you today?': { then: 'Glad to hear it. I\'m Ms. Rivera.',
      react: { 'My name is Ms. Rivera.': 'Ha! No, I\'m Ms. Rivera. How are you?', 'Good night.': 'Night? It\'s ten in the morning!' } },
    'Thank you, {name}. Nice to meet you.': { then: 'Wonderful. Have a seat. Sam!',
      react: { 'Good night.': 'Oh, we just started!', 'How do you spell your name?': 'R-I-V-E-R-A. But I think it\'s my turn to ask.' } },
    'Would you like a seat?': { then: 'Here you go.',
      react: { 'Give me a chair!': 'Whoa, okay... A "please" would be nice.', 'Good evening.': 'Uh... hi again? So, a seat?' } },
    'I\'m from Costa Rica.': { react: { 'What\'s your name?': 'My name? It\'s Ms. Rivera.', 'How are you?': 'I\'m fine, thanks!' } },
    'I\'m a barista.': { then: 'Best job in Port Hazel.', react: { 'Where are you from?': 'Me? I\'m from Port Hazel.', 'How do you spell it?': 'B-A-R-I-S-T-A!' } }
  };
  ep.scenes.forEach(function (scene, n) {
    scene.id = 'ADV001-S' + (n + 1);
    scene.steps.forEach(function (step) {
      var x = extra[step.say];
      if (!x) return;
      if (x.listen) step.listen = true;
      if (x.then) step.then = x.then;
      (step.options || []).forEach(function (o) { if (x.react && x.react[o.t]) o.react = x.react[o.t]; });
    });
  });
  ep.scenes[1].steps.forEach(function (step) {
    if (step.kind === 'build') step.then = 'Let me write that down.';
  });

  /* Escena 3: Sam ofrece algo de tomar. No hay respuesta incorrecta; lo que elijás vuelve después. */
  var s3 = ep.scenes[2].steps;
  var seat = s3.map(function (s) { return s.say; }).indexOf('Would you like a seat?');
  s3.splice(seat + 1, 0,
    { kind: 'pick', clock: '10:20', who: 'sam', flag: 'drink', say: 'Coffee or tea? It\'s on the house.',
      ask_es: 'Sam te invita algo de tomar. Elegí lo que querás: no hay respuesta incorrecta.',
      options: [
        { t: 'Coffee, please.', value: 'coffee', then: 'One coffee, coming up!' },
        { t: 'Tea, please.', value: 'tea', then: 'One tea, coming up!' },
        { t: 'Water, please.', value: 'water', then: 'Just water? Sure thing!' }
      ], explain_es: 'On the house significa que invita la casa. Fijate que las tres opciones llevan please.' });
  var thanks = s3.map(function (s) { return s.say; }).indexOf('Thank you for coming today!');
  s3.splice(thanks + 1, 0,
    { kind: 'line', clock: '10:21', text_es: 'Sam vuelve con una taza y la pone frente a vos.' },
    { kind: 'choice', clock: '10:21', who: 'sam', say: 'Here\'s your {drink}, {name}.', ask_es: 'Sam te trae lo que pediste. ¿Qué le decís?',
      options: [
        { t: 'Thank you, Sam!', ok: true },
        { t: 'You\'re welcome.', react: 'Ha! That\'s my line.', why_es: 'You\'re welcome lo dice quien recibe las gracias. Aquí te toca darlas a vos.' },
        { t: 'Please.', react: 'Please... what? It\'s already yours!', why_es: 'Please es para pedir. Ya te lo trajeron: toca agradecer.' }
      ], then: 'You\'re welcome!', explain_es: 'Cuando te dan algo: Thank you. Quien lo dio contesta You\'re welcome.' });
  s3.forEach(function (step) {
    if (step.kind === 'line' && /Entrevista terminada/.test(step.text_es)) step.text_es = 'Ms. Rivera cierra la libreta y sonríe. Sam levanta tu taza de {drink}: escribió tu nombre en ella. La entrevista terminó.';
  });

  window.LAB2_CONTENT = Object.assign({}, base, {
    version: 'adventure-001.0.1', weeklyId: ep.id,
    stops: { B1: [{ unit: 1, topic: 'Aventura · Entrevista en The Corner Cup', episode: ep.id }], B2: [], I1: [], I2: [] },
    episodes: [ep]
  });
})();
