# F98.4-Z6-CS21A114 — Integridad del importador bancario BCR

## Error confirmado

El importador usaba `getComprobantes` para decidir si un número de documento ya existía. Ese endpoint está diseñado para aplicar pagos y, desde CS21A23, devuelve únicamente comprobantes con saldo disponible.

Como consecuencia, un depósito completamente aplicado desaparecía de la respuesta y el importador lo marcaba falsamente como `NUEVO`.

Ejemplo verificado: el documento `15385607` aparece en `BDBANCARIO`, fila 418, con crédito y aplicado por 334200; por estar agotado no era devuelto por `getComprobantes` y la pantalla lo marcaba como nuevo.

## Corrección

Se incorpora el endpoint administrativo `previsualizarExtractoBanco`, que compara el archivo contra todos los documentos de `BDBANCARIO`, sin importar su saldo.

Estados posibles:

- `NUEVO`
- `YA_EXISTE`
- `DUPLICADO_ARCHIVO`
- `CONFLICTO`
- `CONFLICTO_ARCHIVO`
- `DEBITO`
- `INVALIDO`

`getComprobantes` no se modifica y continúa ocultando saldos agotados en el buscador de pagos.

## Seguridad de importación

`importarExtracto` vuelve a comprobar los documentos bajo `LockService` antes de escribir. Si encuentra un mismo número con fecha, monto o descripción diferente, aborta toda la escritura y devuelve `conflictos_bancarios`.

La confirmación muestra únicamente los documentos realmente agregados por el servidor.

## Archivos frontend

- `src/importador_banco_integridad_cs21a114.jsx`
- `src/importador_banco_loader_cs21a114.js`
- `src/student_academic_summary_runtime_cs21a113b.js` como bootstrap ya cargado por el Campus.

## Backend

Desplegar `Code_F98_4_Z6_CS21A114_COMPLETO.gs` como nueva versión de Apps Script antes de probar el extracto.
