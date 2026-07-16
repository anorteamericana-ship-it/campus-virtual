# F98.4-Z6-CS21A104 · Seguimiento inmediato agrupado

## Objetivo

Evitar que un estudiante aparezca repetido cuando tiene más de un desembolso académico 01 registrado.

## Regla visual

La identidad se renderiza una sola vez por estudiante dentro de cada sección pendiente o cerrada.

Cada movimiento conserva:

- `MOVIMIENTO_ID`;
- periodo y nivel;
- fecha detectada;
- morosidad oficial;
- estado pendiente/cerrado;
- semáforo;
- acción de WhatsApp.

## Alineación

El cuerpo derecho de la ficha utiliza los mismos cuatro renglones académicos:

1. Básico I;
2. Básico II;
3. Intermedio I;
4. Intermedio II.

El periodo, la fecha detectada y WhatsApp se colocan en el renglón del nivel al que pertenece el movimiento.

## Detectado

La fecha `D-d/m` tiene una columna independiente y ordenable. El selector general ofrece orden ascendente y descendente por detección.

## Conteos

Se informa por separado la cantidad de estudiantes y la cantidad de movimientos. Los KPI de desembolsos continúan contando movimientos académicos 01.

## Backend

No cambia. Se mantiene CS21A103.

## Protecciones

No se modifican pagos, expedientes, archivos CONAPE, semáforos guardados ni la MÁSCARA de Keylor.
