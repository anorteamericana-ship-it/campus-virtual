/* global React, window */
/* ============================================================================
   VENTAS — Datos, constantes y endpoints
   Dashboard de prospectos para asesores de ventas y superadmin.
   Exporta todo a window para que ventas_parts.jsx y ventas_dashboard.jsx
   lo consuman (cada <script type="text/babel"> tiene su propio scope).
   ============================================================================ */

const SCRIPT_URL_V = window.APPS_SCRIPT_URL;
const WA_NUMBER_V = '50689528787';

// ── EMBUDO DEL VENDEDOR — 7 etapas, orden fijo (Fase 3) ───────────────────
// El backend (getDashboardVentas) ya calcula `etapa` con esta lógica + decay
// de semana calendario. CONAPE_DOCUMENTOS es un placeholder permanente en 0.
// `accion` = sugerencia que se muestra en el panel lateral del prospecto.
const EMBUDO_ETAPAS = [
  { key: 'LEAD',                  label: 'Lead',                          color: '#94A3B8', accion: 'Llamada de seguimiento inicial' },
  { key: 'CONAPE_SOLICITUD',      label: 'CONAPE Solicitud',              color: '#2B7FC1', accion: 'Verificar envío de documentos a CONAPE' },
  { key: 'CONAPE_DOCUMENTOS',     label: 'CONAPE Documentos pendientes',  color: '#B6BDC9', placeholder: true, accion: '' },
  { key: 'CONAPE_APROBADO_FIRMA', label: 'CONAPE Aprobado para firma',    color: '#6366F1', accion: 'Avisar al cliente para firma de contrato' },
  { key: 'CONAPE_DESEMBOLSO',     label: 'CONAPE Desembolso',             color: '#8B5CF6', accion: 'Coordinar matrícula y horario' },
  { key: 'CONAPE_MATRICULA',      label: 'CONAPE Matrícula',              color: '#10B981', decay: true, accion: 'Ya pagó CONAPE — confirmar inicio de clases' },
  { key: 'PAGO_ACADEMIA',         label: 'Pago Academia',                 color: '#E5A823', decay: true, accion: 'Ya pagó propio — confirmar inicio de clases' },
];
// ETAPAS = alias para el código que aún itera window.ETAPAS (FilterBar).
const ETAPAS = EMBUDO_ETAPAS;
// Mapa de TODAS las etapas para badges. Incluye ACTIVO/CANCELADO y el alias
// legacy CONAPE_APROBADO por si una fila vieja todavía los trae.
const ETAPA_MAP = Object.fromEntries([
  ...EMBUDO_ETAPAS,
  { key: 'CONAPE_APROBADO', label: 'CONAPE Aprobado', color: '#6366F1' },
  { key: 'ACTIVO',          label: 'Activo',          color: '#10B981' },
  { key: 'CANCELADO',       label: 'Cancelado',       color: '#EF4444' },
].map(e => [e.key, e]));
// Acción sugerida por etapa (para el drawer).
const ACCION_ETAPA = Object.fromEntries(EMBUDO_ETAPAS.map(e => [e.key, e.accion]));
const ETAPAS_CONAPE = ['CONAPE_SOLICITUD','CONAPE_DOCUMENTOS','CONAPE_APROBADO_FIRMA','CONAPE_DESEMBOLSO','CONAPE_MATRICULA'];

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
// Formato DD-mmm-YYYY (ej. 14-sep-2026) para la lista de grupos disponibles.
const fmtFechaDDMon = f => {
  if (!f) return '—';
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const [y,m,d] = String(f).split(/[-T]/).map(Number);
  if (!y || !m || !d) return String(f);
  return `${String(d).padStart(2,'0')}-${meses[m-1]}-${y}`;
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

// ── NORMALIZACIÓN DE FORMA (Bug A) ─────────────────────────────────────
// El backend (APOLLO/PROSPECTOS) devuelve las columnas en MAYÚSCULAS: CEDULA,
// NOMBRE, ETAPA, FINANCIAMIENTO, GRUPO_TENTATIVO, ASESOR_REF, COMISION_PAGADA,
// TIMESTAMP… pero TODO el frontend de ventas (tabla, tarjetas, embudo, calcResumen
// y el drawer) lee minúsculas: p.cedula, p.etapa, p.financiamiento, p.fecha_registro…
// Por eso el panel de Fiorella salía en CERO aunque la respuesta traía 5 prospectos:
// las filas quedaban en blanco, el embudo agrupaba todo bajo `undefined` y calcResumen
// contaba 0. Este normalizador traduce la forma del backend a la que espera la UI.
const siNoV = v => v === true || /^(s[ií]|true|1)$/i.test(String(v == null ? '' : v).trim());
function fmtCedulaV2(raw) {
  const d = String(raw == null ? '' : raw).replace(/\D/g, '');
  if (d.length === 9) return `${d[0]}-${d.slice(1, 5)}-${d.slice(5)}`;   // 120180140 → 1-2018-0140
  return String(raw == null ? '' : raw);
}
function normalizarProspecto(P) {
  if (!P || typeof P !== 'object') return P;
  // Si ya viene en minúsculas (datos demo o ya normalizado) → no tocar.
  if (P.cedula !== undefined || P.nombre !== undefined) return P;
  const g = (...ks) => { for (const k of ks) { if (P[k] != null && P[k] !== '') return P[k]; } return ''; };
  const esMenor = siNoV(g('ES_MENOR'));
  const tutorNombre = g('TUTOR_NOMBRE');
  const equipo = g('CONAPE_EQUIPO');
  const fin = g('FINANCIAMIENTO');
  const etapa = g('ETAPA');
  return {
    cedula: fmtCedulaV2(g('CEDULA')),
    nombre: g('NOMBRE'),
    correo: g('CORREO'),
    telefono: g('TELEFONO'),
    whatsapp: g('WHATSAPP', 'TELEFONO'),
    tipo_id: g('TIPO_ID'),
    sexo: g('SEXO'),
    provincia: g('PROVINCIA'),
    canton: g('CANTON'),
    distrito: g('DISTRITO'),
    direccion: g('DIRECCION'),
    fecha_nac: g('FECHA_NAC'),
    es_menor: esMenor,
    tutor: (esMenor || tutorNombre)
      ? { nombre: tutorNombre, cedula: g('TUTOR_CEDULA'), correo: g('TUTOR_CORREO'), tel: g('TUTOR_TEL') }
      : null,
    programa: g('PROGRAMA'),
    modalidad: g('MODALIDAD'),
    financiamiento: fin,
    beca: g('BECA'),
    beca_estado: g('BECA_ESTADO'),
    grupo_tentativo: g('GRUPO_TENTATIVO'),
    conape: (/conape/i.test(fin) || (equipo && equipo !== 'NINGUNO'))
      ? { equipo: equipo || 'NINGUNO', toeic: siNoV(g('CONAPE_TOEIC')), sostenimiento: g('CONAPE_SOSTENIMIENTO') }
      : null,
    como_entero: g('COMO_ENTERO'),
    asesor_ref: g('ASESOR_REF'),
    conocimientos_previos: g('CONOCIMIENTOS_PREVIOS'),
    estado_cuenta: g('ESTADO_CUENTA'),
    notas: Array.isArray(P.NOTAS) ? P.NOTAS : (Array.isArray(P.notas) ? P.notas : []),
    etapa: etapa,
    fecha_registro: g('TIMESTAMP', 'F_LEAD'),
    fecha_activacion: g('F_ACTIVO'),
    foto_ced_frente: g('FOTO_CED_FRENTE'),
    foto_ced_dorso: g('FOTO_CED_DORSO'),
    foto_titulo: g('FOTO_TITULO'),
    // Comisión pendiente solo aplica a estudiantes ya ACTIVOS sin comisión pagada.
    comision_pendiente: etapa === 'ACTIVO' && !siNoV(g('COMISION_PAGADA')),
    codigo: g('CODIGO_ESTUDIANTE'),
    proforma_url: g('PROFORMA_URL'),
    proforma_equipo_url: g('PROFORMA_EQUIPO_URL'),
    conape_eventos: Array.isArray(P.conape_eventos) ? P.conape_eventos : [],
    docs_extra: Array.isArray(P.docs_extra) ? P.docs_extra : [],
  };
}
// Mapea el resumen del backend ({ total_prospectos, por_etapa, activados_mes,
// comisiones_pendientes… }) a la forma que consume KPIRow. pago_propio_pendiente
// no lo da el backend → se deriva de la lista ya normalizada.
function mapResumenVentas(rs, lista) {
  if (!rs || rs.ok === false || typeof rs.total_prospectos !== 'number') return null;
  const pe = rs.por_etapa || {};
  const esperando = ETAPAS_CONAPE.reduce((s, k) => s + (pe[k] || 0), 0);
  const base = calcResumen(lista || []);
  return {
    total: rs.total_prospectos,
    activados_mes: rs.activados_mes || 0,
    esperando_conape: esperando,
    pago_propio_pendiente: base.pago_propio_pendiente,
    comisiones_pendientes: rs.comisiones_pendientes || 0,
  };
}

// ── ENDPOINTS GET ─────────────────────────────────────────────────────────
// Fase 3: UNA sola llamada trae todo el panel del vendedor (semana, embudo,
// prospectos ya filtrados+en una etapa, grupos con cupo). Reemplaza el viejo
// par getProspectosAsesor + getResumenVentas. POST sin body (query params) →
// no dispara preflight CORS. Los prospectos vienen en MINÚSCULAS, sin normalizar.
async function getDashboardVentas(asesor) {
  const url = `${SCRIPT_URL_V}?fn=getDashboardVentas&asesor=${encodeURIComponent(asesor || '')}`;
  const res = await fetch(url, { method: 'POST' });
  return await res.json();
}
// Adaptador LIGERO (no normalizador): los campos ya vienen en minúsculas; solo
// rellenamos los alias que la tabla/drawer existentes esperan con otro nombre
// (telefono ← whatsapp, fecha_registro ← f_lead, codigo ← codigo_estudiante).
function adaptProspectoDash(p) {
  if (!p || typeof p !== 'object') return p;
  return {
    ...p,
    telefono: p.telefono || p.whatsapp || '',
    fecha_registro: p.fecha_registro || p.f_lead || '',
    codigo: p.codigo || p.codigo_estudiante || '',
  };
}

async function getProspectosAsesor(asesor) {
  let url = `${SCRIPT_URL_V}?fn=getProspectosAsesor`;
  if (asesor) url += `&asesor=${encodeURIComponent(asesor)}`;
  const res = await fetch(url);
  const d = await res.json();
  // Normalizar la forma MAYÚSCULAS del backend → minúsculas que espera la UI.
  if (d && Array.isArray(d.prospectos)) d.prospectos = d.prospectos.map(normalizarProspecto);
  return d;
}
async function getProspectoDetalle(cedula) {
  const res = await fetch(`${SCRIPT_URL_V}?fn=getProspectoDetalle&cedula=${encodeURIComponent(cedula)}`);
  const d = await res.json();
  const p = d && (d.prospecto || (d.ok !== false ? d : null));
  if (p && typeof p === 'object') {
    const norm = normalizarProspecto(p);
    if (d.prospecto) { d.prospecto = norm; return d; }
    return { ...d, ok: d.ok !== false, prospecto: norm };
  }
  return d;
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

// ── ENDPOINTS v4.27.1 (becas + proformas CONAPE) ───────────────────────────
async function getBecasDisponiblesV() {
  const res = await fetch(`${SCRIPT_URL_V}?fn=getBecasDisponibles`);
  return await res.json();
}
async function generarProformaProspecto(cedula) {
  const res = await fetch(`${SCRIPT_URL_V}?fn=generarProformaProspecto&cedula=${encodeURIComponent(cedula)}`);
  return await res.json();
}
const aprobarBecaProspecto = (cedula, decision, admin) =>
  postVentas({ fn:'aprobarBecaProspecto', cedula, decision, admin });

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

// ── VISTA PREVIA DE DISEÑO (Fase 3) ────────────────────────────────────────
// NO es un fallback. Solo se activa con ?preview=fiorella | ?preview=roger en
// la URL, para revisar el rediseño sin sesión/backend. La sesión real NUNCA cae
// aquí: si getDashboardVentas falla, se muestra error + Reintentar (sin enmascarar).
// La forma replica EXACTAMENTE el contrato de getDashboardVentas.
const DEMO_DASHBOARD = {
  fiorella: {
    ok: true,
    asesor: 'FIORELLA SALAZAR',
    semana_actual: { matriculas: 1, promedio_4s: 0.0 },
    embudo: [
      { etapa:'LEAD', count:0 }, { etapa:'CONAPE_SOLICITUD', count:4 },
      { etapa:'CONAPE_DOCUMENTOS', count:0 }, { etapa:'CONAPE_APROBADO_FIRMA', count:0 },
      { etapa:'CONAPE_DESEMBOLSO', count:0 }, { etapa:'CONAPE_MATRICULA', count:0 },
      { etapa:'PAGO_ACADEMIA', count:1 },
    ],
    prospectos: [
      { cedula:'120180140', nombre:'RODRIGUEZ PALACIOS DEBORA', whatsapp:'8888-8888', correo:'debora.rp@gmail.com', programa:'INA', modalidad:'INTENSIVO', financiamiento:'PROPIO', grupo_tentativo:'B1-LM18-C3-0726', codigo_estudiante:'17193', etapa:'PAGO_ACADEMIA', fecha_etapa:'2026-06-05', f_lead:'2026-06-04', notas:'' },
      { cedula:'116880490', nombre:'CAMPOS UREÑA JOSUÉ', whatsapp:'6045-1120', correo:'josue.campos@outlook.com', programa:'INA', modalidad:'INTENSIVO', financiamiento:'CONAPE', grupo_tentativo:'B1-LM18-C3-0726', codigo_estudiante:'', etapa:'CONAPE_SOLICITUD', fecha_etapa:'2026-05-22', f_lead:'2026-05-21', notas:'' },
      { cedula:'118420567', nombre:'JIMÉNEZ ROJAS MARÍA FERNANDA', whatsapp:'8845-2210', correo:'mafer.jimenez@gmail.com', programa:'INA', modalidad:'SUPER_INTENSIVO', financiamiento:'CONAPE', grupo_tentativo:'B1-KJ18-C3-0826', codigo_estudiante:'', etapa:'CONAPE_SOLICITUD', fecha_etapa:'2026-05-16', f_lead:'2026-05-02', notas:'' },
      { cedula:'117210934', nombre:'ARAYA MONGE KEVIN', whatsapp:'7188-6620', correo:'kevin.araya@gmail.com', programa:'INA', modalidad:'INTENSIVO', financiamiento:'CONAPE', grupo_tentativo:'B1-KJ18-C3-0826', codigo_estudiante:'', etapa:'CONAPE_SOLICITUD', fecha_etapa:'2026-05-15', f_lead:'2026-04-18', notas:'' },
      { cedula:'116660277', nombre:'ROJAS PICADO MELISSA', whatsapp:'8901-3344', correo:'melissa.rp@gmail.com', programa:'INA', modalidad:'SUPER_INTENSIVO', financiamiento:'CONAPE', grupo_tentativo:'B1-LM94-B3-0626', codigo_estudiante:'', etapa:'CONAPE_SOLICITUD', fecha_etapa:'2026-05-19', f_lead:'2026-05-19', notas:'' },
    ],
    grupos_disponibles: [
      { codigo:'B1-LM18-C3-0726', fecha_inicio:'2026-09-14', modalidad:'INTENSIVO', programa:'INA', capacidad:20 },
      { codigo:'B1-KJ18-C3-0826', fecha_inicio:'2026-09-17', modalidad:'INTENSIVO', programa:'INA', capacidad:20 },
      { codigo:'B1-LM94-B3-0626', fecha_inicio:'2026-05-18', modalidad:'SUPER_INTENSIVO', programa:'INA', capacidad:18 },
    ],
    total_prospectos: 5,
  },
  roger: {
    ok: true,
    asesor: 'ROGER CRUZ',
    semana_actual: { matriculas: 0, promedio_4s: 0.5 },
    embudo: [
      { etapa:'LEAD', count:2 }, { etapa:'CONAPE_SOLICITUD', count:1 },
      { etapa:'CONAPE_DOCUMENTOS', count:0 }, { etapa:'CONAPE_APROBADO_FIRMA', count:0 },
      { etapa:'CONAPE_DESEMBOLSO', count:0 }, { etapa:'CONAPE_MATRICULA', count:0 },
      { etapa:'PAGO_ACADEMIA', count:0 },
    ],
    prospectos: [
      { cedula:'118100588', nombre:'GUTIÉRREZ LEÓN SOFÍA', whatsapp:'8455-2098', correo:'sofia.gl@gmail.com', programa:'SIN_INA', modalidad:'INTENSIVO', financiamiento:'PROPIO', grupo_tentativo:'', codigo_estudiante:'', etapa:'LEAD', fecha_etapa:'2026-06-03', f_lead:'2026-06-03', notas:'' },
      { cedula:'120030099', nombre:'BRENES VEGA ALLISON', whatsapp:'8677-1290', correo:'allison.bv@gmail.com', programa:'SIN_INA', modalidad:'INTENSIVO', financiamiento:'PROPIO', grupo_tentativo:'', codigo_estudiante:'', etapa:'LEAD', fecha_etapa:'2026-06-02', f_lead:'2026-06-02', notas:'' },
      { cedula:'117330810', nombre:'CHAVES SEGURA DANIEL', whatsapp:'7066-5521', correo:'daniel.cs@gmail.com', programa:'INA', modalidad:'SUPER_INTENSIVO', financiamiento:'CONAPE', grupo_tentativo:'B1-KJ18-C3-0826', codigo_estudiante:'', etapa:'CONAPE_SOLICITUD', fecha_etapa:'2026-05-28', f_lead:'2026-05-23', notas:'' },
    ],
    grupos_disponibles: [
      { codigo:'B1-LM18-C3-0726', fecha_inicio:'2026-09-14', modalidad:'INTENSIVO', programa:'INA', capacidad:20 },
      { codigo:'B1-KJ18-C3-0826', fecha_inicio:'2026-09-17', modalidad:'INTENSIVO', programa:'INA', capacidad:20 },
    ],
    total_prospectos: 3,
  },
};

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
  ETAPAS, EMBUDO_ETAPAS, ETAPA_MAP, ACCION_ETAPA, ETAPAS_CONAPE, ASESORES_V, FIN_MAP, PROG_MAP,
  fmtTelV, waLink, diasDesde, fmtFechaCorta, fmtFechaDDMon, fmtColones, nombrePila,
  normalizarProspecto, mapResumenVentas,
  getDashboardVentas, adaptProspectoDash,
  getProspectosAsesor, getProspectoDetalle, getResumenVentas, getGruposVentas,
  agregarNotaProspecto, subirDocumentoExtra, marcarEtapaProspecto,
  cobrarMatriculaProspecto, activarEstudiante, fileToBase64V,
  getBecasDisponiblesV, generarProformaProspecto, aprobarBecaProspecto,
  docPlaceholder, DEMO_PROSPECTOS, DEMO_GRUPOS, DEMO_DASHBOARD, calcResumen, HOY,
});
