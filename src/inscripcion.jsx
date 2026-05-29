/* global React, ReactDOM */
/* ============================================================================
   Inscripción pública — Academia Norteamericana · Campus Virtual
   Flujo de 2 páginas. Sin login. Accesible desde "Registrarse" en login.html.
   ============================================================================ */
const { useState, useEffect, useRef, useCallback } = React;

// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL = window.APPS_SCRIPT_URL;

// Imágenes de programa (Google Drive). Si fallan → degradado de respaldo.
const IMG_INA   = 'https://drive.google.com/uc?export=view&id=1MFNnwetDSIxTmCJALDO30-QqMMToCEgH';
const IMG_LIBRE = 'https://drive.google.com/uc?export=view&id=1ZoRy2blF7yP__GRdl6W_FVtgNytUtYhF';

const WA_NUMBER = '50688881234';

const PROVINCIAS = ['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];
const ASESORES   = ['Fiorela Salazar','Roger Cruz','Gustavo Valladares','Leonardo Salazar','Kimberly Guzmán'];
const COMO_OPTS  = ['Google / Internet','Facebook o Instagram','Recomendación de un amigo o familiar','Otro'];

const ID_TIPOS = [
  { id:'nac',     label:'Cédula nacional',      campo:'Número de cédula' },
  { id:'dimex',   label:'DIMEX',                campo:'Número de DIMEX' },
  { id:'resid',   label:'Carnet de residencia', campo:'Número de carnet de residencia' },
  { id:'refug',   label:'Carnet de refugiado',  campo:'Número de carnet de refugiado' },
];

// ── ICONOS ──────────────────────────────────────────────────────────────────
const I = {
  cloud:  'M16 16l-4-4-4 4M12 12v9M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3',
  close:  'M18 6L6 18M6 6l12 12',
  check:  'M20 6L9 17l-5-5',
  back:   'M19 12H5M12 19l-7-7 7-7',
  arrow:  'M5 12h14M13 5l7 7-7 7',
  eye:    'M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.06-5.94M9.9 4.24A10 10 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19M1 1l22 22M14.12 14.12a3 3 0 1 1-4.24-4.24',
  warn:   'M12 9v4M12 17h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z',
  alert:  'M12 8v4M12 16h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  help:   'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  wa:     'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
};
const Ico = ({ d, size=20, className }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d.split('|').map((p,i) => <path key={i} d={p} />)}
  </svg>
);
const IcoFill = ({ d, size=20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>
);

// ── VALIDADORES / FORMATO ─────────────────────────────────────────────────────
const fmtCedula = v => {
  const d = v.replace(/\D/g,'').slice(0,9);
  if (d.length <= 1) return d;
  if (d.length <= 5) return `${d[0]}-${d.slice(1)}`;
  return `${d[0]}-${d.slice(1,5)}-${d.slice(5)}`;
};
const fmtTel = v => { const d = v.replace(/\D/g,'').slice(0,8); return d.length > 4 ? `${d.slice(0,4)}-${d.slice(4)}` : d; };
const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v||'').trim());
const validTel   = v => /^\d{4}-\d{4}$/.test(v||'');
const esMayor = fn => {
  if (!fn) return true;
  const hoy = new Date(), nac = new Date(fn);
  let e = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m===0 && hoy.getDate() < nac.getDate())) e--;
  return e >= 18;
};
const fmtBytes = b => b < 1024*1024 ? `${(b/1024).toFixed(0)} KB` : `${(b/(1024*1024)).toFixed(1)} MB`;
const MAX_FILE = 5 * 1024 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: campo con label + error + nota
// ─────────────────────────────────────────────────────────────────────────────
function Field({ fieldKey, label, optional, children, note, noteType, error }) {
  return (
    <div className="field" id={fieldKey ? `fld-${fieldKey}` : undefined}>
      {label && <div className="field-label">{label}{optional && <span className="opt">Opcional</span>}</div>}
      {children}
      {error && <div className="field-error"><Ico d={I.alert} size={13} /> {error}</div>}
      {note && !error && <div className={`field-note ${noteType||''}`}>{note}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD ZONE
// ─────────────────────────────────────────────────────────────────────────────
function UploadZone({ docLabel, file, onFile, onClear, error }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const f = files && files[0];
    if (!f) return;
    if (f.size > MAX_FILE) { onFile(null, 'El archivo supera los 5 MB.'); return; }
    const ok = f.type.startsWith('image/') || f.type === 'application/pdf';
    if (!ok) { onFile(null, 'Formato no válido. Usá JPG, PNG o PDF.'); return; }
    const isImg = f.type.startsWith('image/');
    onFile({ file: f, name: f.name, size: f.size, isImg, url: isImg ? URL.createObjectURL(f) : null }, null);
  };

  if (file) {
    return (
      <div>
        <div className="fp-doclabel">{docLabel}</div>
        <div className="file-preview">
          {file.isImg
            ? <img className="fp-thumb" src={file.url} alt="" />
            : <div className="fp-pdf">PDF</div>}
          <div className="fp-info">
            <div className="fp-name">{file.name}</div>
            <div className="fp-size">{fmtBytes(file.size)}</div>
          </div>
          <button type="button" className="fp-remove" onClick={onClear} aria-label="Quitar archivo">
            <Ico d={I.close} size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`upload-zone${drag?' drag':''}${error?' err':''}`}
      onClick={() => inputRef.current && inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
    >
      <div className="uz-doclabel">{docLabel}</div>
      <div className="uz-icon"><Ico d={I.cloud} size={30} /></div>
      <div className="uz-main">Hacer clic o arrastrar archivo aquí</div>
      <div className="uz-hint">JPG, PNG o PDF — máx. 5 MB</div>
      <input ref={inputRef} type="file" accept="image/*,application/pdf"
        onChange={e => handleFiles(e.target.files)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS
// ─────────────────────────────────────────────────────────────────────────────
function Progress({ paso }) {
  return (
    <div className="prog-wrap">
      <div className="prog-inner">
        <div className="prog-top">
          <span className="prog-label">Paso {paso} de 2</span>
          <span className="prog-sub">{paso===1 ? 'Datos personales' : 'Programa y matrícula'}</span>
        </div>
        <div className="prog-track"><div className="prog-fill" style={{ width: paso===1 ? '50%' : '100%' }} /></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA 1 — DATOS PERSONALES
// ─────────────────────────────────────────────────────────────────────────────
function Pagina1({ form, set, files, setFile, errors, onContinue }) {
  const [verif, setVerif] = useState('idle'); // idle | loading | exists | free
  const tipo = ID_TIPOS.find(t => t.id === form.idTipo) || ID_TIPOS[0];
  const esNacional = form.idTipo === 'nac';

  const blurCedula = () => { if (esNacional) set('cedula', fmtCedula(form.cedula)); };
  const blurNombre = () => set('nombre', (form.nombre||'').toUpperCase());

  const verificar = async () => {
    if (!form.cedula.trim()) return;
    setVerif('loading');
    try {
      const res = await fetch(`${SCRIPT_URL}?fn=verificarCedulaExiste&cedula=${encodeURIComponent(form.cedula.trim())}`);
      const data = await res.json();
      setVerif(data && data.existe ? 'exists' : 'free');
    } catch (e) {
      setVerif('free'); // ante error → continuar normalmente
    }
  };

  return (
    <div className="ins-body">
      {/* IDENTIFICACIÓN */}
      <div className="card">
        <div className="sec-head">
          <div className="sec-eyebrow">Identificación</div>
          <div className="sec-title">¿Con qué documento te identificás?</div>
        </div>

        <Field fieldKey="idTipo">
          <div className="idtype-grid">
            {ID_TIPOS.map(t => (
              <label key={t.id} className={`idtype-card${form.idTipo===t.id?' sel':''}`}>
                <input type="radio" name="idTipo" checked={form.idTipo===t.id}
                  onChange={() => { set('idTipo', t.id); set('cedula',''); setVerif('idle'); }} />
                {t.label}
              </label>
            ))}
          </div>
          {!esNacional && (
            <div className="inline-alert warn">
              <Ico d={I.warn} size={18} />
              <span>Con este tipo de identificación solo podés inscribirte en el <strong>Programa Libre</strong>.</span>
            </div>
          )}
        </Field>

        <Field fieldKey="cedula" label={tipo.campo} error={errors.cedula}
          note={esNacional && verif!=='exists' ? 'Este número será tu usuario en el Campus Virtual.' : null}>
          <div className="inline-grp">
            <input type="text" value={form.cedula}
              className={errors.cedula ? 'err' : ''}
              onChange={e => { set('cedula', esNacional ? fmtCedula(e.target.value) : e.target.value); setVerif('idle'); }}
              onBlur={blurCedula}
              placeholder={esNacional ? '1-2345-6789' : 'Número de documento'}
              style={{ fontFamily:'ui-monospace, monospace', letterSpacing:'.03em' }} />
            <button type="button" className="verify-btn" onClick={verificar}
              disabled={verif==='loading' || !form.cedula.trim()}>
              {verif==='loading' ? <span className="spinner" style={{width:14,height:14}} /> : 'Verificar'}
            </button>
          </div>
          {verif==='exists' && (
            <div className="inline-alert err">
              <Ico d={I.alert} size={18} />
              <span>Ya tenés una cuenta con este número. <a href="recovery.html">¿Olvidaste tu contraseña?</a></span>
            </div>
          )}
          {verif==='free' && form.cedula.trim() && (
            <div className="inline-alert info">
              <Ico d={I.check} size={18} />
              <span>Documento disponible — podés continuar con tu inscripción.</span>
            </div>
          )}
        </Field>
      </div>

      {/* NOMBRE */}
      <div className="card">
        <div className="sec-head">
          <div className="sec-eyebrow">Tu nombre</div>
          <div className="sec-title">Nombre completo</div>
        </div>
        <Field fieldKey="nombre"
          label="Nombre completo (como aparece en tu identificación)"
          error={errors.nombre}
          note="Usá el nombre exacto de tu documento de identidad.">
          <input type="text" value={form.nombre} className={errors.nombre?'err':''}
            onChange={e => set('nombre', e.target.value)} onBlur={blurNombre}
            placeholder="APELLIDO APELLIDO NOMBRE" />
        </Field>
      </div>

      {/* DOCUMENTOS */}
      <div className="card">
        <div className="sec-head">
          <div className="sec-eyebrow">Documentos requeridos</div>
          <div className="sec-title">Subí tus documentos</div>
          <div className="sec-desc">Necesitamos tres archivos para validar tu inscripción.</div>
        </div>
        <div className="upload-stack">
          {[
            ['frente', 'Cédula / ID — frente'],
            ['reverso','Cédula / ID — reverso'],
            ['titulo', 'Título académico (primaria o superior)'],
          ].map(([key, lbl]) => (
            <div key={key} id={`fld-doc_${key}`}>
              <UploadZone docLabel={lbl} file={files[key]} error={errors[`doc_${key}`]}
                onFile={(f, err) => setFile(key, f, err)}
                onClear={() => setFile(key, null)} />
              {errors[`doc_${key}`] && <div className="field-error" style={{marginTop:5}}><Ico d={I.alert} size={13} /> {errors[`doc_${key}`]}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* DATOS PERSONALES */}
      <div className="card">
        <div className="sec-head">
          <div className="sec-eyebrow">Datos personales</div>
          <div className="sec-title">Contanos sobre vos</div>
        </div>

        <div className="grid-2">
          <Field fieldKey="fechaNac" label="Fecha de nacimiento" error={errors.fechaNac}>
            <input type="date" value={form.fechaNac} className={errors.fechaNac?'err':''}
              onChange={e => set('fechaNac', e.target.value)} />
          </Field>
          <Field fieldKey="sexo" label="Sexo" error={errors.sexo}>
            <div className="choice-row">
              {[['F','Femenino'],['M','Masculino']].map(([v,l]) => (
                <label key={v} className={`choice-card${form.sexo===v?' sel':''}`} style={{padding:'10px 13px'}}>
                  <input type="radio" name="sexo" checked={form.sexo===v} onChange={() => set('sexo', v)} />
                  <span className="choice-txt">{l}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div className="grid-2">
          <Field fieldKey="provincia" label="Provincia" error={errors.provincia}>
            <select value={form.provincia} className={errors.provincia?'err':''}
              onChange={e => set('provincia', e.target.value)}>
              <option value="">Seleccioná tu provincia…</option>
              {PROVINCIAS.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field fieldKey="canton" label="Cantón" error={errors.canton}>
            <input type="text" value={form.canton} className={errors.canton?'err':''}
              onChange={e => set('canton', e.target.value)} placeholder="Ej: Central, Escazú…" />
          </Field>
        </div>

        <Field fieldKey="direccion" label="Dirección detallada" error={errors.direccion}>
          <textarea rows="2" value={form.direccion} className={errors.direccion?'err':''}
            onChange={e => set('direccion', e.target.value)}
            placeholder="Barrio, señas, puntos de referencia…" />
        </Field>
      </div>

      {/* CONTACTO */}
      <div className="card">
        <div className="sec-head">
          <div className="sec-eyebrow">Contacto</div>
          <div className="sec-title">¿Cómo te ubicamos?</div>
        </div>

        <Field fieldKey="telefono" label="Teléfono celular" error={errors.telefono}>
          <div className={`prefix-grp${errors.telefono?' err':''}`}>
            <span className="pfx">+506</span>
            <input type="tel" value={form.telefono} onChange={e => set('telefono', fmtTel(e.target.value))} placeholder="8888-8888" />
          </div>
        </Field>

        <label className="check-row" style={{ marginBottom: form.waMismo ? 4 : 14 }}>
          <input type="checkbox" checked={form.waMismo} onChange={e => set('waMismo', e.target.checked)} />
          <span className="cr-main">WhatsApp es el mismo número</span>
        </label>

        {!form.waMismo && (
          <Field fieldKey="whatsapp" label="Número de WhatsApp" error={errors.whatsapp}>
            <div className={`prefix-grp${errors.whatsapp?' err':''}`}>
              <span className="pfx">+506</span>
              <input type="tel" value={form.whatsapp} onChange={e => set('whatsapp', fmtTel(e.target.value))} placeholder="8888-8888" />
            </div>
          </Field>
        )}

        <div className="grid-2">
          <Field fieldKey="correo" label="Correo electrónico" error={errors.correo}>
            <input type="email" value={form.correo} className={errors.correo?'err':''}
              onChange={e => set('correo', e.target.value)} placeholder="tucorreo@ejemplo.com" />
          </Field>
          <Field fieldKey="correoConf" label="Confirmar correo" error={errors.correoConf}
            note={form.correoConf && form.correo===form.correoConf && validEmail(form.correo) ? '✓ Los correos coinciden' : null}
            noteType="info">
            <input type="email" value={form.correoConf} className={errors.correoConf?'err':''}
              onChange={e => set('correoConf', e.target.value)} placeholder="Repetí tu correo" />
          </Field>
        </div>
      </div>

      {/* CÓMO NOS CONOCISTE */}
      <div className="card">
        <div className="sec-head">
          <div className="sec-eyebrow">¿Cómo nos conociste?</div>
          <div className="sec-title">Un par de preguntas más</div>
        </div>

        <Field fieldKey="como" label="¿Cómo te enteraste de la academia?" error={errors.como}>
          <select value={form.como} className={errors.como?'err':''} onChange={e => set('como', e.target.value)}>
            <option value="">Seleccioná una opción…</option>
            {COMO_OPTS.map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>

        <Field label="Asesor de referencia" optional>
          <select value={form.asesor} onChange={e => set('asesor', e.target.value)}>
            <option value="">— Ninguno —</option>
            {ASESORES.map(a => <option key={a}>{a}</option>)}
          </select>
        </Field>
      </div>

      {/* CONOCIMIENTOS PREVIOS */}
      <div className="card">
        <div className="sec-head">
          <div className="sec-eyebrow">Nivel de inglés</div>
          <div className="sec-title">¿Tenés conocimientos previos de inglés?</div>
        </div>
        <Field>
          <div className="choice-row col">
            {[
              ['cero',  '🔰', 'No, empiezo desde cero'],
              ['basico','📖', 'Algo básico'],
              ['exp',   '🎓', 'Sí, tengo experiencia'],
            ].map(([v, ico, lbl]) => (
              <label key={v} className={`choice-card${form.conocimientos===v?' sel':''}`}>
                <input type="radio" name="conoc" checked={form.conocimientos===v} onChange={() => set('conocimientos', v)} />
                <span className="choice-ico">{ico}</span>
                <span className="choice-txt">{lbl}</span>
              </label>
            ))}
          </div>
        </Field>
      </div>

      {/* CONTINUAR */}
      <div className="card continue-card">
        <button className="btn btn-primary" onClick={onContinue}>
          Continuar <Ico d={I.arrow} size={18} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TARJETA DE PROGRAMA
// ─────────────────────────────────────────────────────────────────────────────
function ProgramCard({ tipo, selected, locked, onSelect, img, fallbackBg, fallbackText, badge, badgeColor, name, bullets }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className={`pcard${selected?' sel':''}${locked?' locked':''}`}
      onClick={() => { if (!locked) onSelect(tipo); }}>
      <div className="pcard-imgwrap">
        <div className={`pcard-badge ${badgeColor}`}>{badge}</div>
        {!imgErr
          ? <img className="pcard-img" src={img} alt={name} onError={() => setImgErr(true)} />
          : <div className="pcard-imgfallback" style={{ background: fallbackBg }}>{fallbackText}</div>}
        {selected && !locked && <div className="pcard-check"><Ico d={I.check} size={18} /></div>}
      </div>
      <div className="pcard-body">
        <div className="pcard-name">{name}</div>
        <div className="pcard-bullets">
          {bullets.map((b,i) => (
            <div key={i} className="pcard-bullet"><Ico d={I.check} size={15} /><span>{b}</span></div>
          ))}
        </div>
      </div>
      {locked && (
        <div className="pcard-overlay">
          <div className="pcard-lockmsg">Solo disponible para cédula costarricense 🇨🇷</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA 2 — PROGRAMA
// ─────────────────────────────────────────────────────────────────────────────
function Pagina2({ form, set, errors, onBack, onSubmit, submitting }) {
  const esNacional = form.idTipo === 'nac';
  const [grupos, setGrupos] = useState(null);  // null=no cargado, []=vacío, [..]=lista
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  // Cargar grupos al elegir programa
  useEffect(() => {
    if (!form.programa) { setGrupos(null); return; }
    let cancel = false;
    setLoadingGrupos(true); setGrupos(null); set('grupo','');
    const param = form.programa === 'ina' ? 'INA' : 'SIN_INA';
    (async () => {
      try {
        const res = await fetch(`${SCRIPT_URL}?fn=getGruposDisponibles&programa=${param}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data && data.grupos) || [];
        if (!cancel) setGrupos(list);
      } catch (e) {
        if (!cancel) setGrupos([]);
      } finally {
        if (!cancel) setLoadingGrupos(false);
      }
    })();
    return () => { cancel = true; };
  }, [form.programa]);

  const grupoLabel = g => {
    const cod = g.codigo || g.cod || g.id || '';
    const parts = [g.nivel, g.dias || g.dia, g.hora || g.horario, g.docente || g.profesor].filter(Boolean);
    return `[${cod}]${parts.length ? ' – ' + parts.join(' · ') : ''}`;
  };
  const grupoVal = g => g.codigo || g.cod || g.id || '';

  return (
    <div className="ins-body">
      <div className="p2-head">
        <button className="back-btn" onClick={onBack}><Ico d={I.back} size={16} /> Volver</button>
        <div className="p2-title">Seleccioná tu programa</div>
        <div className="p2-sub">Elegí el programa que mejor se adapte a tus metas.</div>
      </div>

      <div id="fld-programa">
        <div className="prog-cards">
          <ProgramCard
            tipo="ina" selected={form.programa==='ina'} locked={!esNacional}
            onSelect={t => set('programa', t)}
            img={IMG_INA} fallbackBg="#1a237e" fallbackText="INA Acreditado"
            badge="Financiable con CONAPE" badgeColor="green"
            name="Programa INA Acreditado"
            bullets={['Certificado avalado por INA','Financiable con CONAPE','4 niveles · 128h por nivel']} />
          <ProgramCard
            tipo="sin_ina" selected={form.programa==='sin_ina'} locked={false}
            onSelect={t => set('programa', t)}
            img={IMG_LIBRE} fallbackBg="#2B7FC1" fallbackText="Programa Libre"
            badge="Flexible y accesible" badgeColor="blue"
            name="Programa Libre"
            bullets={['Certificado propio de la academia','Disponible para todos los tipos de ID','4 niveles · 96h por nivel']} />
        </div>
        {errors.programa && <div className="field-error" style={{marginTop:10}}><Ico d={I.alert} size={13} /> {errors.programa}</div>}
      </div>

      {/* SELECTOR DE GRUPO + CONAPE + CONTRASEÑA */}
      {form.programa && (
        <div className="reveal">
          {/* GRUPO */}
          <div className="card" style={{ marginTop:16 }}>
            <div className="sec-head">
              <div className="sec-eyebrow">Horario</div>
              <div className="sec-title">Elegí tu grupo</div>
            </div>
            <div id="fld-grupo">
              <Field error={errors.grupo}>
                {loadingGrupos ? (
                  <div className="grupo-loading"><span className="spinner" /> Buscando grupos disponibles…</div>
                ) : grupos && grupos.length > 0 ? (
                  <select value={form.grupo} className={errors.grupo?'err':''} onChange={e => set('grupo', e.target.value)}>
                    <option value="">Seleccioná un grupo…</option>
                    {grupos.map((g,i) => <option key={i} value={grupoVal(g)}>{grupoLabel(g)}</option>)}
                  </select>
                ) : (
                  <div className="grupo-empty">
                    <Ico d={I.warn} size={18} />
                    <span>No hay grupos disponibles en este momento. <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener">Escribinos por WhatsApp.</a></span>
                  </div>
                )}
              </Field>
            </div>
          </div>

          {/* CONAPE (solo INA) */}
          {form.programa === 'ina' && (
            <div className="card">
              <div className="conape-box">
                <div className="conape-title"><Ico d={I.shield} size={18} /> Financiamiento CONAPE</div>
                <div className="conape-q">¿Aplicás a financiamiento CONAPE?</div>
                <div className="choice-row">
                  {[['si','Sí'],['no','No']].map(([v,l]) => (
                    <label key={v} className={`choice-card${form.conape===v?' sel':''}`} style={{flex:'0 0 auto', minWidth:90, justifyContent:'center'}}>
                      <input type="radio" name="conape" checked={form.conape===v} onChange={() => set('conape', v)} />
                      <span className="choice-txt">{l}</span>
                    </label>
                  ))}
                </div>

                {form.conape === 'si' && (
                  <div className="reveal" style={{ marginTop:14 }}>
                    <div className="conape-checks">
                      <label className="check-row">
                        <input type="checkbox" checked={form.conapeToeic} onChange={e => set('conapeToeic', e.target.checked)} />
                        <span>
                          <span className="cr-main">Incluir examen TOEIC</span>
                          <span className="cr-note">Incluido en el financiamiento.</span>
                        </span>
                      </label>

                      <div>
                        <label className="check-row">
                          <input type="checkbox" checked={form.conapeLaptop} onChange={e => { set('conapeLaptop', e.target.checked); if(!e.target.checked) set('conapeLaptopMonto',''); }} />
                          <span><span className="cr-main">Incluir laptop</span></span>
                        </label>
                        {form.conapeLaptop && (
                          <div className="conape-monto reveal">
                            <input type="number" min="0" value={form.conapeLaptopMonto}
                              onChange={e => set('conapeLaptopMonto', e.target.value)} placeholder="₡ 0" />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="check-row">
                          <input type="checkbox" checked={form.conapeSost} onChange={e => { set('conapeSost', e.target.checked); if(!e.target.checked) set('conapeSostMonto',''); }} />
                          <span><span className="cr-main">Incluir sostenimiento mensual</span></span>
                        </label>
                        {form.conapeSost && (
                          <div className="conape-monto reveal">
                            <input type="number" min="0" value={form.conapeSostMonto}
                              onChange={e => set('conapeSostMonto', e.target.value)} placeholder="₡ 0 / mes" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CONTRASEÑA */}
          <div className="card">
            <div className="sec-head">
              <div className="sec-eyebrow">Acceso al Campus</div>
              <div className="sec-title">Creá tu contraseña</div>
            </div>
            <div className="grid-2">
              <Field fieldKey="clave" label="Contraseña" error={errors.clave}
                note={`Tu usuario será: ${form.cedula || '—'}`}>
                <div className="pwd-grp">
                  <input type={showPwd?'text':'password'} value={form.clave} className={errors.clave?'err':''}
                    onChange={e => set('clave', e.target.value)} placeholder="Mínimo 6 caracteres" />
                  <button type="button" className="pwd-toggle" onClick={() => setShowPwd(s=>!s)} aria-label="Mostrar contraseña">
                    <Ico d={showPwd?I.eyeOff:I.eye} size={19} />
                  </button>
                </div>
              </Field>
              <Field fieldKey="claveConf" label="Confirmar contraseña" error={errors.claveConf}>
                <div className="pwd-grp">
                  <input type={showPwd2?'text':'password'} value={form.claveConf} className={errors.claveConf?'err':''}
                    onChange={e => set('claveConf', e.target.value)} placeholder="Repetí tu contraseña" />
                  <button type="button" className="pwd-toggle" onClick={() => setShowPwd2(s=>!s)} aria-label="Mostrar contraseña">
                    <Ico d={showPwd2?I.eyeOff:I.eye} size={19} />
                  </button>
                </div>
              </Field>
            </div>
          </div>

          {/* REGISTRARME */}
          <div className="card continue-card">
            <button className="btn btn-success" onClick={onSubmit} disabled={submitting}>
              {submitting ? <><span className="btn-loader" /> Registrando…</> : <>Registrarme <Ico d={I.check} size={18} /></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA DE ÉXITO
// ─────────────────────────────────────────────────────────────────────────────
function Exito({ conape }) {
  return (
    <div className="success-wrap">
      <div className="success-card">
        <div className="success-ico"><Ico d={I.check} size={56} /></div>
        <div className="success-h1">¡Te registraste correctamente!</div>
        <div className="success-p">
          {conape
            ? 'Tu solicitud está siendo procesada. Pronto te contactaremos para los siguientes pasos.'
            : 'Para activar tu cuenta completá el pago de matrícula. Escribinos por WhatsApp para coordinar.'}
        </div>
        {!conape && (
          <a className="success-wa" href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola, acabo de registrarme y quiero coordinar el pago de matrícula.')}`} target="_blank" rel="noopener">
            <IcoFill d={I.wa} size={18} /> Coordinar pago por WhatsApp
          </a>
        )}
        <button className="btn btn-primary" onClick={() => { window.location.href = 'login.html'; }}>
          Ir al login
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────
const FORM_INIT = {
  idTipo:'nac', cedula:'', nombre:'',
  fechaNac:'', sexo:'', provincia:'', canton:'', direccion:'',
  telefono:'', waMismo:true, whatsapp:'', correo:'', correoConf:'',
  como:'', asesor:'', conocimientos:'',
  programa:'', grupo:'',
  conape:'no', conapeToeic:false, conapeLaptop:false, conapeLaptopMonto:'', conapeSost:false, conapeSostMonto:'',
  clave:'', claveConf:'',
};

function scrollToField(key) {
  const el = document.getElementById(`fld-${key}`);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 100;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

function App() {
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState(FORM_INIT);
  const [files, setFiles] = useState({ frente:null, reverso:null, titulo:null });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState('');

  const set = useCallback((k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => e[k] ? { ...e, [k]: undefined } : e);
  }, []);

  const setFile = useCallback((key, fileObj, err) => {
    setFiles(prev => ({ ...prev, [key]: fileObj }));
    if (err) setToast(err);
    setErrors(e => e[`doc_${key}`] ? { ...e, [`doc_${key}`]: undefined } : e);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Validación Página 1 ──
  const validarPaso1 = () => {
    const e = {};
    if (!form.cedula.trim()) e.cedula = 'Ingresá tu número de identificación.';
    if (!form.nombre.trim()) e.nombre = 'Ingresá tu nombre completo.';
    if (!files.frente)  e.doc_frente  = 'Subí el frente de tu documento.';
    if (!files.reverso) e.doc_reverso = 'Subí el reverso de tu documento.';
    if (!files.titulo)  e.doc_titulo  = 'Subí tu título académico.';
    if (!form.fechaNac) e.fechaNac = 'Indicá tu fecha de nacimiento.';
    if (!form.sexo)     e.sexo = 'Seleccioná una opción.';
    if (!form.provincia) e.provincia = 'Seleccioná tu provincia.';
    if (!form.canton.trim()) e.canton = 'Ingresá tu cantón.';
    if (!form.direccion.trim()) e.direccion = 'Ingresá tu dirección.';
    if (!validTel(form.telefono)) e.telefono = 'Ingresá un teléfono válido (8 dígitos).';
    if (!form.waMismo && !validTel(form.whatsapp)) e.whatsapp = 'Ingresá un WhatsApp válido.';
    if (!validEmail(form.correo)) e.correo = 'Ingresá un correo válido.';
    if (!form.correoConf.trim()) e.correoConf = 'Confirmá tu correo.';
    else if (form.correo.trim().toLowerCase() !== form.correoConf.trim().toLowerCase()) e.correoConf = 'Los correos no coinciden.';
    if (!form.como) e.como = 'Seleccioná una opción.';

    setErrors(e);
    if (Object.keys(e).length) {
      const order = ['cedula','nombre','doc_frente','doc_reverso','doc_titulo','fechaNac','sexo','provincia','canton','direccion','telefono','whatsapp','correo','correoConf','como'];
      const first = order.find(k => e[k]);
      if (first) setTimeout(() => scrollToField(first), 50);
      return false;
    }
    return true;
  };

  const irPaso2 = () => {
    if (!validarPaso1()) return;
    // Si la ID no es nacional, el único programa posible es Libre
    if (form.idTipo !== 'nac' && form.programa === 'ina') set('programa','');
    setPaso(2);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const volverPaso1 = () => { setPaso(1); window.scrollTo({ top: 0, behavior: 'auto' }); };

  // ── Validación + envío Página 2 ──
  const registrar = async () => {
    const e = {};
    if (!form.programa) e.programa = 'Seleccioná un programa.';
    if (!form.grupo) e.grupo = 'Seleccioná un grupo.';
    if (!form.clave || form.clave.length < 6) e.clave = 'Mínimo 6 caracteres.';
    if (!form.claveConf) e.claveConf = 'Confirmá tu contraseña.';
    else if (form.clave !== form.claveConf) e.claveConf = 'Las contraseñas no coinciden.';
    setErrors(e);
    if (Object.keys(e).length) {
      const order = ['programa','grupo','clave','claveConf'];
      const first = order.find(k => e[k]);
      if (first) setTimeout(() => scrollToField(first), 50);
      return;
    }

    const esConape = form.programa === 'ina' && form.conape === 'si';
    const payload = {
      fn: 'crearUsuarioEstudiante',
      cedula: form.cedula.trim(),
      nombre: form.nombre.trim(),
      correo: form.correo.trim(),
      whatsapp: form.waMismo ? form.telefono : form.whatsapp,
      clave: form.clave,
      provincia: form.provincia,
      canton: form.canton.trim(),
      direccion: form.direccion.trim(),
      fecha_nac: form.fechaNac,
      mayor_edad: esMayor(form.fechaNac),
      rep_nombre: '', rep_cedula: '', rep_correo: '', rep_tel: '',
      programa: form.programa === 'ina' ? 'INA' : 'SIN_INA',
      financiamiento: esConape ? 'CONAPE' : 'PROPIO',
      beca: '',
      modalidad: 'CUATRIMESTRE',
      grupo_tentativo: form.grupo,
      conape_toeic: esConape ? form.conapeToeic : false,
      conape_laptop: esConape && form.conapeLaptop ? (form.conapeLaptopMonto || '') : '',
      conape_sostenimiento: esConape ? form.conapeSost : false,
      conape_monto_sos: esConape && form.conapeSost ? (form.conapeSostMonto || '') : '',
      como_entero: form.como,
      asesor_ref: form.asesor,
      conocimientos_previos: form.conocimientos,
    };

    setSubmitting(true);
    try {
      // text/plain: evita el preflight CORS que rompe Apps Script (doPost lee
      // el JSON en e.postData.contents igual). Patrón usado en todo el campus.
      const res = await fetch(`${SCRIPT_URL}?fn=crearUsuarioEstudiante`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data && data.ok) {
        setDone(true);
        window.scrollTo({ top: 0, behavior: 'auto' });
      } else if (data && data.error === 'cedula_duplicada') {
        setPaso(1);
        setErrors({ cedula: 'Ya existe una cuenta con este número. Iniciá sesión o recuperá tu contraseña.' });
        setTimeout(() => scrollToField('cedula'), 80);
      } else {
        setToast('No pudimos completar tu registro. Intentá de nuevo en un momento.');
      }
    } catch (err) {
      setToast('No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <>
        <Header />
        <Exito conape={form.programa==='ina' && form.conape==='si'} />
      </>
    );
  }

  return (
    <>
      <Header />
      <Progress paso={paso} />
      {paso === 1
        ? <Pagina1 form={form} set={set} files={files} setFile={setFile} errors={errors} onContinue={irPaso2} />
        : <Pagina2 form={form} set={set} errors={errors} onBack={volverPaso1} onSubmit={registrar} submitting={submitting} />}
      <div className="ins-foot">© 2026 Academia Norteamericana · San José, Costa Rica</div>

      {toast && (
        <div className="toast" onClick={() => setToast('')}>
          <Ico d={I.alert} size={18} />
          <span>{toast}</span>
        </div>
      )}
    </>
  );
}

function Header() {
  return (
    <div className="ins-header">
      <div className="ins-logo" />
      <div>
        <div className="ins-brand-t1">Academia Norteamericana</div>
        <div className="ins-brand-t2">Campus Virtual · Inscripción</div>
      </div>
      <div className="ins-header-right">
        <a className="ins-help-link" href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener">
          <Ico d={I.help} size={15} /> Ayuda
        </a>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
