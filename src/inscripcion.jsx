/* global React, ReactDOM, window */
/* ============================================================================
   Inscripción pública — Academia Norteamericana · Campus Virtual
   Flujo de 2 páginas. Sin login. Accesible desde "Registrarse" en login.html.
   Componentes presentacionales y helpers: src/inscripcion_parts.jsx
   ============================================================================ */
const { useState, useEffect, useCallback } = React;

const SCRIPT_URL = window.APPS_SCRIPT_URL;

// Partes compartidas (cargadas desde inscripcion_parts.jsx)
const {
  WA_NUMBER, IMG_INA, IMG_LIBRE, IMG_BASICO, IMG_PREMIUM,
  PROVINCIAS, CR_GEO, ASESORES, COMO_OPTS, ID_TIPOS, DEMO_GRUPOS,
  G, fmtCedula, fmtTel, validEmail, validTel, calcEdad, esMayor,
  I, Ico, IcoFill,
  Field, UploadZone, Progress, ProgramCard, GrupoCard, GrupoSkeleton, FinCard, EquipoCard,
} = window;

// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA 1 — DATOS PERSONALES
// ─────────────────────────────────────────────────────────────────────────────
function Pagina1({ form, set, setMany, prellenado, setPrellenado, files, setFile, errors, onContinue, verif, setVerif, esProspecto, setProspecto, asesores }) {
  // 'verif' (idle | loading | exists | free) se eleva al App para que validarPaso1 lo lea
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const tipo = ID_TIPOS.find(t => t.id === form.idTipo) || ID_TIPOS[0];
  const esNacional = form.idTipo === 'nac';
  const edad = calcEdad(form.fechaNac);
  const menor = edad != null && edad < 18;
  const bloqueado = verif === 'exists'; // cédula ya registrada → se bloquea el resto del formulario

  const blurCedula = () => { if (esNacional) set('cedula', fmtCedula(form.cedula)); };
  const blurNombre = () => set('nombre', (form.nombre||'').toUpperCase());

  // Cascada geográfica (CR_GEO). Si el padrón TSE prellenó un cantón/distrito que
  // no está en el catálogo, lo anteponemos para que el select igual lo muestre.
  const cantonesDe = (prov) => {
    const c = (CR_GEO && CR_GEO[prov]) ? Object.keys(CR_GEO[prov]) : [];
    return (prov && form.canton && c.indexOf(form.canton) === -1) ? [form.canton, ...c] : c;
  };
  const distritosDe = (prov, cant) => {
    const d = (CR_GEO && CR_GEO[prov] && CR_GEO[prov][cant]) ? CR_GEO[prov][cant] : [];
    return (cant && form.distrito && d.indexOf(form.distrito) === -1) ? [form.distrito, ...d] : d;
  };

  // Verificar: 1) ¿ya existe la cuenta? → bloquear + redirigir al login.
  //            2) si no, buscar en padrón TSE y SIEMPRE refrescar el nombre.
  const verificar = async () => {
    if (!form.cedula.trim()) return;
    setVerif('loading');
    try {
      const r1 = await fetch(`${SCRIPT_URL}?fn=verificarCedulaExiste&cedula=${encodeURIComponent(form.cedula.trim())}`);
      const d1 = await r1.json();
      // Cambio 3 — respuesta v4.29.0+: { ok, existe, es_prospecto, estado }
      if (d1 && d1.existe) {
        setProspecto(Boolean(d1.es_prospecto));
        setVerif('exists');
        return;
      }
      setProspecto(false);

      // No existe → si es cédula nacional, buscar en padrón y SIEMPRE refrescar el
      // nombre (Cambio 4a): con el dato del TSE si lo hay, vacío y editable si no.
      if (esNacional) {
        let nombreTSE = '';
        try {
          const r2 = await fetch(`${SCRIPT_URL}?fn=buscarEnPadron&cedula=${encodeURIComponent(form.cedula.trim())}`);
          const d2 = await r2.json();
          if (d2 && (d2.nombre || d2.apellido1 || d2.provincia)) {
            // Nombre normalizado APELLIDO1 APELLIDO2 NOMBRE
            nombreTSE = (d2.apellido1 || d2.apellido2)
              ? [d2.apellido1, d2.apellido2, d2.nombre].filter(Boolean).join(' ')
              : (d2.nombre_completo || d2.nombre || '');
            nombreTSE = String(nombreTSE).toUpperCase().trim();
          }
          if (nombreTSE) {
            const upd = { nombre: nombreTSE };
            const lock = { nombre: true };
            if (d2.fecha_nac) { upd.fechaNac = d2.fecha_nac; lock.fechaNac = true; }
            if (d2.provincia) { upd.provincia = d2.provincia; lock.provincia = true; }
            if (d2.canton)    { upd.canton = d2.canton; lock.canton = true; }
            if (d2.sexo)      { upd.sexo = /^f/i.test(d2.sexo) ? 'F' : 'M'; lock.sexo = true; }
            setMany(upd);
            setPrellenado(p => ({ ...p, ...lock }));
          }
        } catch (_) { /* sin padrón / error TSE → input manual */ }

        // TSE no encontró (o falló): vaciar nombre y dejarlo editable a mano (Cambio 4a/4b).
        if (!nombreTSE) {
          set('nombre', '');
          setPrellenado(p => ({ ...p, nombre: false }));
        }
      }
      setVerif('free');
    } catch (e) {
      // Error en verificarCedulaExiste → continuar manual, nombre editable.
      setProspecto(false);
      if (esNacional) { set('nombre', ''); setPrellenado(p => ({ ...p, nombre: false })); }
      setVerif('free');
    }
  };

  return (
    <div className="ins-body">
      {/* IDENTIFICACIÓN */}
      <div className="card">
        <div className="sec-head">
          <div className="sec-eyebrow">Identificación</div>
          <div className="sec-title">Ingresá tu número de identificación</div>
        </div>

        <Field fieldKey="idTipo">
          <div className="idtype-grid">
            {ID_TIPOS.map(t => (
              <label key={t.id} className={`idtype-card${form.idTipo===t.id?' sel':''}`}>
                <input type="radio" name="idTipo" checked={form.idTipo===t.id}
                  onChange={() => {
                    set('idTipo', t.id); set('cedula',''); set('nombre',''); setVerif('idle'); setProspecto(false);
                    setPrellenado({}); // limpiar candados al cambiar tipo
                  }} />
                {t.label}
              </label>
            ))}
          </div>
          {!esNacional && (
            <div className="inline-alert warn">
              <Ico d={I.warn} size={18} />
              <span>Con este tipo de identificación solo podés inscribirte en el <strong>Programa SIN acreditación</strong>. No aplica financiamiento CONAPE (requisito gubernamental, no académico).</span>
            </div>
          )}
        </Field>

        <Field fieldKey="cedula" label={tipo.campo} error={errors.cedula}
          note={esNacional && verif!=='exists' ? 'Este número será tu usuario en el Campus Virtual.' : null}>
          <div className="inline-grp">
            <input type="text" value={form.cedula}
              className={errors.cedula ? 'err' : ''}
              onChange={e => {
                set('cedula', esNacional ? fmtCedula(e.target.value) : e.target.value);
                setVerif('idle');
                // Al cambiar la cédula, soltar el nombre prellenado por el TSE para no
                // arrastrar el dato viejo (Cambio 4): vacío y editable hasta re-verificar.
                if (prellenado.nombre) { set('nombre', ''); setPrellenado(p => ({ ...p, nombre: false })); }
              }}
              onBlur={blurCedula}
              placeholder={esNacional ? 'X-XXXX-XXXX' : 'Número de documento'}
              style={{ fontFamily:'ui-monospace, monospace', letterSpacing:'.03em' }} />
            <button type="button" className="verify-btn" onClick={verificar}
              disabled={verif==='loading' || !form.cedula.trim()}>
              {verif==='loading' ? <span className="spinner" style={{width:14,height:14}} /> : 'Verificar'}
            </button>
          </div>
          {verif==='free' && form.cedula.trim() && (
            <div className="inline-alert info">
              <Ico d={I.check} size={18} />
              <span>Documento disponible — podés continuar con tu inscripción.</span>
            </div>
          )}
        </Field>
      </div>

      {/* CUENTA YA EXISTENTE — bloquea el resto del formulario (Cambio 3) */}
      {bloqueado ? (
        <div className="card cuenta-existe">
          <div className="ce-ico"><Ico d={I.lock} size={26} /></div>
          <div className="ce-title">
            {esProspecto ? 'Ya tenés una inscripción en proceso' : 'Ya tenés una cuenta en la academia'}
          </div>
          <div className="ce-msg">
            {esProspecto
              ? 'Esta cédula ya tiene una inscripción en proceso. Comunicate con tu asesor para continuar.'
              : 'Esta cédula ya tiene una cuenta en la academia. Iniciá sesión con tu usuario y contraseña.'}
          </div>
          <div className="ce-actions">
            {esProspecto ? (
              <a className="btn btn-primary" href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener">
                <IcoFill d={I.wa} size={18} /> Contactar a mi asesor
              </a>
            ) : (
              <button className="btn btn-primary" onClick={() => { window.location.href = 'login.html'; }}>
                Ir al login <Ico d={I.arrow} size={18} />
              </button>
            )}
          </div>
          <div className="ce-hint">¿Es un error? Cambiá el número de identificación arriba y volvé a verificar.</div>
        </div>
      ) : (
      <React.Fragment>

      {/* NOMBRE */}
      <div className="card">
        <div className="sec-head">
          <div className="sec-eyebrow">Tu nombre</div>
          <div className="sec-title">Nombre completo</div>
        </div>
        <Field fieldKey="nombre" locked={prellenado.nombre}
          label="Nombre completo (como aparece en tu identificación)"
          error={errors.nombre}
          note={prellenado.nombre ? 'Usá el nombre exacto de tu documento de identidad.' : 'Si no se autocompletó, escribí tu nombre tal cual aparece en tu documento.'}>
          <input type="text" value={form.nombre} className={errors.nombre?'err':''}
            readOnly={Boolean(prellenado.nombre)}
            onChange={e => set('nombre', e.target.value)} onBlur={blurNombre}
            placeholder={prellenado.nombre ? 'APELLIDO APELLIDO NOMBRE' : 'Escribilo a mano'} />
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
          <div className="sec-title">Ingresá tu información</div>
        </div>

        <div className="grid-2">
          <Field fieldKey="fechaNac" label="Fecha de nacimiento" locked={prellenado.fechaNac} error={errors.fechaNac}
            note={edad != null ? `Edad: ${edad} años` : null} noteType="info">
            <input type="date" value={form.fechaNac} className={errors.fechaNac?'err':''}
              onChange={e => set('fechaNac', e.target.value)} />
          </Field>
          <Field fieldKey="sexo" label="Sexo" locked={prellenado.sexo} error={errors.sexo}>
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

        {/* Bloque tutor — solo si es menor de edad */}
        {menor && (
          <div className="tutor-box reveal">
            <div className="tutor-head">
              <Ico d={I.shield} size={17} />
              <span>Sos menor de edad. Necesitamos los datos de tu tutor o encargado legal.</span>
            </div>
            <Field fieldKey="tutorNombre" label="Nombre completo del encargado" error={errors.tutorNombre}>
              <input type="text" value={form.tutorNombre} className={errors.tutorNombre?'err':''}
                onChange={e => set('tutorNombre', e.target.value)} onBlur={() => set('tutorNombre',(form.tutorNombre||'').toUpperCase())}
                placeholder="APELLIDO APELLIDO NOMBRE" />
            </Field>
            <div className="grid-2">
              <Field fieldKey="tutorCedula" label="Cédula del encargado" error={errors.tutorCedula}>
                <input type="text" value={form.tutorCedula} className={errors.tutorCedula?'err':''}
                  onChange={e => set('tutorCedula', fmtCedula(e.target.value))} placeholder="X-XXXX-XXXX"
                  style={{ fontFamily:'ui-monospace, monospace', letterSpacing:'.03em' }} />
              </Field>
              <Field fieldKey="tutorTel" label="Teléfono del encargado" error={errors.tutorTel}>
                <div className={`prefix-grp${errors.tutorTel?' err':''}`}>
                  <span className="pfx">+506</span>
                  <input type="tel" value={form.tutorTel} onChange={e => set('tutorTel', fmtTel(e.target.value))} placeholder="8888-8888" />
                </div>
              </Field>
            </div>
            <Field fieldKey="tutorCorreo" label="Correo del encargado" error={errors.tutorCorreo}>
              <input type="email" value={form.tutorCorreo} className={errors.tutorCorreo?'err':''}
                onChange={e => set('tutorCorreo', e.target.value)} placeholder="correo@ejemplo.com" />
            </Field>
          </div>
        )}

        <div className="grid-2">
          <Field fieldKey="provincia" label="Provincia" locked={prellenado.provincia} error={errors.provincia}>
            <select value={form.provincia} className={errors.provincia?'err':''}
              onChange={e => setMany({ provincia: e.target.value, canton: '', distrito: '' })}>
              <option value="">Seleccioná tu provincia…</option>
              {PROVINCIAS.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field fieldKey="canton" label="Cantón" locked={prellenado.canton} error={errors.canton}>
            <select value={form.canton} className={errors.canton?'err':''} disabled={!form.provincia}
              onChange={e => setMany({ canton: e.target.value, distrito: '' })}>
              <option value="">{form.provincia ? 'Seleccioná tu cantón…' : 'Elegí provincia primero'}</option>
              {cantonesDe(form.provincia).map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <Field fieldKey="distrito" label="Distrito" error={errors.distrito}>
          <select value={form.distrito} className={errors.distrito?'err':''} disabled={!form.canton}
            onChange={e => set('distrito', e.target.value)}>
            <option value="">{form.canton ? 'Seleccioná tu distrito…' : 'Elegí cantón primero'}</option>
            {distritosDe(form.provincia, form.canton).map(d => <option key={d}>{d}</option>)}
          </select>
        </Field>

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

      {/* CONTRASEÑA */}
      <div className="card">
        <div className="sec-head">
          <div className="sec-eyebrow">Acceso al Campus</div>
          <div className="sec-title">Creá tu contraseña</div>
        </div>
        <div className="grid-2">
          <Field fieldKey="clave" label="Contraseña" error={errors.clave}>
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
        <div className="user-note">Tu usuario será: <strong>{form.cedula || '—'}</strong></div>
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
            {asesores.map(a => <option key={a.nombre} value={a.nombre}>{a.nombre}</option>)}
          </select>
        </Field>
      </div>

      {/* CONOCIMIENTOS PREVIOS */}
      <div className="card">
        <div className="sec-head">
          <div className="sec-eyebrow">Nivel de inglés</div>
          <div className="sec-title">¿Tenés conocimientos previos de inglés?</div>
        </div>
        <Field fieldKey="conocimientos" error={errors.conocimientos}>
          <div className="choice-row col">
            {[
              ['cero',  '🔰', 'No, empiezo desde cero'],
              ['diagnostico','📝', 'Sí, deseo aplicar prueba de diagnóstico'],
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
      </React.Fragment>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA 2 — PROGRAMA Y FINANCIAMIENTO
// ─────────────────────────────────────────────────────────────────────────────
function Pagina2({ form, set, errors, onBack, onSubmit, submitting, grupos, setGrupos }) {
  const esNacional = form.idTipo === 'nac';
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [becasDisp, setBecasDisp] = useState([]);

  // Grupos reales desde el backend (cupos, fechas legibles y modalidad).
  useEffect(() => {
    if (!form.programa) { setGrupos(null); return; }
    let cancel = false;
    setLoadingGrupos(true); setGrupos(null); set('grupo','');
    const programa = form.programa === 'ina' ? 'INA' : 'SIN_INA';
    fetch(`${SCRIPT_URL}?fn=getGruposDisponibles&programa=${programa}`)
      .then(r => r.json())
      .then(d => {
        if (cancel) return;
        setGrupos((d && d.ok && d.grupos) ? d.grupos : []);
        setLoadingGrupos(false);
      })
      .catch(() => {
        if (cancel) return;
        setGrupos([]);
        setLoadingGrupos(false);
      });
    return () => { cancel = true; };
  }, [form.programa]);

  // Becas disponibles (los % y cupos los define el backend, no se hardcodean).
  useEffect(() => {
    fetch(`${SCRIPT_URL}?fn=getBecasDisponibles`)
      .then(r => r.json())
      .then(d => setBecasDisp((d && d.becas) || []))
      .catch(() => setBecasDisp([]));
  }, []);

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
            img={IMG_INA} fallbackBg="linear-gradient(135deg, #1a2547, #2B7FC1)" fallbackText="Programa INA Acreditado"
            badge="Financiable con CONAPE" badgeColor="green"
            name="Programa INA Acreditado"
            bullets={['Certificado avalado por INA','Financiable con CONAPE','4 niveles · 128h por nivel']} />
          <ProgramCard
            tipo="sin_ina" selected={form.programa==='sin_ina'} locked={false}
            onSelect={t => set('programa', t)}
            img={IMG_LIBRE} fallbackBg="linear-gradient(135deg, #2B7FC1, #1a2547)" fallbackText="Programa SIN acreditación"
            badge="Flexible y accesible" badgeColor="blue"
            name="Programa SIN acreditación"
            bullets={['Certificado propio de la academia','Disponible para todos los tipos de ID','4 niveles · 96h por nivel']} />
        </div>
        {errors.programa && <div className="field-error" style={{marginTop:10}}><Ico d={I.alert} size={13} /> {errors.programa}</div>}
      </div>

      {form.programa && (
        <div className="reveal">
          {/* HORARIO / GRUPOS */}
          <div className="card" style={{ marginTop:16 }}>
            <div className="sec-head">
              <div className="sec-eyebrow">Horario</div>
              <div className="sec-title">Seleccioná tu horario</div>
            </div>
            <div id="fld-grupo">
              {loadingGrupos ? (
                <div className="horario-split">
                  <div className="horario-col">
                    <div className="horario-col-head"><span className="hc-ico">📘</span><div><b>Intensivo</b><i>2 clases por semana</i></div></div>
                    <div className="grupo-stack"><GrupoSkeleton /><GrupoSkeleton /></div>
                  </div>
                  <div className="horario-col">
                    <div className="horario-col-head"><span className="hc-ico">🚀</span><div><b>Super Intensivo</b><i>4 clases por semana</i></div></div>
                    <div className="grupo-stack"><GrupoSkeleton /><GrupoSkeleton /></div>
                  </div>
                </div>
              ) : grupos && grupos.length > 0 ? (
                <>
                  {(() => {
                    const intensivos = grupos.filter(g => (g.modalidad || '').toUpperCase().indexOf('SUPER') === -1);
                    const superInt   = grupos.filter(g => (g.modalidad || '').toUpperCase().indexOf('SUPER') >= 0);
                    const Card = g => <GrupoCard key={G.cod(g)} g={g} selected={form.grupo === G.cod(g)} onSelect={v => set('grupo', v)} />;
                    return (
                      <div className="horario-split">
                        <div className="horario-col">
                          <div className="horario-col-head"><span className="hc-ico">📘</span><div><b>Intensivo</b><i>2 clases por semana</i></div></div>
                          <div className="grupo-stack">
                            {intensivos.length ? intensivos.map(Card) : <div className="grupo-empty-sm">Sin grupos intensivos por ahora.</div>}
                          </div>
                        </div>
                        <div className="horario-col">
                          <div className="horario-col-head"><span className="hc-ico">🚀</span><div><b>Super Intensivo</b><i>4 clases por semana</i></div></div>
                          <div className="grupo-stack">
                            {superInt.length ? superInt.map(Card) : <div className="grupo-empty-sm">Sin grupos super intensivos por ahora.</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {errors.grupo && <div className="field-error" style={{marginTop:10}}><Ico d={I.alert} size={13} /> {errors.grupo}</div>}
                </>
              ) : (
                <div className="grupo-empty">
                  <Ico d={I.warn} size={18} />
                  <span>No hay grupos disponibles. <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener">Escribinos por WhatsApp.</a></span>
                </div>
              )}
            </div>
          </div>

          {/* FINANCIAMIENTO */}
          <div className="card">
            <div className="sec-head">
              <div className="sec-eyebrow">Financiamiento</div>
              <div className="sec-title">¿Cómo vas a financiar tu curso?</div>
            </div>
            <div id="fld-financiamiento">
              <div className="fin-stack">
                <FinCard value="CONAPE" selected={form.financiamiento==='CONAPE'} locked={!esNacional}
                  onSelect={v => set('financiamiento', v)} icon="🏦"
                  title="Financiamiento CONAPE" badge={esNacional ? 'Disponible para vos' : null}
                  subtitle="Financiá el 100% sin fiador, sin intereses." />
                <FinCard value="PROPIO" selected={form.financiamiento==='PROPIO'}
                  onSelect={v => set('financiamiento', v)} icon="💳"
                  title="Pago propio"
                  subtitle="Pagás directamente a la academia." />
              </div>
              {errors.financiamiento && <div className="field-error" style={{marginTop:10}}><Ico d={I.alert} size={13} /> {errors.financiamiento}</div>}
            </div>

            {/* SUB-SECCIÓN CONAPE */}
            {form.financiamiento==='CONAPE' && esNacional && (
              <div className="conape-box reveal">
                {/* Equipo de cómputo */}
                <div className="conape-block">
                  <div className="cb-title">¿Necesitás financiar un equipo de cómputo?</div>
                  <div id="fld-conapeEquipo">
                    <div className="equipo-grid">
                      <EquipoCard value="NINGUNO" selected={form.conapeEquipo==='NINGUNO'} simple
                        onSelect={v => set('conapeEquipo', v)} title="No necesito equipo" />
                      <EquipoCard value="BASICO" selected={form.conapeEquipo==='BASICO'}
                        onSelect={v => set('conapeEquipo', v)}
                        img={IMG_BASICO} fallbackBg="#1a2547" fallbackText="Plan Básico"
                        title="Plan Básico · ₡319,000"
                        bullets={['Laptop HP 15"','Core i3 N305 · 8GB RAM · 256GB SSD']} />
                      <EquipoCard value="PREMIUM" selected={form.conapeEquipo==='PREMIUM'}
                        onSelect={v => set('conapeEquipo', v)}
                        img={IMG_PREMIUM} fallbackBg="#2B7FC1" fallbackText="Plan Premium"
                        title="Plan Premium · ₡360,000"
                        bullets={['Laptop HP 15"','+ Headset · Mouse · Licencias']} />
                    </div>
                    {errors.conapeEquipo && <div className="field-error" style={{marginTop:8}}><Ico d={I.alert} size={13} /> {errors.conapeEquipo}</div>}
                  </div>
                </div>

                {/* TOEIC */}
                <div className="conape-block">
                  <div className="cb-title">¿Deseás incluir la prueba internacional TOEIC al finalizar el programa?</div>
                  <div className="cb-note">Certificación reconocida a nivel mundial que evalúa tu nivel de inglés para fines académicos y laborales. Su aplicación es opcional y se realiza al finalizar el programa.</div>
                  <div className="choice-row" style={{ marginTop:10 }}>
                    {[[true,'Sí, deseo financiar la prueba (₡136,730)'],[false,'No']].map(([v,l]) => (
                      <label key={String(v)} className={`choice-card${form.conapeToeic===v?' sel':''}`}>
                        <input type="radio" name="toeic" checked={form.conapeToeic===v} onChange={() => set('conapeToeic', v)} />
                        <span className="choice-txt">{l}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sostenimiento */}
                <div className="conape-block">
                  <div className="cb-title">Gastos de sostenimiento <span className="cb-opt">Opcional</span></div>
                  <div className="cb-note">Este rubro es OPCIONAL y está pensado para ayudarte con gastos básicos durante el curso, como el pago del internet. Podés pedir hasta ₡60,000 por mes (₡240,000 por cuatrimestre / ₡120,000 por bimestre).</div>
                  <select value={form.conapeSost} style={{ marginTop:10 }}
                    onChange={e => set('conapeSost', e.target.value)}>
                    <option value="">No lo necesito</option>
                    {[10000,20000,30000,40000,50000,60000].map(m => (
                      <option key={m} value={`₡${m.toLocaleString('es-CR')} por mes`}>
                        ₡{m.toLocaleString('es-CR')} por mes
                      </option>
                    ))}
                  </select>
                  <div className="cb-hint">Elegí el monto mensual que deseás solicitar (entre ₡10,000 y ₡60,000 por mes). Si no lo necesitás, dejá "No lo necesito".</div>
                </div>
              </div>
            )}

            {/* SUB-SECCIÓN PAGO PROPIO */}
            {form.financiamiento==='PROPIO' && (
              <div className="propio-box reveal">
                <div className="conape-block">
                  <div className="cb-title">Becas disponibles <span className="cb-opt">Opcional</span></div>
                  <div className="cb-note">Si pagás por cuenta propia podés solicitar una de las siguientes becas. Su otorgamiento queda sujeto a aprobación de la Dirección.</div>
                  <div className="beca-grid" style={{ marginTop:12 }}>
                    {becasDisp
                      .filter(b => b.disponible)
                      .map(b => (
                        <label key={b.id} className={`beca-card${form.becaPropio===b.id?' sel':''}`}>
                          <input type="radio" name="becaPropio" checked={form.becaPropio===b.id}
                            onChange={() => set('becaPropio', form.becaPropio===b.id ? '' : b.id)}
                            onClick={() => { if (form.becaPropio===b.id) set('becaPropio',''); }} />
                          <span className="beca-ico">{b.id === 'MUJER' ? '🌷' : b.id === 'IMPACTA' ? '🎯' : '🎓'}</span>
                          <span className="beca-body">
                            <b>{b.nombre.toUpperCase()} {Math.round(b.porcentaje * 100)}%</b>
                            <i>{b.cupo_disponible} cupos disponibles · Sujeto a aprobación de Dirección</i>
                          </span>
                        </label>
                      ))}
                  </div>
                  {becasDisp.filter(b => b.disponible).length === 0 && (
                    <div className="grupo-empty">
                      <Ico d={I.warn} size={18} />
                      <span>No hay becas disponibles en este momento.</span>
                    </div>
                  )}
                  <div className="cb-hint">Seleccioná una beca si deseás aplicar, o dejá esta sección en blanco.</div>
                </div>
              </div>
            )}
          </div>

          {/* REGISTRARME */}
          <div className="card continue-card">
            <button className="btn btn-success" onClick={onSubmit} disabled={submitting}>
              {submitting ? <><span className="btn-loader" /> Subiendo documentos…</> : <>Registrarme <Ico d={I.check} size={18} /></>}
            </button>
            {submitting && (
              <div className="upload-status" role="status" aria-live="polite">
                Estamos subiendo tus documentos. Esto puede tardar unos segundos — no cierres esta ventana.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA DE ÉXITO
// ─────────────────────────────────────────────────────────────────────────────
const EXITO_TXT = {
  CONAPE: 'Tu solicitud está siendo procesada. Un asesor se va a comunicar con vos para los siguientes pasos del financiamiento.',
  BECA:   'Tu solicitud de beca está siendo revisada. Pronto te contactamos para coordinar el pago de matrícula.',
  PROPIO: 'Para activar tu cuenta completá el pago de matrícula. Escribinos por WhatsApp para coordinar.',
};
function Exito({ financiamiento, waLink }) {
  const propio = financiamiento === 'PROPIO';
  const mensajeWa = (
    financiamiento === 'CONAPE'
      ? 'Hola, acabo de registrarme, necesito ayuda para el siguiente paso.'
      : 'Hola, acabo de registrarme y apliqué a la beca. ¿Cuándo me confirman si quedé y cuáles son los siguientes pasos?'
  );
  const wa = waLink || WA_NUMBER; // wa_link del asesor seleccionado · fallback al número genérico
  return (
    <div className="success-wrap">
      <div className="success-card">
        <div className="success-ico"><Ico d={I.check} size={56} /></div>
        <div className="success-h1">¡Te registraste correctamente!</div>
        <div className="success-p">{EXITO_TXT[financiamiento] || EXITO_TXT.PROPIO}</div>
        <a className="success-wa" href={`https://wa.me/${wa}?text=${encodeURIComponent(mensajeWa)}`} target="_blank" rel="noopener">
          <IcoFill d={I.wa} size={18} /> Coordinar pago por WhatsApp
        </a>
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
  fechaNac:'', sexo:'', provincia:'', canton:'', distrito:'', direccion:'',
  tutorNombre:'', tutorCedula:'', tutorCorreo:'', tutorTel:'',
  telefono:'', waMismo:true, whatsapp:'', correo:'', correoConf:'',
  como:'', asesor:'', conocimientos:'',
  programa:'', grupo:'',
  financiamiento:'',
  conapeEquipo:'NINGUNO', conapeToeic:false, conapeSost:'', becaPropio:'',
  clave:'', claveConf:'',
};

function scrollToField(key) {
  const el = document.getElementById(`fld-${key}`);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 100;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

// Tamaño máximo por foto (el backend limpia el prefijo data:image/...;base64,)
const MAX_FOTO = 5 * 1024 * 1024;

// Mapeo: clave en `files` → campo del payload → id de campo para el error inline
const FOTO_MAP = [
  ['frente',  'foto_ced_frente', 'doc_frente'],
  ['reverso', 'foto_ced_dorso',  'doc_reverso'],
  ['titulo',  'foto_titulo',     'doc_titulo'],
];

// Convierte el File guardado en el state ({ file, name, size, ... }) a un
// string base64 con prefijo data: usando FileReader.readAsDataURL.
function fileToBase64(fileObj) {
  return new Promise((resolve, reject) => {
    const f = fileObj && fileObj.file;
    if (!f) { resolve(''); return; }
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);          // data:image/...;base64,xxxx
    reader.onerror = () => reject(reader.error || new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(f);
  });
}

function App() {
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState(FORM_INIT);
  const [grupos, setGrupos] = useState(null); // lista de grupos cargada en Pagina2 (se eleva para derivar la modalidad en el submit)
  const [verif, setVerif] = useState('idle'); // idle | loading | exists | free — estado de verificación de cédula (Pagina1)
  const [esProspecto, setEsProspecto] = useState(false); // si la cédula existente es un prospecto (inscripción en proceso)
  const [prellenado, setPrellenado] = useState({}); // campos verificados del padrón TSE
  const [files, setFiles] = useState({ frente:null, reverso:null, titulo:null });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState('');
  const [asesores, setAsesores] = useState([]); // asesores activos (rol=ventas) cargados del backend

  const set = useCallback((k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => e[k] ? { ...e, [k]: undefined } : e);
  }, []);
  const setMany = useCallback((obj) => {
    setForm(f => ({ ...f, ...obj }));
    setErrors(e => {
      const keys = Object.keys(obj).filter(k => e[k]);
      if (!keys.length) return e;
      const ne = { ...e }; keys.forEach(k => { ne[k] = undefined; }); return ne;
    });
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

  // Asesores activos (rol=ventas) desde el backend — alimentan el dropdown
  // "Asesor de referencia" y el link de WhatsApp final. Si la lista viene
  // vacía, el dropdown queda con "— Ninguno —" y el flujo no se bloquea.
  useEffect(() => {
    fetch(`${SCRIPT_URL}?fn=getAsesoresActivos`)
      .then(r => r.json())
      .then(d => {
        if (d && d.ok && Array.isArray(d.asesores)) setAsesores(d.asesores);
      })
      .catch(err => console.error('Error cargando asesores:', err));
  }, []);

  // ── Validación Página 1 ──
  const validarPaso1 = () => {
    const e = {};
    if (!form.cedula.trim()) {
      e.cedula = 'Ingresá tu número de identificación.';
    } else if (verif === 'exists') {
      e.cedula = 'Esta cédula ya tiene una cuenta. Iniciá sesión o cambiá el número.';
    } else if (verif !== 'free') {
      e.cedula = 'Presioná el botón Verificar antes de continuar.';
    }
    if (!form.nombre.trim()) e.nombre = 'Ingresá tu nombre completo.';
    if (!files.frente)  e.doc_frente  = 'Subí el frente de tu documento.';
    if (!files.reverso) e.doc_reverso = 'Subí el reverso de tu documento.';
    if (!files.titulo)  e.doc_titulo  = 'Subí tu título académico.';
    if (!form.fechaNac) e.fechaNac = 'Indicá tu fecha de nacimiento.';
    if (!form.sexo)     e.sexo = 'Seleccioná una opción.';
    if (!form.provincia) e.provincia = 'Seleccioná tu provincia.';
    if (!form.canton.trim()) e.canton = 'Seleccioná tu cantón.';
    if (!form.distrito) e.distrito = 'Seleccioná tu distrito.';
    if (!form.direccion.trim()) e.direccion = 'Ingresá tu dirección.';

    const menor = (calcEdad(form.fechaNac) ?? 99) < 18;
    if (menor) {
      if (!form.tutorNombre.trim()) e.tutorNombre = 'Ingresá el nombre del encargado.';
      if (!form.tutorCedula.trim()) e.tutorCedula = 'Ingresá la cédula del encargado.';
      if (!validEmail(form.tutorCorreo)) e.tutorCorreo = 'Ingresá un correo válido.';
      if (!validTel(form.tutorTel)) e.tutorTel = 'Ingresá un teléfono válido.';
    }

    if (!validTel(form.telefono)) e.telefono = 'Ingresá un teléfono válido (8 dígitos).';
    if (!form.waMismo && !validTel(form.whatsapp)) e.whatsapp = 'Ingresá un WhatsApp válido.';
    if (!validEmail(form.correo)) e.correo = 'Ingresá un correo válido.';
    if (!form.correoConf.trim()) e.correoConf = 'Confirmá tu correo.';
    else if (form.correo.trim().toLowerCase() !== form.correoConf.trim().toLowerCase()) e.correoConf = 'Los correos no coinciden.';
    if (!form.como) e.como = 'Seleccioná una opción.';
    if (!form.conocimientos) e.conocimientos = 'Seleccioná una opción.';
    if (!form.clave || form.clave.length < 6) e.clave = 'Mínimo 6 caracteres.';
    if (!form.claveConf) e.claveConf = 'Confirmá tu contraseña.';
    else if (form.clave !== form.claveConf) e.claveConf = 'Las contraseñas no coinciden.';

    setErrors(e);
    if (Object.keys(e).length) {
      const order = ['cedula','nombre','doc_frente','doc_reverso','doc_titulo','fechaNac','sexo',
        'tutorNombre','tutorCedula','tutorCorreo','tutorTel',
        'provincia','canton','distrito','direccion','telefono','whatsapp','correo','correoConf','como','conocimientos','clave','claveConf'];
      const first = order.find(k => e[k]);
      if (first) setTimeout(() => scrollToField(first), 50);
      return false;
    }
    return true;
  };

  const irPaso2 = () => {
    if (!validarPaso1()) return;
    if (form.idTipo !== 'nac') {
      // ID no nacional → forzar Programa Libre + Pago/Beca (no CONAPE)
      let resetMsg = '';
      if (form.programa === 'ina') { set('programa',''); resetMsg = 'El Programa INA y el financiamiento CONAPE son exclusivos para cédula costarricense. Seleccioná el Programa SIN acreditación.'; }
      if (form.financiamiento === 'CONAPE') { set('financiamiento',''); if (!resetMsg) resetMsg = 'El financiamiento CONAPE es exclusivo para cédula costarricense.'; }
      if (resetMsg) { setToast(resetMsg); }
    }
    setPaso(2);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const volverPaso1 = () => { setPaso(1); window.scrollTo({ top: 0, behavior: 'auto' }); };

  // ── Validación + envío Página 2 ──
  const registrar = async () => {
    const e = {};
    if (!form.programa) e.programa = 'Seleccioná un programa.';
    if (!form.grupo) e.grupo = 'Seleccioná un grupo.';
    if (!form.financiamiento) e.financiamiento = 'Seleccioná una opción de financiamiento.';
    if (form.financiamiento === 'CONAPE' && !form.conapeEquipo) e.conapeEquipo = 'Seleccioná una opción de equipo.';
    setErrors(e);
    if (Object.keys(e).length) {
      const order = ['programa','grupo','financiamiento','conapeEquipo'];
      const first = order.find(k => e[k]);
      if (first) setTimeout(() => scrollToField(first), 50);
      return;
    }

    const esConape = form.financiamiento === 'CONAPE';
    const menor = (calcEdad(form.fechaNac) ?? 99) < 18;
    // Modalidad derivada del grupo elegido (la lista viene del backend).
    const grupoObj = (grupos || []).find(g => (g.codigo || g.code) === form.grupo);
    const modalidad = grupoObj ? (grupoObj.modalidad || '').toUpperCase() : '';

    // ── Validar tamaño de las fotos antes de convertir ──────────────────────
    // (UploadZone ya filtra al seleccionar; esto es una red de seguridad y
    // garantiza el error inline en el campo correcto si algo se coló.)
    const eFotos = {};
    for (const [key, , errKey] of FOTO_MAP) {
      const f = files[key];
      if (f && f.size > MAX_FOTO) eFotos[errKey] = 'La imagen supera los 5 MB. Subí una versión más liviana.';
    }
    if (Object.keys(eFotos).length) {
      setErrors(eFotos);
      setPaso(1);
      const first = ['doc_frente','doc_reverso','doc_titulo'].find(k => eFotos[k]);
      setToast('Una de tus imágenes supera los 5 MB. Revisá tus documentos.');
      window.scrollTo({ top: 0, behavior: 'auto' });
      if (first) setTimeout(() => scrollToField(first), 120);
      return;
    }

    setSubmitting(true);

    // ── Convertir las 3 fotos a base64 (data:image/...;base64,...) ──────────
    let fotos;
    try {
      fotos = await Promise.all(FOTO_MAP.map(([key]) => fileToBase64(files[key])));
    } catch (_) {
      setSubmitting(false);
      setToast('No pudimos procesar tus imágenes. Intentá de nuevo en un momento.');
      return;
    }

    const payload = {
      fn: 'crearUsuarioEstudiante',
      cedula: form.cedula.trim(),
      nombre: form.nombre.trim(),
      tipo_id: form.idTipo,
      correo: form.correo.trim(),
      whatsapp: form.waMismo ? form.telefono : form.whatsapp,
      telefono: form.telefono,
      provincia: form.provincia,
      canton: form.canton.trim(),
      distrito: form.distrito,
      direccion: form.direccion.trim(),
      fecha_nac: form.fechaNac,
      sexo: form.sexo,
      es_menor: menor,
      tutor_nombre: menor ? form.tutorNombre.trim() : '',
      tutor_cedula: menor ? form.tutorCedula.trim() : '',
      tutor_correo: menor ? form.tutorCorreo.trim() : '',
      tutor_tel:    menor ? form.tutorTel : '',
      programa: form.programa === 'ina' ? 'INA' : 'SIN_INA',
      modalidad: modalidad,
      grupo_tentativo: form.grupo,
      financiamiento: form.financiamiento,
      conape_equipo: esConape ? form.conapeEquipo : 'NINGUNO',
      conape_toeic: esConape ? form.conapeToeic : false,
      conape_sostenimiento: esConape ? form.conapeSost.trim() : '',
      beca: form.financiamiento === 'PROPIO' ? form.becaPropio : '',
      como_entero: form.como,
      asesor_ref: form.asesor,
      conocimientos_previos: form.conocimientos,
      // Documentos (base64 con prefijo data: — el backend limpia el prefijo)
      foto_ced_frente: fotos[0],
      foto_ced_dorso:  fotos[1],
      foto_titulo:     fotos[2],
      clave: form.clave,
    };

    try {
      // text/plain: evita el preflight CORS que rompe Apps Script (doPost lee
      // el JSON en e.postData.contents igual). Patrón usado en todo el campus.
      const enviarPayload = async (extra) => {
        const res = await fetch(`${SCRIPT_URL}?fn=crearUsuarioEstudiante`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(extra ? { ...payload, ...extra } : payload),
        });
        return await res.json();
      };

      let data = await enviarPayload();

      // Grupo en lista de espera (≥1.5× cupo): confirmar y reintentar.
      if (data && !data.ok && data.estado_cupo === 'LISTA_ESPERA') {
        const seguir = window.confirm('Este grupo está en lista de espera. ¿Continuar igual? Te llamamos si se abre cupo o si se libera espacio en otro grupo.');
        if (!seguir) {
          setPaso(2);
          window.scrollTo({ top: 0, behavior: 'auto' });
          setTimeout(() => scrollToField('grupo'), 80);
          return;
        }
        data = await enviarPayload({ aceptar_lista_espera: true });
      }

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
    const asesorSel = asesores.find(a => a.nombre === form.asesor);
    const waLink = asesorSel ? asesorSel.wa_link : WA_NUMBER; // fallback al número genérico
    return (
      <>
        <Header />
        <Exito financiamiento={form.financiamiento} waLink={waLink} />
      </>
    );
  }

  return (
    <>
      <Header />
      <Progress paso={paso} />
      {paso === 1
        ? <Pagina1 form={form} set={set} setMany={setMany} prellenado={prellenado} setPrellenado={setPrellenado}
            files={files} setFile={setFile} errors={errors} onContinue={irPaso2} verif={verif} setVerif={setVerif}
            esProspecto={esProspecto} setProspecto={setEsProspecto} asesores={asesores} />
        : <Pagina2 form={form} set={set} errors={errors} onBack={volverPaso1} onSubmit={registrar} submitting={submitting} grupos={grupos} setGrupos={setGrupos} />}
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
