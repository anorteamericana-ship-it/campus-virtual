# F98.4-Z6-CS21A106 · Restauración de datos en Seguimiento inmediato

## Problema corregido

CS21A104 agrupó correctamente los movimientos por estudiante, pero alineaba `Periodo / nivel`, `Detectado` y `WhatsApp` únicamente cuando el movimiento ya traía un `level` resuelto por el backend.

Muchos desembolsos futuros no tenían ese campo porque el grupo futuro todavía no estaba completamente enlazado en `GRUPOS/ESTATUS`, aunque la información académica sí existía en el historial oficial CONAPE.

El resultado era una ficha con el resumen académico visible y la parte derecha vacía.

## Fuente de verdad vigente

CS21A106 resuelve cada movimiento con esta prioridad:

1. coincidencia exacta en `6-historial` por cédula, año y periodo cuatrimestral;
2. nivel anterior entregado por el backend, confirmado contra el historial;
3. `Nivel por confirmar` cuando no existe una coincidencia segura.

La tercera condición nunca oculta el movimiento: conserva período, fecha detectada, semáforo y WhatsApp.

## Casos auditados

- 17190 · septiembre 2026 → Básico II · PE.
- 17158 · septiembre 2026 → Básico II · CA.
- 17124 · septiembre 2026 → Intermedio I · PE.
- 17043 · septiembre 2026 → Intermedio II · PE.

## Preservado

- una ficha por estudiante;
- columna Detectado;
- semáforo estable A105;
- morosidad oficial en vivo A103;
- movimientos 02/03 informativos;
- pagos, reversión y journal;
- MÁSCARA de Keylor.

## Backend

No cambia. Continúa vigente `Code_F98_4_Z6_CS21A103_COMPLETO.gs`.

## Verificación visual

Después de publicar GitHub Pages y hacer `Ctrl + F5`, buscar 17190. El movimiento `01/09/2026` debe aparecer alineado con Básico II y mostrar su fecha detectada y WhatsApp.

En consola:

```javascript
window.__AN_MASTER_CONAPE_MOVEMENTS_BUILD__
// F98.4-Z6-CS21A106

window.__AN_CONAPE_LEVEL_LINK_AUDIT__
```
