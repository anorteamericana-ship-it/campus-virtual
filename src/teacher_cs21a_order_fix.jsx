// F98.4-Z6-CS21A58 · Visor de libros por imágenes WebP ordenadas
/* global React, getSesion, MaterialesView */
(function () {
  const VERSION = 'F98.4-Z6-CS21A58';
  const BLUE = 'var(--an-navy-ink,#001E47)';

  const TONES = {
    SB: { solid: '#0B4A8B', soft: '#E8F2FC', border: '#2872B6' },
    TB: { solid: '#7A1E2C', soft: '#F9EDEF', border: '#A94A59' },
    WB: { solid: '#237A3B', soft: '#EAF6ED', border: '#4D9B62' },
  };

  // Mapa provisional para QA. Se ajusta después de probar cada libro.
  const LEVELS = [
    {
      code: 'B1',
      name: 'Básico I',
      color: '#F2C94C',
      sourceFolder: '1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH',
      unitStarts: [6, 12, 20, 26, 34, 40, 48, 54, 62, 68, 76, 82, 90, 96, 104, 110],
      SB: { id: '1zVPOGcCca5Ti8M8LtCpEO65-bO0m2_oF', title: 'Interchange 5th intro-SB.pdf' },
      TB: { id: '14NQtUMU6LDt8cVaew4uTTdiqOQbX0EHa', title: 'Interchange 5th intro-TB.pdf' },
      WB: { id: '1J8TAHdFbZudX-VXjMCR6-dPRNyXOEA2d', title: 'Interchange 5th intro-WB.pdf' },
    },
    {
      code: 'B2',
      name: 'Básico II',
      color: '#DA291C',
      sourceFolder: '1BpIzdHI1hd5ucmzOfYo9WnIc4yAtE2SJ',
      unitStarts: [22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112, 120, 126],
      SB: { id: '1uU5ta9FVEVIw7YvxtmT08NIbSHfA73e2', title: 'Interchange 5th 1-SB.pdf' },
      TB: { id: '1_hdqwozKTkR2gWT3fVwmyU_avLXopqt8', title: 'Interchange 5th 1-TB.pdf' },
      WB: { id: '1gb4ks-D66QW9d9EuL8yB8GDRezOMCOpp', title: 'Interchange 5th 1-WB.pdf' },
    },
    {
      code: 'I1',
      name: 'Intermedio I',
      color: '#2F6BE0',
      sourceFolder: '1h3MWODA07lGzUDepOtJV8JvxzqvLncAX',
      unitStarts: [8, 14, 22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112],
      SB: { id: '14vdLNY9uuivBs2MPYnj0-k1jcjy31Uch', title: 'Interchange 5th 2-SB.pdf' },
      TB: { id: '1POcwOVbXJvEtnivu7x3iDtq6T_6-_1do', title: 'Interchange 5th 2-TB.pdf' },
      WB: { id: '18griDamY2oTzNFwmxhP10Ie4BfKJTiIY', title: 'Interchange 5th 2-WB.pdf' },
    },
    {
      code: 'I2',
      name: 'Intermedio II',
      color: '#2E7D32',
      sourceFolder: '1Nco9Iwcz3P9ARMLP39HKo2AXTZJ4H3FP',
      unitStarts: [10, 16, 24, 30, 38, 44, 52, 58, 66, 72, 80, 86, 94, 100, 108, 114],
      SB: { id: '1rt9zr_fCmQtpnFexdKBp732rVNGU5HWB', title: 'Interchange 5th 3-SB.pdf' },
      TB: { id: '1FP9I35vPlCqNNqtLScVCTTqhREGwE1go', title: 'Interchange 5th 3-TB.pdf' },
      WB: { id: '1VX-4nsWPnY4jO_U4E0OzdhY0u6EG8gaE', title: 'Interchange 5th 3-WB.pdf' },
    },
  ];

  function currentSession() {
    try {
      return (
        typeof getSesion === 'function'
          ? getSesion()
          : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')
      ) || {};
    } catch (_) {
      return {};
    }
  }

  function activeScreen() {
    return sessionStorage.getItem('an_teacher_materiales_tab') || 'info';
  }

  function sessionToken() {
    return typeof window.getSessionToken === 'function'
      ? window.getSessionToken()
      : '';
  }

  async function api(fn, payload = {}, timeout = 60000) {
    const endpoint = window.APPS_SCRIPT_URL;
    if (!endpoint) throw new Error('No está configurada la URL de Apps Script.');

    const controller = typeof AbortController !== 'undefined'
      ? new AbortController()
      : null;
    const timer = controller
      ? setTimeout(() => controller.abort(), timeout)
      : null;

    try {
      const response = await fetch(
        `${endpoint}?fn=${encodeURIComponent(fn)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            fn,
            token: sessionToken(),
            ...payload,
          }),
          signal: controller ? controller.signal : undefined,
        }
      );

      const raw = await response.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch (_) {
        throw new Error('Apps Script devolvió una respuesta inválida.');
      }

      if (!response.ok || !data || data.ok !== true) {
        throw new Error(data?.mensaje || data?.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error('La carga de las imágenes tardó demasiado.');
      }
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function driveView(id) {
    return `https://drive.google.com/file/d/${id}/view`;
  }

  function driveDownload(id) {
    return `https://drive.google.com/uc?export=download&id=${id}`;
  }

  function driveFolder(id) {
    return `https://drive.google.com/drive/folders/${id}`;
  }

  function injectStyles() {
    if (document.getElementById('an-cs21a58-book-styles')) return;
    const style = document.createElement('style');
    style.id = 'an-cs21a58-book-styles';
    style.textContent = `
      @keyframes anCs21a58UnitPulse {
        0%,100% {
          box-shadow: 0 0 0 0 rgba(242,201,76,.22), 0 0 10px rgba(242,201,76,.35);
          transform: translateY(0);
        }
        50% {
          box-shadow: 0 0 0 7px rgba(242,201,76,0), 0 0 22px rgba(242,201,76,.95);
          transform: translateY(-1px);
        }
      }
      .an-cs21a58-unit-hint {
        animation: anCs21a58UnitPulse 1.25s ease-in-out infinite;
      }
      .an-cs21a58-book-image {
        -webkit-user-drag: none;
        user-select: none;
      }
    `;
    document.head.appendChild(style);
  }

  function findUnitSpreadIndex(pages, sourcePage) {
    if (!Array.isArray(pages) || !pages.length) return 0;

    let index = pages.findIndex(
      page => Number(page.source_page) >= Number(sourcePage)
    );

    if (index < 0) index = pages.length - 1;

    // El pliego se forma por orden del arreglo: 0+1, 2+3, 4+5...
    return Math.floor(index / 2) * 2;
  }

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
      } else {
        setStatus('error');
      }
    };

    return (
      <div
        style={{
          position: 'relative',
          flex: '1 1 0',
          minWidth: 0,
          background: '#fff',
          overflow: 'hidden',
          boxShadow: page ? '0 10px 34px rgba(0,0,0,.32)' : 'none',
          aspectRatio: '.768/1',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {status === 'loading' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              background: '#F7F4EF',
              color: '#6f6a63',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            Cargando hoja…
          </div>
        )}

        {status === 'empty' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              background: 'transparent',
              color: '#C8BFB4',
              fontSize: 11,
            }}
          >
            {emptyLabel || ''}
          </div>
        )}

        {status === 'error' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              background: '#fff',
              color: '#9B2C2C',
              fontSize: 12,
              fontWeight: 800,
              textAlign: 'center',
              padding: 18,
            }}
          >
            No se pudo cargar esta hoja.
          </div>
        )}

        {page && (
          <img
            className="an-cs21a58-book-image"
            src={src}
            alt={`Página ${page.source_page}`}
            decoding="async"
            loading="eager"
            onLoad={() => setStatus('ready')}
            onError={useFallback}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: status === 'ready' ? 'block' : 'none',
              background: '#fff',
            }}
          />
        )}

        {page && status === 'ready' && (
          <span
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '3px 10px',
              borderRadius: 999,
              background: 'rgba(0,30,71,.82)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 900,
            }}
          >
            {page.source_page}
          </span>
        )}
      </div>
    );
  }

  function ImageBookSpread({
    level,
    bookType,
    selectedUnit,
    onUnitResolved,
    onMeta,
  }) {
    const hostRef = React.useRef(null);
    const [manifest, setManifest] = React.useState(null);
    const [status, setStatus] = React.useState('loading');
    const [error, setError] = React.useState('');
    const [spreadIndex, setSpreadIndex] = React.useState(0);
    const [zoom, setZoom] = React.useState(1);
    const [refreshKey, setRefreshKey] = React.useState(0);

    const load = React.useCallback(
      async force => {
        setStatus('loading');
        setError('');
        setManifest(null);
        setSpreadIndex(0);

        try {
          const data = await api(
            'teacherBooksOpenImageBook',
            {
              level,
              book_type: bookType,
              force: Boolean(force),
            },
            90000
          );

          setManifest(data);
          setStatus('ready');
          onMeta?.(data);
        } catch (reason) {
          setError(String(reason?.message || reason || 'No se pudo cargar el libro.'));
          setStatus('error');
        }
      },
      [level, bookType, onMeta]
    );

    React.useEffect(() => {
      load(refreshKey > 0);
    }, [level, bookType, refreshKey]);

    React.useEffect(() => {
      if (
        !manifest?.pages?.length ||
        bookType !== 'SB' ||
        selectedUnit == null
      ) {
        return;
      }

      const currentLevel = LEVELS.find(item => item.code === level) || LEVELS[0];
      const sourcePage = currentLevel.unitStarts[selectedUnit - 1];
      const nextIndex = findUnitSpreadIndex(manifest.pages, sourcePage);

      setSpreadIndex(nextIndex);
      onUnitResolved?.({
        unit: selectedUnit,
        sourcePage,
        spreadIndex: nextIndex,
        left: manifest.pages[nextIndex] || null,
        right: manifest.pages[nextIndex + 1] || null,
      });
    }, [manifest, selectedUnit, level, bookType, onUnitResolved]);

    React.useEffect(() => {
      const pages = manifest?.pages || [];
      const preload = [
        pages[spreadIndex + 2],
        pages[spreadIndex + 3],
      ].filter(Boolean);

      preload.forEach(page => {
        const image = new Image();
        image.src = page.image_url;
      });
    }, [manifest, spreadIndex]);

    const pages = manifest?.pages || [];
    const leftPage = pages[spreadIndex] || null;
    const rightPage = pages[spreadIndex + 1] || null;
    const canPrevious = status === 'ready' && spreadIndex > 0;
    const canNext = status === 'ready' && spreadIndex + 2 < pages.length;

    const toggleFullscreen = () => {
      const element = hostRef.current;
      if (!element) return;

      try {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (element.requestFullscreen) {
          element.requestFullscreen();
        }
      } catch (_) {}
    };

    const label = status === 'ready'
      ? `Hojas ${leftPage?.display_index || 0}${rightPage ? `–${rightPage.display_index}` : ''} / ${pages.length}`
      : status === 'error'
        ? 'Carga detenida'
        : 'Preparando libro…';

    return (
      <div
        ref={hostRef}
        style={{
          width: '100%',
          minHeight: 'calc(100vh - 250px)',
          background: 'radial-gradient(circle at 50% 12%,#887664 0%,#4B4137 53%,#27231E 100%)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            background: 'rgba(12,18,27,.96)',
            color: '#fff',
            position: 'sticky',
            top: 0,
            zIndex: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn"
              type="button"
              disabled={!canPrevious}
              onClick={() => setSpreadIndex(index => Math.max(0, index - 2))}
            >
              Anterior
            </button>

            <strong style={{ fontSize: 12.5 }}>{label}</strong>

            <button
              className="btn"
              type="button"
              disabled={!canNext}
              onClick={() => setSpreadIndex(index => Math.min(pages.length - 1, index + 2))}
            >
              Siguiente
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <button
              className="btn"
              type="button"
              onClick={() => setRefreshKey(value => value + 1)}
            >
              Actualizar desde Drive
            </button>

            <button
              className="btn"
              type="button"
              onClick={() => setZoom(value => Math.max(.72, +(value - .1).toFixed(2)))}
            >
              −
            </button>

            <span style={{ minWidth: 48, textAlign: 'center', fontSize: 11, fontWeight: 900 }}>
              {Math.round(zoom * 100)}%
            </span>

            <button
              className="btn"
              type="button"
              onClick={() => setZoom(value => Math.min(1.55, +(value + .1).toFixed(2)))}
            >
              +
            </button>

            <button className="btn" type="button" onClick={toggleFullscreen}>
              Pantalla completa
            </button>
          </div>
        </div>

        {status === 'loading' && (
          <div
            style={{
              flex: 1,
              minHeight: 620,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 900,
            }}
          >
            Cargando las primeras dos hojas…
          </div>
        )}

        {status === 'error' && (
          <div
            style={{
              flex: 1,
              minHeight: 620,
              display: 'grid',
              placeItems: 'center',
              padding: 24,
              color: '#fff',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 950 }}>
                No se pudo cargar el libro por imágenes.
              </div>
              <div style={{ marginTop: 8, fontSize: 11, opacity: .75 }}>
                {error}
              </div>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setRefreshKey(value => value + 1)}
                style={{ marginTop: 14 }}
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <div style={{ flex: 1, overflow: 'auto', padding: '22px 18px 34px' }}>
            <div
              style={{
                width: `${zoom * 100}%`,
                minWidth: 820,
                maxWidth: 1900,
                margin: '0 auto',
                display: 'flex',
                gap: 0,
                alignItems: 'stretch',
              }}
            >
              <ImagePage page={leftPage} />

              <div
                aria-hidden="true"
                style={{
                  width: 20,
                  margin: '0 -10px',
                  zIndex: 3,
                  background: 'linear-gradient(90deg,rgba(0,0,0,.42),rgba(255,255,255,.18),rgba(0,0,0,.42))',
                  boxShadow: '0 0 22px rgba(0,0,0,.46)',
                }}
              />

              <ImagePage page={rightPage} emptyLabel="Fin del libro" />
            </div>

            {manifest?.missing_count > 0 && (
              <div
                style={{
                  margin: '14px auto 0',
                  maxWidth: 760,
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: '#FFF4D8',
                  color: '#6B4D00',
                  fontSize: 11,
                  fontWeight: 800,
                  textAlign: 'center',
                }}
              >
                Hay {manifest.missing_count} imagen(es) faltante(s) en Drive.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function LevelButtons({ level, setLevel }) {
    return (
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
        {LEVELS.map(item => {
          const active = item.code === level;
          return (
            <button
              key={item.code}
              type="button"
              className={active ? 'btn btn-primary' : 'btn'}
              onClick={() => setLevel(item.code)}
              style={{
                minHeight: 42,
                padding: '0 13px',
                fontWeight: 900,
                border: active
                  ? '1px solid transparent'
                  : '1px solid var(--line,#ddd)',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 99,
                  background: item.color,
                  marginRight: 7,
                }}
              />
              {item.code} · {item.name}
            </button>
          );
        })}
      </div>
    );
  }

  function TypeButtons({ type, setType }) {
    return (
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
        {['SB', 'TB', 'WB'].map(key => {
          const tone = TONES[key];
          const active = type === key;

          return (
            <button
              key={key}
              type="button"
              className="btn"
              onClick={() => setType(key)}
              aria-pressed={active}
              style={{
                minWidth: 66,
                height: 42,
                padding: '0 13px',
                border: `2px solid ${tone.border}`,
                borderRadius: 10,
                background: active ? tone.solid : tone.soft,
                color: active ? '#fff' : tone.solid,
                fontWeight: 950,
                fontSize: 14,
                boxShadow: active ? '0 4px 12px rgba(0,30,71,.2)' : 'none',
              }}
            >
              {key}
            </button>
          );
        })}
      </div>
    );
  }

  function UnitButtons({
    level,
    selectedUnit,
    disabled,
    onPick,
    resolved,
  }) {
    const currentLevel = LEVELS.find(item => item.code === level) || LEVELS[0];

    return (
      <div
        style={{
          padding: '10px 14px 12px',
          borderTop: '1px solid var(--line,#e5e0d8)',
          background: 'linear-gradient(180deg,#FFFDF7,#FFF8E4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 8,
          }}
        >
          <strong style={{ fontSize: 12.5, color: BLUE }}>
            Selecciona la unidad para ubicar el libro
          </strong>

          <span style={{ fontSize: 10.5, fontWeight: 850, color: '#6B5A35' }}>
            {resolved
              ? `U${String(resolved.unit).padStart(2, '0')} · fuente ${resolved.sourcePage} · muestra ${resolved.left?.source_page || '—'}–${resolved.right?.source_page || '—'}`
              : 'El mapa es provisional y se ajustará después de la prueba'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(16,minmax(42px,1fr))',
            gap: 5,
            overflowX: 'auto',
          }}
        >
          {currentLevel.unitStarts.map((sourcePage, index) => {
            const unit = index + 1;
            const active = selectedUnit === unit;
            const hint = selectedUnit == null && unit === 1;

            return (
              <button
                key={unit}
                type="button"
                disabled={disabled}
                onClick={() => onPick(unit)}
                className={hint ? 'an-cs21a58-unit-hint' : ''}
                title={`U${String(unit).padStart(2, '0')} · página fuente provisional ${sourcePage}`}
                style={{
                  minHeight: 36,
                  padding: '4px 3px',
                  border: active
                    ? '2px solid #F2C94C'
                    : '1px solid #D7B34A',
                  borderRadius: 8,
                  background: active
                    ? '#0B4A8B'
                    : hint
                      ? '#FFE36B'
                      : '#FFF7D6',
                  color: active ? '#fff' : '#674D00',
                  fontWeight: 950,
                  fontSize: 10.5,
                  cursor: disabled ? 'wait' : 'pointer',
                  opacity: disabled ? .62 : 1,
                }}
              >
                U{String(unit).padStart(2, '0')}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function Books({ mode }) {
    const library = mode === 'biblioteca';
    const [level, setLevel] = React.useState('B1');
    const [type, setType] = React.useState(library ? 'TB' : 'SB');
    const [selectedUnit, setSelectedUnit] = React.useState(null);
    const [resolvedUnit, setResolvedUnit] = React.useState(null);
    const [meta, setMeta] = React.useState(null);

    const selectedLevel = LEVELS.find(item => item.code === level) || LEVELS[0];
    const realType = library ? 'TB' : type;
    const entry = selectedLevel[realType];

    React.useEffect(() => {
      setSelectedUnit(null);
      setResolvedUnit(null);
      setMeta(null);
    }, [level, realType]);

    const title = library ? 'Biblioteca digital' : 'Libros de texto';

    return (
      <section
        data-screen-label={`Docente · CS21A58 · ${mode}`}
        style={{
          padding: '10px 12px 18px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            background: '#fff',
            border: '1px solid var(--line,#e5e0d8)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 8px 28px rgba(0,0,0,.06)',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              borderBottom: '1px solid var(--line,#e5e0d8)',
            }}
          >
            <div style={{ minWidth: 220, flex: '1 1 260px' }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 950,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  color: 'var(--an-granate,#7A1E2C)',
                }}
              >
                Recursos Didácticos
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 950,
                  color: BLUE,
                  lineHeight: 1.12,
                  marginTop: 2,
                }}
              >
                {title} · {selectedLevel.name}
              </div>

              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--ink-3,#6f6a63)',
                  marginTop: 4,
                }}
              >
                {meta?.title || entry.title}
                {meta?.page_count_visible
                  ? ` · ${meta.page_count_visible} hojas`
                  : ''}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              {!library && <TypeButtons type={type} setType={setType} />}

              <button
                className="btn"
                type="button"
                onClick={() => window.open(
                  meta?.images_folder_url || driveFolder(selectedLevel.sourceFolder),
                  '_blank',
                  'noopener,noreferrer'
                )}
              >
                Imágenes Drive
              </button>

              <button
                className="btn"
                type="button"
                onClick={() => window.open(
                  meta?.pdf_view_url || driveView(entry.id),
                  '_blank',
                  'noopener,noreferrer'
                )}
              >
                Abrir PDF
              </button>

              <button
                className="btn btn-primary"
                type="button"
                onClick={() => window.open(
                  meta?.pdf_download_url || driveDownload(entry.id),
                  '_blank',
                  'noopener,noreferrer'
                )}
              >
                Descargar PDF
              </button>
            </div>
          </div>

          <div
            style={{
              padding: '9px 14px',
              borderBottom: '1px solid var(--line,#e5e0d8)',
              background: 'var(--surface-2,#F7F4EF)',
            }}
          >
            <LevelButtons level={level} setLevel={setLevel} />
          </div>

          {!library && realType === 'SB' && (
            <UnitButtons
              level={level}
              selectedUnit={selectedUnit}
              disabled={!meta?.pages?.length}
              onPick={unit => {
                setSelectedUnit(unit);
                setResolvedUnit(null);
              }}
              resolved={resolvedUnit}
            />
          )}

          <ImageBookSpread
            key={`${level}-${realType}`}
            level={level}
            bookType={realType}
            selectedUnit={selectedUnit}
            onUnitResolved={setResolvedUnit}
            onMeta={setMeta}
          />
        </div>
      </section>
    );
  }

  function install() {
    injectStyles();

    if (!window.MaterialesView || window.MaterialesView.__cs21a58books) return;

    const Base = window.MaterialesView;

    const Wrapped = function (props) {
      const user = currentSession();
      if (!user || user.rol !== 'teacher') return <Base {...props} />;

      const screen = activeScreen();
      if (screen === 'libros') return <Books mode="libros" {...props} />;
      if (screen === 'biblioteca') return <Books mode="biblioteca" {...props} />;

      return <Base {...props} />;
    };

    Wrapped.__cs21a58books = true;
    Wrapped.__base = Base;
    window.MaterialesView = Wrapped;

    try {
      MaterialesView = Wrapped;
    } catch (_) {}
  }

  const run = () => {
    try {
      install();
    } catch (_) {}
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  window.addEventListener('an:lazy-module-loaded', () => setTimeout(run, 30));
  window.addEventListener('an:teacher-material-tab', () => setTimeout(run, 30));

  window.__AN_TEACHER_ORDER_FIX_VERSION__ = VERSION;
  window.__AN_TEACHER_BOOK_VIEWS_VERSION__ = VERSION;
})();
