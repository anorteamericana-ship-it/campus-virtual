# Auditoría operativa 17048 · CS21A100

Fecha: 16-jul-2026.

## Identidad

- Código: 17048.
- Nombre: COREA ROJAS JHOSELYNE SUSANA.
- Cédula: 118680187.
- Grupo: B1-KJ69-C3-0225.

## Resultado académico

- B1 APR 98.
- B2 APR 98.
- I1 APR 70.
- I2 CA 0.
- Intento I2 activo único: `INT-20260716-112510-5DCF3CE6`.
- No existe intento `MIGRACION_AQ` duplicado para I2.

## Pago

- Operación única: `PAGO-20260716-112658-02A4349E`.
- Comprobante: `17469553`.
- Total: ₡425.930.
- Recibos: 258157, 258158, 258159, 258160 y 258161.
- `PAGOS_CAMPUS` contiene exactamente cinco movimientos de esta operación.

## CONAPE externo

- `4-estudiantes`: una identidad.
- `5-plan_estudios`: cuatro filas, B1/B2/I1 APR e I2 CA.
- `6-historial`: cuatro filas equivalentes.
- `7-morosidad`: una fila por periodo; 2026 periodo 3 en NO.

## Diagnóstico del bucle

El pago y la promoción no se duplicaron. El bucle se originaba porque el frontend ejecutaba `props.onSuccess` mientras el modal todavía seguía abierto. El refresco del padre podía reconstruir el modal desde el primer paso.

CS21A100 cierra primero el asistente, recarga el mismo estudiante con `getEstudianteFresh` hasta confirmar APR/CA y luego notifica al padre. El backend omite una segunda sincronización cuando `PAGOS_OPERACIONES.CONAPE_SYNC` ya está en `OK`.
