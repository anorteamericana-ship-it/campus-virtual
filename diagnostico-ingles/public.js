/* Diagnóstico público — perfiles por ID aleatorio; mismo motor de Exam Prep Lab. Sin cuentas Campus. */
(function () {
  'use strict';
  const $ = q => document.querySelector(q);
  const KEY = 'epl_public_people_v1', ACTIVE = 'epl_public_person_active_v1', REVIEWS = 'epl_public_issues_v1';
  const ROOT = '../prototipos/exam_prep_lab/';
  const escape = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getJSON = (k, fallback) => {try{return JSON.parse(localStorage.getItem(k)||'null')||fallback}catch{return fallback}};
  const put = (k,v) => {try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
  const allPeople = () => getJSON(KEY, []).filter(x => x && /^[a-f0-9-]{32,36}$/.test(x.id) && typeof x.name === 'string').slice(-40);
  const id = () => crypto.randomUUID ? crypto.randomUUID() : [...crypto.getRandomValues(new Uint8Array(16))].map(b=>b.toString(16).padStart(2,'0')).join('');
  let person = null, token = null, app = null, reportCtx = null, busy = false, sendingReport = false, reportSubmitted = false, reportReturnFocus = null;

  function showEntry() {
    person = null; token = null; app = null;
    $('#workspace').hidden = true; $('#entry').hidden = false;
    $('#epl-tabs').innerHTML = ''; $('#epl-who').textContent = '';
    if (location.hash) history.replaceState(null,'',location.pathname+location.search);
    const people = allPeople();
    $('#saved-profiles').hidden = !people.length;
    $('#profile-list').replaceChildren();
    people.slice().reverse().forEach(p => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'profile-card';
      button.innerHTML = escape(p.name) + '<small>Continuar con mi avance · ' + escape(new Date(p.lastSeen || p.created).toLocaleDateString('es-CR')) + '</small>';
      button.addEventListener('click', () => enter(p));
      $('#profile-list').appendChild(button);
    });
    $('#guest-name').focus();
  }
  function entryError(s) {const a=$('#entry-error');a.hidden=!s;a.textContent=s||'';}
  async function enter(p) {
    if (busy) return;
    busy = true;
    entryError('');
    try {
      const match = allPeople().find(x => x.id === p.id);
      if (!match) throw new Error('El perfil no está disponible. Ingresá tu nombre de nuevo.');
      const signIn = EPLMock.loginPublicGuest(match.id, match.name);
      if (!signIn.ok) throw new Error(signIn.mensaje || signIn.error || 'No pudimos abrir el perfil.');
      person = match; token = signIn.token;
      match.lastSeen = Date.now();
      const list = allPeople().map(x => x.id === match.id ? match : x);
      put(KEY,list); put(ACTIVE,match.id);
      $('#entry').hidden = true; $('#workspace').hidden = false;
      $('#app').replaceChildren();
      if (app) app.setUser(signIn.user);
      app = EPLApp.mount($('#app'), {
        api: {call:(action,payload)=>EPLMock.call(token,action,payload),callPublic:(action,payload)=>EPLMock.callPublic(action,payload)},
        user:signIn.user,
        publicQA:true,
        assetBase:ROOT,
        onLogout: () => {EPLMock.logout(token);showEntry();},
        onReport: openReport,
        onProgress: reportProgress,
      });
      app.route();
      // Reenviar informes guardados sin conexión incluso tras cerrar y volver a abrir la página.
      syncPending();
      // El perfil es único por ID, no por nombre. El usuario puede cambiar sin mezclar resultados.
      syncOne({event:'profile',name:person.name,participant_id:person.id});
    } catch (err) {entryError(err.message);$('#entry').hidden=false;$('#workspace').hidden=true;}
    finally {busy=false;}
  }
  $('#entry-form').addEventListener('submit', ev => {
    ev.preventDefault();
    if (busy) return;
    const name = $('#guest-name').value.normalize('NFC').trim().replace(/\s+/g,' ');
    if (name.length < 2 || name.length > 60 || !/^[\p{L}][\p{L}\p{M}\s.'-]*$/u.test(name)) return entryError('Escribí solo tu nombre, entre 2 y 60 caracteres.');
    const p = {id:id(),name,created:Date.now(),lastSeen:Date.now()};
    const list=allPeople();
    if (!put(KEY,[...list,p])) return entryError('Este navegador no permite guardar tu avance. Activá el almacenamiento del navegador para continuar.');
    enter(p);
  });
  $('#change-profile').addEventListener('click', () => {
    if (!confirm('¿Cambiar de participante? El avance de esta persona queda guardado en este navegador.')) return;
    if (token) EPLMock.logout(token);
    // La instancia anterior no comparte identidad con la siguiente, recargamos sin cambiar archivos.
    try { localStorage.removeItem(ACTIVE); } catch (_) {}
    location.hash='';location.reload();
  });

  // Se registra cada reporte localmente hasta que el servicio separado confirme recepción.
  const allReports = () => getJSON(REVIEWS, []).filter(r=>r&&r.event_id&&r.participant_id).slice(-1000);
  function openReport(ctx) {
    if (!person) return;
    reportCtx = ctx;
    reportSubmitted = false;
    $('#qa-form button[type=submit]').disabled = false;
    reportReturnFocus = document.activeElement;
    $('#qa-item-label').textContent = 'Pregunta: ' + ctx.item_id + ' · Parte ' + ctx.part;
    $('#qa-feedback').textContent = '';
    $('#qa-type').value = '';$('#qa-comment').value = '';
    $('#qa-modal').hidden = false;$('#qa-type').focus();
  }
  function closeReport(){ $('#qa-modal').hidden=true; reportCtx=null; if (reportReturnFocus?.isConnected) reportReturnFocus.focus(); reportReturnFocus=null; }
  $('#qa-cancel').addEventListener('click',closeReport);
  $('#qa-modal').addEventListener('click',ev=>{if(ev.target===$('#qa-modal'))closeReport()});
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape' && !$('#qa-modal').hidden)closeReport()});
  $('#qa-form').addEventListener('submit',async ev=>{
    ev.preventDefault();
    if(sendingReport||reportSubmitted||!reportCtx||!person)return;
    const category=$('#qa-type').value;
    if(!['audio','respuesta','texto','imagen','traduccion','usabilidad','otro'].includes(category))return;
    const msg=$('#qa-comment').value.trim().slice(0,600);
    if(category==='otro'&&!msg){$('#qa-feedback').textContent='Contanos brevemente qué problema encontraste.';return}
    const report={event:'issue',event_id:id(),participant_id:person.id,name:person.name,
      item_id:reportCtx.item_id,part:reportCtx.part,form:reportCtx.form,
      attempt_id:reportCtx.attempt_id,category,comment:msg,at:new Date().toISOString(),synced:false};
    // Evitar dos reportes distintos al tocar dos veces «Enviar» en conexiones lentas.
    sendingReport=true;
    const submit=$('#qa-form button[type=submit]'); submit.disabled=true;
    try {
      const list=allReports();
      if(!put(REVIEWS,[...list,report])){$('#qa-feedback').textContent='No se pudo guardar esta observación.';return}
      reportSubmitted=true; // ya quedó guardado: nunca crear un segundo ID por doble toque.
      const sent=await syncOne(report);
      $('#qa-feedback').textContent=sent?'Observación enviada. ¡Gracias!':'Observación guardada en este navegador; se enviará cuando vuelva la conexión.';
      setTimeout(closeReport,1200);
    } finally {sendingReport=false;submit.disabled=reportSubmitted;}
  });
  async function syncOne(data) {
    const url = typeof window.EPL_PUBLIC_REVIEW_ENDPOINT === 'string' ? window.EPL_PUBLIC_REVIEW_ENDPOINT : '';
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) return false;
    try {
      const r=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify(data),cache:'no-store'});
      const j=await r.json();
      if(!r.ok||j.ok!==true)return false;
      if(data.event==='issue'){
        const list=allReports();const x=list.find(y=>y.event_id===data.event_id);if(x){x.synced=true;put(REVIEWS,list);}
      }
      return true;
    }catch{return false}
  }
  async function syncPending() {
    const pending=allReports().filter(r=>!r.synced).slice(0,20);
    for(const report of pending){const ok=await syncOne(report);if(!ok)break;}
  }
  function reportProgress(summary) {
    if(!person) return;
    syncOne({event:'progress',event_id:id(),participant_id:person.id,name:person.name,at:new Date().toISOString(),coverage:summary.coverage||null,diagnostic:summary.diagnostic||null});
    syncPending();
  }
  // Reiniciar comunicación sin exigir intervención de los participantes.
  window.addEventListener('online',syncPending);
  const last=getJSON(ACTIVE,null); const active=allPeople().find(x=>x.id===last);
  if(active){enter(active);}else{showEntry();}
})();
