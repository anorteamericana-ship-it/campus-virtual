# F98.4-Z6-CS21A87 — Calendario Superadmin: corrección de carga real

## Base preservada

- Backend integral actual: F98.4-Z6-CS21A86.
- Motor de inventario/calendario: CS21A80 dentro de Code.gs.
- Frontend actual del repositorio preservado.

CS21A87 es **frontend-only**. No modifica Code.gs, Rebeca, pagos, notas, asistencia ni hojas.

## Causa real del fallo anterior

CS21A80 detectó correctamente que `TodosVistaSemana` ocultaba grupos completados en
`Cronograma completo`, pero intentó corregirlo reemplazando `window.TodosVistaSemana`.

`TodosLosGruposView` fue compilado desde el mismo archivo `cronograma_todos.jsx` y llama a
la referencia local/léxica `TodosVistaSemana`. Por eso sustituir la propiedad de `window`
no cambia la función que el componente ya tiene enlazada internamente.

El mismo problema afectaba `todosShortCode`: reemplazar `window.todosShortCode` no cambia
la referencia local usada por `PillLeccion`.

## Corrección CS21A87

Se carga `calendar_superadmin_sourcefix_cs21a87.js` **antes del lazy loader**.

Cuando el lazy loader solicita `src/cronograma_todos.jsx`, el parche:

1. Intercepta únicamente esa respuesta.
2. Verifica que la fuente contenga exactamente las reglas conocidas.
3. Cambia la regla semanal a:

```js
if (alcance === 'completo' || alcance === 'completados') return true;
```

4. Cambia `todosShortCode` para devolver el código completo.
5. Devuelve la fuente corregida a Babel.
6. Restaura `window.fetch` inmediatamente después de corregir el único recurso objetivo.

No se añaden eventos ficticios y no se alteran los datos académicos.

## Inventario real auditado

La fuente actual `GRUPOS` contiene 12 códigos únicos:

- 9 activos.
- 1 completado.
- 2 proyectados.

El backend CS21A80, ejecutado contra un fixture construido con las 48 filas operativas
actuales de `GRUPOS`, devuelve:

- `COMPLETO`: 12/12.
- `ACTIVOS`: 11/12 (9 activos + 2 proyectados; excluye el completado).

El bug frontend se reprodujo de forma controlada:

- antes: `Cronograma completo` mostraba 11 cuando el completado no tenía evento en la semana;
- después: muestra 12 y conserva la fila vacía de ese grupo.

## Casos críticos verificados

- `B1-LJ69-B6-0325` → B2 · COMPLETADO.
- `B1-KJ94-B6-0425` → I2 · 9am–4pm.
- `B1-SA94-C1-0326` → B2 · 9am–4pm.
- `B1-LM94-B3-0626` → continúa B1 ACTIVO aunque exista B2 proyectado con fecha ya alcanzada.
- `B1-LM18-C3-0726` → B1 PROYECTADO.
- `B1-KJ18-C3-0826` → B1 PROYECTADO.
- Códigos completos conservados, por ejemplo `B1-SA94-C1-0326`.

## Pruebas

### Frontend

18 comprobaciones automatizadas:

- identificación del recurso objetivo;
- no alteración de otros fetch;
- transformación exacta de la regla semanal;
- transformación exacta del código de cohorte;
- marcador de fuente;
- status runtime;
- restauración de fetch;
- reproducción 11 → 12;
- no creación de eventos sintéticos;
- códigos completos.

### Backend

20 comprobaciones automatizadas sobre la función real `getGruposActivos` extraída del
Code.gs CS21A86 y ejecutada con mocks de Apps Script:

- 12 grupos fuente;
- 12 grupos devueltos en COMPLETO;
- integridad 12/12;
- 11 en alcance ACTIVO;
- 9 ACTIVO / 1 COMPLETADO / 2 PROYECTADO;
- niveles operativos críticos;
- horarios 09:00–16:00 y 18:00–21:00;
- aperturas proyectadas;
- no promoción por fecha de un nivel que sigue marcado Proyectado.

## Runtime

Después de abrir el Calendario académico, en consola debe existir:

```js
window.__AN_CALENDAR_SOURCEFIX_STATUS__
```

Esperado:

```json
{
  "ok": true,
  "completeWeekInventory": true,
  "fullGroupCode": true
}
```

## Archivos modificados

- `src/calendar_superadmin_sourcefix_cs21a87.js` — nuevo.
- `campus.html` — una línea de carga antes del lazy loader.

No hay cambios en Apps Script.
