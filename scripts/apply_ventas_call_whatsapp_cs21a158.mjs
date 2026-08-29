import fs from 'node:fs';

const path = 'src/ventas_drawer.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceExact(before, after, label) {
  const count = src.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`);
  src = src.replace(before, after);
}

replaceExact(
`  // WhatsApp del prospecto, limpio para wa.me (Fase 3.5).
  const waNum = waDigits(detalle && (detalle.whatsapp || detalle.telefono));
  const llamarWhatsApp = () => { if (waNum) window.open(\`https://wa.me/\${waNum}\`, '_blank', 'noopener'); };`,
`  // Contactos del prospecto: llamada telefónica y WhatsApp son acciones distintas.
  const waNum = waDigits(detalle && (detalle.whatsapp || detalle.telefono));
  const telNum = waDigits(detalle && (detalle.telefono || detalle.whatsapp));
  const abrirWhatsApp = () => { if (waNum) window.open(\`https://wa.me/\${waNum}\`, '_blank', 'noopener'); };
  const llamarTelefono = () => { if (telNum) window.location.href = \`tel:+\${telNum}\`; };`,
'contact handlers'
);

replaceExact(
`                <button className="vx-btn vx-btn-ghost" style={{ flex: 1 }}
                  onClick={llamarWhatsApp} disabled={!waNum}
                  title={waNum ? 'Abrir WhatsApp' : 'Sin número registrado'}>
                  <window.Vico d={window.VI.wa} size={15} fill="currentColor" /> Llamar
                </button>
                <button className="vx-btn vx-btn-ghost" style={{ flex: 1.25 }}
                  onClick={llamarWhatsApp} disabled={!waNum}
                  title={waNum ? 'Abrir WhatsApp' : 'Sin número registrado'}>
                  <window.Vico d={window.VI.wa} size={16} fill="currentColor" /> Abrir WhatsApp
                </button>`,
`                <button className="vx-btn vx-btn-ghost" style={{ flex: 1 }}
                  onClick={llamarTelefono} disabled={!telNum}
                  title={telNum ? 'Llamar por teléfono' : 'Sin número registrado'}>
                  <window.Vico d={window.VI.phone} size={15} /> Llamar
                </button>
                <button className="vx-btn vx-btn-ghost" style={{ flex: 1.25 }}
                  onClick={abrirWhatsApp} disabled={!waNum}
                  title={waNum ? 'Abrir WhatsApp' : 'Sin número registrado'}>
                  <window.Vico d={window.VI.wa} size={16} fill="currentColor" /> Abrir WhatsApp
                </button>`,
'footer call and WhatsApp buttons'
);

for (const forbidden of ['llamarWhatsApp', 'onClick={llamarWhatsApp}']) {
  if (src.includes(forbidden)) throw new Error(`legacy duplicate handler remains: ${forbidden}`);
}
if (!src.includes("const telNum = waDigits(detalle && (detalle.telefono || detalle.whatsapp));")) throw new Error('telephone number handler missing');
if (!src.includes('onClick={llamarTelefono} disabled={!telNum}')) throw new Error('call button is not wired to tel handler');
if (!src.includes('onClick={abrirWhatsApp} disabled={!waNum}')) throw new Error('WhatsApp button is not wired to WhatsApp handler');
if (!src.includes('window.location.href = `tel:+${telNum}`')) throw new Error('tel scheme missing');

fs.writeFileSync(path, src);
console.log('CS21A158 source patch PASS');
