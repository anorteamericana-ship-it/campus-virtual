/* global React, ReactDOM */
const { useState, useEffect, useMemo, useRef } = React;

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND — Apps Script
// ─────────────────────────────────────────────────────────────────────────────
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';

const esBecaImpacta = f => f.financiamiento === 'beca' && f.beca === 'impacta';

// ─────────────────────────────────────────────────────────────────────────────
// DATOS DE REFERENCIA
// ─────────────────────────────────────────────────────────────────────────────
const PROVINCIAS_CANTONES = {
  'San José':    ['San José','Escazú','Desamparados','Puriscal','Tarrazú','Aserrí','Mora','Goicoechea','Santa Ana','Alajuelita','Vásquez de Coronado','Acosta','Tibás','Moravia','Montes de Oca','Turrubares','Dota','Curridabat','Pérez Zeledón','León Cortés'],
  'Alajuela':    ['Alajuela','San Ramón','Grecia','San Mateo','Atenas','Naranjo','Palmares','Poás','Orotina','San Carlos','Zarcero','Sarchí','Upala','Los Chiles','Guatuso','Río Cuarto'],
  'Cartago':     ['Cartago','Paraíso','La Unión','Jiménez','Turrialba','Alvarado','Oreamuno','El Guarco'],
  'Heredia':     ['Heredia','Barva','Santo Domingo','Santa Bárbara','San Rafael','San Isidro','Belén','Flores','San Pablo','Sarapiquí'],
  'Guanacaste':  ['Liberia','Nicoya','Santa Cruz','Bagaces','Carrillo','Cañas','Abangares','Tilarán','Nandayure','La Cruz','Hojancha'],
  'Puntarenas':  ['Puntarenas','Esparza','Buenos Aires','Montes de Oro','Osa','Aguirre','Golfito','Coto Brus','Parrita','Corredores','Garabito'],
  'Limón':       ['Limón','Pococí','Siquirres','Talamanca','Matina','Guácimo'],
};

// Asesores reales (del formulario de Google Forms)
const ASESORES = ['Fiorela Salazar','Roger Cruz','Gustavo Valladares','Leonardo Salazar','Kimberly Guzmán'];

const COMO_ENTERASTE = ['Facebook','Instagram','WhatsApp','Referido de un amigo','Google','TikTok','Otro'];

// ── GRUPOS ───────────────────────────────────────────────────────────────────
// modelo: 'ina' = 128h acreditado | 'sin_ina' = 96h curso libre
const GRUPOS = [
  { id:'g1', dias:'Lunes y Miércoles', hora:'6:00 pm – 9:00 pm', inicio:'18 de mayo 2026', docente:'Ricardo Arias', cupos:4,  modelo:'ina',    modalidad:'intensivo'     },
  { id:'g2', dias:'Martes y Jueves',   hora:'6:00 pm – 9:00 pm', inicio:'19 de mayo 2026', docente:'Sofía Méndez', cupos:8,  modelo:'ina',    modalidad:'intensivo'     },
  { id:'g3', dias:'Sábado',            hora:'8:00 am – 2:00 pm', inicio:'23 de mayo 2026', docente:'Kevin Brown',  cupos:0,  modelo:'ina',    modalidad:'intensivo'     },
  { id:'g4', dias:'Lunes a Jueves',    hora:'6:00 pm – 9:00 pm', inicio:'18 de mayo 2026', docente:'Ana Castro',   cupos:6,  modelo:'ina',    modalidad:'super_intensivo'},
  { id:'g5', dias:'Martes a Viernes',  hora:'9:00 am – 12:00 pm',inicio:'19 de mayo 2026', docente:'Laura Vargas', cupos:3,  modelo:'sin_ina',modalidad:'intensivo'     },
  { id:'g6', dias:'Lunes a Jueves',    hora:'9:00 am – 12:00 pm',inicio:'18 de mayo 2026', docente:'Andrés Mora',  cupos:5,  modelo:'sin_ina',modalidad:'super_intensivo'},
];

// ── PRECIOS ──────────────────────────────────────────────────────────────────
// INA: precio mayor refleja complejidad real (SIFA + I CAN + perfil docente + admin)
const PRECIOS = {
  ina: {
    matricula:    50000,
    cuota:        89000,   // ajustado vs sin_ina — refleja la carga real INA
    certificado:  18000,
  },
  sin_ina: {
    matricula:    40000,
    cuota:        74800,
    certificado:  15000,
  },
};
const PRECIO_LAPTOP_BASICO   = 360000;
const PRECIO_LAPTOP_PREMIUM  = 420000;
const PRECIO_TOEIC           = 136730;
const PRECIO_SOSTENIMIENTO_MAX = 60000; // por mes

const fmtMoney = n => '₡' + (n || 0).toLocaleString('es-CR');

// ── BECAS ────────────────────────────────────────────────────────────────────
// IMPORTANTE: Becas = pago propio con descuento. NO combinan con CONAPE.
const BECAS = [
  { id:'none',    label:'Sin beca — precio regular',  pct:0  },
  { id:'impacta', label:'Beca Impacta',               pct:25, desc:'25% descuento en matrícula y cuotas — aplica certificado NO' },
  { id:'mujer',   label:'Beca Mujer',                 pct:50, desc:'50% descuento en matrícula y cuotas — aplica certificado NO' },
];

// ─────────────────────────────────────────────────────────────────────────────
// VALIDACIONES
// ─────────────────────────────────────────────────────────────────────────────
const validarCedula = val => {
  const d = val.replace(/\D/g,'');
  return /^\d-\d{4}-\d{4}$/.test(val) || d.length === 9 || d.length === 12;
};
const validarEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validarTel   = v => /^\d{4}-\d{4}$/.test(v);
const calcEdad = fn => {
  if (!fn) return null;
  const hoy = new Date(), nac = new Date(fn);
  let e = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m===0 && hoy.getDate() < nac.getDate())) e--;
  return e;
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — heredados del sistema del campus
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --an-navy:       #0D1B2A;
    --an-navy-ink:   #1A2A3A;
    --an-granate:    #E8372A;
    --an-gold:       #E5A823;
    --an-blue:       #2B7FC1;
    --an-green:      #4CAF50;
    --ok:            #22C55E;
    --warn:          #F59E0B;
    --surface:       #FFFFFF;
    --surface-2:     #F8FAFC;
    --line:          #E2E8F0;
    --ink:           #0F172A;
    --ink-2:         #475569;
    --ink-3:         #94A3B8;
    --r-sm:          6px;
    --r-md:          10px;
    --r-lg:          16px;
    --r-pill:        999px;
    --f-mono:        'JetBrains Mono', 'Fira Code', monospace;
    --f-serif:       Georgia, serif;
    --shadow-sm:     0 1px 3px rgba(0,0,0,.08);
    --shadow-md:     0 4px 16px rgba(0,0,0,.10);
    --shadow-lg:     0 8px 32px rgba(0,0,0,.14);
  }

  body {
    font-family: 'Outfit', 'Nunito', system-ui, sans-serif;
    background: var(--surface-2);
    color: var(--ink);
    line-height: 1.5;
    min-height: 100vh;
  }

  /* ── HEADER ──────────────────────────────────────────────────────────────── */
  .ins-header {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; gap: 12px;
    padding: 12px 20px;
    background: var(--an-navy);
    border-bottom: 3px solid var(--an-granate);
    box-shadow: var(--shadow-md);
  }
  .ins-logo {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--an-granate);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 900; color: white; flex-shrink: 0;
    font-family: var(--f-serif);
  }
  .ins-brand-t1 { font-size: 14px; font-weight: 700; color: white; }
  .ins-brand-t2 { font-size: 11px; color: rgba(255,255,255,.55); }
  .ins-header-right { margin-left: auto; }

  /* ── PROGRESS ────────────────────────────────────────────────────────────── */
  .prog-wrap { background: white; border-bottom: 1px solid var(--line); padding: 14px 20px 10px; }
  .prog-steps { display: flex; align-items: flex-start; gap: 0; }
  .prog-step  { display: flex; flex-direction: column; align-items: center; flex: 1; }
  .prog-dot   { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink-3); transition: all .25s; }
  .prog-dot.done   { background: var(--ok); border-color: var(--ok); color: white; }
  .prog-dot.active { background: var(--an-granate); border-color: var(--an-granate); color: white; box-shadow: 0 0 0 3px color-mix(in srgb, var(--an-granate) 20%, transparent); }
  .prog-label { font-size: 9px; color: var(--ink-3); margin-top: 4px; text-align: center; font-weight: 600; letter-spacing: .03em; max-width: 70px; }
  .prog-label.active { color: var(--an-granate); }
  .prog-label.done   { color: var(--ok); }
  .prog-connector { flex: 1; height: 2px; background: var(--line); margin-top: 13px; transition: background .25s; }
  .prog-connector.done { background: var(--ok); }

  /* ── BODY ────────────────────────────────────────────────────────────────── */
  .ins-body { max-width: 600px; margin: 0 auto; padding: 20px 16px 100px; }

  /* ── SECTION ─────────────────────────────────────────────────────────────── */
  .sec { display: flex; flex-direction: column; gap: 16px; }
  .sec-hdr { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 4px; }
  .sec-num { width: 32px; height: 32px; border-radius: 50%; background: var(--an-navy); color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; flex-shrink: 0; }
  .sec-title { font-size: 20px; font-weight: 800; color: var(--an-navy-ink); }
  .sec-sub   { font-size: 12px; color: var(--ink-3); margin-top: 2px; }

  /* ── FIELDS ──────────────────────────────────────────────────────────────── */
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field-label { font-size: 13px; font-weight: 700; color: var(--ink-2); display: flex; align-items: center; gap: 6px; }
  .opt { font-size: 10px; background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--r-pill); padding: 1px 7px; color: var(--ink-3); font-weight: 600; }
  .field-note { font-size: 11px; color: var(--ink-3); }
  .field-note.ok   { color: var(--ok); font-weight: 600; }
  .field-note.warn { color: var(--warn); font-weight: 600; }
  .field-note.info { color: var(--an-blue); }
  .field-error { font-size: 11px; color: var(--an-granate); font-weight: 600; }

  input[type="text"], input[type="email"], input[type="date"],
  input[type="number"], select, textarea {
    width: 100%; padding: 10px 12px; border: 1.5px solid var(--line);
    border-radius: var(--r-md); font-family: inherit; font-size: 14px;
    color: var(--ink); background: var(--surface); outline: none;
    transition: border-color .2s, box-shadow .2s;
    -webkit-appearance: none;
  }
  input:focus, select:focus, textarea:focus {
    border-color: var(--an-granate);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--an-granate) 12%, transparent);
  }
  input.error, select.error { border-color: var(--an-granate); }

  .field-prefix {
    display: flex; align-items: center; border: 1.5px solid var(--line);
    border-radius: var(--r-md); overflow: hidden; background: var(--surface);
    transition: border-color .2s, box-shadow .2s;
  }
  .field-prefix:focus-within {
    border-color: var(--an-granate);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--an-granate) 12%, transparent);
  }
  .field-prefix.error-border { border-color: var(--an-granate); }
  .field-prefix > span { padding: 10px 12px; background: var(--surface-2); font-size: 12px; font-weight: 700; color: var(--ink-3); border-right: 1px solid var(--line); flex-shrink: 0; white-space: nowrap; }
  .field-prefix input { border: none; border-radius: 0; box-shadow: none; padding-left: 10px; }
  .field-prefix input:focus { box-shadow: none; }

  /* ── GRID ────────────────────────────────────────────────────────────────── */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 480px) { .grid-2 { grid-template-columns: 1fr; } }

  /* ── RADIO CARDS ─────────────────────────────────────────────────────────── */
  .radio-cards { display: flex; flex-direction: column; gap: 10px; }
  .radio-cards.row { flex-direction: row; flex-wrap: wrap; }
  .radio-card {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 14px 16px; border: 1.5px solid var(--line);
    border-radius: var(--r-lg); cursor: pointer; background: var(--surface);
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .radio-card:hover { border-color: color-mix(in srgb, var(--an-granate) 40%, transparent); }
  .radio-card.sel-red   { border-color: var(--an-granate); background: color-mix(in srgb, var(--an-granate) 5%, white); box-shadow: 0 0 0 3px color-mix(in srgb, var(--an-granate) 10%, transparent); }
  .radio-card.sel-navy  { border-color: var(--an-navy);    background: color-mix(in srgb, var(--an-navy) 5%, white);    box-shadow: 0 0 0 3px color-mix(in srgb, var(--an-navy) 10%, transparent); }
  .radio-card.sel-gold  { border-color: var(--an-gold);    background: color-mix(in srgb, var(--an-gold) 6%, white);    box-shadow: 0 0 0 3px color-mix(in srgb, var(--an-gold) 10%, transparent); }
  .radio-card.sel-green { border-color: var(--ok);         background: color-mix(in srgb, var(--ok) 5%, white);         box-shadow: 0 0 0 3px color-mix(in srgb, var(--ok) 10%, transparent); }
  .radio-card input[type="radio"] { margin-top: 2px; accent-color: var(--an-granate); flex-shrink: 0; }
  .rc-icon  { font-size: 22px; flex-shrink: 0; }
  .rc-title { font-size: 14px; font-weight: 700; color: var(--ink); }
  .rc-sub   { font-size: 11px; font-weight: 700; color: var(--an-granate); margin-top: 2px; letter-spacing: .03em; text-transform: uppercase; }
  .rc-detail { font-size: 12px; color: var(--ink-2); margin-top: 4px; line-height: 1.45; }
  .rc-badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: var(--r-pill); margin-top: 6px; }

  /* ── HORARIO CARDS ───────────────────────────────────────────────────────── */
  .horario-grid { display: flex; flex-direction: column; gap: 10px; }
  .hc {
    display: flex; align-items: center; gap: 12px; padding: 14px 16px;
    border: 1.5px solid var(--line); border-radius: var(--r-lg);
    cursor: pointer; background: var(--surface); transition: all .2s;
  }
  .hc:hover:not(.lleno) { border-color: var(--an-granate); }
  .hc.sel   { border-color: var(--an-granate); background: color-mix(in srgb, var(--an-granate) 5%, white); box-shadow: 0 0 0 3px color-mix(in srgb, var(--an-granate) 10%, transparent); }
  .hc.lleno { opacity: .55; cursor: default; }
  .hc-days  { font-size: 13px; font-weight: 700; color: var(--ink); }
  .hc-time  { font-size: 12px; color: var(--ink-2); margin-top: 2px; }
  .hc-start { font-size: 11px; color: var(--ink-3); margin-top: 2px; }
  .hc-check { width: 22px; height: 22px; border-radius: 50%; background: var(--an-granate); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
  .cupos-badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: var(--r-pill); margin-top: 6px; }
  .cupos-ok   { background: color-mix(in srgb, var(--ok) 12%, white); color: #166534; }
  .cupos-warn { background: color-mix(in srgb, var(--warn) 15%, white); color: #92400E; }
  .cupos-lleno { background: color-mix(in srgb, var(--an-granate) 10%, white); color: #991B1B; }
  .modelo-tag { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: var(--r-pill); letter-spacing: .05em; text-transform: uppercase; }
  .modelo-ina    { background: color-mix(in srgb, var(--an-navy) 10%, white); color: var(--an-navy); }
  .modelo-sinina { background: var(--surface-2); color: var(--ink-3); }

  /* ── INFO BOX ─────────────────────────────────────────────────────────────── */
  .info-box {
    padding: 12px 16px; border-radius: var(--r-md); font-size: 13px; line-height: 1.5;
    display: flex; gap: 10px; align-items: flex-start;
  }
  .info-box.info { background: color-mix(in srgb, var(--an-blue) 8%, white); color: #1E4A7A; border-left: 3px solid var(--an-blue); }
  .info-box.warn { background: color-mix(in srgb, var(--warn) 10%, white); color: #92400E; border-left: 3px solid var(--warn); }
  .info-box.ok   { background: color-mix(in srgb, var(--ok) 8%, white); color: #166534; border-left: 3px solid var(--ok); }
  .info-box.navy { background: color-mix(in srgb, var(--an-navy) 6%, white); color: var(--an-navy); border-left: 3px solid var(--an-navy); }
  .info-box.red  { background: color-mix(in srgb, var(--an-granate) 8%, white); color: #991B1B; border-left: 3px solid var(--an-granate); }

  /* ── MENOR CARD ──────────────────────────────────────────────────────────── */
  .menor-card { padding: 16px; background: color-mix(in srgb, var(--an-gold) 8%, white); border: 1px solid color-mix(in srgb, var(--an-gold) 30%, transparent); border-radius: var(--r-lg); display: flex; flex-direction: column; gap: 12px; }
  .menor-title { font-size: 13px; font-weight: 700; color: #92400E; }

  /* ── RESUMEN ─────────────────────────────────────────────────────────────── */
  .resumen {
    border-radius: var(--r-lg); overflow: hidden;
    background: linear-gradient(135deg, var(--an-navy) 0%, #1E3A5F 100%);
    color: white; padding: 20px;
    box-shadow: var(--shadow-lg);
    position: relative;
  }
  .resumen::before {
    content:''; position:absolute; inset:0;
    background: radial-gradient(circle at 80% 20%, rgba(232,55,42,.15) 0%, transparent 60%);
    pointer-events:none;
  }
  .res-title { font-size: 11px; font-weight: 800; letter-spacing: .15em; text-transform: uppercase; opacity: .6; margin-bottom: 14px; }
  .res-row { display: flex; justify-content: space-between; align-items: baseline; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,.08); }
  .res-label { font-size: 12px; color: rgba(255,255,255,.65); }
  .res-val   { font-size: 13px; font-weight: 600; color: white; }
  .res-divider { height: 1px; background: rgba(255,255,255,.15); margin: 12px 0; }
  .res-section-label { font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.45); margin: 10px 0 6px; }
  .res-total { display: flex; justify-content: space-between; align-items: baseline; padding: 12px 16px; background: rgba(255,255,255,.1); border-radius: var(--r-md); margin-top: 12px; }
  .res-total-label { font-size: 12px; font-weight: 700; color: rgba(255,255,255,.85); }
  .res-total-val   { font-size: 20px; font-weight: 800; color: var(--an-gold); }
  .res-note { font-size: 10px; opacity: .5; margin-top: 6px; }

  /* ── GATES ───────────────────────────────────────────────────────────────── */
  .gate-card {
    background: white; border-radius: var(--r-lg); padding: 24px;
    text-align: center; box-shadow: var(--shadow-md);
    border: 1.5px solid var(--line);
  }
  .gate-icon { font-size: 48px; margin-bottom: 16px; }
  .gate-title { font-size: 22px; font-weight: 800; color: var(--an-navy); margin-bottom: 8px; }
  .gate-sub   { font-size: 14px; color: var(--ink-2); line-height: 1.6; margin-bottom: 20px; }

  /* ── BUTTONS ─────────────────────────────────────────────────────────────── */
  .btn-primary {
    width: 100%; padding: 14px; border: none; border-radius: var(--r-md);
    background: linear-gradient(135deg, var(--an-granate), color-mix(in srgb, var(--an-granate) 80%, black));
    color: white; font-size: 15px; font-weight: 700; cursor: pointer;
    font-family: inherit; transition: opacity .2s, transform .1s;
    box-shadow: 0 4px 12px color-mix(in srgb, var(--an-granate) 35%, transparent);
    letter-spacing: .01em;
  }
  .btn-primary:hover { opacity: .92; }
  .btn-primary:active { transform: scale(.98); }
  .btn-secondary {
    width: 100%; padding: 14px; border: 1.5px solid var(--line);
    border-radius: var(--r-md); background: var(--surface);
    color: var(--ink-2); font-size: 14px; font-weight: 600;
    cursor: pointer; font-family: inherit; transition: all .2s;
  }
  .btn-secondary:hover { border-color: var(--an-navy); color: var(--an-navy); }

  .nav-btns { display: grid; gap: 10px; margin-top: 8px; }
  .nav-btns.two { grid-template-columns: 1fr 1fr; }

  /* ── CONFIRM ─────────────────────────────────────────────────────────────── */
  .confirm-wrap { display: flex; flex-direction: column; gap: 20px; }
  .confirm-hero {
    background: linear-gradient(135deg, var(--an-navy), #1E3A5F);
    border-radius: var(--r-lg); padding: 32px 24px; text-align: center;
    color: white; box-shadow: var(--shadow-lg);
  }
  .confirm-emoji { font-size: 52px; margin-bottom: 12px; }
  .confirm-h1    { font-size: 24px; font-weight: 800; margin-bottom: 6px; }
  .confirm-sub   { font-size: 14px; opacity: .7; margin-bottom: 16px; }
  .confirm-num   { display: inline-block; font-family: var(--f-mono); font-size: 22px; font-weight: 700; color: var(--an-gold); background: rgba(255,255,255,.1); padding: 8px 20px; border-radius: var(--r-pill); letter-spacing: .08em; }

  /* ── UBICACION SCREEN ────────────────────────────────────────────────────── */
  .ubic-screen {
    max-width: 560px; margin: 40px auto; padding: 0 16px;
  }
  .ubic-card {
    background: white; border-radius: var(--r-lg); overflow: hidden;
    box-shadow: var(--shadow-lg); border: 1px solid var(--line);
  }
  .ubic-top { background: linear-gradient(135deg, var(--an-navy) 0%, #1E3A5F 100%); padding: 28px 24px; text-align: center; }
  .ubic-emoji { font-size: 44px; margin-bottom: 12px; }
  .ubic-title { font-size: 20px; font-weight: 800; color: white; margin-bottom: 6px; }
  .ubic-desc  { font-size: 13px; color: rgba(255,255,255,.7); line-height: 1.6; }
  .ubic-body  { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
  .ubic-step  { display: flex; gap: 12px; align-items: flex-start; }
  .ubic-dot   { width: 28px; height: 28px; border-radius: 50%; background: var(--an-granate); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
  .ubic-step-text { font-size: 13px; color: var(--ink-2); line-height: 1.5; padding-top: 4px; }
  .ubic-step-text strong { color: var(--ink); }

  /* ── CHECKS ──────────────────────────────────────────────────────────────── */
  .check-row { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: var(--ink-2); cursor: pointer; }
  .check-row input { margin-top: 2px; accent-color: var(--an-granate); flex-shrink: 0; }
  .check-row a { color: var(--an-granate); }

  /* ── CONAPE BADGE ────────────────────────────────────────────────────────── */
  .conape-badge { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: color-mix(in srgb, var(--an-navy) 6%, white); border-radius: var(--r-md); font-size: 12px; color: var(--an-navy); font-weight: 600; }

  /* ── AGE BADGE ───────────────────────────────────────────────────────────── */
  .age-badge { font-size: 11px; background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--r-pill); padding: 1px 8px; color: var(--ink-3); font-weight: 600; }

  /* ── STICKY NAV ──────────────────────────────────────────────────────────── */
  .sticky-nav { position: fixed; bottom: 0; left: 0; right: 0; background: white; border-top: 1px solid var(--line); padding: 12px 16px; z-index: 50; box-shadow: 0 -4px 16px rgba(0,0,0,.08); }
  .sticky-inner { max-width: 600px; margin: 0 auto; display: grid; gap: 8px; }
  .sticky-inner.two { grid-template-columns: 1fr 1fr; }

  /* ── PAY METHODS ─────────────────────────────────────────────────────────── */
  .pay-method { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); }
  .pay-icon  { font-size: 20px; }
  .pay-title { font-size: 13px; font-weight: 700; color: var(--ink); }
  .pay-detail { font-size: 11px; color: var(--ink-3); margin-top: 2px; font-family: var(--f-mono); }

  /* ── DIVIDER ─────────────────────────────────────────────────────────────── */
  .divider { height: 1px; background: var(--line); margin: 4px 0; }

  .tag-ina    { background: color-mix(in srgb, var(--an-navy) 10%, white); color: var(--an-navy); font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: var(--r-pill); letter-spacing: .05em; }
  .tag-sinina { background: var(--surface-2); color: var(--ink-3); border: 1px solid var(--line); font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: var(--r-pill); }

  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, optional, children, note, noteType, error }) {
  return (
    <div className="field">
      <div className="field-label">{label}{optional && <span className="opt">Opcional</span>}</div>
      {children}
      {error && <div className="field-error">{error}</div>}
      {note && !error && <div className={`field-note ${noteType||''}`}>{note}</div>}
    </div>
  );
}

function SectionHeader({ num, title, subtitle }) {
  return (
    <div className="sec-hdr">
      <div className="sec-num">{num}</div>
      <div>
        <div className="sec-title">{title}</div>
        {subtitle && <div className="sec-sub">{subtitle}</div>}
      </div>
    </div>
  );
}

function InfoBox({ type='info', children }) {
  const icons = { info:'ℹ️', warn:'⚠️', ok:'✅', navy:'📋', red:'🚫' };
  return (
    <div className={`info-box ${type}`}>
      <span>{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}

function RadioCard({ checked, onChange, accent='red', icon, title, sub, detail, badge, badgeColor, extra }) {
  const cls = checked ? `radio-card sel-${accent}` : 'radio-card';
  return (
    <label className={cls} style={{ cursor:'pointer' }}>
      <input type="radio" checked={checked} onChange={onChange} style={{ marginTop:2, flexShrink:0 }} />
      {icon && <span className="rc-icon">{icon}</span>}
      <div style={{ flex:1 }}>
        <div className="rc-title">{title}</div>
        {sub    && <div className="rc-sub">{sub}</div>}
        {detail && <div className="rc-detail">{detail}</div>}
        {badge  && <span className="rc-badge" style={{ background: badgeColor||'var(--surface-2)', color:'var(--ink-2)' }}>{badge}</span>}
        {extra}
      </div>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = ['Datos','Programa','Financiamiento','Horario','Confirmar'];

function ProgressBar({ step }) {
  return (
    <div className="prog-wrap">
      <div className="prog-steps">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n < step ? 'done' : n === step ? 'active' : '';
          return (
            <React.Fragment key={i}>
              {i > 0 && <div className={`prog-connector${n <= step ? ' done' : ''}`} />}
              <div className="prog-step">
                <div className={`prog-dot ${state}`}>{state==='done' ? '✓' : n}</div>
                <div className={`prog-label ${state}`}>{label}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA DE UBICACIÓN (sale del flujo principal)
// ─────────────────────────────────────────────────────────────────────────────
function PantallaUbicacion({ form, onBack }) {
  const proNum = `UB-2026-${String(Math.floor(Math.random()*900+100)).padStart(4,'0')}`;
  return (
    <div className="ubic-screen">
      <div className="ubic-card">
        <div className="ubic-top">
          <div className="ubic-emoji">🎯</div>
          <div className="ubic-title">¡Tu solicitud fue registrada!</div>
          <div className="ubic-desc">
            Tu número de solicitud de ubicación es<br />
            <strong style={{ color:'var(--an-gold)', fontFamily:'var(--f-mono)', fontSize:18 }}>{proNum}</strong>
          </div>
        </div>
        <div className="ubic-body">
          <InfoBox type="navy">
            Tienes conocimientos previos de inglés, por lo que necesitamos evaluar tu nivel exacto antes de asignarte a un grupo.
          </InfoBox>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--ink-3)', letterSpacing:'.1em', textTransform:'uppercase' }}>¿Qué sigue?</div>
          {[
            ['Un asesor te contactará', `${form.asesor || 'Tu asesor asignado'} se comunicará contigo por WhatsApp en menos de 24 horas.`],
            ['Coordinar el Examen de Ubicación', 'El examen se aplica vía Zoom con un docente certificado. Tiene costo adicional.'],
            ['Resultado y asignación de grupo', 'Según tu nivel (B1, B2, I1 o I2) te indicaremos los grupos disponibles y sus horarios.'],
            ['Matrícula oficial', 'Una vez confirmado tu nivel y grupo, completás el proceso de inscripción.'],
          ].map(([title, desc], i) => (
            <div key={i} className="ubic-step">
              <div className="ubic-dot">{i+1}</div>
              <div className="ubic-step-text"><strong>{title}:</strong> {desc}</div>
            </div>
          ))}
          <div className="divider" />
          <div style={{ fontSize:13, fontWeight:700, color:'var(--ink-2)' }}>Datos registrados</div>
          {[['Nombre', form.nombre||'—'],['WhatsApp', `+506 ${form.whatsapp}`],['Asesor', form.asesor||'Por asignar']].map(([k,v],i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--ink-3)', padding:'4px 0', borderBottom:'1px solid var(--line)' }}>
              <span>{k}</span><span style={{ fontWeight:600, color:'var(--ink)' }}>{v}</span>
            </div>
          ))}
          <button onClick={onBack} className="btn-secondary" style={{ marginTop:4 }}>← Registrar otra persona</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 1 — DATOS PERSONALES
// ─────────────────────────────────────────────────────────────────────────────
function Paso1({ form, set, errors }) {
  const edad = calcEdad(form.fechaNac);
  const cantones = PROVINCIAS_CANTONES[form.provincia] || [];
  const fmtTel = v => { const d = v.replace(/\D/g,'').slice(0,8); return d.length > 4 ? `${d.slice(0,4)}-${d.slice(4)}` : d; };
  const fmtCedula = v => {
    const d = v.replace(/\D/g,'');
    if (d.length<=1) return d;
    if (d.length<=5) return `${d[0]}-${d.slice(1)}`;
    if (d.length<=9) return `${d[0]}-${d.slice(1,5)}-${d.slice(5)}`;
    return v.slice(0,12);
  };

  return (
    <div className="sec">
      <SectionHeader num="1" title="Datos personales" subtitle="Tal como aparecen en tu documento de identidad" />

      {/* ── PREGUNTA GATE: ¿Inglés previo? ── */}
      <Field label="¿Tienes conocimientos previos de inglés?" error={errors.inglesNivel}>
        <div className="radio-cards">
          <RadioCard
            checked={form.inglesNivel==='cero'} onChange={() => set('inglesNivel','cero')}
            accent="red" icon="🚀"
            title="No, empiezo desde cero"
            detail="Iniciarás en Básico I — el primer nivel del programa."
          />
          <RadioCard
            checked={form.inglesNivel==='previo'} onChange={() => set('inglesNivel','previo')}
            accent="navy" icon="📚"
            title="Sí, tengo inglés previo"
            detail="Aplicaremos un Examen de Ubicación para determinar tu nivel exacto antes de asignarte grupo."
          />
        </div>
      </Field>

      {form.inglesNivel === 'previo' && (
        <InfoBox type="warn">
          Para continuar necesitamos coordinar tu <strong>Examen de Ubicación</strong>. Al registrarte, un asesor te contactará en menos de 24 horas para coordinar el examen y luego asignarte al grupo que corresponde.
        </InfoBox>
      )}

      <div className="divider" />

      {/* ── DATOS BÁSICOS ── */}
      <Field label="Nombre completo" error={errors.nombre}>
        <input value={form.nombre} onChange={e=>set('nombre',e.target.value.toUpperCase())} placeholder="APELLIDO APELLIDO NOMBRE" className={errors.nombre?'error':''} />
      </Field>

      <Field label="Tipo de documento" error={errors.cedulaTipo}>
        <div className="radio-cards row">
          {['Cédula nacional','DIMEX','Carnet de residencia','Carnet de refugiado'].map(t => (
            <label key={t} style={{
              display:'flex', alignItems:'center', gap:6, padding:'8px 12px',
              border:`1.5px solid ${form.cedulaTipo===t?'var(--an-granate)':'var(--line)'}`,
              borderRadius:'var(--r-md)', cursor:'pointer', fontSize:12, fontWeight:600,
              background: form.cedulaTipo===t?'color-mix(in srgb, var(--an-granate) 5%, white)':'var(--surface)',
              flexShrink:0,
            }}>
              <input type="radio" name="cedulaTipo" checked={form.cedulaTipo===t} onChange={() => { set('cedulaTipo',t); set('cedula',''); }} style={{ accentColor:'var(--an-granate)' }} />
              {t}
            </label>
          ))}
        </div>
        <InfoBox type="warn">El pasaporte no es válido como documento de matrícula INA.</InfoBox>
      </Field>

      <Field label="Número de documento" error={errors.cedula}>
        <div className={`field-prefix${errors.cedula?' error-border':''}`}>
          <span>🪪</span>
          <input value={form.cedula}
            onChange={e => set('cedula', form.cedulaTipo==='Cédula nacional' ? fmtCedula(e.target.value) : e.target.value.replace(/\D/g,'').slice(0,12))}
            placeholder={form.cedulaTipo==='Cédula nacional'?'1-2345-6789':'Número de documento'}
            style={{ fontFamily:'var(--f-mono)', letterSpacing:'.04em' }} />
        </div>
        {form.cedula && validarCedula(form.cedula) && <div className="field-note ok">✓ Formato válido</div>}
      </Field>

      <div className="grid-2">
        <Field label={<>Fecha de nacimiento {edad!==null && <span className="age-badge">{edad} años</span>}</>} error={errors.fechaNac}>
          <input type="date" value={form.fechaNac} onChange={e=>set('fechaNac',e.target.value)} className={errors.fechaNac?'error':''} />
        </Field>
        <Field label="Provincia" error={errors.provincia}>
          <select value={form.provincia} onChange={e=>{ set('provincia',e.target.value); set('canton',''); }} className={errors.provincia?'error':''}>
            <option value="">Selecciona provincia...</option>
            {Object.keys(PROVINCIAS_CANTONES).map(p=><option key={p}>{p}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid-2">
        <Field label="Cantón" error={errors.canton}>
          <select value={form.canton} onChange={e=>set('canton',e.target.value)} disabled={!form.provincia} className={errors.canton?'error':''}>
            <option value="">Selecciona cantón...</option>
            {cantones.map(c=><option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Dirección exacta" error={errors.direccion}>
          <input value={form.direccion} onChange={e=>set('direccion',e.target.value)} placeholder="Barrio, señas o número" className={errors.direccion?'error':''} />
        </Field>
      </div>

      <Field label="Correo electrónico" note="Será tu usuario en el campus virtual" noteType="info" error={errors.correo}>
        <input type="email" value={form.correo} onChange={e=>set('correo',e.target.value)} placeholder="tucorreo@ejemplo.com" className={errors.correo?'error':''} />
      </Field>

      <div className="grid-2">
        <Field label="Contraseña" note="Mínimo 6 caracteres. La usarás para ingresar al campus." error={errors.clave}>
          <input type="password" value={form.clave||''} onChange={e=>set('clave',e.target.value)} placeholder="Elegí una contraseña segura" className={errors.clave?'error':''} />
        </Field>
        <Field label="Confirmar contraseña" error={errors.claveConfirm}>
          <input type="password" value={form.claveConfirm||''} onChange={e=>set('claveConfirm',e.target.value)} placeholder="Repetí tu contraseña" className={errors.claveConfirm?'error':''} />
        </Field>
      </div>

      <div className="grid-2">
        <Field label="WhatsApp" error={errors.whatsapp}>
          <div className={`field-prefix${errors.whatsapp?' error-border':''}`}>
            <span>+506</span>
            <input value={form.whatsapp} onChange={e=>set('whatsapp',fmtTel(e.target.value))} placeholder="8888-8888" />
          </div>
        </Field>
        <Field label="Teléfono adicional" optional>
          <div className="field-prefix">
            <span>+506</span>
            <input value={form.telAdicional} onChange={e=>set('telAdicional',fmtTel(e.target.value))} placeholder="8888-8888" />
          </div>
        </Field>
      </div>

      <Field label="¿Eres mayor de edad?" error={errors.mayorEdad}>
        <div className="radio-cards row">
          {[['si','Sí, soy mayor de edad'],['no','No, soy menor de edad']].map(([v,l])=>(
            <label key={v} style={{
              display:'flex', alignItems:'center', gap:8, padding:'10px 14px',
              border:`1.5px solid ${form.mayorEdad===v?'var(--an-granate)':'var(--line)'}`,
              borderRadius:'var(--r-md)', cursor:'pointer', fontSize:13, fontWeight:500,
              background: form.mayorEdad===v?'color-mix(in srgb, var(--an-granate) 6%, white)':'var(--surface)',
            }}>
              <input type="radio" checked={form.mayorEdad===v} onChange={()=>set('mayorEdad',v)} style={{ accentColor:'var(--an-granate)' }} />
              {l}
            </label>
          ))}
        </div>
      </Field>

      {form.mayorEdad==='no' && (
        <div className="menor-card">
          <div className="menor-title">👨‍👩‍👧 Datos del encargado legal · Requerido para menores de edad</div>
          <div className="grid-2">
            <Field label="Nombre del encargado" error={errors.repNombre}>
              <input value={form.repNombre} onChange={e=>set('repNombre',e.target.value.toUpperCase())} placeholder="APELLIDO APELLIDO NOMBRE" className={errors.repNombre?'error':''} />
            </Field>
            <Field label="Cédula del encargado" error={errors.repCedula}>
              <input value={form.repCedula} onChange={e=>set('repCedula',e.target.value)} placeholder="1-2345-6789" style={{ fontFamily:'var(--f-mono)' }} />
            </Field>
          </div>
          <div className="grid-2">
            <Field label="WhatsApp del encargado" error={errors.repTel}>
              <div className="field-prefix"><span>+506</span><input value={form.repTel} onChange={e=>set('repTel', e.target.value.replace(/\D/g,'').slice(0,8))} placeholder="8888-8888" /></div>
            </Field>
            <Field label="Correo del encargado" optional>
              <input type="email" value={form.repCorreo} onChange={e=>set('repCorreo',e.target.value)} placeholder="encargado@ejemplo.com" />
            </Field>
          </div>
          <InfoBox type="info">El encargado tendrá acceso de <strong>solo lectura</strong> al campus: notas, asistencia y calendario. Sin posibilidad de publicar ni interactuar.</InfoBox>
        </div>
      )}

      <Field label="Asesor que te atendió" optional>
        <select value={form.asesor} onChange={e=>set('asesor',e.target.value)}>
          <option value="">No sé / nadie me atendió</option>
          {ASESORES.map(a=><option key={a}>{a}</option>)}
        </select>
      </Field>

      <Field label="¿Cómo te enteraste de la academia?" error={errors.comoEnteraste}>
        <select value={form.comoEnteraste} onChange={e=>set('comoEnteraste',e.target.value)} className={errors.comoEnteraste?'error':''}>
          <option value="">Selecciona...</option>
          {COMO_ENTERASTE.map(o=><option key={o}>{o}</option>)}
        </select>
      </Field>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 2 — PROGRAMA (INA vs Sin INA)
// ─────────────────────────────────────────────────────────────────────────────
function Paso2({ form, set, errors }) {
  return (
    <div className="sec">
      <SectionHeader num="2" title="Selecciona tu programa" subtitle="Define el tipo de curso y certificación que deseas" />

      <Field label="¿Qué tipo de programa querés?" error={errors.programa}>
        <div className="radio-cards">
          <RadioCard
            checked={form.programa==='ina'} onChange={() => set('programa','ina')}
            accent="navy" icon="🏛️"
            title="Programa INA Acreditado"
            sub="Con certificado oficial del INA"
            detail="128h por nivel (96h curso + 32h Club I CAN) · Compatible con financiamiento CONAPE · Acreditación INA Resolución 2519 · 4 niveles = Título del Programa"
            extra={
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
                <span className="tag-ina">INA Acreditado</span>
                <span className="rc-badge" style={{ background:'color-mix(in srgb, var(--ok) 12%, white)', color:'#166534' }}>CONAPE compatible</span>
                <span className="rc-badge" style={{ background:'color-mix(in srgb, var(--an-gold) 15%, white)', color:'#92400E' }}>128h / nivel</span>
              </div>
            }
          />
          <RadioCard
            checked={form.programa==='sin_ina'} onChange={() => { set('programa','sin_ina'); if(form.financiamiento==='conape') set('financiamiento',''); }}
            accent="red" icon="📖"
            title="Programa Libre"
            sub="Curso propio de la academia"
            detail="96h por nivel · Certificado propio de la academia · Sin Club I CAN · Sin SIFA · 4 niveles = Título del Programa · No compatible con CONAPE"
            extra={
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
                <span className="tag-sinina">Programa propio</span>
                <span className="rc-badge" style={{ background:'color-mix(in srgb, var(--an-granate) 10%, white)', color:'#991B1B' }}>96h / nivel</span>
              </div>
            }
          />
        </div>
      </Field>

      {form.programa === 'ina' && (
        <InfoBox type="navy">
          El programa INA incluye el <strong>Club I CAN</strong> (32h de conversación libre) y el seguimiento en el sistema oficial SIFA del INA. Esto garantiza tu certificado oficial y permite financiamiento CONAPE.
        </InfoBox>
      )}
      {form.programa === 'sin_ina' && (
        <InfoBox type="info">
          El Programa Libre sigue nuestro cronograma de módulo simplificado. No requiere SIFA ni Club I CAN. <strong>No es compatible con financiamiento CONAPE</strong> — podés pagar directo o solicitar una beca.
        </InfoBox>
      )}

      <InfoBox type="ok">
        En ambos programas: completar los <strong>4 niveles</strong> te da derecho al <strong>Título del Programa Completo</strong>. Si cursás solo algunos niveles, recibirás el certificado de cada nivel completado.
      </InfoBox>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 3 — FINANCIAMIENTO
// ─────────────────────────────────────────────────────────────────────────────
function Paso3({ form, set, errors }) {
  const esINA = form.programa === 'ina';

  return (
    <div className="sec">
      <SectionHeader num="3" title="Financiamiento" subtitle="Elegí cómo querés cubrir el costo del programa" />

      {/* ── OPCIONES PRINCIPALES ── */}
      <Field label="¿Cómo querés financiar tu curso?" error={errors.financiamiento}>
        <div className="radio-cards">

          {/* Pago regular — siempre disponible */}
          <RadioCard
            checked={form.financiamiento==='regular'} onChange={() => { set('financiamiento','regular'); set('beca','none'); }}
            accent="red" icon="💳"
            title="Pago directo"
            detail="Pagás matrícula y cuotas mensuales a la academia. Sin trámites adicionales."
          />

          {/* CONAPE — solo INA */}
          {esINA ? (
            <RadioCard
              checked={form.financiamiento==='conape'} onChange={() => { set('financiamiento','conape'); set('beca','none'); }}
              accent="navy" icon="🏦"
              title="Financiamiento CONAPE"
              sub="100% financiado, sin fiador, sin intereses"
              detail="CONAPE cubre matrícula, curso, sostenimiento y equipo. Proceso de solicitud ~15 días hábiles. Pagás al finalizar."
              extra={
                <div style={{ marginTop:8 }}>
                  <div className="conape-badge">🏦 Compatible con Programa INA · Incluye TOEIC opcional</div>
                </div>
              }
            />
          ) : (
            <div style={{ padding:'14px 16px', border:'1.5px solid var(--line)', borderRadius:'var(--r-lg)', opacity:.5, fontSize:13, color:'var(--ink-3)' }}>
              🏦 CONAPE no está disponible para el Programa Libre
            </div>
          )}

          {/* Becas — pago propio con descuento */}
          {BECAS.filter(b=>b.id!=='none').map(beca => (
            <RadioCard
              key={beca.id}
              checked={form.financiamiento==='beca' && form.beca===beca.id}
              onChange={() => { set('financiamiento','beca'); set('beca',beca.id); }}
              accent="gold" icon={beca.id==='mujer'?'👩':'🎓'}
              title={beca.label}
              detail={beca.desc}
              badge={`−${beca.pct}% en matrícula y cuotas`}
              badgeColor="color-mix(in srgb, var(--an-gold) 15%, white)"
            />
          ))}
        </div>
      </Field>

      {/* ── CONAPE: SUBPREGUNTAS ── */}
      {form.financiamiento === 'conape' && (
        <>
          <div className="divider" />
          <div style={{ fontSize:13, fontWeight:700, color:'var(--ink-3)', letterSpacing:'.08em', textTransform:'uppercase' }}>Opciones CONAPE adicionales</div>

          {/* Laptop */}
          <Field label="¿Deseás incluir una laptop en tu financiamiento?">
            <div className="radio-cards">
              <RadioCard
                checked={form.laptop==='basico'} onChange={() => set('laptop','basico')}
                accent="navy" icon="💻"
                title="Plan Básico — HP 15 Notebook"
                detail={`${fmtMoney(PRECIO_LAPTOP_BASICO)} · Laptop HP 15 Intel i3 · Sujeto a disponibilidad`}
              />
              <RadioCard
                checked={form.laptop==='premium'} onChange={() => set('laptop','premium')}
                accent="navy" icon="🖥️"
                title="Plan Premium — HP 15 + Accesorios"
                detail={`${fmtMoney(PRECIO_LAPTOP_PREMIUM)} · Laptop + licencias Office/Windows + Headset + Mouse`}
              />
              <RadioCard
                checked={form.laptop==='no'} onChange={() => set('laptop','no')}
                accent="red" icon="🚫"
                title="No necesito laptop"
                detail="Ya cuento con equipo propio para el curso."
              />
            </div>
          </Field>

          {/* Sostenimiento */}
          <Field
            label="Gastos de sostenimiento (opcional)"
            note={`Máximo ${fmtMoney(PRECIO_SOSTENIMIENTO_MAX)}/mes. Intensivo: ${fmtMoney(PRECIO_SOSTENIMIENTO_MAX*4)}/cuatrimestre · Súper: ${fmtMoney(PRECIO_SOSTENIMIENTO_MAX*2)}/bimestre`}
            noteType="info"
          >
            <div className="radio-cards">
              <RadioCard
                checked={form.sostenimiento==='no'} onChange={() => { set('sostenimiento','no'); set('sostenimientoMonto',0); }}
                accent="red" icon="❌"
                title="No lo necesito"
                detail="No incluir sostenimiento en mi financiamiento CONAPE."
              />
              <RadioCard
                checked={form.sostenimiento==='si'} onChange={() => set('sostenimiento','si')}
                accent="navy" icon="💰"
                title="Sí, solicitar sostenimiento"
                detail="Para gastos básicos durante el curso (internet, etc.)."
              />
            </div>
            {form.sostenimiento === 'si' && (
              <div style={{ marginTop:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--ink-2)', marginBottom:6 }}>
                  Monto mensual que deseás solicitar:
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {[20000, 30000, 40000, 50000, 60000].map(m => (
                    <label key={m} style={{
                      padding:'8px 14px', border:`1.5px solid ${form.sostenimientoMonto===m?'var(--an-navy)':'var(--line)'}`,
                      borderRadius:'var(--r-md)', cursor:'pointer', fontSize:13, fontWeight:600,
                      background: form.sostenimientoMonto===m?'color-mix(in srgb, var(--an-navy) 6%, white)':'var(--surface)',
                      color: form.sostenimientoMonto===m?'var(--an-navy)':'var(--ink-2)',
                    }}>
                      <input type="radio" checked={form.sostenimientoMonto===m} onChange={() => set('sostenimientoMonto',m)} style={{ display:'none' }} />
                      {fmtMoney(m)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </Field>

          {/* TOEIC — SOLO dentro de CONAPE */}
          <Field label="¿Querés incluir la Prueba Internacional TOEIC?">
            <InfoBox type="info">
              El TOEIC es la certificación de inglés más reconocida por empresas a nivel mundial. Se aplica al finalizar el programa. <strong>Se incluye en tu proforma CONAPE.</strong>
            </InfoBox>
            <div className="radio-cards" style={{ marginTop:8 }}>
              <RadioCard
                checked={form.toeic==='si'} onChange={() => set('toeic','si')}
                accent="navy" icon="🏆"
                title="Sí, incluir la Prueba TOEIC"
                detail={`${fmtMoney(PRECIO_TOEIC)} · Se agrega a tu proforma CONAPE · Reconocida internacionalmente`}
              />
              <RadioCard
                checked={form.toeic==='no'} onChange={() => set('toeic','no')}
                accent="red" icon="⏭️"
                title="No por ahora"
                detail="Podés solicitarla después durante el programa si cambiás de opinión."
              />
            </div>
          </Field>
        </>
      )}

      {/* Becas: nota aclaratoria */}
      {form.financiamiento === 'beca' && (
        <InfoBox type="warn">
          Las becas aplican sobre <strong>matrícula y cuotas mensuales únicamente</strong>. El certificado de nivel y el Título del Programa no reciben descuento. <strong>No se puede combinar beca con CONAPE.</strong>
        </InfoBox>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 4 — MODALIDAD Y HORARIO
// ─────────────────────────────────────────────────────────────────────────────
function Paso4({ form, set, errors, gruposDisp, setGruposDisp }) {
  const [listaEspera, setListaEspera] = useState(new Set());
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [errorGrupos, setErrorGrupos] = useState(null);

  useEffect(() => {
    if (!form.programa) return;
    const prog = form.programa === 'ina' ? 'INA' : 'SIN_INA';
    setLoadingGrupos(true);
    setErrorGrupos(null);
    fetch(`${SCRIPT_URL}?fn=getGruposDisponibles&programa=${prog}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) setGruposDisp(d.grupos || []);
        else setErrorGrupos(d.mensaje || 'No se pudieron cargar los grupos.');
      })
      .catch(() => setErrorGrupos('Error de conexión al cargar grupos.'))
      .finally(() => setLoadingGrupos(false));
  }, [form.programa]);

  // Filtra por modalidad seleccionada (programa ya viene filtrado del backend)
  const gruposFiltrados = gruposDisp.filter(g => {
    if (form.modalidad && g.modalidad && g.modalidad !== form.modalidad) return false;
    return true;
  });

  return (
    <div className="sec">
      <SectionHeader num="4" title="Modalidad y horario" />

      <InfoBox type="info">
        📱 Todos nuestros cursos son <strong>100% virtuales vía Zoom</strong>. Escogé la modalidad que mejor se adapte a tu tiempo.
      </InfoBox>

      {/* Modalidad */}
      <Field label="¿Cuál modalidad preferís?" error={errors.modalidad}>
        <div className="radio-cards">
          <RadioCard
            checked={form.modalidad==='intensivo'} onChange={() => { set('modalidad','intensivo'); set('grupoId',''); }}
            accent="red" icon="📅"
            title="Inglés Rápido — Intensivo"
            detail="2 días/semana · ~4 meses por nivel · 4 cuotas mensuales"
          />
          <RadioCard
            checked={form.modalidad==='super_intensivo'} onChange={() => { set('modalidad','super_intensivo'); set('grupoId',''); }}
            accent="red" icon="🚀"
            title="Inglés en 8 meses — Súper Intensivo"
            detail="4 días/semana · ~2 meses por nivel · 2 cuotas mensuales"
          />
        </div>
      </Field>

      {/* Grupos disponibles — cargados en tiempo real desde Apps Script */}
      {form.modalidad && (
        <Field label="Seleccioná tu horario" error={errors.grupoId}>
          {loadingGrupos ? (
            <InfoBox type="info">⏳ Cargando grupos disponibles…</InfoBox>
          ) : errorGrupos ? (
            <InfoBox type="warn">{errorGrupos}</InfoBox>
          ) : gruposFiltrados.length === 0 ? (
            <InfoBox type="warn">No hay grupos disponibles para esta combinación en este momento. Contactá a tu asesor para más opciones.</InfoBox>
          ) : (
            <div className="horario-grid">
              {gruposFiltrados.map(g => {
                const id = g.codigo || g.id;
                const cupo = g.cupo != null ? g.cupo : g.cupos;
                const sel = form.grupoId === id;
                const lleno = cupo === 0;
                const enEspera = listaEspera.has(id);
                return (
                  <div key={id} className={`hc${sel?' sel':''}${lleno?' lleno':''}`} onClick={() => !lleno && set('grupoId', id)}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                        <div className="hc-days">{g.dias}</div>
                        {g.codigo && (
                          <span className="modelo-tag modelo-ina" style={{ fontFamily:'var(--f-mono)' }}>{g.codigo}</span>
                        )}
                        {g.nivel && (
                          <span className="modelo-tag modelo-sinina">{g.nivel}</span>
                        )}
                      </div>
                      <div className="hc-time">🕐 {g.hora}</div>
                      {(g.inicio || g.docente) && (
                        <div className="hc-start">
                          {g.inicio && <>📆 Inicia {g.inicio}</>}
                          {g.inicio && g.docente && ' · '}
                          {g.docente}
                        </div>
                      )}
                      <div style={{ marginTop:8 }}>
                        {lleno
                          ? <span className="cupos-badge cupos-lleno">Grupo lleno</span>
                          : cupo <= 3
                          ? <span className="cupos-badge cupos-warn">⚡ Últimos {cupo} cupos</span>
                          : <span className="cupos-badge cupos-ok">✓ {cupo} cupos disponibles</span>}
                      </div>
                    </div>
                    {!lleno && sel && <div className="hc-check">✓</div>}
                    {lleno && (
                      <button onClick={e=>{ e.stopPropagation(); setListaEspera(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; }); }}
                        style={{ padding:'8px 12px', border:'1px solid var(--line)', borderRadius:'var(--r-md)', background: enEspera?'var(--an-navy)':'var(--surface)', color: enEspera?'white':'var(--ink-2)', fontSize:11, fontWeight:600, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap' }}>
                        {enEspera?'✓ En lista':'Lista de espera'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Field>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 5 — CONFIRMACIÓN
// ─────────────────────────────────────────────────────────────────────────────
function Paso5({ form, costos, grupoSel, set, errors }) {
  const beca = BECAS.find(b=>b.id===form.beca);
  return (
    <div className="sec">
      <SectionHeader num="5" title="Confirmar inscripción" />

      {/* RESUMEN */}
      <div className="resumen">
        <div className="res-title">Resumen de tu inscripción</div>
        {[
          ['Nombre',         form.nombre || '—'],
          ['Programa',       form.programa==='ina'?'🏛️ INA Acreditado (128h)':'📖 Programa Libre (96h)'],
          ['Modalidad',      form.modalidad==='super_intensivo'?'🚀 Súper Intensivo':'📅 Intensivo'],
          ['Horario',        grupoSel?`${grupoSel.dias} · ${grupoSel.hora}`:'—'],
          ['Inicio',         grupoSel?.inicio||'—'],
          ['Docente',        grupoSel?.docente||'—'],
          ['Financiamiento', form.financiamiento==='conape'?'🏦 CONAPE':form.financiamiento==='beca'?`🎓 ${beca?.label||'Beca'}`:' 💳 Pago directo'],
          ...(form.financiamiento==='conape'&&form.laptop&&form.laptop!=='no'?[['Laptop', form.laptop==='premium'?'Plan Premium':'Plan Básico']]: []),
          ...(form.financiamiento==='conape'&&form.sostenimiento==='si'?[['Sostenimiento', fmtMoney(form.sostenimientoMonto)+'/mes']]: []),
          ...(form.financiamiento==='conape'&&form.toeic==='si'?[['TOEIC', '✓ Incluida en proforma CONAPE']]: []),
        ].map(([k,v],i)=>(
          <div key={i} className="res-row">
            <span className="res-label">{k}</span>
            <span className="res-val">{v}</span>
          </div>
        ))}

        <div className="res-section-label" style={{ marginTop:16 }}>Estructura de costos</div>
        {costos.detalle.map((r,i)=>(
          <div key={i} className="res-row">
            <span className="res-label">{r.label}</span>
            <span className="res-val">{r.valor}</span>
          </div>
        ))}
        <div className="res-total">
          <span className="res-total-label">{form.financiamiento==='conape'?'Total proforma CONAPE':'Total del programa'}</span>
          <span className="res-total-val">{costos.total}</span>
        </div>
        {form.financiamiento==='conape' && <div className="res-note">Este total se incluye en tu proforma CONAPE para el trámite de solicitud.</div>}
        {form.financiamiento==='beca' && <div className="res-note">El precio del certificado y título no aplican descuento de beca.</div>}
      </div>

      {/* Autorización del encargado si menor */}
      {form.mayorEdad==='no' && (
        <InfoBox type="warn">
          Como sos menor de edad, el encargado <strong>{form.repNombre||'registrado'}</strong> tendrá acceso de monitoreo al campus virtual (notas, asistencia, calendario).
        </InfoBox>
      )}

      {/* Checkboxes */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label className="check-row">
          <input type="checkbox" checked={form.terminos} onChange={e=>set('terminos',e.target.checked)} />
          <span>Acepto los <a href="#">términos y condiciones</a> y la <a href="#">política de privacidad</a> de Academia Norteamericana.</span>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={form.autorizaWA} onChange={e=>set('autorizaWA',e.target.checked)} />
          <span>Autorizo a la academia a contactarme por WhatsApp para el seguimiento de mi proceso.</span>
        </label>
        {errors.terminos && <div className="field-error">{errors.terminos}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA FINAL — INSCRIPCIÓN COMPLETADA
// ─────────────────────────────────────────────────────────────────────────────
function PantallaConfirmacion({ form, grupoSel, onReset }) {
  const proNum = `PRO-2026-${String(Math.floor(Math.random()*9000+1000))}`;
  const isConape = form.financiamiento === 'conape';
  const accesoMsg = isConape
    ? 'Tu solicitud fue enviada. Te contactaremos cuando CONAPE confirme tu aprobación. Ya podés ingresar al campus con tu cédula y contraseña.'
    : '¡Listo! Completá el pago de matrícula para activar tu acceso completo. Ya podés ingresar al campus.';
  return (
    <div style={{ maxWidth:600, margin:'0 auto', padding:'20px 16px 100px' }}>
      <div className="confirm-wrap">
        <div className="confirm-hero">
          <div className="confirm-emoji">🎉</div>
          <div className="confirm-h1">¡Inscripción recibida!</div>
          <div className="confirm-sub">Tu número de prospecto es</div>
          <div className="confirm-num">{proNum}</div>
        </div>
        <InfoBox type={isConape?'info':'ok'}>{accesoMsg}</InfoBox>
        <a href="login.html" className="btn-primary" style={{ display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', marginTop:4 }}>
          Ingresar al campus →
        </a>
        <div className="sec" style={{ background:'white', borderRadius:'var(--r-lg)', padding:20, boxShadow:'var(--shadow-sm)', border:'1px solid var(--line)' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:4 }}>Próximos pasos</div>
          {isConape ? (
            <>
              <InfoBox type="ok">Un asesor te contactará en menos de <strong>24 horas</strong> por WhatsApp para iniciar el proceso CONAPE.</InfoBox>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
                {['Llenar solicitud CONAPE en línea','Firma y entrega de documentos','Aprobación y desembolso (~15 días)','Matrícula oficial en el campus'].map((s,i)=>(
                  <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--an-navy)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>{i+1}</div>
                    <div style={{ fontSize:13, color:'var(--ink-2)', paddingTop:3 }}>{s}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <InfoBox type="warn">Para confirmar tu cupo, cancelá la <strong>matrícula dentro de los próximos 3 días hábiles</strong>.</InfoBox>
              {[
                ['💰','SINPE Móvil','8535-8686 — Academia Norteamericana S.A.'],
                ['🏦','Transferencia BAC / BN','CR21010200009013462233 — IBAN colones'],
                ['💳','Pago con tarjeta','Enlace en el campus virtual'],
              ].map(([icon,title,detail],i)=>(
                <div key={i} className="pay-method">
                  <div className="pay-icon">{icon}</div>
                  <div><div className="pay-title">{title}</div><div className="pay-detail">{detail}</div></div>
                </div>
              ))}
            </>
          )}
        </div>
        <button onClick={onReset} className="btn-secondary">← Registrar otra persona</button>
      </div>
    </div>
  );
}

// Spinner CSS — inyectado al stylesheet
const SPINNER_CSS = `
  .spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:-2px; margin-right:6px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .btn-primary[disabled], .btn-secondary[disabled] { opacity:.6; cursor:not-allowed; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// CALCULAR COSTOS
// ─────────────────────────────────────────────────────────────────────────────
function calcCostos(form) {
  const precios = PRECIOS[form.programa] || PRECIOS.ina;
  const beca    = BECAS.find(b=>b.id===form.beca) || BECAS[0];
  const desc    = beca.pct / 100;
  const nCuotas = form.modalidad === 'super_intensivo' ? 2 : 4;

  const matFinal   = Math.round(precios.matricula * (1 - desc));
  const cuotaFinal = Math.round(precios.cuota     * (1 - desc));

  const detalle = [
    { label: `Matrícula${desc>0?` (−${beca.pct}%)`:''}`, valor: fmtMoney(matFinal) },
    { label: `Cuota mensual × ${nCuotas}${desc>0?` (−${beca.pct}%)`:''}`, valor: fmtMoney(cuotaFinal) + '/mes' },
    { label: 'Certificado (por nivel)', valor: fmtMoney(precios.certificado) },
  ];
  let total = matFinal + cuotaFinal * nCuotas + precios.certificado;

  if (form.financiamiento==='conape') {
    if (form.laptop==='basico')   { detalle.push({ label:'Laptop — Plan Básico',   valor: fmtMoney(PRECIO_LAPTOP_BASICO)  }); total += PRECIO_LAPTOP_BASICO; }
    if (form.laptop==='premium')  { detalle.push({ label:'Laptop — Plan Premium',  valor: fmtMoney(PRECIO_LAPTOP_PREMIUM) }); total += PRECIO_LAPTOP_PREMIUM; }
    if (form.sostenimiento==='si' && form.sostenimientoMonto>0) {
      const montoTotal = form.sostenimientoMonto * nCuotas;
      detalle.push({ label:`Sostenimiento (${nCuotas} meses)`, valor: fmtMoney(montoTotal) });
      total += montoTotal;
    }
    if (form.toeic==='si') { detalle.push({ label:'Prueba TOEIC', valor: fmtMoney(PRECIO_TOEIC) }); total += PRECIO_TOEIC; }
  }

  return { detalle, total: fmtMoney(total) };
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const INIT = {
  // Datos personales
  inglesNivel:'', nombre:'', cedulaTipo:'Cédula nacional', cedula:'', fechaNac:'',
  correo:'', clave:'', claveConfirm:'', whatsapp:'', telAdicional:'',
  provincia:'', canton:'', direccion:'',
  mayorEdad:'', repNombre:'', repCedula:'', repTel:'', repCorreo:'',
  asesor:'', comoEnteraste:'',
  // Programa
  programa:'',
  // Financiamiento
  financiamiento:'', beca:'none',
  laptop:'', sostenimiento:'no', sostenimientoMonto:0, toeic:'',
  // Horario
  modalidad:'', grupoId:'',
  // Legal
  terminos:false, autorizaWA:false,
};

function InscripcionForm() {
  const [form, setFormState] = useState(INIT);
  const [errors, setErrors]  = useState({});
  const [step, setStep]      = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [showUbicacion, setShowUbicacion] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);

  const set = (k, v) => setFormState(f => ({ ...f, [k]: v }));

  const [gruposDisp, setGruposDisp] = React.useState([]);
  const grupoSel = gruposDisp.find(g => g.code === form.grupoId)
    || GRUPOS.find(g => g.id === form.grupoId);
  const costos   = useMemo(() => calcCostos(form), [form]);

  useEffect(() => { window.scrollTo({ top:0, behavior:'smooth' }); }, [step]);

  const validate = s => {
    const e = {};
    if (s===1) {
      if (!form.inglesNivel)                            e.inglesNivel = 'Seleccioná una opción';
      if (!form.nombre.trim())                          e.nombre = 'Ingresá tu nombre completo';
      if (!form.cedula || !validarCedula(form.cedula))  e.cedula = 'Ingresá un documento válido';
      if (!form.fechaNac)                               e.fechaNac = 'Ingresá tu fecha de nacimiento';
      if (!form.correo || !validarEmail(form.correo))   e.correo = 'Correo electrónico inválido';
      if (!form.clave || form.clave.length < 6)         e.clave = 'Mínimo 6 caracteres';
      if (form.clave !== form.claveConfirm)             e.claveConfirm = 'Las contraseñas no coinciden';
      if (!form.whatsapp || !validarTel(form.whatsapp)) e.whatsapp = 'Formato: 8888-8888';
      if (!form.provincia)                              e.provincia = 'Seleccioná tu provincia';
      if (!form.canton)                                 e.canton = 'Seleccioná tu cantón';
      if (!form.direccion.trim())                       e.direccion = 'Ingresá tu dirección';
      if (!form.mayorEdad)                              e.mayorEdad = 'Seleccioná una opción';
      if (!form.comoEnteraste)                          e.comoEnteraste = 'Seleccioná una opción';
      if (form.mayorEdad==='no' && !form.repNombre)     e.repNombre = 'Requerido';
      if (form.mayorEdad==='no' && !form.repTel)        e.repTel = 'Requerido';
    }
    if (s===2) { if (!form.programa) e.programa = 'Seleccioná un programa'; }
    if (s===3) { if (!form.financiamiento) e.financiamiento = 'Seleccioná una opción'; }
    if (s===4) {
      if (!form.modalidad) e.modalidad = 'Seleccioná una modalidad';
      if (form.modalidad && !form.grupoId) e.grupoId = 'Seleccioná un horario';
    }
    if (s===5) { if (!form.terminos) e.terminos = 'Debés aceptar los términos para continuar'; }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate(step)) return;
    // Gate: si tiene inglés previo, desviar a pantalla de ubicación
    if (step===1 && form.inglesNivel==='previo') {
      setShowUbicacion(true);
      return;
    }
    // Beca Impacta: salta del paso 3 al 4 (literal — verificar intención)
    if (step === 3 && esBecaImpacta(form)) {
      setStep(4);
      return;
    }
    if (step === 5) { enviar(); return; }
    if (step < 5) setStep(s=>s+1);
  };

  const prev = () => {
    if (step === 4 && esBecaImpacta(form)) { setStep(2); return; }
    if (step>1) setStep(s=>s-1);
  };

  const enviar = async () => {
    if (!validate(5)) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const res = await fetch(`${SCRIPT_URL}?fn=crearUsuarioEstudiante`, {
        method: 'POST',
        body: JSON.stringify({
          cedula: form.cedula, nombre: form.nombre, correo: form.correo,
          clave: form.clave, whatsapp: form.whatsapp,
          provincia: form.provincia, canton: form.canton,
          direccion: form.direccion, fecha_nac: form.fechaNac,
          mayor_edad: form.mayorEdad, rep_nombre: form.repNombre,
          rep_cedula: form.repCedula, rep_correo: form.repCorreo,
          rep_tel: form.repTel, programa: form.programa,
          financiamiento: form.financiamiento, beca: form.beca,
          modalidad: form.modalidad, grupo_tentativo: form.grupoId,
          conape_toeic: form.toeic, conape_laptop: form.laptop,
          conape_sostenimiento: form.sostenimiento,
          conape_monto_sos: form.sostenimientoMonto,
          como_entero: form.comoEnteraste, asesor_ref: form.asesor,
        }),
      });
      const data = await res.json();
      if (data.ok) setSubmitted(true);
      else setErrorEnvio(data.mensaje || 'Error al crear la cuenta. Intentá de nuevo.');
    } catch (err) {
      setErrorEnvio('Error de conexión. Revisá tu internet e intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const reset = () => { setFormState(INIT); setErrors({}); setStep(1); setSubmitted(false); setShowUbicacion(false); setEnviando(false); setErrorEnvio(null); };

  if (showUbicacion) return (
    <>
      <header className="ins-header">
        <div className="ins-logo" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>A</div>
        <div><div className="ins-brand-t1">Academia Norteamericana</div><div className="ins-brand-t2">Campus Virtual</div></div>
      </header>
      <PantallaUbicacion form={form} onBack={reset} />
    </>
  );

  if (submitted) return (
    <>
      <header className="ins-header">
        <div className="ins-logo" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>A</div>
        <div><div className="ins-brand-t1">Academia Norteamericana</div><div className="ins-brand-t2">Campus Virtual</div></div>
      </header>
      <PantallaConfirmacion form={form} grupoSel={grupoSel} onReset={reset} />
    </>
  );

  return (
    <>
      <header className="ins-header">
        <div className="ins-logo" style={{ display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Georgia,serif', fontWeight:900, fontSize:18 }}>A</div>
        <div>
          <div className="ins-brand-t1">Academia Norteamericana</div>
          <div className="ins-brand-t2">Formulario de Inscripción</div>
        </div>
        <div className="ins-header-right">
          <a href="login.html" style={{ fontSize:12, color:'rgba(255,255,255,.55)', fontWeight:600, textDecoration:'none' }}>¿Ya tenés cuenta? →</a>
        </div>
      </header>

      <ProgressBar step={step} />

      <div className="ins-body">
        {step===1 && (
          <div style={{ padding:'16px 0 4px' }}>
            <div style={{ fontFamily:'Georgia,serif', fontSize:30, fontWeight:400, color:'var(--an-navy-ink)', lineHeight:1.1, letterSpacing:'-.02em' }}>
              Empezá tu camino<br/><em style={{ color:'var(--an-granate)' }}>en inglés hoy</em>
            </div>
            <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:8, marginBottom:16 }}>Completá el formulario y un asesor te contactará en menos de 24 horas.</div>
          </div>
        )}

        {step===1 && <Paso1 form={form} set={set} errors={errors} />}
        {step===2 && <Paso2 form={form} set={set} errors={errors} />}
        {step===3 && <Paso3 form={form} set={set} errors={errors} />}
        {step===4 && <Paso4 form={form} set={set} errors={errors} gruposDisp={gruposDisp} setGruposDisp={setGruposDisp} />}
        {step===5 && <Paso5 form={form} set={set} errors={errors} costos={costos} grupoSel={grupoSel} />}

        {errorEnvio && step===5 && (
          <div style={{ marginTop:16, padding:'12px 14px', background:'color-mix(in srgb, var(--an-granate) 8%, white)', border:'1.5px solid var(--an-granate)', borderRadius:'var(--r-md)', color:'var(--an-granate)', fontSize:13, fontWeight:600 }}>
            ⚠️ {errorEnvio}
          </div>
        )}

        <div className={`nav-btns${step>1?' two':''}`} style={{ marginTop:16 }}>
          {step>1 && <button onClick={prev} className="btn-secondary" disabled={enviando}>← Anterior</button>}
          <button onClick={next} className="btn-primary" disabled={enviando}>
            {enviando
              ? <><span className="spinner" /> Enviando…</>
              : step<5 ? 'Continuar →' : 'Enviar mi inscripción →'}
          </button>
        </div>

        <div style={{ textAlign:'center', marginTop:24, fontSize:11, color:'var(--ink-3)', lineHeight:1.9 }}>
          🔒 Conexión segura · INA Resolución 2519 · ANORTEAMERICAN S.A.<br/>
          <a href="tel:+50640708686" style={{ color:'var(--an-granate)', fontWeight:600 }}>📞 4070-8686</a>
          &nbsp;·&nbsp;
          <a href="https://wa.me/50685358686" style={{ color:'var(--ok)', fontWeight:600 }}>💬 WhatsApp</a>
          &nbsp;·&nbsp;
          <a href="https://anorteamerican.com" style={{ color:'var(--an-navy)', fontWeight:600 }}>anorteamerican.com</a>
        </div>
      </div>

      <div className="sticky-nav">
        <div className={`sticky-inner${step>1?' two':''}`}>
          {step>1 && <button onClick={prev} className="btn-secondary" disabled={enviando}>← Anterior</button>}
          <button onClick={next} className="btn-primary" disabled={enviando}>
            {enviando ? <><span className="spinner" /> Enviando…</> : step<5?'Continuar →':'Enviar →'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS INJECT + MOUNT
// ─────────────────────────────────────────────────────────────────────────────
(function injectCSS() {
  const tag = document.createElement('style');
  tag.textContent = CSS + SPINNER_CSS;
  document.head.appendChild(tag);
})();

ReactDOM.createRoot(document.getElementById('root')).render(<InscripcionForm />);
