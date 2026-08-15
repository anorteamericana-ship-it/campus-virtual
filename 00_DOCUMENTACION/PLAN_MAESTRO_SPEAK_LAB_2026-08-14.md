# PLAN MAESTRO · SPEAK LAB

Fecha inicial: 2026-08-14  
Proyecto: Campus Virtual Academia Norteamericana  
Tracker: Issue #86  
Rama inicial: `feature/speak-lab-phase0`

## 1. Visión

SPEAK LAB será el subsistema académico de práctica oral, pronunciación, listening y conversación del Campus Virtual. No se considera un juego de English LAB. Su objetivo es dar práctica oral frecuente al estudiante y entregar al docente evidencia y patrones útiles sin obligarlo a escuchar cada intento.

Ciclo central objetivo:

`LISTEN → SPEAK → ANALYZE → FEEDBACK → RETRY → LEARN`

La Fase 0 valida únicamente:

`LISTEN → RECORD → REPLAY → RETRY`

## 2. Regla académica principal

Una transcripción correcta NO demuestra pronunciación correcta. El diseño debe mantener separadas, como mínimo:

- inteligibilidad;
- exactitud fonética/segmental;
- word stress;
- sentence stress;
- rhythm;
- fluency;
- intonation;
- task completion / communication success.

Nunca implementar `texto esperado = texto transcrito → 100% pronunciación`.

## 3. Principio del acento

El objetivo no es borrar el acento costarricense ni obligar al estudiante a imitar una identidad nativa. El objetivo es hablar inglés clara y comprensiblemente, con suficiente control fonético y prosódico para comunicarse eficazmente.

## 4. Arquitectura conceptual

### Capa A · Voz
Entrada de micrófono y salida de audio modelo.

### Capa B · Reconocimiento
Qué contenido se entendió, omisiones, sustituciones, pausas y duración.

### Capa C · Pronunciación
Fonemas, stress, ritmo, fluidez, entonación y otros rasgos acústicos. Debe ser independiente del STT.

### Capa D · Pedagogía
Qué error corregir, cuándo corregirlo, cómo explicarlo y qué práctica asignar.

### Capa E · Inteligencia académica
Historial, debilidades recurrentes, progreso, alertas docentes y Pronunciation Passport.

## 5. Backlog de módulos

| ID | Módulo | Propósito |
|---|---|---|
| M01 | Audio Library | Biblioteca de palabras, frases, diálogos e instrucciones. |
| M02 | Listen | Escucha guiada. |
| M03 | Listen & Repeat | Modelo, grabación, análisis y reintento. |
| M04 | Word Practice | Práctica de palabra aislada. |
| M05 | Difficult Word Rescue | Microentrenamiento automático al detectar dificultad recurrente. |
| M06 | Minimal Pairs | Contrastes como ship/sheep, three/tree, very/berry. |
| M07 | Phoneme Lab | Entrenamiento por fonema y posición articulatoria. |
| M08 | Word Stress | Acentuación correcta de palabras. |
| M09 | Sentence Stress | Acentos dentro de la oración. |
| M10 | Connected Speech | Linking, reductions, contractions y weak forms. |
| M11 | Shadowing | Imitación de timing, ritmo y entonación. |
| M12 | Read Aloud | Lectura oral con medición longitudinal. |
| M13 | Listening Dictation | Comprensión auditiva por dictado. |
| M14 | Question & Answer | Pregunta oral con respuesta libre. |
| M15 | AI Conversation | Conversación dinámica por voz. |
| M16 | Role Play | Restaurante, hotel, aeropuerto, trabajo, etc. |
| M17 | Missions | Objetivo comunicativo sin guion exacto. |
| M18 | Unexpected Events | Problemas y preguntas inesperadas. |
| M19 | Difficulty Engine | Guided, Natural y Challenge. |
| M20 | Coach Mode | Corrección inmediata durante práctica específica. |
| M21 | Conversation Mode | Conversación fluida con feedback posterior. |
| M22 | Pronunciation Passport | Perfil longitudinal de fortalezas y debilidades. |
| M23 | Adaptive Practice Engine | Selección de práctica según patrones reales. |
| M24 | Personal Error Bank | Banco individual de palabras/estructuras difíciles. |
| M25 | Spaced Pronunciation Review | Revisión espaciada para comprobar retención. |
| M26 | Oral Assessment | Evaluación oral asistida por IA. |
| M27 | Teacher Review | Docente revisa evidencia y ajusta decisión. |
| M28 | Teacher Dashboard | Excepciones, patrones y estudiantes que requieren atención. |
| M29 | Group Pronunciation Map | Patrones agregados del grupo. |
| M30 | Classroom Insights | Recomendaciones para la próxima clase. |
| M31 | Student Progress | Evolución individual, no ranking público. |
| M32 | Daily Speak | Microprácticas de 2–5 minutos. |
| M33 | Speaking Streak | Continuidad de práctica sin diseño compulsivo. |
| M34 | XP & Achievements | Gamificación secundaria, nunca nota académica. |
| M35 | Confidence Mode | Adaptación según latencia/abandono sin diagnóstico psicológico. |
| M36 | Listen Without Text | Escucha antes de revelar texto. |
| M37 | Audio Speed Control | Variaciones pedagógicas de velocidad. |
| M38 | Accent Exposure | Exposición progresiva a diversas voces/acentos. |
| M39 | Noise Challenge | Comprensión con ruido para niveles avanzados. |
| M40 | Phone Mode | Conversación sin pistas visuales. |
| M41 | Speed Challenge | Respuesta razonablemente rápida para reducir traducción mental. |
| M42 | Story Retell | Escuchar y volver a contar una historia. |
| M43 | Picture Speak | Describir imágenes libremente. |
| M44 | Opinion Speak | Defender una opinión en niveles intermedios. |
| M45 | Interview Simulator | Entrevistas laborales/académicas adaptativas. |
| M46 | Error Reformulation | Reformulación natural en lugar de solo marcar error. |
| M47 | Self Comparison | Modelo y grabación del estudiante lado a lado. |
| M48 | Before / After | Comparar muestras de distintas semanas. |
| M49 | Content Authoring | Crear ejercicios sin programar. |
| M50 | AI Exercise Generator | Proponer ejercicios alineados a nivel/lección con control académico. |

## 6. Ideas futuras registradas

- Visual Mouth Coach: animación de lengua/labios.
- Waveform Comparison: visualización comparativa de forma de onda.
- Pitch Visualization: curva de entonación.
- AI Class Partner: conoce el contenido de la lección actual.
- Personalized Missions: misiones según debilidades.
- Teacher-created AI Personas: escenarios configurables por docente.
- Weekly Oral Checkpoint: microevaluación semanal.
- Pronunciation Heatmap: mapa longitudinal de dificultades.
- Oral Portfolio: muestras significativas por nivel.
- Graduation Comparison: muestra inicial vs. final.
- Speaking Twin: perfil académico adaptativo, no clon de voz.
- Communication Score separado de Speech Accuracy.

## 7. Integración curricular

SPEAK LAB debe conocer por cada una de las 32 lecciones:

- nivel;
- unidad;
- vocabulario;
- estructuras;
- objetivos comunicativos;
- pronunciation/listening del planeamiento;
- dificultad esperada.

No generar ejercicios desconectados del currículo.

## 8. Feedback

Priorizar:

1. errores que impiden comprensión;
2. objetivo de la lección;
3. errores recurrentes;
4. errores importantes para el nivel;
5. detalles menores.

No corregir todo durante una conversación. Coach Mode y Conversation Mode son flujos diferentes.

## 9. Evaluaciones oficiales

La IA puede recomendar resultados, pero durante la etapa de validación el docente conserva autoridad final. Antes de usar notas oficiales se requiere un corpus de audios reales calificado independientemente por profesores y comparación sistemática contra el motor automático.

## 10. Datos y versionado

Por intento futuro se debe poder registrar como mínimo:

- estudiante;
- ejercicio;
- nivel/lección;
- fecha;
- duración;
- transcripción cuando aplique;
- texto esperado cuando aplique;
- resultados por dimensión;
- errores detectados;
- reintentos;
- proveedor/modelo;
- versión del algoritmo.

Una puntuación generada con una versión de algoritmo no debe asumirse equivalente a otra versión posterior.

## 11. Privacidad

- Micrófono siempre con acción/permiso visible.
- No grabación silenciosa.
- Definir retención de audio antes de persistirlo.
- No conservar toda práctica indefinidamente.
- Separar audio de práctica de evidencia de evaluación.
- Documentar proveedor y ruta de datos de STT/TTS antes de activarlos.

## 12. Costos

El administrador futuro debe poder observar minutos y costo aproximado por estudiante, grupo, módulo y mes. Cachear audio estático y reservar streaming/realtime para experiencias donde realmente aporte valor.

## 13. Compatibilidad real

QA obligatoria futura:

- iPhone/Safari;
- Android económico/Chrome;
- PC;
- micrófono interno;
- audífonos;
- habitación silenciosa;
- ruido moderado;
- conexiones lentas;
- ancho móvil alrededor de 390 px.

Una falla técnica nunca debe convertirse en una calificación baja.

## 14. Arquitectura multiproveedor

Objetivo de interfaces futuras:

- `TextToSpeechProvider`
- `SpeechToTextProvider`
- `PronunciationEvaluator`
- `ConversationProvider`

No acoplar el Campus a un único modelo o proveedor.

## 15. Fases

### Fase 0 · UX y micrófono
10 frases. Listen → Record → Replay → Retry. Sin backend, STT, IA ni nota.

### Fase 1 · MVP Speak
TTS real, STT real, Listen & Repeat, Word Practice, historial básico. STT solo mide reconocimiento/inteligibilidad aproximada.

### Fase 2 · Pronunciation
Minimal Pairs, Phoneme Lab, stress, Shadowing, Pronunciation Passport y práctica adaptativa. Requiere motor fonético validado.

### Fase 3 · Conversation
AI Conversation, Role Play, Missions, Difficulty Engine y Conversation Mode.

### Fase 4 · Inteligencia docente
Teacher Dashboard, Group Pronunciation Map y Classroom Insights.

### Fase 5 · Assessment
Rúbricas, evidencia, Teacher Review, versionado y auditoría, solo después de validación académica.

### Fase 6 · Experiencias avanzadas
Full-duplex cuando corresponda, llamadas, entrevistas, ruido, exposición a voces y escenarios largos.

## 16. Estados de desarrollo

Cada idea debe pasar por:

`IDEA → INVESTIGACIÓN → PROTOTIPO → QA → PILOTO → APROBADO → PRODUCCIÓN`

## 17. No hacer

- No calificar pronunciación solo con STT.
- No inventar porcentajes con falsa precisión.
- No introducir notas oficiales antes de validación.
- No corregir todos los errores en conversación.
- No obligar al docente a escuchar cada audio.
- No guardar audios indefinidamente por defecto.
- No depender de un único proveedor.
- No mezclar SPEAK LAB con Memory Match.
- No tocar producción durante prototipos.
- No construir los 50 módulos simultáneamente.

## 18. Criterio de éxito

SPEAK LAB debe aumentar minutos reales de habla, mejorar inteligibilidad y competencia comunicativa, detectar patrones útiles, ofrecer feedback accionable, reducir trabajo repetitivo del profesor, integrarse con el currículo y operar con costos/privacidad sostenibles.

El corazón del sistema seguirá siendo:

**Escuchar → hablar → analizar → corregir → mejorar.**
