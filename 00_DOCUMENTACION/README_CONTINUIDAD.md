# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — ESTADO VIGENTE

**Versión integral:** F98.4-Z6-CS21A36  
**Backend canónico:** F98.4-Z6-CS21A34  
**Frontend activo:** F98.4-Z6-CS21A36  
**Corte documental:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · rama `main`

## 1. Cambio CS21A36

CS21A36 modifica únicamente el frontend de **Consulta individual** para permitir aplicar pagos sin salir del expediente.

### Archivos

- `src/admin_students_inline_payment_cs21a36.jsx`
- `campus.html`

### Experiencia de uso

1. Expandir el nivel en Consulta individual.
2. Presionar `Pago`.
3. La barra de búsqueda aparece en la cabecera del intento financiero vigente.
4. Buscar por documento, fecha o descripción.
5. Seleccionar un comprobante con saldo disponible.
6. Usar `− / +` dentro de Matrícula, Cuotas, Certificado y, cuando corresponda, Programa Completo o TOEIC.
7. Seleccionar cargos especiales pendientes por su monto exacto.
8. Revisar el resumen y confirmar.
9. La ficha se actualiza en el mismo lugar, sin navegar a otra sección.

Los intentos históricos permanecen de solo lectura.

## 2. Seguridad y reglas financieras

El frontend no escribe directamente en `PAGOS`, `OTROS PAGOS`, `PAGOS_CAMPUS`, `PAGOS_OPERACIONES` ni `BDBANCARIO`.

CS21A36 reutiliza los endpoints existentes `getEstudiante`, `getComprobantes` y `aplicarPago`. El backend CS21A34 sigue siendo la única autoridad para:

- grupo e intento canónicos;
- estado financiero vigente;
- saldo bancario disponible;
- máximo aplicable por rubro;
- reglas de Certificado, Programa Completo y TOEIC;
- cargos especiales por `CARGO_ID` y monto exacto;
- generación de recibos;
- escrituras y rollback;
- idempotencia mediante `request_id`;
- sincronización CONAPE.

El comprobante se revalida al seleccionarlo y nuevamente antes de aplicar. El backend realiza una validación final bajo bloqueo. Nunca se trasladan pagos entre niveles o intentos.

## 3. Patrón auditado de pagos reales

`PAGOS_OPERACIONES` confirma el flujo que debe conservarse:

- pagos de Básico II por ₡334.200 divididos en Matrícula ₡20.000, Cuotas ₡299.200 y Certificado ₡15.000;
- pagos de Intermedio II divididos en Matrícula, Cuotas, Certificado y TOEIC;
- Programa Completo puede consumir posteriormente el saldo remanente del mismo comprobante.

Por eso la interfaz usa una sola búsqueda bancaria por intento y varios selectores de rubro.

## 4. Backend preservado CS21A34

No se modificó Apps Script. El backend completo vigente continúa siendo:

- TXT: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.txt`
- ZIP: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.zip`
- SHA-256 TXT: `c4b4b3c18091e9413c0722d2c5ae0748b5c756927f9bf2f934c8d6dbe6c0dd35`

## 5. Cambios anteriores preservados

- CS21A35: Detalle violeta con `✓ REVISADO · CON SEGUIMIENTO` cuando existe `DATOS.COMENTARIO_ADMIN`.
- CS21A34: Seguimiento inmediato lee directamente el archivo externo oficial `7-morosidad`.
- Fuente oficial de mora: `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`, pestaña `Hoja 1`.
- Estado `NO` = aplicado; `SI` = pendiente; sin fila exacta = revisión.

## 6. QA obligatorio antes de producción

1. Buscar un comprobante con saldo sin aplicar nada.
2. Verificar que un intento histórico no muestre controles de escritura.
3. Probar un Básico II con distribución Matrícula + Cuotas + Certificado.
4. Probar saldo parcial y confirmar que el total no lo exceda.
5. Probar que un comprobante agotado sea rechazado al confirmar.
6. Confirmar las filas generadas en `PAGOS`, `OTROS PAGOS`, `PAGOS_CAMPUS` y `PAGOS_OPERACIONES`.
7. Simular reintento tras demora y confirmar que no se duplique la operación.
8. Confirmar que la Consulta individual se refresque sin abandonar la pantalla.

## 7. Estado de despliegue

El código y la documentación están guardados en GitHub `main`. No existe evidencia suficiente para afirmar que CS21A36 esté publicado en producción.