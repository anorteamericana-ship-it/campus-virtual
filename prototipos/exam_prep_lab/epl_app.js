/* EXAM PREP LAB · interfaz (vanilla JS, sin dependencias).
 * Habla solo con una API asíncrona: en el prototipo, EPLMock (backend simulado); en el Campus, el adaptador de Apps Script.
 * Nunca califica ni decide identidad en el navegador: todo eso lo hace el servidor (epl_server_core.js).
 * Montaje: EPLApp.mount(elemento, { api, user, embedded })  ·  standalone: lo monta index.html.
 */
(function (root) {
  'use strict';
  const EPL = root.EPL;
  const LETTERS = 'ABCD';
  const CANDIDATE_ROLES = ['student', 'cert_candidate'];
  const CAT = EPL.CATEGORIES;
  const RECS = {
    GRAMATICA: 'Repasá forma de palabra, tiempos verbales, preposiciones y conectores (Partes 5 y 6). Mirá qué hay antes y después del espacio.',
    VOCABULARIO: 'Trabajá colocaciones de oficina (conduct a survey, reserve a room). Leé la oración completa antes de elegir.',
    INFERENCIA: 'Elegí solo lo que el texto o el audio respalda. Si tenés que imaginar algo, probablemente es incorrecto.',
    INFO_EXPLICITA: 'Volvé al dato exacto: muchas trampas usan un dato real pero de otra persona, sala o fecha.',
    CONFUSION_AUDITIVA: 'Desconfiá de las opciones que repiten palabras o sonidos del audio. Practicá Parte 2 y revisá la transcripción.',
    DISTRACTOR: 'Antes de elegir, identificá qué tipo de información se pide (cuándo, quién, dónde, por qué).',
    TIEMPO: 'Quedaron preguntas sin responder. Practicá con reloj y nunca dejes espacios en blanco: no se resta por error.'
  };
  const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtTime = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(ss).padStart(2, '0'); };
  const fmtDur = s => { s = Math.round(s || 0); if (s < 60) return s + ' s'; const m = Math.round(s / 60); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; };
  const fmtDT = t => t ? new Date(t).toLocaleString('es-CR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtD = t => t ? new Date(t).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' }) : '—';
  const pct = (ok, n) => n ? Math.round(ok / n * 100) : null;
  const TYPE_LABEL = { practice: 'Práctica', mini: 'Mini-reto', diagnostic: 'Diagnóstico', review: 'Repaso', sim_listening: 'Simulacro Listening', sim_reading: 'Simulacro Reading', sim_full: 'Simulacro integral', preview: 'Vista previa', preview_sim: 'Vista previa' };
  const isSim = t => ['sim_listening', 'sim_reading', 'sim_full', 'preview_sim'].includes(t);
  const voiceLabel = v => ({ NARR: 'Narrador', US_F: 'Mujer (EE. UU.)', US_M: 'Hombre (EE. UU.)', US_F2: 'Mujer 2 (EE. UU.)', US_M2: 'Hombre 2 (EE. UU.)', UK_F: 'Mujer (R. Unido)', UK_M: 'Hombre (R. Unido)', UK_F2: 'Mujer 2 (R. Unido)', UK_M2: 'Hombre 2 (R. Unido)' }[v] || v);

  function mount(el, opts) {
    // Rutas de audio e imágenes relativas a la carpeta del laboratorio; en el Campus se antepone opts.assetBase.
    const asset = u => (!u || /^(?:[a-z]+:|\/)/i.test(String(u))) ? u : (opts.assetBase || '') + u;
    const A = { el, api: opts.api, user: opts.user || null, embedded: !!opts.embedded, view: '', arg: '', me: null, audio: null, timers: [], att: null, live: {}, flags: {} };
    const publicQA = opts.publicQA === true;
    // Serializar respuestas del piloto público antes de revelar la corrección.
    let publicAnswerWrites = Promise.resolve();
    const $ = (s, x) => (x || el).querySelector(s);
    const live = msg => { const r = document.getElementById('epl-live'); if (r) { r.textContent = ''; setTimeout(() => { r.textContent = msg; }, 30); } };
    const role = () => (A.user && A.user.rol) || '';
    const isCand = () => CANDIDATE_ROLES.includes(role());
    const queueKey = () => 'epl_queue_' + ((A.user && A.user.usuario) || 'anon');
    const readQ = () => { try { return JSON.parse(localStorage.getItem(queueKey()) || '[]'); } catch (_) { return []; } };
    const writeQ = q => { try { localStorage.setItem(queueKey(), JSON.stringify(q)); } catch (_) {} };

    /* ── API con cola sin conexión para respuestas ── */
    async function call(action, payload, opt = {}) {
      try {
        const r = await A.api.call(action, payload || {});
        setOffline(false);
        if (r && !r.ok && ['sesion_requerida', 'sesion_invalida'].includes(r.error) && !opt.quiet) { A.user = null; go(''); }
        return r;
      } catch (err) {
        setOffline(true);
        if (action === 'answer') { const q = readQ().filter(x => !(x.attempt_id === payload.attempt_id && x.item_id === payload.item_id)); q.push(payload); writeQ(q); setOffline(true); return { ok: true, queued: true }; }
        return { ok: false, error: 'sin_conexion', mensaje: 'Sin conexión con el servidor. Revisá tu internet e intentá de nuevo.' };
      }
    }
    async function flushQueue() {
      const q = readQ(); if (!q.length) return;
      const rest = []; let offline = false;
      for (const p of q) { try { const r = await A.api.call('answer', p); if (!r.ok && !['intento_cerrado', 'tiempo_agotado', 'fuera_de_turno', 'unidad_revisada', 'listening_cerrado', 'interrumpida'].includes(r.error)) rest.push(p); } catch (_) { rest.push(p); offline = true; } }
      writeQ(rest); setOffline(offline);
      if (!rest.length) live('Conexión recuperada. Respuestas guardadas.');
    }
    function setOffline(v) { const b = document.getElementById('epl-offline'); if (!b) return; const n = readQ().length; b.hidden = !v && !n; b.textContent = v ? `Sin conexión. ${n} respuesta(s) en espera: se enviarán solas al volver la conexión.` : (n ? 'Enviando respuestas pendientes…' : ''); }
    A.timers.push(setInterval(flushQueue, 4000)); root.addEventListener('online', flushQueue);

    /* ── marco y rutas ── */
    function tabs() {
      if (!A.user) return [];
      const r = role(); const t = [];
      if (isCand()) t.push(['panel', 'Panel'], ...(publicQA ? [['ruta', 'Mis 400 preguntas']] : []), ['orientacion', 'Orientación'], ['entrenar', 'Entrenar'], ['simulacros', 'Simulacros'], ['errores', 'Errores'], ['reportes', 'Reportes']);
      if (['superadmin', 'admin'].includes(r)) t.push(['candidatos', 'Candidatos'], ['auditoria', 'Auditoría']);
      if (r === 'teacher') t.push(['mis-candidatos', 'Mis candidatos']);
      if (A.editor && !isCand()) t.push(['banco', 'Banco y revisión']);
      if (r === 'superadmin') t.push(['config', 'Configuración']);
      return t;
    }
    function frame(active, inner) {
      stopAudio(); A.timers.slice(1).forEach(x => clearInterval(x)); A.timers = A.timers.slice(0, 1);
      const nav = document.getElementById('epl-tabs'); if (nav) nav.innerHTML = tabs().map(([k, l]) => `<a href="#${k}" data-go="${k}" ${k === active ? 'aria-current="page"' : ''}>${l}</a>`).join('');
      const who = document.getElementById('epl-who'); if (who) who.innerHTML = A.user ? `${e(A.user.nombre || A.user.usuario)} · <span class="pill" style="background:rgba(255,255,255,.18);color:#fff">${e(role())}</span> ${A.embedded ? '' : '<a href="#salir" data-go="salir" style="color:#fff">salir</a>'}` : '';
      el.innerHTML = inner;
      const h = $('h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      if (!A.embedded) root.scrollTo(0, 0);
    }
    function go(view, arg) {
      A.view = view; A.arg = arg || '';
      if (A.embedded) return route();
      const h = '#' + view + (arg ? '-' + arg : ''); if (location.hash === h || (h === '#' && !location.hash)) route(); else location.hash = h;
    }
    // Serializar rutas asíncronas: si cambia el hash durante una consulta, la última ruta
    // siempre vuelve a renderizarse. Evita que una respuesta anterior tape la navegación actual.
    let routeRunning = false;
    let routeRequested = false;
    async function route() {
      if (routeRunning) { routeRequested = true; return; }
      routeRunning = true;
      try {
        do {
          routeRequested = false;
          await renderRoute();
        } while (routeRequested);
      } finally { routeRunning = false; }
    }
    async function renderRoute() {
      if (!A.embedded) { const h = (location.hash || '#').slice(1); const i = h.indexOf('-'); A.view = i < 0 ? h : h.slice(0, i); A.arg = i < 0 ? '' : h.slice(i + 1); if (A.view === 'mis') { A.view = 'mis-candidatos'; A.arg = ''; } }
      const v = A.view;
      if (v === 'activar') return viewActivate(A.arg);
      if (v === 'salir') { if (opts.onLogout) opts.onLogout(); A.user = null; A.me = null; A.editor = undefined; return go(''); }
      if (!A.user) return opts.loginView ? opts.loginView(A) : frame('', '<h1>Exam Prep Lab</h1><p>Iniciá sesión en el Campus para continuar.</p>');
      if (A.editor === undefined) { if (isCand()) A.editor = false; else { const r = await call('editorItems', { form: 'A', part: 1, status: '__ninguno__' }, { quiet: true }); A.editor = !!(r && r.ok); if (r && r.ok) A.formsList = r.forms; } }
      const def = isCand() ? 'panel' : ['superadmin', 'admin'].includes(role()) ? 'candidatos' : role() === 'teacher' ? 'mis-candidatos' : 'sin-acceso';
      const cand = ['panel', 'orientacion', 'entrenar', 'sesion', 'simulacros', 'simulacro', 'resultado', 'errores', 'reportes', ...(publicQA ? ['ruta'] : [])];
      const staff = { candidatos: viewAdmin, candidato: () => viewCandidate(A.arg), auditoria: viewAudit, config: viewConfig, 'mis-candidatos': viewTeacher, banco: () => viewBank(A.arg) };
      if (v === '' ) return go(def);
      if (cand.includes(v)) {
        if (!isCand() && !['sesion', 'resultado'].includes(v)) return go(def);
        return ({ panel: viewPanel, orientacion: viewWelcome, entrenar: viewTrain, sesion: () => viewSession(A.arg), simulacros: viewSims, simulacro: () => viewSim(A.arg), resultado: () => viewResult(A.arg), errores: viewErrors, reportes: viewReport, ...(publicQA ? {ruta:viewPublicRoute}: {}) })[v]();
      }
      if (staff[v] && !isCand()) return staff[v]();
      if (v === 'sin-acceso') return frame('', '<h1>Sin acceso</h1><p>Tu rol no tiene funciones en Exam Prep Lab.</p>');
      return go(def);
    }
    if (!A.embedded) root.addEventListener('hashchange', route);

    const notice = r => `<div class="note bad" role="alert">${e(r.mensaje || r.error)}</div>`;
    async function loadMe() { const r = await call('me'); A.me = r.ok ? r : null; return r; }

    /* ════════ CANDIDATO ════════ */
    async function viewPanel() {
      const me = await loadMe();
      if (!me.ok) return frame('panel', `<h1>Exam Prep Lab</h1>${notice(me)}<p class="small mute">La Academia habilita el acceso de forma individual, sin depender de grupo, matrícula ni pagos.</p>`);
      const d = await call('dashboard'); const rep = d.report;
      const L = rep.bySkill.listening, R = rep.bySkill.reading;
      const open = rep.open.map(o => `<div class="note" style="margin-bottom:10px"><b>Actividad sin terminar:</b> ${e(o.title)} · ${fmtDT(o.created)} <button class="btn" data-act="open-attempt" data-id="${o.attempt_id}" data-tipo="${o.tipo}" style="margin-left:8px">Continuar</button></div>`).join('');
      let sug;
      if (!rep.diagnostic) sug = { t: publicQA ? 'Empezá con 25 preguntas de Listening y Reading. Después tendrás acceso a las 400 preguntas del programa.' : 'Empezá con el diagnóstico equilibrado: 20 preguntas de las 7 partes, unos 25 minutos.', b: '<button class="btn red" data-act="start" data-tipo="diagnostic">Hacer diagnóstico</button>' };
      else if (rep.srs.due) sug = { t: `Tenés ${rep.srs.due} ${rep.srs.due === 1 ? 'error' : 'errores'} para repasar hoy.`, b: '<button class="btn red" data-act="start" data-tipo="review" data-due="1">Repasar ahora</button>' };
      else { let w = null; for (let p = 1; p <= 7; p++) { const r = rep.byPart[p]; const sc = r.n ? r.ok / r.n : -1; if (!w || sc < w.sc) w = { p, sc, n: r.n }; } sug = { t: w.n ? `Una parte que conviene reforzar es la ${w.p} (${EPL.PART_NAMES[w.p]}): ${pct(rep.byPart[w.p].ok, rep.byPart[w.p].n)} % en ${w.n} respuestas.` : `Todavía no practicás la Parte ${w.p} (${EPL.PART_NAMES[w.p]}).`, b: `<button class="btn red" data-act="start" data-tipo="practice" data-part="${w.p}">Practicar Parte ${w.p}</button>` }; }
      const card = (lbl, s) => `<div class="card"><div class="mute small">${lbl}</div><div class="kpi">${s.n ? pct(s.ok, s.n) + ' %' : '—'} <small>${s.n ? `${s.ok}/${s.n}` : 'sin práctica'}</small></div>${s.n ? `<div class="bar"><i style="width:${pct(s.ok, s.n)}%"></i></div>` : ''}</div>`;
      const ach = [['Punto de partida', 'Completaste el diagnóstico.', rep.diagnostic], ['Las siete partes', 'Respondiste preguntas de las 7 partes.', Object.values(rep.byPart).every(p => p.n > 0)], ['Constancia', 'Practicaste en 3 días distintos.', rep.days >= 3],
        ['Error corregido', 'Dominaste una pregunta que antes fallaste.', rep.srs.mastered > 0], ['Bajo reloj', 'Terminaste una sección completa de simulacro.', rep.history.some(h => isSim(h.tipo))], ['Forma completa', 'Terminaste un simulacro integral de 200.', rep.history.some(h => h.tipo === 'sim_full')]];
      frame('panel', `<h1>Hola, ${e((me.candidate.nombre || '').split(' ')[0])}</h1>${publicQA ? '<div class="note"><b>Tu recorrido:</b> 1. Diagnóstico de 25 preguntas · 2. Todas las preguntas de las formas A y B · 3. Reportá cualquier error que encontrés. <a href="#ruta" data-go="ruta" data-arg="">Ver mi avance y seguir</a></div>' : ''}${me.env === 'DEMO' ? '<div class="note warn small" style="margin-bottom:12px">Entorno de demostración: el material es BORRADOR sin revisión docente. En producción solo verás preguntas publicadas.</div>' : ''}${open}
        <div class="grid g2"><div class="card"><h2>Actividad sugerida</h2><p>${e(sug.t)}</p>${sug.b}</div>
          <div class="card"><h2>Tu acceso</h2><p class="small">Práctica: forma ${e(me.access.forms.join(', ') || '—')} · Simulacros: forma ${e(me.access.sim_forms.join(', ') || '—')}${me.access.hasta ? ` · disponible hasta ${e(me.access.hasta)}` : ''}</p>
            ${me.forms.map(f => `<div class="small">Forma ${f.form}: ${f.exposure.seen}/${f.total} preguntas ya vistas${f.sim && f.exposure.seen ? ' <span class="pill draft">el simulacro no será “en frío”</span>' : ''}</div>`).join('')}</div></div>
        <div class="grid g4" style="margin-top:14px">${card('Listening (práctica)', L)}${card('Reading (práctica)', R)}
          <div class="card"><div class="mute small">Aciertos al primer intento</div><div class="kpi">${rep.first_try.n ? pct(rep.first_try.ok, rep.first_try.n) + ' %' : '—'} <small>${rep.first_try.n} preguntas</small></div></div>
          <div class="card"><div class="mute small">Tiempo · actividades</div><div class="kpi">${fmtDur(rep.seconds)}</div><div class="small mute">${rep.attempts} terminadas · ${rep.srs.pending} errores en repaso</div></div></div>
        <div class="grid g2" style="margin-top:14px"><div class="card"><h2>Últimas actividades</h2>${rep.history.slice(0, 5).map(h => `<div class="small" style="margin:4px 0"><a href="#resultado-${h.attempt_id}" data-go="resultado" data-arg="${h.attempt_id}">${e(h.title)}</a> · ${fmtDT(h.finished)} · ${h.ok}/${h.n}</div>`).join('') || '<p class="mute">Todavía no terminaste ninguna actividad.</p>'}</div>
          <div class="card"><h2>Logros</h2>${ach.map(([l, dsc, ok]) => `<div class="ach ${ok ? 'done' : ''}" style="margin:6px 0"><span class="ic" aria-hidden="true">${ok ? '✓' : '·'}</span><div><b>${l}</b><div class="small mute">${dsc}</div></div><span class="sr">${ok ? 'conseguido' : 'pendiente'}</span></div>`).join('')}</div></div>
        <p class="small mute" style="margin-top:14px">Los porcentajes son aciertos de práctica en este laboratorio. <b>No son puntajes TOEIC</b> ni predicen el resultado oficial.</p>`);
    }
    async function viewPublicRoute() {
      const cv = await call('publicCoverage');
      if (!cv.ok) return frame('ruta', '<h1>Mis 400 preguntas</h1>' + notice(cv));
      const d = await call('dashboard');
      const h = d.ok ? d.report.history.find(x => x.tipo === 'diagnostic') : null;
      const level = !h ? null : h.ok / (h.n || 1) >= .8 ? 'Aciertos altos en esta muestra' : h.ok / (h.n || 1) >= .6 ? 'Aciertos medios en esta muestra' : h.ok / (h.n || 1) >= .4 ? 'Aciertos parciales en esta muestra' : 'En esta muestra, conviene practicar las bases';
      const next = cv.rows.find(x => x.seen < x.total);
      const openAttempt = d.ok && Array.isArray(d.report.open) ? d.report.open.find(x => !isSim(x.tipo)) : null;
      const percentage = Math.round(cv.seen_total / Math.max(1, cv.total) * 100);
      if (publicQA && typeof opts.onProgress === 'function') opts.onProgress({coverage:{seen_total:cv.seen_total,total:cv.total,rows:cv.rows},diagnostic:h ? {ok:h.ok,n:h.n} : null});
      frame('ruta', `<h1>Tu recorrido completo</h1>
        <div class="card"><h2>${e((A.user.nombre || '').split(' ')[0])}, ya revisaste ${cv.seen_total} de ${cv.total} preguntas únicas</h2>
          <div class="bar" aria-label="${percentage}% completado"><i style="width:${percentage}%"></i></div>
          <p class="small mute">No se repiten preguntas contestadas al elegir «Continuar con la siguiente sección». Puedes detenerte y seguir después.</p>
          ${h ? `<p><b>Tu diagnóstico de 25 preguntas:</b> ${h.ok}/${h.n} · ${e(level)}. No equivale a un nivel MCER/CEFR validado ni a un puntaje TOEIC.</p>` : '<p>Primero completá el diagnóstico de 25 preguntas.</p>'}
          <button class="btn red" data-act="${openAttempt ? 'open-attempt' : h ? 'start-next-qa' : 'start'}" ${openAttempt ? `data-id="${e(openAttempt.attempt_id)}" data-tipo="${e(openAttempt.tipo)}"` : h ? '' : 'data-tipo="diagnostic"'} ${!next && h && !openAttempt ? 'disabled' : ''}>${openAttempt ? 'Retomar actividad pendiente' : !h ? 'Empezar diagnóstico (25)' : next ? 'Continuar con la siguiente sección' : 'Completaste las 400 preguntas'}</button>
          <p class="small">Al terminar un bloque, volvé aquí para continuar. También podés abrir los simulacros completos de 100 y 200 preguntas cuando quieras.</p></div>
        <div class="grid g2" style="margin-top:14px">${['A','B'].map(f => `<div class="card"><h2>Forma ${f} · 200 preguntas</h2>${cv.rows.filter(r => r.form === f).map(x => `<div class="row" style="justify-content:space-between;margin:5px 0"><span>Parte ${x.part} · ${e(EPL.PART_NAMES[x.part])}</span><span><b>${x.seen}/${x.total}</b> ${x.seen === x.total ? '✓' : ''}</span></div>`).join('')}</div>`).join('')}</div>
        <div class="note warn small" style="margin-top:12px">Banco de revisión: 400/400 preguntas todavía BORRADOR. Si encontrás un fallo de audio, imagen, traducción o respuesta, tocá «Reportar problema» junto a la pregunta.</div>`);
    }
    async function startNextPublicBlock() {
      const cv = await call('publicCoverage');
      if (!cv.ok) return live(cv.mensaje || cv.error);
      const next = cv.rows.find(x => x.seen < x.total);
      if (!next) return go('ruta');
      return startAttempt({ tipo:'practice', form:next.form, part:next.part, size:15, only_unseen:true });
    }
    function viewWelcome() {
      frame('orientacion', `<h1>Orientación</h1><div class="grid g2">
        <div class="card"><h2>Qué mide el examen</h2><p>El TOEIC® Listening and Reading mide comprensión auditiva y de lectura del inglés en situaciones de trabajo y vida diaria.</p><p>Formato lineal: <b>200 preguntas</b> en unas <b>2 horas</b>. Listening: 100 preguntas, unos 45 minutos, con audio que no se repite ni se pausa. Reading: 100 preguntas en 75 minutos.</p><div class="note warn small">La modalidad exacta contratada con el Centro Cultural está pendiente de confirmar; el laboratorio permite configurar otras versiones.</div></div>
        <div class="card"><h2>Las siete partes</h2><table><thead><tr><th>Parte</th><th>Qué hacés</th><th>Preguntas</th></tr></thead><tbody>${Object.entries(EPL.FORM_SPEC.parts).map(([p, n]) => `<tr><td>${p} · ${EPL.PART_NAMES[p]}</td><td class="small">${{ 1: 'Escuchás 4 frases y elegís la que describe la foto.', 2: 'Escuchás una pregunta y 3 respuestas.', 3: '13 conversaciones, 3 preguntas cada una; algunas con gráfico.', 4: '10 charlas o anuncios, 3 preguntas cada uno.', 5: 'Completás oraciones.', 6: '4 textos con 4 espacios; uno pide insertar una oración.', 7: '10 textos individuales (29 preguntas) y 5 conjuntos de 2 o 3 textos (25 preguntas).' }[p]}</td><td>${n}</td></tr>`).join('')}</tbody></table></div>
        <div class="card"><h2>Entrenar vs. simulacro</h2><p><b>Entrenar:</b> sesiones cortas, hasta 3 reproducciones del audio, explicación de cada opción, transcripción y vocabulario después de responder.</p><p><b>Simulacro:</b> secciones completas de 100 preguntas o la forma entera de 200. Audio continuo sin pausa, reloj del servidor que no se detiene, sin pistas. La corrección aparece al final.</p></div>
        <div class="card"><h2>Administrar el tiempo</h2><ul><li>En las Partes 3 y 4, leé las preguntas antes del audio.</li><li>En Reading, intentá terminar la Parte 5 en unos 10 minutos.</li><li>No dejes respuestas en blanco: no se resta por error.</li></ul><p class="small">Teclado: <span class="kbd">1</span>–<span class="kbd">4</span> o <span class="kbd">A</span>–<span class="kbd">D</span> eligen, <span class="kbd">Enter</span> confirma, <span class="kbd">P</span> reproduce.</p></div>
        <div class="card"><h2>Tus resultados no son oficiales</h2><p>El puntaje oficial (10–990) lo calcula ETS con un proceso que no es público. Aquí ves lo que sí se puede medir: correctas/total, rendimiento por parte y habilidad, tiempo y tipos de error. No hay conversión a 990 ni nota de aprobación.</p></div>
        <div class="card"><h2>Cuándo practicar</h2><p>Cuando quieras. Te sugerimos 4 sesiones cortas por semana, una sección completa de simulacro cada semana y el repaso de errores que te indica el sistema.</p></div></div>`);
    }
    async function viewTrain() {
      const me = A.me || await loadMe(); if (!me.ok) return frame('entrenar', `<h1>Entrenar</h1>${notice(me)}`);
      const d = await call('dashboard'); const bp = d.ok ? d.report.byPart : {};
      frame('entrenar', `<h1>Entrenar por partes</h1><div id="msg"></div><div class="card"><div class="grid g3">
        <div><label for="t-part"><b>Parte</b></label><br><select id="t-part">${[1, 2, 3, 4, 5, 6, 7].map(p => `<option value="${p}">Parte ${p} · ${EPL.PART_NAMES[p]}</option>`).join('')}</select></div>
        <div><label for="t-size"><b>Cantidad</b></label><br><select id="t-size"><option>5</option><option>10</option><option>15</option></select></div>
        <div><label for="t-diff"><b>Dificultad</b></label><br><select id="t-diff"><option value="">Todas</option><option value="1">Básica</option><option value="2">Media</option><option value="3">Alta</option></select></div></div>
        <div style="margin-top:10px"><label for="t-topic"><b>Tema</b></label><br><select id="t-topic"><option value="">Todos</option></select></div>
        <p class="small mute">Se priorizan preguntas que todavía no viste. Los conjuntos de las Partes 3, 4, 6 y 7 van completos.</p>
        <button class="btn red" data-act="start-train">Comenzar</button> <button class="btn ghost" data-act="start" data-tipo="mini">Mini-reto de 5 minutos</button></div>
        <div class="grid g4" style="margin-top:14px">${[1, 2, 3, 4, 5, 6, 7].map(p => { const r = bp[p] || { n: 0 }; return `<div class="card tight"><b>Parte ${p}</b><div class="small mute">${EPL.PART_NAMES[p]}</div><div>${r.n ? `${pct(r.ok, r.n)} % · ${r.ok}/${r.n}` : '<span class="mute">sin práctica</span>'}</div><button class="btn ghost" style="margin-top:6px" data-act="start" data-tipo="practice" data-part="${p}">Practicar</button></div>`; }).join('')}</div>`);
      const fill = () => { const p = $('#t-part').value; $('#t-topic').innerHTML = '<option value="">Todos</option>' + ((me.topics || {})[p] || []).map(t => `<option>${e(t)}</option>`).join(''); };
      $('#t-part').addEventListener('change', fill); fill();
    }
    async function startAttempt(payload) {
      const btns = [...el.querySelectorAll('[data-act^=start]')]; btns.forEach(b => { b.disabled = true; });
      const r = await call('start', payload);
      btns.forEach(b => { b.disabled = false; });
      if (!r.ok) { if (r.attempt_id) { A.att = null; return go(isSim(payload.tipo) ? 'simulacro' : 'sesion', r.attempt_id); } let box = $('#msg'); if (!box) { box = document.createElement('div'); box.id = 'msg'; el.prepend(box); } box.innerHTML = notice(r); return; }
      A.att = r.attempt; A.live = {}; if (r.notice) A.att._notice = r.notice;
      go(isSim(r.attempt.tipo) ? 'simulacro' : 'sesion', r.attempt.attempt_id);
    }

    /* ── práctica ── */
    async function getAttempt(id) {
      if (A.att && A.att.attempt_id === id) return { ok: true, attempt: A.att };
      const r = await call('attempt', { attempt_id: id }); if (r.ok && r.attempt) A.att = r.attempt; return r;
    }
    async function viewSession(id) {
      const r = await getAttempt(id);
      if (r.finished) return go('resultado', id);
      if (!r.ok) return frame('entrenar', `<h1>Práctica</h1>${notice(r)}`);
      const at = r.attempt; const fb = {}; (at.feedback || []).forEach(f => { fb[f.unit_id] = f; });
      const pending = at.units.findIndex(u => !fb[u.unit_id]);
      const last = A.showFeedback && fb[A.showFeedback] ? at.units.findIndex(u => u.unit_id === A.showFeedback) : -1;
      if (pending < 0 && last < 0) { const f = await call('finish', { attempt_id: id }); A.att = null; return f.ok ? go('resultado', id) : frame('entrenar', notice(f)); }
      const idx = last >= 0 ? last : pending; const unit = at.units[idx]; const revealed = !!fb[unit.unit_id];
      const done = at.units.slice(0, idx).reduce((k, x) => k + x.items.length, 0);
      const answers = at.answers || {};
      let body = '';
      if (unit.part <= 4) body += playerHTML(unit, revealed);
      if (unit.part === 1) body += `<div class="photo"><img src="${e(asset(unit.image))}" alt="${e(revealed ? (fb[unit.unit_id].image_desc || 'Ilustración') : 'Ilustración de práctica; la descripción aparece después de responder.')}"></div>`;
      if (unit.graphic) body += graphicHTML(unit.graphic);
      if (unit.passages) body += passagesHTML(unit, answers);
      body += unit.items.map((it, k) => questionHTML(it, answers[it.item_id], revealed ? fb[unit.unit_id].items.find(x => x.item_id === it.item_id) : null, k, unit.items.length)).join('');
      if (revealed) body += afterHTML(fb[unit.unit_id]);
      const allAns = unit.items.every(it => answers[it.item_id] && answers[it.item_id].opt);
      const more = at.units.some((u, j) => j !== idx && !fb[u.unit_id]);
      frame(A.user && isCand() ? 'entrenar' : 'banco', `<div class="qhead"><div><h1 style="margin:0">${e(at.title)}</h1><div class="small mute">Parte ${unit.part} · ${EPL.PART_NAMES[unit.part]} · preguntas ${done + 1}–${done + unit.items.length} de ${at.total_items}${unit.form ? ' · Forma ' + unit.form : ''}</div></div>${unit.draft ? '<span class="pill draft" title="Sin revisión docente">BORRADOR IA</span>' : ''}</div>
        <div id="msg"></div>${at._notice ? `<div class="note warn small">${e(at._notice)}</div>` : ''}${unit.intro ? `<p class="dir">${e(unit.intro)}</p>` : ''}${body}
        <div class="sticky-actions">${revealed ? `<button class="btn red" data-act="next" data-primary>${more ? 'Siguiente' : 'Terminar'}</button>` : `<button class="btn ghost" data-act="leave">Guardar y salir</button><button class="btn red" data-act="check" data-unit="${unit.unit_id}" data-primary ${allAns ? '' : 'disabled'}>Revisar respuesta${unit.items.length > 1 ? 's' : ''}</button>`}</div>`);
      if (unit.part <= 4) mountPlayer(unit, revealed);
    }
    function playerHTML(u, revealed) {
      const used = (A.live.plays || {})[u.unit_id] || 0;
      return `<div class="player" id="player" data-unit="${u.unit_id}"><button class="btn" data-act="play" ${used >= 3 && !revealed ? 'disabled' : ''} aria-describedby="pl-status">▶ ${used ? 'Escuchar de nuevo' : 'Escuchar'}</button><div class="bar" aria-hidden="true"><i id="pl-bar" style="width:0%"></i></div><span id="pl-status" class="small mute" role="status">${revealed ? 'Podés volver a escuchar con la transcripción.' : `Reproducciones: ${used} de 3`}</span></div>`;
    }
    function stopAudio() { if (A.audio) { const a = A.audio; A.audio = null; a._dead = true; try { a.pause(); } catch (_) {} a.onended = a.onerror = a.ontimeupdate = null; a.removeAttribute('src'); try { a.load(); } catch (_) {} } }
    function mountPlayer(u, revealed) {
      const st = $('#pl-status'), bar = $('#pl-bar');
      const a = A.audio = new Audio(); a._dead = false; a.preload = 'auto'; a.src = asset(u.audio); a._unit = u.unit_id; a._revealed = revealed;
      const clip = ((root.EPL_AUDIO || {}).clips || {})[u.unit_id] || {};
      const stopAt = u.kind === 'group' && clip.questions_at && !revealed ? clip.questions_at : null;
      a.addEventListener('error', () => { if (a._dead || !$('#player')) return; $('#player').outerHTML = `<div class="note bad" role="alert"><b>No se pudo cargar el audio de esta pregunta.</b> No se va a contar. Revisá tu conexión o saltala. <button class="btn ghost" data-act="skip-unit" data-unit="${u.unit_id}">Saltar esta pregunta</button></div>`; });
      a.addEventListener('timeupdate', () => { if (a._dead) return; const end = stopAt || a.duration || clip.seconds || 1; if (bar) bar.style.width = Math.min(100, a.currentTime / end * 100) + '%'; if (stopAt && a.currentTime >= stopAt) { a.pause(); a.currentTime = 0; if (st) st.textContent = 'Fin de la conversación. Respondé las preguntas.'; } });
      a.addEventListener('ended', () => { if (!a._dead && st) st.textContent = 'Audio terminado.'; });
    }
    function play() {
      const a = A.audio; if (!a || a._dead) return; const uid = a._unit, revealed = a._revealed;
      A.live.plays = A.live.plays || {}; const used = A.live.plays[uid] || 0;
      if (!revealed && used >= 3) return live('Ya usaste las 3 reproducciones.');
      if (!revealed) A.live.plays[uid] = used + 1;
      a.currentTime = 0; a.play().catch(() => live('El navegador bloqueó el audio. Tocá Escuchar otra vez.'));
      const st = $('#pl-status'); if (st) st.textContent = revealed ? 'Reproduciendo…' : `Reproduciendo… (${A.live.plays[uid]} de 3)`;
      const b = $('[data-act=play]'); if (b && !revealed && A.live.plays[uid] >= 3) b.disabled = true;
    }
    function graphicHTML(g) { return `<div class="passage" style="font-family:system-ui;max-width:560px;margin-bottom:10px"><div class="ttl">${e(g.title)}</div><div class="table-wrap"><table><thead><tr>${g.columns.map(c => `<th>${e(c)}</th>`).join('')}</tr></thead><tbody>${g.rows.map(r => `<tr>${r.map(c => `<td>${e(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`; }
    function passageBlock(p, unit, answers) {
      const insBlank = (unit.items.find(x => /sentence/i.test(x.stem || '')) || {}).blank;
      const blankText = n => { const it = unit.items.find(x => x.blank === Number(n)); if (!it || Number(n) === insBlank) return ''; const a = answers && answers[it.item_id]; const o = a && it.options.find(z => z.id === a.opt); return o && o.text ? o.text : ''; };
      const fill = txt => e(txt).replace(/\[\[(\d)\]\]/g, (m, n) => { const t = blankText(n); return `<span class="blank" aria-label="Espacio ${n}${t ? ': ' + e(t) : ''}">${n}${t ? ' · ' + e(t) : ''}</span>`; }).replace(/—\[(\d)\]—/g, '<b class="pos">[$1]</b>').replace(/\n/g, '<br>');
      if (p.kind === 'table') return `<div class="passage"><div class="small mute">${e(p.label || '')}</div><div class="ttl">${e(p.title)}</div>${(p.meta || []).map(m => `<div class="small">${e(m)}</div>`).join('')}<div class="table-wrap"><table><thead><tr>${p.columns.map(c => `<th>${e(c)}</th>`).join('')}</tr></thead><tbody>${p.rows.map(r => `<tr>${r.map(c => `<td>${e(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${(p.notes || []).map(n => `<p class="small" style="margin:6px 0 0">• ${e(n)}</p>`).join('')}</div>`;
      if (p.kind === 'chat') return `<div class="passage chat"><div class="small mute">${e(p.label || 'messages')}</div>${p.messages.map(([t, who, msg]) => `<div class="msg"><div class="small"><b>${e(who)}</b> <span class="mute">[${e(t)}]</span></div><div>${e(msg)}</div></div>`).join('')}</div>`;
      return `<div class="passage"><div class="small mute">${e(p.label || '')}</div>${p.header ? `<div class="hdr">${p.header.map(([k, v]) => `<div><b>${e(k)}:</b> ${e(v)}</div>`).join('')}</div>` : ''}${p.title ? `<div class="ttl">${e(p.title)}</div>` : ''}${p.body.map(par => `<p>${fill(par)}</p>`).join('')}</div>`;
    }
    function passagesHTML(unit, answers) { const ps = unit.passages; return `<div class="grid ${ps.length > 1 ? 'g2' : ''}" style="margin-bottom:6px">${ps.map(p => passageBlock(p, unit, answers)).join('')}</div>`; }
    function questionHTML(it, ans, f, k, n, opt) {
      opt = opt || {};
      const chosen = (f && f.chosen) || (ans && ans.opt) || null;
      const lettersOnly = it.part <= 2 && !f;
      const order = it.options.map(o => o.id);
      const btns = order.map((oid, j) => {
        const text = f ? (f.options.find(o => o.id === oid) || {}).text : (it.options[j] && it.options[j].text);
        let cls = 'opt'; if (f) { if (oid === f.correct) cls += ' right'; else if (oid === chosen) cls += ' wrong'; }
        const lbl = lettersOnly ? `Opción ${LETTERS[j]}` : `Opción ${LETTERS[j]}: ${text}`;
        return `<button class="${cls}" data-act="pick" data-item="${it.item_id}" data-opt="${oid}" aria-pressed="${oid === chosen}" aria-label="${e(lbl)}${f && oid === f.correct ? ' (correcta)' : ''}" ${f ? 'aria-disabled="true"' : ''}><span class="L" aria-hidden="true">${LETTERS[j]}</span>${lettersOnly ? '' : `<span>${e(text)}</span>`}</button>`;
      }).join('');
      const num = opt.number ? `<span class="mute">${opt.number}.</span> ` : (n > 1 ? `<span class="mute">${k + 1}.</span> ` : '');
      const stem = it.part === 1 ? 'Elegí la frase que mejor describe la fotografía.' : it.part === 2 ? 'Elegí la mejor respuesta.' : it.part === 6 ? `Espacio ${it.blank}${/sentence/i.test(it.stem || '') ? ' · ' + it.stem : ''}` : it.stem;
      let fbh = '';
      if (f) {
        const d = !f.ok && chosen && (f.distractors || {})[chosen];
        fbh = `<div class="fb ${f.ok ? 'ok' : 'bad'}" role="status"><b>${f.ok ? 'Correcto.' : chosen ? 'Incorrecto.' : (f.state === 'INTERRUMPIDA' ? 'Interrumpida (no cuenta).' : 'Sin responder.')}</b> ${e(f.explanation)}${d ? `<div style="margin-top:6px"><b>Por qué no ${LETTERS[order.indexOf(chosen)]}:</b> ${e(d.why)}<br><b class="cat">${e(CAT[d.cat])}</b></div>` : ''}
          ${!f.ok ? `<details class="more"><summary>Por qué fallan las otras opciones</summary>${order.filter(x => x !== f.correct).map(x => `<p class="small"><b>${LETTERS[order.indexOf(x)]}.</b> ${e((f.distractors[x] || {}).why)}</p>`).join('')}</details>` : ''}
          ${f.strategy ? `<div class="small" style="margin-top:6px"><b>Estrategia:</b> ${e(f.strategy)}</div>` : ''}<div class="small mute" style="margin-top:4px">Habilidad: ${e(f.subskill || '')}</div></div>`;
      }
      return `<div class="q" data-item-id="${e(it.item_id)}" role="group" aria-labelledby="st-${it.item_id}"><div class="stem" id="st-${it.item_id}">${num}${e(stem).replace(/\n/g, '<br>')}</div><div class="opts ${lettersOnly ? 'letters' + (order.length === 3 ? ' n3' : '') : ''}">${btns}</div>${fbh}${publicQA ? `<button type="button" class="btn ghost qa-report" data-act="qa-report" data-item="${e(it.item_id)}" data-part="${it.part}" data-form="${e(it.item_id.split('-')[0])}">¿Algo está mal? Reportalo</button>` : ''}</div>`;
    }
    function afterHTML(f) {
      let h = '';
      if (f.transcript) h += `<details class="more" open><summary>Transcripción</summary><div class="transcript">${f.transcript.filter(s => s.t).map(s => `<p><span class="spk">${e(voiceLabel(s.v))}:</span>${e(s.t)}</p>`).join('')}</div><p class="small mute">Voces sintéticas (Kokoro-82M), no grabaciones de personas.</p></details>`;
      if (f.image_desc) h += `<p class="small"><b>La imagen:</b> ${e(f.image_desc)}</p>`;
      const conf = f.items.flatMap(i => i.confusion || []); if (conf.length) h += `<details class="more"><summary>Palabras que suelen confundir</summary>${conf.map(([w, x]) => `<p class="small"><b>${e(w)}</b> — ${e(x)}</p>`).join('')}</details>`;
      if ((f.vocabulary || []).length) h += `<details class="more"><summary>Vocabulario del ejercicio</summary>${f.vocabulary.map(([w, x]) => `<p class="small"><b>${e(w)}</b> — ${e(x)}</p>`).join('')}</details>`;
      return h;
    }

    /* ── simulacros ── */
    async function viewSims() {
      const me = A.me || await loadMe(); if (!me.ok) return frame('simulacros', `<h1>Simulacros</h1>${notice(me)}`);
      const d = await call('dashboard'); const hist = d.ok ? d.report.history.filter(h => isSim(h.tipo)) : [];
      const open = d.ok ? d.report.open.find(o => isSim(o.tipo)) : null;
      const forms = me.forms.filter(f => f.sim);
      frame('simulacros', `<h1>Simulacros</h1><div id="msg"></div>
        <div class="note" style="margin-bottom:14px">Sin pausa: el reloj vive en el servidor y sigue corriendo aunque cierres la pestaña. Si la página se recarga, tus respuestas se conservan; en Listening, el audio interrumpido no se repite y sus preguntas no cuentan. La corrección aparece al final.</div>
        ${open ? `<div class="note warn">Tenés un simulacro en curso: ${e(open.title)} <button class="btn" data-act="open-attempt" data-id="${open.attempt_id}" data-tipo="${open.tipo}">Continuar</button></div>` : ''}
        ${forms.length ? forms.map(f => `<h2 style="margin-top:14px">Forma ${f.form} ${f.sim_ready ? '' : '<span class="pill bad">incompleta o sin publicar</span>'}</h2>${f.exposure.seen ? `<p class="small"><span class="pill draft">Ya viste ${f.exposure.seen} de ${f.total} preguntas de esta forma</span> El resultado no será “en frío”.</p>` : ''}
          <div class="grid g3"><div class="card"><h3>Sección Listening</h3><p>100 preguntas (Partes 1–4) · audio continuo de unos ${fmtDur(listeningSeconds(f.form))}.</p><button class="btn red" data-act="start" data-tipo="sim_listening" data-form="${f.form}" ${f.sim_ready ? '' : 'disabled'}>Comenzar</button></div>
          <div class="card"><h3>Sección Reading</h3><p>100 preguntas (Partes 5–7) · 75 minutos. Podés moverte entre preguntas y marcarlas.</p><button class="btn red" data-act="start" data-tipo="sim_reading" data-form="${f.form}" ${f.sim_ready ? '' : 'disabled'}>Comenzar</button></div>
          <div class="card"><h3>Simulacro integral</h3><p>200 preguntas · Listening completo y luego Reading de 75 minutos (unas 2 horas).</p><button class="btn red" data-act="start" data-tipo="sim_full" data-form="${f.form}" ${f.sim_ready ? '' : 'disabled'}>Comenzar</button></div></div>`).join('') : '<p class="mute">Tu acceso no incluye simulacros todavía.</p>'}
        <h2 style="margin-top:18px">Simulacros anteriores</h2>${hist.map(h => `<div class="card tight" style="margin-bottom:8px"><a href="#resultado-${h.attempt_id}" data-go="resultado" data-arg="${h.attempt_id}">${e(h.title)}</a> · ${fmtDT(h.finished)} · ${h.ok}/${h.n} (${pct(h.ok, h.n)} %)${h.timeout ? ' · terminado por tiempo' : ''}${h.interrupted ? ` · ${h.interrupted} interrumpidas` : ''}</div>`).join('') || '<p class="mute">Ninguno todavía.</p>'}`);
    }
    function listeningSeconds(f) { const c = (root.EPL_AUDIO || {}).clips || {}; return Object.values(c).filter(x => x.form === f).reduce((s, x) => s + x.seconds, 0) + ['P1', 'P2', 'P3', 'P4'].reduce((s, p) => s + ((c['DIR-' + p] || {}).seconds || 0), 0); }
    let simAudio = null;
    function silentWav() { const n = 2400, b = new ArrayBuffer(44 + n * 2), v = new DataView(b); const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0))); w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 24000, true); v.setUint32(28, 48000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true); return URL.createObjectURL(new Blob([b], { type: 'audio/wav' })); }
    function unlockAudio() { if (!simAudio) simAudio = new Audio(); try { simAudio.src = silentWav(); const p = simAudio.play(); if (p) p.catch(() => {}); } catch (_) {} }
    async function preload(urls) {
      const fails = [];
      await Promise.all(urls.map(u => new Promise(res => { const a = new Audio(); let done = false; const fin = ok => { if (done) return; done = true; if (!ok) fails.push(u); res(); }; a.preload = 'auto'; a.addEventListener('canplaythrough', () => fin(true)); a.addEventListener('error', () => fin(false)); setTimeout(() => fin(a.readyState >= 3), 20000); a.src = u; a.load(); })));
      return fails;
    }
    async function viewSim(id) {
      const r = await getAttempt(id);
      if (r.finished) return go('resultado', id);
      if (!r.ok) return frame('simulacros', `<h1>Simulacro</h1>${notice(r)}`);
      const at = r.attempt; A.skew = at.server_now - Date.now();
      const LU = at.units.filter(u => u.part <= 4);
      if (LU.length && !at.reading_started && at.listening_cursor < LU.length && at.tipo !== 'sim_reading') return simListening(at, LU);
      if (at.tipo === 'sim_listening') { await call('finish', { attempt_id: id }); A.att = null; return go('resultado', id); }
      if (at.tipo === 'sim_full' && !at.reading_started) return frame('simulacros', `<h1>${e(at.title)}</h1><div class="card"><h2>Listening terminado</h2><p>Sigue Reading: 100 preguntas en <b>75 minutos</b>. El reloj empieza cuando toques el botón y no se puede pausar.</p><button class="btn red" data-act="start-reading" data-id="${id}" data-primary>Comenzar Reading</button></div>`);
      return simReading(at);
    }
    async function simListening(at, LU) {
      const id = at.attempt_id; const k = at.listening_cursor;
      if (at.cursor_started && A.live.simUnit !== id + ':' + k) return frame('simulacros', `<h1>${e(at.title)}</h1><div class="note warn" role="alert">La página se recargó mientras sonaba un audio. Como en el examen, ese audio no se repite: sus preguntas quedan <b>interrumpidas</b> y no cuentan. Tus respuestas anteriores están guardadas.</div><p><button class="btn red" data-act="sim-interrupted" data-id="${id}" data-k="${k}" data-primary>Continuar con el siguiente audio</button></p>`);
      if (!A.live['pre:' + id]) return frame('simulacros', `<h1>${e(at.title)}</h1><div class="card"><p>Antes de empezar se comprueba que carguen los ${LU.length} audios. Usá audífonos. El audio no se puede pausar ni repetir.</p><button class="btn red" data-act="sim-begin" data-id="${id}" data-primary>Comprobar audios y comenzar</button> <div id="pre-msg" class="small" role="status"></div></div>`);
      const u = LU[k]; const all = at.units.flatMap(x => x.items.map(i => i.item_id)); const n0 = all.indexOf(u.items[0].item_id) + 1;
      let body = '';
      if (u.part === 1) body += `<div class="photo"><img src="${e(asset(u.image))}" alt="Fotografía de la pregunta ${n0}"></div>`;
      if (u.graphic) body += graphicHTML(u.graphic);
      body += u.items.map((it, j) => questionHTML(it, (at.answers || {})[it.item_id], null, j, u.items.length, { number: n0 + j })).join('');
      frame('simulacros', `<div class="qhead"><div><h1 style="margin:0">${e(at.title)}</h1><div class="small mute">Parte ${u.part} · ${EPL.PART_NAMES[u.part]} · pregunta${u.items.length > 1 ? 's' : ''} ${n0}${u.items.length > 1 ? '–' + (n0 + u.items.length - 1) : ''} de ${at.total_items}</div></div><span class="timer" id="timer"></span></div>
        <div class="player"><span class="small"><b>Audio en curso</b> · no se puede pausar ni repetir</span><div class="bar" aria-hidden="true"><i id="pl-bar"></i></div><span id="pl-status" class="small mute" role="status"></span></div><div id="msg"></div>${u.intro ? `<p class="dir">${e(u.intro)}</p>` : ''}${body}<div class="sticky-actions"><span class="small mute">El simulacro avanza solo al terminar cada audio.</span></div>`);
      const tick = () => { const t = $('#timer'); if (t) t.textContent = fmtTime((Date.now() + (A.skew || 0) - at.created) / 1000); }; tick(); A.timers.push(setInterval(tick, 1000));
      const cur = await call('cursor', { attempt_id: id, index: k });
      if (!cur.ok && cur.error !== 'cursor_invalido') return frame('simulacros', notice(cur));
      A.live.simUnit = id + ':' + k; at.cursor_started = true; at.listening_cursor = k;
      const prevPart = k > 0 ? LU[k - 1].part : 0;
      const dirClip = u.part !== prevPart ? ((root.EPL_AUDIO || {}).clips || {})['DIR-P' + u.part] : null;
      if (!simAudio) simAudio = new Audio();
      const a = A.audio = simAudio; a._dead = false; a.onended = a.onerror = a.ontimeupdate = null;
      const st = $('#pl-status'), bar = $('#pl-bar');
      const next = () => { A.live.simUnit = null; at.cursor_started = false; at.listening_cursor = k + 1; A.att = at; return k + 1 >= LU.length ? viewSim(id) : simListening(at, LU); };
      const playMain = () => {
        a.src = asset(u.audio); a.ontimeupdate = () => { if (!a._dead && bar) bar.style.width = (a.currentTime / (a.duration || 1) * 100) + '%'; };
        a.onended = () => { if (!a._dead) next(); };
        a.onerror = async () => { if (a._dead || !a.getAttribute('src')) return; if (st) st.textContent = 'Falló la reproducción: estas preguntas quedan interrumpidas.'; await call('cursor', { attempt_id: id, index: k, interrupted: true }); A.live.simUnit = null; at.cursor_started = false; at.listening_cursor = k + 1; setTimeout(() => (k + 1 >= LU.length ? viewSim(id) : simListening(at, LU)), 2000); };
        a.play().then(() => { if (st) st.textContent = 'Reproduciendo…'; }).catch(() => { if (st) st.innerHTML = 'El navegador bloqueó el audio. <button class="btn" data-act="sim-unblock">Reproducir</button>'; });
      };
      if (dirClip) { a.src = asset(dirClip.file); if (st) st.textContent = `Instrucciones de la Parte ${u.part}…`; a.onended = () => { if (!a._dead) playMain(); }; a.onerror = () => { if (!a._dead) playMain(); }; a.play().catch(() => playMain()); }
      else playMain();
    }
    function simReading(at) {
      const id = at.attempt_id; const RU = at.units.filter(u => u.part >= 5);
      A.flags[id] = A.flags[id] || (() => { try { return JSON.parse(localStorage.getItem('epl_flags_' + id) || '{}'); } catch (_) { return {}; } })();
      const flags = A.flags[id]; const all = at.units.flatMap(x => x.items.map(i => i.item_id)); const base = at.tipo === 'sim_reading' ? 100 : 0; const numOf = iid => base + all.indexOf(iid) + 1;
      const idx = Math.max(0, Math.min(A.live['ri:' + id] || 0, RU.length - 1)); const u = RU[idx];
      const answers = at.answers || {};
      let body = '';
      if (u.passages) body += passagesHTML(u, answers);
      body += u.items.map((it, j) => questionHTML(it, answers[it.item_id], null, j, u.items.length, { number: numOf(it.item_id) })).join('');
      const pal = RU.map((x, j) => x.items.map(it => `<button data-act="goto" data-idx="${j}" data-item="${it.item_id}" class="${answers[it.item_id] ? 'done' : ''} ${j === idx ? 'cur' : ''} ${flags[it.item_id] ? 'flag' : ''}" aria-label="Pregunta ${numOf(it.item_id)}${answers[it.item_id] ? ', respondida' : ''}${flags[it.item_id] ? ', marcada' : ''}">${numOf(it.item_id)}</button>`).join('')).join('');
      frame('simulacros', `<div class="qhead"><div><h1 style="margin:0">${e(at.title)}</h1><div class="small mute">Parte ${u.part} · ${EPL.PART_NAMES[u.part]}</div></div><span class="timer" id="timer" aria-live="off"></span></div><div id="msg"></div>
        <details class="card tight" style="margin-bottom:10px" ${A.live.palOpen ? 'open' : ''}><summary><b>Mapa de preguntas</b> <span class="small mute" id="ans-count"></span></summary><div class="palette" style="margin-top:8px">${pal}</div></details>
        <div class="row" style="justify-content:flex-end;margin-bottom:6px"><button class="btn ghost" data-act="flag" data-id="${id}">${u.items.some(it => flags[it.item_id]) ? 'Quitar marca' : 'Marcar para revisar'}</button></div>
        ${u.intro ? `<p class="dir">${e(u.intro)}</p>` : ''}${body}
        <div class="sticky-actions"><button class="btn ghost" data-act="sim-move" data-d="-1" ${idx ? '' : 'disabled'}>Anterior</button><button class="btn ghost" data-act="sim-move" data-d="1" ${idx + 1 < RU.length ? '' : 'disabled'}>Siguiente</button><button class="btn red" data-act="sim-submit" data-id="${id}">Entregar</button></div>`);
      const c = $('#ans-count'); if (c) c.textContent = `${RU.flatMap(x => x.items).filter(it => answers[it.item_id]).length} de ${RU.reduce((s, x) => s + x.items.length, 0)} respondidas`;
      const tick = async () => {
        const t = $('#timer'); if (!t) return; const left = (at.reading_deadline - (Date.now() + (A.skew || 0))) / 1000;
        t.textContent = fmtTime(left); t.classList.toggle('low', left < 300);
        if (Math.round(left) === 300) live('Quedan 5 minutos.');
        if (left <= 0 && !A.live['fin:' + id]) { A.live['fin:' + id] = 1; await flushQueue(); await call('finish', { attempt_id: id }); A.att = null; go('resultado', id); }
      };
      tick(); A.timers.push(setInterval(tick, 1000));
    }

    /* ── resultados, errores, reportes ── */
    async function viewResult(id) {
      const r = await call('result', { attempt_id: id }); if (!r.ok) return frame('panel', `<h1>Resultado</h1>${notice(r)}`);
      const s = r.result; const sim = isSim(s.tipo);
      const parts = Object.entries(s.byPart || {}), cats = Object.entries(s.byCat || {}).sort((a, b) => b[1] - a[1]);
      const subs = Object.entries(s.bySubskill || {}).filter(([, v]) => v.n >= 2).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n).slice(0, 6);
      const review = r.review;
      const all = review.flatMap(x => x.unit.items.map(i => i.item_id)); const numOf = iid => (s.tipo === 'sim_reading' ? 101 : 1) + all.indexOf(iid);
      frame(sim ? 'simulacros' : (isCand() ? 'entrenar' : 'banco'), `<h1>${s.tipo === 'diagnostic' ? 'Resultado del diagnóstico' : 'Resultado'}</h1>
        <div class="grid g3"><div class="card"><div class="mute small">${e(s.title)}</div><div class="kpi">${s.ok}/${s.n} <small>${s.n ? pct(s.ok, s.n) + ' % de aciertos' : ''}</small></div><div class="small mute">${fmtDT(s.finished)} · ${fmtDur(s.seconds)}</div>${s.timeout ? '<div class="pill bad">Terminado por tiempo</div>' : ''}${s.unanswered ? `<div class="small">Sin responder: ${s.unanswered}</div>` : ''}${s.interrupted ? `<div class="small">Interrumpidas (no cuentan): ${s.interrupted}</div>` : ''}</div>
          <div class="card"><h2>Por parte</h2><div class="bars">${parts.map(([p, v]) => `<div class="r"><span>Parte ${p}</span><div class="bar"><i style="width:${pct(v.ok, v.n) || 0}%"></i></div><span>${v.ok}/${v.n}</span></div>`).join('')}</div></div>
          <div class="card"><h2>Tipos de error</h2>${cats.length ? cats.map(([c, n]) => `<div class="small">${e(CAT[c] || c)}: <b>${n}</b></div>`).join('') : '<p class="mute small">Sin errores.</p>'}${subs.length ? `<h3 style="margin-top:10px">Habilidades más débiles</h3>${subs.map(([k, v]) => `<div class="small">${e(k)}: ${v.ok}/${v.n}</div>`).join('')}` : ''}</div></div>
        ${s.tipo === 'diagnostic' ? `<div class="note" style="margin-top:14px">${publicQA ? 'Diagnóstico de 25 preguntas: ' : 'Diagnóstico de 20 preguntas: '}${publicQA ? (s.n && s.ok / s.n >= .8 ? 'Aciertos altos en esta muestra.' : s.n && s.ok / s.n >= .6 ? 'Aciertos medios en esta muestra.' : s.n && s.ok / s.n >= .4 ? 'Aciertos parciales en esta muestra.' : 'En esta muestra, conviene practicar las bases.') : ''} Este resultado <b>no equivale a un nivel MCER/CEFR ni a un puntaje TOEIC</b>, y no afecta el historial de la Academia.</div>` : ''}
        <h2 style="margin-top:18px">Revisión pregunta por pregunta</h2>
        ${[1, 2, 3, 4, 5, 6, 7].filter(p => review.some(x => x.unit.part === p)).map(p => `<details class="card" style="margin-bottom:8px" ${review.length <= 12 ? 'open' : ''}><summary><b>Parte ${p} · ${EPL.PART_NAMES[p]}</b> · ${(s.byPart[p] || { ok: 0 }).ok}/${(s.byPart[p] || { n: 0 }).n}</summary>
          ${review.filter(x => x.unit.part === p).map(x => `<div style="margin-top:10px">${x.unit.passages ? passagesHTML(x.unit, {}) : ''}${x.unit.graphic ? graphicHTML(x.unit.graphic) : ''}${x.unit.part === 1 ? `<div class="photo" style="max-width:320px"><img src="${e(asset(x.unit.image))}" alt="${e(x.feedback.image_desc || '')}"></div>` : ''}
            ${x.unit.items.map((it, j) => questionHTML(it, null, x.feedback.items.find(f => f.item_id === it.item_id), j, x.unit.items.length, sim ? { number: numOf(it.item_id) } : {})).join('')}${afterHTML(x.feedback)}</div>`).join('')}</details>`).join('')}
        <p>${isCand() ? '<a class="btn" href="#panel" data-go="panel">Volver al panel</a> <a class="btn ghost" href="#errores" data-go="errores">Repaso de errores</a>' : '<a class="btn" href="#banco" data-go="banco">Volver al banco</a>'}</p>`);
      if (publicQA && isCand()) {
        const area = document.createElement('div');
        area.className = 'card';
        area.style.margin = '10px 0 16px';
        area.innerHTML = '<h2>' + (s.tipo === 'diagnostic' ? '¡Bien! Ahora podés revisar las 400 preguntas' : '¿Seguimos con la siguiente sección?') + '</h2>' +
          '<p>Las formas A y B tienen 200 preguntas cada una. Avanzá por bloques y reportá cualquier problema.</p>' +
          '<button class="btn red" data-act="start-next-qa">Continuar con el siguiente bloque</button> <a class="btn ghost" href="#ruta" data-go="ruta" data-arg="">Ver mi avance</a>';
        el.prepend(area);
      }
    }
    async function viewErrors() {
      const q = await call('reviewQueue'); if (!q.ok) return frame('errores', `<h1>Repaso de errores</h1>${notice(q)}`);
      const due = q.cards.filter(c => c.estado !== 'DOMINADO' && c.due <= q.server_now), pend = q.cards.filter(c => c.estado !== 'DOMINADO');
      frame('errores', `<h1>Repaso de errores</h1><div id="msg"></div><p>Cada error vuelve después de 1, 3, 7, 14 y 30 días si lo respondés bien; si fallás, vuelve a empezar. Tres aciertos seguidos lo dan por dominado.</p>
        <div class="row" style="margin-bottom:14px"><button class="btn red" data-act="start" data-tipo="review" data-due="1" ${due.length ? '' : 'disabled'}>Repasar los de hoy (${due.length})</button><button class="btn ghost" data-act="start" data-tipo="review" ${pend.length ? '' : 'disabled'}>Repasar todos los pendientes (${pend.length})</button></div>
        ${q.cards.length ? `<div class="table-wrap"><table><thead><tr><th>Pregunta</th><th>Habilidad</th><th>Último error</th><th>Intentos</th><th>Estado</th><th>Próximo repaso</th></tr></thead><tbody>${q.cards.map(c => `<tr><td><b>${e(c.item_id)}</b><div class="small mute">${e(c.stem ? c.stem.slice(0, 70) : 'Parte ' + c.part + ' (audio)')}</div></td><td class="small">${e(c.subskill || '')}</td><td class="small">${e(c.last_category ? CAT[c.last_category] : '—')}</td><td>${c.tries}</td><td><span class="pill ${c.estado === 'DOMINADO' ? 'ok' : c.estado === 'EN_REPASO' ? '' : 'bad'}">${e(c.estado.replace('_', ' ').toLowerCase())}</span></td><td class="small">${c.estado === 'DOMINADO' ? '—' : c.due <= q.server_now ? '<b>hoy</b>' : fmtD(c.due)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="mute">Todavía no hay errores registrados.</p>'}`);
    }
    function reportHTML(rep) {
      const cats = Object.entries(rep.byCat).sort((a, b) => b[1] - a[1]);
      const subs = Object.entries(rep.bySubskill).filter(([, v]) => v.n >= 2).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n);
      return `<div class="grid g2"><div class="card"><h2>Por habilidad</h2><div class="bars">${['listening', 'reading'].map(k => { const v = rep.bySkill[k]; return `<div class="r"><span>${k === 'listening' ? 'Listening' : 'Reading'}</span><div class="bar"><i style="width:${pct(v.ok, v.n) || 0}%"></i></div><span>${v.n ? pct(v.ok, v.n) + ' %' : '—'}</span></div>`; }).join('')}</div>
          <h3 style="margin-top:12px">Por parte</h3><div class="bars">${[1, 2, 3, 4, 5, 6, 7].map(p => { const v = rep.byPart[p]; return `<div class="r"><span>${p} · ${EPL.PART_NAMES[p]}</span><div class="bar"><i style="width:${pct(v.ok, v.n) || 0}%"></i></div><span>${v.n ? pct(v.ok, v.n) + ' %' : '—'}</span></div>`; }).join('')}</div>
          <p class="small mute">Respuestas: ${rep.answered} · Días con práctica: ${rep.days} · Tiempo: ${fmtDur(rep.seconds)} · Aciertos al primer intento: ${rep.first_try.n ? pct(rep.first_try.ok, rep.first_try.n) + ' %' : '—'}</p></div>
        <div class="card"><h2>Errores frecuentes</h2>${cats.length ? `<div class="bars">${cats.map(([c, n]) => `<div class="r"><span>${e(CAT[c] || c)}</span><div class="bar"><i style="width:${Math.round(n / cats[0][1] * 100)}%;background:var(--red)"></i></div><span>${n}</span></div>`).join('')}</div>` : '<p class="mute">Sin errores.</p>'}
          <h3 style="margin-top:12px">Subhabilidades más débiles</h3>${subs.slice(0, 8).map(([k, v]) => `<div class="small">${e(k)}: ${v.ok}/${v.n} (${pct(v.ok, v.n)} %)</div>`).join('') || '<p class="mute small">Hacen falta al menos 2 respuestas por subhabilidad.</p>'}</div></div>
        <div class="card" style="margin-top:14px"><h2>Historial completo</h2>${rep.history.length ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Actividad</th><th>Tipo</th><th>Correctas</th><th>%</th><th>Tiempo</th></tr></thead><tbody>${rep.history.map(h => `<tr><td>${fmtDT(h.finished)}</td><td>${e(h.title)}</td><td class="small">${e(TYPE_LABEL[h.tipo] || h.tipo)}</td><td>${h.ok}/${h.n}</td><td>${pct(h.ok, h.n) ?? '—'}</td><td>${fmtDur(h.seconds)}</td></tr>`).join('')}</tbody></table></div><p class="small mute">Comparar porcentajes entre actividades distintas es orientativo: cambian las preguntas y la dificultad.</p>` : '<p class="mute">Sin actividades todavía.</p>'}</div>
        <div class="card" style="margin-top:14px"><h2>Recomendaciones</h2>${cats.slice(0, 3).map(([c]) => `<p><b>${e(CAT[c])}:</b> ${e(RECS[c] || '')}</p>`).join('') || '<p class="mute">Aparecerán cuando haya errores registrados.</p>'}</div>`;
    }
    async function viewReport() { const d = await call('dashboard'); if (!d.ok) return frame('reportes', `<h1>Reportes</h1>${notice(d)}`); frame('reportes', `<h1>Mi reporte</h1><p class="small mute">Porcentajes de práctica, no puntajes TOEIC.</p>${reportHTML(d.report)}`); }

    /* ════════ SUPERADMIN / ADMIN / DOCENTE ════════ */
    async function viewAdmin() {
      const l = await call('adminList'); if (!l.ok) return frame('candidatos', `<h1>Candidatos</h1>${notice(l)}`);
      const sup = role() === 'superadmin';
      frame('candidatos', `<h1>Candidatos de Exam Prep Lab</h1>
        <p class="small mute">El acceso es independiente de matrícula, grupo, pagos, convenio INA y CONAPE. No se crean grupos ni notas. Suspender no borra el historial.</p>
        ${sup ? `<div class="card"><h2>Buscar o registrar</h2><div class="row"><label class="sr" for="q">Buscar</label><input id="q" placeholder="Código, nombre o usuario" style="flex:1;min-width:220px;padding:8px"><button class="btn" data-act="search">Buscar</button></div><div id="search-out" style="margin-top:10px"></div>
          <details style="margin-top:10px"><summary>Registrar a alguien que no aparece en el Campus</summary><div class="grid g2" style="margin-top:8px"><label>Nombre completo<br><input id="r-nombre" style="width:100%"></label><label>Cédula (se guarda cifrada)<br><input id="r-cedula" style="width:100%"></label><label>Correo<br><input id="r-correo" style="width:100%"></label><label>Código del Campus (si tiene)<br><input id="r-codigo" style="width:100%"></label></div><button class="btn" data-act="register" style="margin-top:8px">Registrar candidato</button></details></div>` : '<p class="note small">Tu rol puede consultar, pero solo Superadmin habilita o suspende.</p>'}
        <div id="act-out"></div>
        <div class="card table-wrap" style="margin-top:14px"><table><thead><tr><th>Candidato</th><th>Tipo</th><th>Acceso</th><th>Actividad</th><th></th></tr></thead><tbody>${l.candidates.map(c => `<tr><td><b>${e(c.nombre)}</b><div class="small mute">${e(c.codigo)} ${c.usuario_campus ? '· usuario ' + e(c.usuario_campus) : c.cuenta_preparacion ? '· cuenta de preparación' : '· sin cuenta'}</div></td><td class="small">${e(c.tipo)}</td>
          <td>${c.acceso ? `<span class="pill ${c.acceso.estado === 'ACTIVO' ? 'ok' : 'bad'}">${e(c.acceso.estado)}</span><div class="small">práctica ${e(c.acceso.forms.join(','))} · sim ${e(c.acceso.sim_forms.join(','))}${c.acceso.hasta ? ' · hasta ' + e(c.acceso.hasta) : ''}</div>` : '<span class="pill">sin acceso</span>'}</td>
          <td class="small">${c.actividad.respuestas} respuestas · ${c.actividad.intentos} actividades<br>${c.actividad.ultima ? 'última ' + fmtD(c.actividad.ultima) : ''}</td>
          <td class="small"><a href="#candidato-${c.candidate_id}" data-go="candidato" data-arg="${c.candidate_id}">Ver</a></td></tr>`).join('') || '<tr><td colspan="5" class="mute">Sin candidatos todavía.</td></tr>'}</tbody></table></div>`);
    }
    async function viewCandidate(cid) {
      const r = await call('adminCandidateReport', { candidate_id: cid }); if (!r.ok) return frame('candidatos', `<h1>Candidato</h1>${notice(r)}`);
      const c = r.candidate; const sup = role() === 'superadmin'; const fs = r.forms_available || ['A'];
      const defP = fs.includes('B') ? 'B' : fs[0];
      frame(role() === 'teacher' ? 'mis-candidatos' : 'candidatos', `<h1>${e(c.nombre)}</h1><p class="small mute">${e(c.codigo)} · ${e(c.tipo)} ${c.cedula ? '· cédula ' + e(c.cedula) : ''} ${c.correo && role() !== 'teacher' ? '· ' + e(c.correo) : ''}</p>
        ${sup ? `<div class="card"><h2>Acceso</h2><p>Estado: <b>${e(c.acceso ? c.acceso.estado : 'SIN ACCESO')}</b></p>
          <div class="grid g3"><fieldset><legend>Formas de práctica</legend>${fs.map(f => `<label><input type="checkbox" name="pf" value="${f}" ${(c.acceso ? c.acceso.forms.includes(f) : f === defP) ? 'checked' : ''}> ${f}</label> `).join('')}</fieldset>
          <fieldset><legend>Formas de simulacro</legend>${fs.map(f => `<label><input type="checkbox" name="sf" value="${f}" ${(c.acceso ? c.acceso.sim_forms.includes(f) : f === 'A') ? 'checked' : ''}> ${f}</label> `).join('')}</fieldset>
          <label>Vence (opcional)<br><input type="date" id="g-hasta" value="${e(c.acceso && c.acceso.hasta || '')}"></label></div>
          <label>Motivo<br><input id="g-motivo" style="width:100%" placeholder="Ej.: cohorte piloto de egresados"></label>
          <p class="small mute">Recomendado: practicar con una forma y reservar la otra para el simulacro, así el simulacro mide “en frío”.</p>
          <div class="row"><button class="btn red" data-act="grant" data-id="${c.candidate_id}">${c.acceso && c.acceso.estado === 'ACTIVO' ? 'Actualizar acceso' : 'Habilitar'}</button>${c.acceso && c.acceso.estado === 'ACTIVO' ? `<button class="btn ghost" data-act="revoke" data-id="${c.candidate_id}">Suspender</button>` : ''}
          ${!c.usuario_campus ? `<button class="btn ghost" data-act="activation" data-id="${c.candidate_id}">${c.cuenta_preparacion ? 'Nuevo enlace (restablecer clave)' : 'Generar enlace de activación'}</button>` : '<span class="small mute">Entra con su usuario del Campus; no necesita otra cuenta.</span>'}</div>
          <div class="row" style="margin-top:8px"><label>Asignar docente (usuario)<br><input id="a-doc" placeholder="profe.demo"></label><button class="btn ghost" data-act="assign" data-id="${c.candidate_id}">Asignar</button></div><div id="act-out" style="margin-top:8px"></div></div>` : ''}
        <h2 style="margin-top:14px">Progreso</h2>${reportHTML(r.report)}`);
    }
    async function viewAudit() { const r = await call('adminAudit', { limit: 200 }); if (!r.ok) return frame('auditoria', notice(r)); frame('auditoria', `<h1>Auditoría</h1><div class="card table-wrap"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Sujeto</th><th>Detalle</th></tr></thead><tbody>${r.rows.map(x => `<tr><td class="small">${e(x.FECHA)}</td><td class="small">${e(x.USUARIO)} (${e(x.ROL)})</td><td>${e(x.ACCION)}</td><td class="small">${e(x.SUJETO)}</td><td class="small">${e(x.DETALLE)}</td></tr>`).join('')}</tbody></table></div>`); }
    async function viewConfig() {
      const r = await call('adminConfig', {}); if (!r.ok) return frame('config', notice(r));
      frame('config', `<h1>Configuración</h1><div class="card"><p>Entorno: <b>${e(r.config.ENV)}</b></p><p class="small">En <b>PRODUCCION</b> los candidatos solo reciben preguntas PUBLISHED. En <b>DEMO</b> también ven borradores (marcados). Usar DEMO con estudiantes reales los expondría a material sin revisar.</p>
        <button class="btn ghost" data-act="set-env" data-v="${r.config.ENV === 'DEMO' ? 'PRODUCCION' : 'DEMO'}">Cambiar a ${r.config.ENV === 'DEMO' ? 'PRODUCCION' : 'DEMO'}</button>
        <p class="small mute" style="margin-top:10px">Diagnóstico desde la forma: ${e(r.config.DIAGNOSTIC_FORM || 'primera forma de práctica del candidato')} · Práctica por defecto: ${e(r.config.DEFAULT_PRACTICE_FORMS)} · Simulacro por defecto: ${e(r.config.DEFAULT_SIM_FORMS)}</p></div>`);
    }
    async function viewTeacher() {
      const r = await call('teacherList'); if (!r.ok) return frame('mis-candidatos', notice(r));
      frame('mis-candidatos', `<h1>Mis candidatos</h1><p class="small mute">Solo ves a quienes la Academia te asignó. Sin datos financieros.</p><div class="card table-wrap"><table><thead><tr><th>Candidato</th><th>Listening</th><th>Reading</th><th>Actividad</th></tr></thead><tbody>${r.candidates.map(c => `<tr><td><a href="#candidato-${c.candidate_id}" data-go="candidato" data-arg="${c.candidate_id}">${e(c.nombre)}</a></td><td>${c.actividad.listening.n ? pct(c.actividad.listening.ok, c.actividad.listening.n) + ' %' : '—'}</td><td>${c.actividad.reading.n ? pct(c.actividad.reading.ok, c.actividad.reading.n) + ' %' : '—'}</td><td class="small">${c.actividad.respuestas} respuestas</td></tr>`).join('') || '<tr><td colspan="4" class="mute">Sin candidatos asignados.</td></tr>'}</tbody></table></div>`);
    }

    /* ════════ EDITORIAL ════════ */
    async function viewBank(arg) {
      const [form0, part, status] = (arg || (A.formsList || ['A'])[0]).split('~'); const form = form0 || 'A';
      const r = await call('editorItems', { form, part: part || '', status: status || '' }); if (!r.ok) return frame('banco', `<h1>Banco</h1>${notice(r)}`);
      // Validación calculada en el servidor: el navegador no necesita el banco completo.
      const fsAll = r.forms || [form]; A.formsList = fsAll; const V = r.validation || { errors: [], warnings: [], n_errors: 0, n_warnings: 0, composition: { ok: false, total: 0, errors: [] }, cross: { ok: true, errors: [] } };
      const val = { ok: V.n_errors === 0, errors: V.errors, warnings: V.warnings }; const fc = V.composition; const xf = V.cross;
      const allowed = { REVISOR: ['IN_REVIEW', 'APPROVED', 'DRAFT'], EDITOR: ['IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'DRAFT'] }[r.editor_role] || [];
      const issues = (val ? val.errors.concat(val.warnings) : []).concat(fc ? fc.errors.map(x => ({ sev: 'error', id: form, code: 'COMPOSICION', msg: x })) : []).concat(xf.errors.map(x => ({ sev: 'error', id: '*', code: 'ENTRE_FORMAS', msg: x })));
      frame('banco', `<h1>Banco y revisión editorial</h1>
        <div class="note warn small">Vista interna. Los estudiantes nunca reciben esta información. Todo ítem de IA requiere revisión humana antes de publicarse. Tu rol editorial: <b>${e(r.editor_role)}</b>.</div>
        <div class="row" style="margin:10px 0">${fsAll.map(f => `<a class="btn ${f === form ? '' : 'ghost'}" href="#banco-${f}" data-go="banco" data-arg="${f}">Forma ${f}</a>`).join('')}
          <label>Parte <select id="b-part">${['', 1, 2, 3, 4, 5, 6, 7].map(p => `<option value="${p}" ${String(p) === String(part || '') ? 'selected' : ''}>${p || 'todas'}</option>`).join('')}</select></label>
          <label>Estado <select id="b-status">${['', ...EPL.STATUSES].map(s => `<option ${s === (status || '') ? 'selected' : ''} value="${s}">${s || 'todos'}</option>`).join('')}</select></label><button class="btn ghost" data-act="bank-filter" data-form="${form}">Filtrar</button></div>
        <div class="grid g4"><div class="card"><div class="mute small">Forma ${e(form)} · ${e(r.version)}</div><div class="kpi">${r.total} <small>preguntas</small></div><div class="small">${Object.entries(r.counts).map(([k, v]) => `${k}: ${v}`).join(' · ')}</div></div>
          <div class="card"><div class="mute small">Validación técnica</div><div class="kpi">${val.ok ? '<span style="color:var(--ok)">0 errores</span>' : V.n_errors + ' <small>errores</small>'}</div><div class="small">${V.n_warnings} advertencias</div></div>
          <div class="card"><div class="mute small">Composición del examen</div><div class="kpi">${fc && fc.ok ? '<span style="color:var(--ok)">Completa</span>' : '<span style="color:var(--bad)">Incompleta</span>'}</div><div class="small">${fc ? fc.total : 0}/200${fc && fc.errors[0] ? ' · ' + e(fc.errors[0]) : ''}</div></div>
          <div class="card"><div class="mute small">Publicadas / aprobadas</div><div class="kpi">${r.counts.PUBLISHED || 0} <small>/ ${r.counts.APPROVED || 0}</small></div><div class="small">Entre formas: ${xf.ok ? 'sin repeticiones' : xf.errors.length + ' repeticiones'}</div></div></div>
        ${issues.slice(0, 30).map(x => `<div class="small"><span class="pill ${x.sev === 'error' ? 'bad' : 'draft'}">${x.sev}</span> ${e(x.id)} · ${e(x.code)} · ${e(x.msg)}</div>`).join('')}
        <div class="row" style="margin:12px 0"><span class="small">Con las seleccionadas:</span>${allowed.map(s => `<button class="btn ghost" data-act="set-status" data-s="${s}">→ ${s}</button>`).join('')}<input id="b-nota" placeholder="Nota de revisión (opcional)" style="flex:1;min-width:180px;padding:6px"><button class="btn ghost" data-act="preview">Vista previa como estudiante</button></div>
        <div id="act-out"></div>
        <div class="card table-wrap"><table><thead><tr><th><input type="checkbox" id="sel-all" aria-label="Seleccionar todas"></th><th>ID</th><th>Parte</th><th>Habilidad</th><th>Dif.</th><th>Clave</th><th>Estado</th><th>Revisora</th></tr></thead><tbody>${r.items.map(i => `<tr><td><input type="checkbox" class="sel" value="${e(i.item_id)}" aria-label="Seleccionar ${e(i.item_id)}"></td><td><details><summary>${e(i.item_id)}</summary>${itemDetail(i, r.groups)}</details></td><td>${i.part}</td><td class="small">${e(i.subskill || i.topic)}</td><td>${i.difficulty}</td><td>${LETTERS[i.options.findIndex(o => o.id === i.correct)]}</td><td><span class="pill ${i.review_status === 'PUBLISHED' ? 'ok' : i.review_status === 'DRAFT' ? 'draft' : ''}">${e(i.review_status)}</span></td><td class="small">${e(i.reviewer || '—')}</td></tr>`).join('')}</tbody></table></div>`);
      const sa = $('#sel-all'); if (sa) sa.addEventListener('change', () => el.querySelectorAll('.sel').forEach(x => { x.checked = sa.checked; }));
    }
    function itemDetail(i, groups) {
      const g = i.passage_group_id ? groups.find(x => x.passage_group_id === i.passage_group_id) : null;
      const audio = i.audio_asset || (g && g.audio_asset);
      return `<div class="small" style="max-width:640px;white-space:normal">${audio ? `<audio controls preload="none" src="${e(asset(audio))}" style="width:100%"></audio>` : ''}${i.image_asset ? `<img src="${e(asset(i.image_asset))}" alt="" style="max-width:280px;display:block">` : ''}
        ${g && g.script ? `<p><b>Guion:</b> ${g.script.map(s => e(s.t)).join(' / ')}</p>` : ''}${i.script ? `<p><b>Guion:</b> ${i.script.filter(s => s.t).map(s => e(s.t)).join(' / ')}</p>` : ''}
        ${i.stem ? `<p><b>Enunciado:</b> ${e(i.stem)}</p>` : ''}<ol type="A">${i.options.map(o => `<li ${o.id === i.correct ? 'style="font-weight:700"' : ''}>${e(o.text)}${o.id === i.correct ? ' ✓' : ` — <span class="mute">${e((i.distractors[o.id] || {}).cat)}: ${e((i.distractors[o.id] || {}).why)}</span>`}</li>`).join('')}</ol>
        <p><b>Explicación:</b> ${e(i.explanation)}</p><p class="mute">${e(i.source_type)} · ${e(i.author)} · v${e(i.version)} · ${e(i.license)}</p></div>`;
    }

    /* ── activación pública ── */
    async function viewActivate(token) {
      const info = await A.api.callPublic('activationInfo', { token });
      if (!info.ok) return frame('', `<h1>Activar acceso</h1>${notice(info)}`);
      frame('', `<h1>Activá tu acceso a Exam Prep Lab</h1><div class="card" style="max-width:520px"><p>Hola${info.nombre ? ', ' + e(info.nombre) : ''}. Elegí un usuario y una clave. El enlace sirve una sola vez.</p>
        <label>Usuario<br><input id="ac-u" autocomplete="username" style="width:100%"></label><label>Clave (mínimo 8, con letras y números)<br><input id="ac-p" type="password" autocomplete="new-password" style="width:100%"></label><label>Repetí la clave<br><input id="ac-p2" type="password" autocomplete="new-password" style="width:100%"></label>
        <p><button class="btn red" data-act="activate" data-token="${e(token)}">Activar</button></p><div id="act-out" role="status"></div></div>`);
    }

    /* ── eventos ── */
    async function onClick(ev) {
      const g = ev.target.closest('[data-go]');
      if (g && (A.embedded || g.dataset.arg !== undefined)) { ev.preventDefault(); return go(g.dataset.go, g.dataset.arg); }
      const t = ev.target.closest('[data-act]'); if (!t || !el.contains(t) || t.disabled || t.getAttribute('aria-disabled') === 'true') return;
      const act = t.dataset.act; const out = $('#act-out');
      if (act === 'start-next-qa' && publicQA) return startNextPublicBlock();
      if (act === 'qa-report' && publicQA && typeof opts.onReport === 'function') return opts.onReport({ item_id: t.dataset.item, part: Number(t.dataset.part), attempt_id: A.att && A.att.attempt_id || null, form: t.dataset.form || (A.att && A.att.form) || null });
      if (act === 'start') { if (t.dataset.tipo === 'sim_listening' || t.dataset.tipo === 'sim_full') unlockAudio(); return startAttempt({ tipo: t.dataset.tipo, part: t.dataset.part, form: t.dataset.form, only_due: !!t.dataset.due }); }
      if (act === 'start-train') return startAttempt({ tipo: 'practice', part: $('#t-part').value, size: Number($('#t-size').value), difficulty: $('#t-diff').value, topic: $('#t-topic').value });
      if (act === 'open-attempt') { A.att = null; A.live = {}; return go(isSim(t.dataset.tipo) ? 'simulacro' : 'sesion', t.dataset.id); }
      if (act === 'leave') return go(isCand() ? 'panel' : 'banco');
      if (act === 'pick') {
        const at = A.att; if (!at) return;
        const iid = t.dataset.item; const prev = (at.answers[iid] || {}).opt; at.answers[iid] = { opt: t.dataset.opt };
        t.parentNode.querySelectorAll('.opt').forEach(b => b.setAttribute('aria-pressed', String(b === t)));
        const pb = el.querySelector(`.palette [data-item="${iid}"]`); if (pb) pb.classList.add('done');
        const c0 = $('[data-act=check]'); if (c0) { const u = at.units.find(x => x.unit_id === c0.dataset.unit); c0.disabled = !u.items.every(i => at.answers[i.item_id]); }
        const cnt = $('#ans-count'); if (cnt) { const RU = at.units.filter(u => u.part >= 5); cnt.textContent = `${RU.flatMap(x => x.items).filter(it => at.answers[it.item_id]).length} de ${RU.reduce((s, x) => s + x.items.length, 0)} respondidas`; }
        const saveAnswer = () => call('answer', { attempt_id: at.attempt_id, item_id: iid, option: t.dataset.opt });
        const r = await (publicQA ? (publicAnswerWrites = publicAnswerWrites.then(saveAnswer, saveAnswer)) : saveAnswer());
        if (!r.ok) { if (prev) at.answers[iid] = { opt: prev }; else delete at.answers[iid]; t.setAttribute('aria-pressed', 'false'); live(r.mensaje || r.error); const box = $('#msg'); if (box) box.innerHTML = notice(r); if (r.error === 'tiempo_agotado' || r.error === 'intento_cerrado') { A.att = null; setTimeout(() => go('resultado', at.attempt_id), 1200); } }
        return;
      }
      if (act === 'check') {
        const originalLabel = t.textContent;
        const choiceButtons = publicQA ? [...el.querySelectorAll('.q .opt')] : [];
        if (publicQA) {
          t.disabled = true;
          t.textContent = 'Guardando respuestas…';
          choiceButtons.forEach(button => { button.disabled = true; });
          await publicAnswerWrites;
          await flushQueue();
          if (readQ().some(item => item.attempt_id === A.att.attempt_id)) {
            t.disabled = false;
            t.textContent = originalLabel;
            choiceButtons.forEach(button => { button.disabled = false; });
            return live('Hay respuestas pendientes de guardar. Revisá la conexión e intentá otra vez.');
          }
          t.textContent = originalLabel;
        }
        const r = await call('reveal', { attempt_id: A.att.attempt_id, unit_id: t.dataset.unit });
        if (!r.ok) {
          if (publicQA) {
            t.disabled = false;
            choiceButtons.forEach(button => { button.disabled = false; });
          }
          const box = $('#msg'); if (box) box.innerHTML = notice(r);
          return live(r.mensaje);
        }
        A.att.feedback = (A.att.feedback || []).concat([r.feedback]);
        A.showFeedback = t.dataset.unit;
        await viewSession(A.att.attempt_id);
        const ok = r.feedback.items.filter(i => i.ok).length;
        return live(`${ok} de ${r.feedback.items.length} correctas. Las explicaciones están debajo de cada pregunta.`);
      }
      if (act === 'next') { A.showFeedback = null; return viewSession(A.att.attempt_id); }
      if (act === 'skip-unit') { const r = await call('skip', { attempt_id: A.att.attempt_id, unit_id: t.dataset.unit, motivo: 'audio_no_carga' }); if (r.ok) A.att = r.attempt; return viewSession(A.att.attempt_id); }
      if (act === 'play') return play();
      if (act === 'sim-begin') {
        unlockAudio(); t.disabled = true; const m = $('#pre-msg'); if (m) m.textContent = 'Comprobando audios…';
        const at = A.att; const urls = at.units.filter(u => u.part <= 4).map(u => asset(u.audio)).concat(['P1', 'P2', 'P3', 'P4'].map(p => ((root.EPL_AUDIO || {}).clips || {})['DIR-' + p]).filter(Boolean).map(c => asset(c.file)));
        const fails = await preload([...new Set(urls)]);
        if (fails.length) { t.disabled = false; if (m) m.innerHTML = `<div class="note bad" role="alert">${fails.length} audio(s) no cargaron. El simulacro no empieza con audio incompleto. Revisá la conexión e intentá de nuevo.</div>`; return; }
        A.live['pre:' + at.attempt_id] = 1; return simListening(at, at.units.filter(u => u.part <= 4));
      }
      if (act === 'sim-interrupted') { unlockAudio(); const at = A.att; const r = await call('cursor', { attempt_id: t.dataset.id, index: Number(t.dataset.k), interrupted: true }); if (r.ok) { at.listening_cursor = r.listening_cursor; at.cursor_started = false; A.live['pre:' + at.attempt_id] = 1; } return viewSim(t.dataset.id); }
      if (act === 'sim-unblock') { if (A.audio) A.audio.play(); return; }
      if (act === 'start-reading') { const r = await call('startReading', { attempt_id: t.dataset.id }); if (!r.ok) return live(r.mensaje); A.att = r.attempt; return viewSim(t.dataset.id); }
      if (act === 'goto') { A.live.palOpen = true; A.live['ri:' + A.att.attempt_id] = Number(t.dataset.idx); return simReading(A.att); }
      if (act === 'sim-move') { A.live.palOpen = false; const k = 'ri:' + A.att.attempt_id; A.live[k] = (A.live[k] || 0) + Number(t.dataset.d); return simReading(A.att); }
      if (act === 'flag') { const id = t.dataset.id; const RU = A.att.units.filter(u => u.part >= 5); const u = RU[Math.min(A.live['ri:' + id] || 0, RU.length - 1)]; const f = A.flags[id]; const on = !u.items.some(i => f[i.item_id]); u.items.forEach(i => { if (on) f[i.item_id] = 1; else delete f[i.item_id]; }); try { localStorage.setItem('epl_flags_' + id, JSON.stringify(f)); } catch (_) {} return simReading(A.att); }
      if (act === 'sim-submit') {
        const at = A.att; const blank = at.units.filter(u => u.part >= 5).flatMap(u => u.items).filter(i => !at.answers[i.item_id]).length;
        if (blank && !t.dataset.confirm) { t.dataset.confirm = '1'; t.textContent = `Hay ${blank} sin responder. Tocá otra vez para entregar`; return live(`Hay ${blank} preguntas sin responder.`); }
        await flushQueue(); const r = await call('finish', { attempt_id: at.attempt_id }); A.att = null; return r.ok ? go('resultado', at.attempt_id) : live(r.mensaje);
      }
      if (act === 'search') { const r = await call('adminSearch', { q: $('#q').value }); $('#search-out').innerHTML = !r.ok ? notice(r) : `${r.candidates.map(c => `<div class="small">Ya registrado: <a href="#candidato-${c.candidate_id}" data-go="candidato" data-arg="${c.candidate_id}">${e(c.nombre)}</a> (${e(c.codigo)}) · ${e(c.acceso ? c.acceso.estado : 'sin acceso')}</div>`).join('')}${r.people.map(p => `<div class="small" style="margin:4px 0">${e(p.nombre)} · ${e(p.codigo)} · ${e(p.cedula_mask || '')} · ${p.tiene_cuenta ? 'tiene cuenta (' + e(p.usuario) + ')' : 'sin cuenta'} · ${e(p.estado_programa || '')} <button class="btn ghost" data-act="register-person" data-codigo="${e(p.codigo)}" data-nombre="${e(p.nombre)}">Registrar</button></div>`).join('') || (r.candidates.length ? '' : '<p class="mute small">Sin resultados.</p>')}`; return; }
      if (act === 'register-person' || act === 'register') {
        const payload = act === 'register' ? { nombre: $('#r-nombre').value, cedula: $('#r-cedula').value, correo: $('#r-correo').value, codigo: $('#r-codigo').value } : { codigo: t.dataset.codigo, nombre: t.dataset.nombre };
        const r = await call('adminRegister', payload); if (!r.ok) { const o = $('#act-out'); if (o) o.innerHTML = notice(r); return; }
        return go('candidato', r.candidate.candidate_id);
      }
      if (act === 'grant') { const pf = [...el.querySelectorAll('[name=pf]:checked')].map(x => x.value), sf = [...el.querySelectorAll('[name=sf]:checked')].map(x => x.value); const r = await call('adminGrant', { candidate_id: t.dataset.id, forms: pf, sim_forms: sf, hasta: $('#g-hasta').value, motivo: $('#g-motivo').value }); if (!r.ok) return (out.innerHTML = notice(r)); return viewCandidate(t.dataset.id); }
      if (act === 'revoke') { if (!t.dataset.confirm) { t.dataset.confirm = '1'; t.textContent = 'Confirmar suspensión'; return; } const r = await call('adminRevoke', { candidate_id: t.dataset.id, motivo: $('#g-motivo').value }); if (!r.ok) return (out.innerHTML = notice(r)); return viewCandidate(t.dataset.id); }
      if (act === 'activation') { const r = await call('adminActivationLink', { candidate_id: t.dataset.id }); if (!r.ok) return (out.innerHTML = notice(r)); const url = (opts.activationBase || location.href.split('#')[0]) + '#activar-' + r.token; out.innerHTML = `<div class="note"><b>Enlace de activación (se muestra una sola vez, vence ${fmtDT(r.expira)}):</b><br><input readonly value="${e(url)}" style="width:100%" id="act-url" aria-label="Enlace de activación"><br><button class="btn ghost" data-act="copy-link">Copiar</button> <span class="small mute">Envialo por WhatsApp o correo. Sirve una sola vez.</span></div>`; return; }
      if (act === 'copy-link') { const i = $('#act-url'); try { await navigator.clipboard.writeText(i.value); live('Copiado.'); } catch (_) { i.select(); live('Seleccionado: copialo con Ctrl+C.'); } return; }
      if (act === 'assign') { const r = await call('adminAssign', { candidate_id: t.dataset.id, docente_usuario: $('#a-doc').value.trim() }); out.innerHTML = r.ok ? '<div class="note">Docente asignado.</div>' : notice(r); return; }
      if (act === 'set-env') { const r = await call('adminConfig', { set: { ENV: t.dataset.v } }); return r.ok ? viewConfig() : live(r.mensaje); }
      if (act === 'bank-filter') return go('banco', [t.dataset.form, $('#b-part').value, $('#b-status').value].join('~'));
      if (act === 'set-status') { const ids = [...el.querySelectorAll('.sel:checked')].map(x => x.value); if (!ids.length) return (out.innerHTML = '<div class="note warn">Seleccioná al menos una pregunta.</div>'); const r = await call('editorSetStatus', { item_ids: ids, status: t.dataset.s, nota: $('#b-nota').value }); out.innerHTML = r.ok ? `<div class="note">${r.updated.length} actualizadas · ${r.refused.length} rechazadas${r.refused.length ? ': ' + e(r.refused[0].motivo) : ''}</div>` : notice(r); if (r.ok && r.updated.length) setTimeout(() => viewBank(A.arg), 900); return; }
      if (act === 'preview') { const r = await call('start', { tipo: 'preview', part: $('#b-part').value || 5, size: 5 }); if (!r.ok) return (out.innerHTML = notice(r)); A.att = r.attempt; A.live = {}; return go('sesion', r.attempt.attempt_id); }
      if (act === 'activate') { const p1 = $('#ac-p').value; if (p1 !== $('#ac-p2').value) return ($('#act-out').innerHTML = '<div class="note bad">Las claves no coinciden.</div>'); const r = await A.api.callPublic('activate', { token: t.dataset.token, usuario: $('#ac-u').value, clave: p1 }); $('#act-out').innerHTML = r.ok ? `<div class="note">Listo. Tu usuario es <b>${e(r.usuario)}</b>. Ya podés iniciar sesión.</div><p><a class="btn" href="#" data-go="" data-arg="">Ir al inicio de sesión</a></p>` : notice(r); return; }
    }
    function onKey(ev) {
      if ((ev.target.matches && ev.target.matches('input,select,textarea')) || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const k = ev.key.toLowerCase();
      if (k === 'p') { const b = $('[data-act=play]'); if (b && !b.disabled) { ev.preventDefault(); play(); } return; }
      if (k === 'enter' && (ev.target === document.body || ev.target === el || (ev.target.matches && ev.target.matches('.opt,h1')))) { const b = $('[data-primary]'); if (b && !b.disabled) { ev.preventDefault(); b.click(); } return; }
      const n = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k); if (n < 0 || k.length !== 1) return;
      const groups = [...el.querySelectorAll('.q .opts')]; const tg = groups.find(g => !g.querySelector('[aria-pressed=true]') && !g.querySelector('[aria-disabled=true]')) || (ev.target.closest && ev.target.closest('.opts'));
      if (!tg) return; const b = tg.querySelectorAll('.opt')[n]; if (b && b.getAttribute('aria-disabled') !== 'true') { ev.preventDefault(); b.click(); b.focus(); }
    }
    el.addEventListener('click', onClick); document.addEventListener('keydown', onKey);
    // Incrustado en el Campus: las pestañas viven fuera de `el` y no deben cambiar el hash del Campus.
    const navEl = document.getElementById('epl-tabs'); if (A.embedded && navEl && !el.contains(navEl)) navEl.addEventListener('click', onClick);
    A.go = go; A.route = route; A.setUser = u => { A.user = u; A.editor = undefined; A.me = null; A.att = null; A.live = {}; };
    return A;
  }
  root.EPLApp = { mount };
})(typeof window !== 'undefined' ? window : globalThis);
