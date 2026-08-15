# SPEAK LAB · Voice Gateway Protocol

Fecha: 2026-08-14  
Estado: protocolo + mock local; **sin proveedor real**  
Base: Fase 1 contratos (`db8eb389ae80d9f52536b7eba051906337b0a9a3`)

## 1. Problema que resuelve

El Campus actual es principalmente frontend estático y usa Apps Script como backend operativo. El navegador ya obtiene un token de sesión y lo envía a Apps Script para autorización.

Eso no vuelve automáticamente confiable ese token para un servidor nuevo: un Voice Gateway fuera de Apps Script no sabe verificar por sí solo la sesión existente.

Tampoco es aceptable poner una API key de OpenAI u otro proveedor dentro del navegador.

Por eso se define una frontera nueva:

```text
Campus Browser
   │
   │ 1. sesión Campus existente
   ▼
Campus Auth / Apps Script
   │
   │ 2. Voice Grant corto y limitado
   ▼
Browser
   │
   │ 3. Voice Grant (NO provider key)
   ▼
Voice Gateway
   │
   ├── TTS provider
   ├── STT provider
   ├── Pronunciation evaluator
   └── Realtime broker (futuro)
```

En este PR solamente se implementa el protocolo y un mock local. **No se modifica Apps Script.**

---

## 2. Voice Grant

Un Voice Grant es una autorización de vida corta emitida después de validar la sesión normal del Campus.

Claims mínimos:

- `iss = campus-auth`
- `aud = speak-lab-voice-gateway`
- `sub = sl_<id opaco>`
- `role`
- `scopes[]`
- `iat`
- `exp`
- `jti`

TTL máximo inicial: **600 segundos**.

### No contiene PII directa

El protocolo rechaza:

- nombre;
- correo;
- cédula;
- teléfono;
- variantes equivalentes.

El `sub` debe ser opaco. El gateway necesita controlar autorización, cuota y abuso; no necesita conocer el nombre del estudiante para procesar una frase.

### Scopes separados

- `tts:read`
- `stt:write`
- `pronunciation:write`
- `realtime:connect`

Un grant de TTS no autoriza STT y viceversa.

---

## 3. Cómo se emitiría el grant en el Campus real

Futuro flujo previsto:

1. El navegador mantiene la sesión Campus actual.
2. Solicita a Campus Auth un grant para el scope requerido.
3. Campus Auth valida rol/estado/permisos.
4. Emite un token firmado de corta duración con sujeto opaco.
5. El navegador presenta ese grant al Voice Gateway.
6. Voice Gateway verifica firma, expiración, audience y scope.

### Decisión pendiente

No se implementa todavía `issueVoiceGrant` en Apps Script.

Antes debemos elegir el hosting real del gateway y definir cómo compartir/verificar firma de forma segura.

No se agregará un secreto a GitHub ni al frontend.

---

## 4. Endpoints del protocolo mock

### `GET /health`

Diagnóstico de servicio.

### `POST /v1/tts`

Requiere scope:

`tts:read`

Body JSON normalizado:

- texto;
- idioma;
- perfil de voz;
- speaking rate;
- style;
- cache policy.

El mock devuelve un WAV silencioso con headers inequívocos:

- provider `mock-gateway`;
- model `MOCK_SILENCE_NOT_SPEECH`;
- `X-SpeakLab-Mock: true`.

Esto valida transporte binario sin fingir que existe TTS real.

### `POST /v1/stt`

Requiere scope:

`stt:write`

Body:

audio binario.

Metadata permitida:

- idioma;
- duración;
- MIME;
- vocabulary hints controlados.

El mock devuelve:

`[MOCK_STT_NO_RECOGNITION]`

con `mock:true`.

No es transcripción real.

---

## 5. Regla anti-target-leakage

El STT primario debe trabajar a ciegas.

No acepta:

- `expectedText`
- `referenceText`
- `targetText`
- `answerText`
- `correctAnswer`

El mock los rechaza también si llegan como headers o query params.

### Vocabulary hints

Se encontró un caso límite: usar `vocabularyHints` para introducir toda la frase objetivo sería otra forma de filtrar la respuesta.

Por eso en este protocolo inicial cada hint debe ser **un lexema individual**, no una frase.

Ejemplos válidos:

- `name`
- `Thursday`
- `schedule`

Ejemplos rechazados:

- `What's your name`
- `I live in Costa Rica`

La política puede evolucionar cuando tengamos evidencia, pero no se abrirá una puerta de sesgo por comodidad.

---

## 6. Límites iniciales

- Voice Grant: 600 s máximo.
- Audio: 2.5 MB máximo.
- Duración declarada: 30 s máximo para este flujo de práctica corta.
- TTS: 4096 caracteres máximo.
- Vocabulary hints: máximo 32 lexemas.

Estos límites **no son todavía límites comerciales definitivos**; son guardrails del protocolo inicial.

El servidor real deberá verificar duración/tamaño por evidencia del archivo y no confiar únicamente en metadata declarada por el cliente.

---

## 7. Claves del proveedor

Nunca:

```text
Browser → api.openai.com + OPENAI_API_KEY
```

El cliente `VoiceGatewayClient` rechaza directamente usar `api.openai.com` como URL del gateway y también rechaza un token con formato de API key como si fuera Voice Grant.

En producción:

```text
Browser → Voice Gateway
Voice Gateway → provider
```

La clave del proveedor vive únicamente en variables/secret store del entorno servidor.

---

## 8. Logs

El mock registra únicamente:

- método;
- ruta;
- request id;
- subject opaco;
- scope;
- bytes.

No registra:

- audio;
- frase TTS;
- transcripción;
- nombre;
- correo;
- cédula.

En producción habrá que definir políticas específicas de auditoría y retención, pero el principio por defecto es **minimización**.

---

## 9. Qué NO demuestra el mock

No demuestra:

- calidad TTS;
- calidad STT;
- pronunciación;
- latencia de proveedor;
- costos;
- escalabilidad;
- CORS final;
- hosting final;
- integración Apps Script;
- sesiones Realtime;
- persistencia.

Demuestra únicamente que podemos diseñar una frontera de seguridad y transporte antes de entregar secretos o audio a un proveedor.

---

## 10. QA adversarial

`scripts/validate_speak_lab_gateway_protocol.mjs` debe verificar:

- grant válido;
- PII rechazada;
- TTL excesivo rechazado;
- scope equivocado rechazado;
- grant expirado rechazado;
- target leakage por campo rechazado;
- target leakage por header rechazado;
- target leakage por query rechazado;
- target completo dentro de hints rechazado;
- audio sobredimensionado rechazado;
- URL directa a proveedor rechazada;
- API key disfrazada de grant rechazada;
- TTS mock claramente marcado;
- STT mock claramente marcado;
- cero llamadas a proveedor externo.

---

## 11. Próxima decisión real

Cuando este protocolo quede verde, el siguiente paso NO es pegar una API key en el frontend.

Hay dos trabajos separados:

### A. Resolver hosting del Voice Gateway

Necesitamos un runtime servidor con:

- HTTPS;
- variables secretas;
- límites y rate limiting;
- streaming futuro;
- observabilidad;
- capacidad de WebRTC/WebSocket o broker para Realtime.

### B. Conectar un proveedor en entorno aislado

Primero TTS/STT con las 10 frases del piloto.

Todavía sin score fonético oficial.

---

## 12. Coordinación con Work

Work está modificando el hub de English LAB en PR #85 / CS21A215.

Este protocolo no modifica:

- hub English LAB;
- `src/app.jsx`;
- menú;
- loaders;
- juegos;
- Memory Match;
- Apps Script;
- producción.

La futura superficie visible se integrará únicamente contra el hub que resulte canónico.
