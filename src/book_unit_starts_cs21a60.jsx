// F98.4-Z6-CS21A75 · Inicios U01–U16 + visor React reutilizable por rol
/* global React, MaterialesView */
(function () {
  const VERSION = 'F98.4-Z6-CS21A75';
  const ADMIN_OPEN_KEY = 'an_admin_resources_open';
  const ADMIN_TAB_KEY = 'an_admin_resources_tab';
  const BLUE = 'var(--an-navy-ink,#001E47)';

  const LEVELS = [
    {
      code: 'B1', name: 'Básico I', color: '#F2C94C',
      fallbackSB: [6, 12, 20, 26, 34, 40, 48, 54, 62, 68, 76, 82, 90, 96, 104, 110],
      SB: { id: '1zVPOGcCca5Ti8M8LtCpEO65-bO0m2_oF', title: 'Interchange 5th intro-SB.pdf' },
      TB: { id: '14NQtUMU6LDt8cVaew4uTTdiqOQbX0EHa', title: 'Interchange 5th intro-TB.pdf' },
      WB: { id: '1J8TAHdFbZudX-VXjMCR6-dPRNyXOEA2d', title: 'Interchange 5th intro-WB.pdf' },
    },
    {
      code: 'B2', name: 'Básico II', color: '#DA291C',
      fallbackSB: [22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112, 120, 126],
      SB: { id: '1uU5ta9FVEVIw7YvxtmT08NIbSHfA73e2', title: 'Interchange 5th 1-SB.pdf' },
      TB: { id: '1_hdqwozKTkR2gWT3fVwmyU_avLXopqt8', title: 'Interchange 5th 1-TB.pdf' },
      WB: { id: '1gb4ks-D66QW9d9EuL8yB8GDRezOMCOpp', title: 'Interchange 5th 1-WB.pdf' },
    },
    {
      code: 'I1', name: 'Intermedio I', color: '#2F6BE0',
      fallbackSB: [8, 14, 22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112],
      SB: { id: '14vdLNY9uuivBs2MPYnj0-k1jcjy31Uch', title: 'Interchange 5th 2-SB.pdf' },
      TB: { id: '1POcwOVbXJvEtnivu7x3iDtq6T_6-_1do', title: 'Interchange 5th 2-TB.pdf' },
      WB: { id: '18griDamY2oTzNFwmxhP10Ie4BfKJTiIY', title: 'Interchange 5th 2-WB.pdf' },
    },
    {
      code: 'I2', name: 'Intermedio II', color: '#2E7D32',
      fallbackSB: [10, 16, 24, 30, 38, 44, 52, 58, 66, 72, 80, 86, 94, 100, 108, 114],
      SB: { id: '1rt9zr_fCmQtpnFexdKBp732rVNGU5HWB', title: 'Interchange 5th 3-SB.pdf' },
      TB: { id: '1FP9I35vPlCqNNqtLScVCTTqhREGwE1go', title: 'Interchange 5th 3-TB.pdf' },
      WB: { id: '1VX-4nsWPnY4jO_U4E0OzdhY0u6EG8gaE', title: 'Interchange 5th 3-WB.pdf' },
    },
  ];

  const TONES = {
    SB: { solid: '#0B4A8B', soft: '#E8F2FC', border: '#2872B6' },
    TB: { solid: '#7A1E2C', soft: '#F9EDEF', border: '#A94A59' },
    WB: { solid: '#237A3B', soft: '#EAF6ED', border: '#4D9B62' },
  };

  function sessionFromStorage() {
    try { return JSON.parse(sessionStorage.getItem('an_usuario') || 'null') || {}; }
    catch (_) { return {}; }
  }

  function currentSession() {
    try {
      return (typeof window.getSesion === 'function' ? window.getSesion() : sessionFromStorage()) || {};
    } catch (_) {
      return sessionFromStorage();
    }
  }

  function roleOf(user) {
    return String(user?.rol || user?.role || '').trim().toLowerCase();
  }

  function sessionToken() {
    return typeof window.getSessionToken === 'function' ? window.getSessionToken() : '';
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
      if (error?.name === 'AbortError') throw new Error('La operación tardó demasiado.');
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function inferStudentLevel(user) {
    const direct = String(user?.nivel_activo || user?.NIVEL_ACTIVO || user?.nivel || user?.NIVEL || '').toUpperCase();
    if (['B1', 'B2', 'I1', 'I2'].includes(direct)) return direct;
    const group = String(user?.grupo || user?.grupoActivo || user?.grupos?.[0] || '').toUpperCase();
    const match = group.match(/(?:^|[-_])(B1|B2|I1|I2)(?:[-_]|$)/);
    return match ? match[1] : 'B1';
  }

  function normalizeUnitStarts(manifest, level, bookType) {
    const raw = Array.isArray(manifest?.unit_starts) ? manifest.unit_starts : [];
    const fallback = bookType === 'SB' ? (LEVELS.find(item => item.code === level)?.fallbackSB || []) : [];
    return Array.from({ length: 16 }, (_, index) => {
      const candidate = raw[index] ?? fallback[index] ?? null;
      const value = Number(candidate);
      return Number.isFinite(value) && value > 0 ? value : null;
    });
  }

  function findSpreadIndex(pages, sourcePage) {
    if (!Array.isArray(pages) || !pages.length || !sourcePage) return 0;
    let index = pages.findIndex(page => Number(page.source_page) >= Number(sourcePage));
    if (index < 0) index = pages.length - 1;
    return Math.floor(index / 2) * 2;
  }

  function driveView(id) { return `https://drive.google.com/file/d/${id}/view`; }
  function driveDownload(id) { return `https://drive.google.com/uc?export=download&id=${id}`; }

  function ImagePage({ page, emptyLabel }) {
    const [status, setStatus] = React.useState(page ? 'loading' : 'empty');
    const [src, setSrc] = React.useState(page?.image_url || '');
    React.useEffect(() => {
      setStatus(page ? 'loading' : 'empty');
      setSrc(page?.image_url || '');
    }, [page?.file_id, page?.image_url]);
    const useFallback = () => {
      if (page?.fallback_url && src !== page.fallback_url) {
        setSrc(page.fallback_url);
        setStatus('loading');
      } else setStatus('error');
    };
    return (
      <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0, background: '#fff', overflow: 'hidden', boxShadow: page ? '0 10px 34px rgba(0,0,0,.32)' : 'none', aspectRatio: '.768/1', display: 'grid', placeItems: 'center' }}>
        {status === 'loading' && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: '#F7F4EF', color: '#6f6a63', fontSize: 12, fontWeight: 800 }}>Cargando hoja…</div>}
        {status === 'empty' && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#C8BFB4', fontSize: 11 }}>{emptyLabel || ''}</div>}
        {status === 'error' && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 18, color: '#9B2C2C', fontSize: 12, fontWeight: 800, textAlign: 'center' }}>No se pudo cargar esta hoja.</div>}
        {page && <img src={src} alt={`Página ${page.source_page}`} decoding="async" loading="eager" draggable="false" onLoad={() => setStatus('ready')} onError={useFallback} style={{ width: '100%', height: '100%', objectFit: 'contain', display: status === 'ready' ? 'block' : 'none', background: '#fff', userSelect: 'none' }} />}
        {page && status === 'ready' && <span style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', padding: '3px 10px', borderRadius: 999, background: 'rgba(0,30,71,.82)', color: '#fff', fontSize: 10, fontWeight: 900 }}>{page.source_page}</span>}
      </div>
    );
  }

  function LevelButtons({ level, setLevel }) {
    return <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>{LEVELS.map(item => {
      const active = item.code === level;
      return <button key={item.code} type="button" className={active ? 'btn btn-primary' : 'btn'} onClick={() => setLevel(item.code)} style={{ minHeight: 40, padding: '0 12px', fontWeight: 900 }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 99, background: item.color, marginRight: 7 }} />{item.code} · {item.name}</button>;
    })}</div>;
  }

  function TypeButtons({ type, setType, allowedTypes }) {
    return <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>{allowedTypes.map(key => {
      const tone = TONES[key];
      const active = type === key;
      return <button key={key} type="button" className="btn" onClick={() => setType(key)} aria-pressed={active} style={{ minWidth: 64, height: 40, padding: '0 12px', border: `2px solid ${tone.border}`, borderRadius: 10, background: active ? tone.solid : tone.soft, color: active ? '#fff' : tone.solid, fontWeight: 950, fontSize: 14 }}>{key}</button>;
    })}</div>;
  }

  function UnitButtons({ unitStarts, selectedUnit, disabled, canCalibrate, savingUnit, currentSourcePage, onPick, onSave }) {
    return (
      <div style={{ padding: '10px 14px 12px', borderTop: '1px solid var(--line,#e5e0d8)', background: 'linear-gradient(180deg,#FFFDF7,#FFF8E4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <strong style={{ fontSize: 12.5, color: BLUE }}>Inicio oficial por unidad</strong>
          <span style={{ fontSize: 10.5, fontWeight: 850, color: '#6B5A35' }}>{canCalibrate ? `Superadmin · “Actualizar” guardará la hoja visible ${currentSourcePage || '—'}` : 'Los inicios se cargan desde la configuración central del libro'}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16,minmax(52px,1fr))', gap: 5, overflowX: 'auto', paddingBottom: 2 }}>
          {Array.from({ length: 16 }, (_, index) => {
            const unit = index + 1;
            const sourcePage = unitStarts[index];
            const active = selectedUnit === unit;
            const mapped = Number.isFinite(Number(sourcePage)) && Number(sourcePage) > 0;
            return (
              <div key={unit} style={{ display: 'grid', gridTemplateRows: canCalibrate ? '36px 21px' : '36px', gap: 3, minWidth: 52 }}>
                <button type="button" disabled={disabled || !mapped} onClick={() => onPick(unit)} title={mapped ? `U${String(unit).padStart(2, '0')} · hoja ${sourcePage}` : `U${String(unit).padStart(2, '0')} · sin configurar`} style={{ padding: '4px 3px', border: active ? '2px solid #F2C94C' : '1px solid #D7B34A', borderRadius: 8, background: active ? '#0B4A8B' : mapped ? '#FFF7D6' : '#F0ECE2', color: active ? '#fff' : mapped ? '#674D00' : '#8A8173', fontWeight: 950, fontSize: 10.5, cursor: disabled || !mapped ? 'not-allowed' : 'pointer', opacity: disabled ? .62 : 1 }}>U{String(unit).padStart(2, '0')}</button>
                {canCalibrate && <button type="button" disabled={disabled || !currentSourcePage || savingUnit != null} onClick={() => onSave(unit)} title={`Guardar la hoja visible ${currentSourcePage || '—'} como inicio de U${String(unit).padStart(2, '0')}`} style={{ height: 21, padding: '0 2px', border: '1px solid #A6B1BF', borderRadius: 6, background: savingUnit === unit ? '#DCE8F5' : '#fff', color: '#30445D', fontSize: 7.5, fontWeight: 900, lineHeight: 1, cursor: disabled || !currentSourcePage || savingUnit != null ? 'not-allowed' : 'pointer' }}>{savingUnit === unit ? 'Guardando…' : 'Actualizar'}</button>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function BookResourcesCS21A60({ studentMode = false, initialType = 'SB' }) {
    const stored = sessionFromStorage();
    const storedRole = roleOf(stored);
    const canCalibrate = storedRole === 'superadmin';
    const canRefreshDrive = storedRole === 'admin' || storedRole === 'superadmin';
    const fixedStudentLevel = inferStudentLevel(stored);
    const [level, setLevel] = React.useState(studentMode ? fixedStudentLevel : 'B1');
    const allowedTypes = studentMode ? ['SB', 'WB'] : ['SB', 'TB', 'WB'];
    const safeInitialType = allowedTypes.includes(initialType) ? initialType : allowedTypes[0];
    const [bookType, setBookType] = React.useState(safeInitialType);
    const [manifest, setManifest] = React.useState(null);
    const [status, setStatus] = React.useState('loading');
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [spreadIndex, setSpreadIndex] = React.useState(0);
    const [selectedUnit, setSelectedUnit] = React.useState(1);
    const [savingUnit, setSavingUnit] = React.useState(null);
    const [syncingDrive, setSyncingDrive] = React.useState(false);
    const [zoom, setZoom] = React.useState(1);
    const hostRef = React.useRef(null);

    const selectedLevel = LEVELS.find(item => item.code === level) || LEVELS[0];
    const entry = selectedLevel[bookType];
    const pages = manifest?.pages || [];
    const unitStarts = normalizeUnitStarts(manifest, level, bookType);
    const leftPage = pages[spreadIndex] || null;
    const rightPage = pages[spreadIndex + 1] || null;
    const currentSourcePage = Number(rightPage?.source_page || leftPage?.source_page || 0) || null;
    const canPrevious = status === 'ready' && spreadIndex > 0;
    const canNext = status === 'ready' && spreadIndex + 2 < pages.length;

    const positionUnit = React.useCallback((unit, sourceManifest = manifest) => {
      const starts = normalizeUnitStarts(sourceManifest, level, bookType);
      const sourcePage = starts[unit - 1];
      if (!sourcePage || !sourceManifest?.pages?.length) return;
      setSpreadIndex(findSpreadIndex(sourceManifest.pages, sourcePage));
      setSelectedUnit(unit);
    }, [manifest, level, bookType]);

    const load = React.useCallback(async (force = false) => {
      setStatus('loading'); setError(''); setMessage(''); setManifest(null); setSpreadIndex(0);
      try {
        const data = await post('teacherBooksOpenImageBook', { level, book_type: bookType, force: Boolean(force) });
        setManifest(data); setStatus('ready');
        const initial = normalizeUnitStarts(data, level, bookType)[0];
        if (initial) setSpreadIndex(findSpreadIndex(data.pages || [], initial));
        setSelectedUnit(1);
      } catch (reason) {
        setError(String(reason?.message || reason || 'No se pudo cargar el libro.'));
        setStatus('error');
      }
    }, [level, bookType]);

    React.useEffect(() => { load(false); }, [load]);
    React.useEffect(() => { setSelectedUnit(1); setZoom(1); }, [level, bookType]);
    React.useEffect(() => {
      [pages[spreadIndex + 2], pages[spreadIndex + 3]].filter(Boolean).forEach(page => { const image = new Image(); image.src = page.image_url; });
    }, [manifest, spreadIndex]);

    const saveUnitStart = async unit => {
      if (!canCalibrate || !currentSourcePage || savingUnit != null) return;
      setSavingUnit(unit); setError(''); setMessage(`Guardando U${String(unit).padStart(2, '0')} en hoja ${currentSourcePage}…`);
      try {
        const result = await post('superadminBooksSetUnitStart', { level, book_type: bookType, unit, source_page: currentSourcePage });
        setManifest(result); setSelectedUnit(unit); setSpreadIndex(findSpreadIndex(result.pages || [], currentSourcePage));
        setMessage(`U${String(unit).padStart(2, '0')} quedó guardada en la hoja ${currentSourcePage} para ${level} · ${bookType}. Docentes y estudiantes usarán este inicio.`);
      } catch (reason) {
        setMessage(''); setError(String(reason?.message || reason || 'No se pudo guardar el inicio de la unidad.'));
      } finally { setSavingUnit(null); }
    };

    const refreshDrive = async () => {
      if (!canRefreshDrive || syncingDrive) return;
      setSyncingDrive(true); setError(''); setMessage(`Actualizando únicamente ${level} · ${bookType} desde Drive…`);
      try {
        const result = await post('adminBooksRefreshOpenBook', { level, book_type: bookType });
        setManifest(result);
        const activeSource = normalizeUnitStarts(result, level, bookType)[selectedUnit - 1];
        setSpreadIndex(findSpreadIndex(result.pages || [], activeSource));
        setMessage(`${level} · ${bookType} actualizado desde Drive. Los inicios U01–U16 se conservaron.`);
      } catch (reason) {
        setMessage(''); setError(String(reason?.message || reason || 'No se pudo actualizar el libro desde Drive.'));
      } finally { setSyncingDrive(false); }
    };

    const toggleFullscreen = () => {
      const element = hostRef.current;
      if (!element) return;
      try { if (document.fullscreenElement) document.exitFullscreen(); else if (element.requestFullscreen) element.requestFullscreen(); } catch (_) {}
    };

    return (
      <section data-screen-label={`${studentMode ? 'Estudiante' : 'Recursos'} · CS21A75 · Libros`} style={{ padding: studentMode ? '0 0 18px' : '10px 12px 18px', width: '100%', boxSizing: 'border-box' }}>
        <div ref={hostRef} style={{ width: '100%', background: '#fff', border: '1px solid var(--line,#e5e0d8)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 28px rgba(0,0,0,.06)' }}>
          <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderBottom: '1px solid var(--line,#e5e0d8)' }}>
            <div style={{ minWidth: 220, flex: '1 1 260px' }}>
              <div style={{ fontSize: 10, fontWeight: 950, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--an-granate,#7A1E2C)' }}>{studentMode ? 'Libro del nivel actual' : 'Recursos Didácticos'}</div>
              <div style={{ fontSize: 23, fontWeight: 950, color: BLUE, lineHeight: 1.12, marginTop: 2 }}>Libros de texto · {selectedLevel.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3,#6f6a63)', marginTop: 4 }}>{manifest?.title || entry?.title || `${level} · ${bookType}`}{manifest?.page_count_visible ? ` · ${manifest.page_count_visible} hojas` : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <TypeButtons type={bookType} setType={setBookType} allowedTypes={allowedTypes} />
              {!studentMode && <><button className="btn" type="button" onClick={() => window.open(manifest?.pdf_view_url || driveView(entry.id), '_blank', 'noopener,noreferrer')}>Abrir PDF</button><button className="btn btn-primary" type="button" onClick={() => window.open(manifest?.pdf_download_url || driveDownload(entry.id), '_blank', 'noopener,noreferrer')}>Descargar PDF</button></>}
            </div>
          </div>
          {!studentMode && <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--line,#e5e0d8)', background: 'var(--surface-2,#F7F4EF)' }}><LevelButtons level={level} setLevel={setLevel} /></div>}
          <UnitButtons unitStarts={unitStarts} selectedUnit={selectedUnit} disabled={status !== 'ready'} canCalibrate={canCalibrate} savingUnit={savingUnit} currentSourcePage={currentSourcePage} onPick={unit => positionUnit(unit)} onSave={saveUnitStart} />
          {(message || error) && <div role="status" style={{ margin: '9px 12px 0', padding: '9px 12px', borderRadius: 10, border: `1px solid ${error ? '#D66' : '#58A36B'}`, background: error ? '#FFF0F0' : '#EDF9F0', color: error ? '#8D1E1E' : '#1F6333', fontSize: 11, fontWeight: 850 }}>{error || message}</div>}
          <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: 'rgba(12,18,27,.96)', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn" type="button" disabled={!canPrevious} onClick={() => setSpreadIndex(index => Math.max(0, index - 2))}>Anterior</button>
              <strong style={{ fontSize: 12.5 }}>{status === 'ready' ? `Hojas ${leftPage?.display_index || 0}${rightPage ? `–${rightPage.display_index}` : ''} / ${pages.length} · fuente ${leftPage?.source_page || '—'}${rightPage ? `–${rightPage.source_page}` : ''}` : status === 'error' ? 'Carga detenida' : 'Preparando libro…'}</strong>
              <button className="btn" type="button" disabled={!canNext} onClick={() => setSpreadIndex(index => Math.min(Math.max(0, pages.length - 1), index + 2))}>Siguiente</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              {canRefreshDrive && <button className="btn" type="button" disabled={syncingDrive} onClick={refreshDrive}>{syncingDrive ? 'Actualizando Drive…' : 'Actualizar desde Drive'}</button>}
              <button className="btn" type="button" onClick={() => setZoom(value => Math.max(.72, +(value - .1).toFixed(2)))}>−</button><span style={{ minWidth: 48, textAlign: 'center', fontSize: 11, fontWeight: 900 }}>{Math.round(zoom * 100)}%</span><button className="btn" type="button" onClick={() => setZoom(value => Math.min(1.55, +(value + .1).toFixed(2)))}>+</button><button className="btn" type="button" onClick={toggleFullscreen}>Pantalla completa</button>
            </div>
          </div>
          {status === 'loading' && <div style={{ minHeight: 520, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 50% 12%,#887664 0%,#4B4137 53%,#27231E 100%)', color: '#fff', fontWeight: 900 }}>Cargando las primeras dos hojas…</div>}
          {status === 'error' && <div style={{ minHeight: 420, display: 'grid', placeItems: 'center', padding: 24, background: 'radial-gradient(circle at 50% 12%,#887664 0%,#4B4137 53%,#27231E 100%)', color: '#fff' }}><button className="btn btn-primary" type="button" onClick={() => load(true)}>Reintentar</button></div>}
          {status === 'ready' && <div style={{ overflow: 'auto', padding: '22px 18px 34px', background: 'radial-gradient(circle at 50% 12%,#887664 0%,#4B4137 53%,#27231E 100%)' }}><div style={{ width: `${zoom * 100}%`, minWidth: 820, maxWidth: 1900, margin: '0 auto', display: 'flex', gap: 0, alignItems: 'stretch' }}><ImagePage page={leftPage} /><div aria-hidden="true" style={{ width: 20, margin: '0 -10px', zIndex: 3, background: 'linear-gradient(90deg,rgba(0,0,0,.42),rgba(255,255,255,.18),rgba(0,0,0,.42))', boxShadow: '0 0 22px rgba(0,0,0,.46)' }} /><ImagePage page={rightPage} emptyLabel="Fin del libro" /></div></div>}
        </div>
      </section>
    );
  }

  window.__AN_BOOK_RESOURCES_COMPONENT__ = BookResourcesCS21A60;

  function installMaterialPatch() {
    const Current = window.MaterialesView || (typeof MaterialesView === 'function' ? MaterialesView : null);
    if (!Current || Current.__cs21a75UnitStarts) return false;
    if (Current.__cs21a60UnitStarts && !Current.__cs21a75UnitStarts) {
      window.__AN_CS21A59_TEACHER_MATERIALS_BASE__ = Current;
      return true;
    }
    const Base = Current;
    const Wrapped = function MaterialesViewCS21A75(props) {
      const user = currentSession();
      const role = roleOf(user);
      const adminOpen = sessionStorage.getItem(ADMIN_OPEN_KEY) === '1';
      const adminTab = sessionStorage.getItem(ADMIN_TAB_KEY) || 'libros';
      if ((role === 'admin' || role === 'superadmin') && adminOpen) return <BookResourcesCS21A60 initialType={adminTab === 'audios' ? 'SB' : 'SB'} />;
      if (role === 'student' || role === 'estudiante') return <><BookResourcesCS21A60 studentMode initialType="SB" /><Base {...props} /></>;
      return <Base {...props} />;
    };
    Wrapped.__cs21a75UnitStarts = true;
    Wrapped.__cs21a60UnitStarts = true;
    Wrapped.__base = Base;
    window.MaterialesView = Wrapped;
    window.__AN_CS21A59_TEACHER_MATERIALS_BASE__ = Wrapped;
    try { MaterialesView = Wrapped; } catch (_) {}
    return true;
  }

  function install() { installMaterialPatch(); }
  install();
  window.addEventListener('an:lazy-module-loaded', () => setTimeout(install, 20));
  window.addEventListener('an:teacher-material-tab', () => setTimeout(install, 20));
  window.addEventListener('an:admin-resource-tab', () => setTimeout(install, 20));
  const probe = setInterval(() => { if (installMaterialPatch()) clearInterval(probe); }, 250);
  setTimeout(() => clearInterval(probe), 20000);
  window.__AN_BOOK_UNIT_STARTS_VERSION__ = VERSION;
})();