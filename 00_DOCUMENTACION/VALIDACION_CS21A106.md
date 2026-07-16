# Validación · F98.4-Z6-CS21A106

## Datos auditados

La comparación se realizó entre `CONAPE_MOVIMIENTOS_LOG` y el archivo externo oficial `6-historial`.

| Código | Movimiento | Resultado esperado |
|---|---|---|
| 17190 | 01/09/2026 | B2 · PE |
| 17158 | 01/09/2026 | B2 · CA |
| 17124 | 01/09/2026 | I1 · PE |
| 17043 | 01/09/2026 | I2 · PE |

## Controles

- El movimiento conserva su `MOVIMIENTO_ID`.
- El semáforo continúa guardando sobre el movimiento original.
- `Detectado` conserva la fecha de `CONAPE_MOVIMIENTOS_LOG`.
- WhatsApp continúa utilizando el movimiento y nivel resueltos.
- Una coincidencia no segura se muestra como `Nivel por confirmar`; no se oculta.
- No se modifican hojas, pagos, estados académicos ni CONAPE.

## Estado de publicación

El código está guardado en GitHub. La comprobación visual en GitHub Pages queda pendiente hasta que la versión publicada cargue `F98.4-Z6-CS21A106`.
