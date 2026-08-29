import fs from 'node:fs';

const ventas = fs.readFileSync('src/ventas_drawer.jsx', 'utf8');
const admin = fs.readFileSync('src/matriculas_admin.jsx', 'utf8');
const failures = [];
const check = (ok, msg) => ok ? console.log(`PASS: ${msg}`) : failures.push(msg);

check(!ventas.includes('Podés verla aquí: ${d.proforma_url'), 'Ventas no incrusta URL de proforma curso en WhatsApp');
check(!ventas.includes('Podés verla aquí: ${d.proforma_equipo_url'), 'Ventas no incrusta URL de proforma equipo en WhatsApp');
check(ventas.includes('Te la adjunto como PDF en este chat.'), 'Ventas usa mensaje de adjunto PDF para curso');
check(ventas.includes('Te la adjunto como PDF en este chat.'), 'Ventas mantiene contrato de adjunto manual');
check(ventas.includes('WhatsApp · adjuntar PDF'), 'Ventas etiqueta acción manual de adjunto');
check(ventas.includes('Por seguridad no enviamos enlaces públicos de documentos.'), 'Ventas explica al asesor que no comparte enlace público');

check(!admin.includes('Podés verla aquí: ${url}'), 'Admin no incrusta URL de proforma en WhatsApp');
check(admin.includes('Te la adjunto como PDF en este chat.'), 'Admin usa mensaje de adjunto PDF');
check(admin.includes('WhatsApp · adjuntar PDF'), 'Admin etiqueta acción manual de adjunto');
check(!admin.includes("onToast('El backend no devolvió la URL de la proforma.', 'err')"), 'Admin no muestra copy backend en proforma');
check(!admin.includes("} catch (e) { onToast('Error de conexión: ' + e.message, 'err'); }\n      finally { setLoading(false); }\n    };\n\n    const msg = tipo === 'curso'"), 'Admin proforma no muestra e.message crudo');
check(admin.includes("console.error('[Matrículas CS21A175] Error técnico generando proforma.'"), 'Admin conserva diagnóstico técnico en consola');
check(admin.includes("console.warn('[Matrículas CS21A175] Respuesta de proforma no apta para mostrar.'"), 'Admin conserva respuesta backend solo en consola');

// La descarga staff legacy permanece deliberadamente hasta endpoint privado QA.
check(ventas.includes('<a className="vx-btn vx-btn-navy" href={url}'), 'Ventas descarga staff legacy permanece trazable');
check(admin.includes('<a className="btn btn-primary" href={url}'), 'Admin descarga staff legacy permanece trazable');

if (failures.length) {
  console.error('QA SEC002 PROFORMA WHATSAPP CS21A175 FAIL');
  failures.forEach(x => console.error('-', x));
  process.exit(1);
}
console.log('QA SEC002 PROFORMA WHATSAPP CS21A175 PASS');
