# FUENTE VERDADERA — F98.4-Z6-CS21A66

Estado canónico: frontend CS21A66 guardado en GitHub `main`; backend canónico instalado CS21A64 preservado en Drive; backend completo candidato CS21A66 generado y validado; producción no verificada.

## Cambio CS21A66 — autorización real de English LAB Gratis

Los usuarios de prematrícula ya no reciben acceso a English LAB por el solo hecho de tener rol `student`.

La fuente única de permiso es:

`PROSPECTOS.INICIO_GRATUITO_AUTORIZADO`

El estado de `SOLICITUDES_USUARIO_GRATIS` es seguimiento comercial. Valores como `CONVERTIDA`, `RESPONDIDA` o `EN_GESTION` no reemplazan la autorización explícita de PROSPECTOS.

### Regla por perfil

- Prospecto sin código académico y autorización positiva: English LAB Gratis habilitado.
- Prospecto sin autorización: Campus de espera disponible, English LAB oculto y bloqueado.
- Estudiante con código académico: acceso habitual preservado.
- Docente, admin y superadmin: acceso habitual preservado.

### Defensa en profundidad

Frontend:

- `src/english_lab_free_access_cs21a66.js` consulta el endpoint de autorización.
- El botón `English LAB` se oculta mientras la consulta está pendiente o si el acceso fue rechazado.
- La ruta directa renderiza un mensaje institucional de aprobación pendiente.

Backend candidato:

- `freeUserEnglishLabAccess` consulta PROSPECTOS por la cédula de la sesión.
- `_aplayAuth_` rechaza catálogo, juego, progreso y completados para una prematrícula no autorizada.
- `iniciarSesion` devuelve el estado explícito de English LAB Gratis.
- `freeUserMiPerfil` adapta el panel de espera para mostrar `Entrar a English LAB` únicamente cuando la autorización real está activa.

## Integridad backend candidato CS21A66

- Archivo: `Code_F98_4_Z6_CS21A66_COMPLETO.gs`.
- Tamaño: `2.934.064` bytes.
- Saltos de línea: `51.625`.
- SHA-256: `2622098888eb4c408916b084b19b75ef27a61935810d4bcb1d386686a42c20fa`.
- Sintaxis: validada mediante copia JavaScript y `node --check`.

El archivo canónico de Drive continúa siendo CS21A64 hasta realizar reemplazo completo de `Code.gs` y publicar una nueva implementación.

## Frontend vigente

- `src/english_lab_free_access_cs21a66.js` — autorización y mensaje de bloqueo.
- `src/resources_panel_cs21a65.jsx` — Recursos Didácticos unificados.
- `src/book_inline_audio_cs21a63.js` — contenido vigente CS21A65 para audio y recursos.
- `src/book_unit_propagation_cs21a64.js` — calibración propagada.
- `src/book_page_turn_cs21a62.js` — paso de hoja.
- `campus.html` — carga CS21A66 antes del router.

## Cambios preservados CS21A65

- Una sola sección `Recursos Didácticos`.
- `Libros y Audios` como acceso consolidado.
- Docente sin controles administrativos.
- Estudiante sin TB.
- Recursos adicionales oficiales por nivel.
- Docente con Diccionario.
- Etiquetas de audio sin prefijos técnicos ni número de página.

## Reglas preservadas

- No mover pagos entre niveles o intentos.
- No modificar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear triggers nuevos de CONAPE.
- Guardado en GitHub no significa desplegado ni probado en producción.
