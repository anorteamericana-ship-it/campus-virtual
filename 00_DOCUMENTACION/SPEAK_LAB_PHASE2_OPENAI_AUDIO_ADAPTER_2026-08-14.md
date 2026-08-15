# SPEAK LAB · Fase 2 · OpenAI Audio Provider Adapter

Fecha: 2026-08-14  
Estado: adaptador server-only + red simulada  
Proveedor: candidato OpenAI  
**No se realizaron llamadas reales al proveedor.**

## Objetivo

Implementar el primer adaptador concreto detrás de los contratos SPEAK LAB sin conectar todavía una API key real, un hosting real ni estudiantes reales.

Archivo:

`prototypes/speak_lab_phase2/openai_audio_provider.mjs`

Prueba:

`scripts/validate_speak_lab_openai_audio_provider.mjs`

---

## 1. Frontera de seguridad

Este módulo es **server-only**.

Debe ejecutarse detrás del Voice Gateway.

```text
Campus Browser
      │
      │ Voice Grant
      ▼
Voice Gateway
      │
      │ server-side provider adapter
      ▼
OpenAI Audio API
```

Nunca:

```text
Campus Browser → OpenAI API + OPENAI_API_KEY
```

El adaptador falla si detecta entorno de navegador.

La API key se obtiene únicamente desde:

`OPENAI_API_KEY`

en el entorno servidor.

No se acepta una key proveniente de payload del cliente.

---

## 2. TTS

Endpoint actual utilizado por el adaptador:

`POST /v1/audio/speech`

Defaults iniciales configurables:

- modelo: `gpt-4o-mini-tts`;
- voz: `marin`;
- formato: `mp3`.

Variables futuras:

- `SPEAK_LAB_TTS_MODEL`
- `SPEAK_LAB_TTS_VOICE`
- `SPEAK_LAB_TTS_FORMAT`

Estos valores son **candidatos técnicos**, no la voz académica definitiva.

Antes de escoger una voz final hay que comparar al menos:

- claridad;
- naturalidad;
- velocidad;
- consistencia de pronunciación;
- calidad en palabras aisladas;
- calidad en frases;
- percepción de estudiantes/docentes;
- comportamiento en inglés estadounidense objetivo del programa.

### Request TTS

Se envía:

- `model`;
- `input`;
- `voice`;
- `response_format`;
- `speed`;
- `instructions` cuando el contrato tiene estilo.

La salida conserva:

- audio binario;
- MIME;
- `syntheticVoice:true`;
- provider/model;
- request id.

---

## 3. STT

Endpoint actual utilizado:

`POST /v1/audio/transcriptions`

Default inicial configurable:

`gpt-4o-mini-transcribe`

Variable:

`SPEAK_LAB_STT_MODEL`

### Request STT

Se envía multipart:

- `file`;
- `model`;
- `language`.

### Decisión anti-sesgo

En este primer adaptador **NO se envía `prompt`**.

Tampoco convertimos `vocabularyHints` a prompt.

Motivo:

el objetivo inicial es medir qué transcribe un reconocedor sin entregarle por contexto la frase que esperamos.

Más adelante podemos hacer un experimento A/B con hints léxicos si existe una necesidad curricular concreta, pero los resultados con y sin hints deberán permanecer diferenciados.

---

## 4. Word timestamps

Aunque la API puede ofrecer opciones de timestamps en ciertos modos/modelos, este primer adaptador no los activa.

Si el caller solicita:

`timestamps:'word'`

se devuelve un error explícito:

`STT_WORD_TIMESTAMPS_NOT_IMPLEMENTED`

No se degrada silenciosamente a una transcripción sin timestamps.

---

## 5. Formatos TTS permitidos por el adaptador

- `mp3`
- `opus`
- `aac`
- `flac`
- `wav`
- `pcm`

Default inicial:

`mp3`

Para audios curriculares estáticos, MP3 es un candidato razonable por compatibilidad/tamaño. Para flujos de baja latencia podrían evaluarse otros formatos posteriormente.

---

## 6. Manejo de errores

El adaptador define errores separados para:

- API key ausente;
- ejecución en browser;
- base URL inválida;
- timeout;
- error de red;
- HTTP no exitoso;
- audio TTS vacío;
- JSON STT inválido;
- timestamps aún no implementados.

Los mensajes de error del proveedor se recortan y patrones `sk-*` se redactan antes de exponerlos al nivel superior.

El módulo no hace `console.log` de:

- audio;
- prompts;
- API keys;
- respuestas del estudiante.

---

## 7. Base URL

Default:

`https://api.openai.com/v1`

El adaptador solo acepta HTTPS y hosts:

- `api.openai.com`;
- subdominios `*.api.openai.com`.

Esto permite contemplar endpoints regionales oficiales sin abrir un SSRF hacia hosts arbitrarios.

---

## 8. Red simulada

La prueba automática inyecta `fakeFetch`.

Valida que el request que **se construiría** sea correcto, pero nunca sale del runner hacia OpenAI.

### TTS test

Comprueba:

- URL exacta;
- Authorization server-side;
- model;
- input;
- voice;
- format;
- speed;
- instructions;
- metadata de salida.

### STT test

Comprueba:

- URL exacta;
- multipart `FormData`;
- archivo real como `Blob`;
- model;
- language;
- ausencia de `prompt`;
- ausencia de expected/reference text;
- ausencia de vocabulary hints enviados silenciosamente.

### Seguridad

Comprueba además:

- key ausente → FAIL;
- ejecución simulada en browser → FAIL;
- host arbitrario → FAIL;
- error del proveedor con patrón `sk-*` → redacción;
- word timestamps no implementados → FAIL antes del request.

---

## 9. Qué todavía NO existe

- API key real;
- llamada OpenAI real;
- costo medido;
- latencia real;
- voz seleccionada académicamente;
- STT evaluado con acento costarricense;
- análisis fonético;
- Pronunciation Score;
- Realtime;
- hosting Voice Gateway;
- `issueVoiceGrant` real en Apps Script;
- integración con UI productiva.

---

## 10. Próximo gate real

Después de CI de esta fase:

1. elegir runtime/hosting del Voice Gateway;
2. configurar secretos únicamente allí;
3. ejecutar **una prueba QA controlada** de TTS con las 10 frases;
4. revisar voz/calidad/costo;
5. ejecutar STT ciego con audios controlados;
6. medir errores antes de crear cualquier feedback de pronunciación.

No se debe saltar directamente a una nota o Pronunciation Passport.

---

## 11. Realtime queda separado

Realtime no se implementa en este adaptador.

El API actual soporta sesiones de audio en tiempo real por WebRTC/WebSocket/SIP. Esa arquitectura merece un broker/session path distinto del request/response TTS/STT.

Además, la transcripción de audio de una sesión Realtime debe tratarse como una señal auxiliar y no como una representación exacta de lo que el modelo oyó.

Esto refuerza la separación original de SPEAK LAB entre conversación, STT y pronunciación.

---

## 12. Coordinación con Work

No se modifica:

- PR #85 / CS21A215;
- English LAB hub;
- `src/app.jsx`;
- menú;
- juegos;
- Memory Match;
- Apps Script;
- `main`;
- producción.
