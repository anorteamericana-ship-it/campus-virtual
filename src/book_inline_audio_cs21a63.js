// F98.4-Z6-CS21A157 · Audios y recursos adicionales dentro del visor canónico CS21A75
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A157';
  const VIEWER_SELECTOR = 'section[data-screen-label*="CS21A75"][data-screen-label*="Libros"]';
  const MOUNT_CLASS = 'an-book-inline-audio-cs21a65';
  const CACHE = window.__AN_BOOK_AUDIO_CATALOG_CACHE_CS21A65__ ||
    (window.__AN_BOOK_AUDIO_CATALOG_CACHE_CS21A65__ = Object.create(null));
  const STATES = new WeakMap();

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function session() {
    try {
      return (typeof window.getSesion === 'function'
        ? window.getSesion()
        : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {};
    } catch (_) {
      return {};
    }
  }

  function roleOf(user) {
    return normalizeText(user?.rol || user?.role).toLowerCase();
  }

  function sessionToken() {
    return typeof window.getSessionToken === 'function' ? window.getSessionToken() : '';
  }

  function activeGroup(user) {
    try {
      if (typeof window.getGrupoActivoDocente === 'function') {
        const group = window.getGrupoActivoDocente();
        if (group) return group;
      }
    } catch (_) {}
    return user?.grupoActivo || user?.grupo || user?.grupos?.[0] || '';
  }

  function inferLevel(user) {
    const direct = String(user?.nivel_activo || user?.NIVEL_ACTIVO || user?.nivel || user?.NIVEL || '').toUpperCase();
    if (['B1','B2','I1','I2'].includes(direct)) return direct;
    const group = String(user?.grupo || user?.grupoActivo || user?.grupos?.[0] || '').toUpperCase();
    const match = group.match(/(?:^|[-_])(B1|B2|I1|I2)(?:[-_]|$)/);
    return match ? match[1] : 'B1';
  }

  async function post(fn, payload = {}, timeout = 90000) {
    const endpoint = window.APPS_SCRIPT_URL;
    if (!endpoint) throw new Error('No está configurada la URL de Apps Script.');
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;
    try {
      const response = await fetch(`${endpoint}?fn=${encodeURIComponent(fn)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ fn, token: sessionToken(), ...payload }),
        signal: controller ? controller.signal : undefined,
      });
      const raw = await response.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; }
      catch (_) { throw new Error('Apps Script devolvió una respuesta inválida.'); }
      if (!response.ok || !data || data.ok !== true) {
        throw new Error(data?.mensaje || data?.error || `HTTP ${response.status}`);
      }
      return data;
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('La carga tardó demasiado.');
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function unitFromAudioName(name) {
    const match = String(name || '').match(/(?:UNIT|UNIDAD)[\s_-]*0*(\d{1,2})(?=\D|$)/i);
    return match ? Number(match[1]) : null;
  }

  function rawTrackName(track) {
    return normalizeText(track?.nombre || track?.name || track?.archivo_nombre || track?.filename || '');
  }

  function cleanAudioName(name) {
    let text = String(name || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const start = text.search(/\b(?:Unit|Unidad)\s*0*\d{1,2}/i);
    if (start >= 0) text = text.slice(start);
    text = text.replace(/\bPg\s*0*\d+\b/ig, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    text = text.replace(/^Unidad\b/i, 'Unit');
    text = text.replace(/\bUnit\s*0*(\d{1,2})\b/i, (_, number) => `Unit ${String(Number(number)).padStart(2, '0')}`);
    return text || String(name || '').trim();
  }

  function tracksForUnit(catalog, unit) {
    const seen = new Set();
    const result = [];
    (catalog?.audios_unidades || []).forEach(group => {
      (group?.pistas || []).forEach(track => {
        const originalName = rawTrackName(track);
        const id = String(track?.id || originalName);
        if (!originalName || !/\.mp3$/i.test(originalName) || unitFromAudioName(originalName) !== Number(unit) || seen.has(id)) return;
        seen.add(id);
        result.push({ id, name: cleanAudioName(originalName), originalName, track });
      });
    });
    return result.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric:true, sensitivity:'base' }));
  }

  function resourceName(item) {
    const raw = normalizeText(item?.nombre || item?.name || item?.titulo || 'Recurso adicional');
    if (/WORD\s+BY\s+WORD\s+DICTIONARY/i.test(raw)) return 'Diccionario Word by Word';
    return raw;
  }

  function resourcesForRole(catalog, role) {
    const resources = Array.isArray(catalog?.recursos) ? catalog.recursos : [];
    if (role === 'teacher' || role === 'docente') {
      return resources.filter(item => /DICCIONARIO|DICTIONARY|WORD\s+BY\s+WORD/i.test(resourceName(item)));
    }
    return resources;
  }

  function revokeObjectUrl(state) {
    if (!state.objectUrl) return;
    try { URL.revokeObjectURL(state.objectUrl); } catch (_) {}
    state.objectUrl = '';
  }

  function clearPlayer(state) {
    state.trackRequest += 1;
    revokeObjectUrl(state);
    try { state.audio.pause(); } catch (_) {}
    state.audio.removeAttribute('src');
    try { state.audio.load(); } catch (_) {}
    state.audio.style.display = 'none';
  }

  function updateBadge(state) {
    state.badge.textContent = `♪ ${state.level} · ${state.bookType} · U${String(state.unit).padStart(2, '0')}`;
  }

  function showStatus(state, text, tone = 'muted') {
    state.status.textContent = text || '';
    state.status.style.display = text ? 'block' : 'none';
    state.status.style.color = tone === 'error' ? '#9B2C2C' : '#667085';
    state.audio.style.display = 'none';
  }

  function renderResourceOptions(state) {
    state.resourceSelect.innerHTML = '';
    const resources = resourcesForRole(state.catalog, state.role);
    state.resources = resources;

    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = state.catalogStatus === 'loading'
      ? 'Cargando recursos…'
      : state.catalogStatus === 'error'
        ? 'Recursos no disponibles'
        : resources.length
          ? `Recursos adicionales · ${resources.length}`
          : (state.role === 'teacher' || state.role === 'docente' ? 'Diccionario no disponible' : 'Sin recursos adicionales');
    state.resourceSelect.appendChild(empty);

    resources.forEach((item, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = resourceName(item);
      option.title = resourceName(item);
      state.resourceSelect.appendChild(option);
    });

    state.resourceSelect.value = '';
    state.resourceSelect.disabled = state.catalogStatus !== 'ready' || resources.length === 0;
  }

  function renderTrackOptions(state) {
    updateBadge(state);
    clearPlayer(state);
    state.selectedId = '';
    state.select.innerHTML = '';

    const tracks = tracksForUnit(state.catalog, state.unit);
    state.tracks = tracks;

    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = state.catalogStatus === 'loading'
      ? 'Cargando audios…'
      : state.catalogStatus === 'error'
        ? 'Audios no disponibles'
        : tracks.length
          ? `Elegir audio · ${tracks.length} pista${tracks.length === 1 ? '' : 's'}`
          : `Sin audios para U${String(state.unit).padStart(2, '0')}`;
    state.select.appendChild(empty);

    tracks.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.name;
      option.title = item.originalName;
      state.select.appendChild(option);
    });

    state.select.value = '';
    state.select.disabled = state.catalogStatus !== 'ready' || tracks.length === 0;

    if (state.catalogStatus === 'loading') showStatus(state, 'Consultando…');
    else if (state.catalogStatus === 'error') showStatus(state, state.catalogError || 'No se pudieron cargar los audios.', 'error');
    else if (!tracks.length) showStatus(state, 'Sin pistas');
    else showStatus(state, 'Seleccioná una pista');

    renderResourceOptions(state);
  }

  async function loadCatalog(state) {
    const requestId = state.catalogRequest + 1;
    state.catalogRequest = requestId;
    state.catalogStatus = 'loading';
    state.catalogError = '';
    state.catalog = null;
    renderTrackOptions(state);

    try {
      const user = session();
      state.role = roleOf(user);
      const view = state.role === 'student' || state.role === 'estudiante' ? 'estudiante' : 'docente';
      const cacheKey = `${view}:${state.level}`;
      let catalog = CACHE[cacheKey] || null;
      if (!catalog) {
        const response = await post('getBibliotecaNivelEstudiante', {
          nivel: state.level,
          codigo: user?.codigo || user?.cedula || '',
          cod_grupo: activeGroup(user),
          vista: view,
        });
        catalog = response?.catalogo || null;
        if (!catalog) throw new Error('El catálogo no devolvió recursos para este nivel.');
        CACHE[cacheKey] = catalog;
      }
      if (state.catalogRequest !== requestId) return;
      state.catalog = catalog;
      state.catalogStatus = 'ready';
      renderTrackOptions(state);
    } catch (error) {
      if (state.catalogRequest !== requestId) return;
      state.catalogStatus = 'error';
      state.catalogError = String(error?.message || error || 'No se pudieron cargar los recursos.');
      renderTrackOptions(state);
    }
  }

  async function loadTrack(state, id) {
    clearPlayer(state);
    state.selectedId = String(id || '');
    if (!state.selectedId) {
      showStatus(state, state.tracks.length ? 'Seleccioná una pista' : 'Sin pistas');
      return;
    }

    const selected = state.tracks.find(item => item.id === state.selectedId);
    if (!selected) {
      showStatus(state, 'La pista seleccionada ya no está disponible.', 'error');
      return;
    }

    const requestId = state.trackRequest + 1;
    state.trackRequest = requestId;
    showStatus(state, 'Cargando pista…');

    try {
      const user = session();
      const response = await post('getAudioPistaEstudiante', {
        nivel: state.level,
        codigo: user?.codigo || user?.cedula || '',
        cod_grupo: activeGroup(user),
        archivo_id: selected.track.id,
      });
      if (state.trackRequest !== requestId) return;
      if (!response?.audio?.base64) throw new Error('La pista no devolvió contenido reproducible.');

      const binary = atob(response.audio.base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      const blob = new Blob([bytes], { type: response.audio.mime || 'audio/mpeg' });
      const objectUrl = URL.createObjectURL(blob);
      if (state.trackRequest !== requestId) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      state.objectUrl = objectUrl;
      state.audio.src = objectUrl;
      state.audio.title = selected.name;
      state.audio.style.display = 'block';
      state.status.style.display = 'none';
      try { state.audio.load(); } catch (_) {}
    } catch (error) {
      if (state.trackRequest !== requestId) return;
      showStatus(state, String(error?.message || error || 'No se pudo cargar la pista.'), 'error');
    }
  }

  function openResource(state, value) {
    if (value === '') return;
    const item = state.resources[Number(value)];
    state.resourceSelect.value = '';
    if (!item?.url) return;
    window.open(item.url, '_blank', 'noopener,noreferrer');
  }

  function makeState(viewer) {
    const mount = document.createElement('div');
    mount.className = MOUNT_CLASS;
    mount.setAttribute('data-version', VERSION);
    Object.assign(mount.style, {
      display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'7px',
      flex:'1 1 650px', minWidth:'300px', marginLeft:'auto', flexWrap:'wrap',
    });

    const badge = document.createElement('div');
    Object.assign(badge.style, {
      flex:'0 0 auto', minHeight:'34px', display:'flex', alignItems:'center', padding:'0 9px',
      borderRadius:'9px', background:'#E8F2FC', border:'1px solid #9DBBDA', color:'#0B4A8B',
      fontSize:'9.5px', fontWeight:'950', whiteSpace:'nowrap',
    });

    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Audio de la unidad seleccionada');
    Object.assign(select.style, {
      flex:'1 1 210px', minWidth:'170px', maxWidth:'270px', height:'34px', border:'1px solid #B9C5D2',
      borderRadius:'9px', background:'#fff', color:'#001E47', padding:'0 30px 0 9px', fontSize:'10.5px', fontWeight:'750',
    });

    const playerSlot = document.createElement('div');
    Object.assign(playerSlot.style, {
      flex:'0 1 205px', minWidth:'150px', height:'34px', display:'flex', alignItems:'center', justifyContent:'center',
    });

    const audio = document.createElement('audio');
    audio.controls = true;
    audio.preload = 'metadata';
    audio.style.width = '100%';
    audio.style.height = '32px';
    audio.style.display = 'none';

    const status = document.createElement('div');
    Object.assign(status.style, {
      width:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'center',
      fontSize:'9.5px', fontWeight:'800', color:'#667085',
    });

    const resourceSelect = document.createElement('select');
    resourceSelect.setAttribute('aria-label', 'Recursos adicionales del nivel');
    Object.assign(resourceSelect.style, {
      flex:'1 1 190px', minWidth:'165px', maxWidth:'245px', height:'34px', border:'1px solid #C9B573',
      borderRadius:'9px', background:'#FFF9E8', color:'#5E4800', padding:'0 30px 0 9px', fontSize:'10.5px', fontWeight:'800',
    });

    playerSlot.append(audio, status);
    mount.append(badge, select, playerSlot, resourceSelect);

    const user = session();
    const state = {
      viewer, mount, badge, select, audio, status, resourceSelect,
      role:roleOf(user), level:inferLevel(user), bookType:'SB', unit:1,
      catalog:null, catalogStatus:'idle', catalogError:'', catalogRequest:0, trackRequest:0,
      selectedId:'', tracks:[], resources:[], objectUrl:'', clickHandler:null,
    };

    select.addEventListener('change', () => loadTrack(state, select.value));
    resourceSelect.addEventListener('change', () => openResource(state, resourceSelect.value));
    audio.addEventListener('error', () => showStatus(state, 'El navegador no pudo reproducir esta pista.', 'error'));
    return state;
  }

  function readCurrentSelection(state) {
    const user = session();
    state.role = roleOf(user);
    const buttons = Array.from(state.viewer.querySelectorAll('button'));
    const levelButton = buttons.find(button =>
      /^(B1|B2|I1|I2)\s*·/.test(normalizeText(button.textContent)) && button.classList.contains('btn-primary')
    );
    const typeButton = buttons.find(button =>
      /^(SB|TB|WB)$/.test(normalizeText(button.textContent)) && button.getAttribute('aria-pressed') === 'true'
    );
    const levelMatch = normalizeText(levelButton?.textContent).match(/^(B1|B2|I1|I2)/);
    state.level = levelMatch ? levelMatch[1] : inferLevel(user);
    if (typeButton) state.bookType = normalizeText(typeButton.textContent);
  }

  function bindViewerEvents(state) {
    if (state.clickHandler) return;
    state.clickHandler = event => {
      const button = event.target?.closest?.('button');
      if (!button || button.disabled) return;
      const label = normalizeText(button.textContent);
      const title = normalizeText(button.getAttribute('title'));

      const levelMatch = label.match(/^(B1|B2|I1|I2)\s*·/);
      if (levelMatch) {
        const nextLevel = levelMatch[1];
        window.setTimeout(() => {
          readCurrentSelection(state);
          state.level = nextLevel;
          state.unit = 1;
          loadCatalog(state);
        }, 0);
        return;
      }

      if (/^(SB|TB|WB)$/.test(label)) {
        window.setTimeout(() => {
          readCurrentSelection(state);
          state.bookType = label;
          state.unit = 1;
          renderTrackOptions(state);
        }, 0);
        return;
      }

      const unitMatch = label.match(/^U(\d{2})$/) || title.match(/\bU(\d{2})\b/);
      if (unitMatch) {
        state.unit = Math.max(1, Math.min(16, Number(unitMatch[1])));
        renderTrackOptions(state);
      }
    };
    state.viewer.addEventListener('click', state.clickHandler, true);
  }

  function findMountBar(viewer) {
    const buttons = Array.from(viewer.querySelectorAll('button'));
    const levelButtons = buttons.filter(button => /^(B1|B2|I1|I2)\s*·/.test(normalizeText(button.textContent)));
    if (levelButtons.length) {
      const root = levelButtons[0].parentElement;
      return { bar:root?.parentElement, root };
    }
    const typeButton = buttons.find(button => /^(SB|TB|WB)$/.test(normalizeText(button.textContent)));
    const root = typeButton?.parentElement;
    return { bar:root?.parentElement, root };
  }

  function attachToViewer(viewer) {
    const { bar, root } = findMountBar(viewer);
    if (!bar || !root) return;

    let state = STATES.get(viewer);
    if (!state) {
      state = makeState(viewer);
      STATES.set(viewer, state);
      bindViewerEvents(state);
      readCurrentSelection(state);
      loadCatalog(state);
    } else {
      readCurrentSelection(state);
      updateBadge(state);
    }

    Object.assign(bar.style, { display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' });
    root.style.flex = root.style.flex || '1 1 470px';
    if (state.mount.parentElement !== bar) bar.appendChild(state.mount);
  }

  let scheduled = false;
  function scan() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      document.querySelectorAll(VIEWER_SELECTOR).forEach(attachToViewer);
    });
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('an:lazy-module-loaded', scan);
  window.addEventListener('an:teacher-material-tab', scan);
  window.addEventListener('an:admin-resource-tab', scan);
  window.addEventListener('an:session-changed', scan);
  window.addEventListener('resize', scan);
  scan();

  window.__AN_BOOK_INLINE_AUDIO_VERSION__ = VERSION;
})();
