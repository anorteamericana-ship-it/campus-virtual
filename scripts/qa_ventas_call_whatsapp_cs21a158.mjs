import fs from 'node:fs';

const drawer = fs.readFileSync('src/ventas_drawer.jsx', 'utf8');

function check(condition, message) {
  if (!condition) {
    console.error(`FAIL CS21A158: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

check(!drawer.includes('llamarWhatsApp'), 'legacy shared WhatsApp/call handler is absent');
check(drawer.includes("const waNum = waDigits(detalle && (detalle.whatsapp || detalle.telefono));"), 'WhatsApp contact prioritizes WhatsApp number');
check(drawer.includes("const telNum = waDigits(detalle && (detalle.telefono || detalle.whatsapp));"), 'telephone contact prioritizes telephone number');
check(drawer.includes("window.open(`https://wa.me/${waNum}`, '_blank', 'noopener')"), 'WhatsApp handler opens wa.me');
check(drawer.includes('window.location.href = `tel:+${telNum}`'), 'call handler uses tel scheme');
check(drawer.includes('onClick={llamarTelefono} disabled={!telNum}'), 'Llamar button uses telephone handler');
check(drawer.includes('<window.Vico d={window.VI.phone} size={15} /> Llamar'), 'Llamar button uses phone icon');
check(drawer.includes('onClick={abrirWhatsApp} disabled={!waNum}'), 'WhatsApp button uses WhatsApp handler');
check(drawer.includes('<window.Vico d={window.VI.wa} size={16} fill="currentColor" /> Abrir WhatsApp'), 'WhatsApp button keeps WhatsApp icon');

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A158 static QA PASS');
