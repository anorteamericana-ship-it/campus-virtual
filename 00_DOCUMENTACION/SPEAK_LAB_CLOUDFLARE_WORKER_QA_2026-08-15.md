# SPEAK LAB · Cloudflare Worker QA · 2026-08-15

Estado: **runtime offline preparado; sin deploy, sin cuenta Cloudflare vinculada al agente, sin secretos reales y sin tráfico real a OpenAI.**

Tracks: #95, #96.  
Base del corte: #93 · `644031f0a81ef043c7bbf841cef1fa4f8329e6e1`.

## 1. Objetivo

Preparar el primer runtime realista del Voice Gateway para Cloudflare Workers sin depender todavía de acceso OAuth/MCP a la cuenta institucional.

Este corte traduce los contratos ya validados de #91 y el adaptador server-only de #93 a un handler compatible con Web APIs de Workers.

No crea infraestructura remota.

## 2. Archivos del corte

- `prototypes/speak_lab_phase2/cloudflare_voice_worker.mjs`
- `prototypes/speak_lab_phase2/wrangler.qa.template.jsonc`
- `scripts/validate_speak_lab_cloudflare_worker.mjs`
- `.github/workflows/validate-speak-lab-cloudflare-worker.yml`
- `.gitignore`

## 3. Endpoints preservados

- `GET /health`
- `POST /v1/tts`
- `POST /v1/stt`

`/v1/pronunciation*` y `/v1/realtime*` siguen devolviendo 501 en este corte.

No se altera el contrato visible del `VoiceGatewayClient`.

## 4. Voice Grant en Workers

El mock Node de #91 usaba `node:crypto` exclusivamente para pruebas locales.

El Worker nuevo no reutiliza esa dependencia Node. Verifica el mismo formato HMAC con `crypto.subtle` / Web Crypto:

- issuer `campus-auth`;
- audience `speak-lab-voice-gateway`;
- subject opaco `sl_*`;
- scopes;
- TTL máximo 600 s;
- sin PII directa.

El secreto esperado es `VOICE_GRANT_SIGNING_SECRET`, únicamente como secret del entorno Cloudflare.

Apps Script NO se modifica en este corte para emitir grants reales.

## 5. TTS

Flujo:

```text
Browser
  -> Voice Grant tts:read
  -> Cloudflare Worker
  -> rate limit por sub opaco + scope
  -> validateGatewayTtsEnvelope
  -> OpenAIAudioProvider (#93)
  -> OpenAI Audio futuro
```

En QA offline `fetch` del proveedor se reemplaza por fake network.

La salida mantiene:

- MIME de audio;
- provider/model;
- request id del gateway;
- `syntheticVoice=true` explícito.

La API key nunca entra al navegador ni al envelope.

## 6. STT

El STT permanece ciego respecto a la respuesta esperada.

Se rechaza target leakage por:

- campos prohibidos en contrato;
- headers `X-SpeakLab-*Text` prohibidos;
- query params equivalentes;
- vocabulary hints que sean frases completas.

Límites heredados:

- audio <= 2.5 MB;
- duración declarada <= 30 s;
- MIME permitido por protocolo;
- máximo 32 hints, cada uno lexema individual.

El Worker NO convierte vocabulary hints en `prompt` de OpenAI.

## 7. CORS

`ALLOWED_ORIGINS` es una allowlist exacta separada por comas.

Reglas:

- request sin `Origin`: permitida para tráfico server/same-path controlado;
- request con `Origin`: debe coincidir exactamente con allowlist;
- origen ajeno: 403 antes de proveedor;
- preflight: solo headers del protocolo conocidos.

No se usa `*`.

## 8. Rate limiting

El runtime espera binding `VOICE_RATE_LIMITER` y falla cerrado con 503 si falta en una ruta protegida.

La clave inicial es:

`<sub opaco>:<scope>`

No se usa IP como identidad principal ni PII.

El template propone provisionalmente 30 operaciones / 60 s por clave para QA. Esa cifra es un guard técnico, no una política comercial definitiva.

Cloudflare documenta que su Rate Limiting binding es permisivo/eventualmente consistente y local por ubicación; por eso no se usa como sistema de cobro o contabilidad exacta.

## 9. Secrets

Secrets requeridos en QA:

- `OPENAI_API_KEY`
- `VOICE_GRANT_SIGNING_SECRET`

No se guardan valores en:

- GitHub;
- `wrangler.qa.template.jsonc`;
- browser;
- Apps Script;
- documentación.

`.gitignore` bloquea `.dev.vars*`, `.env*` y `.wrangler/`.

El template Wrangler declara nombres de secrets requeridos, no valores.

## 10. Wrangler QA template

El archivo se deja intencionalmente NO desplegable hasta reemplazar:

- `__SET_EXACT_QA_ORIGIN__`
- `__SET_UNIQUE_POSITIVE_INTEGER_NAMESPACE_ID__`

El entorno `qa` debe desplegarse como Worker separado del futuro entorno productivo.

No contiene:

- account id;
- database id;
- R2 bucket;
- D1 binding;
- dominio real;
- token de Cloudflare;
- secret real.

## 11. D1 y R2

No son necesarios para el primer Voice Gateway.

Decisión explícita:

- no persistir audio del piloto inicial;
- no persistir transcript en Cloudflare por defecto;
- no introducir D1/R2 solo porque estén disponibles;
- no sustituir Apollo G3 / Google Sheets / CONAPE en este corte.

La modernización del Campus general deberá usar espejo, comparación, rollback y paridad antes de cambiar cualquier fuente oficial.

## 12. Logging

El handler registra únicamente un objeto técnico con:

- método;
- ruta;
- request id;
- subject opaco;
- scope;
- status;
- bytes;
- latencia;
- clase de error.

No registra:

- frase TTS;
- transcripción STT;
- audio;
- nombre;
- correo;
- cédula;
- teléfono;
- API key;
- signing secret;
- Voice Grant completo.

Los errores upstream 5xx se traducen a mensaje público genérico.

## 13. Validación offline

`scripts/validate_speak_lab_cloudflare_worker.mjs` cubre:

- health;
- preflight;
- CORS hostil;
- grant faltante;
- firma incorrecta;
- grant expirado;
- scope equivocado;
- TTS fake;
- STT fake y sin prompt;
- target leakage header/query;
- hint-frase rechazado;
- audio sobredimensionado;
- 429;
- rate limiter ausente;
- error upstream sin fuga de API key;
- pronunciación/realtime 501;
- logs sin contenido sensible;
- `network_calls_real=0`.

## 14. Qué falta para Cloudflare real

Cuando el usuario complete OAuth/MCP o Wrangler login en una estación controlada:

1. confirmar account id y cuenta correcta;
2. verificar plan Workers disponible;
3. elegir namespace id único para rate limiter;
4. definir origen HTTPS QA exacto;
5. generar configuración desplegable desde el template;
6. crear Worker QA solamente;
7. comprobar `/health`;
8. cargar secrets QA por canal seguro;
9. verificar logs minimizados;
10. ejecutar fake smoke remoto si aplica;
11. recién después autorizar el micro-piloto real TTS/STT.

## 15. Perímetro que permanece intacto

Este corte NO modifica:

- `main`;
- producción;
- PR #85 / CS21A215;
- English LAB visible;
- Memory Match;
- Apps Script;
- Apollo G3;
- BDBANCARIO/PAGOS;
- hojas CONAPE;
- datos reales;
- hosting DevUX;
- dominio institucional.

**DRAFT · NO MERGE AUTOMÁTICO · NO PROD.**
