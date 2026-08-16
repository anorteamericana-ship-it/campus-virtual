# Auditoría integral del Campus Virtual

**Fecha de corte:** 2026-08-16  
**Repositorio:** `anorteamericana-ship-it/campus-virtual`  
**Estado:** auditoría cerrada; remediación y consolidación pendientes  
**Dictamen de publicación/consolidación:** **BLOQUEADO**

## 1. Conclusión ejecutiva

El Campus contiene trabajo valioso y controles recientes bien encaminados, pero hoy no existe una única rama que reúna de forma verificable el Campus, la renovación de English LAB, Memory Match, Speak LAB, los agentes endurecidos y un backend compatible. El estado actual no debe consolidarse ni publicarse como una sola entrega hasta cerrar los bloqueos P1 de seguridad, privacidad y contrato frontend/backend.

Los riesgos principales son:

1. autenticación con contraseñas en texto claro, requisitos débiles y sin defensa observable contra fuerza bruta;
2. documentos de identidad y otros archivos guardados con enlaces públicos, junto con cargas públicas sin límites y sin transacción;
3. English LAB Live permite operaciones de jugador sin sesión, usa códigos cortos y expone la respuesta correcta dentro del estado público de la sala;
4. las cuentas demo no tienen una garantía global de solo lectura;
5. la renovación de English LAB declara 53 endpoints base, pero 43 no existen en el `Code.gs` canónico observado;
6. varias escrituras de Ventas no envían token, aunque el backend canónico lo exige, y `activarEstudiante` tiene un desacuerdo adicional de rol;
7. el frontend se sirve con Babel en el navegador, React de desarrollo y más de 4 MB de JavaScript bloqueante en cada entrada principal;
8. la historia de entrega está fragmentada en 98 ramas remotas y 64 PR abiertos, sin una cabeza canónica de integración.

No se encontró evidencia de explotación. Tampoco se afirma que todos estos defectos estén activos en el `/exec` productivo: el identificador de despliegue vigente de Apps Script no pudo verificarse. Los defectos de código y contrato sí están demostrados en las fuentes auditadas y deben bloquear la siguiente publicación.

## 2. Escala y criterio

| Prioridad | Criterio usado |
|---|---|
| P0 | Incidente activo o pérdida/compromiso catastrófico confirmado. |
| P1 | Riesgo alto de seguridad, privacidad, integridad o bloqueo de una función crítica; impide publicar. |
| P2 | Defecto funcional, de accesibilidad, rendimiento o mantenibilidad con impacto relevante. |
| P3 | Deuda menor, inconsistencia o limpieza sin bloqueo inmediato. |

Ningún hallazgo se elevó a P0 porque no se realizó explotación ni escritura sobre producción y no existe evidencia de incidente activo.

## 3. Fuentes auditadas y límites de evidencia

| Fuente | Referencia auditada | Uso |
|---|---|---|
| `main` | `67108928e953fbf044dbcd916dc34a5dd5f1e570` | base Git conocida, menús, scripts y QA existente |
| Release English LAB | `6379739f502c820e52d32f2ebae84c20c4ae078c` | release anterior y parser de entrega |
| Memory Match | PR #83, cabeza `23207a4e0d61b09974f7e2ec5c34bb17456fc132` | idempotencia y rama divergente |
| English LAB unificado | PR #85, cabeza `49eb9fb8b9286d7de238ba46a0fcf9d07d7d7d8d` | shell nuevo, rutas, juegos, Ventas y pruebas estáticas |
| Speak LAB | PR #104, cabeza `04e65ab2237df047a6ab631f1b7e94560a0cb6b9` | overlay, broker, proveedor de pronunciación y pruebas |
| Agentes endurecidos | PR #105, commit `499d443ae6182a3f6a8d9fad53ffd6419df2d872` | contratos de auditoría, seguridad, rendimiento y consolidación |
| Backend canónico en Drive | archivo `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`, modificado `2026-07-21T16:12:53.556Z` | contrato y seguridad del `Code.gs` observado |
| Superficie pública | `https://anorteamerican.com/campus-virtual/campus.html` | redirección a login, DOM y consola pública |

El `Code.gs` observado tiene 52.570 líneas y 2.971.957 bytes. La documentación del repositorio describe una instantánea anterior de 52.495 líneas, por lo que no se usó ese JSON histórico como fuente vigente.

### No verificado

- qué versión exacta está desplegada detrás del Apps Script `/exec` productivo;
- flujos autenticados reales de estudiante, docente, ventas, admin y superadmin con datos productivos;
- permisos efectivos de cada archivo histórico de Drive, más allá de las llamadas explícitas a `ANYONE_WITH_LINK` en código;
- micrófono, rechazo de permisos, móvil y evaluación humana de Speak LAB;
- Core Web Vitals, Lighthouse, trazas de red y CPU: no estuvo disponible el navegador con protocolo DevTools exigido para una medición dinámica confiable;
- escrituras reales, concurrencia o recuperación en producción; no se realizaron pruebas destructivas.

## 4. Topología y fuentes de verdad

No existe una rama única que contenga todas las líneas de trabajo relevantes:

- PR #85 desciende del release de English LAB, pero no de PR #83;
- PR #83 contiene Memory Match y desciende del release, pero no del hub de PR #85;
- PR #104 de Speak LAB desciende del release y diverge tanto de PR #83 como de PR #85;
- PR #105 de agentes parte de `main`;
- el backend canónico vive fuera de Git y no demuestra qué `/exec` está desplegado.

Esto crea cuatro fuentes de verdad parciales: Git, Drive, la URL desplegada y el conjunto de PR apilados. La consolidación debe crear una cabeza explícita y una matriz de despliegue; no puede resolverse eligiendo “la rama más nueva”.

## 5. Cobertura por rol y menú

La siguiente matriz verifica presencia, enrutamiento y contrato estático. “Presente” no significa validación end-to-end con una sesión real.

| Rol/superficie | Menús o áreas observadas | Resultado de auditoría |
|---|---|---|
| Prospecto / estudiante gratuito | Inicio, Mi curso bloqueado, English LAB, Documentos bloqueado, I CAN bloqueado, Pagos bloqueado, Certificados bloqueado | Presente; el formulario público y la autenticación tienen bloqueos P1/P2. |
| Estudiante matriculado | Perfil, información del programa, resumen académico, calendario, evaluaciones, I CAN, English LAB, syllabus, planeamiento, plan de estudio, cronograma, libros/audios, recursos adicionales, pagos y certificados | Presente en composición estática; faltan endpoints I CAN observados y QA autenticada. |
| Docente | Perfil, grupos, materiales, English LAB Live, exámenes, cronograma del grupo, I CAN, mensajes y panel docente | Presente; hay propietarios duplicados de componentes, modales inconsistentes y cuentas demo sin garantía global de solo lectura. |
| Admin / superadmin | Perfil, dashboard, buscador, calendario, supervisión, English LAB, grupos, estudiantes, matrículas, exámenes, auditoría académica, recursos, inscripción, prematrículas, solicitudes, CONAPE, banco, aplicar pago, reportes, diagnóstico y permisos | Presente. Cinco opciones aparecen deshabilitadas: Finanzas, Docentes, Horas docentes, Club I CAN y Configuración. Un comentario y una prueba cuentan seis, por lo que también existe deriva documental. |
| Ventas | Dashboard, estudiantes/prospectos, grupos disponibles, matrículas del mes, embudo, detalle, documentos, notas, pagos, proformas, becas y cancelación | El guard de sesión es positivo, pero varias mutaciones no envían token y “Ver como asesor” mezcla alcances. |
| Speak LAB | Overlay dinámico para estudiante/docente después de English LAB | Broker bien orientado, pero accesibilidad y QA real pendientes; no es una ruta del router principal. |

## 6. Matriz de hallazgos

| ID | Prioridad | Área | Hallazgo | Estado requerido |
|---|---:|---|---|---|
| SEC-001 | P1 | Autenticación | Contraseñas en texto claro, mínimo de 4 caracteres y sin rate limit observable | Migrar autenticación y rotar credenciales |
| SEC-002 | P1 | Privacidad/archivos | Identificaciones y documentos con `ANYONE_WITH_LINK`; cargas sin límites suficientes | Privar archivos, validar y migrar enlaces |
| SEC-003 | P1 | English LAB Live | Jugadores sin sesión, código de 4 dígitos, suplantación y respuesta correcta expuesta | Rediseñar autorización y estado público |
| SEC-004 | P1 | Demo | Credenciales demo embebidas y solo lectura no aplicada de forma global | Interceptor fail-closed o entorno aislado |
| REL-001 | P1 | Contrato English LAB | 43 de 53 endpoints base del frontend no están en el backend canónico | Backend QA compatible + pruebas de contrato |
| REL-002 | P1 | Ventas | Mutaciones sin token y desacuerdo de rol para activación | Unificar cliente autenticado y matriz de roles |
| SEC-005 | P2 | Formulario público | Enumeración por cédula y exposición de nombre/estado/asesor/WhatsApp | Minimizar respuesta, rate limit y challenge |
| LOG-001 | P2 | Inscripción | Fotos, cupos y becas no forman una transacción; riesgo de huérfanos y carreras | Lock, validación previa y compensación |
| ARCH-001 | P2 | Backend | Monolito de 52,5k líneas, 15 funciones duplicadas y 25 capas de `doPost` | Dispatcher único y modularización |
| ARCH-002 | P2 | Frontend | Múltiples propietarios para Sidebar, Materiales, Grupos y cronograma docente | Propietario canónico por componente |
| PERF-001 | P2 | Rendimiento | Babel runtime, React de desarrollo y JS bloqueante de 4–5 MB | Build productivo y code splitting |
| PERF-002 | P2 | Login | Cuatro imágenes hero precargadas y eager | Solo primera imagen crítica; resto lazy |
| A11Y-001 | P2 | Login | “Recordar sesión” oculto y sin efecto; errores sin relaciones ARIA | Eliminar o implementar; describir errores |
| A11Y-002 | P2 | Modales | Falta semántica, foco, cierre y retorno de foco consistentes | Primitiva modal accesible única |
| A11Y-003 | P2 | English/Speak | Roles list/tab/dialog incompletos y sin teclado/foco completo | Patrón WAI-ARIA y pruebas de teclado |
| TIME-001 | P2 | Fechas | Uso de fecha UTC como “hoy” en al menos 12 archivos | Utilidad única `America/Costa_Rica` |
| CI-001 | P2 | CI/QA | Parser de release obsoleto y una prueba Speak puede dar falso verde | Reemplazar aserciones y endurecer exit codes |
| CONTRACT-001 | P2 | I CAN | Faltan `getICANPortalEstudiante` y `getICANDocenteReservas` observados | Implementar o retirar llamadas |
| CACHE-001 | P2 | Entrega | Versiones de caché divergentes y URL Apps Script repetida | Manifest y configuración únicos |
| OBS-001 | P2 | Operación | Errores tragados y sin trazas correlacionadas | Telemetría, IDs de solicitud y alertas |
| GOV-001 | P2 | Git | 98 ramas y 64 PR abiertos sin tren de integración | Congelar, integrar, cerrar y luego podar |
| HARD-001 | P3 | Navegación admin | Cinco menús deshabilitados y comentario/prueba con conteo obsoleto | Decidir: implementar o retirar |
| CLEAN-001 | P3 | Repositorio | Tres artefactos raíz sin referencia comprobada | Confirmar hosting y archivar/eliminar |
| DEF-001 | P3 | Defensa frontend | Apertura de URLs sin allowlist y HTML de examen sin sanitizador central | `safeOpen` y esquema/sanitización |

## 7. Hallazgos P1 detallados

### SEC-001 — autenticación y contraseñas

**Evidencia.** El backend compara la clave recibida con la columna `clave` en texto claro. La inscripción guarda `body.clave` en PROSPECTOS y luego la migra a usuarios. El frontend de inscripción acepta desde cuatro caracteres. El login recorre hojas y devuelve categorías distintas para cuentas inexistentes, inactivas o con problemas de esquema. No se observó rate limit, demora progresiva, challenge ni bloqueo por intentos.

**Impacto.** Una lectura de hojas o del código de soporte expone credenciales reutilizables. La enumeración y la ausencia de freno facilitan ataques automatizados.

**Corrección.** Migrar a un proveedor de identidad administrado o, como transición estrictamente temporal, usar hashes adaptativos con sal, reset obligatorio, rate limit por cuenta/IP, errores uniformes, MFA para personal y revocación de sesiones. Nunca conservar ni registrar la clave original.

**Cierre.** Ninguna contraseña legible en hojas/código; todas las cuentas migradas o forzadas a reset; pruebas de enumeración y fuerza bruta; sesiones administrativas con MFA.

### SEC-002 — exposición y abuso de archivos

**Evidencia.** La inscripción pública acepta fotos en base64 sin un límite robusto de tamaño/tipo, crea archivos antes de terminar todas las validaciones y aplica `DriveApp.Access.ANYONE_WITH_LINK`. La subida de documentos extra también crea archivos con `ANYONE_WITH_LINK` y no impone en backend un límite suficiente. Los nombres y rutas incluyen documentos personales y académicos.

**Impacto.** Enlaces reenviados o filtrados permiten acceso fuera del Campus. Peticiones públicas grandes pueden consumir almacenamiento y dejar archivos huérfanos cuando la matrícula falla.

**Corrección.** Mantener archivos privados, servirlos mediante un endpoint autenticado de duración corta, verificar firma/magic bytes, MIME, extensión y tamaño en servidor, crear primero un registro temporal, y confirmar/mover solo al completar la transacción. Ejecutar inventario y migración de permisos ya existentes.

**Cierre.** Cero documentos sensibles con enlace público, prueba automática de permisos, límites server-side, antivirus/escaneo cuando corresponda, cuota por sesión y job de huérfanos.

### SEC-003 — English LAB Live sin identidad confiable

**Evidencia.** Las salas usan códigos `LAB-1000` a `LAB-9999`. `englishLabJoinRoom`, `englishLabGetPlayerState`, `englishLabSubmitAnswer`, `englishLabGetLeaderboard` y `englishLabGetQuestionBankMeta` no exigen una sesión de Campus. El cliente puede elegir `player_id` y nombre. Además, el objeto público de sala incluye `CURRENT_QUESTION_JSON` sin sanitizar, donde está `correct`, aunque exista otra representación sanitizada de la pregunta.

**Impacto.** Enumeración de salas, suplantación de estudiantes, envío de respuestas, alteración de ranking y exposición de respuestas/nombres.

**Corrección.** Token de jugador firmado y ligado a sesión/rol/sala, código de sala de alta entropía o invitación de un solo uso, rate limit, autorización en cada operación, ID de estudiante derivado del servidor, y DTO público que nunca incluya solución ni campos docentes.

**Cierre.** Pruebas negativas de sala, rol, propiedad, replay y rate limit; inspección de payload confirma ausencia de respuestas; leaderboard minimizado; rotación de códigos activos.

### SEC-004 — demos sin garantía global de solo lectura

**Evidencia.** El backend canónico contiene credenciales demo embebidas. La sesión generada no conserva de forma universal un atributo `demo/read_only`. Existe un interceptor para un subconjunto de escrituras, pero no una política fail-closed. Por ejemplo, `recalcularNotaFinalOficial` es una escritura autorizada al docente y no está en el conjunto interceptado observado.

**Impacto.** Una cuenta de demostración puede alcanzar una escritura nueva o no inventariada, en particular cuando comparte grupos/códigos con datos reales.

**Corrección.** Preferencia: entorno y datos demo aislados. Alternativa: sesión firmada con `read_only=true` y un único guard anterior al dispatcher que rechace cualquier endpoint no clasificado explícitamente como lectura.

**Cierre.** Matriz completa de endpoints, prueba generativa que toda ruta mutante rechaza demo y eliminación de credenciales literales del código.

### REL-001 — English LAB nuevo no tiene backend canónico compatible

**Evidencia.** La cabeza de PR #85 contiene 53 nombres literales `englishLab*` en el contrato base. El `Code.gs` canónico observado solo contiene diez endpoints legacy: faltan 43 familias de acceso, Hangman, Memory, Quiz, Sentence Order y Word Search.

**Impacto.** PR #85 no puede considerarse desplegable contra ese backend. Los menús pueden renderizar y fallar en el primer uso real.

**Corrección.** Generar una instantánea backend versionada para QA, declarar el contrato en un manifest común, validar petición/respuesta y hacer una prueba end-to-end por juego/rol antes del merge.

**Cierre.** Diferencia de endpoints igual a cero, esquemas compatibles, deployment ID QA registrado y pruebas estudiante/docente pasando.

### REL-002 — escrituras de Ventas incompatibles con el guard canónico

**Evidencia.** En PR #85, `postVentas()` envía el payload sin token. Lo usan `agregarNotaProspecto`, `subirDocumentoExtra`, `marcarEtapaProspecto`, `cobrarMatriculaProspecto`, `activarEstudiante` y `aprobarBecaProspecto`. El backend canónico `_an4406AutorizarPost_` rechaza toda ruta protegida sin `body.token`. Además, el mapa permite `activarEstudiante` únicamente a admin/superadmin, mientras el panel de Ventas expone esa acción y su guard permite rol `ventas`.

El selector “Ver como asesor” carga el dashboard con `scopeAsesor`, pero el calendario mensual y el drawer reciben `usuario.nombre`, no el asesor seleccionado. Esto puede mostrar/operar alcances distintos dentro de la misma pantalla.

**Impacto.** Acciones centrales pueden devolver `sesion_requerida` o `no_autorizado`; supervisores pueden ver un asesor y ejecutar módulos bajo otro nombre.

**Corrección.** Un único cliente `postAuthenticated(fn,payload)` que siempre inyecte token, timeout, parseo seguro y correlación. Definir si Ventas puede activar: o se autoriza con controles de propiedad y auditoría, o se retira el botón. Propagar un solo `scopeAsesor` y derivar identidad real del token en servidor.

**Cierre.** Pruebas de contrato para cada acción y rol, incluidas negativas de propiedad; vista supervisor coherente; sin identidad/autorización confiada desde campos editables del cliente.

## 8. Hallazgos P2 y P3 relevantes

### Inscripción, privacidad y concurrencia

- `verificarCedulaInscripcion`, `verificarCedulaExiste` y `buscarEnPadron` son públicos. Una cédula válida puede revelar nombre, existencia en el sistema, estado y datos del asesor asignado, incluido WhatsApp.
- `crearUsuarioEstudiante` vuelve a recorrer hojas, sube fotos antes de validar completamente grupo/cupo y no engloba fotos, fila, beca y cupo en una transacción.
- No hay un lock global alrededor de duplicidad, capacidad y reserva de beca; dos solicitudes concurrentes pueden exceder cupo o cuota. Un incremento de beca anterior al append puede quedar filtrado si la escritura posterior falla.
- Las respuestas públicas deben limitarse a “puede continuar/no puede continuar”, con rate limit, challenge y auditoría sin PII.

### Backend y arquitectura

- El `Code.gs` canónico contiene 1.894 nombres de función de nivel superior y 15 nombres duplicados; la mayoría se concentra en CONAPE. En JavaScript/Apps Script prevalece la última declaración, por lo que el orden cambia comportamiento.
- Hay cuatro etapas nombradas de `doPost` y 25 reasignaciones posteriores `doPost = function…`. Cada nueva capa puede envolver o omitir otra y vuelve frágil la seguridad por orden de carga.
- Puntos positivos: el token bruto se devuelve una sola vez; se guarda hash SHA-256 con pepper; la expiración fija es de ocho horas; el frontend usa `sessionStorage`; el mapa POST reciente es fail-closed para rutas no declaradas y valida roles/propiedad en varias áreas.
- La validación de sesión y el login recorren hojas; la hoja de sesiones crece sin una estrategia visible de poda/índice. Debe medirse y migrarse a acceso indexado.

### Fechas

Se encontró `new Date().toISOString().slice(0,10)` usado como fecha de negocio en al menos doce archivos, entre ellos becas, vistas docente/estudiante/admin y cronogramas. Costa Rica es UTC-6: después de las 18:00 locales, el día UTC ya puede ser el siguiente. Debe existir una utilidad única de fecha CR o una fecha autoritativa del servidor.

### Accesibilidad

- Login: el checkbox “Recordar sesión” tiene `display:none`, no puede recibir foco y su estado no se usa. Es un control engañoso; debe implementarse con una política segura o retirarse.
- Login: usuario/clave tienen etiqueta, pero los errores no se relacionan de forma consistente mediante `aria-describedby`/`aria-invalid`; el formulario no tiene nombre accesible.
- Los modales de login, Ventas, becas, matrículas, exámenes, cronogramas y estudiantes no comparten semántica `dialog`, `aria-modal`, foco inicial, trap, Escape y retorno de foco. Algunos componentes nuevos sí lo hacen, lo que confirma la inconsistencia.
- El drawer de Ventas usa `role=dialog`, pero no declara `aria-modal`, no contiene el foco y varios botones de icono no tienen nombre accesible.
- English LAB pone `role=listitem` directamente en botones y sobrescribe su semántica nativa. Las tabs no completan `aria-controls`, `tabpanel`, roving tabindex ni flechas.
- Speak LAB escucha Escape, pero no mueve/retiene/devuelve foco, no vuelve inerte el fondo y no declara diálogo/modal con nombre accesible.

### Defensa en profundidad

- `dangerouslySetInnerHTML` renderiza `q.html`/`q.prompt` en exámenes. La fuente vigente observada es estática, por lo que no se declara un XSS explotable; antes de aceptar contenido remoto debe existir esquema estricto y sanitización central.
- Varias URLs de Drive/backend se abren con `window.open` sin una allowlist común de esquema y dominio. Crear `safeOpen` limitado a HTTPS y orígenes aprobados.
- No hay una política CSP visible en el repositorio; los headers del hosting no pudieron verificarse. Debe medirse, no suponerse.

### Limpieza

Tres artefactos raíz no tienen referencia comprobada en el grafo de entrega: `Campus Virtual - Academia Norteamericana.html` (aprox. 1,98 MB), `campus_bundled_src.html` e `image-slot.js`. Son candidatos a archivar/eliminar únicamente después de confirmar hosting, enlaces externos e historial necesario.

## 9. Rendimiento: auditoría estática

No se reportan LCP, CLS, INP, TBT ni un puntaje Lighthouse porque no hubo una traza DevTools válida. Las cifras siguientes son peso y bloqueo potencial del código descargado.

| Entrada en PR #85 | Scripts | JS referenciado | JSX/Babel en runtime | CSS local |
|---|---:|---:|---:|---:|
| `campus.html` | 104 | 5.062.640 bytes | 42 scripts | 324.528 bytes |
| `login.html` | 6 | 4.402.493 bytes | 2 scripts | 10.918 bytes |
| `ventas.html` | 14 | 4.586.640 bytes | 9 scripts | 53.788 bytes |
| `inscripcion.html` | 5 | 4.398.369 bytes | 1 script | 37.969 bytes |
| `recovery.html` | 5 | 4.379.038 bytes | 2 scripts | no relevante |

Los vendors explican gran parte del peso: Babel standalone 3.137.752 bytes, ReactDOM de desarrollo 1.080.227 bytes y React de desarrollo 109.931 bytes. Los scripts principales no usan `async`, `defer` o módulos. En el login público la consola advierte Babel en producción y React registra un prop `fetchPriority` no reconocido. Las cuatro imágenes hero se precargan y usan `loading=eager` (aprox. 858.897 bytes en conjunto).

Plan técnico:

1. compilar con Vite/esbuild u otra cadena reproducible;
2. usar React/ReactDOM de producción y JSX precompilado;
3. dividir por rol y ruta, con imports dinámicos y presupuesto por entrada;
4. mantener un manifest único de assets/endpoints/versiones;
5. precargar solo la primera imagen visible y diferir las demás;
6. agregar RUM/Core Web Vitals y trazas en staging antes y después.

## 10. Pruebas, CI y observabilidad

### Resultados estáticos

- `main`: entrega pasa; revisión estática “APTO CON RESERVAS”, P0=0, P1=0, P2=6, P3=2.
- PR #85: entrega pasa; se observaron 122 recursos estáticos, 65 diferidos, 19 CSS alcanzables y 67 endpoints; revisión estática P0=0, P1=0, P2=7, P3=2.
- La revisión de propietarios detecta cuatro componentes con múltiples dueños: Sidebar, MaterialesView, GruposView y `CronogramaDocenteSeguroF82`.
- La cache versiona de forma distinta `academia_play.jsx`, `cronograma_todos.jsx` y `cronograma_grupo.jsx`.
- La URL de Apps Script se repite en trece archivos de entrega; esto facilita publicar clientes contra despliegues distintos.

### Defectos de CI

- El parser de `release/english-lab-final-qa` exige exactamente doce dependencias CS21A193, mientras el manifest actual contiene 25. Produce fallas falsas. PR #85 corrige el criterio a rutas base ordenadas, únicas y con versión CS21A.
- En una ejecución de la integración DOM de Speak se imprimió `PASS` y luego apareció un `TypeError` de jsdom tras cerrar la ventana, manteniendo exit code 0. En otra ejecución local faltó jsdom y el test salió 1. El job debe fallar por cualquier excepción no manejada y declarar/installar dependencias de forma reproducible.
- PR #104 reconoce pendientes de despliegue QA de Worker, configuración, prueba autenticada docente/estudiante, denegación de micrófono, móvil y revisión humana. No debe marcarse listo para producción antes de completar esa matriz.

### Observabilidad mínima requerida

- ID de correlación de frontend a Apps Script/Worker;
- evento estructurado por endpoint, rol, latencia, resultado y versión, sin PII ni tokens;
- métricas de errores, timeouts, sesiones inválidas, cargas rechazadas y rate limits;
- alertas por regresión de auth, permisos públicos, contrato de endpoints y tamaño de bundle;
- panel de release que muestre Git SHA, deployment ID, versión backend y hora.

## 11. Plan de consolidación recomendado

### Fase 0 — congelar y preservar

1. Congelar nuevas ramas de funciones mientras dura la integración.
2. Etiquetar los SHAs auditados y registrar el deployment ID actual antes de tocar Apps Script.
3. Exportar una instantánea privada y verificable del backend, sin secretos ni credenciales demo en Git.

### Fase 1 — seguridad y contrato

1. Corregir SEC-001 a SEC-004 y REL-002 antes de incorporar más juegos.
2. Construir un manifest de endpoints y esquemas compartido por frontend/backend.
3. Preparar un backend QA que implemente exactamente el contrato del hub.
4. Migrar permisos de documentos ya creados y ejecutar un reporte de exposición.

### Fase 2 — rama de integración única

1. Crear la rama de integración desde la cabeza de PR #85, porque contiene el shell unificado y el parser de entrega corregido.
2. Integrar explícitamente PR #83 (Memory Match), resolviendo conflictos contra el hub; no asumir que está contenido.
3. Integrar PR #104 (Speak LAB) detrás de feature flag y apuntando solo al Worker QA.
4. Integrar PR #105 (agentes) como controles de proceso.
5. Incorporar el backend QA versionado y la matriz de despliegue; nunca sobrescribir producción como efecto colateral del merge.

### Fase 3 — depurar y peinar

1. Elegir propietario canónico de cada componente y retirar wrappers/proxies supersedidos con pruebas de equivalencia.
2. Reemplazar las 25 capas de router por un dispatcher único y módulos por dominio.
3. Unificar fecha CR, cliente API, manejo de errores, modales, apertura de URLs y cache busting.
4. Introducir build productivo y presupuestos de bundle.

### Fase 4 — gates de aceptación

Debe pasar, como mínimo:

- contrato de endpoints cero-diff;
- pruebas negativas de auth/rol/propiedad/demo;
- escaneo de permisos de Drive y cargas;
- journeys reales de prospecto, estudiante, docente, ventas, admin y superadmin;
- English LAB por juego y Speak con micrófono permitido/denegado;
- teclado, lector de pantalla básico, 200% zoom y móvil;
- trazas de rendimiento antes/después y presupuesto aprobado;
- rollback probado y deployment IDs documentados.

### Fase 5 — publicar y cerrar la pila

1. Abrir un único PR de integración a `main` con matriz de evidencia.
2. Desplegar primero a QA, luego a un canary controlado y finalmente a producción.
3. Verificar producción sin escrituras destructivas.
4. Cerrar PR supersedidos solo después de que su contenido esté incorporado o descartado explícitamente.
5. Ejecutar la poda de ramas en una operación separada y aprobada.

## 12. Candidatos de ramas para limpieza

**Esta sección no autoriza ni ejecuta borrados.** Antes de eliminar cada rama se debe verificar PR dependiente, base de PR, SHA de reemplazo, tag/backup y ausencia de contenido único.

### A. Duplicados exactos confirmados

| Grupo | Evidencia | Recomendación posterior |
|---|---|---|
| `release/english-lab-final-qa` y `release/english-lab-4games-close` | mismo commit y árbol `6379739f502c820e52d32f2ebae84c20c4ae078c` | conservar un solo nombre canónico y retirar el otro tras retarget de PR |
| `feature/cs21a173-memory-match-engine`, `feature/cs21a174-memory-match-live-adapter`, `feature/cs21a174-memory-match-live-backend` | mismo commit y árbol `65d4d16ece526b98dc6b5c51a07ef74e832676dd` | conservar la rama usada por el PR superviviente y retirar las otras dos |

### B. Cabezas de PR ya fusionados a `main`

Son candidatos fuertes después de comprobar que ningún PR abierto las usa como base:

- `agent/cs21a127-student-resources-visual` (#10)
- `agent/cs21a128-bump-guard-cache` (#11)
- `agent/cs21a129-student-lesson-pdfs` (#12)
- `agent/cs21a130-student-planning-pdfs` (#13)
- `agent/cs21a131-delivery-stabilization-audit` (#14)
- `agent/cs21a132-restore-student-background` (#15)
- `agent/cs21a133-teacher-groups-stabilization` (#16)
- `agent/cs21a134-teacher-book-units` (#17)
- `agent/cs21a135-book-navigation` (#18)
- `agent/cs21a136-book-toolbar` (#19)
- `agent/cs21a137-virtual-review-team` (#20)
- `agent/cs21a138-real-qa-staging` (#22)
- `agent/estudiantes-ultimo-desembolso-conape` (#23)
- `agent/proyeccion-manual-estudiantes` (#24)
- `agent/planeamiento-2x16-cs21a140` (#25)
- `agent/cs21a142-teacher-book-unit` (#26)

### C. Revisión manual antes de decidir

- `refactor/cs21a146-runtime-config` frente a su variante `-clean`;
- `agent/cs21a143-doc-operativa-20260725`;
- ramas QA antiguas `qa/cs21a120…cs21a126`;
- `cs21a96-trigger`;
- cualquier rama cerrada sin merge.

### D. No borrar todavía

- `v4.38-seguridad` y `backup-v4.37-antes-seguridad`, hasta demostrar preservación de todo el contenido de seguridad y definir política de tags/archivo;
- cabezas de PR #83, #85, #104 y #105;
- cualquier rama que participe del tren de integración o sea base de un PR abierto;
- la rama de esta auditoría hasta incorporar el informe.

## 13. Orden de trabajo recomendado

| Orden | Entrega | Gate de salida |
|---:|---|---|
| 1 | Autenticación, archivos privados, English LAB Live y demo fail-closed | SEC-001…004 cerrados |
| 2 | Contrato backend de English LAB y Ventas | REL-001/002 y CONTRACT-001 cerrados |
| 3 | Integración PR #85 + #83 + #104 + #105 | rama única, CI verde, sin endpoints faltantes |
| 4 | Build productivo, observabilidad, fechas y accesibilidad | presupuestos y matriz A11Y aprobados |
| 5 | QA por rol y canary | evidencia real y rollback probado |
| 6 | Merge a `main`, cierre de PR y poda | producción verificada y aprobación específica de borrado |

## 14. Dictamen final

La auditoría está completa para el alcance accesible: repositorio, ramas/PR, frontend por rol, backend canónico de Drive, superficie pública, contratos, seguridad, privacidad, lógica, accesibilidad, rendimiento estático, CI y gobierno Git.

El proyecto **no está listo para consolidación final ni publicación**. Sí está listo para iniciar una remediación controlada con prioridades claras. La primera entrega debe cerrar los seis P1, crear la rama de integración única y demostrar un backend QA compatible. La limpieza de ramas debe ocurrir al final, nunca antes de preservar y verificar el contenido incorporado.
