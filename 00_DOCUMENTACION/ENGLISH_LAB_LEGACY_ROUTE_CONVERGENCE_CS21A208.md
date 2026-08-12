# CS21A208 · Convergencia de rutas legacy de English LAB

Fecha de corte: 2026-08-11

## Objetivo

Cerrar la segunda vía de duplicidad de English LAB: URLs, hashes o bookmarks antiguos que todavía apuntan a `academia_play` aunque CS207 ya haya eliminado esa entrada visible para docentes y estudiantes matriculados.

## Base

- Base exacta: `CS21A207` @ `ba3a4e7d621b654204b36775832a8c4e835ee007`.
- Rama: `fix/cs21a208-english-lab-legacy-route-convergence`.
- Backend QA: `CS21A201-CURRICULUM-SOURCE-1` sin cambios.
- Apps Script / deployment: sin cambios; mantener el mismo `/exec` QA.
- `main` y producción fuera de alcance.

## Comportamiento de rutas

### Prospecto / usuario gratis

`academia_play` continúa montando `AcademiaPlayView`.

Motivo: el guard del flujo gratis sólo permite `dashboard` y `academia_play`. Cambiarlo ahora por Live mezclaría el producto gratuito con permisos, matrícula y operación de aulas que no corresponden.

### Estudiante matriculado

Si entra por una URL/hash antiguo `academia_play`, CS208 monta `EnglishLabLiveStudentView`.

La ruta canónica `english_lab_live` monta el mismo componente y usa el mismo loader Live.

### Docente

Tanto `academia_play` legacy como `english_lab_live` montan `EnglishLabLiveTeacherView`.

Esto evita que un bookmark anterior reabra el catálogo/demo histórico después de CS207.

### Administración

`academia_play` continúa montando `AcademiaPlayView` por ahora.

Ese catálogo necesita una decisión funcional separada antes de retirarse o convertirse en Biblioteca/práctica individual. Borrarlo aquí sería una migración distinta y no está justificado.

## Compatibilidad

Se conservan:

- aliases `academia_play` y `play` del estudiante;
- lazy bundle `F96_LAZY.academia_play`;
- código `src/academia_play.jsx`;
- acceso gratis;
- acceso administrativo legacy.

Lo que cambia es el **destino por rol**, no la existencia de las rutas históricas.

## QA

El gate `CS21A208 English LAB Legacy Route Convergence QA` exige:

1. prospecto gratis → `AcademiaPlayView`;
2. estudiante matriculado con ruta vieja → `EnglishLabLiveStudentView`;
3. docente con ruta vieja → `EnglishLabLiveTeacherView`;
4. admin → `AcademiaPlayView`;
5. rutas canónicas tituladas `English LAB`;
6. hashes legacy conservados;
7. sidebar CS207 intacto;
8. shell CS205 de cinco juegos intacto;
9. contratos Memory, Quiz y Word Search intactos;
10. backend CS201 reensamblable y sin cambios.

## Carga

Las pruebas autenticadas masivas de 15/20/25 estudiantes siguen diferidas. No bloquean esta convergencia de routing y no se presentan como realizadas.

## Próximo corte

Con CS207+CS208, docente y estudiante matriculado quedan encaminados a una sola experiencia Live incluso desde enlaces antiguos. El siguiente problema ya no es routing: es definir el futuro del catálogo `academia_play` para **prospectos y administración** sin confundirlo con los cinco juegos Live.

**NO MERGE / NO PROD** sin QA y autorización explícita.
