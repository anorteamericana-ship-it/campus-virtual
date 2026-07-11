# PROMPT DE CONTINUIDAD — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

Copiar desde la línea siguiente al iniciar otro chat.

---

Estoy trabajando en **CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA**, Costa Rica. Continúa desde **F98.4-Z6-CS21A36**.

## Forma obligatoria

1. Respondé en español directo y asumí trabajo por copy/paste.
2. Antes de modificar, indicá impacto y archivos exactos.
3. Si Apps Script cambia, entregá siempre `Code.gs` completo.
4. Modificá solo los archivos necesarios de `anorteamericana-ship-it/campus-virtual`, rama `main`.
5. No toqués pagos, certificados, `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS`, CONAPE o calendario sin análisis de impacto.
6. No movás pagos entre niveles o intentos.
7. No afirmés despliegue si solo hay respaldo o commit.
8. Actualizá la documentación canónica sin copias redundantes.

## Estado vigente

- Backend: **CS21A34**.
- Frontend: **CS21A36**.
- CS21A36 agrega Aplicar pago dentro de Consulta individual sin salir del expediente.
- Archivo nuevo: `src/admin_students_inline_payment_cs21a36.jsx`.
- `campus.html` carga el módulo CS21A36.
- Apps Script no cambió.

## Aplicar pago dentro de Consulta individual

- `Pago` abre una barra de búsqueda dentro del intento financiero vigente.
- Se busca por documento, fecha o descripción.
- Solo se muestran comprobantes con saldo disponible.
- El comprobante se valida al seleccionarlo y antes de guardar.
- Los rubros usan controles `− / +` dentro de Matrícula, Cuotas, Certificado, Programa Completo y TOEIC.
- Los cargos especiales requieren `CARGO_ID` y monto exacto.
- Los intentos históricos son solo lectura.
- Después de aplicar, la Consulta individual se refresca sin navegar.

## Contrato financiero obligatorio

El frontend no escribe directamente en hojas. Solo puede llamar:

- `getEstudiante`
- `getComprobantes`
- `aplicarPago`

El backend vigente decide grupo, intento, deuda, máximos, saldo bancario, cuentas, recibos, idempotencia, rollback y sincronización CONAPE.

Nunca crear una segunda lógica de pagos en el navegador. Nunca mover pagos entre niveles o intentos.

Patrón real confirmado: un comprobante puede dividirse entre varios rubros. Básico II ₡334.200 se distribuye en Matrícula ₡20.000 + Cuotas ₡299.200 + Certificado ₡15.000. En I2 pueden participar Matrícula, Cuotas, Certificado, TOEIC y Programa Completo según las reglas vigentes.

## Fuente oficial de morosidad CONAPE

- Spreadsheet ID: `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`
- Archivo: `7-morosidad`
- Pestaña: `Hoja 1`
- Regla: 01–04=P1; 05–08=P2; 09–12=P3; `NO`=aplicado; `SI`=pendiente; sin fila exacta=revisión.

## Cambios anteriores preservados

- CS21A35: botón Detalle violeta con `✓ REVISADO · CON SEGUIMIENTO` cuando existe `DATOS.COMENTARIO_ADMIN`.
- CS21A34: lectura directa del archivo externo oficial `7-morosidad`.
- Backend completo CS21A34 continúa en la carpeta institucional.

## Estado de despliegue

CS21A36 está guardado en GitHub `main`, pero producción no está confirmada. Antes de publicar, ejecutar QA financiero con comprobante controlado, saldo parcial, intento histórico, comprobante agotado e idempotencia.

---