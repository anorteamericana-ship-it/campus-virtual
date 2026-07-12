# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral:** F98.4-Z6-CS21A72  
**Frontend vigente en GitHub:** F98.4-Z6-CS21A71  
**Backend fuente canónica en Drive:** F98.4-Z6-CS21A72  
**Backend Apps Script publicado:** no verificado  
**Base preservada:** CS21A71 / CS21A70 / CS21A69 / CS21A68 / CS21A67 / CS21A66 / CS21A65  
**Producción:** no verificada  
**Corte:** 12-jul-2026

## Cambio vigente CS21A72 — Vista estudiante para la máscara de Keylor

El backend canónico agrega tres perfiles estudiantiles de demostración asociados al grupo demo `0626` de Keylor:

- Mariana Solano Vargas — `AN0626-01`.
- Sebastián Calderón Mora — `AN0626-02`.
- Valeria Jiménez Arias — `AN0626-03`.

Los alias de acceso y la credencial compartida permanecen únicamente en el backend canónico. No se publican en esta documentación porque el repositorio es público.

### Comportamiento

- El login genera una sesión normal con rol `student`.
- Cada cuenta queda ligada a su propio código demo.
- La validación de propiedad impide consultar el expediente de otra cuenta.
- La ficha, niveles, grupo, asistencia, ausencias, evaluaciones, retroalimentación y Club I CAN se construyen desde la máscara de Keylor.
- No se crean filas en `DATOS`, `ESTATUS` ni `USUARIOS`.
- Los perfiles se identifican como `demo` y `read_only`.
- Se bloquean cambios de datos personales, fotografía y reportes de pago.
- No se modifican pagos, certificados, CONAPE, calendario ni expedientes reales.

### Archivos

No hubo cambios de frontend. El login existente ya envía `iniciarSesion({usuario, clave})` y acepta estos alias sin modificaciones visuales.

Backend canónico:

- Archivo Drive: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Nombre: `Code.gs`.
- Tamaño: `2.949.066` bytes.
- SHA-256: `99474bf03419c615e3ec070d3ba8117bfd4afecf9c9c9e1185309ac9cbf6bf2e`.

Guardar el archivo en Drive no equivale a publicarlo en Apps Script. Debe copiarse al proyecto, crear una nueva versión del despliegue y probarse antes de declarar producción verificada.

## Cambio preservado CS21A71 — Prematrícula activa y English LAB

### Menú lateral estable

La prematrícula ya no pasa por el normalizador académico de Recursos Didácticos. CS21A71 envuelve el Sidebar antes de montar `App` y, cuando la sesión corresponde a una prematrícula sin código, renderiza directamente el menú original de prematrícula.

Resultado esperado:

- El panel izquierdo aparece una sola vez.
- No aparecen temporalmente Libros y Audios, Recursos adicionales ni módulos académicos.
- English LAB mantiene una posición estable.
- Los botones bloqueados de la prematrícula permanecen sin cambios.

Archivo responsable:

- `src/prematricula_english_lab_ui_cs21a71.js`.

Carga desde:

- `src/resources_panel_state_cs21a65.js`, cuyo contenido vigente es CS21A71.

### Verificación de English LAB

`src/english_lab_free_access_cs21a66.js` conserva su ruta histórica, pero su contenido vigente es CS21A71.

- No existe revalidación por `focus`.
- No se revisa nuevamente al tocar o navegar por la pantalla.
- El resultado se conserva 30 minutos dentro de la misma sesión.
- Los campos de autorización incluidos en la sesión se usan inmediatamente.
- Durante la única revisión inicial, el botón permanece visible pero bloqueado.
- Una falla temporal de red no tapa English LAB cuando el acceso ya estaba autorizado.
- Solo `an:session-changed` o una nueva solicitud de prematrícula pueden iniciar otra revisión legítima.

`src/prospect_free_student.jsx` usa la misma decisión global que la opción lateral y la compuerta. El estado comercial de la solicitud no sustituye `INICIO_GRATUITO_AUTORIZADO`.

### Visual de English LAB

Para una prematrícula sin código se ocultan únicamente:

- Mapa de progreso.
- Banco curricular.
- Áreas cognitivas demo.

Se conserva el resto del contenido y el título `Catálogo demo`.

Cuando la sesión ya tiene un código de estudiante:

- El código tiene prioridad sobre cualquier marca antigua de prematrícula.
- La sesión deja de tratarse como usuario gratis.
- El catálogo cambia al nivel académico correspondiente.
- Debajo aparecen Mapa de progreso, Banco curricular y Áreas cognitivas.

## Prueba obligatoria CS21A72

1. Copiar el `Code.gs` canónico al proyecto Apps Script.
2. Guardar y crear una nueva versión del despliegue web.
3. Cerrar cualquier sesión anterior y hacer `Ctrl + F5` en `login.html`.
4. Probar individualmente los tres alias demo con la credencial definida por el propietario.
5. Confirmar nombre, código, grupo `0626`, nivel `I1` y docente Keylor.
6. Abrir asistencia, notas, retroalimentación, cronograma y Club I CAN.
7. Intentar consultar otro código y confirmar `no_autorizado`.
8. Intentar editar datos o reportar un pago y confirmar `demo_read_only`.
9. Probar un estudiante real y un docente real para confirmar que no cambió su flujo.

## Cambios preservados

- CS21A70: Panel Maestro CONAPE buscable y contexto de desembolsos 01/02/03.
- CS21A69: selección azul única del menú lateral.
- CS21A68: Recursos adicionales como panel independiente.
- CS21A67: árbol de Recursos adicionales y carga sin biblioteca anterior.
- Libros y Audios, audios, PDF, zoom, paso de hoja y U01–U16.

## Reglas preservadas

- Nunca mover pagos entre niveles o intentos.
- No modificar pagos, certificados, CONAPE, calendario, `DATOS` ni `ESTATUS` con cuentas demo.
- No crear automatizaciones ni triggers nuevos de CONAPE.
- No declarar producción verificada sin realizar la prueba anterior.
