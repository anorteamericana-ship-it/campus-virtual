# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A66  
**Backend canónico instalado:** F98.4-Z6-CS21A64  
**Backend candidato completo:** F98.4-Z6-CS21A66  
**Base preservada:** CS21A65 / CS21A64 / CS21A63 / CS21A62 / CS21A61 / CS21A60  
**Producción:** no verificada  
**Corte:** 12-jul-2026

## Cambio vigente CS21A66

English LAB Gratis para usuarios de prematrícula deja de depender del rol genérico `student` o del estado comercial de una solicitud.

La fuente única de autorización es:

`PROSPECTOS.INICIO_GRATUITO_AUTORIZADO`

Valores reconocidos como autorización positiva: `SI`, `TRUE`, `1`, `APROBADO`, `APROBADA`, `AUTORIZADO`, `AUTORIZADA`, `HABILITADO` o `HABILITADA`.

### Resultado

- Prospecto con autorización positiva: ve `English LAB · Gratis`, puede abrir el módulo y usar sus endpoints.
- Prospecto sin autorización: conserva el Campus de prematrícula y sus gestiones, pero no ve el acceso.
- Ruta directa sin autorización: muestra `English LAB Gratis pendiente de aprobación`.
- API directa sin autorización: devuelve `english_lab_gratis_no_autorizado`.
- Estudiantes matriculados, docentes, admin y superadmin conservan su acceso habitual.

El estado `CONVERTIDA` de `SOLICITUDES_USUARIO_GRATIS` sigue siendo comercial y no concede por sí solo acceso académico.

## Backend candidato CS21A66

Añade:

- Endpoint `freeUserEnglishLabAccess`.
- Verificación fresca por cédula contra `PROSPECTOS`.
- Cache de lectura de 60 segundos.
- Enriquecimiento de `iniciarSesion` con el estado de acceso gratuito.
- Enriquecimiento de `freeUserMiPerfil` para que el panel de prematrícula muestre correctamente `Entrar a English LAB` o `esperando aprobación`.
- Protección central de `_aplayAuth_` para impedir accesos por URL o llamadas manuales.

Integridad del archivo candidato:

- Archivo local: `Code_F98_4_Z6_CS21A66_COMPLETO.gs`.
- Tamaño: `2.934.064` bytes.
- Saltos de línea: `51.625`.
- SHA-256: `2622098888eb4c408916b084b19b75ef27a61935810d4bcb1d386686a42c20fa`.
- Sintaxis: validada con `node --check`.

El backend canónico de Drive continúa en CS21A64 hasta reemplazar completamente `Code.gs` y publicar una nueva implementación.

## Frontend CS21A66

Archivo nuevo:

- `src/english_lab_free_access_cs21a66.js`.

Comportamiento:

- Consulta `freeUserEnglishLabAccess` para usuarios de prematrícula.
- Oculta el botón `English LAB` mientras verifica o cuando el acceso no está autorizado.
- Envuelve `AcademiaPlayView` para mostrar un mensaje institucional en accesos directos no autorizados.
- No altera el acceso de estudiantes matriculados ni del personal.

`campus.html` carga CS21A66 antes de `lazy_loader.jsx` y `app.jsx`.

## Cambios preservados CS21A65

- Recursos Didácticos consolidado como `Libros y Audios`.
- Menú sin duplicados.
- Docente: SB/TB/WB, audios y Diccionario; sin edición.
- Estudiante: SB/WB, audios y recursos del nivel; sin TB.
- Superadmin: único rol con calibración y actualización.
- Nombres visibles de audio limpios.

## Prueba inmediata

1. Instalar el `Code.gs` completo CS21A66 y publicar una nueva implementación.
2. Actualizar frontend y hacer Ctrl+F5.
3. Ingresar con una prematrícula cuyo campo `INICIO_GRATUITO_AUTORIZADO` sea `SI`: debe aparecer `English LAB · Gratis` y abrir normalmente.
4. Probar una prematrícula sin autorización: el menú no debe mostrar English LAB.
5. Intentar abrir `#academia_play` con la prematrícula no autorizada: debe aparecer el mensaje de aprobación pendiente.
6. Confirmar que el backend rechaza catálogo, juego, progreso y completados con `english_lab_gratis_no_autorizado`.
7. Confirmar que un estudiante matriculado, docente, admin y superadmin mantienen acceso.

## Reglas preservadas

- Nunca mover pagos entre niveles o intentos.
- No tocar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear automatizaciones nuevas de CONAPE.
- No declarar producción verificada sin ejecutar las pruebas anteriores.
