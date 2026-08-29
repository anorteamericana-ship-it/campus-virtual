// F98.4-Z6-CS21A76 · Mi Perfil docente profesional
/* global React, PerfilView */
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A76';
  const SCRIPT_URL = window.APPS_SCRIPT_URL;

  function tp76SafeUserError(raw, fallback, context = '') {
    const msg = String(raw == null ? '' : raw).trim();
    if (!msg) return fallback;
    const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);
    const technicalText = /apps?\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\bjson\b|\btoken\b|sesion_requerida|unauthorized|forbidden|internal server|http\s*\d{3}|status\s*\d{3}|sha-?256|\bmime\b|base64|file_id|respuesta_vacia|integridad_|sec004_|demo_read_only|policy_unbound/i.test(msg);
    if (technicalCode || technicalText) {
      console.warn('[TeacherProfile] Detalle técnico oculto al docente.', { context, error: msg });
      return fallback;
    }
    return msg;
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

  async function post(fn, payload = {}, timeout = 90000) {
    const token = typeof window.getSessionToken === 'function' ? window.getSessionToken() : '';
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;
    try {
      const response = await fetch(`${SCRIPT_URL}?fn=${encodeURIComponent(fn)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ fn, token, ...payload }),
        signal: controller ? controller.signal : undefined,
      });
      const raw = await response.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; }
      catch (_) { throw new Error('El servidor devolvió una respuesta inválida.'); }
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

  function initials(name) {
    return String(name || 'Docente')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase() || 'AN';
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function readDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
      reader.readAsDataURL(file);
    });
  }

  async function preparePhoto(file) {
    if (!file || !String(file.type || '').startsWith('image/')) {
      throw new Error('Seleccioná una imagen JPG, PNG o WebP.');
    }
    const source = await readDataUrl(file);
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo preparar la fotografía.'));
      img.src = source;
    });

    const max = 1400;
    const ratio = Math.min(1, max / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.88),
      mime: 'image/jpeg',
    };
  }

  function InfoItem({ label, value }) {
    return (
      <div className="tp76-info-item">
        <span>{label}</span>
        <strong title={value || ''}>{value || 'No registrado'}</strong>
      </div>
    );
  }

  function DocumentCard({ kind, title, subtitle, document, busy, onPick }) {
    const available = Boolean(document?.disponible && document?.vista_url);
    return (
      <article className={`tp76-doc-card ${available ? 'is-ready' : 'is-empty'}`}>
        <div className="tp76-doc-icon" aria-hidden="true">
          {kind === 'CURRICULUM' ? 'CV' : 'INA'}
        </div>
        <div className="tp76-doc-content">
          <div className="tp76-doc-topline">
            <div>
              <div className="tp76-doc-title">{title}</div>
              <div className="tp76-doc-subtitle">{subtitle}</div>
            </div>
            <span className={`tp76-status ${available ? 'ready' : 'pending'}`}>
              {available ? 'Disponible' : 'Pendiente'}
            </span>
          </div>
          <div className="tp76-doc-meta">
            {available
              ? `${document.nombre || 'Documento PDF'}${formatDate(document.actualizado_en) ? ` · ${formatDate(document.actualizado_en)}` : ''}`
              : 'Todavía no hay un PDF cargado.'}
          </div>
          <div className="tp76-doc-actions">
            {available && (
              <button type="button" className="btn btn-primary" onClick={() => window.open(document.vista_url, '_blank', 'noopener,noreferrer')}>
                Abrir
              </button>
            )}
            <button type="button" className="btn" disabled={busy} onClick={onPick}>
              {busy ? 'Cargando…' : available ? 'Reemplazar PDF' : 'Cargar PDF'}
            </button>
          </div>
        </div>
      </article>
    );
  }

  function TeacherProfileCS21A76() {
    const current = session();
    const [state, setState] = React.useState({ loading: true, error: '', data: null });
    const [busy, setBusy] = React.useState('');
    const [notice, setNotice] = React.useState('');
    const [editing, setEditing] = React.useState(false);
    const [form, setForm] = React.useState({
      titular: '',
      especialidad: '',
      experiencia: '',
      presentacion: '',
    });
    const photoRef = React.useRef(null);
    const cvRef = React.useRef(null);
    const inaRef = React.useRef(null);

    const applyData = React.useCallback((data) => {
      setState({ loading: false, error: '', data });
      const teacher = data?.docente || {};
      setForm({
        titular: teacher.titular || 'Docente de Inglés Conversacional',
        especialidad: teacher.especialidad || '',
        experiencia: teacher.experiencia || '',
        presentacion: teacher.presentacion || '',
      });
    }, []);

    const load = React.useCallback(async () => {
      setState(previous => ({ ...previous, loading: true, error: '' }));
      try {
        applyData(await post('getPerfilDocenteCS21A76'));
      } catch (error) {
        setState(previous => ({ ...previous, loading: false, error: tp76SafeUserError(error?.message || String(error), 'No pudimos cargar tu perfil. Intentá de nuevo.', 'cargar_perfil') }));
      }
    }, [applyData]);

    React.useEffect(() => { load(); }, [load]);

    const saveProfile = async () => {
      setBusy('profile');
      setNotice('');
      try {
        const data = await post('guardarPerfilDocenteCS21A76', form);
        applyData(data);
        setEditing(false);
        setNotice(data.mensaje || 'Perfil actualizado.');
      } catch (error) {
        setNotice(tp76SafeUserError(error?.message || String(error), 'No se pudo guardar el perfil. Intentá de nuevo.', 'guardar_perfil'));
      } finally {
        setBusy('');
      }
    };

    const uploadPhoto = async event => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      setBusy('photo');
      setNotice('');
      try {
        const prepared = await preparePhoto(file);
        const data = await post('uploadFotoPerfilDocenteCS21A76', {
          archivo_base64: prepared.dataUrl,
          archivo_mime: prepared.mime,
        }, 120000);
        applyData(data);
        setNotice(data.mensaje || 'Fotografía actualizada.');
      } catch (error) {
        setNotice(tp76SafeUserError(error?.message || String(error), 'No se pudo actualizar la fotografía.', 'subir_foto'));
      } finally {
        setBusy('');
      }
    };

    const uploadDocument = async (event, type) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      if (file.type !== 'application/pdf' && !String(file.name || '').toLowerCase().endsWith('.pdf')) {
        setNotice('El documento debe estar en formato PDF.');
        return;
      }
      setBusy(type);
      setNotice('');
      try {
        const dataUrl = await readDataUrl(file);
        const data = await post('uploadDocumentoDocenteCS21A76', {
          tipo_documento: type,
          archivo_base64: dataUrl,
          archivo_mime: 'application/pdf',
          archivo_nombre: file.name,
        }, 150000);
        applyData(data);
        setNotice(data.mensaje || 'Documento actualizado.');
      } catch (error) {
        setNotice(tp76SafeUserError(error?.message || String(error), 'No se pudo actualizar el documento.', `subir_documento:${type}`));
      } finally {
        setBusy('');
      }
    };

    if (state.loading && !state.data) {
      return (
        <div className="tp76-page">
          <style>{styles}</style>
          <div className="tp76-loading">Preparando tu perfil profesional…</div>
        </div>
      );
    }

    if (state.error && !state.data) {
      return (
        <div className="tp76-page">
          <style>{styles}</style>
          <div className="tp76-error">
            <strong>No pudimos cargar tu perfil.</strong>
            <span>{state.error}</span>
            <button type="button" className="btn btn-primary" onClick={load}>Reintentar</button>
          </div>
        </div>
      );
    }

    const data = state.data || {};
    const teacher = data.docente || {};
    const name = teacher.nombre || current.nombre || 'Docente';
    const photo = data.foto?.disponible ? data.foto.url : '';

    return (
      <div className="tp76-page" data-screen-label={`Docente · Mi Perfil · ${VERSION}`}>
        <style>{styles}</style>

        <header className="tp76-heading">
          <div>
            <div className="tp76-kicker">MI CUENTA</div>
            <h1>Mi <em>Perfil</em></h1>
            <p>Tu identidad profesional dentro de Academia Norteamericana.</p>
          </div>
          <span className="tp76-version">Perfil docente</span>
        </header>

        <section className="tp76-hero-card">
          <div className="tp76-cover">
            <div className="tp76-cover-brand">
              <span>ACADEMIA NORTEAMERICANA</span>
              <strong>Campus Virtual</strong>
            </div>
            <div className="tp76-cover-mark">AN</div>
          </div>

          <div className="tp76-identity">
            <div className="tp76-photo-wrap">
              <div className="tp76-photo">
                {photo
                  ? <img src={photo} alt={`Fotografía de ${name}`} />
                  : <span>{initials(name)}</span>}
              </div>
              <button
                type="button"
                className="tp76-camera"
                disabled={busy === 'photo'}
                onClick={() => photoRef.current?.click()}
                title="Cambiar fotografía"
              >
                {busy === 'photo' ? '…' : '✦'}
              </button>
              <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={uploadPhoto} />
            </div>

            <div className="tp76-name-block">
              <div className="tp76-active">
                <span /> {teacher.activo === false ? 'Docente inactivo' : 'Docente activo'}
              </div>
              <h2>{name}</h2>
              <p>{teacher.titular || 'Docente de Inglés Conversacional'}</p>
            </div>

            <button type="button" className="btn tp76-photo-button" disabled={busy === 'photo'} onClick={() => photoRef.current?.click()}>
              {photo ? 'Cambiar foto' : 'Cargar foto'}
            </button>
          </div>

          <div className="tp76-info-strip">
            <InfoItem label="Correo" value={teacher.correo} />
            <InfoItem label="Teléfono" value={teacher.telefono} />
            <InfoItem label="Cédula" value={teacher.cedula} />
            <InfoItem label="Usuario" value={teacher.usuario || current.usuario} />
          </div>
        </section>

        {notice && <div className="tp76-notice" role="status">{notice}</div>}

        <div className="tp76-grid">
          <section className="tp76-panel">
            <div className="tp76-panel-head">
              <div>
                <span>PERFIL PROFESIONAL</span>
                <h3>Presentación</h3>
              </div>
              <button type="button" className="btn" onClick={() => setEditing(value => !value)}>
                {editing ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            {editing ? (
              <div className="tp76-form">
                <label>
                  Titular profesional
                  <input value={form.titular} maxLength={90} onChange={e => setForm(previous => ({ ...previous, titular: e.target.value }))} placeholder="Docente de Inglés Conversacional" />
                </label>
                <div className="tp76-form-row">
                  <label>
                    Especialidad
                    <input value={form.especialidad} maxLength={140} onChange={e => setForm(previous => ({ ...previous, especialidad: e.target.value }))} placeholder="Ej. Inglés conversacional" />
                  </label>
                  <label>
                    Experiencia
                    <input value={form.experiencia} maxLength={100} onChange={e => setForm(previous => ({ ...previous, experiencia: e.target.value }))} placeholder="Ej. 6 años de experiencia" />
                  </label>
                </div>
                <label>
                  Presentación breve
                  <textarea value={form.presentacion} maxLength={650} onChange={e => setForm(previous => ({ ...previous, presentacion: e.target.value }))} placeholder="Una presentación profesional breve, clara y humana." />
                </label>
                <button type="button" className="btn btn-primary" disabled={busy === 'profile'} onClick={saveProfile}>
                  {busy === 'profile' ? 'Guardando…' : 'Guardar perfil'}
                </button>
              </div>
            ) : (
              <div className="tp76-professional">
                <p className={teacher.presentacion ? '' : 'is-empty'}>
                  {teacher.presentacion || 'Agregá una presentación breve para que tu perfil refleje tu experiencia y estilo profesional.'}
                </p>
                <div className="tp76-tags">
                  {teacher.especialidad && <span>{teacher.especialidad}</span>}
                  {teacher.experiencia && <span>{teacher.experiencia}</span>}
                  {!teacher.especialidad && !teacher.experiencia && <span>Perfil por completar</span>}
                </div>
              </div>
            )}
          </section>

          <section className="tp76-panel">
            <div className="tp76-panel-head">
              <div>
                <span>EXPEDIENTE PROFESIONAL</span>
                <h3>Documentos</h3>
              </div>
              <div className="tp76-lock">Guardado institucional</div>
            </div>

            <div className="tp76-doc-list">
              <DocumentCard
                kind="CURRICULUM"
                title="Currículum"
                subtitle="Trayectoria y formación profesional"
                document={data.curriculum}
                busy={busy === 'CURRICULUM'}
                onPick={() => cvRef.current?.click()}
              />
              <DocumentCard
                kind="AVAL_INA"
                title="Aval INA"
                subtitle="Respaldo documental del docente"
                document={data.aval_ina}
                busy={busy === 'AVAL_INA'}
                onPick={() => inaRef.current?.click()}
              />
              <input ref={cvRef} type="file" accept="application/pdf,.pdf" hidden onChange={event => uploadDocument(event, 'CURRICULUM')} />
              <input ref={inaRef} type="file" accept="application/pdf,.pdf" hidden onChange={event => uploadDocument(event, 'AVAL_INA')} />
            </div>
          </section>
        </div>
      </div>
    );
  }

  const styles = `
    .tp76-page{width:100%;max-width:1440px;margin:0 auto;padding:4px 2px 32px;box-sizing:border-box}
    .tp76-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin:0 0 18px}
    .tp76-kicker{font-size:11px;font-weight:950;letter-spacing:.18em;color:var(--an-red,#DA291C)}
    .tp76-heading h1{font-family:var(--f-serif,Georgia,serif);font-size:42px;font-weight:500;line-height:1;margin:7px 0 6px;color:var(--an-navy-ink,#001E47)}
    .tp76-heading h1 em{font-weight:400}
    .tp76-heading p{margin:0;color:var(--ink-3,#6f6a63);font-size:13px}
    .tp76-version{padding:7px 11px;border-radius:999px;background:#EEF3FA;color:#173D70;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
    .tp76-hero-card{overflow:hidden;border:1px solid var(--line,#e4ddd3);border-radius:22px;background:#fff;box-shadow:0 18px 48px rgba(0,30,71,.10)}
    .tp76-cover{height:190px;position:relative;overflow:hidden;background:radial-gradient(circle at 77% 20%,rgba(255,255,255,.18) 0 8%,transparent 9%),radial-gradient(circle at 15% 80%,rgba(218,41,28,.22) 0 18%,transparent 19%),linear-gradient(118deg,#001E47 0%,#0B4A8B 52%,#B21E2B 100%)}
    .tp76-cover:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(135deg,transparent 0 26px,rgba(255,255,255,.025) 26px 28px)}
    .tp76-cover-brand{position:absolute;left:30px;top:30px;color:#fff;display:flex;flex-direction:column;gap:3px;z-index:2}
    .tp76-cover-brand span{font-size:11px;font-weight:950;letter-spacing:.18em}
    .tp76-cover-brand strong{font-family:var(--f-serif,Georgia,serif);font-size:26px;font-weight:500}
    .tp76-cover-mark{position:absolute;right:42px;bottom:-38px;font-family:var(--f-serif,Georgia,serif);font-size:190px;font-weight:700;color:rgba(255,255,255,.09);line-height:1}
    .tp76-identity{display:grid;grid-template-columns:auto 1fr auto;gap:22px;align-items:end;padding:0 28px 20px;margin-top:-62px;position:relative;z-index:3}
    .tp76-photo-wrap{position:relative;width:172px;height:172px}
    .tp76-photo{width:172px;height:172px;border-radius:50%;overflow:hidden;border:6px solid #fff;background:linear-gradient(145deg,#001E47,#DA291C);box-shadow:0 12px 34px rgba(0,0,0,.24);display:grid;place-items:center}
    .tp76-photo img{width:100%;height:100%;object-fit:cover;display:block}
    .tp76-photo span{color:#fff;font-family:var(--f-serif,Georgia,serif);font-size:54px;font-weight:600}
    .tp76-camera{position:absolute;right:5px;bottom:8px;width:42px;height:42px;border-radius:50%;border:4px solid #fff;background:#001E47;color:#fff;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 5px 16px rgba(0,0,0,.24)}
    .tp76-camera:disabled{opacity:.65;cursor:wait}
    .tp76-name-block{padding-bottom:8px;min-width:0}
    .tp76-name-block h2{margin:7px 0 4px;color:#001E47;font-family:var(--f-serif,Georgia,serif);font-size:31px;font-weight:600;line-height:1.05}
    .tp76-name-block p{margin:0;color:var(--ink-3,#6f6a63);font-size:13px}
    .tp76-active{display:inline-flex;align-items:center;gap:7px;padding:5px 10px;border-radius:999px;background:#EAF6ED;color:#1E6C37;font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}
    .tp76-active span{width:8px;height:8px;border-radius:50%;background:#28A453;box-shadow:0 0 0 4px rgba(40,164,83,.14)}
    .tp76-photo-button{margin-bottom:12px}
    .tp76-info-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid var(--line,#e4ddd3);background:linear-gradient(180deg,#FCFBF8,#F7F3ED)}
    .tp76-info-item{padding:15px 20px;border-right:1px solid var(--line,#e4ddd3);min-width:0}
    .tp76-info-item:last-child{border-right:0}
    .tp76-info-item span{display:block;color:#7B7369;font-size:9.5px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;margin-bottom:5px}
    .tp76-info-item strong{display:block;color:#1F2E41;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .tp76-notice{margin:14px 0 0;padding:11px 14px;border:1px solid #A8C7B0;border-radius:12px;background:#EEF8F0;color:#1F6333;font-size:12px;font-weight:750}
    .tp76-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:18px;margin-top:18px}
    .tp76-panel{background:#fff;border:1px solid var(--line,#e4ddd3);border-radius:20px;padding:22px;box-shadow:0 10px 28px rgba(0,30,71,.055)}
    .tp76-panel-head{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:18px}
    .tp76-panel-head span{display:block;color:#7A1E2C;font-size:9.5px;font-weight:950;letter-spacing:.14em;text-transform:uppercase}
    .tp76-panel-head h3{margin:4px 0 0;color:#001E47;font-family:var(--f-serif,Georgia,serif);font-size:25px;font-weight:600}
    .tp76-lock{font-size:10px;font-weight:850;color:#5E6B7A;background:#F1F4F8;border-radius:999px;padding:6px 9px}
    .tp76-professional p{font-family:var(--f-serif,Georgia,serif);font-size:17px;line-height:1.65;color:#2B3542;margin:0}
    .tp76-professional p.is-empty{color:#857E75;font-style:italic}
    .tp76-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
    .tp76-tags span{padding:7px 10px;border-radius:999px;background:#F4F0EA;border:1px solid #E5DACE;color:#5A463B;font-size:10.5px;font-weight:850}
    .tp76-form{display:flex;flex-direction:column;gap:13px}
    .tp76-form label{display:flex;flex-direction:column;gap:6px;font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#5D6570}
    .tp76-form input,.tp76-form textarea{width:100%;box-sizing:border-box;border:1.5px solid #D9D1C7;border-radius:11px;background:#fff;padding:10px 11px;font-family:var(--f-sans,system-ui);font-size:12px;color:#172234;outline:none;text-transform:none;letter-spacing:0;font-weight:500}
    .tp76-form input:focus,.tp76-form textarea:focus{border-color:#0B4A8B;box-shadow:0 0 0 3px rgba(11,74,139,.10)}
    .tp76-form textarea{min-height:120px;resize:vertical;line-height:1.5}
    .tp76-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .tp76-doc-list{display:flex;flex-direction:column;gap:12px}
    .tp76-doc-card{display:flex;gap:14px;padding:16px;border-radius:16px;border:1px solid #E0D8CE;background:#FBF9F5;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}
    .tp76-doc-card.is-ready{background:linear-gradient(135deg,#fff,#F4F8FD);border-color:#B9CCE1}
    .tp76-doc-card:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,30,71,.08)}
    .tp76-doc-icon{width:52px;height:52px;border-radius:14px;display:grid;place-items:center;flex:0 0 52px;background:#001E47;color:#fff;font-family:var(--f-mono,monospace);font-size:14px;font-weight:950;letter-spacing:.05em}
    .tp76-doc-card:nth-child(2) .tp76-doc-icon{background:linear-gradient(145deg,#7A1E2C,#DA291C)}
    .tp76-doc-content{flex:1;min-width:0}
    .tp76-doc-topline{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
    .tp76-doc-title{font-size:15px;font-weight:900;color:#001E47}
    .tp76-doc-subtitle{font-size:11px;color:#746D65;margin-top:2px}
    .tp76-status{padding:4px 8px;border-radius:999px;font-size:9px;font-weight:950;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
    .tp76-status.ready{background:#EAF6ED;color:#1E6C37}
    .tp76-status.pending{background:#F4EDE3;color:#8B5B1E}
    .tp76-doc-meta{font-size:10.5px;color:#6F6A63;margin-top:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .tp76-doc-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .tp76-doc-actions .btn{font-size:11px;padding:7px 10px}
    .tp76-loading,.tp76-error{min-height:360px;display:grid;place-items:center;border:1px solid var(--line,#e4ddd3);border-radius:20px;background:#fff;color:#001E47;font-weight:900}
    .tp76-error{display:flex;flex-direction:column;justify-content:center;gap:10px;padding:30px;text-align:center}
    .tp76-error span{font-size:12px;color:#8D1E1E;font-weight:600}
    @media(max-width:900px){.tp76-grid{grid-template-columns:1fr}.tp76-info-strip{grid-template-columns:repeat(2,1fr)}.tp76-info-item:nth-child(2){border-right:0}.tp76-info-item:nth-child(-n+2){border-bottom:1px solid var(--line,#e4ddd3)}}
    @media(max-width:650px){.tp76-heading{align-items:flex-start}.tp76-heading h1{font-size:34px}.tp76-version{display:none}.tp76-cover{height:150px}.tp76-cover-brand{left:20px;top:22px}.tp76-identity{grid-template-columns:1fr;text-align:center;justify-items:center;margin-top:-58px;padding:0 18px 18px}.tp76-name-block{padding:0}.tp76-photo-button{margin:0}.tp76-info-strip{grid-template-columns:1fr}.tp76-info-item{border-right:0;border-bottom:1px solid var(--line,#e4ddd3)!important}.tp76-info-item:last-child{border-bottom:0!important}.tp76-form-row{grid-template-columns:1fr}.tp76-doc-card{align-items:flex-start}.tp76-doc-topline{flex-direction:column}}
  `;

  function install() {
    const Current = window.PerfilView || (typeof PerfilView === 'function' ? PerfilView : null);
    if (!Current) return false;
    if (Current.__cs21a76TeacherProfile) return true;

    const Base = Current;
    const Wrapped = function PerfilViewCS21A76(props) {
      const user = session();
      const role = String(user?.rol || user?.role || '').trim().toLowerCase();
      if (role === 'teacher' || role === 'docente') return <TeacherProfileCS21A76 {...props} />;
      return <Base {...props} />;
    };

    Wrapped.__cs21a76TeacherProfile = true;
    Wrapped.__base = Base;
    window.PerfilView = Wrapped;
    try { PerfilView = Wrapped; } catch (_) {}
    return true;
  }

  install();
  window.addEventListener('an:lazy-module-loaded', () => setTimeout(install, 30));
  window.addEventListener('an:session-changed', () => setTimeout(install, 30));
  const probe = setInterval(() => { if (install()) clearInterval(probe); }, 250);
  setTimeout(() => clearInterval(probe), 30000);

  window.__AN_TEACHER_PROFILE_VERSION__ = VERSION;
})();
