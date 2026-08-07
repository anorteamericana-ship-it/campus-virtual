# CS21A183 · Release Candidate QA exacto

## Estado al 2026-08-06

- Apollo principal: PASS de preflight curricular.
- Apollo QA staging: PASS de preflight curricular.
- `CONFIG_UNIDADES`: 64 unidades activas.
- `ACADEMIA_PLAY_BANK`: 320 ítems `GRAM_02` activos de tipo `ORDER`.
- Cinco ítems completos por unidad: PASS.
- Límite Sentence Order por sala: 3–5 oraciones.
- Fuente curricular QA: `QA_STAGING_MASTER_ID`.
- QA autenticada: **NO PASS todavía**; requiere retest limpio con FIX3.

## Defectos encontrados en QA autenticada

Sala diagnóstica `LAB-7698`:

1. el inicio de Memory Match fallaba antes de escribir `MEMORY_MATCH_STARTED` con `Cannot read properties of undefined (reading 'SETTINGS_JSON')`;
2. el docente contaba filas históricas `ACTIVE` como participantes aunque el navegador ya no estuviera presente;
3. se observó `Failed to fetch` en el frontend durante lecturas/acciones; debe seguir vigilándose en la siguiente prueba limpia.

La sala `LAB-7698` queda como evidencia diagnóstica y **no se reutiliza para el PASS final**.

## FIX3 de Memory Match

`99D_FIX_MEMORY_MATCH_START_QA_CS21A183.gs` versión `CS21A183-MM-START-FIX3`:

- no delega el inicio a wrappers históricos;
- relee la sala real y procesa etapas `QA_GUARD → AUTH → ROOM_LOOKUP → ROOM_PERMISSION → SETTINGS → RULES → PRESENCE → TEAMS → CARDS → PACKAGE → WRITE_ROOM → EVENT → RESPONSE`;
- si falla devuelve la etapa exacta;
- separa `players_registered` de `players_online`;
- presencia válida por `LAST_SEEN_AT` con TTL de 60 segundos;
- excluye jugadores stale/inactivos del contador y del inicio;
- modo `TEAMS` requiere al menos dos estudiantes presentes;
- conserva parejas editables CS21A181;
- no reemplaza `verificarActualizacionQA()` curricular;
- expone `verificarMemoryMatchStartFixCS21A183()` separado;
- falla cerrado fuera de QA/STAGING.

## Regla de instalación Apps Script

El usuario recibe **un único archivo completo**:

`apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs`

Se reemplaza todo su contenido en Apps Script. No se agregan parches manuales.

Composición interna obligatoria:

1. `99_ACTUALIZACION_QA_CS21A183.gs`
2. `99B_VALIDACION_CURRICULAR_CS21A183.gs`
3. `99C_FIX_FUENTE_APOLLO_QA_CS21A183.gs`
4. `99D_FIX_MEMORY_MATCH_START_QA_CS21A183.gs` — FIX3

El ensamblador se ejecuta cuando cambia cualquiera de esas cuatro fuentes.

## CI exacto FIX3

Head validado: `e2eb9bc6078f1daf8e63a6f0e4565a7ce286a991`.

7/7 workflows asociados al head: `success`.

- QA staging frontend CS21A148 — `31143875875`.
- CS21A177 build student sync QA package — `31143875861`.
- CS21A183 Apollo curriculum validation — `31143875835`.
- CS21A176 build final QA package — `31143875833`.
- CS21A183 Release Candidate QA — `31143875837`.
- CS21A180-CS21A183 English LAB candidate — `31143875848`.
- CS21A158 validate manual-review candidate — `31143875866`.

El Release Candidate valida explícitamente el archivo completo, FIX3, presencia TTL 60 s, navegador, sincronización, construcción exacta y smoke del paquete.

## Verificadores requeridos antes de desplegar QA

`verificarActualizacionQA()` debe mantener:

```text
ok=true
curriculum_units=64
active_gram_02_items=320
five_items_per_unit=true
curriculum_rows_complete=true
sentence_count_limits=3-5
curriculum_source=QA_STAGING_MASTER_ID
curriculum_source_fix=CS21A183-APOLLO-QA-FIX
```

`verificarMemoryMatchStartFixCS21A183()` debe reportar como mínimo:

```text
ok=true
version=CS21A183-MM-START-FIX3
memory_match_start_guard=true
direct_start_no_legacy_delegate=true
settings_undefined_safe=true
created_room_package_safe=true
presence_ttl_seconds=60
stale_players_excluded=true
start_function_installed=true
control_presence_installed=true
preserves_curriculum_verifier=true
```

## Siguiente QA limpia

1. Reemplazar todo el archivo Apps Script 99 por el archivo completo FIX3.
2. Ejecutar ambos verificadores.
3. Desplegar una nueva versión del Apps Script QA solo después de ambos verificadores verdes.
4. Crear una sala Memory Match **nueva**.
5. Entrar con dos estudiantes y mantener sus pestañas abiertas.
6. Confirmar `players_online=2`.
7. Iniciar y verificar evento `MEMORY_MATCH_STARTED`, sala `LIVE`, tablero sincronizado y equipos.
8. Cerrar una pestaña, esperar más de 60 s y confirmar que `players_online` baja sin borrar el registro histórico.
9. Vigilar `Failed to fetch`; si persiste, se trata como defecto frontend separado y no se declara PASS.

## Regla de liberación

No fusionar ni desplegar producción hasta obtener:

1. QA autenticada docente + dos estudiantes para Memory Match y Sentence Order.
2. Validación móvil.
3. Prueba progresiva 2 → 5 → 10 → 25 clientes.
4. Release PR único contra `main` con rollback documentado.
