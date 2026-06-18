/* global React, window */
// CALGRUPO_F58_20260618_SUPERADMIN_EDITOR_INSCRIPCION_TIPO_FORMULARIO_UI
// CALGRUPO_F55_20260618_SUPERADMIN_EDITOR_INSCRIPCION_PUBLICA_UI
const { useEffect: useEffectInsAdmin, useMemo: useMemoInsAdmin, useState: useStateInsAdmin } = React;

function _insAdminToken() {
  try { return window.getSessionToken ? window.getSessionToken() : ''; } catch (_) { return ''; }
}
async function postInsAdmin(fn, payload = {}) {
  const res = await fetch(`${window.APPS_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token: _insAdminToken(), ...payload }),
  });
  const txt = await res.text();
  try { return JSON.parse(txt); } catch (_) { return { ok:false, error:'respuesta_no_json', raw:txt }; }
}
function fileToBase64InsAdmin(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error || new Error('No se pudo leer la imagen'));
    r.readAsDataURL(file);
  });
}
function moneyInsAdmin(n) {
  const v = Number(n) || 0;
  return `₡${v.toLocaleString('es-CR')}`;
}
function setDeepInsAdmin(obj, path, value) {
  const parts = path.split('.');
  const next = JSON.parse(JSON.stringify(obj || {}));
  let cur = next;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = cur[parts[i]] || {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
  return next;
}
function getDeepInsAdmin(obj, path, fallback = '') {
  return path.split('.').reduce((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), obj) ?? fallback;
}
function splitLinesInsAdmin(txt) {
  return String(txt || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function InscripcionAdminView({ toast }) {
  const [loading, setLoading] = useStateInsAdmin(true);
  const [saving, setSaving] = useStateInsAdmin(false);
  const [uploading, setUploading] = useStateInsAdmin('');
  const [cfg, setCfg] = useStateInsAdmin(null);
  const [grupos, setGrupos] = useStateInsAdmin([]);
  const [filter, setFilter] = useStateInsAdmin('');
  const [error, setError] = useStateInsAdmin('');
  const [activeSection, setActiveSection] = useStateInsAdmin('programa');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const d = await postInsAdmin('getInscripcionAdminConfig');
      if (!d || d.ok === false) throw new Error(d?.mensaje || d?.error || 'No se pudo cargar la configuración');
      setCfg(d.config || {});
      setGrupos(Array.isArray(d.grupos) ? d.grupos : []);
    } catch (err) {
      setError(err.message || 'Error de conexión');
    } finally { setLoading(false); }
  };
  useEffectInsAdmin(() => { load(); }, []);

  const setPath = (path, val) => setCfg(prev => setDeepInsAdmin(prev || {}, path, val));

  const saveConfig = async () => {
    setSaving(true); setError('');
    try {
      const d = await postInsAdmin('saveInscripcionAdminConfig', { config: cfg });
      if (!d || d.ok === false) throw new Error(d?.mensaje || d?.error || 'No se pudo guardar');
      setCfg(d.config || cfg);
      toast && toast('Configuración de inscripción guardada.');
    } catch (err) { setError(err.message || 'Error guardando'); }
    finally { setSaving(false); }
  };

  const uploadImage = async (slot, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('El archivo debe ser imagen.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('La imagen supera 5 MB.'); return; }
    setUploading(slot); setError('');
    try {
      const base64 = await fileToBase64InsAdmin(file);
      const d = await postInsAdmin('uploadInscripcionAdminImage', {
        slot,
        base64,
        mime_type: file.type,
        nombre_archivo: file.name,
      });
      if (!d || d.ok === false) throw new Error(d?.mensaje || d?.error || 'No se pudo subir la imagen');
      setCfg(d.config || setDeepInsAdmin(cfg || {}, `imagenes.${slot}`, d.url));
      toast && toast('Imagen actualizada para inscripción.');
    } catch (err) { setError(err.message || 'Error subiendo imagen'); }
    finally { setUploading(''); }
  };

  const saveGrupoToeic = async (g) => {
    setError('');
    const monto = Number(g.toeic_monto) || 0;
    const d = await postInsAdmin('saveInscripcionGroupToeic', {
      codigo: g.codigo,
      toeic: !!g.toeic,
      toeic_monto: monto,
    });
    if (!d || d.ok === false) {
      setError(d?.mensaje || d?.error || 'No se pudo guardar el TOEIC del grupo');
      return;
    }
    setGrupos(Array.isArray(d.grupos) ? d.grupos : grupos);
    toast && toast(`TOEIC actualizado para ${g.codigo}.`);
  };

  const updateGrupoLocal = (codigo, patch) => {
    setGrupos(prev => prev.map(g => g.codigo === codigo ? { ...g, ...patch } : g));
  };

  const sections = useMemoInsAdmin(() => [
    { id:'programa', icon:'📌', title:'Encabezado y selección inicial', hint:'Lo primero que ve el estudiante al elegir programa y horario.' },
    { id:'ina', icon:'🏛️', title:'Tarjeta Programa INA', hint:'Nombre, etiqueta, beneficios e imagen del programa acreditado.' },
    { id:'libre', icon:'🧭', title:'Tarjeta sin acreditación', hint:'Texto visible para el programa propio de la academia.' },
    { id:'financiamiento', icon:'💳', title:'Financiamiento', hint:'Textos de CONAPE y pago propio.' },
    { id:'equipo', icon:'💻', title:'Equipo de cómputo', hint:'Imágenes, nombres, detalles y precios de equipo.' },
    { id:'toeic', icon:'📝', title:'Prueba TOEIC', hint:'Texto y precio default; el monto real puede depender del grupo.' },
    { id:'sostenimiento', icon:'🏠', title:'Gastos de sostenimiento', hint:'Bloque opcional editable línea por línea.' },
    { id:'grupos', icon:'📚', title:'TOEIC por grupo', hint:'Monto visible para el grupo seleccionado en inscripcion.html.' },
  ], []);

  const filtered = grupos.filter(g => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return [g.codigo, g.programa, g.modalidad, g.dias, g.nivel].join(' ').toLowerCase().includes(q);
  });

  if (loading) return <div className="admin-page"><div className="card"><b>Cargando configuración de inscripción…</b></div></div>;

  const Field = ({ path, label, help, type='text', rows=1, money=false }) => {
    const val = getDeepInsAdmin(cfg, path, type === 'number' ? 0 : '');
    return (
      <label className="insedit-field">
        <span>{label}</span>
        {help && <small>{help}</small>}
        {rows > 1 ? (
          <textarea rows={rows} value={val} onChange={e => setPath(path, e.target.value)} />
        ) : (
          <input type={type} value={val} onChange={e => setPath(path, type === 'number' ? Number(e.target.value) || 0 : e.target.value)} />
        )}
        {money && <em>{moneyInsAdmin(val)}</em>}
      </label>
    );
  };

  const ImageField = ({ slot, label }) => {
    const url = getDeepInsAdmin(cfg, `imagenes.${slot}`, '');
    return (
      <div className="insedit-image-field">
        <div className="insedit-image-preview">{url ? <img src={url} alt={label} /> : <span>Sin imagen</span>}</div>
        <div className="insedit-image-control">
          <Field path={`imagenes.${slot}`} label={label} help="Pegá URL pública o subí una nueva imagen." />
          <label className="insedit-upload">
            {uploading === slot ? 'Subiendo imagen…' : 'Subir imagen'}
            <input type="file" accept="image/*" onChange={e => uploadImage(slot, e.target.files && e.target.files[0])} />
          </label>
        </div>
      </div>
    );
  };

  const PreviewProgramCard = ({ img, badge, title, bullets }) => (
    <div className="insedit-preview-card">
      <div className="insedit-preview-img">{img ? <img src={img} alt="preview" /> : <span>Imagen</span>}</div>
      <div className="insedit-preview-body">
        <b>{title || 'Título de la tarjeta'}</b>
        <span>{badge || 'Etiqueta'}</span>
        <ul>{splitLinesInsAdmin(bullets).map((b,i) => <li key={i}>{b}</li>)}</ul>
      </div>
    </div>
  );

  const renderSection = () => {
    if (activeSection === 'programa') return (
      <div className="insedit-section-body">
        <div className="insedit-section-title"><h2>Encabezado de inscripción</h2><p>Editá el texto de la primera parte tal como se lee en la página pública.</p></div>
        <Field path="textos.programa_titulo" label="Título principal" />
        <Field path="textos.programa_subtitulo" label="Subtítulo" rows={2} />
        <Field path="textos.horario_titulo" label="Título de selección de horario" />
        <div className="insedit-browser-preview">
          <small>Vista previa aproximada</small>
          <h3>{getDeepInsAdmin(cfg,'textos.programa_titulo','Programa y horario')}</h3>
          <p>{getDeepInsAdmin(cfg,'textos.programa_subtitulo','Elegí tu programa y horario.')}</p>
          <b>{getDeepInsAdmin(cfg,'textos.horario_titulo','Seleccioná tu horario')}</b>
        </div>
      </div>
    );

    if (activeSection === 'ina') return (
      <div className="insedit-section-body">
        <div className="insedit-section-title"><h2>Tarjeta Programa INA</h2><p>Todo lo que escribás aquí se ve en la tarjeta del programa acreditado.</p></div>
        <ImageField slot="ina" label="Imagen Programa INA" />
        <Field path="textos.ina_nombre" label="Nombre de la tarjeta" />
        <Field path="textos.ina_badge" label="Etiqueta / badge" />
        <Field path="textos.ina_bullets" label="Beneficios visibles" help="Una línea por beneficio." rows={5} />
        <PreviewProgramCard img={getDeepInsAdmin(cfg,'imagenes.ina')} badge={getDeepInsAdmin(cfg,'textos.ina_badge')} title={getDeepInsAdmin(cfg,'textos.ina_nombre')} bullets={getDeepInsAdmin(cfg,'textos.ina_bullets')} />
      </div>
    );

    if (activeSection === 'libre') return (
      <div className="insedit-section-body">
        <div className="insedit-section-title"><h2>Tarjeta Programa sin acreditación</h2><p>Texto para estudiantes que no aplican al programa INA/CONAPE.</p></div>
        <ImageField slot="libre" label="Imagen Programa sin acreditación" />
        <Field path="textos.libre_nombre" label="Nombre de la tarjeta" />
        <Field path="textos.libre_badge" label="Etiqueta / badge" />
        <Field path="textos.libre_bullets" label="Beneficios visibles" help="Una línea por beneficio." rows={5} />
        <PreviewProgramCard img={getDeepInsAdmin(cfg,'imagenes.libre')} badge={getDeepInsAdmin(cfg,'textos.libre_badge')} title={getDeepInsAdmin(cfg,'textos.libre_nombre')} bullets={getDeepInsAdmin(cfg,'textos.libre_bullets')} />
      </div>
    );

    if (activeSection === 'financiamiento') return (
      <div className="insedit-section-body">
        <div className="insedit-section-title"><h2>Financiamiento</h2><p>Bloques de selección CONAPE / pago propio.</p></div>
        <Field path="textos.conape_titulo" label="Título CONAPE" />
        <Field path="textos.conape_subtitulo" label="Descripción CONAPE" rows={2} />
        <Field path="textos.propio_titulo" label="Título pago propio" />
        <Field path="textos.propio_subtitulo" label="Descripción pago propio" rows={2} />
        <div className="insedit-two-preview">
          <div><b>{getDeepInsAdmin(cfg,'textos.conape_titulo')}</b><span>{getDeepInsAdmin(cfg,'textos.conape_subtitulo')}</span></div>
          <div><b>{getDeepInsAdmin(cfg,'textos.propio_titulo')}</b><span>{getDeepInsAdmin(cfg,'textos.propio_subtitulo')}</span></div>
        </div>
      </div>
    );

    if (activeSection === 'equipo') return (
      <div className="insedit-section-body">
        <div className="insedit-section-title"><h2>Equipo de cómputo</h2><p>Controla imágenes, precios y descripciones de los equipos financiables.</p></div>
        <Field path="textos.equipo_titulo" label="Título del bloque" />
        <div className="insedit-split">
          <div>
            <ImageField slot="equipo_basico" label="Imagen equipo básico" />
            <Field path="textos.equipo_basico_titulo" label="Nombre plan básico" />
            <Field path="textos.equipo_basico_bullets" label="Detalle plan básico" rows={4} />
            <Field path="precios.equipo_basico" label="Precio plan básico" type="number" money />
          </div>
          <div>
            <ImageField slot="equipo_premium" label="Imagen equipo premium" />
            <Field path="textos.equipo_premium_titulo" label="Nombre plan premium" />
            <Field path="textos.equipo_premium_bullets" label="Detalle plan premium" rows={4} />
            <Field path="precios.equipo_premium" label="Precio plan premium" type="number" money />
          </div>
        </div>
      </div>
    );

    if (activeSection === 'toeic') return (
      <div className="insedit-section-body">
        <div className="insedit-section-title"><h2>Prueba internacional TOEIC</h2><p>El precio que ve el estudiante depende primero del grupo. Este precio default solo se usa si el grupo no tiene monto.</p></div>
        <Field path="textos.toeic_titulo" label="Pregunta visible" rows={2} />
        <Field path="textos.toeic_nota" label="Detalle debajo de la pregunta" rows={4} />
        <Field path="precios.toeic_default" label="Precio TOEIC por defecto" type="number" money />
        <div className="insedit-browser-preview">
          <small>Vista previa aproximada</small>
          <h3>{getDeepInsAdmin(cfg,'textos.toeic_titulo')}</h3>
          <p>{getDeepInsAdmin(cfg,'textos.toeic_nota')}</p>
          <b>Sí, deseo financiar la prueba ({moneyInsAdmin(getDeepInsAdmin(cfg,'precios.toeic_default',0))})</b>
        </div>
      </div>
    );

    if (activeSection === 'sostenimiento') return (
      <div className="insedit-section-body">
        <div className="insedit-section-title"><h2>Gastos de sostenimiento</h2><p>Este es el bloque que mencionaste. Cambiá el detalle cuando querás sin tocar código.</p></div>
        <Field path="textos.sostenimiento_titulo" label="Título del bloque" />
        <Field path="textos.sostenimiento_nota" label="Detalle completo" help="Aquí podés pegar el nuevo texto exacto que querés mostrar." rows={7} />
        <div className="insedit-browser-preview sostenimiento">
          <small>Vista previa aproximada</small>
          <h3>{getDeepInsAdmin(cfg,'textos.sostenimiento_titulo','Gastos de sostenimiento')} <em>Opcional</em></h3>
          <p>{getDeepInsAdmin(cfg,'textos.sostenimiento_nota')}</p>
          <div className="fake-select">₡60 000 por mes</div>
        </div>
      </div>
    );

    return (
      <div className="insedit-section-body">
        <div className="insedit-section-title"><h2>TOEIC por grupo</h2><p>Este monto se usa en inscripción cuando el estudiante selecciona un grupo específico. Si TOEIC está apagado, no se ofrece.</p></div>
        <input className="insedit-search" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar grupo, modalidad, programa…" />
        <div className="insedit-group-list">
          {filtered.map(g => (
            <div className="insedit-group-card" key={g.codigo}>
              <div>
                <b>{g.codigo}</b>
                <span>{g.nivel} · {g.programa} · {g.modalidad}</span>
                <small>{g.dias} · {g.hora_inicio}–{g.hora_fin}</small>
              </div>
              <label className="insedit-switch"><input type="checkbox" checked={!!g.toeic} onChange={e => updateGrupoLocal(g.codigo, { toeic: e.target.checked })} /> TOEIC aplica</label>
              <label className="insedit-money"><span>Monto</span><input type="number" value={Number(g.toeic_monto)||0} onChange={e => updateGrupoLocal(g.codigo, { toeic_monto: Number(e.target.value)||0 })} /><em>{moneyInsAdmin(g.toeic_monto)}</em></label>
              <button className="btn btn-secondary" onClick={() => saveGrupoToeic(g)}>Guardar grupo</button>
            </div>
          ))}
          {!filtered.length && <div className="empty">No hay grupos que coincidan con la búsqueda.</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-page insedit-page">
      <div className="insedit-head">
        <div>
          <div className="eyebrow">Superadmin · Editor visual</div>
          <h1>Inscripción pública</h1>
          <p>Editá la página como formulario por secciones: textos, imágenes, precios y TOEIC por grupo.</p>
        </div>
        <div className="insedit-actions">
          <button className="btn btn-secondary" onClick={load}>Recargar</button>
          <button className="btn btn-primary" onClick={saveConfig} disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </div>

      {error && <div className="inline-alert warn"><span>{error}</span></div>}

      <div className="insedit-shell">
        <aside className="insedit-nav">
          {sections.map(s => (
            <button key={s.id} className={activeSection === s.id ? 'active' : ''} onClick={() => setActiveSection(s.id)}>
              <span>{s.icon}</span>
              <b>{s.title}</b>
              <small>{s.hint}</small>
            </button>
          ))}
        </aside>
        <main className="insedit-main">
          {renderSection()}
        </main>
      </div>

      <style>{`
        .insedit-page{display:flex;flex-direction:column;gap:18px}.insedit-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.insedit-head h1{margin:4px 0 6px;font-size:30px}.insedit-head p{margin:0;color:var(--ink-3);font-size:13px}.insedit-actions{display:flex;gap:8px;flex-wrap:wrap}.insedit-shell{display:grid;grid-template-columns:310px minmax(0,1fr);gap:18px;align-items:start}.insedit-nav{position:sticky;top:16px;display:flex;flex-direction:column;gap:10px}.insedit-nav button{border:1px solid var(--line);background:#fff;border-radius:18px;padding:14px;text-align:left;display:grid;grid-template-columns:34px 1fr;gap:2px 10px;cursor:pointer;box-shadow:0 10px 24px rgba(15,35,70,.04)}.insedit-nav button span{grid-row:1/3;width:34px;height:34px;border-radius:12px;background:#eff6ff;display:flex;align-items:center;justify-content:center}.insedit-nav button b{font-size:13px;color:var(--ink-1)}.insedit-nav button small{font-size:11px;line-height:1.35;color:var(--ink-3)}.insedit-nav button.active{border-color:#2B7FC1;box-shadow:0 0 0 3px rgba(43,127,193,.12);background:#f8fbff}.insedit-main{background:#fff;border:1px solid var(--line);border-radius:22px;padding:22px;box-shadow:0 18px 45px rgba(15,35,70,.06)}.insedit-section-body{display:flex;flex-direction:column;gap:16px}.insedit-section-title h2{margin:0 0 5px;font-size:22px}.insedit-section-title p{margin:0;color:var(--ink-3);font-size:13px}.insedit-field{display:flex;flex-direction:column;gap:7px;font-size:12px;font-weight:900;color:var(--ink-2)}.insedit-field small{font-weight:600;color:var(--ink-3);line-height:1.35}.insedit-field input,.insedit-field textarea,.insedit-search,.insedit-money input{width:100%;border:1px solid var(--line);border-radius:14px;padding:12px 14px;font-family:inherit;font-size:14px;background:#fbfdff;outline:none}.insedit-field textarea{resize:vertical;line-height:1.45}.insedit-field input:focus,.insedit-field textarea:focus,.insedit-search:focus,.insedit-money input:focus{border-color:#2B7FC1;box-shadow:0 0 0 3px rgba(43,127,193,.10);background:#fff}.insedit-field em,.insedit-money em{font-style:normal;color:#0B7A32;font-size:12px;font-weight:900}.insedit-image-field{display:grid;grid-template-columns:170px minmax(0,1fr);gap:14px;border:1px solid #e6edf5;background:#f8fbff;border-radius:18px;padding:14px}.insedit-image-preview{height:130px;border-radius:16px;background:#edf3fa;display:flex;align-items:center;justify-content:center;overflow:hidden;color:var(--ink-3);font-size:12px}.insedit-image-preview img{width:100%;height:100%;object-fit:contain}.insedit-image-control{display:flex;flex-direction:column;gap:10px}.insedit-upload{position:relative;overflow:hidden;border:1px solid #2B7FC1;color:#0B3A78;border-radius:12px;padding:10px 12px;display:inline-flex;align-self:flex-start;font-size:12px;font-weight:900;cursor:pointer;background:#fff}.insedit-upload input{position:absolute;inset:0;opacity:0;cursor:pointer}.insedit-browser-preview{border:1px dashed #c7d6e7;border-radius:18px;background:#fbfdff;padding:16px}.insedit-browser-preview small{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3);margin-bottom:9px}.insedit-browser-preview h3{margin:0 0 7px;font-size:19px}.insedit-browser-preview p{margin:0 0 12px;color:var(--ink-2);font-size:13px;line-height:1.5}.insedit-browser-preview em{font-style:normal;background:#e8f2ff;border-radius:999px;padding:3px 8px;font-size:11px;color:#2B7FC1}.fake-select{border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:white;max-width:230px}.insedit-preview-card{display:grid;grid-template-columns:170px 1fr;gap:14px;border:1px solid var(--line);border-radius:18px;padding:14px;background:#fff}.insedit-preview-img{height:115px;border-radius:16px;background:#edf3fa;display:flex;align-items:center;justify-content:center;overflow:hidden}.insedit-preview-img img{width:100%;height:100%;object-fit:cover}.insedit-preview-body{display:flex;flex-direction:column;gap:7px}.insedit-preview-body b{font-size:16px}.insedit-preview-body span{align-self:flex-start;border-radius:999px;background:#e8f2ff;color:#0B3A78;padding:4px 9px;font-size:11px;font-weight:900}.insedit-preview-body ul{margin:4px 0 0;padding-left:18px;color:var(--ink-2);font-size:13px}.insedit-two-preview,.insedit-split{display:grid;grid-template-columns:1fr 1fr;gap:14px}.insedit-two-preview>div{border:1px solid var(--line);border-radius:16px;padding:14px;background:#fff}.insedit-two-preview b,.insedit-two-preview span{display:block}.insedit-two-preview span{margin-top:5px;color:var(--ink-3);font-size:13px}.insedit-group-list{display:flex;flex-direction:column;gap:10px}.insedit-group-card{display:grid;grid-template-columns:minmax(220px,1.3fr) 150px 190px auto;gap:12px;align-items:center;border:1px solid var(--line);border-radius:16px;padding:12px;background:#fff}.insedit-group-card b,.insedit-group-card span,.insedit-group-card small{display:block}.insedit-group-card span{font-size:12px;color:var(--ink-2)}.insedit-group-card small{font-size:11px;color:var(--ink-3)}.insedit-switch{font-size:12px;font-weight:900;display:flex;align-items:center;gap:8px}.insedit-money{display:grid;gap:5px;font-size:11px;font-weight:900;color:var(--ink-3)}.empty{padding:20px;text-align:center;color:var(--ink-3);border:1px dashed var(--line);border-radius:16px}@media(max-width:1050px){.insedit-shell{grid-template-columns:1fr}.insedit-nav{position:relative;top:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.insedit-group-card{grid-template-columns:1fr}.insedit-split,.insedit-two-preview{grid-template-columns:1fr}}@media(max-width:680px){.insedit-head{flex-direction:column}.insedit-nav{grid-template-columns:1fr}.insedit-image-field,.insedit-preview-card{grid-template-columns:1fr}.insedit-main{padding:16px}}
      `}</style>
    </div>
  );
}

Object.assign(window, { InscripcionAdminView });
