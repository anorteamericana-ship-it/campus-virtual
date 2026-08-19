import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const drawerPath = path.join(root, 'src', 'ventas_drawer.jsx');
const ventasHtmlPath = path.join(root, 'ventas.html');
const drawer = fs.readFileSync(drawerPath, 'utf8');
const ventasHtml = fs.readFileSync(ventasHtmlPath, 'utf8');

function ok(condition, message) {
  if (!condition) {
    console.error(`FAIL ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS ${message}`);
  }
}

const infoBlock = drawer.match(/<div className="vx-block-h"><window\.Vico d=\{window\.VI\.phone\} size=\{13\} \/> Información personal<\/div>[\s\S]*?<\/dl>/)?.[0] || '';
const posCedula = infoBlock.indexOf('<dt>Cédula</dt>');
const posTelefono = infoBlock.indexOf('<dt>Teléfono</dt>');
const posCorreo = infoBlock.indexOf('<dt>Correo</dt>');
const posWhatsapp = infoBlock.indexOf('<dt>WhatsApp</dt>');

ok(infoBlock.length > 0, 'bloque Información personal localizado');
ok(posCedula >= 0, 'fila Cédula presente');
ok(posCedula < posTelefono && posTelefono < posCorreo && posCorreo < posWhatsapp, 'orden Cédula -> Teléfono -> Correo -> WhatsApp');
ok(infoBlock.includes("String(d.cedula || '').replace(/\\D/g, '')"), 'Cédula se muestra sin guiones/no dígitos');
ok(infoBlock.includes("copy(String(d.cedula || '').replace(/\\D/g, ''))"), 'Cédula tiene copiar');
ok(drawer.includes('> Abrir WhatsApp\n                </button>'), 'footer contiene Abrir WhatsApp');
ok(!drawer.includes('<window.Vico d={window.VI.doc} size={14} /> Agregar nota\n                </button>'), 'footer ya no repite Agregar nota');
ok(drawer.includes("{savingNota ? <><span className=\"vx-spin\" /> Guardando…</> : 'Agregar nota'}"), 'formulario inferior de notas preservado');
ok(drawer.includes("const llamarWhatsApp = () => { if (waNum) window.open(`https://wa.me/${waNum}`, '_blank', 'noopener'); };"), 'Abrir WhatsApp reutiliza el flujo wa.me existente');
ok(ventasHtml.includes('src/ventas_drawer.jsx?v=F98.4Z6CS21A143CONTACT1'), 'cache-buster actualizado');

if (process.exitCode) process.exit(process.exitCode);
