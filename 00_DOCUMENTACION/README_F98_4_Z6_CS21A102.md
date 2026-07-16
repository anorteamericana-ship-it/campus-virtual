# F98.4-Z6-CS21A102 · Montaje estable de Poner al día

## Problema confirmado

El asistente nuevo se marcaba como instalado antes de que `admin_students.jsx` terminara de cargarse. El módulo diferido publicaba después el `ModalEstatus` antiguo y el instalador no lo reemplazaba porque solo comprobaba la versión guardada, no la función realmente activa.

## Corrección

- El instalador compara `window.ModalEstatus` con `ANQuickUpdate99.QuickModal`.
- Reinstala el asistente después de cargar `admin_students.jsx` o `buscador.jsx`.
- Repite la comprobación a 0, 40/50, 160/200 y 600/800 ms para cubrir envoltorios posteriores.
- Expone `window.__AN_QUICK_UPDATE_ACTIVE__` y `window.__AN_QUICK_UPDATE_BUILD__` para diagnóstico.

## Caso 17079

La operación realizada con el modal antiguo no promovió ni cobró al estudiante:

- B1 APR 96.
- B2 APR 97.
- I1 APR 96.
- I2 PE.
- Sin intento I2 activo.
- Sin operación en `PAGOS_OPERACIONES`.
- Sin filas en `PAGOS_CAMPUS`.
- CONAPE externo conserva I2 en PE.

CS21A102 también permite continuar cuando el nivel actual ya está APR: verifica el APR, activa el siguiente nivel PE→CA de forma idempotente y abre el pago sin duplicar el intento.

## Backend

No cambia. Continúa vigente `Code_F98_4_Z6_CS21A101_COMPLETO.gs`.

## Protección

La MÁSCARA de Keylor no fue modificada.
