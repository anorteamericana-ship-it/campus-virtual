# F98.4-Z6-CS21A101 · Seguimiento exclusivo del desembolso académico 01

## Regla operativa

- `01/MM/AAAA`: desembolso académico; requiere seguimiento, semáforo, WhatsApp y cierre por la Academia.
- `02/MM/AAAA`: sostenimiento; visible como contexto, sin seguimiento.
- `03/MM/AAAA`: equipo electrónico; visible como contexto, sin seguimiento.
- `04+`: informativo mientras no exista una regla expresa diferente.

## Cambios

- La insignia `Nuevo desembolso` se sustituye por `Académico 01 pendiente` o `Académico 01 aplicado`.
- Los movimientos 02/03 permanecen debajo del 01 con su fecha de detección y etiqueta informativa.
- El semáforo se renderiza y se guarda únicamente para IDs cuyo `NUM_DESEMBOLSO` sea 1.
- El canal colaborativo excluye movimientos 02/03.
- Los conteos del Panel Maestro consideran únicamente desembolsos académicos 01.

## Seguridad

No se modifica `CONAPE_MOVIMIENTOS_LOG`, pagos, estudiantes, estados académicos, morosidad ni los siete archivos CONAPE. La MÁSCARA de Keylor permanece intacta.
