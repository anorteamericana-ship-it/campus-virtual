# SEC-004 · Corrección de arquitectura para proyecto Apps Script multiarchivo

Fecha: 2026-08-16
Estado: **BLOCKER IDENTIFICADO · CANDIDATO COMPLETO NO INSTALABLE COMO UNIDAD**

## 1. Hallazgo nuevo

El candidato `SEC004_DEMO_READONLY_QA_CANDIDATE_2026-08-16.gs` fue construido correctamente contra el `Code.gs` canónico observado, pero su garantía global depende de que el wrapper SEC-004 sea el último `doPost` efectivo del **proyecto Apps Script completo**, no solamente el último bloque de `Code.gs`.

Issue #78 confirma que el proyecto QA actual contiene capas posteriores y separadas, incluido `99_CS21A201_ENGLISH_LAB_UNIFIED_COMPLETO.gs`.

La evidencia acumulada `99_CS21A200_ENGLISH_LAB_UNIFIED_COMPLETO.gs` (Drive ID `1SsIcNpNGnhycZnLXnbFYYWZNQJ1Jr9Tw`, SHA-256 `fb869d8915bb59ef772c0ac775a10d66291bfa78f5a3f8bc67f102c8a64e55a0`, 311.614 bytes) contiene cuatro wrappers propios:

- línea observada 544/545: `_elso183DoPostBase_ = doPost` → `doPost = function`;
- 3516/3517: `_elh191DoPostBase_ = doPost` → `doPost = function`;
- 5406/5407: `_elq198DoPostBase_ = doPost` → `doPost = function`;
- 6074/6075: `_elws200DoPostBase_ = doPost` → `doPost = function`.

Por tanto, si la capa 99 se evalúa por fuera/después del guard insertado dentro de `Code.gs`, una ruta English LAB que ese wrapper maneje puede responder sin atravesar SEC-004.

Eso invalida la frase anterior “último `doPost` de `Code.gs` = guard global”.

## 2. Confirmación con documentación oficial

Google Apps Script carga los archivos server-side del proyecto en un mismo ámbito global. La documentación V8 recomienda evitar top-level code con efectos secundarios y ordenar explícitamente archivos cuando existen dependencias. El release note de junio de 2022 aclara que las funciones de archivos separados quedan disponibles globalmente; eso no convierte una cadena de reasignaciones top-level `var base = doPost; doPost = ...` en independiente del orden.

Referencias oficiales:

- https://developers.google.com/apps-script/guides/v8-runtime
- https://developers.google.com/apps-script/release-notes

SEC-004 usa precisamente reasignaciones top-level, igual que las capas English LAB. Su posición efectiva debe verificarse a nivel de proyecto.

## 3. Diff completo verificado

Base exacta:

`Code.gs` SHA-256 `d24fc63c59e60ba92808d4d870f4eb95e35bb6f1c158a130229b187a66e35d37`

Candidato completo:

`SEC004_DEMO_READONLY_QA_CANDIDATE_2026-08-16.gs`
SHA-256 `b4775e8d615d2e59409a1b9eb1587b0f325767e4e54b7ef7384447fcbe75904f`

Verificación independiente de esta revisión:

- 6 hunks;
- +286 / -14;
- el patch completo aplicado a la base exacta reconstruye byte por byte el candidato;
- `cmp`: exact match.

El contenido de los primeros cinco hunks sigue siendo válido como endurecimiento local de `Code.gs`:

1. secreto student demo desde Script Properties;
2. validación fail-closed del secreto student;
3. portal student demo sintético antes del portal productivo;
4. secreto teacher demo desde Script Properties;
5. validación fail-closed del secreto teacher.

Aplicando solamente esos cinco hunks a la base exacta se obtiene SHA-256:

`ad3c673faacd58742b9195e44392b3a3db3eccffad1cd715dcd82fc6ac851d8b`

El sexto hunk —el wrapper global— **no debe instalarse como cola de `Code.gs` sin resolver antes el orden del proyecto**.

## 4. Arquitectura corregida

SEC-004 se divide en dos unidades:

### A. `Code.gs` · demo core

Portar únicamente los cinco hunks de:

- secretos fuera del source;
- mínimo 20 caracteres/fail-closed;
- portal student demo sintético.

No modifica English LAB ni Memory Match.

### B. guard exterior del proyecto

El bloque SEC-004 que envuelve `validarSesion`, `iniciarSesion` y `doPost` debe vivir como una unidad separada de seguridad y quedar **explícitamente después de todas las capas que redefinen `doPost`**, incluidas CS201 y cualquier capa posterior.

Nombre recomendado para QA:

`ZZ_SEC004_DEMO_READONLY_OUTER_GUARD.gs`

El prefijo es solamente una ayuda visual. La instalación debe comprobar el orden real del proyecto en el editor y no asumir que el nombre del archivo basta.

No se debe editar `99_CS21A201_ENGLISH_LAB_UNIFIED_COMPLETO.gs` para insertar el guard: esa capa contiene motores acumulados y Memory Match permanece read-only para ChatGPT.

## 5. Gate de instalación corregido

Antes de instalar SEC-004 en QA:

1. obtener backup/export del **proyecto Apps Script QA completo**, no solo `Code.gs`;
2. enumerar todos los archivos `.gs` y todas las asignaciones `doPost` efectivas;
3. portar los cinco hunks demo-core sobre el `Code.gs` QA actual, con preimágenes exactas;
4. crear el guard exterior como archivo separado;
5. colocarlo explícitamente después de todas las capas `doPost`;
6. comprobar que no existe otro wrapper posterior;
7. configurar secretos QA nuevos en Script Properties;
8. no reutilizar los secretos literales retirados;
9. no tocar Memory Match;
10. limpiar testers temporales antes de versionar;
11. actualizar únicamente el deployment QA existente, conservando su ID/URL;
12. ejecutar los smokes del apartado siguiente.

Si no puede demostrarse el punto 6, **SEC-004 continúa bloqueado**.

## 6. Smoke específico para demostrar que el guard es realmente exterior

Además de las 63 aserciones existentes, el runtime QA debe demostrar una ruta que pertenece a una capa posterior a `Code.gs`.

Ejemplo recomendado con sesión demo teacher y grupo sintético:

`englishLabWordSearchCreateRoom`

Resultado requerido:

- `ok:false`;
- `error:'demo_read_only'`;
- `version:'SEC004-DEMO-READONLY-1'`.

La importancia de esta prueba no es Word Search en sí: demuestra que una ruta interceptada por el wrapper CS200/CS201 todavía atraviesa primero el guard SEC-004 exterior.

También probar una ruta inventada y una mutación base (`recalcularNotaFinalOficial`) con el mismo resultado.

## 7. Estado corregido del PR #108

El diseño fail-closed, la allowlist estrecha, el aislamiento de scope y los secretos externos siguen siendo válidos.

Lo que cambia es la unidad de instalación:

- **NO** reemplazar backend completo;
- **NO** asumir que la cola de `Code.gs` es global;
- **SÍ** portar demo-core a `Code.gs`;
- **SÍ** instalar un guard exterior independiente después de todas las capas `doPost`;
- **SÍ** demostrarlo con una ruta de la capa CS200/CS201.

Estado: **SOURCE DESIGN CORRECTED · PROJECT ORDER/RUNTIME QA PENDING · NO MERGE · NO PROD**.
