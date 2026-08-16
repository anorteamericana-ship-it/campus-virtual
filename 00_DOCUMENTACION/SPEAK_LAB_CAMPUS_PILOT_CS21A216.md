# SPEAK LAB · Campus Pilot · CS21A216

Fecha de corte: 2026-08-15 / 2026-08-16 CR.

## Estado

PILOTO DE PRÁCTICA. No producción directa. No nota oficial. No aprobación/reprobación. El motor de pronunciación continúa con `official:false` y `calibrated:false`.

Este corte continúa Issue #103 y se apila sobre PR #102 (PC8). No modifica Memory Match, Apps Script, Apollo/CONAPE ni `src/app.jsx`.

## Decisión posterior a PC8

PC8 demostró el pipeline técnico real con 9 muestras normalizadas, pero no demostró calibración académica suficiente. En la frase corta controlada, Azure concentró `segmentalAccuracy` cerca del techo incluso en muestras actuadas como problemáticas. Por eso CS21A216 NO presenta Accuracy/Fluency/PronScore como nota académica.

La decisión es separar dos entregables:

1. terminar la experiencia funcional de práctica dentro del Campus;
2. calibrar después con docentes y muestras controladas tomadas desde esa misma experiencia real.

## Arquitectura del piloto

```text
Campus autenticado teacher/student
        ↓
Speak LAB
        ↓
Escuchar modelo TTS
        ↓
Consentimiento explícito de micrófono
        ↓
MediaRecorder local
        ↓
normalización local
WAV PCM · 16 kHz · mono
        ↓
Voice Grant corto emitido por Cloudflare
tras validar la sesión Campus
        ↓
       ┌───────────────┬─────────────────────────┐
       ↓               ↓
OpenAI STT        Azure Pronunciation
SIN target text   CON referenceText
       ↓               ↓
       └────── feedback de práctica ─────────────┘
```

## Normalización obligatoria

PC8 encontró un fallo reproducible de formato: una muestra OGG marcada 44.1 kHz agotó repetidamente 30 s vía Worker y 60 s directamente contra Azure. El mismo contenido normalizado respondió HTTP 200 en 1.473 s.

CS21A216 elimina la dependencia del codec de MediaRecorder. El navegador puede grabar WebM/MP4/OGG según soporte, pero antes de enviar:

- decodifica localmente con Web Audio;
- mezcla a un canal;
- resamplea a 16 kHz;
- genera WAV PCM 16-bit;
- limita a 30 s y 2.5 MB;
- usa exactamente esa misma copia normalizada para STT y PronunciationEvaluator.

El audio crudo no se persiste en Campus ni Git.

## Autorización del navegador

El navegador NO recibe `OPENAI_API_KEY`, `AZURE_SPEECH_KEY` ni `VOICE_GRANT_SIGNING_SECRET`.

`POST /v1/session-grant` recibe el token vigente del Campus, lo valida server-side contra `CAMPUS_AUTH_URL?fn=validarSesion` y emite un Voice Grant HMAC de máximo 300 s con únicamente scopes de práctica:

- `tts:read`;
- `stt:write`;
- `pronunciation:write`.

El piloto permite solamente roles visibles `student` y `teacher`. Si `validarSesion` devuelve un rol, debe coincidir con el rol activo solicitado. El token Campus no se incluye en logs técnicos.

## Separación STT / pronunciación

Regla innegociable preservada:

- STT recibe audio + idioma + hints vacíos;
- STT NO recibe `referenceText`, `expectedText`, `targetText`, `answerText` ni `correctAnswer`;
- solamente `/v1/pronunciation` recibe la frase objetivo;
- transcript equality nunca se convierte en pronunciation score.

## Experiencia visible

La entrada propia `Speak LAB` aparece para docente y estudiante como `Beta`.

Flujo inicial:

1. elegir frase (banco SL01–SL10);
2. escuchar modelo sintético;
3. aceptar consentimiento de micrófono/procesamiento temporal;
4. grabar;
5. escuchar la grabación local;
6. `Enviar y analizar`;
7. ver `El sistema entendió: …`;
8. ver issues pedagógicos disponibles;
9. repetir o continuar.

Copy obligatorio:

> Evaluación de práctica / beta. No corresponde a una calificación académica, no establece aprobación o reprobación y el motor continúa en proceso de calibración.

No se muestran scores numéricos como nota.

## Integración aislada del Campus

PR #85 (English LAB) modifica `src/app.jsx`. Para evitar colisiones, CS21A216 no toca ese archivo.

El piloto se carga aditivamente desde `student_menu_academic_guard_cs21a120.js`. `speak_lab_pilot_integration_cs21a216.js` inserta un botón propio después de English LAB y monta un overlay en el área principal del Campus. Cerrar Speak LAB devuelve al usuario a la pantalla que tenía debajo.

Cuando la renovación English LAB se consolide, este overlay puede convertirse en ruta canónica en un corte pequeño posterior sin reescribir el motor de voz.

## Primera QA humana prevista

Después de CI y despliegue QA del Worker:

- docente real/controlado entra al Campus;
- abre Speak LAB;
- ejecuta SL01 de extremo a extremo;
- se valida TTS → micrófono → WAV 16 kHz mono → STT → pronunciation → feedback;
- después se agregan tiros controlados `natural_good`, `intermediate`, `problematic` desde la misma UI.

La revisión humana de calibración debe hacerse sin usar el score del proveedor como verdad académica.

## Gate antes de publicar

1. CI offline verde;
2. Worker QA con `CAMPUS_AUTH_URL` y `ALLOWED_ORIGINS` exactos;
3. prueba autenticada teacher real/controlado;
4. prueba autenticada student real/controlado;
5. móvil + desktop;
6. verificar permiso/denegación de micrófono;
7. verificar que un error técnico no se muestre como error de pronunciación;
8. revisión humana;
9. recién entonces candidato de publicación en `anorteamerican.com/campus-virtual`.

## Fuera de alcance de CS21A216

- nota oral oficial;
- thresholds de aprobado/reprobado;
- INA/CONAPE;
- persistencia de audio;
- biometría de voz;
- clonación de voz;
- cambios de Apps Script;
- Memory Match;
- merge automático;
- despliegue directo a producción.
