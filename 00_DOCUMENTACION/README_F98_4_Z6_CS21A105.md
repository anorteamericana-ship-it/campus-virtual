# F98.4-Z6-CS21A105 · Semáforo estable

CS21A105 corrige una regresión visual del Panel Maestro CONAPE.

## Causa

La lectura de morosidad en vivo reconstruía el arreglo de movimientos. El efecto del semáforo interpretaba ese arreglo como una carga nueva y volvía a copiar `row.reviewStep` desde la fotografía anterior del dashboard. El canal colaborativo también podía aplicar un valor remoto anterior inmediatamente después de una escritura confirmada.

## Corrección

- valor optimista inmediato al hacer clic;
- confirmación con la respuesta de `setConapeRevisionSemaforo`;
- ventana de protección de 18 segundos contra fotografías o deltas anteriores;
- firma estable para no reinicializar por cambios de identidad del arreglo;
- consulta delta cada 4 segundos;
- reconciliación completa cada 20 segundos y al recuperar foco;
- reinicio inmediato a cero únicamente cuando el ciclo está oficialmente cerrado.

## Evidencia

La auditoría de `CONAPE_MOVIMIENTOS_LOG` confirmó que las revisiones sí estaban siendo persistidas. No se limpiaron historiales repetidos porque representan clics reales y forman parte de la auditoría.

## Backend

No cambia. Continúa vigente `F98.4-Z6-CS21A103`.

## Prueba

`tests/Test_CS21A105_review_guard.js` valida:

1. una fotografía vieja no borra el paso local;
2. un delta viejo no borra el paso local;
3. la confirmación del servidor se conserva;
4. un cierre oficial reinicia el semáforo.
