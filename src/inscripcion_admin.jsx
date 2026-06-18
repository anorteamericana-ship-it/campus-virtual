/* global React, window */
// CALGRUPO_F55_20260618_SUPERADMIN_EDITOR_INSCRIPCION_PUBLICA_UI
const { useEffect: useEffectInsAdmin, useState: useStateInsAdmin } = React;

function _insAdminToken() {
  try { return window.getSessionToken ? window.getSessionToken() : ''; } catch (_) { return ''; }
}
async function postInsAdmin(fn, payload = {}) {
  const res = await fetch(`${window.APPS_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token: _insAdminToken(), ...payload }),
  });
  return await res.json();
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

function InscripcionAdminView({ toast }) {
  const [loading, setLoading] = useStateInsAdmin(true);
  const [saving, setSaving] = useStateInsAdmin(false);
  const [uploading, setUploading] = useStateInsAdmin('');
  const [cfg, setCfg] = useStateInsAdmin(null);
  const [grupos, setGrupos] = useStateInsAdmin([]);
  const [filter, setFilter] = useStateInsAdmin('');
  const [error, setError] = useStateInsAdmin('');

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

  const filtered = grupos.filter(g => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return [g.codigo, g.programa, g.modalidad, g.dias, g.nivel].join(' ').toLowerCase().includes(q);
  });

  if (loading) return <div className="admin-page"><div className="card"><b>Cargando configuración de inscripción…</b></div></div>;

  const ImgControl = ({ slot, label }) => {
    const url = getDeepInsAdmin(cfg, `imagenes.${slot}`, '');
    return (
      <div className="insadmin-imgcard">
        <div className="insadmin-imgbox">{url ? <img src={url} alt={label} /> : <span>Sin imagen</span>}</div>
        <div className="insadmin-imgmeta">
          <b>{label}</b>
          <input value={url} onChange={e => setPath(`imagenes.${slot}`, e.target.value)} placeholder="URL pública de imagen" />
          <label className="btn btn-secondary insadmin-upload">
            {uploading === slot ? 'Subiendo…' : 'Subir imagen'}
            <input type="file" accept="image/*" onChange={e => uploadImage(slot, e.target.files && e.target.files[0])} />
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-page insadmin-page">
      <div className="insadmin-head">
        <div>
          <div className="eyebrow">Superadmin · Inscripción pública</div>
          <h1>Editor de inscripcion.html</h1>
          <p>Cambiá textos, imágenes y precios sin tocar código. Las imágenes quedan guardadas en Drive y se publican por URL.</p>
        </div>
        <div className="insadmin-actions">
          <button className="btn btn-secondary" onClick={load}>Recargar</button>
          <button className="btn btn-primary" onClick={saveConfig} disabled={saving}>{saving ? 'Guardando…' : 'Guardar textos e imágenes'}</button>
        </div>
      </div>

      {error && <div className="inline-alert warn"><span>{error}</span></div>}

      <div className="insadmin-grid">
        <section className="card insadmin-section">
          <h2>Textos principales</h2>
          <label>Título paso programa<input value={getDeepInsAdmin(cfg,'textos.programa_titulo')} onChange={e => setPath('textos.programa_titulo', e.target.value)} /></label>
          <label>Subtítulo programa<textarea rows="2" value={getDeepInsAdmin(cfg,'textos.programa_subtitulo')} onChange={e => setPath('textos.programa_subtitulo', e.target.value)} /></label>
          <label>Título horario<input value={getDeepInsAdmin(cfg,'textos.horario_titulo')} onChange={e => setPath('textos.horario_titulo', e.target.value)} /></label>
          <div className="insadmin-two">
            <label>Nombre INA<input value={getDeepInsAdmin(cfg,'textos.ina_nombre')} onChange={e => setPath('textos.ina_nombre', e.target.value)} /></label>
            <label>Badge INA<input value={getDeepInsAdmin(cfg,'textos.ina_badge')} onChange={e => setPath('textos.ina_badge', e.target.value)} /></label>
          </div>
          <label>Bullets INA<textarea rows="3" value={getDeepInsAdmin(cfg,'textos.ina_bullets')} onChange={e => setPath('textos.ina_bullets', e.target.value)} /></label>
          <div className="insadmin-two">
            <label>Nombre SIN acreditación<input value={getDeepInsAdmin(cfg,'textos.libre_nombre')} onChange={e => setPath('textos.libre_nombre', e.target.value)} /></label>
            <label>Badge SIN acreditación<input value={getDeepInsAdmin(cfg,'textos.libre_badge')} onChange={e => setPath('textos.libre_badge', e.target.value)} /></label>
          </div>
          <label>Bullets SIN acreditación<textarea rows="3" value={getDeepInsAdmin(cfg,'textos.libre_bullets')} onChange={e => setPath('textos.libre_bullets', e.target.value)} /></label>
        </section>

        <section className="card insadmin-section">
          <h2>Imágenes públicas</h2>
          <ImgControl slot="ina" label="Programa INA" />
          <ImgControl slot="libre" label="Programa SIN acreditación" />
          <ImgControl slot="equipo_basico" label="Equipo básico" />
          <ImgControl slot="equipo_premium" label="Equipo premium" />
        </section>
      </div>

      <section className="card insadmin-section">
        <h2>CONAPE, equipo y TOEIC</h2>
        <div className="insadmin-two">
          <label>Título CONAPE<input value={getDeepInsAdmin(cfg,'textos.conape_titulo')} onChange={e => setPath('textos.conape_titulo', e.target.value)} /></label>
          <label>Subtítulo CONAPE<input value={getDeepInsAdmin(cfg,'textos.conape_subtitulo')} onChange={e => setPath('textos.conape_subtitulo', e.target.value)} /></label>
        </div>
        <div className="insadmin-two">
          <label>Precio equipo básico<input type="number" value={getDeepInsAdmin(cfg,'precios.equipo_basico',0)} onChange={e => setPath('precios.equipo_basico', Number(e.target.value)||0)} /></label>
          <label>Precio equipo premium<input type="number" value={getDeepInsAdmin(cfg,'precios.equipo_premium',0)} onChange={e => setPath('precios.equipo_premium', Number(e.target.value)||0)} /></label>
        </div>
        <label>Título TOEIC<input value={getDeepInsAdmin(cfg,'textos.toeic_titulo')} onChange={e => setPath('textos.toeic_titulo', e.target.value)} /></label>
        <label>Nota TOEIC<textarea rows="2" value={getDeepInsAdmin(cfg,'textos.toeic_nota')} onChange={e => setPath('textos.toeic_nota', e.target.value)} /></label>
        <label>Precio TOEIC por defecto <small>Se usa solo si el grupo no tiene TOEIC_MONTO.</small><input type="number" value={getDeepInsAdmin(cfg,'precios.toeic_default',0)} onChange={e => setPath('precios.toeic_default', Number(e.target.value)||0)} /></label>
      </section>

      <section className="card insadmin-section">
        <div className="insadmin-rowhead">
          <div>
            <h2>TOEIC por grupo</h2>
            <p>Este es el precio que verá el estudiante al escoger ese grupo. Si cambiás el monto aquí, se actualiza la hoja GRUPOS en todas las filas del grupo.</p>
          </div>
          <input className="insadmin-search" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar grupo, modalidad, programa…" />
        </div>
        <div className="insadmin-tablewrap">
          <table className="insadmin-table">
            <thead><tr><th>Grupo</th><th>Programa</th><th>Modalidad</th><th>Horario</th><th>TOEIC</th><th>Monto</th><th></th></tr></thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.codigo}>
                  <td><b>{g.codigo}</b><br/><small>{g.nivel}</small></td>
                  <td>{g.programa}</td>
                  <td>{g.modalidad}</td>
                  <td>{g.dias} · {g.hora_inicio}–{g.hora_fin}</td>
                  <td><input type="checkbox" checked={!!g.toeic} onChange={e => updateGrupoLocal(g.codigo, { toeic: e.target.checked })} /></td>
                  <td><input type="number" value={Number(g.toeic_monto)||0} onChange={e => updateGrupoLocal(g.codigo, { toeic_monto: Number(e.target.value)||0 })} /><small>{moneyInsAdmin(g.toeic_monto)}</small></td>
                  <td><button className="btn btn-secondary" onClick={() => saveGrupoToeic(g)}>Guardar</button></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan="7">No hay grupos que coincidan con la búsqueda.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .insadmin-page{display:flex;flex-direction:column;gap:18px}.insadmin-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.insadmin-head h1{margin:4px 0 6px;font-size:28px}.insadmin-head p,.insadmin-section p{margin:0;color:var(--ink-3);font-size:13px}.insadmin-actions{display:flex;gap:8px;flex-wrap:wrap}.insadmin-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(320px,.9fr);gap:18px}.insadmin-section{padding:18px}.insadmin-section h2{font-size:18px;margin:0 0 14px}.insadmin-section label{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:800;color:var(--ink-2);margin-bottom:12px}.insadmin-section input,.insadmin-section textarea{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:13px;background:#fff}.insadmin-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.insadmin-imgcard{display:grid;grid-template-columns:120px 1fr;gap:12px;align-items:center;border:1px solid var(--line);border-radius:14px;padding:10px;margin-bottom:10px}.insadmin-imgbox{height:88px;border-radius:12px;background:#f3f6fb;display:flex;align-items:center;justify-content:center;overflow:hidden;color:var(--ink-3);font-size:12px}.insadmin-imgbox img{width:100%;height:100%;object-fit:contain}.insadmin-imgmeta{display:flex;flex-direction:column;gap:8px}.insadmin-upload{position:relative;overflow:hidden;align-self:flex-start}.insadmin-upload input{position:absolute;inset:0;opacity:0;cursor:pointer}.insadmin-rowhead{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.insadmin-search{max-width:340px}.insadmin-tablewrap{overflow:auto}.insadmin-table{width:100%;border-collapse:collapse;font-size:13px}.insadmin-table th,.insadmin-table td{border-bottom:1px solid var(--line);padding:10px;text-align:left;vertical-align:middle}.insadmin-table th{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--ink-3)}.insadmin-table td input[type=number]{max-width:130px}.insadmin-table small{display:block;color:var(--ink-3);margin-top:3px}@media(max-width:920px){.insadmin-grid,.insadmin-two{grid-template-columns:1fr}.insadmin-head,.insadmin-rowhead{flex-direction:column}.insadmin-search{max-width:100%}}
      `}</style>
    </div>
  );
}

Object.assign(window, { InscripcionAdminView });
