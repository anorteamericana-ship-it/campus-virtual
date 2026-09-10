# C3.5 · Ajuste Ventas · Reclutar en CONAPE por fila

Fecha: 2026-09-09 · Costa Rica

## Regla de UI confirmada

El botón `Reclutar en CONAPE` NO vive dentro del drawer del prospecto ni como botón flotante.

En escritorio queda como acción propia por fila, inmediatamente a la izquierda de la columna `Acción` / botón `Ver`.

Para abrir espacio, la tabla usa anchos más compactos en Cédula, Nombre, Teléfono, Grupo, Programa, Financiamiento, Etapa, Estado y Días.

El widget flotante `Prematrículas` queda oculto por completo de `ventas.html` en este corte. Su código no se elimina; se retomará después.

## Regla de datos CONAPE

La columna visible `Etapa` es el lugar donde Ventas debe reflejar el estado que devuelve CONAPE.

Para no mezclar semánticas internas con el dato externo, el frontend prioriza para esa celda:

`estado_conape_raw -> estado_conape -> etapa`

Así, `etapa` interna puede seguir existiendo para reglas del embudo mientras la tabla muestra el estado real reportado por CONAPE cuando está disponible.

Después de una creación confirmada, el bridge local intenta volver al reporte, filtrar por la cédula creada y leer específicamente la columna `Estado`. Ese valor se devuelve como `estado_conape_raw`; no se hardcodea `REGISTRO` ni ningún otro estado.

En QA local, la tabla refleja inmediatamente ese valor en la fila. En el bridge permanente, el backend Campus deberá persistir `estado_conape_raw` para que sobreviva recargas y alimente la sincronización general.

## Regla de lookup

Si la pantalla `PROSPECTO` ya tiene cargada exactamente la misma cédula con identidad CONAPE válida, el bridge reutiliza esos datos en vez de forzar un cambio del mismo valor. Esto evita falsos `IDENTITY_NOT_FOUND` cuando APEX no vuelve a disparar su Dynamic Action porque la cédula no cambió.

## Seguridad intacta

- Campus nunca escribe nombre ni apellidos.
- Cédula inicia el lookup.
- Solo teléfono/correo pueden completarse o actualizarse.
- `CREATE` sigue siendo one-shot y requiere preflight vigente.
- HTTP 200 aislado no equivale a éxito.
- El bridge de QA continúa limitado a `127.0.0.1` y perfil Chromium temporal.
- Sin merge ni PROD en este corte.
