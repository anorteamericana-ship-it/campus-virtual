# FUENTE VERDADERA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

**Versión integral vigente:** F98.4-Z6-CS21A36  
**Backend canónico:** F98.4-Z6-CS21A34  
**Frontend activo:** línea F98.4-Z6-CS21A36  
**Corte:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · `main`

Los documentos sin sufijo de versión dentro de `00_DOCUMENTACION` son los únicos canónicos. El historial anterior permanece en Git.

## Backend canónico

CS21A34 continúa como único `Code.gs` completo. El TXT y ZIP se conservan en `CAMPUS_VIRTUAL_BACKEND_CANONICO`. CS21A36 no modifica Apps Script y no requiere un nuevo respaldo backend.

SHA-256 esperado del TXT completo CS21A34:

`c4b4b3c18091e9413c0722d2c5ae0748b5c756927f9bf2f934c8d6dbe6c0dd35`

Respaldado o guardado no significa desplegado. La producción solo se confirma con evidencia de la implementación correspondiente.

## Aplicar pago dentro de Consulta individual · CS21A36

`Consulta individual` permite iniciar el mismo procedimiento oficial de pago sin navegar a otra sección:

- El botón `Pago` abre los controles dentro del intento financiero vigente del nivel.
- La barra principal busca comprobantes por número de documento, fecha o descripción.
- Solo se muestran comprobantes con saldo disponible.
- El comprobante se valida nuevamente al seleccionarlo y justo antes de confirmar.
- Un único comprobante puede distribuirse entre Matrícula, Cuotas, Certificado, Programa Completo, TOEIC y cargos especiales permitidos.
- Los controles `− / +` aparecen dentro de cada tarjeta financiera, sin desbordar el panel.
- Después de aplicar, la misma Consulta individual se vuelve a cargar con los comprobantes y saldos actualizados.
- Los intentos históricos son únicamente de lectura.

Archivos frontend:

- `src/admin_students_inline_payment_cs21a36.jsx`
- `campus.html`

## Contrato financiero obligatorio

CS21A36 no escribe directamente en hojas financieras ni duplica el motor de pagos. Utiliza únicamente los endpoints vigentes:

- `getEstudiante`
- `getComprobantes`
- `aplicarPago`

Apps Script conserva la autoridad final para:

- resolver el grupo e intento canónicos;
- rechazar niveles `PE` o intentos históricos;
- validar saldo bancario real;
- limitar cada rubro a su deuda vigente;
- aplicar Matrícula, Cuota, Certificado, Programa Completo, TOEIC y otros cargos según sus reglas;
- escribir en `PAGOS`, `OTROS PAGOS`, `PAGOS_CAMPUS` y `PAGOS_OPERACIONES`;
- actualizar `BDBANCARIO`;
- impedir duplicados mediante `request_id` e idempotencia;
- ejecutar o dejar pendiente la sincronización CONAPE.

Nunca se debe mover un pago entre niveles o intentos. Un cargo especial solo puede aplicarse con su `CARGO_ID` y monto exacto.

## Patrón verificado en operaciones recientes

La auditoría de `PAGOS_OPERACIONES` confirma que el flujo real divide un mismo comprobante entre varios rubros:

- Básico II: Matrícula ₡20.000 + Cuotas ₡299.200 + Certificado ₡15.000 = ₡334.200.
- Intermedio II: Matrícula, Cuotas, Certificado y TOEIC pueden compartir una operación; Programa Completo puede usar el saldo restante del mismo comprobante en una operación posterior.

Por esta razón existe una sola búsqueda de comprobante por intento y varios controles de distribución dentro de las tarjetas.

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
- Backend CS21A34 y frontend CS21A36 no están confirmados como publicados en producción.