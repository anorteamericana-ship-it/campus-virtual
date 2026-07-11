# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — ESTADO VIGENTE

**Versión integral:** F98.4-Z6-CS21A37  
**Backend canónico:** F98.4-Z6-CS21A34  
**Frontend activo:** F98.4-Z6-CS21A37  
**Corte documental:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · rama `main`

## 1. Cambio CS21A37

CS21A37 modifica únicamente el frontend de **Seguimiento inmediato**.

### Archivos

- `src/admin_master_conape_movements_cs21a25.jsx`
- `campus.html`

### Botón WA

El botón ahora muestra `WA Solicitar pago` y prepara el siguiente texto:

> ¡Buenas noticias [Nombre]! 🥳
>
> CONAPE nos ha informado que el desembolso ya fue acreditado en su cuenta.
>
> Le solicitamos realizar el pago a la Academia a la mayor brevedad posible, para mantener su expediente al día y evitar atrasos en el desembolso del rubro de sostenimiento.

Antes de abrir WhatsApp:

1. Consulta `getEstudiante` por el código vinculado.
2. Lee el nivel y sus rubros pendientes vigentes.
3. Calcula el monto pendiente de Matrícula + Cuotas + Certificado.
4. Para I2 añade Programa Completo y TOEIC cuando estén pendientes.
5. Identifica bimestre o cuatrimestre.
6. Agrega una línea final con nivel, tipo de periodo y monto.

Para B1, B2 e I1:

`El monto correspondiente a [nivel] ([bimestre/cuatrimestre]) es de ₡[monto].`

Para I2:

`El monto correspondiente al último nivel, Intermedio II ([bimestre/cuatrimestre]), es de ₡[monto].`

La imagen no se adjunta ni se descarga desde el Campus; el usuario la incorpora manualmente en WhatsApp.

## 2. Protección contra cobro duplicado

Los movimientos ubicados en `Aplicados en sistema` ya no ofrecen un mensaje para solicitar pago. En su lugar muestran:

`Aplicado · no enviar cobro`

Esto evita enviar el texto de cobro a una persona cuyo periodo ya figura con estado `NO` en la fila exacta de `7-morosidad`.

## 3. Origen del monto

- Fuente principal al pulsar WA: respuesta vigente de `getEstudiante`.
- Respaldo visual: fila coincidente de `data.collections.rows` por código + nivel.
- No se usa `appliedAmount` como costo del nivel.
- Si no se confirma un monto positivo, el mensaje base se abre sin cifra; nunca se inventa un costo.
- El frontend no escribe en `PAGOS`, `OTROS PAGOS`, `PAGOS_CAMPUS`, `PAGOS_OPERACIONES` ni `BDBANCARIO`.

## 4. CS21A36 preservado

Consulta individual mantiene la aplicación de pagos dentro del intento financiero vigente:

- una búsqueda bancaria por intento;
- comprobantes con saldo disponible;
- revalidación al seleccionar y antes de aplicar;
- controles `− / +` por rubro;
- cargos especiales con `CARGO_ID` y monto exacto;
- intentos históricos de solo lectura;
- actualización de la ficha sin navegar.

Nunca se trasladan pagos entre niveles o intentos.

## 5. Backend preservado CS21A34

No se modificó Apps Script. El backend completo vigente continúa siendo:

- TXT: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.txt`
- ZIP: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.zip`
- SHA-256 TXT: `c4b4b3c18091e9413c0722d2c5ae0748b5c756927f9bf2f934c8d6dbe6c0dd35`

## 6. Cambios anteriores preservados

- CS21A36: aplicar pago dentro de Consulta individual.
- CS21A35: Detalle violeta con `✓ REVISADO · CON SEGUIMIENTO`.
- CS21A34: lectura directa del archivo externo oficial `7-morosidad`.
- Fuente oficial: `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`, pestaña `Hoja 1`.
- Estado `NO` = aplicado; `SI` = pendiente; sin fila exacta = revisión.

## 7. QA obligatorio

1. Probar un nombre guardado en formato apellidos + nombres y confirmar el nombre de pila.
2. Probar B2 cuatrimestral y verificar el monto pendiente real.
3. Probar un grupo bimestral.
4. Probar I2 con Programa Completo y TOEIC pendientes.
5. Probar un estudiante sin monto confirmable: el texto debe abrir sin cifra.
6. Confirmar que un movimiento aplicado muestre `Aplicado · no enviar cobro`.
7. Confirmar que WhatsApp abra con saltos de línea y sin adjuntar imagen.

## 8. Estado de despliegue

El código y la documentación están guardados en GitHub `main`. No existe evidencia suficiente para afirmar que CS21A37 esté publicado en producción.