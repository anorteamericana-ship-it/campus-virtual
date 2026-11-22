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

## 10. Integración local controlada — 20 de noviembre de 2026

**Corte E1 local Windows, sin despliegue ni datos reales.** Esta sección actualiza el estado de integración sin reemplazar la matriz editorial anterior.

- Equipo autorizado mediante Remote Desktop Commander: `DESKTOP-9U2RJRG`; trabajo aislado dentro de `C:\Users\leodr\Documents\CampusVirtual`.
- Se validó el ZIP `exam_prep_lab_entrega_20261119.zip` (13.571.111 bytes, SHA-256 `4463608CBAE875A79C8B3FE018C3A1DB20F670F61654A712A3A8ED8384C7CDA5`) y ambos bundles de Git.
- **Frontend local:** `F111_HIST_FRONT_20261117`, rama `feat/exam-prep-lab-integration-20261120` sobre `main fea9caa6401b5741495c97cc7734c44cceeefd55`; cherry-pick del paquete: `b74844529cb4e63f2b4b4a0828fb0fbfdf405287`, que agregó 151 archivos sin modificar los existentes de `main`.
- **Backend local:** `F111_HIST_BACK_20261117`, misma rama de integración sobre `main 7ef0f88c8558a1c963346f6919cdafab1ff43c5b`; cherry-pick `b211996e22c1cb4a4add1033b21e350ecd61f134` (7 archivos nuevos; `prod/` intacto); corrección de portabilidad QA Windows: `c4f39f787b0df49e43d78ee6fb4d5c6f65cd49ff`.
- Incidencia Windows: `tests/qa_cert_prep_lab_e1.mjs` construía una ruta inválida `C:\C:\...` usando `new URL(import.meta.url).pathname`. Se cambió solo esa resolución por `fileURLToPath(import.meta.url)` y la suite backend pasó sin variar exigencias.
- Incidencia del frontend E1: navegación asíncrona concurrente tras recargar podía dejar visible una pantalla anterior y ocultar «Continuar». Se serializaron los cambios de ruta, priorizando el destino más reciente, en `prototipos/exam_prep_lab/epl_app.js`. El test Reading conserva la misma validación de respuestas y tiempo, esperando primero el render de pantalla. Las pruebas 06 y 12 se repitieron **5/5 cada una**, sin fallos.
- **QA final local con usuarios ficticios: 116/116 PASS (100 %)** — motor 28/28, multimedia 15/15, servidor 26/26, navegador 23/23 (corrida completa final), integración en navegador 4/4, backend 20/20. Los 112 audios se comprobaron con ffprobe, sin escucha humana. Chromium/Playwright instalado solo como dependencia de desarrollo local.
- **Pendientes reales**: 400 preguntas `DRAFT`, 0 revisadas, 0 aprobadas o publicadas; 112 audios sin revisión auditiva humana; E2/E3/E4 y sesiones/hojas reales no probadas; `F96_LAZY` y menú del Campus no conectados; propiedades `CERT_PREP_*`, hoja nueva y router de Apps Script no liberados.
- **Gobernanza**: cero `git push`, cero PR remoto, cero `clasp push`, cero merge, cero deploy, cero cambios en `prod/`, APOLLO, F111 o datos de estudiantes. El siguiente hito es revisar el diff local y preparar PR en borrador cuando se autorice publicarlo a GitHub; posteriormente, revisión editorial de contenido y liberación controlada, sin depender de una fecha de examen.

## 11. Entrada Superadmin para revisión en el Campus — 20-nov-2026

**Esta sección describe el cambio en rama y NO equivale a despliegue confirmado.** Dirección autorizó subir la rama y solicitar entrada separada del menú de juegos, disponible únicamente para el rol real `superadmin`, simulando la experiencia de estudiante sin exponerla en el menú de docentes, estudiantes o admin ordinario.

- La entrada `exam_prep_lab`, rotulada **Exam Prep Lab · TOEIC** y marcada **Revisión**, se incorpora solo cuando `esSuperadmin` en el grupo «Control del sistema» (`src/sidebar.jsx`). El mapa del Campus `src/app.jsx` usa `rolReal === 'superadmin'`, con `NoAutorizadoCampus` para otros roles.
- La pantalla `src/exam_prep_lab.jsx` aplica un segundo chequeo a `getSesion().rol` y abre **sin duplicar archivos** el prototipo existente `prototipos/exam_prep_lab/index.html?review=superadmin`. Inicia automáticamente con **Ana Demo (estudiante ficticia)**. No activa el backend productivo, notas, pagos, estudiantes ni permisos reales.
- La vista independiente no permite abrir la revisión en una ventana directa; en el dominio publicado comprueba el origen y el contexto de iframe del Superadmin. **Importante:** esta barrera es frontend, no confidencialidad del banco. `campus-virtual` es un repositorio **público** y los scripts/medios estáticos son descargables directamente. No habilitar cuentas reales, no describirlos como privados o protegidos por backend. El contenido académico solo tendrá un acceso realmente privado cuando se sirva a través de la API con control de sesión y autorización del servidor.
- QA local dedicado `qa_superadmin_preview_e1.mjs`: **6/6 PASS** (acceso directo de revisión bloqueado, estudiante/docente/admin sin iframe, Superadmin abre como Ana Demo y mapa condicionado por rol).
- Se agregaron parámetros de caché a `campus.html` para `sidebar.jsx` y `app.jsx`. Sin cambios en English LAB, módulo F111 oficial ni `prod/` Apps Script.
- La liberación frontend puede exhibir esta **revisión E1 ficticia** al Superadmin, no representa E2/E3 autenticación de usuarios reales ni validación auditiva/editorial; contenido **400/400 DRAFT, 0/400 aprobado**.
- Antes de habilitar candidatos externos o afirmar exclusividad real: mover preguntas/claves detrás de `certPrepApi` con `CERT_PREP_ENABLED`, `CERT_PREP_DB_ID` separado, revalidar backend publicado sin modificar otros módulos y hacer una prueba autenticada de rol. No desplegar `prod/` desde un checkout histórico, ni utilizar la carpeta de clasp de QA como producción.

## 12. Diagnóstico público completo, rama única — corte 20-nov-2026

**Objetivo aprobado:** `https://anorteamerican.com/diagnostico-ingles`, sin usuario/contraseña; nombre solamente, saludo personalizado, 25 preguntas iniciales, clasificación cualitativa **orientativa** (no MCER/CEFR certificado ni puntaje TOEIC), invitación a continuar hasta 400 preguntas únicas (formas A y B de 200), 112 audios, simulacros, resultados y reporte de incidencias por pregunta/audio para un grupo de familiares QA. No distribuir mientras falten puertas.

**Implementación LOCAL sobre el mismo checkout/repo sin copias:** rama `feat/epl-public-review-20261120` del frontend `F111_HIST_FRONT_20261117`, iniciada sobre `main 90214d1672c8798e59b27e99a4f07df7fb322769`. Carpeta nueva `diagnostico-ingles/` dentro del mismo repositorio. Reutiliza `prototipos/exam_prep_lab/` (sin duplicar formas, claves, audios ni imágenes).

**Experiencia:** portada de nombre; `crypto.randomUUID` por persona (dos Andrea no comparten expediente), perfiles recordados y seleccionables en el MISMO navegador por localStorage; cambiar de participante no borra otros. No hay recuperación cross-device ni cuenta real: **no anunciar recuperación en otro celular**. Diagnóstico público planificado a 25 (2+4+3+3+5+4+4) de las 7 partes; panel y CTA para iniciar, feedback de nivel aproximado y botón para continuar, navegación autónoma por A/B y las partes 1–7, bloques de hasta 15 (agrupados por diálogo/audio, pueden sobrepasar ligeramente 15), resumen de cobertura exclusiva por ID de pregunta `400/400`, menú y simulacros completos opcionales. Sin fechas de examen impuestas. `data-act=qa-report` reporta item_id, forma/parte y observación contextual; reintentos pendientes localmente si no hay receptor. UI móvil adaptativa.

**Regresiones y pruebas verificadas:** `qa_public_e2.mjs` 12/12 PASS (nombre, diagnóstico 25, formas 2×200, feedback, continuidad del perfil tras reload, dos participantes en navegador compartido, vuelta al perfil anterior, layout 390 px sin overflow); `qa_400_coverage.mjs` PASS (diagnóstico 25 y 30 bloques para las otras 375, cobertura de 400/400 únicas, 14 secciones A1–B7; duplicidad de nombre con historial aislado); legacy E1 motor 28/28, servidor 26/26, multimedia 15/15, menú Superadmin 6/6 e integración navegador 4/4 PASS. E1 frontend separado sigue intacto en `main`. Las respuestas correctas siguen visibles en JS público, autorizado solo para QA, no proctored/certificación.

**Recepción central independiente:** Apps Script aislado nuevo `AN English Diagnostic Public QA Inbound` script ID `1Ah8-rL0rBttIjDFCjrjUgPI6UrLm7RRkldRE2LNEBQA_WWDndzxkBsEc`. `Code.gs` y `appsscript.json` en `diagnostico-ingles/backend`, consola `clasp` con sus referencias propias. Desplegado deployment ID `AKfycbxZbLBU7ocWPufrwDeskGo5BjFYfOTYqqYuhM0Es3icYH93nvfRKSQ0_6tsNJfkIR7S0A` @2. Solo scope `https://www.googleapis.com/auth/spreadsheets`; intended Google Spreadsheet PRIVADO autónomo, pestañas `PARTICIPANTES` y `OBSERVACIONES`, escritura anónima solo event/profile/progress/issue, sin API de lectura pública ni conexión con APOLLO. **BLOQUEO CONFIRMADO:** GET webapp respondió HTTP 403, Google requiere autorización OAuth del propietario del nuevo script. En Chrome quedó aviso Google «no verificó esta app». NO otorgar permisos sin revisión/aprobación humana. Debe autorizarse y ejecutar `setupQaDatabase` UNA VEZ en editor, luego probar HTTP GET (storage_ready true), POST y CSV/hoja con usuarios ficticios, idempotencia, permisos de hoja, CORS en browser. No afirmar recepción central confirmada aún.

**Ruta WordPress:** `anorteamerican.com` raíz es WordPress; `/diagnostico-ingles` NO EXISTE aún. El navegador de la computadora fue redirigido al login de `wp-admin` (sin sesión). Se sugirió conexión del plugin WordPress desde ChatGPT. Por tanto no publicar/entregar enlace final hasta que se cree redirección o página permanente que conserve el slug y enlace a `/campus-virtual/diagnostico-ingles/` (en GitHub Pages, después de merge aprobado). Sin WordPress conectado o sesión WordPress autorizada no puedo activar ese enlace.

**Gobernanza/pendientes:** E1 campus live Superadmin no alterado, backend CORE/QUIZ no alterado. Nuevo inbound es Script/hoja QA SEPARADOS. No merge ni despliegue público del frontend ni mensaje a sobrinos. Abierto solo para QA de borradores, no impartición académica oficial. Seguridad: nombres mínimos, ningún dato sensible, visibilidad pública de código/keys, no protección examen, no recuperación multidevice; recomendar participación con autorización de encargados si menores. Ningún contenido DRAFT se convierte automáticamente en APPROVED/PUBLISHED por resultados automáticos; docentes deben evaluar incidencias de audio/clave. La fecha de eventual entrega depende de las pruebas, no de estimaciones.

**Puertas de aceptación (6):** G1 inventario/código fuente 400+112 (PASS); G2 portada, perfiles, diagnóstico 25 y UX móvil (PASS 12/12); G3 continuación A+B 400 únicas (PASS); G4 receptor y tablero central con reportes reales ficticios (BLOQUEADO OAuth/GET403); G5 URL WordPress `/diagnostico-ingles` y HTTPS/móvil real (BLOQUEADO conexión WordPress); G6 QA E2E final en dominio real y revisión del mensaje/instrucciones sin preguntas (PENDIENTE). NO DISTRIBUIR hasta G1–G6 PASS.

## 13. Verificación de acceso y receptor QA — 20-nov-2026 (Costa Rica)

**G4 PASÓ.** El propietario habilitó acceso Google al proyecto independiente y se ejecutó `setupQaDatabase` en el editor nuevo con registro `QA DATABASE READY: ACADEMIA NORTEAMERICANA - DIAGNOSTICO INGLES - QA` y ejecución completada. GET `/exec`: HTTP 200, `ok:true`, `storage_ready:true`. El archivo real está en Google Drive, **privado**, título `ACADEMIA NORTEAMERICANA - DIAGNOSTICO INGLES - QA`, ID `1_CHMVVFWEd6x9DckTN-oWkqX4VYUMGWeHLmrusI7oCo`, con pestañas `PARTICIPANTES` (sheetId 0) y `OBSERVACIONES` (sheetId 710105877), encabezados y primera fila congelada.

**Pruebas de escritura:** POST `profile` devolvió `ok:true,received:profile`; POST `issue` devolvió `ok:true,received:issue`; repetir el mismo `event_id` devolvió `ok:true,duplicate:true`. Se leyó directo de Sheets y se verificó **una sola** observación sintética `16cbf2b9-f01e-46df-8b5a-18de070e67bf` para `A-P1-01`. **Prueba real de interfaz:** Chromium abierto desde página local `/diagnostico-ingles/`; participante ficticio `QA Integracion`, clic en comenzar diagnóstico, `¿Algo está mal? Reportalo`, categoría texto, comentario QA; cliente recibió HTTP 200, reporte local pasó a `synced:true`, **0 HTTP errors**, y se verificó en hoja central la nueva observación `0f4409b2-06ed-4758-8c6b-ec4d3178a284` para ítem `A-P1-02`. Estos dos registros **son pruebas técnicas, NO errores editoriales reales**; separarlos del trabajo humano.

**G5 NO PASÓ.** La URL pública corta `https://anorteamerican.com/diagnostico-ingles` todavía no tiene página/redirect comprobado y el Chrome del usuario abre `https://anorteamerican.com/wp-admin/` en `Log In`; WordPress de ChatGPT muestra `installed:false`. El contenido frontend continúa solo en PR #800 **DRAFT**; nada fusionado ni enlazado desde el sitio. No compartir enlace aún. G6 E2E en dominio real sigue pendiente. **Puertas: 4/6 PASS (66,7 %)**, G5 bloqueada y G6 pendiente.

**Continuidad:** Un único repo `F111_HIST_FRONT_20261117`, rama `feat/epl-public-review-20261120`, PR https://github.com/anorteamericana-ship-it/campus-virtual/pull/800. No repetir QA de los 400, del diagnóstico 25 o de recepción central salvo cambio de código; retomar G5 autenticación WordPress y luego G6. No confundir con despliegue F111 productivo.


## 14. Aceptación del diagnóstico público familiar QA — 21-nov-2026, Costa Rica

**ESTADO ACTUAL: G1–G6 6/6 PASS (100%) para piloto de control de calidad familiar.** Este corte reemplaza los bloqueos históricos de G4–G6 descritos en las secciones 12–13; no constituye revisión ni certificación académica de los 400 ítems DRAFT ni escucha humana de los 112 audios sintéticos.

**URL FINAL:** https://anorteamerican.com/diagnostico-ingles/ (WordPress página 8277 publicada, slug exacto diagnostico-ingles, plantilla Elementor Canvas). HTML único con iframe de pantalla completa hacia /campus-virtual/diagnostico-ingles/?v=3fbe8b5. CSS específico body.page-id-8277 oculta únicamente aquí el widget Chaty WhatsApp que interceptaba el botón de corrección; en homepage Chaty permanece intacto.

**Versiones GitHub Pages:** PR #800 (diagnóstico 25 + 375, 400 en total) squash 0ad366268e8453300deee16fa97e16f8f2b9de27, Pages SUCCESS 44873004969. PR #801 (espera escrituras de respuestas antes de Revisar, solo publicQA; no Superadmin) squash 334321f4d48ccbb3713d08e36524411b870843a5, Pages SUCCESS 44874163394. PR #802 (invalida caché de JS del dominio: epl_app.js?v=334321f4) squash 3fbe8b56cd1b40f0755be053d8140294d025efe5, Pages SUCCESS 44874324474. No se editó Apps Script CORE/QUIZ del Campus, APOLLO ni datos académicos reales.

**E2E REAL contra URL WordPress, sin sustituir código ni estilos:** GET 200; iframe correcto y JS versionado; Chrome automatizado respondió y revisó **25/25 preguntas** del diagnóstico en **15 unidades**, mostró resultado porcentual y nivel *orientativo*, botón de continuación hacia las 400, abrió siguiente bloque, y tras recarga recordó el perfil ficticio. Cero excepciones JavaScript. Solicitudes net::ERR_ABORTED de audios precargados al cambiar de pregunta/recargar son cancelaciones intencionales de stopAudio, no una pérdida de archivos. Prueba móvil real 390x844: sin overflow; responder/revisar y enviar observación contextual de A-P1-02 con synced:true, 0 fallos de red no relacionados con cancelación.

**Cobertura técnica:** test motor 25+375 respondió **400/400 preguntas únicas A+B**, distribuidas en 14 partes; 12/12 de UX/perfiles; dos personas con mismo nombre no comparten UUID/historial en navegador; **112/112 MP3** accesibles por HEAD HTTPS, URLs distintas y MIME audio/mp3 (calidad auditiva humana PENDIENTE). El dominio principal conserva otros sitios y herramientas ajenos al diagnóstico.

**Recepción central:** Apps Script aislado, GET storage_ready:true, POST profile/issue real y idempotencia PASS; recepción verificada en la hoja privada https://docs.google.com/spreadsheets/d/1_CHMVVFWEd6x9DckTN-oWkqX4VYUMGWeHLmrusI7oCo/edit con pestañas PARTICIPANTES y OBSERVACIONES. Las primeras seis incidencias creadas por pruebas de ingeniería quedaron clasificadas explícitamente en OBSERVACIONES!K2:K7 como PRUEBA_TECNICA (lectura posterior PASS), de modo que los reportes futuros PENDIENTE no se mezclan con fallas ficticias.

**LÍMITES IMPORTANTES:** 400/400 ítems continúan DRAFT, 0 aprobados editorialmente; 112 audios sintéticos no revisados humanamente; banco y claves consultables en JS estático público, aceptado solo para QA familiar, jamás examen oficial/proctored ni puntaje TOEIC ni CEFR acreditado. No hay cuentas ni contraseñas; el identificador y el progreso se recuperan únicamente desde el mismo navegador (sin recuperación entre dispositivos). No pedir cédulas ni correos de menores. Cada voluntario debe poder empezar con su primer nombre, completar 25, ver resultado orientativo, continuar a las 400, y reportar problemas en contexto. La publicación está APTA PARA COMPARTIR como piloto interno/familiar, NO como evaluación certificada. No repetir suites cerradas salvo cambios funcionales.



## 15. Pasada editorial y multimedia previa a revisión familiar — 21-nov-2026

**Estado:** realizada auditoría interna del banco completo antes de compartirlo. **400/400 ítems rastreados a sus formas, textos, diálogos y respuestas indicadas; 612/612 controles automáticos de integridad PASS** con el nuevo test reproducible `prototipos/exam_prep_lab/tools/qa_editorial_400.mjs`. Se revisaron los contextos y las respuestas claves en ambas formas, pero esto **NO acredita revisión independiente por un docente ni validación por hablantes reales**; conservar `review_status:DRAFT` para los 400 y `human_review:PENDIENTE` para los 112 audios.

**Correcciones editoriales localizadas en archivos fuente (FORMA B, compilado regenerado por `tools/build_bank.mjs B`):**
- `B-P2-18`: explicación de «It was a gift from my brother» corregida: es respuesta indirecta porque no lo compró; no presumir que desconoce la tienda.
- `B-P5-14`: ejercicio de contables «few seats» casi equivalente al A-P5-17 sustituido por cuantificador **incontable** «a great deal of information»; nuevas opciones, clave y análisis de distractores.
- `B-P5-15`: primer condicional de envío casi equivalente a A-P5-28 sustituido por ejercicio autónomo de `professional references`, con clave y distractores nuevos.
- `B-G7-12-Q5`: «regularly» ajustado a «routinely», no necesariamente «frequently»; explicación más precisa.

**Audios:** 112/112 MP3 referenciados e íntegros por SHA-256, duración y guion `text_sha` según `qa_media.mjs` 15/15 PASS; los 112 se decodificaron y analizaron por volumen (≈67 min en conjunto). Un pico aislado en `B-G3-04`: en decodificación a tasa original apareció **1 muestra / 1.452.048** apenas por encima de amplitud 1.0 (máx. 1,0186), sin una sección prolongada de saturación; no se re-encodeó el audio ni se modificó su SHA. **No se hizo escucha perceptiva integral**, por lo que la naturalidad, acentos, inteligibilidad, pronunciación y acople temporal fino siguen pendientes de oyentes reales.

**Imágenes:** 12/12 ilustraciones vectoriales de la Parte 1 inspeccionadas en hoja de contacto, comparadas con la respuesta indicada. Son ilustraciones, **no fotografías realistas**; por lo tanto el material es piloto preparatorio, no una reproducción oficial de TOEIC.

**QA regresión tras las cuatro correcciones:** `qa_editorial_400.mjs` 612/612, `qa_media.mjs` 15/15, `qa_engine.mjs` 28/28, `qa_server.mjs` 26/26, `diagnostico-ingles/qa_400_coverage.mjs` 400/400 cobertura (25 + 375, 14 partes), `diagnostico-ingles/qa_public_e2.mjs` 12/12 perfiles y UX. Son pruebas técnicas, **no 400 aprobaciones académicas**. Las suites heredadas `qa_e1.mjs` y `qa_integration_e1.mjs` fallaron al lanzar el navegador Playwright no instalado en ese entorno; no contarlas como aprobadas ni confundir ese fallo de infraestructura con un defecto del banco. El recorrido Chrome real publicado ya había pasado 25/25 en el corte 14; repetir el punto de regresión B luego del despliegue de esta pasada.

**Pendiente antes de anunciar el curso como examen validado:** escucha humana de 112 clips, revisión docente independiente de las 400 preguntas y distractores, evaluación de calidad de ilustraciones vs fotografías. La evaluación de la familia debe registrar esas observaciones **sin modificar las calificaciones de estudiantes reales**. No elevar automáticamente los 400 a `APPROVED`; los cambios de esta pasada se limitan a contenido, QA y documentación. Mantener el enlace WordPress público como **piloto interno de control de calidad**, no compartirlo aún con los familiares hasta terminar publicación y QA en URL real de las modificaciones.


## 16. Despliegue y verificación real de correcciones editoriales — 21-nov-2026

**PR #804 fusionado:** https://github.com/anorteamericana-ship-it/campus-virtual/pull/804, commit de main 00e3ac7eb637c7068a667afc4874f6cfc3f95bd0. GitHub Pages, workflow 44943521432: SUCCESS. Archivo público de Forma B versionado con form_b.js?v=editorial-20261121; caché de iframe WordPress página 8277 invalidada con ?v=editorial-20261121. WordPress indicó «Página actualizada». Se confirmó que el HTML y JavaScript publicados son los nuevos, no una copia en caché.

**Prueba independiente Chrome sobre la URL pública https://anorteamerican.com/diagnostico-ingles/ (sin interceptación ni sustitución de código):** HTTP 200; las cuatro correcciones verificadas en los datos reales cargados del banco B (B-P2-18, B-P5-14, B-P5-15, B-G7-12-Q5). Diagnóstico completado con 25 respuestas reales en 15 unidades, todas revisadas, resultado desplegado, continuación abierta a otro bloque y perfil conservado tras recargar: PASS. **Cero excepciones JS y cero errores de red no relacionados con cancelaciones normales del reproductor.** En móvil 390x844, entrada y revisión de primera pregunta PASS, sin scroll lateral, Chaty oculto solo en el diagnóstico, cero excepciones JS.

**Cierre prepiloto:** 400 preguntas cubiertas y 612/612 comprobaciones de integridad; 112/112 MP3 íntegros y decodificados; 12 ilustraciones verificadas; cuatro correcciones editoriales; cero regresiones detectadas en el recorrido probado. **Se puede facilitar a familiares como piloto para que aporten la revisión humana**, con la salvedad explícita de 0/400 aprobaciones formales por docente y 0/112 audios escuchados integralmente por un revisor humano. No se debe llamar al material examen TOEIC aprobado ni diagnóstico académico validado. Los próximos hallazgos deben anotarse por item_id y resolverse en la única fuente de contenido.


## 17. Control pre-humano: transparencia de datos y reproducción móvil — 21-nov-2026

**Hallazgo de transparencia:** el aviso de privacidad publicado decía «Solo pedimos tu nombre para saludarte», pero la página realmente también envía el nombre, el resumen del avance y los reportes de incidencias a un Google Sheet interno del piloto, mediante `diagnostico-ingles/public.js` (`profile`, `progress`, `issue`). El avance detallado se conserva localmente en el navegador, no entre dispositivos. Se corrigió el texto de `diagnostico-ingles/index.html` para explicar el envío de datos, la finalidad de calidad, el límite del progreso local y la prohibición de consignar cédulas/correos/datos sensibles. El motor de recolección no se modificó.

**Audio móvil:** Playwright Chromium emulando 390×844 con política de reproducción que requiere gesto; el participante inició diagnóstico y pulsó `Escuchar` de una pregunta real. Red de producción: `A/A-P1-02.mp3` HTTP 200 (`audio/mp3`). Promesa real `HTMLMediaElement.play()` **resuelta** con `readyState=4`, texto del reproductor «Reproduciendo… (1 de 3)»; **0 errores JavaScript**. Se trata de reproducción funcional en Chrome móvil emulado, NO una prueba en Safari/iPhone físico ni una escucha perceptiva de las voces. No contar reproducción de audio como prueba auditiva humana.

**Criterio de cierre:** antes de compartir a menores, que familiares o responsables conozcan que se guardan el nombre, progreso general y observaciones; no solicitar identificadores ni información sensible. Las 400 preguntas siguen DRAFT y la prueba no ofrece calificaciones oficiales. Esta pasada no reabre suites técnicas ya certificadas; el objetivo es resolver un punto ciego real de transparencia y comprobar el audio con interacción efectiva.


## 18. Auditoría pedagógica pre-humana: validez del diagnóstico y robustez de QA — 21-nov-2026

**Fuente de verdad:** código y banco reales de `prototipos/exam_prep_lab`, interfaz `diagnostico-ingles`, contraste con ETS (https://www.ets.org/toeic/about/listening-reading.html) y MCER/Consejo de Europa (https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions). **No crear examen alternativo ni confundir categorías internas B1/B2/I1/I2 con niveles MCER**.

**Evaluación académica del banco:** 2 formas de 200, distribución oficial 6/25/39/30 Listening y 30/16/54 Reading por forma; 400 preguntas únicas, 84 grupos, 12 ilustraciones vectoriales y 112 MP3 sintéticos. Esta coincidencia de estructura **no equivale a acreditación TOEIC ni a equivalencia de puntuaciones**. Los ítems siguen DRAFT; la rúbrica automática comprueba campos/IDs/una clave/explicaciones presentes y correspondencias técnicas, NO la validez semántica, fiabilidad, discriminación ni calibración psicométrica. TOEIC L&R no mide habla ni escritura; la Academia no debe usar 25 reactivos como evaluación oficial de los cuatro niveles de inglés conversacional.

**Tres defectos reales del material detectados y corregidos en fuente y artefactos generados B**:
- `B-P5-14`: daños de codificación `?Information?` y tema `atenci?n al cliente` → comillas tipográficas y «atención al cliente».
- `B-P5-15`: `r?sum?`, `despu?s` y comillas dañadas en explicaciones → `résumé`, «después» y puntuación correcta.
- `B-P5-29`: «The construction of the new bridge will reduce travel time» presentaba relación causal engañosa. Cambiado a «The construction of the new bridge is expected to begin in March». Clave A y distractores conservados, contexto coherente.
- Añadido control regresivo `BROKEN_TEXT_ENCODING` y `SEMANTIC_CONSTRUCTION_REGRESSION` en `tools/qa_editorial_400.mjs` para evitar reincidencias de fuente mal codificada. Fuente `content/form_b_2_reading.src.js` y ambos archivos generados `forms/form_b.js/.json` consistentes.

**Diagnóstico público:** antes plan [2,4,3,3,5,4,4], después [1,3,6,3,4,4,4] por Partes 1–7: total **25**, con **13 Listening + 12 Reading**, cubre todas las partes y da mayor representación a conversaciones P3. P6 exige bloques de cuatro preguntas y P7 continúa subrepresentada respecto del examen oficial; **no es muestra estadísticamente calibrada**. Las etiquetas arbitrarias «Intermedio»/«Reto avanzado» se sustituyeron por **bandas de acierto «en esta muestra»**; permanece aviso de NO equivalencia CEFR/TOEIC. El examen muestra explicaciones por bloque y permite repetir audio en prácticas, por lo que el resultado puede estar influido por retroalimentación: **es práctica diagnóstica formativa, no examen sumativo de nivel**. Texto de bienvenida aclara 25 **dentro de** 400 y acceso a 375 posteriores.

**Inclusión y consentimiento:** imágenes Parte 1 son SVG ilustrativos y el alt público ahora las llama **«Ilustración»**, no fotografías; aún no hay adaptación justa para personas con discapacidad visual, porque revelar descripción previa permitiría inferir la respuesta. La entrada explica que perfiles sin contraseña se guardan en el mismo navegador; se agrega aviso para solicitar autorización de responsables si son menores y contacto a canales oficiales por datos. No pedir cédulas/correos ni anunciar recuperación entre dispositivos. El laboratorio público tiene claves en JavaScript cliente: aceptable solo para QA formativa sin supervisión, no válido para prueba segura oficial.

**Confiabilidad del usuario:** `diagnostico-ingles/public.js` impide envío doble de reportes mediante `sendingReport` + `reportSubmitted` hasta cerrar modal, reenvía reportes offline cuando se reabre un perfil y evita crear silenciosamente un expediente nuevo si el nombre coincide con uno almacenado; invita a recuperar el perfil existente o usar apodo si realmente es otra persona homónima. Se recupera foco al cerrar diálogo. El identificador UUID, no el nombre, mantiene los expedientes separados. Sigue pendiente experiencia real Safari/iOS, límite de almacenamiento local, accesibilidad de teclado/lector de pantalla, y protección de identidad en navegadores compartidos: NO son accesos privados.

**QA ejecutado sobre rama antes del merge:** `node --check` de JS público, app, forma B y prueba browser PASS; `qa_editorial_400.mjs` **612/612** comprobaciones, **400/400** ítems únicos, 84 grupos; `qa_400_coverage.mjs` **400/400** (25 iniciales + 375 posteriores), 14 secciones y homónimos aislados; `qa_public_e2.mjs` **17/17** incluye reenvío offline, doble-submit, nombres acentuados, colisión de nombre y móvil 390px; `qa_media.mjs` **15/15**, `qa_engine.mjs` **28/28**, `qa_server.mjs` **26/26**. Recorrido real de Chrome móvil emulado **25/25** con nueva distribución, 13 unidades, resultado por muestra y CTA, sin excepciones JS. Los 112 archivos de audio pasaron integridad/decodificación en el corte anterior, pero **0/112 escuchados y aprobados humanamente**. No presentar esto como `400/400 editorialmente aprobados`: permanece **0/400** con revisor docente independiente.

**Publicación:** cambios separados de CORE/QUIZ productivo, APOLLO y estudiantes; mantener código en una rama/PR hasta que QA esté satisfactoria. Después de integrar, se debe comprobar deployment GitHub Pages, invalidar caché de WordPress iframe (página 8277) y verificar nuevamente el dominio real `https://anorteamerican.com/diagnostico-ingles/`. Solo después ofrecerlo como **piloto de revisión humana**, no como examen certificado.


## 19. Auditoría pedagógica pre-humana publicada y certificada en dominio real — 21-nov-2026

**Estado de fuente única:** la sección 18 sigue válida en cuanto a diseño y límites. PR #807, "EXAM PREP — Auditoría pedagógica", fusionado en main commit `9cedb863b7f988014ed15e77a21551247ba653c7`, GitHub Pages workflow `44964176749` SUCCESS. PR #808, hotfix de caché, fusionado main `cc55a3f89b71c33371e8b1906ad389cba2023c9d`, GitHub Pages workflow `44964357226` SUCCESS.

**Incidencia de despliegue solucionada:** inicialmente WordPress abría un HTML con plan nuevo pero la CDN del dominio almacenaba `form_b.js?v=pedagogy-20261121` anterior: `r?sum?`, comillas dañadas y puente con causalidad incorrecta. Se INVALIDARON explícitamente las referencias a `form_b.js?v=live-9cedb86-20261121`, `epl_app.js?v=live-9cedb86-20261121`, `public.js?v=live-9cedb86-20261121` desde PR #808 tras deploy. WordPress página 8277 guardó iframe hacia `?v=final-cc55a3f-20261121`; la caché de HTML exterior todavía podía mostrar un token anterior `?v=editorial-20261121`, pero el documento interno servido a ese token ya referenciaba **los tres activos finales correctos**.

**Prueba E2E sin modificar/cambiar respuesta del servidor:** Chrome móvil emulado (390×844) abrió URL WordPress pública HTTP 200, inspeccionó DOM interno y leyó forma B 200 preguntas con `B-P5-14` explicación UTF-8 correcta, `B-P5-15` `résumé` correcto y `B-P5-29` «is expected to begin in March». JS real con los tres parámetros `live-9cedb86-20261121` confirmado. Diagnostic 25/25 contestado y corregido mediante clics públicos, 13 unidades repartidas [1,3,6,3,4,4,4]; se vio resultado con «muestra» y no equivalencia MCER; botón siguiente bloque abrió práctica real; al recargar, mismo perfil persistió. Ancho 390px, scroll 390px (cero overflow horizontal), **cero excepciones JavaScript**, salida test 0. Prueba usó nombre sintético `QA Auditor` y bloqueó solo envío de telemetría al receptor de Sheets mediante interceptación de red del test, para no contaminar con datos falsos la hoja de participantes; ni el código ni el banco se interceptaron o sustituyeron.

**Regresiones certificadas antes de integrar:** `tools/qa_editorial_400.mjs` 612/612 PASS y `qa_400_coverage.mjs` 400/400 únicos, `qa_public_e2.mjs` 17/17 PASS, `qa_media.mjs` 15/15, `qa_engine.mjs` 28/28, `qa_server.mjs` 26/26. Formas 200+200, 84 grupos, 12 SVG, 112 MP3 decodificables/integridad técnica; **0/400 ítems aprobados por revisor docente independiente y 0/112 audios escuchados perceptivamente de principio a fin**, no usar técnica como acreditación editorial.

**Dictamen:** Apto técnicamente para **piloto humano/familiar de revisión del material** con aviso de finalidad, autorización de responsables cuando corresponda y observaciones contextualizadas por pregunta, **no** para certificar nivel TOEIC/MCER, tomar decisiones de ubicación académica, publicar puntuaciones oficiales ni sugerir que Listening+Reading mide oralidad. El diagnóstico es **formativo con explicación por bloques y audio repetible**, no examen estandarizado sin ayuda. Perfiles locales sin contraseñas no son privados ni recuperables automáticamente entre equipos. Limites pendientes: pruebas Safari/iPhone físico y lectores de pantalla, revisión humana de los 400 ítems/112 audios y eventual calibración de dificultad/discriminación con participantes. No enviar mensajes a menores ni darles la URL automáticamente.


## 20. TOEIC 4-Skills virtual — primera ampliación operativa de Speaking y Writing (21-nov-2026)

**Decisión de producto:** Academia Norteamericana prepara las cuatro habilidades Listening, Reading, Speaking y Writing en modalidad virtual. Esto no convierte a la Academia en certificadora de ETS ni determina cómo se administrará la prueba oficial.

**Fuentes oficiales verificadas:**
- ETS Speaking & Writing: https://www.ets.org/toeic/about/speaking-writing.html — Speaking: 11 preguntas (~20 minutos), Writing: 8 preguntas (~60 minutos), distribuidas en 5 y 3 tipos de actividad respectivamente.
- ETS Global TOEIC 4-Skills: https://www.etsglobal.org/tf/en/test-type-family/toeic-4-skills-tests — el integrado utiliza Listening adaptativo 45 preguntas en 25 min + Reading adaptativo 45 preguntas en 37 min + Speaking 11 tareas en 20 min + Writing 8 tareas en 60 min (~2h22). **El banco actual 200 preguntas lineales por forma sigue siendo práctica útil, pero no es la simulación del integrado 4-Skills.**
- ETS Score User Guide Speaking/Writing: https://www.ets.org/content/dam/ets-org/fr/pdfs/toeic/score-user-guide-speaking-writing.pdf — criterios por grupo: pronunciación, entonación, gramática, vocabulario, cohesión, relevancia, organización y soporte de opinión. Los puntajes 0–200 son oficiales de ETS, no del laboratorio.
- Centro Cultural Costa Rica: https://pruebasinternacionales.centrocultural.cr/TOEIC_Speaking_Writing2.html — opción virtual con requisitos de computadora, conexión estable, espacio privado e identidad.

**Implementación Fase 20A:** nueva ruta web de práctica original /campus-virtual/toeic-4-skills/ (index.html, style.css, tasks.js, app.js, qa_four_skills.cjs). Link desde /campus-virtual/diagnostico-ingles/. No altera F111 CORE/QUIZ, evaluaciones de alumnos, cobros ni Apps Script. Sin copyright de contenido oficial: consignas creadas para Academia Norteamericana, fotos ilustrativas SVG ya existentes propias.

**Speaking (11/11 actividades originales):** 2 read aloud, 2 describe a picture, 3 respond to questions, 3 respond using provided schedule, 1 express an opinion. Temporizadores por consigna: 45/45, 45/30, 3/15 o 3/30, 45/15 y 3/15 o 3/30, 45/60. Los prompts Q8–10 son **escritos**, no grabaciones de preguntas con locución; por tanto solo práctica formativa, no simulación auditiva fiel. Micrófono opt-in al presionar Grabar, MediaRecorder en browser, audios solo en memoria de la pestaña; se pueden reproducir o descargar. No se cargan ni guardan en servidores ni en localStorage.

**Writing (8/8 actividades originales):** 5 oraciones sobre ilustración con dos palabras requeridas, 2 correos de diez minutos y un ensayo de opinión con tiempo de 30 minutos y referencia de ~300 palabras. Cronómetro compartido de 8 min para preguntas 1–5. Borradores escritos únicamente en localStorage, accesibles desde ese navegador; exportación TXT o eliminación voluntaria. Listas de criterios para autocontrol y revisión docente futura, sin puntajes TOEIC ni equivalencia MCER.

**Privacidad:** No se solicita identidad ni login en S&W en esta fase. No se entrega respuesta al docente ni existe recuperación multidispositivo. Menores deben tener autorización del responsable para activar micrófono. La grabación se borra al recargar/cerrar si no la descargaron; los borradores quedan visibles en el mismo navegador hasta borrarlos, por lo que equipos compartidos requieren cuidado.

**QA local:** 15/15 PASS con Chrome/Playwright sobre servidor localhost, incluyendo HTTP 200, 11+8, navegación, ilustraciones y horario, permiso de micrófono con dispositivo de prueba y grabación reproducible/descargable, drafts después de navegar y recargar, temporizador compartido, exportación TXT, ausencia de POST externos y móvil 390 px sin scroll lateral. Se corrigió redondeo erróneo del temporizador: 7:59 podía mostrarse como 7:00.

**NO TERMINADO:** simulacro L&R adaptativo 25+20 por sección, preguntas inéditas y banco calibrado; prompts auditivos originales de Speaking; almacenamiento seguro y revisión docente de grabaciones con consentimiento/retención/borrado; simulacro S&W fiel y pruebas físicas iPhone/Safari; evaluación humana de las 19 nuevas consignas. Conservar las 400 preguntas L&R para práctica y no mostrarlas como prueba integrada completa.

**Publicación:** primero fusionar por PR protegido, comprobar Pages SUCCESS, abrir ruta HTTPS real y actualizar caché del enlace de WordPress. Hasta ese momento esta fase solo se considera integrada en rama local.
