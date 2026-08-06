# English LAB · validación curricular de Sentence Order CS21A183

Fecha: 2026-08-06  
Rama: `feat/cs21a183-sentence-order-live`  
Base: CS21A182

## Motivo

Ordena la oración no puede seleccionar contenido únicamente porque sea una oración válida en inglés. Cada actividad debe corresponder al nivel y a la unidad establecidos en Apollo.

La revisión directa de `APOLLO_G3_LIMPIO_21-04-26` confirmó dos fuentes canónicas:

- `CONFIG_UNIDADES`: nivel, número de unidad, `UNIT_ID`, nombre, objetivo, tema del programa, referencia de origen, dificultad y estado.
- `ACADEMIA_PLAY_BANK`: ítems jugables con nivel, unidad, template, tipo, palabras, oración correcta, explicación, alcance y estado.

## Cobertura confirmada

`CONFIG_UNIDADES` contiene:

- 16 unidades de Básico I (`B1`);
- 16 unidades de Básico II (`B2`);
- 16 unidades de Intermedio I (`I1`);
- 16 unidades de Intermedio II (`I2`);
- total requerido: 64 unidades activas.

`ACADEMIA_PLAY_BANK` contiene para Sentence Order:

- template requerido: `GRAM_02`;
- tipo requerido: `ORDER`;
- 5 ítems por unidad;
- 64 unidades × 5 ítems = 320 ítems activos requeridos.

Ejemplo verificado:

- `B1-U01`: First introductions;
- objetivo: saludos, presentación personal, deletreo y contacto inicial;
- tema: alfabeto, saludos, títulos, números, teléfono y correo;
- juego: `B1-U01-GRAM-02`;
- cinco oraciones activas, entre ellas `My name is Ana.`, `What is your name?` y `I'm a student.`.

## Hallazgo corregido

La primera versión de CS21A183 permitía seleccionar entre 3 y 8 oraciones. Apollo dispone actualmente de exactamente 5 ítems `GRAM_02` por unidad.

Por seguridad curricular, la cantidad válida queda en:

- mínimo: 3;
- máximo: 5;
- no se permite ampliar a 6–8 mediante contenido improvisado.

## Guardia frontend

Se agrega:

`src/english_lab_sentence_order_curriculum_guard_cs21a183.js`

La guardia:

1. recibe la matriz oficial mediante `englishLabSentenceOrderTeacherData`;
2. muestra nombre, objetivo y tema de la unidad seleccionada;
3. retira del selector cantidades superiores a 5;
4. captura el `GAME_ID` y los `PLAY_ITEM_ID` devueltos por `academiaPlayBankGetGame`;
5. exige que el juego sea exactamente `{LEVEL_ID}-{UNIT}-GRAM-02`;
6. exige confirmación docente de que las oraciones editadas siguen perteneciendo al tema;
7. bloquea `englishLabSentenceOrderCreateRoom` si la fuente, unidad o confirmación no coincide;
8. envía evidencia curricular al backend.

El docente conserva la posibilidad de corregir redacción o sustituir una oración, pero debe partir de la unidad real y confirmar que no salió del tema.

## Guardia backend

Se agrega:

`apps_script_patches/99B_VALIDACION_CURRICULAR_CS21A183.gs`

Debe instalarse en QA después de:

1. `97_ACTUALIZACION_QA.gs`;
2. `98_ACTUALIZACION_QA_CS21A181.gs`;
3. `99_ACTUALIZACION_QA_CS21A183.gs`;
4. `99B_VALIDACION_CURRICULAR_CS21A183.gs`.

Antes de crear una sala, valida:

- unidad activa en `CONFIG_UNIDADES`;
- correspondencia exacta entre nivel y `UNIT_ID`;
- `GAME_ID` exacto de la unidad;
- template `GRAM_02`;
- tipo `ORDER`;
- estado `ACTIVE`;
- cinco ítems completos con `WORDS_TO_ORDER` y `CORRECT_SENTENCE`;
- evidencia de `PLAY_ITEM_ID` perteneciente al juego;
- cantidad entre 3 y 5;
- confirmación docente.

La sala guarda en `SETTINGS_JSON`:

- `curriculum_verified`;
- contexto de la unidad;
- `source_game_id`;
- `source_item_ids`;
- template y tipo de ítem;
- versión de la guardia;
- confirmación docente.

`CONTENT_SOURCE` queda como:

`CONFIG_UNIDADES|ACADEMIA_PLAY_BANK|GRAM_02`

También se registra el evento:

`SENTENCE_ORDER_CURRICULUM_VERIFIED`

## Verificador Apps Script

`verificarActualizacionQA()` debe devolver:

- `version=CS21A183`;
- `curriculum_guard=true`;
- `curriculum_units=64`;
- `active_gram_02_items=320`;
- `five_items_per_unit=true`;
- `curriculum_rows_complete=true`;
- `curriculum_source_required=true`;
- `curriculum_acknowledgement_required=true`;
- `sentence_count_limits=3-5`.

El verificador falla si una unidad desaparece, si una unidad no tiene exactamente cinco ítems o si falta la oración correcta, las palabras o el identificador fuente.

## QA curricular obligatoria

Probar al menos estas unidades:

1. `B1-U01` — presentaciones y saludos.
2. `B1-U14` — actividades pasadas.
3. `B2-U10` — experiencias de vida.
4. `I1-U07` — tecnología y herramientas.
5. `I2-U15` — reglas, leyes y opiniones.

En cada prueba:

- el tema mostrado debe coincidir con Apollo;
- cargar sugerencias debe utilizar el `GAME_ID` de esa unidad;
- cambiar la unidad después de cargar debe invalidar la fuente anterior;
- crear sin confirmación debe fallar;
- crear con 6 o más oraciones debe fallar;
- editar una oración y conservar el tema debe funcionar;
- la sala debe conservar la trazabilidad curricular.

## Estado

- Código preparado en rama y PR borrador.
- No modifica `main` ni producción.
- No se instaló Apps Script QA todavía.
- GitHub Actions continúa sin asignar runner.
- QA autenticada sigue pendiente.
