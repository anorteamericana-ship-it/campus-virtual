# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión frontend:** F98.4-Z6-CS21A102  
**Backend integral vigente:** F98.4-Z6-CS21A101  
**Backend Apps Script publicado:** CS21A101 validado por el usuario  
**Corte:** 16-jul-2026

## Cambio vigente CS21A102

Se corrigió una regresión de montaje en Consulta individual.

El asistente `Poner al día` se cargaba antes que `admin_students.jsx`. El módulo diferido publicaba posteriormente el modal antiguo, mientras el instalador se retiraba al encontrar una marca de versión aunque la función activa fuera incorrecta.

La corrección:

- compara la función realmente activa;
- reinstala `ANQuickUpdate99.QuickModal` después de cargar `admin_students.jsx` o `buscador.jsx`;
- repite la comprobación durante los siguientes 800 ms;
- expone `__AN_QUICK_UPDATE_ACTIVE__` y `__AN_QUICK_UPDATE_BUILD__` para diagnóstico.

## Recuperación de expedientes APR + siguiente PE

CS21A102 permite continuar cuando el nivel actual ya está `APR` y el siguiente permanece `PE`:

1. confirma el nivel aprobado sin reaprobarlo;
2. activa el siguiente nivel en `CA` usando el endpoint idempotente vigente;
3. consolida un solo intento activo;
4. abre el pago del nuevo nivel;
5. pregunta CONAPE al final.

## Caso 17079

La acción realizada con el modal antiguo no completó la puesta al día:

- B1 APR 96;
- B2 APR 97;
- I1 APR 96;
- I2 PE;
- sin intento I2 activo;
- sin operación en `PAGOS_OPERACIONES`;
- sin movimientos en `PAGOS_CAMPUS`;
- CONAPE externo conserva I2 en PE.

No se modificaron sus datos durante la auditoría.

## Funciones preservadas

- Seguimiento CONAPE solo para desembolso 01.
- Semáforo colaborativo.
- Pago local separado de CONAPE.
- Cierre CONAPE idempotente.
- Journal y reversión.
- MÁSCARA de Keylor.

## Backend

Continúa vigente:

`Code_F98_4_Z6_CS21A101_COMPLETO.gs`

No se requiere reemplazar Apps Script para esta corrección frontend.

## Prueba visual

1. recargar el Campus con `Ctrl + F5`;
2. abrir Consulta individual;
3. abrir Estado en 17079, nivel I1;
4. comprobar que aparece `Poner al día`, no `Cambiar estatus — I1`;
5. comprobar en consola:
   - `window.__AN_QUICK_UPDATE_BUILD__ === 'F98.4-Z6-CS21A102'`;
   - `window.__AN_QUICK_UPDATE_ACTIVE__ === true`.

## Documentación vigente

Leer `README_F98_4_Z6_CS21A102.md` antes de continuar el desarrollo.
