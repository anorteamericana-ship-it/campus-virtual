# CS21A200J · Estudiante · frontera compartida de perfil con errores seguros

Fecha: 2026-08-30  
Base: PR #198 · `fix/student-portal-safe-errors-cs21a200i` @ `1f2f17c98b1309018b20ad897b6ebc05f01cc93e`

## Hallazgo

`src/primitives.jsx` publica el hook compartido `useEstudiante(codigo)`, consumido por al menos:

- Mis Notas;
- Pagos;
- Perfil.

El hook llama `getEstudiante` y ya trata la excepción/red con copy estable (`Error de conexión`). Sin embargo, cuando el backend responde JSON con `ok:false`, hacía:

`setError(d.error)`

y ese error se renderiza en las vistas consumidoras.

## Cambio

Se agrega `studentSharedProfileSafeUserError(raw, fallback, context)` únicamente en el branch `ok:false` de `useEstudiante`.

- códigos/mensajes técnicos de Apps Script/backend/HTTP/JSON/token/red se mantienen en consola;
- la UI recibe `No pudimos cargar tu información. Intentá de nuevo.` cuando el mensaje no es seguro;
- mensajes humanos de negocio pueden conservarse.

## Invariantes

No cambia:

- endpoint `getEstudiante`;
- token en body;
- transporte `postPrimitives`;
- cache de perfil de 90 segundos;
- `studentProfileCacheGet/Put`;
- reload que limpia cache;
- copy de error de conexión;
- estructura `data`;
- Notas, Pagos o Perfil;
- reglas académicas/financieras;
- Apps Script;
- Drive ACL;
- producción.

## Por qué se corrige aquí

La causa es común a varias vistas. Parchear Notas/Pagos/Perfil por separado duplicaría lógica y dejaría abierta la misma frontera para futuros consumidores.

## Límite

No cambia `student_access.jsx` ni decisiones de autorización. Ese frente continúa dependiendo de evidencia server-side fresca del Apps Script QA de Issue #111.

**DRAFT · SHARED UI ERROR BOUNDARY ONLY · NO PROD**
