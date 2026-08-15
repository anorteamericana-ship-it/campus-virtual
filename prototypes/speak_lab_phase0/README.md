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

## Uso

Servir esta carpeta por HTTP local; por ejemplo con cualquier servidor estático. El acceso a micrófono suele requerir `https://` o `localhost` según el navegador.

## Criterios de aceptación

1. Las 10 frases cargan.
2. `Listen` reproduce la frase.
3. `Record` solicita micrófono de manera visible.
4. `Stop` finaliza la captura.
5. La grabación puede reproducirse.
6. `Try again` limpia el intento sin perder la frase.
7. La interfaz deja claro que todavía no existe calificación automática.
8. La UI sigue siendo utilizable cerca de 390 px.
9. No existen requests de red de audio provocados por el prototipo.
10. Un navegador sin `MediaRecorder` recibe un mensaje honesto y no una falsa calificación.

## Próximo gate

Después de QA humana en iPhone, Android y PC se decidirá si el flujo de interacción es suficientemente claro para conectar proveedores reales de TTS/STT bajo interfaces desacopladas. Solo después se diseña un evaluador de pronunciación independiente del reconocimiento de texto.
