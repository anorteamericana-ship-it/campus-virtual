---
name: "english-lab-game-engineer"
description: "Construye y repara los motores de juego, el esquema de contenido, el progreso y la integración del English Lab dentro del Campus Virtual (React en navegador, GitHub Pages, Apps Script). Usar al escribir o modificar código del laboratorio."
---

# Ingeniero de juegos del English Lab

## Objetivo

Que agregar una unidad nueva sea cargar contenido, no programar. Que agregar una mecánica nueva no rompa las anteriores.

## Antes de escribir código

1. Cumplir `AGENTS.md` (línea base, rama pequeña, PR, checks). Leer `PRODUCTION_STATE.md` y `LIVE_CHANGE_RUNBOOK.md`.
2. Leer `.github/workflows/qa-english-lab-source-truth-guard.yml` y los scripts `scripts/qa_english_lab_*`: definen qué archivos del laboratorio están protegidos y cómo.
3. Leer el código real, no la documentación sola: `src/academia_play.jsx`, `src/english_lab_live.jsx`, `src/english_lab_free_access_cs21a66.js`, `src/syllabus.jsx`, y cómo `campus.html` carga cada script.
4. Tener la ficha de actividad del `english-lab-learning-designer`. Sin ficha no se construye.

## Stack confirmado (E0, main 4563ce9 — reverificar)

- React, ReactDOM y Babel servidos desde `vendor/`, JSX compilado en el navegador con `<script type="text/babel">`. No hay bundler ni `npm build`.
- Cada archivo se versiona con un parámetro `?v=` en `campus.html`; cambiar un archivo sin cambiar su `?v=` deja a los usuarios con la copia vieja.
- Los componentes viven en ámbito global (`window`); un nombre repetido pisa a otro en silencio. Prefijo propio para todo lo nuevo.
- Publicación: GitHub Pages desde `main`. Backend: Apps Script, con límites de cuota y latencia; no sirve para tiempo real con muchos usuarios.

No introducir framework, bundler, base de datos ni servicio externo sin justificar utilidad, licencia, costo y riesgo, y sin que quede anotado como decisión.

## Qué existe y cómo tratarlo

- Motores `APChoiceRunner`, `APMatchRunner`, `APOrderRunner` y despacho por `APGameRunner` / `APBankGameRunner`: valorar reutilizarlos antes de reescribir.
- Defectos conocidos a corregir primero: respuesta correcta siempre en la primera opción; líneas desalineadas en el juego de pareo.
- Modo en vivo: se intentó y los estudiantes no quedaban sincronizados. No reconstruirlo sobre polling de Apps Script esperando otro resultado; primero medir cuántos usuarios simultáneos y qué latencia aguanta, y decidir con ese dato.
- Banco de contenido desde hoja de Google (`APBankAdminPanel`): es la base del requisito "editar sin programador". Entender su formato antes de inventar otro.

## Arquitectura objetivo (la mínima que cumple)

Separar cinco cosas y nada más:

1. **Catálogo**: nivel → unidad → etapas → actividades. Datos.
2. **Contenido**: lo que cada actividad muestra y acepta. Datos, editables sin tocar código.
3. **Motores**: componentes que reciben contenido y devuelven un resultado con forma común.
4. **Progreso**: registro de intentos y resultados.
5. **Presentación**: identidad visual del laboratorio, aislada del estilo administrativo del campus.

Contrato de un motor: recibe `{ actividad, contenido, opciones }`; emite `onProgress` y `onComplete({ completada, aciertos, total, intentos, erroresPorItem, habilidad })`. Un motor no sabe de niveles, puntos ni usuarios.

Un motor nuevo se justifica solo si la mecánica es distinta, no si cambia el tema. Si la abstracción hace más lento agregar la segunda unidad que la primera, está mal.

## Progreso y datos

- Identidad, sesión, rol y nivel activo se toman del campus; el laboratorio no crea usuarios ni contraseñas. El nivel se resuelve desde la asignación de grupo vigente, nunca desde una copia guardada.
- Guardar por actividad: iniciada, completada, intentos, resultado, habilidad, fecha. Avance de unidad se calcula, no se guarda aparte.
- Tablas del laboratorio separadas de las académicas. Cero escrituras en notas, asistencia, evaluaciones o expedientes.
- Cada estudiante lee solo lo suyo; el docente, solo sus grupos. La autorización se valida en el backend: ocultar un botón no es seguridad.
- Guardado tolerante a fallos: si el backend no responde, el estudiante termina la actividad y el resultado se reintenta; no se pierde ni se duplica.
- Cualquier endpoint o hoja nueva en Apps Script es release controlado, no hotfix.

## Requisitos de cada actividad

- Funciona en teléfono, tableta y computadora; objetivos táctiles cómodos.
- Operable completa con teclado; foco visible.
- Audio con reproducir, pausar y repetir; nada suena solo. Funciona con conexión lenta: recursos livianos, sin videos pesados de fondo.
- Opciones barajadas en cada intento.
- Alternativa cuando no hay micrófono o el reconocimiento de voz no está disponible en ese navegador. El reconocimiento de voz del navegador no existe o falla en varios navegadores: detectarlo y degradar sin bloquear.
- Animación con propósito y respetando la preferencia de movimiento reducido.
- Errores de carga con mensaje claro y botón de reintentar; nunca pantalla en blanco.

## Publicación sin riesgo

- El laboratorio nuevo convive con el actual detrás de una bandera o ruta de vista previa, para que se pueda auditar en la web real sin reemplazar nada. El actual no se borra hasta validar el reemplazo; el retiro sigue las reglas de borrado de `AGENTS.md`.
- Probar con el usuario demo y datos de prueba. Nunca con estudiantes reales ni escrituras reales.

## Definición de terminado

Una actividad está terminada cuando se jugó de inicio a fin en navegador, en teléfono y en computadora, con teclado, con el resultado guardado y vuelto a leer, y con el nivel de evidencia anotado (E1 local, E3 desplegado). Si solo se leyó el código, es E0 y no está terminada.

Al cerrar, entregar al `english-lab-director`: archivos tocados, `?v=` actualizados, qué se probó y cómo, qué quedó sin probar.