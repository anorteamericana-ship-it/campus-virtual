# FUENTE VERDADERA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

**Versión vigente de respaldo:** F98.4-Z6-CS20H  
**Backend Apps Script vigente:** F98.4-Z6-CS20H backend compatible CS20G sin cambio funcional  
**Corte:** 09-jul-2026  

Este documento queda como archivo único de continuidad dentro de `00_DOCUMENTACION`. La idea operativa es simple: en cada entrega futura se puede subir de nuevo esta carpeta y “caerle encima” a la anterior para mantener una sola fuente verdadera accesible desde GitHub.

## Estado validado antes de CS20H

La presentación docente quedó aprobada y funcionando correctamente con:

- **CS19F** — agenda docente estable post-presentación.
- **CS19B/CS20G backend** — agenda slots, demo Keylor y English LAB Live.
- **Demo Keylor:** activa solo para Keylor si el switch backend de demo está encendido.
- **Profesores reales:** ven sus grupos reales; no ven datos ficticios de Keylor.

## Estado de English LAB Live al cierre CS20H

English LAB Live ya cuenta con flujo funcional completo para piloto controlado:

1. Docente crea sala live.
2. Se genera código `LAB-####`.
3. Docente inicia sala.
4. Docente lanza pregunta.
5. Estudiante entra con código.
6. Estudiante responde.
7. Panel docente cuenta participantes y respuestas.
8. Docente cierra pregunta.
9. Estudiante ve respuesta correcta.
10. Docente avanza a siguiente pregunta.
11. Ranking temporal individual y por equipos.
12. Pantalla proyector.
13. Resultados finales.
14. Banco de preguntas por nivel/unidad/tipo de juego.
15. Diagnóstico visual del banco pedagógico.
16. CS20H agrega ingreso estudiantil pulido y mensaje listo para Zoom/WhatsApp.

## Regla institucional crítica

English LAB Live es **práctica gamificada**. No es evaluación oficial.

No debe:

- guardar notas oficiales;
- afectar aprobación académica;
- afectar certificados;
- afectar pagos;
- reemplazar exámenes;
- mezclarse con cierre académico;
- crear consecuencias administrativas para el estudiante.

## Hojas usadas por English LAB Live

- `ENGLISH_LAB_LIVE_ROOMS`
- `ENGLISH_LAB_LIVE_PLAYERS`
- `ENGLISH_LAB_LIVE_ANSWERS`
- `ENGLISH_LAB_LIVE_EVENTS`
- `ENGLISH_LAB_QUESTION_BANK`

## Archivos frontend vigentes incluidos en el respaldo CS20H

- `inscripcion.html`
- `src/app.jsx`
- `src/sidebar.jsx`
- `src/english_lab_live.jsx`
- `src/academia_play.jsx`
- `src/inscripcion.jsx`
- `src/prospect_free_student.jsx`
- `src/teacher_agenda_slots_cs19f.jsx`
- `styles/academia_play.css`
- `styles/free_student.css`
- `styles/inscripcion.css`
- `assets/brand/logo_academia_norteamericana_hd.png`
- `assets/inscripcion/financia_equipo_319.png`
- `assets/inscripcion/financia_equipo_360.png`

## Archivos modificados en CS20H

- `src/app.jsx` — actualiza caché/lazy load a `F98.4Z6CS20H`.
- `src/sidebar.jsx` — comentario/versionado de continuidad.
- `src/english_lab_live.jsx` — ingreso estudiante pulido, panel para compartir sala, copiar código/mensaje/enlace, lectura de `?room=LAB-####`.
- `00_DOCUMENTACION/*` — documentación de continuidad y respaldo.

## Backend en CS20H

CS20H no cambia endpoints ni estructura de hojas. Se entrega `Code.gs` completo compatible con CS20G para respaldo. Si CS20G ya estaba publicado y funcionando, técnicamente no es obligatorio reemplazar Apps Script, pero el ZIP completo lo incluye para tener corte cerrado.

## Siguiente bloque recomendado después de CS20H

**CS20I — piloto controlado / QA Live**

Objetivo: probar con 1 docente y 2–5 estudiantes reales o demo, registrando fallos antes de meter más funcionalidades. No avanzar a contenido masivo sin validar:

- entrada por código;
- contador de participantes;
- respuesta única;
- ranking;
- pantalla proyector;
- cierre de sala;
- rendimiento con varias pestañas.
