// F98.4-Z6-CS21A67 · Botón 1.3.2 Recursos adicionales por rol y nivel
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A67';
  const VIEWER_SELECTOR = 'section[data-screen-label*="CS21A60"][data-screen-label*="Libros"]';
  const BUTTON_CLASS = 'an-additional-resources-button-cs21a67';
  const CACHE = window.__AN_ADDITIONAL_RESOURCES_CACHE_CS21A67__ ||
    (window.__AN_ADDITIONAL_RESOURCES_CACHE_CS21A67__ = Object.create(null));
  const STATES = new WeakMap();
  const LEVEL_NAMES = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };

  function text(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
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
    return text(user?.rol || user?.role).toLowerCase();
  }

  function token() {
    return typeof window.getSessionToken === 'function' ? window.getSessionToken() : '';
  }

  function activeGroup(user) {
    try {
      if (typeof window.getGrupoActivoDocente === 'function') {
        const current = window.getGrupoActivoDocente();
        if (current) return current;
      }
    } catch (_) {}
    return user?.grupoActivo || user?.grupo || user?.grupos?.[0] || '';
  }

  function inferLevel(user) {
    const direct = text(user?.nivel_activo || user?.NIVEL_ACTIVO || user?.nivel || user?.NIVEL).toUpperCase();
    if (LEVEL_NAMES[direct]) return direct;
    const group = text(user?.grupoActivo || user?.grupo || user?.grupos?.[0]).toUpperCase();
    const match = group.match(/(?:^|[-_])(B1|B2|I1|I2)(?:[-_]|$)/);
    return match ? match[1] : 'B1';
  }

  function currentLevel(viewer) {
    const buttons = Array.from(viewer.querySelectorAll('button'));
    const active = buttons.find(button =>
      /^(B1|B2|I1|I2)\s*·/.test(text(button.textContent)) &&
      (button.classList.contains('btn-primary') || button.getAttribute('aria-pressed') === 'true')
    );
    const match = text(active?.textContent).match(/^(B1|B2|I1|I2)/);
    return match ? match[1] : inferLevel(session());
  }

  async function post(fn, payload = {}, timeout = 90000) {
    const endpoint = window.APPS_SCRIPT_URL;
    if (!endpoint) throw new Error('No está configurada la URL de Apps Script.');
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;
    try {
      const response = await fetch(`${endpoint}?fn=${encodeURIComponent(fn)}`, {
        method: 'POST',
        headers: { 'Content-Type':'text/plain;charset=utf-8' },
        body: JSON.stringify({ fn, token:token(), ...payload }),
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

  function cleanName(item) {
    const raw = text(item?.nombre || item?.name || item?.titulo || 'Recurso adicional');
    if (/WORD\s+BY\s+WORD\s+DICTIONARY/i.test(raw)) return 'Diccionario Word by Word';
    return raw;
  }

  function isDictionary(item) {
    return /DICCIONARIO|DICTIONARY|WORD\s+BY\s+WORD/i.test(cleanName(item));
  }

  function flatten(items, out = []) {
    (Array.isArray(items) ? items : []).forEach(item => {
      out.push(item);
      if (Array.isArray(item?.children)) flatten(item.children, out);
    });
    return out;
  }

  function resourcesForRole(catalog, role) {
    const resources = Array.isArray(catalog?.recursos) ? catalog.recursos : [];
    if (role === 'teacher' || role === 'docente') {
      return flatten(resources, []).filter(isDictionary).slice(0, 1);
    }
    return resources;
  }

  function openItem(item) {
    const url = item?.tipo === 'folder'
      ? item?.url
      : (item?.preview_url || item?.url || item?.stream_url);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  function makeButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn ${BUTTON_CLASS}`;
    button.textContent = '1.3.2 RECURSOS ADICIONALES';
    button.setAttribute('aria-haspopup', 'dialog');
    Object.assign(button.style, {
      height:'40px', minWidth:'190px', padding:'0 12px', border:'1.5px solid #C9A84E',
      borderRadius:'10px', background:'#FFF8DF', color:'#5E4800', fontSize:'10.5px',
      fontWeight:'950', letterSpacing:'.015em', whiteSpace:'nowrap', flex:'0 0 auto',
    });
    return button;
  }

  function makeModal(state) {
    const backdrop = document.createElement('div');
    backdrop.setAttribute('role', 'presentation');
    backdrop.setAttribute('data-version', VERSION);
    Object.assign(backdrop.style, {
      position:'fixed', inset:'0', zIndex:'99999', display:'none', alignItems:'center',
      justifyContent:'center', padding:'18px', background:'rgba(0,18,43,.58)', backdropFilter:'blur(2px)',
    });

    const dialog = document.createElement('section');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Recursos adicionales');
    Object.assign(dialog.style, {
      width:'min(760px,96vw)', maxHeight:'82vh', overflow:'hidden', display:'flex',
      flexDirection:'column', borderRadius:'18px', background:'#fff', border:'1px solid #E4D5AA',
      boxShadow:'0 24px 70px rgba(0,0,0,.28)',
    });

    const header = document.createElement('div');
    Object.assign(header.style, {
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px',
      padding:'18px 20px', borderBottom:'1px solid #E8E2D6', background:'#FFFDF6',
    });
    const heading = document.createElement('div');
    const kicker = document.createElement('div');
    kicker.textContent = 'RECURSOS DIDÁCTICOS';
    Object.assign(kicker.style, { fontSize:'10px', fontWeight:'950', letterSpacing:'.14em', color:'#7A1E2C' });
    const title = document.createElement('h2');
    title.textContent = '1.3.2 Recursos adicionales';
    Object.assign(title.style, { margin:'3px 0 0', fontSize:'24px', lineHeight:'1.15', color:'#001E47' });
    const subtitle = document.createElement('div');
    Object.assign(subtitle.style, { marginTop:'4px', fontSize:'12px', color:'#687386', fontWeight:'700' });
    heading.append(kicker, title, subtitle);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn';
    close.textContent = 'Cerrar';
    close.addEventListener('click', () => closeModal(state));
    header.append(heading, close);

    const body = document.createElement('div');
    Object.assign(body.style, { padding:'18px 20px 22px', overflow:'auto', minHeight:'170px' });
    dialog.append(header, body);
    backdrop.append(dialog);
    backdrop.addEventListener('click', event => { if (event.target === backdrop) closeModal(state); });
    document.body.appendChild(backdrop);

    state.modal = backdrop;
    state.modalBody = body;
    state.modalSubtitle = subtitle;
    state.closeButton = close;
  }

  function closeModal(state) {
    if (!state.modal) return;
    state.modal.style.display = 'none';
    document.removeEventListener('keydown', state.escapeHandler);
    try { state.button.focus(); } catch (_) {}
  }

  function emptyMessage(container, title, body) {
    const box = document.createElement('div');
    Object.assign(box.style, {
      padding:'26px 20px', border:'1px dashed #D8C99E', borderRadius:'14px',
      background:'#FFFDF7', textAlign:'center',
    });
    const strong = document.createElement('strong');
    strong.textContent = title;
    Object.assign(strong.style, { display:'block', fontSize:'15px', color:'#001E47' });
    const small = document.createElement('div');
    small.textContent = body || '';
    Object.assign(small.style, { marginTop:'6px', fontSize:'12px', lineHeight:'1.55', color:'#687386' });
    box.append(strong, small);
    container.appendChild(box);
  }

  function resourceRow(item, depth) {
    const row = document.createElement('button');
    row.type = 'button';
    row.addEventListener('click', () => openItem(item));
    Object.assign(row.style, {
      width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px',
      padding:'11px 12px', marginTop:'7px', marginLeft:`${Math.min(depth, 3) * 14}px`,
      border:'1px solid #DEE4EC', borderRadius:'11px', background:'#fff', cursor:'pointer',
      textAlign:'left', color:'#001E47', boxSizing:'border-box',
    });
    const left = document.createElement('span');
    left.textContent = `${item?.tipo === 'folder' ? '▣' : '▤'}  ${cleanName(item)}`;
    Object.assign(left.style, { fontSize:'12px', fontWeight:'850', overflow:'hidden', textOverflow:'ellipsis' });
    const action = document.createElement('span');
    action.textContent = item?.tipo === 'folder' ? 'Abrir carpeta' : 'Abrir';
    Object.assign(action.style, { flex:'0 0 auto', fontSize:'10px', fontWeight:'950', color:'#7A1E2C' });
    row.append(left, action);
    return row;
  }

  function renderTree(container, items, depth = 0) {
    (Array.isArray(items) ? items : []).forEach(item => {
      if (item?.tipo === 'folder' && Array.isArray(item.children) && item.children.length) {
        const folder = document.createElement('section');
        Object.assign(folder.style, {
          marginTop:'10px', padding:'12px', border:'1px solid #E6D7A9', borderRadius:'13px', background:'#FFFDF6',
        });
        const folderHead = document.createElement('div');
        Object.assign(folderHead.style, { display:'flex', justifyContent:'space-between', gap:'10px', alignItems:'center' });
        const folderName = document.createElement('strong');
        folderName.textContent = `▣ ${cleanName(item)}`;
        Object.assign(folderName.style, { fontSize:'12.5px', color:'#5E4800' });
        const openFolder = document.createElement('button');
        openFolder.type = 'button';
        openFolder.className = 'btn';
        openFolder.textContent = 'Abrir carpeta';
        Object.assign(openFolder.style, { height:'30px', padding:'0 9px', fontSize:'9.5px' });
        openFolder.addEventListener('click', () => openItem(item));
        folderHead.append(folderName, openFolder);
        folder.appendChild(folderHead);
        renderTree(folder, item.children, depth + 1);
        container.appendChild(folder);
      } else {
        container.appendChild(resourceRow(item, depth));
      }
    });
  }

  function renderModal(state) {
    const role = state.role;
    const resources = resourcesForRole(state.catalog, role);
    state.modalBody.innerHTML = '';
    state.modalSubtitle.textContent = `${state.level} · ${LEVEL_NAMES[state.level] || state.level}`;

    if (state.status === 'loading') {
      emptyMessage(state.modalBody, 'Cargando recursos…', 'Consultando la carpeta oficial del nivel.');
      return;
    }
    if (state.status === 'error') {
      emptyMessage(state.modalBody, 'No se pudieron cargar los recursos', state.error || 'Intentá nuevamente.');
      return;
    }
    if (!resources.length) {
      const teacher = role === 'teacher' || role === 'docente';
      emptyMessage(state.modalBody, teacher ? 'Diccionario no disponible' : 'No hay recursos publicados', teacher ? 'No se encontró el Diccionario Word by Word en este nivel.' : 'La carpeta oficial del nivel está vacía.');
      return;
    }

    if (role === 'teacher' || role === 'docente') {
      const notice = document.createElement('div');
      notice.textContent = 'Vista docente · únicamente Diccionario';
      Object.assign(notice.style, { marginBottom:'8px', fontSize:'10.5px', fontWeight:'950', color:'#7A1E2C', letterSpacing:'.06em', textTransform:'uppercase' });
      state.modalBody.appendChild(notice);
    }
    renderTree(state.modalBody, resources, 0);
  }

  async function loadCatalog(state, force) {
    const user = session();
    state.role = roleOf(user);
    state.level = currentLevel(state.viewer);
    const view = state.role === 'student' || state.role === 'estudiante' ? 'estudiante' : 'docente';
    const cacheKey = `${view}:${state.level}`;
    state.status = 'loading';
    state.error = '';
    state.catalog = null;
    renderModal(state);
    try {
      let catalog = !force ? CACHE[cacheKey] : null;
      if (!catalog) {
        const response = await post('getBibliotecaNivelEstudiante', {
          nivel:state.level,
          codigo:user?.codigo || user?.cedula || '',
          cod_grupo:activeGroup(user),
          vista:view,
        });
        catalog = response?.catalogo || null;
        if (!catalog) throw new Error('El catálogo no devolvió recursos para este nivel.');
        CACHE[cacheKey] = catalog;
      }
      state.catalog = catalog;
      state.status = 'ready';
    } catch (error) {
      state.status = 'error';
      state.error = text(error?.message || error || 'No se pudieron cargar los recursos.');
    }
    renderModal(state);
  }

  function openModal(state) {
    if (!state.modal) makeModal(state);
    state.modal.style.display = 'flex';
    state.escapeHandler = event => { if (event.key === 'Escape') closeModal(state); };
    document.addEventListener('keydown', state.escapeHandler);
    loadCatalog(state, false);
    setTimeout(() => { try { state.closeButton.focus(); } catch (_) {} }, 0);
  }

  function hideLegacySelect(viewer) {
    viewer.querySelectorAll('select[aria-label="Recursos adicionales del nivel"]').forEach(select => {
      select.style.display = 'none';
      select.setAttribute('aria-hidden', 'true');
      select.tabIndex = -1;
    });
  }

  function findTypeRoot(viewer) {
    const typeButton = Array.from(viewer.querySelectorAll('button')).find(button => /^(SB|TB|WB)$/.test(text(button.textContent)));
    return typeButton?.parentElement || null;
  }

  function bindLevelChanges(state) {
    if (state.bound) return;
    state.bound = true;
    state.viewer.addEventListener('click', event => {
      const button = event.target?.closest?.('button');
      const match = text(button?.textContent).match(/^(B1|B2|I1|I2)\s*·/);
      if (!match) return;
      state.level = match[1];
      state.catalog = null;
      state.status = 'idle';
      if (state.modal?.style.display === 'flex') setTimeout(() => loadCatalog(state, false), 0);
    }, true);
  }

  function attach(viewer) {
    hideLegacySelect(viewer);
    const root = findTypeRoot(viewer);
    if (!root) return;

    let state = STATES.get(viewer);
    if (!state) {
      const button = makeButton();
      state = {
        viewer, button, role:roleOf(session()), level:currentLevel(viewer), catalog:null,
        status:'idle', error:'', modal:null, modalBody:null, modalSubtitle:null,
        closeButton:null, escapeHandler:null, bound:false,
      };
      button.addEventListener('click', () => openModal(state));
      STATES.set(viewer, state);
      bindLevelChanges(state);
    }
    if (state.button.parentElement !== root) root.appendChild(state.button);
  }

  let scheduled = false;
  function scan() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      document.querySelectorAll(VIEWER_SELECTOR).forEach(attach);
    });
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('an:lazy-module-loaded', scan);
  window.addEventListener('an:teacher-material-tab', scan);
  window.addEventListener('an:admin-resource-tab', scan);
  window.addEventListener('an:session-changed', scan);
  scan();

  window.__AN_BOOK_ADDITIONAL_RESOURCES_VERSION__ = VERSION;
})();