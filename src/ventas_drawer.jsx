/* global React, window */
/* ============================================================================
   VENTAS — Drawer de detalle + modales de acción
   Drawer lateral (40%) con las 8 secciones del prospecto y los modales de
   acción (cobrar matrícula, activar, confirmar, éxito). Aquí vive la lógica
   de los POST; en modo demo se simulan localmente.
   ============================================================================ */
const { useState: vUseState, useEffect: vUseEffect } = React;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// VENTAS-DASHBOARD-002 · Reglamento estudiantil (archivo estático del proyecto).
// Si el PDF NO está adjunto, dejá esta constante VACÍA: el botón queda
// deshabilitado con el mensaje "Falta adjuntar el Reglamento Estudiantil al
// proyecto.". Cuando se suba el archivo (p. ej. assets/docs/reglamento_estudiantil.pdf),
// poné su ruta acá y el botón se habilita automáticamente. NO se inventa archivo.
const REGLAMENTO_URL = '';

// VENTAS-DASHBOARD-002 · Sección "Documentos del estudiante" DENTRO del drawer.
// Bloqueada hasta que el estudiante esté MATRICULADO (admin aplicó la matrícula).
// 3 botones: Hoja de matrícula (CERTIFICADO) · Carta de no deuda CONAPE (MATRICULA_2)
// · Reglamento estudiantil (archivo estático). Reutiliza el endpoint SEGURO
// generarDocumentoVentasSeguro; NUNCA llama generarDocumento directo.
function DocsEstudianteVentas({ detalle, demo, onToast }) {
  const [busy, setBusy] = vUseState('');     // '' | 'CERTIFICADO' | 'CARTA' | upload/notificaciones
  const [err, setErr] = vUseState('');
  const [signedDoc, setSignedDoc] = vUseState(null);
  const signedFileRef = React.useRef(null);
  const d = detalle || {};
  const est = window.calcularEstadoEstudianteVentas(d);
  const matriculado = est.estado === 'MATRICULADO';
  const cedulaPreviewMatricula = String(d.cedula || d.CEDULA || '').replace(/[^\d]/g, '');
  const previewMatriculaCR = cedulaPreviewMatricula === '120180140';
  const codigo = String(d.codigo || d.codigo_estudiante || d.CODIGO_ESTUDIANTE || d.rec_m || '').trim();
  const puedeSubirFirmada = !!codigo || previewMatriculaCR;
  const nivel = d.nivel || d.NIVEL || 'B1';
  const cedulaDoc = d.cedula || d.CEDULA || '';
  const correoDoc = String(d.correo || d.email || d.CORREO || d.EMAIL || d.correo_electronico || d.CORREO_ELECTRONICO || '').trim();
  const waNumDoc = waDigits(d.telefono || d.TELEFONO || d.whatsapp || d.WHATSAPP || d.tel1 || d.TEL1 || d.telefono1 || d.TELEFONO_1 || '');

  const generar = async (btn, tipo, msgFalla) => {
    if (busy) return;
    setBusy(btn); setErr('');
    try {
      if (demo) {
        await sleep(700);
        onToast && onToast({ tipo: 'ok', msg: 'Vista previa: documento de ejemplo (no se genera en modo demo).' });
        return;
      }
      const r = await window.generarDocumentoVentasSeguro({ cedula: d.cedula, codigo, nivel, tipo });
      if (r && r.ok && r.url) {
        window.open(r.url, '_blank', 'noopener');
        onToast && onToast({ tipo: 'ok', msg: 'Documento generado correctamente.' });
      } else {
        const m = (r && (r.mensaje || r.error)) || msgFalla;
        setErr(m); onToast && onToast({ tipo: 'err', msg: m });
      }
    } catch (_) {
      setErr(msgFalla); onToast && onToast({ tipo: 'err', msg: msgFalla });
    } finally { setBusy(''); }
  };

  const pickSigned = () => {
    if (!puedeSubirFirmada) { onToast && onToast({ tipo:'err', msg:'El estudiante debe tener código real para adjuntar la matrícula firmada.' }); return; }
    signedFileRef.current?.click();
  };

  const uploadSigned = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const isPdf = /pdf/i.test(file.type || '') || /\.pdf$/i.test(file.name || '');
    if (!isPdf) { onToast && onToast({ tipo:'err', msg:'Solo se permite subir PDF firmado.' }); return; }
    if (file.size > 9 * 1024 * 1024) { onToast && onToast({ tipo:'err', msg:'El PDF supera los 9 MB.' }); return; }
    setBusy('UPLOAD_SIGNED'); setErr('');
    try {
      const base64 = await window.fileToBase64V(file);
      const r = demo
        ? (await sleep(700), { ok:true, url:'#demo', nombre:file.name, file_id:'demo' })
        : await window.subirMatriculaFirmadaVentasSeguro({
            cedula: cedulaDoc,
            codigo,
            nivel,
            nombre_archivo: file.name,
            mime_type: file.type || 'application/pdf',
            base64,
            preview_test: previewMatriculaCR,
          });
      if (r && r.ok) {
        setSignedDoc(r);
        onToast && onToast({ tipo:'ok', msg:'Matrícula firmada adjuntada al expediente.' });
      } else {
        const m = (r && (r.mensaje || r.error)) || 'No se pudo subir la matrícula firmada.';
        setErr(m); onToast && onToast({ tipo:'err', msg:m });
      }
    } catch (_) {
      const m = 'Error procesando el PDF firmado.';
      setErr(m); onToast && onToast({ tipo:'err', msg:m });
    } finally { setBusy(''); }
  };

  const notifySigned = async (canal) => {
    if (!puedeSubirFirmada) return;
    if (canal === 'whatsapp') {
      const url = signedDoc && signedDoc.url ? signedDoc.url : '';
      if (!url) { onToast && onToast({ tipo:'err', msg:'Primero subí el PDF firmado para obtener el enlace.' }); return; }
      if (!waNumDoc) { onToast && onToast({ tipo:'err', msg:'Este estudiante no tiene WhatsApp/teléfono registrado.' }); return; }
      const msg = `Hola, te compartimos tu documento de matrícula firmado de Academia Norteamericana: ${url}`;
      window.open(`https://wa.me/${waNumDoc}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
      return;
    }
    setBusy(canal === 'correo' ? 'EMAIL_SIGNED' : 'ALERT_SIGNED'); setErr('');
    try {
      const r = demo
        ? (await sleep(500), { ok:true })
        : await window.notificarMatriculaFirmadaVentasSeguro({
            cedula: cedulaDoc,
            codigo,
            canal,
            file_id: signedDoc && signedDoc.file_id ? signedDoc.file_id : '',
            email: correoDoc,
            preview_test: previewMatriculaCR,
          });
      if (r && r.ok) {
        onToast && onToast({ tipo:'ok', msg: canal === 'correo' ? 'Correo enviado.' : 'Alerta del campus creada.' });
      } else {
        const m = (r && (r.mensaje || r.error)) || 'No se pudo enviar la notificación.';
        setErr(m); onToast && onToast({ tipo:'err', msg:m });
      }
    } catch (_) {
      const m = 'Error enviando notificación.';
      setErr(m); onToast && onToast({ tipo:'err', msg:m });
    } finally { setBusy(''); }
  };

  const SignedUploadBlock = () => (
    <div className="vx-docest-signed" style={{ marginTop: 12, borderTop: '1px dashed var(--v-line)', paddingTop: 12 }}>
      <input ref={signedFileRef} type="file" accept="application/pdf,.pdf" style={{ display:'none' }} onChange={uploadSigned} />
      <div className="vx-docest-sub" style={{ marginBottom: 8 }}>
        Adjuntá aquí el PDF ya firmado digitalmente para dejarlo en el expediente del estudiante.
      </div>
      <div className="vx-docest-btns">
        <button className="vx-btn vx-btn-navy" disabled={!!busy || !puedeSubirFirmada} onClick={pickSigned}>
          {busy === 'UPLOAD_SIGNED' ? <><span className="vx-spin" /> Subiendo…</> : <><window.Vico d={window.VI.upload} size={14} /> Subir PDF firmado</>}
        </button>
        {signedDoc && signedDoc.url ? (
          <a className="vx-btn vx-btn-ghost" href={signedDoc.url} target="_blank" rel="noopener" style={{ textDecoration:'none', justifyContent:'center' }}>
            <window.Vico d={window.VI.doc} size={14} /> Ver firmado
          </a>
        ) : null}
      </div>
      {signedDoc && signedDoc.url ? (
        <div className="vx-docest-btns" style={{ marginTop: 8 }}>
          <button className="vx-btn vx-btn-ghost" disabled={!!busy} onClick={() => notifySigned('correo')}>
            {busy === 'EMAIL_SIGNED' ? <><span className="vx-spin dark" /> Enviando…</> : <>Enviar correo</>}
          </button>
          <button className="vx-btn vx-btn-ghost" disabled={!!busy} onClick={() => notifySigned('whatsapp')}>WhatsApp</button>
          <button className="vx-btn vx-btn-ghost" disabled={!!busy} onClick={() => notifySigned('campus')}>
            {busy === 'ALERT_SIGNED' ? <><span className="vx-spin dark" /> Creando…</> : <>Alerta campus</>}
          </button>
        </div>
      ) : null}
      {!codigo && !previewMatriculaCR ? <div className="vx-docest-note">La subida firmada requiere código de estudiante real.</div> : null}
      {!codigo && previewMatriculaCR ? <div className="vx-docest-note">Modo prueba: se adjunta por cédula y se usa un código sugerido solo para revisar el flujo. No matricula ni reserva consecutivo.</div> : null}
    </div>
  );

  return (
    <section className="vx-block vx-docest">
      <div className="vx-block-h"><window.Vico d={window.VI.doc} size={13} /> Documentos del estudiante</div>
      {!matriculado && !previewMatriculaCR ? (
        <div className="vx-docest-lock">
          <window.Vico d={window.VI.shield} size={15} />
          <span>Los documentos estarán disponibles cuando el estudiante esté matriculado.</span>
        </div>
      ) : previewMatriculaCR ? (
        <React.Fragment>
          <div className="vx-docest-sub">
            Modo prueba controlado para cédula 1-2018-0140. No requiere matrícula ni código; genera PDFs de revisión y permite probar la subida del PDF firmado.
          </div>
          <div className="vx-docest-btns">
            <button className="vx-btn vx-btn-navy" disabled={!!busy} onClick={() => generar('MATRICULA_INA_TEST', 'CERT_MATRICULA_INA_TEST', 'No se pudo generar la prueba INA.')}>
              {busy === 'MATRICULA_INA_TEST' ? <><span className="vx-spin" /> Generando…</> : <><window.Vico d={window.VI.doc} size={14} /> Certificado matrícula INA</>}
            </button>
            <button className="vx-btn vx-btn-ghost" disabled={!!busy} onClick={() => generar('MATRICULA_SIN_INA_TEST', 'CERT_MATRICULA_SIN_INA_TEST', 'No se pudo generar la prueba SIN INA.')}>
              {busy === 'MATRICULA_SIN_INA_TEST' ? <><span className="vx-spin dark" /> Generando…</> : <><window.Vico d={window.VI.doc} size={14} /> Certificado matrícula SIN INA</>}
            </button>
          </div>
          <div className="vx-docest-note">Estos botones son temporales y solo aparecen para este prospecto de prueba.</div>
          <SignedUploadBlock />
          {err ? <div className="vx-inline-err" style={{ marginTop: 10 }}><window.Vico d={window.VI.alert} size={15} /><span>{err}</span></div> : null}
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="vx-docest-sub">
            Estudiante matriculado{codigo ? <> · código <b style={{ fontFamily: 'var(--f-mono, monospace)' }}>{codigo}</b></> : ''}. Generá y compartí sus documentos.
          </div>
          <div className="vx-docest-btns">
            <button className="vx-btn vx-btn-navy" disabled={!!busy} onClick={() => generar('CERTIFICADO', 'CERTIFICADO', 'No se pudo generar la hoja de matrícula.')}>
              {busy === 'CERTIFICADO' ? <><span className="vx-spin" /> Generando…</> : <><window.Vico d={window.VI.doc} size={14} /> Hoja de matrícula</>}
            </button>
            <button className="vx-btn vx-btn-ghost" disabled={!!busy} onClick={() => generar('CARTA', 'MATRICULA_2', 'Este documento requiere soporte backend.')}>
              {busy === 'CARTA' ? <><span className="vx-spin dark" /> Generando…</> : <><window.Vico d={window.VI.doc} size={14} /> Carta de no deuda (CONAPE)</>}
            </button>
            {REGLAMENTO_URL ? (
              <a className="vx-btn vx-btn-ghost" href={REGLAMENTO_URL} target="_blank" rel="noopener" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                <window.Vico d={window.VI.doc} size={14} /> Reglamento estudiantil
              </a>
            ) : (
              <button className="vx-btn vx-btn-ghost" disabled title="Falta adjuntar el archivo">
                <window.Vico d={window.VI.doc} size={14} /> Reglamento estudiantil
              </button>
            )}
          </div>
          {!REGLAMENTO_URL ? (
            <div className="vx-docest-note">Falta adjuntar el Reglamento Estudiantil al proyecto.</div>
          ) : null}
          <SignedUploadBlock />
          {err ? <div className="vx-inline-err" style={{ marginTop: 10 }}><window.Vico d={window.VI.alert} size={15} /><span>{err}</span></div> : null}
        </React.Fragment>
      )}
    </section>
  );
}

// Tipos de pago reportables (Fase 3.5).
const TIPOS_PAGO = ['MATRICULA', 'CUOTA', 'CERTIFICADO', 'TITULO', 'OTRO'];
const NIVELES_PAGO = ['B1', 'B2', 'I1', 'I2'];

// Limpia el WhatsApp a solo dígitos con código de país para wa.me.
function waDigits(raw) {
  let d = String(raw || '').replace(/[^\d]/g, '');
  if (!d) return '';
  if (d.length === 8) d = '506' + d;            // CR local → +506
  return d;
}

// PROFORMAS-VENDEDOR-001: ícono "laptop/equipo" (no existe en VI; se define local
// para no tocar ventas_parts.jsx).
const ICON_LAPTOP = 'M4 5h16v10H4z|M2 19h20l-2-3H4z';

// PROFORMAS-VENDEDOR-001 · Tarjeta de proforma con el MISMO formato visual que
// admin (PFCard en matriculas_admin.jsx): ícono superior, título fuerte, subtítulo
// gris, botón principal azul (Descargar), secundario (WhatsApp) y terciario
// (Regenerar). Adaptada a los estilos del módulo ventas (vx-*) y a su flujo real:
// la generación la hace `window.generarProformaProspecto(cedula, tipo)` y
// cada tarjeta genera únicamente su documento (curso o equipo).
function ProformaCardVx({ iconPath, title, subtitle, url, waNum, waMsg, regenerating, canGenerate, onRegen, disabled, disabledMsg, onToast }) {
  const cardStyle = {
    border: '1.5px solid var(--v-line)', borderRadius: 'var(--v-r-md, 10px)', padding: 15,
    display: 'flex', flexDirection: 'column', gap: 11, minWidth: 0,
    background: disabled ? 'var(--v-soft)' : 'var(--v-surface)',
    opacity: disabled ? 0.62 : 1,
  };
  // Enviar por WhatsApp: si falta teléfono → error amigable, nunca rompe la UI.
  const enviarWa = () => {
    if (!waNum) { onToast && onToast({ tipo: 'err', msg: 'Este prospecto no tiene WhatsApp/teléfono registrado.' }); return; }
    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(waMsg || '')}`, '_blank', 'noopener');
  };
  return (
    <div style={cardStyle}>
      <div style={{ width: 38, height: 38, borderRadius: 'var(--v-r-sm, 8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E7F0FB', color: 'var(--v-navy)', flexShrink: 0 }}>
        <window.Vico d={iconPath} size={19} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--v-ink)' }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--v-ink-3)', marginTop: 2, lineHeight: 1.4 }}>{subtitle}</div>
      </div>
      <div style={{ flex: 1 }} />
      {disabled ? (
        <div style={{ fontSize: 11.5, color: 'var(--v-ink-3)', lineHeight: 1.5 }}>{disabledMsg}</div>
      ) : regenerating ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--v-ink-2)', fontSize: 12 }}>
          <span className="vx-spin dark" /> Generando proforma…
        </div>
      ) : url ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <a className="vx-btn vx-btn-navy" href={url} target="_blank" rel="noopener" style={{ justifyContent: 'center', textDecoration: 'none' }}>Descargar</a>
          <button className="vx-btn vx-btn-ghost" style={{ justifyContent: 'center' }} onClick={enviarWa}>
            <window.Vico d={window.VI.wa} size={14} fill="currentColor" /> Enviar por WhatsApp
          </button>
          {canGenerate ? (
            <button className="vx-btn vx-btn-ghost" style={{ justifyContent: 'center', fontSize: 12 }} onClick={onRegen}>↻ Regenerar</button>
          ) : null}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {canGenerate ? (
            <button className="vx-btn vx-btn-navy" style={{ justifyContent: 'center' }} onClick={onRegen}>Generar</button>
          ) : (
            <div style={{ fontSize: 11.5, color: 'var(--v-ink-3)', fontStyle: 'italic' }}>Proforma aún no generada.</div>
          )}
        </div>
      )}
    </div>
  );
}

// Lee un File como base64 con prefijo data: (para el comprobante).
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) { resolve(''); return; }
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

// ── HOOK: grupos disponibles para el programa ──────────────────────────────
function useGruposVx(programa, demo) {
  const [grupos, setGrupos] = vUseState(null);
  vUseEffect(() => {
    let cancel = false;
    const param = programa === 'INA' ? 'INA' : 'SIN_INA';
    if (demo) { setGrupos(window.DEMO_GRUPOS); return; }
    (async () => {
      try {
        const d = await window.getGruposVentas(param);
        const list = Array.isArray(d) ? d : (d && d.grupos) || [];
        if (!cancel) setGrupos(list.map(g => ({ codigo: g.codigo || g.cod || g.id || '', etiqueta: g.etiqueta || g.horario || g.codigo || '' })));
      } catch (_) { if (!cancel) setGrupos(window.DEMO_GRUPOS); }
    })();
    return () => { cancel = true; };
  }, [programa, demo]);
  return grupos;
}

function GrupoSelect({ programa, demo, value, onChange }) {
  const grupos = useGruposVx(programa, demo);
  if (!grupos) return <div className="vx-sk" style={{ height: 40, borderRadius: 8 }} />;
  return (
    <select className="vx-select" style={{ width: '100%' }} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">Seleccioná un grupo…</option>
      {grupos.map(g => <option key={g.codigo} value={g.codigo}>{g.codigo}{g.etiqueta ? ` — ${g.etiqueta}` : ''}</option>)}
    </select>
  );
}

// ── MODAL: COBRAR MATRÍCULA Y ACTIVAR ───────────────────────────────────────
function CobrarModal({ detalle, asesor, demo, onClose, onSuccess, onError }) {
  const [grupo, setGrupo] = vUseState(detalle.grupo_tentativo || '');
  const [monto, setMonto] = vUseState('');
  const [comprobante, setComprobante] = vUseState('');
  const [loading, setLoading] = vUseState(false);
  const [err, setErr] = vUseState('');

  const submit = async () => {
    if (!grupo) return setErr('Seleccioná el grupo de inicio.');
    if (!monto.trim()) return setErr('Ingresá el monto de la matrícula.');
    if (!comprobante.trim()) return setErr('Ingresá el número o referencia del comprobante.');
    setErr(''); setLoading(true);
    try {
      const r = demo
        ? (await sleep(900), { ok: true, codigo: 'C' + (17500 + Math.floor(Math.random()*400)), conape_sync: true })
        : await window.cobrarMatriculaProspecto(detalle.cedula, grupo, monto.trim(), comprobante.trim(), asesor);
      setLoading(false);
      if (r && r.ok) onSuccess({ ...r, grupo, etapa: 'ACTIVO' });
      else { setErr((r && r.error) || 'No se pudo registrar el cobro. Intentá de nuevo.'); }
    } catch (_) { setLoading(false); setErr('Error de conexión. Intentá de nuevo.'); }
  };

  return (
    <div className="vx-modal-scrim" onClick={onClose}>
      <div className="vx-modal" onClick={e => e.stopPropagation()}>
        <div className="vx-modal-head red">
          <div className="vx-modal-title">Cobrar matrícula y activar</div>
          <div className="vx-modal-sub">{detalle.nombre}</div>
        </div>
        <div className="vx-modal-body">
          {err ? <div className="vx-inline-err"><window.Vico d={window.VI.alert} size={15} /><span>{err}</span></div> : null}
          <div>
            <label className="vx-flabel">Grupo de inicio</label>
            <GrupoSelect programa={detalle.programa} demo={demo} value={grupo} onChange={setGrupo} />
          </div>
          <div>
            <label className="vx-flabel">Monto de matrícula</label>
            <input className="vx-input" inputMode="numeric" placeholder="Ej: 25000" value={monto} onChange={e => setMonto(e.target.value)} />
          </div>
          <div>
            <label className="vx-flabel">Comprobante (referencia / N° de transacción)</label>
            <input className="vx-input" placeholder="Ej: SINPE 0089-4471" value={comprobante} onChange={e => setComprobante(e.target.value)} />
          </div>
        </div>
        <div className="vx-modal-foot">
          <button className="vx-btn vx-btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="vx-btn vx-btn-red" onClick={submit} disabled={loading}>
            {loading ? <><span className="vx-spin" /> Procesando…</> : 'Cobrar y activar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL: ACTIVAR COMO ESTUDIANTE (solo grupo) ─────────────────────────────
function ActivarModal({ detalle, asesor, demo, onClose, onSuccess }) {
  const [grupo, setGrupo] = vUseState(detalle.grupo_tentativo || '');
  const [loading, setLoading] = vUseState(false);
  const [err, setErr] = vUseState('');
  const submit = async () => {
    if (!grupo) return setErr('Seleccioná el grupo de inicio.');
    setErr(''); setLoading(true);
    try {
      const r = demo
        ? (await sleep(900), { ok: true, codigo: 'C' + (17500 + Math.floor(Math.random()*400)), conape_sync: Math.random() > 0.4 })
        : await window.activarEstudiante(detalle.cedula, grupo, asesor);
      setLoading(false);
      if (r && r.ok) onSuccess({ ...r, grupo, etapa: 'ACTIVO' });
      else setErr((r && r.error) || 'No se pudo activar. Intentá de nuevo.');
    } catch (_) { setLoading(false); setErr('Error de conexión. Intentá de nuevo.'); }
  };
  return (
    <div className="vx-modal-scrim" onClick={onClose}>
      <div className="vx-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="vx-modal-head red">
          <div className="vx-modal-title">Activar como estudiante</div>
          <div className="vx-modal-sub">{detalle.nombre} · desembolso CONAPE confirmado</div>
        </div>
        <div className="vx-modal-body">
          {err ? <div className="vx-inline-err"><window.Vico d={window.VI.alert} size={15} /><span>{err}</span></div> : null}
          <div>
            <label className="vx-flabel">Grupo de inicio</label>
            <GrupoSelect programa={detalle.programa} demo={demo} value={grupo} onChange={setGrupo} />
          </div>
        </div>
        <div className="vx-modal-foot">
          <button className="vx-btn vx-btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="vx-btn vx-btn-red" onClick={submit} disabled={loading}>
            {loading ? <><span className="vx-spin" /> Activando…</> : 'Activar estudiante'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL: CONFIRMAR (cancelar prospecto) ───────────────────────────────────
function ConfirmModal({ title, body, confirmLabel, danger, onConfirm, onClose }) {
  const [loading, setLoading] = vUseState(false);
  const go = async () => { setLoading(true); await onConfirm(); /* parent cierra */ };
  return (
    <div className="vx-modal-scrim" onClick={onClose}>
      <div className="vx-modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="vx-modal-body" style={{ textAlign: 'center', paddingTop: 24 }}>
          <div className="vx-confirm-icon"><window.Vico d={window.VI.alert} size={24} /></div>
          <div className="vx-modal-title" style={{ marginTop: 6 }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--v-ink-2)', lineHeight: 1.5 }}>{body}</div>
        </div>
        <div className="vx-modal-foot" style={{ justifyContent: 'center' }}>
          <button className="vx-btn vx-btn-ghost" onClick={onClose} disabled={loading}>No, volver</button>
          <button className={`vx-btn ${danger ? 'vx-btn-red' : 'vx-btn-navy'}`} onClick={go} disabled={loading}>
            {loading ? <><span className="vx-spin" /> …</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL: ÉXITO (activación) ───────────────────────────────────────────────
function SuccessModal({ result, onClose, onExpediente }) {
  const conapeFallo = result.conape_sync === false;
  return (
    <div className="vx-modal-scrim" onClick={onClose}>
      <div className="vx-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="vx-modal-body" style={{ textAlign: 'center', paddingTop: 26, gap: 16 }}>
          <div className="vx-success-icon"><window.Vico d={window.VI.check} size={28} /></div>
          <div>
            <div className="vx-modal-title">¡Estudiante activado!</div>
            <div style={{ fontSize: 13, color: 'var(--v-ink-2)', marginTop: 4 }}>
              Se generó el expediente en el grupo <b>{result.grupo}</b>.
            </div>
          </div>
          {result.codigo ? (
            <div>
              <div style={{ fontSize: 11, color: 'var(--v-ink-3)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>Código generado</div>
              <div className="vx-code-pill">{result.codigo}</div>
            </div>
          ) : null}
          {conapeFallo ? (
            <div className="vx-warn-box">
              ⚠ El estudiante quedó activo en el campus, pero la sincronización con CONAPE no se completó. No es un error fatal — podés reintentar la sincronización más tarde desde el expediente.
            </div>
          ) : null}
        </div>
        <div className="vx-modal-foot" style={{ justifyContent: 'center' }}>
          <button className="vx-btn vx-btn-ghost" onClick={onClose}>Cerrar</button>
          <button className="vx-btn vx-btn-navy" onClick={onExpediente}>Ir al expediente</button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL: AGREGAR NOTA (Fase 3.5) ──────────────────────────────────────
function NotaModal({ detalle, asesor, demo, onClose, onSaved, onToast }) {
  const [texto, setTexto] = vUseState('');
  const [loading, setLoading] = vUseState(false);
  const submit = async () => {
    if (!texto.trim() || loading) return;
    setLoading(true);
    try {
      const r = demo ? (await sleep(500), { ok: true })
        : await window.agregarNotaProspecto(detalle.cedula, asesor, texto.trim());
      setLoading(false);
      if (r && r.ok) {
        onSaved({ fecha: window.HOY, autor: asesor, texto: texto.trim() });
        onToast({ tipo: 'ok', msg: 'Nota agregada' });
        onClose();
      } else onToast({ tipo: 'err', msg: (r && r.error) || 'No se pudo agregar la nota' });
    } catch (_) { setLoading(false); onToast({ tipo: 'err', msg: 'Error de conexión' }); }
  };
  return (
    <div className="vx-modal-scrim" onClick={onClose}>
      <div className="vx-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="vx-modal-head">
          <div className="vx-modal-title">Agregar nota</div>
          <div className="vx-modal-sub">{detalle.nombre}</div>
        </div>
        <div className="vx-modal-body">
          <div>
            <label className="vx-flabel">Nota</label>
            <textarea className="vx-input" style={{ minHeight: 110, resize: 'vertical', fontFamily: 'inherit' }} autoFocus
              placeholder="Ej: Cliente confirmó que enviará documentos mañana"
              value={texto} onChange={e => setTexto(e.target.value)} />
          </div>
        </div>
        <div className="vx-modal-foot">
          <button className="vx-btn vx-btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="vx-btn vx-btn-navy" onClick={submit} disabled={loading || !texto.trim()}>
            {loading ? <><span className="vx-spin" /> Guardando…</> : 'Guardar nota'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL: REPORTAR PAGO (Fase 3.5) ─────────────────────────────────────
// El vendedor sube el comprobante como EVIDENCIA. El admin lo verá en la cola
// "Solicitudes", cruzará el número con BDBANCARIO y aplicará el pago a mano.
function ReportarPagoModal({ detalle, usuario, demo, onClose, onToast }) {
  const [tipo, setTipo] = vUseState('MATRICULA');
  const [nivel, setNivel] = vUseState('B1');
  const [numComp, setNumComp] = vUseState('');
  const [monto, setMonto] = vUseState('');
  const [foto, setFoto] = vUseState(null);
  const [notas, setNotas] = vUseState('');
  const [loading, setLoading] = vUseState(false);
  const [err, setErr] = vUseState('');
  const fileRef = React.useRef(null);

  const pickFoto = e => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!/^(image\/jpeg|image\/png|application\/pdf)$/.test(f.type)) {
      setErr('Formato no permitido. Subí JPG, PNG o PDF.'); return;
    }
    if (f.size > 8 * 1024 * 1024) { setErr('El archivo supera los 8 MB.'); return; }
    setErr(''); setFoto(f);
  };

  const submit = async () => {
    if (!numComp.trim()) return setErr('El número de comprobante es obligatorio (clave para cruzar con BDBANCARIO).');
    if (!(parseFloat(monto) > 0)) return setErr('Ingresá un monto válido mayor a 0.');
    if (!foto) return setErr('Adjuntá la foto o PDF del comprobante.');
    setErr(''); setLoading(true);
    try {
      const fileBase64 = await readFileAsBase64(foto);
      const body = {
        usuario_reporta: usuario.cedula || '',
        nombre_reporta: usuario.nombre || '',
        origen: 'VENDEDOR',
        estudiante_cedula: detalle.cedula,
        estudiante_codigo: detalle.codigo || detalle.codigo_estudiante || '',
        estudiante_nombre: detalle.nombre,
        tipo_pago: tipo,
        nivel: tipo === 'OTRO' ? '' : nivel,
        numero_comprobante: numComp.trim(),
        monto_reportado: parseFloat(monto),
        foto_base64: (fileBase64 || '').split(',')[1] || '',
        foto_mime: foto.type,
        notas_reporta: notas.trim(),
      };
      const res = await window.reportarPago(body);
      setLoading(false);
      if (res && res.ok && res.estado === 'PENDIENTE') {
        onClose();
        onToast({ tipo: 'ok', msg: '✅ Reportado al admin. Te avisará cuando aplique el pago.' });
      } else if (res && res.ok && res.estado === 'DUPLICADO') {
        onClose();
        onToast({ tipo: 'warn', msg: '⚠️ Este comprobante ya fue aplicado antes. La solicitud quedó como duplicada.' });
      } else {
        setErr((res && res.error) || 'No se pudo reportar el pago. Intentá de nuevo.');
      }
    } catch (_) { setLoading(false); setErr('Error de conexión. Intentá de nuevo.'); }
  };

  return (
    <div className="vx-modal-scrim" onClick={onClose}>
      <div className="vx-modal" onClick={e => e.stopPropagation()}>
        <div className="vx-modal-head red">
          <div className="vx-modal-title">Reportar pago</div>
          <div className="vx-modal-sub">{detalle.nombre} · {detalle.cedula}</div>
        </div>
        <div className="vx-modal-body">
          {err ? <div className="vx-inline-err"><window.Vico d={window.VI.alert} size={15} /><span>{err}</span></div> : null}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 150px' }}>
              <label className="vx-flabel">Tipo de pago</label>
              <select className="vx-select" style={{ width: '100%' }} value={tipo} onChange={e => setTipo(e.target.value)}>
                {TIPOS_PAGO.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            {tipo !== 'OTRO' ? (
              <div style={{ flex: '1 1 110px' }}>
                <label className="vx-flabel">Nivel</label>
                <select className="vx-select" style={{ width: '100%' }} value={nivel} onChange={e => setNivel(e.target.value)}>
                  {NIVELES_PAGO.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            ) : null}
          </div>

          <div>
            <label className="vx-flabel">Número de comprobante <span style={{ color: 'var(--v-red)' }}>*</span></label>
            <input className="vx-input" inputMode="numeric" placeholder="Ej. 74974001" value={numComp} onChange={e => setNumComp(e.target.value)} />
            <div style={{ fontSize: 11, color: 'var(--v-ink-3)', marginTop: 4 }}>El admin cruza este número con BDBANCARIO para confirmar el dinero.</div>
          </div>

          <div>
            <label className="vx-flabel">Monto reportado <span style={{ color: 'var(--v-red)' }}>*</span></label>
            <input className="vx-input" inputMode="numeric" placeholder="20000" value={monto} onChange={e => setMonto(e.target.value)} />
          </div>

          <div>
            <label className="vx-flabel">Foto del comprobante <span style={{ color: 'var(--v-red)' }}>*</span></label>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,application/pdf" style={{ display: 'none' }} onChange={pickFoto} />
            <button type="button" className="vx-mini-btn" style={{ width: '100%', justifyContent: foto ? 'space-between' : 'center', padding: '11px 14px' }} onClick={() => fileRef.current?.click()}>
              {foto
                ? <><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}><window.Vico d={window.VI.doc} size={14} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{foto.name}</span></span><span className="vx-copy">cambiar</span></>
                : <><window.Vico d={window.VI.upload} size={14} /> Subir JPG, PNG o PDF</>}
            </button>
          </div>

          <div>
            <label className="vx-flabel">Notas (opcional)</label>
            <textarea className="vx-input" style={{ minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="Algo que el admin deba saber…" value={notas} onChange={e => setNotas(e.target.value)} />
          </div>
        </div>
        <div className="vx-modal-foot">
          <button className="vx-btn vx-btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="vx-btn vx-btn-red" onClick={submit} disabled={loading}>
            {loading ? <><span className="vx-spin" /> Enviando…</> : 'Enviar al admin'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL: CANCELAR PROSPECTO con motivo (Fase 3.6) ─────────────────────
// Soft-delete con auditoría: no elimina, registra motivo + quién + cuándo.
function CancelarProspectoModal({ detalle, usuario, onClose, onCancelado, onToast }) {
  const [motivo, setMotivo] = vUseState('');
  const [loading, setLoading] = vUseState(false);
  const [err, setErr] = vUseState('');
  const submit = async () => {
    if (!motivo.trim()) { setErr('El motivo de cancelación es obligatorio.'); return; }
    setErr(''); setLoading(true);
    try {
      const res = await window.cancelarProspecto({
        cedula: detalle.cedula,
        cancelado_por: (usuario && usuario.nombre) || '',
        motivo: motivo.trim(),
      });
      setLoading(false);
      if (res && res.ok) {
        onToast({ tipo: 'ok', msg: 'Prospecto cancelado. Queda en el sistema con el motivo.' });
        onCancelado();
      } else setErr((res && res.error) || 'No se pudo cancelar el prospecto.');
    } catch (_) { setLoading(false); setErr('Error de conexión. Intentá de nuevo.'); }
  };
  return (
    <div className="vx-modal-scrim" onClick={onClose}>
      <div className="vx-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="vx-modal-head">
          <div className="vx-modal-title">Cancelar prospecto</div>
          <div className="vx-modal-sub">{detalle.nombre}</div>
        </div>
        <div className="vx-modal-body">
          {err ? <div className="vx-inline-err"><window.Vico d={window.VI.alert} size={15} /><span>{err}</span></div> : null}
          <div style={{ fontSize: 13, color: 'var(--v-ink-2)', lineHeight: 1.55 }}>
            Cancelar un prospecto <b>NO lo elimina</b>. Queda en el sistema con el motivo. ¿Continuar?
          </div>
          <div>
            <label className="vx-flabel">Motivo de cancelación <span style={{ color: 'var(--v-red)' }}>*</span></label>
            <textarea className="vx-input" style={{ minHeight: 96, resize: 'vertical', fontFamily: 'inherit' }} autoFocus
              placeholder="Ej: Desistió por motivos laborales. Reintentar el próximo cuatrimestre."
              value={motivo} onChange={e => setMotivo(e.target.value)} />
          </div>
        </div>
        <div className="vx-modal-foot">
          <button className="vx-btn vx-btn-ghost" onClick={onClose} disabled={loading}>No, volver</button>
          <button className="vx-btn vx-btn-red" onClick={submit} disabled={loading || !motivo.trim()}>
            {loading ? <><span className="vx-spin" /> Cancelando…</> : 'Sí, cancelar prospecto'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DRAWER PRINCIPAL ─────────────────────────────────────────────────────────
function ProspectoDrawer({ cedula, seed, asesor, usuario, demo, esSuperadmin, onClose, onToast, onView, onChanged }) {
  const [detalle, setDetalle] = vUseState(null);
  const [loading, setLoading] = vUseState(true);
  const [error, setError] = vUseState('');
  const [nota, setNota] = vUseState('');
  const [savingNota, setSavingNota] = vUseState(false);
  const [modal, setModal] = vUseState(null);   // 'cobrar' | 'activar' | 'cancelar' | { tipo:'success', result }
  const [actLoading, setActLoading] = vUseState('');
  const [loadingProforma, setLoadingProforma] = vUseState('');
  const fileRef = React.useRef(null);
  const pendingDocKey = React.useRef(null);

  const cargar = React.useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (demo) {
        await sleep(450);
        // Fase 3: en vista previa el prospecto puede venir del dashboard (seed),
        // que trae menos campos que getProspectoDetalle. Coercionamos los arrays
        // que el render espera para no romper la maqueta.
        let d = seed ? { ...seed } : window.DEMO_PROSPECTOS.find(p => p.cedula === cedula);
        if (d) d = {
          ...d,
          notas: Array.isArray(d.notas) ? d.notas : [],
          conape_eventos: Array.isArray(d.conape_eventos) ? d.conape_eventos : [],
          docs_extra: Array.isArray(d.docs_extra) ? d.docs_extra : [],
        };
        setDetalle(d || null);
        if (!d) setError('Prospecto no encontrado.');
      } else {
        const d = await window.getProspectoDetalle(cedula);
        if (d && d.ok !== false) setDetalle(d.prospecto || d);
        else setError((d && d.error) || 'No se pudo cargar el prospecto.');
      }
    } catch (_) { setError('Error de conexión.'); }
    finally { setLoading(false); }
  }, [cedula, demo, seed]);

  vUseEffect(() => { cargar(); }, [cargar]);
  vUseEffect(() => {
    const fn = e => { if (e.key === 'Escape' && !modal) onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose, modal]);

  const copy = (txt) => { navigator.clipboard?.writeText(txt); onToast({ tipo: 'ok', msg: 'Copiado al portapapeles' }); };

  // ── Agregar nota ──
  const addNota = async () => {
    if (!nota.trim()) return;
    setSavingNota(true);
    try {
      const r = demo ? (await sleep(500), { ok: true })
        : await window.agregarNotaProspecto(detalle.cedula, asesor, nota.trim());
      if (r && r.ok) {
        const nueva = { fecha: window.HOY, autor: asesor, texto: nota.trim() };
        setDetalle(d => ({ ...d, notas: [nueva, ...(d.notas || [])] }));
        setNota('');
        onToast({ tipo: 'ok', msg: 'Nota agregada' });
      } else onToast({ tipo: 'err', msg: (r && r.error) || 'No se pudo agregar la nota' });
    } catch (_) { onToast({ tipo: 'err', msg: 'Error de conexión' }); }
    finally { setSavingNota(false); }
  };

  // ── Subir documento (extra o manual de los 3) ──
  const triggerUpload = (docKey) => { pendingDocKey.current = docKey || null; fileRef.current?.click(); };
  const onFilePicked = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { onToast({ tipo: 'err', msg: 'El archivo supera los 5 MB' }); return; }
    const docKey = pendingDocKey.current;
    onToast({ tipo: 'ok', msg: 'Subiendo documento…' });
    try {
      const base64 = await window.fileToBase64V(file);
      const r = demo ? (await sleep(700), { ok: true })
        : await window.subirDocumentoExtra(detalle.cedula, file.name, file.type, base64);
      if (r && r.ok) {
        if (docKey) {
          setDetalle(d => ({ ...d, [docKey]: base64 }));
        } else {
          const nuevo = { nombre_archivo: file.name, mime_type: file.type, url: base64, fecha: window.HOY };
          setDetalle(d => ({ ...d, docs_extra: [nuevo, ...(d.docs_extra || [])] }));
        }
        onToast({ tipo: 'ok', msg: 'Documento subido' });
      } else onToast({ tipo: 'err', msg: (r && r.error) || 'No se pudo subir el documento' });
    } catch (_) { onToast({ tipo: 'err', msg: 'Error al procesar el archivo' }); }
  };

  // ── Marcar etapa ──
  const marcar = async (etapa, label) => {
    setActLoading(etapa);
    try {
      const r = demo ? (await sleep(700), { ok: true })
        : await window.marcarEtapaProspecto(detalle.cedula, etapa, asesor);
      if (r && r.ok) {
        setDetalle(d => ({ ...d, etapa }));
        onToast({ tipo: 'ok', msg: label || 'Etapa actualizada' });
        onChanged && onChanged({ cedula: detalle.cedula, etapa });
        if (etapa === 'CANCELADO') { setModal(null); onClose(); }
      } else onToast({ tipo: 'err', msg: (r && r.error) || 'No se pudo actualizar la etapa' });
    } catch (_) { onToast({ tipo: 'err', msg: 'Error de conexión' }); }
    finally { setActLoading(''); }
  };

  // ── Generar proforma CONAPE ──
  const generarProforma = async (tipo = 'curso') => {
    if (loadingProforma) return;
    setLoadingProforma(tipo);
    try {
      const demoConsec = 'DEMO-' + Math.floor(1000 + Math.random()*9000);
      const r = demo
        ? (await sleep(1200), tipo === 'equipo'
            ? { ok: true, tipo, url_equipo: '#demo', consecutivo_equipo: demoConsec }
            : { ok: true, tipo, url_programa: '#demo', consecutivo_programa: demoConsec })
        : await window.generarProformaProspecto(detalle.cedula, tipo);

      if (r && r.ok) {
        const patch = {};
        if (r.url_programa) patch.proforma_url = r.url_programa;
        if (r.url_equipo) patch.proforma_equipo_url = r.url_equipo;
        const consecutivo = tipo === 'equipo' ? r.consecutivo_equipo : r.consecutivo_programa;
        const etiqueta = tipo === 'equipo' ? 'equipo' : 'curso';

        onToast({
          tipo: 'ok',
          msg: `Proforma de ${etiqueta}${consecutivo ? ` Nº${consecutivo}` : ''} generada.`,
        });

        // Actualizar únicamente la URL generada; no borrar la otra proforma.
        setDetalle(d => ({ ...d, ...patch }));
        onChanged && onChanged({ cedula: detalle.cedula, ...patch });
      } else {
        onToast({
          tipo: 'err',
          msg: (r && (r.mensaje || r.error)) || 'No se pudo generar la proforma.',
        });
      }
    } catch (err) {
      onToast({ tipo: 'err', msg: (err && err.message) || 'Error de conexión.' });
    } finally {
      setLoadingProforma('');
    }
  };

  // ── Aprobar / rechazar beca (superadmin). Rechazar libera el cupo en backend;
  //    el financiamiento se mantiene en PROPIO (beca rechazada = paga 100%). ──
  const decidirBeca = async (decision) => {
    if (!window.confirm(`¿Confirmás ${decision === 'APROBADA' ? 'APROBAR' : 'RECHAZAR'} la beca?`)) return;
    try {
      const r = demo ? { ok: true }
        : await window.aprobarBecaProspecto(detalle.cedula, decision, asesor);
      if (r && r.ok) {
        setDetalle(d => ({ ...d, beca_estado: decision }));
        onChanged && onChanged({ cedula: detalle.cedula, beca_estado: decision });
        onToast({ tipo: 'ok', msg: `Beca ${decision.toLowerCase()}.` });
      } else onToast({ tipo: 'err', msg: (r && r.error) || 'No se pudo actualizar la beca.' });
    } catch (_) { onToast({ tipo: 'err', msg: 'Error de conexión.' }); }
  };

  // ── Éxito tras cobrar/activar ──
  const onActivado = (result) => {
    setModal({ tipo: 'success', result });
    setDetalle(d => ({ ...d, etapa: 'ACTIVO', codigo: result.codigo || d.codigo }));
    onChanged && onChanged({ cedula: detalle.cedula, etapa: 'ACTIVO' });
  };
  const irExpediente = () => { onToast({ tipo: 'ok', msg: `Abriendo expediente ${detalle.codigo || ''}…` }); setModal(null); };

  // WhatsApp del prospecto, limpio para wa.me (Fase 3.5).
  const waNum = waDigits(detalle && (detalle.whatsapp || detalle.telefono));
  const llamarWhatsApp = () => { if (waNum) window.open(`https://wa.me/${waNum}`, '_blank', 'noopener'); };

  const d = detalle;

  return ReactDOM.createPortal((
    <React.Fragment>
      <div className="vx-scrim" onClick={onClose} />
      <aside className="vx-drawer" role="dialog" aria-label="Detalle del prospecto">
        {loading ? (
          <DrawerSkeleton onClose={onClose} />
        ) : error ? (
          <div style={{ padding: 30 }}>
            <button className="vx-dr-close" style={{ position: 'static', background: 'var(--v-line)', color: 'var(--v-ink)' }} onClick={onClose}><window.Vico d={window.VI.close} size={18} /></button>
            <div style={{ marginTop: 20, color: 'var(--v-red)', fontWeight: 600 }}>{error}</div>
          </div>
        ) : (
          <React.Fragment>
            {/* 1 · HEADER */}
            <div className="vx-dr-head">
              <button className="vx-dr-close" onClick={onClose}><window.Vico d={window.VI.close} size={18} /></button>
              <div className="vx-dr-eyebrow">Prospecto</div>
              <div className="vx-dr-name">{d.nombre}</div>
              <div className="vx-dr-ced">{d.cedula}</div>
              <div className="vx-dr-badges">
                <window.EtapaBadge etapa={d.etapa} />
                <window.FinBadge financiamiento={d.financiamiento} />
                {d.codigo ? <span className="vx-badge" style={{ background: 'rgba(255,255,255,.16)', color: '#fff' }}>Código {d.codigo}</span> : null}
              </div>
            </div>

            <div className="vx-dr-body">
              {/* Acción sugerida según la etapa actual (Fase 3) */}
              {window.ACCION_ETAPA[d.etapa] ? (
                <div className="vx-accion">
                  <div className="vx-accion-top">
                    <span className="vx-accion-lbl">Etapa actual</span>
                    <window.EtapaBadge etapa={d.etapa} />
                  </div>
                  <div className="vx-accion-sug">
                    <span className="vx-accion-arrow">›</span>
                    <span><b>Acción sugerida:</b> {window.ACCION_ETAPA[d.etapa]}</span>
                  </div>
                </div>
              ) : null}

              {/* DOCUMENTOS DEL ESTUDIANTE (VENTAS-DASHBOARD-002 O6–O8) — dentro del
                  detalle, alto y visible; bloqueado hasta MATRICULADO. */}
              <DocsEstudianteVentas detalle={d} demo={demo} onToast={onToast} />

              {/* 2 · INFO PERSONAL */}
              <section className="vx-block">
                <div className="vx-block-h"><window.Vico d={window.VI.phone} size={13} /> Información personal</div>
                <dl className="vx-kv">
                  <dt>Cédula</dt><dd>{String(d.cedula || '').replace(/\D/g, '') || '—'} <button className="vx-copy" onClick={() => copy(String(d.cedula || '').replace(/\D/g, ''))}>copiar</button></dd>
                  <dt>Teléfono</dt><dd>{window.fmtTelV(d.whatsapp)} <button className="vx-copy" onClick={() => copy(d.whatsapp)}>copiar</button></dd>
                  <dt>Correo</dt><dd>{d.correo || '—'} <button className="vx-copy" onClick={() => copy(d.correo)}>copiar</button></dd>
                  <dt>WhatsApp</dt><dd>
                    <window.WaLink tel={d.whatsapp || d.telefono} className="vx-copy" >abrir chat</window.WaLink>
                    <button className="vx-copy" onClick={() => copy(d.whatsapp || d.telefono)}>copiar</button>
                  </dd>
                  <dt>Provincia</dt><dd>{d.provincia || '—'}{d.canton ? `, ${d.canton}` : ''}</dd>
                  <dt>Dirección</dt><dd>{d.direccion || '—'}</dd>
                  <dt>Nacimiento</dt><dd>{window.fmtFechaCorta(d.fecha_nac)}</dd>
                  <dt>Sexo</dt><dd>{d.sexo === 'F' ? 'Femenino' : d.sexo === 'M' ? 'Masculino' : '—'}</dd>
                </dl>
                {d.es_menor && d.tutor ? (
                  <div className="vx-tutor">
                    <div className="vx-tutor-h"><window.Vico d={window.VI.shield} size={13} /> Encargado legal (menor de edad)</div>
                    <dl className="vx-kv">
                      <dt>Nombre</dt><dd>{d.tutor.nombre}</dd>
                      <dt>Cédula</dt><dd>{d.tutor.cedula}</dd>
                      <dt>Correo</dt><dd>{d.tutor.correo}</dd>
                      <dt>Teléfono</dt><dd>{window.fmtTelV(d.tutor.tel)} <window.WaLink tel={d.tutor.tel} className="vx-copy">WhatsApp</window.WaLink></dd>
                    </dl>
                  </div>
                ) : null}
              </section>

              {/* 3 · PROGRAMA Y FINANCIAMIENTO */}
              <section className="vx-block">
                <div className="vx-block-h"><window.Vico d={window.VI.doc} size={13} /> Programa y financiamiento</div>
                <dl className="vx-kv">
                  <dt>Programa</dt><dd>{window.progLabel(d.programa)}</dd>
                  <dt>Grupo tentativo</dt><dd style={{ fontFamily: 'var(--f-mono, monospace)' }}>{d.grupo_tentativo || '—'}</dd>
                  <dt>Financiamiento</dt><dd><window.FinBadge financiamiento={d.financiamiento} /></dd>
                  {d.conape ? (
                    <React.Fragment>
                      <dt>Equipo CONAPE</dt><dd>{d.conape.equipo === 'NINGUNO' ? 'No solicita' : d.conape.equipo}</dd>
                      <dt>Prueba TOEIC</dt><dd>{d.conape.toeic ? 'Sí, incluida' : 'No'}</dd>
                      <dt>Sostenimiento</dt><dd>{d.conape.sostenimiento || 'No'}</dd>
                    </React.Fragment>
                  ) : null}
                </dl>
              </section>

              {/* 4 · DOCUMENTOS */}
              <section className="vx-block">
                <div className="vx-block-h"><window.Vico d={window.VI.doc} size={13} /> Documentos</div>
                <window.DocsBlock detalle={d} onView={onView} onSubirManual={(key) => triggerUpload(key)} />
              </section>

              {/* 4b · PROFORMAS DEL PROSPECTO — formato tarjetas (PROFORMAS-VENDEDOR-001),
                  réplica visual de las tarjetas del admin (PFCard). */}
              {(() => {
                const esConape = d.financiamiento === 'CONAPE';
                const hayUrls = !!(d.proforma_url || d.proforma_equipo_url);
                const equipoRaw = String((d.conape && d.conape.equipo) || '').toUpperCase();
                const sinEquipo = !equipoRaw || equipoRaw === 'NINGUNO';
                const equipoLabel = sinEquipo ? 'Sin equipo CONAPE' : (d.conape.equipo);
                const canGenerate = esConape && d.etapa !== 'CANCELADO';
                const waMsgCurso = `Hola! Te envío la proforma del curso de inglés. Podés verla aquí: ${d.proforma_url || ''}`;
                const waMsgEquipo = `Hola! Te envío la proforma del equipo (${equipoLabel}). Podés verla aquí: ${d.proforma_equipo_url || ''}`;

                // Si el prospecto no es CONAPE y no tiene proformas, no aplica: mensaje discreto.
                if (!esConape && !hayUrls) {
                  return (
                    <section className="vx-block">
                      <div className="vx-block-h"><window.Vico d={window.VI.doc} size={13} /> Proformas del prospecto</div>
                      <div style={{ fontSize: 12, color: 'var(--v-ink-3)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        Las proformas estarán disponibles cuando existan los datos necesarios del prospecto.
                      </div>
                    </section>
                  );
                }
                return (
                  <section className="vx-block">
                    <div className="vx-block-h"><window.Vico d={window.VI.doc} size={13} /> Proformas del prospecto</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                      <ProformaCardVx
                        iconPath={window.VI.doc} title="Proforma del Curso"
                        subtitle={`Programa de inglés (${window.progLabel(d.programa)})`}
                        url={d.proforma_url} waNum={waNum} waMsg={waMsgCurso}
                        regenerating={loadingProforma === 'curso'} canGenerate={canGenerate && !loadingProforma}
                        onRegen={() => generarProforma('curso')} onToast={onToast} />
                      <ProformaCardVx
                        iconPath={ICON_LAPTOP} title="Proforma del Equipo"
                        subtitle={equipoLabel}
                        disabled={sinEquipo} disabledMsg="Este prospecto no eligió equipo CONAPE."
                        url={d.proforma_equipo_url} waNum={waNum} waMsg={waMsgEquipo}
                        regenerating={loadingProforma === 'equipo'} canGenerate={canGenerate && !loadingProforma}
                        onRegen={() => generarProforma('equipo')} onToast={onToast} />
                    </div>
                  </section>
                );
              })()}

              {/* 4c · BECA SOLICITADA (solo PROPIO + beca con valor) */}
              {d.financiamiento === 'PROPIO' && d.beca ? (
                <section className="vx-block">
                  <div className="vx-block-h"><window.Vico d={window.VI.doc} size={13} /> Beca solicitada</div>
                  <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong>{d.beca}</strong>
                    <span style={{ color: 'var(--v-ink-3)' }}>Estado:</span>
                    <span className={`vx-badge vx-beca-${d.beca_estado === 'APROBADA' ? 'green' : d.beca_estado === 'RECHAZADA' ? 'red' : 'amber'}`}>
                      {d.beca_estado || 'SOLICITADA'}
                    </span>
                  </div>
                  {esSuperadmin && (!d.beca_estado || d.beca_estado === 'SOLICITADA') ? (
                    <div className="vx-btn-row" style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <button className="vx-btn vx-btn-success" onClick={() => decidirBeca('APROBADA')}>Aprobar</button>
                      <button className="vx-btn vx-btn-danger-ghost" onClick={() => decidirBeca('RECHAZADA')}>Rechazar (libera cupo)</button>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {/* 5 · NOTAS */}
              <section className="vx-block">
                <div className="vx-block-h"><window.Vico d={window.VI.doc} size={13} /> Notas</div>
                {(d.notas && d.notas.length) ? d.notas.map((n, i) => (
                  <div key={i} className="vx-nota">
                    <div className="vx-nota-meta"><b>{n.autor}</b><span>{window.fmtFechaCorta(n.fecha)}</span></div>
                    <div className="vx-nota-txt">{n.texto}</div>
                  </div>
                )) : <div style={{ fontSize: 12.5, color: 'var(--v-ink-3)', fontStyle: 'italic' }}>Sin notas todavía.</div>}
                <div className="vx-nota-add">
                  <textarea placeholder="Escribí una nota…" value={nota} onChange={e => setNota(e.target.value)} />
                  <button className="vx-btn vx-btn-navy" style={{ alignSelf: 'flex-start' }} onClick={addNota} disabled={savingNota || !nota.trim()}>
                    {savingNota ? <><span className="vx-spin" /> Guardando…</> : 'Agregar nota'}
                  </button>
                </div>
              </section>

              {/* 6 · DOCUMENTOS EXTRA */}
              <section className="vx-block">
                <div className="vx-block-h"><window.Vico d={window.VI.doc} size={13} /> Documentos adicionales</div>
                {(d.docs_extra && d.docs_extra.length) ? d.docs_extra.map((doc, i) => (
                  <div key={i} className="vx-docrow">
                    <span className="vx-docrow-ic">{(doc.mime_type || '').includes('pdf') ? 'PDF' : 'IMG'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.nombre_archivo}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--v-ink-3)' }}>{window.fmtFechaCorta(doc.fecha)}</div>
                    </div>
                    {doc.url && doc.url !== '#' ? <a className="vx-copy" href={doc.url} target="_blank" rel="noopener">ver</a> : null}
                  </div>
                )) : <div style={{ fontSize: 12.5, color: 'var(--v-ink-3)', fontStyle: 'italic', marginBottom: 4 }}>Sin documentos adicionales.</div>}
                <button className="vx-mini-btn" style={{ width: 'auto', marginTop: 8, padding: '7px 14px' }} onClick={() => triggerUpload(null)}>
                  <window.Vico d={window.VI.upload} size={12} /> Subir documento
                </button>
              </section>

              {/* 7 · EVENTOS CONAPE */}
              {(d.financiamiento === 'CONAPE') ? (
                <section className="vx-block">
                  <div className="vx-block-h"><window.Vico d={window.VI.doc} size={13} /> Eventos CONAPE</div>
                  <window.ConapeTimeline eventos={d.conape_eventos} />
                </section>
              ) : null}
            </div>

            {/* 8 · FOOTER ACCIONES (Fase 3.5) ── Llamar · Nota · Reportar pago */}
            <div className="vx-dr-foot">
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="vx-btn vx-btn-ghost" style={{ flex: 1 }}
                  onClick={llamarWhatsApp} disabled={!waNum}
                  title={waNum ? 'Abrir WhatsApp' : 'Sin número registrado'}>
                  <window.Vico d={window.VI.wa} size={15} fill="currentColor" /> Llamar
                </button>
                <button className="vx-btn vx-btn-ghost" style={{ flex: 1.25 }}
                  onClick={llamarWhatsApp} disabled={!waNum}
                  title={waNum ? 'Abrir WhatsApp' : 'Sin número registrado'}>
                  <window.Vico d={window.VI.wa} size={16} fill="currentColor" /> Abrir WhatsApp
                </button>
              </div>
              <button className="vx-btn vx-btn-red vx-btn-block vx-btn-lg" onClick={() => setModal('reportar')}>
                <window.Vico d={window.VI.upload} size={15} /> Reportar pago
              </button>

              {/* PROFORMAS-VENDEDOR-001: el botón de generar proforma se movió a las
                  tarjetas "Proformas del prospecto" (Descargar / WhatsApp / Regenerar). */}
              {d.etapa === 'ACTIVO' ? (
                <div className="vx-activo-note">Estudiante activo{d.codigo ? <> — código <b>{d.codigo}</b></> : ''}.</div>
              ) : d.etapa === 'CANCELADO' ? (
                <div className="vx-activo-note">Este prospecto fue cancelado.</div>
              ) : (
                <button className="vx-btn vx-btn-danger-ghost vx-btn-block" onClick={() => setModal('cancelar')}>Cancelar prospecto</button>
              )}
            </div>
          </React.Fragment>
        )}
      </aside>

      <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={onFilePicked} />

      {modal === 'nota' && <NotaModal detalle={d} asesor={asesor} demo={demo}
        onClose={() => setModal(null)} onToast={onToast}
        onSaved={(nueva) => setDetalle(prev => ({ ...prev, notas: [nueva, ...(prev.notas || [])] }))} />}
      {modal === 'reportar' && <ReportarPagoModal detalle={d} usuario={usuario || { nombre: asesor }} demo={demo}
        onClose={() => setModal(null)} onToast={onToast} />}
      {modal === 'cobrar' && <CobrarModal detalle={d} asesor={asesor} demo={demo} onClose={() => setModal(null)} onSuccess={onActivado} onError={m => onToast({ tipo: 'err', msg: m })} />}
      {modal === 'activar' && <ActivarModal detalle={d} asesor={asesor} demo={demo} onClose={() => setModal(null)} onSuccess={onActivado} />}
      {modal === 'cancelar' && (
        <CancelarProspectoModal detalle={d} usuario={usuario || { nombre: asesor }}
          onClose={() => setModal(null)} onToast={onToast}
          onCancelado={() => {
            setDetalle(prev => ({ ...prev, etapa: 'CANCELADO' }));
            onChanged && onChanged({ cedula: d.cedula, etapa: 'CANCELADO' });
            setModal(null); onClose();
          }} />
      )}
      {modal && modal.tipo === 'success' && <SuccessModal result={modal.result} onClose={() => { setModal(null); }} onExpediente={irExpediente} />}
    </React.Fragment>
  ), document.body);
}

function DrawerSkeleton({ onClose }) {
  return (
    <React.Fragment>
      <div className="vx-dr-head">
        <button className="vx-dr-close" onClick={onClose}><window.Vico d={window.VI.close} size={18} /></button>
        <div className="vx-sk" style={{ height: 12, width: 80, borderRadius: 6, background: 'rgba(255,255,255,.25)' }} />
        <div className="vx-sk" style={{ height: 22, width: '70%', borderRadius: 6, marginTop: 10, background: 'rgba(255,255,255,.25)' }} />
        <div className="vx-sk" style={{ height: 12, width: 120, borderRadius: 6, marginTop: 8, background: 'rgba(255,255,255,.25)' }} />
      </div>
      <div className="vx-dr-body">
        {[0,1,2].map(i => (
          <div key={i} className="vx-block">
            <div className="vx-sk" style={{ height: 12, width: 140, marginBottom: 14 }} />
            <div className="vx-sk" style={{ height: 14, width: '90%', marginBottom: 8 }} />
            <div className="vx-sk" style={{ height: 14, width: '75%', marginBottom: 8 }} />
            <div className="vx-sk" style={{ height: 14, width: '82%' }} />
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { ProspectoDrawer, DocsEstudianteVentas });
