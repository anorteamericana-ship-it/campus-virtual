/* global React, window, Icon */
/* ============================================================================
   ADMIN — Gestión de becas (Fase 3.8)
   - WizardCrearBeca: 4 pasos guiados con preview de precios en vivo.
   - BecasTabla: gestión rápida (toggles activa/visible, editar, detalle).
   - EditarBecaModal / DetalleBecaModal.
   Becas dinámicas (CONFIG_BECAS, backend v4.37.0). Regla del sistema: una beca
   NUNCA se combina. Solo visualización/gestión — nunca toca la hoja real en demo.
   ============================================================================ */
const { useState: bkUseState, useEffect: bkUseEffect, useMemo: bkUseMemo } = React;

// Precio de referencia para el preview en vivo (grupo B1 típico).
const BK_REF = { matricula: 20000, cuota: 89000, certificado: 35000, titulo: 60000 };
const bkColones = n => '₡' + (Number(n) || 0).toLocaleString('es-CR');
function bkNombreBonito(s) { return String(s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }
// BECAS_DETALLE_NOTAS_V1_20260616
// En el panel "Grupos y becas", el detalle corto debajo del nombre se toma
// primero de NOTAS internas. Si no hay notas, conserva la descripción histórica.
function bkDetalleCorto(b) {
  const notas = String((b && b.notas) || '').trim();
  const desc = String((b && b.descripcion) || '').trim();
  return notas || desc;
}
function bkExpirada(b) {
  if (!b.fecha_fin) return false;
  return new Date().toISOString().slice(0, 10) > b.fecha_fin;
}
const BK_ADMIN_NOMBRE = (() => {
  try { return (window.getSesion && window.getSesion() || {}).nombre || 'admin'; } catch (_) { return 'admin'; }
})();

const BK_RUBROS = [
  { k: 'pct_matricula', label: 'Matrícula', ref: 'matricula' },
  { k: 'pct_cuota', label: 'Cuotas', ref: 'cuota' },
  { k: 'pct_certificado', label: 'Certificado de nivel', ref: 'certificado' },
  { k: 'pct_titulo', label: 'Título del programa', ref: 'titulo' },
];

const BK_VACIA = {
  nombre: '', descripcion: '',
  pct_matricula: 25, pct_cuota: 25, pct_certificado: 0, pct_titulo: 0,
  cupo_total: 100, fecha_inicio: '', fecha_fin: '',
  compatible_ina: true, compatible_sin_ina: true,
  visible_inscripcion: true, notas: '',
};

// ════════════════════════════════════════════════════════════════════════
// WIZARD CREAR BECA
// ════════════════════════════════════════════════════════════════════════
function WizardCrearBeca({ onClose, onCreada, onToast }) {
  const [paso, setPaso] = bkUseState(1);
  const [f, setF] = bkUseState({ ...BK_VACIA });
  const [confirm, setConfirm] = bkUseState(false);
  const [enviando, setEnviando] = bkUseState(false);
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  const pasoValido = {
    1: f.nombre.trim().length > 0,
    2: true,
    3: (f.compatible_ina || f.compatible_sin_ina) && Number(f.cupo_total) >= 0 &&
       (!f.fecha_inicio || !f.fecha_fin || f.fecha_inicio <= f.fecha_fin),
    4: true,
  };

  const crear = async () => {
    setEnviando(true);
    const res = await window.crearBeca({
      nombre: f.nombre.trim(), descripcion: f.descripcion.trim(),
      pct_matricula: Number(f.pct_matricula), pct_cuota: Number(f.pct_cuota),
      pct_certificado: Number(f.pct_certificado), pct_titulo: Number(f.pct_titulo),
      compatible_ina: f.compatible_ina, compatible_sin_ina: f.compatible_sin_ina,
      cupo_total: Number(f.cupo_total) || 0,
      fecha_inicio: f.fecha_inicio, fecha_fin: f.fecha_fin,
      visible_inscripcion: f.visible_inscripcion,
      creado_por: BK_ADMIN_NOMBRE, notas: f.notas.trim(),
    });
    setEnviando(false); setConfirm(false);
    if (res && res.ok) {
      onToast && onToast({ tipo: 'ok', msg: `Beca "${f.nombre.trim()}" creada.` });
      onCreada && onCreada(res.id, res.beca);
    } else {
      onToast && onToast({ tipo: 'err', msg: (res && res.error) || 'No se pudo crear la beca.' });
    }
  };

  return (
    <div className="bk-scrim" onClick={onClose}>
      <div className="bk-modal bk-wizard" onClick={e => e.stopPropagation()}>
        {/* Header + stepper */}
        <div className="bk-modal-head">
          <div>
            <div className="bk-kicker">Nueva beca</div>
            <div className="bk-modal-title">{f.nombre.trim() ? `Beca ${f.nombre.trim()}` : 'Crear beca'}</div>
          </div>
          <button className="bk-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="bk-stepper">
          {['Identidad', 'Descuentos', 'Cupos y vigencia', 'Visibilidad'].map((t, i) => {
            const n = i + 1;
            return (
              <div key={n} className={`bk-step ${paso === n ? 'on' : ''} ${paso > n ? 'done' : ''}`}>
                <span className="bk-step-n">{paso > n ? '✓' : n}</span>
                <span className="bk-step-t">{t}</span>
              </div>
            );
          })}
        </div>

        <div className="bk-modal-body">
          {paso === 1 && <PasoIdentidad f={f} set={set} />}
          {paso === 2 && <PasoDescuentos f={f} set={set} />}
          {paso === 3 && <PasoCupos f={f} set={set} />}
          {paso === 4 && <PasoVisibilidad f={f} set={set} />}
        </div>

        {/* Footer nav */}
        <div className="bk-modal-foot">
          <button className="btn btn-ghost" onClick={() => paso === 1 ? onClose() : setPaso(paso - 1)}>
            {paso === 1 ? 'Cancelar' : '← Atrás'}
          </button>
          <div className="bk-foot-spacer" />
          <span className="bk-foot-count">Paso {paso} de 4</span>
          {paso < 4 ? (
            <button className="btn btn-primary" disabled={!pasoValido[paso]} onClick={() => setPaso(paso + 1)}>Siguiente →</button>
          ) : (
            <button className="btn btn-primary" onClick={() => setConfirm(true)}>Crear beca</button>
          )}
        </div>
      </div>

      {confirm && (
        <div className="bk-scrim bk-scrim-nested" onClick={() => !enviando && setConfirm(false)}>
          <div className="bk-modal bk-confirm" onClick={e => e.stopPropagation()}>
            <div className="bk-modal-title" style={{ marginBottom: 8 }}>Confirmar creación</div>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 18px' }}>
              Vas a crear la beca <b>"{f.nombre.trim()}"</b>. ¿Continuar?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-ghost" disabled={enviando} onClick={() => setConfirm(false)}>Volver</button>
              <button className="btn btn-primary" disabled={enviando} onClick={crear}>
                {enviando ? 'Creando…' : 'Sí, crear beca'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Paso 1 · Identidad ──────────────────────────────────────────────────
function PasoIdentidad({ f, set }) {
  return (
    <div className="bk-fields">
      <div className="bk-field">
        <label className="bk-label">Nombre de la beca <span className="bk-req">*</span></label>
        <input className="bk-input" autoFocus placeholder="Ej. Convenio Empresa X"
          value={f.nombre} onChange={e => set('nombre', e.target.value)} maxLength={60} />
        <div className="bk-hint">Aparecerá como <b>BECA {(f.nombre.trim() || 'NOMBRE').toUpperCase()}</b> en los registros.</div>
      </div>
      <div className="bk-field">
        <label className="bk-label">Descripción</label>
        <textarea className="bk-input" style={{ minHeight: 92, resize: 'vertical' }}
          placeholder="Detalles del convenio o condiciones especiales."
          value={f.descripcion} onChange={e => set('descripcion', e.target.value)} />
      </div>
    </div>
  );
}

// ── Paso 2 · Descuentos por rubro + preview ──────────────────────────────
function PasoDescuentos({ f, set }) {
  return (
    <div className="bk-fields">
      <div className="bk-banner">
        Estos % se aplican sobre el precio base. Una beca puede cubrir desde <b>0%</b> (sin descuento) hasta <b>100%</b> (gratis) en cada rubro.
      </div>
      {BK_RUBROS.map(r => {
        const pct = Number(f[r.k]) || 0;
        return (
          <div key={r.k} className="bk-slider-row">
            <div className="bk-slider-label">{r.label}</div>
            <input type="range" min={0} max={100} step={5} value={pct}
              className="bk-range" onChange={e => set(r.k, Number(e.target.value))}
              style={{ '--bk-fill': pct + '%' }} />
            <input type="number" min={0} max={100} value={pct} className="bk-pct-input"
              onChange={e => set(r.k, Math.max(0, Math.min(100, Number(e.target.value) || 0)))} />
            <span className="bk-pct-sign">%</span>
          </div>
        );
      })}

      <div className="bk-preview">
        <div className="bk-preview-h">Con estos descuentos (grupo de referencia):</div>
        {BK_RUBROS.map(r => {
          const pct = Number(f[r.k]) || 0;
          const base = BK_REF[r.ref];
          const final = Math.round(base * (1 - pct / 100));
          const ahorro = base - final;
          return (
            <div key={r.k} className={`bk-preview-row ${pct ? 'on' : ''}`}>
              <span className="bk-preview-rub">{r.label}</span>
              <span className="bk-preview-nums">
                <s>{bkColones(base)}</s> → <b>{bkColones(final)}</b>
                {ahorro > 0 && <span className="bk-preview-save">ahorra {bkColones(ahorro)}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Paso 3 · Cupos y vigencia ─────────────────────────────────────────────
function PasoCupos({ f, set }) {
  const fechaErr = f.fecha_inicio && f.fecha_fin && f.fecha_inicio > f.fecha_fin;
  const ningunPrograma = !f.compatible_ina && !f.compatible_sin_ina;
  return (
    <div className="bk-fields">
      <div className="bk-field">
        <label className="bk-label">Cupo total</label>
        <input type="number" min={0} className="bk-input bk-input-sm" value={f.cupo_total}
          onChange={e => set('cupo_total', Math.max(0, Number(e.target.value) || 0))} />
        <div className="bk-hint">Para fines de marketing. Cuando llegue a 0 disponibles, podés crear más si querés. <b>0 = ilimitado.</b></div>
      </div>
      <div className="bk-grid2">
        <div className="bk-field">
          <label className="bk-label">Fecha inicio</label>
          <input type="date" className="bk-input bk-input-sm" value={f.fecha_inicio}
            onChange={e => set('fecha_inicio', e.target.value)} />
          <div className="bk-hint">Cuándo empieza a ser solicitable. Vacío = desde ya.</div>
        </div>
        <div className="bk-field">
          <label className="bk-label">Fecha fin</label>
          <input type="date" className="bk-input bk-input-sm" value={f.fecha_fin}
            onChange={e => set('fecha_fin', e.target.value)} />
          <div className="bk-hint">Cuándo deja de ser solicitable. Vacío = permanente.</div>
        </div>
      </div>
      {fechaErr && <div className="bk-inline-err">La fecha de inicio no puede ser posterior a la fecha de fin.</div>}

      <div className="bk-field">
        <label className="bk-label">Compatible con programa</label>
        <div className="bk-checks">
          <label className="bk-check">
            <input type="checkbox" checked={f.compatible_ina} onChange={e => set('compatible_ina', e.target.checked)} />
            <span>INA <i>(acreditado)</i></span>
          </label>
          <label className="bk-check">
            <input type="checkbox" checked={f.compatible_sin_ina} onChange={e => set('compatible_sin_ina', e.target.checked)} />
            <span>Sin INA <i>(programa libre)</i></span>
          </label>
        </div>
        {ningunPrograma && <div className="bk-inline-err">Marcá al menos un programa.</div>}
      </div>

      <div className="bk-note-warn">
        <b>⚠️ Las becas NUNCA se combinan</b>: ni con CONAPE, ni con otras becas. Esa regla es del sistema, no se puede cambiar.
      </div>
    </div>
  );
}

// ── Paso 4 · Visibilidad + resumen ────────────────────────────────────────
function PasoVisibilidad({ f, set }) {
  return (
    <div className="bk-fields">
      <div className="bk-field">
        <label className="bk-label">Visible en formulario público de inscripción</label>
        <BkSwitch on={f.visible_inscripcion} onChange={v => set('visible_inscripcion', v)} />
        <div className="bk-hint">
          {f.visible_inscripcion
            ? 'Aparece en el dropdown para que los prospectos la pidan al inscribirse.'
            : 'No aparece en el público. La asignás manualmente al matricular.'}
        </div>
      </div>
      <div className="bk-field">
        <label className="bk-label">Notas internas</label>
        <textarea className="bk-input" style={{ minHeight: 70, resize: 'vertical' }}
          placeholder="No se muestra al cliente." value={f.notas} onChange={e => set('notas', e.target.value)} />
      </div>

      <div className="bk-resumen">
        <div className="bk-resumen-h">Resumen</div>
        <BkResumenRow k="Nombre" v={f.nombre.trim() || '—'} />
        <BkResumenRow k="Descuentos" v={BK_RUBROS.filter(r => Number(f[r.k]) > 0).map(r => `${r.label} ${f[r.k]}%`).join(' · ') || 'Sin descuentos'} />
        <BkResumenRow k="Cupo" v={Number(f.cupo_total) ? `${f.cupo_total} cupos` : 'Ilimitado'} />
        <BkResumenRow k="Vigencia" v={f.fecha_inicio || f.fecha_fin ? `${f.fecha_inicio || 'desde ya'} → ${f.fecha_fin || 'permanente'}` : 'Permanente'} />
        <BkResumenRow k="Programas" v={[f.compatible_ina && 'INA', f.compatible_sin_ina && 'Sin INA'].filter(Boolean).join(' · ') || '—'} />
        <BkResumenRow k="Visible al público" v={f.visible_inscripcion ? 'Sí' : 'No (asignación manual)'} />
      </div>
    </div>
  );
}
function BkResumenRow({ k, v }) {
  return (
    <div className="bk-resumen-row">
      <span className="bk-resumen-k">{k}</span>
      <span className="bk-resumen-v">{v}</span>
    </div>
  );
}

// ── Switch iOS ────────────────────────────────────────────────────────────
function BkSwitch({ on, onChange, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={on} disabled={disabled}
      className={`bk-switch ${on ? 'on' : ''}`} onClick={() => !disabled && onChange(!on)}>
      <span className="bk-switch-knob" />
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TABLA DE GESTIÓN
// ════════════════════════════════════════════════════════════════════════
function BecasTabla({ destacada, onToast }) {
  const [becas, setBecas] = bkUseState(null);
  const [err, setErr] = bkUseState('');
  const [editar, setEditar] = bkUseState(null);
  const [detalle, setDetalle] = bkUseState(null);
  const [menuId, setMenuId] = bkUseState(null);
  const [busy, setBusy] = bkUseState(null);

  const cargar = () => {
    setErr('');
    window.getBecas({}).then(r => {
      if (!r || !r.ok) { setErr((r && r.error) || 'No se pudo cargar la lista de becas.'); return; }
      setBecas(r.becas || []);
    }).catch(e => setErr(e.message));
  };
  bkUseEffect(cargar, []);
  // Recarga cuando se crea una beca nueva (destacada pasa a un id).
  bkUseEffect(() => { if (destacada) cargar(); }, [destacada]);
  bkUseEffect(() => {
    const close = () => setMenuId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const toggleActiva = async (b) => {
    setBusy(b.id);
    const res = await window.cambiarBecaActivo({ id: b.id, activo: !b.activa });
    setBusy(null);
    if (res && res.ok) { cargar(); onToast && onToast({ tipo: 'ok', msg: `Beca ${b.activa ? 'desactivada' : 'activada'}.` }); }
    else onToast && onToast({ tipo: 'err', msg: (res && res.error) || 'No se pudo cambiar el estado.' });
  };
  const toggleVisible = async (b) => {
    setBusy(b.id);
    const res = await window.cambiarBecaVisibilidad({ id: b.id, visible: !b.visible_inscripcion });
    setBusy(null);
    if (res && res.ok) { cargar(); onToast && onToast({ tipo: 'ok', msg: `Visibilidad ${b.visible_inscripcion ? 'desactivada' : 'activada'}.` }); }
    else onToast && onToast({ tipo: 'err', msg: (res && res.error) || 'No se pudo cambiar la visibilidad.' });
  };

  return (
    <div className="card bk-tabla-card">
      <div className="bk-tabla-head">
        <div className="card-title" style={{ margin: 0 }}>Becas registradas</div>
        {becas && <span className="bk-tabla-count">{becas.length} {becas.length === 1 ? 'beca' : 'becas'}</span>}
      </div>

      {err ? (
        <div className="bk-tabla-err">
          <span>⚠ {err}</span>
          <button className="btn btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={cargar}>Reintentar</button>
        </div>
      ) : !becas ? (
        <div className="bk-tabla-loading">Cargando becas…</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table-soft bk-tabla">
            <thead>
              <tr>
                <th>Beca</th>
                <th style={{ textAlign: 'center' }}>Mat</th>
                <th style={{ textAlign: 'center' }}>Cuota</th>
                <th style={{ textAlign: 'center' }}>Cert</th>
                <th style={{ textAlign: 'center' }}>Tít</th>
                <th style={{ textAlign: 'center' }}>Cupo</th>
                <th style={{ textAlign: 'center' }}>Visible</th>
                <th style={{ textAlign: 'center' }}>Activa</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {becas.map(b => {
                const expirada = bkExpirada(b);
                const atenuada = !b.activa || expirada;
                return (
                  <tr key={b.id} className={`${atenuada ? 'bk-row-off' : ''} ${destacada === b.id ? 'bk-row-new' : ''}`}>
                    <td>
                      <div className="bk-cell-nombre">
                        <span className="bk-bnombre">{bkNombreBonito(b.nombre)}</span>
                        {expirada && <span className="bk-badge-exp">EXPIRADA</span>}
                        {destacada === b.id && <span className="bk-badge-new">NUEVA</span>}
                      </div>
                      {bkDetalleCorto(b) && <div className="bk-bdesc">{bkDetalleCorto(b)}</div>}
                    </td>
                    <td className="bk-pct-cell">{b.pct_matricula}%</td>
                    <td className="bk-pct-cell">{b.pct_cuota}%</td>
                    <td className="bk-pct-cell bk-muted">{b.pct_certificado}%</td>
                    <td className="bk-pct-cell bk-muted">{b.pct_titulo}%</td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--f-mono)', fontSize: 12 }}>
                      {b.cupo_total ? `${b.cupo_usado}/${b.cupo_total}` : '∞'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className={`bk-pill ${b.visible_inscripcion ? 'si' : 'no'}`} disabled={busy === b.id}
                        onClick={() => toggleVisible(b)} title="Mostrar/ocultar en el formulario público">
                        {b.visible_inscripcion ? 'SI' : 'NO'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <BkSwitch on={b.activa} disabled={busy === b.id} onChange={() => toggleActiva(b)} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="bk-acciones">
                        <button className="btn btn-ghost bk-btn-sm" onClick={() => setEditar(b)}>Editar</button>
                        <div className="bk-menu-wrap">
                          <button className="bk-dots" onClick={e => { e.stopPropagation(); setMenuId(menuId === b.id ? null : b.id); }} aria-label="Más acciones">···</button>
                          {menuId === b.id && (
                            <div className="bk-menu" onClick={e => e.stopPropagation()}>
                              <button onClick={() => { setDetalle(b); setMenuId(null); }}>Ver detalle completo</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {becas.length === 0 && (
                <tr><td colSpan={9} style={{ padding: '28px', textAlign: 'center', color: 'var(--ink-3)' }}>Todavía no hay becas registradas. Creá la primera con “+ Crear beca”.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editar && (
        <EditarBecaModal beca={editar} onClose={() => setEditar(null)}
          onGuardada={() => { setEditar(null); cargar(); onToast && onToast({ tipo: 'ok', msg: 'Beca actualizada.' }); }}
          onToast={onToast} />
      )}
      {detalle && <DetalleBecaModal beca={detalle} onClose={() => setDetalle(null)} />}
    </div>
  );
}

// ── Modal editar (mismos campos del wizard, pre-cargados) ─────────────────
function EditarBecaModal({ beca, onClose, onGuardada, onToast }) {
  const [f, setF] = bkUseState({
    ...BK_VACIA, ...beca,
    fecha_inicio: beca.fecha_inicio || '', fecha_fin: beca.fecha_fin || '', notas: beca.notas || '',
  });
  const [enviando, setEnviando] = bkUseState(false);
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const valido = (f.compatible_ina || f.compatible_sin_ina) &&
    (!f.fecha_inicio || !f.fecha_fin || f.fecha_inicio <= f.fecha_fin);

  const guardar = async () => {
    setEnviando(true);
    const res = await window.editarBeca({
      id: beca.id, descripcion: f.descripcion,
      pct_matricula: Number(f.pct_matricula), pct_cuota: Number(f.pct_cuota),
      pct_certificado: Number(f.pct_certificado), pct_titulo: Number(f.pct_titulo),
      compatible_ina: f.compatible_ina, compatible_sin_ina: f.compatible_sin_ina,
      cupo_total: Number(f.cupo_total) || 0, fecha_inicio: f.fecha_inicio, fecha_fin: f.fecha_fin,
      visible_inscripcion: f.visible_inscripcion, notas: f.notas,
    });
    setEnviando(false);
    if (res && res.ok) onGuardada();
    else onToast && onToast({ tipo: 'err', msg: (res && res.error) || 'No se pudo guardar.' });
  };

  return (
    <div className="bk-scrim" onClick={onClose}>
      <div className="bk-modal bk-wizard" onClick={e => e.stopPropagation()}>
        <div className="bk-modal-head">
          <div>
            <div className="bk-kicker">Editar beca</div>
            <div className="bk-modal-title">{bkNombreBonito(beca.nombre)}</div>
          </div>
          <button className="bk-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="bk-modal-body">
          <div className="bk-id-lock">
            <span>ID interno</span><b>{beca.id}</b><i>no editable</i>
          </div>
          <PasoDescuentos f={f} set={set} />
          <div style={{ height: 8 }} />
          <PasoCupos f={f} set={set} />
          <div style={{ height: 8 }} />
          <div className="bk-field">
            <label className="bk-label">Visible en formulario público</label>
            <BkSwitch on={f.visible_inscripcion} onChange={v => set('visible_inscripcion', v)} />
          </div>
          <div className="bk-field">
            <label className="bk-label">Notas internas</label>
            <textarea className="bk-input" style={{ minHeight: 60, resize: 'vertical' }}
              value={f.notas} onChange={e => set('notas', e.target.value)} />
            <div className="bk-help" style={{ marginTop: 6 }}>
              Este texto actualiza el detalle corto que se ve debajo del nombre de la beca en la tabla.
            </div>
          </div>
        </div>
        <div className="bk-modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <div className="bk-foot-spacer" />
          <button className="btn btn-primary" disabled={!valido || enviando} onClick={guardar}>
            {enviando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal detalle read-only ────────────────────────────────────────────────
function DetalleBecaModal({ beca, onClose }) {
  const filas = [
    ['ID interno', beca.id],
    ['Nombre', bkNombreBonito(beca.nombre)],
    ['Descripción', beca.descripcion || '—'],
    ['Matrícula', beca.pct_matricula + '%'],
    ['Cuotas', beca.pct_cuota + '%'],
    ['Certificado', beca.pct_certificado + '%'],
    ['Título', beca.pct_titulo + '%'],
    ['Cupo', beca.cupo_total ? `${beca.cupo_usado} usados de ${beca.cupo_total} (${beca.cupo_disponible} disponibles)` : 'Ilimitado'],
    ['Programas', [beca.compatible_ina && 'INA', beca.compatible_sin_ina && 'Sin INA'].filter(Boolean).join(' · ') || '—'],
    ['Vigencia', beca.fecha_inicio || beca.fecha_fin ? `${beca.fecha_inicio || 'desde ya'} → ${beca.fecha_fin || 'permanente'}` : 'Permanente'],
    ['Visible al público', beca.visible_inscripcion ? 'Sí' : 'No (asignación manual)'],
    ['Activa', beca.activa ? 'Sí' : 'No'],
    ['Creada por', beca.creado_por || '—'],
    ['Fecha de creación', beca.f_creada || '—'],
    ['Notas internas', beca.notas || '—'],
  ];
  return (
    <div className="bk-scrim" onClick={onClose}>
      <div className="bk-modal bk-detalle" onClick={e => e.stopPropagation()}>
        <div className="bk-modal-head">
          <div>
            <div className="bk-kicker">Detalle de beca</div>
            <div className="bk-modal-title">{bkNombreBonito(beca.nombre)}</div>
          </div>
          <button className="bk-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="bk-modal-body">
          {filas.map(([k, v], i) => (
            <div key={i} className="bk-det-row">
              <span className="bk-det-k">{k}</span>
              <span className="bk-det-v">{v}</span>
            </div>
          ))}
        </div>
        <div className="bk-modal-foot">
          <div className="bk-foot-spacer" />
          <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WizardCrearBeca, BecasTabla });
