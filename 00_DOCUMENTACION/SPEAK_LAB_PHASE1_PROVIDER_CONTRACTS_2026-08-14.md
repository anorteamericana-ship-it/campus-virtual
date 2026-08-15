# SPEAK LAB · Fase 1 · Contratos de proveedores de voz

Fecha: 2026-08-14  
Estado: arquitectura / sin integración productiva  
Base apilada: `feature/speak-lab-phase0` @ `9b44ccf572689d14103ace300ce06f42066faf07`

## Objetivo

Definir límites técnicos estables antes de conectar un proveedor real de voz. Esta fase evita que la UI, el currículo o la evaluación dependan directamente de un modelo/API específico.

Los cuatro contratos son:

1. `TextToSpeechProvider`
2. `SpeechToTextProvider`
3. `PronunciationEvaluator`
4. `ConversationProvider`

El código está en `prototypes/speak_lab_phase1/contracts.js`.

---

## Regla académica principal

**STT no es evaluación de pronunciación.**

El sistema debe distinguir al menos:

- qué texto entendió el reconocedor;
- qué tan inteligible fue el audio;
- cómo fueron producidos los sonidos;
- stress;
- ritmo;
- fluidez;
- entonación.

Una frase transcrita correctamente puede haber sido pronunciada de forma deficiente. Por esa razón `SpeechToTextProvider` y `PronunciationEvaluator` son contratos independientes.

---

## Regla anti-sesgo · el STT primario trabaja a ciegas

El reconocedor primario **no puede recibir la frase objetivo ni la respuesta correcta**.

El contrato rechaza explícitamente:

- `expectedText`
- `referenceText`
- `targetText`
- `answerText`
- `correctAnswer`

Motivo: entregar la respuesta esperada al STT puede sesgar la transcripción hacia el contenido que queremos encontrar y producir una métrica artificialmente optimista.

`referenceText` entra únicamente después, en `PronunciationEvaluator`.

Se permiten `vocabularyHints` limitados cuando exista una necesidad curricular real, pero no deben contener la oración completa que el alumno intenta repetir.

---

## TTS · TextToSpeechProvider

Entrada normalizada:

- `text`
- `language`
- `voiceProfile`
- `speakingRate`
- `style`
- `cachePolicy`

Salida:

- `audio: Blob`
- `mimeType`
- `syntheticVoice: true`
- `provider.provider`
- `provider.model`
- `provider.requestId`
- `cacheKey`

### Política de caché

Contenido fijo del currículo debería usar `cache-static` para evitar regenerar la misma frase en cada reproducción.

Contenido dinámico o sensible puede usar `no-store`.

La caché no se implementa todavía; esta fase solamente fija el contrato.

### Proveedor candidato actual

La API de audio de OpenAI ofrece `/v1/audio/speech`; la documentación actual incluye `gpt-4o-mini-tts`, formatos como MP3/WAV/Opus y control mediante instrucciones para ese modelo. Esto lo convierte en un candidato para la primera prueba, no en una dependencia permanente del Campus.

---

## STT · SpeechToTextProvider

Entrada:

- `audio: Blob`
- `language`
- `mode: file | streaming`
- `vocabularyHints`
- `timestamps: none | word`

Salida:

- `text`
- `language`
- `words[]`
- `noSpeechDetected`
- metadata de proveedor/modelo/request

### Proveedores candidatos actuales

La API de transcripción de OpenAI expone `/v1/audio/transcriptions` y actualmente documenta modelos como `gpt-4o-transcribe` y `gpt-4o-mini-transcribe`.

La elección final debe compararse con audio real de estudiantes costarricenses y distintos micrófonos; no se decide por marketing ni por una prueba de escritorio.

---

## PronunciationEvaluator

Este contrato sí recibe:

- audio original;
- `referenceText`;
- transcripción STT opcional;
- audio modelo opcional;
- versión de rúbrica.

Dimensiones reservadas:

- `intelligibility`
- `segmentalAccuracy`
- `wordStress`
- `rhythm`
- `fluency`
- `intonation`

Cada dimensión puede ser `null` cuando el evaluador no tenga evidencia suficiente. Es preferible decir **no medido** que inventar precisión.

### Resultado no oficial

El contrato prohíbe `officialGrade` y `finalGrade` durante la etapa de validación.

Toda salida declara:

- `calibrated: true|false`
- `official: false`
- `evaluatorVersion`
- `confidence`
- `issues[]`

La posibilidad de convertir estas dimensiones en una nota académica queda bloqueada hasta comparar resultados de IA contra profesores y acordar una rúbrica.

---

## ConversationProvider

Se reserva como contrato distinto para role plays y conversación en tiempo real.

La documentación actual de OpenAI Realtime soporta audio sobre WebRTC/WebSocket/SIP y speech-to-speech. La propia documentación indica además que la transcripción de entrada es un proceso separado/asíncrono y debe tratarse como orientación, no como una reproducción exacta de lo que el modelo oyó. Esa separación coincide con la arquitectura de SPEAK LAB.

Fase 1 **no implementa Realtime**.

---

## Seguridad · la API key nunca entra al navegador

Regla de arquitectura:

```text
Campus / navegador
        │
        │ sesión autenticada / permiso explícito
        ▼
Voice Gateway controlado
        │
        ├── TTS provider
        ├── STT provider
        ├── Pronunciation evaluator
        └── Realtime session broker (futuro)
```

Nunca:

```text
Browser → API externa usando OPENAI_API_KEY
```

El navegador no debe contener, descargar ni poder inspeccionar una clave secreta del proveedor.

El mecanismo concreto del `Voice Gateway` todavía no se selecciona.

---

## Apps Script no debe asumirse como transporte de voz

El Campus utiliza Apps Script para numerosos contratos actuales, pero eso **no significa** que deba transportar blobs de audio o sesiones Realtime.

Antes de usar Apps Script para voz habría que demostrar:

- límites de tamaño;
- latencia;
- concurrencia;
- timeouts;
- streaming;
- costo operativo;
- manejo de errores;
- seguridad de credenciales.

Para Realtime/WebRTC, la arquitectura debe considerar un servicio específico de gateway/session broker. No se forzará el audio dentro de Apps Script solamente porque ya exista.

---

## Privacidad y retención

Por defecto:

- permiso de micrófono explícito;
- indicar cuándo se está grabando;
- no almacenar audio de práctica indefinidamente;
- separar audio temporal de evidencia de evaluación;
- registrar proveedor/modelo/versión del evaluador;
- definir retención antes de habilitar persistencia;
- no activar STT silenciosamente.

La política institucional definitiva deberá definirse antes de guardar grabaciones reales de estudiantes.

---

## Flujo propuesto para Listen & Repeat

```text
1. TTS(referenceText)
       ↓
2. estudiante escucha
       ↓
3. estudiante graba
       ↓
4. calidad de captura / silencio / ruido
       ↓
5. STT(audio)   ← NO recibe referenceText
       ↓
6. PronunciationEvaluator(
       audio,
       referenceText,
       transcript
   )
       ↓
7. feedback pedagógico
       ↓
8. retry / siguiente
```

El paso 4 evita convertir un micrófono roto o silencio en una falsa nota baja.

---

## Telemetría mínima futura

Sin guardar contenido sensible innecesario, debemos poder medir:

- proveedor/modelo;
- latencia TTS;
- latencia STT;
- latencia evaluación;
- duración de audio;
- bytes procesados;
- errores;
- reintentos;
- costo estimado por operación;
- versión del contrato/evaluador.

No necesitamos enviar el texto completo o audio original a telemetría general para obtener estas métricas.

---

## Estrategia de validación

### Gate A · contratos

Mocks sin red deben demostrar:

- TTS y STT son independientes;
- STT rechaza target leakage;
- pronunciación acepta `referenceText`;
- una dimensión puede ser `null`;
- una nota oficial es rechazada;
- toda voz TTS se marca como sintética;
- audio vacío es rechazado.

### Gate B · proveedor real aislado

Luego, en un entorno QA separado:

- 10 frases de Fase 0;
- audio modelo real;
- transcripción real;
- cero score de pronunciación todavía;
- medir latencia/costo/calidad.

### Gate C · corpus humano

Construir un pequeño corpus controlado con:

- pronunciación correcta;
- errores deliberados;
- acentos legítimos;
- ruido;
- distintos dispositivos;
- estudiantes reales con consentimiento.

### Gate D · evaluador fonético

Solo cuando tengamos corpus y referencia humana se calibra `PronunciationEvaluator`.

---

## Decisiones explícitamente NO tomadas

- proveedor definitivo;
- modelo definitivo;
- voice definitiva;
- fórmula de nota;
- pesos de dimensiones;
- almacenamiento permanente;
- backend/gateway definitivo;
- integración visible con English LAB;
- uso de Realtime en producción.

Mantener estas decisiones abiertas ahora es intencional: cerrar cualquiera sin evidencia nos amarraría a una arquitectura antes de validar el problema real.

---

## Relación con trabajo paralelo de English LAB

Work está desarrollando CS21A215 en PR #85 y actualmente modifica el hub visible de English LAB.

Fase 1 no modifica:

- `src/english_lab_hub_cs21a215.jsx`;
- menú del Campus;
- `src/app.jsx`;
- loaders productivos;
- motores de juegos;
- Memory Match.

La integración visual se hará únicamente cuando exista un hub canónico estabilizado.

---

## Definition of Done · Fase 1 contratos

- contratos versionados;
- target leakage bloqueado por código;
- pruebas unitarias sin red en verde;
- documentación de seguridad y privacidad;
- ningún secreto/API key;
- ningún request externo;
- ningún score oficial;
- ningún cambio al shell de Work;
- ningún cambio a Apps Script/producción/main/Memory Match.
