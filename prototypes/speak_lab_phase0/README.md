# SPEAK LAB · Fase 0

Prototipo aislado para validar el flujo humano antes de integrar APIs de voz o cualquier calificación académica.

## Objetivo

Validar en navegador el ciclo:

`LISTEN → RECORD → REPLAY → TRANSCRIBE (si existe soporte) → COMPARE → RETRY`

## Qué sí hace

- Presenta 10 frases iniciales.
- Reproduce una voz modelo provisional mediante `speechSynthesis` del navegador.
- Solicita acceso al micrófono de forma explícita.
- Graba audio localmente con `MediaRecorder` cuando el navegador lo soporta.
- Permite escuchar la grabación del estudiante.
- Intenta transcripción mediante `SpeechRecognition`/`webkitSpeechRecognition` cuando el navegador lo soporta.
- Calcula un `intelligibility proxy` simple comparando palabras esperadas vs. transcritas.
- Permite repetir sin recargar.
- No envía audio a backend ni a terceros.

## Qué NO hace

- No genera MP3 de producción.
- No usa OpenAI ni otro proveedor externo.
- No evalúa fonemas.
- No evalúa acento, ritmo, stress o entonación.
- No produce nota oficial.
- No guarda audios de forma persistente.
- No debe confundirse una transcripción correcta con una pronunciación correcta.

## Archivos

- `index.html`: interfaz del prototipo.
- `phrases.js`: banco inicial de 10 frases.
- `styles.css`: estilos responsive.
- `app.js`: TTS, micrófono, grabación, transcripción opcional y proxy de inteligibilidad.

## Uso

Servir esta carpeta por HTTP local; por ejemplo con cualquier servidor estático. El acceso a micrófono suele requerir `https://` o `localhost` según el navegador.

## Criterios de aceptación

1. Las 10 frases cargan.
2. `Listen` reproduce la frase.
3. `Record` solicita micrófono de manera visible.
4. `Stop` finaliza la captura.
5. La grabación puede reproducirse.
6. Si el navegador soporta reconocimiento de voz, aparece la transcripción.
7. El resultado se etiqueta como proxy de inteligibilidad, nunca como pronunciación.
8. `Try again` limpia el intento sin perder la frase.
9. La UI sigue siendo utilizable cerca de 390 px.
10. No existen requests de red de audio en el prototipo.

## Próximo gate

Después de QA humana en iPhone, Android y PC se decidirá si el flujo de interacción es suficientemente claro para conectar proveedores reales de TTS/STT. Solo después se diseña un evaluador de pronunciación independiente.