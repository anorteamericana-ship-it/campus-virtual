/* global React, ReactDOM */
// F98.4-Z6-IP3I · becas desde CONFIG_BECAS
// Revisión orientada a experiencia comercial, guiado visual y mobile-first.

const INS_VERSION = 'F98.4-Z6-IP3I';
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
function first(v){ return clean(v).split(/\s+/)[0] || 'estudiante'; }
function isTruthy(v){ return v === true || String(v).trim().toUpperCase() === 'TRUE' || String(v).trim().toUpperCase() === 'SI' || String(v).trim() === '1'; }
function optionLabel(value, fallback){ return clean(value) || fallback || 'Por confirmar'; }
function onlyDigits(v){ return clean(v).replace(/\D/g,''); }
function fmtMoney(v){
  const n = Number(v || 0);
  if(!n) return 'Por confirmar';
  try { return new Intl.NumberFormat('es-CR',{style:'currency',currency:'CRC',maximumFractionDigits:0}).format(n); }
  catch(_){ return '₡' + Math.round(n).toLocaleString('es-CR'); }
}
function fmtMoneyShort(v){
  const n = Number(v || 0);
  if(!n) return 'Sin costo adicional';
  return fmtMoney(n);
}
function conapeToeicAmount(group, form){
  const n = Number(group?.toeic_monto || form?.toeic_monto || form?.conape_toeic_monto || 0);
  return n > 0 ? n : 137000;
}
const SOSTENIMIENTO_OPTIONS = [
  { value:'NO', label:'No solicito sostenimiento', amount:0 },
  { value:'10000', label:'Sí solicito ₡10.000 mensuales', amount:10000 },
  { value:'20000', label:'Sí solicito ₡20.000 mensuales', amount:20000 },
  { value:'30000', label:'Sí solicito ₡30.000 mensuales', amount:30000 },
  { value:'40000', label:'Sí solicito ₡40.000 mensuales', amount:40000 },
  { value:'50000', label:'Sí solicito ₡50.000 mensuales', amount:50000 },
  { value:'60000', label:'Sí solicito ₡60.000 mensuales', amount:60000 }
];
const CONAPE_EQUIPO_OPTIONS = [
  { value:'LAPTOP_319', label:'Financia tu equipo 319', amount:319000, img:'assets/inscripcion/financia_equipo_319.png' },
  { value:'LAPTOP_360', label:'Financia tu equipo 360', amount:360000, img:'assets/inscripcion/financia_equipo_360.png' }
];
function conapeEquipoLabel(v){
  const found = CONAPE_EQUIPO_OPTIONS.find(o => o.value === upper(v));
  if(found) return `${found.label} · ${fmtMoney(found.amount)}`;
  if(upper(v) === 'LAPTOP') return 'Laptop solicitada';
  return 'No solicitada';
}
function isConapeEquipoSelected(v){
  const k = upper(v);
  return k === 'LAPTOP' || k === 'LAPTOP_319' || k === 'LAPTOP_360';
}
function timeTo12h(v){
  const s = clean(v);
  if(!s) return '';
  const m = s.match(/(\d{1,2})(?::(\d{2}))?/);
  if(!m) return s;
  let h = Number(m[1]);
  const min = m[2] && m[2] !== '00' ? ':' + m[2] : '';
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}${min}${ap}`;
}
function rangeTo12h(inicio, fin){
  const a = timeTo12h(inicio);
  const b = timeTo12h(fin);
  return a && b ? `${a} a ${b}` : '';
}
function inferRangeFromCode(code){
  const c = upper(code);
  if(c.includes('18')) return '6pm a 9pm';
  if(c.includes('69')) return '6pm a 9pm';
  if(c.includes('94')) return '9am a 12pm';
  if(c.includes('SA')) return '9am a 4pm';
  return '';
}
function normalizeHorarioFromGroup(g){
  const inicio = clean(g.hora_inicio || g.HORA_INICIO || g.col_l || g.L || '');
  const fin = clean(g.hora_fin || g.HORA_FIN || g.col_m || g.M || '');
  const range = rangeTo12h(inicio, fin);
  if(range) return range;
  const direct = clean(g.hora_label || g.hora || g.HORA || '');
  if(direct && !/lunes|martes|miercoles|miércoles|jueves|viernes|sábado|sabado|domingo|lun|mar|mie|mié|jue|vie|sab|dom/i.test(direct)){
    return simplifyTimeLabel(direct);
  }
  return inferRangeFromCode(g.codigo || g.code || '');
}
function becaKey(v){
  return upper(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
}
function conapeSostenimientoLabel(v){
  const k = clean(v);
  const found = SOSTENIMIENTO_OPTIONS.find(o => o.value === k);
  if(found) return found.label;
  if(upper(v) === 'SI') return 'Solicitado';
  return 'No solicitado';
}
function isSostenimientoSelected(v){
  const k = clean(v);
  return k !== '' && k !== 'NO';
}
function paymentLabel(v){
  return upper(v) === 'CONAPE' ? 'Financiado por CONAPE' : 'BECA con la Academia';
}
const ENGLISH_EXPERIENCE_OPTIONS = [
  'Nunca he llevado un curso o practicado el ingles',
  'Tengo el ingles básico del colegio',
  'He matriculado antes un curso de ingles, pero no aprendí nada',
  'Tengo conocimientos suficientes para aplicar prueba de ubicación'
];
function formatPercent(v){
  const n = Number(v || 0);
  if(!n) return '';
  const pct = n > 0 && n <= 1 ? n * 100 : n;
  const rounded = Math.round(pct * 100) / 100;
  return String(Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(2)).replace(/\.00$/,'').replace(/(\.[1-9]*)0+$/,'$1') + '%';
}
function simplifyTimeLabel(v){
  const raw = clean(v).toLowerCase();
  if(!raw) return 'Horario por confirmar';
  return raw
    .replace(/\./g,'')
    .replace(/\s+/g,' ')
    .replace(/:00/g,'')
    .replace(/ a m/g,'am')
    .replace(/ p m/g,'pm')
    .replace(/a\.m\.?/g,'am')
    .replace(/p\.m\.?/g,'pm')
    .replace(/am /g,'am ')
    .replace(/pm /g,'pm ')
    .replace(/^\s+|\s+$/g,'');
}
function toShortDayLabel(v){
  const raw = upper(v)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,' ');
  const map = {
    'LUNES Y MIERCOLES':'LUN/MIE',
    'LUNES Y MIERCOLES ':'LUN/MIE',
    'LUNES / MIERCOLES':'LUN/MIE',
    'LUNES Y JUEVES':'LUN/JUE',
    'MARTES Y JUEVES':'MAR/JUE',
    'LUNES MARTES MIERCOLES Y JUEVES':'LUN-JUE',
    'LUNES, MARTES, MIERCOLES Y JUEVES':'LUN-JUE',
    'LUNES A JUEVES':'LUN-JUE',
    'SABADO':'SAB',
    'MIERCOLES Y VIERNES':'MIE/VIE',
    'LUNES Y VIERNES':'LUN/VIE',
    'MARTES Y VIERNES':'MAR/VIE',
    'DOMINGO':'DOM'
  };
  return map[raw] || clean(v) || 'Horario';
}
function formatScheduleShort(group){
  return `${toShortDayLabel(group?.dias_label)} ${simplifyTimeLabel(group?.hora_label)}`.trim();
}
function normalizeDateLabel(v){
  const raw = clean(v);
  return raw || 'Por confirmar';
}
function levelOrderKey(levelId){
  const key = upper(levelId);
  if(key.includes('B1')) return 1;
  if(key.includes('B2')) return 2;
  if(key.includes('I1')) return 3;
  if(key.includes('I2')) return 4;
  return 99;
}
function levelClass(g){
  const k = upper(g?.nivelId || g?.nivel || '');
  if(k.includes('B2') || k.includes('BÁSICO II') || k.includes('BASICO II')) return 'lvl-b2';
  if(k.includes('I1') || k.includes('INTERMEDIO I')) return 'lvl-i1';
  if(k.includes('I2') || k.includes('INTERMEDIO II')) return 'lvl-i2';
  return 'lvl-b1';
}
function modalityKey(group){
  const raw = upper(group?.modalidad || group?.modalidad_label || '');
  if(raw.includes('SUPER')) return 'SUPERINTENSIVO';
  if(raw.includes('INTENSIVO')) return 'INTENSIVO';
  if(raw.includes('LUNES') || raw.includes('MARTES')) return 'INTENSIVO';
  return 'INTENSIVO';
}
function groupStatusLabel(g){
  return upper(g?.estado_cupo) === 'LISTA_ESPERA' ? 'Lista de espera' : 'Disponible';
}

const COURSE_TYPES = [
  {
    key:'INTENSIVO',
    title:'Curso intensivo',
    subtitle:'2 días por semana',
    detail:'Ideal si querés avanzar con horario regular en la noche o sábado.',
    badge:'6 horas semanales',
    icon:'⚡'
  },
  {
    key:'SUPERINTENSIVO',
    title:'Curso súper intensivo',
    subtitle:'4 días por semana',
    detail:'Para avanzar más rápido con mayor práctica semanal.',
    badge:'12 horas semanales',
    icon:'🚀'
  }
];

const LOCATION_DATA = {
  'San José':['San José','Escazú','Desamparados','Puriscal','Tarrazú','Aserrí','Mora','Goicoechea','Santa Ana','Alajuelita','Vázquez de Coronado','Acosta','Tibás','Moravia','Montes de Oca','Turrubares','Dota','Curridabat','Pérez Zeledón','León Cortés Castro'],
  'Alajuela':['Alajuela','San Ramón','Grecia','San Mateo','Atenas','Naranjo','Palmares','Poás','Orotina','San Carlos','Zarcero','Sarchí','Upala','Los Chiles','Guatuso','Río Cuarto'],
  'Cartago':['Cartago','Paraíso','La Unión','Jiménez','Turrialba','Alvarado','Oreamuno','El Guarco'],
  'Heredia':['Heredia','Barva','Santo Domingo','Santa Bárbara','San Rafael','San Isidro','Belén','Flores','San Pablo','Sarapiquí'],
  'Guanacaste':['Liberia','Nicoya','Santa Cruz','Bagaces','Carrillo','Cañas','Abangares','Tilarán','Nandayure','La Cruz','Hojancha'],
  'Puntarenas':['Puntarenas','Esparza','Buenos Aires','Montes de Oro','Osa','Quepos','Golfito','Coto Brus','Parrita','Corredores','Garabito','Monteverde','Puerto Jiménez'],
  'Limón':['Limón','Pococí','Siquirres','Talamanca','Matina','Guácimo']
};

const GENERIC_DISTRICTS = ['Central','San José','San Juan','San Rafael','San Pedro','Mercedes','Concepción','San Antonio','San Isidro','Guadalupe','San Francisco','Otro'];

function districtOptionsFor(canton){
  const base = canton ? [canton, 'Central'] : [];
  return Array.from(new Set(base.concat(GENERIC_DISTRICTS)));
}

function normalizeBeca(raw){
  if(!raw) return null;
  const name = clean(raw.nombre || raw.NOMBRE || raw.id || raw.ID);
  if(!name) return null;
  const key = becaKey(name);
  const pctRaw = raw.porcentaje_publico ?? raw.PORCENTAJE_PUBLICO ?? raw.pct_cuota ?? raw.PCT_CUOTA ?? raw.pct_matricula ?? raw.PCT_MATRICULA ?? raw.porcentaje ?? raw.PORCENTAJE ?? raw.pct_total ?? raw.PCT_TOTAL ?? 0;
  const pct = formatPercent(pctRaw);
  const cupo = Number(raw.cupo_disponible ?? raw.CUPO_DISPONIBLE ?? 0);
  const activa = raw.activa === undefined ? true : !!raw.activa;
  const visible = raw.visible_inscripcion === undefined ? true : !!raw.visible_inscripcion;
  const disponibleRaw = raw.disponible;
  const disponible = disponibleRaw === undefined ? (activa && visible && (cupo > 0 || Number(raw.cupo_total || 0) === 0)) : !!disponibleRaw;
  const defaults = {};
  const def = defaults[key] || {};
  return {
    id: clean(raw.id || raw.ID || name).toUpperCase(),
    key,
    nombre: key === 'BECA_IMPACTA' ? 'BECA IMPACTA' : (key === 'BECA_MUJER' ? 'BECA MUJER' : name),
    porcentaje: pct || '',
    cupo_disponible: cupo,
    disponible,
    descripcion: clean(raw.descripcion || raw.DESCRIPCION || '')
  };
}

function normalizeGroup(g){
  const code = clean(g.code || g.codigo || g.cod || g.CODIGO_GRUPO);
  const nivelId = clean(g.nivelId || g.nivel_id || g.NIVEL_ID || '');
  const modalidad = clean(g.modalidad || '');
  const horaLabel = normalizeHorarioFromGroup(g);
  const diasLabel = clean(g.dias_label || g.dias || g.dias_raw || '');
  const group = {
    ...g,
    code,
    codigo: code,
    nivel: clean(g.nivel || g.nivel_label || nivelId || 'Grupo disponible'),
    nivelId,
    programa: upper(g.programa || 'INA'),
    modalidad,
    modalidad_key: modalityKey(g),
    modalidad_label: clean(g.modalidad_label || modalidad || 'Modalidad por confirmar'),
    dias_label: diasLabel,
    dias_short: toShortDayLabel(diasLabel),
    hora_label: horaLabel,
    hora_short: simplifyTimeLabel(horaLabel),
    schedule_short: `${toShortDayLabel(diasLabel)} ${simplifyTimeLabel(horaLabel)}`.trim(),
    fecha_inicio_label: normalizeDateLabel(g.fecha_inicio_label || g.fecha_inicio),
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
  return group;
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
  sexo:'', provincia:'', canton:'', distrito:'', distrito_otro:'', direccion:'', fecha_nac:'', es_menor:false,
  tutor_nombre:'', tutor_cedula:'', tutor_correo:'', tutor_tel:'',
  programa:'INA', modalidad:'', financiamiento:'CONAPE', beca:'', beca_propio:'',
  grupo_tentativo:'', conape_equipo:'NINGUNO', conape_toeic:false, conape_toeic_monto:0, toeic_monto:0,
  conape_sostenimiento:'NO', como_entero:'', asesor_ref:'', conocimientos_previos:'', aceptar_lista_espera:false,
  foto_ced_frente:'', foto_ced_dorso:'', foto_titulo:''
};

const STEPS = [
  ['cedula','Cédula'], ['grupo','Curso y horario'], ['datos','Datos'], ['finanzas','Opciones de pago'], ['docs','Documentos'], ['resumen','Resumen']
];

function Header({scrollToForm}){
  return <header className="ins-hero ins-hero-compact">
    <nav className="ins-topbar" aria-label="Encabezado">
      <div className="ins-brand">
        <div className="ins-brand-mark">AN</div>
        <div><strong>Academia Norteamericana</strong><span>Inglés Conversacional · Costa Rica</span></div>
      </div>
      <div className="ins-top-actions">
        <button type="button" className="ins-top-link ins-top-button" onClick={scrollToForm}>Iniciar solicitud</button>
        <a className="ins-top-link" href="campus.html">Ya tengo acceso</a>
      </div>
    </nav>
  </header>;
}

function Stepper({step}){
  return <div className="ins-stepper" aria-label="Progreso del formulario">
    {STEPS.map((s,i)=><div key={s[0]} className={`ins-step ${i===step?'active':''} ${i<step?'done':''}`}>
      <b>{i<step?'✓':i+1}</b><span>{s[1]}</span>
    </div>)}
  </div>;
}

function Alert({type='info', children}){ return <div className={`ins-alert ${type}`} role={type==='error'?'alert':'status'}>{children}</div>; }
function Field({label, children, hint, required}){ return <label className="ins-field"><span>{label}{required && <em>*</em>}</span>{children}{hint && <small>{hint}</small>}</label>; }
function TextInput({value,onChange, ...props}){ return <input {...props} value={value || ''} onChange={e=>onChange(e.target.value)} />; }
function SelectInput({value,onChange,children,...props}){ return <select {...props} value={value || ''} onChange={e=>onChange(e.target.value)}>{children}</select>; }
function TextArea({value,onChange,...props}){ return <textarea {...props} value={value || ''} onChange={e=>onChange(e.target.value)} />; }

function FilePhoto({label, value, onChange, hint}){
  const [busy,setBusy]=React.useState(false);
  const [name,setName]=React.useState('');
  const [err,setErr]=React.useState('');
  async function handleFile(file){
    setErr(''); setName('');
    if(!file){ onChange(''); return; }
    if(!/^image\//.test(file.type || '')){ setErr('Subí una imagen JPG o PNG tomada con el celular.'); return; }
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
      <span>{value ? 'Documento cargado' : label}</span>
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
            setForm(prev=>({...prev, nombre: pad.nombre || prev.nombre}));
          }
        }catch(_){ }
        setStep(1);
      }
    }catch(e){ setErr(e.message); }
    finally{ setBusy(false); }
  }
  const motivo = upper(cedulaStatus?.motivo);
  return <section className="ins-card ins-step-card" id="inscripcion-form">
    <div className="ins-card-head"><span>Paso 1</span><h2>Verificá tu identificación</h2><p>Antes de seguir comprobamos que no exista una matrícula o una solicitud activa con la misma cédula.</p></div>
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
    {cedulaStatus && cedulaStatus.puedeContinuar && <Alert type="ok">Identificación validada. Ahora elegí tu curso y horario.</Alert>}
    <div className="ins-actions right"><button type="button" className="ins-btn primary" onClick={verify} disabled={busy}>{busy?'Verificando…':'Verificar y continuar'}</button></div>
  </section>;
}

function CourseTypeCard({type,selected,count,onSelect}){
  return <button type="button" className={`ins-course-card ${selected?'selected':''}`} onClick={()=>onSelect(type.key)}>
    <div className="ins-course-head"><span>{type.icon}</span><b>{count || 0} horarios</b></div>
    <h3>{type.title}</h3>
    <p>{type.subtitle}</p>
    <small>{type.detail}</small>
    <strong>{type.badge}</strong>
  </button>;
}

function GroupCard({group,selected,onSelect}){
  const wait = group.estado_cupo === 'LISTA_ESPERA';
  return <button type="button" className={`ins-group-card ${levelClass(group)} ${selected?'selected':''}`} onClick={()=>onSelect(group)}>
    <div className="ins-group-top"><span>{group.nivel}</span><b>{groupStatusLabel(group)}</b></div>
    <h3>{group.schedule_short || formatScheduleShort(group)}</h3>
    <p>{group.modalidad_label}</p>
    <dl>
      <div><dt>Inicio</dt><dd>{group.fecha_inicio_label}</dd></div>
      <div><dt>Cupos</dt><dd>{group.cupo_disponible > 0 ? group.cupo_disponible : (wait?'Reserva':'Por confirmar')}</dd></div>
      <div><dt>Matrícula</dt><dd>{fmtMoney(group.precio_matricula)}</dd></div>
      <div><dt>Cuota</dt><dd>{fmtMoney(group.precio_cuota)}</dd></div>
    </dl>
    <small>Código: {group.codigo}</small>
  </button>;
}

function GroupStep({groups,loading,error,form,setForm,selectedGroup,setSelectedGroup,setStep,reloadGroups}){
  const [courseType,setCourseType]=React.useState(form.modalidad ? modalityKey({modalidad:form.modalidad}) : '');
  const counts = React.useMemo(()=>{
    const acc = {INTENSIVO:0, SUPERINTENSIVO:0};
    groups.forEach(g=>{ const key = modalityKey(g); acc[key] = (acc[key] || 0) + 1; });
    return acc;
  }, [groups]);
  const filtered = React.useMemo(()=>{
    const base = groups.filter(g=>!courseType || modalityKey(g) === courseType);
    return base.slice().sort((a,b)=>{
      const lv = levelOrderKey(a.nivelId || a.nivel) - levelOrderKey(b.nivelId || b.nivel);
      if(lv !== 0) return lv;
      return (a.schedule_short || '').localeCompare(b.schedule_short || '');
    });
  }, [groups, courseType]);
  const grouped = React.useMemo(()=>{
    const map = {};
    filtered.forEach(g=>{
      const key = g.nivel || 'Grupo disponible';
      if(!map[key]) map[key] = [];
      map[key].push(g);
    });
    return map;
  }, [filtered]);

  function chooseCourseType(key){
    setCourseType(key);
    setForm({ modalidad: key === 'SUPERINTENSIVO' ? 'SUPERINTENSIVO' : 'INTENSIVO', grupo_tentativo:'' });
    if(selectedGroup && modalityKey(selectedGroup) !== key){
      setSelectedGroup(null);
    }
  }

  function chooseGroup(g){
    setSelectedGroup(g);
    setForm({
      grupo_tentativo:g.codigo,
      programa:g.programa || form.programa,
      modalidad:g.modalidad || courseType,
      conape_toeic:false,
      conape_toeic_monto:g.toeic_monto || 0,
      toeic_monto:g.toeic_monto || 0,
      aceptar_lista_espera: g.estado_cupo === 'DISPONIBLE' ? false : form.aceptar_lista_espera
    });
  }

  return <section className="ins-card ins-step-card">
    <div className="ins-card-head"><span>Paso 2</span><h2>Elegí tu curso y tu horario</h2><p>Primero elegí el tipo de curso. Después te mostramos únicamente los horarios disponibles para esa opción.</p></div>
    <div className="ins-course-grid">
      {COURSE_TYPES.map(type=><CourseTypeCard key={type.key} type={type} selected={courseType===type.key} count={counts[type.key]} onSelect={chooseCourseType} />)}
    </div>
    <div className="ins-group-toolbar">
      <div>
        <strong>{courseType ? COURSE_TYPES.find(t=>t.key===courseType)?.title : 'Seleccioná una modalidad'}</strong>
        <small>{courseType ? 'Ahora escogé uno de los horarios disponibles.' : 'Te recomendamos iniciar por aquí para encontrar el grupo correcto más rápido.'}</small>
      </div>
      <button type="button" className="ins-btn ghost compact" onClick={reloadGroups}>Actualizar horarios</button>
    </div>
    {loading && <div className="ins-skeleton-list"><span></span><span></span><span></span></div>}
    {error && <Alert type="error">{error}</Alert>}
    {!courseType && !loading && <Alert>Seleccioná uno de los dos tipos de curso para ver tus horarios disponibles.</Alert>}
    {!loading && !error && courseType && filtered.length===0 && <Alert>No encontramos horarios activos para esta modalidad. Probá la otra opción o actualizá la lista.</Alert>}
    {courseType && Object.keys(grouped).map(level=><div key={level} className="ins-level-block">
      <div className="ins-level-title"><span className={`ins-level-dot ${levelClass(grouped[level][0])}`}></span><strong>{level}</strong></div>
      <div className="ins-groups-grid">{grouped[level].map(g=><GroupCard key={g.codigo} group={g} selected={selectedGroup?.codigo===g.codigo} onSelect={chooseGroup} />)}</div>
    </div>)}
    {selectedGroup && <div className="ins-selected-box">
      <div><span>Horario seleccionado</span><strong>{selectedGroup.nivel} · {selectedGroup.schedule_short}</strong><small>Inicio {selectedGroup.fecha_inicio_label} · {groupStatusLabel(selectedGroup)}</small></div>
      <button type="button" className="ins-btn primary" onClick={()=>setStep(2)}>Continuar</button>
    </div>}
  </section>;
}

function DatosStep({form,setForm,setStep,padronName}){
  const [err,setErr]=React.useState('');
  const cantons = React.useMemo(()=> LOCATION_DATA[form.provincia] || [], [form.provincia]);
  const districtOptions = React.useMemo(()=> districtOptionsFor(form.canton), [form.canton]);

  function updateProvince(v){
    setForm({provincia:v, canton:'', distrito:'', distrito_otro:''});
  }
  function updateCanton(v){
    setForm({canton:v, distrito:'', distrito_otro:''});
  }
  function updateDistrict(v){
    setForm({distrito:v, distrito_otro: v==='Otro' ? form.distrito_otro : ''});
  }
  function next(){
    const missing=[];
    if(!clean(form.nombre)) missing.push('nombre completo');
    if(!clean(form.correo)) missing.push('correo electrónico');
    if(!clean(form.whatsapp)) missing.push('WhatsApp principal');
    if(!clean(form.fecha_nac)) missing.push('fecha de nacimiento');
    if(!clean(form.sexo)) missing.push('sexo');
    if(!clean(form.provincia)) missing.push('provincia');
    if(!clean(form.canton)) missing.push('cantón');
    if(!clean(form.distrito)) missing.push('distrito');
    if(upper(form.distrito)==='OTRO' && !clean(form.distrito_otro)) missing.push('detalle del distrito');
    if(!clean(form.direccion)) missing.push('dirección exacta');
    if(!clean(form.clave) || clean(form.clave).length < 4) missing.push('clave mínima de 4 caracteres');
    if(form.es_menor && (!clean(form.tutor_nombre) || !clean(form.tutor_cedula) || !clean(form.tutor_tel))) missing.push('datos del encargado');
    if(missing.length){ setErr('Falta completar: ' + missing.join(', ') + '.'); return; }
    setErr('');
    setStep(3);
  }

  return <section className="ins-card ins-step-card">
    <div className="ins-card-head"><span>Paso 3</span><h2>Datos personales</h2><p>Completá esta información para que admisiones pueda revisar y dar continuidad a tu solicitud.</p></div>
    {padronName && <Alert type="ok">Nombre encontrado en padrón: <strong>{padronName}</strong>. Podés ajustarlo si necesitás corregir mayúsculas o composición.</Alert>}
    <div className="ins-grid two">
      <Field label="Nombre completo" required><TextInput value={form.nombre} onChange={v=>setForm({nombre:v})} autoComplete="name" /></Field>
      <Field label="Correo electrónico" required><TextInput type="email" value={form.correo} onChange={v=>setForm({correo:v})} autoComplete="email" /></Field>
      <Field label="WhatsApp principal" required><TextInput inputMode="tel" value={form.whatsapp} onChange={v=>setForm({whatsapp:onlyDigits(v)})} autoComplete="tel" /></Field>
      <Field label="Teléfono adicional"><TextInput inputMode="tel" value={form.telefono} onChange={v=>setForm({telefono:onlyDigits(v)})} /></Field>
      <Field label="Fecha de nacimiento" required><TextInput type="date" value={form.fecha_nac} onChange={v=>setForm({fecha_nac:v})} /></Field>
      <Field label="Sexo" required><SelectInput value={form.sexo} onChange={v=>setForm({sexo:v})}><option value="">Seleccionar</option><option value="F">Femenino</option><option value="M">Masculino</option><option value="NO_INDICA">Prefiero no indicar</option></SelectInput></Field>
      <Field label="Provincia" required><SelectInput value={form.provincia} onChange={updateProvince}><option value="">Seleccionar</option>{Object.keys(LOCATION_DATA).map(p=><option key={p} value={p}>{p}</option>)}</SelectInput></Field>
      <Field label="Cantón" required><SelectInput value={form.canton} onChange={updateCanton} disabled={!form.provincia}><option value="">{form.provincia ? 'Seleccionar' : 'Primero elegí provincia'}</option>{cantons.map(c=><option key={c} value={c}>{c}</option>)}</SelectInput></Field>
      <Field label="Distrito" required><SelectInput value={form.distrito} onChange={updateDistrict} disabled={!form.canton}><option value="">{form.canton ? 'Seleccionar' : 'Primero elegí cantón'}</option>{districtOptions.map(d=><option key={d} value={d}>{d}</option>)}</SelectInput></Field>
      <Field label="Crea tu contraseña para ingresar al Campus virtual" required hint="La usarás con tu cédula para revisar tu solicitud."><TextInput type="password" value={form.clave} onChange={v=>setForm({clave:v})} autoComplete="new-password" /></Field>
    </div>
    {upper(form.distrito)==='OTRO' && <Field label="Escribí tu distrito" required><TextInput value={form.distrito_otro} onChange={v=>setForm({distrito_otro:v})} /></Field>}
    <Field label="Dirección exacta" required><TextArea rows="3" value={form.direccion} onChange={v=>setForm({direccion:v})} placeholder="Ejemplo: de la iglesia 200 norte y 50 este, casa blanca portón negro." /></Field>
    <label className="ins-check"><input type="checkbox" checked={!!form.es_menor} onChange={e=>setForm({es_menor:e.target.checked})} /><span>El estudiante es menor de edad</span></label>
    {form.es_menor && <div className="ins-subcard"><h3>Datos del encargado</h3><div className="ins-grid two">
      <Field label="Nombre del encargado" required><TextInput value={form.tutor_nombre} onChange={v=>setForm({tutor_nombre:v})} /></Field>
      <Field label="Cédula del encargado" required><TextInput value={form.tutor_cedula} onChange={v=>setForm({tutor_cedula:v})} /></Field>
      <Field label="Teléfono del encargado" required><TextInput inputMode="tel" value={form.tutor_tel} onChange={v=>setForm({tutor_tel:onlyDigits(v)})} /></Field>
      <Field label="Correo del encargado"><TextInput type="email" value={form.tutor_correo} onChange={v=>setForm({tutor_correo:v})} /></Field>
    </div></div>}
    {err && <Alert type="error">{err}</Alert>}
    <div className="ins-actions"><button type="button" className="ins-btn ghost" onClick={()=>setStep(1)}>Atrás</button><button type="button" className="ins-btn primary" onClick={next}>Continuar</button></div>
  </section>;
}

function ConapeOptionCard({kind,title,subtitle,price,selected,onClick,disabled,children}){
  function handleKey(e){
    if(disabled) return;
    if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      if(onClick) onClick(e);
    }
  }
  return <div role="button" tabIndex={disabled ? -1 : 0} aria-pressed={!!selected} aria-disabled={!!disabled} className={`ins-conape-card ${kind || ''} ${selected?'selected':''} ${disabled?'disabled':''}`} onClick={disabled ? undefined : onClick} onKeyDown={handleKey}>
    <div className="ins-conape-visual">
      <span className="ins-conape-img"></span>
      <b>{selected ? 'Seleccionado' : (disabled ? 'No disponible' : 'Opcional')}</b>
    </div>
    <div className="ins-conape-body">
      <h4>{title}</h4>
      <p>{subtitle}</p>
      {price && <strong>{price}</strong>}
      {children && <small onClick={e=>e.stopPropagation()}>{children}</small>}
    </div>
  </div>;
}

function BecaCard({beca,selected,onSelect,onUnavailable}){
  const disabled = beca && beca.disponible===false;
  const mujer = beca && beca.key === 'BECA_MUJER';
  function handleClick(){
    if(disabled){
      if(onUnavailable) onUnavailable(beca);
      return;
    }
    if(beca) onSelect(beca.id);
  }
  return <button type="button" className={`ins-beca-card ${mujer?'mujer':''} ${selected?'selected':''} ${disabled?'disabled':''}`} onClick={handleClick}>
    <div className="ins-beca-top"><span>{disabled ? 'Sin cupos' : 'Beca activa'}</span>{beca && <b>{beca.porcentaje || 'Por confirmar'}</b>}</div>
    <h4>{beca ? beca.nombre : ''}</h4>
    <small>{beca ? (beca.descripcion || 'Aplicación sujeta a revisión de admisiones.') : ''}</small>
  </button>;
}

function FinanceStep({form,setForm,setStep,selectedGroup,becas,asesores}){
  const [err,setErr]=React.useState('');
  const [becaNotice,setBecaNotice]=React.useState('');
  const propio = upper(form.financiamiento) === 'PROPIO';
  const conape = upper(form.financiamiento) === 'CONAPE';
  const becasActivas = (becas || []).filter(Boolean);
  const becasMap = {};
  becasActivas.forEach(b => { becasMap[b.key] = b; });
  const visibleBecas = ['BECA_IMPACTA','BECA_MUJER']
    .map(key => becasMap[key] || {
      id:key,
      key,
      nombre:key === 'BECA_IMPACTA' ? 'BECA IMPACTA' : 'BECA MUJER',
      porcentaje:'',
      descripcion:'Esta beca debe habilitarse desde Super Admin.',
      disponible:false
    });
  const toeicAmount = conapeToeicAmount(selectedGroup, form);
  const toeicAvailable = selectedGroup?.toeic_disponible || toeicAmount > 0;
  const laptopSelected = isConapeEquipoSelected(form.conape_equipo);
  const sostenimientoSelected = isSostenimientoSelected(form.conape_sostenimiento);

  function next(){
    const missing=[];
    if(!clean(form.financiamiento)) missing.push('opción de pago');
    if(propio && !clean(form.beca || form.beca_propio)) missing.push('beca seleccionada');
    if(!clean(form.como_entero)) missing.push('cómo se enteró');
    if(!clean(form.conocimientos_previos)) missing.push('experiencia con el inglés');
    if(selectedGroup?.estado_cupo === 'LISTA_ESPERA' && !form.aceptar_lista_espera) missing.push('aceptación de lista de espera');
    if(missing.length){ setErr('Falta completar: ' + missing.join(', ') + '.'); return; }
    setErr(''); setStep(4);
  }

  return <section className="ins-card ins-step-card">
    <div className="ins-card-head"><span>Paso 4</span><h2>Opciones de pago</h2><p>Elegí la opción que mejor se ajusta a tu proceso de ingreso.</p></div>
    <div className="ins-choice-grid finance-grid">
      <button type="button" className={`ins-choice finance academy-pay ${propio?'selected':''}`} onClick={()=>setForm({financiamiento:'PROPIO'})}><i>🎓</i><strong>BECA con la Academia</strong><span>Descuento en todas las mensualidades si cancelás por tus propios medios. Conservá tu beca aprobando cada nivel.</span></button>
      <button type="button" className={`ins-choice finance conape-pay ${conape?'selected':''}`} onClick={()=>setForm({financiamiento:'CONAPE',beca:'',beca_propio:''})}><i>🏦</i><strong>Financiado por CONAPE</strong><span>Financia el 100% del programa, laptop, internet y certificación internacional TOEIC.</span></button>
    </div>

    {conape && <div className="ins-subcard conape-panel">
      <div className="ins-conape-title">
        <div><h3>Opciones CONAPE</h3><p>Seleccioná lo que querés incluir en la propuesta. Admisiones valida condiciones, montos y disponibilidad antes de formalizar.</p></div>
        <span>{selectedGroup?.codigo || 'Grupo por confirmar'}</span>
      </div>
      <div className="ins-conape-grid">
        <div className={`ins-conape-card laptop ${laptopSelected?'selected':''}`}>
          <div className="ins-conape-visual"><b>{laptopSelected ? 'Seleccionado' : 'Elegí paquete'}</b></div>
          <div className="ins-conape-body">
            <h4>Laptop</h4>
            <p>Seleccioná en grande el paquete de equipo que querés incluir en la propuesta.</p>
            <div className="ins-laptop-pick-grid">
              {CONAPE_EQUIPO_OPTIONS.map(opt=><button type="button" key={opt.value} className={`ins-laptop-pick ${upper(form.conape_equipo)===opt.value?'selected':''}`} onClick={()=>setForm({conape_equipo:opt.value})}>
                <span className="ins-green-check">✓</span>
                <img src={opt.img} alt={opt.label} />
              </button>)}
            </div>
            <small>El paquete elegido queda guardado en PROSPECTOS para distinguir la factura.</small>
          </div>
        </div>

        <ConapeOptionCard
          kind="sostenimiento"
          title="Sostenimiento"
          subtitle={sostenimientoSelected ? conapeSostenimientoLabel(form.conape_sostenimiento) : 'Apoyo adicional sujeto a requisitos y aprobación.'}
          price="De ₡10.000 a ₡60.000 mensuales"
          selected={sostenimientoSelected}
          onClick={()=>setForm({conape_sostenimiento:sostenimientoSelected?'NO':'10000'})}
        >
          <label className="ins-inline-select" onClick={e=>e.stopPropagation()}>
            <span>Elegí una opción</span>
            <select value={form.conape_sostenimiento || 'NO'} onChange={e=>setForm({conape_sostenimiento:e.target.value})}>
              {SOSTENIMIENTO_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          No se aprueba automáticamente desde este formulario.
        </ConapeOptionCard>

        <ConapeOptionCard
          kind="toeic"
          title="Certificación TOEIC"
          subtitle={toeicAvailable ? 'Monto tomado del grupo seleccionado.' : 'Este grupo no tiene TOEIC marcado como disponible.'}
          price={toeicAvailable ? fmtMoney(toeicAmount) : 'No disponible'}
          selected={!!form.conape_toeic}
          disabled={!toeicAvailable}
          onClick={()=> toeicAvailable && setForm({
            conape_toeic:!form.conape_toeic,
            conape_toeic_monto:!form.conape_toeic ? toeicAmount : 0,
            toeic_monto:!form.conape_toeic ? toeicAmount : 0
          })}
        >
          Si el grupo trae un monto específico, se usa ese dato. Si no, se muestra el monto vigente de referencia.
        </ConapeOptionCard>
      </div>
      <Alert>Estas opciones quedan como solicitud inicial. La propuesta final se confirma con admisiones antes de formalizar el proceso.</Alert>
    </div>}

    {propio && <div className="ins-subcard">
      <h3>Becas activas</h3>
      <div className="ins-beca-grid">
        {visibleBecas.map(b=><BecaCard key={b.id || b.nombre} beca={b} selected={(form.beca || form.beca_propio) === b.id} onSelect={id=>{setBecaNotice('');setForm({beca:id,beca_propio:id});}} onUnavailable={()=>setBecaNotice('Esta beca se encuentra sin cupos disponibles')} />)}
      </div>
      {becaNotice && <Alert type="error">{becaNotice}</Alert>}
      {!clean(form.beca || form.beca_propio) && <Alert>Seleccioná la beca que querés solicitar antes de continuar.</Alert>}
    </div>}

    <div className="ins-grid two">
      <Field label="¿Cómo se enteró?" required><SelectInput value={form.como_entero} onChange={v=>setForm({como_entero:v})}><option value="">Seleccionar</option><option>Facebook / Instagram</option><option>WhatsApp</option><option>Recomendación</option><option>CONAPE</option><option>Google</option><option>Otro</option></SelectInput></Field>
      <Field label="Asesor de referencia"><SelectInput value={form.asesor_ref} onChange={v=>setForm({asesor_ref:v})}><option value="">Sin asesor específico</option>{asesores.map(a=><option key={a.cedula || a.nombre} value={a.nombre}>{a.nombre}</option>)}</SelectInput></Field>
    </div>
    <Field label="Contanos tu experiencia con el ingles" required>
      <SelectInput value={form.conocimientos_previos} onChange={v=>setForm({conocimientos_previos:v})}>
        <option value="">Seleccionar</option>
        {ENGLISH_EXPERIENCE_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
      </SelectInput>
    </Field>
    {selectedGroup?.estado_cupo === 'LISTA_ESPERA' && <label className="ins-check danger"><input type="checkbox" checked={!!form.aceptar_lista_espera} onChange={e=>setForm({aceptar_lista_espera:e.target.checked})} /><span>Acepto quedar en lista de espera para este horario si no hay cupo inmediato.</span></label>}
    {err && <Alert type="error">{err}</Alert>}
    <div className="ins-actions"><button type="button" className="ins-btn ghost" onClick={()=>setStep(2)}>Atrás</button><button type="button" className="ins-btn primary" onClick={next}>Continuar</button></div>
  </section>;
}

function DocsStep({form,setForm,setStep}){
  const [err,setErr]=React.useState('');
  function next(){
    const missing=[];
    if(!form.foto_ced_frente) missing.push('foto de cédula frente');
    if(!form.foto_ced_dorso) missing.push('foto de cédula dorso');
    if(!form.foto_titulo) missing.push('foto de título o último grado');
    if(missing.length){ setErr('No podés continuar sin cargar: ' + missing.join(', ') + '.'); return; }
    setErr(''); setStep(5);
  }
  return <section className="ins-card ins-step-card">
    <div className="ins-card-head"><span>Paso 5</span><h2>Documentación importante</h2><p>Para completar la solicitud, cargá los documentos requeridos. Esta pantalla no permite continuar si falta alguno.</p></div>
    <div className="ins-upload-grid">
      <FilePhoto label="Foto cédula frente" value={form.foto_ced_frente} onChange={v=>setForm({foto_ced_frente:v})} hint="Documento obligatorio" />
      <FilePhoto label="Foto cédula dorso" value={form.foto_ced_dorso} onChange={v=>setForm({foto_ced_dorso:v})} hint="Documento obligatorio" />
      <FilePhoto label="Foto título / último grado" value={form.foto_titulo} onChange={v=>setForm({foto_titulo:v})} hint="Documento obligatorio" />
    </div>
    <Alert>Las tres cargas son obligatorias para enviar la solicitud correctamente.</Alert>
    {err && <Alert type="error">{err}</Alert>}
    <div className="ins-actions"><button type="button" className="ins-btn ghost" onClick={()=>setStep(3)}>Atrás</button><button type="button" className="ins-btn primary" onClick={next}>Ver resumen</button></div>
  </section>;
}

function SummaryRow({label,value}){ return <div className="ins-summary-row"><span>{label}</span><strong>{optionLabel(value)}</strong></div>; }

function ReviewPanel({title,editLabel,onEdit,children}){
  return <div className="ins-review-panel">
    <div className="ins-review-head"><h3>{title}</h3><button type="button" onClick={onEdit}>{editLabel || 'Editar'}</button></div>
    {children}
  </div>;
}

function ReviewStep({form,selectedGroup,setStep,onSubmit,submitting,error,becas}){
  const conape = upper(form.financiamiento)==='CONAPE';
  const wait = selectedGroup?.estado_cupo === 'LISTA_ESPERA';
  const canSubmit = !wait || form.aceptar_lista_espera;
  const becaSel = (becas || []).find(b => b.id === (form.beca || form.beca_propio));
  return <section className="ins-card ins-step-card">
    <div className="ins-card-head"><span>Paso 6</span><h2>Revisá antes de enviar</h2><p>Confirmá tus datos antes de registrar la solicitud. Aún no es matrícula activa.</p></div>
    <div className="ins-review-grid">
      <ReviewPanel title="Estudiante" onEdit={()=>setStep(2)}>
        <SummaryRow label="Nombre" value={form.nombre}/>
        <SummaryRow label="Cédula" value={form.cedula}/>
        <SummaryRow label="Correo" value={form.correo}/>
        <SummaryRow label="WhatsApp" value={form.whatsapp}/>
        <SummaryRow label="Ubicación" value={[form.provincia, form.canton, upper(form.distrito)==='OTRO' ? form.distrito_otro : form.distrito].filter(Boolean).join(' · ')}/>
      </ReviewPanel>
      <ReviewPanel title="Curso" onEdit={()=>setStep(1)}>
        <SummaryRow label="Nivel" value={selectedGroup?.nivel}/>
        <SummaryRow label="Horario" value={selectedGroup?.schedule_short}/>
        <SummaryRow label="Inicio" value={selectedGroup?.fecha_inicio_label}/>
        <SummaryRow label="Código" value={selectedGroup?.codigo}/>
      </ReviewPanel>
      <ReviewPanel title="Opciones de pago" onEdit={()=>setStep(3)}>
        <SummaryRow label="Tipo" value={paymentLabel(form.financiamiento)}/>
        {conape && <SummaryRow label="Laptop" value={conapeEquipoLabel(form.conape_equipo)}/>}
        {conape && <SummaryRow label="Sostenimiento" value={conapeSostenimientoLabel(form.conape_sostenimiento)}/>}
        {conape && <SummaryRow label="TOEIC" value={form.conape_toeic ? `Solicitado · ${fmtMoney(conapeToeicAmount(selectedGroup, form))}` : 'No solicitado'}/>}
        {!conape && <SummaryRow label="Beca" value={becaSel ? `${becaSel.nombre}${becaSel.porcentaje ? ` · ${becaSel.porcentaje}` : ''}` : 'Sin beca seleccionada'}/>}
        <SummaryRow label="Experiencia" value={form.conocimientos_previos}/>
      </ReviewPanel>
    </div>
    <div className="ins-legal"><strong>Importante:</strong> tu solicitud queda sujeta a revisión de admisiones. La matrícula se confirma cuando el proceso quede validado.</div>
    {!canSubmit && <Alert type="error">Este horario está en lista de espera. Marcá la aceptación en el paso anterior o elegí otra opción.</Alert>}
    {error && <Alert type="error">{error}</Alert>}
    <div className="ins-actions"><button type="button" className="ins-btn ghost" onClick={()=>setStep(4)}>Atrás</button><button type="button" className="ins-btn primary" onClick={onSubmit} disabled={submitting || !canSubmit}>{submitting?'Enviando…':'Enviar solicitud'}</button></div>
  </section>;
}

function SuccessTicket({result,form,selectedGroup}){
  const conape = upper(form.financiamiento)==='CONAPE';
  return <section className="ins-success">
    <div className="ins-ticket">
      <span>Solicitud recibida</span>
      <h2>{first(form.nombre)}, tu solicitud quedó registrada.</h2>
      <p>{result?.mensaje || (conape ? 'Admisiones revisará tu solicitud CONAPE y te indicará el siguiente paso.' : 'Admisiones te contactará para continuar el proceso de matrícula.')}</p>
      <div className="ins-ticket-grid">
        <SummaryRow label="Usuario del portal" value={form.cedula}/>
        <SummaryRow label="Clave" value="La que acabás de elegir"/>
        <SummaryRow label="Grupo tentativo" value={selectedGroup?.codigo}/>
        <SummaryRow label="Horario" value={selectedGroup?.schedule_short}/>
        <SummaryRow label="Estado inicial" value={result?.estado || (conape?'PENDIENTE_CONAPE':'PENDIENTE_PAGO')}/>
        <SummaryRow label="Opción de pago" value={paymentLabel(form.financiamiento)}/>
      </div>
      <div className="ins-success-actions">
        <a className="ins-btn primary" href="campus.html">Entrar al portal</a>
        <button type="button" className="ins-btn ghost" onClick={()=>window.print()}>Guardar comprobante</button>
      </div>
    </div>
    <Timeline active={0}/>
    <Alert>Desde el portal podrás dar seguimiento a tu solicitud mientras admisiones confirma el proceso.</Alert>
  </section>;
}

function Timeline({active=0}){
  const items = ['Solicitud recibida','Validación de datos','Documentos / pago / CONAPE','Activación de matrícula','Acceso completo al Campus'];
  return <div className="ins-timeline">{items.map((t,i)=><div key={t} className={`${i<active?'done':''} ${i===active?'active':''}`}><b>{i<active?'✓':i+1}</b><span>{t}</span></div>)}</div>;
}

function LoadingPage(){
  const messages = ['Cargando configuración de la academia…','Consultando horarios disponibles…','Revisando becas activas y opciones de ingreso…'];
  const [index,setIndex]=React.useState(0);
  React.useEffect(()=>{
    const timer = setInterval(()=>setIndex(prev=>(prev+1)%messages.length), 1400);
    return ()=>clearInterval(timer);
  },[]);
  return <main className="ins-page"><div className="ins-loading">
    <div className="ins-loader-mark"><span></span><span></span><span></span></div>
    <h1>Preparando tu inscripción</h1>
    <p>{messages[index]}</p>
    <div className="ins-loader-rail"><i></i></div>
    <div className="ins-loader-cards"><em></em><em></em><em></em></div>
  </div></main>;
}

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
      const groupCode = form.grupo_tentativo;
      if(groupCode){
        const found = list.find(g=>g.codigo === groupCode);
        if(found) setSelectedGroup(found);
      }
    }catch(e){ setGroupsError(e.message); }
    finally{ setGroupsLoading(false); }
  },[form.grupo_tentativo]);

  React.useEffect(()=>{
    let mounted=true;
    async function load(){
      setLoading(true); setGlobalError('');
      try{
        const [cfg,ases,bec1,bec2] = await Promise.allSettled([
          insPost('getInscripcionPublicConfig', {}),
          insPost('getAsesoresActivos', {}),
          insPost('getBecas', { solo_visibles:true }),
          insPost('getBecasDisponibles', {})
        ]);
        if(!mounted) return;
        if(cfg.status==='fulfilled') setConfig(cfg.value.config || {});
        if(ases.status==='fulfilled') setAsesores(Array.isArray(ases.value.asesores)?ases.value.asesores:[]);
        const becasSource = bec1.status==='fulfilled' && Array.isArray(bec1.value.becas) && bec1.value.becas.length ? bec1.value.becas : (bec2.status==='fulfilled' ? bec2.value.becas || [] : []);
        setBecas(becasSource.map(normalizeBeca).filter(Boolean));
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
    if(!selectedGroup?.codigo) return 'Seleccioná un horario.';
    if(!clean(form.nombre) || !clean(form.cedula) || !clean(form.clave)) return 'Faltan nombre, cédula o clave.';
    if(!clean(form.correo) || !clean(form.whatsapp)) return 'Faltan correo o WhatsApp.';
    if(!clean(form.provincia) || !clean(form.canton) || !clean(form.distrito)) return 'Completá provincia, cantón y distrito.';
    if(upper(form.distrito)==='OTRO' && !clean(form.distrito_otro)) return 'Escribí el distrito.';
    if(!clean(form.direccion) || !clean(form.fecha_nac) || !clean(form.sexo)) return 'Completá los datos personales obligatorios.';
    if(form.es_menor && (!clean(form.tutor_nombre) || !clean(form.tutor_cedula) || !clean(form.tutor_tel))) return 'Completá los datos del representante legal.';
    if(!clean(form.financiamiento)) return 'Seleccioná una opción de pago.';
    if(upper(form.financiamiento)==='PROPIO' && !clean(form.beca || form.beca_propio)) return 'Seleccioná la beca que querés solicitar.';
    if(!clean(form.como_entero)) return 'Indicá cómo te enteraste.';
    if(!clean(form.conocimientos_previos)) return 'Seleccioná tu experiencia con el inglés.';
    if(!form.foto_ced_frente || !form.foto_ced_dorso || !form.foto_titulo) return 'Subí los tres documentos requeridos.';
    if(selectedGroup.estado_cupo === 'LISTA_ESPERA' && !form.aceptar_lista_espera) return 'Debés aceptar lista de espera o elegir otro horario.';
    return '';
  }

  async function submit(){
    const msg = validateBeforeSubmit();
    if(msg){ setSubmitError(msg); return; }
    setSubmitting(true); setSubmitError('');
    try{
      const finalDistrict = upper(form.distrito)==='OTRO' ? clean(form.distrito_otro) : form.distrito;
      const payload = {
        ...form,
        distrito: finalDistrict,
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
        conape_toeic_monto: form.conape_toeic ? (selectedGroup.toeic_monto || form.conape_toeic_monto || conapeToeicAmount(selectedGroup, form)) : 0,
        toeic_monto: form.conape_toeic ? (selectedGroup.toeic_monto || form.toeic_monto || conapeToeicAmount(selectedGroup, form)) : 0,
        conape_equipo_paquete: conapeEquipoLabel(form.conape_equipo),
        conape_sostenimiento_monto: Number(form.conape_sostenimiento || 0) || 0,
        aceptar_lista_espera: !!form.aceptar_lista_espera,
        origen_web: 'INSCRIPCION_PUBLICA_IP3I',
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
      {step===5 && <ReviewStep form={form} selectedGroup={selectedGroup} setStep={setStep} onSubmit={submit} submitting={submitting} error={submitError} becas={becas}/>} 
    </div>}
    {success && <div className="ins-main"><SuccessTicket result={success} form={form} selectedGroup={selectedGroup}/></div>}
    <footer className="ins-footer">
      <strong>Academia Norteamericana</strong><span>Inglés Conversacional · Costa Rica</span><small>Tu solicitud será revisada por admisiones para confirmar el siguiente paso.</small>
    </footer>
  </main>;
}

ReactDOM.render(<InscripcionApp/>, document.getElementById('root'));
