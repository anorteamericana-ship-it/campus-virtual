# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A30

Esta Biblia Delta complementa la Biblia histórica del proyecto y fija las reglas aprobadas hasta el corte del 10-jul-2026. Pagos, certificados, trayectoria académica, CONAPE y calendario son módulos críticos.

## 1. Apps Script

- Toda modificación de backend se entrega como `Code.gs` completo.
- El backend canónico vigente es CS21A30.
- No instalar fragmentos, overrides sueltos ni funciones duplicadas en producción.
- Cada corte debe registrar SHA-256 y prueba de sintaxis.

## 2. Trayectoria académica

### 2.1 Promoción

Al cambiar el nivel actual de `CA` a `APR`:

- Si el siguiente nivel está `PE`, el sistema pregunta si debe cambiarlo a `CA`.
- Si está `SIN REGISTRO`, el sistema pregunta si debe crear su fila oficial en `ESTATUS` y dejarla en `CA`.
- El nivel actual y el siguiente se procesan en una operación protegida.
- Si el grupo no tiene configurado el nivel siguiente en `GRUPOS`, no se aprueba parcialmente el nivel actual.
- La fila creada conserva grupo, código, nivel, fecha y fórmula oficial de nota; evaluaciones y certificado quedan vacíos.
- I2 no tiene promoción posterior.
- `REP` y otros cambios no activan el nivel siguiente.

### 2.2 Consistencia visual

Después de guardar un cambio académico, Consulta individual debe releer el backend. No debe conservar un estado viejo que permita una segunda edición peligrosa.

## 3. Finanzas

### 3.1 Contrato por nivel

- B1, B2 e I1: `MATRICULA + CUOTAS + CERTIFICADO`.
- I2: `MATRICULA + CUOTAS + CERTIFICADO_I2 + PROGRAMA_COMPLETO + TOEIC`.
- El certificado es parte de la deuda desde que el nivel está registrado y no está `PE`.
- `PE` y `SIN REGISTRO` no generan deuda.
- Un nivel `APR`, `REP`, `CNV`, `RI` o `RJ` conserva sus saldos contractuales mientras no hayan sido pagados o exonerados explícitamente.

### 3.2 Pago versus emisión

- Pago de certificado y emisión del certificado son conceptos separados.
- El bloque financiero indica comprobante y saldo.
- `REG_CERTIFICADOS` controla la emisión documental.

### 3.3 Comprobantes

- Saldo disponible = crédito bancario menos monto aplicado.
- `BDBANCARIO` puede tener el monto aplicado en columna J aun sin encabezado; buscador y guardado deben usar la misma lectura.
- Comprobantes con saldo cero no aparecen ni pueden seleccionarse.
- Se vuelve a validar el saldo antes de avanzar y antes de guardar.

### 3.4 Intermedio II

- Certificado I2 y Programa Completo son rubros separados de `₡15.000` cada uno.
- TOEIC usa precio individual de `DATOS`; si falta, precio de `GRUPOS`.
- Certificado I2 y Programa Completo pueden venir en una misma factura. La dependencia se valida contra toda la operación actual.
- No se aplican pagos de I1 a I2 automáticamente.

## 4. Panel Maestro y CONAPE

- Seguimiento inmediato muestra movimientos de todos los periodos.
- Los desembolsos de periodos futuros se marcan como adelantados.
- Orden operativo: Estudiante, Movimiento, Desembolso, Periodo, Campus, Detectado, Contacto.
- Las fechas se muestran en formato Costa Rica.
- `Detalle` lee y escribe `DATOS.COMENTARIO_ADMIN`.
- `Consulta` abre Consulta individual con el estudiante precargado.
- Los gráficos financieros son colapsables; Seguimiento inmediato queda siempre afuera y visible.

## 5. CONAPE protegido

- No publicar un cambio de grupo pendiente como traslado académico definitivo.
- El estudiante permanece en el grupo real hasta aprobación.
- Para n8n puede existir una proyección fusionada/congelada consistente, pero no un traslado prematuro.
- No crear triggers automáticos.
- Ante 401/403 se muestra `PROTEGIDO` y se mantienen las diferencias locales.

## 6. Calendario

- `getGruposActivos`, `getAdminDashboard` y `getRadiografiaGrupo` son endpoints de lectura rápida.
- No ejecutar allí limpiezas físicas, congelamientos o escrituras pesadas.

## 7. Práctica pedagógica

Academia Play y English LAB no generan notas oficiales, aprobación, certificados, pagos, premios oficiales ni consecuencias administrativas.

## 8. Regla de archivos

- No crear una copia nueva de un archivo frontend para cada ajuste menor.
- Actualizar el archivo activo cuando sea seguro.
- Mantener una sola documentación canónica sin sufijos de versión.
- El historial queda en Git; no se necesitan múltiples copias documentales dentro de `main`.
