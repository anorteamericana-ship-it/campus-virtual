# SPEAK LAB · Fase 0

Prototipo aislado para validar el flujo humano antes de integrar APIs de voz o cualquier calificación académica.

## Objetivo

Validar en navegador el ciclo:

`LISTEN → RECORD → REPLAY → RETRY`

La transcripción y el análisis automático quedan explícitamente fuera de este primer gate hasta definir un proveedor y flujo de datos auditables.

## Qué sí hace

- Presenta 10 frases iniciales.
- Reproduce una voz modelo provisional mediante `speechSynthesis` del navegador.
- Solicita acceso al micrófono de forma explícita.
- Graba audio localmente con `MediaRecorder` cuando el navegador lo soporta.
- Permite escuchar la grabación del estudiante.
- Permite repetir sin recargar.
- Mantiene el audio dentro de la sesión del navegador; el código del Campus no lo sube a backend ni invoca un servicio de reconocimiento.

## Qué NO hace

- No genera MP3 de producción.
- No usa OpenAI ni otro proveedor externo.
- No usa `SpeechRecognition`/`webkitSpeechRecognition`; algunos navegadores pueden procesar esa voz mediante servicios del proveedor y no queremos introducir ese flujo silenciosamente.
- No transcribe automáticamente.
- No calcula una supuesta nota de pronunciación.
- No evalúa fonemas, acento, ritmo, stress o entonación.
- No produce nota oficial.
- No guarda audios de forma persistente.

## Archivos

- `index.html`: interfaz del prototipo.
- `phrases.js`: banco inicial de 10 frases.
- `styles.css`: estilos responsive.
- `app.js`: TTS provisional, permisos de micrófono, grabación local y reproducción.
- `ABRIR_SPEAK_LAB_PHASE0.cmd`: launcher Windows para abrir la carpeta por `localhost`.
- `../../scripts/test_speak_lab_phase0_browser.mjs`: smoke Chromium automatizado.

## Uso en Windows

1. Extraer la carpeta completa del candidato.
2. Abrir `ABRIR_SPEAK_LAB_PHASE0.cmd`.
3. Mantener abierta la ventana del servidor local durante la prueba.
4. El navegador abre `http://127.0.0.1:4174/index.html`.
5. Aceptar el permiso de micrófono cuando el navegador lo solicite.

El uso de `localhost` es deliberado: los navegadores suelen exigir un contexto seguro para `getUserMedia`; abrir `index.html` directamente como `file://` puede bloquear el micrófono.

## QA automático

El workflow `Validate SPEAK LAB Phase 0` ejecuta dos capas:

### Gate estático

- sintaxis JS;
- exactamente 10 frases e IDs únicos;
- DOM requerido;
- responsive 420/780 px;
- ausencia de `fetch`, XHR, WebSocket, Apps Script y SpeechRecognition en el prototipo;
- presencia del plan maestro M01–M50.

### Browser smoke Chromium

Con micrófono sintético del navegador valida:

- página real servida por `localhost`;
- `getUserMedia` + `MediaRecorder` disponibles;
- `Record` inicia captura;
- navegación se bloquea durante la grabación;
- `Stop` genera un `blob:` local;
- aparece playback;
- `Retry` limpia el intento;
- navegación entre frases funciona;
- viewport `390×844` sin overflow horizontal;
- cero requests externos;
- cero errores de consola.

La prueba automatizada demuestra el flujo técnico del navegador, no calidad acústica ni pronunciación.

## Criterios de aceptación

1. Las 10 frases cargan.
2. `Listen` reproduce la frase.
3. `Record` solicita micrófono de manera visible.
4. `Stop` finaliza la captura.
5. La grabación puede reproducirse.
6. `Try again` limpia el intento sin perder la frase.
7. La interfaz deja claro que todavía no existe calificación automática.
8. La UI sigue siendo utilizable cerca de 390 px.
9. No existen requests externos provocados por el prototipo.
10. Un navegador sin `MediaRecorder` recibe un mensaje honesto y no una falsa calificación.

## Coordinación con English LAB renovado

SPEAK LAB permanece separado de los juegos de English LAB. Mientras Work desarrolla el hub CS21A215 en paralelo, esta fase no modifica `src/app.jsx`, loaders, menú ni shell. La futura integración visible deberá hacerse contra el hub que resulte canónico después de esa renovación, no contra rutas anteriores por intuición.

## Próximo gate

Después de QA humana en PC y posteriormente en iPhone/Android mediante una superficie HTTPS controlada, se decidirá si el flujo de interacción es suficientemente claro para conectar proveedores reales de TTS/STT bajo interfaces desacopladas. Solo después se diseña un evaluador de pronunciación independiente del reconocimiento de texto.
