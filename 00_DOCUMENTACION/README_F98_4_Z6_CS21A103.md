# F98.4-Z6-CS21A103 · Morosidad oficial en vivo

CS21A103 corrige etiquetas de morosidad antiguas del Panel Maestro sin reconstruir todo el dashboard.

## Regla

La fuente de verdad es el archivo externo oficial `7-morosidad`.

- `SI`: desembolso académico 01 pendiente.
- `NO`: desembolso académico 01 aplicado y cerrado.
- `SIN_FILA`: pendiente de revisión administrativa.

## Funcionamiento

El Panel consulta la morosidad oficial:

1. al abrir la tabla;
2. cada 20 segundos mientras la pestaña está visible;
3. al recuperar el foco;
4. después de `Actualizar CONAPE ahora`.

La respuesta actualiza únicamente `moraState`, cierre del movimiento y semáforo. No vuelve a calcular estudiantes, pagos, gráficos o cobranza.

## Caché

Las correcciones manuales invalidan tanto la copia `fresh` como la copia `stale` del Panel Maestro. `campus.html` también usa parámetros de versión A101/A102/A103 para impedir que el navegador conserve módulos anteriores.

## Protegido

No modifica pagos, ESTATUS, INTENTOS_ACADEMICOS, archivos CONAPE ni la MÁSCARA de Keylor.
