# English LAB Live · Ordena la oración · CS21A183

Fecha: 2026-08-06  
Rama: `feat/cs21a183-sentence-order-live`  
Base: CS21A182 (`fix/cs21a182-english-lab-visual-cleanup`)

## Objetivo

Agregar un segundo juego Live real sin crear otro sistema de salas. **Ordena la oración** reutiliza:

- grupos y permisos docentes;
- código de sala;
- acceso estudiantil de English LAB;
- tablas de salas, participantes, respuestas y eventos;
- polling ligero;
- ranking individual y por equipos;
- cierre de sala y resultados temporales.

No genera notas oficiales ni afecta pagos, certificados o aprobación académica.

## Fuente pedagógica

Las sugerencias no se inventan en el frontend. La consola docente consulta:

1. `academiaPlayBankCatalog`;
2. juego del nivel y unidad con `TEMPLATE_ID = GRAM_02`;
3. `academiaPlayBankGetGame`;
4. campos `CORRECT_SENTENCE`, `PROMPT_ES` y `EXPLANATION_ES`.

El docente recibe una oración por línea y puede corregir, sustituir o reescribir el contenido antes de crear la sala.

## Flujo docente

1. Abrir `English LAB Live`.
2. Seleccionar `Preparar juego` en la tarjeta **Ordena la oración**.
3. Elegir grupo, unidad, modo y cantidad de oraciones.
4. Pulsar `Cargar sugerencias`.
5. Revisar el editor.
6. Crear la sala.
7. Copiar código o mensaje.
8. Iniciar la actividad cuando los estudiantes hayan ingresado.
9. Avanzar con `Siguiente oración`.
10. Cerrar la sala y revisar el ranking.

### Validaciones docentes

- entre 3 y 10 oraciones por sala;
- exactamente la cantidad seleccionada;
- una oración por línea;
- entre 3 y 18 palabras por oración;
- no se aceptan oraciones duplicadas;
- el banco puede sugerir contenido, pero nunca sobrescribe una edición durante la creación.

## Flujo estudiante

1. Ingresar por el código habitual de English LAB Live.
2. El backend detecta que la sala usa `SENTENCE_ORDER`.
3. La vista genérica se sustituye por el tablero especializado.
4. El estudiante toca cada palabra para construir la oración.
5. Puede retirar palabras o reiniciar.
6. Solo puede enviar cuando utilizó todos los tokens exactamente una vez.
7. Recibe confirmación, puntaje y la respuesta correcta.
8. Espera la siguiente oración mientras el ranking se actualiza.

## Regla de ronda

Todos los participantes pueden responder simultáneamente una vez por oración. Esto evita convertir el juego de gramática en una espera larga por turnos.

- respuesta correcta: suma puntos con bonificación de rapidez;
- respuesta incorrecta: queda registrada con cero puntos;
- duplicado: no crea una segunda respuesta;
- el docente controla cuándo avanzar;
- el ranking continúa siendo temporal y de práctica.

En modo equipos, se reutilizan los equipos y la agregación de puntos de English LAB Live.

## Backend QA

Archivo:

`apps_script_patches/99_ACTUALIZACION_QA_CS21A183.gs`

Debe instalarse **después** de:

1. `97_ACTUALIZACION_QA.gs`;
2. `98_ACTUALIZACION_QA_CS21A181.gs`.

Endpoints nuevos:

- `englishLabSentenceOrderTeacherData`
- `englishLabSentenceOrderCreateRoom`
- `englishLabSentenceOrderStartRoom`
- `englishLabSentenceOrderNextSentence`
- `englishLabSentenceOrderGetRoomControl`
- `englishLabSentenceOrderJoinRoom`
- `englishLabSentenceOrderGetPlayerState`
- `englishLabSentenceOrderSubmit`
- `englishLabSentenceOrderCloseRoom`

El wrapper de `doPost` también enruta automáticamente:

- `englishLabLiveJoinRoom` cuando el código corresponde a Sentence Order;
- `englishLabLiveGetPlayerState` cuando la sala corresponde a Sentence Order.

## Frontend

Archivo:

`src/english_lab_sentence_order_cs21a183.js`

La capa:

- envuelve `EnglishLabLiveTeacherView` y agrega la consola especializada;
- envuelve `EnglishLabLiveStudentView` y cambia al tablero especializado después del ingreso;
- filtra las salas Sentence Order de la lista genérica para evitar controles incompatibles;
- no modifica directamente `src/english_lab_live.jsx`;
- se carga después de CS21A181 y CS21A182.

## Datos almacenados

### Sala

- `GAME_CODE = SENTENCE_ORDER`
- `GAME_LABEL = Ordena la oracion`
- cantidad real de oraciones;
- nivel, unidad, grupo y modo;
- oraciones validadas dentro de `SETTINGS_JSON`.

### Ronda pública

- identificador de oración;
- índice y total;
- instrucción y pista;
- tokens desordenados con identificadores únicos;
- nunca expone el orden correcto antes de que el estudiante responda.

### Respuesta

Se guarda en la tabla Live existente:

- estudiante;
- índice de oración;
- orden de tokens enviado;
- palabras ordenadas;
- resultado correcto/incorrecto;
- puntos;
- tiempo;
- fecha.

## Seguridad

- autorización docente por grupo;
- acceso estudiantil mediante la regla vigente de English LAB;
- una respuesta por estudiante y oración;
- cada token debe usarse exactamente una vez;
- validación del orden en backend;
- bloqueo de escritura con `LockService`;
- sin excepciones por usuario;
- sin datos ficticios;
- sin cambios en producción.

## Verificador Apps Script

Después de agregar el archivo 99, ejecutar:

`verificarActualizacionQA()`

Debe devolver:

- `ok = true`
- `version = CS21A183`
- `previous_version = CS21A181`
- `sentence_order_live_supported = true`
- `editable_sentences_supported = true`
- `simultaneous_answers_supported = true`

## QA autenticada requerida

### Docente

- cargar sugerencias B1/U01;
- editar al menos una oración;
- comprobar rechazo por cantidad incorrecta;
- crear sala individual;
- copiar código;
- iniciar;
- avanzar por todas las oraciones;
- cerrar sala;
- comprobar ranking y respuestas.

### Estudiantes

- ingresar con dos perfiles reales de QA;
- comprobar que ambos reciben los mismos tokens;
- enviar una respuesta correcta y otra incorrecta;
- impedir segundo envío en la misma oración;
- actualizar ranking;
- recibir la siguiente oración sin salir de la sala;
- comprobar resultado final.

### Equipos

- crear una segunda sala en modo equipos;
- ingresar al menos cuatro perfiles;
- confirmar equipos balanceados;
- comprobar agregación de puntos.

### Móvil

- revisar docente y estudiante a 390 px;
- confirmar que las palabras conservan tamaño táctil;
- confirmar que botones y ranking no desbordan.

## Estado de entrega

Código candidato únicamente. No fusionar, desplegar ni presentar como funcional hasta obtener:

1. pruebas estáticas verdes;
2. verificador Apps Script CS21A183 en QA;
3. prueba autenticada docente/estudiante;
4. prueba individual y equipos;
5. revisión móvil.
