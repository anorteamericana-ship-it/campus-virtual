# Estado consolidado · F98.4-Z6-CS21A98

Fecha de corte: 15-jul-2026.

## Panel Maestro CONAPE

- Semáforo acumulativo de cuatro revisiones por desembolso académico 01.
- Reinicio a cero al pasar a `Desembolsos académicos 01 cerrados`.
- Sincronización colaborativa entre operadores sin recargar la pantalla.
- Consulta delta cada 4 segundos mientras la pestaña está visible y al recuperar foco.
- Mensaje que identifica operadora, revisión y estudiante cuando cambia desde otro equipo.
- Filtro por grupo con formato `DOCENTE - DÍAS HORARIO - CONSECUTIVO`.

## Rendimiento

- Snapshot de sesión para pintar una copia válida inmediatamente.
- Sincronización CONAPE de 30 minutos fuera de la primera pintura.
- Backend CS21A98 con caché fragmentada fresca y copia stale de recuperación.
- Endpoint colaborativo lee únicamente `MOVIMIENTO_ID` y columnas `REVISION_*`; no reconstruye el Panel Maestro.

## Fuente de verdad

- Grupos: hoja `GRUPOS`.
- Movimientos y revisiones: `CAMPUS_OPERATIVO/CONAPE_MOVIMIENTOS_LOG`.
- Cierre académico 01: archivo oficial `7-morosidad`, misma cédula, año y periodo, `ESTADO NO`.

## Estado de publicación

Frontend guardado en `main`. Backend integral generado y validado estáticamente. El deployment de Apps Script y la prueba visual de producción deben verificarse por separado.
