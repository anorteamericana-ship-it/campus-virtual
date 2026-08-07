// F98.4-Z6-CS21A187 · English LAB Live product guard.
// QA/frontend: evita mezcla de runtimes cacheados, elimina salas residuales,
// expulsa al estudiante al lobby cuando la sala cierra y limita Memory Match
// a la capacidad visible actual del banco (máximo 6 pares).
(function installEnglishLabLiveProductGuardCS21A187(global){
  'use strict';

  if (!global || global.__ENGLISH_LAB_PRODUCT_GUARD_CS21A187__) return;

  const VERSION = 'F98.4-Z6-CS21A187';
  const LIVE_FILE_RE = /^src\/english_lab_live\.jsx(?:\?.*)?$/i;
  const LAST_ROOM_KEY = 'elive_last_room';
  const PLAYER_PREFIX = 'elive_player_';
  const MAX_MEMORY_PAIRS = 6;
  const PREREQUISITES = Object.freeze([
    'src/english_lab_games/english_lab_runtime_cs21a173.js?v=CS21A187',
    'src/english_lab_games/memory_match_engine_cs21a173.jsx?v=CS21A187',
    'src/english_lab_games/english_lab_live_sync_guard_cs21a177.js?v=CS21A187',
    'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx?v=CS21A187',
  ]);
  const STATE_ENDPOINTS = Object.freeze([
    'englishLabLiveGetPlayerState',
    'englishLabMemoryMatchGetPlayerState',
    'englishLabLiveJoinRoom',
    'englishLabMemoryMatchJoinRoom',
  ]);

  let activeRoomCode = '';
  let baseFetch = null;
  let fetchInstalled = false;
  let clickInstalled = false;
  let lazyInstalled = false;
  let initialResidueCleared = false;
  let observer = null;

  function clean(value){ return String(value == null ? '' : value).trim(); }
  function publicCode(value){ return clean(value).toUpperCase().replace(/[^A-Z0-9-]/g,''); }
  function storage(){ try { return global.localStorage || null; } catch(_) { return null; } }
  function endpointFromRequest(input){
    try{
      const raw = typeof input === 'string' ? input : input && input.url;
      if(!raw) return '';
      return clean(new URL(raw, global.location && global.location.href || 'https://local.invalid/').searchParams.get('fn'));
    }catch(_){ return ''; }
  }
  function roomFromPayload(data){ return data && typeof data === 'object' && data.room && typeof data.room === 'object' ? data.room : null; }
  function roomStatus(room){ return clean(room && (room.status || room.STATUS)).toUpperCase(); }
  function roomCode(room){ return publicCode(room && (room.room_code || room.ROOM_CODE || room.room_id || room.ROOM_ID)); }

  function clearLastRoom(){
    const store = storage();
    if(!store) return '';
    let previous = '';
    try { previous = publicCode(store.getItem(LAST_ROOM_KEY) || ''); } catch(_) {}
    try { store.removeItem(LAST_ROOM_KEY); } catch(_) {}
    if(previous){ try { store.removeItem(PLAYER_PREFIX + previous); } catch(_) {} }
    return previous;
  }
  function clearInitialResidue(){
    if(initialResidueCleared) return '';
    initialResidueCleared = true;
    return clearLastRoom();
  }
  function clearRoomPersistence(code){
    const store = storage();
    const normalized = publicCode(code);
    clearLastRoom();
    if(store && normalized){ try { store.removeItem(PLAYER_PREFIX + normalized); } catch(_) {} }
    return normalized;
  }
  function clearRoomUrl(){
    try{
      const url = new URL(global.location.href);
      ['room','codigo','lab'].forEach(key=>url.searchParams.delete(key));
      const hash = String(url.hash || '');
      if(hash.includes('?')) url.hash = hash.split('?')[0];
      global.history.replaceState(global.history.state || null, '', url.pathname + (url.search || '') + (url.hash || ''));
    }catch(_){}
  }
  function emit(name, detail){
    try{ global.dispatchEvent(new global.CustomEvent(name,{detail:{version:VERSION,...(detail||{})}})); }catch(_){}
  }
  function detachRoom(code, reason){
    const normalized = clearRoomPersistence(code || activeRoomCode);
    activeRoomCode = '';
    clearRoomUrl();
    emit('an:english-lab-detach-room',{room_code:normalized,reason:reason||'DETACH'});
  }

  function inspectPayload(data){
    const room = roomFromPayload(data);
    if(!room) return {closed:false,code:''};
    const code = roomCode(room);
    if(code) activeRoomCode = code;
    const closed = !!(code && roomStatus(room) === 'CLOSED');
    if(closed) detachRoom(code,'ROOM_CLOSED');
    return {closed,code};
  }

  // Una respuesta CLOSED puede llegar a una instancia React que está siendo
  // desmontada. Si conserva player, ese loadState antiguo vuelve a escribir
  // elive_player_<sala> después de que detachRoom ya lo borró. Se entrega al
  // componente una copia sin jugador activo para que CLOSED sea terminal también
  // frente a requests que ya estaban en vuelo.
  function sanitizeClosedPayload(data){
    const source = data && typeof data === 'object' ? data : {};
    const sanitized = {...source,player:null,can_answer:false,joined:false};
    if(source.room_package && typeof source.room_package === 'object'){
      sanitized.room_package = {...source.room_package,player:null};
    }
    return sanitized;
  }

  function closedResponse(response, data){
    if(typeof global.Response !== 'function') return response;
    try{
      const headers = typeof global.Headers === 'function' ? new global.Headers(response.headers) : {'content-type':'application/json; charset=utf-8'};
      if(headers && typeof headers.set === 'function') headers.set('content-type','application/json; charset=utf-8');
      if(headers && typeof headers.delete === 'function'){
        headers.delete('content-length');
        headers.delete('content-encoding');
      }
      return new global.Response(JSON.stringify(sanitizeClosedPayload(data)),{
        status:response.status,
        statusText:response.statusText,
        headers,
      });
    }catch(_){ return response; }
  }

  function installFetchGuard(){
    if(fetchInstalled || typeof global.fetch !== 'function') return fetchInstalled;
    baseFetch = global.fetch.bind(global);
    global.fetch = async function englishLabProductFetchCS21A187(input, init){
      const response = await baseFetch(input, init);
      const endpoint = endpointFromRequest(input);
      if(STATE_ENDPOINTS.indexOf(endpoint) >= 0){
        try {
          const data = await response.clone().json();
          const inspection = inspectPayload(data);
          if(inspection.closed) return closedResponse(response,data);
        } catch(_) {}
      }
      return response;
    };
    global.fetch.__cs21a187ProductGuard = true;
    fetchInstalled = true;
    return true;
  }

  function enforcePairSelect(){
    if(!global.document) return 0;
    let changed = 0;
    const labels = global.document.querySelectorAll('label');
    labels.forEach(label=>{
      const text = clean(label.textContent).toLowerCase();
      if(text.indexOf('cantidad de pares') < 0) return;
      const select = label.querySelector('select');
      if(!select) return;
      const originalValue = Number(select.value || 0) || 0;
      Array.from(select.options || []).forEach(option=>{
        const value = Number(option.value || 0) || 0;
        if(value > MAX_MEMORY_PAIRS){ option.remove(); changed += 1; }
      });
      if(originalValue > MAX_MEMORY_PAIRS || (Number(select.value || 0) || 0) > MAX_MEMORY_PAIRS){
        select.value = String(MAX_MEMORY_PAIRS);
        try { select.dispatchEvent(new global.Event('change',{bubbles:true})); } catch(_) {}
      }
      select.title = 'Memory Match: esta unidad dispone actualmente de hasta 6 pares canónicos.';
    });
    return changed;
  }
  function installDomGuard(){
    if(!global.document || observer) return !!observer;
    enforcePairSelect();
    try{
      observer = new MutationObserver(()=>enforcePairSelect());
      observer.observe(global.document.documentElement,{childList:true,subtree:true});
      return true;
    }catch(_){ return false; }
  }

  function installClickGuard(){
    if(clickInstalled || !global.document || typeof global.document.addEventListener !== 'function') return clickInstalled;
    global.document.addEventListener('click', event=>{
      const target = event && event.target;
      const button = target && typeof target.closest === 'function' ? target.closest('button') : null;
      if(!button) return;
      const label = clean(button.textContent).toLowerCase();
      if(label.indexOf('cambiar sala') >= 0){
        const oldCode = activeRoomCode;
        clearRoomPersistence(oldCode);
        clearRoomUrl();
        emit('an:english-lab-detach-room',{room_code:oldCode,reason:'CHANGE_ROOM'});
      }
    }, true);
    clickInstalled = true;
    return true;
  }

  function installStudentWrapper(){
    const Base = global.EnglishLabLiveStudentView;
    if(typeof Base !== 'function') return false;
    if(Base.__cs21a187LifecycleWrapper) return true;
    const ReactRef = global.React;
    if(!ReactRef || typeof ReactRef.createElement !== 'function') return false;

    function WrappedStudentView(props){
      const [epoch,setEpoch] = ReactRef.useState(0);
      const [notice,setNotice] = ReactRef.useState('');
      ReactRef.useEffect(()=>{
        function onDetach(event){
          const reason = clean(event && event.detail && event.detail.reason).toUpperCase();
          setNotice(reason === 'ROOM_CLOSED' ? 'La sala terminó. Ya podés ingresar otro código.' : 'Listo. Ingresá el nuevo código de sala.');
          setEpoch(value=>value+1);
        }
        global.addEventListener('an:english-lab-detach-room',onDetach);
        return ()=>global.removeEventListener('an:english-lab-detach-room',onDetach);
      },[]);
      return ReactRef.createElement(ReactRef.Fragment,null,
        notice ? ReactRef.createElement('div',{style:{maxWidth:900,margin:'0 auto 12px',padding:'11px 14px',borderRadius:14,background:'#EEF4FF',border:'1px solid #B7D5FF',color:'#073B7A',fontSize:12.5,fontWeight:850}},notice) : null,
        ReactRef.createElement(Base,{...(props||{}),key:'elive-student-'+epoch})
      );
    }
    WrappedStudentView.__cs21a187LifecycleWrapper = true;
    WrappedStudentView.__base = Base;
    global.EnglishLabLiveStudentView = WrappedStudentView;
    return true;
  }

  function stackReady(){
    return !!(
      global.EnglishLabRuntimeCS21A173 &&
      typeof global.MemoryMatchGameCS21A173 === 'function' &&
      global.EnglishLabLiveSyncCS21A177 &&
      global.EnglishLabMemoryMatchLiveCS21A174 &&
      typeof global.MemoryMatchLiveRoundCS21A174 === 'function'
    );
  }

  function patchLazyLoader(){
    const api = global.anLazyCampus;
    if(!api || typeof api.loadOne !== 'function' || typeof api.loadMany !== 'function') return false;
    if(api.loadOne.__cs21a187ProductGuard) return true;

    const currentLoadOne = api.loadOne;
    const ordinaryLoadOne = currentLoadOne.bind(api);
    // CS21A184 podía cargar dependencias con URLs viejas. Para English LAB Live
    // saltamos ese wrapper y vamos a su loader base después de cargar CS21A187.
    const rawLiveLoadOne = currentLoadOne.__cs21a184StudentDependencies && typeof currentLoadOne.__base === 'function'
      ? currentLoadOne.__base
      : ordinaryLoadOne;

    async function loadOneCS21A187(src){
      if(!LIVE_FILE_RE.test(clean(src))) return ordinaryLoadOne(src);
      clearInitialResidue();
      await api.loadMany(PREREQUISITES);
      const result = await rawLiveLoadOne(src);
      if(!stackReady()) throw new Error('English LAB Live no cargó el stack CS21A187 completo.');
      installStudentWrapper();
      enforcePairSelect();
      return result;
    }
    loadOneCS21A187.__cs21a187ProductGuard = true;
    loadOneCS21A187.__base = rawLiveLoadOne;
    api.loadOne = loadOneCS21A187;
    lazyInstalled = true;
    return true;
  }

  function install(){
    // Limpia solamente el residuo heredado al entrar. Una sala nueva sí puede
    // persistir durante su sesión hasta Cambiar sala o CLOSED.
    clearInitialResidue();
    installFetchGuard();
    installClickGuard();
    installDomGuard();
    patchLazyLoader();
    installStudentWrapper();
    return true;
  }

  global.__ENGLISH_LAB_PRODUCT_GUARD_CS21A187__ = Object.freeze({
    version:VERSION,
    maxMemoryPairs:MAX_MEMORY_PAIRS,
    prerequisites:PREREQUISITES.slice(),
    install,
    clearLastRoom,
    clearInitialResidue,
    clearRoomPersistence,
    clearRoomUrl,
    detachRoom,
    inspectPayload,
    sanitizeClosedPayload,
    enforcePairSelect,
    stackReady,
    getActiveRoomCode:()=>activeRoomCode,
  });

  install();
  let attempts = 0;
  const timer = global.setInterval(()=>{
    attempts += 1;
    install();
    if(lazyInstalled || attempts > 300) global.clearInterval(timer);
  },50);
  global.addEventListener && global.addEventListener('an:lazy-module-loaded',install);
})(window);
