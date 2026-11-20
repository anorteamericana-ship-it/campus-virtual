# EXAM PREP LAB · Estado canónico

Único archivo de continuidad del módulo de preparación para certificaciones (primera modalidad: TOEIC® Listening and Reading). Se actualiza; no se crean copias. Reglas generales: `AGENTS.md`. Encargos: prompt inicial (19-nov-2026) y “Continuación y desarrollo integral” (19-nov-2026).

## 0. Línea base

| Dato | Valor |
|---|---|
| Fecha | 2026-11-19 (CR) |
| Frontend | `campus-virtual` · rama `feat/exam-prep-lab-prototipo-20261119` sobre `main` **`9727d0838461950c4b6a95854a80d4dfcb1a4c43`** |
| Backend | `campus_backend` · rama `feat/exam-prep-lab-prototipo-20261119` sobre `main` **`7ef0f88c8558a1c963346f6919cdafab1ff43c5b`**. Leído en el repo (E0); el despliegue no se verificó. |
| Tocado en el Campus | Solo archivos nuevos: `prototipos/exam_prep_lab/**`, `src/exam_prep_lab.jsx` (sin conectar a menú ni `F96_LAZY`), este documento. Backend: `integrations/cert_prep_lab/**`, `tests/qa_cert_prep_lab_e1.mjs`, un workflow. **`prod/` sin cambios.** |
| No tocado | F111, Academia Play, notas, asistencias, ESTATUS, pagos, CONAPE, certificados, APOLLO, USUARIOS, SESIONES, router desplegado. |
| Estado | **E1 sintético.** Sin fusión, sin publicación, sin despliegue. |

## 1. Decisiones vigentes (Leonardo, 19-nov)

- **A. Sin fecha de examen.** No hay fechas, cuentas regresivas ni planes por fecha. No se vuelve a preguntar.
- **B. Acceso lo controla el superadmin** con `CERT_PREP_ACCESS`, independiente de pago TOEIC, INA, CONAPE o fecha. Quien tiene cuenta del Campus conserva su identidad y rol. Egresado sin cuenta: enlace de un solo uso → cuenta solo de preparación (`cert_candidate`), sin matrícula ni cambios de ESTATUS.
- **C. Bancos completos** con composición oficial; todo lo generado por IA queda en `DRAFT` hasta revisión docente.
- Decisión técnica tomada en este corte: las cuentas de preparación **no** usan la hoja SESIONES del Campus. Tienen sesión propia (`cp1.`) en la base del laboratorio; así un token de preparación nunca abre rutas del Campus.

## 2. Matriz de estado

| Concepto | Cantidad | Detalle / evidencia |
|---|---|---|
| Preguntas creadas | **400** | Forma A 200 (164 nuevas + 36 del prototipo v1, sin doble conteo) · Forma B 200 nuevas |
| Técnicamente válidas | **400** | Validador: 0 errores y 0 advertencias en A y B; composición completa en ambas; 0 repeticiones entre formas (`qa_engine.mjs`) |
| Revisadas por docente | **0** | — |
| Aprobadas / publicadas | **0 / 0** | Todas `DRAFT`. En entorno PRODUCCION ningún candidato real puede recibirlas. |
| Audios generados | **112 clips · 66,9 min** | 54 clips A (34,0 min) + 54 clips B (32,0 min) + 4 instrucciones; Kokoro-82M local, 8 voces EE. UU./Reino Unido |
| Audios revisados por oído humano | **0** | Solo verificación automática: existencia, SHA-256, duración real (ffprobe), ritmo de habla, huella guion↔audio |
| Imágenes Parte 1 | **12** | SVG originales (6 por forma), grises, sin texto ni marcas |
| Módulos funcionales (E1) | 10 | §4 |
| Integración | **Preparada, pendiente de liberación** | §5; requiere autorización de Leonardo |
| Pruebas ejecutadas | **6 suites, 116 casos, todas PASS** | §6 |
| Publicación real | **Ninguna** | Nada en GitHub Pages ni en Apps Script |

## 3. Bancos

**Composición (idéntica en A y B):** P1 6 · P2 25 · P3 39 (13 conversaciones; 2 de tres hablantes; 3 con gráfico) · P4 30 (10 charlas; 2 con gráfico) · P5 30 · P6 16 (4 textos, cada uno con una inserción de oración) · P7 54 (10 textos simples con 29 preguntas, incluidas cadenas de chat y 2 inserciones; 2 dobles y 3 triples de 5 preguntas).

**Cada pregunta trae:** id estable, forma, parte, dificultad (1–3), habilidad y subhabilidad, enunciado o referencia de audio/imagen/texto, opciones con id, clave, explicación, explicación y categoría de error por distractor, fuente (`AI_ORIGINAL`), autor, licencia, versión y estado editorial.

| | Forma A | Forma B |
|---|---|---|
| Dificultad 1 / 2 / 3 | 63 / 88 / 49 | 49 / 103 / 48 |
| Claves equilibradas | Sí (P2 en 3 opciones; resto en 4) | Sí (ajustadas para que ninguna letra domine) |
| Versión | `A.1.0-draft` | `B.1.0-draft` |

Fuentes de autoría: `prototipos/exam_prep_lab/content/form_{a,b}_*.src.js` → `node tools/build_bank.mjs A B` → `forms/form_{a,b}.json|js`. No se editan los generados a mano.

**Límites honestos:** la dificultad la asignó la IA, no está calibrada; la naturalidad, las claves y las explicaciones deben revisarse por una docente; las voces son sintéticas y no hay acento canadiense ni australiano.

## 4. Producto (prototipo E1) y las 12 correcciones pedidas

| # | Corrección | Estado | Evidencia |
|---|---|---|---|
| 1 | Sin fecha de examen ni urgencia | Hecho | `qa_e1` 01, `qa_engine` (búsqueda de fechas/cuentas regresivas en la interfaz) |
| 2 | Vista editorial separada de la del estudiante | Hecho | `qa_e1` 16; revisora no puede publicar |
| 3 | Diagnóstico equilibrado de las 7 partes | Hecho (20 preguntas) | `qa_e1` 01, `qa_server` |
| 4 | Claves de simulacros no viajan antes de finalizar | Hecho (servidor) | `qa_server`, `qa_integration_e1`, backend E1 |
| 5 | Navegación y continuación | Hecho | `qa_e1` 06, 11, 12 |
| 6 | Historial completo | Hecho | `qa_server` 26 |
| 7 | Reportes por habilidad y categoría de error | Hecho | `qa_server` 26 |
| 8 | Barajado seguro (P1–P2 nunca) | Hecho | `qa_engine` (1.000 órdenes por pregunta) |
| 9 | Evitar repetición entre formas | Hecho | `crossFormCheck` + exposición por forma y candidato |
| 10 | Práctica corta con bancos autorizados | Hecho | mini-reto y práctica limitados a las formas del acceso |
| 11 | Bloquear material no aprobado a candidatos reales | Hecho | PRODUCCION por defecto: solo `PUBLISHED`; backend E1 |
| 12 | Simulacro completo exacto (200, tiempos correctos) | Hecho | `qa_e1` 10 (Listening 100 con audio continuo), 12 (Reading 75 min, reloj del servidor), 13 (integral 200) |

Pantallas por rol: estudiante/candidato (panel, orientación, entrenar, sesión, simulacros, resultado, errores con repaso espaciado, reportes), superadmin (candidatos, búsqueda, registro, habilitar/suspender, enlace de activación, asignar docente, auditoría, configuración), admin (consulta), docente (solo asignados, sin cédula ni correo), editorial (banco por forma/parte/estado, validación calculada en servidor, vista previa).

Ruta del prototipo: `prototipos/exam_prep_lab/index.html` (demo con backend simulado) y `index.html?backend=apps-script` (servidor real; no carga banco ni núcleo en el navegador).

## 5. Integración (preparada, no desplegada)

**Una sola implementación del servidor:** `epl_engine.js` + `epl_server_core.js` corren igual en Node (pruebas), en el navegador (demo) y en Apps Script (generados con `tools/build_gas.mjs`).

| Pieza | Dónde | Estado |
|---|---|---|
| Capa Apps Script `certPrepApi` | backend `integrations/cert_prep_lab/apps_script/97_Cert_Prep_Lab.js` | Escrita y probada E1 |
| Núcleo y banco para Apps Script | `98_Cert_Prep_Core.js`, `99_Cert_Prep_Bank.js` (generados, con SHA-256) | Generados y verificados |
| Línea del router | `integrations/cert_prep_lab/router_patch.mjs` | Probada en memoria; **no aplicada** a `prod/` |
| Adaptador del navegador | `prototipos/exam_prep_lab/epl_apps_script_adapter.js` | Probado E1 |
| Vista del Campus | `src/exam_prep_lab.jsx` (`ExamPrepLabView`) | Probada E1; **no conectada** a menú ni `F96_LAZY` |

Garantías probadas: apagado por defecto (`CERT_PREP_ENABLED`); base en hoja propia (`CERT_PREP_DB_ID`, rechaza APOLLO); APOLLO solo lectura (USUARIOS, DATOS, ESTATUS idénticos antes y después); identidad desde `validarSesion` o sesión `cp1.`; el navegador no envía código, cédula ni grupo; token `cp1.` rechazado por rutas del Campus; PBKDF2 del Campus para claves; enlace de un solo uso de 72 h; 5 intentos de login por 15 min; `verifyLogin` no público; docente limitado a asignados; auditoría de registro, acceso, activación, login, asignación y consulta.

Pasos de liberación (solo con autorización de Leonardo): `integrations/cert_prep_lab/README.md` en el backend. Para el frontend: agregar `exam_prep: ['src/exam_prep_lab.jsx?v=…']` a `F96_LAZY`, la entrada de menú visible solo si `me`/`editorItems` responde `ok`, y mover los recursos de `prototipos/` a una ruta estable.

## 6. Pruebas ejecutadas (todas E1 sintéticas, usuarios ficticios)

| Suite | Resultado | Qué cubre |
|---|---|---|
| `qa_engine.mjs` | 28/28 | Validación de 400 preguntas, composición, distribución, barajado, repetición entre formas, repaso espaciado, SHA-256 |
| `qa_media.mjs` | 15/15 | 112 clips: existencia, no vacíos, SHA-256, duración ffprobe, ritmo, huella guion↔audio, sin duplicados ni huérfanos, 12 imágenes |
| `qa_server.mjs` | 26/26 | Identidad, tiempos del servidor, idempotencia, ocultamiento de claves, acceso, editorial, interrupciones, separación de usuarios |
| `qa_e1.mjs` (Chromium) | 23/23 | Flujos completos en navegador, simulacros, móvil, teclado, sin conexión |
| `qa_integration_e1.mjs` (Chromium) | 4/4 | Modo apps-script, activación, login `cp1.`, vista del Campus incrustada |
| backend `tests/qa_cert_prep_lab_e1.mjs` | 20/20 | `prod/` real + integración por `doPost`, APOLLO intacto, roles, bloqueo de borradores, sesiones |

### 6.1 `qa_e1.mjs`

23/23 PASS en Chromium headless (≈4 min). Incluye el simulacro de Listening de 100 preguntas reproducido a 16× con audio continuo e instrucciones, recarga a mitad del audio, Reading con reloj del servidor y fin por tiempo, integral de 200, teclado, sin conexión y móvil a 390 px. La prueba 08 dependía de que la práctica usara la Forma A; se corrigió la prueba (no el producto) al existir la Forma B.

Reproducibilidad del audio: volver a correr `make_audio.py A B` no regenera ningún clip y deja `audio_manifest.js` idéntico (verificado por SHA-256). No se probó regeneración bit a bit desde cero.

**No probado:** E2/E3/E4 (sesión real, despliegue, escritura en hoja real), lector de pantalla real, dispositivos móviles reales, cuotas y tiempos reales de Apps Script con miles de filas.

## 7. Hallazgos del Campus (vigentes)

| ID | Estado | Sev. | Evid. | Hallazgo |
|---|---|---|---|---|
| EPL-A01 | CONFIRMADO | P1 para egresados | E0 | La activación de cuenta de estudiante exige ESTATUS CA o PE (`prod/51_Recuperacion_Acceso_Universal.js:199`). Un egresado con todo APR y sin cuenta no puede activar. **Resuelto para este módulo** con cuentas de preparación propias (§1 B), sin tocar ese flujo. |
| EPL-A02 | CONFIRMADO | P2 | E0 | Academia Play toma identidad del cuerpo de la petición antes que de la sesión (`prod/43_Academia_Play.js:535-544`). No se reutiliza. Corrección pendiente en su propio frente. |
| EPL-A03 | CONFIRMADO | — | E0 | TOEIC en el Campus es solo un rubro de cobro de I2 (`src/aplicar_pago.jsx`). El acceso al laboratorio no depende de ese cobro. |
| EPL-A04 | CONFIRMADO | — | E1 | `validarSesion(token)` es la fuente de identidad; se usa tal cual. |
| EPL-A07 | NO VERIFICADO | — | — | Estado del runtime de producción no verificado en esta sesión. |

## 8. Riesgos y pendientes

| Pendiente | Quién | Bloquea |
|---|---|---|
| Revisión docente de preguntas y escucha de audios; pasar a `APPROVED`/`PUBLISHED` lo que se use | Docente | Uso con candidatos reales |
| Autorizar la liberación (hoja nueva, propiedades, `clasp push`, versión) | **Leonardo** | Integración real |
| Grabar con docentes el audio que se publique, o aceptar voces sintéticas | Leonardo / docentes | Calidad de Listening |
| Conectar menú y `F96_LAZY` tras la liberación del backend | Claude | Acceso desde el Campus |
| Partición de `CERT_RESPONSES` si supera ~50.000 filas (cada escritura recorre la tabla) | Claude | Escala más allá del piloto |

Riesgos: contenido sin revisar; voces sintéticas; despliegue CORE (mitigado: apagado por defecto y sin cambios en funciones existentes); expectativa de “puntaje” que el laboratorio no da (no hay conversión a 10–990 y los resultados no son oficiales).

## 9. Referencias y marca (resumen)

ETS (muestras oficiales, TOEIC Test App), Sample Test del Centro Cultural y British Council: **enlazar**, no copiar. H5P: descartado en v1. `kdeppaei/toeic-question-ocean` (MIT): ideas de validación, sin importar banco. `seikaikyo/toeic-practice`: código propietario, descartado. Marca: nombre *Exam Prep Lab*, TOEIC® con aviso “no respaldado ni aprobado por ETS”, sin logos de ETS ni del Centro Cultural. Voz: Web Speech API descartada para examen; Kokoro para borradores; grabación docente recomendada para lo publicado.
