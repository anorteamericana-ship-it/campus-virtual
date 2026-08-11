# CS21A198 · Quiz Time · Contrato curricular B1-U01

Estado: FOUNDATION / QA ONLY. No producción, no nota oficial.

## Objetivo

Construir Quiz Time sobre la fuente curricular existente del Campus, no sobre preguntas embebidas en el frontend.

Primera unidad habilitada deliberadamente: `B1-U01` (Básico I · Unidad 1).

## Trazabilidad académica

Fuente operativa: `QA_APOLLO_G3_STAGING_2026-07-19`.

Fuentes de datos:

- `DETALLE DEL PROGRAMA`
- `CONFIG_UNIDADES`
- `ACADEMIA_PLAY_BANK`
- `CONTENT_VOCAB`
- `CONTENT_GRAMMAR`
- `CONTENT_PHRASES`
- `CONTENT_LISTENING`
- `CONTENT_READING`

Referencia curricular de Apollo:

- Nivel: Básico I
- Unidad: UNIT 01
- Título: `What's your name?`
- Lecciones: 01 y 02
- Student Book: páginas 2–7
- Workbook: páginas 1–4
- Teacher Book: T-2–T-7
- Tema general: alfabeto; saludos y despedidas; nombres y títulos de cortesía; números 0–10; números de teléfono y direcciones de correo electrónico.
- Objetivo general: al finalizar la unidad, el estudiante puede presentarse, intercambiar saludos formales e informales, pedir y dar información personal básica y deletrear nombres.
- Speaking: presentarse y presentar a otras personas; saludar/despedirse; preguntar por nombres y números de teléfono.
- Grammar: `be`; afirmativas y contracciones; posesivos `my`, `your`, `his`, `her`.
- Pronunciation/Listening: sonidos enlazados; deletreo de nombres; números de teléfono y correos.
- Writing/Reading: nombres, números de teléfono y direcciones de correo electrónico.

La ficha INA de reacreditación vigente identifica el servicio `2519-M-27105 NIVEL BÁSICO I`, 128 horas, presencialidad remota y cupo máximo 15. El juego es práctica formativa del Campus y no sustituye una evaluación oficial.

## Banco existente B1-U01

`ACADEMIA_PLAY_BANK` contiene 60 filas activas para B1-U01. Para Quiz Time no se usarán las 60 directamente.

Plantillas canónicas iniciales:

| Área | Template | Tipo | Ítems fuente |
|---|---|---|---:|
| Vocabulary | `VOCAB_01` | MCQ | 5 |
| Grammar | `GRAM_01` | MCQ | 5 |
| Communication | `SPEAK_02` | MCQ | 5 |
| Listening | `LISTEN_01` | DIALOGUE_MCQ | 5 |
| Reading | `READ_01` | READING_MCQ | 5 |

Total canónico: **25 preguntas**, todas con `SOURCE_ITEM_ID` distinto dentro de su fuente primaria.

Quedan fuera del pool inicial:

- `VOCAB_02` MATCH
- `GRAM_02` ORDER
- `SPEAK_01` ORDER
- `LISTEN_02` MATCH
- `READ_02` por duplicar la misma fuente de `READ_01`
- `MIX_01` y `MIX_02` por reutilizar fuentes ya presentes en áreas primarias

Esto evita que una misma evidencia curricular aparezca dos veces disfrazada de preguntas diferentes.

## Composición de una partida

Primera versión:

- 10 preguntas por ronda.
- 2 Vocabulary.
- 2 Grammar.
- 2 Communication/Speaking.
- 2 Listening.
- 2 Reading.
- Sin repetición de `SOURCE_ITEM_ID` dentro de la misma ronda.
- Orden final mezclado con semilla de sala para que docente y estudiantes compartan exactamente la misma secuencia.
- La selección final queda congelada al crear la sala.

## Contrato de seguridad

La respuesta correcta **no puede existir en el estado público previo a responder**.

El backend conserva:

- `CORRECT_OPTION`
- `EXPLANATION_ES`
- source row completa

El cliente recibe antes de responder únicamente:

- `question_id`
- `source_item_id`
- `area_id`
- `prompt_es`
- `prompt_en`
- `stem`
- `options`
- `mini_text_or_dialogue` cuando aplique
- `difficulty`
- metadata de unidad/objetivo

Tras cerrar la pregunta, el servidor puede publicar una explicación pedagógica y la opción correcta como parte del estado de reveal.

## Invariantes Quiz Time

1. El servidor es autoritativo para pregunta actual, respuesta correcta, puntos, deadline y avance.
2. Una respuesta por estudiante por pregunta y `action_id` idempotente.
3. La misma `question_id` debe ser visible simultáneamente para docente y estudiantes.
4. No se puede responder una pregunta cerrada o una pregunta distinta a la activa.
5. La respuesta correcta no viaja al navegador antes del cierre/reveal.
6. La ronda conserva evidencia curricular: nivel, unidad, `SOURCE_ITEM_ID`, template y área.
7. El juego no genera nota oficial en esta fase.
8. B1-U01 es la única unidad habilitada en el primer gate autenticado.

## Expansión

El esquema se diseñará para `B1-U01` → `B1-U02...U16` → `B2` → `I1` → `I2` sin cambiar el motor.

Aunque el banco actual ya contiene semillas para 64 unidades, ninguna unidad adicional se considera aprobada para Quiz Time hasta pasar revisión curricular y QA específica.

## Diseño visual

La lámina de referencia de juegos NO define el aspecto visual de Quiz Time.

Dirección: producto educativo premium del Campus, legible en proyector y móvil, con jerarquía fuerte, respuesta táctil clara, transición de pregunta elegante, progreso curricular visible y sin estética de plantilla genérica de trivia.
