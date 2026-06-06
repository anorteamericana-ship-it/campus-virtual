/* global React */
/* ============================================================================
   Inscripción pública — PARTES COMPARTIDAS
   Iconos, validadores, mapas de decodificación y componentes presentacionales.
   Se exporta todo a window para que src/inscripcion.jsx lo consuma.
   ============================================================================ */
const { useState, useRef } = React;

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const WA_NUMBER = '50689528787';

const IMG_INA = 'https://lh3.googleusercontent.com/d/1MFNnwetDSIxTmCJALDO30-QqMMToCEgH';
const IMG_LIBRE = 'https://lh3.googleusercontent.com/d/1ZoRy2blF7yP__GRdl6W_FVtgNytUtYhF';
const IMG_BASICO = 'https://lh3.googleusercontent.com/d/1XCzIy9-gij6gTGFNnpFO5p0Jfwl7Heto';
const IMG_PREMIUM = 'https://lh3.googleusercontent.com/d/1BNsxsc3GkjgnkatAoGPHXodmAPrGpfsN';

/* ============================================================================
   CR_GEO — Geografía oficial de Costa Rica
   7 provincias · 84 cantones · ~489 distritos (DTA — MIDEPLAN/INEC, incluye
   Río Cuarto 2017, Monteverde 2021, Puerto Jiménez 2022). Escape hatch: si un
   distrito no aparece, agregalo a mano acá.
   ============================================================================ */
const CR_GEO = {
  "San José": {
    "Central":           ["Carmen", "Merced", "Hospital", "Catedral", "Zapote", "San Francisco de Dos Ríos", "Uruca", "Mata Redonda", "Pavas", "Hatillo", "San Sebastián"],
    "Escazú":            ["Escazú", "San Antonio", "San Rafael"],
    "Desamparados":      ["Desamparados", "San Miguel", "San Juan de Dios", "San Rafael Arriba", "San Antonio", "Frailes", "Patarrá", "San Cristóbal", "Rosario", "Damas", "San Rafael Abajo", "Gravilias", "Los Guido"],
    "Puriscal":          ["Santiago", "Mercedes Sur", "Barbacoas", "Grifo Alto", "San Rafael", "Candelarita", "Desamparaditos", "San Antonio", "Chires"],
    "Tarrazú":           ["San Marcos", "San Lorenzo", "San Carlos"],
    "Aserrí":            ["Aserrí", "Tarbaca", "Vuelta de Jorco", "San Gabriel", "Legua", "Monterrey", "Salitrillos"],
    "Mora":              ["Colón", "Guayabo", "Tabarcia", "Piedras Negras", "Picagres", "Jaris", "Quitirrisí"],
    "Goicoechea":        ["Guadalupe", "San Francisco", "Calle Blancos", "Mata de Plátano", "Ipís", "Rancho Redondo", "Purral"],
    "Santa Ana":         ["Santa Ana", "Salitral", "Pozos", "Uruca", "Piedades", "Brasil"],
    "Alajuelita":        ["Alajuelita", "San Josecito", "San Antonio", "Concepción", "San Felipe"],
    "Vázquez de Coronado":["San Isidro", "San Rafael", "Dulce Nombre de Jesús", "Patalillo", "Cascajal"],
    "Acosta":            ["San Ignacio", "Guaitil", "Palmichal", "Cangrejal", "Sabanillas"],
    "Tibás":             ["San Juan", "Cinco Esquinas", "Anselmo Llorente", "León XIII", "Colima"],
    "Moravia":           ["San Vicente", "San Jerónimo", "La Trinidad"],
    "Montes de Oca":     ["San Pedro", "Sabanilla", "Mercedes", "San Rafael"],
    "Turrubares":        ["San Pablo", "San Pedro", "San Juan de Mata", "San Luis", "Carara"],
    "Dota":              ["Santa María", "Jardín", "Copey"],
    "Curridabat":        ["Curridabat", "Granadilla", "Sánchez", "Tirrases"],
    "Pérez Zeledón":     ["San Isidro de El General", "El General", "Daniel Flores", "Rivas", "San Pedro", "Platanares", "Pejibaye", "Cajón", "Barú", "Río Nuevo", "Páramo", "La Amistad"],
    "León Cortés Castro":["San Pablo", "San Andrés", "Llano Bonito", "San Isidro", "Santa Cruz", "San Antonio"]
  },
  "Alajuela": {
    "Central":           ["Alajuela", "San José", "Carrizal", "San Antonio", "Guácima", "San Isidro", "Sabanilla", "San Rafael", "Río Segundo", "Desamparados", "Turrúcares", "Tambor", "Garita", "Sarapiquí"],
    "San Ramón":         ["San Ramón", "Santiago", "San Juan", "Piedades Norte", "Piedades Sur", "San Rafael", "San Isidro", "Ángeles", "Alfaro", "Volio", "Concepción", "Zapotal", "Peñas Blancas", "San Lorenzo"],
    "Grecia":            ["Grecia", "San Isidro", "San José", "San Roque", "Tacares", "Bolívar", "Puente de Piedra"],
    "San Mateo":         ["San Mateo", "Desmonte", "Jesús María", "Labrador"],
    "Atenas":            ["Atenas", "Jesús", "Mercedes", "San Isidro", "Concepción", "San José", "Santa Eulalia", "Escobal"],
    "Naranjo":           ["Naranjo", "San Miguel", "San José", "Cirrí Sur", "San Jerónimo", "San Juan", "El Rosario", "Palmitos"],
    "Palmares":          ["Palmares", "Zaragoza", "Buenos Aires", "Santiago", "Candelaria", "Esquipulas", "La Granja"],
    "Poás":              ["San Pedro", "San Juan", "San Rafael", "Carrillos", "Sabana Redonda"],
    "Orotina":           ["Orotina", "El Mastate", "Hacienda Vieja", "Coyolar", "La Ceiba"],
    "San Carlos":        ["Quesada", "Florencia", "Buenavista", "Aguas Zarcas", "Venecia", "Pital", "La Fortuna", "La Tigra", "La Palmera", "Venado", "Cutris", "Monterrey", "Pocosol"],
    "Zarcero":           ["Zarcero", "Laguna", "Tapezco", "Guadalupe", "Palmira", "Zapote", "Brisas"],
    "Sarchí":            ["Sarchí Norte", "Sarchí Sur", "Toro Amarillo", "San Pedro", "Rodríguez"],
    "Upala":             ["Upala", "Aguas Claras", "San José o Pizote", "Bijagua", "Delicias", "Dos Ríos", "Yolillal", "Canalete"],
    "Los Chiles":        ["Los Chiles", "Caño Negro", "El Amparo", "San Jorge"],
    "Guatuso":           ["San Rafael", "Buenavista", "Cote", "Katira"],
    "Río Cuarto":        ["Río Cuarto", "Santa Rita", "Santa Isabel"]
  },
  "Cartago": {
    "Central":           ["Oriental", "Occidental", "Carmen", "San Nicolás", "Aguacaliente o San Francisco", "Guadalupe o Arenilla", "Corralillo", "Tierra Blanca", "Dulce Nombre", "Llano Grande", "Quebradilla"],
    "Paraíso":           ["Paraíso", "Santiago", "Orosi", "Cachí", "Llanos de Santa Lucía", "Birrisito"],
    "La Unión":          ["Tres Ríos", "San Diego", "San Juan", "San Rafael", "Concepción", "Dulce Nombre", "San Ramón", "Río Azul"],
    "Jiménez":           ["Juan Viñas", "Tucurrique", "Pejibaye"],
    "Turrialba":         ["Turrialba", "La Suiza", "Peralta", "Santa Cruz", "Santa Teresita", "Pavones", "Tuis", "Tayutic", "Santa Rosa", "Tres Equis", "La Isabel", "Chirripó"],
    "Alvarado":          ["Pacayas", "Cervantes", "Capellades"],
    "Oreamuno":          ["San Rafael", "Cot", "Potrero Cerrado", "Cipreses", "Santa Rosa"],
    "El Guarco":         ["El Tejar", "San Isidro", "Tobosi", "Patio de Agua"]
  },
  "Heredia": {
    "Central":           ["Heredia", "Mercedes", "San Francisco", "Ulloa", "Varablanca"],
    "Barva":             ["Barva", "San Pedro", "San Pablo", "San Roque", "Santa Lucía", "San José de la Montaña"],
    "Santo Domingo":     ["Santo Domingo", "San Vicente", "San Miguel", "Paracito", "Santo Tomás", "Santa Rosa", "Tures", "Pará"],
    "Santa Bárbara":     ["Santa Bárbara", "San Pedro", "San Juan", "Jesús", "Santo Domingo", "Purabá"],
    "San Rafael":        ["San Rafael", "San Josecito", "Santiago", "Ángeles", "Concepción"],
    "San Isidro":        ["San Isidro", "San José", "Concepción", "San Francisco"],
    "Belén":             ["San Antonio", "La Ribera", "La Asunción"],
    "Flores":            ["San Joaquín", "Barrantes", "Llorente"],
    "San Pablo":         ["San Pablo", "Rincón de Sabanilla"],
    "Sarapiquí":         ["Puerto Viejo", "La Virgen", "Las Horquetas", "Llanuras del Gaspar", "Cureña"]
  },
  "Guanacaste": {
    "Liberia":           ["Liberia", "Cañas Dulces", "Mayorga", "Nacascolo", "Curubandé"],
    "Nicoya":            ["Nicoya", "Mansión", "San Antonio", "Quebrada Honda", "Sámara", "Nosara", "Belén de Nosarita"],
    "Santa Cruz":        ["Santa Cruz", "Bolsón", "Veintisiete de Abril", "Tempate", "Cartagena", "Cuajiniquil", "Diriá", "Cabo Velas", "Tamarindo"],
    "Bagaces":           ["Bagaces", "La Fortuna", "Mogote", "Río Naranjo"],
    "Carrillo":          ["Filadelfia", "Palmira", "Sardinal", "Belén"],
    "Cañas":             ["Cañas", "Palmira", "San Miguel", "Bebedero", "Porozal"],
    "Abangares":         ["Las Juntas", "Sierra", "San Juan", "Colorado"],
    "Tilarán":           ["Tilarán", "Quebrada Grande", "Tronadora", "Santa Rosa", "Líbano", "Tierras Morenas", "Arenal"],
    "Nandayure":         ["Carmona", "Santa Rita", "Zapotal", "San Pablo", "Porvenir", "Bejuco"],
    "La Cruz":           ["La Cruz", "Santa Cecilia", "La Garita", "Santa Elena"],
    "Hojancha":          ["Hojancha", "Monte Romo", "Puerto Carrillo", "Huacas", "Matambú"]
  },
  "Puntarenas": {
    "Central":           ["Puntarenas", "Pitahaya", "Chomes", "Lepanto", "Paquera", "Manzanillo", "Guacimal", "Barranca", "Chacarita", "Chira", "Acapulco", "El Roble", "Arancibia"],
    "Esparza":           ["Espíritu Santo", "San Juan Grande", "Macacona", "San Rafael", "San Jerónimo", "Caldera"],
    "Buenos Aires":      ["Buenos Aires", "Volcán", "Potrero Grande", "Boruca", "Pilas", "Colinas", "Chánguena", "Biolley", "Brunka"],
    "Montes de Oro":     ["Miramar", "La Unión", "San Isidro"],
    "Osa":               ["Puerto Cortés", "Palmar", "Sierpe", "Bahía Ballena", "Piedras Blancas", "Bahía Drake"],
    "Quepos":            ["Quepos", "Savegre", "Naranjito"],
    "Golfito":           ["Golfito", "Guaycará", "Pavón"],
    "Coto Brus":         ["San Vito", "Sabalito", "Aguabuena", "Limoncito", "Pittier", "Gutiérrez Brown"],
    "Parrita":           ["Parrita"],
    "Corredores":        ["Corredor", "La Cuesta", "Canoas", "Laurel"],
    "Garabito":          ["Jacó", "Tárcoles", "Lagunillas"],
    "Monteverde":        ["Monteverde"],
    "Puerto Jiménez":    ["Puerto Jiménez", "Jiménez"]
  },
  "Limón": {
    "Central":           ["Limón", "Valle La Estrella", "Río Blanco", "Matama"],
    "Pococí":            ["Guápiles", "Jiménez", "Rita", "Roxana", "Cariari", "Colorado", "La Colonia"],
    "Siquirres":         ["Siquirres", "Pacuarito", "Florida", "Germania", "Cairo", "Alegría", "Reventazón"],
    "Talamanca":         ["Bratsi", "Sixaola", "Cahuita", "Telire"],
    "Matina":            ["Matina", "Batán", "Carrandi"],
    "Guácimo":           ["Guácimo", "Mercedes", "Pocora", "Río Jiménez", "Duacarí"]
  }
};
// Compatible con el código existente (las 7 provincias)
const PROVINCIAS = Object.keys(CR_GEO);
const ASESORES = ['Fiorela Salazar', 'Roger Cruz', 'Gustavo Valladares', 'Roberto Mora', 'Kimberly Guzmán'];
const COMO_OPTS = ['Facebook', 'Instagram', 'Google', 'Referencia de alguien más', 'Otro'];

const ID_TIPOS = [
{ id: 'nac', label: 'Cédula nacional', campo: 'Número de cédula' },
{ id: 'dimex', label: 'DIMEX', campo: 'Número de DIMEX' },
{ id: 'resid', label: 'Carnet de residencia', campo: 'Número de carnet de residencia' },
{ id: 'refug', label: 'Carnet de refugiado', campo: 'Número de carnet de refugiado' }];


// ── MAPAS DE DECODIFICACIÓN DE GRUPOS ───────────────────────────────────────────
const NIVEL_LABEL = {
  B1: { nombre: 'Básico I', color: '#E5A823', emoji: '🟡' },
  B2: { nombre: 'Básico II', color: '#E8372A', emoji: '🔴' },
  I1: { nombre: 'Intermedio I', color: '#2B7FC1', emoji: '🔵' },
  I2: { nombre: 'Intermedio II', color: '#4CAF50', emoji: '🟢' }
};
const DIAS_LABEL = {
  LM: 'Lunes y Miércoles',
  KJ: 'Martes y Jueves',
  SA: 'Sábados',
  LJ: 'Lunes a Jueves (4 días/semana)'
};
const MODALIDAD_LABEL = {
  LM: { nombre: 'Intensivo', desc: '2 clases por semana', icon: '📘' },
  KJ: { nombre: 'Intensivo', desc: '2 clases por semana', icon: '📘' },
  SA: { nombre: 'Fin de semana', desc: '1 clase por semana', icon: '📅' },
  LJ: { nombre: 'Super Intensivo', desc: '4 clases por semana', icon: '🚀' }
};

function formatHora(h) {
  if (!h) return '';
  const [hh, mm] = String(h).split(':').map(Number);
  if (Number.isNaN(hh)) return String(h);
  const ampm = hh >= 12 ? 'p.m.' : 'a.m.';
  const h12 = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
  return `${h12}:${(mm || 0).toString().padStart(2, '0')} ${ampm}`;
}
function formatFecha(f) {
  if (!f) return '';
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const [y, m, d] = String(f).split('-').map(Number);
  if (!y || !m || !d) return String(f);
  return `${d} de ${meses[m - 1]}, ${y}`;
}
// Fecha en formato día/mes/año → 15/06/2026
function formatFechaCorta(f) {
  if (!f) return '';
  const [y, m, d] = String(f).split('-').map(Number);
  if (!y || !m || !d) return String(f);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}
// Rango horario en formato militar (24h) → 18:00 – 21:00
function formatHoraMil(h) {
  if (!h) return '';
  const [hh, mm] = String(h).split(':');
  if (hh == null) return String(h);
  return `${String(Number(hh)).padStart(2, '0')}:${(mm || '00').padStart(2, '0')}`;
}

// ── DECODIFICADORES PARA CARDS DE GRUPO EXPANDIDAS (Cambio 1) ────────────────
const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
// Meses en formato largo capitalizado para el período de la card de horario.
const MESES_LARGO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
// Días con nombre completo (formato pedido por dirección para la card de horario).
const DIAS_LARGO = { L: 'Lunes', K: 'Martes', M: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado' };

// La columna DIAS en GRUPOS usa códigos de un carácter: L=lunes, K=martes,
// M=miércoles, J=jueves, V=viernes, S=sábado. "LJ" es el caso especial del
// Super Intensivo (lunes a jueves, 4 días/semana).
const DIAS_CORTO = { L: 'Lun', K: 'Mar', M: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb' };
function decodeDias(cod) {
  const c = String(cod || '').toUpperCase().trim();
  if (!c) return '';
  if (c === 'LJ') return 'Lun a Jue';                       // Super Intensivo · 4 días
  // Defensivo: deduplicar letras repetidas preservando el orden semanal
  // (por si llega un código contaminado tipo "LMLM").
  const orden = 'LKMJVS';
  const limpio = c.replace(/[^LKMJVS]/g, '');
  const uniq = limpio
    ? [...new Set(limpio.split(''))].sort((a, b) => orden.indexOf(a) - orden.indexOf(b)).join('')
    : c;
  if (uniq === 'LJ') return 'Lun a Jue';
  const parts = uniq.split('').map((ch) => DIAS_CORTO[ch]).filter(Boolean);
  return parts.length ? parts.join('/') : c;               // ej. "LM" → "Lun/Mié"
}

// Código de días CONFIABLE de un grupo. La columna DIAS de la hoja GRUPOS tiene
// 1 fila por NIVEL y puede llegar concatenada (ej. "LSMLS") cuando el backend
// junta todas las filas del grupo. El CÓDIGO del grupo siempre codifica los días
// en su 2º segmento — "B1-LM18-C3-0726" → "LM", "I1-S08-A1-0526" → "S" — así que
// preferimos esa fuente. Si no se puede, deduplicamos el campo DIAS.
function diasDeGrupo(g) {
  if (!g) return '';
  const code = String(G.cod(g) || '').toUpperCase();
  const seg = code.split('-')[1] || '';
  const fromCode = (seg.match(/^[LKMJVS]+/) || [''])[0];
  if (fromCode) return fromCode;
  return String(G.dias(g) || '').toUpperCase().replace(/[^LKMJVS]/g, '');
}

// Hora 12h compacta → "6:00pm". Rango → "6:00pm–9:00pm".
function formatHora12(h) {
  if (!h) return '';
  const [hh, mm] = String(h).split(':').map(Number);
  if (Number.isNaN(hh)) return String(h);
  const ampm = hh >= 12 ? 'pm' : 'am';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm || 0).padStart(2, '0')}${ampm}`;
}
function formatRango12(ini, fin) {
  return [formatHora12(ini), formatHora12(fin)].filter(Boolean).join('–');
}

// Días con nombre COMPLETO separados por " / " → "Lunes / Miércoles", "Martes / Jueves".
// Caso especial: "LJ" (Super Intensivo, lunes a jueves seguidos) → "Lunes a Jueves".
// Recibe el código limpio de días (lo que devuelve diasDeGrupo).
function decodeDiasLargo(cod) {
  const c = String(cod || '').toUpperCase().trim();
  if (!c) return '';
  if (c === 'LJ') return 'Lunes a Jueves';                  // Super Intensivo · 4 días seguidos
  const orden = 'LKMJVS';
  const limpio = c.replace(/[^LKMJVS]/g, '');
  const uniq = limpio
    ? [...new Set(limpio.split(''))].sort((a, b) => orden.indexOf(a) - orden.indexOf(b))
    : [];
  const parts = uniq.map((ch) => DIAS_LARGO[ch]).filter(Boolean);
  return parts.length ? parts.join(' / ') : c;             // ej. "LM" → "Lunes / Miércoles"
}

// Período en formato largo pedido por dirección:
//   "{Tipo} {N} — {MesInicio} a {MesFin} {año}"  →  "Cuatrimestre 3 — Septiembre a Diciembre 2026".
// El TIPO y el NÚMERO se deducen del CÓDIGO del grupo: un segmento "C{n}" (Cuatrimestre,
// 4 meses) o "B{n}" (Bimestre, 2 meses), p.ej. "B1-LM18-C3-0726" → "Cuatrimestre 3".
// Se ignora el 1er segmento (el nivel, p.ej. "B1") para no confundir su "B" con Bimestre.
// Los meses+año salen de FECHA_INICIO. Si el código no trae el segmento, se cae al
// helper esBimestral() + periodo_inicio como respaldo.
function buildPeriodoLargo(g) {
  const code = String(G.cod(g) || '').toUpperCase();
  const segs = code.split('-');
  let tipo = null, dur = 4, num = '';
  for (let i = 1; i < segs.length; i++) {
    const m = segs[i].match(/^([CB])(\d+)$/);
    if (m) {
      tipo = m[1] === 'B' ? 'Bimestre' : 'Cuatrimestre';
      dur = m[1] === 'B' ? 2 : 4;
      num = m[2];
      break;
    }
  }
  if (!tipo) {                                              // respaldo: código sin segmento de período
    const bim = esBimestral(g);
    tipo = bim ? 'Bimestre' : 'Cuatrimestre';
    dur = bim ? 2 : 4;
    const nm = String(g.periodo_inicio || g.periodo || '').match(/(\d+)/);
    num = nm ? nm[1] : '';
  }
  let rango = '';
  const fecha = G.fecha(g);
  if (fecha) {
    const [y, mo] = String(fecha).split('-').map(Number);
    if (y && mo) {
      const endIdx = (mo - 1 + dur - 1) % 12;               // mes final = inicio + duración − 1
      rango = `${MESES_LARGO[mo - 1]} a ${MESES_LARGO[endIdx]} ${y}`;
    }
  }
  const izq = num ? `${tipo} ${num}` : tipo;
  return rango ? `${izq} — ${rango}` : izq;
}

// Fecha de inicio corta en español → "12-may-2026"
function formatFechaInicio(f) {
  if (!f) return '';
  const [y, m, d] = String(f).split('-').map(Number);
  if (!y || !m || !d) return String(f);
  return `${String(d).padStart(2, '0')}-${MESES_CORTO[m - 1].toLowerCase()}-${y}`;
}

// ¿El grupo es de modalidad bimestral (Super Intensivo)? Cuatrimestral si no.
function esBimestral(g) {
  if (String(g.tipo_periodo || '').toUpperCase() === 'B') return true;
  if (/super/i.test(g.modalidad || '')) return true;
  if (String(G.dias(g) || '').toUpperCase() === 'LJ') return true;
  return false;
}

// Construye el string de período: "Cuatrimestre 2 · May–Ago 2026".
// Tipo ← tipo_periodo/modalidad · número ← periodo_inicio · meses+año ← fecha_inicio.
// Todo deriva de columnas reales de getGruposDisponibles; no se inventa nada.
function buildPeriodo(g) {
  if (g.periodo_label) return g.periodo_label;             // si el backend ya lo arma, respetarlo
  const bim = esBimestral(g);
  const tipoNom = bim ? 'Bimestre' : 'Cuatrimestre';
  const num = String(g.periodo_inicio || g.periodo || '').match(/(\d+)/);
  const izq = num ? `${tipoNom} ${num[1]}` : tipoNom;

  let rango = '';
  const fecha = G.fecha(g);
  if (fecha) {
    const [y, m] = String(fecha).split('-').map(Number);
    if (y && m) {
      const dur = bim ? 2 : 4;
      const endIdx = (m - 1 + dur - 1) % 12;
      rango = `${MESES_CORTO[m - 1]}–${MESES_CORTO[endIdx]} ${y}`;
    }
  }
  return rango ? `${izq} · ${rango}` : izq;
}

// ── CUPO FAKE (Cambio 2) ─────────────────────────────────────────────────────
// Cada grupo muestra un cupo "disponible" aleatorio 5–8, consistente por código
// durante toda la sesión (sobrevive navegación entre pasos y recarga de página
// dentro de la misma pestaña). Respaldado en sessionStorage.
const CUPO_FAKE_KEY = 'ins_cupo_fake_v1';
let _cupoFakeCache = null;
function _loadCupoFake() {
  if (_cupoFakeCache) return _cupoFakeCache;
  try { _cupoFakeCache = JSON.parse(sessionStorage.getItem(CUPO_FAKE_KEY)) || {}; }
  catch (_) { _cupoFakeCache = {}; }
  return _cupoFakeCache;
}
function getCupoFake(codigo) {
  const key = String(codigo || '').trim();
  if (!key) return 5;
  const map = _loadCupoFake();
  if (map[key] == null) {
    map[key] = 5 + Math.floor(Math.random() * 4);          // 5, 6, 7 u 8
    try { sessionStorage.setItem(CUPO_FAKE_KEY, JSON.stringify(map)); } catch (_) {}
  }
  return map[key];
}

// Grupos reales de demostración (cuando no hay backend conectado)
const DEMO_GRUPOS = {
  INA: [
  { codigo: 'B1-LM18-0626', nivel: 'B1', dias: 'LM', hora_inicio: '18:00', hora_fin: '21:00', fecha_inicio: '2026-06-15', cupo: 9 },
  { codigo: 'B1-KJ18-0626', nivel: 'B1', dias: 'KJ', hora_inicio: '18:00', hora_fin: '21:00', fecha_inicio: '2026-06-16', cupo: 3 },
  { codigo: 'I1-LM18-0626', nivel: 'I1', dias: 'LM', hora_inicio: '18:00', hora_fin: '21:00', fecha_inicio: '2026-06-22', cupo: 11 },
  { codigo: 'B1-LJ18-0626', nivel: 'B1', dias: 'LJ', hora_inicio: '18:00', hora_fin: '21:00', fecha_inicio: '2026-06-15', cupo: 6 },
  { codigo: 'B1-LJ13-0626', nivel: 'B1', dias: 'LJ', hora_inicio: '13:00', hora_fin: '16:00', fecha_inicio: '2026-06-22', cupo: 12 }],

  SIN_INA: [
  { codigo: 'B1-LM18-0626L', nivel: 'B1', dias: 'LM', hora_inicio: '18:00', hora_fin: '21:00', fecha_inicio: '2026-06-15', cupo: 10 },
  { codigo: 'B1-KJ18-0626L', nivel: 'B1', dias: 'KJ', hora_inicio: '18:00', hora_fin: '21:00', fecha_inicio: '2026-06-16', cupo: 7 },
  { codigo: 'I1-KJ18-0626L', nivel: 'I1', dias: 'KJ', hora_inicio: '18:00', hora_fin: '21:00', fecha_inicio: '2026-06-23', cupo: 2 },
  { codigo: 'B1-LJ18-0626L', nivel: 'B1', dias: 'LJ', hora_inicio: '18:00', hora_fin: '21:00', fecha_inicio: '2026-06-15', cupo: 8 }]

};

// Accesores tolerantes a distintos nombres de campo que pueda devolver el backend
const G = {
  cod: (g) => g.codigo || g.cod || g.id || '',
  nivel: (g) => g.nivel || g.code || '',
  dias: (g) => g.dias || g.dia || g.modalidad_cod || '',
  fecha: (g) => g.fecha_inicio || g.inicio || g.fechaInicio || '',
  doc: (g) => g.docente || g.profesor || g.prof || '',
  cupo: (g) => {
    const v = g.cupo != null ? g.cupo :
    g.cupos_disponibles != null ? g.cupos_disponibles :
    g.disponibles != null ? g.disponibles :
    g.lugares != null ? g.lugares : null;
    return v == null ? null : Number(v);
  },
  horas: (g) => {
    const ini = g.hora_inicio || g.hora_ini || g.horaInicio || '';
    const fin = g.hora_fin || g.horaFin || '';
    if (ini || fin) return { ini, fin };
    const raw = g.hora || g.horario || '';
    const parts = String(raw).split(/[-–]/).map((s) => s.trim());
    return { ini: parts[0] || '', fin: parts[1] || '' };
  }
};

// ── VALIDADORES / FORMATO ─────────────────────────────────────────────────────
const fmtCedula = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 9);
  if (d.length <= 1) return d;
  if (d.length <= 5) return `${d[0]}-${d.slice(1)}`;
  return `${d[0]}-${d.slice(1, 5)}-${d.slice(5)}`;
};
const fmtTel = (v) => {const d = v.replace(/\D/g, '').slice(0, 8);return d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d;};
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim());
const validTel = (v) => /^\d{4}-\d{4}$/.test(v || '');
const calcEdad = (fn) => {
  if (!fn) return null;
  const hoy = new Date(),nac = new Date(fn);
  if (Number.isNaN(nac.getTime())) return null;
  let e = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || m === 0 && hoy.getDate() < nac.getDate()) e--;
  return e;
};
const esMayor = (fn) => {const e = calcEdad(fn);return e == null ? true : e >= 18;};
const fmtBytes = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
const MAX_FILE = 5 * 1024 * 1024;

// ── ICONOS ──────────────────────────────────────────────────────────────────
const I = {
  cloud: 'M16 16l-4-4-4 4M12 12v9M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3',
  close: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  back: 'M19 12H5M12 19l-7-7 7-7',
  arrow: 'M5 12h14M13 5l7 7-7 7',
  eye: 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.06-5.94M9.9 4.24A10 10 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19M1 1l22 22M14.12 14.12a3 3 0 1 1-4.24-4.24',
  warn: 'M12 9v4M12 17h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z',
  alert: 'M12 8v4M12 16h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  help: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  lock: 'M5 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4',
  wa: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z'
};
const Ico = ({ d, size = 20, className }) =>
<svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d.split('|').map((p, i) => <path key={i} d={p} />)}
  </svg>;

const IcoFill = ({ d, size = 20 }) =>
<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>;


// Pequeño candado para campos prellenados desde el padrón TSE
const LockBadge = () =>
<span className="lock-badge" title="Dato verificado del padrón TSE" aria-label="Dato verificado del padrón TSE">
    <Ico d={I.lock} size={12} />
  </span>;


// ── FIELD ───────────────────────────────────────────────────────────────────
function Field({ fieldKey, label, optional, locked, children, note, noteType, error }) {
  return (
    <div className="field" id={fieldKey ? `fld-${fieldKey}` : undefined}>
      {label &&
      <div className="field-label">
          {label}
          {locked && <LockBadge />}
          {optional && <span className="opt">Opcional</span>}
        </div>
      }
      {children}
      {error && <div className="field-error"><Ico d={I.alert} size={13} /> {error}</div>}
      {note && !error && <div className={`field-note ${noteType || ''}`}>{note}</div>}
    </div>);

}

// ── UPLOAD ZONE ───────────────────────────────────────────────────────────────
function UploadZone({ docLabel, file, onFile, onClear, error }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const f = files && files[0];
    if (!f) return;
    if (f.size > MAX_FILE) {onFile(null, 'El archivo supera los 5 MB.');return;}
    const ok = f.type.startsWith('image/') || f.type === 'application/pdf';
    if (!ok) {onFile(null, 'Formato no válido. Usá JPG, PNG o PDF.');return;}
    const isImg = f.type.startsWith('image/');
    onFile({ file: f, name: f.name, size: f.size, isImg, url: isImg ? URL.createObjectURL(f) : null }, null);
  };

  if (file) {
    return (
      <div>
        <div className="fp-doclabel">{docLabel}</div>
        <div className="file-preview">
          {file.isImg ?
          <img className="fp-thumb" src={file.url} alt="" /> :
          <div className="fp-pdf">PDF</div>}
          <div className="fp-info">
            <div className="fp-name">{file.name}</div>
            <div className="fp-size">{fmtBytes(file.size)}</div>
          </div>
          <button type="button" className="fp-remove" onClick={onClear} aria-label="Quitar archivo">
            <Ico d={I.close} size={16} />
          </button>
        </div>
      </div>);

  }

  return (
    <div
      className={`upload-zone${drag ? ' drag' : ''}${error ? ' err' : ''}`}
      onClick={() => inputRef.current && inputRef.current.click()}
      onDragOver={(e) => {e.preventDefault();setDrag(true);}}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {e.preventDefault();setDrag(false);handleFiles(e.dataTransfer.files);}}>
      
      <div className="uz-doclabel">{docLabel}</div>
      <div className="uz-icon"><Ico d={I.cloud} size={30} /></div>
      <div className="uz-main">Hacé clic o arrastrá el archivo</div>
      <div className="uz-hint">JPG, PNG o PDF · máx. 5 MB</div>
      <input ref={inputRef} type="file" accept="image/*,application/pdf"
      onChange={(e) => handleFiles(e.target.files)} />
    </div>);

}

// ── PROGRESS ──────────────────────────────────────────────────────────────────
function Progress({ paso }) {
  return (
    <div className="prog-wrap">
      <div className="prog-inner">
        <div className="prog-top">
          <span className="prog-label">Paso {paso} de 2</span>
          <span className="prog-sub">{paso === 1 ? 'Datos personales' : 'Programa y financiamiento'}</span>
        </div>
        <div className="prog-track"><div className="prog-fill" style={{ width: paso === 1 ? '50%' : '100%' }} /></div>
      </div>
    </div>);

}

// ── TARJETA DE PROGRAMA ─────────────────────────────────────────────────────────
function ProgramCard({ tipo, selected, locked, onSelect, img, fallbackBg, fallbackText, badge, badgeColor, name, bullets }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className={`pcard${selected ? ' sel' : ''}${locked ? ' locked' : ''}`}
    onClick={() => {if (!locked) onSelect(tipo);}}>
      <div className="pcard-imgwrap">
        <div className={`pcard-badge ${badgeColor}`}>{badge}</div>
        {!imgErr ?
        <img className="pcard-img" src={img} alt={name} onError={() => setImgErr(true)} style={{ opacity: "1", objectFit: "contain" }} /> :
        <div className="pcard-imgfallback" style={{ background: fallbackBg }}>{fallbackText}</div>}
        {selected && !locked && <div className="pcard-check"><Ico d={I.check} size={18} /></div>}
      </div>
      <div className="pcard-body">
        <div className="pcard-name">{name}</div>
        <div className="pcard-bullets">
          {bullets.map((b, i) =>
          <div key={i} className="pcard-bullet"><Ico d={I.check} size={15} /><span>{b}</span></div>
          )}
        </div>
      </div>
      {locked &&
      <div className="pcard-overlay">
          <div className="pcard-lockmsg">Solo para cédula costarricense 🇨🇷 (requisito del INA, no académico)</div>
        </div>
      }
    </div>);

}

// ── TARJETA DE GRUPO (radio card visual) ─────────────────────────────────────────
function CupoBadge({ g }) {
  // Cupo simulado 5–8 (Cambio 2): siempre se muestra disponibilidad, nunca "lleno"
  // ni "lista de espera". Consistente por código de grupo durante la sesión.
  const disp = getCupoFake(G.cod(g));
  return <span className="cupo-badge green">{disp} {disp === 1 ? 'cupo disponible' : 'cupos disponibles'}</span>;
}

function GrupoCard({ g, selected, onSelect }) {
  const nivel = NIVEL_LABEL[G.nivel(g)] || { nombre: G.nivel(g) || 'Nivel', color: '#2B7FC1', emoji: '📘' };
  const { ini, fin } = G.horas(g);
  // Formato EXACTO pedido por dirección (6 líneas, en este orden):
  //   1) Nivel largo            → "Básico I"
  //   2) Período largo          → "Cuatrimestre 3 — Septiembre a Diciembre 2026"
  //   3) Días con nombre largo  → "Lunes / Miércoles"
  //   4) Hora                   → "6:00pm a 9:00pm"
  //   5) 🗓 Inicia + fecha      → "🗓 Inicia 14-sep-2026"
  //   6) Cupo                   → "5 cupos disponibles"
  const periodoTxt = buildPeriodoLargo(g);                             // "Cuatrimestre 3 — Septiembre a Diciembre 2026"
  const diasTxt = decodeDiasLargo(diasDeGrupo(g));                     // "Lunes / Miércoles" (días tomados del código)
  const horaTxt = (ini || fin)                                        // "6:00pm a 9:00pm" (am/pm minúsculas, separador " a ")
    ? [formatHora12(ini), formatHora12(fin)].filter(Boolean).join(' a ')
    : '';
  const fechaTxt = G.fecha(g) ? formatFechaInicio(G.fecha(g)) : '';    // "14-sep-2026"

  return (
    <div
      className={`gcard${selected ? ' sel' : ''}`}
      style={selected ? { borderColor: nivel.color, boxShadow: `0 0 0 3px ${nivel.color}22` } : undefined}
      onClick={() => onSelect(G.cod(g))}>

      <div className="gcard-top">
        <span className="gcard-nivel" style={{ background: `${nivel.color}1a`, color: nivel.color }}>
          {nivel.nombre}
        </span>
      </div>

      {periodoTxt && <div className="gh-periodo">{periodoTxt}</div>}

      {diasTxt && <div className="gh-dias">{diasTxt}</div>}

      {horaTxt && <div className="gh-hora">{horaTxt}</div>}

      <div className="gcard-meta">
        {fechaTxt && <div className="gm-row">🗓 Inicia {fechaTxt}</div>}
      </div>

      <div className="gcard-foot"><CupoBadge g={g} /></div>
    </div>);

}

function GrupoSkeleton() {
  return (
    <div className="gcard skel">
      <div className="sk-line w40" />
      <div className="sk-line w70 tall" />
      <div className="sk-line w50" />
      <div className="sk-line w30" />
    </div>);

}

// ── TARJETA DE FINANCIAMIENTO ────────────────────────────────────────────────────
function FinCard({ value, selected, locked, onSelect, icon, title, subtitle, badge }) {
  return (
    <label className={`fincard${selected ? ' sel' : ''}${locked ? ' locked' : ''}`}>
      <input type="radio" name="financiamiento" checked={selected} disabled={locked}
      onChange={() => {if (!locked) onSelect(value);}} />
      <span className="fc-icon">{icon}</span>
      <span className="fc-body">
        <span className="fc-title">{title}{badge && <span className="fc-badge">{badge}</span>}</span>
        <span className="fc-sub">{subtitle}</span>
      </span>
      {locked && <span className="fc-locktip" title="Solo para cédula costarricense"><Ico d={I.lock} size={13} /></span>}
    </label>);

}

// ── TARJETA DE EQUIPO (CONAPE) ──────────────────────────────────────────────────
function EquipoCard({ value, selected, onSelect, simple, img, fallbackBg, fallbackText, title, bullets }) {
  const [imgErr, setImgErr] = useState(false);
  if (simple) {
    return (
      <label className={`eqcard simple${selected ? ' sel' : ''}`}>
        <input type="radio" name="equipo" checked={selected} onChange={() => onSelect(value)} />
        <span className="eq-simple-txt">{title}</span>
      </label>);

  }
  return (
    <label className={`eqcard${selected ? ' sel' : ''}`}>
      <input type="radio" name="equipo" checked={selected} onChange={() => onSelect(value)} />
      <div className="eq-imgwrap">
        {!imgErr ?
        <img className="eq-img" src={img} alt={title} onError={() => setImgErr(true)} /> :
        <div className="eq-imgfallback" style={{ background: fallbackBg }}>{fallbackText}</div>}
        {selected && <div className="eq-check"><Ico d={I.check} size={15} /></div>}
      </div>
      <div className="eq-foot">
        <div className="eq-title">{title}</div>
        {bullets.map((b, i) => <div key={i} className="eq-bullet">{b}</div>)}
      </div>
    </label>);

}

// ── EXPORT ────────────────────────────────────────────────────────────────────
Object.assign(window, {
  WA_NUMBER, IMG_INA, IMG_LIBRE, IMG_BASICO, IMG_PREMIUM,
  PROVINCIAS, CR_GEO, ASESORES, COMO_OPTS, ID_TIPOS, DEMO_GRUPOS,
  NIVEL_LABEL, DIAS_LABEL, MODALIDAD_LABEL, formatHora, formatHoraMil, formatFecha, formatFechaCorta, G,
  MESES_CORTO, MESES_LARGO, DIAS_CORTO, DIAS_LARGO, decodeDias, decodeDiasLargo, diasDeGrupo, formatHora12, formatRango12, formatFechaInicio, buildPeriodo, buildPeriodoLargo, getCupoFake,
  fmtCedula, fmtTel, validEmail, validTel, calcEdad, esMayor, fmtBytes, MAX_FILE,
  I, Ico, IcoFill, LockBadge,
  Field, UploadZone, Progress, ProgramCard, GrupoCard, GrupoSkeleton, FinCard, EquipoCard
});