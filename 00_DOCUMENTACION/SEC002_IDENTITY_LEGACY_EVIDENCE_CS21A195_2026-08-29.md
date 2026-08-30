# CS21A195 · SEC-002 · Evidencia histórica de identidad/título legacy

Fecha: 2026-08-29
Base exacta: CS21A194 / `234131c005e902457011e342a2c607bd7c0ce0e6`
Tipo: **CONTRACT / EVIDENCE ONLY**
Estado: **BACKEND PRIVATE DELIVERY PENDING · CURRENT ACL NOT PROVEN**

## Qué quedó demostrado

El backend acumulado histórico disponible como evidencia read-only contiene el flujo que originó los campos:

- `FOTO_CED_FRENTE`;
- `FOTO_CED_DORSO`;
- `FOTO_TITULO`.

La inscripción histórica llama `_guardarFotoProspecto` para `foto_ced_frente`, `foto_ced_dorso` y `foto_titulo`.

El propio source documenta la estructura histórica como:

`DOCUMENTOS_ESTUDIANTES/{CEDULA}/INSCRIPCION/{tipo}.jpg`

Dentro de `_guardarFotoProspecto`, el archivo se comparte con:

`DriveApp.Access.ANYONE_WITH_LINK` + `DriveApp.Permission.VIEW`

y se devuelve mediante una URL `lh3.googleusercontent.com/d/{file_id}`. El comentario histórico indica que se hacía accesible por enlace para que el dashboard pudiera mostrarlo.

Por tanto, **el origen histórico de publicación pública por enlace está demostrado**.

## Qué NO quedó demostrado

Una búsqueda de Drive por los nombres esperados de estas imágenes no localizó objetos actuales representativos. No se leyó todavía metadata de un conjunto actual de cédulas/títulos legado.

Por eso este corte deja explícitamente:

`current_object_acl = NOT_PROVEN`

No se debe afirmar que los objetos actuales siguen públicos ni que ya son privados hasta localizarlos y leer sus permisos reales.

## Consumidores activos confirmados

Los dos consumidores mapeados por CS21A174 siguen presentes:

### Ventas

`src/ventas_parts.jsx` → `vxDriveCandidates(url)` deriva:

- URL original;
- `drive.google.com/thumbnail`;
- `drive.google.com/uc?export=view`;
- `lh3.googleusercontent.com/d/...`.

### Matrículas Admin

`src/matriculas_admin.jsx` → `driveCandidates(url)` mantiene el mismo patrón de candidatos Drive/lh3.

Estos consumidores no se cambian en CS21A195.

## Separación respecto al flujo moderno

PR #118 / PROD @419 resolvió el nuevo flujo de captura de identidad/título. CS21A195 continúa refiriéndose únicamente a objetos y campos históricos `FOTO_CED_* / FOTO_TITULO`.

El monolito histórico también contiene publicaciones públicas de otras clases que luego fueron modernizadas; por tanto ese archivo no se usa como prueba del runtime actual. Aquí solo se usa como evidencia del comportamiento histórico que creó esta deuda.

## Próximo gate

Antes de migrar consumidores o tocar ACL:

1. obtener snapshot modular QA fresco de Issue #111;
2. localizar objetos representativos actuales de identidad/título legacy sin exponer PII;
3. leer permisos reales de Drive;
4. instalar el endpoint privado staff-scoped definido en CS21A174;
5. probar Sales own-scope / cross-scope, admin/superadmin y rechazo student/anonymous;
6. cambiar ambos consumidores a bytes autenticados + Blob/ObjectURL;
7. solo después probar retiro de ACL en copias QA y luego diseñar migración real.

## No cambia

- frontend runtime;
- Apps Script;
- Drive ACL;
- objetos existentes;
- datos de prospectos/estudiantes;
- producción.

**NO PROD · NO ACL CHANGE · NO CONSUMER SWITCH · NO AUTO-MERGE**
