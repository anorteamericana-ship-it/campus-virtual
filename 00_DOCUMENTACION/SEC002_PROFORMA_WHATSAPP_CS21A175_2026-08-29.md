# CS21A175 · SEC-002 · proformas sin enlace público en WhatsApp · 2026-08-29

## Base

- base exacta: PR #145 / `7348a29db65d12d6c2a8a566662bd967579f59f7`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Problema

Las proformas del curso/equipo todavía se descargan mediante una URL Drive legacy. Además, dos superficies copiaban esa misma URL pública dentro del mensaje prellenado de WhatsApp:

- `src/ventas_drawer.jsx` · `ProformaCardVx`;
- `src/matriculas_admin.jsx` · `PFCard`.

Eso multiplica la exposición: una URL pensada para que el staff opere termina distribuida al prospecto y puede ser reenviada fuera del Campus.

La matriz histórica SEC-002 ya estableció la transición correcta para `commercial_proforma`: descarga staff autenticada en el estado final, y **adjunto manual de WhatsApp durante la transición P1** en lugar de un enlace público.

## Cambio de este corte

Este corte reduce exposición sin depender del backend privado todavía:

1. el mensaje WhatsApp deja de incluir `url`, `proforma_url` o `proforma_equipo_url`;
2. el texto dice que la proforma se adjunta como PDF en el chat;
3. el botón se etiqueta `WhatsApp · adjuntar PDF`;
4. Ventas muestra al asesor una nota/toast indicando que por seguridad no se envían enlaces públicos;
5. `PFCard` Admin deja de mostrar `e.message`, `r.error` o copy “backend no devolvió URL” en la ruta de generación de proforma; el detalle técnico queda solo en consola.

## Lo que deliberadamente sigue legacy

El botón `Descargar` de Ventas y Admin todavía usa `href={url}`. No se elimina en este corte porque aún no existe el endpoint privado QA de proforma y la regla SEC-002 es no romper el consumidor antes del reemplazo.

Por tanto:

- **no** se declara resuelta la clase `commercial_proforma`;
- sí se elimina la propagación externa por WhatsApp;
- el próximo paso sigue siendo endpoint privado staff + Blob/ObjectURL + E2 + retirada ACL QA.

## Seguridad / no alcance

No cambia:

- Apps Script;
- ACL;
- archivos Drive;
- generación de la proforma;
- roles/scope;
- datos;
- PROD.

## Gate

`scripts/qa_sec002_proforma_whatsapp_cs21a175.mjs` comprueba:

- ninguna de las dos superficies incrusta URL de proforma en el mensaje WhatsApp;
- ambas indican adjunto PDF;
- ambas etiquetan la acción manual;
- Admin no expone error técnico en el flujo de proforma;
- la descarga legacy permanece trazable para no confundir esta reducción de exposición con una migración completa.

## Estado

**PARTIAL RISK REDUCTION · WHATSAPP PUBLIC-LINK PROPAGATION REMOVED · STAFF DOWNLOAD STILL LEGACY · BACKEND PRIVATE DELIVERY PENDING · NO PROD.**
