# CS21A210BP · plan de diff mínimo para guard QA · 2026-09-01

## Fuente congelada

- Snapshot: `QA_HEAD_20260901_215804Z`
- Archivos fuente: 71
- Aggregate SHA-256: `3e384ac34930e6a936a3f930db8819bd80124ef59f522ac1b5b11fee8f881ec6`
- Export: `clasp clone-script` read-only
- `remote_write_performed=false`

Este documento NO modifica Apps Script. Solo fija el diff propuesto sobre el snapshot exacto.

## Hallazgo raíz

`99_QA_Staging_Guard.js` usa `_qa144DangerousFn_(fn)` con un regex lexical:

```js
/(pago|payment|banco|bank|comprobante|factura|nota|grade|evaluacion|examen|oral|asistencia|cierre|cerrar|conape|matricula|suspension|cambio|actualizar|eliminar|borrar|importar|aplicar|revertir|promover)/i
```

La política por substrings produce:

1. **overblocking** de lecturas legítimas (`getEvaluacionesEstudiante`, `getAsistenciaEstudiante`, `getEstadoConape`, entre otras);
2. **underblocking** de mutaciones cuyo nombre no contiene palabras del regex (`crear*`, `guardar*`, `save*`, `upload*`, etc.).

Del dispatcher actual se observaron 82 nombres que chocan con el regex; 24 tienen forma de lectura/auditoría y requieren clasificación semántica. En sentido contrario, al menos 54 nombres con verbos típicos de mutación no chocan con el regex y también requieren auditoría.

## Tres lecturas puras demostradas

### `getEvaluacionesEstudiante`

- Implementación en `10_Estudiantes.js`.
- Solo abre hojas y usa `_f983ReadValues_`/`getFechasGrupo`/`_notasF29_icanResumen_`.
- `_f983ReadValues_` es `getValues()` puro.
- El router POST la declara para `student/teacher/admin/superadmin`.
- La propiedad de estudiante se valida contra `sesion.codigo`.
- El frontend la usa en `student_dashboard.jsx` y `cronograma.jsx`.

### `getAsistenciaEstudiante`

- Implementación en `10_Estudiantes.js`.
- Lectura pura de `OP.ASISTENCIA` mediante `_f983ReadValues_`.
- Protegida por rol/propiedad en el router.
- El dashboard estudiante la consume.

### `getEstadoConape`

- Implementación en `10_Estudiantes.js`.
- Lectura pura de `CONAPE_SYNC` mediante `_f983ReadValues_`.
- Protegida por rol y propiedad de `cedula`.
- El dashboard estudiante la consume.

## `getPagosCampus` · corrección de clasificación

No debe formar parte del E2 POST actual:

- no aparece en el mapa POST de `_an4406_rolesPorEndpoint_`;
- no aparece en el dispatcher `doPost_BASE_F59`;
- su implementación llama `getOrCreatePagosCampus()`, que puede ejecutar `insertSheet`, `appendRow` y formato si la hoja falta.

Por tanto no es una lectura POST pura garantizada y el P1 anterior del harness queda retirado.

## Sesiones · semántica correcta de “read-only”

El E2 no ejecuta mutaciones de negocio, pero la autenticación sí muta estado técnico:

- `iniciarSesion()` crea una fila en `SESIONES`;
- `validarSesion()` puede actualizar `ULTIMA_ACTIVIDAD` o marcar una sesión expirada;
- `cerrarSesion()` escribe `ACTIVA=false` y `CIERRE_MOTIVO=LOGOUT`.

Además el guard actual bloquea `cerrarSesion` por contener `cerrar`, de modo que el frontend puede limpiar la sesión local mientras el token servidor queda activo hasta su expiración (8 h).

Clasificación correcta del E2: **NO BUSINESS MUTATIONS**, no `0 writes` absoluto.

## Diff mínimo propuesto · NO INSTALADO

Objetivo: desbloquear únicamente las tres lecturas puras ya demostradas y permitir la revocación de sesión QA, sin abrir ninguna mutación de negocio adicional.

```diff
--- a/99_QA_Staging_Guard.js
+++ b/99_QA_Staging_Guard.js
@@
 function _qa144AllowedLabFn_(fn){
   return /^englishlab/i.test(fn) || /^academiaplay/i.test(fn) || fn === 'freeuserenglishlabaccess';
 }
+function _qa144AllowedCampusReadFn_(fn){
+  return fn === 'getevaluacionesestudiante' ||
+    fn === 'getasistenciaestudiante' ||
+    fn === 'getestadoconape';
+}
+function _qa144AllowedSessionLifecycleFn_(fn){
+  return fn === 'cerrarsesion';
+}
 function _qa144DangerousFn_(fn){
   return /(pago|payment|banco|bank|comprobante|factura|nota|grade|evaluacion|examen|oral|asistencia|cierre|cerrar|conape|matricula|suspension|cambio|actualizar|eliminar|borrar|importar|aplicar|revertir|promover)/i.test(fn);
 }
@@
-    if (_qa144AllowedLabFn_(req.fn)) return _qa144DoPostBase_(e);
+    if (_qa144AllowedLabFn_(req.fn) ||
+        _qa144AllowedCampusReadFn_(req.fn) ||
+        _qa144AllowedSessionLifecycleFn_(req.fn)) {
+      return _qa144DoPostBase_(e);
+    }
     if (_qa144DangerousFn_(req.fn)) {
```

### Por qué `cerrarSesion` sí se incluye

No es una lectura; es una mutación técnica de sesión. Se propone como excepción exacta porque revoca el token servidor y reduce exposición. No toca pagos, notas, asistencia, matrícula, CONAPE ni datos académicos.

### Por qué NO se agrega un wildcard `get*`

Algunos endpoints llamados `get*` crean estructuras si faltan (ej. `getPagosCampus` vía `getOrCreatePagosCampus`, `getSolicitudesPago` vía `_getOrCreateSolicitudesPagoSheet`). Un wildcard `get*` sería inseguro.

## Cambio requerido en el harness BO

Retirar:

```js
await roleRead('superadmin', 'getPagosCampus', { codigo_est: studentCode });
```

Reemplazar por una lectura POST real declarada y pura del rol superadmin; candidato conservador:

```js
await roleRead('superadmin', 'getAdminDashboard');
```

La prueba del estudiante debe incluir las tres lecturas del dashboard para detectar regresión del guard:

```js
await roleRead('student', 'getEstudiante', { codigo: studentCode });
await roleRead('student', 'getAsistenciaEstudiante', { codigo: studentCode });
await roleRead('student', 'getEvaluacionesEstudiante', { codigo: studentCode, nivel: 'B1' });
await roleRead('student', 'getEstadoConape', { cedula: sessions.student.cedula });
```

`getEstadoConape` solo se ejecutará si la sesión QA de estudiante trae `cedula`; de lo contrario el harness debe marcar la precondición ausente sin inventar una identidad.

## Gate antes de instalar

1. construir parche contra `QA_HEAD_20260901_215804Z/source/99_QA_Staging_Guard.js`;
2. ejecutar análisis estático y contrato QA local;
3. confirmar que ninguna función de negocio mutante nueva queda allowlisted;
4. conservar el mismo Script ID QA y el mismo deployment activo; no crear `/exec` paralelo;
5. instalación QA solo con autorización humana explícita;
6. repetir E2 multirol y verificar browser;
7. volver a exportar snapshot y comparar hash/diff post-instalación.

## Estado

**PLAN ONLY · NO APPS SCRIPT WRITE · NO DEPLOY · NO PROD · NO MERGE.**
