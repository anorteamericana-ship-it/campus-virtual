# English LAB Memory Match - estado rapido CS21A180

Fecha de auditoria: 2026-08-05  
Alcance: QA aislado  
Produccion y `main`: sin cambios

## Veredicto del incidente

El mensaje `El backend tardo demasiado en responder` observado en docente y estudiante es una falla real del backend QA, no un problema cosmetico del navegador.

La sala observada `LAB-9682` confirma tres defectos acumulados:

1. La creacion especializada llamaba primero al creador generico como `WORD_MATCH` y despues convertia la fila a `MEMORY_MATCH`.
2. El creador escribia con el orden historico de una constante, aunque la hoja `ENGLISH_LAB_LIVE_ROOMS` tiene otro orden fisico. Por eso `READY`, la fecha y la configuracion terminaron en columnas incorrectas.
3. Cada refresco especializado ejecutaba primero el estado generico y despues repetia lecturas de sala, jugadores, respuestas y ranking. El estudiante tambien escribia `LAST_SEEN_AT` en cada polling de cuatro segundos.

El mismo recorrido generico cargaba la pregunta `Choose the best meaning of greeting`, aunque la sala era Memory Match. Cuando el estado especializado fallaba, la interfaz mostraba esa pregunta heredada.

## Correccion CS21A180

- Memory Match se crea como `MEMORY_MATCH` desde el primer registro. Ya no existe la creacion intermedia `WORD_MATCH`.
- Cada fila nueva se arma con los encabezados reales leidos de la hoja, incluyendo columnas vacias y columnas agregadas posteriormente.
- Control docente y estado estudiante ya no llaman los endpoints genericos pesados.
- Un snapshot lee una vez `PLAYERS`, una vez `ANSWERS` y una vez `EVENTS`; se comparte durante tres segundos entre docente y estudiantes.
- `LAST_SEEN_AT` se actualiza como maximo una vez cada treinta segundos por jugador.
- El acceso academico CS21A144 se mantiene y la identidad del estudiante se obtiene de la sesion autenticada.
- El frontend reconoce `memory_match:true`, no usa `questions` ni `current_question` genericos y muestra una espera propia antes de iniciar.
- El envio de pares usa la misma identidad autenticada, conserva turno e idempotencia y actualiza el snapshot compartido.

## Compatibilidad y datos existentes

No se migra ni se reescribe automaticamente ninguna fila historica. La sala `LAB-9682` puede volver a consultarse con la ruta rapida, pero fue creada con el esquema defectuoso y no sirve como prueba de aceptacion de la creacion corregida.

La aceptacion obligatoria debe hacerse con una sala nueva creada despues de instalar CS21A180.

## Validacion automatica

- Sintaxis Apps Script/V8: aprobada.
- Contratos CS21A176 de equipos, turnos e idempotencia: aprobados.
- Orden de carga CS21A177-CS21A179: aprobado.
- Mapeo sintetico contra el orden fisico observado de `ROOMS`: aprobado.
- Creacion sin llamada a `englishLabLiveCreateRoom`: aprobada.
- Control sin llamada a `englishLabLiveGetRoomControl`: aprobado.
- Estudiante sin llamada a `englishLabLiveGetPlayerState`: aprobado.
- Una lectura por tabla en cada snapshot no cacheado: aprobada.
- Preguntas genericas en respuesta Memory Match: cero.

La prueba automatica no sustituye la ejecucion autenticada contra Apps Script QA. Antes de declarar la correccion final se debe completar el registro incluido en el paquete.

## Prueba QA autenticada obligatoria

1. Reemplazar solo el contenido del archivo temporal `97_ACTUALIZACION_QA.gs` en Apps Script QA.
2. Ejecutar `verificarActualizacionQA()` y confirmar `ok:true`, `version:CS21A180`, `header_aligned:true` y `generic_questions_in_memory_state:0`.
3. Actualizar el mismo deployment QA. No usar ni editar produccion.
4. Abrir el frontend CS21A180 y conectar la misma URL `/exec` QA.
5. Crear una sala nueva Memory Match, Unidad 1, seis pares, modo Individual.
6. Hacer entrar a dos estudiantes antes de iniciar.
7. Confirmar que docente y estudiantes no muestran error, pregunta generica ni boton `Enviar respuesta`.
8. Iniciar la sala y confirmar que los tres ven el tablero compartido de inmediato.
9. Probar un par, la rotacion de turno y diez actualizaciones consecutivas en ambas vistas.
10. Registrar tiempos, primera falla observable y resultado PASS/FAIL/BLOCKED.

## Criterio de liberacion

CS21A180 es candidato QA. No autoriza fusion, despliegue productivo ni prueba con veinticinco estudiantes hasta que la prueba autenticada de dos estudiantes termine en PASS.
