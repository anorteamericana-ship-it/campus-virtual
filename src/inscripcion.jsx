/* global React, ReactDOM */
// F98.4-Z6-IP3A · Inscripción Pública V3 limpieza comercial
// Página pública de solicitud de ingreso.

const INS_VERSION = 'F98.4-Z6-IP3A';
const INS_STORAGE_KEY = 'anorteam_inscripcion_ip3_draft';

function insUrl(){
  const u = window.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';
  if(!window.APPS_SCRIPT_URL) window.APPS_SCRIPT_URL = u;
  return u;
}

async function insPost(fn, payload={}){
  const res = await fetch(insUrl(), {
    method: 'POST',
    headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify({ fn, ...payload })
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch(_){
    const msg = text && text.trim().startsWith('<')
      ? 'El servicio no está disponible en este momento. Intentá de nuevo más tarde.'
      : 'Respuesta inválida del servidor.';
    throw new Error(msg);
  }
  if(!json || json.ok === false){
    throw new Error(json?.mensaje || json?.error || json?.detalle || 'No se pudo completar la solicitud.');
  }
  return json;
}

function clean(v){ return String(v == null ? '' : v).trim(); }
function upper(v){ return clean(v).toUpperCase(); }
function cedClean(v){ return clean(v).replace(/[^0-9A-Za-z]/g,'').toUpperCase(); }
function fmtMoney(v){
  const n = Number(v || 0);
  if(!n) return 'Por confirmar';
  try { return new Intl.NumberFormat('es-CR',{style:'currency',currency:'CRC',maximumFractionDigits:0}).format(n); }
  catch(_){ return '₡' + Math.round(n).toLocaleString('es-CR'); }
}
function first(v){ return clean(v).split(/\s+/)[0] || 'estudiante'; }
function isTruthy(v){ return v === true || String(v).trim().toUpperCase() === 'TRUE' || String(v).trim().toUpperCase() === 'SI' || String(v).trim() === '1'; }
function optionLabel(value, fallback){ return clean(value) || fallback || 'Por confirmar'; }

function normalizeGroup(g){
  const code = clean(g.code || g.codigo || g.cod || g.CODIGO_GRUPO);
  const nivelId = clean(g.nivelId || g.nivel_id || g.NIVEL_ID || '');
  return {
    ...g,
    code,
    codigo: code,
    nivel: clean(g.nivel || g.nivel_label || nivelId || 'Grupo disponible'),
    nivelId,
    programa: upper(g.programa || 'INA'),
    modalidad: upper(g.modalidad || ''),
    modalidad_label: clean(g.modalidad_label || g.modalidad || 'Modalidad por confirmar'),
    dias_label: clean(g.dias_label || g.dias || g.dias_raw || 'Días por confirmar'),
    hora_label: clean(g.hora_label || g.hora || 'Hora por confirmar'),
    fecha_inicio_label: clean(g.fecha_inicio_label || g.fecha_inicio || 'Fecha por confirmar'),
    estado_cupo: upper(g.estado_cupo || 'DISPONIBLE'),
    cupo_disponible: Number(g.cupo_disponible ?? g.cupos ?? g.cupo ?? 0),
    precio_matricula: Number(g.precio_matricula || 0),
    precio_cuota: Number(g.precio_cuota || 0),
    precio_certificado: Number(g.precio_certificado || 0),
    precio_titulo: Number(g.precio_titulo || 0),
    toeic_disponible: isTruthy(g.toeic_disponible),
    toeic_monto: Number(g.toeic_monto || 0),
    ican_aplica: isTruthy(g.ican_aplica),
    ican_dias_label: clean(g.ican_dias_label || g.ican_dias || ''),
    ican_horario: clean(g.ican_horario || '')
  };
}

function levelClass(g){
  const k = upper(g?.nivelId || g?.nivel || '');
  if(k.includes('B2') || k.includes('BÁSICO II') || k.includes('BASICO II')) return 'lvl-b2';
  if(k.includes('I1') || k.includes('INTERMEDIO I')) return 'lvl-i1';
  if(k.includes('I2') || k.includes('INTERMEDIO II')) return 'lvl-i2';
  return 'lvl-b1';
}

function useDraft(initial){
  const [form,setFormRaw] = React.useState(()=>{
    try{
      const saved = JSON.parse(localStorage.getItem(INS_STORAGE_KEY) || '{}');
      return {...initial, ...saved, foto_ced_frente:'', foto_ced_dorso:'', foto_titulo:''};
    }catch(_){ return initial; }
  });
  const setForm = React.useCallback((patch)=>{
    setFormRaw(prev=>{
      const next = typeof patch === 'function' ? patch(prev) : {...prev, ...patch};
      try{
        const safe = {...next};
        delete safe.foto_ced_frente; delete safe.foto_ced_dorso; delete safe.foto_titulo;
        localStorage.setItem(INS_STORAGE_KEY, JSON.stringify(safe));
      }catch(_){ }
      return next;
    });
  },[]);
  return [form,setForm];
}

const INITIAL_FORM = {
  tipo_id:'CEDULA_NACIONAL', cedula:'', nombre:'', clave:'', correo:'', whatsapp:'', telefono:'',
  sexo:'', provincia:'', canton:'', distrito:'', direccion:'', fecha_nac:'', es_menor:false,
  tutor_nombre:'', tutor_cedula:'', tutor_correo:'', tutor_tel:'',
  programa:'INA', modalidad:'', financiamiento:'CONAPE', beca:'', beca_propio:'',
  grupo_tentativo:'', conape_equipo:'NINGUNO', conape_toeic:false, conape_toeic_monto:0, toeic_monto:0,
  conape_sostenimiento:'NO', como_entero:'', asesor_ref:'', conocimientos_previos:'', aceptar_lista_espera:false,
  foto_ced_frente:'', foto_ced_dorso:'', foto_titulo:''
};

const STEPS = [
  ['cedula','Cédula'], ['grupo','Grupo'], ['datos','Datos'], ['finanzas','Financiamiento'], ['docs','Documentos'], ['resumen','Resumen']
];

function Header({config, scrollToForm}){
  const textos = config?.textos || {};
  const heroTitle = clean(textos.hero_titulo) || 'Empezá tu proceso de ingreso a la Academia';
  const heroSub = clean(textos.hero_subtitulo) || 'Completá tu solicitud en pocos minutos, elegí un grupo disponible y dejá tus datos para que admisiones te acompañe con el siguiente paso.';
  const heroImg = clean(config?.imagenes?.hero_url || config?.imagenes?.principal || '');
  return <header className="ins-hero">
    <nav className="ins-topbar" aria-label="Encabezado">
      <div className="ins-brand">
        <div className="ins-brand-mark">AN</div>
        <div><strong>Academia Norteamericana</strong><span>Inglés Conversacional · Costa Rica</span></div>
      </div>
      <a className="ins-top-link" href="campus.html">Ya tengo acceso</a>
    </nav>
    <section className="ins-hero-grid">
      <div className="ins-hero-copy">
        <span className="ins-kicker">Inscripción pública</span>
        <h1>{heroTitle}</h1>
        <p>{heroSub}</p>
        <div className="ins-hero-actions">
          <button type="button" className="ins-btn primary" onClick={scrollToForm}>Iniciar inscripción</button>
        </div>
        <div className="ins-hero-trust">
          <span>Virtual en vivo</span><span>Grupos disponibles</span><span>CONAPE / propio</span><span>Acompañamiento de admisiones</span>
        </div>
      </div>
      <aside className="ins-hero-card" style={heroImg ? {backgroundImage:`linear-gradient(135deg, rgba(0,47,108,.92), rgba(0,30,71,.78)), url(${heroImg})`} : null}>
        <span>Ingreso 2026</span>
        <h2>Tu primer paso para estudiar inglés con nosotros.</h2>
        <p>Al finalizar recibirás tu comprobante de solicitud y el acceso inicial al portal de prematrícula.</p>
        <div className="ins-ticket-mini">
          <strong>Portal de prematrícula</strong>
          <small>Seguimiento inicial de tu solicitud</small>
        </div>
      </aside>
    </section>
  </header>;
}

function Stepper({step, done}){
  return <div className="ins-stepper" aria-label="Progreso del formulario">
    {STEPS.map((s,i)=><div key={s[0]} className={`ins-step ${i===step?'active':''} ${i<step || done?'done':''}`}>
      <b>{done?'✓':i+1}</b><span>{s[1]}</span>
    </div>)}
  </div>;
}

function Alert({type='info', children}){ return <div className={`ins-alert ${type}`} role={type==='error'?'alert':'status'}>{children}</div>; }

function Field({label, children, hint, required}){
  return <label className="ins-field"><span>{label}{required && <em>*</em>}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function TextInput({value,onChange, ...props}){
  return <input {...props} value={value || ''} onChange={e=>onChange(e.target.value)} />;
}

function SelectInput({value,onChange,children,...props}){
  return <select {...props} value={value || ''} onChange={e=>onChange(e.target.value)}>{children}</select>;
}

function TextArea({value,onChange,...props}){
  return <textarea {...props} value={value || ''} onChange={e=>onChange(e.target.value)} />;
}

function FilePhoto({label, value, onChange, hint}){
  const [busy,setBusy]=React.useState(false);
  const [name,setName]=React.useState('');
  const [err,setErr]=React.useState('');
  async function handleFile(file){
    setErr(''); setName('');
    if(!file){ onChange(''); return; }
    if(!/^image\//.test(file.type || '')){ setErr('Subí una imagen JPG/PNG tomada con el celular.'); return; }
    if(file.size > 7 * 1024 * 1024){ setErr('La imagen pesa demasiado. Tomá una foto más liviana.'); return; }
    setBusy(true);
    try{
      const data = await resizeImage(file, 1400, .78);
      onChange(data); setName(file.name || 'foto lista');
    }catch(e){ setErr(e.message || 'No se pudo procesar la imagen.'); }
    finally{ setBusy(false); }
  }
  return <div className={`ins-upload ${value?'has-file':''}`}>
    <label>
      <input type="file" accept="image/*" capture="environment" onChange={e=>handleFile(e.target.files && e.target.files[0])} />
      <span>{value ? 'Foto cargada' : label}</span>
      <small>{busy?'Procesando imagen…':(name || hint || 'JPG/PNG desde el celular')}</small>
    </label>
    {value && <button type="button" onClick={()=>{onChange('');setName('');}}>Quitar</button>}
    {err && <em>{err}</em>}
  </div>;
}

function resizeImage(file, maxSide=1400, quality=.78){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onerror = ()=>reject(new Error('No se pudo leer la imagen.'));
    reader.onload = ()=>{
      const img = new Image();
      img.onerror = ()=>reject(new Error('La imagen no se pudo abrir.'));
      img.onload = ()=>{
        const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * ratio));
        canvas.height = Math.max(1, Math.round(img.height * ratio));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function CedulaStep({form,setForm,cedulaStatus,setCedulaStatus,setStep,setPadronName}){
  const [busy,setBusy]=React.useState(false);
  const [err,setErr]=React.useState('');
  async function verify(){
    setBusy(true); setErr(''); setCedulaStatus(null);
    const cedula = cedClean(form.cedula);
    if(!cedula){ setErr('Ingresá la cédula para continuar.'); setBusy(false); return; }
    setForm({cedula});
    try{
      const r = await insPost('verificarCedulaInscripcion', {cedula});
      setCedulaStatus(r);
      if(r.puedeContinuar){
        try{
          const pad = await insPost('buscarEnPadron', {cedula});
          if(pad?.encontrado && pad.nombre){
            setPadronName(pad.nombre);
            setForm(prev=>({...prev, nombre: prev.nombre || pad.nombre}));
          }
        }catch(_){ }
        setStep(1);
      }
    }catch(e){ setErr(e.message); }
    finally{ setBusy(false); }
  }
  const motivo = upper(cedulaStatus?.motivo);
  return <section className="ins-card ins-step-card" id="inscripcion-form">
    <div className="ins-card-head"><span>Paso 1</span><h2>Verificá tu cédula</h2><p>Primero revisamos que no exista una matrícula o una inscripción activa con la misma cédula.</p></div>
    <div className="ins-grid two">
      <Field label="Tipo de identificación" required>
        <SelectInput value={form.tipo_id} onChange={v=>setForm({tipo_id:v})}>
          <option value="CEDULA_NACIONAL">Cédula nacional</option>
          <option value="DIMEX">DIMEX</option>
          <option value="PASAPORTE">Pasaporte</option>
        </SelectInput>
      </Field>
      <Field label="Número de identificación" required hint="Sin guiones. Ejemplo: 102340567">
        <TextInput inputMode="numeric" autoComplete="off" value={form.cedula} onChange={v=>setForm({cedula:v})} onKeyDown={e=>{if(e.key==='Enter')verify();}} />
      </Field>
    </div>
    {err && <Alert type="error">{err}</Alert>}
    {cedulaStatus && !cedulaStatus.puedeContinuar && <Alert type="error">
      {motivo==='ESTUDIANTE_EXISTE' && 'Esta cédula ya aparece como estudiante activo. Iniciá sesión o contactá a la academia.'}
      {motivo==='PROSPECTO_ACTIVO' && <>Esta cédula ya tiene una inscripción en proceso. {cedulaStatus.asesorNombre ? <>Asesor asignado: <strong>{cedulaStatus.asesorNombre}</strong>.</> : 'Contactá a admisiones para continuar.'}</>}
      {!['ESTUDIANTE_EXISTE','PROSPECTO_ACTIVO'].includes(motivo) && (cedulaStatus.mensaje || cedulaStatus.error || 'No se puede continuar con esta cédula.')}
    </Alert>}
    {cedulaStatus && cedulaStatus.puedeContinuar && <Alert type="ok">Cédula validada. Podés continuar con la inscripción.</Alert>}
    <div className="ins-actions right"><button type="button" className="ins-btn primary" onClick={verify} disabled={busy}>{busy?'Verificando…':'Verificar y continuar'}</button></div>
  </section>;
}

function GroupCard({group,selected,onSelect}){
  const wait = group.estado_cupo === 'LISTA_ESPERA';
  return <button type="button" className={`ins-group-card ${levelClass(group)} ${selected?'selected':''}`} onClick={()=>onSelect(group)}>
    <div className="ins-group-top"><span>{group.nivel}</span><b>{wait?'Lista de espera':'Disponible'}</b></div>
    <h3>{group.dias_label}</h3>
    <p>{group.hora_label}</p>
    <dl>
      <div><dt>Inicio</dt><dd>{group.fecha_inicio_label}</dd></div>
      <div><dt>Modalidad</dt><dd>{group.modalidad_label}</dd></div>
      <div><dt>Cupos</dt><dd>{group.cupo_disponible > 0 ? group.cupo_disponible : (wait?'Reserva':'Por confirmar')}</dd></div>
      <div><dt>Matrícula</dt><dd>{fmtMoney(group.precio_matricula)}</dd></div>
      <div><dt>Cuota</dt><dd>{fmtMoney(group.precio_cuota)}</dd></div>
    </dl>
    <small>Código: {group.codigo}</small>
  </button>;
}

function GroupStep({groups,loading,error,form,setForm,selectedGroup,setSelectedGroup,setStep,reloadGroups}){
  const [level,setLevel]=React.useState('');
  const [mod,setMod]=React.useState('');
  const list = groups.filter(g=>{
    if(level && upper(g.nivelId || g.nivel) !== level) return false;
    if(mod && !upper(g.modalidad || g.modalidad_label).includes(mod)) return false;
    return true;
  });
  function choose(g){
    setSelectedGroup(g);
    setForm({
      grupo_tentativo:g.codigo,
      programa:g.programa || form.programa,
      modalidad:g.modalidad || form.modalidad,
      conape_toeic:false,
      conape_toeic_monto:g.toeic_monto || 0,
      toeic_monto:g.toeic_monto || 0,
      aceptar_lista_espera: g.estado_cupo === 'DISPONIBLE' ? false : form.aceptar_lista_espera
    });
  }
  return <section className="ins-card ins-step-card">
    <div className="ins-card-head"><span>Paso 2</span><h2>Elegí el grupo que más te sirve</h2><p>Seleccioná una opción disponible. Si un grupo está en lista de espera, admisiones te confirmará alternativas.</p></div>
    <div className="ins-filter-row">
      <SelectInput aria-label="Filtrar por nivel" value={level} onChange={setLevel}>
        <option value="">Todos los niveles</option><option value="B1">Básico I</option><option value="B2">Básico II</option><option value="I1">Intermedio I</option><option value="I2">Intermedio II</option>
      </SelectInput>
      <SelectInput aria-label="Filtrar por modalidad" value={mod} onChange={setMod}>
        <option value="">Todas las modalidades</option><option value="INTENSIVO">Intensivo</option><option value="SUPER">Súper intensivo</option>
      </SelectInput>
      <button type="button" className="ins-btn ghost compact" onClick={reloadGroups}>Actualizar grupos</button>
    </div>
    {loading && <div className="ins-skeleton-list"><span></span><span></span><span></span></div>}
    {error && <Alert type="error">{error}</Alert>}
    {!loading && !error && list.length===0 && <Alert>No hay grupos disponibles con ese filtro. Probá otro horario o contactá a admisiones.</Alert>}
    <div className="ins-groups-grid">
      {list.map(g=><GroupCard key={g.codigo} group={g} selected={selectedGroup?.codigo===g.codigo} onSelect={choose} />)}
    </div>
    {selectedGroup && <div className="ins-selected-box">
      <div><span>Grupo seleccionado</span><strong>{selectedGroup.nivel} · {selectedGroup.dias_label}</strong><small>{selectedGroup.hora_label} · Inicio {selectedGroup.fecha_inicio_label}</small></div>
      <button type="button" className="ins-btn primary" onClick={()=>setStep(2)}>Continuar</button>
    </div>}
  </section>;
}

function DatosStep({form,setForm,setStep,padronName}){
  const [err,setErr]=React.useState('');
  function next(){
    const missing=[];
    if(!clean(form.nombre)) missing.push('nombre');
    if(!clean(form.correo)) missing.push('correo');
    if(!clean(form.whatsapp)) missing.push('WhatsApp');
    if(!clean(form.clave) || clean(form.clave).length < 4) missing.push('clave mínima de 4 caracteres');
    if(form.es_menor && (!clean(form.tutor_nombre) || !clean(form.tutor_cedula) || !clean(form.tutor_tel))) missing.push('datos del encargado');
    if(missing.length){ setErr('Falta completar: ' + missing.join(', ') + '.'); return; }
    setErr(''); setStep(3);
  }
  return <section className="ins-card ins-step-card">
    <div className="ins-card-head"><span>Paso 3</span><h2>Datos personales</h2><p>Usaremos esta información para revisar tu solicitud y coordinar el siguiente paso.</p></div>
    {padronName && <Alert type="ok">Nombre encontrado en padrón: <strong>{padronName}</strong>. Revisalo antes de continuar.</Alert>}
    <div className="ins-grid two">
      <Field label="Nombre completo" required><TextInput value={form.nombre} onChange={v=>setForm({nombre:v})} autoComplete="name" /></Field>
      <Field label="Correo electrónico" required><TextInput type="email" value={form.correo} onChange={v=>setForm({correo:v})} autoComplete="email" /></Field>
      <Field label="WhatsApp principal" required><TextInput inputMode="tel" value={form.whatsapp} onChange={v=>setForm({whatsapp:v})} autoComplete="tel" /></Field>
      <Field label="Teléfono adicional"><TextInput inputMode="tel" value={form.telefono} onChange={v=>setForm({telefono:v})} /></Field>
      <Field label="Fecha de nacimiento"><TextInput type="date" value={form.fecha_nac} onChange={v=>setForm({fecha_nac:v})} /></Field>
      <Field label="Sexo"><SelectInput value={form.sexo} onChange={v=>setForm({sexo:v})}><option value="">Seleccionar</option><option value="F">Femenino</option><option value="M">Masculino</option><option value="NO_INDICA">Prefiero no indicar</option></SelectInput></Field>
      <Field label="Provincia"><TextInput value={form.provincia} onChange={v=>setForm({provincia:v})} /></Field>
      <Field label="Cantón"><TextInput value={form.canton} onChange={v=>setForm({canton:v})} /></Field>
      <Field label="Distrito"><TextInput value={form.distrito} onChange={v=>setForm({distrito:v})} /></Field>
      <Field label="Clave para entrar al portal" required hint="La usarás con tu cédula para revisar tu solicitud."><TextInput type="password" value={form.clave} onChange={v=>setForm({clave:v})} autoComplete="new-password" /></Field>
    </div>
    <Field label="Dirección exacta"><TextArea rows="3" value={form.direccion} onChange={v=>setForm({direccion:v})} /></Field>
    <label className="ins-check"><input type="checkbox" checked={!!form.es_menor} onChange={e=>setForm({es_menor:e.target.checked})} /><span>El estudiante es menor de edad</span></label>
    {form.es_menor && <div className="ins-subcard"><h3>Datos del encargado</h3><div className="ins-grid two">
      <Field label="Nombre del encargado" required><TextInput value={form.tutor_nombre} onChange={v=>setForm({tutor_nombre:v})} /></Field>
      <Field label="Cédula del encargado" required><TextInput value={form.tutor_cedula} onChange={v=>setForm({tutor_cedula:v})} /></Field>
      <Field label="Teléfono del encargado" required><TextInput inputMode="tel" value={form.tutor_tel} onChange={v=>setForm({tutor_tel:v})} /></Field>
      <Field label="Correo del encargado"><TextInput type="email" value={form.tutor_correo} onChange={v=>setForm({tutor_correo:v})} /></Field>
    </div></div>}
    {err && <Alert type="error">{err}</Alert>}
    <div className="ins-actions"><button type="button" className="ins-btn ghost" onClick={()=>setStep(1)}>Atrás</button><button type="button" className="ins-btn primary" onClick={next}>Continuar</button></div>
  </section>;
}

function FinanceStep({form,setForm,setStep,selectedGroup,becas,asesores}){
  const propio = upper(form.financiamiento) === 'PROPIO';
  const conape = upper(form.financiamiento) === 'CONAPE';
  return <section className="ins-card ins-step-card">
    <div className="ins-card-head"><span>Paso 4</span><h2>Financiamiento y asesoría</h2><p>No se registra ningún pago desde este formulario. Solo dejamos tu camino marcado para admisiones.</p></div>
    <div className="ins-choice-grid">
      <button type="button" className={`ins-choice ${conape?'selected':''}`} onClick={()=>setForm({financiamiento:'CONAPE',beca:'',beca_propio:''})}><strong>CONAPE</strong><span>Solicitud de financiamiento y seguimiento de desembolso.</span></button>
      <button type="button" className={`ins-choice ${propio?'selected':''}`} onClick={()=>setForm({financiamiento:'PROPIO'})}><strong>Pago propio</strong><span>Coordinación directa de matrícula y cuotas.</span></button>
    </div>
    {conape && <div className="ins-subcard">
      <h3>Opciones CONAPE</h3>
      <div className="ins-grid two">
        <Field label="Equipo"><SelectInput value={form.conape_equipo} onChange={v=>setForm({conape_equipo:v})}><option value="NINGUNO">No incluir equipo</option><option value="LAPTOP">Solicitar laptop</option></SelectInput></Field>
        <Field label="Sostenimiento"><SelectInput value={form.conape_sostenimiento} onChange={v=>setForm({conape_sostenimiento:v})}><option value="NO">No solicitar</option><option value="SI">Solicitar sostenimiento</option></SelectInput></Field>
      </div>
      {selectedGroup?.toeic_disponible ? <label className="ins-check"><input type="checkbox" checked={!!form.conape_toeic} onChange={e=>setForm({conape_toeic:e.target.checked, conape_toeic_monto:selectedGroup.toeic_monto || 0, toeic_monto:selectedGroup.toeic_monto || 0})} /><span>Incluir certificación TOEIC en la solicitud {selectedGroup.toeic_monto ? `(${fmtMoney(selectedGroup.toeic_monto)})` : ''}</span></label> : <Alert>Este grupo no tiene TOEIC marcado como disponible.</Alert>}
    </div>}
    {propio && <div className="ins-subcard">
      <h3>Beca o promoción</h3>
      <Field label="Beca solicitada"><SelectInput value={form.beca || form.beca_propio} onChange={v=>setForm({beca:v,beca_propio:v})}><option value="">Sin beca</option>{becas.map(b=><option key={b.id || b.nombre} value={b.id || b.nombre}>{b.nombre || b.id} {b.porcentaje ? `· ${b.porcentaje}%` : ''}</option>)}</SelectInput></Field>
      <small className="ins-muted">La beca queda solicitada. Admisiones debe revisarla; no se aprueba automáticamente.</small>
    </div>}
    <div className="ins-grid two">
      <Field label="¿Cómo se enteró?" required><SelectInput value={form.como_entero} onChange={v=>setForm({como_entero:v})}><option value="">Seleccionar</option><option>Facebook / Instagram</option><option>WhatsApp</option><option>Recomendación</option><option>CONAPE</option><option>Google</option><option>Otro</option></SelectInput></Field>
      <Field label="Asesor de referencia"><SelectInput value={form.asesor_ref} onChange={v=>setForm({asesor_ref:v})}><option value="">Sin asesor específico</option>{asesores.map(a=><option key={a.cedula || a.nombre} value={a.nombre}>{a.nombre}</option>)}</SelectInput></Field>
    </div>
    <Field label="Conocimientos previos de inglés"><TextArea rows="3" value={form.conocimientos_previos} onChange={v=>setForm({conocimientos_previos:v})} placeholder="Ejemplo: nunca he estudiado, básico, estudié en colegio, quiero prueba de ubicación…" /></Field>
    {selectedGroup?.estado_cupo === 'LISTA_ESPERA' && <label className="ins-check danger"><input type="checkbox" checked={!!form.aceptar_lista_espera} onChange={e=>setForm({aceptar_lista_espera:e.target.checked})} /><span>Acepto quedar en lista de espera para este grupo si admisiones confirma que no hay cupo inmediato.</span></label>}
    <div className="ins-actions"><button type="button" className="ins-btn ghost" onClick={()=>setStep(2)}>Atrás</button><button type="button" className="ins-btn primary" onClick={()=>setStep(4)}>Continuar</button></div>
  </section>;
}

function DocsStep({form,setForm,setStep}){
  return <section className="ins-card ins-step-card">
    <div className="ins-card-head"><span>Paso 5</span><h2>Documentos iniciales</h2><p>Podés subirlos ahora para acelerar admisiones. Si no los tenés a mano, el asesor te los pedirá después.</p></div>
    <div className="ins-upload-grid">
      <FilePhoto label="Foto cédula frente" value={form.foto_ced_frente} onChange={v=>setForm({foto_ced_frente:v})} />
      <FilePhoto label="Foto cédula dorso" value={form.foto_ced_dorso} onChange={v=>setForm({foto_ced_dorso:v})} />
      <FilePhoto label="Foto título / último grado" value={form.foto_titulo} onChange={v=>setForm({foto_titulo:v})} />
    </div>
    <Alert>Las imágenes se guardan como soporte de inscripción. No activan matrícula por sí solas.</Alert>
    <div className="ins-actions"><button type="button" className="ins-btn ghost" onClick={()=>setStep(3)}>Atrás</button><button type="button" className="ins-btn primary" onClick={()=>setStep(5)}>Ver resumen</button></div>
  </section>;
}

function SummaryRow({label,value}){ return <div className="ins-summary-row"><span>{label}</span><strong>{optionLabel(value)}</strong></div>; }

function ReviewStep({form,selectedGroup,setStep,onSubmit,submitting,error}){
  const conape = upper(form.financiamiento)==='CONAPE';
  const wait = selectedGroup?.estado_cupo === 'LISTA_ESPERA';
  const canSubmit = !wait || form.aceptar_lista_espera;
  return <section className="ins-card ins-step-card">
    <div className="ins-card-head"><span>Paso 6</span><h2>Revisá antes de enviar</h2><p>Al enviar se crea una solicitud de prematrícula. No es matrícula activa todavía.</p></div>
    <div className="ins-review-grid">
      <div className="ins-review-panel"><h3>Estudiante</h3><SummaryRow label="Nombre" value={form.nombre}/><SummaryRow label="Cédula" value={form.cedula}/><SummaryRow label="Correo" value={form.correo}/><SummaryRow label="WhatsApp" value={form.whatsapp}/></div>
      <div className="ins-review-panel"><h3>Grupo</h3><SummaryRow label="Nivel" value={selectedGroup?.nivel}/><SummaryRow label="Horario" value={`${selectedGroup?.dias_label || ''} · ${selectedGroup?.hora_label || ''}`}/><SummaryRow label="Inicio" value={selectedGroup?.fecha_inicio_label}/><SummaryRow label="Código" value={selectedGroup?.codigo}/></div>
      <div className="ins-review-panel"><h3>Financiamiento</h3><SummaryRow label="Tipo" value={form.financiamiento}/>{conape && <SummaryRow label="Equipo" value={form.conape_equipo}/>} {conape && <SummaryRow label="TOEIC" value={form.conape_toeic?'Solicitado':'No solicitado'}/>} {!conape && <SummaryRow label="Beca" value={form.beca || 'Sin beca'}/>}</div>
    </div>
    <div className="ins-legal"><strong>Importante:</strong> esta solicitud queda para revisión de admisiones. La matrícula se confirma cuando el proceso quede validado.</div>
    {!canSubmit && <Alert type="error">Este grupo está en lista de espera. Marcá la aceptación en el paso anterior o elegí otro grupo.</Alert>}
    {error && <Alert type="error">{error}</Alert>}
    <div className="ins-actions"><button type="button" className="ins-btn ghost" onClick={()=>setStep(4)}>Atrás</button><button type="button" className="ins-btn primary" onClick={onSubmit} disabled={submitting || !canSubmit}>{submitting?'Enviando…':'Enviar solicitud'}</button></div>
  </section>;
}

function SuccessTicket({result,form,selectedGroup}){
  const conape = upper(form.financiamiento)==='CONAPE';
  return <section className="ins-success">
    <div className="ins-ticket">
      <span>Solicitud recibida</span>
      <h2>{first(form.nombre)}, tu prematrícula quedó registrada.</h2>
      <p>{result?.mensaje || (conape ? 'Admisiones revisará tu solicitud CONAPE.' : 'Admisiones coordinará el pago de matrícula.')}</p>
      <div className="ins-ticket-grid">
        <SummaryRow label="Usuario Campus" value={form.cedula}/>
        <SummaryRow label="Clave" value="La que acabás de elegir"/>
        <SummaryRow label="Grupo tentativo" value={selectedGroup?.codigo}/>
        <SummaryRow label="Horario" value={`${selectedGroup?.dias_label || ''} · ${selectedGroup?.hora_label || ''}`}/>
        <SummaryRow label="Estado inicial" value={result?.estado || (conape?'PENDIENTE_CONAPE':'PENDIENTE_PAGO')}/>
        <SummaryRow label="Financiamiento" value={form.financiamiento}/>
      </div>
      <div className="ins-success-actions">
        <a className="ins-btn primary" href="campus.html">Entrar al portal</a>
        <button type="button" className="ins-btn ghost" onClick={()=>window.print()}>Guardar comprobante</button>
      </div>
    </div>
    <Timeline active={0}/>
    <Alert>Al entrar al portal podrás dar seguimiento a tu solicitud. Tu curso se habilita cuando admisiones confirme la matrícula.</Alert>
  </section>;
}

function Timeline({active=0}){
  const items = ['Solicitud recibida','Validación de datos','Documentos / pago / CONAPE','Activación de matrícula','Acceso completo al Campus'];
  return <div className="ins-timeline">{items.map((t,i)=><div key={t} className={`${i<active?'done':''} ${i===active?'active':''}`}><b>{i<active?'✓':i+1}</b><span>{t}</span></div>)}</div>;
}

function NextStepsBlock(){
  return <section className="ins-play" id="siguiente-paso">
    <div className="ins-play-copy">
      <span>Siguiente paso</span>
      <h2>Completá la solicitud y admisiones te guía.</h2>
      <p>Después de enviar el formulario podrás entrar al portal de prematrícula para revisar tu información y continuar el proceso.</p>
    </div>
    <div className="ins-play-cards">
      <article><b>1</b><strong>Solicitud</strong><small>Dejás tus datos y elegís grupo.</small></article>
      <article><b>2</b><strong>Revisión</strong><small>Admisiones valida la información.</small></article>
      <article><b>3</b><strong>Activación</strong><small>Se confirma matrícula y acceso completo.</small></article>
    </div>
  </section>;
}

function LoadingPage(){ return <main className="ins-page"><div className="ins-loading"><span></span><h1>Cargando inscripción…</h1><p>Preparando grupos, becas y configuración pública.</p></div></main>; }

function InscripcionApp(){
  const [config,setConfig]=React.useState(null);
  const [groups,setGroups]=React.useState([]);
  const [becas,setBecas]=React.useState([]);
  const [asesores,setAsesores]=React.useState([]);
  const [loading,setLoading]=React.useState(true);
  const [groupsLoading,setGroupsLoading]=React.useState(true);
  const [groupsError,setGroupsError]=React.useState('');
  const [globalError,setGlobalError]=React.useState('');
  const [step,setStep]=React.useState(0);
  const [form,setForm]=useDraft(INITIAL_FORM);
  const [cedulaStatus,setCedulaStatus]=React.useState(null);
  const [selectedGroup,setSelectedGroup]=React.useState(null);
  const [padronName,setPadronName]=React.useState('');
  const [submitting,setSubmitting]=React.useState(false);
  const [submitError,setSubmitError]=React.useState('');
  const [success,setSuccess]=React.useState(null);

  const reloadGroups = React.useCallback(async()=>{
    setGroupsLoading(true); setGroupsError('');
    try{
      const r = await insPost('getGruposDisponibles', {});
      const list = (Array.isArray(r.grupos) ? r.grupos : []).map(normalizeGroup);
      setGroups(list);
      if(form.grupo_tentativo && !selectedGroup){
        const found = list.find(g=>g.codigo === form.grupo_tentativo);
        if(found) setSelectedGroup(found);
      }
    }catch(e){ setGroupsError(e.message); }
    finally{ setGroupsLoading(false); }
  },[form.grupo_tentativo, selectedGroup]);

  React.useEffect(()=>{
    let mounted=true;
    async function load(){
      setLoading(true); setGlobalError('');
      try{
        const [cfg,ases,bec] = await Promise.allSettled([
          insPost('getInscripcionPublicConfig', {}),
          insPost('getAsesoresActivos', {}),
          insPost('getBecasDisponibles', {})
        ]);
        if(!mounted) return;
        if(cfg.status==='fulfilled') setConfig(cfg.value.config || {});
        if(ases.status==='fulfilled') setAsesores(Array.isArray(ases.value.asesores)?ases.value.asesores:[]);
        if(bec.status==='fulfilled') setBecas(Array.isArray(bec.value.becas)?bec.value.becas:[]);
        await reloadGroups();
      }catch(e){ if(mounted) setGlobalError(e.message); }
      finally{ if(mounted) setLoading(false); }
    }
    load();
    return ()=>{ mounted=false; };
  },[]);

  function scrollToForm(){ document.getElementById('inscripcion-form')?.scrollIntoView({behavior:'smooth', block:'start'}); }

  function validateBeforeSubmit(){
    if(!cedulaStatus?.puedeContinuar) return 'Primero verificá la cédula.';
    if(!selectedGroup?.codigo) return 'Seleccioná un grupo.';
    if(!clean(form.nombre) || !clean(form.cedula) || !clean(form.clave)) return 'Faltan nombre, cédula o clave.';
    if(!clean(form.correo) || !clean(form.whatsapp)) return 'Faltan correo o WhatsApp.';
    if(selectedGroup.estado_cupo === 'LISTA_ESPERA' && !form.aceptar_lista_espera) return 'Debés aceptar lista de espera o elegir otro grupo.';
    return '';
  }

  async function submit(){
    const msg = validateBeforeSubmit();
    if(msg){ setSubmitError(msg); return; }
    setSubmitting(true); setSubmitError('');
    try{
      const payload = {
        ...form,
        cedula: cedClean(form.cedula),
        nombre: upper(form.nombre),
        correo: clean(form.correo).toLowerCase(),
        whatsapp: clean(form.whatsapp),
        telefono: clean(form.telefono),
        tipo_id: form.tipo_id,
        programa: selectedGroup.programa || form.programa,
        modalidad: selectedGroup.modalidad || form.modalidad,
        grupo_tentativo: selectedGroup.codigo,
        conape_toeic: !!form.conape_toeic,
        conape_toeic_monto: form.conape_toeic ? (selectedGroup.toeic_monto || form.conape_toeic_monto || 0) : 0,
        toeic_monto: form.conape_toeic ? (selectedGroup.toeic_monto || form.toeic_monto || 0) : 0,
        aceptar_lista_espera: !!form.aceptar_lista_espera,
        origen_web: 'INSCRIPCION_PUBLICA_IP3A',
        version_frontend: INS_VERSION
      };
      const r = await insPost('crearInscripcionPublica', payload);
      setSuccess(r);
      try{ localStorage.removeItem(INS_STORAGE_KEY); }catch(_){ }
      window.scrollTo({top:0, behavior:'smooth'});
    }catch(e){ setSubmitError(e.message); }
    finally{ setSubmitting(false); }
  }

  if(loading && !config && groups.length===0) return <LoadingPage/>;

  return <main className="ins-page">
    <Header config={config} scrollToForm={scrollToForm}/>
    {globalError && <div className="ins-main"><Alert type="error">{globalError}</Alert></div>}
    {!success && <div className="ins-main">
      <Stepper step={step} />
      {step===0 && <CedulaStep form={form} setForm={setForm} cedulaStatus={cedulaStatus} setCedulaStatus={setCedulaStatus} setStep={setStep} setPadronName={setPadronName}/>} 
      {step===1 && <GroupStep groups={groups} loading={groupsLoading} error={groupsError} form={form} setForm={setForm} selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} setStep={setStep} reloadGroups={reloadGroups}/>} 
      {step===2 && <DatosStep form={form} setForm={setForm} setStep={setStep} padronName={padronName}/>} 
      {step===3 && <FinanceStep form={form} setForm={setForm} setStep={setStep} selectedGroup={selectedGroup} becas={becas} asesores={asesores}/>} 
      {step===4 && <DocsStep form={form} setForm={setForm} setStep={setStep}/>} 
      {step===5 && <ReviewStep form={form} selectedGroup={selectedGroup} setStep={setStep} onSubmit={submit} submitting={submitting} error={submitError}/>} 
    </div>}
    {success && <div className="ins-main"><SuccessTicket result={success} form={form} selectedGroup={selectedGroup}/></div>}
    <footer className="ins-footer">
      <strong>Academia Norteamericana</strong><span>Inglés Conversacional · Costa Rica</span><small>Tu solicitud será revisada por admisiones para confirmar el siguiente paso.</small>
    </footer>
  </main>;
}

ReactDOM.render(<InscripcionApp/>, document.getElementById('root'));
