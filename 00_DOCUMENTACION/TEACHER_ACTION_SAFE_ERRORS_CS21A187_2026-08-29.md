# CS21A187 · Acciones docentes · errores seguros

Fecha: 2026-08-29
Base exacta: PR #158 / `42c200a15886fa4e52eb71c425a455b003455c99`

## Hallazgo

Después de sanear carga de grupos/panel/bridge en CS21A186, el barrido de `teacher_views.jsx` confirmó seis conversiones adicionales de errores técnicos a interfaz durante acciones:

1. iniciar la clase desde la tarjeta principal;
2. finalizar la clase;
3. iniciar la clase desde el drawer de lección;
4. guardar calificaciones;
5. respuesta backend negativa al registrar asistencia;
6. excepción/red al registrar asistencia.

Las rutas usaban `alert(e.message || String(e))`, `alert(e.message||String(e))`, `Error de conexión: ${e.message}` o `data.error` directo.

## Cambio

Se reutiliza `teacherSessionSafeUserError`, ya introducido y probado por CS21A186.

Fallbacks visibles:
- inicio: `No se pudo iniciar la clase. Intentá de nuevo.`;
- cierre: `No se pudo cerrar la clase. Intentá de nuevo.`;
- calificaciones: `No se pudieron guardar las calificaciones. Intentá de nuevo.`;
- asistencia: `No se pudo registrar la asistencia. Intentá de nuevo.`.

Mensajes de negocio no técnicos pueden seguir pasando; códigos/HTTP/backend/red/stack quedan fuera de la UI y en consola.

## No cambia

- Apps Script;
- endpoint ni payload de inicio/cierre;
- confirmación de cierre;
- zoom link;
- calificaciones ni reglas de rango;
- asistencia ni estados present/late/absent;
- toast de éxito;
- Drive ACL;
- SEC-005;
- producción.

## QA

El guard exige cero `alert(e.message...)`, cero `Error de conexión: + e.message`, cero `data.error` directo en asistencia, y preserva el diagnóstico interno de transporte.

Estado esperado: `SAFE ACTION COPY ONLY · NO BUSINESS LOGIC CHANGE · NO PROD`.
