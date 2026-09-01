# CS21A210BE · English LAB Live · errores seguros

Base exacta: PR #256 / `ddd243a73e74c109420fc8a3e9a82e7c2bf31349`.

## Ownership efectivo

CS21A210BD confirmó que `src/app.jsx` carga directamente `src/english_lab_live.jsx` mediante `F96_LAZY.english_lab_live`. Los siete `setError(e.message || String(e))` alcanzan estados `error` que se proyectan en `Alert tone="err"` dentro de las vistas Live.

## Alcance funcional

Se sanea únicamente la presentación de excepción de siete fronteras:

1. carga del control de sala;
2. acciones del control de sala;
3. actualización del estado del jugador;
4. ingreso a sala;
5. envío de respuesta;
6. carga de datos docente;
7. creación de sala.

`englishLabLiveSafeUserError` conserva el detalle técnico únicamente en consola y entrega copy estable por contexto a UI.

Preimagen congelada `src/english_lab_live.jsx`: `f4c865510b1ba3f7fdf8b67be8ea21cf21762cc4`.

## Contrato congelado

No modifica endpoints/actions Live, payloads, código de sala, identificación del jugador, intervalos/polling, rondas, lanzamiento/cierre, preguntas, respuestas, ranking, modos individual/equipo, grupos, unidades, roles, ni la regla de que Live es práctica y no nota oficial. No backend, Apps Script, ACL, main ni PROD.

El guard reconstruye el source desde la preimagen exacta de #256 y exige igualdad byte por byte.

E0: sí. E1: sujeto a Actions. E2: NO. `BACKEND CURRENT SNAPSHOT UNVERIFIED` vigente.
