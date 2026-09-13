# CONAPE_MIRROR_SERVICE V4.4

Standalone Apps Script para persistir el espejo de CONAPE sin tocar el monolito productivo del Campus.

## Identidad de despliegue

- Web App ejecutado como **USER_DEPLOYING**.
- Debe desplegarlo una **cuenta institucional técnica dedicada** de Academia Norteamericana.
- No desplegar con una cuenta personal de Leonardo ni con cuentas de vendedores.
- Antes del despliegue, la cuenta técnica debe tener acceso de edición a `CAMPUS_OPERATIVO`.
- Registrar en el runbook operativo: correo de la cuenta técnica, Script ID, Deployment ID, fecha de despliegue, responsables de recuperación y ubicación administrativa del secreto. **Nunca registrar el valor del secreto.**

## Límite de escritura

El código solo permite abrir el spreadsheet:

`1dbNtotJC51Bx40r4zZv3ugt8-P3GYYzeLxsMOEYismI` (`CAMPUS_OPERATIVO`)

y solo permite acceder a estas pestañas:

- `CONAPE_RECLUTAMIENTO`
- `CONAPE_MOVIMIENTOS_LOG`

La función `_cmsSheet_()` rechaza cualquier otro nombre antes de llamar `getSheetByName()`.

## Autenticación bridge → servicio

Script Property requerida:

`CONAPE_MIRROR_HMAC_SECRET`

Railway debe contener el mismo valor en una variable de entorno con el mismo nombre.

Cada petición usa:

- `ts`: epoch en milisegundos.
- `nonce`: aleatorio y único.
- `payload_json`: JSON exacto firmado.
- `sig`: HMAC-SHA256 hexadecimal de `ts + "\n" + nonce + "\n" + payload_json`.

Ventana de reloj: ±3 minutos. El nonce se persiste en Script Properties por 10 minutos y se limpia por TTL.

## Acciones permitidas

- `read_mirror`: lectura del espejo para el bridge.
- `apply_snapshot`: valida y aplica snapshot completo de CONAPE.

No existe ningún endpoint para matrícula, pagos, notas, asistencia, login ni cualquier otra función del Campus.

## Snapshot válido

`apply_snapshot` escribe únicamente cuando se cumplen simultáneamente:

- `method === CSV_DOWNLOAD`
- `columns_ok === true`
- `counts_match === true`
- `rows_csv > 0`
- `rows_html_all > 0`
- `rows_csv === rows_html_all`
- lista no vacía
- una única fila canónica por cédula

Una lectura inválida termina antes de detectar movimientos, por lo que no puede generar `RETIRADO_DE_LISTA`.

Los movimientos se escriben antes del espejo. El espejo se reemplaza mediante una sola operación matricial `setValues`, sin `clearContent()` previo.

## Sincronización

La programación de 30 minutos vive en el bridge de Railway, no en Apps Script. Este proyecto no crea triggers.

El flujo objetivo es:

1. Ventas carga `baseDash`.
2. El bridge lee el espejo y hace overlay.
3. Railway sincroniza automáticamente cada 30 minutos.
4. El vendedor puede usar **Actualizar CONAPE** para sincronización inmediata.
5. CREATE/UPDATE confirmado dispara sincronización inmediata.
6. Si el mirror service falla, Ventas conserva el estado ya visible y no vacía ni bloquea la tabla.
