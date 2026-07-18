# QA Docente · Mis Grupos y Cronograma · CS21A133

Fecha de corte: 18 de julio de 2026  
Base: `main` posterior a CS21A132

## Alcance de esta fase

Se revisaron las superficies **Mis Grupos** y **Cronograma Inglés Conversacional** sin modificar Apps Script, hojas académicas, pagos, exámenes ni reglas de cierre.

Archivos principales:

- `src/app.jsx`: rutas y comprobación global de sesión activa.
- `src/teacher_views.jsx`: grupos, panel consolidado, fallback, agenda, detalle y cierre.
- `src/teacher_agenda_slots_cs19f.jsx`: composición semanal final y wrappers de vista.
- `src/lazy_loader.jsx`: carga secuencial del bundle docente.
- `src/teacher_delivery_guard_cs21a133.js`: correcciones aisladas de esta fase.

## Contratos frontend → backend observados

### Mis Grupos

- `getDocenteGruposActuales`
- `getDocenteGrupoPanelF80`

Fallback cuando el panel consolidado no responde:

- `getEstudiantesParaCierre`
- `getAsistenciaGrupoCompleta`
- `getFechasGrupo` con riel `curso`
- `getFechasGrupo` con riel `ican`
- `getAsistenciaDetalleGrupoF77`
- `getDocenteSesionClaseF77`

### Sesión y cronograma

- `getDocenteSesionActivaF87`
- `getLeccionDetalle`
- `getDocenteSesionClaseF77`
- `docenteIniciarSesionClaseF77`
- `docenteCerrarClaseConAsistenciaF87`
- `docenteFinalizarSesionClaseF77` — contrato heredado; no se encontró montaje vigente de `SesionClaseBox`, pero no se elimina todavía.

### Evaluaciones y materiales vinculados

- `oralGetResumenGrupo`
- `getMaterialLeccion`
- `docenteCompletarProgressCheckF98Z6K`

## Fallo comprobado: fecha UTC

El fallback del panel docente seleccionaba la lección de hoy mediante:

```js
new Date().toISOString().slice(0,10)
```

Ese valor usa UTC. En Costa Rica, después de las 6:00 p. m., puede representar el día siguiente y producir una selección incorrecta de `leccion_hoy`.

CS21A133 recalcula únicamente el resultado fallback con la zona `America/Costa_Rica`. También normaliza `tvIsToday` con la misma zona. El panel consolidado exitoso no es reescrito.

## Protección contra doble envío

CS21A133 aplica *single-flight* en la misma pestaña para operaciones idénticas de:

- inicio de clase;
- cierre con asistencia;
- finalización heredada.

Mientras una solicitud sigue pendiente, un segundo clic idéntico reutiliza la misma promesa y no genera otra llamada. Al terminar —también cuando falla— el bloqueo se libera para permitir un reintento.

Esta protección es de interfaz. No sustituye una transacción atómica del backend ni impide una carrera entre dos pestañas o dispositivos.

## Seguridad backend observada

En la copia canónica de `Code.gs` observada en Drive:

- `docenteCerrarClaseConAsistenciaF87` utiliza bloqueo, valida asistencia completa y después finaliza la sesión;
- `docenteIniciarSesionClaseF77` comprueba sesiones abiertas e idempotencia de la misma lección, pero la secuencia de comprobación y escritura no quedó confirmada bajo un bloqueo único.

Por lo anterior, el cierre tiene una defensa backend más fuerte que el inicio. El refuerzo atómico del inicio debe prepararse posteriormente en una implementación de prueba de Apps Script, no directamente en producción.

## Pruebas automáticas

`scripts/test_teacher_delivery_guard_cs21a133.mjs` comprueba:

1. fecha actual en `America/Costa_Rica`;
2. selección de la primera lección no cerrada del día en el fallback;
3. exclusión de feriados;
4. prioridad de riel de curso antes de I CAN cuando coinciden en fecha;
5. una sola llamada para dos escrituras idénticas simultáneas;
6. liberación del bloqueo después de éxito y error;
7. lecturas sin deduplicación ni cambio de comportamiento.

## Pendiente de QA autenticado

Todavía debe probarse con una sesión docente real:

- listado exacto de grupos asignados;
- cambio entre grupos;
- horarios LM, KJ, L4 y SA;
- selección correcta de la lección del día después de las 6:00 p. m.;
- apertura de una clase;
- rechazo de una segunda clase activa;
- cierre con todos los estudiantes;
- reintento después de una falla de red;
- actualización del banner global y del cronograma tras cerrar.

No se afirma despliegue de Apps Script ni se modificó `Code.gs` en esta fase.
