import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const drawerPath = path.join(root, 'src', 'ventas_drawer.jsx');
const ventasHtmlPath = path.join(root, 'ventas.html');

let drawer = fs.readFileSync(drawerPath, 'utf8');
let ventasHtml = fs.readFileSync(ventasHtmlPath, 'utf8');
const nl = drawer.includes('\r\n') ? '\r\n' : '\n';
const withNl = s => s.replace(/\n/g, nl);

function replaceExactlyOnce(text, oldText, newText, label) {
  const first = text.indexOf(oldText);
  if (first < 0) throw new Error(`No encontré preimagen exacta: ${label}`);
  if (text.indexOf(oldText, first + oldText.length) >= 0) {
    throw new Error(`La preimagen aparece más de una vez: ${label}`);
  }
  return text.slice(0, first) + newText + text.slice(first + oldText.length);
}

const oldInfo = withNl(`                <dl className="vx-kv">
                  <dt>Correo</dt><dd>{d.correo || '—'} <button className="vx-copy" onClick={() => copy(d.correo)}>copiar</button></dd>
                  <dt>Teléfono</dt><dd>{window.fmtTelV(d.telefono)} <button className="vx-copy" onClick={() => copy(d.telefono)}>copiar</button></dd>
                  <dt>WhatsApp</dt><dd>`);

const newInfo = withNl(`                <dl className="vx-kv">
                  <dt>Cédula</dt><dd>{String(d.cedula || '').replace(/\\D/g, '') || '—'} <button className="vx-copy" onClick={() => copy(String(d.cedula || '').replace(/\\D/g, ''))}>copiar</button></dd>
                  <dt>Teléfono</dt><dd>{window.fmtTelV(d.telefono)} <button className="vx-copy" onClick={() => copy(d.telefono)}>copiar</button></dd>
                  <dt>Correo</dt><dd>{d.correo || '—'} <button className="vx-copy" onClick={() => copy(d.correo)}>copiar</button></dd>
                  <dt>WhatsApp</dt><dd>`);

const oldFooter = withNl(`                <button className="vx-btn vx-btn-ghost" style={{ flex: 1 }} onClick={() => setModal('nota')}>
                  <window.Vico d={window.VI.doc} size={14} /> Agregar nota
                </button>`);

const newFooter = withNl(`                <button className="vx-btn vx-btn-ghost" style={{ flex: 1.25 }}
                  onClick={llamarWhatsApp} disabled={!waNum}
                  title={waNum ? 'Abrir WhatsApp' : 'Sin número registrado'}>
                  <window.Vico d={window.VI.wa} size={16} fill="currentColor" /> Abrir WhatsApp
                </button>`);

drawer = replaceExactlyOnce(drawer, oldInfo, newInfo, 'Información personal');
drawer = replaceExactlyOnce(drawer, oldFooter, newFooter, 'Footer Agregar nota -> Abrir WhatsApp');
ventasHtml = replaceExactlyOnce(
  ventasHtml,
  'src/ventas_drawer.jsx?v=F98.4Z6PERF1',
  'src/ventas_drawer.jsx?v=F98.4Z6CS21A143CONTACT1',
  'cache-buster ventas_drawer'
);

if ((drawer.match(/<dt>Cédula<\/dt>/g) || []).length !== 1) throw new Error('Debe existir exactamente una fila Cédula nueva.');
if (!drawer.includes("String(d.cedula || '').replace(/\\D/g, '')")) throw new Error('La cédula no quedó normalizada sin guiones.');
if (!drawer.includes('> Abrir WhatsApp')) throw new Error('No quedó el botón Abrir WhatsApp.');
if (drawer.includes('<window.Vico d={window.VI.doc} size={14} /> Agregar nota\n                </button>')) throw new Error('El botón duplicado Agregar nota sigue en el footer.');
if (!drawer.includes("{savingNota ? <><span className=\"vx-spin\" /> Guardando…</> : 'Agregar nota'}")) throw new Error('Se perdió el formulario real de notas.');

fs.writeFileSync(drawerPath, drawer, 'utf8');
fs.writeFileSync(ventasHtmlPath, ventasHtml, 'utf8');

console.log('=== CS21A143 · CONTACTO VENTAS ===');
console.log('PASS Cédula agregada sin guiones + copiar');
console.log('PASS orden: Cédula -> Teléfono -> Correo -> WhatsApp');
console.log('PASS footer: Agregar nota -> Abrir WhatsApp');
console.log('PASS formulario de notas inferior preservado');
console.log('PASS cache-buster ventas_drawer actualizado');
console.log('Archivos modificados: src/ventas_drawer.jsx, ventas.html');
