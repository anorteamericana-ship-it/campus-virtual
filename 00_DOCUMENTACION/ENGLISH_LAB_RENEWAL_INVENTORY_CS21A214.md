# English LAB · Inventario canónico y contrato de no pérdida · CS21A214

Fecha: 2026-08-14  
Estado: **INVENTARIO / QA GUARD · SIN CAMBIOS DE PRODUCTO**  
Base segura verificada: `release/english-lab-final-qa` @ `6379739f502c820e52d32f2ebae84c20c4ae078c`  
Producción verificada: `main` @ `67108928e953fbf044dbcd916dc34a5dd5f1e570`

## 1. Objetivo

Antes de renovar la experiencia de English LAB se congela un inventario canónico para impedir que una refactorización visual o arquitectónica borre silenciosamente juegos, rutas, identidades curriculares o contenido ya construido.

Este corte **no cambia UI, CSS, motores, endpoints, Apps Script, deployment, main ni producción**. Sólo añade documentación y un gate estático de preservación.

## 2. Superficies que deben sobrevivir a la renovación

### 2.1 Juegos gratuitos existentes en Academia Play

Deben conservarse como mínimo:

1. `vocabulary` · Vocabulary Sprint
2. `word_match` · Word Match
3. `daily` · Daily Challenge
4. `phrase_builder` · Phrase Builder
5. `survival_english` · Survival English

El acceso del prospecto/usuario gratis sigue pasando por `AcademiaPlayView`. La renovación podrá cambiar la presentación, pero no debe borrar esta puerta de entrada ni convertirla en una dependencia del shell Live.

### 2.2 Catálogo curricular por unidad

El frontend conserva doce templates canónicos por unidad:

| Template | Juego |
|---|---|
| `VOCAB_01` | Vocabulary Sprint |
| `VOCAB_02` | Word Match |
| `GRAM_01` | Grammar Fix |
| `GRAM_02` | Sentence Order |
| `SPEAK_01` | Phrase Builder |
| `SPEAK_02` | Response Builder |
| `LISTEN_01` | Listening Choice |
| `LISTEN_02` | Listen & Match |
| `READ_01` | Reading Flash |
| `READ_02` | Detail Hunter |
| `MIX_01` | Mini Challenge |
| `MIX_02` | Survival Mission |

Niveles canónicos: `B1`, `B2`, `I1`, `I2`.  
Cada nivel conserva 16 unidades `U01`–`U16`.

El sistema debe preservar:

- `academiaPlayBankCatalog`;
- conversión de registros del banco a tarjetas;
- adaptadores `MATCH → match`, `ORDER → order` y fallback `choice`;
- identidad `GAME_ID`, `UNIT_ID`, `PLAY_ITEM_ID`;
- mapa/progreso por unidad;
- práctica formativa separada de la nota oficial.

### 2.3 Evidencia operativa del banco QA Apollo

Auditoría read-only ejecutada el 2026-08-14 sobre `QA_APOLLO_G3_STAGING_2026-07-19`, hoja `ACADEMIA_PLAY_BANK`:

- filas jugables encontradas: **3.840**;
- Básico I: **960**;
- Básico II: **960**;
- Intermedio I: **960**;
- Intermedio II: **960**;
- `B1-U01`: **60** actividades = 12 juegos × 5 ítems;
- `I2-U16`: **60** actividades = 12 juegos × 5 ítems.

Equivalencia esperada del banco actual:

`4 niveles × 16 unidades × 12 juegos × 5 ítems = 3.840 actividades`.

Este conteo es **evidencia operacional**, no se hardcodea como condición estática de GitHub: el contenido vive fuera del repo y su auditoría de datos debe mantenerse separada del guard de código.

## 3. Juegos Live existentes

El shell Live actual debe conservar los cinco IDs/motores existentes:

1. `MEMORY_MATCH` · Memory Match
2. `SENTENCE_ORDER` · Sentence Order
3. `HANGMAN` · Hangman
4. `QUIZ_TIME` · Quiz Time
5. `WORD_SEARCH` · Word Search

CS21A214 no modifica ninguno.

### Memory Match

Memory compartido permanece **read-only para ChatGPT** según Issue #78. La renovación general no debe borrar su código ni apropiarse de su implementación. Su modalidad compartida puede mantenerse en cuarentena mientras se decide una arquitectura realtime adecuada.

## 4. Arquitectura objetivo preservada para la renovación

La siguiente etapa debe unificar la experiencia sin obligar a todos los juegos a usar la misma arquitectura.

### A. Practicar & Competir · local-first

El juego corre localmente durante la partida; el servidor recibe inicio/resultado o checkpoints acotados, no cada gesto visual.

Ideas preservadas:

- Vocabulary Sprint · carrera individual;
- Word Match · precisión + tiempo;
- Daily Challenge · reto diario;
- Grammar Fix / Grammar Challenge;
- Sentence Order → **Sentence Race**;
- Phrase Builder;
- Response Builder;
- Listening Choice;
- Listen & Match;
- Reading Flash;
- Detail Hunter;
- Mini Challenge;
- Survival Mission;
- Word Search → **Word Search Race**;
- Memory visual → **Memory Sprint** local con misma seed/tablero, ranking por tiempo + intentos;
- Word Scramble Race;
- Dictation Sprint.

Podio sugerido para carreras:

1. cumplimiento/correctas;
2. menor tiempo;
3. desempate por intentos/errores según el juego.

### B. Equipos

Dinámicas donde el tiempo real humano puede ocurrir por la clase/Zoom y el Campus maneja ronda, puntaje y resultado:

- Hangman Teams;
- Taboo / Describe the Word;
- Categories Battle;
- Vocabulary Bingo;
- Conversation Cards / speaking;
- Quiz Time por equipos.

### C. Clase en vivo

Round-based, tolerante a latencia moderada y dirigida por docente:

- Quiz Time;
- Hangman;
- Bingo;
- retos por equipos;
- futuras actividades de classroom response.

Los juegos que exijan que un gesto de un navegador aparezca inmediatamente en todos los demás (`Memory Match` compartido, buzzer, tablero colaborativo, drag/drop compartido) deben tratarse como una familia realtime separada y no forzarse sobre polling lento.

## 5. Juegos reservados / no presentar como terminados

Siguen existiendo ideas o slots históricos que no deben sobredeclararse:

- Conversation Cards · reservado / futura experiencia speaking;
- Pronunciation Lab · reservado hasta definir audio/voz y permisos;
- Spin & Learn · no está incluido en el release candidate actual;
- Crossword · no está incluido en el release candidate actual.

No borrar referencias útiles, pero tampoco presentarlas como motores Live terminados.

## 6. Contrato automatizado CS21A214

Script:

`scripts/qa_english_lab_preservation_gate_cs21a214.mjs`

Debe fallar si desaparece cualquiera de estas invariantes estáticas:

- cinco juegos gratis;
- doce templates por unidad;
- cuatro niveles;
- constructor de 16 unidades;
- endpoint/catálogo del banco;
- adaptadores `match/order/choice`;
- IDs curriculares;
- progreso por unidad;
- cinco juegos Live;
- routing gratis → Academia Play;
- routing matriculado → English LAB Live;
- lazy loaders de ambas superficies.

Workflow:

`.github/workflows/qa-cs21a214-english-lab-preservation.yml`

Además restringe el diff de este corte a documentación + script + workflow. Cualquier modificación de `src/`, estilos, Apps Script u otro producto debe fallar el scope de CS21A214.

## 7. Orden de renovación después de este gate

1. **CS21A214 · inventario/no-loss** — este corte.
2. Nuevo shell único de English LAB que reúna **Por unidad / Competir / Clase en vivo**, reutilizando componentes existentes.
3. Sentence Order → Sentence Race y Word Search → Word Search Race como primeras pruebas local-first.
4. Memory Sprint local reutilizando el motor visual sin polling por cada carta.
5. Reforzar Quiz Time + Hangman Teams.
6. Agregar Taboo, Categories Battle y Vocabulary Bingo.
7. Sólo después evaluar transporte realtime para experiencias que realmente lo necesiten.

Cada fase debe ser rama/PR/CI pequeña, reversible y sin merge/producción automáticos.

## 8. No tocado por CS21A214

- `main`;
- producción;
- Apps Script QA/productivo;
- deployments;
- Memory Match producto;
- Sentence Order producto;
- Hangman producto;
- Quiz Time producto;
- Word Search producto;
- `src/academia_play.jsx`;
- `src/app.jsx`;
- shell CS205;
- banco curricular externo.
