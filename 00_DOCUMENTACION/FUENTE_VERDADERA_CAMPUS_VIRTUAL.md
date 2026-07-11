# FUENTE VERDADERA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

**Versión integral vigente:** F98.4-Z6-CS21A37  
**Backend canónico:** F98.4-Z6-CS21A34  
**Frontend activo:** línea F98.4-Z6-CS21A37  
**Corte:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · `main`

Los documentos sin sufijo de versión dentro de `00_DOCUMENTACION` son los únicos canónicos. El historial anterior permanece en Git.

## Backend canónico

CS21A34 continúa como único `Code.gs` completo. El TXT y ZIP se conservan en `CAMPUS_VIRTUAL_BACKEND_CANONICO`. CS21A37 no modifica Apps Script y no requiere un nuevo respaldo backend.

SHA-256 esperado del TXT completo CS21A34:

`c4b4b3c18091e9413c0722d2c5ae0748b5c756927f9bf2f934c8d6dbe6c0dd35`

Respaldado o guardado no significa desplegado. La producción solo se confirma con evidencia de la implementación correspondiente.

## Texto WA de desembolso · CS21A37

En **Seguimiento inmediato**, el botón `WA Solicitar pago` prepara únicamente el texto. La imagen se adjunta manualmente.

Texto base obligatorio:

> ¡Buenas noticias [Nombre]! 🥳
>
> CONAPE nos ha informado que el desembolso ya fue acreditado en su cuenta.
>
> Le solicitamos realizar el pago a la Academia a la mayor brevedad posible, para mantener su expediente al día y evitar atrasos en el desembolso del rubro de sostenimiento.

Reglas dinámicas:

- Usa el nombre de pila detectado desde el nombre institucional.
- Consulta `getEstudiante` al pulsar el botón para tomar el monto pendiente vigente del nivel.
- Para B1, B2 e I1 agrega: `El monto correspondiente a [nivel] ([bimestre/cuatrimestre]) es de ₡[monto].`
- Para I2 agrega: `El monto correspondiente al último nivel, Intermedio II ([bimestre/cuatrimestre]), es de ₡[monto].`
- Si el monto no puede confirmarse, conserva el texto base sin inventar una cifra.
- Un movimiento marcado `Aplicado en sistema` no muestra mensaje de cobro; indica `Aplicado · no enviar cobro`.
- No envía automáticamente, no adjunta imágenes y no escribe en hojas financieras.

Archivos frontend:

- `src/admin_master_conape_movements_cs21a25.jsx` — contenido activo CS21A37.
- `campus.html` — carga CS21A37.

## Aplicar pago dentro de Consulta individual · CS21A36 preservado

`Consulta individual` permite iniciar el procedimiento oficial de pago sin navegar a otra sección:

- una búsqueda de comprobante por intento vigente;
- búsqueda por documento, fecha o descripción;
- revalidación al seleccionar y antes de confirmar;
- distribución entre Matrícula, Cuotas, Certificado, Programa Completo, TOEIC y cargos permitidos;
- controles `− / +` dentro de las tarjetas;
- intentos históricos de solo lectura;
- actualización de la misma ficha después de aplicar.

El frontend usa `getEstudiante`, `getComprobantes` y `aplicarPago`. Apps Script conserva la autoridad sobre grupo, intento, deuda, saldo, reglas, recibos, escrituras, rollback, idempotencia y sincronización CONAPE. Nunca se mueve un pago entre niveles o intentos.

## Fuente oficial de `7-morosidad`

Seguimiento inmediato lee directamente el archivo externo oficial de CONAPE:

- Spreadsheet ID: `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`
- Archivo: `7-morosidad`
- Pestaña: `Hoja 1`

La clasificación usa cédula + año + periodo cuatrimestral: `NO` significa aplicado; `SI`, pendiente; sin fila exacta, revisión. Una copia local no decide la clasificación.

## Detalle revisado · CS21A35 preservado

- `DATOS.COMENTARIO_ADMIN` vacío: botón beige.
- Cualquier texto: botón violeta con `✓ REVISADO · CON SEGUIMIENTO`.
- El indicador persiste entre sesiones y no modifica pagos, mora o CONAPE.

## Estado preservado

- Cobranza y cartera abre primero.
- Pendientes CONAPE recientes arriba y aplicados abajo.
- CONAPE continúa manual y sin triggers automáticos.
- Backend CS21A34 y frontend CS21A37 no están confirmados como publicados en producción.