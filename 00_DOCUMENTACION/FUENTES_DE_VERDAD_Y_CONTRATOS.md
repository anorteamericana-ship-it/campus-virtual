# Fuentes de verdad y contratos del Campus Virtual

## Estado vigente

- Frontend oficial: repositorio `anorteamericana-ship-it/campus-virtual`, rama `main`.
- Continuidad funcional: `F98.4-Z6-CS21A99`.
- Backend integral entregado: `F98.4-Z6-CS21A99`.
- Publicación Apps Script y producción: pendientes de verificación.

## Principio

El frontend presenta y solicita operaciones. Las hojas oficiales y el backend determinan los estados. No se deben reconstruir estados académicos o financieros por inferencia visual.

## Académico

- `DATOS`: identidad, convenio y grupo base.
- `ESTATUS`: estado oficial por nivel.
- `INTENTOS_ACADEMICOS`: intento, grupo, precios, periodo y vigencia.
- `GRUPOS`: configuración oficial del grupo.
- `CALENDARIO_LECCIONES`: fechas y lecciones.

Debe existir como máximo un intento activo por código, nivel, grupo y número de intento.

## Finanzas

- `BDBANCARIO`: comprobante, crédito y aplicado.
- `PAGOS`: cuotas.
- `OTROS PAGOS`: matrícula, certificado y demás rubros.
- `PAGOS_CAMPUS`: detalle operativo.
- `PAGOS_OPERACIONES`: journal, idempotencia y reversión.

El frontend no asigna recibos ni saldos directamente.

## Contrato CS21A99

- `aplicarPuestaAlDiaAcademica`: actualización académica local, sin CONAPE.
- `aplicarPagoPuestaAlDia`: pago local mediante el motor oficial.
- `sincronizarConapePuestaAlDia`: una sincronización explícita al final.
- `diagnosticarIntentosDuplicadosCS21A99`: diagnóstico de intentos activos repetidos.

Las hojas CONAPE actualizadas por estudiante son 4, 5, 6 y 7. Las hojas 1, 2 y 3 son catálogos.

## Panel Maestro

Se preserva A98: caché fragmentada, semáforo colaborativo, lectura delta y filtro de grupos.

## MÁSCARA de Keylor

Permanece protegida, separada de expedientes reales y en modo de solo lectura. No debe modificarse sin autorización expresa.

## Publicación

Guardado en Git, validado, publicado en Apps Script y probado en producción son estados diferentes y deben reportarse por separado.
