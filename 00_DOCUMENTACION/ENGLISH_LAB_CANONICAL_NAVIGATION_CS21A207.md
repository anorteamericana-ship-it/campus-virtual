# CS21A207 · Navegación canónica de English LAB

Fecha de corte: 2026-08-11

## Objetivo

Eliminar la duplicidad visible `English LAB` / `English LAB Live` para docentes y estudiantes matriculados, sin borrar rutas legacy ni modificar motores, permisos, Apps Script o backend.

## Base

- Base exacta: `CS21A206` @ `fb3b71667e2556992fb48b5b7515a1bbc8e3f8cb`.
- Rama: `fix/cs21a207-english-lab-canonical-navigation`.
- Backend QA: `CS21A201-CURRICULUM-SOURCE-1` sin cambios.
- Apps Script / deployment: sin cambios; conservar el mismo `/exec` QA.
- `main` y producción permanecen fuera de alcance.

## Cambio visible

### Estudiante matriculado

Antes mostraba dos entradas:

- `English LAB` → `academia_play`;
- `English LAB Live` → `english_lab_live`.

CS21A207 muestra una sola entrada:

- `English LAB` → `english_lab_live`.

### Docente

Aplica la misma convergencia: una sola entrada visible `English LAB`, dirigida al shell Live canónico de cinco juegos.

## Compatibilidad preservada

CS21A207 **no elimina** `academia_play` ni sus rutas. Se conservan porque todavía cumplen funciones distintas:

- el prospecto/usuario gratis continúa entrando por `academia_play`, única ruta permitida junto con `dashboard` por su guard actual;
- administración conserva temporalmente su acceso legacy/catálogo;
- hashes o rutas antiguas hacia `academia_play` continúan resolviendo mientras se diseña una Biblioteca limpia.

Eliminar esas rutas en este corte habría mezclado navegación visible con migración funcional y podía romper el flujo gratis. Por eso se ocultan únicamente las entradas duplicadas de docente/estudiante matriculado.

## English LAB canónico

La entrada visible `english_lab_live` continúa usando el loader canónico y el shell CS205 con:

1. Memory Match;
2. Sentence Order;
3. Hangman;
4. Quiz Time;
5. Word Search.

No se modifican motores ni configuradores.

## QA

El gate `CS21A207 English LAB Canonical Navigation QA` exige:

- exactamente una entrada Live visible para estudiante matriculado;
- exactamente una entrada Live visible para docente;
- etiqueta visible única `English LAB`;
- ausencia del bloque doble legacy/Live;
- preservación del acceso gratis `academia_play`;
- preservación del catálogo/ruta legacy administrativa;
- preservación de rutas directas legacy en `app.jsx`;
- preservación del shell CS205;
- preservación del handoff Memory lobby→CS192;
- integración Quiz/Word Search vigente;
- backend CS201 reensamblable y sin cambios.

## Carga

Las pruebas autenticadas masivas con 15/20/25 estudiantes continúan diferidas y no bloquean este corte de navegación. El modelo sintético permanece como guard técnico, no como evidencia de capacidad real.

## Siguiente paso

Después de validar CS207, el catálogo legacy de `academia_play.jsx` debe tratarse como un problema separado. No conviene borrarlo todavía: primero hay que decidir qué contenido queda como Biblioteca/práctica individual y qué rutas deben retirarse definitivamente.

**NO MERGE / NO PROD** sin QA correspondiente y autorización explícita.
