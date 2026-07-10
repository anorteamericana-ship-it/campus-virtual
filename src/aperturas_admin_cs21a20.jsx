/* global React, ReactDOM, window */
/* F98.4-Z6-CS21A20 · Aperturas editables seguras en Grupos y becas. */
(function () {
  'use strict';

  const { useEffect, useMemo, useState } = React;
  const NIVELES = ['B1', 'B2', 'I1', 'I2'];
  const NIVEL_LABEL = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };

  function apToken() {
    try {
      return (window.getSessionToken && window.getSessionToken()) ||
        ((window.getSesion && window.getSesion()) || {}).token || '';
    } catch (_) { return ''; }
  }

  async function apPost(fn, payload = {}) {
    const url = window.APPS_SCRIPT_URL;
    if (!url) throw new Error('No está configurada la URL del Apps Script.');
    const res = await fetch(`${url}?fn=${encodeURIComponent(fn)}`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn, token:apToken(), ...payload }),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); }
    catch (_) { throw new Error('El servidor devolvió una respuesta inválida.'); }
    if (!json || json.ok !== true) throw new Error((json && (json.mensaje || json.error)) || 'No se pudo completar la operación.');
    return json;
  }

  function apMoney(value) {
    return '₡' + (Number(value) || 0).toLocaleString('es-CR');
  }

  function apDateLabel(iso) {
    if (!iso) return '—';
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('es-CR', { day:'2-digit', month:'short', year:'numeric' });
  }

  function apIsoDate(iso) {
    const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
  }

  function apShiftIso(iso, deltaDays) {
    const d = apIsoDate(iso);
    if (!d || !Number.isFinite(deltaDays)) return iso || '';
    d.setUTCDate(d.getUTCDate() + deltaDays);
    return d.toISOString().slice(0, 10);
  }

  function apDayDiff(nextIso, prevIso) {
    const a = apIsoDate(nextIso);
    const b = apIsoDate(prevIso);
    if (!a || !b) return 0;
    return Math.round((a.getTime() - b.getTime()) / 86400000);
  }

  function apGroupLabel(code) {
    const raw = String(code || '').trim();
    const m = raw.match(/^(?:B1|B2|I1|I2)-([A-Z0-9]+)(?:-[A-Z0-9]+)*-(\d{4})$/i);
    if (!m) return raw || 'Grupo';
    const seg = m[1].toUpperCase();
    const daysMap = { LM:'LUN/MIE', KJ:'MAR/JUE', MJ:'MAR/JUE', LJ:'LUN/JUE', L4:'LUN A JUE', SA:'SAB', VI:'VIE' };
    const dayKey = Object.keys(daysMap).sort((a,b) => b.length - a.length).find(k => seg.startsWith(k)) || '';
    const hour = dayKey ? seg.slice(dayKey.length) : '';
    const hourLabel = hour === '18' || hour === '69' || hour === '1821' ? '6a9pm'
      : hour === '94' ? '9a4pm'
      : hour === '912' ? '9a12pm'
      : hour;
    return `${daysMap[dayKey] || dayKey || seg}${hourLabel ? ` ${hourLabel}` : ''} - ${m[2]}`;
  }

  function apSchedule(a) {
    const ini = String(a.hora_ini || '').trim();
    const fin = String(a.hora_fin || '').trim();
    const horas = ini || fin ? `${ini || '—'}–${fin || '—'}` : '';
    return [a.dias, horas].filter(Boolean).join(' · ') || 'Horario no definido';
  }

  function apInitialForm(apertura) {
    const p = apertura.precios || {};
    return {
      fechas: { B1:'', B2:'', I1:'', I2:'', ...(apertura.fechas || {}) },
      precios: {
        matricula:Number(p.matricula) || 0,
        cuota:Number(p.cuota) || 0,
        certificado_b1:Number(p.certificado_b1) || 0,
        certificado_b2:Number(p.certificado_b2) || 0,
        certificado_i1:Number(p.certificado_i1) || 0,
        certificado_i2:Number(p.certificado_i2) || 0,
        titulo:Number(p.titulo) || 0,
        toeic_monto:Number(p.toeic_monto) || 0,
      },
      moverTodos:true,
      confirmado:false,
    };
  }

  function AperturaEditor({ apertura, onClose, onSaved }) {
    const [form, setForm] = useState(() => apInitialForm(apertura));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const dateError = useMemo(() => {
      let prev = null;
      for (const nivel of NIVELES) {
        const iso = form.fechas[nivel];
        if (!iso) continue;
        const d = apIsoDate(iso);
        if (!d) return `Fecha inválida en ${nivel}.`;
        if (prev && d.getTime() <= prev.getTime()) return 'Las fechas deben avanzar en orden B1 → B2 → I1 → I2.';
        prev = d;
      }
      const b1 = apIsoDate(form.fechas.B1);
      if (!b1) return 'La fecha de Básico I es obligatoria.';
      const today = new Date();
      const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
      if (b1.getTime() <= todayUtc) return 'La apertura debe mantener una fecha futura.';
      return '';
    }, [form.fechas]);

    const setDate = (nivel, value) => {
      setForm(prev => {
        const fechas = { ...prev.fechas };
        if (nivel === 'B1' && prev.moverTodos && prev.fechas.B1 && value) {
          const delta = apDayDiff(value, prev.fechas.B1);
          NIVELES.slice(1).forEach(n => { if (fechas[n]) fechas[n] = apShiftIso(fechas[n], delta); });
        }
        fechas[nivel] = value;
        return { ...prev, fechas, confirmado:false };
      });
    };

    const setPrice = (key, value) => {
      const n = Math.max(0, Math.min(10000000, Number(value) || 0));
      setForm(prev => ({ ...prev, precios:{ ...prev.precios, [key]:n }, confirmado:false }));
    };

    const save = async () => {
      if (saving || dateError || !form.confirmado) return;
      setSaving(true); setError('');
      try {
        const res = await apPost('actualizarAperturaAdmin', {
          codigo_grupo:apertura.codigo_grupo,
          fechas:form.fechas,
          precios:form.precios,
        });
        onSaved(res);
      } catch (e) {
        setError(e && e.message ? e.message : 'No se pudo actualizar la apertura.');
      } finally { setSaving(false); }
    };

    const body = (
      <div className="ap-modal-scrim" onMouseDown={e => e.target === e.currentTarget && !saving && onClose()}>
        <section className="ap-modal" role="dialog" aria-modal="true" aria-label={`Editar apertura ${apertura.codigo_grupo}`}>
          <header className="ap-modal-head">
            <div>
              <span>Editar apertura</span>
              <h3>{apGroupLabel(apertura.codigo_grupo)}</h3>
              <p>{apSchedule(apertura)} · {apertura.programa || 'Programa'}</p>
            </div>
            <button type="button" onClick={onClose} disabled={saving} aria-label="Cerrar">×</button>
          </header>

          <div className="ap-modal-body">
            {error ? <div className="ap-alert ap-alert-error">{error}</div> : null}
            <div className="ap-alert ap-alert-info">
              Este grupo todavía no inició. Al guardar se reemplazan las fechas proyectadas y se recalcula todo su calendario. No modifica estudiantes, pagos, certificados ni CONAPE.
            </div>

            <section className="ap-form-section">
              <div className="ap-section-title"><span>1</span><div><strong>Fechas de inicio</strong><small>Podés ajustar cada nivel por separado.</small></div></div>
              <label className="ap-check-line">
                <input type="checkbox" checked={form.moverTodos} onChange={e => setForm(prev => ({ ...prev, moverTodos:e.target.checked }))} />
                <span>Mover B2, I1 e I2 la misma cantidad de días cuando cambie B1.</span>
              </label>
              <div className="ap-date-grid">
                {NIVELES.map(nivel => (
                  <label key={nivel} className="ap-field">
                    <span>{NIVEL_LABEL[nivel]}</span>
                    <input type="date" value={form.fechas[nivel] || ''} onChange={e => setDate(nivel, e.target.value)} />
                  </label>
                ))}
              </div>
              {dateError ? <div className="ap-inline-error">{dateError}</div> : null}
            </section>

            <section className="ap-form-section">
              <div className="ap-section-title"><span>2</span><div><strong>Precios base</strong><small>Se actualizan en todas las filas del grupo.</small></div></div>
              <div className="ap-price-grid">
                <MoneyField label="Matrícula" value={form.precios.matricula} onChange={v => setPrice('matricula', v)} />
                <MoneyField label="Cuota" value={form.precios.cuota} onChange={v => setPrice('cuota', v)} />
                <MoneyField label="Certificado B1" value={form.precios.certificado_b1} onChange={v => setPrice('certificado_b1', v)} />
                <MoneyField label="Certificado B2" value={form.precios.certificado_b2} onChange={v => setPrice('certificado_b2', v)} />
                <MoneyField label="Certificado I1" value={form.precios.certificado_i1} onChange={v => setPrice('certificado_i1', v)} />
                <MoneyField label="Certificado I2" value={form.precios.certificado_i2} onChange={v => setPrice('certificado_i2', v)} />
                <MoneyField label="Título del programa" value={form.precios.titulo} onChange={v => setPrice('titulo', v)} />
                <MoneyField label="TOEIC" value={form.precios.toeic_monto} onChange={v => setPrice('toeic_monto', v)} />
              </div>
            </section>

            <label className={`ap-confirm ${form.confirmado ? 'on' : ''}`}>
              <input type="checkbox" checked={form.confirmado} onChange={e => setForm(prev => ({ ...prev, confirmado:e.target.checked }))} />
              <span><strong>Confirmo recalcular completamente esta apertura.</strong><small>La operación queda bloqueada automáticamente si el grupo ya inició o tiene actividad académica.</small></span>
            </label>
          </div>

          <footer className="ap-modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving || !!dateError || !form.confirmado}>
              {saving ? 'Guardando y recalculando…' : 'Guardar y recalcular todo'}
            </button>
          </footer>
        </section>
      </div>
    );
    return ReactDOM.createPortal(body, document.body);
  }

  function MoneyField({ label, value, onChange }) {
    return (
      <label className="ap-field ap-money-field">
        <span>{label}</span>
        <div><i>₡</i><input type="number" min="0" max="10000000" step="1000" value={value} onChange={e => onChange(e.target.value)} /></div>
      </label>
    );
  }

  function AperturaCard({ apertura, onEdit }) {
    const p = apertura.precios || {};
    const certText = [p.certificado_b1, p.certificado_b2, p.certificado_i1, p.certificado_i2]
      .map(Number).filter(Number.isFinite).map(apMoney).join(' / ');
    return (
      <article className={`ap-card ${apertura.editable ? '' : 'blocked'}`}>
        <div className="ap-card-main">
          <div className="ap-card-title-row">
            <div>
              <span className="ap-state">APERTURA</span>
              <h3>{apGroupLabel(apertura.codigo_grupo)}</h3>
              <code>{apertura.codigo_grupo}</code>
            </div>
            <button className="btn btn-primary ap-edit-btn" type="button" disabled={!apertura.editable} onClick={() => onEdit(apertura)}>
              {apertura.editable ? 'Editar y recalcular' : 'Edición bloqueada'}
            </button>
          </div>
          <div className="ap-meta-grid">
            <div><span>Horario</span><strong>{apSchedule(apertura)}</strong></div>
            <div><span>Programa</span><strong>{apertura.programa || '—'} · {apertura.modalidad || '—'}</strong></div>
            <div><span>Docente</span><strong>{apertura.docente || 'POR DEFINIR'}</strong></div>
            <div><span>Inicio B1</span><strong>{apDateLabel(apertura.fechas && apertura.fechas.B1)}</strong></div>
          </div>
        </div>

        <div className="ap-level-dates">
          {NIVELES.map(n => <div key={n}><span>{n}</span><strong>{apDateLabel(apertura.fechas && apertura.fechas[n])}</strong></div>)}
        </div>

        <div className="ap-prices">
          <div><span>Matrícula</span><strong>{apMoney(p.matricula)}</strong></div>
          <div><span>Cuota</span><strong>{apMoney(p.cuota)}</strong></div>
          <div className="ap-price-wide"><span>Certificados B1/B2/I1/I2</span><strong>{certText || '—'}</strong></div>
          <div><span>Título</span><strong>{apMoney(p.titulo)}</strong></div>
          <div><span>TOEIC</span><strong>{p.toeic ? apMoney(p.toeic_monto) : 'No incluido'}</strong></div>
        </div>

        {!apertura.editable ? <div className="ap-block-reason">Protegida: {(apertura.bloqueos || []).join(' · ') || 'el grupo ya tiene actividad.'}</div> : null}
      </article>
    );
  }

  function AperturasAdminPanel() {
    const [items, setItems] = useState(null);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(null);
    const [notice, setNotice] = useState('');
    const [tick, setTick] = useState(0);

    useEffect(() => {
      let live = true;
      setError('');
      apPost('getAperturasAdmin')
        .then(r => { if (live) setItems(Array.isArray(r.aperturas) ? r.aperturas : []); })
        .catch(e => { if (live) { setError(e && e.message ? e.message : 'No se pudieron cargar las aperturas.'); setItems([]); } });
      return () => { live = false; };
    }, [tick]);

    const saved = (res) => {
      setEditing(null);
      setNotice((res && res.mensaje) || 'Apertura actualizada y calendario recalculado.');
      setTick(v => v + 1);
      window.setTimeout(() => setNotice(''), 5000);
    };

    return (
      <section className="ap-wrap" aria-label="Aperturas de grupos">
        <div className="ap-header">
          <div>
            <span>Grupos futuros</span>
            <h2>Aperturas</h2>
            <p>Solo aparecen mientras la fecha de Básico I sea futura. Al iniciar, salen automáticamente de este panel.</p>
          </div>
          <div className="ap-count">{items === null ? '…' : items.length}</div>
        </div>

        {notice ? <div className="ap-alert ap-alert-ok">{notice}</div> : null}
        {error ? <div className="ap-alert ap-alert-error"><span>{error}</span><button className="btn btn-ghost" onClick={() => setTick(v => v + 1)}>Reintentar</button></div> : null}
        {items === null ? <div className="ap-loading">Cargando aperturas…</div> : null}
        {items && items.length === 0 && !error ? <div className="ap-empty"><strong>No hay aperturas pendientes.</strong><span>Los grupos con fecha iniciada se administran desde Calendario académico.</span></div> : null}
        {items && items.length ? <div className="ap-list">{items.map(a => <AperturaCard key={a.codigo_grupo} apertura={a} onEdit={setEditing} />)}</div> : null}
        {editing ? <AperturaEditor apertura={editing} onClose={() => setEditing(null)} onSaved={saved} /> : null}
      </section>
    );
  }

  function installWrapper() {
    const Original = window.AdminGruposView;
    if (typeof Original !== 'function') return false;
    if (Original.__cs21a20AperturasWrapper) return true;
    function AdminGruposViewCS21A20(props) {
      return (
        <React.Fragment>
          <Original {...props} />
          <AperturasAdminPanel />
        </React.Fragment>
      );
    }
    AdminGruposViewCS21A20.__cs21a20AperturasWrapper = true;
    AdminGruposViewCS21A20.__original = Original;
    window.AdminGruposView = AdminGruposViewCS21A20;
    return true;
  }

  window.AperturasAdminPanel = AperturasAdminPanel;
  window.addEventListener('an:lazy-module-loaded', installWrapper);
  if (!installWrapper()) {
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (installWrapper() || tries > 120) window.clearInterval(timer);
    }, 250);
  }
})();
