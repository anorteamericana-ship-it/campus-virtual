# F98.4-Z6-CS21A109 · Periodos B/C y orden múltiple

## Corrección académica

`Seguimiento inmediato` ya no convierte todos los meses a cuatrimestres.

La resolución usa el `TIPO_PERIODO` real del historial:

- `B`: enero-febrero 1, marzo-abril 2, mayo-junio 3, julio-agosto 4, septiembre-octubre 5, noviembre-diciembre 6.
- `C`: enero-abril 1, mayo-agosto 2, septiembre-diciembre 3.
- `S`: enero-junio 1, julio-diciembre 2.
- `M`: número de mes.

### Caso 17187

- Movimiento académico: `01/07/2026`.
- Tipo oficial: `B`.
- Periodo: `20264B`.
- Nivel: `B2`.
- Estado: `CA`.
- Morosidad oficial 2026 periodo 4: `NO`.

Por tanto, el movimiento se enlaza con Básico II y se clasifica como cerrado, no como `Nivel por confirmar`.

## Orden múltiple

El panel admite hasta tres prioridades simultáneas:

1. fecha de desembolso;
2. grupo;
3. código;
4. fecha detectada;
5. estudiante;
6. ruta académica;
7. WhatsApp.

Orden predeterminado:

1. fecha de desembolso, más antigua primero;
2. código, menor a mayor.

## Arquitectura

La secuencia canónica es:

1. tabla y vista agrupadas;
2. controlador de multiorden A109;
3. semáforo;
4. datos con periodos reales y morosidad en vivo;
5. panel A109;
6. guardia de recuperación A109.

No cambia Apps Script, pagos, expedientes, hojas CONAPE ni la MÁSCARA de Keylor.
