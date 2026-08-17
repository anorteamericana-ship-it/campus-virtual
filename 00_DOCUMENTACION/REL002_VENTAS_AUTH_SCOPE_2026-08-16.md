# REL-002 · Ventas · autenticación, rol y alcance

Fecha: 2026-08-16  
Base: `main` `67108928e953fbf044dbcd916dc34a5dd5f1e570`  
Estado: **SOURCE FIXED · RUNTIME QA PENDIENTE**

## 1. Hallazgo confirmado

La auditoría integral detectó que el cliente de Ventas tenía dos helpers POST distintos:

- `postVentasData(fn, payload)`: obtiene el token de sesión y lo envía en el body;
- `postVentas(payload)`: enviaba el payload tal cual, sin añadir token.

Seis wrappers protegidos seguían usando el segundo helper:

- `agregarNotaProspecto`;
- `subirDocumentoExtra`;
- `marcarEtapaProspecto`;
- `cobrarMatriculaProspecto`;
- `activarEstudiante`;
- `aprobarBecaProspecto`.

El backend canónico observado usa `_an4406AutorizarPost_` y exige `body.token` o `body.session_token` para rutas protegidas. Por tanto, el defecto era un desacuerdo real frontend/backend, no solo documentación vieja.

## 2. Corrección de transporte

`postVentas(payload)` ahora:

1. obtiene el token con `window.getSessionToken()`;
2. conserva POST `text/plain;charset=utf-8` para la compatibilidad CORS existente;
3. serializa `{ ...payload, token }`.

El orden es intencional: el token obtenido de la sesión actual se escribe **después** del payload para que un campo `payload.token` no pueda sustituirlo accidentalmente.

No se cambiaron endpoints ni roles del backend.

## 3. Rol de activación

El backend canónico distingue dos familias:

- operaciones comerciales normales: `ventas | admin | superadmin`;
- `activarEstudiante` y `generarMatricula`: `admin | superadmin`.

El frontend también describe `PRE MATRICULA` como “Pago reportado · esperando admin”. Eso respalda conservar la separación de funciones: Ventas reporta/gestiona el avance comercial y Administración aplica la matrícula/activación.

`ventas_drawer.jsx` todavía contiene `ActivarModal`/`CobrarModal` como compatibilidad legacy, pero en la fuente vigente no se encontró un `setModal('activar')` accesible. La remediación **no amplía** `activarEstudiante` al rol `ventas` y el guard QA falla si reaparece un trigger directo de activación.

No se elimina el código legacy en este P1 porque borrarlo sería limpieza/refactor y ampliaría innecesariamente el diff funcional.

## 4. Alcance “Ver como asesor”

Antes del cambio, el dashboard principal consultaba:

`getDashboardVentas(scopeAsesor)`

pero dos superficies descendientes ignoraban ese alcance y recibían `usuario.nombre`:

- `MiMatriculasMes`;
- `ProspectoDrawer`.

Eso podía producir una pantalla híbrida para admin/superadmin: tabla de un asesor seleccionado y calendario/drawer del supervisor.

Ambas superficies reciben ahora el mismo `scopeAsesor` utilizado por el dashboard.

Para una sesión con rol `ventas`, el backend sigue siendo autoritativo: deriva el asesor desde la sesión y sobrescribe filtros de asesor enviados por el cliente antes de aplicar controles de propiedad. El cambio frontend no confía autorización al selector.

## 5. Cambios funcionales

Solo dos archivos funcionales:

- `src/ventas_data.jsx`: +3 / -2;
- `src/ventas_dashboard.jsx`: +2 / -2.

Además:

- `scripts/qa_rel002_sales_auth.mjs`;
- `qa/rel002_sales_auth_contract.json`;
- este documento.

Un workflow temporal realizó reemplazos exactos con conteo de preimagen, ejecutó el guard, `git diff --check`, verificó que solo esos dos archivos funcionales hubieran cambiado y se eliminó inmediatamente después. El run `31982370900` concluyó `success`.

## 6. Qué queda pendiente para cerrar REL-002

La fuente queda corregida, pero no se declara cierre E2/E3 sin sesión QA real. Antes de considerar REL-002 cerrado hay que demostrar en QA:

1. una sesión `ventas` puede ejecutar sus mutaciones permitidas sin `sesion_requerida`;
2. una sesión `ventas` recibe rechazo al intentar `activarEstudiante`;
3. una sesión `ventas` no puede operar sobre un prospecto de otro asesor;
4. admin/superadmin al usar “Ver como asesor” ve el mismo alcance en dashboard, matrículas mensuales y drawer;
5. las operaciones negativas no se convierten en escrituras parciales.

No se hará ninguna escritura productiva para obtener esa evidencia.

## 7. Fuera de alcance de este P1

- cambiar el deployment Apps Script;
- ampliar roles del backend;
- redefinir quién puede aprobar becas;
- rediseñar la fuente del listado de asesores del selector;
- eliminar modales legacy;
- tocar English LAB, Memory Match o Speak LAB.

## 8. Decisión

REL-002 pasa de **SOURCE BROKEN** a **SOURCE FIXED / RUNTIME QA PENDING**.

La rama puede revisarse como PR independiente desde `main`; no necesita apilarse sobre PR #85 porque los blobs de Ventas auditados en `main` y en el head actual de #85 eran idénticos antes del parche.

**NO AUTO-MERGE · NO PROD · NO BACKEND DEPLOY.**
