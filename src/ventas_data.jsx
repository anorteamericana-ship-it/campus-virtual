/* global React, window */
/* ============================================================================
   VENTAS — Datos, constantes y endpoints
   Dashboard de prospectos para asesores de ventas y superadmin.
   Exporta todo a window para que ventas_parts.jsx y ventas_dashboard.jsx
   lo consuman (cada <script type="text/babel"> tiene su propio scope).
   ============================================================================ */

const SCRIPT_URL_V = window.APPS_SCRIPT_URL;
const WA_NUMBER_V = '50689528787';

// ── ETAPAS DEL PROSPECTO (orden = embudo) ────────────────────────────────
const ETAPAS = [
  { key: 'LEAD',              label: 'Lead',              color: '#94a3b8' },
  { key: 'CONAPE_SOLICITUD',  label: 'CONAPE Solicitud',  color: '#3b82f6' },
  { key: 'CONAPE_DOCUMENTOS', label: 'CONAPE Documentos', color: '#6366f1' },
  { key: 'CONAPE_APROBADO',   label: 'CONAPE Aprobado',   color: '#8b5cf6' },
  { key: 'CONAPE_DESEMBOLSO', label: 'CONAPE Desembolso', color: '#ec4899' },
  { key: 'PAGO_ACADEMIA',     label: 'Pago Academia',     color: '#f59e0b' },
  { key: 'ACTIVO',            label: 'Activo',            color: '#10b981' },
  { key: 'CANCELADO',         label: 'Cancelado',         color: '#ef4444' },
];
const ETAPA_MAP = Object.fromEntries(ETAPAS.map(e => [e.key, e]));
const ETAPAS_CONAPE = ['CONAPE_SOLICITUD','CONAPE_DOCUMENTOS','CONAPE_APROBADO','CONAPE_DESEMBOLSO'];

const ASESORES_V = ['Fiorela Salazar','Roger Cruz','Gustavo Valladares','Kimberly Guzmán','Leonardo Salazar'];

const FIN_MAP = {
  CONAPE: { label: 'CONAPE', tone: 'blue' },
  BECA:   { label: 'Beca 25%', tone: 'green' },
  PROPIO: { label: 'Pago propio', tone: 'amber' },
};

const PROG_MAP = {
  INA:     { label: 'INA Acreditado', short: 'INA' },
  SIN_INA: { label: 'Programa Libre', short: 'Libre' },
};

// ── HELPERS DE FORMATO ───────────────────────────────────────────────────
const fmtTelV = t => {
  const d = String(t || '').replace(/\D/g, '').slice(-8);
  return d.length === 8 ? `${d.slice(0,4)}-${d.slice(4)}` : (t || '');
};
const waLink = (t, msg) => {
  const d = String(t || '').replace(/\D/g, '').slice(-8);
  const base = `https://wa.me/506${d}`;
  return msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
};
const diasDesde = fecha => {
  if (!fecha) return null;
  const f = new Date(fecha); if (Number.isNaN(f.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - f.getTime()) / 86400000));
};
const fmtFechaCorta = f => {
  if (!f) return '—';
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const [y,m,d] = String(f).split(/[-T]/).map(Number);
  if (!y || !m || !d) return String(f);
  return `${d} ${meses[m-1]} ${y}`;
};
const fmtColones = n => {
  const num = Number(String(n).replace(/[^\d.]/g,''));
  if (Number.isNaN(num) || !num) return String(n || '');
  return '₡' + num.toLocaleString('es-CR');
};
const nombrePila = nombre => {
  if (!nombre) return '';
  const t = nombre.trim().split(/\s+/);
  const pick = t[2] || t[0];
  return pick.charAt(0) + pick.slice(1).toLowerCase();
};

// ── ENDPOINTS GET ─────────────────────────────────────────────────────────
async function getProspectosAsesor(asesor) {
  let url = `${SCRIPT_URL_V}?fn=getProspectosAsesor`;
  if (asesor) url += `&asesor=${encodeURIComponent(asesor)}`;
  const res = await fetch(url);
  return await res.json();
}
async function getProspectoDetalle(cedula) {
  const res = await fetch(`${SCRIPT_URL_V}?fn=getProspectoDetalle&cedula=${encodeURIComponent(cedula)}`);
  return await res.json();
}
async function getResumenVentas(asesor) {
  let url = `${SCRIPT_URL_V}?fn=getResumenVentas`;
  if (asesor) url += `&asesor=${encodeURIComponent(asesor)}`;
  const res = await fetch(url);
  return await res.json();
}
async function getGruposVentas(programa) {
  const res = await fetch(`${SCRIPT_URL_V}?fn=getGruposDisponibles&programa=${encodeURIComponent(programa)}`);
  return await res.json();
}

// ── ENDPOINTS POST (text/plain para esquivar el preflight CORS) ────────────
async function postVentas(payload) {
  const res = await fetch(SCRIPT_URL_V, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  return await res.json();
}
const agregarNotaProspecto    = (cedula, asesor, texto)               => postVentas({ fn:'agregarNotaProspecto', cedula, asesor, texto });
const subirDocumentoExtra     = (cedula, nombre_archivo, mime_type, base64) => postVentas({ fn:'subirDocumentoExtra', cedula, nombre_archivo, mime_type, base64 });
const marcarEtapaProspecto    = (cedula, etapa, asesor)               => postVentas({ fn:'marcarEtapaProspecto', cedula, etapa, asesor });
const cobrarMatriculaProspecto= (cedula, grupo, monto, comprobante, asesor) => postVentas({ fn:'cobrarMatriculaProspecto', cedula, grupo, monto, comprobante, asesor });
const activarEstudiante       = (cedula, grupo, asesor)               => postVentas({ fn:'activarEstudiante', cedula, grupo, asesor });

// Convierte un File a base64 con prefijo data: (para subirDocumentoExtra)
function fileToBase64V(file) {
  return new Promise((resolve, reject) => {
    if (!file) { resolve(''); return; }
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

// ── PLACEHOLDER DE DOCUMENTO (SVG data-URI, para demo) ─────────────────────
function docPlaceholder(label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
    <defs><pattern id="s" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="14" height="14" fill="#eef1f6"/><rect width="7" height="14" fill="#e3e8f0"/></pattern></defs>
    <rect width="640" height="400" fill="url(#s)"/>
    <rect x="40" y="40" width="560" height="320" rx="16" fill="#fff" stroke="#cfd6e2" stroke-width="2"/>
    <rect x="70" y="80" width="150" height="190" rx="10" fill="#dde3ec"/>
    <rect x="250" y="95" width="300" height="20" rx="6" fill="#c2cad8"/>
    <rect x="250" y="135" width="240" height="14" rx="6" fill="#d6dce6"/>
    <rect x="250" y="165" width="280" height="14" rx="6" fill="#d6dce6"/>
    <rect x="250" y="195" width="200" height="14" rx="6" fill="#d6dce6"/>
    <text x="320" y="330" font-family="monospace" font-size="22" fill="#8b95a7" text-anchor="middle" letter-spacing="2">${label}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// ── DATOS DEMO (fallback cuando no hay backend / sesión) ───────────────────
// Claramente etiquetados como demo en la UI. Cero datos reales.
const HOY = '2026-05-29';
const D_FRENTE = docPlaceholder('CÉDULA · FRENTE');
const D_DORSO  = docPlaceholder('CÉDULA · DORSO');
const D_TITULO = docPlaceholder('TÍTULO ACADÉMICO');

const DEMO_PROSPECTOS = [
  {
    cedula:'1-1842-0567', nombre:'JIMÉNEZ ROJAS MARÍA FERNANDA', telefono:'8845-2210', whatsapp:'8845-2210',
    correo:'mafer.jimenez@gmail.com', programa:'INA', financiamiento:'CONAPE', etapa:'CONAPE_DOCUMENTOS',
    grupo_tentativo:'B1-LM18-1426', asesor_ref:'Fiorela Salazar', fecha_registro:'2026-05-02', comision_pendiente:false,
    provincia:'San José', canton:'Desamparados', direccion:'Barrio San Antonio, 200m sur de la iglesia, casa verde.',
    fecha_nac:'2001-03-14', sexo:'F', es_menor:false, tutor:null,
    conape:{ equipo:'BASICO', toeic:true, sostenimiento:'₡60,000 por mes' },
    foto_ced_frente:D_FRENTE, foto_ced_dorso:D_DORSO, foto_titulo:D_TITULO,
    notas:[
      { fecha:'2026-05-18', autor:'Fiorela Salazar', texto:'Subió los documentos de CONAPE. Le falta el comprobante de ingresos del tutor solidario.' },
      { fecha:'2026-05-04', autor:'Fiorela Salazar', texto:'Primer contacto por WhatsApp. Muy interesada en el programa INA, quiere el plan básico de equipo.' },
    ],
    docs_extra:[ { nombre_archivo:'orden_patronal.pdf', mime_type:'application/pdf', url:'#', fecha:'2026-05-18' } ],
    conape_eventos:[
      { fecha:'2026-05-16', titulo:'Solicitud recibida por CONAPE', detalle:'Expediente #CNP-2026-44821 asignado.' },
      { fecha:'2026-05-10', titulo:'Solicitud enviada', detalle:'Formulario en línea completado con la asesora.' },
    ],
  },
  {
    cedula:'1-1790-0233', nombre:'VARGAS CASTRO LUIS DIEGO', telefono:'7012-9988', whatsapp:'7012-9988',
    correo:'ldvargas@hotmail.com', programa:'INA', financiamiento:'CONAPE', etapa:'CONAPE_DESEMBOLSO',
    grupo_tentativo:'B1-KJ18-1426', asesor_ref:'Fiorela Salazar', fecha_registro:'2026-04-12', comision_pendiente:true,
    provincia:'Cartago', canton:'La Unión', direccion:'Tres Ríos, Urbanización Florencia, casa 12B.',
    fecha_nac:'1999-11-02', sexo:'M', es_menor:false, tutor:null,
    conape:{ equipo:'PREMIUM', toeic:false, sostenimiento:'No' },
    foto_ced_frente:D_FRENTE, foto_ced_dorso:D_DORSO, foto_titulo:D_TITULO,
    notas:[
      { fecha:'2026-05-20', autor:'Fiorela Salazar', texto:'CONAPE confirmó el desembolso. Listo para activar — coordinar grupo de inicio.' },
    ],
    docs_extra:[],
    conape_eventos:[
      { fecha:'2026-05-20', titulo:'Desembolso aprobado', detalle:'Monto girado a la academia. Pendiente activar como estudiante.' },
      { fecha:'2026-05-06', titulo:'Crédito aprobado', detalle:'CONAPE aprueba el financiamiento al 100%.' },
      { fecha:'2026-04-20', titulo:'Documentos completos', detalle:'Expediente cerrado para análisis.' },
    ],
  },
  {
    cedula:'1-1955-0871', nombre:'MORA SOLÍS ANDREA', telefono:'8390-4471', whatsapp:'8390-4471',
    correo:'andrea.mora@gmail.com', programa:'SIN_INA', financiamiento:'PROPIO', etapa:'LEAD',
    grupo_tentativo:'B1-SA8-1426', asesor_ref:'Fiorela Salazar', fecha_registro:'2026-05-26', comision_pendiente:false,
    provincia:'San José', canton:'Curridabat', direccion:'Granadilla Norte, condominio Vistas del Este, apto 3.',
    fecha_nac:'2003-07-19', sexo:'F', es_menor:false, tutor:null,
    conape:null, foto_ced_frente:D_FRENTE, foto_ced_dorso:D_DORSO, foto_titulo:'',
    notas:[ { fecha:'2026-05-26', autor:'Fiorela Salazar', texto:'Quiere pagar matrícula esta semana. Prefiere sábados.' } ],
    docs_extra:[], conape_eventos:[],
  },
  {
    cedula:'1-1688-0490', nombre:'CAMPOS UREÑA JOSUÉ', telefono:'6045-1120', whatsapp:'6045-1120',
    correo:'josue.campos@outlook.com', programa:'INA', financiamiento:'CONAPE', etapa:'CONAPE_SOLICITUD',
    grupo_tentativo:'B1-LM18-1426', asesor_ref:'Fiorela Salazar', fecha_registro:'2026-05-21', comision_pendiente:false,
    provincia:'Heredia', canton:'San Rafael', direccion:'Los Ángeles, de la escuela 300m este.',
    fecha_nac:'2002-01-30', sexo:'M', es_menor:false, tutor:null,
    conape:{ equipo:'NINGUNO', toeic:true, sostenimiento:'₡40,000 por mes' },
    foto_ced_frente:D_FRENTE, foto_ced_dorso:'', foto_titulo:'',
    notas:[ { fecha:'2026-05-22', autor:'Fiorela Salazar', texto:'Inició la solicitud. Falta cargar dorso de cédula y título.' } ],
    docs_extra:[], conape_eventos:[ { fecha:'2026-05-22', titulo:'Solicitud iniciada', detalle:'Registro creado desde inscripción pública.' } ],
  },
  {
    cedula:'1-2011-0345', nombre:'NÚÑEZ FALLAS VALERIA', telefono:'8722-3390', whatsapp:'8722-3390',
    correo:'vale.nunez@gmail.com', programa:'SIN_INA', financiamiento:'BECA', etapa:'PAGO_ACADEMIA',
    grupo_tentativo:'B1-SA8-1426', asesor_ref:'Fiorela Salazar', fecha_registro:'2026-05-08', comision_pendiente:false,
    provincia:'San José', canton:'Goicoechea', direccion:'Guadalupe, Barrio La Floresta, casa esquinera.',
    fecha_nac:'2008-09-12', sexo:'F', es_menor:true,
    tutor:{ nombre:'NÚÑEZ ARIAS CARLOS', cedula:'1-0890-0234', correo:'carlos.nunez@gmail.com', tel:'8811-2233' },
    conape:null, foto_ced_frente:D_FRENTE, foto_ced_dorso:D_DORSO, foto_titulo:D_TITULO,
    notas:[ { fecha:'2026-05-24', autor:'Fiorela Salazar', texto:'Beca 25% aprobada. Pendiente el pago de matrícula con descuento.' } ],
    docs_extra:[], conape_eventos:[],
  },
  {
    cedula:'1-1543-0712', nombre:'SALAS QUESADA RODRIGO', telefono:'8533-7781', whatsapp:'8533-7781',
    correo:'rodrigo.sq@gmail.com', programa:'INA', financiamiento:'CONAPE', etapa:'ACTIVO',
    grupo_tentativo:'B1-LM18-1426', asesor_ref:'Fiorela Salazar', fecha_registro:'2026-03-02', comision_pendiente:true,
    provincia:'Alajuela', canton:'Central', direccion:'Barrio San José, 100m norte del parque.',
    fecha_nac:'2000-05-22', sexo:'M', es_menor:false, tutor:null,
    conape:{ equipo:'BASICO', toeic:true, sostenimiento:'₡60,000 por mes' },
    foto_ced_frente:D_FRENTE, foto_ced_dorso:D_DORSO, foto_titulo:D_TITULO,
    codigo:'C17402',
    notas:[ { fecha:'2026-04-28', autor:'Fiorela Salazar', texto:'Activado como estudiante. Código C17402 generado.' } ],
    docs_extra:[], conape_eventos:[ { fecha:'2026-04-28', titulo:'Estudiante activado', detalle:'Matriculado en B1-LM18-1426.' } ],
  },
  {
    cedula:'1-1899-0156', nombre:'HERRERA BRENES PAOLA', telefono:'8290-1145', whatsapp:'8290-1145',
    correo:'paola.hb@gmail.com', programa:'SIN_INA', financiamiento:'PROPIO', etapa:'CANCELADO',
    grupo_tentativo:'', asesor_ref:'Fiorela Salazar', fecha_registro:'2026-04-30', comision_pendiente:false,
    provincia:'San José', canton:'Tibás', direccion:'Cinco Esquinas, de la plaza 50m sur.',
    fecha_nac:'1998-02-08', sexo:'F', es_menor:false, tutor:null,
    conape:null, foto_ced_frente:'', foto_ced_dorso:'', foto_titulo:'',
    notas:[ { fecha:'2026-05-12', autor:'Fiorela Salazar', texto:'Desistió por motivos laborales. Reintentar en el próximo cuatrimestre.' } ],
    docs_extra:[], conape_eventos:[],
  },
  {
    cedula:'1-1721-0934', nombre:'ARAYA MONGE KEVIN', telefono:'7188-6620', whatsapp:'7188-6620',
    correo:'kevin.araya@gmail.com', programa:'INA', financiamiento:'CONAPE', etapa:'CONAPE_APROBADO',
    grupo_tentativo:'B1-KJ18-1426', asesor_ref:'Roger Cruz', fecha_registro:'2026-04-18', comision_pendiente:true,
    provincia:'Limón', canton:'Central', direccion:'Limón centro, Barrio Roosevelt.',
    fecha_nac:'2001-12-01', sexo:'M', es_menor:false, tutor:null,
    conape:{ equipo:'PREMIUM', toeic:true, sostenimiento:'₡60,000 por mes' },
    foto_ced_frente:D_FRENTE, foto_ced_dorso:D_DORSO, foto_titulo:D_TITULO,
    notas:[ { fecha:'2026-05-15', autor:'Roger Cruz', texto:'CONAPE aprobó. Esperando fecha de desembolso.' } ],
    docs_extra:[], conape_eventos:[ { fecha:'2026-05-15', titulo:'Crédito aprobado', detalle:'Pendiente desembolso.' } ],
  },
  {
    cedula:'1-1810-0588', nombre:'GUTIÉRREZ LEÓN SOFÍA', telefono:'8455-2098', whatsapp:'8455-2098',
    correo:'sofia.gl@gmail.com', programa:'SIN_INA', financiamiento:'PROPIO', etapa:'LEAD',
    grupo_tentativo:'', asesor_ref:'Roger Cruz', fecha_registro:'2026-05-27', comision_pendiente:false,
    provincia:'Puntarenas', canton:'Central', direccion:'El Roble, frente al super La Económica.',
    fecha_nac:'2004-04-04', sexo:'F', es_menor:false, tutor:null,
    conape:null, foto_ced_frente:D_FRENTE, foto_ced_dorso:'', foto_titulo:'',
    notas:[], docs_extra:[], conape_eventos:[],
  },
  {
    cedula:'1-1666-0277', nombre:'ROJAS PICADO MELISSA', telefono:'8901-3344', whatsapp:'8901-3344',
    correo:'melissa.rp@gmail.com', programa:'INA', financiamiento:'CONAPE', etapa:'CONAPE_SOLICITUD',
    grupo_tentativo:'B1-LM18-1426', asesor_ref:'Gustavo Valladares', fecha_registro:'2026-05-19', comision_pendiente:false,
    provincia:'Guanacaste', canton:'Liberia', direccion:'Barrio Los Ángeles, casa 8.',
    fecha_nac:'2002-08-25', sexo:'F', es_menor:false, tutor:null,
    conape:{ equipo:'BASICO', toeic:false, sostenimiento:'No' },
    foto_ced_frente:D_FRENTE, foto_ced_dorso:D_DORSO, foto_titulo:'',
    notas:[], docs_extra:[], conape_eventos:[ { fecha:'2026-05-19', titulo:'Solicitud iniciada', detalle:'Registro desde inscripción pública.' } ],
  },
  {
    cedula:'1-1733-0810', nombre:'CHAVES SEGURA DANIEL', telefono:'7066-5521', whatsapp:'7066-5521',
    correo:'daniel.cs@gmail.com', programa:'SIN_INA', financiamiento:'PROPIO', etapa:'PAGO_ACADEMIA',
    grupo_tentativo:'B1-KJ18-1426', asesor_ref:'Gustavo Valladares', fecha_registro:'2026-05-11', comision_pendiente:false,
    provincia:'Heredia', canton:'Central', direccion:'Mercedes Norte, de la iglesia 200m oeste.',
    fecha_nac:'1997-06-15', sexo:'M', es_menor:false, tutor:null,
    conape:null, foto_ced_frente:D_FRENTE, foto_ced_dorso:D_DORSO, foto_titulo:D_TITULO,
    notas:[ { fecha:'2026-05-23', autor:'Gustavo Valladares', texto:'Acordó pagar matrícula el viernes. Quiere horario martes y jueves.' } ],
    docs_extra:[], conape_eventos:[],
  },
  {
    cedula:'1-2003-0099', nombre:'BRENES VEGA ALLISON', telefono:'8677-1290', whatsapp:'8677-1290',
    correo:'allison.bv@gmail.com', programa:'SIN_INA', financiamiento:'BECA', etapa:'LEAD',
    grupo_tentativo:'', asesor_ref:'Kimberly Guzmán', fecha_registro:'2026-05-28', comision_pendiente:false,
    provincia:'San José', canton:'Montes de Oca', direccion:'San Pedro, Barrio Dent, casa 22.',
    fecha_nac:'2009-01-18', sexo:'F', es_menor:true,
    tutor:{ nombre:'VEGA ARTAVIA LAURA', cedula:'1-0921-0455', correo:'laura.vega@gmail.com', tel:'8344-9981' },
    conape:null, foto_ced_frente:D_FRENTE, foto_ced_dorso:'', foto_titulo:'',
    notas:[], docs_extra:[], conape_eventos:[],
  },
  {
    cedula:'1-1577-0643', nombre:'MÉNDEZ ARCE FABIÁN', telefono:'8233-7754', whatsapp:'8233-7754',
    correo:'fabian.ma@gmail.com', programa:'INA', financiamiento:'CONAPE', etapa:'CONAPE_DESEMBOLSO',
    grupo_tentativo:'B1-LM18-1426', asesor_ref:'Kimberly Guzmán', fecha_registro:'2026-04-08', comision_pendiente:true,
    provincia:'Cartago', canton:'Central', direccion:'Barrio El Molino, de la escuela 100m norte.',
    fecha_nac:'2000-10-09', sexo:'M', es_menor:false, tutor:null,
    conape:{ equipo:'BASICO', toeic:true, sostenimiento:'₡60,000 por mes' },
    foto_ced_frente:D_FRENTE, foto_ced_dorso:D_DORSO, foto_titulo:D_TITULO,
    notas:[ { fecha:'2026-05-21', autor:'Kimberly Guzmán', texto:'Desembolso confirmado. Listo para activar.' } ],
    docs_extra:[], conape_eventos:[ { fecha:'2026-05-21', titulo:'Desembolso aprobado', detalle:'Monto girado a la academia.' } ],
  },
  {
    cedula:'1-1844-0501', nombre:'ESPINOZA RAMÍREZ NATALIA', telefono:'8512-0076', whatsapp:'8512-0076',
    correo:'natalia.er@gmail.com', programa:'INA', financiamiento:'CONAPE', etapa:'ACTIVO',
    grupo_tentativo:'B1-KJ18-1426', asesor_ref:'Leonardo Salazar', fecha_registro:'2026-02-20', comision_pendiente:false,
    provincia:'San José', canton:'Escazú', direccion:'San Rafael de Escazú, condominio Avalon.',
    fecha_nac:'1999-03-03', sexo:'F', es_menor:false, tutor:null,
    conape:{ equipo:'PREMIUM', toeic:true, sostenimiento:'₡60,000 por mes' },
    foto_ced_frente:D_FRENTE, foto_ced_dorso:D_DORSO, foto_titulo:D_TITULO, codigo:'C17188',
    notas:[ { fecha:'2026-04-02', autor:'Leonardo Salazar', texto:'Activada. Código C17188.' } ],
    docs_extra:[], conape_eventos:[ { fecha:'2026-04-02', titulo:'Estudiante activada', detalle:'Matriculada en B1-KJ18-1426.' } ],
  },
];

const DEMO_GRUPOS = [
  { codigo:'B1-LM18-1426', etiqueta:'Básico I · Lun y Mié · 6:00 p.m. · inicia 14 jul' },
  { codigo:'B1-KJ18-1426', etiqueta:'Básico I · Mar y Jue · 6:00 p.m. · inicia 15 jul' },
  { codigo:'B1-SA8-1426',  etiqueta:'Básico I · Sábados · 8:00 a.m. · inicia 19 jul' },
  { codigo:'B1-LJ18-1426', etiqueta:'Básico I · Lun a Jue · 6:00 p.m. · inicia 14 jul' },
];

// Calcula el resumen de KPIs a partir de la lista (usado en demo y como fallback)
function calcResumen(lista) {
  const esteMes = (HOY || '').slice(0,7);
  const total = lista.length;
  const activados_mes = lista.filter(p => p.etapa === 'ACTIVO' && (p.fecha_activacion || '').slice(0,7) === esteMes).length
    || lista.filter(p => p.etapa === 'ACTIVO').length; // demo: contamos activos
  const esperando_conape = lista.filter(p => ETAPAS_CONAPE.includes(p.etapa)).length;
  const pago_propio_pendiente = lista.filter(p =>
    (p.etapa === 'LEAD' || p.etapa === 'PAGO_ACADEMIA') &&
    (p.financiamiento === 'PROPIO' || p.financiamiento === 'BECA')).length;
  const comisiones_pendientes = lista.filter(p => p.comision_pendiente).length;
  return { total, activados_mes, esperando_conape, pago_propio_pendiente, comisiones_pendientes };
}

Object.assign(window, {
  SCRIPT_URL_V, WA_NUMBER_V,
  ETAPAS, ETAPA_MAP, ETAPAS_CONAPE, ASESORES_V, FIN_MAP, PROG_MAP,
  fmtTelV, waLink, diasDesde, fmtFechaCorta, fmtColones, nombrePila,
  getProspectosAsesor, getProspectoDetalle, getResumenVentas, getGruposVentas,
  agregarNotaProspecto, subirDocumentoExtra, marcarEtapaProspecto,
  cobrarMatriculaProspecto, activarEstudiante, fileToBase64V,
  docPlaceholder, DEMO_PROSPECTOS, DEMO_GRUPOS, calcResumen, HOY,
});
