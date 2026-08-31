# CS21A210AD · Contenido estudiantil · errores seguros

Fecha: 2026-08-31

## Base
- PR #239 / `fix/aplicar-pago-toeic-safe-errors-cs21a210ab`
- base exacta: `a01fae07e85d3bb604f950f4ffb71895a47d3638`
- preimagen `src/student_content_access_cs21a125.jsx`: `7f7dd0f75ff25ced26b9a9427bb284c1ed1d9f60`

## Ownership y frontera
`student_menu_academic_guard_cs21a120.js` monta `student_content_access_cs21a125.jsx` dentro del contrato académico estudiantil. El workflow histórico `validate-cs21a120.yml` también lo parsea y verifica junto al catálogo de planeamientos, proxy de libros, tareas y calendario.

Este corte **no cambia autorización**. Se congela exactamente:
- niveles acumulativos `CA/APR/CNV`;
- fallback AN0626 → B1/B2/I1;
- fallback AN0726 → B1;
- marcador demo AN0626/AN0726;
- `getAccesoContenidoEstudiante`;
- `getBibliotecaNivelEstudiante`;
- `getAudioPistaEstudiante`;
- token en body;
- `PLAN_DOCS`, preview/download de Drive;
- proxy `StudentBooksProxyCS21A126`;
- Blob/base64/mime de audio;
- `patchEnglishLab()` y su mapa mínimo de niveles.

No hay operaciones ACL en este archivo y AD no agrega ninguna.

## Hallazgo
CS21A210AC V3 midió **74 hallazgos / 21 archivos** y encontró 3 cruces raw visibles:
1. `useAccess()` → `error:e.message`;
2. `useCatalog(level)` → `error:e.message`;
3. `Audio()` → `error:e.message`.

Además `loadAccess()` almacenaba `fallback.backend_error=err.message`. Ese campo no tiene consumidores encontrados y conservaba detalle técnico dentro del estado compartido, por lo que AD lo sustituye por diagnóstico console-only sin cambiar el objeto de autorización ni los niveles permitidos.

## Corrección
- agrega `contentAccessSafeUserError(raw,fallback,context)`;
- mensajes técnicos/de infraestructura se ocultan con copy estable;
- mensajes humanos/de negocio no técnicos pueden preservarse;
- detalle original queda únicamente en consola;
- elimina exactamente los 3 sinks visibles inventariados;
- elimina el raw `backend_error` del fallback interno.

Fallbacks visibles:
- acceso: `No pudimos verificar tus niveles autorizados. Intentá nuevamente.`
- catálogo: `No pudimos cargar el contenido de este nivel. Intentá de nuevo.`
- audio: `No pudimos cargar esta pista. Intentá nuevamente.`

## QA de alta confianza
El guard AD reconstruye en memoria la preimagen completa del archivo y exige que su Git blob vuelva exactamente a `7f7dd0f75ff25ced26b9a9427bb284c1ed1d9f60` después de revertir solo las ediciones AD. Así se prueba que no se modificó accidentalmente la lógica compartida de autorización/Drive/English LAB.

Bootstrap exacto `33450942979`: **SUCCESS completo**:
- preimagen exacta PASS;
- patch AD PASS;
- instalación de `@babel/parser@7.28.4` PASS;
- parse JSX PASS;
- guard AD + reconstrucción exacta PASS;
- contrato académico `CA/APR/CNV`, planeamientos y orden del guard PASS;
- regresión CS21A210AB PASS;
- `git diff --check` PASS;
- scope funcional exacto `src/student_content_access_cs21a125.jsx` PASS.

Source temporal validado por Actions: `57ecc2b3fc4a75b3271fac81f25e3cb654a58849`.
Blob funcional validado: `565f6910d4661fffc41bf84dfbc076e21db7c030`.

La rama final se reconstruye como un único commit directo sobre #239; patcher/bootstrap quedan fuera.

## Límite
- E0: sí.
- E1 source/QA: sí una vez que el commit final y checks de PR queden verdes.
- E2 autenticado/runtime: no demostrado.
- `BACKEND CURRENT SNAPSHOT UNVERIFIED`: vigente.
- Drive ACL, Apps Script, `main` y PROD: no tocados.

**SOURCE/QA ONLY · AUTHORIZATION/DRIVE FROZEN · NO ACL · NO PROD · NO AUTO-MERGE**
