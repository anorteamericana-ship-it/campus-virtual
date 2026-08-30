# CS21A200C · Cronograma · errores seguros

Fecha: 2026-08-30
Base: PR #191 · `fix/admin-resources-safe-errors-cs21a200b`
Base SHA: `ad4fa531e63cc55366aaaa0480cd8e8b330c064c`

## Precedencia comprobada
La vista global admin/superadmin usa `window.TodosLosGruposView` dinámicamente desde `cronograma_grupo.jsx`. CS21A88 reemplaza esa global por `core.CalendarView` en `calendar88_install.js`.

Por tanto el antiguo cuerpo global de `cronograma_todos.jsx` no se modifica en este corte: cuando CS21A88 está instalado no es la definición efectiva del calendario global.

`cronograma_grupo.jsx` sí permanece como superficie efectiva para:
- estudiante: calendario de su grupo;
- docente: agenda de sus grupos;
- admin/superadmin: carga/selector y vista individual de grupo;
- cobertura y edición de una lección.

## Hallazgo
`postCronoGrupo()` conserva diagnóstico técnico útil internamente, pero varias rutas lo convertían directamente en UI mediante `d.error`, `e.message` o errores agregados por grupo.

Rutas objetivo:
1. grupos del docente;
2. grupos admin/superadmin;
3. lecciones de vista individual;
4. agenda docente por grupo + agregado;
5. asignación de cobertura;
6. carga de estudiantes para edición;
7. guardado de cambios de lección.

El fallback docente también exponía `APOLLO.GRUPOS / columna DOCENTE`.

## Cambio
Se agrega `cronoSafeUserError(raw,fallback,context)` en la frontera UI.

- mensajes humanos de negocio pueden conservarse;
- HTTP, Apps Script/backend, endpoint, JSON, token, red, excepciones y códigos de máquina quedan en consola;
- cada ruta recibe un fallback operativo específico;
- se elimina el copy interno `APOLLO.GRUPOS` de la pantalla docente.

## Preservado
- `postCronoGrupo` y su segundo intento;
- token en body;
- `getGrupoInfo`, `getGruposActivos`, `getFechasGrupo`;
- caché de grupos;
- agenda docente;
- `TODOS_GRUPOS`;
- resolución dinámica `window.TodosLosGruposView` y override CS21A88;
- fallback seguro ya existente para estudiante;
- cobertura, asistencia/notas y sus payloads;
- Apps Script, Drive ACL y producción.

**NO PROD · NO AUTO-MERGE**
