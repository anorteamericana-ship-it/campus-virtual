# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión frontend:** F98.4-Z6-CS21A106  
**Backend integral vigente:** F98.4-Z6-CS21A103  
**Backend Apps Script publicado:** CS21A103 validado por el usuario  
**Corte:** 16-jul-2026

## Cambio vigente CS21A106

Se corrigieron las filas vacías de `Seguimiento inmediato` después de la agrupación A104.

### Diagnóstico

El movimiento CONAPE sí existía, pero algunos desembolsos futuros no recibían un `level` porque el grupo futuro todavía no estaba completamente enlazado. La tabla agrupada solo colocaba `Periodo / nivel`, `Detectado` y `WhatsApp` cuando ese campo venía resuelto.

### Resolución vigente

1. buscar el movimiento en `6-historial` por cédula, año y periodo cuatrimestral;
2. usar el nivel exacto y su estado académico;
3. utilizar el nivel anterior del backend solo como respaldo;
4. mostrar `Nivel por confirmar` cuando no exista una coincidencia segura;
5. nunca ocultar período, fecha detectada, semáforo o WhatsApp por falta de enlace.

### Casos auditados

- 17190 → septiembre 2026 corresponde a B2 PE.
- 17158 → septiembre 2026 corresponde a B2 CA.
- 17124 → septiembre 2026 corresponde a I1 PE.
- 17043 → septiembre 2026 corresponde a I2 PE.

## Funciones preservadas

- Una ficha por estudiante A104.
- Columna Detectado ordenable.
- Semáforo estable A105.
- Morosidad oficial en vivo A103.
- Seguimiento exclusivo del desembolso académico 01.
- WhatsApp por movimiento y nivel.
- Contexto informativo 02/03.
- Poner al día A102.
- Journal, pagos y reversión.
- MÁSCARA de Keylor.

## Backend

No cambia. Continúa vigente:

`Code_F98_4_Z6_CS21A103_COMPLETO.gs`

No se requiere reemplazar Apps Script ni ejecutar una prueba backend para CS21A106.

## Diagnóstico en navegador

```javascript
window.__AN_MASTER_CONAPE_MOVEMENTS_BUILD__
// F98.4-Z6-CS21A106

window.__AN_CONAPE_LEVEL_LINK_AUDIT__
```

El segundo valor muestra movimientos resueltos por historial, por respaldo y todavía pendientes de confirmar.

## Publicación

1. esperar que GitHub Pages publique `main`;
2. hacer `Ctrl + F5`;
3. buscar 17190;
4. confirmar B2 alineado con `01/09/2026`;
5. revisar otros estudiantes que antes aparecían vacíos;
6. confirmar que el semáforo A105 permanece guardado.

## Protección

La MÁSCARA de Keylor no fue modificada.

## Documentación vigente

Leer `README_F98_4_Z6_CS21A106.md` y `VALIDACION_CS21A106.md` antes de continuar.
