# F98.4-Z6-CS21A100 · Cierre CONAPE sin bucle

CS21A100 es una corrección puntual sobre CS21A99.

## Flujo final

1. aplicar promoción local;
2. aplicar pago local;
3. sincronizar CONAPE una sola vez;
4. consultar `getEstudianteFresh` hasta confirmar APR/CA;
5. cerrar el modal;
6. refrescar la misma ficha visible.

Si el usuario presiona nuevamente el cierre o el componente se reconstruye, el backend consulta el journal. Una operación con `CONAPE_SYNC=OK` responde como idempotente sin reescribir las hojas externas.

## Preservado

- Motor de pagos y reversión.
- Un intento activo por nivel, grupo y número.
- Archivos CONAPE oficiales 4–7.
- Semáforo y Panel Maestro.
- MÁSCARA de Keylor.
